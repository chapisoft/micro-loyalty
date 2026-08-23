import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Download,
  PlaySquare,
  Server,
  ShieldCheck,
  ArrowRight,
  Code2,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from '../../i18n/I18nContext';

export function DashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadPostman = () => {
    const postmanData = {
      info: {
        name: 'Smart OTP Platform - Partner Integration Postman Collection',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: '1. Device Register',
          request: {
            method: 'POST',
            url: 'https://api.miotp.io.vn/api/v1/customer/device/register',
            header: [{ key: 'X-Partner-Code', value: 'PARTNER_DEMO_01' }],
          },
        },
        {
          name: '2. Challenge Init',
          request: {
            method: 'POST',
            url: 'https://api.miotp.io.vn/api/v1/otp/challenge/init',
            header: [{ key: 'X-Partner-Code', value: 'PARTNER_DEMO_01' }],
          },
        },
        {
          name: '3. Verify OTP',
          request: {
            method: 'POST',
            url: 'https://api.miotp.io.vn/api/v1/otp/verify',
            header: [{ key: 'X-Partner-Code', value: 'PARTNER_DEMO_01' }],
          },
        },
      ],
    };
    const blob = new Blob([JSON.stringify(postmanData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Smart_OTP_Sandbox_Postman.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hero Welcome Banner */}
      <div
        style={{
          borderRadius: '16px',
          padding: '28px 32px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #FED7AA',
          background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 100%)',
          boxShadow: '0 4px 12px rgba(255, 107, 0, 0.06)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span
                style={{
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  backgroundColor: '#FFF7ED',
                  color: '#EA580C',
                  border: '1px solid #FFEDD5',
                }}
              >
                {t.dashboard.envBadge}
              </span>
              <span
                style={{
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: '#F0FDF4',
                  color: '#16A34A',
                  border: '1px solid #DCFCE7',
                }}
              >
                RFC 6287 Standard
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
              {t.dashboard.welcomeTitle}
            </h1>
            <p style={{ fontSize: '14px', color: '#64748B', marginTop: '6px', maxWidth: '650px', lineHeight: 1.5 }}>
              {t.dashboard.welcomeDesc}
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button
              onClick={downloadPostman}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <Download style={{ width: '16px', height: '16px', color: '#64748B' }} />
              <span>{t.common.downloadPostman}</span>
            </button>
            <button
              onClick={() => navigate('/simulator')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#FFFFFF',
                border: 'none',
                background: 'linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)',
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(255, 107, 0, 0.25)',
              }}
            >
              <PlaySquare style={{ width: '16px', height: '16px' }} />
              <span>{t.common.openSimulator}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Credentials & Flow */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Credentials Card (Left) */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            padding: '24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                {t.dashboard.partnerCode} & Credentials
              </h2>
              <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                Base URL, Partner Code, Secret Key & Service Code
              </p>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#FFF7ED', color: '#EA580C', border: '1px solid #FFEDD5' }}>
              UAT v2.0
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Base URL */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Base URL Endpoint
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  readOnly
                  value="https://api.miotp.io.vn/api/v1"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    color: '#0F172A',
                  }}
                />
                <button
                  onClick={() => handleCopy('baseUrl', 'https://api.miotp.io.vn/api/v1')}
                  title={t.common.copy}
                  style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', cursor: 'pointer' }}
                >
                  {copiedKey === 'baseUrl' ? <Check style={{ width: '16px', height: '16px', color: '#16A34A' }} /> : <Copy style={{ width: '16px', height: '16px' }} />}
                </button>
              </div>
            </div>

            {/* Partner Code */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                {t.dashboard.partnerCode}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  readOnly
                  value="PARTNER_DEMO_01"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    color: '#EA580C',
                  }}
                />
                <button
                  onClick={() => handleCopy('partnerCode', 'PARTNER_DEMO_01')}
                  title={t.common.copy}
                  style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', cursor: 'pointer' }}
                >
                  {copiedKey === 'partnerCode' ? <Check style={{ width: '16px', height: '16px', color: '#16A34A' }} /> : <Copy style={{ width: '16px', height: '16px' }} />}
                </button>
              </div>
            </div>

            {/* Secret Key */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                {t.dashboard.secretKey}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  readOnly
                  type={showSecret ? 'text' : 'password'}
                  value="sec_uat_9f83b2a74c10e5d6"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    color: '#0F172A',
                  }}
                />
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  title="Toggle Visibility"
                  style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', cursor: 'pointer' }}
                >
                  {showSecret ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                </button>
                <button
                  onClick={() => handleCopy('secretKey', 'sec_uat_9f83b2a74c10e5d6')}
                  title={t.common.copy}
                  style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', cursor: 'pointer' }}
                >
                  {copiedKey === 'secretKey' ? <Check style={{ width: '16px', height: '16px', color: '#16A34A' }} /> : <Copy style={{ width: '16px', height: '16px' }} />}
                </button>
              </div>
            </div>

            {/* Service Code */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                {t.dashboard.serviceCode}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  readOnly
                  value="SOTP"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    color: '#0F172A',
                  }}
                />
                <button
                  onClick={() => handleCopy('serviceCode', 'SOTP')}
                  title={t.common.copy}
                  style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', cursor: 'pointer' }}
                >
                  {copiedKey === 'serviceCode' ? <Check style={{ width: '16px', height: '16px', color: '#16A34A' }} /> : <Copy style={{ width: '16px', height: '16px' }} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Start Flow Card (Right) */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            padding: '24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                {t.dashboard.quickStartTitle}
              </h2>
              <Sparkles style={{ width: '18px', height: '18px', color: '#FF6B00' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#FFF7ED', color: '#EA580C', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  1
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{t.navigation.provisioning}</div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{t.dashboard.quickStep1}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#FFF7ED', color: '#EA580C', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  2
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{t.navigation.mobileSdk}</div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{t.dashboard.quickStep2}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#FFF7ED', color: '#EA580C', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  3
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{t.navigation.challengeInit}</div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{t.dashboard.quickStep3}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#FFF7ED', color: '#EA580C', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  4
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{t.navigation.verifyOtp}</div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{t.dashboard.quickStep4}</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
            <button
              onClick={() => navigate('/docs/2')}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#EA580C',
                backgroundColor: '#FFF7ED',
                border: '1px solid #FFEDD5',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span>{t.common.docs}</span>
              <ArrowRight style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
