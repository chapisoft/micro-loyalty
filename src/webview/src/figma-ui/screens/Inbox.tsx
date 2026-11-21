import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Settings, Gift, Clock, Sparkles, Bell } from 'lucide-react';
import { LoyaltyApi, getDefaultUserId, type InboxMessageItem, type NotificationPreferencesDto } from '../../services/api';
import { Screen, Skeleton, ErrorBlock, Pill, PrimaryButton, SecondaryButton, Empty, Switch, useLoad, ddmm } from '../ui';
import { artEmptyBox, partnerPhoto } from '../art';

const uid = () => getDefaultUserId();
const time = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${ddmm(iso)} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const kind = (m: InboxMessageItem, t: (k: string) => string) =>
  m.category === 'PROMO' ? { label: t('figma_ui.inbox.kind_promo'), Icon: Sparkles, tone: 'orange' as const, cta: t('figma_ui.inbox.kind_promo_cta') }
    : m.category === 'REWARD' ? { label: t('figma_ui.inbox.kind_reward'), Icon: Gift, tone: 'green' as const, cta: t('figma_ui.inbox.kind_reward_cta') }
      : m.category === 'TIER' ? { label: t('figma_ui.inbox.kind_tier'), Icon: Clock, tone: 'blue' as const, cta: t('figma_ui.inbox.kind_tier_cta') }
        : { label: t('figma_ui.inbox.kind_notice'), Icon: Bell, tone: 'grey' as const, cta: t('figma_ui.inbox.kind_notice_cta') };

const target = (m: InboxMessageItem) => {
  if (m.category === 'PROMO') return `/inbox/${m.id}`;
  if (m.actionUrl?.startsWith('#/')) return m.actionUrl.slice(1);
  if (m.actionUrl?.startsWith('/')) return m.actionUrl;
  return m.category === 'REWARD' ? '/coins' : m.category === 'TIER' ? '/tiers' : `/inbox/${m.id}`;
};

// ───────────────────────── CN-02 · Inbox ─────────────────────────
export const Inbox: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const userId = uid();
  const [data, failed, reload] = useLoad(async () => (userId ? LoyaltyApi.getInboxMessages(userId) : ([] as InboxMessageItem[])));
  const list = Array.isArray(data) ? (data as InboxMessageItem[]) : data?.messages || [];
  const open = (m: InboxMessageItem) => {
    if (!m.isRead && userId) void LoyaltyApi.markInboxRead(m.id, userId).catch(() => undefined);
    navigate(target(m));
  };
  return (
    <Screen title={t('figma_ui.inbox.title')} back="/">
      <div className="flex items-center">
        <div className="flex-1">
          <h2 className="text-[22px] font-semibold">{t('figma_ui.inbox.heading')}</h2>
          <p className="text-[13px] text-slate-500">{t('figma_ui.inbox.subheading')}</p>
        </div>
        <button type="button" aria-label={t('figma_ui.inbox.settings_aria')} onClick={() => navigate('/notifications')} className="flex size-11 items-center justify-center rounded-full bg-white"><Settings className="size-5 text-slate-600" /></button>
      </div>
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[200px]" />}
      {data && list.length === 0 && (
        <Empty
          art={artEmptyBox}
          title={!userId ? t('sso.guest_login_required') : t('figma_ui.inbox.empty_title')}
          text={!userId ? t('sso.guest_login_required_desc') : t('figma_ui.inbox.empty_sub')}
        />
      )}
      {list.map((m) => {
        const k = kind(m, t);
        return (
          <button key={m.id} type="button" onClick={() => open(m)} className={`flex w-full flex-col gap-2 rounded-[20px] p-4 text-left ${m.category === 'PROMO' ? 'bg-brand-soft' : 'bg-white'}`}>
            <span className="flex items-center gap-2">
              <Pill tone={k.tone}><k.Icon className="size-3" /> {k.label}</Pill>
              <span className="flex-1 text-right text-[11px] text-slate-500">{time(m.createdAt)}</span>
              {!m.isRead && <span className="size-2 rounded-full bg-brand" />}
            </span>
            <span className="text-[15px] font-semibold">{m.title}</span>
            <span className="text-[12px] leading-[17px] text-slate-500">{m.body}</span>
            <span className="text-[12px] font-semibold text-brand">{k.cta}</span>
          </button>
        );
      })}
    </Screen>
  );
};

