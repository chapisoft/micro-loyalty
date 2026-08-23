import { MultiSelect, MultiSelectProps } from 'primereact/multiselect';
import React, { useEffect, useRef, useState } from 'react';
import { AppLabel, AppLabelProps } from './label';
import './multi-select.scss';
type AppMultiSelectProps = MultiSelectProps & AppLabelProps;

const AppMultiSelect: React.FC<AppMultiSelectProps> = ({
  inputId = '',
  label = '',
  required = false,
  error = '',
  disabled = false,
  caption = '',
  showCaption = false,
  ...props
}: AppMultiSelectProps) => {
  const [filter, setFilter] = useState<string>('');
  const multiSelectRef = useRef<MultiSelect>(null);
  const [isDropdownVisible, setIsDropdownVisible] = useState<boolean>(false);

  const handleClickOutside = (event: MouseEvent) => {
    if (multiSelectRef && multiSelectRef.current) {
      if (!multiSelectRef.current.getOverlay().contains(event.target as Node)) {
        multiSelectRef.current.hide();
        multiSelectRef.current.getInput()?.addEventListener('click', () => {
          setIsDropdownVisible((prev) => !prev);
        });
      }
      if (multiSelectRef.current.getElement().contains(event.target as Node)) {
        if (!isDropdownVisible) multiSelectRef.current.show();
      }
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      <MultiSelect
        // showFilterClear={filter.length > 0}
        ref={multiSelectRef}
        filterIcon={filter.length > 0 ? 'pi pi-times' : 'pi pi-search'}
        onFilter={(e) => {
          setFilter(e.filter);
        }}
        invalid={Boolean(error)}
        {...props}
        className={`w-full  ${error ? 'ng-invalid ng-dirty ' : ' '}` + (props.className ?? '')}
      ></MultiSelect>
    </AppLabel>
  );
};
export { AppMultiSelect };
