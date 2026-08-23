import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import { SUPPORTED_LANGUAGES, LanguageCode } from '../i18n/types';

interface LanguageSelectorProps {
  variant?: 'light' | 'dark' | 'transparent';
  compact?: boolean;
}

export function LanguageSelector({ variant = 'light', compact = false }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDark = variant === 'dark';

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block', zIndex: 60 }}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: compact ? '6px 10px' : '6px 12px',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          border: isOpen
            ? '1px solid #FF8A3D'
            : isDark
            ? '1px solid rgba(255, 255, 255, 0.16)'
            : '1px solid #E2E8F0',
          backgroundColor: isOpen
            ? isDark
              ? 'rgba(255, 255, 255, 0.12)'
              : '#FFF7ED'
            : isDark
            ? 'rgba(255, 255, 255, 0.06)'
            : '#FFFFFF',
          color: isDark ? '#FFFFFF' : '#1E293B',
          boxShadow: isOpen
            ? '0 0 0 3px rgba(255, 107, 0, 0.15)'
            : isDark
            ? 'none'
            : '0 1px 3px rgba(0, 0, 0, 0.04)',
          backdropFilter: 'blur(8px)',
        }}
        title="Select Language"
      >
        <span style={{ fontSize: '16px', lineHeight: 1, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }}>
          {currentLang.flag}
        </span>
        {!compact && (
          <span style={{ fontWeight: 550, letterSpacing: '-0.01em' }}>
            {currentLang.nativeLabel}
          </span>
        )}
        <ChevronDown
          style={{
            width: '13px',
            height: '13px',
            color: isOpen ? '#EA580C' : isDark ? '#94A3B8' : '#64748B',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease, color 0.2s ease',
          }}
        />
      </button>

      {/* Floating Dropdown Card */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '230px',
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '14px',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(226, 232, 240, 0.9)',
            boxShadow: isDark
              ? '0 20px 30px -6px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)'
              : '0 20px 30px -6px rgba(15, 23, 42, 0.12), 0 8px 12px -4px rgba(15, 23, 42, 0.04)',
            padding: '6px',
            zIndex: 100,
            animation: 'dropdownFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
            transformOrigin: 'top right',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 10px 6px 10px',
              fontSize: '11px',
              fontWeight: 600,
              color: isDark ? '#64748B' : '#94A3B8',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #F1F5F9',
              marginBottom: '4px',
            }}
          >
            <Globe style={{ width: '12px', height: '12px', color: '#FF6B00' }} />
            <span>{t.common.selectLanguage}</span>
          </div>

          {/* Language Options List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code as LanguageCode);
                    setIsOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    border: isSelected
                      ? isDark
                        ? '1px solid rgba(255, 107, 0, 0.35)'
                        : '1px solid #FED7AA'
                      : '1px solid transparent',
                    backgroundColor: isSelected
                      ? isDark
                        ? 'rgba(255, 107, 0, 0.15)'
                        : '#FFF7ED'
                      : 'transparent',
                    color: isSelected
                      ? '#EA580C'
                      : isDark
                      ? '#E2E8F0'
                      : '#334155',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = isDark
                        ? 'rgba(255, 255, 255, 0.06)'
                        : '#F8FAFC';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        fontSize: '18px',
                        lineHeight: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
                      }}
                    >
                      {lang.flag}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: isSelected ? 600 : 500,
                          lineHeight: 1.3,
                          color: isSelected
                            ? '#EA580C'
                            : isDark
                            ? '#F8FAFC'
                            : '#0F172A',
                        }}
                      >
                        {lang.nativeLabel}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          color: isSelected
                            ? '#F97316'
                            : isDark
                            ? '#64748B'
                            : '#94A3B8',
                          lineHeight: 1.2,
                        }}
                      >
                        {lang.label}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: '#FF6B00',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        boxShadow: '0 2px 4px rgba(255, 107, 0, 0.3)',
                      }}
                    >
                      <Check style={{ width: '11px', height: '11px', strokeWidth: 3 }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
