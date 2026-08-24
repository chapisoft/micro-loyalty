import { DateFormat } from '@/constants';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

export const convertToDateTimeFormat = (date?: string | Date | null, format: string = DateFormat.DATE) => {
  if (!date) return '';
  return dayjs(date).format(format);
};

export const convertToUTCDate = (date?: Date) => {
  return dayjs(date).format('Z');
};

export function convertToInstantString(date?: Date | string | null): string | undefined {
  if (!date) return undefined;
  return dayjs(date).utc().toISOString();
}

export function convertUnknownDateString(value?: string, formatOutput?: string): Date | string | undefined {
  if (!value) return undefined;

  const nativeDate = new Date(value);
  if (!isNaN(nativeDate.getTime())) {
    if (formatOutput) return dayjs(nativeDate).format(formatOutput);
    return nativeDate;
  }

  const formats = [
    'YYYY-MM-DDTHH:mm:ss.SSSZ',
    'YYYY-MM-DDTHH:mm:ss.SSS',
    'YYYY-MM-DDTHH:mm:ssZ',
    'YYYY-MM-DDTHH:mm:ss',
    'DD/MM/YYYY HH:mm:ss',
    'DD/MM/YYYY HH:mm',
    'DD/MM/YYYY',
  ];
  for (const format of formats) {
    const date = dayjs(value, format);
    if (date.isValid()) {
      if (formatOutput) return dayjs(date).format(formatOutput);
      return date.toDate();
    }
  }
  return undefined;
}
