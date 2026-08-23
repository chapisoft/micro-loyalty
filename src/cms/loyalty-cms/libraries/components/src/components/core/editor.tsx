import { Editor, EditorProps } from 'primereact/editor';
import React from 'react';
import { AppLabel, AppLabelProps } from './label';
type AppEditorProps = EditorProps & AppLabelProps;

const AppEditor: React.FC<AppEditorProps> = ({
  inputId = '',
  label = '',
  required = false,
  error = '',
  disabled = false,
  caption = '',
  showCaption = false,
  ...props
}: AppEditorProps) => {
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
      <Editor {...props} readOnly ={disabled}></Editor>
    </AppLabel>
  );
};
export { AppEditor };
