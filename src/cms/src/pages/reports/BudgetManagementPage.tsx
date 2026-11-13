import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Skeleton } from 'primereact/skeleton';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { CommonStatus } from '@/models';
import { LoyaltyService, ProgramBudgetModel } from '@/service/loyalty.service';

export const BudgetManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [budgets, setBudgets] = useState<ProgramBudgetModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<ProgramBudgetModel>>({});

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const list = await LoyaltyService.getBudgets(undefined, selectedTenant);
      setBudgets(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const openNew = () => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setFormData({
      budgetCode: '',
      budgetName: '',
      periodMonth: ym,
      monthlyCapAmount: 0,
      alertThresholdPercent: 80,
      autoPauseOnExhaust: true,
      status: CommonStatus.ACTIVE,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.budgetCode?.trim() || !formData.budgetName?.trim() || (formData.monthlyCapAmount || 0) <= 0) {
      toast.current?.show({ severity: 'warn', summary: t('common.warn', { defaultValue: 'Thiếu thông tin' }), detail: t('budget.required', { defaultValue: 'Vui lòng nhập Mã ngân sách, Tên và Trần tháng > 0.' }) });
      return;
    }
    setSubmitting(true);
    try {
      await LoyaltyService.saveBudget(formData as ProgramBudgetModel, selectedTenant);
      toast.current?.show({ severity: 'success', summary: t('common.success', { defaultValue: 'Thành công' }), detail: t('budget.saved', { defaultValue: 'Đã lưu cấu hình trần ngân sách.' }) });
      setShowDialog(false);
      fetchBudgets();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error', { defaultValue: 'Lỗi' }), detail: err?.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('nav.budgets', { defaultValue: 'Quản lý Ngân sách (NS-01)' }) }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="m-0 text-primary font-semibold">
              {t('budget.title', { defaultValue: 'Kiểm soát Trần Ngân sách Tháng & Tự động Tạm dừng (NS-01)' })}
            </h4>
            <p className="m-0 text-xs text-500 mt-1">
              {t('budget.subtitle', { defaultValue: 'Cảnh báo sớm ở ngưỡng 80% và tự động ngắt phát hành điểm/voucher khi chạm trần 100%.' })}
            </p>
          </div>
          <div className="flex gap-2 align-items-center">
            <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
            <Button label={t('budget.add_new', { defaultValue: 'Thiết lập ngân sách' })} icon="pi pi-plus" severity="success" size="small" onClick={openNew} />
            <Button icon="pi pi-refresh" outlined rounded onClick={fetchBudgets} loading={loading} />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-column gap-2"><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /></div>
        ) : (
          <DataTable<ProgramBudgetModel> value={budgets} paginator rows={10} stripedRows responsiveLayout="scroll" emptyMessage={t('budget.empty', { defaultValue: 'Chưa có hạng mục ngân sách nào được cấu hình.' })}>
            <Column field="budgetCode" header={t('budget.code', { defaultValue: 'Mã Ngân Sách' })} body={(r) => <span className="font-mono white-space-nowrap font-medium text-primary">{r.budgetCode}</span>} style={{ minWidth: '11rem' }} />
            <Column field="budgetName" header={t('budget.name', { defaultValue: 'Hạng Mục' })} style={{ minWidth: '14rem' }} />
            <Column field="periodMonth" header={t('budget.period', { defaultValue: 'Kỳ Tháng' })} body={(r) => <span className="font-mono">{r.periodMonth}</span>} style={{ minWidth: '7.5rem' }} />
            <Column field="monthlyCapAmount" header={t('budget.cap', { defaultValue: 'Trần Tháng' })} body={(r) => <span className="font-mono">{Number(r.monthlyCapAmount || 0).toLocaleString()} HTG</span>} style={{ minWidth: '10rem', textAlign: 'right' }} />
            <Column field="spentAmount" header={t('budget.spent', { defaultValue: 'Đã Tiêu' })} body={(r) => <span className="font-mono">{Number(r.spentAmount || 0).toLocaleString()} HTG</span>} style={{ minWidth: '10rem', textAlign: 'right' }} />
            <Column
              header={t('budget.utilization', { defaultValue: 'Mức Sử Dụng' })}
              body={(r) => {
                const pct = r.monthlyCapAmount > 0 ? Math.min(100, (Number(r.spentAmount || 0) / r.monthlyCapAmount) * 100) : 0;
                return (
                  <div className="flex align-items-center gap-2">
                    <ProgressBar value={Number(pct.toFixed(1))} showValue={false} style={{ height: '6px', width: '5rem' }} color={pct >= 100 ? '#ef4444' : pct >= (r.alertThresholdPercent || 80) ? '#f59e0b' : '#10b981'} />
                    <span className="text-xs font-mono">{pct.toFixed(1)}%</span>
                  </div>
                );
              }}
              style={{ minWidth: '11rem' }}
            />
            <Column field="autoPauseOnExhaust" header={t('budget.auto_pause', { defaultValue: 'Auto-Pause 100%' })} body={(r) => <Tag value={r.autoPauseOnExhaust ? 'ON' : 'OFF'} severity={r.autoPauseOnExhaust ? 'info' : 'secondary'} />} style={{ minWidth: '9rem', textAlign: 'center' }} />
            <Column field="status" header={t('common.status', { defaultValue: 'Trạng Thái' })} body={(r) => <Tag value={r.status} severity={r.status === CommonStatus.ACTIVE ? 'success' : 'danger'} />} style={{ minWidth: '8rem', textAlign: 'center' }} />
            <Column header={t('common.action', { defaultValue: 'Sửa' })} body={(r) => <Button icon="pi pi-pencil" text rounded size="small" onClick={() => { setFormData(r); setShowDialog(true); }} />} style={{ minWidth: '5rem' }} />
          </DataTable>
        )}
      </div>

      <Dialog visible={showDialog} onHide={() => setShowDialog(false)} header={t('budget.dialog_title', { defaultValue: 'Cấu hình Trần Ngân sách Tháng' })} style={{ width: '36rem' }} modal className="p-fluid">
        <div className="flex flex-column gap-3">
          <div className="field m-0">
            <label className="text-sm font-medium">{t('budget.code', { defaultValue: 'Mã Ngân Sách' })} *</label>
            <InputText value={formData.budgetCode || ''} onChange={(e) => setFormData({ ...formData, budgetCode: e.target.value.toUpperCase() })} className="font-mono" />
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">{t('budget.name', { defaultValue: 'Tên Ngân Sách' })} *</label>
            <InputText value={formData.budgetName || ''} onChange={(e) => setFormData({ ...formData, budgetName: e.target.value })} />
          </div>
          <div className="grid">
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('budget.period', { defaultValue: 'Kỳ Tháng (YYYY-MM)' })}</label>
              <InputText value={formData.periodMonth || ''} onChange={(e) => setFormData({ ...formData, periodMonth: e.target.value })} className="font-mono" />
            </div>
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('budget.alert_threshold', { defaultValue: 'Ngưỡng cảnh báo (%)' })}</label>
              <InputNumber value={formData.alertThresholdPercent ?? 80} onValueChange={(e) => setFormData({ ...formData, alertThresholdPercent: e.value || 80 })} min={10} max={99} suffix="%" />
            </div>
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">{t('budget.cap', { defaultValue: 'Trần Ngân Sách Tháng (HTG)' })} *</label>
            <InputNumber value={formData.monthlyCapAmount ?? 0} onValueChange={(e) => setFormData({ ...formData, monthlyCapAmount: e.value || 0 })} min={0} />
          </div>
          <div className="flex align-items-center gap-2">
            <InputSwitch checked={!!formData.autoPauseOnExhaust} onChange={(e) => setFormData({ ...formData, autoPauseOnExhaust: e.value })} />
            <span className="text-sm">{t('budget.auto_pause_label', { defaultValue: 'Tự động tạm dừng chiến dịch khi đạt 100% trần ngân sách' })}</span>
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} outlined onClick={() => setShowDialog(false)} />
          <Button label={t('common.save', { defaultValue: 'Lưu Ngân Sách' })} icon="pi pi-check" onClick={handleSave} loading={submitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default BudgetManagementPage;
