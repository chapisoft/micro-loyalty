import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, BellOff, Bell, Save, CheckCircle2, AlertCircle, Globe } from 'lucide-react';
import { LoyaltyApi, NotificationPreferencesDto, getDefaultUserId } from '../services/api';
import { LanguageSelector } from './LanguageSelector';
import { SkeletonCard } from './common/StateBlocks';

export interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  externalUserId?: string;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  externalUserId,
}) => {
  const { t, i18n } = useTranslation();
  const userId = externalUserId || getDefaultUserId();
  const [prefs, setPrefs] = useState<NotificationPreferencesDto | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadPrefs = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    setSavedSuccess(false);
    try {
      const res = await LoyaltyApi.getNotificationPreferences(userId);
      setPrefs(res);
    } catch (err) {
      setPrefs({
        externalUserId: userId,
        optOutMarketing: false,
        pushEnabled: true,
        smsEnabled: true,
        inAppEnabled: true,
        preferredLocale: i18n.language,
      });
      setErrorMsg(err instanceof Error ? err.message : t('notifSettings.load_error'));
    } finally {
      setLoading(false);
    }
  }, [i18n.language, t, userId]);

  useEffect(() => {
    if (isOpen) {
      void loadPrefs();
    }
  }, [isOpen, loadPrefs]);

  if (!isOpen) return null;

  const handleToggle = (
    field: 'optOutMarketing' | 'pushEnabled' | 'smsEnabled' | 'inAppEnabled'
  ) => {
    if (!prefs) return;
    setSavedSuccess(false);
    setPrefs({ ...prefs, [field]: !prefs[field] });
  };

  const handleSave = async () => {
    if (!prefs || saving) return;
    setSaving(true);
    setErrorMsg(null);
    setSavedSuccess(false);
    try {
      const updated = await LoyaltyApi.updateNotificationPreferences(
        { ...prefs, preferredLocale: i18n.language },
        userId
      );
      setPrefs(updated);
      setSavedSuccess(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('notifSettings.save_error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-slate-700" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                {t('notifSettings.title')}
              </h3>
              <p className="text-[11px] text-slate-500 truncate">{t('notifSettings.subtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMsg && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t('notifSettings.saved_success')}</span>
            </div>
          )}

          {loading || !prefs ? (
            <SkeletonCard rows={5} />
          ) : (
            <>
              {/* Quick 3-language switcher (FE-UX-04) */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{t('notifSettings.quick_language')}</span>
                </div>
                <LanguageSelector
                  variant="pills"
                  onlyCodes={['ht', 'fr', 'en']}
                  onChange={(code) =>
                    setPrefs((prev) => (prev ? { ...prev, preferredLocale: code } : prev))
                  }
                />
              </div>

              {/* Opt-out Marketing Highlight */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <BellOff className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      {t('notifSettings.opt_out_label')}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {t('notifSettings.opt_out_desc')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs.optOutMarketing}
                  onClick={() => handleToggle('optOutMarketing')}
                  className={`w-11 h-6 rounded-full transition p-0.5 shrink-0 ${
                    prefs.optOutMarketing ? 'bg-amber-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                      prefs.optOutMarketing ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Channel toggles */}
              <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100">
                {(
                  [
                    {
                      field: 'pushEnabled' as const,
                      label: t('notifSettings.channel_push'),
                      desc: t('notifSettings.channel_push_desc'),
                    },
                    {
                      field: 'smsEnabled' as const,
                      label: t('notifSettings.channel_sms'),
                      desc: t('notifSettings.channel_sms_desc'),
                    },
                    {
                      field: 'inAppEnabled' as const,
                      label: t('notifSettings.channel_inapp'),
                      desc: t('notifSettings.channel_inapp_desc'),
                    },
                  ]
                ).map((item) => {
                  const enabled = prefs[item.field];
                  return (
                    <div
                      key={item.field}
                      className="p-3.5 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{item.label}</p>
                        <p className="text-[11px] text-slate-500">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        onClick={() => handleToggle(item.field)}
                        className={`w-11 h-6 rounded-full transition p-0.5 shrink-0 ${
                          enabled ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                            enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? t('common.processing') : t('notifSettings.save_button')}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsModal;
