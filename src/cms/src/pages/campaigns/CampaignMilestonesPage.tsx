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
    { label: t('campaign.cat_first_tx', { defaultValue: 'Giao dịch đầu tiên (FIRST_TX)' }), value: CampaignMissionCategory.FIRST_TX },
    { label: t('campaign.cat_spend_tiered', { defaultValue: 'Mức chi tiêu bậc thang (SPEND_TIERED)' }), value: CampaignMissionCategory.SPEND_TIERED },
    { label: t('campaign.cat_tx_count', { defaultValue: 'Số lượng giao dịch (TX_COUNT)' }), value: CampaignMissionCategory.TX_COUNT },
    { label: t('campaign.cat_streak', { defaultValue: 'Chuỗi giao dịch liên tiếp (STREAK)' }), value: CampaignMissionCategory.STREAK },
    { label: t('campaign.cat_checkin_7d', { defaultValue: 'Điểm danh 7 ngày (CHECKIN_7D)' }), value: CampaignMissionCategory.CHECKIN_7D },
    { label: t('campaign.cat_win_back', { defaultValue: 'Kéo khách quay lại (WIN_BACK)' }), value: CampaignMissionCategory.WIN_BACK },
    { label: t('campaign.cat_partner_purchase', { defaultValue: 'Mua sắm tại đối tác (PARTNER_PURCHASE)' }), value: CampaignMissionCategory.PARTNER_PURCHASE },
    { label: t('campaign.cat_cross_sell', { defaultValue: 'Bán chéo dịch vụ (CROSS_SELL)' }), value: CampaignMissionCategory.CROSS_SELL },
    { label: t('campaign.cat_referral', { defaultValue: 'Giới thiệu bạn bè (REFERRAL)' }), value: CampaignMissionCategory.REFERRAL },
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
      toast.current?.show({ severity: 'warn', summary: t('common.warn', { defaultValue: 'Thiếu thông tin' }), detail: t('campaign.rule_required', { defaultValue: 'Vui lòng nhập Mã luật và Tên chiến dịch.' }) });
      return;
    }
    setIsSubmitting(true);
    try {
      await LoyaltyService.saveCampaignRule(ruleForm as CampaignRuleModel, selectedTenant);
      toast.current?.show({ severity: 'success', summary: t('common.success', { defaultValue: 'Thành công' }), detail: t('campaign.rule_saved', { defaultValue: 'Đã lưu luật chiến dịch WHEN-IF-THEN-LIMITS.' }) });
      setShowRuleDialog(false);
      fetchRulesAndTracking(selectedTenant);
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error', { defaultValue: 'Lỗi' }), detail: err?.response?.data?.message || err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (rule: CampaignRuleModel) => {
    if (!rule.id) return;
    try {
      await LoyaltyService.deleteCampaignRule(rule.id, selectedTenant);
      toast.current?.show({ severity: 'success', summary: t('common.success', { defaultValue: 'Thành công' }), detail: t('campaign.rule_deleted', { defaultValue: 'Đã xóa luật chiến dịch.' }) });
      fetchRulesAndTracking(selectedTenant);
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error', { defaultValue: 'Lỗi' }), detail: err?.response?.data?.message || err.message });
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
      toast.current?.show({ severity: 'error', summary: t('common.error', { defaultValue: 'Lỗi' }), detail: err?.response?.data?.message || err.message });
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
      { label: t('milestone.all_alliance', { defaultValue: 'Toàn Liên Minh (Tất cả đối tác)' }), value: null },
      ...partners.map((p) => ({
        label: `[${p.partnerCode}] ${p.partnerName}`,
        value: p.id,
      })),
    ];
  }, [partners, t]);

  // Dropdown Lọc Đối tác ở Thanh công cụ
  const partnerFilterOptions = useMemo(() => {
    return [
      { label: t('milestone.all_partners_filter', { defaultValue: 'Tất cả Đối tác & Liên minh' }), value: 'ALL' },
      { label: t('milestone.alliance_scope', { defaultValue: 'Toàn Liên Minh' }), value: 'ALLIANCE' },
      ...partners.map((p) => ({
        label: `${p.partnerName} (${p.partnerCode})`,
        value: p.id,
      })),
    ];
  }, [partners, t]);

  // Dropdown Voucher từ kho
  const voucherOptions = useMemo(() => {
    return [
      { label: `-- ${t('milestone.reward_voucher_placeholder', { defaultValue: 'Không tặng voucher' })} --`, value: null },
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
            detail: e?.message || t('milestone.delete_failed', { defaultValue: 'Không thể xóa cột mốc, vui lòng thử lại sau!' }),
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
      console.error('[handleSaveConfirmed] Error:', e);
      toast.current?.show({
        severity: 'error',
        summary: t('common.error', { defaultValue: 'Lỗi' }),
        detail: e?.response?.data?.message || e?.message || t('milestone.save_failed', { defaultValue: 'Không thể lưu cột mốc chiến dịch, vui lòng thử lại sau!' }),
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
        detail: t('milestone.code_name_required', { defaultValue: 'Vui lòng nhập đầy đủ Mã chiến dịch và Tên chiến dịch!' }),
        life: 3000,
      });
      return;
    }

    if (isEdit) {
      confirmDialog({
        message: t('milestone.confirm_update_msg', {
          step: formData.milestoneStep,
          name: formData.campaignName,
          defaultValue: `Bạn có chắc chắn muốn cập nhật thay đổi cho chặng ${formData.milestoneStep} của chiến dịch "${formData.campaignName}"?`,
        }),
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
        unit = t('milestone.unit_times', { defaultValue: 'lần' });
        break;
      case CampaignMetric.EARN_POINTS:
        icon = 'pi pi-star';
        label = t('milestone.metric_points', { defaultValue: 'Điểm tích lũy' });
        unit = t('common.points', { defaultValue: 'điểm' });
        break;
      case CampaignMetric.GAME_SPINS:
        icon = 'pi pi-bolt';
        label = t('milestone.metric_spins', { defaultValue: 'Lượt quay game' });
        unit = t('common.spins', { defaultValue: 'lượt' });
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
          label={t('milestone.add_new', { defaultValue: 'Tạo Cột Mốc' })}
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
          tooltip={t('common.reload', { defaultValue: 'Làm mới danh sách' })}
        />
      </div>

      <div className="flex flex-wrap align-items-center gap-2">
        <TenantSelector value={selectedTenant} onChange={handleTenantChange} />

        <Dropdown
          value={selectedPartnerFilter}
          options={partnerFilterOptions}
          onChange={(e) => setSelectedPartnerFilter(e.value)}
          placeholder={t('milestone.filter_partner', { defaultValue: 'Lọc theo Đối tác' })}
          className="p-inputtext-sm w-15rem"
        />

        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={t('common.search', { defaultValue: 'Tìm theo mã, tên chiến dịch...' })}
            className="w-16rem p-inputtext-sm"
          />
        </span>
      </div>
    </div>
  );

  // Options cho Chỉ tiêu
  const metricOptions = [
    { label: t('milestone.metric_bill', { defaultValue: 'Chi tiêu tích lũy (HTG)' }), value: CampaignMetric.BILL_AMOUNT },
    { label: t('milestone.metric_tx_count', { defaultValue: 'Số lượng giao dịch (lần)' }), value: CampaignMetric.TRANSACTION_COUNT },
    { label: t('milestone.metric_points', { defaultValue: 'Điểm tích lũy (điểm)' }), value: CampaignMetric.EARN_POINTS },
    { label: t('milestone.metric_spins', { defaultValue: 'Lượt chơi Mini-game (lượt)' }), value: CampaignMetric.GAME_SPINS },
  ];

  // Options cho Trạng thái
  const statusOptions = [
    { label: t('common.active', { defaultValue: 'Đang diễn ra' }), value: CommonStatus.ACTIVE },
    { label: t('common.inactive', { defaultValue: 'Đã kết thúc' }), value: CommonStatus.INACTIVE },
  ];

  return (
    <div>
      <Toast ref={toast} position="top-center" />
      <ConfirmDialog />
      <AppBreadcrumb items={[{ label: t('nav.milestones', { defaultValue: 'Cột mốc Chiến dịch' }) }]} />

      <div className="flex flex-wrap gap-2 align-items-center justify-content-between mb-3">
        <div className="flex align-items-center gap-2">
          <TenantSelector value={selectedTenant} onChange={handleTenantChange} />
        </div>
        <Button
          type="button"
          icon="pi pi-sparkles"
          label={t('campaign.open_copilot', { defaultValue: 'AI Campaign Copilot' })}
          severity="help"
          outlined
          onClick={() => setCopilotVisible(true)}
        />
      </div>

      <div className="card shadow-1 border-round surface-card p-4">
        <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
          <TabPanel header={t('campaign.tab_milestones', { defaultValue: 'Cột mốc Chiến dịch (NV-04)' })} leftIcon="pi pi-flag mr-2">
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
          emptyMessage={t('common.no_data', { defaultValue: 'Chưa có chiến dịch cột mốc nào cho liên minh này' })}
        >
          <Column selectionMode="multiple" exportable={false} style={{ width: '3rem' }} />
          <Column
            header={t('common.no_order', { defaultValue: '#' })}
            body={(_row: CampaignMilestoneItem, { rowIndex }: { rowIndex: number }) => (
              <span className="text-600 font-medium">{rowIndex + 1}</span>
            )}
            style={{ width: '3.5rem', textAlign: 'center' }}
          />
          <Column
            header={t('common.action', { defaultValue: 'Thao tác' })}
            body={actionTemplate}
            exportable={false}
            style={{ width: '6.5rem', textAlign: 'center' }}
          />
          <Column
            field="milestoneStep"
            header={<span title={t('milestone.step_tooltip', { defaultValue: 'Thứ tự chặng cột mốc liên tiếp trong chiến dịch' })}>{t('milestone.step', { defaultValue: 'Chặng #' })}</span>}
            body={(row: CampaignMilestoneItem) => (
              <Tag
                value={t('milestone.step_label', { step: row.milestoneStep, defaultValue: `Chặng ${row.milestoneStep}` })}
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
            style={{ minWidth: '13rem' }}
          />
          <Column
            header={<span title={t('milestone.applicable_partner_tooltip', { defaultValue: 'Đối tác áp dụng cột mốc chiến dịch (Chọn Toàn liên minh nếu áp dụng chung)' })}>{t('milestone.applicable_partner', { defaultValue: 'Đối Tác Áp Dụng' })}</span>}
            body={(row: CampaignMilestoneItem) => {
              if (!row.partnerId) {
                return (
                  <Tag
                    severity="info"
                    icon="pi pi-globe"
                    value={t('milestone.alliance_scope', { defaultValue: 'Toàn Liên Minh' })}
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
        </DataTable>
          </TabPanel>

          <TabPanel header={t('campaign.tab_rule_builder', { defaultValue: 'Bộ dựng luật WHEN-IF-THEN-LIMITS (NV-05)' })} leftIcon="pi pi-sliders-h mr-2">
            <div className="flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <span className="text-sm text-600">{t('campaign.rule_builder_desc', { defaultValue: 'Thiết lập luật nhiệm vụ đa kênh 9 loại sự kiện kèm giới hạn ngày/tháng và kiểm tra xung đột.' })}</span>
              <div className="flex gap-2">
                <Button icon="pi pi-plus" label={t('campaign.add_rule', { defaultValue: 'Tạo luật nhiệm vụ' })} severity="success" size="small" onClick={() => {
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
              <DataTable<CampaignRuleModel[]> value={rules} paginator rows={10} stripedRows responsiveLayout="scroll" emptyMessage={t('campaign.no_rules', { defaultValue: 'Chưa có luật chiến dịch nào được cấu hình.' })}>
                <Column field="ruleCode" header={t('campaign.rule_code', { defaultValue: 'Mã Luật' })} body={(r: CampaignRuleModel) => <span className="font-mono white-space-nowrap font-medium text-primary">{r.ruleCode}</span>} style={{ minWidth: '10rem' }} />
                <Column field="campaignName" header={t('campaign.rule_name', { defaultValue: 'Tên Chiến Dịch / Luật' })} style={{ minWidth: '14rem' }} />
                <Column field="missionCategory" header={t('campaign.mission_category', { defaultValue: 'Loại Nhiệm Vụ' })} body={(r: CampaignRuleModel) => <Tag value={r.missionCategory} severity="info" />} style={{ minWidth: '11rem' }} />
                <Column header="WHEN / IF" body={(r: CampaignRuleModel) => <div className="text-xs font-mono"><div>WHEN: {r.whenEvent}</div><div className="text-500">Min Bill: {Number(r.ifMinBillAmount || 0).toLocaleString()}</div></div>} style={{ minWidth: '13rem' }} />
                <Column header="THEN / LIMITS" body={(r: CampaignRuleModel) => <div className="text-xs"><div>+{r.thenRewardPoints} điểm / +{r.thenRewardTurns} lượt</div><div className="text-500">Max: {r.limitMaxPerUser ?? '∞'}/user · {r.limitMaxTotal ?? '∞'} tổng</div></div>} style={{ minWidth: '12rem' }} />
                <Column field="status" header={t('common.status', { defaultValue: 'Trạng Thái' })} body={(r: CampaignRuleModel) => <Tag value={r.status} severity={r.status === CommonStatus.ACTIVE ? 'success' : 'secondary'} />} style={{ minWidth: '8rem', textAlign: 'center' }} />
                <Column header={t('common.action', { defaultValue: 'Thao Tác' })} body={(r: CampaignRuleModel) => (
                  <div className="flex gap-1">
                    <Button icon="pi pi-pencil" text rounded size="small" onClick={() => { setRuleForm(r); setShowRuleDialog(true); }} />
                    <Button icon="pi pi-trash" text rounded severity="danger" size="small" onClick={() => handleDeleteRule(r)} />
                  </div>
                )} style={{ minWidth: '7rem' }} />
              </DataTable>
            )}
          </TabPanel>

          <TabPanel header={t('campaign.tab_tracking', { defaultValue: 'Theo dõi Tiến độ (NV-06)' })} leftIcon="pi pi-chart-bar mr-2">
            {trackingLoading ? (
              <div className="flex flex-column gap-2"><Skeleton height="2.5rem" /><Skeleton height="2.5rem" /></div>
            ) : (
              <DataTable<CampaignTrackingItemModel[]> value={trackingRows} paginator rows={10} stripedRows responsiveLayout="scroll" emptyMessage={t('common.no_data', { defaultValue: 'Chưa có dữ liệu theo dõi tiến độ chiến dịch.' })}>
                <Column field="campaignCode" header={t('campaign.code', { defaultValue: 'Mã Chiến Dịch' })} body={(r: CampaignTrackingItemModel) => <span className="font-mono white-space-nowrap font-medium">{r.campaignCode}</span>} style={{ minWidth: '10rem' }} />
                <Column field="campaignName" header={t('campaign.name', { defaultValue: 'Tên Chiến Dịch' })} style={{ minWidth: '14rem' }} />
                <Column field="participantsCount" header={t('campaign.enrolled', { defaultValue: 'Tham Gia' })} body={(r: CampaignTrackingItemModel) => Number(r.participantsCount || 0).toLocaleString()} style={{ minWidth: '8rem', textAlign: 'right' }} />
                <Column field="completedCount" header={t('campaign.completed', { defaultValue: 'Hoàn Thành' })} body={(r: CampaignTrackingItemModel) => Number(r.completedCount || 0).toLocaleString()} style={{ minWidth: '8rem', textAlign: 'right' }} />
                <Column header={t('campaign.completion_rate', { defaultValue: 'Tỷ Lệ' })} body={(r: CampaignTrackingItemModel) => {
                  const rate = r.participantsCount > 0 ? (r.completedCount / r.participantsCount) * 100 : 0;
                  return (
                    <div className="flex align-items-center gap-2">
                      <ProgressBar value={rate} showValue={false} style={{ height: '6px', width: '5rem' }} />
                      <span className="text-xs font-mono">{rate.toFixed(1)}%</span>
                    </div>
                  );
                }} style={{ minWidth: '10rem' }} />
                <Column field="pointsDistributed" header={t('campaign.points_issued', { defaultValue: 'Điểm Đã Cấp' })} body={(r: CampaignTrackingItemModel) => Number(r.pointsDistributed || 0).toLocaleString()} style={{ minWidth: '9rem', textAlign: 'right' }} />
                <Column field="budgetUsed" header={t('campaign.budget_spent', { defaultValue: 'Ngân Sách Đã Dùng' })} body={(r: CampaignTrackingItemModel) => `${Number(r.budgetUsed || 0).toLocaleString()} / ${Number(r.budgetCap || 0).toLocaleString()} HTG`} style={{ minWidth: '12rem', textAlign: 'right' }} />
              </DataTable>
            )}
          </TabPanel>
        </TabView>
      </div>

      {/* Dialog Thêm / Sửa Cột mốc */}
      <Dialog
        visible={showDialog}
        style={{ width: '620px' }}
        header={isEdit ? t('milestone.edit_title', { defaultValue: 'Chỉnh Sửa Cột Mốc' }) : t('milestone.create_title', { defaultValue: 'Tạo Cột Mốc Mới' })}
        modal
        className="p-fluid"
        onHide={() => setShowDialog(false)}
      >
        {/* Lựa chọn Tạo chiến dịch mới hoặc thêm chặng cho chiến dịch cũ */}
        {!isEdit && (
          <div className="surface-100 p-3 border-round mb-3">
            <div className="font-semibold mb-2">{t('milestone.campaign_mode', { defaultValue: 'Chế độ chiến dịch' })}:</div>
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

        {/* Lựa chọn Đối tác áp dụng */}
        <div className="field mb-3">
          <label htmlFor="partnerId" className="font-bold flex align-items-center gap-2">
            <i className="pi pi-building text-primary" />
            <span>{t('milestone.applicable_partner', { defaultValue: 'Đối Tác Áp Dụng' })}</span>
          </label>
          <Dropdown
            id="partnerId"
            value={formData.partnerId ?? null}
            options={partnerOptions}
            onChange={(e) => setFormData({ ...formData, partnerId: e.value })}
            placeholder={t('milestone.applicable_partner_tooltip', { defaultValue: 'Chọn đối tác áp dụng...' })}
            className="w-full"
            appendTo="self"
          />
        </div>

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
              value={formData.rewardVoucherId ?? null}
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
              value={parseLocalDate(formData.startDate)}
              onChange={(e) => setFormData({ ...formData, startDate: e.value ? formatLocalDate(e.value as Date) : '' })}
              dateFormat="yy-mm-dd"
              showIcon
              appendTo="self"
            />
          </div>
          <div className="field col-6">
            <label htmlFor="endDate" className="font-bold">{t('milestone.end_date', { defaultValue: 'Ngày Kết Thúc' })}</label>
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

      {/* Dialog Bộ dựng luật WHEN-IF-THEN-LIMITS (NV-05) */}
      <Dialog
        visible={showRuleDialog}
        style={{ width: '48rem' }}
        breakpoints={{ '960px': '85vw', '641px': '95vw' }}
        header={t('campaign.rule_dialog_title', { defaultValue: 'Cấu hình Luật Nhiệm vụ WHEN – IF – THEN – LIMITS' })}
        modal
        className="p-fluid"
        onHide={() => setShowRuleDialog(false)}
      >
        <div className="grid">
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('campaign.rule_code', { defaultValue: 'Mã Luật' })} *</label>
            <InputText value={ruleForm.ruleCode || ''} onChange={(e) => setRuleForm({ ...ruleForm, ruleCode: e.target.value.toUpperCase() })} className="font-mono" placeholder="RULE_TOPUP_WEEKEND" />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('campaign.rule_name', { defaultValue: 'Tên Chiến Dịch / Luật' })} *</label>
            <InputText value={ruleForm.campaignName || ''} onChange={(e) => setRuleForm({ ...ruleForm, campaignName: e.target.value })} />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('campaign.mission_category', { defaultValue: 'Loại Nhiệm Vụ (9 nhóm)' })}</label>
            <Dropdown value={ruleForm.missionCategory} options={missionCategoryOptions} onChange={(e) => setRuleForm({ ...ruleForm, missionCategory: e.value })} appendTo="self" />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">WHEN (Sự kiện kích hoạt)</label>
            <InputText value={ruleForm.whenEvent || ''} onChange={(e) => setRuleForm({ ...ruleForm, whenEvent: e.target.value })} className="font-mono" />
          </div>
          <div className="col-12 field">
            <label className="text-sm font-medium">IF (Giá trị hóa đơn tối thiểu)</label>
            <InputNumber value={ruleForm.ifMinBillAmount ?? 0} onValueChange={(e) => setRuleForm({ ...ruleForm, ifMinBillAmount: e.value || 0 })} min={0} />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">THEN (Điểm thưởng)</label>
            <InputNumber value={ruleForm.thenRewardPoints ?? 0} onValueChange={(e) => setRuleForm({ ...ruleForm, thenRewardPoints: e.value || 0 })} min={0} />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">THEN (Lượt quay Game)</label>
            <InputNumber value={ruleForm.thenRewardTurns ?? 0} onValueChange={(e) => setRuleForm({ ...ruleForm, thenRewardTurns: e.value || 0 })} min={0} />
          </div>
          <div className="col-12 md:col-4 field">
            <label className="text-sm font-medium">LIMITS: Trần / user</label>
            <InputNumber value={ruleForm.limitMaxPerUser ?? 1} onValueChange={(e) => setRuleForm({ ...ruleForm, limitMaxPerUser: e.value || 0 })} min={0} />
          </div>
          <div className="col-12 md:col-4 field">
            <label className="text-sm font-medium">LIMITS: Tổng lượt</label>
            <InputNumber value={ruleForm.limitMaxTotal ?? 10} onValueChange={(e) => setRuleForm({ ...ruleForm, limitMaxTotal: e.value || 0 })} min={0} />
          </div>
          <div className="col-12 md:col-4 field">
            <label className="text-sm font-medium">LIMITS: Ngân sách ngày</label>
            <InputNumber value={ruleForm.limitDailyBudgetCap ?? 0} onValueChange={(e) => setRuleForm({ ...ruleForm, limitDailyBudgetCap: e.value || 0 })} min={0} />
          </div>
          <div className="col-12 flex align-items-center gap-3">
            <InputSwitch checked={ruleForm.status === CommonStatus.ACTIVE} onChange={(e) => setRuleForm({ ...ruleForm, status: e.value ? CommonStatus.ACTIVE : CommonStatus.INACTIVE })} />
            <span className="text-sm">{ruleForm.status === CommonStatus.ACTIVE ? t('common.active', { defaultValue: 'Đang kích hoạt' }) : t('common.inactive', { defaultValue: 'Tạm dừng' })}</span>
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} icon="pi pi-times" outlined onClick={() => setShowRuleDialog(false)} />
          <Button label={t('common.save', { defaultValue: 'Lưu Luật' })} icon="pi pi-check" onClick={handleSaveRule} loading={isSubmitting} />
        </div>
      </Dialog>

      {/* Sidebar AI-01 Campaign Copilot */}
      <Sidebar visible={copilotVisible} position="right" onHide={() => setCopilotVisible(false)} style={{ width: '36rem', maxWidth: '95vw' }} header={<span className="font-medium text-lg"><i className="pi pi-sparkles text-purple-600 mr-2" />AI-01 Campaign Copilot</span>}>
        <div className="flex flex-column gap-3">
          <p className="text-sm text-600 m-0">{t('campaign.copilot_desc', { defaultValue: 'Nhập mục tiêu chiến dịch để AI đề xuất bộ luật WHEN-IF-THEN-LIMITS và kiểm tra xung đột với các chiến dịch đang chạy.' })}</p>
          <InputTextarea rows={4} value={copilotPrompt} onChange={(e) => setCopilotPrompt(e.target.value)} placeholder={t('campaign.copilot_placeholder', { defaultValue: 'Ví dụ: Thưởng x2 điểm cho khách hàng nạp thẻ từ 200 HTG cuối tuần, giới hạn 2 lần/ngày...' })} className="w-full" />
          <Button label={t('campaign.copilot_generate', { defaultValue: 'Phân tích & Đề xuất Luật' })} icon="pi pi-bolt" onClick={handleRunCopilot} loading={copilotLoading} />

          {copilotResult && (
            <div className="flex flex-column gap-3 mt-2">
              {copilotResult.conflicts && copilotResult.conflicts.length > 0 && (
                <div className="p-3 border-round bg-orange-50 border-1 border-orange-200">
                  <div className="font-medium text-orange-800 mb-2"><i className="pi pi-exclamation-triangle mr-2" />{t('campaign.conflicts_detected', { defaultValue: 'Phát hiện Xung đột Chiến dịch' })}</div>
                  {copilotResult.conflicts.map((c: AiCopilotConflictItem, idx: number) => (
                    <div key={idx} className="text-xs text-orange-900 mb-1">
                      <Tag value={c.severity} severity={c.severity === 'CRITICAL' ? 'danger' : 'warning'} className="mr-2" />
                      <span className="font-mono mr-1">{c.conflictCampaignCode}</span>: {c.reason}
                    </div>
                  ))}
                </div>
              )}

              <div className="p-3 border-round surface-50 border-1 surface-border">
                <div className="text-xs text-500 uppercase mb-1">{t('campaign.suggested_rule', { defaultValue: 'Bản nháp Luật đề xuất' })}</div>
                <div className="text-sm mb-2">{copilotResult.rationale}</div>
                <pre className="m-0 text-xs font-mono surface-card p-2 border-round overflow-auto">{JSON.stringify(copilotResult.suggestedRule, null, 2)}</pre>
                <div className="flex justify-content-end mt-3">
                  <Button label={t('campaign.apply_draft', { defaultValue: 'Áp dụng vào Bộ dựng luật' })} icon="pi pi-check" size="small" severity="success" onClick={handleApplyCopilotDraft} />
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
