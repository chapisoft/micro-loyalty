import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Users, Copy, Check, Share2, ShieldCheck, Clock, Gift } from 'lucide-react';
import { LoyaltyApi, MyReferralsResponse, getDefaultUserId } from '../services/api';
import { LoyaltyJSBridge } from '../bridge/LoyaltyJSBridge';
import { generateQrCodeSvgDataUri } from '../utils/qrCodeSvg';
import { SkeletonCard, EmptyState } from './common/StateBlocks';
import { soundHaptics } from '../utils/soundHaptics';

interface InviteFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  externalUserId?: string;
}

export const InviteFriendsModal: React.FC<InviteFriendsModalProps> = ({
  isOpen,
  onClose,
  externalUserId,
}) => {
  const { t } = useTranslation();
  const userId = externalUserId || getDefaultUserId();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MyReferralsResponse | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const loadReferrals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await LoyaltyApi.getMyReferrals(userId);
      setData(res);
    } catch {
      setData(null);
      setError(t('referrals.load_error'));
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  useEffect(() => {
    if (isOpen) {
      loadReferrals();
    }
  }, [isOpen, loadReferrals]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (!data?.referralLink) return;
    soundHaptics.playClick();
    navigator.clipboard.writeText(data.referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = () => {
    if (!data?.referralLink) return;
    soundHaptics.playClick();
    LoyaltyJSBridge.shareSocial({
      title: t('referrals.share_title'),
      content: t('referrals.share_content', { code: data.referralCode, link: data.referralLink }),
      url: data.referralLink,
    });
  };

  const qrSvgUri = data?.referralLink ? generateQrCodeSvgDataUri(data.referralLink, 160) : '';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full border border-slate-200 shadow-2xl relative space-y-4 text-slate-900 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                NV-06
              </span>
              <h2 className="font-black text-base sm:text-lg text-slate-900 leading-tight mt-0.5">
                {t('referrals.title')}
              </h2>
              <p className="text-[11px] text-slate-500">{t('referrals.subtitle')}</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundHaptics.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition shrink-0"
            aria-label={t('nav.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {loading ? (
            <>
              <SkeletonCard rows={3} />
              <SkeletonCard rows={2} />
            </>
          ) : error || !data ? (
            <EmptyState
              icon={<Users className="w-6 h-6" />}
              title={t('referrals.empty_title')}
              description={error || t('referrals.empty_desc')}
              actionLabel={t('fifo.btn_refresh')}
              onAction={loadReferrals}
            />
          ) : (
            <>
              {/* QR + Code + Copy/Share Card */}
              <div className="bg-gradient-to-br from-indigo-50 via-white to-amber-50/70 rounded-2xl p-4 border border-indigo-200/80 space-y-3 text-center">
                <div className="inline-flex flex-col items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                  <img src={qrSvgUri} alt={data.referralCode} className="w-36 h-36 object-contain" />
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    {t('referrals.your_code_label')}
                  </span>
                  <span className="font-mono font-black text-lg tracking-wider text-indigo-900">
                    {data.referralCode}
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2 text-xs">
                  <span className="font-mono text-[11px] text-slate-600 truncate flex-1 text-left">
                    {data.referralLink}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center gap-1 shrink-0 transition"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? t('common.copied') : t('common.copy')}</span>
                  </button>
                </div>

                <button
                  onClick={handleShare}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{t('referrals.btn_share_now')}</span>
                </button>
              </div>

              {/* KPI Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5">
                  <span className="text-[10px] text-slate-500 block">{t('referrals.stat_invited')}</span>
                  <span className="font-mono font-black text-base text-slate-900">{data.totalInvited}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-2.5">
                  <span className="text-[10px] text-emerald-700 block">{t('referrals.stat_ekyc')}</span>
                  <span className="font-mono font-black text-base text-emerald-800">{data.totalEkycVerified}</span>
                </div>
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-2.5">
                  <span className="text-[10px] text-amber-800 block">{t('referrals.stat_earned')}</span>
                  <span className="font-mono font-black text-base text-amber-900">
                    +{data.totalRewardPoints.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Referred Friends List */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-amber-600" />
                  <span>{t('referrals.friends_list_title')}</span>
                </h3>

                {data.referrals.length === 0 ? (
                  <EmptyState
                    icon={<Users className="w-5 h-5" />}
                    title={t('referrals.no_friends_title')}
                    description={t('referrals.no_friends_desc', { reward: data.rewardPerReferral })}
                  />
                ) : (
                  <div className="space-y-2">
                    {data.referrals.map((friend) => {
                      const isVerified = friend.ekycStatus === 'VERIFIED_EKYC' || friend.ekycStatus === 'REWARDED';
                      return (
                        <div
                          key={friend.id}
                          className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {friend.fullName || friend.maskedPhone}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {friend.maskedPhone} • {new Date(friend.invitedAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="text-right shrink-0 space-y-1">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isVerified
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isVerified ? <ShieldCheck className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              <span>
                                {isVerified ? t('referrals.status_ekyc_verified') : t('referrals.status_pending_ekyc')}
                              </span>
                            </span>
                            {friend.rewardPoints > 0 && (
                              <span className="block font-mono font-black text-[11px] text-amber-700">
                                +{friend.rewardPoints.toLocaleString()} {t('nav.points_unit')}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 shrink-0">
          <button
            onClick={() => {
              soundHaptics.playClick();
              onClose();
            }}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs active:scale-95 transition"
          >
            {t('tiers.btn_got_it')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteFriendsModal;
