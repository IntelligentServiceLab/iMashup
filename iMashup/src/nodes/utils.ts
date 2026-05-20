export const getType = (type: string | { type: string }) => {
  let innerType = '';

  if (typeof type === 'object' && type) {
    innerType = type.type;
  } else if (typeof type === 'string') {
    innerType = type;
  }

  switch (innerType) {
    case 'string':
      return 'str';
    case 'boolean':
      return 'bool';
    case 'number':
      return 'num';
    default:
      return '';
  }
};

export const getBeforeNode = (edges: any[], id: string) => {
  // 构建邻接图：target -> 所有直接前置 source
  const graph: Record<string, string[]> = {};

  edges.forEach((edge: any) => {
    if (!graph[edge.target]) {
      graph[edge.target] = [];
    }
    graph[edge.target].push(edge.source);
  });

  // 反向查找当前节点的全部前置节点
  const findPredecessors = (target: string) => {
    const predecessors: string[] = [];
    const stack: string[] = [target];

    while (stack.length > 0) {
      const node = stack.pop();
      if (!node) continue;

      if (graph[node]) {
        graph[node].forEach((predecessor) => {
          if (!predecessors.includes(predecessor)) {
            predecessors.push(predecessor);
            stack.push(predecessor);
          }
        });
      }
    }

    return predecessors;
  };

  return findPredecessors(id);
};

export const getTreeList = (result: string[], nodes: any[]) => {
  // 从前置节点中提取可供选择的字段
  const data = result.flatMap((id) => {
    const node = nodes.find((n: any) => n.id === id);
    if (!node) return [];

    if (id === 'a') {
      return (node.data.inputs || []).map((input: any) => ({
        label: node.data.label,
        name: input.name,
        type: input.type
      }));
    }

    return (node.data.outputs || []).map((output: any) => ({
      label: node.data.label,
      name: output.name,
      type: output.type
    }));
  });

  const groupedData: Record<string, any[]> = {};

  data.forEach((item: any) => {
    const { label, name, type } = item;

    if (!groupedData[label]) {
      groupedData[label] = [];
    }

    groupedData[label].push({
      value: `${label}·${name}·${type}`,
      title: `${label} · ${name} · ${type}`
    });
  });

  return Object.keys(groupedData).map((label) => ({
    value: label,
    title: label,
    disabled: true,
    children: groupedData[label]
  }));
};