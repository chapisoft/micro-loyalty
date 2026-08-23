import { TreeNode } from 'primereact/treenode';

const areAllChildrenUnchecked = (node: TreeNode): boolean => {
  if (!node.children) return true;
  return node.children.every((child) => child.data.isDisplay === 0 && areAllChildrenUnchecked(child));
};

const findParentNode = (nodes: TreeNode[], key: string): TreeNode | null => {
  let result = null;
  nodes.forEach((node) => {
    if (node.children) {
      if (node.children.some((child) => child.key === key)) {
        result = node;
      } else {
        const found = findParentNode(node.children, key);
        if (found) {
          result = found;
        }
      }
    }
  });
  return result;
};

export const updateParentNode = (nodes: TreeNode[], key: string) => {
  const parentNode = findParentNode(nodes, key);
  if (parentNode) {
    if (areAllChildrenUnchecked(parentNode)) {
      parentNode.data.isDisplay = 0;
    } else {
      parentNode.data.isDisplay = 1;
    }
    updateParentNode(nodes, parentNode.key as string);
  }
};
