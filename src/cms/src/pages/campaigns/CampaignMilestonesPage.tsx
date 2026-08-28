import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { CommonStatus } from '@/models';
import { LoyaltyService } from '@/service/loyalty.service';

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
  rewardGameTurns: number;
  status: CommonStatus;
  startDate: string;
  endDate: string;
}

export const CampaignMilestonesPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);
  const [campaigns, setCampaigns] = useState<CampaignMilestoneItem[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<CampaignMilestoneItem[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<CampaignMilestoneItem>>({});
  const [isEdit, setIsEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchMilestones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await LoyaltyService.getMilestones();
      if (data && data.length > 0) {
        setCampaigns(
          data.map((m: any) => ({
            id: m.id,
            campaignCode: m.campaignCode,
            campaignName: m.campaignName,
            milestoneStep: m.milestoneStep || 1,
            targetMetric: (m.targetMetric as CampaignMetric) || CampaignMetric.BILL_AMOUNT,
            targetValue: m.targetValue || 0,
            rewardPoints: m.rewardPoints || 0,
            rewardGameTurns: m.rewardGameTurns || 0,
            status: (m.status as CommonStatus) || CommonStatus.ACTIVE,
            startDate: m.startDate ? String(m.startDate).substring(0, 10) : '2026-08-01',
            endDate: m.endDate ? String(m.endDate).substring(0, 10) : '2026-12-31',
          }))
        );
      }
    } catch (e) {
      console.error('[fetchMilestones] Error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const openNew = () => {
    setFormData({
      campaignCode: 'CAMP_' + Math.floor(Math.random() * 10000),
      campaignName: 'Chiến dịch kích cầu mua sắm',
      milestoneStep: 1,
      targetMetric: CampaignMetric.BILL_AMOUNT,
      targetValue: 1000,
      rewardPoints: 100,
      rewardGameTurns: 1,
      status: CommonStatus.ACTIVE,
      startDate: '2026-08-01',
      endDate: '2026-12-31',
    });
    setIsEdit(false);
    setShowDialog(true);
  };

  const editItem = (item: CampaignMilestoneItem) => {
    setFormData({ ...item });
    setIsEdit(true);
    setShowDialog(true);
  };

  const deleteItem = (item: CampaignMilestoneItem) => {
    confirmDialog({
      message: `Bạn có chắc chắn muốn xóa cột mốc ${item.campaignCode} (${item.campaignName}) khỏi hệ thống?`,
      header: t('common.confirm_delete', { defaultValue: 'Xác nhận xóa cột mốc' }),
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: t('common.yes', { defaultValue: 'Xác nhận xóa' }),
      rejectLabel: t('common.no', { defaultValue: 'Hủy' }),
      accept: async () => {
        setLoading(true);
        try {
          await LoyaltyService.deleteMilestone(item.id);
          toast.current?.show({
            severity: 'success',
            summary: t('common.success', { defaultValue: 'Thành công' }),
            detail: `Đã xóa thành công cột mốc ${item.campaignCode}!`,
            life: 3000,
          });
          await fetchMilestones();
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

  const handleSaveConfirmed = async () => {
    setIsSubmitting(true);
    try {
      if (isEdit && formData.id) {
        await LoyaltyService.updateMilestone(formData.id, {
          campaignName: formData.campaignName,
          targetMetric: formData.targetMetric,
          targetValue: formData.targetValue,
          rewardPoints: formData.rewardPoints,
          rewardGameTurns: formData.rewardGameTurns,
          status: formData.status,
        });
        toast.current?.show({
          severity: 'success',
          summary: t('common.success', { defaultValue: 'Thành công' }),
          detail: `Cập nhật thành công cột mốc ${formData.campaignCode || ''}!`,
          life: 3000,
        });
      } else {
        await LoyaltyService.createMilestone({
          campaignCode: formData.campaignCode || 'NEW_CAMPAIGN',
          campaignName: formData.campaignName || 'Chiến dịch mới',
          milestoneStep: formData.milestoneStep || 1,
          targetMetric: formData.targetMetric || CampaignMetric.BILL_AMOUNT,
          targetValue: formData.targetValue || 1000,
          rewardPoints: formData.rewardPoints || 0,
          rewardGameTurns: formData.rewardGameTurns || 0,
          status: formData.status || CommonStatus.ACTIVE,
        });
        toast.current?.show({
          severity: 'success',
          summary: t('common.success', { defaultValue: 'Thành công' }),
          detail: 'Thêm mới cột mốc chiến dịch thành công!',
          life: 3000,
        });
      }
      setShowDialog(false);
      await fetchMilestones();
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
    if (isEdit) {
      confirmDialog({
        message: `Bạn có chắc chắn muốn cập nhật thay đổi cho cột mốc ${formData.campaignCode || ''}?`,
        header: t('common.confirm_update', { defaultValue: 'Xác nhận cập nhật cột mốc' }),
        icon: 'pi pi-info-circle',
        acceptLabel: t('common.save', { defaultValue: 'Lưu thay đổi' }),
        rejectLabel: t('common.cancel', { defaultValue: 'Hủy' }),
        accept: handleSaveConfirmed,
      });
    } else {
      handleSaveConfirmed();
    }
  };

  const actionTemplate = (rowData: CampaignMilestoneItem) => (
    <div className="flex gap-2">
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

  const statusTemplate = (rowData: CampaignMilestoneItem) => {
    return rowData.status === CommonStatus.ACTIVE ? (
      <Tag severity="success" value={t('common.active', { defaultValue: 'Đang diễn ra' })} />
    ) : (
      <Tag severity="danger" value={t('common.inactive', { defaultValue: 'Đã kết thúc' })} />
    );
  };

  const metricLabelTemplate = (metric: CampaignMetric) => {
    switch (metric) {
      case CampaignMetric.BILL_AMOUNT:
        return t('milestone.metric_bill', { defaultValue: 'Chi tiêu tích lũy (HTG)' });
      case CampaignMetric.TRANSACTION_COUNT:
        return t('milestone.metric_tx_count', { defaultValue: 'Số lượng giao dịch' });
      case CampaignMetric.EARN_POINTS:
        return t('milestone.metric_points', { defaultValue: 'Điểm tích lũy' });
      case CampaignMetric.GAME_SPINS:
        return t('milestone.metric_spins', { defaultValue: 'Lượt quay vòng quay' });
      default:
        return metric;
    }
  };

  const metricOptions = [
    { label: t('milestone.metric_bill', { defaultValue: 'Chi tiêu tích lũy (HTG)' }), value: CampaignMetric.BILL_AMOUNT },
    { label: t('milestone.metric_tx_count', { defaultValue: 'Số lượng giao dịch' }), value: CampaignMetric.TRANSACTION_COUNT },
    { label: t('milestone.metric_points', { defaultValue: 'Điểm tích lũy' }), value: CampaignMetric.EARN_POINTS },
    { label: t('milestone.metric_spins', { defaultValue: 'Lượt quay vòng quay' }), value: CampaignMetric.GAME_SPINS },
  ];

  const statusOptions = [
    { label: t('common.active', { defaultValue: 'Đang diễn ra' }), value: CommonStatus.ACTIVE },
    { label: t('common.inactive', { defaultValue: 'Đã kết thúc' }), value: CommonStatus.INACTIVE },
  ];

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0 text-primary font-bold">{t('milestone.management_title', { defaultValue: 'Cấu hình Cột mốc Chiến dịch (Gamification)' })}</h4>
      <div className="flex gap-2">
        <Button label={t('milestone.add_new', { defaultValue: 'Thêm Cột mốc' })} icon="pi pi-plus" severity="success" onClick={openNew} />
        <Button icon="pi pi-refresh" outlined onClick={fetchMilestones} loading={loading} />
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
          responsiveLayout="scroll"
          emptyMessage={t('common.no_data', { defaultValue: 'Chưa có chiến dịch cột mốc nào' })}
        >
          <Column selectionMode="multiple" exportable={false} style={{ width: '3rem' }} />
          <Column field="campaignCode" header={t('milestone.code', { defaultValue: 'Mã Chiến dịch' })} sortable style={{ fontWeight: 'bold' }} />
          <Column field="campaignName" header={t('milestone.name', { defaultValue: 'Tên Chiến dịch' })} sortable />
          <Column field="milestoneStep" header={t('milestone.step', { defaultValue: 'Chặng #' })} sortable style={{ textAlign: 'center', width: '6rem' }} />
          <Column field="targetMetric" header={t('milestone.metric', { defaultValue: 'Chỉ tiêu đo lường' })} body={(row: CampaignMilestoneItem) => metricLabelTemplate(row.targetMetric)} sortable />
          <Column
            field="targetValue"
            header={t('milestone.target_value', { defaultValue: 'Mục tiêu' })}
            body={(row: CampaignMilestoneItem) => `${row.targetValue.toLocaleString()}`}
            sortable
          />
          <Column
            field="rewardPoints"
            header={t('milestone.reward_points', { defaultValue: 'Thưởng Điểm' })}
            body={(row: CampaignMilestoneItem) => (
              <span className="font-bold text-orange-500">
                <i className="pi pi-star-fill mr-1" />
                +{row.rewardPoints}
              </span>
            )}
            sortable
          />
          <Column
            field="rewardGameTurns"
            header={t('milestone.reward_turns', { defaultValue: 'Thưởng Lượt Game' })}
            body={(row: CampaignMilestoneItem) => (
              <span className="font-bold text-indigo-500">
                <i className="pi pi-bolt mr-1" />
                +{row.rewardGameTurns}
              </span>
            )}
            sortable
          />
          <Column field="status" header={t('common.status', { defaultValue: 'Trạng thái' })} body={statusTemplate} sortable />
          <Column body={actionTemplate} exportable={false} style={{ minWidth: '8rem' }} />
        </DataTable>
      </div>

      <Dialog
        visible={showDialog}
        style={{ width: '480px' }}
        header={isEdit ? t('milestone.edit_title', { defaultValue: 'Chỉnh sửa Cột mốc' }) : t('milestone.add_title', { defaultValue: 'Tạo Cột mốc mới' })}
        modal
        className="p-fluid"
        onHide={() => setShowDialog(false)}
      >
        <div className="field mb-3">
          <label htmlFor="campaignCode" className="font-bold">{t('milestone.code', { defaultValue: 'Mã Chiến dịch' })}</label>
          <InputText
            id="campaignCode"
            value={formData.campaignCode || ''}
            onChange={(e) => setFormData({ ...formData, campaignCode: e.target.value })}
            placeholder="VD: DELIMART_GOLDEN_WEEK"
            disabled={isEdit}
          />
        </div>

        <div className="field mb-3">
          <label htmlFor="campaignName" className="font-bold">{t('milestone.name', { defaultValue: 'Tên Chiến dịch' })}</label>
          <InputText
            id="campaignName"
            value={formData.campaignName || ''}
            onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
            placeholder="VD: Tuần Lễ Vàng Mua Sắm Siêu Thị"
          />
        </div>

        <div className="formgrid grid mb-3">
          <div className="field col-6">
            <label htmlFor="milestoneStep" className="font-bold">{t('milestone.step', { defaultValue: 'Chặng #' })}</label>
            <InputNumber
              id="milestoneStep"
              value={formData.milestoneStep}
              onValueChange={(e) => setFormData({ ...formData, milestoneStep: e.value || 1 })}
              min={1}
            />
          </div>
          <div className="field col-6">
            <label htmlFor="targetMetric" className="font-bold">{t('milestone.metric', { defaultValue: 'Chỉ tiêu' })}</label>
            <Dropdown
              id="targetMetric"
              value={formData.targetMetric}
              options={metricOptions}
              onChange={(e) => setFormData({ ...formData, targetMetric: e.value })}
            />
          </div>
        </div>

        <div className="formgrid grid mb-3">
          <div className="field col-6">
            <label htmlFor="targetValue" className="font-bold">{t('milestone.target_value', { defaultValue: 'Mục tiêu' })}</label>
            <InputNumber
              id="targetValue"
              value={formData.targetValue}
              onValueChange={(e) => setFormData({ ...formData, targetValue: e.value || 0 })}
            />
          </div>
          <div className="field col-6">
            <label htmlFor="rewardPoints" className="font-bold">{t('milestone.reward_points', { defaultValue: 'Thưởng Điểm' })}</label>
            <InputNumber
              id="rewardPoints"
              value={formData.rewardPoints}
              onValueChange={(e) => setFormData({ ...formData, rewardPoints: e.value || 0 })}
            />
          </div>
        </div>

        <div className="formgrid grid mb-3">
          <div className="field col-6">
            <label htmlFor="rewardGameTurns" className="font-bold">{t('milestone.reward_turns', { defaultValue: 'Thưởng Lượt Quay' })}</label>
            <InputNumber
              id="rewardGameTurns"
              value={formData.rewardGameTurns}
              onValueChange={(e) => setFormData({ ...formData, rewardGameTurns: e.value || 0 })}
            />
          </div>
          <div className="field col-6">
            <label htmlFor="status" className="font-bold">{t('common.status', { defaultValue: 'Trạng thái' })}</label>
            <Dropdown
              id="status"
              value={formData.status}
              options={statusOptions}
              onChange={(e) => setFormData({ ...formData, status: e.value })}
            />
          </div>
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} icon="pi pi-times" outlined onClick={() => setShowDialog(false)} />
          <Button label={t('common.save', { defaultValue: 'Lưu Cột mốc' })} icon="pi pi-check" onClick={saveItem} loading={isSubmitting} />
        </div>
      </Dialog>
    </div>
  );
};
export default CampaignMilestonesPage;
