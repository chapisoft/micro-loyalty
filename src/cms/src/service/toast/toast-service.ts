import { useToast } from 'components';
import { useTranslation } from 'react-i18next';

interface ToastOptions {
  code?: number | string;
  detail?: string;
  life?: number;
  severity?: 'success' | 'info' | 'warn' | 'error';
  summary?: string;
  onSuccess?: () => void;
  onError?: () => void;
  error?: any;
}

const useToastService = () => {
  const toast = useToast();
  const { t } = useTranslation();

  const showToast = ({ code, detail, life = 3000, severity, summary, onSuccess, onError, error }: ToastOptions) => {
    let finalDetail = detail || '';
    if (error?.response?.data) {
      const errCode = error.response.data.code;
      const errMessage = error.response.data.message;
      if (errCode) {
        const translation = t('error.' + errCode, { defaultValue: errCode });
        finalDetail = translation !== errCode ? translation : (errMessage || finalDetail);
      } else {
        finalDetail = errMessage || finalDetail;
      }
    }
    if (severity) {
      toast.current?.show({
        severity,
        summary: summary || (severity === 'success' ? t('toast.success') : t('toast.error')),
        detail: finalDetail,
        life,
      });
      if (severity === 'success') onSuccess?.();
      else onError?.();
    } else if (!code || typeof code === 'string') {
      toast.current?.show({
        severity: 'error',
        summary: summary || t('toast.error'),
        detail: finalDetail || t('toast.generic_error'),
        life: 5000,
      });
      onError?.();
    } else {
      if (code.toString().startsWith('2')) {
        toast.current?.show({ 
          severity: 'success', 
          summary: summary || t('toast.success'), 
          detail: finalDetail || t('toast.operation_successful'), 
          life 
        });
        onSuccess?.();
      } else {
        toast.current?.show({ 
          severity: 'error', 
          summary: summary || t('toast.error'), 
          detail: finalDetail || t('toast.operation_failed'), 
          life: 5000 
        });
        onError?.();
      }
    }
  };

  return { showToast };
};

export default useToastService;
