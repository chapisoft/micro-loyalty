import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { CampaignMetric, CommonStatus } from '@/models';

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

const INITIAL_CAMPAIGNS: CampaignMilestoneItem[] = [
  {
    id: 1,
    campaignCode: 'GOLDEN_WEEK_2026',
    campaignName: 'Tuần Lễ Vàng Mua Sắm',
    milestoneStep: 1,
    targetMetric: CampaignMetric.BILL_AMOUNT,
    targetValue: 500,
    rewardPoints: 50,
    rewardGameTurns: 1,
    status: CommonStatus.ACTIVE,
    startDate: '2026-08-20',
    endDate: '2026-08-30',
  },
  {
    id: 2,
    campaignCode: 'GOLDEN_WEEK_2026',
    campaignName: 'Tuần Lễ Vàng Mua Sắm',
    milestoneStep: 2,
    targetMetric: CampaignMetric.BILL_AMOUNT,
    targetValue: 2000,
    rewardPoints: 250,
    rewardGameTurns: 3,
    status: CommonStatus.ACTIVE,
    startDate: '2026-08-20',
    endDate: '2026-08-30',
  },
  {
    id: 3,
    campaignCode: 'GOLDEN_WEEK_2026',
    campaignName: 'Tuần Lễ Vàng Mua Sắm',
    milestoneStep: 3,
    targetMetric: CampaignMetric.BILL_AMOUNT,
    targetValue: 5000,
    rewardPoints: 1000,
    rewardGameTurns: 10,
    status: CommonStatus.ACTIVE,
    startDate: '2026-08-20',
    endDate: '2026-08-30',
  },
];

