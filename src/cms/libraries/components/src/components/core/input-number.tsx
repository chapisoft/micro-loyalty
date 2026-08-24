import React, { useEffect, useRef } from 'react';
import { AppLabel, AppLabelProps } from './label';

import classNames from 'classnames';
import { InputNumber, InputNumberChangeEvent, InputNumberProps } from 'primereact/inputnumber';

type newProps = {
  showClear?: boolean;
  iconClass?: string;
};
export type AppInputNumberProps = InputNumberProps & AppLabelProps & newProps;

const AppInputNumber: React.FC<AppInputNumberProps> = ({
  inputId = '',
  label = '',
  required = false,
  error = '',
  disabled = false,
  caption = '',
  showCaption = false,
  useGrouping = false,
  showClear = true,
  iconClass = '',
  suffix = '',
  ...props
}: AppInputNumberProps) => {
  const [value, setValue] = React.useState<number | null>(props.value ?? null);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleClear = () => {
    setValue(null);
    props.onChange?.({
      value: null,
    } as any);
  };

  const handleChange = (event: InputNumberChangeEvent) => {
    if ((event.originalEvent as any).keyCode === 32 && !event.value) {
      if (inputRef && inputRef.current) inputRef.current.value = '';
      setValue(null);
      props.onChange?.({ value: null } as any);
    }
    const regex: RegExp = new RegExp(/^[0-9]*$/);
    if (event.value && regex.test(event.value.toString())) {
      const newValue = parseInt(event.value.toString().slice(0, props?.maxLength ?? 999999999999 - 1));
      setValue(newValue ?? null);
      props.onChange?.({ ...event, value: newValue });
    }
  };

  useEffect(() => {
    setValue(props.value ?? null);
  }, [props.value]);

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
      <span
        className={classNames('w-full block', {
          'p-input-icon-left': iconClass.length > 0,
          'p-input-icon-right': showClear && value,
        })}
      >
        {iconClass.length > 0 && <i className={iconClass} style={{ left: '0.75rem' }}></i>}
        <InputNumber
          useGrouping={useGrouping}
          disabled={disabled}
          inputRef={inputRef}
          {...props}
          value={value}
          onChange={handleChange}
          className={`w-full ` + props.className}
          inputClassName={`${error ? 'ng-invalid ng-dirty ' : ' '} w-full`}
          inputStyle={{
            ...(showClear && value ? { paddingRight: '2.5rem' } : {}),
            ...(iconClass.length > 0 ? { paddingLeft: '2.5rem' } : {}),
          }}
        ></InputNumber>
        {suffix && <span className="relative pointer-events-none " style={{ left: '12.5rem', top:'-2rem' }}>{suffix}</span>}
        {showClear && value && !disabled && (
          <i className="pi pi-times cursor-pointer" style={{ right: '0.75rem' }} onClick={handleClear}></i>
        )}
      </span>
    </AppLabel>
  );
};
export { AppInputNumber };
