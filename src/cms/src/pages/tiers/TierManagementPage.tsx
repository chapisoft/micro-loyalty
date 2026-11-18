import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { TabView, TabPanel } from 'primereact/tabview';
import { ProgressBar } from 'primereact/progressbar';
import { Skeleton } from 'primereact/skeleton';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { useTranslation } from 'react-i18next';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { StandardRowActions, RowActionItem } from '@/components/StandardRowActions';
import { StatusBadge } from '@/components/StatusBadge';
import { exportToExcel } from '@/components/exportHelper';
import { TenantSelector } from '@/components/TenantSelector';
import { TierLevel, CommonStatus } from '@/models';
import { LoyaltyService, TierDistributionModel } from '@/service/loyalty.service';

export interface TierConfig {
  id: number;
  code: TierLevel;
  name: string;
  tierLevel: number;
  minPoints: number;
  keepTierPoints: number;
  pointMultiplier: number;
  freeDailyTurns: number;
  description: string;
  status: CommonStatus;
}

const STANDARD_THRESHOLD_MAP: Record<number, { upgrade: number; keep: number; rangeLabel: string }> = {
  1: { upgrade: 0, keep: 0, rangeLabel: '0 – 999' },
  2: { upgrade: 1000, keep: 800, rangeLabel: '1.000 – 4.999' },
  3: { upgrade: 5000, keep: 4000, rangeLabel: '5.000 – 14.999' },
  4: { upgrade: 15000, keep: 12000, rangeLabel: '15.000+' },
};

