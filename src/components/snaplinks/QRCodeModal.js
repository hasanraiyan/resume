'use client';

import { useState, useRef } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/custom-ui/Dialog';
import { Button } from '@/components/custom-ui';
import { Download, Share2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function QRCodeModal({ isOpen, onClose, link }) {
  const [color, setColor] = useState('#000000');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef(null);
  const svgRef = useRef(null);

  if (!link) return null;

  const fullUrl = `${window.location.origin}/r/${link.slug}`;
  const brandGreen = '#1f644e';

  const downloadPNG = () => {
    const canvas = document.getElementById('qr-canvas');
    if (!canvas) return;

    const pngUrl = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream');

    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `qr-${link.slug}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    toast.success('QR Code downloaded as PNG');
  };

  const downloadSVG = () => {
    const svg = document.getElementById('qr-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `qr-${link.slug}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    toast.success('QR Code downloaded as SVG');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied to clipboard');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#1e3a34] font-['Playfair_Display']">
            QR Code for {link.title || link.slug}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center space-y-6 py-6">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-neutral-100">
            {/* Hidden SVG for download */}
            <div className="hidden">
              <QRCodeSVG
                id="qr-svg"
                value={fullUrl}
                size={512}
                fgColor={color}
                includeMargin={true}
              />
            </div>

            <QRCodeCanvas
              id="qr-canvas"
              value={fullUrl}
              size={256}
              fgColor={color}
              level="H"
              includeMargin={true}
              className="rounded-lg"
            />
          </div>

          <div className="w-full space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#fcfbf5] rounded-xl border border-[#1f644e]/10">
              <span className="text-sm font-mono text-[#1f644e] truncate max-w-[200px]">
                {fullUrl}
              </span>
              <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 w-8 p-0 hover:bg-[#1f644e]/10">
                {copied ? <Check className="w-4 h-4 text-[#1f644e]" /> : <Copy className="w-4 h-4 text-[#7c8e88]" />}
              </Button>
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Custom Color
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setColor('#000000')}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    color === '#000000' ? 'border-[#1f644e] scale-110 shadow-md' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: '#000000' }}
                  title="Black"
                />
                <button
                  onClick={() => setColor(brandGreen)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    color === brandGreen ? 'border-[#1f644e] scale-110 shadow-md' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: brandGreen }}
                  title="Brand Green"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-row gap-2 sm:justify-between">
          <Button
            variant="outline"
            className="flex-1 gap-2 text-sm border-neutral-200 hover:bg-neutral-50"
            onClick={downloadSVG}
          >
            <Download className="w-4 h-4" /> SVG
          </Button>
          <Button
            variant="brand"
            className="flex-1 gap-2 text-sm bg-[#1f644e] hover:bg-[#164a39]"
            onClick={downloadPNG}
          >
            <Download className="w-4 h-4" /> PNG
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
