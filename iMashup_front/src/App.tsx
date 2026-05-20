import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import { message } from 'antd';
import { toJpeg } from 'html-to-image';
import JSZip from 'jszip';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './nodes';
import { edgeTypes } from './edges';
import { InitialNodes } from './nodes/index';
import { initialEdges } from './edges/index';
import { AppNode } from './nodes/types';
import eventBus from './nodes/eventBus.ts';
import { PositionLoggerNode } from './nodes/types.ts';
import { eventAddNode } from './common.ts';
import { baseURL } from './common.ts';
import axios from 'axios';

import Message from './components/Message/Message';
import LoginModal from './components/Login/LoginModal';
import TopLeftToolbar from './components/Toolbar/TopLeftToolbar';
import TopCenterStatus from './components/Toolbar/TopCenterStatus';
import TopRightToolbar from './components/Toolbar/TopRightToolbar';
import RunDrawer from './components/RunPanel/RunPanel';
import UserPanel from './components/User/UserPanel';
import ImportModal from './components/FlowIO/ImportModal';
import ExportModal from './components/FlowIO/ExportModal';

axios.defaults.withCredentials = true;

const flowKey = 'example-flow';
const exportHistoryKeyPrefix = 'workflow_export_history';
const getNodeId = () => `randomnode_${Date.now()}`;

type AiFlow = {
  nodes: any[];
  edges: any[];
};

const getExportHistoryKey = (user: string) => {
  return user
    ? `${exportHistoryKeyPrefix}_${user}`
    : `${exportHistoryKeyPrefix}_guest`;
};

type EdgeObjType = {
  randomId: string;
  edgeId: string;
  source: string;
  target: string;
};