export const TierManagementPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const toastRef = useRef<Toast>(null);
  const [selectedTenant, setSelectedTenant] = useState<string>('ALL');
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [distribution, setDistribution] = useState<TierDistributionModel[]>([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showDialog, setShowDialog] = useState(false);
  const [showPeriodDialog, setShowPeriodDialog] = useState(false);
  const [cycleMonths, setCycleMonths] = useState<number>(12);
  const [warningDaysBeforeEnd, setWarningDaysBeforeEnd] = useState<number>(30);
  const [maxDowngradeSteps, setMaxDowngradeSteps] = useState<number>(1);
  const [formData, setFormData] = useState<Partial<TierConfig>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [distLoading, setDistLoading] = useState(false);

  const fetchTiers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await LoyaltyService.getTiers(selectedTenant);
      if (data && Array.isArray(data)) {
        setTiers(
          data.map((item) => {
            const std = STANDARD_THRESHOLD_MAP[item.tierLevel] || { upgrade: 0, keep: 0 };
            const resolvedMin =
              item.upgradePoints ?? item.minPoints ?? item.requiredPoints ?? std.upgrade;
            const resolvedKeep =
              item.keepTierPoints ?? item.maintainPoints ?? std.keep;
            return {
              id: item.id,
              code: item.code as TierLevel,
              name: item.name,
              tierLevel: Number(item.tierLevel || 1),
              minPoints: Number(resolvedMin || 0),
              keepTierPoints: Number(resolvedKeep || 0),
              pointMultiplier: Number(item.pointMultiplier || 1.0),
              freeDailyTurns: Number(item.freeDailyTurns || 1),
              description: item.description || '',
              status: (item.status as CommonStatus) || CommonStatus.ACTIVE,
            };
          })
        );
      } else {
        setTiers([]);
      }
    } catch (e) {
      console.error('[fetchTiers] Error:', e);
      setTiers([]);
      toastRef.current?.show({
        severity: 'error',
        summary: t('common.error', 'Lỗi'),
        detail: t('tier.load_failed', 'Không thể tải dữ liệu hạng hội viên'),
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [selectedTenant, t]);

  const fetchDistribution = useCallback(async () => {
    setDistLoading(true);
    try {
      const data = await LoyaltyService.getTierDistribution(selectedTenant);
      setDistribution(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[fetchDistribution] Error:', e);
      setDistribution([]);
    } finally {
      setDistLoading(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    fetchTiers();
    fetchDistribution();
  }, [fetchTiers, fetchDistribution]);

  const tierCodeOptions = useMemo(
    () => [
      { label: 'BRONZE (Đồng)', value: TierLevel.BRONZE },
      { label: 'SILVER (Bạc)', value: TierLevel.SILVER },
      { label: 'GOLD (Vàng)', value: TierLevel.GOLD },
      { label: 'PLATINUM (Bạch kim)', value: TierLevel.PLATINUM },
      { label: 'DIAMOND (Kim cương)', value: TierLevel.DIAMOND },
    ],
    []
  );

  const openNew = () => {
    setFormData({
      code: TierLevel.BRONZE,
      name: '',
      tierLevel: 1,
      minPoints: 0,
      keepTierPoints: 0,
      pointMultiplier: 1,
      freeDailyTurns: 1,
      description: '',
      status: CommonStatus.ACTIVE,
    });
    setShowDialog(true);
  };

  const editItem = (item: TierConfig) => {
    setFormData({ ...item });
    setShowDialog(true);
  };

  const saveItem = async () => {
    if (!formData.code) {
      toastRef.current?.show({
        severity: 'warn',
        summary: t('common.warn', 'Cảnh báo'),
        detail: t('tier.code_required', 'Vui lòng chọn mã hạng hội viên'),
        life: 3000,
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await LoyaltyService.saveTier(
        {
          id: formData.id,
          code: formData.code,
          name: formData.name || formData.code,
          tierLevel: formData.tierLevel ?? 1,
          minPoints: formData.minPoints ?? 0,
          upgradePoints: formData.minPoints ?? 0,
          keepTierPoints: formData.keepTierPoints ?? 0,
          maintainPoints: formData.keepTierPoints ?? 0,
          pointMultiplier: formData.pointMultiplier ?? 1.0,
          freeDailyTurns: formData.freeDailyTurns ?? 1,
          description: formData.description || '',
          status: formData.status || CommonStatus.ACTIVE,
        },
        selectedTenant
      );

      toastRef.current?.show({
        severity: 'success',
        summary: t('toast.success'),
        detail: t('tier.save_success'),
        life: 3000,
      });

      setShowDialog(false);
      await fetchTiers();
      await fetchDistribution();
    } catch {
      toastRef.current?.show({
        severity: 'error',
        summary: t('toast.error'),
        detail: t('tier.save_failed'),
        life: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePeriodSettings = async () => {
    setIsSubmitting(true);
    try {
      await LoyaltyService.createApprovalRequest(
        {
          targetType: 'SYSTEM_PARAM',
          targetId: 'TIER_CYCLE_SETTINGS',
          actionType: 'UPDATE',
          payloadAfter: {
            cycleMonths,
            warningDaysBeforeEnd,
            maxDowngradeSteps,
          },
          reason: t('tier.config_update_reason', { cycleMonths, warningDaysBeforeEnd, maxDowngradeSteps }),
        },
        selectedTenant
      );
      toastRef.current?.show({
        severity: 'success',
        summary: t('toast.success'),
        detail: t('tier.period_saved'),
        life: 3000,
      });
      setShowPeriodDialog(false);
    } catch {
      toastRef.current?.show({
        severity: 'error',
        summary: t('toast.error'),
        detail: t('tier.period_save_failed'),
        life: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTier = (tier: TierConfig) => {
    confirmDialog({
      message: `${t('common.confirm_delete', 'Bạn có chắc chắn muốn xóa hạng hội viên')} ${tier.name || tier.code}?`,
      header: t('common.confirm', 'Xác nhận xóa'),
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: t('common.delete', 'Xóa'),
      rejectLabel: t('common.cancel', 'Hủy'),
      accept: () => {
        LoyaltyService.deleteTier(tier.id, selectedTenant)
          .then(() => {
            toastRef.current?.show({
              severity: 'success',
              summary: t('common.success', 'Thành công'),
              detail: 'Xóa hạng hội viên thành công',
              life: 3000,
            });
            fetchTiers();
            fetchDistribution();
          })
          .catch((err) => {
            toastRef.current?.show({
              severity: 'error',
              summary: t('common.error', 'Lỗi'),
              detail: err?.message || 'Không thể xóa hạng hội viên',
              life: 3000,
            });
          });
      },
    });
  };

  const renderRowActions = (rowData: TierConfig) => {
    const actions: RowActionItem[] = [
      {
        id: 'edit',
        label: t('common.edit', 'Sửa'),
        icon: 'pi pi-pencil',
        severity: 'secondary',
        onClick: () => editItem(rowData),
      },
      {
        id: 'delete',
        label: t('common.delete', 'Xóa'),
        icon: 'pi pi-trash',
        danger: true,
        onClick: () => handleDeleteTier(rowData),
      },
    ];
    return <StandardRowActions actions={actions} maxInline={3} />;
  };

  const codeTemplate = (rowData: TierConfig) => (
    <span className="font-mono font-bold text-900">
      {rowData.code}
    </span>
  );

  const nameTemplate = (rowData: TierConfig) => (
    <span className="font-medium text-900">
      {rowData.name}
    </span>
  );

  const levelTemplate = (rowData: TierConfig) => (
    <span className="text-700 font-mono">
      {rowData.tierLevel}
    </span>
  );

  const pointsTemplate = (rowData: TierConfig) => (
    <span className="text-800 font-mono white-space-nowrap">
      {(rowData.minPoints ?? 0).toLocaleString()} {t('tier.points_unit', 'điểm')}
    </span>
  );

  const keepPointsTemplate = (rowData: TierConfig) => (
    <span className="text-900 font-mono white-space-nowrap">
      {(rowData.keepTierPoints ?? 0).toLocaleString()} {t('tier.points_unit', 'điểm')}
    </span>
  );

  const multiplierTemplate = (rowData: TierConfig) => (
    <span className="text-900 font-mono">
      ×{Number(rowData.pointMultiplier ?? 1.0).toFixed(2)}
    </span>
  );

  const turnsTemplate = (rowData: TierConfig) => (
    <span className="text-700 font-mono white-space-nowrap">
      {rowData.freeDailyTurns} {t('tier.turns_unit', 'lượt')}
    </span>
  );

  const descriptionTemplate = (rowData: TierConfig) => (
    <span className="text-600 text-xs line-height-2" style={{ maxWidth: '16rem', display: 'inline-block' }}>
      {rowData.description || '—'}
    </span>
  );

  const statusTemplate = (rowData: TierConfig) => (
    <StatusBadge status={rowData.status === CommonStatus.ACTIVE ? 'ACTIVE' : 'INACTIVE'} />
  );

                  const statusOptions = useMemo(
    () => [
                  {label: t('common.active'), value: CommonStatus.ACTIVE },
                  {label: t('common.inactive'), value: CommonStatus.INACTIVE },
                  ],
                  [t]
                  );

  const filteredTiers = useMemo(() => {
    return tiers.filter((item) => {
      if (keyword.trim()) {
        const kw = keyword.toLowerCase();
                  const matchKw =
                  item.code?.toLowerCase().includes(kw) ||
                  item.name?.toLowerCase().includes(kw) ||
                  item.description?.toLowerCase().includes(kw);
                  if (!matchKw) return false;
      }
                  if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
                  return true;
    });
  }, [tiers, keyword, statusFilter]);

                  const totalMembersInDistribution = useMemo(
    () => distribution.reduce((sum, d) => sum + (d.memberCount || 0), 0),
                  [distribution]
                  );

  const handleExportExcel = () => {
                    exportToExcel(
                      filteredTiers,
                      [
                        { header: t('common.stt', 'STT') },
                        { header: t('tier.code', 'Mã hạng'), field: 'code' },
                        { header: t('tier.name', 'Tên hạng'), field: 'name' },
                        { header: t('tier.level', 'Cấp độ'), field: 'tierLevel' },
                        { header: t('tier.upgrade_points', 'Điểm nâng hạng'), getValue: (r: TierConfig) => (r.minPoints ?? 0).toLocaleString() },
                        { header: t('tier.keep_tier', 'Điểm giữ hạng'), getValue: (r: TierConfig) => (r.keepTierPoints ?? 0).toLocaleString() },
                        { header: t('tier.multiplier', 'Hệ số tích điểm'), getValue: (r: TierConfig) => `×${Number(r.pointMultiplier ?? 1.0).toFixed(2)}` },
                        { header: t('tier.free_turns', 'Lượt quay miễn phí/ngày'), field: 'freeDailyTurns' },
                        { header: t('common.status', 'Trạng thái'), getValue: (r: TierConfig) => (r.status === CommonStatus.ACTIVE ? t('common.active') : t('common.inactive')) },
                        { header: t('tier.description', 'Mô tả'), field: 'description' },
                      ],
                      'Cau_hinh_hang_hoi_vien'
                    );
  };

                  return (
                  <div className="w-full flex flex-column gap-2">
                    <Toast ref={toastRef} />
                    <ConfirmDialog />

                    <StandardPageHeader
                      breadcrumbs={[
                        { label: t('nav.loyalty_policies', 'Chính sách Loyalty') },
                        { label: t('nav.tiers', 'Hạng Hội viên') },
                      ]}
                      title={t('nav.tiers', 'Hạng Hội viên')}
                      subtitle={t('tier.subtitle', 'Cấu hình 4 phân hạng hội viên, ngưỡng điểm tích lũy, hệ số nhân và đặc quyền quay thưởng')}
                      primaryAction={{
                        label: t('common.add_new', 'Thêm mới'),
                        icon: 'pi pi-plus',
                        onClick: openNew,
                      }}
                      extraLeft={
                        <TenantSelector
                          value={selectedTenant}
                          onChange={(newTenantId) => {
                            setSelectedTenant(newTenantId);
                          }}
                        />
                      }
                      actions={
                        <Button
                          label={t('tier.period_settings', 'Chu kỳ xét hạng')}
                          icon="pi pi-calendar-times"
                          size="small"
                          outlined
                          severity="secondary"
                          onClick={() => setShowPeriodDialog(true)}
                          className="p-button-sm font-medium"
                        />
                      }
                      onRefresh={() => {
                        fetchTiers();
                        fetchDistribution();
                      }}
                      refreshLoading={loading || distLoading}
                    />

                    <div className="card shadow-1 border-round surface-card p-4 w-full">
                      <UniversalFilterBar
                        keyword={keyword}
                        onKeywordChange={setKeyword}
                        searchPlaceholder={t('common.search', 'Tìm theo mã hạng, tên hạng...')}
                        basicFilters={[
                          {
                            value: statusFilter,
                            options: [
                              { label: `${t('common.status')}: ${t('common.all')}`, value: 'ALL' },
                              { label: t('common.active', 'Hoạt động'), value: CommonStatus.ACTIVE },
                              { label: t('common.inactive', 'Ngừng hoạt động'), value: CommonStatus.INACTIVE },
                            ],
                            onChange: (val) => setStatusFilter(val || 'ALL'),
                            className: 'w-13rem',
                          },
                        ]}
                        onReset={() => {
                          setKeyword('');
                          setStatusFilter('ALL');
                        }}
                        onRefresh={() => {
                          fetchTiers();
                          fetchDistribution();
                        }}
                        onExport={handleExportExcel}
                      />

                      <div className="surface-card border-round border-1 surface-border overflow-hidden w-full mt-2">
                        <TabView activeIndex={activeTabIndex} onTabChange={(e) => setActiveTabIndex(e.index)}>
                          <TabPanel
                            header={t('tier.tab_config', 'Cấu hình hạng hội viên')}
                            leftIcon="pi pi-sliders-h mr-2"
                          >
                            <DataTable<any>
                              key={`${i18n.language}_${selectedTenant}`}
                              value={filteredTiers}
                              loading={loading}
                              dataKey="id"
                              paginator
                              rows={10}
                              emptyMessage={t('common.no_data', 'Không có dữ liệu hiển thị')}
                              className="p-datatable-sm p-datatable-striped"
                              responsiveLayout="scroll"
                            >
                              <Column
                                header={t('common.stt', 'STT')}
                                body={(_, options) => options.rowIndex + 1}
                                style={{ width: '3.5rem', textAlign: 'center' }}
                              />
                              <Column
                                body={renderRowActions}
                                exportable={false}
                                header={t('common.actions', 'Thao tác')}
                                style={{ width: '6.5rem', textAlign: 'left' }}
                              />
                              <Column
                                field="code"
                                body={codeTemplate}
                                header={t('tier.code', 'Mã hạng')}
                                sortable
                                style={{ minWidth: '7.5rem' }}
                              />
                              <Column
                                field="name"
                                body={nameTemplate}
                                header={t('tier.name', 'Tên hạng')}
                                sortable
                                style={{ minWidth: '12rem' }}
                              />
                              <Column
                                field="tierLevel"
                                body={levelTemplate}
                                header={t('tier.level', 'Cấp độ')}
                                sortable
                                style={{ minWidth: '5rem', textAlign: 'center' }}
                              />
                              <Column
                                field="minPoints"
                                body={pointsTemplate}
                                header={t('tier.upgrade_points', 'Ngưỡng lên hạng')}
                                sortable
                                style={{ minWidth: '9.5rem' }}
                              />
                              <Column
                                field="keepTierPoints"
                                body={keepPointsTemplate}
                                header={t('tier.keep_tier', 'Giữ hạng')}
                                sortable
                                style={{ minWidth: '10.5rem' }}
                              />
                              <Column
                                field="pointMultiplier"
                                body={multiplierTemplate}
                                header={t('tier.multiplier', 'Hệ số tích điểm')}
                                sortable
                                style={{ minWidth: '6.5rem', textAlign: 'center' }}
                              />
                              <Column
                                field="freeDailyTurns"
                                body={turnsTemplate}
                                header={t('tier.free_turns', 'Lượt quay miễn phí')}
                                sortable
                                style={{ minWidth: '7.5rem', textAlign: 'center' }}
                              />
                              <Column
                                field="description"
                                body={descriptionTemplate}
                                header={t('tier.description', 'Mô tả quyền lợi')}
                                style={{ minWidth: '12rem' }}
                              />
                              <Column
                                field="status"
                                body={statusTemplate}
                                header={t('common.status', 'Trạng thái')}
                                sortable
                                style={{ minWidth: '8rem', textAlign: 'center' }}
                              />
                            </DataTable>
                          </TabPanel>

                          <TabPanel
                            header={t('tier.tab_distribution')}
                            leftIcon="pi pi-chart-pie mr-2"
                          >
                            <div className="flex justify-content-between align-items-center mb-3">
                              <div>
                                <h5 className="m-0 text-900 font-bold">
                                  {t('tier.distribution_title')}
                                </h5>
                                <span className="text-xs text-500">
                                  {t('tier.distribution_total', {
                                    count: totalMembersInDistribution
                                  })}
                                </span>
                              </div>
                              <Button
                                label={t('common.refresh')}
                                icon="pi pi-refresh"
                                size="small"
                                outlined
                                onClick={fetchDistribution}
                                loading={distLoading}
                              />
                            </div>

                            {distLoading ? (
                              <div className="flex flex-column gap-3">
                                <Skeleton height="4rem" />
                                <Skeleton height="12rem" />
                              </div>
                            ) : (
                              <DataTable
                                value={distribution}
                                stripedRows
                                emptyMessage={t('tier.distribution_empty')}
                                responsiveLayout="scroll"
                              >
                                <Column
                                  header={t('common.stt', 'STT')}
                                  body={(_, options) => options.rowIndex + 1}
                                  style={{ width: '3.5rem', textAlign: 'center' }}
                                />
                                <Column
                                  field="code"
                                  header={t('tier.code')}
                                  body={(r: any) => (
                                    <span className="font-mono font-bold text-900 white-space-nowrap">{r.code || r.tierCode}</span>
                                  )}
                                  style={{ minWidth: '8rem' }}
                                />
                                <Column
                                  field="name"
                                  header={t('tier.name')}
                                  body={(r: any) => <span className="text-900">{r.name || r.tierName}</span>}
                                  style={{ minWidth: '12rem' }}
                                />
                                <Column
                                  header={t('tier.threshold_range')}
                                  body={(r: any) => {
                                    const std = STANDARD_THRESHOLD_MAP[r.tierLevel];
                                    return (
                                      <span className="font-mono text-xs text-900 white-space-nowrap">
                                        {std ? t('tier.points_keep_summary', { rangeLabel: std.rangeLabel, keep: std.keep.toLocaleString() }) : '—'}
                                      </span>
                                    );
                                  }}
                                  style={{ minWidth: '14rem' }}
                                />
                                <Column
                                  field="pointMultiplier"
                                  header={t('tier.multiplier')}
                                  body={(r: any) => (
                                    <span className="font-mono text-900">
                                      ×{Number(r.pointMultiplier || 1).toFixed(2)}
                                    </span>
                                  )}
                                  style={{ minWidth: '6.5rem', textAlign: 'center' }}
                                />
                                <Column
                                  field="memberCount"
                                  header={t('tier.member_count')}
                                  body={(r: TierDistributionModel) => (
                                    <span className="font-mono">{Number(r.memberCount || 0).toLocaleString()}</span>
                                  )}
                                  style={{ minWidth: '8.5rem', textAlign: 'right' }}
                                />
                                <Column
                                  field="percentage"
                                  header={t('tier.percentage')}
                                  body={(r: TierDistributionModel) => (
                                    <div className="flex align-items-center gap-2">
                                      <ProgressBar
                                        value={Number(r.percentage || 0)}
                                        showValue={false}
                                        style={{ height: '0.5rem', width: '8rem' }}
                                      />
                                      <span className="font-mono text-xs">{Number(r.percentage || 0).toFixed(1)}%</span>
                                    </div>
                                  )}
                                  style={{ minWidth: '13rem' }}
                                />
                              </DataTable>
                            )}
                          </TabPanel>
                        </TabView>
                      </div>
                    </div>

                    {/* Dialog Sửa Hạng */}
                    <Dialog
                      visible={showDialog}
                      style={{ width: '36rem' }}
                      breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                      header={formData.id ? t('tier.edit_title', 'Chỉnh sửa hạng') : t('common.add_new', 'Thêm mới hạng')}
                      modal
                      onHide={() => setShowDialog(false)}
                    >
                      <div className="p-fluid">
                      <div className="formgrid grid mb-3">
                        <div className="field col-6 mb-0">
                          <label htmlFor="tierCode" className="font-medium text-900">
                            {t('tier.code', 'Mã hạng')} <span className="text-red-500">*</span>
                          </label>
                          <Dropdown
                            id="tierCode"
                            value={formData.code}
                            options={tierCodeOptions}
                            onChange={(e) => setFormData({ ...formData, code: e.value })}
                            placeholder={t('tier.select_code', 'Chọn mã hạng')}
                            disabled={Boolean(formData.id)}
                          />
                        </div>
                        <div className="field col-6 mb-0">
                          <label htmlFor="tierLevel" className="font-medium text-900">
                            {t('tier.level', 'Cấp bậc (Level)')} <span className="text-red-500">*</span>
                          </label>
                          <InputNumber
                            id="tierLevel"
                            value={formData.tierLevel ?? 1}
                            onValueChange={(e) => setFormData({ ...formData, tierLevel: e.value ?? 1 })}
                            min={1}
                            max={10}
                          />
                        </div>
                      </div>
                      <div className="field mb-3">
                        <label htmlFor="tierName" className="font-medium text-900">
                          {t('tier.name', 'Tên hạng')} <span className="text-red-500">*</span>
                        </label>
                        <InputText
                          id="tierName"
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="formgrid grid mb-3">
                        <div className="field col-6 mb-0">
                          <label htmlFor="minPoints" className="font-medium">
                            {t('tier.upgrade_points')}
                          </label>
                          <InputNumber
                            id="minPoints"
                            value={formData.minPoints ?? 0}
                            onValueChange={(e) => setFormData({ ...formData, minPoints: e.value ?? 0 })}
                            min={0}
                          />
                        </div>
                        <div className="field col-6 mb-0">
                          <label htmlFor="keepTierPoints" className="font-medium">
                            {t('tier.keep_tier')}
                          </label>
                          <InputNumber
                            id="keepTierPoints"
                            value={formData.keepTierPoints ?? 0}
                            onValueChange={(e) => setFormData({ ...formData, keepTierPoints: e.value ?? 0 })}
                            min={0}
                          />
                        </div>
                      </div>
                      <div className="formgrid grid mb-3">
                        <div className="field col-6 mb-0">
                          <label htmlFor="pointMultiplier" className="font-medium">
                            {t('tier.multiplier')}
                          </label>
                          <InputNumber
                            id="pointMultiplier"
                            value={formData.pointMultiplier ?? 1.0}
                            onValueChange={(e) => setFormData({ ...formData, pointMultiplier: e.value ?? 1.0 })}
                            minFractionDigits={1}
                            maxFractionDigits={2}
                          />
                        </div>
                        <div className="field col-6 mb-0">
                          <label htmlFor="freeDailyTurns" className="font-medium">
                            {t('tier.free_turns')}
                          </label>
                          <InputNumber
                            id="freeDailyTurns"
                            value={formData.freeDailyTurns ?? 1}
                            onValueChange={(e) => setFormData({ ...formData, freeDailyTurns: e.value ?? 1 })}
                            min={0}
                          />
                        </div>
                      </div>
                      <div className="field mb-3">
                        <label htmlFor="tierDescription" className="font-medium">
                          {t('tier.description')}
                        </label>
                        <InputText
                          id="tierDescription"
                          value={formData.description || ''}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>
                      <div className="field mb-3">
                        <label htmlFor="status" className="font-medium">
                          {t('common.status')}
                        </label>
                        <Dropdown
                          id="status"
                          value={formData.status || CommonStatus.ACTIVE}
                          options={statusOptions}
                          onChange={(e) => setFormData({ ...formData, status: e.value })}
                        />
                      </div>
                      </div>
                      <div className="flex justify-content-end gap-2 mt-4">
                        <Button
                          label={t('common.cancel')}
                          icon="pi pi-times"
                          outlined
                          onClick={() => setShowDialog(false)}
                          disabled={isSubmitting}
                        />
                        <Button
                          label={t('common.save')}
                          icon="pi pi-check"
                          onClick={saveItem}
                          loading={isSubmitting}
                          disabled={isSubmitting}
                        />
                      </div>
                    </Dialog>

                    {/* Dialog Period Settings */}
                    <Dialog
                      visible={showPeriodDialog}
                      style={{ width: '30rem' }}
                      header={t('tier.period_settings_title')}
                      modal
                      onHide={() => setShowPeriodDialog(false)}
                    >
                      <div className="p-fluid">
                      <div className="field mb-3">
                        <label className="font-medium text-sm">
                          {t('tier.cycle_months')}
                        </label>
                        <InputNumber
                          value={cycleMonths}
                          onValueChange={(e) => setCycleMonths(e.value ?? 12)}
                          min={1}
                          max={24}
                        />
                      </div>
                      <div className="field mb-3">
                        <label className="font-medium text-sm">
                          {t('tier.warning_days')}
                        </label>
                        <InputNumber
                          value={warningDaysBeforeEnd}
                          onValueChange={(e) => setWarningDaysBeforeEnd(e.value ?? 30)}
                          min={7}
                          max={90}
                        />
                      </div>
                      <div className="field mb-3">
                        <label className="font-medium text-sm">
                          {t('tier.max_downgrade_steps')}
                        </label>
                        <InputNumber
                          value={maxDowngradeSteps}
                          onValueChange={(e) => setMaxDowngradeSteps(e.value ?? 1)}
                          min={1}
                          max={3}
                        />
                      </div>
                      </div>
                      <div className="flex justify-content-end gap-2 mt-3">
                        <Button
                          label={t('common.cancel')}
                          icon="pi pi-times"
                          outlined
                          onClick={() => setShowPeriodDialog(false)}
                        />
                        <Button
                          label={t('common.save')}
                          icon="pi pi-check"
                          onClick={handleSavePeriodSettings}
                          loading={isSubmitting}
                        />
                      </div>
      </Dialog>
    </div>
  );
};

export default TierManagementPage;
