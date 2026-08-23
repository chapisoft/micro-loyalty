export const getStyle = (statusId: number, theme: string = 'dark') => {
  if (theme === 'dark') {
    switch (statusId) {
      case 1:
        return {
          color: '#bebebe',
          border: '1px solid #bebebe',
          background: 'transparent',
        };
      case 2:
      case 3:
        return {
          color: '#84c3ff',
          border: '1px solid #84c3ff',
          background: 'transparent',
        };
      case 4:
        return {
          color: '#5DD820',
          border: '1px solid #5DD820',
          background: 'transparent',
        };
      case 5:
        return {
          color: '#ffa7a3',
          border: '1px solid #ffa7a3',
          background: 'transparent',
        };
      default:
        return {};
    }
  } else {
    switch (statusId) {
      case 1:
        return {
          color: '#686868',
          border: '1px solid #686868',
          background: 'transparent',
        };
      case 2:
      case 3:
        return {
          color: '#186ab8',
          border: '1px solid #186ab8',
          background: 'transparent',
        };
      case 4:
        return {
          color: '#337712',
          border: '1px solid #337712',
          background: 'transparent',
        };
      case 5:
        return {
          color: '#ab4a46',
          border: '1px solid #ab4a46',
          background: 'transparent',
        };
      default:
        return {};
    }
  }
};

export const getStatusName = (statusId: number | null) => {
  switch (statusId) {
    case 0:
    case null:
    case 1:
      return 'Chờ tiếp nhận';
    case 2:
      return 'Đã tiếp nhận';
    case 3:
      return 'Chờ phê duyệt kết quả';
    case 4:
      return 'Hoàn thành';
    case 5:
      return 'Từ chối phê duyệt kết quả';
    default:
      return 'Chưa tiếp nhận';
  }
};

export function mapSortOrder(order: string): 1 | 0 | -1 | null | undefined {
  switch (order) {
    case 'asc':
      return 1;
    case 'desc':
      return -1;
    default:
      return null;
  }
}

export function reverseMapSortOrder(order: 1 | 0 | -1 | null | undefined): string {
  switch (order) {
    case 1:
      return 'true';
    case -1:
      return 'false';
    default:
      return '';
  }
}

export const truncateContent = (content: string, length: number = 150) => {
  if (!content) return '';
  const maxLines = 5;
  const maxCharsPerLine = length;
  const maxChars = maxLines * maxCharsPerLine;

  if (content.length > maxChars) {
    return content.slice(0, maxChars) + '...';
  }
  return content;
};

export const truncateTitle = (content: string, length: number = 50) => {
  const maxLines = 1;
  const maxCharsPerLine = length;
  const maxChars = maxLines * maxCharsPerLine;

  if (content.length > maxChars) {
    return content.slice(0, maxChars) + '...';
  }
  return content;
};

export const hasNoSpaces = (str: string) => {
  return !/\s/.test(str);
};
