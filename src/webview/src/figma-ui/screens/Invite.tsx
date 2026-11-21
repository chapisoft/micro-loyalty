import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Copy, MessageSquare, Share2, Check } from 'lucide-react';
import { LoyaltyApi, getDefaultUserId, type ReferralFriendItem } from '../../services/api';
import { LoyaltyJSBridge } from '../../bridge/LoyaltyJSBridge';
import { Screen, Skeleton, ErrorBlock, Pill, PrimaryButton, SecondaryButton, ResultBlock, InfoRows, Empty, useLoad, fmt } from '../ui';
import { QrCode } from '../qr';
import { artGift } from '../art';

interface Referral {
  code: string;
  link: string;
  rewardPer: number;
  totalReward: number;
  friends: ReferralFriendItem[];
}

// The live API returns {items, ekycVerifiedCount}; the typed client declares {referrals, totalEkycVerified}.
const loadReferral = async (): Promise<Referral> => {
  const r = (await LoyaltyApi.getMyReferrals(getDefaultUserId())) as unknown as Record<string, unknown>;
  const code = String(r.referralCode || '');
  return {
    code,
    link: String(r.referralLink || `${window.location.origin}${window.location.pathname}#/invited?ref=${encodeURIComponent(code)}`),
    rewardPer: Number(r.rewardPerReferral) || 0,
    totalReward: Number(r.totalRewardPoints) || 0,
    friends: ((r.referrals || r.items || []) as ReferralFriendItem[]) ?? [],
  };
};

const friendStep = (f: ReferralFriendItem, t: (k: string) => string) => {
  if (f.firstTxCompleted || f.ekycStatus === 'REWARDED') return { text: t('figma_ui.invite.step_all_done'), done: true };
  if (f.ekycStatus === 'VERIFIED_EKYC') return { text: t('figma_ui.invite.step_ekyc_done'), done: false };
  return { text: t('figma_ui.invite.step_opened'), done: false };
};

