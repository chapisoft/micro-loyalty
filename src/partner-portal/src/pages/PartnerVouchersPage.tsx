import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Skeleton } from 'primereact/skeleton';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import { TenantSelector } from '@/components/TenantSelector';
import { DiscountType, VoucherStatus } from '@/models';
import { LoyaltyService, VoucherItemModel } from '@/service/loyalty.service';

export const PartnerVouchersPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [vouchers, setVouchers] = useState<VoucherItemModel[]>([]);
  const [loading, setLoading] = useState(false);

  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [serialCode, setSerialCode] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [orderRef, setOrderRef] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const list = await LoyaltyService.getPartnerPortalVouchers(selectedTenant);
      setVouchers(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const handleRedeemAtCounter = async () => {
    if (!serialCode.trim() || !branchCode.trim()) {
      toast.current?.show({ severity: 'warn', summary: t('common.warn'), detail: t('partner_portal.redeem_required') });
      return;
    }
    setSubmitting(true);
    try {
      await LoyaltyService.redeemPartnerVoucherAtCounter(
        { voucherCode: serialCode.trim(), branchCode: branchCode.trim(), customerPhone: orderRef.trim() || undefined },
        selectedTenant
      );
      toast.current?.show({ severity: 'success', summary: t('common.success'), detail: serialCode.trim() });
      setShowRedeemDialog(false);
      setSerialCode('');
      setOrderRef('');
      fetchVouchers();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('partner_portal.nav_vouchers') }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="m-0 text-primary font-semibold">{t('partner_portal.vouchers_title')}</h4>
            <p className="m-0 text-xs text-500 mt-1">{t('partner_portal.vouchers_subtitle')}</p>
          </div>
          <div className="flex gap-2 align-items-center">
            <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
            <Button label={t('partner_portal.redeem_counter')} icon="pi pi-qrcode" severity="success" size="small" onClick={() => setShowRedeemDialog(true)} />
            <Button icon="pi pi-refresh" outlined rounded onClick={fetchVouchers} loading={loading} />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-column gap-2"><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /></div>
        ) : (
          <DataTable<VoucherItemModel[]> value={vouchers} paginator rows={10} stripedRows responsiveLayout="scroll" emptyMessage={t('common.no_data')}>
            <Column field="voucherCode" header={t('voucher.code')} body={(r: VoucherItemModel) => <span className="font-mono white-space-nowrap font-medium text-primary">{r.voucherCode}</span>} style={{ minWidth: '11rem' }} />
            <Column field="title" header={t('voucher.name')} style={{ minWidth: '15rem' }} />
            <Column field="discountValue" header={t('voucher.discount')} body={(r: VoucherItemModel) => <span className="font-mono">{Number(r.discountValue || 0).toLocaleString()} {r.discountType === DiscountType.PERCENTAGE ? '%' : 'HTG'}</span>} style={{ minWidth: '9rem', textAlign: 'right' }} />
            <Column field="availableQuantity" header={t('voucher.remaining')} body={(r: VoucherItemModel) => `${r.availableQuantity} / ${r.totalQuantity}`} style={{ minWidth: '8rem', textAlign: 'right' }} />
            <Column field="status" header={t('common.status')} body={(r: VoucherItemModel) => <Tag value={r.status} severity={r.status === VoucherStatus.ACTIVE ? 'success' : 'secondary'} />} style={{ minWidth: '8rem', textAlign: 'center' }} />
          </DataTable>
        )}
      </div>

      <Dialog visible={showRedeemDialog} onHide={() => setShowRedeemDialog(false)} header={t('partner_portal.redeem_counter')} style={{ width: '32rem' }} modal className="p-fluid">
        <div className="flex flex-column gap-3">
          <div className="field m-0">
            <label className="text-sm font-medium">{t('partner_portal.serial_code')} *</label>
            <InputText value={serialCode} onChange={(e) => setSerialCode(e.target.value.toUpperCase())} className="font-mono" placeholder="VCH-2026-XXXXXX" />
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">{t('partner_portal.branch_code')} *</label>
            <InputText value={branchCode} onChange={(e) => setBranchCode(e.target.value.toUpperCase())} className="font-mono" placeholder="BR_PAP_01" />
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">{t('partner_portal.order_ref')}</label>
            <InputText value={orderRef} onChange={(e) => setOrderRef(e.target.value)} className="font-mono" placeholder="POS-99102" />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel')} outlined onClick={() => setShowRedeemDialog(false)} />
          <Button label={t('partner_portal.confirm_redeem')} icon="pi pi-check" severity="success" onClick={handleRedeemAtCounter} loading={submitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default PartnerVouchersPage;
