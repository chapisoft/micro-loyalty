import React from 'react';
import { AppConfirmDialog } from 'components';
import { t } from 'i18next';

export interface IConfirmState {
  data?: any;
  loading: boolean;
  visible: boolean;
  message: string;
  header: string;
  acceptLabel: string;
  acceptAction: string;
  acceptIcon: string;
  autoFocus?: string;
  severity?: 'danger' | 'secondary' | 'success' | 'info' | 'warning' | 'help' | 'contrast';
}

type Props = {
  confirmState: IConfirmState;
  setConfirmState: (state: IConfirmState) => void;
  onAccept: (data: any, type: string) => void;
};

export function ConfirmActionDialog({ confirmState, setConfirmState, onAccept }: Props): React.JSX.Element {
  const handleAcceptConfirm = () => {
    onAccept(confirmState.data, confirmState.acceptAction);
  };

  return (
    <AppConfirmDialog
      {...{
        message: confirmState.message,
        header: confirmState.header,
        icon: 'ti ti-alert-triangle',
        acceptLabel: confirmState.acceptLabel,
        loading: confirmState.loading,
        acceptIcon: confirmState.acceptIcon,
        accept: () => {
          handleAcceptConfirm();
        },
        rejectLabel: t('button.cancel'),
        reject: () => {
          setConfirmState({ ...confirmState, visible: false, loading: false });
        },
        // rejectIcon: 'ti ti-x',
        acceptButtonProps: {
          severity: confirmState.severity,
          disabled: confirmState.loading,
          autoFocus: confirmState.autoFocus === 'accept',
        },
        rejectButtonProps: { autoFocus: confirmState.autoFocus !== 'accept' },
      }}
      loading={confirmState.loading}
      visible={confirmState.visible}
    />
  );
}