// ───────────────────────── CN-02 · Targeted offer details ─────────────────────────
export const OfferDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const userId = uid();
  const [data, failed, reload] = useLoad(async () => (userId ? LoyaltyApi.getInboxMessages(userId) : ([] as InboxMessageItem[])), [id, userId]);
  const list = Array.isArray(data) ? (data as InboxMessageItem[]) : data?.messages || [];
  const m = list.find((x) => String(x.id) === id);
  return (
    <Screen title={t('figma_ui.inbox.offer_details_title')} back="/inbox">
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[300px]" />}
      {data && !m && <Empty art={artEmptyBox} title={t('figma_ui.inbox.offer_ended')} />}
      {m && (
        <>
          <div className="relative h-[200px] w-full overflow-hidden rounded-[20px]">
            <img src={partnerPhoto(m.title)} alt="" className="size-full object-cover" />
            <span className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
            <span className="absolute bottom-3 left-4 right-4 flex flex-col gap-1 text-white">
              <Pill tone="orange" className="w-fit">{t('figma_ui.inbox.kind_promo')}</Pill>
              <span className="text-[20px] font-semibold">{m.title}</span>
            </span>
          </div>
          <p className="text-[12px] text-slate-500">{t('figma_ui.inbox.sent_at', { time: time(m.createdAt) })}</p>
          <p className="whitespace-pre-line text-[14px] leading-6">{m.body}</p>
          <PrimaryButton onClick={() => navigate(m.actionUrl?.startsWith('/') ? m.actionUrl : '/rewards')}>{t('figma_ui.inbox.see_offer_store')}</PrimaryButton>
          <SecondaryButton onClick={() => navigate('/inbox')}>{t('figma_ui.inbox.back_to_inbox')}</SecondaryButton>
        </>
      )}
    </Screen>
  );
};

// ───────────────────────── CN-04 · Notification settings ─────────────────────────
export const NotificationSettings: React.FC = () => {
  const { t } = useTranslation();
  const userId = uid();
  const [prefs, failed, reload] = useLoad(async () => (userId ? LoyaltyApi.getNotificationPreferences(userId) : null), [userId]);
  const [local, setLocal] = useState<NotificationPreferencesDto>();
  const p = local || prefs;
  const save = async (patch: Partial<NotificationPreferencesDto>) => {
    if (!p || !userId) return;
    const next = { ...p, ...patch };
    setLocal(next);
    try {
      setLocal(await LoyaltyApi.updateNotificationPreferences(next, userId));
    } catch {
      setLocal(p);
      alert(t('figma_ui.inbox.save_error'));
    }
  };
  const rows: { title: string; sub: string; on: boolean; disabled?: boolean; set?: (v: boolean) => void }[] = p
    ? [
        { title: t('figma_ui.inbox.pref_offers_title'), sub: t('figma_ui.inbox.pref_offers_sub'), on: !p.optOutMarketing, set: (v) => save({ optOutMarketing: !v }) },
        { title: t('figma_ui.inbox.pref_missions_title'), sub: t('figma_ui.inbox.pref_missions_sub'), on: p.pushEnabled, set: (v) => save({ pushEnabled: v }) },
        // shortcut: the preferences API has no separate expiry flag; expiry alerts follow the always-on in-app channel
        { title: t('figma_ui.inbox.pref_expiry_title'), sub: t('figma_ui.inbox.pref_expiry_sub'), on: true, disabled: true },
        { title: t('figma_ui.inbox.pref_sms_title'), sub: t('figma_ui.inbox.pref_sms_sub'), on: p.smsEnabled, set: (v) => save({ smsEnabled: v }) },
      ]
    : [];
  return (
    <Screen title={t('figma_ui.inbox.title')} back="/inbox">
      <div>
        <h2 className="text-[22px] font-semibold">{t('figma_ui.inbox.title')}</h2>
        <p className="text-[13px] text-slate-500">{t('figma_ui.inbox.notif_choose_sub')}</p>
      </div>
      {!userId ? (
        <Empty art={artEmptyBox} title={t('sso.guest_login_required')} text={t('sso.guest_login_required_desc')} />
      ) : (
        <>
          {failed && <ErrorBlock onRetry={reload} />}
          {!p && !failed && <Skeleton className="h-[260px]" />}
        </>
      )}
      {p && (
        <div className="w-full divide-y divide-slate-100 rounded-[20px] bg-white px-4">
          {rows.map((r) => (
            <div key={r.title} className="flex items-center gap-3 py-4">
              <div className="flex-1">
                <p className="text-[15px] font-semibold">{r.title}</p>
                <p className="text-[12px] text-slate-500">{r.sub}</p>
              </div>
              <Switch label={r.title} on={r.on} disabled={r.disabled} onChange={r.set} />
            </div>
          ))}
        </div>
      )}
      <div className="rounded-[16px] bg-slate-100 p-4">
        <p className="text-[13px] font-semibold">{t('figma_ui.inbox.service_always_on')}</p>
        <p className="text-[12px] text-slate-500">{t('figma_ui.inbox.service_examples')}</p>
      </div>
      <p className="text-[11px] text-slate-500">{t('figma_ui.inbox.frequency_note')}</p>
    </Screen>
  );
};
