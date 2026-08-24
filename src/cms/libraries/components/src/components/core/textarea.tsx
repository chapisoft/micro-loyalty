import { AppLabel, AppLabelProps } from './label';
import React, { useEffect, useRef } from 'react';

import { InputTextarea, InputTextareaProps } from 'primereact/inputtextarea';
import classNames from 'classnames';
type newProps = {
  showClear?: boolean;
  iconClass?: string;
};
type AppInputTextareaProps = InputTextareaProps & AppLabelProps & newProps;

const AppInputTextarea: React.FC<AppInputTextareaProps> = ({
  inputId = '',
  label = '',
  required = false,
  error = '',
  disabled = false,
  caption = '',
  showCaption = false,
  showClear = true,
  iconClass = '',
  ...props
}: AppInputTextareaProps) => {
  const [value, setValue] = React.useState<string>(props.value ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const handleClear = () => {
    setValue('');
    if (textareaRef.current) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )?.set;
      if (nativeInputValueSetter) {
        // Set the value using the native setter
        nativeInputValueSetter.call(textareaRef.current, '');
      }
      var event = new Event('input', { bubbles: true });
      textareaRef.current.dispatchEvent(event);
      props.onChange?.(event as any);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value ?? '');
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
          'p-input-icon-right': showClear && value,
        })}
      >
        <InputTextarea
          ref={textareaRef}
          invalid={Boolean(error)}
          disabled={disabled}
          {...props}
          value={value}
          onChange={handleChange}
          className={`w-full ${props.className ?? ''} ${error ? 'ng-invalid ng-dirty' : ''}`}
        ></InputTextarea>
        {showClear && value && !disabled && (
          <i className="pi pi-times cursor-pointer" style={{ right: '0.75rem' }} onClick={handleClear}></i>
        )}
      </span>
    </AppLabel>
  );
};
export { AppInputTextarea };
