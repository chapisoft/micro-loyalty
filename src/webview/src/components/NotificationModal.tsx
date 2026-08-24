import React from 'react';
import { X, Sparkles, Sprout, Dices, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'event' | 'farm' | 'dice';

export interface NotificationModalProps {
  isOpen: boolean;
  type?: NotificationType;
  title?: string;
  message: string;
  badge?: string;
  actionText?: string;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  type = 'info',
  title,
  message,
  badge,
  actionText,
  onClose,
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const getThemeConfig = () => {
    switch (type) {
      case 'dice':
        return {
          icon: <Dices className="w-8 h-8 text-pink-500 animate-bounce" />,
          bgGradient: 'from-purple-500 via-pink-500 to-indigo-600',
          badgeBg: 'bg-purple-100 text-purple-900 border-purple-200',
          defaultTitle: 'Sự Kiện Lắc Xí Ngầu',
          defaultBadge: 'SỰ KIỆN LỄ HỘI',
          btnGradient: 'from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white',
        };
      case 'farm':
        return {
          icon: <Sprout className="w-8 h-8 text-emerald-500 animate-pulse" />,
          bgGradient: 'from-emerald-500 via-teal-500 to-green-600',
          badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
          defaultTitle: 'Nông Trại Delimart',
          defaultBadge: 'MÙA VỤ NÔNG SẢN',
          btnGradient: 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white',
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="w-8 h-8 text-emerald-500" />,
          bgGradient: 'from-emerald-500 to-teal-600',
          badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
          defaultTitle: 'Thành Công',
          defaultBadge: 'THÀNH CÔNG',
          btnGradient: 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-8 h-8 text-amber-500" />,
          bgGradient: 'from-amber-500 to-yellow-500',
          badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
          defaultTitle: 'Thông Báo',
          defaultBadge: 'LƯU Ý',
          btnGradient: 'from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-8 h-8 text-rose-500" />,
          bgGradient: 'from-rose-500 to-red-600',
          badgeBg: 'bg-rose-100 text-rose-900 border-rose-200',
          defaultTitle: 'Thông Báo',
          defaultBadge: 'CHÚ Ý',
          btnGradient: 'from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white',
        };
      case 'event':
      default:
        return {
          icon: <Sparkles className="w-8 h-8 text-amber-500 animate-spin-slow" />,
          bgGradient: 'from-amber-500 via-orange-500 to-yellow-500',
          badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
          defaultTitle: 'Thông Báo Hệ Thống',
          defaultBadge: 'THÔNG BÁO',
          btnGradient: 'from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950',
        };
    }
  };

  const config = getThemeConfig();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full border border-slate-200/90 shadow-2xl relative space-y-4 text-center text-slate-900 my-auto animate-scale-up overflow-hidden">
        {/* Glow behind icon */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-gradient-to-b from-amber-200/50 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Close Top-Right Button */}
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
          aria-label={t('nav.close')}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Floating Animated Icon Box */}
        <div className="relative z-10 mx-auto w-16 h-16 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-md flex items-center justify-center">
          {config.icon}
        </div>

        {/* Badge & Title */}
        <div className="relative z-10 space-y-1">
          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${config.badgeBg}`}>
            {badge || config.defaultBadge}
          </span>
          <h3 className="text-base sm:text-lg font-black text-slate-900 pt-1">
            {title || config.defaultTitle}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto pt-1">
            {message}
          </p>
        </div>

        {/* Action Button */}
        <div className="relative z-10 pt-2">
          <button
            onClick={onClose}
            className={`w-full py-3.5 rounded-2xl font-black text-xs shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 bg-gradient-to-r ${config.btnGradient}`}
          >
            <span>{actionText || t('tiers.btn_got_it') || 'Đã Hiểu'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
