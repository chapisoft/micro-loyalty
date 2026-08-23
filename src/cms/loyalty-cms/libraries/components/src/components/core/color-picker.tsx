import { ColorPicker, ColorPickerProps } from 'primereact/colorpicker';
import React, { useRef } from 'react';
import { AppLabel, AppLabelProps } from './label';
type AppColorPickerProps = ColorPickerProps & AppLabelProps;

const AppColorPicker: React.FC<AppColorPickerProps> = ({
  inputId = '',
  label = '',
  required = false,
  error = '',
  disabled = false,
  caption = '',
  showCaption = false,
  value,
  ...props
}: AppColorPickerProps) => {
  const colorPickerRef = useRef(null);
  const handleClick = () => {
    if (colorPickerRef.current) {
      (colorPickerRef.current as any).show();
    }
  };
  return (
    <>
      <AppLabel
        inputId={inputId}
        label={label}
        required={required}
        error={error}
        disabled={disabled}
        caption={caption}
        showCaption={showCaption}
      >
        <>
          {!value && (
            <div
              className="relative"
              style={{
                width: 'fit-content',
                zIndex: '9999',
              }}
            >
              <div
                className="absolute p-colorpicker-preview p-inputtext"
                style={{
                  width: 'calc(2rem)',
                  height: 'calc(2rem)',
                  borderRadius: '6px',
                  backgroundColor: value,
                }}
                onClick={handleClick}
              ></div>
            </div>
          )}
          <ColorPicker
            style={{ visibility: value ? 'visible' : 'hidden' }}
            ref={colorPickerRef}
            value={value}
            {...props}
          ></ColorPicker>
        </>
      </AppLabel>
    </>
  );
};
export { AppColorPicker };
