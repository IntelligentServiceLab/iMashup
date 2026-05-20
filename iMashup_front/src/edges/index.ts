import type { EdgeTypes } from '@xyflow/react';
import type { AppEdge } from './types';
import CustomEdge from './CustomEdge';

// 边的初始数据
export const initialEdges: AppEdge[] = [
  { id: 'a->b', type: 'custom-edge', source: 'a', target: 'b' },
  { id: 'b->c', type: 'custom-edge', source: 'b', target: 'c' },
];

export const edgeTypes = {
  'custom-edge': CustomEdge,
} satisfies EdgeTypes;

