import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react';
import { Avatar } from 'antd';
import type { CustomEdge } from './types';
import addIcon from '../../public/addInput.png';
import deleteIcon from '../../public/deleteInput.png';
import { eventAddNode } from '../common.ts';
import eventBus from '../nodes/eventBus';

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  source,
  target,
}: EdgeProps<CustomEdge>) {
  const { getNodes, getEdges, setEdges } = useReactFlow();

  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  /**
   * 删除当前边
   */
  const handleDeleteEdge = () => {
    const updatedEdges = getEdges().filter((edge) => edge.id !== id);

    setEdges(updatedEdges);
    eventBus.emit('dataUpdated', {
      nodes: getNodes(),
      edges: updatedEdges,
    });
  };

  /**
   * 在当前边上新增节点
   */
  const handleAddNode = () => {
    eventAddNode.emit('addNode', {
      randomId: `randomnode_${Date.now()}`,
      edgeId: id,
      source,
      target,
    });
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: '#94a3b8',
          strokeWidth: 2,
        }} />

      <EdgeLabelRenderer>
        <>
          <Avatar
            className="avatar"
            src={deleteIcon}
            style={{
              position: 'absolute',
              pointerEvents: 'all',
              transform: `translate(-100%, -50%) translate(${labelX - 10}px, ${labelY}px)`,
              width: 14,
              height: 14,
            }}
            onClick={handleDeleteEdge}
          />

          <Avatar
            className="avatar"
            src={addIcon}
            style={{
              position: 'absolute',
              pointerEvents: 'all',
              transform: `translate(0%, -50%) translate(${labelX + 10}px, ${labelY}px)`,
              width: 14,
              height: 14,
            }}
            onClick={handleAddNode}
          />
        </>
      </EdgeLabelRenderer>
    </>
  );
}