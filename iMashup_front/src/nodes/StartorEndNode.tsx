import { useEffect, useState } from 'react';
import { Handle, Position, type NodeProps, useReactFlow } from '@xyflow/react';
import { type StartorEndNode } from './types';
import { Flex, Drawer, Input, message, Select, TreeSelect } from 'antd';
import type { DrawerProps, TreeSelectProps } from 'antd';
import {
  PlayCircleOutlined,
  FlagOutlined,
  PlusOutlined,
  DeleteOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import './index.css';

import { getType, getBeforeNode, getTreeList } from './utils';
import eventBus from './eventBus.ts';

const { TextArea } = Input;

const TYPE_OPTIONS = [
  { value: 'string', label: 'string' },
  { value: 'number', label: 'number' },
  { value: 'boolean', label: 'boolean' },
];

const OUTPUT_TYPE_OPTIONS = [
  { value: 'string', label: 'string' },
  { value: 'number', label: 'number' },
  { value: 'boolean', label: 'boolean' },
];

export function StartorEndNode({
  id,
  data,
  isConnectable,
}: NodeProps<StartorEndNode>) {
  const [messageApi, contextHolder] = message.useMessage();
  const [placement] = useState<DrawerProps['placement']>('right');
  const { getNodes, setNodes, getEdges } = useReactFlow();
  const [open, setOpen] = useState(false);
  const [inputCount, setInputCount] = useState(
    data.inputs ? data.inputs.length : data.outputs?.length
  );
  const [treeData, setTreeData] = useState<TreeSelectProps['treeData']>([]);
  const [treeValues, setTreeValues] = useState<Map<string, string>>(new Map());

  const isStartNode = id === 'a';
  const nodeTypeClass = isStartNode ? 'node-card--start' : 'node-card--end';
  const badgeClass = isStartNode ? 'node-header-badge--start' : 'node-header-badge--end';
  const tagCount = isStartNode ? data.inputs?.length || 0 : data.outputs?.length || 0;

  const onClose = () => {
    setOpen(false);
  };

  const handleClick = () => {
    setOpen(true);
  };

  const handleAdd = (nodeId: string, addType: string) => {
    const getInputKey = () => `key-${+new Date()}`;
    const addInputName = () => {
      const newInputIndex = inputCount ? inputCount + 1 : Number(inputCount) + 1;
      setInputCount(newInputIndex);
      return `${nodeId == 'a' ? 'input' : 'output'}${newInputIndex}`;
    };

    const input = {
      key: getInputKey(),
      name: addInputName(),
      text: '这里是内容',
      type: 'string',
      isFold: true,
    };

    const initialNodes = getNodes();
    const updateNodes = initialNodes.map((node: any) => {
      if (node.id === nodeId) {
        if (addType == '输入') {
          node.data?.inputs?.push(input);
        } else if (addType == '输出') {
          node.data?.outputs?.push({
            key: getInputKey(),
            name: addInputName(),
            type: 'string',
            isFold: true,
            value: {
              name: '开始',
              type: 'string',
              input: 'input',
              text: '这里是结果',
            },
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

  const updateInput = (key: string, value: string) => {
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
        if (id == 'a') {
          node.data?.inputs?.map((item: any) => {
            if (item.key == key) item.name = value;
          });
        } else if (id == 'c') {
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

  const updateIsFold = (key: string) => {
    const initialNodes = getNodes();
    const updateNodes = initialNodes.map((node: any) => {
      if (node.id === id) {
        if (id == 'a') {
          node.data?.inputs?.map((item: any) => {
            if (item.key == key) item.isFold = !item.isFold;
          });
        } else if (id == 'c') {
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

  const updateItem = (key: string, value: string) => {
    const initialNodes = getNodes();
    const updateNodes = initialNodes.map((node: any) => {
      if (node.id === id) {
        if (id == 'a') {
          node.data?.inputs?.map((item: any) => {
            if (item.key == key && value !== undefined) item.text = value;
          });
        } else if (id == 'c') {
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

  const getHeight = (text: string | undefined) => {
    return text ? 22 + (22 * text.length) / 25 : 20;
  };

  const onChangeSelect = (key: string, value: string) => {
    const initialNodes = getNodes();
    const updateNodes = initialNodes.map((node: any) => {
      if (node.id === id) {
        if (id == 'a') {
          node.data?.inputs?.map((item: any) => {
            if (item.key == key) item.type = value;
          });
        } else if (id == 'c') {
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

  const handleDelete = (key: string) => {
    const initialNodes = getNodes();
    const updateNodes = initialNodes.map((node: any) => {
      if (node.id === id) {
        if (id == 'a') {
          node.data.inputs = node.data?.inputs?.filter((item: any) => item.key !== key);
        } else if (id == 'c') {
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

  const getTree = (nodes = getNodes(), edges = getEdges()) => {
    const result = getBeforeNode(edges, id);
    const tree = getTreeList(result, nodes);
    setTreeData(tree);
  };

  useEffect(() => {
    getTree();

    data.outputs?.map((item: any) => {
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

  const onChangeTreeSelect = (selectedValue: string, treeKey: string) => {
    if (!selectedValue) return;

    const [name, input, type] = selectedValue.split('·');

    const initialNodes = getNodes();
    const updateNodes = initialNodes.map((node: any) => {
      if (node.id == id) {
        node.data.outputs?.map((item: any) => {
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
        node.data.outputs?.map((item: any) => {
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

  const renderTagList = () => {
    const list = isStartNode ? data?.inputs : data?.outputs;

    if (!list || list.length === 0) {
      return <span className="node-empty">暂无字段</span>;
    }

    return list.map((item, index) => (
      <div className="node-tag" key={index}>
        <span className="node-tag-type">{item?.type && getType(item?.type)}</span>
        <span className="node-tag-name">{item?.name}</span>
      </div>
    ));
  };

  return (
    <>
      {contextHolder}

      <Flex
        gap="small"
        vertical
        justify="center"
        className={`node-card ${nodeTypeClass} start-end-body`}
        onClick={handleClick}
      >
        <div className="node-header">
          <div className="node-header-left">
            <div className={`node-header-badge ${badgeClass}`}>
              <span className="node-header-icon-wrap">
                {isStartNode ? (
                  <PlayCircleOutlined className="node-badge-icon node-badge-icon--start" />
                ) : (
                  <FlagOutlined className="node-badge-icon node-badge-icon--end" />
                )}
              </span>
            </div>

            <div className="node-header-main">
              {data.label && <div className="node-header-title">{data.label}</div>}
              <div className="node-header-subtitle">
                {isStartNode ? '流程入口节点' : '流程结果节点'}
              </div>
            </div>
          </div>
        </div>

        <div className="node-summary">
          <span
            className={`node-summary-pill ${
              isStartNode ? 'node-summary-pill--primary' : 'node-summary-pill--purple'
            }`}
          >
            {isStartNode ? '输入' : '输出'} {tagCount}
          </span>
        </div>

        <div className="node-tags">
          <span className="node-tags-title">{data?.name}</span>
          {renderTagList()}
        </div>

        {id == 'a' && (
          <Handle type="source" position={Position.Right} isConnectable={isConnectable} />
        )}
        {id == 'c' && (
          <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
        )}
      </Flex>

      <Drawer
        title={data?.label}
        placement={placement}
        closable={false}
        onClose={onClose}
        open={open}
        key={placement}
        size="default"
      >
        <div className="drawer-section">
          <div className="drawer-section-header">
            <div>
              <div className="drawer-section-title">{data.name}</div>
              <div className="drawer-section-desc">
                {isStartNode ? '配置流程入口参数' : '配置流程输出结果'}
              </div>
            </div>
            <div className="drawer-section-action">
              <button
                type="button"
                className="drawer-icon-btn icon-btn"
                onClick={() => handleAdd(id, data.name)}
              >
                <PlusOutlined />
              </button>
            </div>
          </div>

          <div className="form-table-header">
            <div className="form-col form-col-name">变量名</div>
            <div className={`form-col ${isStartNode ? 'form-col-type' : 'form-col-value'}`}>
              {id == 'a' ? '变量类型' : '变量值'}
            </div>
            <div className="form-col form-col-action">操作</div>
          </div>

          {data.inputs?.map((item) => (
            <div className="field-row" key={item.key}>
              <div className="field-row-main">
                <div className="field-row-controls">
                  <Input
                    className="control-name"
                    value={item.name}
                    onChange={(e) => updateInput(item.key, e.target.value)}
                  />
                  <Select
                    className="control-type"
                    placeholder="Select Type"
                    optionFilterProp="label"
                    onChange={(value) => onChangeSelect(item.key, value)}
                    value={item.type}
                    options={TYPE_OPTIONS}
                  />
                </div>

                <div className="field-actions">
                  <button
                    type="button"
                    className="field-action-btn icon-btn"
                    onClick={() => updateIsFold(item.key)}
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
                    onClick={() => handleDelete(item.key)}
                  >
                    <DeleteOutlined className="field-action-icon" />
                  </button>
                </div>
              </div>

              {!item.isFold && (
                <div className="field-detail">
                  <div className="field-detail-label">输入值</div>
                  <div className="field-detail-body">
                    <TextArea
                      className="control-full textarea-detail"
                      value={item.text}
                      onChange={(e) => updateItem(item.key, e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          {data.outputs?.map((item) => (
            <div className="field-row" key={item.key}>
              <div className="field-row-main">
                <div className="field-row-controls">
                  <Input
                    className="control-name"
                    value={item.name}
                    onChange={(e) => updateInput(item.key, e.target.value)}
                  />
                  <Select
                    className="control-type"
                    placeholder="Select Type"
                    optionFilterProp="label"
                    onChange={(value) => onChangeSelect(item.key, value)}
                    value={item.type}
                    options={OUTPUT_TYPE_OPTIONS}
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
                    onClick={() => updateIsFold(item.key)}
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
                    onClick={() => handleDelete(item.key)}
                  >
                    <DeleteOutlined className="field-action-icon" />
                  </button>
                </div>
              </div>

              {!item.isFold && (
                <div className="field-detail">
                  <div className="field-detail-label">结果</div>
                  <div className="field-detail-body">
                    <TextArea
                      className="control-full textarea-result result-box-disabled"
                      disabled
                      style={{ minHeight: getHeight(item.value?.text) }}
                      value={item.value && item.value?.text}
                      onChange={(e) => updateItem(item.key, e.target.value)}
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