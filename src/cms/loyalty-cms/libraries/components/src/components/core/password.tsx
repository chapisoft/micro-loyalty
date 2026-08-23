import { AppLabel, AppLabelProps } from './label';
import React from 'react';

import { Password, PasswordProps } from 'primereact/password';

type AppPasswordProps = PasswordProps & AppLabelProps;

const AppPassword: React.FC<AppPasswordProps> = ({
  inputId = '',
  label = '',
  required = false,
  error = '',
  disabled = false,
  caption = '',
  showCaption = false,
  ...props
}: AppPasswordProps) => {
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
      <Password {...props}></Password>
    </AppLabel>
  );
};

export { AppPassword };
