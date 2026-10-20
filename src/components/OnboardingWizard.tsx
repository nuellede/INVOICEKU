import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createBusinessWorkspace, updateBusiness } from '../services/db';
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
  X,
  Save,
  LayoutDashboard,
} from 'lucide-react';

interface Props {
  onCancel?: () => void;
  onSuccess?: () => void;
}

export const OnboardingWizard: React.FC<Props> = ({ onCancel, onSuccess }) => {
  const { user, currentBusiness, refreshWorkspaces } = useAuth();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftSavedToast, setDraftSavedToast] = useState(false);

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

  // Load saved draft or active business data on initial mount
  useEffect(() => {
    if (!user) return;
    try {
      const saved = localStorage.getItem('cineinvoice_wizard_draft_' + user.uid);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.type) setType(d.type);
        if (d.name) setName(d.name);
        if (d.phone) setPhone(d.phone);
        if (d.address) setAddress(d.address);
        if (d.website) setWebsite(d.website);
        if (d.npwp) setNpwp(d.npwp);
        if (d.logoUrl) setLogoUrl(d.logoUrl);
        if (d.invoicePrefix) setInvoicePrefix(d.invoicePrefix);
        if (d.defaultPaymentTermsDays) setDefaultPaymentTermsDays(d.defaultPaymentTermsDays);
        if (d.ppnEnabled !== undefined) setPpnEnabled(d.ppnEnabled);
        if (d.ppnRate !== undefined) setPpnRate(d.ppnRate);
        if (d.bankName) setBankName(d.bankName);
        if (d.bankAccountNumber) setBankAccountNumber(d.bankAccountNumber);
        if (d.bankAccountHolder) setBankAccountHolder(d.bankAccountHolder);
        if (d.defaultNotes) setDefaultNotes(d.defaultNotes);
        if (d.template) setTemplate(d.template);
        if (d.step && d.step >= 1 && d.step <= 5) setStep(d.step);
      } else if (currentBusiness) {
        // Pre-fill from existing active workspace
        setType(currentBusiness.type || 'freelancer');
        setName(currentBusiness.name || '');
        setPhone(currentBusiness.phone || '');
        setAddress(currentBusiness.address || '');
        setWebsite(currentBusiness.website || '');
        setNpwp(currentBusiness.npwp || '');
        setLogoUrl(currentBusiness.logoUrl || '');
        setInvoicePrefix(currentBusiness.invoicePrefix || `INV/${new Date().getFullYear()}/`);
        setDefaultPaymentTermsDays(currentBusiness.defaultPaymentTermsDays || 14);
        setPpnEnabled(currentBusiness.ppnEnabled ?? false);
        setPpnRate(currentBusiness.ppnRate || 11);
        setBankName(currentBusiness.bankName || 'BCA');
        setBankAccountNumber(currentBusiness.bankAccountNumber || '');
        setBankAccountHolder(currentBusiness.bankAccountHolder || '');
        setDefaultNotes(currentBusiness.defaultNotes || '');
        setTemplate(currentBusiness.defaultTemplate || 'creative');
      }
    } catch (e) {
      console.warn('Failed to restore wizard draft', e);
    }
  }, [user, currentBusiness]);

  // Auto-save draft on every change
  useEffect(() => {
    if (!user) return;
    try {
      const draft = {
        step,
        type,
        name,
        phone,
        address,
        website,
        npwp,
        logoUrl,
        invoicePrefix,
        defaultPaymentTermsDays,
        ppnEnabled,
        ppnRate,
        bankName,
        bankAccountNumber,
        bankAccountHolder,
        defaultNotes,
        template,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('cineinvoice_wizard_draft_' + user.uid, JSON.stringify(draft));
      setDraftSavedToast(true);
      const timer = setTimeout(() => setDraftSavedToast(false), 1500);
      return () => clearTimeout(timer);
    } catch {
      // ignore localStorage quota errors
    }
  }, [
    user,
    step,
    type,
    name,
    phone,
    address,
    website,
    npwp,
    logoUrl,
    invoicePrefix,
    defaultPaymentTermsDays,
    ppnEnabled,
    ppnRate,
    bankName,
    bankAccountNumber,
    bankAccountHolder,
    defaultNotes,
    template,
  ]);

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
      const businessPayload = {
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
      };

      if (currentBusiness?.id) {
        // Update existing business workspace
        await updateBusiness(currentBusiness.id, businessPayload);
      } else {
        // Create new business workspace
        await createBusinessWorkspace(
          businessPayload,
          {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || undefined,
          }
        );
      }

      // Clear draft on successful completion
      try {
        localStorage.removeItem('cineinvoice_wizard_draft_' + user.uid);
      } catch {
        // ignore
      }

      await refreshWorkspaces();

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      console.error('Failed to finish onboarding:', err);
      let msg = 'Gagal menyimpan workspace bisnis.';
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

  const handleSaveAndGoToDashboard = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const finalName = name.trim() || (user?.displayName ? `${user.displayName} Studio` : (user?.email ? `${user.email.split('@')[0]} Studio` : 'Cine Studio'));
      const businessPayload = {
        name: finalName,
        type: type || 'freelancer',
        email: user?.email || '',
        phone: phone.trim() || '0812000000',
        address: address.trim(),
        website: website.trim(),
        npwp: npwp.trim(),
        logoUrl: logoUrl.trim(),
        currency: 'IDR',
        invoicePrefix: invoicePrefix.trim() || `INV/${new Date().getFullYear()}/`,
        defaultPaymentTermsDays,
        defaultTemplate: template,
        ppnEnabled,
        ppnRate,
        bankName: bankName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankAccountHolder: bankAccountHolder.trim(),
        defaultNotes: defaultNotes.trim(),
      };

      if (currentBusiness?.id) {
        await updateBusiness(currentBusiness.id, businessPayload);
      } else if (user) {
        await createBusinessWorkspace(
          businessPayload,
          {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || undefined,
          }
        );
      }

      try {
        localStorage.removeItem('cineinvoice_wizard_draft_' + user?.uid);
      } catch {
        // ignore
      }

      await refreshWorkspaces();

      if (onSuccess) {
        onSuccess();
      } else if (onCancel) {
        onCancel();
      }
    } catch (err) {
      console.error('Failed to save and enter dashboard:', err);
      if (onSuccess) onSuccess();
      else if (onCancel) onCancel();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_20%,rgba(99,102,241,0.2),rgba(255,255,255,0))] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 my-8">
        {/* Brand Header */}
        <div className="text-center mb-6 relative">
          {onCancel && (
            <button
              onClick={onCancel}
              className="absolute right-0 top-0 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition"
              title="Tutup & Kembali ke Dashboard"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Wizard Setup Bisnis Baru</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Selamat Datang di CineInvoice</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Lengkapi data bisnis Anda dalam beberapa langkah mudah untuk mulai membuat invoice video production profesional.
          </p>
        </div>

        {/* Existing Business Notice Banner */}
        {currentBusiness && (
          <div className="mb-6 p-4 rounded-2xl bg-indigo-950/70 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  Workspace Aktif Ditemukan: <span className="text-sky-300">{currentBusiness.name}</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  Data bisnis sudah tersimpan di database. Anda bisa langsung masuk ke dashboard kapan saja.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (onSuccess) onSuccess();
                else if (onCancel) onCancel();
                else window.location.reload();
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
            >
              <span>Buka Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Auto-save Status Badge & Direct Dashboard Exit */}
        <div className="flex items-center justify-between mb-4 px-1 gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <Check className="w-3 h-3" />
            <span>{draftSavedToast ? 'Tersimpan otomatis...' : 'Draf data otomatis tersimpan'}</span>
          </div>

          <button
            type="button"
            onClick={handleSaveAndGoToDashboard}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white font-semibold px-3 py-1.5 rounded-xl bg-indigo-950/80 border border-indigo-500/30 hover:bg-indigo-900 transition shadow-sm"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-sky-400" />
            <span>Simpan Data & Buka Dashboard</span>
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2 px-1">
            <span className={step >= 1 ? 'text-indigo-400 font-bold' : ''}>1. Jenis Akun</span>
            <span className={step >= 2 ? 'text-indigo-400 font-bold' : ''}>2. Profil Studio</span>
            <span className={step >= 3 ? 'text-indigo-400 font-bold' : ''}>3. Pembayaran</span>
            <span className={step >= 4 ? 'text-indigo-400 font-bold' : ''}>4. Template PDF</span>
            <span className={step >= 5 ? 'text-indigo-400 font-bold' : ''}>5. Selesai</span>
          </div>
          <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Wizard Card Body */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* STEP 1: CHOOSE WORKSPACE TYPE */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">Pilih Jenis Akun Video Production Anda</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Pilih struktur yang sesuai dengan cara kerja Anda. Anda dapat mengundang tim nanti jika memilih UMKM.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Freelancer Card */}
                <div
                  onClick={() => setType('freelancer')}
                  className={`cursor-pointer rounded-2xl p-5 border transition relative ${
                    type === 'freelancer'
                      ? 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                    <User className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Freelancer Mandiri</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Untuk videografer, editor video, drone pilot, colorist, atau sound designer yang mengelola klien dan tagihan mandiri.
                  </p>
                  {type === 'freelancer' && (
                    <CheckCircle2 className="w-5 h-5 text-indigo-400 absolute top-4 right-4" />
                  )}
                </div>

                {/* UMKM / Production House Card */}
                <div
                  onClick={() => setType('umkm')}
                  className={`cursor-pointer rounded-2xl p-5 border transition relative ${
                    type === 'umkm'
                      ? 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-4">
                    <Building className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">UMKM / Production House</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Untuk studio kreatif, rental alat, agensi video, atau rumah produksi dengan banyak anggota tim (Owner, Admin, Finance).
                  </p>
                  {type === 'umkm' && (
                    <CheckCircle2 className="w-5 h-5 text-sky-400 absolute top-4 right-4" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: STUDIO PROFILE */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">Profil Bisnis Video Production</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Informasi ini akan tercetak sebagai kepala surat (header) pada invoice resmi Anda. Data ini otomatis tersimpan.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Bisnis / Brand / Studio <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: CineNova Visuals Studio"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    No. WhatsApp / Telepon <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Website / Portofolio (Opsional)
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://cinenova.id"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Alamat Lengkap Studio / Operasional
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jl. Kreatif No. 8, Jakarta Selatan, DKI Jakarta"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    NPWP Badan / Pribadi (Opsional)
                  </label>
                  <input
                    type="text"
                    value={npwp}
                    onChange={(e) => setNpwp(e.target.value)}
                    placeholder="00.000.000.0-000.000"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    URL Logo Studio (Opsional)
                  </label>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://.../logo.png"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: INVOICE & PAYMENT PREFERENCES */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">Preferensi Penomoran & Rekening Pembayaran</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Tentukan nomor rekening tujuan transfer dan format nomor invoice otomatis Anda.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Format Prefix Nomor Invoice
                  </label>
                  <input
                    type="text"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    placeholder="INV/2026/"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Standar Jatuh Tempo (Hari)
                  </label>
                  <input
                    type="number"
                    value={defaultPaymentTermsDays}
                    onChange={(e) => setDefaultPaymentTermsDays(Number(e.target.value))}
                    min={1}
                    max={90}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                </div>
              </div>

              {/* Bank Account */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                  <span>Rekening Bank Penerima Transfer</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Nama Bank</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="BCA / Mandiri / BNI"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Nomor Rekening</label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="1234567890"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Atas Nama (Pemilik)</label>
                    <input
                      type="text"
                      value={bankAccountHolder}
                      onChange={(e) => setBankAccountHolder(e.target.value)}
                      placeholder="Nama Pemilik Rekening"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* PPN Option */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">Aktifkan PPN Otomatis</span>
                  <span className="text-[11px] text-slate-400">
                    Otomatis tambahkan tarif PPN (misal 11% atau 12%) pada setiap pembuatan invoice baru.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ppnToggle"
                    checked={ppnEnabled}
                    onChange={(e) => setPpnEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-900"
                  />
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
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: TEMPLATE PDF SELECTION */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">Pilih Template Desain Invoice Anda</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Pilih gaya visual invoice yang mewakili citra profesional studio video Anda.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Creative Studio */}
                <div
                  onClick={() => setTemplate('creative')}
                  className={`cursor-pointer rounded-2xl p-4 border transition ${
                    template === 'creative'
                      ? 'bg-indigo-600/15 border-indigo-500 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="h-2 w-full rounded bg-indigo-500 mb-3" />
                  <h4 className="text-xs font-bold text-white">Creative Studio</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Warna indigo modern, badge status rounded, cocok untuk agensi video dan freelancer kreatif.
                  </p>
                </div>

                {/* Corporate Formal */}
                <div
                  onClick={() => setTemplate('corporate')}
                  className={`cursor-pointer rounded-2xl p-4 border transition ${
                    template === 'corporate'
                      ? 'bg-slate-800/60 border-slate-400 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="h-2 w-full rounded bg-slate-900 mb-3" />
                  <h4 className="text-xs font-bold text-white">Corporate Formal</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Garis border tegas navy slate dengan kolom stempel resmi dan tanda tangan basah.
                  </p>
                </div>

                {/* Minimalist Professional */}
                <div
                  onClick={() => setTemplate('minimalist')}
                  className={`cursor-pointer rounded-2xl p-4 border transition ${
                    template === 'minimalist'
                      ? 'bg-sky-500/10 border-sky-500 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="h-2 w-full rounded bg-slate-600 mb-3" />
                  <h4 className="text-xs font-bold text-white">Minimalist Studio</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Desain clean monokrom, tipografi lapang, sangat elegan untuk dokumentasi video sinematik.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: FINISH & CONFIRMATION */}
          {step === 5 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-white">Workspace Siap Digunakan!</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Bisnis <strong className="text-white">{name}</strong> ({type === 'freelancer' ? 'Freelancer' : 'UMKM'}) telah dikonfigurasi lengkap dengan katalog jasa video bawaan (shooting, drone, lighting, editing, color grading).
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
              <div className="flex items-center gap-2.5 ml-auto flex-wrap justify-end">
                <button
                  type="button"
                  onClick={handleSaveAndGoToDashboard}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                  title="Simpan data yang sudah diisi dan langsung buka dashboard invoice"
                >
                  <Save className="w-3.5 h-3.5 text-sky-400" />
                  <span>Simpan & Buka Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition active:scale-95"
                >
                  <span>Lanjutkan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
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
