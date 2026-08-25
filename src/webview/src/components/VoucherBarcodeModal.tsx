import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Copy, Check, QrCode, Barcode, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { generateBarcode128Svg } from '../utils/barcode128';
import { soundHaptics } from '../utils/soundHaptics';

interface VoucherBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucher: {
    id: number;
    voucherCode: string;
    voucherTitle: string;
    partnerName: string;
    discountValue: number;
    discountType: string;
    expiredAt: string;
    minSpendAmount?: number;
    terms?: string;
  } | null;
}

export const VoucherBarcodeModal: React.FC<VoucherBarcodeModalProps> = ({
  isOpen,
  onClose,
  voucher,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'BARCODE' | 'QR'>('BARCODE');

  if (!isOpen || !voucher) return null;

  const handleCopyCode = () => {
    soundHaptics.playClick();
    navigator.clipboard.writeText(voucher.voucherCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const barcodeSvg = generateBarcode128Svg(voucher.voucherCode, 80);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-slate-900 overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-900 uppercase">
              {voucher.partnerName}
            </span>
          </div>
          <button
            onClick={() => {
              soundHaptics.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voucher Title & Value */}
        <div className="text-center my-2">
          <h3 className="font-black text-lg text-slate-900 leading-tight">
            {voucher.voucherTitle}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {t('voucher.modal_instruction', { defaultValue: 'Đưa mã này cho thu ngân quét khi thanh toán' })}
          </p>
        </div>

        {/* Switch Barcode / QR Tab */}
        <div className="flex items-center justify-center space-x-2 my-3">
          <button
            onClick={() => {
              soundHaptics.playClick();
              setViewMode('BARCODE');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              viewMode === 'BARCODE'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Barcode className="w-3.5 h-3.5" />
            <span>{t('voucher.view_barcode', { defaultValue: 'Mã Vạch' })}</span>
          </button>
          <button
            onClick={() => {
              soundHaptics.playClick();
              setViewMode('QR');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              viewMode === 'QR'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{t('voucher.view_qr', { defaultValue: 'Mã QR' })}</span>
          </button>
        </div>

        {/* High-Contrast Code Display Box */}
        <div className="my-4 p-4 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex flex-col items-center justify-center shadow-inner">
          {viewMode === 'BARCODE' ? (
            <div
              className="w-full flex justify-center py-2"
              dangerouslySetInnerHTML={{ __html: barcodeSvg }}
            />
          ) : (
            <div className="w-40 h-40 bg-white border border-slate-200 rounded-2xl p-2 flex items-center justify-center shadow-xs">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                  voucher.voucherCode
                )}`}
                alt="Voucher QR Code"
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Raw Code string with Copy Button */}
          <div className="mt-3 flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-xl w-full justify-between">
            <span className="font-mono font-black text-sm tracking-wider text-slate-900 select-all">
              {voucher.voucherCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="flex items-center space-x-1 text-xs font-bold text-amber-800 hover:text-amber-900 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-800 stroke-[3]" />
                  <span className="text-emerald-800">{t('common.copied', { defaultValue: 'Đã sao chép' })}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t('common.copy', { defaultValue: 'Sao chép' })}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Terms & Expiry info */}
        <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {t('voucher.valid_until', { defaultValue: 'Hạn sử dụng:' })}{' '}
              <strong className="text-slate-800">{voucher.expiredAt}</strong>
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {t('voucher.apply_at', { defaultValue: 'Áp dụng tại:' })}{' '}
              <strong className="text-slate-800">{voucher.partnerName} toàn quốc</strong>
            </span>
          </div>
          {voucher.minSpendAmount && (
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
              <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>Đơn tối thiểu: {voucher.minSpendAmount.toLocaleString()} HTG</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
