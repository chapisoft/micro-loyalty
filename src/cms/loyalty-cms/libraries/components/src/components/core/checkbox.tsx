import classNames from 'classnames';
import { Checkbox, CheckboxProps } from 'primereact/checkbox';
import React from 'react';
type AppCheckboxProps = CheckboxProps & { className?: string; label?: string };

const AppCheckbox: React.FC<AppCheckboxProps> = ({ className, ...props }: AppCheckboxProps) => {
  return (
    <div className={classNames('flex justify-content-center align-items-center', className)}>
      <Checkbox {...props}></Checkbox>
      <label htmlFor={props.inputId} className="ml-2">
        {props.label}
      </label>
    </div>
  );
};

export { AppCheckbox };
