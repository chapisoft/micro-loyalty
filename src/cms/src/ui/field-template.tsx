import React from 'react';
import { FieldType } from '@/constants';
import { AppCalendar, AppInputText, AppSelect, AppTreeSelect } from 'components';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primereact/autocomplete';
import { TreeNode } from 'primereact/treenode';

import './field-template.style.scss';

import { toLower } from 'lodash';

interface ICalendarProps {
  showTime?: boolean;
  showSeconds?: boolean;
  dateFormatDetail?: string;
  selectionMode?: 'single' | 'range' | 'multiple';
  minDate?: Date;
  view?: 'date' | 'month' | 'year';
  dateFormat?: string;
  hourFormat?: '12' | '24';
  timeOnly?: boolean;
}

interface ISelectProps {
  options: any;
  optionLabel?: string;
  optionValue?: string;
  showClear?: boolean;
  defaultValue?: string;
}

type FieldTemplateProps = {
  inputRef?: React.Ref<any>;
  value: any;
  setValue?: (value: any) => void;
  name?: string;
  type?: FieldType;
  label?: string;
  required?: boolean;
  multiple?: boolean;
  maxLength?: number;
  min?: number;
  placeholder?: string;
  autoFocus?: boolean;
  mode?: 'create' | 'update' | 'detail';
  iconClass?: string;
  disabled?: boolean;
  onChange?: (e: any) => void;
  caption?: string;
  showCaption?: boolean;
  maxWidth?: string;
  selectProps?: ISelectProps;
  calendarProps?: ICalendarProps;
  style?: React.CSSProperties;
};

