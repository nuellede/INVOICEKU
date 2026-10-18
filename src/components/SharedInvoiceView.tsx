import React, { useState, useEffect, useRef } from 'react';
import { getSharedInvoice } from '../services/db';
import { SharedInvoice, Invoice, Business } from '../types';
import { formatIDR, formatIndonesianDate } from '../utils/formatters';
import { downloadInvoicePdf } from '../utils/pdfGenerator';
import { FileText, Download, CheckCircle2, Building, AlertCircle } from 'lucide-react';

interface Props {
  token: string;
  onExit: () => void;
}

export const SharedInvoiceView: React.FC<Props> = ({ token, onExit }) => {
  const [data, setData] = useState<{ invoice: Invoice; business: Business } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchShared() {
      setLoading(true);
      setError(null);
      try {
        const shared = await getSharedInvoice(token);
        if (!shared || !shared.active) {
          setError('Tautan invoice ini sudah kedaluwarsa, dicabut, atau tidak valid.');
          return;
        }
        const parsed = JSON.parse(shared.invoiceData);
        setData(parsed);
      } catch (err) {
        console.error(err);
        setError('Gagal memuat invoice.');
      } finally {
        setLoading(false);
      }
    }
    fetchShared();
  }, [token]);

  const handleDownloadPdf = () => {
    if (!data) return;
    setIsGeneratingPdf(true);
    try {
      downloadInvoicePdf(data.invoice, data.business);
    } catch (e) {
      console.error(e);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Memuat rincian invoice resmi...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Invoice Tidak Dapat Ditemukan</h2>
          <p className="text-xs text-slate-400">{error || 'Tautan tidak valid.'}</p>
          <button
            onClick={onExit}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
          >
            Buka Beranda CineInvoice
          </button>
        </div>
      </div>
    );
  }

  const { invoice, business } = data;
  const isPaid = invoice.status === 'paid';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-6 px-4 selection:bg-indigo-500 selection:text-white">
      {/* Floating Action Bar */}
      <div className="max-w-2xl mx-auto mb-6 flex items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-white font-mono">{invoice.invoiceNumber}</span>
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
              isPaid
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            {isPaid ? 'LUNAS' : 'MENUNGGU PEMBAYARAN'}
          </span>
        </div>

        <button
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isGeneratingPdf ? 'Memproses...' : 'Download PDF'}</span>
        </button>
      </div>

      {/* Invoice Sheet Document */}
      <div className="max-w-2xl mx-auto flex justify-center">
        <div
          ref={printRef}
          className="w-full bg-white text-slate-900 rounded-3xl shadow-2xl p-6 sm:p-10 font-sans border-t-8 border-indigo-600 print-container"
        >
          {/* 1. Header Branding & Invoice Meta */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-5 pb-6 border-b border-slate-200">
            {/* Left: Business Profile */}
            <div className="text-left space-y-1 max-w-sm">
              {business.logoUrl ? (
                <img src={business.logoUrl} alt={business.name} className="h-12 w-auto object-contain mb-2" />
              ) : (
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm tracking-wider shadow-sm">
                    {business.name
                      ? business.name
                          .split(' ')
                          .map((w) => w[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : 'INV'}
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">{business.name}</h2>
                </div>
              )}
              {business.address && (
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{business.address}</p>
              )}
              <p className="text-xs text-slate-600">
                WhatsApp: <span className="font-semibold text-slate-800">{business.phone}</span>
                {business.email && <span> • {business.email}</span>}
              </p>
              {business.npwp && <p className="text-[11px] text-slate-400 font-mono">NPWP: {business.npwp}</p>}
            </div>

            {/* Right: Invoice Meta Box (All Left-Aligned Inside!) */}
            <div className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-black tracking-tight text-indigo-600">INVOICE</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isPaid
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  }`}
                >
                  {isPaid ? 'LUNAS' : 'BELUM LUNAS'}
                </span>
              </div>

              <div className="border-t border-slate-200 pt-2 space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>No. Faktur:</span>
                  <span className="font-mono font-bold text-slate-900">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Tanggal Terbit:</span>
                  <span className="font-medium text-slate-800">{formatIndonesianDate(invoice.issueDate)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Jatuh Tempo:</span>
                  <span className="font-bold text-rose-700">{formatIndonesianDate(invoice.dueDate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Client & Project Details (2 Balanced Left-Aligned Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-slate-200 text-xs text-left">
            {/* Card 1: Ditagihkan Kepada */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Ditagihkan Kepada:
              </span>
              <h4 className="text-sm font-bold text-slate-950">{invoice.clientName}</h4>
              {invoice.clientCompany && (
                <p className="font-semibold text-slate-700">{invoice.clientCompany}</p>
              )}
              <p className="text-slate-600">
                WhatsApp: {invoice.clientPhone}
                {invoice.clientEmail && ` • ${invoice.clientEmail}`}
              </p>
              {invoice.clientAddress && (
                <p className="text-slate-500 leading-relaxed pt-0.5">{invoice.clientAddress}</p>
              )}
              {invoice.clientNpwp && (
                <p className="text-slate-400 font-mono text-[11px]">NPWP: {invoice.clientNpwp}</p>
              )}
            </div>

            {/* Card 2: Rincian Proyek (All Left-Aligned) */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Rincian Proyek Video:
              </span>
              <h4 className="text-sm font-bold text-slate-950 leading-snug">{invoice.projectTitle}</h4>
              <p className="text-slate-600 text-[11px] pt-1">
                Kategori: Layanan Video Production & Kreatif
              </p>
              <p className="text-slate-500 text-[11px]">
                Batas Pelunasan: {formatIndonesianDate(invoice.dueDate)}
              </p>
            </div>
          </div>

          {/* 3. Line items */}
          <div className="py-5">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b bg-indigo-50/80 text-indigo-950 border-indigo-100 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 text-left">Item / Layanan Video</th>
                  <th className="py-3 px-2 text-center">Qty</th>
                  <th className="py-3 px-2 text-center">Satuan</th>
                  <th className="py-3 px-4 text-right">Tarif Satuan</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items.map((item, idx) => (
                  <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-3 px-4 font-medium text-slate-900 text-left">{item.description}</td>
                    <td className="py-3 px-2 text-center font-mono text-slate-700">{item.quantity}</td>
                    <td className="py-3 px-2 text-center text-slate-500 capitalize">{item.unit}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">{formatIDR(item.price)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatIDR(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 4. Total & Bank Instructions */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between gap-6 text-xs text-left">
            <div className="space-y-3 max-w-sm flex-1">
              {business.bankAccountNumber && (
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-900 tracking-wider block mb-1">
                    Instruksi Transfer Rekening:
                  </span>
                  <p className="font-bold text-slate-900">{business.bankName}</p>
                  <p className="text-base font-mono font-extrabold text-indigo-700">
                    {business.bankAccountNumber}
                  </p>
                  <p className="text-slate-600 text-xs">a.n. {business.bankAccountHolder}</p>
                </div>
              )}

              {invoice.notes && (
                <p className="text-[11px] text-slate-500 leading-relaxed italic p-2 bg-slate-50/50 rounded-xl">
                  <strong>Catatan:</strong> {invoice.notes}
                </p>
              )}
            </div>

            <div className="w-full sm:w-72 space-y-1.5 font-mono text-xs">
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

              <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-900 text-white text-sm font-black shadow-sm mt-1">
                <span>Grand Total:</span>
                <span>{formatIDR(invoice.grandTotal)}</span>
              </div>

              {invoice.paidAmount > 0 && (
                <div className="flex justify-between py-1 text-emerald-600 font-semibold px-1">
                  <span>Terbayar:</span>
                  <span>- {formatIDR(invoice.paidAmount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between py-2 px-3 border border-amber-200 text-xs font-bold text-amber-800 bg-amber-50 rounded-xl mt-1">
                <span>Sisa Tagihan:</span>
                <span className="font-mono text-sm">{formatIDR(invoice.outstandingAmount)}</span>
              </div>
            </div>
          </div>

          {/* 5. Official Closing & Signature */}
          <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 text-xs text-slate-600">
            <div className="text-left">
              <p className="text-xs text-slate-500">
                Terima kasih atas kerja sama dan kepercayaan Anda.
              </p>
            </div>
            <div className="text-center sm:text-right w-full sm:w-48">
              <p className="font-medium text-slate-700 mb-12">Hormat Kami,</p>
              <div className="border-b border-slate-400 mb-1.5 w-36 ml-auto" />
              <p className="font-bold text-slate-900">{business.name}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
