'use client';

import { useState, useEffect, useCallback } from 'react';
import { Smartphone, Plus, Trash2, ShieldCheck, RefreshCw, Clock } from 'lucide-react';
import { toast } from 'sonner';
import PairDeviceModal from '@/components/attenda/PairDeviceModal';
import ConfirmDialog from '@/components/attenda/ConfirmDialog';

export default function LinkedDevicesCard() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPairModal, setShowPairModal] = useState(false);
  const [deviceToRevoke, setDeviceToRevoke] = useState(null);
  const [revoking, setRevoking] = useState(false);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/connected-apps');
      if (!res.ok) throw new Error('Failed to fetch devices');
      const data = await res.json();
      // Filter for Attenda devices
      const attendaDevices = (Array.isArray(data) ? data : []).filter(
        (app) => app.appKey === 'attenda' && app.status === 'active'
      );
      setDevices(attendaDevices);
    } catch (err) {
      console.error('Failed to load linked devices:', err);
      toast.error('Failed to load linked devices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleRevoke = async () => {
    if (!deviceToRevoke) return;
    setRevoking(true);
    try {
      const res = await fetch(`/api/user/connected-apps/${deviceToRevoke.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to revoke device');
      }
      toast.success(`Revoked access for ${deviceToRevoke.clientName}`);
      setDeviceToRevoke(null);
      fetchDevices();
    } catch (err) {
      console.error('Failed to revoke device:', err);
      toast.error(err.message || 'Failed to revoke device');
    } finally {
      setRevoking(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="rounded-2xl border border-[#e5e3d8] bg-white p-5 mb-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-[#e5e3d8]/60">
        <div>
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#1f644e]" />
            <h3 className="text-sm font-bold text-[#1e3a34]">Linked Mobile Devices</h3>
          </div>
          <p className="text-xs text-[#7c8e88] mt-0.5">
            Pair Android phones using QR codes. Bearer tokens are strictly scoped to Attenda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDevices}
            disabled={loading}
            className="p-2 rounded-xl border border-[#e5e3d8] hover:bg-[#f0f5f2] text-[#7c8e88] hover:text-[#1e3a34] transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh devices"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowPairModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1f644e] text-white text-xs font-bold rounded-xl hover:bg-[#17503e] transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Link Device</span>
          </button>
        </div>
      </div>

      {loading && devices.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <div className="w-6 h-6 border-2 border-[#1f644e]/30 border-t-[#1f644e] rounded-full animate-spin mb-2" />
          <p className="text-xs text-[#7c8e88]">Checking connected devices...</p>
        </div>
      ) : devices.length === 0 ? (
        <div className="py-8 text-center bg-[#fcfbf5] rounded-xl border border-dashed border-[#e5e3d8] px-4">
          <Smartphone className="w-10 h-10 text-[#7c8e88]/40 mx-auto mb-2" />
          <p className="text-sm font-bold text-[#1e3a34]">No mobile devices connected</p>
          <p className="text-xs text-[#7c8e88] max-w-sm mx-auto mt-1 mb-4">
            Link your Android phone to track lectures, review attendance percentages, and calculate
            safe bunks directly on your device.
          </p>
          <button
            onClick={() => setShowPairModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1f644e] text-white text-xs font-bold rounded-xl hover:bg-[#17503e] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Link Your Android Phone</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between p-3.5 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5]/60 hover:bg-[#fcfbf5] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl bg-[#1f644e]/10 text-[#1f644e] flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1e3a34] truncate">
                      {device.clientName || 'Android Device'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0f5f2] text-[#1f644e] uppercase tracking-wider">
                      Active
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#7c8e88] mt-0.5">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#1f644e]" />
                      Scope: {device.scope || 'attenda'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#7c8e88]" />
                      Last active: {formatDate(device.lastUsedAt)}
                    </span>
                    <span>Paired: {formatDate(device.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="pl-3">
                <button
                  onClick={() => setDeviceToRevoke(device)}
                  className="p-2 rounded-xl border border-transparent text-[#c94c4c] hover:bg-[#fef2f2] hover:border-[#fecaca] transition-colors cursor-pointer"
                  title="Revoke Device Access"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pair Device Modal */}
      <PairDeviceModal
        isOpen={showPairModal}
        onClose={() => setShowPairModal(false)}
        onDeviceLinked={fetchDevices}
      />

      {/* Revoke Confirmation Dialog */}
      {deviceToRevoke && (
        <ConfirmDialog
          title="Revoke Device Access"
          message={`Are you sure you want to disconnect "${deviceToRevoke.clientName}"? The mobile app will immediately lose access and need to be paired again.`}
          confirmLabel={revoking ? 'Revoking...' : 'Revoke Device'}
          danger
          onConfirm={handleRevoke}
          onCancel={() => setDeviceToRevoke(null)}
        />
      )}
    </div>
  );
}
