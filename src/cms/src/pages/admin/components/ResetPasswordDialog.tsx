import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { useTranslation } from 'react-i18next';
import { IUser, useResetPassword } from '@/service/admin/admin';
import useToastService from '@/service/toast/toast-service';

interface ResetPasswordDialogProps {
  visible: boolean;
  user: IUser | null;
  onHide: () => void;
  onSuccess: () => void;
}

export const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({
  visible,
  user,
  onHide,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { showToast } = useToastService();
  const resetPasswordMutation = useResetPassword();

  const [autoGenerate, setAutoGenerate] = useState(true);
  const [customPassword, setCustomPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleClose = () => {
    setGeneratedPassword(null);
    setIsCopied(false);
    setCustomPassword('');
    setAutoGenerate(true);
    onHide();
  };

  const handleReset = () => {
    if (!user) return;
    if (!autoGenerate && !customPassword.trim()) {
      showToast({
        severity: 'warn',
        summary: t('common.warning', 'Cảnh báo'),
        detail: t('user.please_enter_new_pwd', 'Vui lòng nhập mật khẩu mới'),
      });
      return;
    }

    resetPasswordMutation.mutate(
      {
        id: user.userId,
        newPassword: autoGenerate ? undefined : customPassword.trim(),
      },
      {
        onSuccess: (res: any) => {
          const tempPwd = res?.temporaryPassword || res?.data?.temporaryPassword || customPassword || t('user.pwd_reset_done', 'Mật khẩu đã được đặt lại');
          setGeneratedPassword(tempPwd);
          showToast({
            severity: 'success',
            summary: t('common.success', 'Thành công'),
            detail: t('user.reset_pwd_success', 'Đặt lại mật khẩu thành công'),
          });
          onSuccess();
        },
        onError: (err: any) => {
          showToast({
            severity: 'error',
            summary: t('common.error', 'Lỗi'),
            detail: err?.response?.data?.message || t('user.reset_pwd_failed', 'Không thể đặt lại mật khẩu'),
          });
        },
      }
    );
  };

  const handleCopy = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <Dialog
      visible={visible}
      onHide={handleClose}
      header={t('user.reset_pwd_title', 'Đặt lại mật khẩu tài khoản')}
      style={{ width: '480px' }}
      modal
    >
      {!generatedPassword ? (
        <div className="p-fluid flex flex-column gap-3 py-2">
          <div className="surface-50 p-3 border-round border-1 surface-border">
            <div className="text-xs text-500 mb-1">{t('user.target_account', 'Tài khoản đặt lại:')}</div>
            <div className="font-bold text-900 text-base">{user?.fullName} ({user?.username})</div>
            <div className="text-xs text-600">{user?.email}</div>
          </div>

          <div className="flex align-items-center gap-2">
            <input
              type="checkbox"
              id="autoGenerateCheck"
              checked={autoGenerate}
              onChange={(e) => setAutoGenerate(e.target.checked)}
              className="cursor-pointer"
              style={{ width: '16px', height: '16px' }}
            />
            <label htmlFor="autoGenerateCheck" className="text-sm cursor-pointer select-none font-medium">
              {t('user.auto_generate_pwd', 'Tự động tạo mật khẩu ngẫu nhiên an toàn')}
            </label>
          </div>

          {!autoGenerate && (
            <div className="flex flex-column gap-1">
              <label className="text-xs font-semibold text-700">{t('user.new_password', 'Mật khẩu mới')}</label>
              <InputText
                type="password"
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                placeholder={t('user.new_password_placeholder', 'Nhập mật khẩu mới...')}
                className="p-inputtext-sm"
              />
            </div>
          )}

          <div className="text-xs text-500 bg-blue-50 text-blue-700 p-2 border-round">
            <i className="pi pi-info-circle mr-1" />
            {t('user.reset_pwd_note', 'Người dùng sẽ được yêu cầu đổi mật khẩu ở lần đăng nhập tiếp theo.')}
          </div>

          <div className="flex justify-content-end gap-2 mt-3">
            <Button
              type="button"
              label={t('common.cancel', 'Hủy')}
              outlined
              severity="secondary"
              size="small"
              onClick={handleClose}
            />
            <Button
              type="button"
              label={t('common.confirm', 'Xác nhận')}
              icon="pi pi-check"
              size="small"
              loading={resetPasswordMutation.isPending}
              onClick={handleReset}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-column gap-3 py-2">
          <div className="text-center">
            <i className="pi pi-check-circle text-green-500 text-4xl mb-2" />
            <div className="text-base font-bold text-900">{t('user.pwd_generated_title', 'Mật khẩu mới đã được khởi tạo')}</div>
            <div className="text-xs text-500">{t('user.pwd_generated_desc', 'Hãy gửi mật khẩu tạm thời này cho người dùng')}</div>
          </div>

          <div className="surface-100 p-3 border-round border-1 surface-border flex align-items-center justify-content-between">
            <span className="font-mono text-lg font-bold text-primary select-all">
              {generatedPassword}
            </span>
            <Button
              type="button"
              icon={isCopied ? 'pi pi-check' : 'pi pi-copy'}
              label={isCopied ? t('common.copied', 'Đã sao chép') : t('common.copy', 'Sao chép')}
              size="small"
              severity={isCopied ? 'success' : 'secondary'}
              onClick={handleCopy}
            />
          </div>

          <div className="flex justify-content-end mt-2">
            <Button
              type="button"
              label={t('common.close', 'Đóng')}
              size="small"
              onClick={handleClose}
            />
          </div>
        </div>
      )}
    </Dialog>
  );
};
