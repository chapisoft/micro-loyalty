import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Key,
  Shield,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  Lock,
  Bolt,
  Eye,
  ArrowRight,
  Sparkles,
  BookOpen,
  HelpCircle,
  Code2,
  Terminal,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
  Wifi,
  Sliders,
  Play,
  RotateCcw,
  CheckCircle,
  XCircle
} from 'lucide-react';

// Offline HMAC-SHA256 using WebCrypto
async function computeHmacSha256(keyHex: string, message: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const keyData = new Uint8Array(keyHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyData.buffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (e) {
    return '7a9c3f0b2e8174d6a5c1e9b8f7d4a2e10c5b8a9f3e2d1c0b7a6f5e4d3c2b1a0f';
  }
}

function computeOcraOtp(hashHex: string): { otp: string; offset: number; binaryVal: number } {
  if (!hashHex || hashHex.length < 64) {
    return { otp: '48291037', offset: 12, binaryVal: 148291037 };
  }
  const bytes: number[] = [];
  for (let i = 0; i < hashHex.length; i += 2) {
    bytes.push(parseInt(hashHex.substring(i, i + 2), 16));
  }
  const offset = bytes[bytes.length - 1] & 0x0f;
  const binary =
    ((bytes[offset] & 0x7f) << 24) |
    ((bytes[offset + 1] & 0xff) << 16) |
    ((bytes[offset + 2] & 0xff) << 8) |
    (bytes[offset + 3] & 0xff);
  const otpNumber = binary % 100000000;
  return { otp: otpNumber.toString().padStart(8, '0'), offset, binaryVal: binary };
}

import { useTranslation } from '../../i18n/I18nContext';

export function SimulatorPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState<'activate' | 'pin' | 'sign'>('sign');
  const [showUserGuide, setShowUserGuide] = useState(false);

  // Step 1: Input states
  const [customerId, setCustomerId] = useState('0988123456');
  const [activationCode, setActivationCode] = useState('ACT-9821-X4K9');
  const [deviceSecret, setDeviceSecret] = useState('a9f4c3b8e21074d6f9a0c1e8b7d5a3f2');

  // Step 2: PIN state
  const [pin, setPin] = useState('123456');

  // Step 3: Transaction params (Editable in Inspector)
  const [challenge, setChallenge] = useState('CHAL-994821');
  const [amount, setAmount] = useState('5,000,000 VND');
  const [toAccount, setToAccount] = useState('0011004567890 (VCB)');

  // Output states
  const [countdown, setCountdown] = useState<number>(() => 60 - (Math.floor(Date.now() / 1000) % 60));
  const [generatedOtp, setGeneratedOtp] = useState<string>('48291037');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Inspector details
  const [inspector, setInspector] = useState({
    rawChallenge: 'CHAL-994821|5000000|0011004567890',
    hmacHash: '7a9c3f0b2e8174d6a5c1e9b8f7d4a2e10c5b8a9f3e2d1c0b7a6f5e4d3c2b1a0f',
    offset: 12,
    binary: 148291037,
    finalOtp: '48291037',
  });

  // Verify status
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'verifying' | 'success'>('idle');

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateOtp = async (
    customChallenge?: string,
    customAmount?: string,
    customToAccount?: string,
    customTimeStep?: number
  ) => {
    const c = customChallenge || challenge;
    const a = customAmount || amount;
    const t = customToAccount || toAccount;
    const timeStep = customTimeStep ?? Math.floor(Date.now() / 60000);

    const cleanAmount = a.replace(/[^0-9]/g, '');
    const cleanAccount = t.split(' ')[0];
    const rawData = `${c}|${cleanAmount}|${cleanAccount}|T=${timeStep}`;
    const hash = await computeHmacSha256(deviceSecret, rawData);
    const { otp, offset, binaryVal } = computeOcraOtp(hash);

    setGeneratedOtp(otp);
    setVerifyStatus('idle');
    setInspector({
      rawChallenge: rawData,
      hmacHash: hash,
      offset,
      binary: binaryVal,
      finalOtp: otp,
    });
  };

  // Synchronized countdown timer & 60s auto-refresh
  useEffect(() => {
    handleGenerateOtp();

    const timer = setInterval(() => {
      const now = Date.now();
      const sec = 60 - (Math.floor(now / 1000) % 60);
      setCountdown(sec);

      // When the 60-second window completes and rolls over
      if (sec === 60) {
        handleGenerateOtp();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [challenge, amount, toAccount, deviceSecret]);

  const handleRandomChallenge = () => {
    const randId = `CHAL-${Math.floor(100000 + Math.random() * 900000)}`;
    setChallenge(randId);
    handleGenerateOtp(randId, amount, toAccount);
  };

  const handleSelectAmount = (newAmount: string) => {
    setAmount(newAmount);
    handleGenerateOtp(challenge, newAmount, toAccount);
  };

  const handleVerify = () => {
    setVerifyStatus('verifying');
    setTimeout(() => {
      setVerifyStatus('success');
    }, 350);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ── 2-COLUMN MAIN LAYOUT: LEFT (2/3) & RIGHT (1/3 iPhone 16 Pro Max) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.85fr) minmax(360px, 1.15fr)',
        gap: '28px',
        alignItems: 'flex-start'
      }}>

        {/* ── LEFT COLUMN: 2/3 (HEADER, USER GUIDE & CRYPTOGRAPHIC INSPECTOR) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 1. Header Card */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            padding: '20px 24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, backgroundColor: '#FFF7ED', color: '#EA580C', border: '1px solid #FFEDD5' }}>
                    Interactive Cryptographic Inspector
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                    RFC 6287 OCRA • Offline-First
                  </span>
                </div>
                <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
                  {t.simulator.title}
                </h1>
                <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', marginBottom: 0, fontWeight: 500 }}>
                  {t.simulator.subtitle}
                </p>
              </div>

              {/* Toggle User Guide Button */}
              <button
                onClick={() => setShowUserGuide(!showUserGuide)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: showUserGuide ? '#FFF7ED' : '#F8FAFC',
                  border: showUserGuide ? '1px solid #FED7AA' : '1px solid #CBD5E1',
                  color: showUserGuide ? '#EA580C' : '#334155',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <BookOpen style={{ width: '14px', height: '14px' }} />
                <span>{showUserGuide ? t.simulator.hideGuideBtn : t.simulator.showGuideBtn}</span>
                {showUserGuide ? <ChevronUp style={{ width: '14px', height: '14px' }} /> : <ChevronDown style={{ width: '14px', height: '14px' }} />}
              </button>
            </div>
          </div>

          {/* 2. User Guide Card (Hidden by default, shown when clicked) */}
          {showUserGuide && (
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '20px 24px',
              border: '1px solid #FED7AA',
              background: 'linear-gradient(180deg, #FFFDF9 0%, #FFFFFF 100%)',
              boxShadow: '0 4px 12px rgba(255, 107, 0, 0.04)',
              animation: 'fadeIn 0.2s ease-in-out'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #FFEDD5' }}>
                <HelpCircle style={{ width: '18px', height: '18px', color: '#EA580C' }} />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  {t.simulator.guideTitle}
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                {/* Step 1 Guide */}
                <div
                  onClick={() => setStep('activate')}
                  style={{
                    backgroundColor: step === 'activate' ? '#FFF7ED' : '#FFFFFF',
                    border: step === 'activate' ? '1px solid #FF6B00' : '1px solid #E2E8F0',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#FF6B00', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                      1
                    </span>
                    <strong style={{ fontSize: '13px', color: '#0F172A' }}>{t.simulator.step1GuideTitle}</strong>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4, margin: 0 }}>
                    {t.simulator.step1GuideDesc}
                  </p>
                </div>

                {/* Step 2 Guide */}
                <div
                  onClick={() => setStep('pin')}
                  style={{
                    backgroundColor: step === 'pin' ? '#F0F9FF' : '#FFFFFF',
                    border: step === 'pin' ? '1px solid #0284C7' : '1px solid #E2E8F0',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#0284C7', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                      2
                    </span>
                    <strong style={{ fontSize: '13px', color: '#0F172A' }}>{t.simulator.step2GuideTitle}</strong>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4, margin: 0 }}>
                    {t.simulator.step2GuideDesc}
                  </p>
                </div>

                {/* Step 3 Guide */}
                <div
                  onClick={() => setStep('sign')}
                  style={{
                    backgroundColor: step === 'sign' ? '#F0FDF4' : '#FFFFFF',
                    border: step === 'sign' ? '1px solid #16A34A' : '1px solid #E2E8F0',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#16A34A', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                      3
                    </span>
                    <strong style={{ fontSize: '13px', color: '#0F172A' }}>{t.simulator.step3GuideTitle}</strong>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4, margin: 0 }}>
                    {t.simulator.step3GuideDesc}
                  </p>
                </div>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '12px', color: '#475569' }}>
                💡 <strong>Tips:</strong> {t.simulator.guideTip}
              </div>
            </div>
          )}

          {/* 3. Step Tab Navigation Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#F1F5F9',
            padding: '6px',
            borderRadius: '12px',
            border: '1px solid #E2E8F0'
          }}>
            <button
              onClick={() => setStep('activate')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: step === 'activate' ? '#FFFFFF' : 'transparent',
                color: step === 'activate' ? '#EA580C' : '#64748B',
                boxShadow: step === 'activate' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <Smartphone style={{ width: '14px', height: '14px' }} />
              <span>{t.simulator.tabActivate}</span>
            </button>

            <button
              onClick={() => setStep('pin')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: step === 'pin' ? '#FFFFFF' : 'transparent',
                color: step === 'pin' ? '#0284C7' : '#64748B',
                boxShadow: step === 'pin' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <Lock style={{ width: '14px', height: '14px' }} />
              <span>{t.simulator.tabPin}</span>
            </button>

            <button
              onClick={() => setStep('sign')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: step === 'sign' ? '#FFFFFF' : 'transparent',
                color: step === 'sign' ? '#16A34A' : '#64748B',
                boxShadow: step === 'sign' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <Eye style={{ width: '14px', height: '14px' }} />
              <span>{t.simulator.tabSign}</span>
            </button>
          </div>

          {/* 4. MAIN CONTENT PANEL: STEP 1, STEP 2 OR STEP 3 (INSPECTOR) */}

          {/* STEP 1 PANEL */}
          {step === 'activate' && (
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '24px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
                <Smartphone style={{ width: '18px', height: '18px', color: '#FF6B00' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  {t.simulator.provisionParamsTitle}
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    {t.simulator.phoneMsisdn}
                  </label>
                  <input
                    type="text"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', color: '#0F172A' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    {t.simulator.activationCodeOneTime}
                  </label>
                  <input
                    type="text"
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', fontFamily: 'monospace', color: '#EA580C', fontWeight: 700 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  {t.simulator.seedKeyEcdh}
                </label>
                <input
                  type="text"
                  readOnly
                  value={deviceSecret}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', fontSize: '12px', fontFamily: 'monospace', color: '#64748B' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  onClick={() => setStep('pin')}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#FF6B00',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{t.simulator.btnNextStep2}</span>
                  <ArrowRight style={{ width: '15px', height: '15px' }} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 PANEL */}
          {step === 'pin' && (
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '24px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
                <Lock style={{ width: '18px', height: '18px', color: '#0284C7' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  {t.simulator.pinConfigTitle}
                </h3>
              </div>

              <div style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', padding: '14px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Shield style={{ width: '16px', height: '16px', color: '#0284C7' }} />
                  <strong style={{ fontSize: '13px', color: '#0369A1' }}>{t.simulator.seedKeyPinProtectionTitle}</strong>
                </div>
                <p style={{ fontSize: '12px', color: '#0C4A6E', margin: 0, lineHeight: 1.5 }}>
                  {t.simulator.seedKeyPinProtectionDesc}
                </p>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  {t.simulator.pinLabel6Digits}
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  style={{ width: '200px', padding: '9px 14px', borderRadius: '8px', border: '1px solid #0284C7', fontSize: '18px', letterSpacing: '0.25em', fontFamily: 'monospace', color: '#0F172A', textAlign: 'center', fontWeight: 700 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  onClick={() => setStep('activate')}
                  style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#475569', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                >
                  {t.simulator.btnBackStep1}
                </button>
                <button
                  onClick={() => {
                    setStep('sign');
                    handleGenerateOtp();
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#0284C7',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{t.simulator.btnNextStep3}</span>
                  <ArrowRight style={{ width: '15px', height: '15px' }} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 PANEL: CRYPTOGRAPHIC INSPECTOR & CHALLENGE CONTROLS */}
          {step === 'sign' && (
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '24px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}>
              
              {/* Challenge Controls Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders style={{ width: '18px', height: '18px', color: '#EA580C' }} />
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    {t.simulator.challengeControlsTitle}
                  </h2>
                </div>
                <button
                  onClick={handleRandomChallenge}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#FFF7ED',
                    border: '1px solid #FED7AA',
                    color: '#EA580C',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw style={{ width: '13px', height: '13px' }} />
                  <span>{t.simulator.btnRandomChallenge}</span>
                </button>
              </div>

              {/* Challenge Input Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    {t.simulator.challengeId}
                  </label>
                  <input
                    type="text"
                    value={challenge}
                    onChange={(e) => {
                      setChallenge(e.target.value);
                      handleGenerateOtp(e.target.value, amount, toAccount);
                    }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: '#EA580C', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    {t.simulator.amount}
                  </label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      handleGenerateOtp(challenge, e.target.value, toAccount);
                    }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: 600, color: '#0F172A' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    {t.simulator.toAccount}
                  </label>
                  <input
                    type="text"
                    value={toAccount}
                    onChange={(e) => {
                      setToAccount(e.target.value);
                      handleGenerateOtp(challenge, amount, e.target.value);
                    }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', color: '#0F172A' }}
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>{t.simulator.presetAmountLabel}</span>
                {['2,000,000 VND', '5,000,000 VND', '20,000,000 VND', '100,000,000 VND'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleSelectAmount(preset)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: amount === preset ? '1px solid #EA580C' : '1px solid #E2E8F0',
                      backgroundColor: amount === preset ? '#FFF7ED' : '#F8FAFC',
                      color: amount === preset ? '#EA580C' : '#475569'
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* 4 Cryptographic Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
                {/* Step 1 */}
                <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                      {t.simulator.stepPayload}
                    </span>
                    <button
                      onClick={() => handleCopy('chal', inspector.rawChallenge)}
                      style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Copy style={{ width: '12px', height: '12px' }} />
                      <span>{copiedKey === 'chal' ? t.common.copied : t.common.copy}</span>
                    </button>
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#EA580C', fontWeight: 700, padding: '8px 12px', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #FED7AA' }}>
                    {inspector.rawChallenge}
                  </div>
                </div>

                {/* Step 2 */}
                <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Step 2: Device Secret Key (Secure Enclave)
                  </span>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#0F172A', fontWeight: 600, padding: '8px 12px', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    {deviceSecret}
                  </div>
                </div>

                {/* Step 3 */}
                <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    {t.simulator.stepHmac}
                  </span>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#0284C7', fontWeight: 600, padding: '8px 12px', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #E2E8F0', wordBreak: 'break-all' }}>
                    {inspector.hmacHash}
                  </div>
                </div>

                {/* Step 4 */}
                <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Step 4: RFC 6287 Dynamic Truncation (Offset = {inspector.offset}) & Binary Modulo 10^8
                  </span>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#7C3AED', fontWeight: 600, padding: '8px 12px', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    Binary: {inspector.binary} &rarr; Modulo 10^8 = <strong style={{ color: '#EA580C', fontSize: '13px' }}>{inspector.finalOtp}</strong>
                  </div>
                </div>
              </div>

              {/* Verify Action Card */}
              <div style={{
                padding: '16px 20px',
                borderRadius: '10px',
                backgroundColor: '#FFF7ED',
                border: '1px solid #FED7AA',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '14px',
                marginTop: '4px'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>
                    {t.simulator.verifyActionTitle}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    POST /api/v1/otp/verify &bull; Customer: {customerId} &bull; OTP: {inspector.finalOtp}
                  </div>
                </div>

                <button
                  onClick={handleVerify}
                  disabled={verifyStatus === 'verifying'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    backgroundColor: verifyStatus === 'success' ? '#16A34A' : '#FF6B00',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(255, 107, 0, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {verifyStatus === 'verifying' && <RefreshCw style={{ width: '15px', height: '15px', animation: 'spin 1s linear infinite' }} />}
                  {verifyStatus === 'success' && <CheckCircle style={{ width: '15px', height: '15px' }} />}
                  {verifyStatus === 'idle' && <Bolt style={{ width: '15px', height: '15px' }} />}
                  <span>{verifyStatus === 'success' ? t.simulator.btnVerifySuccess : verifyStatus === 'verifying' ? t.simulator.btnVerifyChecking : t.simulator.btnVerifyIdle}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* ── RIGHT COLUMN: 1/3 (IPHONE 16 PRO MAX SIMULATOR FRAME) ───────── */}
        <div style={{ display: 'flex', justifyContent: 'center', position: 'sticky', top: '24px' }}>
          
          {/* iPhone 16 Pro Max Chassis (19.5:9 Aspect Ratio) */}
          <div
            style={{
              position: 'relative',
              width: '372px',
              height: '806px',
              borderRadius: '52px',
              padding: '6px',
              background: 'linear-gradient(145deg, #44403C 0%, #292524 50%, #1C1917 100%)', // Black Titanium
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.2), 0 0 24px rgba(255, 107, 0, 0.1)',
              userSelect: 'none'
            }}
          >
            {/* Left Hardware Buttons (Action Button & Volume) */}
            <div style={{ position: 'absolute', left: '-3px', top: '115px', width: '3px', height: '24px', backgroundColor: '#3A3633', borderRadius: '3px 0 0 3px' }} />
            <div style={{ position: 'absolute', left: '-3px', top: '150px', width: '3px', height: '46px', backgroundColor: '#3A3633', borderRadius: '3px 0 0 3px' }} />
            <div style={{ position: 'absolute', left: '-3px', top: '205px', width: '3px', height: '46px', backgroundColor: '#3A3633', borderRadius: '3px 0 0 3px' }} />

            {/* Right Hardware Buttons (Power & Camera Control) */}
            <div style={{ position: 'absolute', right: '-3px', top: '160px', width: '3px', height: '64px', backgroundColor: '#3A3633', borderRadius: '0 3px 3px 0' }} />
            <div style={{ position: 'absolute', right: '-3px', top: '480px', width: '3px', height: '48px', backgroundColor: '#524E4A', borderRadius: '0 3px 3px 0' }} />

            {/* iPhone 16 Pro Max Screen (Ultra-thin 1.15mm bezels) */}
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '46px',
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: '#FFFFFF',
                background: 'linear-gradient(180deg, #090D16 0%, #0F172A 50%, #020617 100%)',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {/* iOS 18 Dynamic Island & Status Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 6px 4px 6px' }}>
                  {/* iOS Clock */}
                  <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                    9:41
                  </span>

                  {/* Dynamic Island */}
                  <div style={{
                    width: '108px',
                    height: '26px',
                    borderRadius: '16px',
                    backgroundColor: '#000000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 10px',
                    boxShadow: '0 0 2px rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#111827', border: '1px solid #1F2937' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#22C55E', opacity: 0.8 }} />
                    </div>
                  </div>

                  {/* Status Icons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FFFFFF' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700 }}>5G</span>
                    <Wifi style={{ width: '13px', height: '13px' }} />
                    <div style={{ width: '20px', height: '10px', borderRadius: '3px', border: '1px solid #FFFFFF', padding: '1px', display: 'flex', alignItems: 'center' }}>
                      <div style={{ width: '100%', height: '100%', backgroundColor: '#22C55E', borderRadius: '1px' }} />
                    </div>
                  </div>
                </div>

                {/* App Navigation Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '16px',
                  marginBottom: '16px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '8px', backgroundColor: '#FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(255, 107, 0, 0.3)' }}>
                      <Key style={{ width: '14px', height: '14px', color: '#FFFFFF' }} />
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '13px', display: 'block', lineHeight: 1.2 }}>Smart OTP</span>
                      <span style={{ fontSize: '10px', color: '#94A3B8' }}>Microtec JSC</span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    color: '#4ADE80',
                    border: '1px solid rgba(74, 222, 128, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ADE80' }} />
                    OFFLINE
                  </span>
                </div>

                {/* Step 1: Activation on Phone */}
                {step === 'activate' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', animation: 'fadeIn 0.2s ease' }}>
                    <div style={{ textAlign: 'center', margin: '6px 0 10px 0' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(255, 107, 0, 0.15)', color: '#FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto' }}>
                        <Smartphone style={{ width: '22px', height: '22px' }} />
                      </div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>{t.simulator.btnActivateDevice}</h4>
                      <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px' }}>{t.simulator.step1Desc}</p>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>{t.simulator.phoneLabel}</label>
                      <input
                        type="text"
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', fontSize: '13px', color: '#FFFFFF', outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>{t.simulator.activationCodeLabel}</label>
                      <input
                        type="text"
                        value={activationCode}
                        onChange={(e) => setActivationCode(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', fontSize: '13px', fontFamily: 'monospace', color: '#FB923C', fontWeight: 700, outline: 'none' }}
                      />
                    </div>

                    <button
                      onClick={() => {
                        setStep('pin');
                      }}
                      style={{
                        width: '100%',
                        marginTop: '10px',
                        padding: '12px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '13px',
                        color: '#FFFFFF',
                        border: 'none',
                        background: 'linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(255, 107, 0, 0.25)'
                      }}
                    >
                      <Bolt style={{ width: '16px', height: '16px' }} />
                      <span>{t.simulator.btnActivateDevice}</span>
                    </button>
                  </div>
                )}

                {/* Step 2: PIN Setup on Phone */}
                {step === 'pin' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.2s ease' }}>
                    <div style={{ textAlign: 'center', margin: '6px 0 10px 0' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(2, 132, 199, 0.15)', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto' }}>
                        <Lock style={{ width: '22px', height: '22px' }} />
                      </div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>{t.simulator.phoneEnterPinTitle}</h4>
                      <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px' }}>{t.simulator.phoneEnterPinSubtitle}</p>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#CBD5E1', display: 'block', textAlign: 'center', marginBottom: '8px' }}>{t.simulator.phone6DigitSecretPin}</label>
                      <input
                        type="password"
                        maxLength={6}
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        style={{ width: '100%', padding: '12px', textAlign: 'center', fontSize: '22px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid #FF6B00', color: '#FFFFFF', fontFamily: 'monospace', letterSpacing: '0.3em', fontWeight: 700, outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button
                        onClick={() => setStep('activate')}
                        style={{ width: '100%', padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, color: '#CBD5E1', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' }}
                      >
                        {t.simulator.phoneBack}
                      </button>
                      <button
                        onClick={() => {
                          setStep('sign');
                          handleGenerateOtp();
                        }}
                        style={{ width: '100%', padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, color: '#FFFFFF', border: 'none', background: 'linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)', cursor: 'pointer' }}
                      >
                        {t.simulator.phoneConfirmPin}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Signing & OTP Display on Phone */}
                {step === 'sign' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', animation: 'fadeIn 0.2s ease' }}>
                    {/* Transaction Context Card */}
                    <div style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontSize: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', marginBottom: '6px' }}>
                        <span>{t.simulator.phoneAmount}</span>
                        <strong style={{ color: '#FFFFFF', fontSize: '13px' }}>{amount}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', marginBottom: '6px' }}>
                        <span>{t.simulator.phoneToAccount}</span>
                        <span style={{ color: '#FFFFFF' }}>{toAccount}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                        <span>{t.simulator.phoneChallengeCode}</span>
                        <strong style={{ color: '#FB923C', fontFamily: 'monospace' }}>{challenge}</strong>
                      </div>
                    </div>

                    {/* Generated OTP Showcase */}
                    <div style={{
                      textAlign: 'center',
                      padding: '18px 14px',
                      borderRadius: '14px',
                      backgroundColor: 'rgba(255, 107, 0, 0.12)',
                      border: '1px solid rgba(255, 107, 0, 0.35)',
                      boxShadow: 'inset 0 0 16px rgba(255, 107, 0, 0.08)'
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#FDBA74', display: 'block', marginBottom: '4px', letterSpacing: '0.05em' }}>
                        {t.simulator.phoneOtpTitle}
                      </span>
                      <div style={{ fontSize: '32px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.15em', color: '#FFFFFF', marginBottom: '8px' }}>
                        {generatedOtp}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#CBD5E1', padding: '0 4px' }}>
                        <span>{t.simulator.phoneExpiresIn} <strong style={{ color: countdown <= 10 ? '#F87171' : '#FB923C', fontFamily: 'monospace' }}>{countdown}s</strong></span>
                        <button
                          onClick={() => handleCopy('otp', generatedOtp)}
                          style={{ background: 'none', border: 'none', color: '#FB923C', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                        >
                          <Copy style={{ width: '13px', height: '13px' }} />
                          <span>{copiedKey === 'otp' ? t.common.copied : t.common.copy}</span>
                        </button>
                      </div>

                      {/* Dynamic 60s Progress Bar */}
                      <div style={{ height: '3px', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden', marginTop: '10px' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${(countdown / 60) * 100}%`,
                            backgroundColor: countdown <= 10 ? '#EF4444' : '#FF6B00',
                            transition: 'width 1s linear, background-color 0.3s ease',
                          }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons on Phone */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                      <button
                        onClick={handleRandomChallenge}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#FFFFFF',
                          backgroundColor: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <RefreshCw style={{ width: '14px', height: '14px' }} />
                        <span>{t.simulator.phoneSignChallenge}</span>
                      </button>
                      <button
                        onClick={() => setStep('pin')}
                        style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, color: '#CBD5E1', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' }}
                      >
                        {t.simulator.phoneChangePin}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* iOS Home Indicator Bar */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', paddingBottom: '4px' }}>
                <div style={{ width: '120px', height: '4px', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.35)' }} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default SimulatorPage;
