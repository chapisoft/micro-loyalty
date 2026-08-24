import { IAttribute, ICriteria } from '@/models';
import { TreeNode } from 'primereact/treenode';

export const flattenTreeData = (nodes: IAttribute[] | ICriteria[]): TreeNode[] => {
  const nodeMap = new Map<number, IAttribute | ICriteria>();
  nodes.forEach((node) => nodeMap.set(node.id, node));

  const rootNodes: (IAttribute | ICriteria)[] = [];
  nodes.forEach((node) => {
    if (node.parentId === null) {
      rootNodes.push(node);
    } else {
      //@ts-expect-error
      const parentNode = nodeMap.get(node.parentId);
      if (parentNode) {
        if (!parentNode.children) {
          parentNode.children = [];
        }
        //@ts-expect-error
        parentNode.children.push(node);
      }
    }
  });

  // Sort nodes by isDefault and sortOrder
  const sortByIsDefaultAndSortOrder = (a: IAttribute | ICriteria, b: IAttribute | ICriteria) => {
    if (a.isDefault === 1 && b.isDefault !== 1) return -1;
    if (a.isDefault !== 1 && b.isDefault === 1) return 1;
    //@ts-expect-error
    return a?.sortOrder - b?.sortOrder;
  };

  rootNodes.sort(sortByIsDefaultAndSortOrder);
  rootNodes.forEach((node) => {
    if (node.children) {
      //@ts-expect-error
      node.children.sort(sortByIsDefaultAndSortOrder);
    }
  });

  const flatten = (node: IAttribute | ICriteria, level: number = 0): TreeNode => {
    const hasChildren = node.children && node.children.length > 0;
    return {
      key: node.id ? node.id.toString() : null,
      label: node.name,
      data: { ...node, level },
      children: hasChildren
        ? //@ts-expect-error
          node.children.map((child) => flatten(child, level + 1))
        : [],
    };
  };

  return rootNodes.map((node) => flatten(node));
};
