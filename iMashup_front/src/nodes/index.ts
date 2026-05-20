import type { NodeTypes } from '@xyflow/react';
import { PositionLoggerNode } from './PositionLoggerNode';
import { StartorEndNode } from './StartorEndNode';

export const InitialNodes = [
  {
    id: 'a',
    type: 'start-end',
    position: {
      x: -350,
      y: 44
    },
    data: {
      label: '开始',
      name: '输入',
      inputs: [
        {
          key: '0',
          name: 'input',
          text: '',
          type: 'string',
          isFold: true
        }
      ]
    },
    measured: {
      width: 196,
      height: 116
    }
  },
  {
    id: 'b',
    type: 'position-logger',
    position: {
      x: 0,
      y: 0
    },
    data: {
      label: 'API',
      inputs: [
        {
          key: '0',
          name: 'input',
          type: 'string',
          text: '',
          isFold: true,
          value: {
            name: '开始',
            type: 'string',
            input: 'input',
            urlValueName: 'text'
          }
        }
      ],
      outputs: [
        {
          key: '0',
          name: 'output',
          isFold: true,
          text: '',
          type: 'string'
        }
      ],
      urlLine: '',
      requestUrl: '',
      method: 'GET'
    },
    measured: {
      width: 268,
      height: 198
    }
  },
  {
    id: 'c',
    type: 'start-end',
    position: {
      x: 336,
      y: 44
    },
    targetPosition: 'left',
    data: {
      label: '结束',
      name: '输出',
      outputs: [
        {
          key: '0',
          name: 'output',
          type: 'string',
          isFold: true,
          value: {
            name: '开始',
            type: 'string',
            input: 'input',
            text: ''
          }
        }
      ]
    },
    measured: {
      width: 196,
      height: 116
    }
  }
];

export const nodeTypes = {
  'position-logger': PositionLoggerNode,
  'start-end': StartorEndNode
} satisfies NodeTypes;