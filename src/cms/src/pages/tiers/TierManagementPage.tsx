import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { TabView, TabPanel } from 'primereact/tabview';
import { ProgressBar } from 'primereact/progressbar';
import { Skeleton } from 'primereact/skeleton';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
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
  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [distribution, setDistribution] = useState<TierDistributionModel[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<TierConfig[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showPeriodDialog, setShowPeriodDialog] = useState(false);
  const [cycleMonths, setCycleMonths] = useState<number>(12);
  const [warningDaysBeforeEnd, setWarningDaysBeforeEnd] = useState<number>(30);
  const [maxDowngradeSteps, setMaxDowngradeSteps] = useState<number>(1);
  const [formData, setFormData] = useState<Partial<TierConfig>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [distLoading, setDistLoading] = useState(false);

  const displayTiers = useMemo(() => tiers.map((item) => ({ ...item })), [tiers, i18n.language]);

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
              tierLevel: item.tierLevel,
              minPoints: resolvedMin,
              keepTierPoints: resolvedKeep,
              pointMultiplier: item.pointMultiplier,
              freeDailyTurns: item.freeDailyTurns,
              description: item.description,
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
        summary: t('toast.error', { defaultValue: 'Lỗi' }),
        detail: t('tier.load_failed', {
          defaultValue: 'Không thể tải dữ liệu hạng hội viên từ máy chủ',
        }),
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

  const editItem = (item: TierConfig) => {
    setFormData({ ...item });
    setShowDialog(true);
  };

  const saveItem = async () => {
    if (!formData.code) return;
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
        summary: t('toast.success', { defaultValue: 'Thành công' }),
        detail: t('tier.save_success', {
          defaultValue: 'Cập nhật cấu hình hạng hội viên thành công',
        }),
        life: 3000,
      });

      setShowDialog(false);
      await fetchTiers();
    } catch {
      toastRef.current?.show({
        severity: 'error',
        summary: t('toast.error', { defaultValue: 'Lỗi' }),
        detail: t('tier.save_failed', {
          defaultValue: 'Cập nhật cấu hình hạng hội viên thất bại',
        }),
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
          reason: `Cấu hình chu kỳ xét hạng ${cycleMonths} tháng, cảnh báo trước ${warningDaysBeforeEnd} ngày, hạ tối đa ${maxDowngradeSteps} bậc`,
        },
        selectedTenant
      );
      toastRef.current?.show({
        severity: 'success',
        summary: t('toast.success', { defaultValue: 'Thành công' }),
        detail: t('tier.period_saved', {
          defaultValue: 'Đã gửi cấu hình chu kỳ xét hạng sang hàng đợi phê duyệt!',
        }),
        life: 3000,
      });
      setShowPeriodDialog(false);
    } catch {
      toastRef.current?.show({
        severity: 'error',
        summary: t('toast.error', { defaultValue: 'Lỗi' }),
        detail: t('tier.period_save_failed', {
          defaultValue: 'Không thể lưu cấu hình chu kỳ xét hạng',
        }),
        life: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const actionTemplate = (rowData: TierConfig) => (
    <div className="flex justify-content-center">
      <Button
        icon="pi pi-pencil"
        rounded
        outlined
        severity="warning"
        size="small"
        onClick={() => editItem(rowData)}
        tooltip={t('common.edit', { defaultValue: 'Sửa' })}
      />
    </div>
  );

  const codeTemplate = (rowData: TierConfig) => (
    <span className="font-mono text-700 white-space-nowrap" style={{ fontSize: '13px' }}>
      {rowData.code}
    </span>
  );

  const nameTemplate = (rowData: TierConfig) => (
    <span className="font-medium text-900" style={{ fontSize: '13px' }}>
      {rowData.name}
    </span>
  );

  const levelTemplate = (rowData: TierConfig) => (
    <span className="text-700 font-mono" style={{ fontSize: '13px' }}>
      {rowData.tierLevel}
    </span>
  );

  const pointsTemplate = (rowData: TierConfig) => (
    <span className="text-800 font-mono white-space-nowrap" style={{ fontSize: '13px' }}>
      {(rowData.minPoints ?? 0).toLocaleString()}{' '}
      <span className="text-500 text-xs">{t('tier.points_unit', { defaultValue: 'điểm' })}</span>
    </span>
  );

  const keepPointsTemplate = (rowData: TierConfig) => (
    <span className="text-teal-700 font-mono white-space-nowrap" style={{ fontSize: '13px' }}>
      {(rowData.keepTierPoints ?? 0).toLocaleString()}{' '}
      <span className="text-500 text-xs">{t('tier.points_unit', { defaultValue: 'điểm' })}</span>
    </span>
  );

  const multiplierTemplate = (rowData: TierConfig) => (
    <span className="text-primary font-mono" style={{ fontSize: '13px' }}>
      ×{Number(rowData.pointMultiplier ?? 1.0).toFixed(2)}
    </span>
  );

  const turnsTemplate = (rowData: TierConfig) => (
    <span className="text-700 font-mono white-space-nowrap" style={{ fontSize: '13px' }}>
      {rowData.freeDailyTurns}{' '}
      <span className="text-500 text-xs">{t('tier.turns_unit', { defaultValue: 'lượt' })}</span>
    </span>
  );

  const descriptionTemplate = (rowData: TierConfig) => (
    <span className="text-600 text-xs line-height-2" style={{ maxWidth: '16rem', display: 'inline-block' }}>
      {rowData.description || '—'}
    </span>
  );

  const statusTemplate = (rowData: TierConfig) => {
    return rowData.status === CommonStatus.ACTIVE ? (
      <Tag severity="success" value={t('common.active', { defaultValue: 'Hoạt động' })} />
    ) : (
      <Tag severity="danger" value={t('common.inactive', { defaultValue: 'Tạm dừng' })} />
    );
  };

  const statusOptions = useMemo(
    () => [
      { label: t('common.active', { defaultValue: 'Hoạt động' }), value: CommonStatus.ACTIVE },
      { label: t('common.inactive', { defaultValue: 'Tạm dừng' }), value: CommonStatus.INACTIVE },
    ],
    [t]
  );

  const totalMembersInDistribution = useMemo(
    () => distribution.reduce((sum, d) => sum + (d.memberCount || 0), 0),
    [distribution]
  );

  const header = (
    <div className="flex flex-wrap gap-3 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0 text-primary font-bold">
          {t('tier.management_title', {
            defaultValue: 'Quản trị Hạng Hội Viên & Ma Trận Đặc Quyền',
          })}
        </h4>
      </div>
      <div className="flex flex-wrap align-items-center gap-2">
        <TenantSelector
          value={selectedTenant}
          onChange={(newTenantId) => {
            setSelectedTenant(newTenantId);
            localStorage.setItem('selected_tenant_id', newTenantId);
          }}
        />
        <Button
          icon="pi pi-refresh"
          rounded
          outlined
          severity="secondary"
          onClick={() => {
            fetchTiers();
            fetchDistribution();
          }}
          loading={loading || distLoading}
          tooltip={t('common.refresh', { defaultValue: 'Làm mới' })}
        />
      </div>
    </div>
  );

  return (
    <div>
      <Toast ref={toastRef} />
      <ConfirmDialog />
      <AppBreadcrumb items={[{ label: t('nav.tiers', { defaultValue: 'Hạng Hội Viên' }) }]} />

      {/* HV-04 Banner với ngưỡng chuẩn 0 / 1.000 / 5.000 / 15.000 và nút gọn trong banner */}
      <div className="card shadow-1 border-round surface-card p-3 mb-3 border-left-3 border-primary">
        <div className="flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="flex flex-column gap-1">
            <div className="flex align-items-center gap-2">
              <i className="pi pi-star-fill text-primary" />
              <span className="font-semibold text-900">
                {t('tier.cycle_banner_title', {
                  defaultValue:
                    'Chuẩn xét hạng 12 tháng: Lên hạng tức thời (0 / 1.000 / 5.000 / 15.000 điểm)',
                })}
              </span>
            </div>
            <span className="text-xs text-600">
              {t('tier.cycle_banner_desc', {
                defaultValue:
                  'Ngưỡng giữ hạng tương ứng 0 / 800 / 4.000 / 12.000 điểm • Cảnh báo trước 30 ngày • Hạ tối đa 1 bậc mỗi chu kỳ',
              })}
            </span>
          </div>
          <div className="flex flex-wrap align-items-center gap-2">
            <Button
              label={t('tier.period_settings', { defaultValue: 'Period settings' })}
              icon="pi pi-calendar-times"
              size="small"
              outlined
              severity="secondary"
              onClick={() => setShowPeriodDialog(true)}
            />
            <Button
              label={t('tier.view_distribution', { defaultValue: 'View tier distribution' })}
              icon="pi pi-chart-pie"
              size="small"
              outlined
              severity="info"
              onClick={() => setActiveTabIndex(1)}
            />
          </div>
        </div>
      </div>

      <div className="card shadow-1 border-round surface-card p-4">
        <TabView activeIndex={activeTabIndex} onTabChange={(e) => setActiveTabIndex(e.index)}>
          <TabPanel
            header={t('tier.tab_config', { defaultValue: 'Cấu hình Hạng Hội viên (HV-04)' })}
            leftIcon="pi pi-sliders-h mr-2"
          >
            <DataTable<any>
              key={`${i18n.language}_${selectedTenant}`}
              value={displayTiers}
              selection={selectedTiers}
              onSelectionChange={(e: any) => setSelectedTiers(e.value || [])}
              header={header}
              loading={loading}
              dataKey="id"
              paginator
              rows={10}
              emptyMessage={t('common.no_data', {
                defaultValue: 'Không có dữ liệu hạng hội viên',
              })}
              stripedRows
              responsiveLayout="scroll"
            >
              <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
              <Column
                header={t('common.stt', { defaultValue: 'STT' })}
                body={(_, options) => (
                  <span className="font-mono text-xs text-600">{options.rowIndex + 1}</span>
                )}
                style={{ width: '3.5rem', textAlign: 'center' }}
              />
              <Column
                body={actionTemplate}
                exportable={false}
                header={t('common.actions', { defaultValue: 'Thao tác' })}
                style={{ width: '5rem', textAlign: 'center' }}
              />
              <Column
                field="code"
                body={codeTemplate}
                header={
                  <span title={t('tier.code_tooltip', { defaultValue: 'Mã định danh hạng hội viên' })}>
                    {t('tier.code', { defaultValue: 'Mã Hạng' })}
                  </span>
                }
                sortable
                style={{ minWidth: '7.5rem' }}
              />
              <Column
                field="name"
                body={nameTemplate}
                header={
                  <span title={t('tier.name_tooltip', { defaultValue: 'Tên cấu hình hạng hội viên' })}>
                    {t('tier.name', { defaultValue: 'Tên Hạng' })}
                  </span>
                }
                sortable
                style={{ minWidth: '12rem' }}
              />
              <Column
                field="tierLevel"
                body={levelTemplate}
                header={
                  <span title={t('tier.level_tooltip', { defaultValue: 'Cấp độ phân hạng (1 đến 4)' })}>
                    {t('tier.level', { defaultValue: 'Cấp' })}
                  </span>
                }
                sortable
                style={{ minWidth: '5rem', textAlign: 'center' }}
              />
              <Column
                field="minPoints"
                body={pointsTemplate}
                header={
                  <span
                    title={t('tier.min_points_tooltip', {
                      defaultValue: 'Ngưỡng điểm lên hạng tích lũy (0 / 1.000 / 5.000 / 15.000)',
                    })}
                  >
                    {t('tier.upgrade_points', { defaultValue: 'Ngưỡng Lên Hạng' })}
                  </span>
                }
                sortable
                style={{ minWidth: '9.5rem' }}
              />
              <Column
                field="keepTierPoints"
                body={keepPointsTemplate}
                header={
                  <span
                    title={t('tier.keep_points_tooltip', {
                      defaultValue: 'Ngưỡng điểm giữ hạng cuối chu kỳ (0 / 800 / 4.000 / 12.000)',
                    })}
                  >
                    {t('tier.keep_tier', { defaultValue: 'Giữ Hạng (Keep tier)' })}
                  </span>
                }
                sortable
                style={{ minWidth: '10.5rem' }}
              />
              <Column
                field="pointMultiplier"
                body={multiplierTemplate}
                header={
                  <span
                    title={t('tier.multiplier_tooltip', {
                      defaultValue: 'Hệ số nhân điểm thưởng khi tích điểm',
                    })}
                  >
                    {t('tier.multiplier', { defaultValue: 'Hệ Số' })}
                  </span>
                }
                sortable
                style={{ minWidth: '6.5rem', textAlign: 'center' }}
              />
              <Column
                field="freeDailyTurns"
                body={turnsTemplate}
                header={
                  <span
                    title={t('tier.free_turns_tooltip', {
                      defaultValue: 'Số lượt quay may mắn miễn phí mỗi ngày',
                    })}
                  >
                    {t('tier.free_turns', { defaultValue: 'Lượt/Ngày' })}
                  </span>
                }
                sortable
                style={{ minWidth: '7.5rem', textAlign: 'center' }}
              />
              <Column
                field="description"
                body={descriptionTemplate}
                header={
                  <span
                    title={t('tier.description_tooltip', {
                      defaultValue: 'Mô tả quyền lợi và chính sách hạng',
                    })}
                  >
                    {t('tier.description', { defaultValue: 'Mô Tả' })}
                  </span>
                }
                style={{ minWidth: '12rem' }}
              />
              <Column
                field="status"
                body={statusTemplate}
                header={
                  <span
                    title={t('common.status_tooltip', {
                      defaultValue: 'Trạng thái hoạt động',
                    })}
                  >
                    {t('common.status', { defaultValue: 'Trạng Thái' })}
                  </span>
                }
                sortable
                style={{ minWidth: '8rem', textAlign: 'center' }}
              />
            </DataTable>
          </TabPanel>

          <TabPanel
            header={t('tier.tab_distribution', { defaultValue: 'Phân bổ Hạng Hội viên (HV-06)' })}
            leftIcon="pi pi-chart-pie mr-2"
          >
            <div className="flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="m-0 text-900 font-bold">
                  {t('tier.distribution_title', {
                    defaultValue: 'Phân bổ Hội viên theo Hạng (Chuẩn 0 / 1.000 / 5.000 / 15.000)',
                  })}
                </h5>
                <span className="text-xs text-500">
                  {t('tier.distribution_total', {
                    count: totalMembersInDistribution,
                    defaultValue: `Tổng số hội viên ghi nhận: ${totalMembersInDistribution.toLocaleString()}`,
                  })}
                </span>
              </div>
              <Button
                label={t('common.refresh', { defaultValue: 'Làm mới' })}
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
                emptyMessage={t('tier.distribution_empty', {
                  defaultValue: 'Chưa có dữ liệu phân bổ hội viên từ máy chủ',
                })}
                responsiveLayout="scroll"
              >
                <Column
                  field="tierCode"
                  header={t('tier.code', { defaultValue: 'Mã Hạng' })}
                  body={(r: TierDistributionModel) => (
                    <span className="font-mono text-primary white-space-nowrap">{r.tierCode}</span>
                  )}
                  style={{ minWidth: '8rem' }}
                />
                <Column
                  field="tierName"
                  header={t('tier.name', { defaultValue: 'Tên Hạng' })}
                  style={{ minWidth: '12rem' }}
                />
                <Column
                  header={t('tier.threshold_range', { defaultValue: 'Khoảng Điểm Xét Hạng' })}
                  body={(r: TierDistributionModel) => {
                    const std = STANDARD_THRESHOLD_MAP[r.tierLevel];
                    return (
                      <span className="font-mono text-xs text-700 white-space-nowrap">
                        {std ? `${std.rangeLabel} điểm (Giữ: ${std.keep.toLocaleString()})` : '—'}
                      </span>
                    );
                  }}
                  style={{ minWidth: '14rem' }}
                />
                <Column
                  field="pointMultiplier"
                  header={t('tier.multiplier', { defaultValue: 'Hệ Số' })}
                  body={(r: TierDistributionModel) => (
                    <span className="font-mono text-primary">
                      ×{Number(r.pointMultiplier || 1).toFixed(2)}
                    </span>
                  )}
                  style={{ minWidth: '6.5rem', textAlign: 'center' }}
                />
                <Column
                  field="memberCount"
                  header={t('tier.member_count', { defaultValue: 'Số Hội Viên' })}
                  body={(r: TierDistributionModel) => (
                    <span className="font-mono">{Number(r.memberCount || 0).toLocaleString()}</span>
                  )}
                  style={{ minWidth: '8.5rem', textAlign: 'right' }}
                />
                <Column
                  field="percentage"
                  header={t('tier.percentage', { defaultValue: 'Tỷ Lệ (%)' })}
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

      {/* Dialog Sửa Hạng */}
      <Dialog
        visible={showDialog}
        style={{ width: '34rem' }}
        breakpoints={{ '960px': '75vw', '641px': '90vw' }}
        header={t('tier.edit_title', { defaultValue: 'Cập nhật Cấu hình Hạng Hội Viên' })}
        modal
        className="p-fluid"
        onHide={() => setShowDialog(false)}
      >
        <div className="field mb-3">
          <label htmlFor="tierName" className="font-medium">
            {t('tier.name', { defaultValue: 'Tên Hạng' })}
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
              {t('tier.upgrade_points', { defaultValue: 'Ngưỡng Lên Hạng' })}
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
              {t('tier.keep_tier', { defaultValue: 'Ngưỡng Giữ Hạng' })}
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
              {t('tier.multiplier', { defaultValue: 'Hệ số nhân điểm' })}
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
              {t('tier.free_turns', { defaultValue: 'Lượt quay/ngày' })}
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
            {t('tier.description', { defaultValue: 'Mô tả quyền lợi' })}
          </label>
          <InputText
            id="tierDescription"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="status" className="font-medium">
            {t('common.status', { defaultValue: 'Trạng thái' })}
          </label>
          <Dropdown
            id="status"
            value={formData.status || CommonStatus.ACTIVE}
            options={statusOptions}
            onChange={(e) => setFormData({ ...formData, status: e.value })}
          />
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            label={t('common.cancel', { defaultValue: 'Hủy' })}
            icon="pi pi-times"
            outlined
            onClick={() => setShowDialog(false)}
            disabled={isSubmitting}
          />
          <Button
            label={t('common.save', { defaultValue: 'Lưu thay đổi' })}
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
        header={t('tier.period_settings_title', { defaultValue: 'Cài đặt Chu kỳ Xét hạng (HV-04)' })}
        modal
        className="p-fluid"
        onHide={() => setShowPeriodDialog(false)}
      >
        <div className="field mb-3">
          <label className="font-medium text-sm">
            {t('tier.cycle_months', { defaultValue: 'Độ dài chu kỳ xét hạng (tháng)' })}
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
            {t('tier.warning_days', { defaultValue: 'Cảnh báo thiếu điểm giữ hạng trước (ngày)' })}
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
            {t('tier.max_downgrade_steps', { defaultValue: 'Số bậc hạ tối đa mỗi chu kỳ' })}
          </label>
          <InputNumber
            value={maxDowngradeSteps}
            onValueChange={(e) => setMaxDowngradeSteps(e.value ?? 1)}
            min={1}
            max={3}
          />
        </div>
        <div className="flex justify-content-end gap-2 mt-3">
          <Button
            label={t('common.cancel', { defaultValue: 'Hủy' })}
            icon="pi pi-times"
            outlined
            onClick={() => setShowPeriodDialog(false)}
          />
          <Button
            label={t('common.save', { defaultValue: 'Lưu & Gửi duyệt' })}
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
