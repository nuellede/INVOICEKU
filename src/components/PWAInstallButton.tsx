import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X, Smartphone, CheckCircle2 } from 'lucide-react';

interface Props {
  className?: string;
  variant?: 'button' | 'compact' | 'banner';
}

export const PWAInstallButton: React.FC<Props> = ({ className = '', variant = 'button' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running inside standalone PWA, hide install triggers
  if (isInstalled) {
    return null;
  }

  // Handle Chrome / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'compact') {
      return (
        <button
          onClick={install}
          title="Install App ke Layar Utama"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition active:scale-95 ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
      );
    }

    if (variant === 'banner') {
      return (
        <div className={`bg-gradient-to-r from-indigo-950/90 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white shadow-lg ${className}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Pasang Aplikasi di HP Android Anda</h4>
              <p className="text-xs text-slate-400">Akses invoice lebih cepat langsung dari layar utama tanpa browser URL bar.</p>
            </div>
          </div>
          <button
            onClick={install}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition active:scale-95 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Install Sekarang</span>
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={install}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition active:scale-95 ${className}`}
      >
        <Download className="w-4 h-4" />
        <span>Install App</span>
      </button>
    );
  }

  // Handle iOS Safari Flow
  if (isIOS) {
    return (
      <>
        {variant === 'compact' ? (
          <button
            onClick={() => setShowIOSGuide(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition active:scale-95 ${className}`}
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
            <span>Install di iPhone</span>
          </button>
        ) : variant === 'banner' ? (
          <div className={`bg-gradient-to-r from-slate-900 to-indigo-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white shadow-lg ${className}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Tambahkan CineInvoice ke Home Screen iPhone</h4>
                <p className="text-xs text-slate-400">Buka langsung seperti aplikasi iOS asli dari layar utama iPhone / iPad Anda.</p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-semibold shadow-md transition active:scale-95 shrink-0"
            >
              <PlusSquare className="w-4 h-4 text-indigo-400" />
              <span>Petunjuk Install iOS</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowIOSGuide(true)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition active:scale-95 ${className}`}
          >
            <Smartphone className="w-4 h-4 text-indigo-400" />
            <span>Install di iOS</span>
          </button>
        )}

        {/* Modal Guide for iOS Safari */}
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white">Pasang di iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-white">Buka di Browser Safari</p>
                    <p className="text-slate-400 mt-0.5">Pastikan Anda membuka aplikasi ini menggunakan browser bawaan Safari iOS.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-white flex items-center gap-1.5">
                      Ketuk tombol Bagikan <Share2 className="w-3.5 h-3.5 text-sky-400 inline" />
                    </p>
                    <p className="text-slate-400 mt-0.5">Tombol kotak berpanah atas di bilah menu bawah Safari.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-white flex items-center gap-1.5">
                      Pilih <PlusSquare className="w-3.5 h-3.5 text-indigo-400 inline" /> 'Add to Home Screen'
                    </p>
                    <p className="text-slate-400 mt-0.5">Gulir ke bawah pada menu bagikan, lalu ketuk "Tambah ke Layar Utama".</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Selesai!</p>
                    <p className="text-slate-400 mt-0.5">Ikon CineInvoice akan tampil di Home Screen dan berjalan layar penuh tanpa address bar.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
