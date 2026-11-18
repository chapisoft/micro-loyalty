import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { useTranslation } from 'react-i18next';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { StandardRowActions } from '@/components/StandardRowActions';
import { StatusBadge } from '@/components/StatusBadge';
import { TenantSelector } from '@/components/TenantSelector';
import { CommonStatus } from '@/models';
import {
  LoyaltyService,
  GamePointRuleModel,
  LeaderboardPrizeModel,
  LeaderboardPayoutModel,
} from '@/service/loyalty.service';

const currentYearMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const LeaderboardPrizesPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>('TENANT_NATCASH');
  const [loading, setLoading] = useState(false);
  const [prizes, setPrizes] = useState<LeaderboardPrizeModel[]>([]);
  const [rules, setRules] = useState<GamePointRuleModel[]>([]);
  const [payouts, setPayouts] = useState<LeaderboardPayoutModel[]>([]);
  const [payoutMonth, setPayoutMonth] = useState<string>(currentYearMonth());

  const [showPrizeDialog, setShowPrizeDialog] = useState(false);
  const [prizeForm, setPrizeForm] = useState<Partial<LeaderboardPrizeModel>>({});
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [ruleForm, setRuleForm] = useState<Partial<GamePointRuleModel>>({});
  const [saving, setSaving] = useState(false);

  const boardOptions = useMemo(
    () => [
      { label: t('leaderboard.board_all'), value: 'ALL' },
      { label: t('leaderboard.board_learning'), value: 'LEARNING' },
      { label: t('leaderboard.board_mini_games'), value: 'MINI_GAMES' },
    ],
    [t]
  );

  const prizeTypeOptions = useMemo(
    () => [
      { label: t('leaderboard.prize_voucher'), value: 'VOUCHER' },
      { label: t('leaderboard.prize_data'), value: 'TELCO_DATA' },
      { label: t('leaderboard.prize_badge_turns'), value: 'BADGE_AND_TURNS' },
      { label: t('leaderboard.prize_coin'), value: 'LOYALTY_COIN' },
    ],
    [t]
  );

  const formulaOptions = useMemo(
    () => [
      { label: t('leaderboard.formula_fixed'), value: 'FIXED' },
      { label: t('leaderboard.formula_per_score'), value: 'PER_SCORE_UNIT' },
    ],
    [t]
  );

  const statusOptions = useMemo(
    () => [
      { label: t('common.active'), value: CommonStatus.ACTIVE },
      { label: t('common.inactive'), value: CommonStatus.INACTIVE },
    ],
    [t]
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [prizeList, ruleList, payoutList] = await Promise.all([
        LoyaltyService.getLeaderboardPrizesAdmin(selectedTenant),
        LoyaltyService.getLeaderboardRulesAdmin(selectedTenant),
        LoyaltyService.getLeaderboardPayoutsAdmin(payoutMonth, selectedTenant),
      ]);
      setPrizes(prizeList);
      setRules(ruleList);
      setPayouts(payoutList);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant, payoutMonth]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openNewPrize = () => {
    setPrizeForm({
      boardType: 'ALL',
      rankFrom: 1,
      rankTo: 1,
      prizeType: 'VOUCHER',
      prizeLabel: '',
      prizeValue: 100,
      voucherCode: '',
      sponsorName: '',
      status: CommonStatus.ACTIVE,
    });
    setShowPrizeDialog(true);
  };

  const handleSavePrize = async () => {
    if (!prizeForm.prizeLabel?.trim()) {
      toast.current?.show({ severity: 'warn', summary: t('common.warning'), detail: t('leaderboard.prize_label_required') });
      return;
    }
    setSaving(true);
    try {
      await LoyaltyService.saveLeaderboardPrizeAdmin(prizeForm, selectedTenant);
      toast.current?.show({ severity: 'success', summary: t('common.success'), detail: t('leaderboard.save_success') });
      setShowPrizeDialog(false);
      await loadAll();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePrize = (row: LeaderboardPrizeModel) => {
    if (!row.id) return;
    confirmDialog({
      message: t('leaderboard.confirm_delete_prize', { label: row.prizeLabel }),
      header: t('common.confirm'),
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        await LoyaltyService.deleteLeaderboardPrizeAdmin(row.id!, selectedTenant);
        toast.current?.show({ severity: 'success', summary: t('common.success'), detail: t('leaderboard.delete_success') });
        await loadAll();
      },
    });
  };

  const handleSaveRule = async () => {
    if (!ruleForm.sourceCode?.trim()) return;
    setSaving(true);
    try {
      await LoyaltyService.saveLeaderboardRuleAdmin(ruleForm, selectedTenant);
      toast.current?.show({ severity: 'success', summary: t('common.success'), detail: t('leaderboard.save_success') });
      setShowRuleDialog(false);
      await loadAll();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseMonth = () => {
    confirmDialog({
      message: t('leaderboard.confirm_close_month', { month: payoutMonth }),
      header: t('common.confirm'),
      icon: 'pi pi-lock',
      accept: async () => {
        setSaving(true);
        try {
          const created = await LoyaltyService.closeLeaderboardMonthAdmin(payoutMonth, selectedTenant);
          toast.current?.show({
            severity: 'success',
            summary: t('common.success'),
            detail: t('leaderboard.close_month_done', { count: created.length }),
          });
          await loadAll();
        } catch (err: any) {
          toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const handleDecision = async (row: LeaderboardPayoutModel, approve: boolean) => {
    try {
      if (approve) {
        await LoyaltyService.approveLeaderboardPayoutAdmin(row.id, selectedTenant);
      } else {
        await LoyaltyService.rejectLeaderboardPayoutAdmin(row.id, selectedTenant);
      }
      toast.current?.show({ severity: 'success', summary: t('common.success'), detail: t('leaderboard.payout_updated') });
      await loadAll();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    }
  };

  return (
    <div className="w-full">
      <Toast ref={toast} />
      <ConfirmDialog />

      <StandardPageHeader
        title={t('leaderboard.page_title')}
        subtitle={t('leaderboard.page_subtitle')}
        primaryAction={{
          label: t('leaderboard.add_prize'),
          icon: 'pi pi-plus',
          onClick: openNewPrize,
        }}
        extraLeft={<TenantSelector value={selectedTenant} onChange={setSelectedTenant} />}
        onRefresh={loadAll}
        refreshLoading={loading}
      />

      <div className="card shadow-1 border-round surface-card p-3">
        <TabView>
          <TabPanel header={t('leaderboard.tab_prizes')} leftIcon="pi pi-trophy mr-2">
            <DataTable<LeaderboardPrizeModel[]>
              value={prizes}
              loading={loading}
              paginator
              rows={10}
              stripedRows
              responsiveLayout="scroll"
              emptyMessage={t('common.no_data')}
            >
              <Column header={t('common.order_number')} body={(_, opt) => opt.rowIndex + 1} style={{ width: '4rem', textAlign: 'center' }} />
              <Column
                header={t('common.action')}
                body={(row: LeaderboardPrizeModel) => (
                  <StandardRowActions
                    onEdit={() => {
                      setPrizeForm({ ...row });
                      setShowPrizeDialog(true);
                    }}
                    onDelete={() => handleDeletePrize(row)}
                  />
                )}
                style={{ width: '7rem', textAlign: 'center' }}
              />
              <Column field="boardType" header={t('leaderboard.board_col')} body={(r: LeaderboardPrizeModel) => <Tag value={r.boardType} severity="info" />} style={{ minWidth: '8rem' }} />
              <Column
                header={t('leaderboard.rank_range')}
                body={(r: LeaderboardPrizeModel) => (
                  <span className="font-mono font-bold text-900">
                    {r.rankFrom === r.rankTo ? `#${r.rankFrom}` : `#${r.rankFrom} – #${r.rankTo}`}
                  </span>
                )}
                style={{ minWidth: '8rem' }}
              />
              <Column field="prizeType" header={t('leaderboard.prize_type')} style={{ minWidth: '10rem' }} />
              <Column field="prizeLabel" header={t('leaderboard.prize_label')} style={{ minWidth: '15rem' }} />
              <Column field="prizeValue" header={t('leaderboard.prize_value')} body={(r: LeaderboardPrizeModel) => <span className="font-mono">{Number(r.prizeValue || 0).toLocaleString()}</span>} style={{ minWidth: '8rem', textAlign: 'right' }} />
              <Column field="sponsorName" header={t('leaderboard.sponsor')} style={{ minWidth: '11rem' }} />
              <Column field="status" header={t('common.status')} body={(r: LeaderboardPrizeModel) => <StatusBadge status={r.status} />} style={{ minWidth: '8rem', textAlign: 'center' }} />
            </DataTable>
          </TabPanel>

          <TabPanel header={t('leaderboard.tab_rules')} leftIcon="pi pi-sliders-h mr-2">
            <div className="p-3 border-round bg-orange-50 border-1 border-orange-200 text-orange-900 text-sm mb-3">
              <i className="pi pi-info-circle mr-2" />
              {t('leaderboard.rules_notice')}
            </div>
            <DataTable<GamePointRuleModel[]>
              value={rules}
              loading={loading}
              stripedRows
              responsiveLayout="scroll"
              emptyMessage={t('common.no_data')}
            >
              <Column header={t('common.order_number')} body={(_, opt) => opt.rowIndex + 1} style={{ width: '4rem', textAlign: 'center' }} />
              <Column
                header={t('common.action')}
                body={(row: GamePointRuleModel) => (
                  <StandardRowActions
                    onEdit={() => {
                      setRuleForm({ ...row });
                      setShowRuleDialog(true);
                    }}
                  />
                )}
                style={{ width: '5rem', textAlign: 'center' }}
              />
              <Column field="sourceCode" header={t('leaderboard.source_code')} body={(r: GamePointRuleModel) => <span className="font-mono font-semibold">{r.sourceCode}</span>} style={{ minWidth: '13rem' }} />
              <Column field="boardType" header={t('leaderboard.board_col')} style={{ minWidth: '8rem' }} />
              <Column field="formulaType" header={t('leaderboard.formula')} style={{ minWidth: '10rem' }} />
              <Column field="basePts" header={t('leaderboard.base_pts')} style={{ minWidth: '7rem', textAlign: 'right' }} />
              <Column field="maxPtsPerAction" header={t('leaderboard.max_per_action')} style={{ minWidth: '8rem', textAlign: 'right' }} />
              <Column field="dailyCapPts" header={t('leaderboard.daily_cap')} body={(r: GamePointRuleModel) => <span className="font-mono font-bold text-primary">{r.dailyCapPts} pts</span>} style={{ minWidth: '9rem', textAlign: 'right' }} />
              <Column field="status" header={t('common.status')} body={(r: GamePointRuleModel) => <StatusBadge status={r.status} />} style={{ minWidth: '8rem', textAlign: 'center' }} />
            </DataTable>
          </TabPanel>

          <TabPanel header={t('leaderboard.tab_payouts')} leftIcon="pi pi-check-square mr-2">
            <div className="flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
              <div className="flex align-items-center gap-2">
                <label className="text-sm font-medium">{t('leaderboard.month_label')}</label>
                <InputText value={payoutMonth} onChange={(e) => setPayoutMonth(e.target.value)} placeholder="YYYY-MM" className="w-8rem font-mono" />
                <Button icon="pi pi-search" outlined size="small" onClick={loadAll} />
              </div>
              <Button
                label={t('leaderboard.close_month_btn')}
                icon="pi pi-lock"
                severity="warning"
                size="small"
                loading={saving}
                onClick={handleCloseMonth}
              />
            </div>

            <DataTable<LeaderboardPayoutModel[]>
              value={payouts}
              loading={loading}
              paginator
              rows={10}
              stripedRows
              responsiveLayout="scroll"
              emptyMessage={t('common.no_data')}
            >
              <Column header={t('common.order_number')} body={(_, opt) => opt.rowIndex + 1} style={{ width: '4rem', textAlign: 'center' }} />
              <Column
                header={t('common.action')}
                body={(row: LeaderboardPayoutModel) =>
                  row.approvalStatus === 'PENDING_APPROVAL' ? (
                    <div className="flex gap-1 justify-content-center">
                      <Button icon="pi pi-check" rounded text severity="success" tooltip={t('leaderboard.approve_btn')} onClick={() => handleDecision(row, true)} />
                      <Button icon="pi pi-times" rounded text severity="danger" tooltip={t('leaderboard.reject_btn')} onClick={() => handleDecision(row, false)} />
                    </div>
                  ) : (
                    <span className="text-xs text-500">{row.approvedBy || '—'}</span>
                  )
                }
                style={{ width: '8rem', textAlign: 'center' }}
              />
              <Column field="leaderboardMonth" header={t('leaderboard.month_label')} style={{ minWidth: '7rem' }} />
              <Column field="boardType" header={t('leaderboard.board_col')} style={{ minWidth: '8rem' }} />
              <Column field="rankPosition" header={t('leaderboard.rank_range')} body={(r: LeaderboardPayoutModel) => <span className="font-bold">#{r.rankPosition}</span>} style={{ minWidth: '6rem' }} />
              <Column field="externalUserId" header={t('leaderboard.player_col')} body={(r: LeaderboardPayoutModel) => <span>{r.displayName || r.externalUserId}</span>} style={{ minWidth: '12rem' }} />
              <Column field="totalPts" header={t('leaderboard.total_pts')} body={(r: LeaderboardPayoutModel) => <span className="font-mono font-semibold">{Number(r.totalPts || 0).toLocaleString()} pts</span>} style={{ minWidth: '9rem', textAlign: 'right' }} />
              <Column field="prizeLabel" header={t('leaderboard.prize_label')} style={{ minWidth: '14rem' }} />
              <Column field="approvalStatus" header={t('common.status')} body={(r: LeaderboardPayoutModel) => <StatusBadge status={r.approvalStatus} />} style={{ minWidth: '10rem', textAlign: 'center' }} />
            </DataTable>
          </TabPanel>
        </TabView>
      </div>

      {/* Dialog cấu hình giải thưởng theo hạng */}
      <Dialog
        visible={showPrizeDialog}
        style={{ width: '36rem' }}
        header={t('leaderboard.prize_dialog_title')}
        modal
        onHide={() => setShowPrizeDialog(false)}
      >
        <div className="p-fluid grid">
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('leaderboard.board_col')}</label>
            <Dropdown value={prizeForm.boardType} options={boardOptions} onChange={(e) => setPrizeForm({ ...prizeForm, boardType: e.value })} appendTo="self" />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('leaderboard.prize_type')}</label>
            <Dropdown value={prizeForm.prizeType} options={prizeTypeOptions} onChange={(e) => setPrizeForm({ ...prizeForm, prizeType: e.value })} appendTo="self" />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('leaderboard.rank_from')}</label>
            <InputNumber value={prizeForm.rankFrom ?? 1} onValueChange={(e) => setPrizeForm({ ...prizeForm, rankFrom: e.value ?? 1 })} min={1} />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('leaderboard.rank_to')}</label>
            <InputNumber value={prizeForm.rankTo ?? 1} onValueChange={(e) => setPrizeForm({ ...prizeForm, rankTo: e.value ?? 1 })} min={1} />
          </div>
          <div className="col-12 field">
            <label className="text-sm font-medium">{t('leaderboard.prize_label')} *</label>
            <InputText value={prizeForm.prizeLabel || ''} onChange={(e) => setPrizeForm({ ...prizeForm, prizeLabel: e.target.value })} />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('leaderboard.prize_value')}</label>
            <InputNumber value={prizeForm.prizeValue ?? 0} onValueChange={(e) => setPrizeForm({ ...prizeForm, prizeValue: e.value ?? 0 })} min={0} />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('leaderboard.sponsor')}</label>
            <InputText value={prizeForm.sponsorName || ''} onChange={(e) => setPrizeForm({ ...prizeForm, sponsorName: e.target.value })} />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('leaderboard.voucher_code')}</label>
            <InputText value={prizeForm.voucherCode || ''} onChange={(e) => setPrizeForm({ ...prizeForm, voucherCode: e.target.value })} className="font-mono" />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('common.status')}</label>
            <Dropdown value={prizeForm.status || CommonStatus.ACTIVE} options={statusOptions} onChange={(e) => setPrizeForm({ ...prizeForm, status: e.value })} appendTo="self" />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-3">
          <Button label={t('common.cancel')} icon="pi pi-times" outlined onClick={() => setShowPrizeDialog(false)} />
          <Button label={t('common.save')} icon="pi pi-check" onClick={handleSavePrize} loading={saving} />
        </div>
      </Dialog>

      {/* Dialog chỉnh sửa luật Game points */}
      <Dialog
        visible={showRuleDialog}
        style={{ width: '34rem' }}
        header={t('leaderboard.rule_dialog_title')}
        modal
        onHide={() => setShowRuleDialog(false)}
      >
        <div className="p-fluid grid">
          <div className="col-12 field">
            <label className="text-sm font-medium">{t('leaderboard.source_code')}</label>
            <InputText value={ruleForm.sourceCode || ''} disabled className="font-mono" />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('leaderboard.board_col')}</label>
            <Dropdown value={ruleForm.boardType} options={boardOptions} onChange={(e) => setRuleForm({ ...ruleForm, boardType: e.value })} appendTo="self" />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('leaderboard.formula')}</label>
            <Dropdown value={ruleForm.formulaType} options={formulaOptions} onChange={(e) => setRuleForm({ ...ruleForm, formulaType: e.value })} appendTo="self" />
          </div>
          <div className="col-4 field">
            <label className="text-sm font-medium">{t('leaderboard.base_pts')}</label>
            <InputNumber value={ruleForm.basePts ?? 0} onValueChange={(e) => setRuleForm({ ...ruleForm, basePts: e.value ?? 0 })} min={0} />
          </div>
          <div className="col-4 field">
            <label className="text-sm font-medium">{t('leaderboard.max_per_action')}</label>
            <InputNumber value={ruleForm.maxPtsPerAction ?? 0} onValueChange={(e) => setRuleForm({ ...ruleForm, maxPtsPerAction: e.value ?? 0 })} min={0} />
          </div>
          <div className="col-4 field">
            <label className="text-sm font-medium">{t('leaderboard.daily_cap')}</label>
            <InputNumber value={ruleForm.dailyCapPts ?? 0} onValueChange={(e) => setRuleForm({ ...ruleForm, dailyCapPts: e.value ?? 0 })} min={0} />
          </div>
          <div className="col-12 field">
            <label className="text-sm font-medium">{t('common.status')}</label>
            <Dropdown value={ruleForm.status || CommonStatus.ACTIVE} options={statusOptions} onChange={(e) => setRuleForm({ ...ruleForm, status: e.value })} appendTo="self" />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-3">
          <Button label={t('common.cancel')} icon="pi pi-times" outlined onClick={() => setShowRuleDialog(false)} />
          <Button label={t('common.save')} icon="pi pi-check" onClick={handleSaveRule} loading={saving} />
        </div>
      </Dialog>
    </div>
  );
};

export default LeaderboardPrizesPage;
