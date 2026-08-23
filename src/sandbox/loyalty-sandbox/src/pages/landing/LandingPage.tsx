import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Key, 
  Smartphone, 
  Lock, 
  Zap, 
  Award, 
  Code2, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Server, 
  ExternalLink, 
  FileCode, 
  Terminal, 
  Cpu, 
  Sparkles,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  Building2,
  DollarSign,
  WifiOff,
  Clock,
  LogIn
} from 'lucide-react';
import { useTranslation } from '../../i18n/I18nContext';
import { LanguageSelector } from '../../components/LanguageSelector';

export function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isLoggedIn = !!localStorage.getItem('smart_otp_sandbox_user');

  const handleEnterSandbox = () => {
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF', color: '#0F172A', minHeight: '100vh' }}>
      {/* ── TOP NAVIGATION NAVBAR ────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>
          {/* Logo & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(255, 107, 0, 0.25)'
            }}>
              <Shield style={{ width: '22px', height: '22px', color: '#FFFFFF' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.02em', color: '#0F172A' }}>
                  Smart OTP
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: '#FFF7ED',
                  color: '#EA580C',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid #FFEDD5'
                }}>
                  PLATFORM
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
                Nền Tảng Xác Thực Giao Dịch • Microtec
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex" style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            <a href="#features" style={{ color: '#475569', fontSize: '14px', textDecoration: 'none', fontWeight: 500 }} className="hover:text-orange-600">
              Giải Pháp
            </a>
            <a href="#architecture" style={{ color: '#475569', fontSize: '14px', textDecoration: 'none', fontWeight: 500 }} className="hover:text-orange-600">
              Quy Trình 3 Bước
            </a>
            <a href="#security" style={{ color: '#475569', fontSize: '14px', textDecoration: 'none', fontWeight: 500 }} className="hover:text-orange-600">
              Tiêu Chuẩn NHNN
            </a>
            <a href="#sandbox-portal" style={{ color: '#475569', fontSize: '14px', textDecoration: 'none', fontWeight: 500 }} className="hover:text-orange-600">
              Cổng Sandbox & Simulator
            </a>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LanguageSelector variant="light" />

            <button
              onClick={handleEnterSandbox}
              style={{
                background: 'linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '9px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 3px 10px rgba(255, 107, 0, 0.25)',
                transition: 'all 0.2s ease'
              }}
            >
              <LogIn style={{ width: '16px', height: '16px' }} />
              <span>{isLoggedIn ? 'Vào Dashboard Sandbox' : 'Đăng Nhập Sandbox'}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        padding: '72px 0 64px 0',
        background: 'linear-gradient(180deg, #FFF7ED 0%, #FFFFFF 100%)',
        borderBottom: '1px solid #E2E8F0'
      }}>
        <div className="app-container" style={{ textAlign: 'center' }}>
          {/* Badge Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #FED7AA',
            borderRadius: '24px',
            padding: '6px 18px',
            marginBottom: '24px',
            color: '#EA580C',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 2px 6px rgba(255, 107, 0, 0.08)'
          }}>
            <Sparkles style={{ width: '16px', height: '16px', color: '#FF6B00' }} />
            <span>Tiêu Chuẩn Quốc Tế OCRA RFC 6287 • Quyết Định 2345/QĐ-NHNN</span>
          </div>

          {/* Main Title */}
          <h1 style={{
            fontSize: 'clamp(32px, 4.5vw, 52px)',
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
            color: '#0F172A',
            marginBottom: '20px',
            maxWidth: '960px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Giải Pháp Xác Thực Giao Dịch Thế Hệ Mới{' '}
            <span style={{
              background: 'linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Smart OTP (Soft OTP)
            </span>
          </h1>

          {/* Description */}
          <p style={{
            fontSize: 'clamp(16px, 1.8vw, 18px)',
            color: '#475569',
            lineHeight: 1.65,
            maxWidth: '820px',
            marginLeft: 'auto',
            marginRight: 'auto',
            marginBottom: '36px',
            fontWeight: 400
          }}>
            Nền tảng xác thực đa kênh chuẩn ngân hàng, hoạt động hoàn toàn <strong style={{ color: '#0F172A', fontWeight: 600 }}>Offline-First</strong> trên ứng dụng di động. 
            Giúp tiết kiệm <strong style={{ color: '#EA580C', fontWeight: 600 }}>100% chi phí tin nhắn SMS OTP</strong>, loại bỏ triệt để rủi ro SIM Swap, Phishing và chống gian lận thay đổi thông tin chuyển tiền.
          </p>

          {/* Call to Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
            <button
              onClick={handleEnterSandbox}
              style={{
                background: 'linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '14px 32px',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 6px 20px rgba(255, 107, 0, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              <Terminal style={{ width: '18px', height: '18px' }} />
              <span>{isLoggedIn ? 'Vào Dashboard Sandbox' : 'Đăng Nhập Cổng Sandbox'}</span>
              <ArrowRight style={{ width: '18px', height: '18px' }} />
            </button>

            <a
              href="#sandbox-portal"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                color: '#334155',
                padding: '14px 28px',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 500,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
              }}
            >
              <BookOpen style={{ width: '18px', height: '18px', color: '#64748B' }} />
              <span>Tìm Hiểu Cổng Thử Nghiệm</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── 4 KEY METRICS ─────────────────────────────────────────────────── */}
      <section style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '36px 0'
      }}>
        <div className="app-container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px',
            textAlign: 'center'
          }}>
            <div style={{ padding: '12px' }}>
              <div style={{ fontSize: '36px', fontWeight: 700, color: '#FF6B00', letterSpacing: '-0.02em' }}>0 VNĐ</div>
              <div style={{ fontSize: '14px', color: '#64748B', marginTop: '4px', fontWeight: 500 }}>Chi phí viễn thông SMS OTP (Tiết kiệm 100%)</div>
            </div>
            <div style={{ padding: '12px' }}>
              <div style={{ fontSize: '36px', fontWeight: 700, color: '#0284C7', letterSpacing: '-0.02em' }}>100%</div>
              <div style={{ fontSize: '14px', color: '#64748B', marginTop: '4px', fontWeight: 500 }}>Hoạt động Offline-First trên Mobile App</div>
            </div>
            <div style={{ padding: '12px' }}>
              <div style={{ fontSize: '36px', fontWeight: 700, color: '#16A34A', letterSpacing: '-0.02em' }}>8 Ký Tự</div>
              <div style={{ fontSize: '14px', color: '#64748B', marginTop: '4px', fontWeight: 500 }}>Chuẩn hóa theo Quyết định 2345/QĐ-NHNN</div>
            </div>
            <div style={{ padding: '12px' }}>
              <div style={{ fontSize: '36px', fontWeight: 700, color: '#7C3AED', letterSpacing: '-0.02em' }}>AES-256</div>
              <div style={{ fontSize: '14px', color: '#64748B', marginTop: '4px', fontWeight: 500 }}>Mã hóa GCM bảo vệ Seed Key & PIN</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE PILLARS & FEATURES ───────────────────────────────────────── */}
      <section id="features" style={{ padding: '72px 0', backgroundColor: '#F8FAFC' }}>
        <div className="app-container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ color: '#EA580C', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
              ƯU ĐIỂM VƯỢT TRỘI
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#0F172A' }}>
              Giải Pháp Toàn Diện Cho Ngân Hàng & Ví Điện Tử
            </h2>
            <p style={{ color: '#64748B', fontSize: '15px', maxWidth: '640px', margin: '12px auto 0' }}>
              Được thiết kế tối ưu hóa cho hệ thống tài chính, ngân hàng số và cổng thanh toán theo chuẩn an toàn thông tin quốc gia.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {/* Card 1 */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '32px 24px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#FFF7ED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                border: '1px solid #FFEDD5'
              }}>
                <Zap style={{ width: '24px', height: '24px', color: '#EA580C' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0F172A', marginBottom: '10px' }}>
                Sinh Mã Offline-First 100%
              </h3>
              <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6 }}>
                Khách hàng tạo mã xác thực tức thời ngay cả khi mất sóng điện thoại, không có kết nối Wifi/4G hoặc đang đi máy bay, du lịch nước ngoài mà không phụ thuộc vào tin nhắn SMS.
              </p>
            </div>

            {/* Card 2 */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '32px 24px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#F0F9FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                border: '1px solid #E0F2FE'
              }}>
                <Lock style={{ width: '24px', height: '24px', color: '#0284C7' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0F172A', marginBottom: '10px' }}>
                Ký Số Thông Tin Giao Dịch (OCRA)
              </h3>
              <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6 }}>
                Mã OTP được sinh ra gắn chặt với chuỗi Challenge chứa <strong style={{ color: '#0F172A' }}>Số tiền và Tài khoản nhận</strong>. Kẻ gian không thể sử dụng mã OTP cho một giao dịch gian lận khác.
              </p>
            </div>

            {/* Card 3 */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '32px 24px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#F0FDF4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                border: '1px solid #DCFCE7'
              }}>
                <Cpu style={{ width: '24px', height: '24px', color: '#16A34A' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0F172A', marginBottom: '10px' }}>
                Bảo Vệ Phần Cứng Thiết Bị
              </h3>
              <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6 }}>
                Tích hợp sâu với chip bảo mật phần cứng <strong style={{ color: '#0F172A' }}>Apple Secure Enclave</strong> (iOS) và <strong style={{ color: '#0F172A' }}>Android Keystore / TEE</strong>. Khóa bí mật không thể trích xuất ra khỏi máy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3-STEP LIFECYCLE ──────────────────────────────────────────────── */}
      <section id="architecture" style={{ padding: '72px 0', backgroundColor: '#FFFFFF' }}>
        <div className="app-container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ color: '#EA580C', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
              QUY TRÌNH HOẠT ĐỘNG
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#0F172A' }}>
              Quy Trình Xác Thực 3 Bước Chuẩn Ngân Hàng
            </h2>
            <p style={{ color: '#64748B', fontSize: '15px', maxWidth: '640px', margin: '12px auto 0' }}>
              Đơn giản, tiện lợi cho khách hàng nhưng đảm bảo an toàn tuyệt đối ở tầng mật mã học.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '28px'
          }}>
            {/* Step 1 */}
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '32px 24px',
              position: 'relative'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FF6B00',
                color: '#FFFFFF',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                fontWeight: 700,
                fontSize: '14px',
                marginBottom: '16px'
              }}>
                1
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#0F172A', marginBottom: '10px' }}>
                Đăng Ký & Kích Hoạt Thiết Bị
              </h3>
              <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6 }}>
                Khách hàng kích hoạt Smart OTP trên ứng dụng. Hệ thống sinh Seed Key được mã hóa AES-256, chuyển xuống thiết bị và bảo vệ an toàn bằng mã PIN bí mật 6 số.
              </p>
            </div>

            {/* Step 2 */}
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '32px 24px',
              position: 'relative'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0284C7',
                color: '#FFFFFF',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                fontWeight: 700,
                fontSize: '14px',
                marginBottom: '16px'
              }}>
                2
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#0F172A', marginBottom: '10px' }}>
                Challenge Init
              </h3>
              <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6 }}>
                Khi thực hiện thanh toán hay chuyển tiền, cổng dịch vụ khởi tạo Challenge Code gắn liền với thông tin giao dịch để truyền cho ứng dụng Mobile.
              </p>
            </div>

            {/* Step 3 */}
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '32px 24px',
              position: 'relative'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#16A34A',
                color: '#FFFFFF',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                fontWeight: 700,
                fontSize: '14px',
                marginBottom: '16px'
              }}>
                3
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#0F172A', marginBottom: '10px' }}>
                Sign Challenge & Verify Smart OTP
              </h3>
              <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6 }}>
                Ứng dụng di động tính toán mã OTP 8 số qua thuật toán OCRA RFC 6287 và gửi lên Backend. Hệ thống Verify tính hợp lệ và hoàn tất giao dịch tức thì.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECURITY & COMPLIANCE ─────────────────────────────────────────── */}
      <section id="security" style={{ padding: '72px 0', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
        <div className="app-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '36px', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#EA580C', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                BẢO MẬT & PHÁP LÝ
              </div>
              <h2 style={{ fontSize: 'clamp(24px, 2.8vw, 34px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#0F172A', marginBottom: '18px' }}>
                Tuân Thủ 100% Quy Định Ngân Hàng Nhà Nước Việt Nam
              </h2>
              <p style={{ color: '#64748B', fontSize: '15px', lineHeight: 1.65, marginBottom: '24px' }}>
                Nền tảng Smart OTP của Microtec đáp ứng nghiêm ngặt toàn bộ các tiêu chuẩn an toàn bảo mật thông tin và phòng chống gian lận trong thanh toán trực tuyến:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <ShieldCheck style={{ width: '22px', height: '22px', color: '#16A34A', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>Quyết Định 2345/QĐ-NHNN</div>
                    <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>Bắt buộc xác thực Smart OTP loại C hoặc D cho giao dịch giá trị từ 10 triệu đồng/lần hoặc trên 20 triệu đồng/ngày.</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <ShieldCheck style={{ width: '22px', height: '22px', color: '#16A34A', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>Quyết Định 630/QĐ-NHNN</div>
                    <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>Đảm bảo an toàn bảo mật đường truyền, lưu trữ khóa bí mật trong phân vùng bảo mật phần cứng.</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <ShieldCheck style={{ width: '22px', height: '22px', color: '#16A34A', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>Cơ Chế Khóa Cứng Sau 5 Lần Nhập Sai PIN</div>
                    <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>Tự động khóa tài khoản và thu hồi thiết bị khi phát hiện dấu hiệu dò mã PIN hoặc tấn công Brute-force.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Box */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0F172A', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield style={{ width: '20px', height: '20px', color: '#FF6B00' }} />
                <span>Các Lớp Bảo Vệ Chuyên Sâu</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ backgroundColor: '#F8FAFC', padding: '14px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0284C7', marginBottom: '4px' }}>
                    1. Mã Hóa AES-256 GCM NoPadding
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748B' }}>
                    Mỗi phiên giao dịch sử dụng Vector khởi tạo (IV) ngẫu nhiên 12-byte, chống lại mọi cuộc tấn công phân tích mẫu.
                  </div>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', padding: '14px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#16A34A', marginBottom: '4px' }}>
                    2. Rate Limiting Đa Tầng (Redis Token Bucket)
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748B' }}>
                    Giới hạn tần suất gọi API ở cấp độ IP, User ID và Device ID, ngăn chặn DDoS và spam Challenge Code.
                  </div>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', padding: '14px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#7C3AED', marginBottom: '4px' }}>
                    3. Băm HMAC-SHA256 & Dynamic Truncation
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748B' }}>
                    Thuật toán trích xuất 4-byte từ 32-byte digest và chia lấy dư modulo 10^8 sinh đúng 8 chữ số độc nhất.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SANDBOX & SIMULATOR NOTICE BANNER ─────────────────────────────── */}
      <section id="sandbox-portal" style={{ padding: '72px 0', backgroundColor: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
        <div className="app-container">
          <div style={{
            background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 100%)',
            border: '1px solid #FED7AA',
            borderRadius: '20px',
            padding: '40px 32px',
            boxShadow: '0 8px 24px rgba(255, 107, 0, 0.08)'
          }}>
            <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #FFEDD5',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#EA580C',
                marginBottom: '16px'
              }}>
                <Lock style={{ width: '14px', height: '14px' }} />
                <span>KHU VỰC DÀNH RIÊNG CHO LẬP TRÌNH VIÊN ĐỐI TÁC</span>
              </div>
              <h3 style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A', marginBottom: '14px' }}>
                Cổng Thử Nghiệm Sandbox & Trình Giả Lập Live
              </h3>
              <p style={{ fontSize: '15px', color: '#64748B', lineHeight: 1.65, marginBottom: '24px' }}>
                Để bảo mật thông tin môi trường UAT và dữ liệu đối tác, các tính năng sau <strong>chỉ khả dụng sau khi đăng nhập</strong>:
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #FED7AA' }}>
                  <CheckCircle2 style={{ width: '18px', height: '18px', color: '#EA580C', flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>Bộ tài liệu đặc tả API chi tiết & Thông số Base URL, Secret Key</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #FED7AA' }}>
                  <CheckCircle2 style={{ width: '18px', height: '18px', color: '#EA580C', flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>Mã nguồn mẫu kết nối 6 ngôn ngữ (cURL, Java, Node.js, Python, Go, PHP)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #FED7AA' }}>
                  <CheckCircle2 style={{ width: '18px', height: '18px', color: '#EA580C', flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}><strong>Trình Giả Lập Smartphone Live & Bộ Soi Mật Mã RFC 6287</strong></span>
                </div>
              </div>

              <button
                onClick={handleEnterSandbox}
                style={{
                  background: 'linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '14px 36px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 14px rgba(255, 107, 0, 0.25)'
                }}
              >
                <LogIn style={{ width: '18px', height: '18px' }} />
                <span>{isLoggedIn ? 'Vào Dashboard Sandbox' : 'Đăng Nhập Vào Sandbox Ngay'}</span>
                <ArrowRight style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={{
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        padding: '48px 0 32px 0'
      }}>
        <div className="app-container">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px', borderBottom: '1px solid #334155', paddingBottom: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Shield style={{ width: '20px', height: '20px', color: '#FFFFFF' }} />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF' }}>Smart OTP Platform</div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Phát triển bởi Microtec JSC</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={handleEnterSandbox}
                style={{
                  backgroundColor: '#FF6B00',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Đăng Nhập Sandbox
              </button>
              <a
                href="https://cms.miotp.io.vn"
                target="_blank"
                rel="noreferrer"
                style={{
                  color: '#94A3B8',
                  fontSize: '13px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>CMS Admin</span>
                <ExternalLink style={{ width: '14px', height: '14px' }} />
              </a>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#64748B', textAlign: 'center' }}>
            © 2026 Microtec JSC. Bảo lưu mọi quyền. Tuân thủ Quyết định 2345/QĐ-NHNN & Quyết định 630/QĐ-NHNN.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
