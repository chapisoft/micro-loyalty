import { Dialog, DialogProps } from 'primereact/dialog';
import React, { ReactNode } from 'react';
import { AppButton } from './button.tsx';

interface AppDialogProps extends DialogProps {
  acceptLabel?: string;
  accept?: () => void;
  acceptIcon?: string;
  rejectLabel?: string;
  reject?: () => void;
  rejectIcon?: string;
  loading?: boolean;
  children?: ReactNode;
}

const AppDialog: React.FC<AppDialogProps> = ({
  header,
  visible,
  onHide,
  acceptLabel = 'OK',
  accept,
  acceptIcon,
  rejectLabel = 'Cancel',
  reject,
  rejectIcon,
  children,
  style = {},
  loading = false,
}) => {
  return (
    <Dialog header={header} visible={visible} style={{...style }} onHide={onHide}>
      <div className="dialog-content">{children}</div>
      <div className="dialog-footer flex justify-content-end gap-2">
        {reject && (
          <AppButton variant="close" onClick={reject} loading={loading} icon={rejectIcon} label={rejectLabel} />
        )}
        {accept && (
          <AppButton variant="update" onClick={accept} loading={loading} icon={acceptIcon} label={acceptLabel} />
        )}
      </div>
    </Dialog>
  );
};

export default AppDialog;
