import React from 'react';
import { Tag } from 'primereact/tag';
import { useTranslation } from 'react-i18next';

export type BadgeSeverity = 'success' | 'info' | 'warning' | 'danger' | 'secondary';

// Dictionary mapping for common statuses to Vietnamese lowercase label & severity
const STATUS_CONFIG_MAP: Record<string, { label: string; severity: BadgeSeverity }> = {
  // Active / Success / Approved
  ACTIVE: { label: 'Hoạt động', severity: 'success' },
  ENABLE: { label: 'Hoạt động', severity: 'success' },
  ENABLED: { label: 'Hoạt động', severity: 'success' },
  SUCCESS: { label: 'Thành công', severity: 'success' },
  SUCCEEDED: { label: 'Thành công', severity: 'success' },
  APPROVED: { label: 'Đã phê duyệt', severity: 'success' },
  RESOLVED: { label: 'Đã giải quyết', severity: 'success' },
  UP: { label: 'Hoạt động tốt', severity: 'success' },
  PAID: { label: 'Đã thanh toán', severity: 'success' },
  COMPLETED: { label: 'Hoàn tất', severity: 'success' },
  SENT: { label: 'Đã gửi', severity: 'success' },
  SETTLED: { label: 'Đã quyết toán', severity: 'success' },
  ELIGIBLE: { label: 'Đủ điều kiện', severity: 'success' },
  ONLINE: { label: 'Trực tuyến', severity: 'success' },
  VALID: { label: 'Hợp lệ', severity: 'success' },
  TRUE: { label: 'Kích hoạt', severity: 'success' },

  // Inactive / Disabled / Draft
  INACTIVE: { label: 'Ngừng hoạt động', severity: 'secondary' },
  DISABLE: { label: 'Ngừng hoạt động', severity: 'secondary' },
  DISABLED: { label: 'Ngừng hoạt động', severity: 'secondary' },
  DRAFT: { label: 'Bản nháp', severity: 'secondary' },
  CANCELLED: { label: 'Đã hủy', severity: 'secondary' },
  CANCELED: { label: 'Đã hủy', severity: 'secondary' },
  CLOSED: { label: 'Đã đóng', severity: 'secondary' },
  INELIGIBLE: { label: 'Chưa đạt', severity: 'secondary' },
  FALSE: { label: 'Vô hiệu', severity: 'secondary' },

  // Pending / Processing / Warning
  PENDING: { label: 'Chờ xử lý', severity: 'warning' },
  PENDING_APPROVAL: { label: 'Chờ phê duyệt', severity: 'warning' },
  PENDING_CONFIRM: { label: 'Chờ xác nhận', severity: 'warning' },
  PROCESSING: { label: 'Đang xử lý', severity: 'warning' },
  IN_PROGRESS: { label: 'Đang tiến hành', severity: 'warning' },
  INVESTIGATING: { label: 'Đang xác minh', severity: 'warning' },
  GRACE_PERIOD: { label: 'Thời gian ân hạn', severity: 'warning' },
  SUPPRESSED: { label: 'Bị chặn', severity: 'warning' },
  PARTNER_CONFIRMED: { label: 'Đối tác đã xác nhận', severity: 'warning' },
  DEGRADED: { label: 'Suy giảm hiệu năng', severity: 'warning' },
  WARNING: { label: 'Cảnh báo', severity: 'warning' },
  HIGH: { label: 'Mức cao', severity: 'warning' },
  MEDIUM: { label: 'Trung bình', severity: 'warning' },

  // Danger / Error / Rejected / Locked
  REJECTED: { label: 'Từ chối', severity: 'danger' },
  FAILED: { label: 'Thất bại', severity: 'danger' },
  ERROR: { label: 'Lỗi', severity: 'danger' },
  LOCKED: { label: 'Đã khóa', severity: 'danger' },
  BLOCKED: { label: 'Bị khóa', severity: 'danger' },
  EXPIRED: { label: 'Hết hạn', severity: 'danger' },
  DISPUTED: { label: 'Đang khiếu nại', severity: 'danger' },
  DOWN: { label: 'Gián đoạn dịch vụ', severity: 'danger' },
  CRITICAL: { label: 'Nghiêm trọng', severity: 'danger' },
  INVALID: { label: 'Không hợp lệ', severity: 'danger' },

  // Info
  OPEN: { label: 'Mới tạo', severity: 'info' },
  NEW: { label: 'Mới', severity: 'info' },
  INFO: { label: 'Thông tin', severity: 'info' },
  LOW: { label: 'Mức thấp', severity: 'info' },
};

