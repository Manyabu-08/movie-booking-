import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function QrCodeCanvas({ value, size = 148 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      color: {
        dark: '#0A0A0D',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        if (active) setDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-xl bg-white/90 animate-pulse flex items-center justify-center text-xs text-zinc-600 font-mono"
      >
        QR
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={`Booking verification QR for ${value}`}
      width={size}
      height={size}
      className="rounded-xl bg-white p-2 shadow-sm"
    />
  );
}
