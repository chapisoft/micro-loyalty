import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

export interface AppConfirmDialogProps {
  visible?: boolean;
  header?: string;
  title?: string;
  message?: string;
  icon?: string;
  acceptLabel?: string;
  rejectLabel?: string;
  acceptIcon?: string;
  rejectIcon?: string;
  accept?: () => void;
  onAccept?: () => void;
  reject?: () => void;
  onHide?: () => void;
  loading?: boolean;
  severity?: 'danger' | 'warning' | 'info' | 'primary';
  className?: string;
}

export const AppConfirmDialog: React.FC<AppConfirmDialogProps> = ({
  visible,
  header,
  title,
  message,
  icon,
  acceptLabel,
  rejectLabel,
  acceptIcon,
  rejectIcon,
  accept,
  onAccept,
  reject,
  onHide,
  loading,
  severity = 'danger',
  className,
}) => {
  const finalTitle = header || title || 'Xác nhận';
  const finalMessage = message || '';
  const handleAccept = accept || onAccept;
  const handleReject = reject || onHide;
  const finalAcceptLabel = acceptLabel || 'Xác nhận';
  const finalRejectLabel = rejectLabel || 'Hủy bỏ';

  return (
    <Dialog
      visible={visible}
      onHide={() => handleReject?.()}
      className={`max-w-30rem w-11 ${className || ''}`}
      closable={false}
      showHeader={false}
      style={{ borderRadius: '16px', overflow: 'hidden' }}
      contentStyle={{ padding: 0, borderRadius: '16px' }}
    >
      <div className="bg-white border-round-2xl p-4 shadow-3">
        {/* Header with Icon, Title and Close Button */}
        <div className="flex justify-content-between align-items-center mb-3">
          <div className="flex align-items-center gap-3">
            <div
              className={`flex align-items-center justify-content-center border-round-xl ${
                severity === 'danger'
                  ? 'bg-red-50 text-red-600'
                  : severity === 'warning'
                  ? 'bg-orange-50 text-orange-600'
                  : 'bg-blue-50 text-blue-600'
              }`}
              style={{ width: 44, height: 44 }}
            >
              <i className={icon || (severity === 'danger' ? 'pi pi-sign-out' : 'pi pi-question-circle')} style={{ fontSize: '1.4rem' }}></i>
            </div>
            <span className="font-bold text-xl text-900">{finalTitle}</span>
          </div>
          <Button
            icon="pi pi-times"
            rounded
            text
            size="small"
            severity="secondary"
            onClick={() => handleReject?.()}
            style={{ width: 34, height: 34 }}
          />
        </div>

        {/* Message Body */}
        <div className="py-2 mb-4 font-medium line-height-3" style={{ fontSize: '0.98rem', color: '#334155' }}>
          {finalMessage}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-content-end align-items-center gap-2 pt-3 border-top-1 surface-border">
          <Button
            label={finalRejectLabel}
            icon={rejectIcon}
            onClick={() => handleReject?.()}
            disabled={loading}
            outlined
            severity="secondary"
            className="px-4 py-2 font-medium"
            style={{ borderRadius: '8px' }}
          />
          <Button
            label={finalAcceptLabel}
            icon={acceptIcon}
            loading={loading}
            onClick={() => handleAccept?.()}
            severity={severity === 'danger' ? 'danger' : undefined}
            className="px-4 py-2 font-medium"
            style={{
              borderRadius: '8px',
              background: severity === 'danger' ? '#ef4444' : 'linear-gradient(135deg, #FF6B00 0%, #FF8800 100%)',
              borderColor: 'transparent',
              color: '#ffffff',
            }}
          />
        </div>
      </div>
    </Dialog>
  );
};
