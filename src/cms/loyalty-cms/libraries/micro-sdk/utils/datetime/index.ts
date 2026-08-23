// Format constants
export const DATE_FORMAT = 'DD/MM/YYYY';
export const TIME_FORMAT = 'HH:mm:ss';
export const DATE_TIME_FORMAT = `${DATE_FORMAT} ${TIME_FORMAT}`;

// using dayjs for other conversions
export const timeFromNow = (date: string) => {
  const now = new Date().getTime();
  const timeInput = new Date(date).getTime();
  const m = (now - timeInput) / 1000;
  if (m < 60) {
    return 'Vừa xong';
  }
  if (m >= 60 && m < 3600) {
    return `${Math.floor(m / 60)} phút trước`;
  }
  if (m >= 3600 && m < 86400) {
    return `${Math.floor(m / 3600)} giờ trước`;
  }
  if (m >= 86400 && m < 2592000) {
    return `${Math.floor(m / 86400)} ngày trước`;
  }
  if (m >= 2592000 && m < 31536000) {
    return `${Math.floor(m / 2592000)} tháng trước`;
  }
  if (m >= 31536000) {
    return `${Math.floor(m / 31536000)} năm trước`;
  }
  return '';
};
