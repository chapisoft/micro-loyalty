import { Dropdown, DropdownProps } from 'primereact/dropdown';
import React, { useEffect, useRef, useState } from 'react';
import { AppLabel, AppLabelProps } from './label';
import { IconType } from 'primereact/utils';
import { ProgressSpinner } from 'primereact/progressspinner';

type AppSelectProps = DropdownProps & AppLabelProps & { isLoadmore?: boolean };

const FilterClearIcon: IconType<DropdownProps> = (options) => (
  <span {...(options.iconProps as any)} className="p-dropdown-filter-icon">
    <div className="flex gap-2">
      <i className="pi pi-times cursor-pointer"></i>
    </div>
  </span>
);

const AppSelect: React.FC<AppSelectProps> = ({
  inputId = '',
  label = '',
  required = false,
  error = '',
  disabled = false,
  caption = '',
  showCaption = false,
  onFilter,
  isLoadmore,
  ...props
}: AppSelectProps) => {
  const [filter, setFilter] = useState<string>('');
  const dropdownRef = useRef<Dropdown>(null);

  const [isDropdownVisible, setIsDropdownVisible] = useState<boolean>(false);

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && dropdownRef.current.getOverlay()) {
      if (!dropdownRef.current.getOverlay()?.contains(event.target as Node)) {
        dropdownRef.current.hide();
        dropdownRef.current.getInput()?.addEventListener('click', () => {
          setIsDropdownVisible((prev) => !prev);
        });
      }
      if (dropdownRef.current.getElement()?.contains(event.target as Node)) {
        if (!isDropdownVisible) dropdownRef.current.show();
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
      <Dropdown
        ref={dropdownRef}
        onBlur={() => {
          // if (false) dropdownRef?.current?.hide();
        }}
        invalid={Boolean(error)}
        disabled={disabled}
        showFilterClear={filter.length > 0}
        filterIcon={filter.length > 0 ? <></> : 'pi pi-search'}
        filterClearIcon={FilterClearIcon}
        onFilter={(e) => {
          setFilter(e.filter);
          onFilter?.(e);
        }}
        value={props.value}
        showClear={props.value}
        panelFooterTemplate={() =>
          isLoadmore ? (
            <div className="flex justify-center items-center p-2">
              <ProgressSpinner style={{ width: '30px', height: '30px' }} />
            </div>
          ) : null
        }
        checkmark={true}
        {...props}
        onChange={(e) => {
          props.onChange?.({
            ...e,
            value: typeof e.value === 'undefined' ? null : e.value,
            target: {
              ...e.target,
              value: typeof e.target.value === 'undefined' ? null : e.target.value,
            },
          });
        }}
      ></Dropdown>
    </AppLabel>
  );
};
export { AppSelect };
