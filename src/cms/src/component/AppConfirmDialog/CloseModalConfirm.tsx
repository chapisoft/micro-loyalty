import React from 'react';
import { AppConfirmDialog } from 'components';
import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  visible: boolean;
  acceptAction: () => void;
  rejectAction: () => void;
}

const CloseModalConfirm: React.FC<ConfirmDialogProps> = ({ visible, acceptAction, rejectAction }) => {
  const { t } = useTranslation();

  return (
    <AppConfirmDialog
      {...{
        message: t('modal.unsaved_changes_confirmation'),
        header: t('modal.close_screen'),
        icon: 'ti ti-info-circle',
        acceptLabel: t('modal.close_screen'),
        accept: () => {
          acceptAction();
        },
        acceptIcon: 'ti ti-check',
        rejectLabel: t('modal.cancel'),
        reject: () => {
          rejectAction();
        },
        rejectIcon: 'ti ti-x',
      }}
      loading={false}
      visible={visible}
    />
  );
};

export default CloseModalConfirm;

