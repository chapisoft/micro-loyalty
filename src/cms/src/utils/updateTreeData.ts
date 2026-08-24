import { TreeNode } from 'primereact/treenode';

const updateTreeData = (nodes: TreeNode[], key: string, isDisplay: number): TreeNode[] => {
  return nodes.map((node) => {
    if (node.key === key) {
      // Cập nhật node và toàn bộ children của node này
      const updateNodeAndChildren = (currentNode: TreeNode): TreeNode => {
        return {
          ...currentNode,
          data: { ...currentNode.data, isDisplay },
          children: currentNode.children ? currentNode.children.map(updateNodeAndChildren) : [],
        };
      };
      return updateNodeAndChildren(node);
    }

    // Tiếp tục duyệt nếu không khớp key
    if (node.children) {
      return {
        ...node,
        children: updateTreeData(node.children, key, isDisplay),
      };
    }

    return node;
  });
};

export default updateTreeData;
