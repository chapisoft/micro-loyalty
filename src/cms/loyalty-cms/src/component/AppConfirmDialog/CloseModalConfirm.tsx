import React from 'react';
import { AppConfirmDialog } from 'components';

interface ConfirmDialogProps {
  visible: boolean;
  acceptAction: () => void;
  rejectAction: () => void;
}

const CloseModalConfirm: React.FC<ConfirmDialogProps> = ({ visible, acceptAction, rejectAction }) => {
  return (
    <AppConfirmDialog
      {...{
        message: `Các thay đổi vẫn chưa được lưu, bạn có chắc chắn muốn đóng?`,
        header: 'Đóng màn hình?',
        icon: 'ti ti-info-circle',
        acceptLabel: 'Đóng màn hình',
        accept: () => {
          acceptAction();
        },
        acceptIcon: 'ti ti-check',
        rejectLabel: 'Huỷ',
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
