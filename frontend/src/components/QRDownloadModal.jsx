'use client';

import { useState, useEffect } from 'react';
import { Download, Smartphone, X, Copy, Check } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/Button';

export default function QRDownloadModal({ isOpen, onClose, downloadUrl }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copied]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(downloadUrl).then(() => setCopied(true));
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl brutal-border p-8 max-w-sm w-full text-center relative animate-in zoom-in-95">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Smartphone className="w-8 h-8 text-accent" />
        </div>

        <h2 className="font-archivo text-2xl uppercase tracking-tight mb-2">
          Scan untuk Download
        </h2>
        <p className="text-sm text-gray-500 font-medium mb-6">
          Buka kamera HP-mu dan scan QR code di bawah
        </p>

        {/* QR Code */}
        <div className="inline-block p-4 bg-white brutal-border rounded-2xl mb-6">
          <QRCodeCanvas
            value={downloadUrl}
            size={220}
            bgColor="#ffffff"
            fgColor="#111111"
            level="H"
            includeMargin={false}
          />
        </div>

        {/* URL fallback */}
        <div className="flex items-center gap-2 bg-gray-50 brutal-border rounded-xl p-2 mb-6">
          <input
            type="text"
            readOnly
            value={downloadUrl}
            className="flex-1 bg-transparent text-xs font-mono text-gray-600 truncate px-2 outline-none"
          />
          <button
            onClick={handleCopy}
            className="shrink-0 p-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <Button
          onClick={onClose}
          className="w-full"
          variant="secondary"
        >
          Tutup
        </Button>
      </div>
    </div>
  );
}