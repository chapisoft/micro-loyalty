import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES, changeLanguage } from '../language';

export interface LanguageSelectorProps {
  variant?: 'dropdown' | 'pills';
  onlyCodes?: string[];
  onChange?: (code: string) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  onlyCodes,
  onChange,
}) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const visibleLanguages = onlyCodes && onlyCodes.length > 0
    ? SUPPORTED_LANGUAGES.filter((l) => onlyCodes.includes(l.code))
    : SUPPORTED_LANGUAGES;

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    changeLanguage(code);
    onChange?.(code);
    setIsOpen(false);
  };

  if (variant === 'pills') {
    return (
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t('common.change_language')}>
        <Globe className="w-3.5 h-3.5 text-slate-400 mr-0.5 shrink-0" />
        {visibleLanguages.map((lang) => {
          const active = i18n.language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelect(lang.code)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition active:scale-95 ${
                active
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition border border-slate-200 active:scale-95 shadow-xs"
        title={t('common.change_language')}
      >
        <span className="text-sm">{currentLang.flag}</span>
        <span className="hidden sm:inline font-mono">{currentLang.short}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-40 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-scale-up">
          {visibleLanguages.map((lang) => (
            <button
              type="button"
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between transition ${
                i18n.language === lang.code
                  ? 'bg-amber-50 text-amber-900 font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-base">{lang.flag}</span>
                <span>{lang.label}</span>
              </div>
              {i18n.language === lang.code && <Check className="w-3.5 h-3.5 text-amber-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
