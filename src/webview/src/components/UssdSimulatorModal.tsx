import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Smartphone, Send, RotateCcw, AlertCircle } from 'lucide-react';
import { LoyaltyApi, UssdMenuResponse, getDefaultUserId } from '../services/api';
import { SkeletonCard } from './common/StateBlocks';

export interface UssdSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  externalUserId?: string;
}

export const UssdSimulatorModal: React.FC<UssdSimulatorModalProps> = ({
  isOpen,
  onClose,
  externalUserId,
}) => {
  const { t } = useTranslation();
  const userId = externalUserId || getDefaultUserId();
  const [menu, setMenu] = useState<UssdMenuResponse | null>(null);
  const [historyInputs, setHistoryInputs] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadUssdScreen = useCallback(
    async (inputCode?: string) => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await LoyaltyApi.getUssdMenu(inputCode, userId);
        setMenu(res);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : t('ussd.load_error'));
      } finally {
        setLoading(false);
      }
    },
    [t, userId]
  );

  useEffect(() => {
    if (isOpen) {
      setHistoryInputs([]);
      setCurrentInput('');
      void loadUssdScreen(undefined);
    }
  }, [isOpen, loadUssdScreen]);

  if (!isOpen) return null;

  const handleSendInput = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (trimmed === '0' || trimmed === '00') {
      const nextHist = historyInputs.slice(0, -1);
      setHistoryInputs(nextHist);
      const prevInput = nextHist.length > 0 ? nextHist.join('*') : undefined;
      setCurrentInput('');
      void loadUssdScreen(prevInput);
      return;
    }
    const nextHist = [...historyInputs, trimmed];
    setHistoryInputs(nextHist);
    setCurrentInput('');
    void loadUssdScreen(nextHist.join('*'));
  };

  const handleResetDial = () => {
    setHistoryInputs([]);
    setCurrentInput('');
    void loadUssdScreen(undefined);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 text-slate-100 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-700 overflow-hidden">
        {/* Phone Top Bar */}
        <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="text-xs font-bold text-white">{t('ussd.title')}</h3>
              <p className="text-[10px] font-mono text-emerald-400">*202#</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleResetDial}
              title={t('ussd.redial')}
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Classic USSD Dialog Window */}
        <div className="p-4 space-y-4">
          <div className="rounded-2xl bg-slate-950 border border-slate-700 p-4 min-h-[210px] flex flex-col justify-between space-y-3">
            {loading ? (
              <SkeletonCard rows={4} />
            ) : errorMsg ? (
              <div className="text-xs text-rose-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            ) : menu ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="text-emerald-400 font-semibold border-b border-slate-800 pb-1.5">
                  {menu.title}
                </div>
                <pre className="whitespace-pre-wrap text-slate-200 leading-relaxed font-mono text-xs">
                  {menu.screenText}
                </pre>
                {menu.options && menu.options.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {menu.options.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleSendInput(opt.key)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-100 flex items-center gap-2 transition"
                      >
                        <span className="text-emerald-400 font-bold">{opt.key}.</span>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendInput(currentInput);
              }}
              className="pt-2 border-t border-slate-800 space-y-2"
            >
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder={t('ussd.input_placeholder')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  {t('ussd.cancel')}
                </button>
                <button
                  type="submit"
                  className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t('ussd.send')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UssdSimulatorModal;
