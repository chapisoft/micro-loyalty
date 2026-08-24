import React from 'react';

import { RadioButton, RadioButtonProps } from 'primereact/radiobutton';

type AppRadioButtonProps = RadioButtonProps;

const AppRadioButton: React.FC<AppRadioButtonProps> = ({ ...props }: AppRadioButtonProps) => {
  return <RadioButton {...props}></RadioButton>;
};

export { AppRadioButton };