// Dictionary mapping for Types
const TYPE_CONFIG_MAP: Record<string, { label: string; severity: BadgeSeverity }> = {
  // Transaction action types
  EARN: { label: 'Tích điểm', severity: 'success' },
  BURN: { label: 'Tiêu điểm', severity: 'danger' },
  REWARD: { label: 'Đổi thưởng', severity: 'info' },
  SPIN: { label: 'Vòng quay', severity: 'warning' },
  VOUCHER: { label: 'Mã ưu đãi', severity: 'info' },
  REFUND: { label: 'Hoàn điểm', severity: 'info' },
  EXPIRE: { label: 'Hết hạn điểm', severity: 'secondary' },
  ADJUST: { label: 'Điều chỉnh điểm', severity: 'warning' },

  // Audit / Change types
  INSERT: { label: 'Thêm mới', severity: 'success' },
  CREATE: { label: 'Thêm mới', severity: 'success' },
  UPDATE: { label: 'Cập nhật', severity: 'info' },
  DELETE: { label: 'Xóa', severity: 'danger' },

  // Target Types
  SYSTEM_PARAM: { label: 'Tham số hệ thống', severity: 'secondary' },
  TIER: { label: 'Hạng hội viên', severity: 'info' },
  POLICY: { label: 'Chính sách', severity: 'info' },
  CAMPAIGN: { label: 'Chiến dịch', severity: 'warning' },
  PARTNER: { label: 'Đối tác', severity: 'info' },

  // Business Category / Type
  RETAIL: { label: 'Bán lẻ', severity: 'info' },
  TELECOM: { label: 'Viễn thông', severity: 'info' },
  FNB: { label: 'Ẩm thực', severity: 'warning' },
  ENTERTAINMENT: { label: 'Giải trí', severity: 'secondary' },
  SERVICE: { label: 'Dịch vụ', severity: 'secondary' },

  // Frequencies / Reports
  DAILY: { label: 'Hằng ngày', severity: 'secondary' },
  WEEKLY: { label: 'Hằng tuần', severity: 'secondary' },
  MONTHLY: { label: 'Hằng tháng', severity: 'secondary' },
  YEARLY: { label: 'Hằng năm', severity: 'secondary' },
  TRANSACTION: { label: 'Giao dịch', severity: 'info' },
  CUSTOMER: { label: 'Hội viên', severity: 'info' },
  SETTLEMENT: { label: 'Quyết toán', severity: 'warning' },

  // Prize types
  POINTS: { label: 'Điểm thưởng', severity: 'success' },
  TURN: { label: 'Lượt quay', severity: 'warning' },
  ITEM: { label: 'Hiện vật', severity: 'info' },
};

export interface StatusBadgeProps {
  status?: string | number | boolean | null;
  label?: string;
  severity?: BadgeSeverity;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  severity,
  className = '',
}) => {
  const { t } = useTranslation();

  if (status === undefined || status === null) {
    return <span className="text-400">—</span>;
  }

  const rawKey = String(status).trim().toUpperCase();
  const config = STATUS_CONFIG_MAP[rawKey];

  // Resolve localized label
  let displayLabel = label;
  if (!displayLabel) {
    if (config) {
      displayLabel = t(`status.${rawKey}`, config.label);
    } else {
      displayLabel = t(`status.${rawKey}`, t(`common.${String(status).toLowerCase()}`, String(status)));
    }
  }

  const displaySeverity = severity || config?.severity || 'secondary';

  return (
    <Tag
      value={displayLabel}
      severity={displaySeverity}
      className={`font-normal ${className}`}
    />
  );
};

export interface TypeBadgeProps {
  type?: string | number | null;
  label?: string;
  severity?: BadgeSeverity;
  className?: string;
}

export const TypeBadge: React.FC<TypeBadgeProps> = ({
  type,
  label,
  severity,
  className = '',
}) => {
  const { t } = useTranslation();

  if (type === undefined || type === null) {
    return <span className="text-400">—</span>;
  }

  const rawKey = String(type).trim().toUpperCase();
  const config = TYPE_CONFIG_MAP[rawKey];

  let displayLabel = label;
  if (!displayLabel) {
    if (config) {
      displayLabel = t(`type.${rawKey}`, config.label);
    } else {
      displayLabel = t(`type.${rawKey}`, String(type));
    }
  }

  const displaySeverity = severity || config?.severity || 'info';

  return (
    <Tag
      value={displayLabel}
      severity={displaySeverity}
      className={`font-normal ${className}`}
    />
  );
};

export default StatusBadge;
