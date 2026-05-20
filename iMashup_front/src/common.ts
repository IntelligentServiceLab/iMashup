import EventEmitter from 'eventemitter3';

export const eventAddNode = new EventEmitter();

export const dimensions = {
    width: 180,
    height: 80,
};


interface Node {
    id: string;
    type: string;
    position: {
        x: number;
        y: number;
    };
    data: {
        label: string;
        name: string;
        inputs?: {
            key: string;
            name: string;
            text: string;
            type: string;
            isFold: boolean;
        }[];
        outputs?: {
            key: string;
            name: string;
            text: string;
            type: string;
            isFold: boolean;
        }[];
    };
    measured: {
        width: number;
        height: number;
    };
    selected?: boolean;
    dragging?: boolean;
}

export function findNodeOrder(nodes: any[], edges: any[]): any[] {
    // 创建一个映射节点id到节点的索引
    const nodeMap: { [key: string]: Node } = nodes.reduce((acc, node) => {
        acc[node.id] = node;
        return acc;
    }, {} as { [key: string]: Node });

    // 创建图的邻接列表和入度表
    const adjList: { [key: string]: string[] } = {}; // 用于记录每个节点指向的其他节点
    const inDegree: { [key: string]: number } = {}; // 用于记录每个节点的入度

    // 初始化邻接列表和入度表
    nodes.forEach(node => {
        adjList[node.id] = [];
        inDegree[node.id] = 0;
    });

    // 填充邻接列表和入度表
    edges.forEach(edge => {
        const source = edge.source;
        const target = edge.target;

        adjList[source].push(target);
        inDegree[target]++;
    });

    // 拓扑排序
    const queue: string[] = [];
    const result: Node[] = [];

    // 将所有入度为0的节点加入队列
    for (const nodeId in inDegree) {
        if (inDegree[nodeId] === 0) {
            queue.push(nodeId);
        }
    }

    while (queue.length > 0) {
        const currentNode = queue.shift()!;
        result.push(nodeMap[currentNode]);

        // 对于当前节点的所有邻接节点，减少它们的入度
        adjList[currentNode].forEach(neighbor => {
            inDegree[neighbor]--;
            if (inDegree[neighbor] === 0) {
                queue.push(neighbor);
            }
        });
    }

    // 如果结果中的节点数小于总节点数，则存在环
    if (result.length !== nodes.length) {
        throw new Error("图中存在环，无法进行拓扑排序");
    }

    // 返回拓扑排序后的节点顺序
    return result;
}

export const getUserName = () => {
    const phone = localStorage.getItem('userPhone');
    return phone ? `user${phone}` : 'guest'; // 未登录时显示guest
};

export const baseURL = 'http://localhost:8080'
// export const baseURL = 'http://118.25.40.159:8989'

// 类型定义
export type Timer = ReturnType<typeof setInterval>;