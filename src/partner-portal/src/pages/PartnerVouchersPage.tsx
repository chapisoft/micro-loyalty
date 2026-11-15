import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { StandardRowActions } from '@/components/StandardRowActions';
import { exportToExcel } from '@/components/exportHelper';

export const PartnerVouchersPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || localStorage.getItem('tenant_id') || ''
  );
  const [vouchers, setVouchers] = useState<VoucherItemModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

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
      toast.current?.show({
        severity: 'warn',
        summary: t('common.warn'),
        detail: t('partner_portal.redeem_required'),
      });
      return;
    }
    setSubmitting(true);
    try {
      await LoyaltyService.redeemPartnerVoucherAtCounter(
        {
          voucherCode: serialCode.trim(),
          branchCode: branchCode.trim(),
          customerPhone: orderRef.trim() || undefined,
        },
        selectedTenant
      );
      toast.current?.show({
        severity: 'success',
        summary: t('common.success'),
        detail: serialCode.trim(),
      });
      setShowRedeemDialog(false);
      setSerialCode('');
      setOrderRef('');
      fetchVouchers();
    } catch (err: any) {
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: err?.response?.data?.message || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredVouchers = useMemo(() => {
    if (!keyword.trim()) return vouchers;
    const kw = keyword.toLowerCase();
    return vouchers.filter(
      (v) =>
        v.voucherCode?.toLowerCase().includes(kw) ||
        v.voucherName?.toLowerCase().includes(kw)
    );
  }, [vouchers, keyword]);

  const handleExport = () => {
    exportToExcel(
      filteredVouchers,
      [
        { header: t('voucher.code'), field: 'voucherCode' },
        { header: t('voucher.name'), field: 'voucherName' },
        { header: t('voucher.discount'), field: 'discountValue' },
        { header: t('voucher.remaining'), field: 'availableQuantity' },
        { header: t('common.status'), field: 'status' },
      ],
      'voucher_doi_tac'
    );
  };

  return (
    <div className="w-full">
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('partner_portal.nav_vouchers') }]} />

      <StandardPageHeader
        title={t('partner_portal.vouchers_title')}
        subtitle={t('partner_portal.vouchers_subtitle')}
        primaryAction={{
          label: t('partner_portal.redeem_counter', 'Đổi voucher tại quầy'),
          icon: 'pi pi-qrcode',
          onClick: () => setShowRedeemDialog(true),
        }}
        extraLeft={<TenantSelector value={selectedTenant} onChange={setSelectedTenant} />}
        onRefresh={fetchVouchers}
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
          </div>
        ) : (
          <DataTable<VoucherItemModel[]>
            value={filteredVouchers}
            paginator
            rows={10}
            stripedRows
            responsiveLayout="scroll"
            emptyMessage={t('common.no_data')}
            className="mt-3"
          >
            <Column
              header={t('common.order_number', 'STT')}
              body={(_, opt) => opt.rowIndex + 1}
              style={{ width: '4rem', textAlign: 'center' }}
            />
            <Column
              header={t('common.action', 'Thao tác')}
              body={(r: VoucherItemModel) => (
                <StandardRowActions
                  actions={[
                    {
                      icon: 'pi pi-qrcode',
                      label: t('partner_portal.redeem_counter', 'Đổi tại quầy'),
                      onClick: () => {
                        setSerialCode(r.voucherCode || '');
                        setShowRedeemDialog(true);
                      },
                    },
                  ]}
                />
              )}
              style={{ width: '6rem', textAlign: 'center' }}
            />
            <Column
              field="voucherCode"
              header={t('voucher.code')}
              body={(r: VoucherItemModel) => (
                <span className="font-bold font-mono text-900">{r.voucherCode}</span>
              )}
              style={{ minWidth: '11rem' }}
            />
            <Column
              field="voucherName"
              header={t('voucher.name')}
              body={(r: VoucherItemModel) => <span className="text-900">{r.voucherName}</span>}
              style={{ minWidth: '15rem' }}
            />
            <Column
              field="discountValue"
              header={t('voucher.discount')}
              body={(r: VoucherItemModel) => (
                <span className="text-900 font-mono">
                  {Number(r.discountValue || 0).toLocaleString()}{' '}
                  {r.discountType === DiscountType.PERCENTAGE ? '%' : 'HTG'}
                </span>
              )}
              style={{ minWidth: '9rem', textAlign: 'right' }}
            />
            <Column
              field="availableQuantity"
              header={t('voucher.remaining')}
              body={(r: VoucherItemModel) => (
                <span className="text-900 font-mono">
                  {r.availableQuantity} / {r.totalQuantity}
                </span>
              )}
              style={{ minWidth: '8rem', textAlign: 'right' }}
            />
            <Column
              field="status"
              header={t('common.status')}
              body={(r: VoucherItemModel) => (
                <Tag
                  value={r.status}
                  severity={r.status === VoucherStatus.ACTIVE ? 'success' : 'secondary'}
                />
              )}
              style={{ minWidth: '8rem', textAlign: 'center' }}
            />
          </DataTable>
        )}
      </div>

      <Dialog
        visible={showRedeemDialog}
        onHide={() => setShowRedeemDialog(false)}
        header={t('partner_portal.redeem_counter')}
        style={{ width: '32rem' }}
        modal
        className="p-fluid"
      >
        <div className="flex flex-column gap-3">
          <div className="field m-0">
            <label className="text-sm font-medium">{t('partner_portal.serial_code')} *</label>
            <InputText
              value={serialCode}
              onChange={(e) => setSerialCode(e.target.value.toUpperCase())}
              className="font-mono"
              placeholder="VCH-2026-XXXXXX"
            />
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">{t('partner_portal.branch_code')} *</label>
            <InputText
              value={branchCode}
              onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
              className="font-mono"
              placeholder="BR_PAP_01"
            />
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">{t('partner_portal.order_ref')}</label>
            <InputText
              value={orderRef}
              onChange={(e) => setOrderRef(e.target.value)}
              className="font-mono"
              placeholder="POS-99102"
            />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel')} outlined onClick={() => setShowRedeemDialog(false)} />
          <Button
            label={t('partner_portal.confirm_redeem')}
            icon="pi pi-check"
            onClick={handleRedeemAtCounter}
            loading={submitting}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default PartnerVouchersPage;
