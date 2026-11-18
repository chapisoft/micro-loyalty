import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Settings, Gift, Clock, Sparkles, Bell } from 'lucide-react';
import { LoyaltyApi, getDefaultUserId, type InboxMessageItem, type NotificationPreferencesDto } from '../../services/api';
import { Screen, Skeleton, ErrorBlock, Pill, PrimaryButton, SecondaryButton, Empty, useLoad, ddmm } from '../ui';
import { artEmptyBox, partnerPhoto } from '../art';

const uid = () => getDefaultUserId();
const time = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${ddmm(iso)} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const kind = (m: InboxMessageItem) =>
  m.category === 'PROMO' ? { label: 'Just for you', Icon: Sparkles, tone: 'orange' as const, cta: 'See offer ›' }
    : m.category === 'REWARD' ? { label: 'Reward', Icon: Gift, tone: 'green' as const, cta: 'See coins history ›' }
      : m.category === 'TIER' ? { label: 'Tier', Icon: Clock, tone: 'blue' as const, cta: 'See tiers ›' }
        : { label: 'Notice', Icon: Bell, tone: 'grey' as const, cta: 'Open ›' };

const target = (m: InboxMessageItem) => {
  if (m.category === 'PROMO') return `/inbox/${m.id}`;
  if (m.actionUrl?.startsWith('#/')) return m.actionUrl.slice(1);
  if (m.actionUrl?.startsWith('/')) return m.actionUrl;
  return m.category === 'REWARD' ? '/coins' : m.category === 'TIER' ? '/tiers' : `/inbox/${m.id}`;
};

// ───────────────────────── CN-02 · Inbox ─────────────────────────
export const Inbox: React.FC = () => {
  const navigate = useNavigate();
  const [data, failed, reload] = useLoad(() => LoyaltyApi.getInboxMessages(uid()));
  const list = Array.isArray(data) ? (data as InboxMessageItem[]) : data?.messages || [];
  const open = (m: InboxMessageItem) => {
    if (!m.isRead) void LoyaltyApi.markInboxRead(m.id).catch(() => undefined);
    navigate(target(m));
  };
  return (
    <Screen title="Notifications" back="/">
      <div className="flex items-center">
        <div className="flex-1">
          <h2 className="text-[22px] font-semibold">Inbox</h2>
          <p className="text-[13px] text-slate-500">Your notifications</p>
        </div>
        <button type="button" aria-label="Notification settings" onClick={() => navigate('/notifications')} className="flex size-11 items-center justify-center rounded-full bg-white"><Settings className="size-5 text-slate-600" /></button>
      </div>
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[200px]" />}
      {data && list.length === 0 && <Empty art={artEmptyBox} title="No notifications yet" text="Rewards, offers and reminders will show up here." />}
      {list.map((m) => {
        const k = kind(m);
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
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [data, failed, reload] = useLoad(() => LoyaltyApi.getInboxMessages(uid()), [id]);
  const list = Array.isArray(data) ? (data as InboxMessageItem[]) : data?.messages || [];
  const m = list.find((x) => String(x.id) === id);
  return (
    <Screen title="Offer details" back="/inbox">
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[300px]" />}
      {data && !m && <Empty art={artEmptyBox} title="This offer has ended" />}
      {m && (
        <>
          <div className="relative h-[200px] w-full overflow-hidden rounded-[20px]">
            <img src={partnerPhoto(m.title)} alt="" className="size-full object-cover" />
            <span className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
            <span className="absolute bottom-3 left-4 right-4 flex flex-col gap-1 text-white">
              <Pill tone="orange" className="w-fit">Just for you</Pill>
              <span className="text-[20px] font-semibold">{m.title}</span>
            </span>
          </div>
          <p className="text-[12px] text-slate-500">Sent {time(m.createdAt)}</p>
          <p className="whitespace-pre-line text-[14px] leading-6">{m.body}</p>
          <PrimaryButton onClick={() => navigate(m.actionUrl?.startsWith('/') ? m.actionUrl : '/rewards')}>See offer in Store</PrimaryButton>
          <SecondaryButton onClick={() => navigate('/inbox')}>Back to inbox</SecondaryButton>
        </>
      )}
    </Screen>
  );
};

// ───────────────────────── CN-04 · Notification settings ─────────────────────────
const Toggle: React.FC<{ on: boolean; disabled?: boolean; onChange?: (v: boolean) => void; label: string }> = ({ on, disabled, onChange, label }) => (
  <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => onChange?.(!on)} className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? 'bg-brand' : 'bg-slate-200'} disabled:opacity-60`}>
    <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-1'}`} />
  </button>
);

export const NotificationSettings: React.FC = () => {
  const [prefs, failed, reload] = useLoad(() => LoyaltyApi.getNotificationPreferences(uid()));
  const [local, setLocal] = useState<NotificationPreferencesDto>();
  const p = local || prefs;
  const save = async (patch: Partial<NotificationPreferencesDto>) => {
    if (!p) return;
    const next = { ...p, ...patch };
    setLocal(next);
    try {
      setLocal(await LoyaltyApi.updateNotificationPreferences(next));
    } catch {
      setLocal(p);
      alert('Could not save. Please try again.');
    }
  };
  const rows: { title: string; sub: string; on: boolean; disabled?: boolean; set?: (v: boolean) => void }[] = p
    ? [
        { title: 'Offers & promotions', sub: 'Deals from Natcash and partner stores', on: !p.optOutMarketing, set: (v) => save({ optOutMarketing: !v }) },
        { title: 'Mission & tier reminders', sub: 'New missions, close to the next tier', on: p.pushEnabled, set: (v) => save({ pushEnabled: v }) },
        // shortcut: the preferences API has no separate expiry flag; expiry alerts follow the always-on in-app channel
        { title: 'Coin expiry alerts', sub: 'Coins expiring within 30 days', on: true, disabled: true },
        { title: 'SMS', sub: 'Only for coin expiry when you have not opened the app', on: p.smsEnabled, set: (v) => save({ smsEnabled: v }) },
      ]
    : [];
  return (
    <Screen title="Notifications" back="/inbox">
      <div>
        <h2 className="text-[22px] font-semibold">Notifications</h2>
        <p className="text-[13px] text-slate-500">Choose what Natcash Rewards may send you.</p>
      </div>
      {failed && <ErrorBlock onRetry={reload} />}
      {!p && !failed && <Skeleton className="h-[260px]" />}
      {p && (
        <div className="w-full divide-y divide-slate-100 rounded-[20px] bg-white px-4">
          {rows.map((r) => (
            <div key={r.title} className="flex items-center gap-3 py-4">
              <div className="flex-1">
                <p className="text-[15px] font-semibold">{r.title}</p>
                <p className="text-[12px] text-slate-500">{r.sub}</p>
              </div>
              <Toggle label={r.title} on={r.on} disabled={r.disabled} onChange={r.set} />
            </div>
          ))}
        </div>
      )}
      <div className="rounded-[16px] bg-slate-100 p-4">
        <p className="text-[13px] font-semibold">Service messages are always on</p>
        <p className="text-[12px] text-slate-500">Payments, vouchers issued, security</p>
      </div>
      <p className="text-[11px] text-slate-500">Even with offers on, you get at most 1 push a day and 3 a week, only between 08:00 and 20:00.</p>
    </Screen>
  );
};
