import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { ProgressBar } from 'primereact/progressbar';
import { Toast } from 'primereact/toast';
import { Skeleton } from 'primereact/skeleton';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { CommonStatus } from '@/models';
import { LoyaltyService, MonthlyBudgetModel } from '@/service/loyalty.service';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { StandardRowActions } from '@/components/StandardRowActions';
import { StatusBadge } from '@/components/StatusBadge';
import { exportToExcel } from '@/components/exportHelper';

export const BudgetManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [budgets, setBudgets] = useState<MonthlyBudgetModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<MonthlyBudgetModel>>({});

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
      sponsorType: 'NATCASH',
      partnerCode: '',
      budgetMonth: ym,
      budgetCap: 0,
      alert80Sent: false,
      autoPausedAt100: true,
      status: CommonStatus.ACTIVE,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.budgetMonth?.trim() || (formData.budgetCap || 0) <= 0) {
      toast.current?.show({ severity: 'warn', summary: t('common.warn'), detail: t('budget.required') });
      return;
    }
    setSubmitting(true);
    try {
      await LoyaltyService.saveBudget(formData as MonthlyBudgetModel, selectedTenant);
      toast.current?.show({ severity: 'success', summary: t('common.success'), detail: t('budget.saved') });
      setShowDialog(false);
      fetchBudgets();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBudgets = useMemo(() => {
    if (!keyword.trim()) return budgets;
    const kw = keyword.toLowerCase();
    return budgets.filter(
      (b) =>
        b.sponsorType?.toLowerCase().includes(kw) ||
        b.partnerCode?.toLowerCase().includes(kw) ||
        b.partnerName?.toLowerCase().includes(kw) ||
        b.budgetMonth?.toLowerCase().includes(kw)
    );
  }, [budgets, keyword]);

  const handleExport = () => {
    exportToExcel(
      filteredBudgets,
      [
        { header: t('budget.sponsor'), field: 'sponsorType' },
        { header: t('budget.partner'), field: 'partnerName' },
        { header: t('budget.period'), field: 'budgetMonth' },
        { header: t('budget.cap'), field: 'budgetCap' },
        { header: t('budget.spent'), field: 'consumedAmount' },
        { header: t('common.status'), field: 'status' },
      ],
      'ngan_sach_dong_tai_tro'
    );
  };

  return (
    <div className="w-full">
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('nav.budgets') }]} />

      <StandardPageHeader
        title={t('budget.title')}
        subtitle={t('budget.subtitle')}
        primaryAction={{
          label: t('common.create', 'Thêm mới'),
          onClick: openNew,
        }}
        extraLeft={<TenantSelector value={selectedTenant} onChange={setSelectedTenant} />}
        onRefresh={fetchBudgets}
        refreshLoading={loading}
      />

      <div className="card shadow-1 border-round surface-card p-4">
        <UniversalFilterBar
          keyword={keyword}
          onKeywordChange={setKeyword}
          searchPlaceholder={t('common.search')}
          onReset={() => setKeyword('')}
          onExport={handleExport}
        />

        {loading ? (
          <div className="flex flex-column gap-2 mt-3">
            <Skeleton height="2.75rem" />
            <Skeleton height="2.75rem" />
            <Skeleton height="2.75rem" />
          </div>
        ) : (
          <DataTable<MonthlyBudgetModel[]>
            value={filteredBudgets}
            paginator
            rows={10}
            stripedRows
            responsiveLayout="scroll"
            emptyMessage={t('budget.empty')}
            className="mt-3"
          >
            <Column
              header={t('common.order_number', 'STT')}
              body={(_, opt) => opt.rowIndex + 1}
              style={{ width: '4rem', textAlign: 'center' }}
            />
            <Column
              header={t('common.action', 'Thao tác')}
              body={(r: MonthlyBudgetModel) => (
                <StandardRowActions
                  onEdit={() => {
                    setFormData(r);
                    setShowDialog(true);
                  }}
                />
              )}
              style={{ width: '6rem', textAlign: 'center' }}
            />
            <Column
              field="sponsorType"
              header={t('budget.sponsor')}
              body={(r: MonthlyBudgetModel) => (
                <span className="font-bold font-mono text-900">{r.sponsorType}</span>
              )}
              style={{ minWidth: '11rem' }}
            />
            <Column
              field="partnerName"
              header={t('budget.partner')}
              body={(r: MonthlyBudgetModel) => (
                <span className="text-900">{r.partnerName || r.partnerCode || '--'}</span>
              )}
              style={{ minWidth: '14rem' }}
            />
            <Column
              field="budgetMonth"
              header={t('budget.period')}
              body={(r: MonthlyBudgetModel) => (
                <span className="text-900 font-mono">{r.budgetMonth}</span>
              )}
              style={{ minWidth: '7.5rem' }}
            />
            <Column
              field="budgetCap"
              header={t('budget.cap')}
              body={(r: MonthlyBudgetModel) => (
                <span className="text-900 font-mono">
                  {Number(r.budgetCap || 0).toLocaleString()} HTG
                </span>
              )}
              style={{ minWidth: '10rem', textAlign: 'right' }}
            />
            <Column
              field="consumedAmount"
              header={t('budget.spent')}
              body={(r: MonthlyBudgetModel) => (
                <span className="text-900 font-mono">
                  {Number(r.consumedAmount || 0).toLocaleString()} HTG
                </span>
              )}
              style={{ minWidth: '10rem', textAlign: 'right' }}
            />
            <Column
              header={t('budget.utilization')}
              body={(r: MonthlyBudgetModel) => {
                const pct =
                  r.budgetCap > 0
                    ? Math.min(100, (Number(r.consumedAmount || 0) / r.budgetCap) * 100)
                    : 0;
                return (
                  <div className="flex align-items-center gap-2">
                    <ProgressBar
                      value={Number(pct.toFixed(1))}
                      showValue={false}
                      style={{ height: '6px', width: '5rem' }}
                      color={pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981'}
                    />
                    <span className="text-xs font-mono text-900">{pct.toFixed(1)}%</span>
                  </div>
                );
              }}
              style={{ minWidth: '11rem' }}
            />
            <Column
              field="autoPausedAt100"
              header={t('budget.auto_pause')}
              body={(r: MonthlyBudgetModel) => (
                <StatusBadge
                  status={r.autoPausedAt100 ? 'PAUSED' : 'ENABLED'}
                  label={r.autoPausedAt100 ? t('budget.auto_paused_label', 'Tự động tạm dừng') : t('budget.auto_pause_enabled', 'Đang bật')}
                  severity={r.autoPausedAt100 ? 'warning' : 'info'}
                />
              )}
              style={{ minWidth: '9rem', textAlign: 'center' }}
            />
            <Column
              field="status"
              header={t('common.status')}
              body={(r: MonthlyBudgetModel) => (
                <StatusBadge status={r.status} />
              )}
              style={{ minWidth: '8rem', textAlign: 'center' }}
            />
          </DataTable>
        )}
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={t('budget.dialog_title')}
        style={{ width: '36rem' }}
        modal
        className="p-fluid"
      >
        <div className="flex flex-column gap-3">
          <div className="grid">
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('budget.sponsor')} *</label>
              <InputText
                value={formData.sponsorType || ''}
                onChange={(e) =>
                  setFormData({ ...formData, sponsorType: e.target.value.toUpperCase() })
                }
                className="font-mono"
              />
            </div>
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('budget.partner_code')}</label>
              <InputText
                value={formData.partnerCode || ''}
                onChange={(e) =>
                  setFormData({ ...formData, partnerCode: e.target.value.toUpperCase() })
                }
                className="font-mono"
              />
            </div>
          </div>
          <div className="grid">
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('budget.period')}</label>
              <InputText
                value={formData.budgetMonth || ''}
                onChange={(e) => setFormData({ ...formData, budgetMonth: e.target.value })}
                className="font-mono"
              />
            </div>
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('budget.cap')} *</label>
              <InputNumber
                value={formData.budgetCap ?? 0}
                onValueChange={(e) => setFormData({ ...formData, budgetCap: e.value || 0 })}
                min={0}
              />
            </div>
          </div>
          <div className="flex align-items-center gap-2">
            <InputSwitch
              checked={!!formData.autoPausedAt100}
              onChange={(e) => setFormData({ ...formData, autoPausedAt100: e.value })}
            />
            <span className="text-sm text-900">{t('budget.auto_pause_label')}</span>
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel')} outlined onClick={() => setShowDialog(false)} />
          <Button
            label={t('common.save')}
            icon="pi pi-check"
            onClick={handleSave}
            loading={submitting}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default BudgetManagementPage;
