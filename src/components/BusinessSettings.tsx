import React, { useState } from 'react';
import { Business, InvoiceTemplate } from '../types';
import { updateBusiness } from '../services/db';
import {
  Settings,
  Building,
  Save,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Percent,
  FileText,
} from 'lucide-react';

interface Props {
  business: Business;
  onBusinessUpdated: (updated: Business) => void;
}

export const BusinessSettings: React.FC<Props> = ({ business, onBusinessUpdated }) => {
  const [name, setName] = useState(business.name);
  const [phone, setPhone] = useState(business.phone);
  const [email, setEmail] = useState(business.email);
  const [address, setAddress] = useState(business.address);
  const [website, setWebsite] = useState(business.website || '');
  const [npwp, setNpwp] = useState(business.npwp || '');
  const [logoUrl, setLogoUrl] = useState(business.logoUrl || '');

  const [invoicePrefix, setInvoicePrefix] = useState(business.invoicePrefix || 'INV/2026/');
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(business.nextInvoiceNumber || 1);
  const [defaultPaymentTermsDays, setDefaultPaymentTermsDays] = useState(
    business.defaultPaymentTermsDays || 14
  );
  const [defaultTemplate, setDefaultTemplate] = useState<InvoiceTemplate>(
    business.defaultTemplate || 'creative'
  );
  const [ppnEnabled, setPpnEnabled] = useState(business.ppnEnabled ?? false);
  const [ppnRate, setPpnRate] = useState(business.ppnRate || 11);

  const [bankName, setBankName] = useState(business.bankName || 'BCA');
  const [bankAccountNumber, setBankAccountNumber] = useState(business.bankAccountNumber || '');
  const [bankAccountHolder, setBankAccountHolder] = useState(business.bankAccountHolder || '');
  const [defaultNotes, setDefaultNotes] = useState(business.defaultNotes || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama bisnis wajib diisi.');
      return;
    }
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const updates: Partial<Business> = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        website: website.trim(),
        npwp: npwp.trim(),
        logoUrl: logoUrl.trim(),
        invoicePrefix: invoicePrefix.trim(),
        nextInvoiceNumber: Number(nextInvoiceNumber),
        defaultPaymentTermsDays: Number(defaultPaymentTermsDays),
        defaultTemplate,
        ppnEnabled,
        ppnRate: Number(ppnRate),
        bankName: bankName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankAccountHolder: bankAccountHolder.trim(),
        defaultNotes: defaultNotes.trim(),
      };

      await updateBusiness(business.id, updates);
      onBusinessUpdated({ ...business, ...updates });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui pengaturan bisnis.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-sky-400" />
          <span>Pengaturan Bisnis & Workspace</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Konfigurasi identitas studio, logo, prefix invoice, perpajakan, dan rekening bank.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Pengaturan bisnis berhasil disimpan.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Business Profile */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Building className="w-4 h-4 text-sky-400" /> Profil Studio / Freelancer
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nama Brand / Studio <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Resmi</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Website</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Studio / Kantor</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">NPWP Badan / Pribadi</label>
              <input
                type="text"
                value={npwp}
                onChange={(e) => setNpwp(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">URL Logo (Image URL)</label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Invoicing & PPN */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Percent className="w-4 h-4 text-sky-400" /> Penomoran Invoice & Ketentuan Pajak
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Prefix Penomoran</label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nomor Urut Berikutnya</label>
              <input
                type="number"
                min={1}
                value={nextInvoiceNumber}
                onChange={(e) => setNextInvoiceNumber(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Jatuh Tempo Standar (Hari)</label>
              <input
                type="number"
                min={1}
                value={defaultPaymentTermsDays}
                onChange={(e) => setDefaultPaymentTermsDays(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-3 p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-sky-400" /> Pengaturan PPN Default
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Secara default aktifkan perhitungan PPN saat membuat invoice baru
                </p>
              </div>

              <div className="flex items-center gap-3">
                {ppnEnabled && (
                  <select
                    value={ppnRate}
                    onChange={(e) => setPpnRate(Number(e.target.value))}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    <option value={11}>Tarif 11%</option>
                    <option value={12}>Tarif 12%</option>
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

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Template Desain PDF Bawaan
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'corporate', label: 'Corporate Formal' },
                  { id: 'minimalist', label: 'Minimalist Pro' },
                  { id: 'creative', label: 'Creative Studio' },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setDefaultTemplate(tpl.id as InvoiceTemplate)}
                    className={`py-2.5 rounded-xl text-xs font-semibold border transition ${
                      defaultTemplate === tpl.id
                        ? 'border-indigo-500 bg-indigo-500/20 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Bank Details */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-sky-400" /> Rekening Pembayaran Klien
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Bank</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Contoh: BCA / Mandiri"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nomor Rekening</label>
              <input
                type="text"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Atas Nama (A.N.)</label>
              <input
                type="text"
                value={bankAccountHolder}
                onChange={(e) => setBankAccountHolder(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Catatan Bawaan di Bawah Invoice
              </label>
              <textarea
                rows={2}
                value={defaultNotes}
                onChange={(e) => setDefaultNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Menyimpan Pengaturan...' : 'Simpan Semua Pengaturan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