const SaveRestore = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>(InitialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>(initialEdges);

  const { getNodes, getEdges, setViewport, toObject, fitView } = useReactFlow();

  const [open, setOpen] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [userPanelOpen, setUserPanelOpen] = useState(false);

  const flowCaptureRef = useRef<HTMLDivElement | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpen2, setIsModalOpen2] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const [messageApi, contextHolder] = message.useMessage();

  const [nodeCount, setNodeCount] = useState(1);
  const nodeCountRef = useRef(nodeCount);

  const [currentUser, setCurrentUser] = useState(
    () => localStorage.getItem('userPhone') || ''
  );

  useEffect(() => {
    nodeCountRef.current = nodeCount;
  }, [nodeCount]);

  const syncFlowData = useCallback((nextNodes: any[], nextEdges: any[]) => {
    eventBus.emit('dataUpdated', {
      nodes: nextNodes,
      edges: nextEdges,
    });
  }, []);

  useEffect(() => {
    const handleAiFlowGenerated = (aiFlow: AiFlow) => {
      if (aiFlow?.nodes && aiFlow?.edges) {
        setNodes(aiFlow.nodes);
        setEdges(aiFlow.edges);
        syncFlowData(aiFlow.nodes, aiFlow.edges);
        message.success('AI 工作流生成完成');
      }
    };

    eventBus.on('aiFlowGenerated', handleAiFlowGenerated);
    return () => {
      eventBus.off('aiFlowGenerated', handleAiFlowGenerated);
    };
  }, [setNodes, setEdges, syncFlowData]);

  const applyFlowToCanvas = useCallback(
    (flowData: { nodes: any[]; edges: any[] }) => {
      setNodes(flowData.nodes);
      setEdges(flowData.edges);
      syncFlowData(flowData.nodes, flowData.edges);
    },
    [setNodes, setEdges, syncFlowData]
  );

  // 处理AI生成的流程图
  const handleAiFlowUpdate = useCallback(
    (aiFlow: AiFlow) => {
      if (aiFlow?.nodes && aiFlow?.edges) {
        applyFlowToCanvas(aiFlow);
      }
    },
    [applyFlowToCanvas]
  );

  const captureFlowPreview = useCallback(async () => {
    if (!flowCaptureRef.current) return '';

    try {
      const dataUrl = await toJpeg(flowCaptureRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#f7f9fc',
        cacheBust: false,
        filter: (node) => {
          if (!(node instanceof HTMLElement)) return true;

          if (
            node.classList.contains('react-flow__controls') ||
            node.classList.contains('react-flow__minimap') ||
            node.classList.contains('react-flow__attribution')
          ) {
            return false;
          }

          return true;
        },
      });

      return dataUrl;
    } catch (error) {
      console.error('生成预览图失败：', error);
      return '';
    }
  }, []);



  const onConnect = useCallback(
    (connection: any) => {
      const edge = { ...connection, type: 'custom-edge' };
      const nextEdges = addEdge(edge, getEdges());
      setEdges(nextEdges);
      syncFlowData(getNodes(), nextEdges);
    },
    [getEdges, getNodes, setEdges, syncFlowData]
  );

  const onSave = useCallback(() => {
    const flow = toObject();
    localStorage.setItem(flowKey, JSON.stringify(flow));
    messageApi.open({
      type: 'success',
      content: '保存节点状态成功',
      duration: 2,
    });
  }, [toObject, messageApi]);

  const onRestore = useCallback(() => {
    const restoreFlow = async () => {
      const flow = JSON.parse(localStorage.getItem(flowKey) ?? '{}');
      if (flow) {
        const { x = 0, y = 0, zoom = 1 } = flow.viewport || {};
        const restoredNodes = flow.nodes || [];
        const restoredEdges = flow.edges || [];

        setNodes(restoredNodes);
        setEdges(restoredEdges);
        setViewport({ x, y, zoom });
        syncFlowData(restoredNodes, restoredEdges);
      }
    };

    restoreFlow();
    messageApi.open({
      type: 'success',
      content: '已撤回节点状态',
      duration: 2,
    });
  }, [setNodes, setEdges, setViewport, messageApi, syncFlowData]);

  const onAdd = useCallback(
    (edgeObj: EdgeObjType) => {
      const { randomId, edgeId, source, target } = edgeObj;

      const baseNewNode: PositionLoggerNode = {
        id: randomId,
        data: {
          label: `API${nodeCountRef.current}`,
          inputs: [
            {
              key: '0',
              name: 'input',
              type: 'string',
              text: '',
              isFold: true,
              value: {
                name: '',
                type: 'string',
                input: '',
                text: '',
                urlValueName: '',
              },
            },
          ],
          outputs: [
            {
              key: '0',
              name: 'output',
              isFold: true,
              text: '',
              type: 'string',
            },
          ],
          urlLine: '',
          requestUrl: '',
          method: 'POST',
        },
        type: 'position-logger',
        position: {
          x: (Math.random() - 0.5) * 400,
          y: (Math.random() - 0.5) * 400,
        },
      };

      const currentNodes = getNodes();
      const currentEdges = getEdges();

      if (source && target) {
        const sourceNode = currentNodes.find((node) => node.id === source);
        const targetNode = currentNodes.find((node) => node.id === target);

        if (!sourceNode || !targetNode) {
          message.error('未找到源节点或目标节点');
          return;
        }

        const centerNode = {
          ...baseNewNode,
          position: {
            x: (sourceNode.position.x + targetNode.position.x) / 2,
            y: (sourceNode.position.y + targetNode.position.y) / 2,
          },
        };

        const filteredEdges = currentEdges.filter((edge) => edge.id !== edgeId);

        const left = {
          id: `edgesL_${Date.now()}`,
          type: 'custom-edge',
          source,
          target: randomId,
        };

        const right = {
          id: `edgesR_${Date.now() + 1}`,
          type: 'custom-edge',
          source: randomId,
          target,
        };

        const nextNodes = [...currentNodes, centerNode].map((node) => {
          if (node.id === randomId) return node;

          if (node.position.x < centerNode.position.x) {
            return {
              ...node,
              position: {
                x: node.position.x - 200,
                y: node.position.y,
              },
            };
          }

          return {
            ...node,
            position: {
              x: node.position.x + 200,
              y: node.position.y,
            },
          };
        });

        const nextEdges = [...filteredEdges, left, right];

        setNodes(nextNodes);
        setEdges(nextEdges);
        syncFlowData(nextNodes, nextEdges);
      } else {
        const nextNodes = [...currentNodes, baseNewNode];
        setNodes(nextNodes);
        syncFlowData(nextNodes, currentEdges);
      }

      setNodeCount((prevCount) => prevCount + 1);
    },
    [getNodes, getEdges, setNodes, setEdges, syncFlowData]
  );

  useEffect(() => {
    const handleAddNode = (edgeObj: EdgeObjType) => onAdd(edgeObj);
    eventAddNode.on('addNode', handleAddNode);

    return () => {
      eventAddNode.off('addNode', handleAddNode);
    };
  }, [onAdd]);

  const onExecute = async () => {
    const edgesAndNodes = {
      nodes: getNodes(),
      edges: getEdges(),
    };

    try {
      messageApi.open({
        type: 'loading',
        content: '运行中...',
        duration: 0,
      });

      const res: { code: number; data: AppNode[] } = await axios.post(
        `${baseURL}/url`,
        edgesAndNodes,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      setNodes(res.data);
      syncFlowData(res.data, getEdges());
      message.success('执行成功');
      setTimeout(messageApi.destroy, 1000);
    } catch (error) {
      messageApi.open({
        type: 'error',
        content: '执行失败',
      });

      if (axios.isAxiosError(error)) {
        console.error('Axios error:', error.response?.data || error.message);
      } else {
        console.error('Unexpected error:', error);
      }

      setTimeout(messageApi.destroy, 1000);
    }
  };

  const updateItem = useCallback(
    (key: string, value: string) => {
      const currentEdges = getEdges();

      setNodes((prevNodes) => {
        const nextNodes = prevNodes.map((node: any) => {
          if (node.id !== 'a') return node;

          return {
            ...node,
            data: {
              ...node.data,
              inputs: (node.data?.inputs || []).map((item: any) =>
                item.key === key ? { ...item, text: value } : item
              ),
            },
          };
        });

        syncFlowData(nextNodes, currentEdges);
        return nextNodes;
      });
    },
    [getEdges, setNodes, syncFlowData]
  );

  const getHeight = useCallback((text: string | undefined) => {
    return text ? 22 + (22 * text.length) / 25 : 20;
  }, []);

  const onClose = () => {
    setOpen(false);
  };

  const handleImportJson = async () => {
    if (!importFile) {
      messageApi.error('请先选择文件');
      return;
    }

    try {
      const text = await importFile.text();
      let data;

      if (importFile.name.endsWith('.xml')) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');

        const nodesStr = xmlDoc.querySelector('nodes')?.textContent || '[]';
        const edgesStr = xmlDoc.querySelector('edges')?.textContent || '[]';

        data = {
          nodes: JSON.parse(nodesStr),
          edges: JSON.parse(edgesStr),
        };
      }
      else {
        data = JSON.parse(text);
      }

      if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
        messageApi.error('文件格式不正确，必须包含 nodes 和 edges');
        return;
      }
      applyFlowToCanvas(data);
      messageApi.success('导入成功！');

    } catch (error) {
      console.error(error);
      messageApi.error('导入失败，文件格式错误或已损坏');
    } finally {
      setImportFile(null);
      setIsModalOpen(false);
    }
  };

  const handleCancelImport = () => {
    setImportFile(null);
    setIsModalOpen(false);
  };

  const handleExportZip = async () => {
    try {
      const nodes = getNodes();
      const edges = getEdges();

      const fileName = `workflow_${Date.now()}`;

      let preview = '';

      try {
        await fitView({ padding: 0.12, duration: 0 });
        await new Promise(r => setTimeout(r, 50));
        preview = await captureFlowPreview();
      } catch (err) {
        console.warn('截图失败，继续导出:', err);
      }

      const xmlContent = generateXMLContent(nodes, edges);

      const previewBlob = preview
        ? await fetch(preview).then(r => r.blob())
        : new Blob([], { type: 'image/jpeg' });

      const zipBlob = await createZipPackage(xmlContent, previewBlob);

      if (currentUser) {
        await uploadToServer(fileName, xmlContent, preview, {
          nodes,
          edges,
        });
        messageApi.success('已保存到云端');
      } else {
        downloadZip(zipBlob, fileName);
        messageApi.success('导出成功（本地）');
      }

    } catch (error) {
      console.error(error);
      messageApi.error('导出失败');
    }
  };

  const generateXMLContent = (nodes: any[], edges: any[]): string => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<workflow>
  <nodes>${JSON.stringify(nodes)}</nodes>
  <edges>${JSON.stringify(edges)}</edges>