export const CampaignMilestonesPage: React.FC = () => {
  const { t } = useTranslation();
  const [campaigns, setCampaigns] = useState<CampaignMilestoneItem[]>(INITIAL_CAMPAIGNS);
  const [selectedItems, setSelectedItems] = useState<CampaignMilestoneItem[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<CampaignMilestoneItem>>({});
  const [isEdit, setIsEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openNew = () => {
    setFormData({
      milestoneStep: 1,
      targetMetric: CampaignMetric.BILL_AMOUNT,
      targetValue: 1000,
      rewardPoints: 100,
      rewardGameTurns: 1,
      status: CommonStatus.ACTIVE,
    });
    setIsEdit(false);
    setShowDialog(true);
  };

  const editItem = (item: CampaignMilestoneItem) => {
    setFormData({ ...item });
    setIsEdit(true);
    setShowDialog(true);
  };

  const saveItem = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      if (isEdit && formData.id) {
        setCampaigns(campaigns.map((c) => (c.id === formData.id ? ({ ...c, ...formData } as CampaignMilestoneItem) : c)));
      } else {
        const newItem: CampaignMilestoneItem = {
          id: Date.now(),
          campaignCode: formData.campaignCode || 'NEW_CAMPAIGN',
          campaignName: formData.campaignName || 'Chiến dịch mới',
          milestoneStep: formData.milestoneStep || 1,
          targetMetric: formData.targetMetric || CampaignMetric.BILL_AMOUNT,
          targetValue: formData.targetValue || 1000,
          rewardPoints: formData.rewardPoints || 0,
          rewardGameTurns: formData.rewardGameTurns || 0,
          status: formData.status || CommonStatus.ACTIVE,
          startDate: formData.startDate || '2026-08-01',
          endDate: formData.endDate || '2026-08-31',
        };
        setCampaigns([...campaigns, newItem]);
      }
      setIsSubmitting(false);
      setShowDialog(false);
    }, 300);
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
    </div>
  );

  const statusTemplate = (rowData: CampaignMilestoneItem) => {
    return rowData.status === CommonStatus.ACTIVE ? (
      <Tag severity="success" value={t('common.active', { defaultValue: 'Đang diễn ra' })} />
    ) : (
      <Tag severity="danger" value={t('common.inactive', { defaultValue: 'Đã kết thúc' })} />
    );
  };

  const stepTemplate = (rowData: CampaignMilestoneItem) => (
    <Tag severity="info" value={`${t('campaign.step', { defaultValue: 'Chặng' })} ${rowData.milestoneStep}`} />
  );

  const metricOptions = [
    { label: t('campaign.metric_bill', { defaultValue: 'Tổng chi tiêu mua sắm (HTG)' }), value: CampaignMetric.BILL_AMOUNT },
    { label: t('campaign.metric_tx_count', { defaultValue: 'Số lượng giao dịch hoàn thành' }), value: CampaignMetric.TRANSACTION_COUNT },
    { label: t('campaign.metric_points', { defaultValue: 'Số điểm tích lũy được' }), value: CampaignMetric.EARN_POINTS },
  ];

  const statusOptions = [
    { label: t('common.active', { defaultValue: 'Đang diễn ra' }), value: CommonStatus.ACTIVE },
    { label: t('common.inactive', { defaultValue: 'Đã kết thúc' }), value: CommonStatus.INACTIVE },
  ];

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0 text-primary font-bold">{t('campaign.management_title', { defaultValue: 'Quản trị Chiến Dịch & Chuỗi Cột Mốc Sự Kiện' })}</h4>
      <div className="flex gap-2">
        <Button label={t('campaign.add_new', { defaultValue: 'Tạo Cột Mốc Mới' })} icon="pi pi-plus" severity="success" onClick={openNew} />
      </div>
    </div>
  );

  return (
    <div>
      <AppBreadcrumb items={[{ label: t('nav.campaigns', { defaultValue: 'Chiến dịch & Cột mốc' }) }]} />
      <div className="card shadow-1 border-round surface-card p-4">
        <DataTable<any>
          value={campaigns}
          selection={selectedItems}
          onSelectionChange={(e: any) => setSelectedItems(e.value || [])}
          header={header}
          dataKey="id"
          paginator
          rows={10}
          emptyMessage={t('common.no_data', { defaultValue: 'Không có chiến dịch nào' })}
          stripedRows
          responsiveLayout="scroll"
        >
          {/* Cột 1: Checkbox */}
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

          {/* Cột 2: STT */}
          <Column
            header={t('common.stt', { defaultValue: 'STT' })}
            body={(_, options) => options.rowIndex + 1}
            style={{ width: '4rem', textAlign: 'center' }}
          />

          {/* Cột 3: Thao tác */}
          <Column body={actionTemplate} exportable={false} header={t('common.actions', { defaultValue: 'Thao tác' })} style={{ width: '6rem' }} />

          {/* Cột 4 trở đi: Dữ liệu */}
          <Column field="campaignCode" header={t('campaign.code', { defaultValue: 'Mã Chiến dịch' })} sortable style={{ minWidth: '10rem' }} />
          <Column field="campaignName" header={t('campaign.name', { defaultValue: 'Tên Chiến dịch' })} sortable style={{ minWidth: '14rem' }} />
          <Column field="milestoneStep" body={stepTemplate} header={t('campaign.step', { defaultValue: 'Chặng' })} sortable style={{ minWidth: '8rem', textAlign: 'center' }} />
          <Column field="targetValue" header={t('campaign.target_value', { defaultValue: 'Chỉ tiêu cần đạt' })} sortable style={{ minWidth: '10rem' }} />
          <Column field="rewardPoints" header={t('campaign.reward_points', { defaultValue: 'Thưởng Điểm' })} sortable style={{ minWidth: '9rem' }} />
          <Column field="rewardGameTurns" header={t('campaign.reward_spins', { defaultValue: 'Thưởng Lượt Quay' })} sortable style={{ minWidth: '10rem', textAlign: 'center' }} />
          <Column field="status" body={statusTemplate} header={t('common.status', { defaultValue: 'Trạng thái' })} sortable style={{ minWidth: '9rem' }} />
        </DataTable>
      </div>

      <Dialog
        visible={showDialog}
        style={{ width: '32rem' }}
        breakpoints={{ '960px': '75vw', '641px': '90vw' }}
        header={isEdit ? t('campaign.edit_title', { defaultValue: 'Cập nhật Cột Mốc' }) : t('campaign.create_title', { defaultValue: 'Tạo mới Cột Mốc' })}
        modal
        className="p-fluid"
        onHide={() => setShowDialog(false)}
      >
        <div className="field mb-3">
          <label htmlFor="campaignCode" className="font-bold">{t('campaign.code', { defaultValue: 'Mã Chiến dịch' })}</label>
          <InputText
            id="campaignCode"
            value={formData.campaignCode || ''}
            onChange={(e) => setFormData({ ...formData, campaignCode: e.target.value })}
            required
            placeholder={t('campaign.code_placeholder', { defaultValue: 'Ví dụ: GOLDEN_WEEK_2026' })}
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="campaignName" className="font-bold">{t('campaign.name', { defaultValue: 'Tên Chiến dịch' })}</label>
          <InputText
            id="campaignName"
            value={formData.campaignName || ''}
            onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
            required
            placeholder={t('campaign.name_placeholder', { defaultValue: 'Ví dụ: Tuần Lễ Vàng Mua Sắm' })}
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="milestoneStep" className="font-bold">{t('campaign.step', { defaultValue: 'Thứ tự chặng mốc' })}</label>
          <InputNumber
            id="milestoneStep"
            value={formData.milestoneStep ?? 1}
            onValueChange={(e) => setFormData({ ...formData, milestoneStep: e.value ?? 1 })}
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="targetMetric" className="font-bold">{t('campaign.target_metric', { defaultValue: 'Loại chỉ tiêu đo lường' })}</label>
          <Dropdown
            id="targetMetric"
            value={formData.targetMetric || 'BILL_AMOUNT'}
            options={metricOptions}
            onChange={(e) => setFormData({ ...formData, targetMetric: e.value })}
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="targetValue" className="font-bold">{t('campaign.target_value', { defaultValue: 'Giá trị chỉ tiêu cần hoàn thành' })}</label>
          <InputNumber
            id="targetValue"
            value={formData.targetValue ?? 1000}
            onValueChange={(e) => setFormData({ ...formData, targetValue: e.value ?? 1000 })}
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="rewardPoints" className="font-bold">{t('campaign.reward_points', { defaultValue: 'Điểm thưởng khi hoàn thành chặng' })}</label>
          <InputNumber
            id="rewardPoints"
            value={formData.rewardPoints ?? 0}
            onValueChange={(e) => setFormData({ ...formData, rewardPoints: e.value ?? 0 })}
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="rewardGameTurns" className="font-bold">{t('campaign.reward_spins', { defaultValue: 'Lượt quay vòng quay may mắn tặng kèm' })}</label>
          <InputNumber
            id="rewardGameTurns"
            value={formData.rewardGameTurns ?? 0}
            onValueChange={(e) => setFormData({ ...formData, rewardGameTurns: e.value ?? 0 })}
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="status" className="font-bold">{t('common.status', { defaultValue: 'Trạng thái' })}</label>
          <Dropdown
            id="status"
            value={formData.status || CommonStatus.ACTIVE}
            options={statusOptions}
            onChange={(e) => setFormData({ ...formData, status: e.value })}
          />
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} icon="pi pi-times" outlined onClick={() => setShowDialog(false)} disabled={isSubmitting} />
          <Button label={t('common.save', { defaultValue: 'Lưu cột mốc' })} icon="pi pi-check" onClick={saveItem} loading={isSubmitting} disabled={isSubmitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default CampaignMilestonesPage;
