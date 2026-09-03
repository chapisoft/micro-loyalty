import React, { ReactElement } from 'react';
import { FieldType } from '@/constants';
import {
  AppCalendar,
  AppEditor,
  AppFile,
  AppInputNumber,
  AppInputText,
  AppInputTextarea,
  AppLabel,
  AppMultiSelect,
  AppRadioButton,
  AppSelect,
  AppTreeSelect,
  FileObject,
} from 'components';
import dayjs from 'dayjs';
import { TreeNode } from 'primereact/treenode';
import { Control, Controller, ControllerFieldState, ControllerRenderProps } from 'react-hook-form';

import './form-field.style.scss';

import { t } from 'i18next';
import { toLower } from 'lodash';
import { VirtualScrollerProps } from 'primereact/virtualscroller';

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
  optionLabel?: string;
  optionValue?: string;
  itemTemplate?: (option: any) => React.ReactNode;
}

interface IUploadProps {
  accept?: string;
  uploadFileMutation?: any;
  uploadMultipleFiles?: any;
  autoUpload?: boolean;
  multiple?: boolean;
  service?: string;
}

type FormFieldProps = {
  name: string;
  control: Control<any>;
  type?: FieldType;
  label?: string;
  required?: boolean;
  multiple?: boolean;
  maxLength?: number;
  min?: number;
  options?: any;
  placeholder?: string;
  calendarProps?: ICalendarProps;
  selectProps?: ISelectProps;
  autoFocus?: boolean;
  mode?: 'CREATE' | 'UPDATE' | 'DETAIL';
  uploadProps?: IUploadProps;
  iconClass?: string;
  disabled?: boolean;
  onChange?: (e: any) => void;
  caption?: string;
  showCaption?: boolean;
  suffix?: string;
  loadMore?: () => void;
  virtualScrollerOptions?: VirtualScrollerProps;
  onSearch?: (key: string) => void;
  isLoading?: boolean;
  filter?: boolean;
  autoUpload?: boolean;
};