</workflow>`;
  };

  const createZipPackage = async (
    xmlContent: string,
    imageBlob: Blob
  ): Promise<Blob> => {
    const zip = new JSZip();

    zip.file('workflow.xml', xmlContent);
    zip.file('preview.jpg', imageBlob);

    return await zip.generateAsync({ type: 'blob' });
  };

  const uploadToServer = async (
    fileName: string,
    xmlContent: string,
    previewUrl: string,
    jsonData: any
  ) => {
    try {
      const formData = new FormData();
      formData.append('userName', currentUser);
      formData.append('jsonData', JSON.stringify(jsonData));

      // 从URL获取图片Blob
      const previewBlob = await fetch(previewUrl).then(r => r.blob());
      const file = new File([previewBlob], 'preview.jpg', { type: 'image/jpeg' });
      formData.append('image', file);

      const res = await axios.post(`${baseURL}/export`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.status === 200) {
        // 触发下载
        const zipBlob = await createZipPackage(xmlContent, previewBlob);
        downloadZip(zipBlob, fileName);
        messageApi.success('导出成功，已保存到历史记录');
      } else {
        messageApi.error('导出失败');
      }
    } catch (error) {
      console.error('上传失败:', error);
      messageApi.error('上传失败');
    }
  };

  const downloadZip = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFromDB = async (recordId: string) => {
    try {
      const res = await axios.get(`${baseURL}/importFromDB`, {
        params: {
          recordId,
          userName: currentUser
        }
      });

      if (res.data.code === 200) {
        // 获取后端数据
        const record = res.data.data;
        let flowData = record.content;

        // 自动解析字符串
        if (typeof flowData === "string") {
          flowData = JSON.parse(flowData);
        }

        // 渲染流程图
        applyFlowToCanvas(flowData);
        setUserPanelOpen(false);
        messageApi.success("导入成功！");
      } else {
        messageApi.error(res.data.msg || "导入失败");
      }
    } catch (error) {
      console.error("导入失败", error);
      messageApi.error("导入失败");
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    try {
      setExportRecords(prev => prev.filter(item => item.recordId !== recordId));
      messageApi.success("删除成功");

      axios.post(`${baseURL}/deleteExportRecord`, null, {
        params: {
          recordId,
          userName: currentUser,
        },
      });

    } catch (error) {
      messageApi.error("删除失败");
    }
  };

  const [exportRecords, setExportRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadExportRecords = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await axios.get(`${baseURL}/exportRecords`, {
        params: { userName: currentUser },
      });
      if (res.data.code === 200) {
        setExportRecords(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (userPanelOpen && currentUser) {
      loadExportRecords();
    }
  }, [userPanelOpen, currentUser, loadExportRecords]);

  const handleCancelExport = () => {
    setIsModalOpen2(false);
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('userPhone');
    setCurrentUser('');
    setUserPanelOpen(false);
    messageApi.success('已退出登录');
    localStorage.removeItem(getExportHistoryKey(currentUser));
  }, [messageApi, currentUser]);

  const currentNodeCount = nodes.length;
  const currentEdgeCount = edges.length;

  const inputNode = useMemo(() => nodes.find((node) => node.id === 'a'), [nodes]);
  const outputNode = useMemo(() => nodes.find((node) => node.id === 'c'), [nodes]);

  const inputItems = useMemo(() => inputNode?.data?.inputs ?? [], [inputNode]);
  const outputItems = useMemo(() => outputNode?.data?.outputs ?? [], [outputNode]);

  return (
    <>
      {contextHolder}

      <div className="workflow-shell" ref={flowCaptureRef}>
        <ReactFlow
          id="flow"
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          nodeTypes={nodeTypes}
          onEdgesChange={onEdgesChange}
          edgeTypes={edgeTypes}
          onConnect={onConnect}
          fitView
          fitViewOptions={{ padding: 0.18 }}
        >
          <TopLeftToolbar
            onExport={() => setIsModalOpen2(true)}
            onImport={() => setIsModalOpen(true)}
            onRecommend={() => setShowAIDialog(true)}
          />

          <TopCenterStatus
            currentUser={currentUser}
            currentNodeCount={currentNodeCount}
            currentEdgeCount={currentEdgeCount}
            onUserClick={() => {
              if (!currentUser) {
                setLoginOpen(true);
              } else {
                setUserPanelOpen(true);
              }
            }}
          />

          <TopRightToolbar
            onSave={onSave}
            onRestore={onRestore}
            onAddNode={() =>
              onAdd({
                randomId: getNodeId(),
                target: '',
                source: '',
                edgeId: '',
              })
            }
            onExecuteOpen={() => setOpen(true)}
          />

          <Background gap={24} size={1.15} color="rgba(128, 145, 178, 0.24)" />

          <RunDrawer
            open={open}
            onClose={onClose}
            onExecute={onExecute}
            inputItems={inputItems}
            outputItems={outputItems}
            updateItem={updateItem}
            getHeight={getHeight}
          />

          <ImportModal
            open={isModalOpen}
            fileName={importFile?.name || ''}
            onFileChange={setImportFile}
            onOk={handleImportJson}
            onCancel={handleCancelImport}
          />

          <ExportModal
            open={isModalOpen2}
            onOk={handleExportZip}
            onCancel={handleCancelExport}
          />

          <Controls />
        </ReactFlow>
      </div>

      <Message
        visible={showAIDialog}
        onClose={() => setShowAIDialog(false)}
        currentUser={currentUser}
        onRequireLogin={() => setLoginOpen(true)}
        onAiFlowGenerated={handleAiFlowUpdate}
      />

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLoginSuccess={(phone: string) => {
          localStorage.setItem('userPhone', phone);
          setCurrentUser(phone);
          setLoginOpen(false);
        }}
      />

      <UserPanel
        open={userPanelOpen}
        currentUser={currentUser}
        onClose={() => setUserPanelOpen(false)}
        onLogout={handleLogout}
        onImportFromDB={handleImportFromDB}
        onDeleteRecord={handleDeleteRecord}
        exportRecords={exportRecords}
        loading={loading}
      />
    </>
  );
};

export default function App() {
  return (
    <ReactFlowProvider>
      <SaveRestore />
    </ReactFlowProvider>
  );
}