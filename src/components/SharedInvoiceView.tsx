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
          className="w-full bg-white text-slate-900 rounded-3xl shadow-2xl p-6 sm:p-10 font-sans border-t-8 border-indigo-600"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
            <div>
              {business.logoUrl ? (
                <img src={business.logoUrl} alt={business.name} className="h-12 w-auto mb-2" />
              ) : (
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{business.name}</h2>
              )}
              <p className="text-xs text-slate-500 font-medium">{business.address || 'Indonesia'}</p>
              <p className="text-xs text-slate-500">
                WA: {business.phone} {business.email ? `• ${business.email}` : ''}
              </p>
              {business.npwp && <p className="text-[11px] text-slate-400 mt-0.5">NPWP: {business.npwp}</p>}
            </div>

            <div className="text-left sm:text-right">
              <h1 className="text-2xl font-black text-indigo-600 tracking-tight">INVOICE RESMI</h1>
              <p className="text-sm font-mono font-bold text-slate-800 mt-0.5">{invoice.invoiceNumber}</p>
              <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                <div>Tanggal: {formatIndonesianDate(invoice.issueDate)}</div>
                <div>Jatuh Tempo: {formatIndonesianDate(invoice.dueDate)}</div>
              </div>
            </div>
          </div>

          {/* Client & Project */}
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
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Deskripsi Project:
              </span>
              <p className="text-sm font-bold text-slate-900">{invoice.projectTitle}</p>
              <div className="mt-2 inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border border-slate-300 bg-slate-50 text-slate-800 uppercase">
                Status: {invoice.status.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="py-5">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b bg-indigo-50/70 text-indigo-900 border-indigo-100 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Item / Layanan Video</th>
                  <th className="py-2.5 px-2 text-center">Qty</th>
                  <th className="py-2.5 px-2 text-center">Satuan</th>
                  <th className="py-2.5 px-3 text-right">Tarif</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="py-3 px-3 font-medium text-slate-900">{item.description}</td>
                    <td className="py-3 px-2 text-center font-mono text-slate-700">{item.quantity}</td>
                    <td className="py-3 px-2 text-center text-slate-500 capitalize">{item.unit}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">{formatIDR(item.price)}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatIDR(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total & Bank */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between gap-6 text-xs">
            <div className="space-y-3 max-w-sm">
              {business.bankAccountNumber && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                  <span className="text-[10px] uppercase font-bold text-indigo-900 tracking-wider block mb-1">
                    Instruksi Transfer Rekening:
                  </span>
                  <p className="font-bold text-slate-900">{business.bankName}</p>
                  <p className="text-sm font-mono font-extrabold text-indigo-700">
                    {business.bankAccountNumber}
                  </p>
                  <p className="text-slate-600 mt-0.5">a.n. {business.bankAccountHolder}</p>
                </div>
              )}

              {invoice.notes && (
                <p className="text-[11px] text-slate-500 leading-relaxed italic">
                  <strong>Catatan:</strong> {invoice.notes}
                </p>
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
                  <span>Terbayar:</span>
                  <span>- {formatIDR(invoice.paidAmount)}</span>
                </div>
              )}

              <div className="flex justify-between py-1.5 border-t border-slate-200 text-xs font-bold text-amber-700 bg-amber-50 px-2 rounded-lg">
                <span>Sisa Tagihan:</span>
                <span>{formatIDR(invoice.outstandingAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
