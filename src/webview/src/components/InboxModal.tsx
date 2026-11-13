import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Inbox, CheckCheck, Sparkles, Settings, RefreshCw } from 'lucide-react';
import { LoyaltyApi, InboxMessageItem, getDefaultUserId } from '../services/api';
import { SkeletonCard, EmptyState } from './common/StateBlocks';

export interface InboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  externalUserId?: string;
  onOpenSettings?: () => void;
  onUnreadChange?: (unreadCount: number) => void;
}

const CATEGORIES = ['ALL', 'REWARD', 'MISSION', 'TIER', 'PROMO'] as const;

export const InboxModal: React.FC<InboxModalProps> = ({
  isOpen,
  onClose,
  externalUserId,
  onOpenSettings,
  onUnreadChange,
}) => {
  const { t } = useTranslation();
  const userId = externalUserId || getDefaultUserId();
  const [messages, setMessages] = useState<InboxMessageItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [category, setCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadInbox = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const cat = category === 'ALL' ? undefined : category;
      const res = await LoyaltyApi.getInboxMessages(userId, cat);
      setMessages(res.messages);
      setUnreadCount(res.unreadCount);
      onUnreadChange?.(res.unreadCount);
    } catch (err) {
      setMessages([]);
      setErrorMsg(err instanceof Error ? err.message : t('inbox.load_error'));
    } finally {
      setLoading(false);
    }
  }, [category, onUnreadChange, t, userId]);

  useEffect(() => {
    if (isOpen) {
      void loadInbox();
    }
  }, [isOpen, loadInbox]);

  if (!isOpen) return null;

  const handleMarkRead = async (msg: InboxMessageItem) => {
    if (msg.isRead) return;
    try {
      await LoyaltyApi.markInboxRead(msg.id, userId);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m))
      );
      const nextUnread = Math.max(0, unreadCount - 1);
      setUnreadCount(nextUnread);
      onUnreadChange?.(nextUnread);
    } catch {
      // Keep unread state on failure
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
              <Inbox className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 truncate">{t('inbox.title')}</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate">{t('inbox.subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                title={t('inbox.open_settings')}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap border transition ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t(`inbox.cat_${cat.toLowerCase()}`)}
              </button>
            );
          })}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {errorMsg && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center justify-between gap-2">
              <span>{errorMsg}</span>
              <button
                type="button"
                onClick={() => void loadInbox()}
                className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 font-semibold inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>{t('common.retry')}</span>
              </button>
            </div>
          )}

          {loading ? (
            <>
              <SkeletonCard rows={3} />
              <SkeletonCard rows={3} />
            </>
          ) : messages.length === 0 ? (
            <EmptyState
              icon={<Inbox className="w-6 h-6 text-slate-400" />}
              title={t('inbox.empty_title')}
              description={t('inbox.empty_desc')}
            />
          ) : (
            messages.map((msg) => (
              <button
                key={msg.id}
                type="button"
                onClick={() => void handleMarkRead(msg)}
                className={`w-full text-left rounded-2xl border p-3.5 transition space-y-1.5 ${
                  msg.isRead
                    ? 'bg-white border-slate-200'
                    : 'bg-indigo-50/70 border-indigo-200 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {!msg.isRead ? (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                    ) : (
                      <CheckCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <h4 className="text-xs font-semibold text-slate-900 truncate">{msg.title}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] shrink-0">
                    {msg.category}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{msg.body}</p>

                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                  <span>{new Date(msg.createdAt).toLocaleString()}</span>
                  {msg.actionUrl && (
                    <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold">
                      <Sparkles className="w-3 h-3" />
                      {msg.actionUrl}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default InboxModal;
