import React, { useEffect, useRef, forwardRef } from 'react';
import { AppLabel, AppLabelProps } from './label';
import classNames from 'classnames';
import { InputText, InputTextProps } from 'primereact/inputtext';

type newProps = {
  showClear?: boolean;
  iconClass?: string;
  suffix?: string;
};

export type AppInputTextProps = InputTextProps & AppLabelProps & newProps;

const AppInputText = forwardRef<HTMLInputElement, AppInputTextProps>(
  (
    {
      inputId = '',
      label = '',
      required = false,
      error = '',
      disabled = false,
      caption = '',
      showCaption = false,
      showClear = true,
      iconClass = '',
      suffix = '',
      ...props
    }: AppInputTextProps,
    ref
  ) => {
    const [value, setValue] = React.useState<string>(props.value ?? '');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleClear = (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      setValue('');

      if (inputRef.current) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (nativeInputValueSetter) {
          // Set the value using the native setter
          nativeInputValueSetter.call(inputRef.current, '');
        }
        var event = new Event('input', { bubbles: true });
        inputRef.current.dispatchEvent(event);
        props.onChange?.(event as any);
      }
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value);
      props.onChange?.(event);
    };

    useEffect(() => {
      setValue(props.value ?? '');
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
          className={classNames({
            'p-input-icon-left': iconClass.length > 0,
            'p-input-icon-right': showClear && value && value?.length > 0,
          })}
          style={{position:'relative'}}
        >
          {iconClass.length > 0 && <i className={iconClass} style={{ left: '0.75rem' }}></i>}
          <InputText
            ref={ref ?? inputRef}
            disabled={disabled}
            {...props}
            value={value}
            onChange={handleChange}
            className={`w-full  ${error ? 'ng-invalid ng-dirty ' : ' '}` + props.className}
            style={{
              ...(showClear && value && value?.length > 0 ? { paddingRight: '2.5rem' } : {}),
              ...(iconClass.length > 0 ? { paddingLeft: '2.5rem' } : {}),
            }}
          ></InputText>
          {suffix && (
            <span className="absolute pointer-events-none " style={{ right: '2.5rem', top: '0.8rem' }}>
              {suffix}
            </span>
          )}
          {showClear && value && value?.length > 0 && !disabled && (
            <i className="pi pi-times cursor-pointer" style={{ right: '0.75rem' }} onClick={handleClear}></i>
          )}
        </span>
      </AppLabel>
    );
  }
);

AppInputText.displayName = 'AppInputText';

export { AppInputText };
