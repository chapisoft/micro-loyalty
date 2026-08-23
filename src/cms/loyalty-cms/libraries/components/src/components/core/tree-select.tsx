import { TreeSelect, TreeSelectProps } from 'primereact/treeselect';
import React from 'react';
import { AppLabel, AppLabelProps } from './label';
import './tree-select.scss';

type AppTreeSelectProps = TreeSelectProps & AppLabelProps;

const AppTreeSelect: React.FC<AppTreeSelectProps> = ({
  inputId = '',
  label = '',
  required = false,
  error = '',
  disabled = false,
  caption = '',
  showCaption = false,
  onChange,
  options = [],
  ...props
}: AppTreeSelectProps) => {
  const handleChange = (e: any) => {
    const { value } = e;
    const isLeafNode = (key: string) => {
      const findNode = (nodes: any[]): any => {
        for (const node of nodes) {
          if (node.key === key) {
            return node;
          }
          if (node.children) {
            const result = findNode(node.children);

            if (result) return result;
          }
        }
        return null;
      };
      const node = findNode(options);
      return node && (!node.children || node.children.length === 0);
    };

    if (isLeafNode(value)) {
      onChange && onChange(e);
    }
  };
  return (
    <AppLabel
      inputId={inputId}
      label={label}
      required={required}
      error={error}
      disabled={disabled}
      caption={caption}
      showCaption={showCaption}
    >
      <TreeSelect disabled={disabled} {...props} onChange={handleChange} options={options}></TreeSelect>
    </AppLabel>
  );
};
export { AppTreeSelect };
