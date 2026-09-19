'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'react-qr-code';
import { X, RefreshCw, CheckCircle2, Smartphone, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PairDeviceModal({ isOpen, onClose, onDeviceLinked }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pairData, setPairData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLinked, setIsLinked] = useState(false);
  const [linkedDeviceName, setLinkedDeviceName] = useState('');
  const pollTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  const startPairing = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsLinked(false);
    setLinkedDeviceName('');

    try {
      const res = await fetch('/api/attenda/pair/start', {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to start pairing');
      }

      setPairData(data);
      setTimeLeft(data.expiresIn || 120);
    } catch (err) {
      console.error('Pairing start failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize pairing when modal opens
  useEffect(() => {
    if (isOpen) {
      startPairing();
    } else {
      setPairData(null);
      setTimeLeft(0);
      setIsLinked(false);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isOpen, startPairing]);

  // Countdown timer
  useEffect(() => {
    if (!pairData || timeLeft <= 0 || isLinked) return;

    countdownTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [pairData, timeLeft, isLinked]);

  // Status polling
  useEffect(() => {
    if (!pairData || timeLeft <= 0 || isLinked) return;

    const pollStatus = async () => {
      try {
        const res = await fetch(
          `/api/attenda/pair/status?code=${encodeURIComponent(pairData.code)}`
        );
        const data = await res.json();

        if (data.status === 'linked') {
          setIsLinked(true);
          setLinkedDeviceName(data.clientName || 'Android Device');
          toast.success('Device linked successfully!');
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

          if (onDeviceLinked) {
            onDeviceLinked();
          }

          // Auto-close modal after brief celebration
          setTimeout(() => {
            onClose();
          }, 1800);
        } else if (data.status === 'expired') {
          setTimeLeft(0);
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        }
      } catch (err) {
        console.error('Status check error:', err);
      }
    };

    pollTimerRef.current = setInterval(pollStatus, 2000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [pairData, timeLeft, isLinked, onDeviceLinked, onClose]);

  if (!isOpen) return null;

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Modal Dialog */}
      <div
        className="relative bg-white border border-[#e5e3d8] rounded-2xl shadow-2xl max-w-sm w-full p-6 z-10 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#7c8e88] hover:bg-[#f0f5f2] hover:text-[#1e3a34] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#1f644e]/10 text-[#1f644e] flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1e3a34]">Link Mobile Device</h3>
            <p className="text-xs text-[#7c8e88]">Scan with the Attenda Android app</p>
          </div>
        </div>

        {/* Content Body */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#1f644e]/30 border-t-[#1f644e] rounded-full animate-spin mb-3" />
            <p className="text-xs text-[#7c8e88]">Generating secure QR code...</p>
          </div>
        )}

        {error && !loading && (
          <div className="py-8 text-center">
            <AlertCircle className="w-10 h-10 text-[#c94c4c] mx-auto mb-2" />
            <p className="text-sm font-bold text-[#1e3a34] mb-1">Failed to generate code</p>
            <p className="text-xs text-[#7c8e88] mb-4">{error}</p>
            <button
              onClick={startPairing}
              className="px-4 py-2 bg-[#1f644e] text-white text-xs font-bold rounded-xl hover:bg-[#17503e] transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && isLinked && (
          <div className="py-10 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-[#1f644e]/10 text-[#1f644e] flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>
            <h4 className="text-base font-bold text-[#1e3a34] mb-1">Device Linked!</h4>
            <p className="text-xs text-[#7c8e88]">
              <strong>{linkedDeviceName}</strong> is now connected. Closing window...
            </p>
          </div>
        )}

        {!loading && !error && !isLinked && pairData && (
          <div>
            {/* QR Code Container */}
            <div className="relative bg-white border border-[#e5e3d8] rounded-2xl p-4 flex flex-col items-center justify-center mb-4 shadow-inner">
              {timeLeft > 0 ? (
                <div className="p-2 bg-white rounded-xl">
                  <QRCode
                    value={pairData.qrPayload}
                    size={180}
                    level="M"
                    fgColor="#1e3a34"
                    bgColor="#ffffff"
                  />
                </div>
              ) : (
                <div className="py-10 text-center">
                  <p className="text-xs font-bold text-[#c94c4c] mb-1">QR Code Expired</p>
                  <p className="text-[11px] text-[#7c8e88] mb-3">
                    Pairing codes expire after 2 minutes for security.
                  </p>
                  <button
                    onClick={startPairing}
                    className="px-3.5 py-1.5 bg-[#1f644e] text-white text-xs font-bold rounded-xl hover:bg-[#17503e] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Generate New QR Code
                  </button>
                </div>
              )}
            </div>

            {/* Timer & Security Status */}
            <div className="flex items-center justify-between text-xs mb-4 px-1">
              <div className="flex items-center gap-1.5 text-[#7c8e88]">
                <ShieldCheck className="w-4 h-4 text-[#1f644e]" />
                <span className="text-[11px]">Direct Bearer Auth</span>
              </div>
              {timeLeft > 0 && (
                <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-full bg-[#f0f5f2] text-[#1f644e]">
                  Expires in {formatSeconds(timeLeft)}
                </span>
              )}
            </div>

            {/* Steps */}
            <div className="bg-[#fcfbf5] border border-[#e5e3d8] rounded-xl p-3 text-xs text-[#7c8e88] space-y-1.5 mb-4">
              <p className="font-bold text-[#1e3a34] text-[11px] uppercase tracking-wider mb-1">
                How to connect:
              </p>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#1f644e] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>Open the Attenda app on your Android device</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#1f644e] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Tap <strong>Link Device</strong> or <strong>Scan QR</strong>
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#1f644e] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span>Point camera at this screen to pair instantly</span>
              </div>
            </div>

            {/* Manual Refresh action */}
            {timeLeft > 0 && (
              <div className="text-center">
                <button
                  onClick={startPairing}
                  className="text-xs text-[#7c8e88] hover:text-[#1f644e] inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh QR Code
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
