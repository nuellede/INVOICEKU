import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createBusinessWorkspace } from '../services/db';
import { WorkspaceType, InvoiceTemplate } from '../types';
import {
  Film,
  Building,
  User,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  FileText,
  CreditCard,
  Percent,
  Sparkles,
} from 'lucide-react';

export const OnboardingWizard: React.FC = () => {
  const { user, refreshWorkspaces } = useAuth();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [type, setType] = useState<WorkspaceType>('freelancer');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [npwp, setNpwp] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Invoice Preferences
  const [invoicePrefix, setInvoicePrefix] = useState(`INV/${new Date().getFullYear()}/`);
  const [defaultPaymentTermsDays, setDefaultPaymentTermsDays] = useState(14);
  const [ppnEnabled, setPpnEnabled] = useState(false);
  const [ppnRate, setPpnRate] = useState(11);
  const [bankName, setBankName] = useState('BCA');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [defaultNotes, setDefaultNotes] = useState(
    'Pembayaran mohon ditransfer sesuai rekening di atas. Harap konfirmasi bukti transfer via WhatsApp. Terima kasih!'
  );

  // Template Choice
  const [template, setTemplate] = useState<InvoiceTemplate>('creative');

  if (!user) return null;

  const handleNext = () => {
    setError(null);
    if (step === 1 && !type) {
      setError('Silakan pilih jenis workspace Anda.');
      return;
    }
    if (step === 2) {
      if (!name.trim()) {
        setError('Nama bisnis/studio wajib diisi.');
        return;
      }
      if (!phone.trim()) {
        setError('Nomor telepon/WhatsApp wajib diisi.');
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFinish = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await createBusinessWorkspace(
        {
          name: name.trim(),
          type,
          email: user.email || '',
          phone: phone.trim(),
          address: address.trim(),
          website: website.trim(),
          npwp: npwp.trim(),
          logoUrl: logoUrl.trim(),
          currency: 'IDR',
          invoicePrefix: invoicePrefix.trim(),
          defaultPaymentTermsDays,
          defaultTemplate: template,
          ppnEnabled,
          ppnRate,
          bankName: bankName.trim(),
          bankAccountNumber: bankAccountNumber.trim(),
          bankAccountHolder: bankAccountHolder.trim(),
          defaultNotes: defaultNotes.trim(),
        },
        {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || undefined,
        }
      );

      await refreshWorkspaces();
    } catch (err: unknown) {
      console.error('Failed to finish onboarding:', err);
      let msg = 'Gagal membuat workspace bisnis.';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          msg = parsed.error || err.message;
        } catch {
          msg = err.message;
        }
      }
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_20%,rgba(99,102,241,0.2),rgba(255,255,255,0))] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 my-8">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Wizard Setup Bisnis Baru</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Selamat Datang di CineInvoice</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Lengkapi data bisnis Anda dalam beberapa langkah mudah untuk mulai membuat invoice video production profesional.
          </p>
        </div>

        {/* Stepper Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2 px-1">
            <span className={step >= 1 ? 'text-indigo-400' : ''}>1. Jenis Akun</span>
            <span className={step >= 2 ? 'text-indigo-400' : ''}>2. Profil Studio</span>
            <span className={step >= 3 ? 'text-indigo-400' : ''}>3. Pembayaran</span>
            <span className={step >= 4 ? 'text-indigo-400' : ''}>4. Template PDF</span>
            <span className={step >= 5 ? 'text-indigo-400' : ''}>5. Selesai</span>
          </div>
          <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Wizard Card Body */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* STEP 1: Choose Account Type */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Pilih Jenis Akun Video Production Anda</h3>
              <p className="text-xs text-slate-400">
                Pilih struktur yang sesuai dengan cara kerja Anda. Anda dapat mengundang tim nanti jika memilih UMKM.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div
                  onClick={() => setType('freelancer')}
                  className={`cursor-pointer p-5 rounded-2xl border-2 transition ${
                    type === 'freelancer'
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
                    <User className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white flex items-center justify-between">
                    Freelancer Mandiri
                    {type === 'freelancer' && <Check className="w-4 h-4 text-indigo-400" />}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Untuk videografer, editor video, drone pilot, colorist, atau sound designer yang mengelola klien dan tagihan mandiri.
                  </p>
                </div>

                <div
                  onClick={() => setType('umkm')}
                  className={`cursor-pointer p-5 rounded-2xl border-2 transition ${
                    type === 'umkm'
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-3">
                    <Building className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white flex items-center justify-between">
                    UMKM / Production House
                    {type === 'umkm' && <Check className="w-4 h-4 text-sky-400" />}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Untuk studio kreatif, rental alat, agensi video, atau rumah produksi dengan banyak anggota tim (Owner, Admin, Finance).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Business Profile */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Profil & Kontak Bisnis</h3>
              <p className="text-xs text-slate-400">
                Informasi ini akan dicetak di header invoice dan template pesan WhatsApp ke klien.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nama Bisnis / Studio / Brand <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: MotionFrame Films"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    No. Telepon / WhatsApp <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Website (Opsional)</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="Contoh: https://motionframe.id"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Studio / Kantor</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Contoh: Jl. Kemang Raya No. 12, Jakarta Selatan"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">NPWP (Opsional)</label>
                  <input
                    type="text"
                    value={npwp}
                    onChange={(e) => setNpwp(e.target.value)}
                    placeholder="Contoh: 01.234.567.8-901.000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">URL Logo (Opsional)</label>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="Contoh: https://.../logo.png"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Invoice & Payment Preferences */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Preferensi Penagihan & Rekening Bank</h3>
              <p className="text-xs text-slate-400">
                Atur format nomor invoice, jatuh tempo standar, serta rincian rekening pembayaran klien.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Format Penomoran Invoice</label>
                  <input
                    type="text"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    placeholder="Contoh: INV/2026/"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Nomor berikutnya otomatis: INV/2026/001</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Jatuh Tempo Default (Hari)</label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={defaultPaymentTermsDays}
                    onChange={(e) => setDefaultPaymentTermsDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                </div>

                {/* PPN Switch */}
                <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-sky-400" /> Aktifkan Pajak PPN Standar
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Dapat diaktifkan/dinonaktifkan per invoice saat pembuatan.
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {ppnEnabled && (
                      <select
                        value={ppnRate}
                        onChange={(e) => setPpnRate(Number(e.target.value))}
                        className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                      >
                        <option value={11}>11%</option>
                        <option value={12}>12%</option>
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={() => setPpnEnabled(!ppnEnabled)}
                      className={`w-11 h-6 rounded-full transition p-1 flex items-center ${
                        ppnEnabled ? 'bg-indigo-600 justify-end' : 'bg-slate-800 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>
                </div>

                {/* Bank Account */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Bank</label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  >
                    <option value="BCA">BCA (Bank Central Asia)</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                    <option value="BNI">BNI (Bank Negara Indonesia)</option>
                    <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                    <option value="CIMB">CIMB Niaga</option>
                    <option value="Permata">Bank Permata</option>
                    <option value="Jago">Bank Jago</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nomor Rekening</label>
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="Contoh: 1234567890"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Pemilik Rekening (A.N.)</label>
                  <input
                    type="text"
                    value={bankAccountHolder}
                    onChange={(e) => setBankAccountHolder(e.target.value)}
                    placeholder="Contoh: PT Lumina Kreasi Studio / Dimas Pratama"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Choose Template */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Pilih Template Desain Invoice</h3>
              <p className="text-xs text-slate-400">
                Pilih gaya tata letak default untuk cetak PDF dan invoice sharing. Anda dapat mengubahnya kapan saja.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                <div
                  onClick={() => setTemplate('corporate')}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition ${
                    template === 'corporate'
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="h-24 rounded-xl bg-slate-900 border border-slate-800 p-2 flex flex-col justify-between mb-3">
                    <div className="h-3 w-16 bg-blue-600 rounded" />
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-slate-700 rounded" />
                      <div className="h-1.5 w-3/4 bg-slate-800 rounded" />
                    </div>
                    <div className="h-3 w-12 bg-blue-700 rounded self-end" />
                  </div>
                  <h4 className="text-xs font-bold text-white flex items-center justify-between">
                    Corporate Formal
                    {template === 'corporate' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">Struktur formal untuk instansi BUMN, korporasi & tender.</p>
                </div>

                <div
                  onClick={() => setTemplate('minimalist')}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition ${
                    template === 'minimalist'
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="h-24 rounded-xl bg-slate-900 border border-slate-800 p-2 flex flex-col justify-between mb-3">
                    <div className="h-3 w-14 bg-slate-400 rounded" />
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-slate-800 rounded" />
                      <div className="h-1.5 w-2/3 bg-slate-800 rounded" />
                    </div>
                    <div className="h-3 w-10 bg-slate-300 rounded self-end" />
                  </div>
                  <h4 className="text-xs font-bold text-white flex items-center justify-between">
                    Minimalist Pro
                    {template === 'minimalist' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">Gaya monokrom rapi, bersih, dan modern.</p>
                </div>

                <div
                  onClick={() => setTemplate('creative')}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition ${
                    template === 'creative'
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="h-24 rounded-xl bg-slate-900 border border-slate-800 p-2 flex flex-col justify-between mb-3">
                    <div className="h-3 w-14 bg-gradient-to-r from-indigo-500 to-sky-400 rounded" />
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-slate-700 rounded" />
                      <div className="h-1.5 w-4/5 bg-slate-800 rounded" />
                    </div>
                    <div className="h-3 w-14 bg-emerald-500 rounded self-end" />
                  </div>
                  <h4 className="text-xs font-bold text-white flex items-center justify-between">
                    Creative Studio
                    {template === 'creative' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">Aksen sinematik, bold, dan menonjolkan identitas visual video.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Finish */}
          {step === 5 && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-white">Workspace Siap Digunakan!</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Bisnis <strong className="text-white">{name}</strong> ({type === 'freelancer' ? 'Freelancer' : 'UMKM'}) telah dikonfigurasi lengkap dengan 10 katalog jasa video bawaan (shooting, drone, lighting, editing, color grading).
              </p>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2 mt-4 max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-400">Prefix Invoice:</span>
                  <span className="font-mono text-white font-semibold">{invoicePrefix}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rekening:</span>
                  <span className="text-white">{bankName} - {bankAccountNumber || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Template Terpilih:</span>
                  <span className="capitalize text-indigo-400 font-semibold">{template}</span>
                </div>
              </div>
            </div>
          )}

          {/* Wizard Action Controls */}
          <div className="mt-8 pt-5 border-t border-slate-800 flex items-center justify-between">
            {step > 1 && step < 5 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition active:scale-95 ml-auto"
              >
                <span>Lanjutkan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-xl shadow-emerald-600/30 transition active:scale-95 mx-auto"
              >
                {isSubmitting ? (
                  <span className="animate-pulse">Menyiapkan Workspace...</span>
                ) : (
                  <>
                    <span>Buka Dashboard Invoice</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
