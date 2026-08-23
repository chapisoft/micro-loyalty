export function formatCurrency(amount?: number | string) {
  if (amount === null || amount === undefined) {
    return '';
  }
  const value = Math.floor(parseFloat(amount.toString()));

  return value.toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
