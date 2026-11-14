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
import { TabView, TabPanel } from 'primereact/tabview';
import { Sidebar } from 'primereact/sidebar';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputSwitch } from 'primereact/inputswitch';
import { Skeleton } from 'primereact/skeleton';
import { ProgressBar } from 'primereact/progressbar';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { CommonStatus, CampaignMissionCategory, CustomerSegmentCode } from '@/models';
import {
  LoyaltyService,
  MilestoneItemModel,
  VoucherItemModel,
  CampaignRuleModel,
  CampaignTrackingItemModel,
  AiCopilotSuggestResponse,
  AiCopilotConflictItem,
} from '@/service/loyalty.service';

enum CampaignMetric {
  BILL_AMOUNT = 'BILL_AMOUNT',
  TRANSACTION_COUNT = 'TRANSACTION_COUNT',
  EARN_POINTS = 'EARN_POINTS',
  GAME_SPINS = 'GAME_SPINS',
}

interface CampaignMilestoneItem {
  id: number;
  partnerId?: number | null;
  partnerCode?: string;
  partnerName?: string;
  campaignCode: string;
  campaignName: string;
  milestoneStep: number;
  targetMetric: CampaignMetric;
  targetValue: number;
  rewardPoints: number;
  rewardVoucherId?: number | null;
  rewardGameTurns: number;
  status: CommonStatus;
  startDate: string;
  endDate: string;
}

// Hàm format ngày địa phương an toàn (chống Timezone Drift)
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Hàm parse ngày chuỗi sang Date địa phương tại 00:00:00
const parseLocalDate = (dateStr?: string): Date | null => {
  if (!dateStr) return null;
  const cleanStr = String(dateStr).substring(0, 10);
  const parts = cleanStr.split('-');
  if (parts.length !== 3) return new Date(dateStr);
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
};

