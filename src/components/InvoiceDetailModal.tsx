import React, { useState, useRef } from 'react';
import { Invoice, Business, Payment } from '../types';
import { recordPayment, createSharedInvoice, revokeSharedInvoice, getPayments } from '../services/db';
import {
  formatIDR,
  formatIndonesianDate,
  cleanWhatsAppNumber,
  buildWhatsAppInvoiceMessage,
} from '../utils/formatters';
import {
  FileText,
  Download,
  Share2,
  MessageCircle,
  CreditCard,
  X,
  Printer,
  Copy,
  Check,
  Building,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  Lock,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

interface Props {
  invoice: Invoice;
  business: Business;
  userId: string;
  onClose: () => void;
  onInvoiceUpdated: (updated: Invoice) => void;
  onEditInvoice: () => void;
}

export const InvoiceDetailModal: React.FC<Props> = ({
  invoice,
  business,
  userId,
  onClose,
  onInvoiceUpdated,
  onEditInvoice,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'payments' | 'share'>('preview');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(invoice.shareToken || null);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Payments State
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(invoice.outstandingAmount);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Transfer BCA');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  const invoicePrintRef = useRef<HTMLDivElement>(null);

  const loadPayments = async () => {
    try {
      const data = await getPayments(business.id, invoice.id);
      setPayments(data);
      setPaymentsLoaded(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenPaymentsTab = () => {
    setActiveTab('payments');
    if (!paymentsLoaded) loadPayments();
  };

  // Status Badge
  const statusConfig = {
    draft: { label: 'DRAFT', bg: 'bg-slate-700/60 text-slate-300 border-slate-600' },
    sent: { label: 'TERKIRIM', bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    partially_paid: { label: 'SEBAGIAN DIBAYAR', bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    paid: { label: 'LUNAS', bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    overdue: { label: 'JATUH TEMPO', bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
    cancelled: { label: 'DIBATALKAN', bg: 'bg-slate-800 text-slate-500 border-slate-700' },
  };

  // PDF Export
  const handleDownloadPdf = async () => {
    if (!invoicePrintRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(invoicePrintRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${invoice.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
    } catch (error) {
      console.error('PDF generation error', error);
      alert('Gagal membuat PDF. Silakan gunakan fungsi cetak browser.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Excel Export
  const handleExportExcel = () => {
    const rows = [
      ['INVOICE VIDEO PRODUCTION', ''],
      ['No. Invoice', invoice.invoiceNumber],
      ['Judul Project', invoice.projectTitle],
      ['Status', invoice.status.toUpperCase()],
      ['Tanggal Terbit', invoice.issueDate],
      ['Jatuh Tempo', invoice.dueDate],
      ['', ''],
      ['DARI (PENYEDIA JASA)', ''],
      ['Nama Bisnis', business.name],
      ['Telepon / WA', business.phone],
      ['Email', business.email],
      ['Alamat', business.address],
      ['Rekening Pembayaran', `${business.bankName} - ${business.bankAccountNumber} a.n. ${business.bankAccountHolder}`],
      ['', ''],
      ['KEPADA (KLIEN)', ''],
      ['Nama Klien', invoice.clientName],
      ['Perusahaan', invoice.clientCompany || '-'],
      ['No. Telp / WA', invoice.clientPhone],
      ['Email', invoice.clientEmail || '-'],
      ['', ''],
      ['RINCIAN ITEM JASA', 'JUMLAH', 'SATUAN', 'TARIF (IDR)', 'SUBTOTAL (IDR)'],
      ...invoice.items.map((item) => [
        item.description,
        item.quantity,
        item.unit,
        item.price,
        item.amount,
      ]),
      ['', '', '', '', ''],
      ['Subtotal Item', '', '', '', invoice.subtotal],
      ['Diskon / Potongan', '', '', '', -invoice.discountTotal],
      [`PPN (${invoice.ppnRate || 11}%)`, '', '', '', invoice.ppnAmount],
      ['GRAND TOTAL', '', '', '', invoice.grandTotal],
      ['Down Payment (DP)', '', '', '', invoice.downPayment || 0],
      ['Total Terbayar', '', '', '', invoice.paidAmount || 0],
      ['SISA TAGIHAN (OUTSTANDING)', '', '', '', invoice.outstandingAmount],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoice');
    XLSX.writeFile(wb, `Invoice_${invoice.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`);
  };

  // WhatsApp Billing Link
  const shareLinkUrl = shareToken
    ? `${window.location.origin}?token=${shareToken}`
    : undefined;
  const waMessage = buildWhatsAppInvoiceMessage(invoice, business, shareLinkUrl);
  const waCleanPhone = cleanWhatsAppNumber(invoice.clientPhone);
  const waDirectUrl = `https://wa.me/${waCleanPhone}?text=${encodeURIComponent(waMessage)}`;

  // Generate / Revoke Share Token
  const handleGenerateShareLink = async () => {
    setIsGeneratingShare(true);
    try {
      const token = await createSharedInvoice(business, invoice);
      setShareToken(token);
      onInvoiceUpdated({ ...invoice, shareToken: token });
    } catch (e) {
      console.error(e);
      alert('Gagal membuat tautan share publik.');
    } finally {
      setIsGeneratingShare(false);
    }
  };

  const handleRevokeShareLink = async () => {
    if (!shareToken) return;
    if (confirm('Cabut tautan ini? Klien tidak akan dapat lagi membuka invoice melalui tautan sebelumnya.')) {
      try {
        await revokeSharedInvoice(shareToken);
        setShareToken(null);
        onInvoiceUpdated({ ...invoice, shareToken: undefined });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const copyShareLink = () => {
    if (!shareLinkUrl) return;
    navigator.clipboard.writeText(shareLinkUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Record Payment
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) {
      alert('Nominal pembayaran harus lebih dari 0.');
      return;
    }
    setIsRecordingPayment(true);
    try {
      const pmt = await recordPayment(
        business.id,
        invoice,
        {
          amount: Number(paymentAmount),
          date: paymentDate,
          method: paymentMethod,
          reference: paymentReference,
          notes: paymentNotes,
        },
        userId
      );

      const newPaid = (invoice.paidAmount || 0) + Number(paymentAmount);
      const newOutstanding = Math.max(0, invoice.grandTotal - newPaid);
      const newStatus = newOutstanding <= 0 ? 'paid' : 'partially_paid';

      const updated = {
        ...invoice,
        paidAmount: newPaid,
        outstandingAmount: newOutstanding,
        status: newStatus as Invoice['status'],
      };

      setPayments([pmt, ...payments]);
      setShowPaymentModal(false);
      onInvoiceUpdated(updated);
    } catch (err) {
      console.error(err);
      alert('Gagal mencatat pembayaran.');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl my-4 sm:my-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Modal Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white font-mono">{invoice.invoiceNumber}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    statusConfig[invoice.status].bg
                  }`}
                >
                  {statusConfig[invoice.status].label}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">{invoice.projectTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Quick action buttons */}
            <a
              href={waDirectUrl}
              target="_blank"
              rel="noreferrer"
              title="Kirim ke WhatsApp Klien"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              title="Download PDF Invoice"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isGeneratingPdf ? 'Membuat PDF...' : 'PDF'}</span>
            </button>

            <button
              onClick={handleExportExcel}
              title="Export ke Excel (.xlsx)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-semibold transition active:scale-95"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-800 bg-slate-950/40 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-3 px-3 border-b-2 transition ${
              activeTab === 'preview'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Preview Invoice ({invoice.template})
          </button>
          <button
            onClick={handleOpenPaymentsTab}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'payments'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Pembayaran ({invoice.status === 'paid' ? 'Lunas' : formatIDR(invoice.outstandingAmount)})</span>
          </button>
          <button
            onClick={() => setActiveTab('share')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'share'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Tautan Publik (Share Link)</span>
          </button>

          <button
            onClick={onEditInvoice}
            className="ml-auto text-xs text-sky-400 hover:underline py-3 px-2 font-medium"
          >
            Edit Invoice Ini
          </button>
        </div>

        {/* Tab Contents (Scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-950/80">
          {/* TAB 1: PREVIEW INVOICE WITH 3 TEMPLATES */}
          {activeTab === 'preview' && (
            <div className="flex justify-center">
              {/* Paper Printable Sheet Container */}
              <div
                ref={invoicePrintRef}
                className={`w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-10 font-sans transition-all ${
                  invoice.template === 'corporate'
                    ? 'border-t-8 border-t-slate-900'
                    : invoice.template === 'creative'
                    ? 'border-t-8 border-t-indigo-600'
                    : 'border-t-4 border-t-slate-400'
                }`}
                style={{ minHeight: '800px' }}
              >
                {/* 1. HEADER BRANDING */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
                  <div>
                    {business.logoUrl ? (
                      <img
                        src={business.logoUrl}
                        alt={business.name}
                        className="h-12 w-auto object-contain mb-2"
                      />
                    ) : (
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm ${
                            invoice.template === 'creative'
                              ? 'bg-indigo-600'
                              : invoice.template === 'corporate'
                              ? 'bg-slate-900'
                              : 'bg-slate-700'
                          }`}
                        >
                          CI
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">
                          {business.name}
                        </h2>
                      </div>
                    )}
                    <p className="text-xs text-slate-500 font-medium">{business.address || 'Indonesia'}</p>
                    <p className="text-xs text-slate-500">
                      WA: {business.phone} {business.email ? `• ${business.email}` : ''}
                    </p>
                    {business.npwp && (
                      <p className="text-[11px] text-slate-400 mt-0.5">NPWP: {business.npwp}</p>
                    )}
                  </div>

                  <div className="text-left sm:text-right">
                    <h1
                      className={`text-2xl font-black tracking-tight ${
                        invoice.template === 'creative'
                          ? 'text-indigo-600'
                          : invoice.template === 'corporate'
                          ? 'text-slate-900'
                          : 'text-slate-800'
                      }`}
                    >
                      INVOICE
                    </h1>
                    <p className="text-sm font-mono font-bold text-slate-800 mt-0.5">
                      {invoice.invoiceNumber}
                    </p>
                    <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                      <div>
                        Tanggal: <strong>{formatIndonesianDate(invoice.issueDate)}</strong>
                      </div>
                      <div>
                        Jatuh Tempo: <strong>{formatIndonesianDate(invoice.dueDate)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. BILLED TO & PROJECT TITLE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                      Ditagihkan Kepada:
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{invoice.clientName}</h4>
                    {invoice.clientCompany && (
                      <p className="font-semibold text-slate-700 mt-0.5">{invoice.clientCompany}</p>
                    )}
                    {invoice.clientPhone && <p className="text-slate-500 mt-0.5">{invoice.clientPhone}</p>}
                    {invoice.clientAddress && (
                      <p className="text-slate-500 mt-0.5 leading-relaxed">{invoice.clientAddress}</p>
                    )}
                    {invoice.clientNpwp && (
                      <p className="text-slate-400 mt-0.5">NPWP: {invoice.clientNpwp}</p>
                    )}
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                      Deskripsi Project Video:
                    </span>
                    <p className="text-sm font-bold text-slate-900">{invoice.projectTitle}</p>
                    <div className="mt-2 inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border border-slate-300 bg-slate-50 text-slate-800 uppercase">
                      Status: {statusConfig[invoice.status].label}
                    </div>
                  </div>
                </div>

                {/* 3. LINE ITEMS TABLE */}
                <div className="py-5">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr
                        className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                          invoice.template === 'creative'
                            ? 'bg-indigo-50/70 text-indigo-900 border-indigo-100'
                            : invoice.template === 'corporate'
                            ? 'bg-slate-100 text-slate-800 border-slate-300'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        <th className="py-2.5 px-3">Item / Layanan</th>
                        <th className="py-2.5 px-2 text-center">Qty</th>
                        <th className="py-2.5 px-2 text-center">Satuan</th>
                        <th className="py-2.5 px-3 text-right">Tarif</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoice.items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="py-3 px-3 font-medium text-slate-900">
                            {item.description}
                          </td>
                          <td className="py-3 px-2 text-center font-mono text-slate-700">
                            {item.quantity}
                          </td>
                          <td className="py-3 px-2 text-center text-slate-500 capitalize">
                            {item.unit}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-700">
                            {formatIDR(item.price)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                            {formatIDR(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 4. TOTALS & SUMMARY */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between gap-6 text-xs">
                  <div className="space-y-3 max-w-sm">
                    {invoice.bankDetails && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                          Instruksi Rekening Pembayaran:
                        </span>
                        <p className="text-slate-700 whitespace-pre-line text-xs font-medium">
                          {invoice.bankDetails}
                        </p>
                      </div>
                    )}

                    {invoice.notes && (
                      <div className="text-[11px] text-slate-500 leading-relaxed">
                        <strong className="text-slate-700">Catatan:</strong> {invoice.notes}
                      </div>
                    )}
                  </div>

                  <div className="w-full sm:w-64 space-y-1.5 text-right font-mono text-xs">
                    <div className="flex justify-between py-1 text-slate-600">
                      <span>Subtotal:</span>
                      <span>{formatIDR(invoice.subtotal)}</span>
                    </div>

                    {invoice.discountTotal > 0 && (
                      <div className="flex justify-between py-1 text-rose-600">
                        <span>Diskon:</span>
                        <span>- {formatIDR(invoice.discountTotal)}</span>
                      </div>
                    )}

                    {invoice.ppnEnabled && (
                      <div className="flex justify-between py-1 text-slate-600">
                        <span>PPN ({invoice.ppnRate || 11}%):</span>
                        <span>+ {formatIDR(invoice.ppnAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between py-2 border-t-2 border-slate-800 text-sm font-black text-slate-900">
                      <span>Grand Total:</span>
                      <span>{formatIDR(invoice.grandTotal)}</span>
                    </div>

                    {invoice.paidAmount > 0 && (
                      <div className="flex justify-between py-1 text-emerald-600 font-semibold">
                        <span>Sudah Dibayar:</span>
                        <span>- {formatIDR(invoice.paidAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between py-1.5 border-t border-slate-200 text-xs font-bold text-amber-700 bg-amber-50 px-2 rounded-lg">
                      <span>Sisa Tagihan:</span>
                      <span>{formatIDR(invoice.outstandingAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* 5. FORMAL STAMP & SIGNATURE (FOR CORPORATE TEMPLATE) */}
                {invoice.template === 'corporate' && (
                  <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-600">
                    <div>
                      <p className="text-[10px] text-slate-400">Dibuat secara elektronik melalui CineInvoice SaaS.</p>
                    </div>
                    <div className="text-center w-40">
                      <p className="mb-14 font-semibold text-slate-800">Hormat Kami,</p>
                      <div className="border-b border-slate-400 mb-1" />
                      <p className="font-bold text-slate-900">{business.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PAYMENT HISTORY & RECORDING */}
          {activeTab === 'payments' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div>
                  <span className="text-xs text-slate-400">Sisa Tagihan Saat Ini:</span>
                  <p className="text-xl font-black text-amber-400 font-mono">
                    {formatIDR(invoice.outstandingAmount)}
                  </p>
                </div>
                {invoice.outstandingAmount > 0 && (
                  <button
                    onClick={() => {
                      setPaymentAmount(invoice.outstandingAmount);
                      setShowPaymentModal(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition active:scale-95"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Catat Pembayaran Baru</span>
                  </button>
                )}
              </div>

              {/* Payment Records List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Riwayat Pembayaran Klien
                </h4>
                {payments.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-500">
                    Belum ada bukti pembayaran dicatat untuk invoice ini.
                  </div>
                ) : (
                  payments.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white font-mono">
                            {formatIDR(p.amount)}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {p.method}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Tanggal: {formatIndonesianDate(p.date)}{' '}
                          {p.reference ? `• Ref: ${p.reference}` : ''}
                        </p>
                        {p.notes && <p className="text-xs text-slate-500 mt-0.5">{p.notes}</p>}
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SECURE PUBLIC SHARING */}
          {activeTab === 'share' && (
            <div className="space-y-6 max-w-xl mx-auto p-4 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Private & Secure Invoice Link</h4>
                  <p className="text-xs text-slate-400">
                    Klien dapat melihat invoice dan download PDF tanpa login dashboard.
                  </p>
                </div>
              </div>

              {shareToken ? (
                <div className="space-y-4 pt-2">
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      Tautan Aktif (Unguessable Token):
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={shareLinkUrl}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-indigo-300 font-mono select-all focus:outline-none"
                      />
                      <button
                        onClick={copyShareLink}
                        className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shrink-0 flex items-center gap-1.5 transition active:scale-95"
                      >
                        {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedLink ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <a
                      href={shareLinkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Buka Tautan Klien</span>
                    </a>
                    <button
                      onClick={handleRevokeShareLink}
                      className="text-rose-400 hover:underline font-semibold"
                    >
                      Cabut / Nonaktifkan Tautan
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-400 mb-4">
                    Belum ada tautan aktif. Klik tombol di bawah untuk membuat link share aman bagi klien ini.
                  </p>
                  <button
                    onClick={handleGenerateShareLink}
                    disabled={isGeneratingShare}
                    className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50"
                  >
                    {isGeneratingShare ? 'Membuat Tautan...' : 'Buat Tautan Share Sekarang'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Record Payment Sub-Dialog */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Catat Pembayaran Klien</span>
                </h4>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSavePayment} className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Jumlah Pembayaran (IDR)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Sisa tagihan: {formatIDR(invoice.outstandingAmount)}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Tanggal Bayar
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="Transfer BCA">Transfer BCA</option>
                    <option value="Transfer Mandiri">Transfer Bank Mandiri</option>
                    <option value="Transfer BRI">Transfer BRI</option>
                    <option value="Transfer BNI">Transfer BNI</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Cash / Tunai">Cash / Tunai</option>
                    <option value="Giro / Cek">Giro / Cek</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    No. Referensi / Bukti Transfer
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Contoh: REF987123 / No. Struk"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Catatan Pembayaran
                  </label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Misal: Pelunasan termin 2"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-xs text-slate-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isRecordingPayment}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-600/30 disabled:opacity-50"
                  >
                    {isRecordingPayment ? 'Mencatat...' : 'Simpan Pembayaran'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
