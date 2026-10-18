import React from 'react';
import {
  Film,
  FileText,
  Smartphone,
  ShieldCheck,
  CheckCircle,
  Users,
  Percent,
  Download,
  Share2,
  Sparkles,
  ArrowRight,
  Calculator,
  MessageCircle,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface Props {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const LandingPage: React.FC<Props> = ({ onOpenAuth }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-sky-500 to-emerald-400 p-[1px] shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Film className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                Cine<span className="text-sky-400">Invoice</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold tracking-wider uppercase text-slate-400 ml-1">
                SaaS Video Production
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <PWAInstallButton variant="compact" />
            <button
              onClick={() => onOpenAuth('login')}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition"
            >
              Masuk
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition active:scale-95"
            >
              <span>Daftar Gratis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(255,255,255,0))]" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Multi-Tenant SaaS + Siap Pasang di Android & iPhone</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Software Invoice & Finansial Khusus{' '}
            <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Video Production & UMKM
            </span>
          </h1>

          <p className="mt-5 text-sm sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Kelola tagihan video komersial, shooting, rental alat, color grading, hingga editing dengan isolasi tenant aman, perhitungan otomatis PPN 11%/12%, tagih via WhatsApp 1-klik, dan export PDF & Excel profesional.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition active:scale-95"
            >
              <span>Mulai Buat Invoice Gratis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onOpenAuth('login')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-sm transition"
            >
              <span>Login ke Workspace</span>
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Untuk Freelancer & Rumah Produksi
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Pajak PPN 11% / 12% Indonesia
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Bisa Diinstall di HP (PWA)
            </span>
          </div>

          {/* App Preview Card Mock */}
          <div className="mt-12 relative mx-auto max-w-4xl rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl p-4 sm:p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs text-slate-400 font-mono">INV/2026/042 • TV Commercial Brand Launch</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                LUNAS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-left">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Total Invoice</span>
                <p className="text-xl font-bold text-white mt-1">Rp 48.500.000</p>
                <span className="text-[10px] text-sky-400 mt-0.5 block">Termasuk PPN 11% & Down Payment</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Line Items Produksi</span>
                <p className="text-sm font-semibold text-slate-200 mt-1">Sony FX6, Drone 4K, Color DaVinci</p>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Katalog Video Production Otomatis</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Distribusi Cepat</span>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" /> WhatsApp
                  </span>
                  <span className="px-2 py-1 rounded-md bg-sky-500/20 text-sky-300 text-[10px] font-bold flex items-center gap-1">
                    <FileText className="w-3 h-3" /> PDF
                  </span>
                  <span className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold flex items-center gap-1">
                    <Share2 className="w-3 h-3" /> Link
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-16 bg-slate-900/40 border-y border-slate-800/80 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Dirancang Spesifik untuk Ekosistem Kreatif</h2>
            <p className="text-sm text-slate-400 mt-2">
              Bukan aplikasi invoice umum. CineInvoice memahami shift kerja kru, paket sewa kamera, tahapan editing, dan aturan pajak UMKM Indonesia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Multi-Tenant Terisolasi Aman</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Setiap freelancer dan UMKM memiliki ID bisnis sendiri. Data klien, nominal tagihan, dan histori pembayaran terlindungi dengan aturan ketat Firebase Security Rules.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4">
                <Percent className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">PPN 11% / 12% & Uang Muka (DP)</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Kalkulasi otomatis pajak pertambahan nilai, diskon persentase/nominal, cicilan bertahap, dan perhitungan sisa tagihan langsung akurat tanpa spreadsheet manual.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Tagih WhatsApp 1-Klik</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Kirim pesan penagihan formal dan sopan ke nomor WhatsApp klien secara otomatis lengkap dengan rincian invoice, info rekening bank, dan link download PDF.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">3 Template Invoice Sinematik</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Pilih gaya tampilan: Corporate Formal, Minimalist Professional, atau Creative Production Studio. Download PDF beresolusi tinggi siap kirim ke procurement klien.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Multi-User & Hak Akses (RBAC)</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Ajak tim Anda dengan peran terpisah: Owner, Admin, Finance (Akuntan), atau Staff. Pemilik workspace dapat berpindah antar bisnis dengan aman.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Install PWA di Android & iPhone</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Dapat dipasang langsung ke Home Screen HP Anda. Berjalan fullscreen seperti aplikasi native dengan performa cepat dan navigasi mobile sentuh yang nyaman.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PWA Promotion Callout */}
      <section className="py-12 px-4 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <PWAInstallButton variant="banner" />
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-8 px-4 text-center text-xs text-slate-500">
        <p>© 2026 CineInvoice SaaS. Solusi manajemen invoice video production dan UMKM kreatif Indonesia.</p>
        <p className="mt-1 text-slate-600">Mendukung standar PPN Indonesia & isolasi multi-tenant terenkripsi.</p>
      </footer>
    </div>
  );
};