export const CampaignMilestonesPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [campaigns, setCampaigns] = useState<CampaignMilestoneItem[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<VoucherItemModel[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<CampaignMilestoneItem[]>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState<string | number | null>('ALL');
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<CampaignMilestoneItem>>({});
  const [isNewCampaignMode, setIsNewCampaignMode] = useState(true);
  const [selectedCampaignCode, setSelectedCampaignCode] = useState<string>('');
  const [isEdit, setIsEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // v2.1 Rule Builder (NV-05), Tracking (NV-06) & AI Copilot (AI-01)
  const [activeTab, setActiveTab] = useState<number>(0);
  const [rules, setRules] = useState<CampaignRuleModel[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [ruleForm, setRuleForm] = useState<Partial<CampaignRuleModel>>({
    campaignCode: 'CAMP_DEFAULT',
    campaignName: '',
    missionCategory: CampaignMissionCategory.SPEND_TIERED,
    whenEvent: 'TOPUP_SUCCESS',
    ifMinBillAmount: 100,
    thenRewardPoints: 50,
    thenRewardTurns: 0,
    limitMaxPerUser: 1,
    limitMaxTotal: 10,
    limitDailyBudgetCap: 100000,
    claimExpiryDays: 7,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    status: CommonStatus.ACTIVE,
  });
  const [trackingRows, setTrackingRows] = useState<CampaignTrackingItemModel[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [copilotVisible, setCopilotVisible] = useState(false);
  const [copilotPrompt, setCopilotPrompt] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotResult, setCopilotResult] = useState<AiCopilotSuggestResponse | null>(null);

  const missionCategoryOptions = useMemo(() => [
    { label: t('campaign.cat_first_tx'), value: CampaignMissionCategory.FIRST_TX },
    { label: t('campaign.cat_spend_tiered'), value: CampaignMissionCategory.SPEND_TIERED },
    { label: t('campaign.cat_tx_count'), value: CampaignMissionCategory.TX_COUNT },
    { label: t('campaign.cat_streak'), value: CampaignMissionCategory.STREAK },
    { label: t('campaign.cat_checkin_7d'), value: CampaignMissionCategory.CHECKIN_7D },
    { label: t('campaign.cat_win_back'), value: CampaignMissionCategory.WIN_BACK },
    { label: t('campaign.cat_partner_purchase'), value: CampaignMissionCategory.PARTNER_PURCHASE },
    { label: t('campaign.cat_cross_sell'), value: CampaignMissionCategory.CROSS_SELL },
    { label: t('campaign.cat_referral'), value: CampaignMissionCategory.REFERRAL },
  ], [t]);

  const fetchRulesAndTracking = useCallback(async (tenantId: string) => {
    setRulesLoading(true);
    setTrackingLoading(true);
    try {
      const [rulesRes, trackingRes] = await Promise.all([
        LoyaltyService.getCampaignRules(tenantId),
        LoyaltyService.getCampaignTracking(tenantId),
      ]);
      setRules(Array.isArray(rulesRes) ? rulesRes : []);
      setTrackingRows(Array.isArray(trackingRes) ? trackingRes : []);
    } finally {
      setRulesLoading(false);
      setTrackingLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRulesAndTracking(selectedTenant);
  }, [selectedTenant, fetchRulesAndTracking]);

  const handleSaveRule = async () => {
    if (!ruleForm.ruleCode || !ruleForm.campaignName) {
      toast.current?.show({ severity: 'warn', summary: t('common.warn'), detail: t('campaign.rule_required') });
      return;
    }
    setIsSubmitting(true);
    try {
      await LoyaltyService.saveCampaignRule(ruleForm as CampaignRuleModel, selectedTenant);
      toast.current?.show({ severity: 'success', summary: t('common.success'), detail: t('campaign.rule_saved') });
      setShowRuleDialog(false);
      fetchRulesAndTracking(selectedTenant);
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (rule: CampaignRuleModel) => {
    if (!rule.id) return;
    try {
      await LoyaltyService.deleteCampaignRule(rule.id, selectedTenant);
      toast.current?.show({ severity: 'success', summary: t('common.success'), detail: t('campaign.rule_deleted') });
      fetchRulesAndTracking(selectedTenant);
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    }
  };

  const handleRunCopilot = async () => {
    if (!copilotPrompt.trim()) return;
    setCopilotLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      const res = await LoyaltyService.suggestCampaignCopilot(
        {
          objective: copilotPrompt.trim(),
          targetSegment: CustomerSegmentCode.GENERAL,
          budgetCap: 100000,
          startDate: today,
          endDate: nextMonth,
        },
        selectedTenant
      );
      setCopilotResult(res);
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleApplyCopilotDraft = () => {
    if (!copilotResult?.suggestedRule) return;
    setRuleForm({
      ...ruleForm,
      ...copilotResult.suggestedRule,
      status: CommonStatus.ACTIVE,
    });
    setCopilotVisible(false);
    setActiveTab(1);
    setShowRuleDialog(true);
  };

  // 1. Tải danh sách Cột mốc theo Liên minh
  const fetchMilestones = useCallback(async (tenantId: string) => {
    setLoading(true);
    try {
      const data = await LoyaltyService.getMilestones(tenantId);
      if (data && data.length > 0) {
        setCampaigns(
          data.map((m: MilestoneItemModel) => ({
            id: m.id || 0,
            partnerId: m.partnerId ?? null,
            partnerCode: m.partnerCode,
            partnerName: m.partnerName,
            campaignCode: m.campaignCode,
            campaignName: m.campaignName,
            milestoneStep: m.milestoneStep || 1,
            targetMetric: (m.targetMetric as CampaignMetric) || CampaignMetric.BILL_AMOUNT,
            targetValue: m.targetValue || 0,
            rewardPoints: m.rewardPoints || 0,
            rewardVoucherId: m.rewardVoucherId ?? null,
            rewardGameTurns: m.rewardGameTurns || 0,
            status: (m.status as CommonStatus) || CommonStatus.ACTIVE,
            startDate: m.startDate ? String(m.startDate).substring(0, 10) : formatLocalDate(new Date()),
            endDate: m.endDate ? String(m.endDate).substring(0, 10) : formatLocalDate(new Date(Date.now() + 180 * 86400000)),
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

  // 2. Tải danh sách Đối tác theo Liên minh
  const fetchPartners = useCallback(async (tenantId: string) => {
    try {
      const data = await LoyaltyService.getPartners(tenantId);
      setPartners(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[fetchPartners] Error:', e);
      setPartners([]);
    }
  }, []);

  // 3. Tải kho Voucher theo Liên minh để phục vụ chọn Voucher thưởng
  const fetchVouchers = useCallback(async (tenantId: string) => {
    try {
      const data = await LoyaltyService.getVouchers(tenantId);
      setVouchers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[fetchVouchers] Error:', e);
      setVouchers([]);
    }
  }, []);

  useEffect(() => {
    fetchMilestones(selectedTenant);
    fetchPartners(selectedTenant);
    fetchVouchers(selectedTenant);
  }, [selectedTenant, fetchMilestones, fetchPartners, fetchVouchers]);

  const handleTenantChange = (newTenant: string) => {
    setSelectedTenant(newTenant);
    localStorage.setItem('selected_tenant_id', newTenant);
    setSelectedPartnerFilter('ALL');
  };

  // Lọc danh sách chiến dịch theo đối tác được chọn
  const filteredCampaigns = useMemo(() => {
    if (selectedPartnerFilter === 'ALL') {
      return campaigns;
    }
    if (selectedPartnerFilter === 'ALLIANCE') {
      return campaigns.filter((c) => !c.partnerId);
    }
    return campaigns.filter((c) => c.partnerId === Number(selectedPartnerFilter));
  }, [campaigns, selectedPartnerFilter]);

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

  // Dropdown Đối tác trong Modal tạo/sửa
  const partnerOptions = useMemo(() => {
    return [
      { label: t('milestone.all_alliance'), value: null },
      ...partners.map((p) => ({
        label: `[${p.partnerCode}] ${p.partnerName}`,
        value: p.id,
      })),
    ];
  }, [partners, t]);

  // Dropdown Lọc Đối tác ở Thanh công cụ
  const partnerFilterOptions = useMemo(() => {
    return [
      { label: t('milestone.all_partners_filter'), value: 'ALL' },
      { label: t('milestone.alliance_scope'), value: 'ALLIANCE' },
      ...partners.map((p) => ({
        label: `${p.partnerName} (${p.partnerCode})`,
        value: p.id,
      })),
    ];
  }, [partners, t]);

  // Dropdown Voucher từ kho
  const voucherOptions = useMemo(() => {
    return [
      { label: `-- ${t('milestone.reward_voucher_placeholder')} --`, value: null },
      ...vouchers.map((v) => ({
        label: `[${v.voucherCode}] ${v.title} (${v.discountValue} ${v.discountType === 'PERCENTAGE' ? '%' : 'HTG'})`,
        value: v.id,
      })),
    ];
  }, [vouchers, t]);

  // Mở modal tạo mới
  const openNew = () => {
    const today = formatLocalDate(new Date());
    const endSixMonths = formatLocalDate(new Date(Date.now() + 180 * 86400000));

    setFormData({
      partnerId: null,
      campaignCode: 'CAMP_' + Math.floor(1000 + Math.random() * 9000),
      campaignName: '',
      milestoneStep: 1,
      targetMetric: CampaignMetric.BILL_AMOUNT,
      targetValue: 1000,
      rewardPoints: 100,
      rewardGameTurns: 1,
      rewardVoucherId: null,
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
    const maxStep = campaigns
      .filter((c) => c.campaignCode === code)
      .reduce((max, c) => Math.max(max, c.milestoneStep || 1), 0);

    const firstCampaign = campaigns.find((c) => c.campaignCode === code);

    setFormData((prev) => ({
      ...prev,
      campaignCode: code,
      campaignName: matched ? matched.name : prev?.campaignName || '',
      partnerId: firstCampaign?.partnerId ?? prev?.partnerId ?? null,
      milestoneStep: maxStep + 1,
      startDate: firstCampaign?.startDate || prev?.startDate,
      endDate: firstCampaign?.endDate || prev?.endDate,
    }));
  };

  // Mở modal chỉnh sửa
  const editItem = (item: CampaignMilestoneItem) => {
    setFormData({
      ...item,
      partnerId: item.partnerId ?? null,
      rewardVoucherId: item.rewardVoucherId ?? null,
      startDate: item.startDate ? item.startDate.substring(0, 10) : '',
      endDate: item.endDate ? item.endDate.substring(0, 10) : '',
    });
    setIsEdit(true);
    setIsNewCampaignMode(false);
    setSelectedCampaignCode(item.campaignCode);
    setShowDialog(true);
  };

  // Xóa cột mốc
  const deleteItem = (item: CampaignMilestoneItem) => {
    confirmDialog({
      message: t('milestone.delete_confirm_msg', {
        step: item.milestoneStep,
        name: item.campaignName
      }),
      header: t('milestone.delete_confirm_title'),
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: t('common.yes'),
      rejectLabel: t('common.no'),
      accept: async () => {
        setLoading(true);
        try {
          await LoyaltyService.deleteMilestone(item.id, selectedTenant);
          toast.current?.show({
            severity: 'success',
            summary: t('common.success'),
            detail: t('milestone.delete_success'),
            life: 3000,
          });
          await fetchMilestones(selectedTenant);
        } catch (e: any) {
          console.error('[deleteMilestone] Error:', e);
          toast.current?.show({
            severity: 'error',
            summary: t('common.error'),
            detail: e?.message || t('milestone.delete_failed'),
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
        partnerId: formData.partnerId ? Number(formData.partnerId) : null,
        campaignCode: (formData.campaignCode || '').trim().toUpperCase(),
        campaignName: (formData.campaignName || '').trim(),
        milestoneStep: formData.milestoneStep || 1,
        targetMetric: formData.targetMetric || CampaignMetric.BILL_AMOUNT,
        targetValue: formData.targetValue || 0,
        rewardPoints: formData.rewardPoints || 0,
        rewardVoucherId: formData.rewardVoucherId ? Number(formData.rewardVoucherId) : null,
        rewardGameTurns: formData.rewardGameTurns || 0,
        startDate: formData.startDate ? new Date(formData.startDate + 'T00:00:00').toISOString() : new Date().toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate + 'T23:59:59').toISOString() : new Date(Date.now() + 180 * 86400000).toISOString(),
        status: formData.status || CommonStatus.ACTIVE,
      };

      if (isEdit && formData.id) {
        await LoyaltyService.updateMilestone(formData.id, payload, selectedTenant);
        toast.current?.show({
          severity: 'success',
          summary: t('common.success'),
          detail: t('milestone.update_success'),
          life: 3000,
        });
      } else {
        await LoyaltyService.createMilestone(payload, selectedTenant);
        toast.current?.show({
          severity: 'success',
          summary: t('common.success'),
          detail: t('milestone.create_success'),
          life: 3000,
        });
      }

      setShowDialog(false);
      await fetchMilestones(selectedTenant);
    } catch (e: any) {
      console.error('[handleSaveConfirmed] Error:', e);
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: e?.response?.data?.message || e?.message || t('milestone.save_failed'),
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
        summary: t('common.warning'),
        detail: t('milestone.code_name_required'),
        life: 3000,
      });
      return;
    }

    if (isEdit) {
      confirmDialog({
        message: t('milestone.confirm_update_msg', {
          step: formData.milestoneStep,
          name: formData.campaignName
        }),
        header: t('milestone.edit_title'),
        icon: 'pi pi-info-circle',
        acceptLabel: t('common.save'),
        rejectLabel: t('common.cancel'),
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
        tooltip={t('common.edit')}
      />
      <Button
        icon="pi pi-trash"
        rounded
        outlined
        severity="danger"
        size="small"
        onClick={() => deleteItem(rowData)}
        tooltip={t('common.delete')}
      />
    </div>
  );

  // Cột Trạng thái
  const statusTemplate = (rowData: CampaignMilestoneItem) => {
    return rowData.status === CommonStatus.ACTIVE ? (
      <Tag severity="success" value={t('common.active')} />
    ) : (
      <Tag severity="danger" value={t('common.inactive')} />
    );
  };

  // Cột Chỉ tiêu đo lường
  const metricLabelTemplate = (row: CampaignMilestoneItem) => {
    let icon = 'pi pi-dollar';
    let label = t('milestone.metric_bill');
    let unit = 'HTG';

    switch (row.targetMetric) {
      case CampaignMetric.BILL_AMOUNT:
        icon = 'pi pi-dollar';
        label = t('milestone.metric_bill');
        unit = 'HTG';
        break;
      case CampaignMetric.TRANSACTION_COUNT:
        icon = 'pi pi-sync';
        label = t('milestone.metric_tx_count');
        unit = t('milestone.unit_times');
        break;
      case CampaignMetric.EARN_POINTS:
        icon = 'pi pi-star';
        label = t('milestone.metric_points');
        unit = t('common.points');
        break;
      case CampaignMetric.GAME_SPINS:
        icon = 'pi pi-bolt';
        label = t('milestone.metric_spins');
        unit = t('common.spins');
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
            value={`+${row.rewardPoints} ${t('common.points')}`}
            title={t('milestone.reward_points_tooltip')}
          />
        )}
        {row.rewardGameTurns > 0 && (
          <Tag
            severity="info"
            icon="pi pi-bolt"
            value={`+${row.rewardGameTurns} ${t('common.spins')}`}
            title={t('milestone.reward_turns_tooltip')}
          />
        )}
        {voucher && (
          <Tag
            severity="success"
            icon="pi pi-ticket"
            value={voucher.voucherCode}
            title={`${voucher.title} (${voucher.discountValue} ${voucher.discountType === 'PERCENTAGE' ? '%' : 'HTG'})`}
          />
        )}
        {row.rewardPoints === 0 && row.rewardGameTurns === 0 && !voucher && (
          <span className="text-400 text-xs italic">--</span>
        )}
      </div>
    );
  };

  // Header của DataTable
  const header = (
    <div className="flex flex-wrap gap-3 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <Button
          type="button"
          icon="pi pi-plus"
          label={t('milestone.add_new')}
          severity="success"
          onClick={openNew}
        />
        <Button
          type="button"
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          onClick={() => {
            fetchMilestones(selectedTenant);
            fetchPartners(selectedTenant);
            fetchVouchers(selectedTenant);
          }}
          loading={loading}
          tooltip={t('common.reload')}
        />
      </div>

      <div className="flex flex-wrap align-items-center gap-2">
        <TenantSelector value={selectedTenant} onChange={handleTenantChange} />

        <Dropdown
          value={selectedPartnerFilter}
          options={partnerFilterOptions}
          onChange={(e) => setSelectedPartnerFilter(e.value)}
          placeholder={t('milestone.filter_partner')}
          className="p-inputtext-sm w-15rem"
        />

        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={t('common.search')}
            className="w-16rem p-inputtext-sm"
          />
        </span>
      </div>
    </div>
  );

  // Options cho Chỉ tiêu
  const metricOptions = [
    { label: t('milestone.metric_bill'), value: CampaignMetric.BILL_AMOUNT },
    { label: t('milestone.metric_tx_count'), value: CampaignMetric.TRANSACTION_COUNT },
    { label: t('milestone.metric_points'), value: CampaignMetric.EARN_POINTS },
    { label: t('milestone.metric_spins'), value: CampaignMetric.GAME_SPINS },
  ];

  // Options cho Trạng thái
  const statusOptions = [
    { label: t('common.active'), value: CommonStatus.ACTIVE },
    { label: t('common.inactive'), value: CommonStatus.INACTIVE },
  ];

  return (
    <div>
      <Toast ref={toast} position="top-center" />
      <ConfirmDialog />
      <AppBreadcrumb items={[{ label: t('nav.milestones') }]} />

      <div className="flex flex-wrap gap-2 align-items-center justify-content-between mb-3">
        <div className="flex align-items-center gap-2">
          <TenantSelector value={selectedTenant} onChange={handleTenantChange} />
        </div>
        <Button
          type="button"
          icon="pi pi-sparkles"
          label={t('campaign.open_copilot')}
          severity="help"
          outlined
          onClick={() => setCopilotVisible(true)}
        />
      </div>

      <div className="card shadow-1 border-round surface-card p-4">
        <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
          <TabPanel header={t('campaign.tab_milestones')} leftIcon="pi pi-flag mr-2">
        <DataTable<any>
          value={filteredCampaigns}
          selection={selectedCampaigns}
          onSelectionChange={(e) => setSelectedCampaigns(e.value as CampaignMilestoneItem[])}
          dataKey="id"
          paginator
          rows={10}
          loading={loading}
          rowsPerPageOptions={[5, 10, 25]}
          header={header}
          globalFilter={globalFilter}
          globalFilterFields={['campaignCode', 'campaignName', 'partnerCode', 'partnerName']}
          responsiveLayout="scroll"
          emptyMessage={t('common.no_data')}
        >
          <Column selectionMode="multiple" exportable={false} style={{ width: '3rem' }} />
          <Column
            header={t('common.no_order')}
            body={(_row: CampaignMilestoneItem, { rowIndex }: { rowIndex: number }) => (
              <span className="text-600 font-medium">{rowIndex + 1}</span>
            )}
            style={{ width: '3.5rem', textAlign: 'center' }}
          />
          <Column
            header={t('common.action')}
            body={actionTemplate}
            exportable={false}
            style={{ width: '6.5rem', textAlign: 'center' }}
          />
          <Column
            field="milestoneStep"
            header={<span title={t('milestone.step_tooltip')}>{t('milestone.step')}</span>}
            body={(row: CampaignMilestoneItem) => (
              <Tag
                value={t('milestone.step_label', { step: row.milestoneStep })}
                severity={row.milestoneStep === 1 ? 'info' : row.milestoneStep === 2 ? 'warning' : 'danger'}
                rounded
              />
            )}
            sortable
            style={{ textAlign: 'center', width: '6.5rem' }}
          />
          <Column
            field="campaignCode"
            header={t('milestone.code')}
            body={(row: CampaignMilestoneItem) => (
              <div>
                <div className="font-semibold text-primary">{row.campaignCode}</div>
                <div className="text-sm text-700">{row.campaignName}</div>
              </div>
            )}
            sortable
            style={{ minWidth: '13rem' }}
          />
          <Column
            header={<span title={t('milestone.applicable_partner_tooltip')}>{t('milestone.applicable_partner')}</span>}
            body={(row: CampaignMilestoneItem) => {
              if (!row.partnerId) {
                return (
                  <Tag
                    severity="info"
                    icon="pi pi-globe"
                    value={t('milestone.alliance_scope')}
                  />
                );
              }
              const partner = partners.find((p) => p.id === row.partnerId);
              const name = row.partnerName || partner?.partnerName || row.partnerCode || `ID #${row.partnerId}`;
              return (
                <Tag
                  severity="secondary"
                  icon="pi pi-building"
                  value={name}
                />
              );
            }}
            sortable
            style={{ minWidth: '12rem' }}
          />
          <Column
            field="targetMetric"
            header={<span title={t('milestone.metric_tooltip')}>{t('milestone.metric')}</span>}
            body={metricLabelTemplate}
            sortable
            style={{ minWidth: '12rem' }}
          />
          <Column
            header={<span title={t('milestone.reward_points_tooltip')}>{t('common.reward')}</span>}
            body={rewardTemplate}
            style={{ minWidth: '13rem' }}
          />
          <Column
            field="startDate"
            header={<span title={t('milestone.date_range')}>{t('milestone.date_range')}</span>}
            body={(row: CampaignMilestoneItem) => (
              <span className="text-sm text-600">
                {row.startDate} &rarr; {row.endDate}
              </span>
            )}
            sortable
            style={{ minWidth: '11rem', textAlign: 'center' }}
          />
          <Column field="status" header={t('common.status')} body={statusTemplate} sortable style={{ minWidth: '8.5rem', textAlign: 'center' }} />
        </DataTable>
          </TabPanel>

          <TabPanel header={t('campaign.tab_rule_builder')} leftIcon="pi pi-sliders-h mr-2">
            <div className="flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <span className="text-sm text-600">{t('campaign.rule_builder_desc')}</span>
              <div className="flex gap-2">
                <Button icon="pi pi-plus" label={t('campaign.add_rule')} severity="success" size="small" onClick={() => {
                  setRuleForm({
                    ruleCode: '',
                    campaignCode: 'CAMP_' + Math.floor(1000 + Math.random() * 9000),
                    campaignName: '',
                    missionCategory: CampaignMissionCategory.SPEND_TIERED,
                    whenEvent: 'TOPUP_SUCCESS',
                    ifMinBillAmount: 100,
                    thenRewardPoints: 50,
                    thenRewardTurns: 0,
                    limitMaxPerUser: 1,
                    limitMaxTotal: 10,
                    limitDailyBudgetCap: 100000,
                    claimExpiryDays: 7,
                    startDate: new Date().toISOString().slice(0, 10),
                    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
                    status: CommonStatus.ACTIVE,
                  });
                  setShowRuleDialog(true);
                }} />
                <Button icon="pi pi-refresh" outlined size="small" onClick={() => fetchRulesAndTracking(selectedTenant)} loading={rulesLoading} />
              </div>
            </div>

            {rulesLoading ? (
              <div className="flex flex-column gap-2"><Skeleton height="2.5rem" /><Skeleton height="2.5rem" /><Skeleton height="2.5rem" /></div>
            ) : (
              <DataTable<CampaignRuleModel[]> value={rules} paginator rows={10} stripedRows responsiveLayout="scroll" emptyMessage={t('campaign.no_rules')}>
                <Column field="ruleCode" header={t('campaign.rule_code')} body={(r: CampaignRuleModel) => <span className="font-mono white-space-nowrap font-medium text-primary">{r.ruleCode}</span>} style={{ minWidth: '10rem' }} />
                <Column field="campaignName" header={t('campaign.rule_name')} style={{ minWidth: '14rem' }} />
                <Column field="missionCategory" header={t('campaign.mission_category')} body={(r: CampaignRuleModel) => <Tag value={r.missionCategory} severity="info" />} style={{ minWidth: '11rem' }} />
                <Column header={t('campaign.when_if_col')} body={(r: CampaignRuleModel) => <div className="text-xs font-mono"><div>{t('campaign.when_prefix')}: {r.whenEvent}</div><div className="text-500">{t('campaign.min_bill_prefix')}: {Number(r.ifMinBillAmount || 0).toLocaleString()}</div></div>} style={{ minWidth: '13rem' }} />
                <Column header={t('campaign.then_limits_col')} body={(r: CampaignRuleModel) => <div className="text-xs"><div>{t('campaign.rule_reward_summary', { points: r.thenRewardPoints, turns: r.thenRewardTurns })}</div><div className="text-500">{t('campaign.rule_limit_summary', { perUser: r.limitMaxPerUser ?? '∞', total: r.limitMaxTotal ?? '∞' })}</div></div>} style={{ minWidth: '12rem' }} />
                <Column field="status" header={t('common.status')} body={(r: CampaignRuleModel) => <Tag value={r.status} severity={r.status === CommonStatus.ACTIVE ? 'success' : 'secondary'} />} style={{ minWidth: '8rem', textAlign: 'center' }} />
                <Column header={t('common.action')} body={(r: CampaignRuleModel) => (
                  <div className="flex gap-1">
                    <Button icon="pi pi-pencil" text rounded size="small" onClick={() => { setRuleForm(r); setShowRuleDialog(true); }} />
                    <Button icon="pi pi-trash" text rounded severity="danger" size="small" onClick={() => handleDeleteRule(r)} />
                  </div>
                )} style={{ minWidth: '7rem' }} />
              </DataTable>
            )}
          </TabPanel>

          <TabPanel header={t('campaign.tab_tracking')} leftIcon="pi pi-chart-bar mr-2">
            {trackingLoading ? (
              <div className="flex flex-column gap-2"><Skeleton height="2.5rem" /><Skeleton height="2.5rem" /></div>
            ) : (
              <DataTable<CampaignTrackingItemModel[]> value={trackingRows} paginator rows={10} stripedRows responsiveLayout="scroll" emptyMessage={t('common.no_data')}>
                <Column field="campaignCode" header={t('campaign.code')} body={(r: CampaignTrackingItemModel) => <span className="font-mono white-space-nowrap font-medium">{r.campaignCode}</span>} style={{ minWidth: '10rem' }} />
                <Column field="campaignName" header={t('campaign.name')} style={{ minWidth: '14rem' }} />
                <Column field="participantsCount" header={t('campaign.enrolled')} body={(r: CampaignTrackingItemModel) => Number(r.participantsCount || 0).toLocaleString()} style={{ minWidth: '8rem', textAlign: 'right' }} />
                <Column field="completedCount" header={t('campaign.completed')} body={(r: CampaignTrackingItemModel) => Number(r.completedCount || 0).toLocaleString()} style={{ minWidth: '8rem', textAlign: 'right' }} />
                <Column header={t('campaign.completion_rate')} body={(r: CampaignTrackingItemModel) => {
                  const rate = r.participantsCount > 0 ? (r.completedCount / r.participantsCount) * 100 : 0;
                  return (
                    <div className="flex align-items-center gap-2">
                      <ProgressBar value={rate} showValue={false} style={{ height: '6px', width: '5rem' }} />
                      <span className="text-xs font-mono">{rate.toFixed(1)}%</span>
                    </div>
                  );
                }} style={{ minWidth: '10rem' }} />
                <Column field="pointsDistributed" header={t('campaign.points_issued')} body={(r: CampaignTrackingItemModel) => Number(r.pointsDistributed || 0).toLocaleString()} style={{ minWidth: '9rem', textAlign: 'right' }} />
                <Column field="budgetUsed" header={t('campaign.budget_spent')} body={(r: CampaignTrackingItemModel) => `${Number(r.budgetUsed || 0).toLocaleString()} / ${Number(r.budgetCap || 0).toLocaleString()} HTG`} style={{ minWidth: '12rem', textAlign: 'right' }} />
              </DataTable>
            )}
          </TabPanel>
        </TabView>
      </div>

      {/* Dialog Thêm / Sửa Cột mốc */}
      <Dialog
        visible={showDialog}
        style={{ width: '620px' }}
        header={isEdit ? t('milestone.edit_title') : t('milestone.create_title')}
        modal
        className="p-fluid"
        onHide={() => setShowDialog(false)}
      >
        {/* Lựa chọn Tạo chiến dịch mới hoặc thêm chặng cho chiến dịch cũ */}
        {!isEdit && (
          <div className="surface-100 p-3 border-round mb-3">
            <div className="font-semibold mb-2">{t('milestone.campaign_mode')}:</div>
            <div className="flex gap-4">
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
                  {t('milestone.new_campaign')}
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
                  {t('milestone.select_campaign')}
                </label>
              </div>
            </div>

            {!isNewCampaignMode && (
              <Dropdown
                value={selectedCampaignCode}
                options={existingCampaigns}
                onChange={(e) => handleExistingCampaignSelect(e.value)}
                placeholder={t('milestone.select_campaign')}
                className="w-full mt-2"
                appendTo="self"
              />
            )}
          </div>
        )}

        {/* Lựa chọn Đối tác áp dụng */}
        <div className="field mb-3">
          <label htmlFor="partnerId" className="font-bold flex align-items-center gap-2">
            <i className="pi pi-building text-primary" />
            <span>{t('milestone.applicable_partner')}</span>
          </label>
          <Dropdown
            id="partnerId"
            value={formData.partnerId ?? null}
            options={partnerOptions}
            onChange={(e) => setFormData({ ...formData, partnerId: e.value })}
            placeholder={t('milestone.applicable_partner_tooltip')}
            className="w-full"
            appendTo="self"
          />
        </div>

        <div className="formgrid grid mb-3">
          <div className="field col-6">
            <label htmlFor="campaignCode" className="font-bold">
              {t('milestone.code')} <span className="text-red-500">*</span>
            </label>
            <InputText
              id="campaignCode"
              value={formData.campaignCode || ''}
              onChange={(e) => setFormData({ ...formData, campaignCode: e.target.value.toUpperCase() })}
              placeholder={t('milestone.code_placeholder')}
              disabled={isEdit || (!isNewCampaignMode && !!selectedCampaignCode)}
            />
          </div>
          <div className="field col-6">
            <label htmlFor="milestoneStep" className="font-bold">
              {t('milestone.step')} <span className="text-red-500">*</span>
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
            {t('milestone.name')} <span className="text-red-500">*</span>
          </label>
          <InputText
            id="campaignName"
            value={formData.campaignName || ''}
            onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
            placeholder={t('milestone.name_placeholder')}
            disabled={!isNewCampaignMode && !!selectedCampaignCode && !isEdit}
          />
        </div>

        <div className="formgrid grid mb-3">
          <div className="field col-6">
            <label htmlFor="targetMetric" className="font-bold">{t('milestone.metric')}</label>
            <Dropdown
              id="targetMetric"
              value={formData.targetMetric}
              options={metricOptions}
              onChange={(e) => setFormData({ ...formData, targetMetric: e.value })}
              appendTo="self"
            />
          </div>
          <div className="field col-6">
            <label htmlFor="targetValue" className="font-bold">{t('milestone.target_value')}</label>
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
            <span>{t('common.reward')}</span>
          </div>

          <div className="formgrid grid mb-2">
            <div className="field col-6 mb-0">
              <label htmlFor="rewardPoints" className="text-sm font-semibold">{t('milestone.reward_points')}</label>
              <InputNumber
                id="rewardPoints"
                value={formData.rewardPoints}
                onValueChange={(e) => setFormData({ ...formData, rewardPoints: e.value || 0 })}
                min={0}
                placeholder="0"
              />
            </div>
            <div className="field col-6 mb-0">
              <label htmlFor="rewardGameTurns" className="text-sm font-semibold">{t('milestone.reward_turns')}</label>
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
            <label htmlFor="rewardVoucherId" className="text-sm font-semibold">{t('milestone.reward_voucher')}</label>
            <Dropdown
              id="rewardVoucherId"
              value={formData.rewardVoucherId ?? null}
              options={voucherOptions}
              onChange={(e) => setFormData({ ...formData, rewardVoucherId: e.value })}
              placeholder={t('milestone.reward_voucher_placeholder')}
              className="w-full"
              appendTo="self"
            />
          </div>
        </div>

        {/* Thời gian diễn ra & Trạng thái */}
        <div className="formgrid grid mb-3">
          <div className="field col-6">
            <label htmlFor="startDate" className="font-bold">{t('milestone.start_date')}</label>
            <Calendar
              id="startDate"
              value={parseLocalDate(formData.startDate)}
              onChange={(e) => setFormData({ ...formData, startDate: e.value ? formatLocalDate(e.value as Date) : '' })}
              dateFormat="yy-mm-dd"
              showIcon
              appendTo="self"
            />
          </div>
          <div className="field col-6">
            <label htmlFor="endDate" className="font-bold">{t('milestone.end_date')}</label>
            <Calendar
              id="endDate"
              value={parseLocalDate(formData.endDate)}
              onChange={(e) => setFormData({ ...formData, endDate: e.value ? formatLocalDate(e.value as Date) : '' })}
              dateFormat="yy-mm-dd"
              showIcon
              appendTo="self"
            />
          </div>
        </div>

        <div className="field mb-3">
          <label htmlFor="status" className="font-bold">{t('common.status')}</label>
          <Dropdown
            id="status"
            value={formData.status}
            options={statusOptions}
            onChange={(e) => setFormData({ ...formData, status: e.value })}
            appendTo="self"
          />
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel')} icon="pi pi-times" outlined onClick={() => setShowDialog(false)} />
          <Button label={t('common.save')} icon="pi pi-check" onClick={saveItem} loading={isSubmitting} />
        </div>
      </Dialog>

      {/* Dialog Bộ dựng luật WHEN-IF-THEN-LIMITS (NV-05) */}
      <Dialog
        visible={showRuleDialog}
        style={{ width: '48rem' }}
        breakpoints={{ '960px': '85vw', '641px': '95vw' }}
        header={t('campaign.rule_dialog_title')}
        modal
        className="p-fluid"
        onHide={() => setShowRuleDialog(false)}
      >
        <div className="grid">
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('campaign.rule_code')} *</label>
            <InputText value={ruleForm.ruleCode || ''} onChange={(e) => setRuleForm({ ...ruleForm, ruleCode: e.target.value.toUpperCase() })} className="font-mono" placeholder="RULE_TOPUP_WEEKEND" />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('campaign.rule_name')} *</label>
            <InputText value={ruleForm.campaignName || ''} onChange={(e) => setRuleForm({ ...ruleForm, campaignName: e.target.value })} />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('campaign.mission_category')}</label>
            <Dropdown value={ruleForm.missionCategory} options={missionCategoryOptions} onChange={(e) => setRuleForm({ ...ruleForm, missionCategory: e.value })} appendTo="self" />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('campaign.when_event_label')}</label>
            <InputText value={ruleForm.whenEvent || ''} onChange={(e) => setRuleForm({ ...ruleForm, whenEvent: e.target.value })} className="font-mono" />
          </div>
          <div className="col-12 field">
            <label className="text-sm font-medium">{t('campaign.if_min_bill_label')}</label>
            <InputNumber value={ruleForm.ifMinBillAmount ?? undefined} onValueChange={(e) => setRuleForm({ ...ruleForm, ifMinBillAmount: e.value ?? undefined })} min={0} />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('campaign.then_points_label')}</label>
            <InputNumber value={ruleForm.thenRewardPoints ?? undefined} onValueChange={(e) => setRuleForm({ ...ruleForm, thenRewardPoints: e.value ?? undefined })} min={0} />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('campaign.then_turns_label')}</label>
            <InputNumber value={ruleForm.thenRewardTurns ?? undefined} onValueChange={(e) => setRuleForm({ ...ruleForm, thenRewardTurns: e.value ?? undefined })} min={0} />
          </div>
          <div className="col-12 md:col-4 field">
            <label className="text-sm font-medium">{t('campaign.limit_per_user_label')}</label>
            <InputNumber value={ruleForm.limitMaxPerUser ?? undefined} onValueChange={(e) => setRuleForm({ ...ruleForm, limitMaxPerUser: e.value ?? undefined })} min={0} />
          </div>
          <div className="col-12 md:col-4 field">
            <label className="text-sm font-medium">{t('campaign.limit_total_label')}</label>
            <InputNumber value={ruleForm.limitMaxTotal ?? undefined} onValueChange={(e) => setRuleForm({ ...ruleForm, limitMaxTotal: e.value ?? undefined })} min={0} />
          </div>
          <div className="col-12 md:col-4 field">
            <label className="text-sm font-medium">{t('campaign.limit_daily_budget_label')}</label>
            <InputNumber value={ruleForm.limitDailyBudgetCap ?? undefined} onValueChange={(e) => setRuleForm({ ...ruleForm, limitDailyBudgetCap: e.value ?? undefined })} min={0} />
          </div>
          <div className="col-12 flex align-items-center gap-3">
            <InputSwitch checked={ruleForm.status === CommonStatus.ACTIVE} onChange={(e) => setRuleForm({ ...ruleForm, status: e.value ? CommonStatus.ACTIVE : CommonStatus.INACTIVE })} />
            <span className="text-sm">{ruleForm.status === CommonStatus.ACTIVE ? t('common.active') : t('common.inactive')}</span>
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel')} icon="pi pi-times" outlined onClick={() => setShowRuleDialog(false)} />
          <Button label={t('common.save')} icon="pi pi-check" onClick={handleSaveRule} loading={isSubmitting} />
        </div>
      </Dialog>

      {/* Sidebar AI-01 Campaign Copilot */}
      <Sidebar visible={copilotVisible} position="right" onHide={() => setCopilotVisible(false)} style={{ width: '36rem', maxWidth: '95vw' }} header={<span className="font-medium text-lg"><i className="pi pi-sparkles text-purple-600 mr-2" />AI-01 Campaign Copilot</span>}>
        <div className="flex flex-column gap-3">
          <p className="text-sm text-600 m-0">{t('campaign.copilot_desc')}</p>
          <InputTextarea rows={4} value={copilotPrompt} onChange={(e) => setCopilotPrompt(e.target.value)} placeholder={t('campaign.copilot_placeholder')} className="w-full" />
          <Button label={t('campaign.copilot_generate')} icon="pi pi-bolt" onClick={handleRunCopilot} loading={copilotLoading} />

          {copilotResult && (
            <div className="flex flex-column gap-3 mt-2">
              {copilotResult.conflicts && copilotResult.conflicts.length > 0 && (
                <div className="p-3 border-round bg-orange-50 border-1 border-orange-200">
                  <div className="font-medium text-orange-800 mb-2"><i className="pi pi-exclamation-triangle mr-2" />{t('campaign.conflicts_detected')}</div>
                  {copilotResult.conflicts.map((c: AiCopilotConflictItem, idx: number) => (
                    <div key={idx} className="text-xs text-orange-900 mb-1">
                      <Tag value={c.severity} severity={c.severity === 'CRITICAL' ? 'danger' : 'warning'} className="mr-2" />
                      <span className="font-mono mr-1">{c.conflictCampaignCode}</span>: {c.reason}
                    </div>
                  ))}
                </div>
              )}

              <div className="p-3 border-round surface-50 border-1 surface-border">
                <div className="text-xs text-500 uppercase mb-1">{t('campaign.suggested_rule')}</div>
                <div className="text-sm mb-2">{copilotResult.rationale}</div>
                <pre className="m-0 text-xs font-mono surface-card p-2 border-round overflow-auto">{JSON.stringify(copilotResult.suggestedRule, null, 2)}</pre>
                <div className="flex justify-content-end mt-3">
                  <Button label={t('campaign.apply_draft')} icon="pi pi-check" size="small" severity="success" onClick={handleApplyCopilotDraft} />
                </div>
              </div>
            </div>
          )}
        </div>
      </Sidebar>
    </div>
  );
};

export default CampaignMilestonesPage;
