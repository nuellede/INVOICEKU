import React, { useState, useEffect } from 'react';
import { Invoice, Business, Payment } from '../types';
import { getInvoices, getPayments } from '../services/db';
import { formatIDR, formatIndonesianDate } from '../utils/formatters';
import {
  BarChart3,
  TrendingUp,
  Percent,
  CreditCard,
  Calendar,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Building,
  CheckCircle2,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  business: Business;
}

export const FinancialReports: React.FC<Props> = ({ business }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [invs, pmts] = await Promise.all([
          getInvoices(business.id),
          getPayments(business.id),
        ]);
        setInvoices(invs);
        setPayments(pmts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [business.id]);

  // Aggregate metrics
  const totalInvoiced = invoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
  const totalOutstanding = invoices.reduce((acc, inv) => acc + (inv.outstandingAmount || 0), 0);
  const totalPpnCollected = invoices.reduce((acc, inv) => acc + (inv.ppnAmount || 0), 0);
  const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

  // Monthly breakdown for selected year
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const monthlyData = months.map((m, idx) => {
    const monthNum = idx; // 0 to 11
    const monthInvoices = invoices.filter((inv) => {
      const d = new Date(inv.issueDate);
      return d.getFullYear() === selectedYear && d.getMonth() === monthNum;
    });

    const invoiced = monthInvoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
    const paid = monthInvoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
    const ppn = monthInvoices.reduce((acc, inv) => acc + (inv.ppnAmount || 0), 0);

    return {
      month: m,
      count: monthInvoices.length,
      invoiced,
      paid,
      ppn,
    };
  });

  const maxMonthlyInvoiced = Math.max(...monthlyData.map((m) => m.invoiced), 1);

  // Top clients by invoiced volume
  const clientRevenueMap: Record<string, { name: string; total: number; count: number }> = {};
  invoices.forEach((inv) => {
    const key = inv.clientName || 'Unknown';
    if (!clientRevenueMap[key]) {
      clientRevenueMap[key] = { name: key, total: 0, count: 0 };
    }
    clientRevenueMap[key].total += inv.grandTotal || 0;
    clientRevenueMap[key].count += 1;
  });

  const topClients = Object.values(clientRevenueMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Export Complete Financial Ledger to Excel
  const handleExportFullLedger = () => {
    const invRows = [
      ['BUKU BESAR INVOICE & PAJAK', ''],
      ['Nama Bisnis', business.name],
      ['Tahun', selectedYear],
      ['', ''],
      ['NO. INVOICE', 'TANGGAL', 'KLIEN', 'PROJECT', 'SUBTOTAL', 'DISKON', 'PPN', 'GRAND TOTAL', 'TERBAYAR', 'SISA TAGIHAN', 'STATUS'],
      ...invoices.map((inv) => [
        inv.invoiceNumber,
        inv.issueDate,
        inv.clientName,
        inv.projectTitle,
        inv.subtotal,
        inv.discountTotal,
        inv.ppnAmount,
        inv.grandTotal,
        inv.paidAmount,
        inv.outstandingAmount,
        inv.status,
      ]),
    ];

    const pmtRows = [
      ['', ''],
      ['RIWAYAT PEMBAYARAN KAS MASUK', ''],
      ['NO. INVOICE', 'TANGGAL BAYAR', 'METODE', 'NOMINAL (IDR)', 'REFERENSI', 'CATATAN'],
      ...payments.map((p) => [
        p.invoiceNumber,
        p.date,
        p.method,
        p.amount,
        p.reference || '-',
        p.notes || '-',
      ]),
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(invRows);
    const ws2 = XLSX.utils.aoa_to_sheet(pmtRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, 'Daftar Invoice');
    XLSX.utils.book_append_sheet(wb, ws2, 'Kas Masuk');
    XLSX.writeFile(wb, `Laporan_Keuangan_${business.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${selectedYear}.xlsx`);
  };

  if (loading) {
    return <div className="py-16 text-center text-xs text-slate-500">Menghitung laporan finansial...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            <span>Laporan Finansial & Kas Masuk</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Analisis arus kas tagihan video production, pelunasan klien, dan rekapitulasi pajak PPN.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white focus:outline-none"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                Tahun {y}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportFullLedger}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition active:scale-95 shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel Lengkap</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Omzet Invoice
            </span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2 font-mono">{formatIDR(totalInvoiced)}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Dari {invoices.length} project video</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Kas Terealisasi
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">{formatIDR(totalPaid)}</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${collectionRate}%` }} />
            </div>
            <span className="text-[11px] font-bold text-emerald-400">{collectionRate}%</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Piutang Belum Lunas
            </span>
            <CreditCard className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2 font-mono">{formatIDR(totalOutstanding)}</p>
          <span className="text-[11px] text-amber-400/80 mt-1 block">Sisa piutang berjalan</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total PPN Terkumpul
            </span>
            <Percent className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-sky-400 mt-2 font-mono">{formatIDR(totalPpnCollected)}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Untuk laporan SPT Tahunan UMKM</span>
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Trend Pendapatan Bulanan ({selectedYear})</h3>
            <p className="text-xs text-slate-400">Total nominal invoice dan penerimaan kas per bulan</p>
          </div>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-6 items-end h-56 border-b border-slate-800 pb-2">
          {monthlyData.map((m, idx) => {
            const heightPct = Math.round((m.invoiced / maxMonthlyInvoiced) * 100);
            return (
              <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end group relative">
                {/* Tooltip on hover */}
                <div className="absolute -top-12 z-20 hidden group-hover:block bg-slate-950 border border-slate-700 text-white text-[10px] p-2 rounded-xl whitespace-nowrap shadow-xl">
                  <div className="font-bold">{m.month}</div>
                  <div>Invoice: {formatIDR(m.invoiced)}</div>
                  <div className="text-emerald-400">Kas: {formatIDR(m.paid)}</div>
                </div>

                <div className="w-full max-w-[28px] bg-slate-800/80 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                  <div
                    className="w-full bg-gradient-to-t from-indigo-600 to-sky-400 rounded-t-lg transition-all duration-300 group-hover:brightness-125"
                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 uppercase font-mono">
                  {m.month.slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Clients Ranking */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white">Top 5 Klien Kontributor Revenue</h3>
          <p className="text-xs text-slate-400">Klien dengan total nilai project video terbesar</p>

          <div className="space-y-2.5 pt-2">
            {topClients.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Belum ada data klien.</p>
            ) : (
              topClients.map((c, i) => (
                <div
                  key={c.name}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold text-xs flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{c.name}</h4>
                      <span className="text-[10px] text-slate-400">{c.count} Invoice Project</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-sky-400 font-mono">
                    {formatIDR(c.total)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tax (PPN) Compliance Card */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-sky-400" /> Rekapitulasi Pajak PPN
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Pajak Pertambahan Nilai
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Catatan perpajakan untuk pelaporan Faktur Pajak & SPT Masa PPN instansi / UMKM.
            </p>

            <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">NPWP Studio:</span>
                <span className="font-mono text-white font-semibold">{business.npwp || 'Belum diisi'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total PPN Terbit:</span>
                <span className="font-mono text-sky-400 font-bold">{formatIDR(totalPpnCollected)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dasar Pengenaan Pajak (DPP):</span>
                <span className="font-mono text-white">
                  {formatIDR(totalInvoiced - totalPpnCollected)}
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic mt-3">
            * Data dapat diexport langsung dalam bentuk format Excel terpadu untuk tim akuntansi Anda.
          </p>
        </div>
      </div>
    </div>
  );
};
