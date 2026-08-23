import React, { useState } from 'react';

import { Column, ColumnProps } from 'primereact/column';
import { DataTable, DataTableProps, DataTableStateEvent, DataTableValueArray, SortOrder } from 'primereact/datatable';
import './table.scss';
import { isNullOrUndefined } from 'is-what';
import { t } from 'i18next';
export interface HeaderSchema {
  sortableColumn?: boolean;
  minWidth?: string | number;
  maxWidth?: string | number;
  width?: string | number;
  show?: boolean;
  columnProps?: ColumnProps;
}

export interface ActionSchema extends Omit<HeaderSchema, 'field'> {}

type AppTableProps<TValue extends DataTableValueArray> = Omit<DataTableProps<TValue>, 'value'> & {
  tableData: TValue;
  tableTitle?: string;
  totalRecords?: number;
  headerSchema: HeaderSchema[];
  buttonsTemplate?: any;
  hasActions?: boolean;
  actionSchema?: ActionSchema;
  onSort?: (data: { orderBy: string; orderDirection: string }) => void;
  emptyMessage?: React.ReactNode;
  rowsPerPageOptions?: number[];
};

const AppTable: React.FC<AppTableProps<DataTableValueArray>> = ({
  tableTitle = '',
  totalRecords = 0,
  headerSchema = [],
  buttonsTemplate,
  hasActions = false,
  actionSchema = null,
  onSort,
  first,
  rows,
  emptyMessage,
  rowsPerPageOptions = [10, 20, 50, 100],
  ...props
}) => {
  const [sortField, setSortField] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<SortOrder>(0);

  // if field is clicked three times, reset sort
  const [fieldCount, setFieldCount] = useState<{ field: string; clickedCount: number }>({
    field: '',
    clickedCount: 0,
  });

  const handleSort = (event: DataTableStateEvent) => {
    const value = {
      orderBy: event.sortField,
      orderDirection: event.sortOrder === 1 ? 'asc' : 'desc',
    };

    if (event.sortField === fieldCount.field) {
      const currentClickedCount = fieldCount.clickedCount + 1;

      setFieldCount((prev) => ({
        ...prev,
        clickedCount: currentClickedCount,
      }));

      if (currentClickedCount === 3) {
        setSortField('');
        setSortOrder(0);
        setFieldCount((prev) => ({
          ...prev,
          clickedCount: 0,
        }));
        onSort?.({ orderBy: '', orderDirection: '' });
      } else {
        if (currentClickedCount === 1) {
          setSortOrder(1);
        }
        if (currentClickedCount === 2) {
          setSortOrder(-1);
        }
        setSortField(event.sortField);
        onSort?.(value);
      }
    } else {
      setFieldCount({
        field: event.sortField,
        clickedCount: 1,
      });

      setSortField(event.sortField);
      setSortOrder(event.sortOrder);
      onSort?.(value);
    }
  };

  return (
    <>
      <div>
        {(tableTitle || buttonsTemplate) && (
          <div className="flex justify-content-between align-items-center mb-3">
            <div className="flex align-items-center">
              {tableTitle ? (
                <h5 className="m-0">{tableTitle + (totalRecords ? ' (' + totalRecords + ')' : '')}</h5>
              ) : null}
            </div>
            <div className="flex align-items-center gap-2">{buttonsTemplate}</div>
          </div>
        )}
        <DataTable
          dataKey="id"
          value={props.tableData}
          rowHover
          lazy
          paginator={true}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink JumpToPageInput RowsPerPageDropdown"
          rowsPerPageOptions={rowsPerPageOptions}
          first={first}
          rows={rows}
          paginatorLeft={
            !isNullOrUndefined(first) &&
            !isNullOrUndefined(rows) && (
              <div>
                {t('display')} {first + 1}-{first + rows < totalRecords ? first + rows : totalRecords}/ {totalRecords} {t('records')}
              </div>
            )
          }
          emptyMessage={emptyMessage ?? <div className="flex justify-content-center ">{t('no_data_available')}</div>}
          totalRecords={totalRecords}
          onSort={handleSort}
          sortField={sortField}
          sortOrder={sortOrder}
          {...Object.fromEntries(Object.entries(props).filter(([k]) => k !== 'tableData'))}
        >
          {/* Render checkbox column if selectionMode is set */}
          {props.selectionMode === 'checkbox' || props.selectionMode === 'multiple' ? (
            <Column selectionMode="multiple" style={{ width: '3em' }} />
          ) : null}
          {headerSchema.map((headerItem: HeaderSchema, index: number) =>
            headerItem.show ? (
              <Column
                headerStyle={{
                  borderTop: '1px solid var(--surface-d)',
                }}
                key={index}
                sortable={Boolean(headerItem.columnProps?.field && headerItem.sortableColumn)}
                style={{
                  width: headerItem.width,
                  minWidth: headerItem.minWidth,
                  maxWidth: headerItem.maxWidth,
                }}
                {...headerItem.columnProps}
              ></Column>
            ) : null
          )}
          {hasActions && actionSchema && (
            <Column
              headerStyle={{
                borderTop: '1px solid var(--surface-d)',
              }}
              style={{
                width: actionSchema.width,
                minWidth: actionSchema.minWidth,
                maxWidth: actionSchema.maxWidth,
              }}
              {...actionSchema.columnProps}
            ></Column>
          )}
        </DataTable>
      </div>
    </>
  );
};

export { AppTable };
