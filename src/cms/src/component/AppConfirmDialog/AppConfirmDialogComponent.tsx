// components/AppConfirmDialogComponent.tsx
import React from 'react';
import { AppConfirmDialog } from 'components';
import { t } from 'i18next';

interface ConfirmDialogProps {
  message?: string;
  header?: string;
  icon?: string;
  acceptLabel?: string;
  accept: () => void;
  reject: () => void;
  loading: boolean;
  visible: boolean; // Explicitly typed as boolean
  acceptIcon?: string;
  rejectIcon?: string;
  rejectLabel?: string; // Added rejectLabel property
  severity?: 'info' | 'success' | 'warning' | 'danger';
  autoFocus?: 'accept' | 'reject';
}

export const AppConfirmDialogComponent: React.FC<ConfirmDialogProps> = ({
  message = t('are_you_sure_you_want_to_delete'),
  header = t('delete'),
  icon = 'ti ti-alert-triangle',
  acceptLabel = t('delete'),
  accept,
  reject,
  loading,
  visible,
  acceptIcon = 'ti ti-trash',
  rejectLabel = t('cancel'),
  rejectIcon = 'ti ti-x',
  severity = undefined,
  autoFocus = 'reject',
}) => {
  return (
    <AppConfirmDialog
      message={message}
      header={header}
      icon={icon}
      acceptLabel={acceptLabel}
      accept={accept}
      reject={reject}
      onHide={reject}
      acceptIcon={acceptIcon}
      rejectLabel={rejectLabel}
      rejectIcon={rejectIcon}
      visible={visible}
      loading={loading}
      acceptButtonProps={{
        severity: severity,
        disabled: loading,
        autoFocus: autoFocus === 'accept',
      }}
      rejectButtonProps={{
        disabled: loading,
        autoFocus: autoFocus === 'reject',
      }}
    />
  );
};
