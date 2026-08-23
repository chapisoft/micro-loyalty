import { Button, ButtonProps } from 'primereact/button';
import { useTranslation } from 'react-i18next';

interface AppButtonProps extends ButtonProps {
  variant?:
    | 'create'
    | 'update'
    | 'settings'
    | 'close'
    | 'close-confirm'
    | 'icon'
    | 'iview'
    | 'iupdate'
    | 'iconfig'
    | 'idelete' 
    | 'import'
    | 'export'
    | 'approve'
    | 'reject'
    | 'idownload'
    | 'iapprove'
    | 'ireject'
    | 'isave'
    | 'iViewQR'
    | null;

  dataChanges?: boolean;
}

const AppButton: React.FC<AppButtonProps> = ({ variant, dataChanges, ...props }: AppButtonProps) => {
  const { t } = useTranslation();
  const parentOnClick = props.onClick;
  const setButton = (): any => {
    switch (variant) {
      case 'create':
        return {
          label: t('button.create'),
          icon: 'ti ti-plus',
          className: 'min-w-125px',
        };
      case 'update':
        return {
          label: t('button.update'),
          icon: 'ti ti-check',
          className: 'max-w-125px',
        };
      case 'settings':
        return {
          icon: 'ti ti-settings',
          className: 'w-4rem',
        };
      case 'close':
        return {
          label: t('button.close'),
          icon: 'ti ti-x',
          className: 'p-button-outlined min-w-125px',
        };
      case 'close-confirm':
        return {
          label: t('button.close'),
          icon: 'ti ti-x',
          className: 'p-button-outlined min-w-125px',
          onClick: (event: any) => {
            parentOnClick?.(event);
            if (dataChanges) {
              // this.verificationService.saveVerification(() => {
              //   this.onClose.emit();
              // });
            } else {
              // this.onClose.emit();
            }
          },
        };

      case 'icon':
        return {
          className: 'w-2rem h-2rem p-button-rounded p-button-text text-color-secondary text-2xl',
        };
      case 'iview':
        return {
          icon: 'ti ti-eye',
          tooltip: t('button.view_detail'),
          className: 'w-2rem h-2rem p-button-rounded p-button-text text-color-secondary text-2xl',
        };
      case 'iupdate':
        return {
          icon: 'ti ti-edit',
          tooltip: t('button.update'),
          className: 'w-2rem h-2rem p-button-rounded p-button-text text-color-secondary text-2xl',
        };
      case 'iconfig':
        return {
          icon: 'ti ti-settings',
          tooltip: t('button.config'),
          className: 'w-2rem h-2rem p-button-rounded p-button-text text-color-secondary text-2xl',
        };
      case 'idelete':
        return {
          icon: 'ti ti-trash',
          tooltip: t('button.delete'),
          className: 'w-2rem h-2rem p-button-rounded p-button-text text-red-700 text-2xl btn-idelete',
        };

      case 'import':
        return {
          icon: 'pi pi-upload',
          label: t('button.import_list'),
          className: 'min-w-125px p-button-outlined border-none',
        };
      case 'export':
        return {
          icon: 'pi pi-download',
          label: t('button.export'),
          className: 'max-w-125px',
        };
      case 'approve':
        return {
          icon: 'pi pi-check',
          label: t('button.approve'),
          className: 'min-w-125px',
        };
      case 'reject':
        return {
          icon: 'pi pi-times',
          label: t('button.reject'),
          className: 'min-w-125px',
        };
      case 'idownload':
        return {
          icon: 'ti ti-download',
          tooltip: t('button.download'),
          className: 'w-2rem h-2rem p-button-rounded p-button-text text-color-secondary text-2xl',
        };
      case 'iapprove':
        return {
          icon: 'pi pi-check',
          tooltip: t('button.approve'),
          className: 'w-2rem h-2rem p-button-rounded p-button-text text-color-secondary text-2xl',
        };
      case 'ireject':
        return {
          icon: 'pi pi-times',
          tooltip: t('button.reject'),
          className: 'w-2rem h-2rem p-button-rounded p-button-text text-color-secondary text-2xl',
        };
      case 'isave':
        return {
          icon: 'pi pi-check',
          tooltip: t('button.save'),
          className: 'min-w-125px',
        };
      case 'iViewQR':
        return {
          icon: 'ti ti-qrcode',
          tooltip: t('button.view_qr'),
          className: 'w-2rem h-2rem p-button-rounded p-button-text text-color-secondary text-2xl',
        };
    }
  };

  return (
    <Button
      {...setButton()}
      {...props}
      loading={props.loading}
      tooltipOptions={{
        position: 'top',
        ...props.tooltipOptions,
      }}
      className={
        'flex justify-content-center' +
        (props.className ? ' ' + props.className : '') +
        (setButton()?.className ? ' ' + setButton()?.className : '')
      }
      onClick={(event) => {
        // Fix bug focus button when close dialog
        const element = document.activeElement as HTMLElement;
        element.blur();
        props.onClick?.(event);
      }}
    ></Button>
  );
};

export { AppButton };
