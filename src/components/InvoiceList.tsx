import React, { useState, useEffect } from 'react';
import { Invoice, Business } from '../types';
import { getInvoices, getAllUserInvoices, deleteInvoice } from '../services/db';
import {
  formatIDR,
  formatIndonesianDate,
  cleanWhatsAppNumber,
  buildWhatsAppInvoiceMessage,
} from '../utils/formatters';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CreditCard,
  MessageCircle,
  Download,
  Trash2,
  Edit2,
  Eye,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Building,
  Database,
  Layers,
} from 'lucide-react';

interface Props {
  business: Business;
  userId?: string;
  onOpenCreate: () => void;
  onOpenDetail: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
}

export const InvoiceList: React.FC<Props> = ({
  business,
  userId,
  onOpenCreate,
  onOpenDetail,
  onEditInvoice,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewScope, setViewScope] = useState<'workspace' | 'all'>('workspace');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      if (viewScope === 'all' && userId) {
        const data = await getAllUserInvoices(userId);
        setInvoices(data);
      } else {
        const data = await getInvoices(business.id);
        if (data.length === 0 && userId) {
          const allUserInvs = await getAllUserInvoices(userId);
          if (allUserInvs.length > 0) {
            setViewScope('all');
            setInvoices(allUserInvs);
            return;
          }
        }
        setInvoices(data);
      }
    } catch (e) {
      console.error('Failed to load invoices', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [business.id, viewScope, userId]);

  const handleDelete = async (invoice: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Hapus invoice ${invoice.invoiceNumber}? Tindakan ini tidak dapat dibatalkan.`)) {
      try {
        await deleteInvoice(business.id, invoice.id);
        await fetchInvoices();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const statusConfig = {
    draft: { label: 'Draft', bg: 'bg-slate-700/50 text-slate-300 border-slate-600' },
    sent: { label: 'Terkirim', bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    partially_paid: { label: 'Sebagian', bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    paid: { label: 'Lunas', bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    overdue: { label: 'Jatuh Tempo', bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
    cancelled: { label: 'Dibatalkan', bg: 'bg-slate-800 text-slate-500 border-slate-700' },
  };

  // Calculations for dashboard summary cards
  const totalInvoiced = invoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
  const totalOutstanding = invoices.reduce((acc, inv) => acc + (inv.outstandingAmount || 0), 0);
  const overdueCount = invoices.filter((inv) => {
    if (inv.status === 'paid' || inv.status === 'cancelled') return false;
    return new Date(inv.dueDate) < new Date();
  }).length;

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.projectTitle.toLowerCase().includes(search.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
      (inv.clientCompany && inv.clientCompany.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'overdue') {
      return (
        inv.status !== 'paid' &&
        inv.status !== 'cancelled' &&
        new Date(inv.dueDate) < new Date()
      );
    }
    return inv.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Nilai Invoice
          </span>
          <p className="text-lg sm:text-xl font-black text-white mt-1 font-mono">
            {formatIDR(totalInvoiced)}
          </p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">{invoices.length} Dokumen Total</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Kas Masuk (Terbayar)
          </span>
          <p className="text-lg sm:text-xl font-black text-emerald-400 mt-1 font-mono">
            {formatIDR(totalPaid)}
          </p>
          <span className="text-[10px] text-emerald-500/80 mt-0.5 block">
            {totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0}% Terkumpul
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Sisa Piutang Klien
          </span>
          <p className="text-lg sm:text-xl font-black text-amber-400 mt-1 font-mono">
            {formatIDR(totalOutstanding)}
          </p>
          <span className="text-[10px] text-amber-500/80 mt-0.5 block">Outstanding Receivables</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Invoice Lewat Tempo
          </span>
          <p className="text-lg sm:text-xl font-black text-rose-400 mt-1 font-mono">
            {overdueCount} <span className="text-xs font-normal text-slate-400">Invoice</span>
          </p>
          <span className="text-[10px] text-rose-400/80 mt-0.5 block">Perlu Follow-up WhatsApp</span>
        </div>
      </div>

      {/* Action Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-400" />
            <span>Daftar Tagihan & Invoice Video</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola status penerbitan, penagihan WhatsApp, dan rekonsiliasi pembayaran klien.
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Invoice Baru</span>
        </button>
      </div>

      {/* Scope Selector & Database Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setViewScope('workspace')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              viewScope === 'workspace'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Workspace: {business.name}</span>
          </button>
          {userId && (
            <button
              type="button"
              onClick={() => setViewScope('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                viewScope === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Semua Invoice Saya</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full w-fit">
          <Database className="w-3.5 h-3.5" />
          <span>{invoices.length} Dokumen Invoice Tersimpan</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'draft', label: 'Draft' },
            { id: 'sent', label: 'Terkirim' },
            { id: 'partially_paid', label: 'Sebagian' },
            { id: 'paid', label: 'Lunas' },
            { id: 'overdue', label: 'Jatuh Tempo' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition ${
                statusFilter === tab.id
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari no. invoice, project, klien..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-white placeholder-slate-500"
          />
        </div>
      </div>

      {/* Invoices List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">Memuat data invoice...</div>
      ) : filteredInvoices.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 p-8">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Belum Ada Invoice yang Dibuat</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Mulai buat invoice video pertama Anda dengan kalkulasi otomatis PPN 11%/12%, opsi DP, dan template PDF profesional.
          </p>
          <button
            onClick={onOpenCreate}
            className="mt-5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
          >
            Buat Invoice Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((inv) => {
            const isOverdue =
              inv.status !== 'paid' &&
              inv.status !== 'cancelled' &&
              new Date(inv.dueDate) < new Date();

            const waMsg = buildWhatsAppInvoiceMessage(inv, business);
            const waClean = cleanWhatsAppNumber(inv.clientPhone);
            const waUrl = `https://wa.me/${waClean}?text=${encodeURIComponent(waMsg)}`;

            return (
              <div
                key={inv.id}
                onClick={() => onOpenDetail(inv)}
                className="group cursor-pointer rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/90 p-4 sm:p-5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left: Invoice info */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <FileText className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-white group-hover:text-sky-400 transition">
                        {inv.invoiceNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          statusConfig[inv.status].bg
                        }`}
                      >
                        {statusConfig[inv.status].label}
                      </span>
                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Terlambat
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-200 mt-1">{inv.projectTitle}</h4>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                      <span className="font-semibold text-slate-300">{inv.clientName}</span>
                      {inv.clientCompany && <span>• {inv.clientCompany}</span>}
                      <span>• Jatuh Tempo: {formatIndonesianDate(inv.dueDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Amounts & Quick Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800/80">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                      Total Invoice
                    </span>
                    <p className="text-base font-black text-white font-mono">{formatIDR(inv.grandTotal)}</p>
                    {inv.outstandingAmount > 0 ? (
                      <span className="text-[10px] text-amber-400 block font-mono">
                        Sisa: {formatIDR(inv.outstandingAmount)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 block font-semibold">Lunas</span>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Kirim Pesan WhatsApp Tagihan"
                      className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white transition active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => onEditInvoice(inv)}
                      title="Edit Invoice"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => handleDelete(inv, e)}
                      title="Hapus Invoice"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
