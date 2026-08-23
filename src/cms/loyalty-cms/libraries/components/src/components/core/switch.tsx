import { InputSwitch, InputSwitchProps } from 'primereact/inputswitch';
import React from 'react';
import { AppLabel, AppLabelProps } from './label';
type AppSwitchProps = InputSwitchProps & AppLabelProps;

const AppSwitch: React.FC<AppSwitchProps> = ({
  inputId = '',
  label = '',
  required = false,
  error = '',
  disabled = false,
  caption = '',
  showCaption = false,
  ...props
}: AppSwitchProps) => {
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
      <InputSwitch {...props}></InputSwitch>
    </AppLabel>
  );
};
export { AppSwitch };
