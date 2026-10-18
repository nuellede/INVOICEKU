import React, { useState } from 'react';
import { Shield, Server, Users, Building, Activity, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PlatformAdminModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl text-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">SaaS Platform Administration</h3>
              <p className="text-[11px] text-slate-400">Panel operasional & pemantauan platform CineInvoice</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Tenants</span>
            <p className="text-lg font-black text-white mt-0.5">Multi-Tenant</p>
            <span className="text-[10px] text-emerald-400 mt-0.5 block">Isolated Namespaces</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Auth Engine</span>
            <p className="text-lg font-black text-white mt-0.5">Firebase Auth</p>
            <span className="text-[10px] text-sky-400 mt-0.5 block">Active Sessions</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">PWA Service Worker</span>
            <p className="text-lg font-black text-white mt-0.5">Active</p>
            <span className="text-[10px] text-emerald-400 mt-0.5 block">Standalone Ready</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Security Rules</span>
            <p className="text-lg font-black text-emerald-400 mt-0.5">Enforced</p>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Zero-Trust ABAC</span>
          </div>
        </div>

        {/* Security Policy Notice */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 space-y-2">
          <h4 className="font-bold text-white flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Prinsip Keamanan Multi-Tenant
          </h4>
          <p className="leading-relaxed">
            Sesuai kebijakan kepatuhan CineInvoice, administrator platform tidak memiliki akses otomatis membaca tagihan atau data sensitif finansial milik tenant lain secara langsung tanpa izin tertulis dan audit trail terdokumentasi.
          </p>
        </div>

        {/* System Operations & Maintenance Toggle */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-white block">Mode Pemeliharaan (Maintenance Mode)</span>
            <span className="text-[11px] text-slate-400">
              Jika aktif, pendaftaran tenant baru akan ditahan sementara untuk migrasi skema.
            </span>
          </div>
          <button
            onClick={() => setMaintenanceMode(!maintenanceMode)}
            className={`w-11 h-6 rounded-full transition p-1 flex items-center ${
              maintenanceMode ? 'bg-amber-600 justify-end' : 'bg-slate-800 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
          >
            Tutup Panel Admin
          </button>
        </div>
      </div>
    </div>
  );
};
