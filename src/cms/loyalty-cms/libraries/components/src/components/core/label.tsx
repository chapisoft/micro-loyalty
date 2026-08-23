import React from 'react';
import './label.scss';
export interface AppLabelProps extends React.PropsWithChildren {
  inputId?: string;
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  caption?: string;
  showCaption?: boolean;
}

const AppLabel: React.FC<AppLabelProps> = ({
  inputId = '',
  label = '',
  required = false,
  error = '',
  disabled = false,
  caption = '',
  showCaption = false,
  children,
}) => {
  return (
    <div className="flex flex-column gap-2">
      {label?.length > 0 && (
        <label
          htmlFor={inputId}
          className={`app-label ${required && !disabled ? 'required' : ''} ${disabled ? 'p-disabled' : ''}`}
        >
          {label}
        </label>
      )}
      {children}
      {error?.length > 0 && <div className="p-error mt-1">{error}</div>}
      {caption?.length > 0 && showCaption && (
        <div className="mt-1" style={{ color: 'var(--text-color-secondary)' }}>
          {caption}
        </div>
      )}
    </div>
  );
};
export { AppLabel };
