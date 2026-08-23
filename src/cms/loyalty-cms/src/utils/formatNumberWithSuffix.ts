import numeral from 'numeral';

export function formatNumberWithSuffix(num: number): string {
  if (num >= 10000) {
    return numeral(num).format('0.0a');
  } else {
    return numeral(num).format('0,0');
  }
}
