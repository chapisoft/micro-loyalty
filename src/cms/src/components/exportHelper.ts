import * as XLSX from 'xlsx';

export interface ExportColumnDef {
  header: string;
  field?: string;
  key?: string;
  getValue?: (row: any) => any;
}

export function exportToExcel(
  arg1: any[] | ExportColumnDef[],
  arg2: any[] | ExportColumnDef[],
  filename: string
): void {
  let columns: ExportColumnDef[];
  let data: any[];

  if (Array.isArray(arg1) && arg1.length > 0 && typeof (arg1[0] as any)?.header === 'string') {
    columns = arg1 as ExportColumnDef[];
    data = (arg2 as any[]) || [];
  } else {
    data = (arg1 as any[]) || [];
    columns = (arg2 as ExportColumnDef[]) || [];
  }

  if (!data || data.length === 0) {
    return;
  }

  const exportRows = data.map((row, index) => {
    const rowObj: Record<string, any> = {};
    columns.forEach((col) => {
      let val: any = '';
      if (col.getValue) {
        val = col.getValue(row);
      } else if (col.field && row[col.field] !== undefined) {
        val = row[col.field];
      } else if (col.key && row[col.key] !== undefined) {
        val = row[col.key];
      } else if (col.header === 'STT' || col.header === '#') {
        val = index + 1;
      }
      rowObj[col.header] = val !== undefined && val !== null ? val : '';
    });
    return rowObj;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, cleanFilename);
}

export function exportToCsv(
  arg1: any[] | ExportColumnDef[],
  arg2: any[] | ExportColumnDef[],
  filename: string
): void {
  let columns: ExportColumnDef[];
  let data: any[];

  if (Array.isArray(arg1) && arg1.length > 0 && typeof (arg1[0] as any)?.header === 'string') {
    columns = arg1 as ExportColumnDef[];
    data = (arg2 as any[]) || [];
  } else {
    data = (arg1 as any[]) || [];
    columns = (arg2 as ExportColumnDef[]) || [];
  }

  if (!data || data.length === 0) {
    return;
  }

  const exportRows = data.map((row, index) => {
    const rowObj: Record<string, any> = {};
    columns.forEach((col) => {
      let val: any = '';
      if (col.getValue) {
        val = col.getValue(row);
      } else if (col.field && row[col.field] !== undefined) {
        val = row[col.field];
      } else if (col.key && row[col.key] !== undefined) {
        val = row[col.key];
      } else if (col.header === 'STT' || col.header === '#') {
        val = index + 1;
      }
      rowObj[col.header] = val !== undefined && val !== null ? val : '';
    });
    return rowObj;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const cleanFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.setAttribute('download', cleanFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
