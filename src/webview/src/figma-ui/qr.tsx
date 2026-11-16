import React, { useMemo } from 'react';
import qrcode from 'qrcode-generator';

/** Scannable QR (POS cashiers scan these), rendered as an inline SVG. */
export const QrCode: React.FC<{ value: string; size?: number; className?: string }> = ({ value, size = 160, className = '' }) => {
  const svg = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(value || ' ');
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  }, [value]);
  return <div className={className} style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: svg }} />;
};