export const FieldTemplate: React.FC<FieldTemplateProps> = ({
  inputRef,
  name,
  value,
  setValue,
  type = FieldType.TEXT,
  label,
  required = false,
  maxLength,
  autoFocus,
  placeholder,
  disabled,
  iconClass,
  onChange,
  caption,
  showCaption,
  maxWidth = '30rem',
  calendarProps,
  selectProps,
  style,
}): React.ReactElement => {
  const inputContainerRef = React.useRef<HTMLDivElement>(null);

  const nameRef = name || `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  const [filterValue, setFilterValue] = React.useState('');
  const [filterOptions, setFilterOptions] = React.useState<any[]>([]);
  const [options, setOptions] = React.useState<any[]>(selectProps?.options || []);
  const [expandedKeys, setExpandedKeys] = React.useState<{ [key: number]: boolean }>({});
  const [selectOptions, setSelectOptions] = React.useState<any[]>(options || []);

  const mergedSelectProps = {
    optionLabel: 'name',
    optionValue: 'id',
    showClear: !!value,
    ...selectProps,
  };

  const mergedCalendarProps = {
    showTime: false,
    showSeconds: false,
    dateFormatDetail: 'DD/MM/YYYY',
    selectionMode: 'single' as 'single' | 'range' | 'multiple',
    ...calendarProps,
  };

  React.useEffect(() => {
    if (options.length) setSelectOptions(options);
  }, [options]);

  const focusFilterInput = () => {
    const inputElement = inputContainerRef.current?.querySelector('input');
    if (inputElement) {
      inputElement.focus();
    }
  };

  const search = (event: AutoCompleteCompleteEvent) => {
    // Timeout to emulate a network connection
    setTimeout(() => {
      let _filteredCountries;

      if (!event.query.trim().length) {
        _filteredCountries = [...filterOptions];
      } else {
        _filteredCountries = mergedSelectProps?.options.filter((item: Record<string, any>) => {
          return mergedSelectProps?.optionLabel
            ? item[mergedSelectProps.optionLabel]?.toLowerCase().includes(event.query.toLowerCase())
            : item.includes(event.query.toLowerCase());
        });
      }
      setFilterOptions(_filteredCountries);
    }, 250);
  };

  const findParentNode = (nodes: TreeNode[], key: number): TreeNode | null => {
    for (const node of nodes) {
      if (node.key === key) {
        return node;
      }
      if (node.children) {
        const found = findParentNode(node.children, key);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  const headerTemplate = (): React.ReactNode => {
    const expanseParent = (data: TreeNode[], key: number, newExpandedKeys: Record<number, boolean>) => {
      const parent = findParentNode(data, key);
      if (parent) {
        newExpandedKeys[parent.key as number] = true;
      }
    };

    const filterTreeData = (data: TreeNode[], filter: string): TreeNode[] => {
      const newExpandedKeys: { [key: number]: boolean } = {};

      const filteredData = data
        .map((node) => {
          if (node.children) {
            const filteredChildren = filterTreeData(node.children, filter);
            if (filteredChildren.length > 0 || toLower(node.label ?? '').includes(filter)) {
              expanseParent(data, node.key as number, newExpandedKeys);
              return { ...node, children: filteredChildren };
            }
          } else if (toLower(node.label ?? '').includes(filter)) {
            return node;
          }
          return null;
        })
        .filter((node) => node !== null) as TreeNode[];

      setExpandedKeys((prevKeys) => ({ ...prevKeys, ...newExpandedKeys }));
      return filteredData;
    };

    return (
      <div className={'w-full px-2'}>
        <AppInputText
          inputId={name + 'filter'}
          id={name + 'filter'}
          value={filterValue}
          onChange={(e) => {
            const filter = toLower(e.target.value.trim());
            setFilterValue(filter);
            setSelectOptions(filterTreeData(options, filter));
          }}
        />
      </div>
    );
  };

  const expandParent = (key: number) => {
    const findPath = (nodes: TreeNode[], targetKey: number, path: number[] = []): number[] | null => {
      for (const node of nodes) {
        const currentPath = [...path, node.key as number];
        if (node.key === targetKey) {
          return currentPath;
        }
        if (node.children) {
          const result = findPath(node.children, targetKey, currentPath);
          if (result) {
            return result;
          }
        }
      }
      return null;
    };

    const path = findPath(options, key);
    if (path) {
      const expandedKeys = path.slice(0, -1).reduce(
        (acc, key) => {
          acc[key] = true;
          return acc;
        },
        {} as { [key: number]: boolean }
      );
      setExpandedKeys(expandedKeys);
    }
  };

  const renderField = () => {
    switch (type) {
      case FieldType.SELECT:
        return (
          <AppSelect
            {...mergedSelectProps}
            inputRef={inputRef}
            inputId={nameRef}
            id={nameRef}
            value={value}
            placeholder={placeholder || 'Lựa chọn'}
            options={mergedSelectProps.options || []}
            label={label}
            filter
            showFilterClear
            autoFocus={autoFocus}
            emptyMessage="Không có dữ liệu"
            emptyFilterMessage="Không có dữ liệu"
            resetFilterOnHide
            required={required}
            disabled={disabled}
            caption={caption}
            showCaption={showCaption}
            style={style}
            onChange={(e) => {
              if (e.value === undefined) {
                if (setValue) {
                  setValue(null);
                }
              } else {
                if (setValue) {
                  setValue(e.value);
                }
              }
              if (onChange) {
                onChange(e);
              }
            }}
          />
        );
      case FieldType.CALENDAR:
        return (
          <AppCalendar
            {...mergedCalendarProps}
            inputRef={inputRef}
            inputId={nameRef}
            id={nameRef}
            value={value}
            onChange={(e) => {
              if (setValue) {
                setValue(e);
              }
              if (onChange) {
                onChange(e);
              }
            }}
            placeholder={placeholder || 'DD/MM/YYYY'}
            label={label}
            required={required}
            showIcon
            autoFocus={autoFocus}
            disabled={disabled}
            showOnFocus={false}
            style={style}
          />
        );
      case FieldType.TREE_SELECT:
        return (
          <AppTreeSelect
            inputRef={inputRef}
            inputId={name}
            id={name}
            value={value}
            options={selectOptions || []}
            expandedKeys={expandedKeys}
            label={label}
            placeholder={placeholder || 'Lựa chọn'}
            filter
            autoFocus={autoFocus}
            panelClassName={'field-template-tree-select'}
            filterValue={filterValue}
            filterTemplate={headerTemplate}
            emptyMessage={'Không có dữ liệu'}
            style={{ boxSizing: 'border-box', content: 'none', alignItems: 'center' }}
            onChange={(e) => {
              if (setValue) {
                setValue(e.value);
              }
              if (onChange) {
                onChange(e);
              }
            }}
            onHide={() => {
              setFilterValue('');
              setOptions(selectProps?.options || []);
              setExpandedKeys({});
            }}
            clearIcon={
              <i
                className="pi pi-times"
                style={{ marginRight: '-10px', zIndex: 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (setValue) setValue(selectProps?.defaultValue || null);
                }}
              ></i>
            }
            resetFilterOnHide
            showClear={value !== selectProps?.defaultValue}
            onShow={() => {
              focusFilterInput();
              expandParent(value);
            }}
            onToggle={(e) => {
              setExpandedKeys(e.value);
            }}
          />
        );
      case FieldType.AUTOCOMPLETE:
        return (
          <AutoComplete
            field={selectProps?.optionLabel || 'name'}
            value={value}
            completeMethod={search}
            suggestions={filterOptions}
            onChange={(e) => {
              if (setValue) {
                setValue(e.value);
              }
              if (onChange) {
                onChange(e);
              }
            }}
          />
        );
      default:
        return (
          <AppInputText
            inputId={nameRef}
            id={nameRef}
            value={value}
            label={label}
            required={required}
            autoFocus={autoFocus}
            maxLength={maxLength || 255}
            placeholder={placeholder}
            disabled={disabled}
            iconClass={iconClass}
            caption={caption}
            showCaption={showCaption}
            onChange={(e) => {
              if (setValue) {
                setValue(e.target.value);
              }
              if (onChange) {
                onChange(e);
              }
            }}
            onBlur={(e) => {
              if (setValue) {
                setValue(e.target.value.trim());
              }
            }}
          />
        );
    }
  };

  return <div style={{ maxWidth: maxWidth }}>{renderField()}</div>;
};