// ───────────────────────── NV-06 · Invite friends ─────────────────────────
export const InviteFriends: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const userId = getDefaultUserId();
  const [data, failed, reload] = useLoad(async (): Promise<Referral | null> => {
    if (!userId) return null;
    return loadReferral();
  });
  const [copied, setCopied] = React.useState(false);
  const thisMonth = (data?.friends || []).filter((f) => {
    const d = new Date(f.invitedAt);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  });
  const rewarded = thisMonth.filter((f) => friendStep(f, t).done).length;

  const share = (content?: string) => {
    if (!data) return;
    const payload = {
      title: t('figma_ui.invite.share_title'),
      content: content || t('figma_ui.invite.share_content', { code: data.code }),
      url: data.link,
    };
    if (window.ReactNativeWebView) LoyaltyJSBridge.shareSocial(payload);
    else if (navigator.share) void navigator.share({ title: payload.title, text: payload.content, url: payload.url }).catch(() => undefined);
    else void navigator.clipboard?.writeText(`${payload.content} ${payload.url}`);
  };

  return (
    <Screen title={t('figma_ui.invite.title')} back="/missions">
      <div>
        <h2 className="text-[22px] font-semibold leading-8">{t('figma_ui.invite.title')}</h2>
        <p className="mt-1 text-[13px] text-slate-500">
          {data?.rewardPer ? t('figma_ui.invite.subtitle_reward', { coins: fmt(data.rewardPer) }) : t('figma_ui.invite.subtitle_default')}
          {t('figma_ui.invite.subtitle_suffix')}
        </p>
      </div>
      {!userId ? (
        <Empty art={artGift} title={t('sso.guest_login_required')} text={t('sso.guest_login_required_desc')} />
      ) : (
        <>
          {failed && <ErrorBlock onRetry={reload} />}
          {!data && !failed && <Skeleton className="h-[220px]" />}
        </>
      )}
      {userId && data && (
        <>
          <div className="flex w-full flex-col gap-3 rounded-[20px] bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-[11px] text-slate-500">{t('figma_ui.invite.your_code')}</span>
                <span className="break-all text-[24px] font-semibold text-brand">{data.code}</span>
                <div className="mt-2 flex gap-2">
                  <SecondaryButton
                    className="h-11"
                    onClick={() => {
                      void navigator.clipboard?.writeText(data.code);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                  >
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? t('figma_ui.invite.copied') : t('figma_ui.invite.copy')}
                  </SecondaryButton>
                  <SecondaryButton className="h-11" onClick={() => (window.location.href = `sms:?body=${encodeURIComponent(`${data.code} ${data.link}`)}`)}>
                    <MessageSquare className="size-4" /> {t('figma_ui.invite.sms')}
                  </SecondaryButton>
                </div>
              </div>
              <QrCode value={data.link} size={100} />
            </div>
            <PrimaryButton onClick={() => share()}><Share2 className="size-4" /> {t('figma_ui.invite.share_link')}</PrimaryButton>
          </div>

          <div className="flex w-full flex-col gap-2 rounded-[20px] bg-brand-soft p-4">
            <span className="text-[11px] font-semibold text-[#B35400]">{t('figma_ui.invite.this_month_rewarded', { count: rewarded })}</span>
            <span className="text-[15px] font-semibold">
              {t('figma_ui.invite.month_summary', { joined: thisMonth.length, completed: rewarded, coins: fmt(data.totalReward) })}
            </span>
          </div>

          <div className="flex w-full flex-col gap-3 rounded-[20px] bg-white p-4">
            <span className="text-[14px] font-semibold">{t('figma_ui.invite.how_counts')}</span>
            <div className="grid grid-cols-3 gap-2">
              {[t('figma_ui.invite.step_1'), t('figma_ui.invite.step_2'), t('figma_ui.invite.step_3')].map((s, i) => (
                <div key={s} className="flex flex-col gap-1">
                  <span className="flex size-[22px] items-center justify-center rounded-full bg-brand/10 text-[12px] font-semibold text-brand">{i + 1}</span>
                  <span className="text-[12px] text-slate-500">{s}</span>
                </div>
              ))}
            </div>
          </div>

          <h3 className="text-[16px] font-semibold">{t('figma_ui.invite.your_friends')}</h3>
          {data.friends.length === 0 && <Empty art={artGift} title={t('figma_ui.invite.empty_title')} text={t('figma_ui.invite.empty_sub')} />}
          {data.friends.map((f) => {
            const st = friendStep(f, t);
            const name = f.fullName || f.maskedPhone;
            return (
              <div key={f.id} className="flex w-full items-center gap-3 rounded-[16px] bg-white p-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-brand-soft text-[15px] font-semibold text-brand">{name?.[0] || '?'}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[14px] font-semibold">{name}</span>
                  <span className="text-[11px] text-slate-500">{st.text}</span>
                </span>
                {st.done ? (
                  <Pill tone="green">{t('figma_ui.invite.coins_pill', { coins: fmt(f.rewardPoints || data.rewardPer) })}</Pill>
                ) : (
                  <button type="button" onClick={() => share(t('figma_ui.invite.remind_message', { code: data.code }))} className="rounded-full border border-brand px-3 py-1 text-[11px] font-semibold text-brand">
                    {t('figma_ui.invite.remind_btn')}
                  </button>
                )}
              </div>
            );
          })}
          <p className="text-[11px] text-slate-500">{t('figma_ui.invite.disclaimer')}</p>
          <button type="button" onClick={() => navigate(`/invited?ref=${encodeURIComponent(data.code)}`)} className="text-left text-[12px] font-semibold text-brand">
            {t('figma_ui.invite.preview_cta')}
          </button>
        </>
      )}
    </Screen>
  );
};

// ───────────────────────── NV-07 · Invited friend · welcome ─────────────────────────
export const InvitedWelcome: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const ref = params.get('ref') || '';
  const userId = getDefaultUserId();
  const [profile] = useLoad(() => (userId ? LoyaltyApi.getProfile(userId).catch(() => null) : Promise.resolve(null)));
  return (
    <Screen title={t('figma_ui.invite.welcome_title')} back="/">
      <ResultBlock
        art={artGift}
        title={ref ? t('figma_ui.invite.welcome_invited') : t('figma_ui.invite.welcome_default')}
        value={t('figma_ui.invite.welcome_bonus')}
        valueTone="green"
        sub={t('figma_ui.invite.welcome_sub')}
      />
      <InfoRows
        rows={[
          [t('figma_ui.invite.row_invited_by'), ref || '—'],
          [t('figma_ui.invite.row_wallet'), profile ? t('figma_ui.invite.wallet_opened') : '—'],
          [t('figma_ui.invite.row_ekyc_payment'), profile && profile.currentPoints > 0 ? t('figma_ui.invite.status_done') : t('figma_ui.invite.status_todo')],
        ]}
      />
      <PrimaryButton onClick={() => LoyaltyJSBridge.closeWebview()}>{t('figma_ui.invite.complete_ekyc_btn')}</PrimaryButton>
      <SecondaryButton onClick={() => navigate('/')}>{t('figma_ui.invite.explore_rewards_btn')}</SecondaryButton>
    </Screen>
  );
};
