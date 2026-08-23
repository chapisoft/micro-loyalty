import React from 'react';
import { AppLabel, AppLabelProps } from './label';

import { CascadeSelect, CascadeSelectProps } from 'primereact/cascadeselect';

type AppCascadeSelectProps = CascadeSelectProps & AppLabelProps;

const AppCascadeSelect: React.FC<AppCascadeSelectProps> = ({
  inputId = '',
  label = '',
  required = false,
  error = '',
  disabled = false,
  caption = '',
  showCaption = false,
  ...props
}: AppCascadeSelectProps) => {
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
      <CascadeSelect {...props}></CascadeSelect>
    </AppLabel>
  );
};
export { AppCascadeSelect };
