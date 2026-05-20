import type { Node, BuiltInNode } from '@xyflow/react';

type FieldType = 'string' | 'number' | 'boolean';

type NodeValue = {
  name: string;
  type: FieldType;
  input: string;
  text?: string;
  urlValueName?: string;
};

type NodeField = {
  key: string;
  name: string;
  text: string;
  type?: FieldType;
  isFold?: boolean;
  isRequired?: boolean;
  value?: NodeValue;
};

type PositionLoggerNodeData = {
  label: string;
  inputs: NodeField[];
  outputs: NodeField[];
  urlLine: string;
  requestUrl?: string;
  method: 'GET' | 'POST';
};

type StartOrEndNodeData = {
  label: string;
  name: string;
  inputs?: NodeField[];
  outputs?: NodeField[];
};

export type PositionLoggerNode = Node<PositionLoggerNodeData, 'position-logger'>;
export type StartorEndNode = Node<StartOrEndNodeData, 'start-end'>;

export type AppNode = BuiltInNode | PositionLoggerNode | StartorEndNode;