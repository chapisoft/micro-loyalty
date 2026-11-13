import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, FileText, ShieldCheck, Coins, Award, Clock, CheckCircle2 } from 'lucide-react';
import { soundHaptics } from '../utils/soundHaptics';

interface ProgramTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProgramTermsModal: React.FC<ProgramTermsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const sections = [
    {
      icon: <Coins className="w-4 h-4 text-amber-600 shrink-0" />,
      title: t('terms.sec1_title'),
      desc: t('terms.sec1_desc'),
    },
    {
      icon: <Award className="w-4 h-4 text-indigo-600 shrink-0" />,
      title: t('terms.sec2_title'),
      desc: t('terms.sec2_desc'),
    },
    {
      icon: <Clock className="w-4 h-4 text-emerald-600 shrink-0" />,
      title: t('terms.sec3_title'),
      desc: t('terms.sec3_desc'),
    },
    {
      icon: <ShieldCheck className="w-4 h-4 text-slate-700 shrink-0" />,
      title: t('terms.sec4_title'),
      desc: t('terms.sec4_desc'),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full border border-slate-200 shadow-2xl relative space-y-4 text-slate-900 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                HV-01
              </span>
              <h2 className="font-black text-base sm:text-lg text-slate-900 leading-tight mt-0.5">
                {t('terms.title')}
              </h2>
              <p className="text-[11px] text-slate-500">{t('terms.subtitle')}</p>
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

        {/* Scrollable Terms Body */}
        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
          {sections.map((sec, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5"
            >
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-900">
                {sec.icon}
                <span>{sec.title}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{sec.desc}</p>
            </div>
          ))}

          {/* Tier Thresholds Summary Table */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
            <h4 className="font-bold text-xs text-amber-950">{t('terms.table_title')}</h4>
            <div className="grid grid-cols-3 gap-2 text-[11px] font-bold text-slate-500 pb-1 border-b border-amber-200/60">
              <span>{t('terms.col_tier')}</span>
              <span>{t('terms.col_upgrade')}</span>
              <span>{t('terms.col_keep')}</span>
            </div>
            {[
              { name: t('tiers.tier_silver'), upgrade: '0 – 999', keep: '0' },
              { name: t('tiers.tier_gold'), upgrade: '1.000 – 4.999', keep: '800' },
              { name: t('tiers.tier_platinum'), upgrade: '5.000 – 14.999', keep: '4.000' },
              { name: t('tiers.tier_diamond'), upgrade: '15.000+', keep: '12.000' },
            ].map((row) => (
              <div key={row.name} className="grid grid-cols-3 gap-2 text-xs text-slate-800 items-center">
                <span className="font-bold">{row.name}</span>
                <span className="font-mono text-amber-800">{row.upgrade}</span>
                <span className="font-mono text-emerald-700">{row.keep}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 shrink-0">
          <button
            onClick={() => {
              soundHaptics.playClick();
              onClose();
            }}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs active:scale-95 transition flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{t('terms.btn_agree')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgramTermsModal;
