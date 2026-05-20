import type { BuiltInEdge, Edge } from '@xyflow/react';

export type CustomEdgeData = {
  label?: string;
  deletable?: boolean;
  insertable?: boolean;
};

export type CustomEdge = Edge<CustomEdgeData, 'custom-edge'>;
export type AppEdge = BuiltInEdge | CustomEdge;