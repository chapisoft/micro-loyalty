import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { CommonStatus } from '@/models';
import { LoyaltyService, MilestoneItemModel, VoucherItemModel } from '@/service/loyalty.service';

export enum CampaignMetric {
  BILL_AMOUNT = 'BILL_AMOUNT',
  TRANSACTION_COUNT = 'TRANSACTION_COUNT',
  EARN_POINTS = 'EARN_POINTS',
  GAME_SPINS = 'GAME_SPINS',
}

export interface CampaignMilestoneItem {
  id: number;
  campaignCode: string;
  campaignName: string;
  milestoneStep: number;
  targetMetric: CampaignMetric;
  targetValue: number;
  rewardPoints: number;
  rewardVoucherId?: number;
  rewardGameTurns: number;
  status: CommonStatus;
  startDate: string;
  endDate: string;
}

export const CampaignMilestonesPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [campaigns, setCampaigns] = useState<CampaignMilestoneItem[]>([]);
  const [vouchers, setVouchers] = useState<VoucherItemModel[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<CampaignMilestoneItem[]>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<CampaignMilestoneItem>>({});
  const [isNewCampaignMode, setIsNewCampaignMode] = useState(true);
  const [selectedCampaignCode, setSelectedCampaignCode] = useState<string>('');
  const [isEdit, setIsEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Tải danh sách Cột mốc theo Liên minh
  const fetchMilestones = useCallback(async (tenantId: string) => {
    setLoading(true);
    try {
      const data = await LoyaltyService.getMilestones(tenantId);
      if (data && data.length > 0) {
        setCampaigns(
          data.map((m: MilestoneItemModel) => ({
            id: m.id || 0,
            campaignCode: m.campaignCode,
            campaignName: m.campaignName,
            milestoneStep: m.milestoneStep || 1,
            targetMetric: (m.targetMetric as CampaignMetric) || CampaignMetric.BILL_AMOUNT,
            targetValue: m.targetValue || 0,
            rewardPoints: m.rewardPoints || 0,
            rewardVoucherId: m.rewardVoucherId,
            rewardGameTurns: m.rewardGameTurns || 0,
            status: (m.status as CommonStatus) || CommonStatus.ACTIVE,
            startDate: m.startDate ? String(m.startDate).substring(0, 10) : new Date().toISOString().substring(0, 10),
            endDate: m.endDate ? String(m.endDate).substring(0, 10) : new Date(Date.now() + 180 * 86400000).toISOString().substring(0, 10),
          }))
        );
      } else {
        setCampaigns([]);
      }
    } catch (e) {
      console.error('[fetchMilestones] Error:', e);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Tải kho Voucher theo Liên minh để phục vụ chọn Voucher thưởng
  const fetchVouchers = useCallback(async (tenantId: string) => {
    try {
      const data = await LoyaltyService.getVouchers(tenantId);
      setVouchers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[fetchVouchers] Error:', e);
      setVouchers([]);
    }
  }, []);

  // Kích hoạt khi đổi Tenant
  const handleTenantChange = (newTenantId: string) => {
    setSelectedTenant(newTenantId);
    localStorage.setItem('selected_tenant_id', newTenantId);
    fetchMilestones(newTenantId);
    fetchVouchers(newTenantId);
  };

  useEffect(() => {
    fetchMilestones(selectedTenant);
    fetchVouchers(selectedTenant);
  }, [selectedTenant, fetchMilestones, fetchVouchers]);

  // Danh sách các Chiến dịch Cha duy nhất đang có
  const existingCampaigns = useMemo(() => {
    const map = new Map<string, string>();
    campaigns.forEach((c) => {
      if (c.campaignCode) map.set(c.campaignCode, c.campaignName);
    });
    return Array.from(map.entries()).map(([code, name]) => ({
      label: `${name} (${code})`,
      value: code,
      name: name,
    }));
  }, [campaigns]);

  // Dropdown Voucher từ kho
  const voucherOptions = useMemo(() => {
    return [
      { label: `-- ${t('milestone.reward_voucher_placeholder', { defaultValue: 'Không tặng voucher' })} --`, value: null },
      ...vouchers.map((v) => ({
        label: `[${v.code}] ${v.title} (${v.discountValue} ${v.discountType === 'PERCENT' ? '%' : 'HTG'})`,
        value: v.id,
      })),
    ];
  }, [vouchers, t]);

  // Mở modal tạo mới
  const openNew = () => {
    const today = new Date().toISOString().substring(0, 10);
    const endSixMonths = new Date(Date.now() + 180 * 86400000).toISOString().substring(0, 10);

    setFormData({
      campaignCode: 'CAMP_' + Math.floor(1000 + Math.random() * 9000),
      campaignName: '',
      milestoneStep: 1,
      targetMetric: CampaignMetric.BILL_AMOUNT,
      targetValue: 1000,
      rewardPoints: 100,
      rewardGameTurns: 1,
      rewardVoucherId: undefined,
      status: CommonStatus.ACTIVE,
      startDate: today,
      endDate: endSixMonths,
    });
    setIsNewCampaignMode(true);
    setSelectedCampaignCode('');
    setIsEdit(false);
    setShowDialog(true);
  };

  // Chọn chiến dịch có sẵn để thêm chặng tiếp theo
  const handleExistingCampaignSelect = (code: string) => {
    setSelectedCampaignCode(code);
    const matched = existingCampaigns.find((c) => c.value === code);
    const campaignMilestones = campaigns.filter((c) => c.campaignCode === code);
    const maxStep = campaignMilestones.reduce((max, c) => Math.max(max, c.milestoneStep), 0);

    setFormData((prev) => ({
      ...prev,
      campaignCode: code,
      campaignName: matched ? matched.name : prev.campaignName,
      milestoneStep: maxStep + 1,
    }));
  };

  // Mở modal chỉnh sửa
  const editItem = (item: CampaignMilestoneItem) => {
    setFormData({ ...item });
    setIsEdit(true);
    setShowDialog(true);
  };

  // Xóa cột mốc
  const deleteItem = (item: CampaignMilestoneItem) => {
    confirmDialog({
      message: t('milestone.delete_confirm_msg', {
        step: item.milestoneStep,
        name: item.campaignName,
        defaultValue: `Bạn có chắc chắn muốn xóa chặng ${item.milestoneStep} của chiến dịch "${item.campaignName}"? Thao tác này không thể hoàn tác.`,
      }),
      header: t('milestone.delete_confirm_title', { defaultValue: 'Xác nhận Xóa Cột Mốc' }),
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: t('common.yes', { defaultValue: 'Xác nhận xóa' }),
      rejectLabel: t('common.no', { defaultValue: 'Hủy' }),
      accept: async () => {
        setLoading(true);
        try {
          await LoyaltyService.deleteMilestone(item.id, selectedTenant);
          toast.current?.show({
            severity: 'success',
            summary: t('common.success', { defaultValue: 'Thành công' }),
            detail: t('milestone.delete_success', { defaultValue: 'Đã xóa cột mốc chiến dịch thành công!' }),
            life: 3000,
          });
          await fetchMilestones(selectedTenant);
        } catch (e: any) {
          console.error('[deleteMilestone] Error:', e);
          toast.current?.show({
            severity: 'error',
            summary: t('common.error', { defaultValue: 'Lỗi' }),
            detail: e?.message || 'Không thể xóa cột mốc, vui lòng thử lại sau!',
            life: 4000,
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Lưu cột mốc
  const handleSaveConfirmed = async () => {
    setIsSubmitting(true);
    try {
      const payload: Partial<MilestoneItemModel> = {
        campaignCode: (formData.campaignCode || '').trim().toUpperCase(),
        campaignName: (formData.campaignName || '').trim(),
        milestoneStep: formData.milestoneStep || 1,
        targetMetric: formData.targetMetric || CampaignMetric.BILL_AMOUNT,
        targetValue: formData.targetValue || 0,
        rewardPoints: formData.rewardPoints || 0,
        rewardVoucherId: formData.rewardVoucherId ? Number(formData.rewardVoucherId) : undefined,
        rewardGameTurns: formData.rewardGameTurns || 0,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : new Date().toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : new Date(Date.now() + 180 * 86400000).toISOString(),
        status: formData.status || CommonStatus.ACTIVE,
      };

      if (isEdit && formData.id) {
        await LoyaltyService.updateMilestone(formData.id, payload, selectedTenant);
        toast.current?.show({
          severity: 'success',
          summary: t('common.success', { defaultValue: 'Thành công' }),
          detail: t('milestone.update_success', { defaultValue: 'Cập nhật cột mốc chiến dịch thành công!' }),
          life: 3000,
        });
      } else {
        await LoyaltyService.createMilestone(payload, selectedTenant);
        toast.current?.show({
          severity: 'success',
          summary: t('common.success', { defaultValue: 'Thành công' }),
          detail: t('milestone.create_success', { defaultValue: 'Thêm mới cột mốc chiến dịch thành công!' }),
          life: 3000,
        });
      }
      setShowDialog(false);
      await fetchMilestones(selectedTenant);
    } catch (e: any) {
      console.error('[saveMilestone] Error:', e);
      toast.current?.show({
        severity: 'error',
        summary: t('common.error', { defaultValue: 'Lỗi' }),
        detail: e?.message || 'Không thể lưu cột mốc chiến dịch, vui lòng thử lại sau!',
        life: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveItem = () => {
    if (!formData.campaignCode || !formData.campaignName) {
      toast.current?.show({
        severity: 'warn',
        summary: t('common.warning', { defaultValue: 'Cảnh báo' }),
        detail: 'Vui lòng nhập đầy đủ Mã chiến dịch và Tên chiến dịch!',
        life: 3000,
      });
      return;
    }

    if (isEdit) {
      confirmDialog({
        message: `Bạn có chắc chắn muốn cập nhật thay đổi cho chặng ${formData.milestoneStep} của chiến dịch "${formData.campaignName}"?`,
        header: t('milestone.edit_title', { defaultValue: 'Chỉnh sửa Cột mốc' }),
        icon: 'pi pi-info-circle',
        acceptLabel: t('common.save', { defaultValue: 'Lưu thay đổi' }),
        rejectLabel: t('common.cancel', { defaultValue: 'Hủy' }),
        accept: handleSaveConfirmed,
      });
    } else {
      handleSaveConfirmed();
    }
  };

  // Cột Thao tác
  const actionTemplate = (rowData: CampaignMilestoneItem) => (
    <div className="flex gap-2 justify-content-center">
      <Button
        icon="pi pi-pencil"
        rounded
        outlined
        severity="warning"
        size="small"
        onClick={() => editItem(rowData)}
        tooltip={t('common.edit', { defaultValue: 'Sửa' })}
      />
      <Button
        icon="pi pi-trash"
        rounded
        outlined
        severity="danger"
        size="small"
        onClick={() => deleteItem(rowData)}
        tooltip={t('common.delete', { defaultValue: 'Xóa' })}
      />
    </div>
  );

  // Cột Trạng thái
  const statusTemplate = (rowData: CampaignMilestoneItem) => {
    return rowData.status === CommonStatus.ACTIVE ? (
      <Tag severity="success" value={t('common.active', { defaultValue: 'Đang diễn ra' })} />
    ) : (
      <Tag severity="danger" value={t('common.inactive', { defaultValue: 'Đã kết thúc' })} />
    );
  };

  // Cột Chỉ tiêu đo lường
  const metricLabelTemplate = (row: CampaignMilestoneItem) => {
    let icon = 'pi pi-dollar';
    let label = t('milestone.metric_bill', { defaultValue: 'Chi tiêu tích lũy (HTG)' });
    let unit = 'HTG';

    switch (row.targetMetric) {
      case CampaignMetric.BILL_AMOUNT:
        icon = 'pi pi-dollar';
        label = t('milestone.metric_bill', { defaultValue: 'Chi tiêu tích lũy' });
        unit = 'HTG';
        break;
      case CampaignMetric.TRANSACTION_COUNT:
        icon = 'pi pi-sync';
        label = t('milestone.metric_tx_count', { defaultValue: 'Số giao dịch' });
        unit = 'lần';
        break;
      case CampaignMetric.EARN_POINTS:
        icon = 'pi pi-star';
        label = t('milestone.metric_points', { defaultValue: 'Điểm tích lũy' });
        unit = 'điểm';
        break;
      case CampaignMetric.GAME_SPINS:
        icon = 'pi pi-bolt';
        label = t('milestone.metric_spins', { defaultValue: 'Lượt quay game' });
        unit = 'lượt';
        break;
    }

    return (
      <div className="flex flex-column gap-1">
        <div className="flex align-items-center gap-1 text-sm text-600">
          <i className={`${icon} text-xs text-primary`} />
          <span>{label}</span>
        </div>
        <span className="font-semibold text-900">
          {Number(row.targetValue).toLocaleString()} {unit}
        </span>
      </div>
    );
  };

  // Cột Phần thưởng tổng hợp
  const rewardTemplate = (row: CampaignMilestoneItem) => {
    const voucher = vouchers.find((v) => v.id === row.rewardVoucherId);

    return (
      <div className="flex flex-wrap gap-2 align-items-center">
        {row.rewardPoints > 0 && (
          <Tag
            severity="warning"
            icon="pi pi-star-fill"
            value={`+${row.rewardPoints} ${t('common.points', { defaultValue: 'Điểm' })}`}
            title={t('milestone.reward_points_tooltip', { defaultValue: 'Điểm thưởng cộng ví' })}
          />
        )}
        {row.rewardGameTurns > 0 && (
          <Tag
            severity="info"
            icon="pi pi-bolt"
            value={`+${row.rewardGameTurns} ${t('common.spins', { defaultValue: 'Lượt quay' })}`}
            title={t('milestone.reward_turns_tooltip', { defaultValue: 'Lượt chơi mini-game' })}
          />
        )}
        {voucher && (
          <Tag
            severity="success"
            icon="pi pi-ticket"
            value={voucher.code}
            title={`${voucher.title} (${voucher.discountValue} ${voucher.discountType === 'PERCENT' ? '%' : 'HTG'})`}
          />
        )}
        {row.rewardPoints === 0 && row.rewardGameTurns === 0 && !voucher && (
          <span className="text-400 text-xs italic">--</span>
        )}
      </div>
    );
  };

  const metricOptions = [
    { label: t('milestone.metric_bill', { defaultValue: 'Chi tiêu tích lũy (HTG)' }), value: CampaignMetric.BILL_AMOUNT },
    { label: t('milestone.metric_tx_count', { defaultValue: 'Số lượng giao dịch hoàn thành' }), value: CampaignMetric.TRANSACTION_COUNT },
    { label: t('milestone.metric_points', { defaultValue: 'Điểm thưởng tích lũy được' }), value: CampaignMetric.EARN_POINTS },
    { label: t('milestone.metric_spins', { defaultValue: 'Lượt quay vòng quay may mắn đã chơi' }), value: CampaignMetric.GAME_SPINS },
  ];

  const statusOptions = [
    { label: t('common.active', { defaultValue: 'Đang diễn ra' }), value: CommonStatus.ACTIVE },
    { label: t('common.inactive', { defaultValue: 'Đã kết thúc' }), value: CommonStatus.INACTIVE },
  ];

  // Header bảng dữ liệu
  const header = (
    <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3">
      <div className="flex align-items-center gap-3">
        <h4 className="m-0 text-primary font-bold">
          <i className="pi pi-flag mr-2 text-xl" />
          {t('milestone.management_title', { defaultValue: 'Cấu hình Cột mốc Chiến dịch (Gamification)' })}
        </h4>
        <TenantSelector value={selectedTenant} onChange={handleTenantChange} />
      </div>
      <div className="flex flex-wrap gap-2 align-items-center">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={t('common.search', { defaultValue: 'Tìm kiếm chiến dịch...' })}
            className="p-inputtext-sm w-14rem"
          />
        </span>
        <Button
          label={t('milestone.add_new', { defaultValue: 'Thêm Cột Mốc' })}
          icon="pi pi-plus"
          severity="success"
          size="small"
          onClick={openNew}
        />
        <Button
          icon="pi pi-refresh"
          outlined
          size="small"
          onClick={() => fetchMilestones(selectedTenant)}
          loading={loading}
          tooltip={t('common.refresh', { defaultValue: 'Làm mới' })}
        />
      </div>
    </div>
  );

  return (
    <div>
      <Toast ref={toast} position="top-center" />
      <ConfirmDialog />
      <AppBreadcrumb items={[{ label: t('nav.milestones', { defaultValue: 'Cột mốc Chiến dịch' }) }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <DataTable<any>
          value={campaigns}
          selection={selectedCampaigns}
          onSelectionChange={(e) => setSelectedCampaigns(e.value as CampaignMilestoneItem[])}
          dataKey="id"
          paginator
          rows={10}
          loading={loading}
          rowsPerPageOptions={[5, 10, 25]}
          header={header}
          globalFilter={globalFilter}
          responsiveLayout="scroll"
          emptyMessage={t('common.no_data', { defaultValue: 'Chưa có chiến dịch cột mốc nào cho liên minh này' })}
        >
          <Column selectionMode="multiple" exportable={false} style={{ width: '3rem' }} />
          <Column
            field="milestoneStep"
            header={<span title={t('milestone.step_tooltip', { defaultValue: 'Thứ tự chặng cột mốc liên tiếp trong chiến dịch' })}>{t('milestone.step', { defaultValue: 'Chặng #' })}</span>}
            body={(row: CampaignMilestoneItem) => (
              <Tag
                value={`Chặng ${row.milestoneStep}`}
                severity={row.milestoneStep === 1 ? 'info' : row.milestoneStep === 2 ? 'warning' : 'danger'}
                rounded
              />
            )}
            sortable
            style={{ textAlign: 'center', width: '6.5rem' }}
          />
          <Column
            field="campaignCode"
            header={t('milestone.code', { defaultValue: 'Mã Chiến Dịch' })}
            body={(row: CampaignMilestoneItem) => (
              <div>
                <div className="font-semibold text-primary">{row.campaignCode}</div>
                <div className="text-sm text-700">{row.campaignName}</div>
              </div>
            )}
            sortable
            style={{ minWidth: '14rem' }}
          />
          <Column
            field="targetMetric"
            header={<span title={t('milestone.metric_tooltip', { defaultValue: 'Chỉ tiêu điều kiện tích lũy để hoàn thành' })}>{t('milestone.metric', { defaultValue: 'Chỉ Tiêu & Mục Tiêu' })}</span>}
            body={metricLabelTemplate}
            sortable
            style={{ minWidth: '12rem' }}
          />
          <Column
            header={<span title={t('milestone.reward_points_tooltip', { defaultValue: 'Phần thưởng khi hoàn thành chặng' })}>{t('common.reward', { defaultValue: 'Phần Thưởng Chặng' })}</span>}
            body={rewardTemplate}
            style={{ minWidth: '13rem' }}
          />
          <Column
            field="startDate"
            header={<span title={t('milestone.date_range', { defaultValue: 'Thời gian diễn ra chiến dịch' })}>{t('milestone.date_range', { defaultValue: 'Thời Gian' })}</span>}
            body={(row: CampaignMilestoneItem) => (
              <span className="text-sm text-600">
                {row.startDate} &rarr; {row.endDate}
              </span>
            )}
            sortable
            style={{ minWidth: '11rem', textAlign: 'center' }}
          />
          <Column field="status" header={t('common.status', { defaultValue: 'Trạng Thái' })} body={statusTemplate} sortable style={{ minWidth: '8.5rem', textAlign: 'center' }} />
          <Column body={actionTemplate} exportable={false} style={{ width: '6rem', textAlign: 'center' }} />
        </DataTable>
      </div>

      <Dialog
        visible={showDialog}
        style={{ width: '560px' }}
        header={isEdit ? t('milestone.edit_title', { defaultValue: 'Chỉnh sửa Cột mốc' }) : t('milestone.create_title', { defaultValue: 'Tạo Cột mốc mới' })}
        modal
        className="p-fluid"
        onHide={() => setShowDialog(false)}
      >
        {/* Lựa chọn Chiến dịch cha nếu đang tạo mới */}
        {!isEdit && existingCampaigns.length > 0 && (
          <div className="field mb-3 surface-100 p-3 border-round">
            <div className="flex gap-4 mb-2">
              <div className="flex align-items-center">
                <input
                  type="radio"
                  id="optNewCamp"
                  name="campMode"
                  checked={isNewCampaignMode}
                  onChange={() => {
                    setIsNewCampaignMode(true);
                    setSelectedCampaignCode('');
                    setFormData((prev) => ({
                      ...prev,
                      campaignCode: 'CAMP_' + Math.floor(1000 + Math.random() * 9000),
                      campaignName: '',
                      milestoneStep: 1,
                    }));
                  }}
                />
                <label htmlFor="optNewCamp" className="ml-2 font-semibold cursor-pointer">
                  {t('milestone.new_campaign', { defaultValue: '+ Tạo Chiến Dịch Mới' })}
                </label>
              </div>
              <div className="flex align-items-center">
                <input
                  type="radio"
                  id="optExistCamp"
                  name="campMode"
                  checked={!isNewCampaignMode}
                  onChange={() => {
                    setIsNewCampaignMode(false);
                    if (existingCampaigns.length > 0) {
                      handleExistingCampaignSelect(existingCampaigns[0].value);
                    }
                  }}
                />
                <label htmlFor="optExistCamp" className="ml-2 font-semibold cursor-pointer">
                  {t('milestone.select_campaign', { defaultValue: 'Chọn Chiến Dịch Đang Có' })}
                </label>
              </div>
            </div>

            {!isNewCampaignMode && (
              <Dropdown
                value={selectedCampaignCode}
                options={existingCampaigns}
                onChange={(e) => handleExistingCampaignSelect(e.value)}
                placeholder={t('milestone.select_campaign', { defaultValue: 'Chọn Chiến Dịch...' })}
                className="w-full mt-2"
                appendTo="self"
              />
            )}
          </div>
        )}

        <div className="formgrid grid mb-3">
          <div className="field col-6">
            <label htmlFor="campaignCode" className="font-bold">
              {t('milestone.code', { defaultValue: 'Mã Chiến dịch' })} <span className="text-red-500">*</span>
            </label>
            <InputText
              id="campaignCode"
              value={formData.campaignCode || ''}
              onChange={(e) => setFormData({ ...formData, campaignCode: e.target.value.toUpperCase() })}
              placeholder={t('milestone.code_placeholder', { defaultValue: 'VD: TOPUP_FESTIVAL_2026' })}
              disabled={isEdit || (!isNewCampaignMode && !!selectedCampaignCode)}
            />
          </div>
          <div className="field col-6">
            <label htmlFor="milestoneStep" className="font-bold">
              {t('milestone.step', { defaultValue: 'Chặng #' })} <span className="text-red-500">*</span>
            </label>
            <InputNumber
              id="milestoneStep"
              value={formData.milestoneStep}
              onValueChange={(e) => setFormData({ ...formData, milestoneStep: e.value || 1 })}
              min={1}
            />
          </div>
        </div>

        <div className="field mb-3">
          <label htmlFor="campaignName" className="font-bold">
            {t('milestone.name', { defaultValue: 'Tên Chiến dịch' })} <span className="text-red-500">*</span>
          </label>
          <InputText
            id="campaignName"
            value={formData.campaignName || ''}
            onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
            placeholder={t('milestone.name_placeholder', { defaultValue: 'VD: Tuần Lễ Vàng Nạp Cước Viễn Thông' })}
            disabled={!isNewCampaignMode && !!selectedCampaignCode && !isEdit}
          />
        </div>

        <div className="formgrid grid mb-3">
          <div className="field col-6">
            <label htmlFor="targetMetric" className="font-bold">{t('milestone.metric', { defaultValue: 'Chỉ tiêu đo lường' })}</label>
            <Dropdown
              id="targetMetric"
              value={formData.targetMetric}
              options={metricOptions}
              onChange={(e) => setFormData({ ...formData, targetMetric: e.value })}
              appendTo="self"
            />
          </div>
          <div className="field col-6">
            <label htmlFor="targetValue" className="font-bold">{t('milestone.target_value', { defaultValue: 'Mục tiêu cần đạt' })}</label>
            <InputNumber
              id="targetValue"
              value={formData.targetValue}
              onValueChange={(e) => setFormData({ ...formData, targetValue: e.value || 0 })}
              min={0}
            />
          </div>
        </div>

        {/* Phần Thưởng Chặng */}
        <div className="surface-50 p-3 border-round mb-3">
          <div className="font-bold text-primary mb-2 flex align-items-center gap-2">
            <i className="pi pi-gift" />
            <span>{t('common.reward', { defaultValue: 'Phần Thưởng Hoàn Thành Chặng' })}</span>
          </div>

          <div className="formgrid grid mb-2">
            <div className="field col-6 mb-0">
              <label htmlFor="rewardPoints" className="text-sm font-semibold">{t('milestone.reward_points', { defaultValue: 'Thưởng Điểm Loyalty' })}</label>
              <InputNumber
                id="rewardPoints"
                value={formData.rewardPoints}
                onValueChange={(e) => setFormData({ ...formData, rewardPoints: e.value || 0 })}
                min={0}
                placeholder="0"
              />
            </div>
            <div className="field col-6 mb-0">
              <label htmlFor="rewardGameTurns" className="text-sm font-semibold">{t('milestone.reward_turns', { defaultValue: 'Thưởng Lượt Quay Game' })}</label>
              <InputNumber
                id="rewardGameTurns"
                value={formData.rewardGameTurns}
                onValueChange={(e) => setFormData({ ...formData, rewardGameTurns: e.value || 0 })}
                min={0}
                placeholder="0"
              />
            </div>
          </div>

          <div className="field mt-2 mb-0">
            <label htmlFor="rewardVoucherId" className="text-sm font-semibold">{t('milestone.reward_voucher', { defaultValue: 'Voucher Quà Tặng (Kho Voucher)' })}</label>
            <Dropdown
              id="rewardVoucherId"
              value={formData.rewardVoucherId}
              options={voucherOptions}
              onChange={(e) => setFormData({ ...formData, rewardVoucherId: e.value })}
              placeholder={t('milestone.reward_voucher_placeholder', { defaultValue: 'Chọn voucher từ kho...' })}
              className="w-full"
              appendTo="self"
            />
          </div>
        </div>

        {/* Thời gian diễn ra & Trạng thái */}
        <div className="formgrid grid mb-3">
          <div className="field col-6">
            <label htmlFor="startDate" className="font-bold">{t('milestone.start_date', { defaultValue: 'Ngày Bắt Đầu' })}</label>
            <Calendar
              id="startDate"
              value={formData.startDate ? new Date(formData.startDate) : null}
              onChange={(e) => setFormData({ ...formData, startDate: e.value ? (e.value as Date).toISOString().substring(0, 10) : '' })}
              dateFormat="yy-mm-dd"
              showIcon
              appendTo="self"
            />
          </div>
          <div className="field col-6">
            <label htmlFor="endDate" className="font-bold">{t('milestone.end_date', { defaultValue: 'Ngày Kết Thúc' })}</label>
            <Calendar
              id="endDate"
              value={formData.endDate ? new Date(formData.endDate) : null}
              onChange={(e) => setFormData({ ...formData, endDate: e.value ? (e.value as Date).toISOString().substring(0, 10) : '' })}
              dateFormat="yy-mm-dd"
              showIcon
              appendTo="self"
            />
          </div>
        </div>

        <div className="field mb-3">
          <label htmlFor="status" className="font-bold">{t('common.status', { defaultValue: 'Trạng Thái' })}</label>
          <Dropdown
            id="status"
            value={formData.status}
            options={statusOptions}
            onChange={(e) => setFormData({ ...formData, status: e.value })}
            appendTo="self"
          />
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} icon="pi pi-times" outlined onClick={() => setShowDialog(false)} />
          <Button label={t('common.save', { defaultValue: 'Lưu Cột Mốc' })} icon="pi pi-check" onClick={saveItem} loading={isSubmitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default CampaignMilestonesPage;
