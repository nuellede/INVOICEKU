import React, { useState, useEffect } from 'react';
import {
  Business,
  Client,
  ServiceItem,
  Invoice,
  InvoiceItem,
  InvoiceTemplate,
  DiscountType,
} from '../types';
import { getClients, getServices, createInvoice, updateInvoice, createClient } from '../services/db';
import { formatIDR, generateSecureToken } from '../utils/formatters';
import {
  FileText,
  Plus,
  Trash2,
  Calendar,
  Building,
  User,
  Percent,
  CreditCard,
  Save,
  Send,
  X,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface Props {
  business: Business;
  userId: string;
  existingInvoice?: Invoice | null;
  onSaveSuccess: (invoice: Invoice) => void;
  onCancel: () => void;
}

export const InvoiceForm: React.FC<Props> = ({
  business,
  userId,
  existingInvoice,
  onSaveSuccess,
  onCancel,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form Fields
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [template, setTemplate] = useState<InvoiceTemplate>(business.defaultTemplate || 'creative');

  // Items
  const [items, setItems] = useState<InvoiceItem[]>([]);

  // Discounts & Tax
  const [discountType, setDiscountType] = useState<DiscountType>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [ppnEnabled, setPpnEnabled] = useState(business.ppnEnabled ?? false);
  const [ppnRate, setPpnRate] = useState(business.ppnRate || 11);
  const [downPayment, setDownPayment] = useState<number>(0);

  // Notes & Bank details
  const [notes, setNotes] = useState(business.defaultNotes || '');
  const [bankDetails, setBankDetails] = useState(
    business.bankAccountNumber
      ? `Bank: ${business.bankName}\nNo. Rekening: ${business.bankAccountNumber}\nAtas Nama: ${business.bankAccountHolder}`
      : ''
  );

  // Inline Client Creation State
  const [showQuickClientModal, setShowQuickClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load clients and service catalog
  useEffect(() => {
    async function init() {
      try {
        const [cls, srvs] = await Promise.all([
          getClients(business.id),
          getServices(business.id),
        ]);
        setClients(cls);
        setServices(srvs);

        if (existingInvoice) {
          setInvoiceNumber(existingInvoice.invoiceNumber);
          setSelectedClientId(existingInvoice.clientId);
          setProjectTitle(existingInvoice.projectTitle);
          setIssueDate(existingInvoice.issueDate);
          setDueDate(existingInvoice.dueDate);
          setTemplate(existingInvoice.template);
          setItems(existingInvoice.items);
          setDiscountType(existingInvoice.discountType);
          setDiscountValue(existingInvoice.discountValue);
          setPpnEnabled(existingInvoice.ppnEnabled);
          setPpnRate(existingInvoice.ppnRate);
          setDownPayment(existingInvoice.downPayment || 0);
          setNotes(existingInvoice.notes);
          setBankDetails(existingInvoice.bankDetails);
        } else {
          // Generate new invoice number from sequence
          const seq = String(business.nextInvoiceNumber || 1).padStart(3, '0');
          setInvoiceNumber(`${business.invoicePrefix || 'INV/'}${seq}`);

          // Set default due date
          const d = new Date();
          d.setDate(d.getDate() + (business.defaultPaymentTermsDays || 14));
          setDueDate(d.toISOString().split('T')[0]);

          // Seed 1 default blank item
          if (srvs.length > 0) {
            setItems([
              {
                id: 'itm_' + generateSecureToken(8),
                serviceId: srvs[0].id,
                description: srvs[0].name,
                quantity: 1,
                unit: srvs[0].unit,
                price: srvs[0].defaultPrice,
                amount: srvs[0].defaultPrice,
              },
            ]);
          } else {
            setItems([
              {
                id: 'itm_' + generateSecureToken(8),
                description: 'Jasa Video Production',
                quantity: 1,
                unit: 'project',
                price: 5000000,
                amount: 5000000,
              },
            ]);
          }
        }
      } catch (e) {
        console.error('Error initializing invoice form:', e);
      } finally {
        setLoadingInitial(false);
      }
    }
    init();
  }, [business.id, existingInvoice]);

  // Recalculate item amounts
  const updateItem = (index: number, updates: Partial<InvoiceItem>) => {
    const updated = [...items];
    const item = { ...updated[index], ...updates };
    const base = (item.quantity || 0) * (item.price || 0);
    const disc = item.discountPercent ? base * (item.discountPercent / 100) : 0;
    item.amount = Math.max(0, base - disc);
    updated[index] = item;
    setItems(updated);
  };

  const addItemFromService = (srv?: ServiceItem) => {
    if (srv) {
      setItems([
        ...items,
        {
          id: 'itm_' + generateSecureToken(8),
          serviceId: srv.id,
          description: srv.name,
          quantity: 1,
          unit: srv.unit,
          price: srv.defaultPrice,
          amount: srv.defaultPrice,
        },
      ]);
    } else {
      setItems([
        ...items,
        {
          id: 'itm_' + generateSecureToken(8),
          description: '',
          quantity: 1,
          unit: 'shift',
          price: 0,
          amount: 0,
        },
      ]);
    }
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) {
      setError('Invoice harus memiliki minimal 1 line item.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // Financial Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const discountTotal =
    discountType === 'percent'
      ? subtotal * ((discountValue || 0) / 100)
      : Math.min(subtotal, discountValue || 0);
  const taxableBase = Math.max(0, subtotal - discountTotal);
  const ppnAmount = ppnEnabled ? Math.round(taxableBase * ((ppnRate || 11) / 100)) : 0;
  const grandTotal = taxableBase + ppnAmount;
  const currentPaid = existingInvoice?.paidAmount || 0;
  const totalPaidOrDown = Math.max(currentPaid, downPayment || 0);
  const outstandingAmount = Math.max(0, grandTotal - totalPaidOrDown);

  // Quick Client Creation
  const handleQuickClientCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientPhone.trim()) {
      alert('Nama dan No. WhatsApp klien wajib diisi.');
      return;
    }
    try {
      const created = await createClient(business.id, {
        name: newClientName.trim(),
        company: newClientCompany.trim(),
        phone: newClientPhone.trim(),
        email: newClientEmail.trim(),
      });
      setClients([created, ...clients]);
      setSelectedClientId(created.id);
      setShowQuickClientModal(false);
      setNewClientName('');
      setNewClientCompany('');
      setNewClientPhone('');
      setNewClientEmail('');
    } catch (err) {
      console.error(err);
      alert('Gagal membuat klien baru.');
    }
  };

  const handleSaveInvoice = async (asDraft = false) => {
    setError(null);
    if (!selectedClientId) {
      setError('Pilih klien tujuan invoice terlebih dahulu.');
      return;
    }
    if (!projectTitle.trim()) {
      setError('Judul project video wajib diisi.');
      return;
    }
    if (items.length === 0) {
      setError('Tambahkan minimal 1 item jasa ke invoice.');
      return;
    }

    const selectedClient = clients.find((c) => c.id === selectedClientId);
    if (!selectedClient) {
      setError('Data klien tidak ditemukan.');
      return;
    }

    setIsSubmitting(true);
    try {
      let status = existingInvoice?.status || (asDraft ? 'draft' : 'sent');
      if (!asDraft) {
        if (outstandingAmount === 0) {
          status = 'paid';
        } else if (totalPaidOrDown > 0) {
          status = 'partially_paid';
        } else {
          status = 'sent';
        }
      }

      const invoiceData = {
        invoiceNumber,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        clientCompany: selectedClient.company || '',
        clientPhone: selectedClient.phone,
        clientEmail: selectedClient.email || '',
        clientAddress: selectedClient.address || '',
        clientNpwp: selectedClient.npwp || '',
        projectTitle: projectTitle.trim(),
        issueDate,
        dueDate,
        status,
        template,
        items,
        subtotal,
        discountType,
        discountValue,
        discountTotal,
        ppnEnabled,
        ppnRate,
        ppnAmount,
        grandTotal,
        paidAmount: totalPaidOrDown,
        outstandingAmount,
        downPayment,
        notes: notes.trim(),
        bankDetails: bankDetails.trim(),
        createdBy: userId,
      };

      let result: Invoice;
      if (existingInvoice) {
        await updateInvoice(business.id, existingInvoice.id, invoiceData);
        result = {
          ...existingInvoice,
          ...invoiceData,
          updatedAt: new Date().toISOString(),
        };
      } else {
        result = await createInvoice(business.id, invoiceData, business);
      }

      onSaveSuccess(result);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Gagal menyimpan invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmCancel = () => {
    if (confirm('Batalkan perubahan? Data invoice yang belum disimpan akan hilang.')) {
      onCancel();
    }
  };

  if (loadingInitial) {
    return <div className="py-12 text-center text-xs text-slate-500">Memuat formulir invoice...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-400" />
            <span>{existingInvoice ? 'Edit Tagihan Video' : 'Buat Invoice Video Baru'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Workspace: <strong className="text-white">{business.name}</strong> • Prefix: {business.invoicePrefix}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={confirmCancel}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => handleSaveInvoice(true)}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-slate-400" />
            <span>Simpan Draft</span>
          </button>
          <button
            type="button"
            onClick={() => handleSaveInvoice(false)}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Terbitkan Invoice</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Invoice Main Details & Line Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Client & Project Info */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-sky-400" /> Informasi Klien & Project Video
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Pilih Klien <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowQuickClientModal(true)}
                    className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Tambah Baru
                  </button>
                </div>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                >
                  <option value="">-- Pilih Klien / Brand --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''} - {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Judul Project Video <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="Contoh: Video Profil Perusahaan & Drone 4K"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nomor Invoice</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tanggal Terbit</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-2.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Jatuh Tempo</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-2.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Line Items Video Production */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-sky-400" /> Rincian Item Jasa Video & Alat
              </h3>

              {/* Quick Add from Service Catalog */}
              {services.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const srv = services.find((s) => s.id === e.target.value);
                        addItemFromService(srv);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="" disabled>
                      + Tambah dari Katalog Jasa
                    </option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({formatIDR(s.defaultPrice)}/{s.unit})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Items List (Mobile Cards & Desktop Table) */}
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3 transition"
                >
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center shrink-0 mt-1">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(index, { description: e.target.value })}
                        placeholder="Deskripsi jasa video, kru kamera, rental drone, atau editing..."
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition"
                      title="Hapus Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Jumlah (Qty)</label>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Satuan</label>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => updateItem(index, { unit: e.target.value })}
                        placeholder="shift / hari"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Tarif (IDR)</label>
                      <input
                        type="number"
                        min={0}
                        step={50000}
                        value={item.price}
                        onChange={(e) => updateItem(index, { price: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Subtotal Item</label>
                      <div className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800/60 text-xs font-bold text-sky-400 font-mono">
                        {formatIDR(item.amount)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => addItemFromService()}
              className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-slate-500 text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Baris Item Baru</span>
            </button>
          </div>

          {/* Section: Notes & Bank Instructions */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-sky-400" /> Catatan & Instruksi Pembayaran
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Instruksi Transfer Rekening
                </label>
                <textarea
                  rows={3}
                  value={bankDetails}
                  onChange={(e) => setBankDetails(e.target.value)}
                  placeholder="Nama Bank, Nomor Rekening, Atas Nama"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Catatan Tambahan untuk Klien
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Misal: Termasuk 2x revisi minor. File master dikirim setelah pelunasan."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Calculations, Tax & Template Preference */}
        <div className="space-y-6">
          {/* Summary Calculation Card */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 sticky top-20 shadow-xl">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Ringkasan Perhitungan
            </h3>

            {/* Subtotal */}
            <div className="flex justify-between text-xs text-slate-400">
              <span>Subtotal Item:</span>
              <span className="font-mono text-white font-semibold">{formatIDR(subtotal)}</span>
            </div>

            {/* Discount */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-semibold">Diskon / Potongan:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDiscountType('fixed')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      discountType === 'fixed' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Nominal
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      discountType === 'percent' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    %
                  </button>
                </div>
              </div>
              <input
                type="number"
                min={0}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                placeholder={discountType === 'percent' ? 'Persen diskon (contoh 10)' : 'Rp nominal'}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white font-mono"
              />
              {discountTotal > 0 && (
                <div className="flex justify-between text-[11px] text-rose-400">
                  <span>Potongan:</span>
                  <span>- {formatIDR(discountTotal)}</span>
                </div>
              )}
            </div>

            {/* PPN Switch */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-sky-400" /> PPN Indonesia
                  </span>
                  <span className="text-[10px] text-slate-400">Pajak Pertambahan Nilai</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPpnEnabled(!ppnEnabled)}
                  className={`w-10 h-5 rounded-full transition p-0.5 flex items-center ${
                    ppnEnabled ? 'bg-indigo-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              {ppnEnabled && (
                <div className="flex items-center justify-between pt-1">
                  <select
                    value={ppnRate}
                    onChange={(e) => setPpnRate(Number(e.target.value))}
                    className="px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    <option value={11}>Tarif 11%</option>
                    <option value={12}>Tarif 12%</option>
                  </select>
                  <span className="text-xs font-mono text-sky-400 font-semibold">
                    + {formatIDR(ppnAmount)}
                  </span>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
              <span className="text-sm font-bold text-white">Grand Total:</span>
              <span className="text-xl font-black text-white font-mono">{formatIDR(grandTotal)}</span>
            </div>

            {/* Down Payment (DP) */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Uang Muka / Down Payment (DP)
              </label>
              <input
                type="number"
                min={0}
                step={100000}
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value))}
                placeholder="Nominal DP jika ada"
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white font-mono"
              />
              {downPayment > 0 && (
                <span className="text-[10px] text-emerald-400 block">
                  DP Tercatat: {formatIDR(downPayment)}
                </span>
              )}
            </div>

            {/* Outstanding Balance */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-amber-300 block">Sisa Tagihan</span>
                <span className="text-[10px] text-amber-400/80">Outstanding Balance</span>
              </div>
              <span className="text-base font-black text-amber-300 font-mono">
                {formatIDR(outstandingAmount)}
              </span>
            </div>

            {/* Template Selector */}
            <div className="pt-3 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Pilih Gaya Desain Template PDF
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'corporate', label: 'Corporate' },
                  { id: 'minimalist', label: 'Minimalist' },
                  { id: 'creative', label: 'Creative' },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setTemplate(tpl.id as InvoiceTemplate)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition ${
                      template === tpl.id
                        ? 'border-indigo-500 bg-indigo-500/20 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Buttons */}
            <div className="pt-3 space-y-2">
              <button
                type="button"
                onClick={() => handleSaveInvoice(false)}
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 transition active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : 'Terbitkan & Buka Invoice'}
              </button>
              <button
                type="button"
                onClick={() => handleSaveInvoice(true)}
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Simpan Sebagai Draft
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Client Modal */}
      {showQuickClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white">Tambah Klien Cepat</h4>
              <button
                type="button"
                onClick={() => setShowQuickClientModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickClientCreate} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nama Klien / PIC <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Nama Lengkap"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Perusahaan / Brand</label>
                <input
                  type="text"
                  value={newClientCompany}
                  onChange={(e) => setNewClientCompany(e.target.value)}
                  placeholder="Nama Perusahaan"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  No. WhatsApp <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="08123456789"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Email</label>
                <input
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="email@klien.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickClientModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-xs text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-md shadow-indigo-600/30"
                >
                  Simpan & Pilih
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
