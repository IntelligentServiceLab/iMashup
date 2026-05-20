import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import { type PositionLoggerNode } from './types';
import { Select, message, Input, Drawer, TreeSelect } from 'antd';
import type { DrawerProps, TreeSelectProps } from 'antd';
import {
  ApiOutlined,
  DeleteOutlined,
  PlusOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import './index.css';
import { getType, getBeforeNode, getTreeList } from './utils.ts';
import eventBus from './eventBus.ts';
import { useEffect, useState } from 'react';

const INPUT_TYPE_OPTIONS = [
  { value: 'string', label: 'string' },
  { value: 'number', label: 'number' },
  { value: 'boolean', label: 'boolean' },
];

const OUTPUT_TYPE_OPTIONS = [
  { value: 'string', label: 'string' },
  { value: 'number', label: 'number' },
  { value: 'boolean', label: 'boolean' },
];

const METHOD_OPTIONS = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
];

export function PositionLoggerNode({
  id,
  data,
  isConnectable,
}: NodeProps<PositionLoggerNode>) {
  const [open, setOpen] = useState(false);
  const [placement] = useState<DrawerProps['placement']>('right');
  const [inputCount, setInputCount] = useState(data.inputs ? data.inputs.length : 0);
  const [outputCount, setOutputCount] = useState(data.outputs ? data.outputs.length : 0);
  const { getNodes, setNodes, getEdges, setEdges } = useReactFlow();
  const [treeData, setTreeData] = useState<TreeSelectProps['treeData']>([]);
  const [treeValues, setTreeValues] = useState<Map<string, string>>(new Map());
  const [messageApi, contextHolder] = message.useMessage();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(data.label || 'API');

  const handleClick = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const handleAdd = (nodeId: string, addType: string) => {
    const getInputKey = () => `key-${+new Date()}`;
    let input = {};

    if (addType == '输入') {
      const addInputName = () => {
        const newInputIndex = inputCount ? inputCount + 1 : Number(inputCount) + 1;
        setInputCount(newInputIndex);
        return `input${newInputIndex}`;
      };

      input = {
        key: getInputKey(),
        name: addInputName(),
        isFold: false,
        type: 'string',
        text: '这里是描述',
        value: {
          name: '',
          type: '',
          input: '',
          urlValueName: '',
        },
      };
    } else {
      const addOutputName = () => {
        const newInputIndex = outputCount ? outputCount + 1 : Number(outputCount) + 1;
        setOutputCount(newInputIndex);
        return `output${newInputIndex}`;
      };

      input = {
        key: getInputKey(),
        name: addOutputName(),
        text: '这里是描述',
        isFold: true,
        type: 'string',
      };
    }

    const initialNodes = getNodes();
    const updateNodes = initialNodes.map((node: any) => {
      if (node.id === nodeId) {
        if (addType == '输入') {
          node.data?.inputs?.push(input);
        } else if (addType == '输出') {
          node.data?.outputs?.push(input);
        }
      }
      return node;
    });

    setNodes(updateNodes);
    eventBus.emit('dataUpdated', {
      nodes: updateNodes,
      edges: getEdges(),
    });
  };

  const handleDelete = (key: string, deleteType: string) => {
    const initialNodes = getNodes();
    const updateNodes = initialNodes.map((node: any) => {
      if (node.id === id) {
        if (deleteType == '输入') {
          node.data.inputs = node.data?.inputs?.filter((item: any) => item.key !== key);
        } else if (deleteType == '输出') {
          node.data.outputs = node.data?.outputs?.filter((item: any) => item.key !== key);
        }
      }
      return node;
    });

    setNodes(updateNodes);
    eventBus.emit('dataUpdated', {
      nodes: updateNodes,
      edges: getEdges(),
    });
  };

  const updateParam = (key: string, value: string) => {
    const initialNodes = getNodes();
    const updateNodes = initialNodes.map((node: any) => {
      if (node.id === id) {
        node.data?.inputs?.map((item: any) => {
          if (item.key == key) item.value.urlValueName = value;
        });
      }
      return node;
    });

    setNodes(updateNodes);
    eventBus.emit('dataUpdated', {
      nodes: updateNodes,
      edges: getEdges(),
    });
  };

  const updateInput = (key: string, value: string, updateType: string) => {
    if (value.length > 6) {
      messageApi.open({
        type: 'warning',
        content: '变量名最长为6个字符',
      });
      return;
    }

    const initialNodes = getNodes();
    const updateNodes = initialNodes.map((node: any) => {
      if (node.id === id) {
        if (updateType == '输入') {
          node.data?.inputs?.map((item: any) => {
            if (item.key == key) item.name = value;
          });
        } else if (updateType == '输出') {
          node.data?.outputs?.map((item: any) => {
            if (item.key == key) item.name = value;
          });
        }
      }
      return node;
    });

    setNodes(updateNodes);
    eventBus.emit('dataUpdated', {
      nodes: updateNodes,
      edges: getEdges(),
    });
  };

  const updateIsFold = (key: string, updateType: string) => {
    const initialNodes = getNodes();
    const updateNodes = initialNodes.map((node: any) => {
      if (node.id === id) {
        if (updateType == '输入') {
          node.data?.inputs?.map((item: any) => {
            if (item.key == key) item.isFold = !item.isFold;
          });
        } else if (updateType == '输出') {
          node.data?.outputs?.map((item: any) => {
            if (item.key == key) item.isFold = !item.isFold;
          });
        }
      }
      return node;
    });

    setNodes(updateNodes);
    eventBus.emit('dataUpdated', {
      nodes: updateNodes,
      edges: getEdges(),
    });
  };

  const updateItem = (key: string, updateType: string, value?: string) => {
    const initialNodes = getNodes();
    const updateNodes = initialNodes.map((node: any) => {
      if (node.id === id) {
        if (updateType == '输入') {
          node.data?.inputs?.map((item: any) => {
            if (item.key == key && value !== undefined) item.text = value;
          });
        } else if (updateType == '输出') {
          node.data?.outputs?.map((item: any) => {
            if (item.key == key && value !== undefined) item.text = value;
          });
        }
      }
      return node;
    });

    setNodes(updateNodes);
    eventBus.emit('dataUpdated', {
      nodes: updateNodes,
      edges: getEdges(),
    });
  };

  const updateLabel = (value: string) => {
    const finalValue = value.trim() || 'API';

    const updateNodes = getNodes();
    updateNodes.forEach((node: any) => {
      if (node.id === id) {
        node.data.label = finalValue;
      }
      return node;
    });

    setTitleValue(finalValue);
    setNodes(updateNodes);
    eventBus.emit('dataUpdated', {
      nodes: updateNodes,
      edges: getEdges(),
    });
  };

  const finishEditTitle = () => {
    updateLabel(titleValue);
    setEditingTitle(false);
  };

  const updateUrl = (value: string) => {
    const updateNodes = getNodes();
    updateNodes.forEach((node: any) => {
      if (node.id === id) {
        node.data.urlLine = value;
      }
      return node;
    });

    setNodes(updateNodes);
    eventBus.emit('dataUpdated', {
      nodes: updateNodes,
      edges: getEdges(),
    });
  };

  const updateRequestUrl = (value: string) => {
    const updateNodes = getNodes();
    updateNodes.forEach((node: any) => {
      if (node.id === id) {
        node.data.requestUrl = value;
      }
      return node;
    });

    setNodes(updateNodes);
    eventBus.emit('dataUpdated', {
      nodes: updateNodes,
      edges: getEdges(),
    });
  };

  const getTree = (nodes = getNodes(), edges = getEdges()) => {
    const result = getBeforeNode(edges, id);
    const tree = getTreeList(result, nodes);
    setTreeData(tree);
  };

  useEffect(() => {
    getTree();

    data.inputs?.map((item: any) => {
      setTreeValues((prevState) => {
        return new Map(prevState).set(
          item.key,
          String(`${item?.value.name}·${item?.value.input}·${item?.value.type}`)
        );
      });
    });

    const handleDataUpdated = (result: any) => {
      getTree(result.nodes, result.edges);
    };

    eventBus.on('dataUpdated', handleDataUpdated);
    return () => {
      eventBus.off('dataUpdated', handleDataUpdated);
    };
  }, []);

  const onChangeSelect = (key: string, value: string, type: string) => {
    const initialNodes = getNodes();
    const updateNodes = initialNodes.map((node: any) => {
      if (node.id === id) {
        if (type == '输入') {
          node.data?.inputs?.map((item: any) => {
            if (item.key == key) item.type = value;
          });
        } else if (type == '输出') {
          node.data?.outputs?.map((item: any) => {
            if (item.key == key) item.type = value;
          });
        }
      }
      return node;
    });

    setNodes(updateNodes);
    eventBus.emit('dataUpdated', {
      nodes: updateNodes,
      edges: getEdges(),
    });
  };

  const onChangeTreeSelect = (selectedValue: string, treeKey: string) => {
    if (!selectedValue) return;

    const [name, input, type] = selectedValue.split('·');
    const initialNodes = getNodes();

    const updateNodes = initialNodes.map((node: any) => {
      if (node.id === id) {
        node.data.inputs?.map((item: any) => {
          if (item.key == treeKey.split('_')[0]) {
            item.value = { name, input, type };
          }
        });
      }
      return node;
    });

    setTreeValues((prevState) => new Map(prevState).set(treeKey, selectedValue));
    setNodes(updateNodes);
  };

  const onClear = (treeKey: string) => {
    const initialNodes = getNodes();
    const updateNodes = initialNodes.map((node: any) => {
      if (node.id === id) {
        node.data.inputs?.map((item: any) => {
          if (item.key == treeKey.split('_')[0]) {
            item.value = { name: '', input: '', type: '' };
          }
        });
      }
      return node;
    });

    setTreeValues((prevState) => new Map(prevState).set(treeKey, ''));
    setNodes(updateNodes);
  };

  const onChangeSelectMethod = (value: string) => {
    const updateNodes = getNodes();
    updateNodes.forEach((node: any) => {
      if (node.id === id) {
        node.data.method = value;
      }
      return node;
    });

    setNodes(updateNodes);
    eventBus.emit('dataUpdated', {
      nodes: updateNodes,
      edges: getEdges(),
    });
  };

  const methodClass =
    data.method === 'POST' ? 'node-meta-value--post' : 'node-meta-value--get';

  return (
    <>
      {contextHolder}

      <div className="node-card node-card--api api-node-body" onClick={handleClick}>
        <div className="node-header">
          <div className="node-header-left">
            <div className="node-header-badge node-header-badge--api">
              <span className="node-header-icon-wrap">
                <ApiOutlined className="node-badge-icon node-badge-icon--api" />
              </span>
            </div>

            <div className="node-header-main">
              {data.label && <div className="node-header-title">{data.label}</div>}
              <div className="node-header-subtitle">接口能力节点</div>
            </div>
          </div>

          <div className="node-header-actions">
            <button
              type="button"
              className="field-action-btn field-action-btn--danger icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                const updateNodes = getNodes().filter((node) => node.id !== id);
                const updateEdges = getEdges().filter(
                  (edge: any) => edge.source !== id && edge.target !== id
                );
                setNodes(updateNodes);
                setEdges(updateEdges);
                eventBus.emit('dataUpdated', {
                  nodes: updateNodes,
                  edges: updateEdges,
                });
              }}
            >
              <DeleteOutlined className="field-action-icon" />
            </button>
          </div>
        </div>

        <div className="node-summary">
          <span className="node-summary-pill node-summary-pill--success">
            输入 {data.inputs?.length || 0}
          </span>
          <span className="node-summary-pill node-summary-pill--warning">
            输出 {data.outputs?.length || 0}
          </span>
        </div>

        <div className="api-info-block">
          <div className="node-tags">
            <span className="node-tags-title">输入</span>
            {data.inputs?.length ? (
              data.inputs.map((item, index) => (
                <div className="node-tag" key={index}>
                  <span className="node-tag-type">{item?.type && getType(item?.type)}</span>
                  <span className="node-tag-name">{item?.name}</span>
                </div>
              ))
            ) : (
              <span className="node-empty">暂无输入</span>
            )}
          </div>

          <div className="node-tags">
            <span className="node-tags-title">输出</span>
            {data.outputs?.length ? (
              data.outputs.map((item, index) => (
                <div className="node-tag" key={index}>
                  <span className="node-tag-type">{item?.type && getType(item?.type)}</span>
                  <span className="node-tag-name">{item?.name}</span>
                </div>
              ))
            ) : (
              <span className="node-empty">暂无输出</span>
            )}
          </div>

          <div className="node-meta">
            <div className="node-meta-row">
              <div className="node-meta-label">URL</div>
              <div className="node-meta-value text-ellipsis">
                {data.urlLine || '未配置接口地址'}
              </div>
            </div>

            <div className="node-meta-row">
              <div className="node-meta-label">Method</div>
              <div
                className={`node-meta-value node-meta-value--method ${methodClass} text-ellipsis`}
              >
                {data.method}
              </div>
            </div>
          </div>
        </div>

        <Handle type="target" position={Position.Left} id="b" isConnectable={isConnectable} />
        <Handle type="source" position={Position.Right} id="b" isConnectable={isConnectable} />
      </div>

      <Drawer
        title={
          editingTitle ? (
            <Input
              value={titleValue}
              autoFocus
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={finishEditTitle}
              onPressEnter={finishEditTitle}
            />
          ) : (
            <div
              style={{ cursor: 'pointer', fontWeight: 600 }}
              onClick={() => setEditingTitle(true)}
              title="点击修改名称"
            >
              {data.label || 'API'}
            </div>
          )
        }
        placement={placement}
        closable={false}
        onClose={onClose}
        open={open}
        key={placement}
        size="default"
      >
        <div className="drawer-section drawer-section--compact">
          <div className="drawer-section-header">
            <div>
              <div className="drawer-section-title">基础配置</div>
              <div className="drawer-section-desc">设置接口地址与请求方式</div>
            </div>
          </div>

          <div className="config-row">
            <div className="config-label">URL</div>
            <div className="config-control">
              <Input id="url" value={data.urlLine} onChange={(e) => updateUrl(e.target.value)} />
            </div>
          </div>

          <div className="config-row">
            <div className="config-label">requestURL</div>
            <div className="config-control">
              <Input 
                id="requestUrl"
                value={data.requestUrl || ''}
                onChange={(e) => updateRequestUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="config-row">
            <div className="config-label">Method</div>
            <div className="config-control config-control--method">
              <Select
                className="control-full"
                placeholder="Select Type"
                optionFilterProp="label"
                onChange={(value) => onChangeSelectMethod(value)}
                value={data.method}
                options={METHOD_OPTIONS}
              />
            </div>
          </div>
        </div>

        <div className="drawer-section">
          <div className="drawer-section-header">
            <div>
              <div className="drawer-section-title">输入</div>
              <div className="drawer-section-desc">配置接口请求所需字段</div>
            </div>
            <div className="drawer-section-action">
              <button
                type="button"
                className="drawer-icon-btn icon-btn"
                onClick={() => handleAdd(id, '输入')}
              >
                <PlusOutlined />
              </button>
            </div>
          </div>

          <div className="form-table-header">
            <div className="form-col form-col-name">变量名</div>
            <div className="form-col form-col-type">变量类型</div>
            <div className="form-col form-col-value">变量值</div>
            <div className="form-col form-col-action">操作</div>
          </div>

          {data.inputs?.map((item) => (
            <div className="field-row" key={item.key}>
              <div className="field-row-main">
                <div className="field-row-controls">
                  <Input
                    className="control-name"
                    value={item.name}
                    onChange={(e) => updateInput(item.key, e.target.value, '输入')}
                  />

                  <Select
                    className="control-type"
                    placeholder="Select Type"
                    optionFilterProp="label"
                    onChange={(value) => onChangeSelect(item.key, value, '输入')}
                    value={item.type}
                    options={INPUT_TYPE_OPTIONS}
                  />

                  <TreeSelect
                    className="control-value"
                    value={treeValues.get(item.key)}
                    dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                    placeholder="Please select"
                    placement="bottomRight"
                    allowClear
                    treeDefaultExpandAll
                    onChange={(value) => onChangeTreeSelect(value, item.key)}
                    treeData={treeData}
                    onClear={() => onClear(item.key)}
                  />
                </div>

                <div className="field-actions">
                  <button
                    type="button"
                    className="field-action-btn icon-btn"
                    onClick={() => updateIsFold(item.key, '输入')}
                  >
                    {item.isFold ? (
                      <DownOutlined className="field-action-icon" />
                    ) : (
                      <UpOutlined className="field-action-icon" />
                    )}
                  </button>

                  <button
                    type="button"
                    className="field-action-btn field-action-btn--danger icon-btn"
                    onClick={() => handleDelete(item.key, '输入')}
                  >
                    <DeleteOutlined className="field-action-icon" />
                  </button>
                </div>
              </div>

              {!item.isFold && (
                <div className="field-detail">
                  <div className="field-detail-label">参数名</div>
                  <div className="field-detail-body">
                    <Input
                      className="control-full"
                      value={item?.value && item.value.urlValueName}
                      onChange={(e) => updateParam(item.key, e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="drawer-section">
          <div className="drawer-section-header">
            <div>
              <div className="drawer-section-title">输出</div>
              <div className="drawer-section-desc">配置接口返回的结果字段</div>
            </div>
            <div className="drawer-section-action">
              <button
                type="button"
                className="drawer-icon-btn icon-btn"
                onClick={() => handleAdd(id, '输出')}
              >
                <PlusOutlined />
              </button>
            </div>
          </div>

          <div className="form-table-header">
            <div className="form-col form-col-name">变量名</div>
            <div className="form-col form-col-type">变量类型</div>
            <div className="form-col form-col-action">操作</div>
          </div>

          {data.outputs.map((item) => (
            <div className="field-row" key={item.key}>
              <div className="field-row-main">
                <div className="field-row-controls">
                  <Input
                    className="control-name"
                    value={item.name}
                    onChange={(e) => updateInput(item.key, e.target.value, '输出')}
                  />
                  <Select
                    className="control-type"
                    placeholder="Select Type"
                    optionFilterProp="label"
                    onChange={(value) => onChangeSelect(item.key, value, '输出')}
                    value={item.type}
                    options={OUTPUT_TYPE_OPTIONS}
                  />
                </div>

                <div className="field-actions">
                  <button
                    type="button"
                    className="field-action-btn icon-btn"
                    onClick={() => updateIsFold(item.key, '输出')}
                  >
                    {item.isFold ? (
                      <DownOutlined className="field-action-icon" />
                    ) : (
                      <UpOutlined className="field-action-icon" />
                    )}
                  </button>

                  <button
                    type="button"
                    className="field-action-btn field-action-btn--danger icon-btn"
                    onClick={() => handleDelete(item.key, '输出')}
                  >
                    <DeleteOutlined className="field-action-icon" />
                  </button>
                </div>
              </div>

              {!item.isFold && (
                <div className="field-detail">
                  <div className="field-detail-label">结果</div>
                  <div className="field-detail-body">
                    <Input
                      className="control-full"
                      disabled
                      value={item.text}
                      onChange={(e) => updateItem(item.key, '输出', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Drawer>
    </>
  );
}