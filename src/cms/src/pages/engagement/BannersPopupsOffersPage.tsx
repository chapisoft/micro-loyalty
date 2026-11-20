import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Tag } from 'primereact/tag';
import { useTranslation } from 'react-i18next';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { StandardRowActions } from '@/components/StandardRowActions';
import { StatusBadge } from '@/components/StatusBadge';
import { TenantSelector } from '@/components/TenantSelector';
import { ImageUploadField } from '@/components/ImageUploadField';
import { CommonStatus, MediaFolder } from '@/models';
import {
  LoyaltyService,
  ContentBannerModel,
  CustomerSegmentModel,
  PopupRuleModel,
  TargetedOfferModel,
  VoucherItemModel,
} from '@/service/loyalty.service';

type BannerI18nMap = Record<'en' | 'fr' | 'ht', { title?: string; subtitle?: string }>;
const EMPTY_BANNER_I18N: BannerI18nMap = { en: {}, fr: {}, ht: {} };
const parseBannerI18n = (raw?: string): BannerI18nMap => {
  try {
    return { ...EMPTY_BANNER_I18N, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return { ...EMPTY_BANNER_I18N };
  }
};
const toDateValue = (raw?: string): Date | null => {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
};

export const BannersPopupsOffersPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>('TENANT_NATCASH');
  const [activeTab, setActiveTab] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [banners, setBanners] = useState<ContentBannerModel[]>([]);
  const [popups, setPopups] = useState<PopupRuleModel[]>([]);
  const [offers, setOffers] = useState<TargetedOfferModel[]>([]);
  const [segments, setSegments] = useState<CustomerSegmentModel[]>([]);
  const [vouchers, setVouchers] = useState<VoucherItemModel[]>([]);

  const [showBannerDialog, setShowBannerDialog] = useState(false);
  const [bannerForm, setBannerForm] = useState<Partial<ContentBannerModel>>({});
  const [bannerI18n, setBannerI18n] = useState<BannerI18nMap>(EMPTY_BANNER_I18N);

  const [showPopupDialog, setShowPopupDialog] = useState(false);
  const [popupForm, setPopupForm] = useState<Partial<PopupRuleModel>>({});

  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [offerForm, setOfferForm] = useState<Partial<TargetedOfferModel>>({});

  const placementOptions = useMemo(
    () => [
      { label: t('cn06.placement_home'), value: 'LOYALTY_HOME' },
      { label: t('cn06.placement_natcash_slider'), value: 'NATCASH_HOME_SLIDER' },
      { label: t('cn06.placement_store'), value: 'VOUCHER_STORE' },
      { label: t('cn06.placement_games'), value: 'GAME_HUB' },
    ],
    [t]
  );

  const segmentOptions = useMemo(() => {
    const opts = [
      { label: t('cn06.segment_all'), value: 'ALL' },
      ...segments.map((s) => ({
        label: s.segmentName ? `${s.segmentName} (${s.segmentCode})` : s.segmentCode,
        value: s.segmentCode,
      })),
    ];
    for (const code of [bannerForm.segmentCode, offerForm.segmentCode]) {
      if (code && code !== 'ALL' && !opts.some((o) => o.value === code)) {
        opts.push({ label: code, value: code });
      }
    }
    return opts;
  }, [segments, bannerForm.segmentCode, offerForm.segmentCode, t]);

  const voucherOptions = useMemo(() => {
    const opts = vouchers.map((v) => ({
      label: `[${v.voucherCode}] ${v.title}`,
      value: v.voucherCode,
    }));
    const current = offerForm.voucherCode?.trim();
    if (current && !opts.some((o) => o.value === current)) {
      opts.push({ label: current, value: current });
    }
    return opts;
  }, [vouchers, offerForm.voucherCode]);

  const popupTypeOptions = useMemo(
    () => [
      { label: t('cn06.popup_reward_ready'), value: 'REWARD_READY' },
      { label: t('cn06.popup_voucher_expiring'), value: 'VOUCHER_EXPIRING' },
      { label: t('cn06.popup_mission_ending'), value: 'MISSION_ENDING' },
      { label: t('cn06.popup_campaign'), value: 'CAMPAIGN_POPUP' },
    ],
    [t]
  );

  const channelOptions = useMemo(
    () => [
      { label: t('cn06.channel_inbox_push'), value: 'INBOX,PUSH' },
      { label: t('cn06.channel_inbox_only'), value: 'INBOX' },
      { label: t('cn06.channel_inbox_push_sms'), value: 'INBOX,PUSH,SMS' },
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
      const [bannerList, popupList, offerList, segmentList, voucherList] = await Promise.all([
        LoyaltyService.getContentBannersAdmin(selectedTenant),
        LoyaltyService.getPopupRulesAdmin(selectedTenant),
        LoyaltyService.getTargetedOffersAdmin(selectedTenant),
        LoyaltyService.getSegments(selectedTenant),
        LoyaltyService.getVouchers(selectedTenant),
      ]);
      setBanners(bannerList);
      setPopups(popupList);
      setOffers(offerList);
      setSegments(Array.isArray(segmentList) ? segmentList : []);
      setVouchers(Array.isArray(voucherList) ? voucherList : []);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openNewBanner = () => {
    setBannerForm({
      placement: 'LOYALTY_HOME',
      title: '',
      subtitle: '',
      ctaLabel: '',
      imageUrl: '',
      deepLink: '/rewards',
      segmentCode: 'ALL',
      displayOrder: banners.length + 1,
      startDate: '',
      endDate: '',
      status: CommonStatus.ACTIVE,
    });
    setBannerI18n({ en: {}, fr: {}, ht: {} });
    setShowBannerDialog(true);
  };

  const openNewOffer = () => {
    setOfferForm({
      offerCode: `OFFER_${Math.floor(1000 + Math.random() * 9000)}`,
      title: '',
      body: '',
      segmentCode: 'ALL',
      voucherCode: '',
      channels: 'INBOX,PUSH',
      deepLink: '/rewards',
      status: 'DRAFT',
    });
    setShowOfferDialog(true);
  };

  const handleSaveBanner = async () => {
    if (!bannerForm.title?.trim()) {
      toast.current?.show({ severity: 'warn', summary: t('common.warning'), detail: t('cn06.title_required') });
      return;
    }
    setSaving(true);
    try {
      await LoyaltyService.saveContentBannerAdmin(
        {
          ...bannerForm,
          i18nJson: JSON.stringify(bannerI18n),
        },
        selectedTenant
      );
      toast.current?.show({ severity: 'success', summary: t('common.success'), detail: t('cn06.saved') });
      setShowBannerDialog(false);
      await loadAll();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBanner = (row: ContentBannerModel) => {
    if (!row.id) return;
    confirmDialog({
      message: t('cn06.confirm_delete', { name: row.title }),
      header: t('common.confirm'),
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        await LoyaltyService.deleteContentBannerAdmin(row.id!, selectedTenant);
        toast.current?.show({ severity: 'success', summary: t('common.success'), detail: t('cn06.deleted') });
        await loadAll();
      },
    });
  };

  const handleTogglePopup = async (row: PopupRuleModel, enabled: boolean) => {
    try {
      await LoyaltyService.savePopupRuleAdmin({ ...row, enabled }, selectedTenant);
      toast.current?.show({ severity: 'success', summary: t('common.success'), detail: t('cn06.saved') });
      await loadAll();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    }
  };

  const handleSavePopup = async () => {
    if (!popupForm.ruleCode?.trim()) return;
    setSaving(true);
    try {
      await LoyaltyService.savePopupRuleAdmin(popupForm, selectedTenant);
      toast.current?.show({ severity: 'success', summary: t('common.success'), detail: t('cn06.saved') });
      setShowPopupDialog(false);
      await loadAll();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOffer = async () => {
    if (!offerForm.title?.trim()) {
      toast.current?.show({ severity: 'warn', summary: t('common.warning'), detail: t('cn06.title_required') });
      return;
    }
    setSaving(true);
    try {
      await LoyaltyService.saveTargetedOfferAdmin(offerForm, selectedTenant);
      toast.current?.show({ severity: 'success', summary: t('common.success'), detail: t('cn06.saved') });
      setShowOfferDialog(false);
      await loadAll();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSendOffer = (row: TargetedOfferModel) => {
    if (!row.id) return;
    confirmDialog({
      message: t('cn06.confirm_send_offer', { title: row.title, segment: row.segmentCode }),
      header: t('common.confirm'),
      icon: 'pi pi-send',
      accept: async () => {
        setSaving(true);
        try {
          const res = await LoyaltyService.sendTargetedOfferAdmin(row.id!, undefined, selectedTenant);
          toast.current?.show({
            severity: 'success',
            summary: t('common.success'),
            detail: t('cn06.offer_sent_done', { count: res.deliveredCount }),
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

  const handleDeleteOffer = (row: TargetedOfferModel) => {
    if (!row.id) return;
    confirmDialog({
      message: t('cn06.confirm_delete', { name: row.title }),
      header: t('common.confirm'),
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        await LoyaltyService.deleteTargetedOfferAdmin(row.id!, selectedTenant);
        toast.current?.show({ severity: 'success', summary: t('common.success'), detail: t('cn06.deleted') });
        await loadAll();
      },
    });
  };

  const primaryAction = activeTab === 2
    ? { label: t('cn06.add_offer'), icon: 'pi pi-plus', onClick: openNewOffer }
    : { label: t('cn06.add_banner'), icon: 'pi pi-plus', onClick: openNewBanner };

  return (
    <div className="w-full">
      <Toast ref={toast} />
      <ConfirmDialog />

      <StandardPageHeader
        title={t('cn06.page_title')}
        subtitle={t('cn06.page_subtitle')}
        primaryAction={primaryAction}
        extraLeft={<TenantSelector value={selectedTenant} onChange={setSelectedTenant} />}
        onRefresh={loadAll}
        refreshLoading={loading}
      />

      <div className="card shadow-1 border-round surface-card p-3">
        <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
          <TabPanel header={t('cn06.tab_banners')} leftIcon="pi pi-images mr-2">
            <DataTable<ContentBannerModel[]>
              value={banners}
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
                body={(row: ContentBannerModel) => (
                  <StandardRowActions
                    onEdit={() => {
                      setBannerForm({ ...row });
                      setBannerI18n(parseBannerI18n(row.i18nJson));
                      setShowBannerDialog(true);
                    }}
                    onDelete={() => handleDeleteBanner(row)}
                  />
                )}
                style={{ width: '7rem', textAlign: 'center' }}
              />
              <Column field="placement" header={t('cn06.placement')} body={(r: ContentBannerModel) => <Tag value={r.placement} severity="info" />} style={{ minWidth: '11rem' }} />
              <Column field="title" header={t('cn06.title')} style={{ minWidth: '15rem' }} />
              <Column field="segmentCode" header={t('cn06.segment')} style={{ minWidth: '10rem' }} />
              <Column field="deepLink" header={t('cn06.deep_link')} body={(r: ContentBannerModel) => <span className="font-mono text-xs">{r.deepLink || '—'}</span>} style={{ minWidth: '10rem' }} />
              <Column field="displayOrder" header={t('cn06.order')} style={{ width: '6rem', textAlign: 'center' }} />
              <Column field="status" header={t('common.status')} body={(r: ContentBannerModel) => <StatusBadge status={r.status} />} style={{ minWidth: '8rem', textAlign: 'center' }} />
            </DataTable>
          </TabPanel>

          <TabPanel header={t('cn06.tab_popups')} leftIcon="pi pi-window-maximize mr-2">
            <div className="p-3 border-round bg-orange-50 border-1 border-orange-200 text-orange-900 text-sm mb-3">
              <i className="pi pi-clock mr-2" />
              {t('cn06.popup_policy_notice')}
            </div>
            <DataTable<PopupRuleModel[]>
              value={popups}
              loading={loading}
              stripedRows
              responsiveLayout="scroll"
              emptyMessage={t('common.no_data')}
            >
              <Column header={t('common.order_number')} body={(_, opt) => opt.rowIndex + 1} style={{ width: '4rem', textAlign: 'center' }} />
              <Column
                header={t('common.action')}
                body={(row: PopupRuleModel) => (
                  <StandardRowActions
                    onEdit={() => {
                      setPopupForm({ ...row });
                      setShowPopupDialog(true);
                    }}
                  />
                )}
                style={{ width: '5rem', textAlign: 'center' }}
              />
              <Column field="priority" header={t('cn06.priority')} body={(r: PopupRuleModel) => <span className="font-bold text-primary">#{r.priority}</span>} style={{ width: '6rem', textAlign: 'center' }} />
              <Column field="ruleCode" header={t('cn06.rule_code')} body={(r: PopupRuleModel) => <span className="font-mono font-semibold">{r.ruleCode}</span>} style={{ minWidth: '11rem' }} />
              <Column field="title" header={t('cn06.title')} style={{ minWidth: '14rem' }} />
              <Column
                header={t('cn06.window_cooldown')}
                body={(r: PopupRuleModel) => (
                  <span className="font-mono text-xs">
                    {String(r.windowStartHour).padStart(2, '0')}:00–{String(r.windowEndHour).padStart(2, '0')}:00 · {r.cooldownHours}h
                  </span>
                )}
                style={{ minWidth: '11rem' }}
              />
              <Column
                field="enabled"
                header={t('cn06.enabled')}
                body={(r: PopupRuleModel) => (
                  <InputSwitch checked={Boolean(r.enabled)} onChange={(e) => handleTogglePopup(r, Boolean(e.value))} />
                )}
                style={{ width: '7rem', textAlign: 'center' }}
              />
            </DataTable>
          </TabPanel>

          <TabPanel header={t('cn06.tab_offers')} leftIcon="pi pi-send mr-2">
            <DataTable<TargetedOfferModel[]>
              value={offers}
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
                body={(row: TargetedOfferModel) => (
                  <div className="flex gap-1 justify-content-center">
                    <Button
                      icon="pi pi-send"
                      rounded
                      text
                      severity="success"
                      tooltip={t('cn06.send_offer_btn')}
                      onClick={() => handleSendOffer(row)}
                    />
                    <StandardRowActions
                      onEdit={() => {
                        setOfferForm({ ...row });
                        setShowOfferDialog(true);
                      }}
                      onDelete={() => handleDeleteOffer(row)}
                    />
                  </div>
                )}
                style={{ width: '10rem', textAlign: 'center' }}
              />
              <Column field="offerCode" header={t('cn06.offer_code')} body={(r: TargetedOfferModel) => <span className="font-mono font-semibold">{r.offerCode}</span>} style={{ minWidth: '10rem' }} />
              <Column field="title" header={t('cn06.title')} style={{ minWidth: '14rem' }} />
              <Column field="segmentCode" header={t('cn06.segment')} style={{ minWidth: '10rem' }} />
              <Column field="voucherCode" header={t('cn06.voucher_code')} body={(r: TargetedOfferModel) => <span className="font-mono text-xs">{r.voucherCode || '—'}</span>} style={{ minWidth: '9rem' }} />
              <Column field="channels" header={t('cn06.channels')} body={(r: TargetedOfferModel) => <Tag value={r.channels} severity="info" />} style={{ minWidth: '9rem' }} />
              <Column field="sentCount" header={t('cn06.sent_count')} body={(r: TargetedOfferModel) => <span className="font-mono">{Number(r.sentCount || 0).toLocaleString()}</span>} style={{ width: '7rem', textAlign: 'right' }} />
              <Column field="status" header={t('common.status')} body={(r: TargetedOfferModel) => <StatusBadge status={r.status} />} style={{ minWidth: '8rem', textAlign: 'center' }} />
            </DataTable>
          </TabPanel>
        </TabView>
      </div>

      {/* Dialog Banner */}
      <Dialog visible={showBannerDialog} style={{ width: '44rem', maxWidth: '96vw' }} header={t('cn06.banner_dialog_title')} modal onHide={() => setShowBannerDialog(false)}>
        <div className="p-fluid grid">
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('cn06.placement')}</label>
            <Dropdown value={bannerForm.placement} options={placementOptions} onChange={(e) => setBannerForm({ ...bannerForm, placement: e.value })} appendTo="self" />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('cn06.segment')}</label>
            <Dropdown value={bannerForm.segmentCode || 'ALL'} options={segmentOptions} onChange={(e) => setBannerForm({ ...bannerForm, segmentCode: e.value })} filter appendTo="self" />
          </div>
          <div className="col-12 field">
            <label className="text-sm font-medium">{t('cn06.title')} *</label>
            <InputText value={bannerForm.title || ''} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} />
          </div>
          <div className="col-12 field">
            <label className="text-sm font-medium">{t('cn06.subtitle')}</label>
            <InputTextarea rows={2} value={bannerForm.subtitle || ''} onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })} />
          </div>
          <div className="col-12 field">
            <ImageUploadField
              value={bannerForm.imageUrl}
              onChange={(url) => setBannerForm({ ...bannerForm, imageUrl: url })}
              folder={MediaFolder.BANNERS}
              tenantId={selectedTenant}
              label={t('cn06.image_url')}
              aspect="banner"
            />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('cn06.cta_label')}</label>
            <InputText value={bannerForm.ctaLabel || ''} onChange={(e) => setBannerForm({ ...bannerForm, ctaLabel: e.target.value })} />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('cn06.deep_link')}</label>
            <InputText value={bannerForm.deepLink || ''} onChange={(e) => setBannerForm({ ...bannerForm, deepLink: e.target.value })} className="font-mono" />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('cn06.start_date')}</label>
            <Calendar
              value={toDateValue(bannerForm.startDate)}
              onChange={(e) => setBannerForm({ ...bannerForm, startDate: e.value ? (e.value as Date).toISOString() : '' })}
              dateFormat="yy-mm-dd"
              showIcon
              showButtonBar
              appendTo="self"
            />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('cn06.end_date')}</label>
            <Calendar
              value={toDateValue(bannerForm.endDate)}
              onChange={(e) => setBannerForm({ ...bannerForm, endDate: e.value ? (e.value as Date).toISOString() : '' })}
              dateFormat="yy-mm-dd"
              showIcon
              showButtonBar
              appendTo="self"
            />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('cn06.order')}</label>
            <InputNumber value={bannerForm.displayOrder ?? 1} onValueChange={(e) => setBannerForm({ ...bannerForm, displayOrder: e.value ?? 1 })} min={1} />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('common.status')}</label>
            <Dropdown value={bannerForm.status || CommonStatus.ACTIVE} options={statusOptions} onChange={(e) => setBannerForm({ ...bannerForm, status: e.value })} appendTo="self" />
          </div>
          <div className="col-12">
            <div className="surface-50 border-round-lg p-3 border-1 surface-border">
              <div className="text-sm font-bold text-900 mb-2">{t('cn06.i18n_section')}</div>
              <div className="grid">
                {(['en', 'fr', 'ht'] as const).map((lng) => (
                  <div key={lng} className="col-12 md:col-4 field mb-0">
                    <label className="text-xs font-semibold text-700">
                      {lng === 'en' ? 'English' : lng === 'fr' ? 'Français' : 'Kreyòl'}
                    </label>
                    <InputText
                      value={bannerI18n[lng]?.title || ''}
                      placeholder={t('cn06.title')}
                      onChange={(e) =>
                        setBannerI18n((prev) => ({
                          ...prev,
                          [lng]: { ...prev[lng], title: e.target.value },
                        }))
                      }
                    />
                    <InputText
                      className="mt-2"
                      value={bannerI18n[lng]?.subtitle || ''}
                      placeholder={t('cn06.subtitle')}
                      onChange={(e) =>
                        setBannerI18n((prev) => ({
                          ...prev,
                          [lng]: { ...prev[lng], subtitle: e.target.value },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-3">
          <Button label={t('common.cancel')} icon="pi pi-times" outlined onClick={() => setShowBannerDialog(false)} />
          <Button label={t('common.save')} icon="pi pi-check" onClick={handleSaveBanner} loading={saving} />
        </div>
      </Dialog>

      {/* Dialog Popup Rule */}
      <Dialog visible={showPopupDialog} style={{ width: '36rem' }} header={t('cn06.popup_dialog_title')} modal onHide={() => setShowPopupDialog(false)}>
        <div className="p-fluid grid">
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('cn06.rule_code')}</label>
            <InputText value={popupForm.ruleCode || ''} disabled className="font-mono" />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('cn06.popup_type')}</label>
            <Dropdown value={popupForm.popupType} options={popupTypeOptions} onChange={(e) => setPopupForm({ ...popupForm, popupType: e.value })} appendTo="self" />
          </div>
          <div className="col-12 field">
            <label className="text-sm font-medium">{t('cn06.title')}</label>
            <InputText value={popupForm.title || ''} onChange={(e) => setPopupForm({ ...popupForm, title: e.target.value })} />
          </div>
          <div className="col-12 field">
            <label className="text-sm font-medium">{t('cn06.body')}</label>
            <InputTextarea rows={2} value={popupForm.body || ''} onChange={(e) => setPopupForm({ ...popupForm, body: e.target.value })} />
          </div>
          <div className="col-4 field">
            <label className="text-sm font-medium">{t('cn06.priority')}</label>
            <InputNumber value={popupForm.priority ?? 1} onValueChange={(e) => setPopupForm({ ...popupForm, priority: e.value ?? 1 })} min={1} />
          </div>
          <div className="col-4 field">
            <label className="text-sm font-medium">{t('cn06.threshold_days')}</label>
            <InputNumber value={popupForm.thresholdDays ?? undefined} onValueChange={(e) => setPopupForm({ ...popupForm, thresholdDays: e.value ?? null })} min={0} />
          </div>
          <div className="col-4 field">
            <label className="text-sm font-medium">{t('cn06.cooldown_hours')}</label>
            <InputNumber value={popupForm.cooldownHours ?? 24} onValueChange={(e) => setPopupForm({ ...popupForm, cooldownHours: e.value ?? 24 })} min={1} />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('cn06.cta_label')}</label>
            <InputText value={popupForm.ctaLabel || ''} onChange={(e) => setPopupForm({ ...popupForm, ctaLabel: e.target.value })} />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('cn06.deep_link')}</label>
            <InputText value={popupForm.deepLink || ''} onChange={(e) => setPopupForm({ ...popupForm, deepLink: e.target.value })} className="font-mono" />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-3">
          <Button label={t('common.cancel')} icon="pi pi-times" outlined onClick={() => setShowPopupDialog(false)} />
          <Button label={t('common.save')} icon="pi pi-check" onClick={handleSavePopup} loading={saving} />
        </div>
      </Dialog>

      {/* Dialog Targeted Offer */}
      <Dialog visible={showOfferDialog} style={{ width: '38rem' }} header={t('cn06.offer_dialog_title')} modal onHide={() => setShowOfferDialog(false)}>
        <div className="p-fluid grid">
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('cn06.offer_code')}</label>
            <InputText value={offerForm.offerCode || ''} onChange={(e) => setOfferForm({ ...offerForm, offerCode: e.target.value.toUpperCase() })} className="font-mono" />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('cn06.segment')}</label>
            <Dropdown value={offerForm.segmentCode || 'ALL'} options={segmentOptions} onChange={(e) => setOfferForm({ ...offerForm, segmentCode: e.value })} filter appendTo="self" />
          </div>
          <div className="col-12 field">
            <label className="text-sm font-medium">{t('cn06.title')} *</label>
            <InputText value={offerForm.title || ''} onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })} />
          </div>
          <div className="col-12 field">
            <label className="text-sm font-medium">{t('cn06.body')}</label>
            <InputTextarea rows={3} value={offerForm.body || ''} onChange={(e) => setOfferForm({ ...offerForm, body: e.target.value })} />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('cn06.voucher_code')}</label>
            <Dropdown
              value={offerForm.voucherCode || null}
              options={voucherOptions}
              onChange={(e) => setOfferForm({ ...offerForm, voucherCode: e.value || '' })}
              placeholder={t('cn06.voucher_placeholder')}
              filter
              showClear
              appendTo="self"
            />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('cn06.channels')}</label>
            <Dropdown value={offerForm.channels || 'INBOX,PUSH'} options={channelOptions} onChange={(e) => setOfferForm({ ...offerForm, channels: e.value })} appendTo="self" />
          </div>
          <div className="col-12 field">
            <label className="text-sm font-medium">{t('cn06.deep_link')}</label>
            <InputText value={offerForm.deepLink || ''} onChange={(e) => setOfferForm({ ...offerForm, deepLink: e.target.value })} className="font-mono" />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-3">
          <Button label={t('common.cancel')} icon="pi pi-times" outlined onClick={() => setShowOfferDialog(false)} />
          <Button label={t('common.save')} icon="pi pi-check" onClick={handleSaveOffer} loading={saving} />
        </div>
      </Dialog>
    </div>
  );
};

export default BannersPopupsOffersPage;
