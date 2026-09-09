import { IAttribute } from '@/models';
import { TreeNode } from 'primereact/treenode';

export const convertAttributesToTreeNodes = (attributes: IAttribute[]): TreeNode[] => {
  return attributes.map((attribute) => ({
    key: attribute.id.toString(),
    label: attribute.name,
    data: attribute,
    children: attribute.children ? convertAttributesToTreeNodes(attribute.children) : [],
  }));
};