const FormField: React.FC<FormFieldProps> = ({
  name,
  control,
  type = FieldType.TEXT,
  mode = 'CREATE',
  label,
  required = false,
  maxLength,
  min,
  options = [],
  placeholder,
  disabled = false,
  autoFocus = false,
  iconClass,
  caption,
  showCaption,
  calendarProps = {
    showTime: false,
    showSeconds: false,
    dateFormatDetail: 'DD/MM/YYYY',
    selectionMode: 'single',
  },
  selectProps = {
    optionLabel: 'name',
    optionValue: 'id',
  },
  uploadProps,
  onChange,
  suffix,
  loadMore,
  virtualScrollerOptions,
  onSearch,
  isLoading,
  filter = true,
  autoUpload,
}) => {
  const [filterValue, setFilterValue] = React.useState('');
  const [selectOptions, setSelectOptions] = React.useState<any[]>(options || []);
  const [expandedKeys, setExpandedKeys] = React.useState<{ [key: number]: boolean }>({});
  const inputContainerRef = React.useRef<HTMLDivElement>(null);

  const mergedSelectProps = {
    optionLabel: 'name',
    optionValue: 'id',
    ...selectProps,
  };

  const mergedCalendarProps = {
    showTime: false,
    showSeconds: false,
    dateFormatDetail: 'DD/MM/YYYY',
    selectionMode: 'single' as 'single' | 'range' | 'multiple',
    ...calendarProps,
  };

  const mergeUploadProps = {
    autoUpload: true,
    multiple: true,
    accept: '.png, .jpg, .jpeg, .pdf, .xlsx, .xls, .doc, .docx, .ppt, .pptx',
    service: 'rs',
    ...uploadProps,
  };

  React.useEffect(() => {
    if (options.length) setSelectOptions(options);
  }, [options]);

  const headerTemplate = (): React.ReactNode => {
    const filterTreeData = (data: TreeNode[], filter: string): TreeNode[] => {
      const newExpandedKeys: { [key: string]: boolean } = {};

      const filteredData = data
        .map((node) => {
          if (node.children) {
            const filteredChildren = filterTreeData(node.children, filter);
            if (filteredChildren.length > 0 || toLower(node.label ?? '').includes(filter)) {
              newExpandedKeys[node.key as number] = true;
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

  const focusFilterInput = () => {
    const inputElement = inputContainerRef.current?.querySelector('input');
    if (inputElement) {
      inputElement.focus();
    }
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
  return (
    <div className={'form-field-container'}>
      <Controller
        name={name}
        control={control}
        render={({
          field,
          fieldState,
        }: {
          field: ControllerRenderProps<any, string>;
          fieldState: ControllerFieldState;
        }): ReactElement => {
          if (mode === 'DETAIL') {
            const renderDetailField = () => {
              switch (type) {
                case FieldType.EDITOR:
                  return <div className={'font-semibold'} dangerouslySetInnerHTML={{ __html: field.value || '-' }} />;
                case FieldType.FILE:
                  return (
                    <div className={'font-semibold'}>
                      {field.value?.length > 0
                        ? field.value.map((file: FileObject, index: number) => (
                            <div key={index} className={''}>
                              <a href={file.mediaHost + file.path} target="_blank" rel="noreferrer">
                                {file.fileName}
                              </a>
                            </div>
                          ))
                        : '-'}
                    </div>
                  );
                case FieldType.CALENDAR:
                  return (
                    <div className={'font-semibold'}>
                      {field.value ? dayjs(field.value).format(calendarProps?.dateFormatDetail) : '-'}
                    </div>
                  );
                case FieldType.SELECT: {
                  const selectedOption = options.find(
                    (option: any) => option[selectProps.optionValue || 'id'] === field.value
                  );
                  return (
                    <div className={'font-semibold'}>
                      {selectedOption ? selectedOption[selectProps?.optionLabel || 'name'] : '-'}
                    </div>
                  );
                }
                default:
                  return <div className={'font-semibold'}>{field.value || '-'}</div>;
              }
            };

            return (
              <>
                {label && <div className={'mb-2'}>{label}</div>}
                {renderDetailField()}
              </>
            );
          } else {
            switch (type) {
              case FieldType.TEXTAREA:
                return (
                  <AppInputTextarea
                    inputId={name}
                    id={name}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={(e) => field.onChange(e.target.value.trim())}
                    label={label}
                    required={required}
                    maxLength={maxLength || 2000}
                    autoFocus={autoFocus}
                    rows={5}
                    invalid={fieldState.invalid}
                    error={fieldState.error?.message}
                    disabled={disabled}
                  />
                );
              case FieldType.FILE:
                return (
                  <AppFile
                    {...mergeUploadProps}
                    inputId={name}
                    label={label}
                    required={required}
                    file={field.value}
                    files={field.value || []}
                    error={fieldState.error?.message}
                    onChange={(file: File) => {
                      field.onChange(file);
                    }}
                    disabled={disabled}
                    autoUpload={autoUpload}
                  />
                );
              case FieldType.SELECT:
                return (
                  <AppSelect
                    {...mergedSelectProps}
                    inputId={name}
                    id={name}
                    value={field.value}
                    options={options || []}
                    placeholder={placeholder || t('select')}
                    showClear
                    label={label}
                    filter={filter}
                    showFilterClear={false}
                    autoFocus={autoFocus}
                    emptyMessage={t('no_data_available')}
                    emptyFilterMessage={t('no_data_available')}
                    resetFilterOnHide={false}
                    onChange={(e) => {
                      if (e.value === undefined) {
                        field.onChange(null);
                      } else {
                        field.onChange(e.value);
                      }
                      if (onChange) {
                        onChange(e);
                      }
                    }}
                    required={required}
                    invalid={fieldState.invalid}
                    error={fieldState.error?.message}
                    disabled={disabled}
                    caption={caption}
                    showCaption={showCaption}
                    virtualScrollerOptions={{
                      onScrollIndexChange: (event) => {
                        const { last } = event;
                        if ((last as number) >= options.length - 1) {
                          loadMore?.();
                        }
                      },
                      itemSize: 38,
                      ...virtualScrollerOptions,
                    }}
                    onFilter={(e) => onSearch?.(e.filter)}
                    isLoadmore={isLoading}
                  />
                );
              case FieldType.MULTI_SELECT:
                return (
                  <AppMultiSelect
                    {...mergedSelectProps}
                    inputId={name}
                    id={name}
                    value={field.value}
                    options={options || []}
                    placeholder={placeholder || t('select')}
                    label={label}
                    filter={true}
                    display={'chip'}
                    showClear
                    resetFilterOnHide
                    autoFocus={autoFocus}
                    emptyMessage={t('no_data_available')}
                    emptyFilterMessage={t('no_data_available')}
                    panelStyle={{
                      maxWidth: 300,
                    }}
                    onChange={(e) => {
                      field.onChange(e.value);
                    }}
                    required={required}
                    invalid={fieldState.invalid}
                    error={fieldState.error?.message}
                    disabled={disabled}
                  />
                );
              case FieldType.TREE_SELECT:
                return (
                  <AppTreeSelect
                    inputId={name}
                    id={name}
                    value={field.value}
                    options={selectOptions || []}
                    expandedKeys={expandedKeys}
                    selectionMode="single"
                    label={label}
                    filter
                    placeholder={placeholder || t('select')}
                    filterTemplate={headerTemplate}
                    autoFocus={autoFocus}
                    style={{
                      boxSizing: 'border-box',
                      content: 'none',
                      alignItems: 'center',
                      borderColor: fieldState.invalid ? '#fca5a5' : '#424b57',
                    }}
                    onChange={(e) => {
                      field.onChange(e.value);
                      if (onChange) {
                        onChange(e);
                      }
                    }}
                    onHide={() => {
                      setFilterValue('');
                      setSelectOptions(options || []);
                      setExpandedKeys({});
                    }}
                    clearIcon={
                      <i
                        className="pi pi-times"
                        style={{ marginRight: '-10px', zIndex: 1 }}
                        onClick={() => {
                          field.onChange('');
                        }}
                      ></i>
                    }
                    resetFilterOnHide
                    panelClassName="form-field-tree-select"
                    showClear={field.value !== ''}
                    invalid={fieldState.invalid}
                    error={fieldState.error?.message}
                    required={required}
                    onShow={() => {
                      focusFilterInput();
                      expandParent(field.value);
                    }}
                    onToggle={(e) => {
                      setExpandedKeys(e.value);
                    }}
                  />
                );
              case FieldType.CALENDAR:
                return (
                  <AppCalendar
                    {...mergedCalendarProps}
                    inputId={name}
                    id={name}
                    value={field.value}
                    onChange={(e) => {
                      field.onChange(e);
                    }}
                    placeholder={placeholder || 'DD/MM/YYYY'}
                    label={label}
                    required={required}
                    showIcon
                    autoFocus={autoFocus}
                    invalid={fieldState.invalid}
                    error={fieldState.error?.message}
                    disabled={disabled}
                    showOnFocus={false}
                  />
                );
              case FieldType.EDITOR: {
                return (
                  <AppEditor
                    value={field.value ?? ''}
                    onTextChange={(e) => {
                      field.onChange(e.htmlValue);
                    }}
                    required={required}
                    label={label}
                    style={{ height: '15vh' }}
                    disabled={disabled}
                  />
                );
              }
              case FieldType.RADIO:
                return (
                  <AppLabel inputId={name} label={label} required={required} error={fieldState.error?.message}>
                    <div className={'flex gap-4 align-items-center mt-2'}>
                      {options.map((item: any, index: number) => (
                        <div key={index} className={'flex align-items-center'}>
                          <AppRadioButton
                            inputId={item.id}
                            value={item.id}
                            checked={field.value === item.id}
                            disabled={disabled}
                            onChange={() => {
                              field.onChange(item.id);
                            }}
                          />
                          <label htmlFor={item.id} className="ml-2">
                            {item.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </AppLabel>
                );
              case FieldType.NUMBER:
                return (
                  <AppInputNumber
                    inputId={name}
                    id={name}
                    value={field.value}
                    label={label}
                    onChange={(e) => field.onChange(e.value)}
                    required={required}
                    maxLength={maxLength || 9}
                    min={min}
                    placeholder={placeholder ?? `${t('enter')} ${(label ?? '')?.toLowerCase()}`}
                    invalid={fieldState.invalid}
                    error={fieldState.error?.message}
                    disabled={disabled}
                    iconClass={iconClass}
                    suffix={suffix}
                  />
                );
              default:
                return (
                  <AppInputText
                    inputId={name}
                    id={name}
                    value={field.value}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      if (onChange) {
                        onChange(e);
                      }
                    }}
                    onBlur={(e) => field.onChange(e.target.value.trim())}
                    label={label}
                    required={required}
                    autoFocus={autoFocus}
                    maxLength={maxLength || 255}
                    invalid={fieldState.invalid}
                    error={fieldState.error?.message}
                    placeholder={placeholder ?? `${t('enter')} ${(label ?? '')?.toLowerCase()}`}
                    disabled={disabled}
                    iconClass={iconClass}
                  />
                );
            }
          }
        }}
      />
    </div>
  );
};

export default FormField;
