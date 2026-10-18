import { Invoice, Business } from '../types';

/**
 * Format numbers into standard Indonesian Rupiah (e.g. Rp 15.000.000)
 */
export function formatIDR(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date into Indonesian locale (e.g. 18 Oktober 2026)
 */
export function formatIndonesianDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Clean phone number into international WhatsApp format (e.g. 08123456789 -> 628123456789)
 */
export function cleanWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('+62')) {
    cleaned = cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Build professional Indonesian WhatsApp message for invoice billing
 */
export function buildWhatsAppInvoiceMessage(invoice: Invoice, business: Business, shareLink?: string): string {
  const clientName = invoice.clientCompany ? `${invoice.clientName} (${invoice.clientCompany})` : invoice.clientName;
  const isPaid = invoice.status === 'paid';
  const isPartiallyPaid = invoice.status === 'partially_paid';

  let message = `Halo Kak *${clientName}*,\n\n`;
  message += `Semoga dalam keadaan sehat dan sukses selalu. Kami dari *${business.name}* melampirkan informasi invoice untuk project: *${invoice.projectTitle}*.\n\n`;
  message += `📄 *No. Invoice:* ${invoice.invoiceNumber}\n`;
  message += `📅 *Tanggal:* ${formatIndonesianDate(invoice.issueDate)}\n`;
  message += `⏰ *Jatuh Tempo:* ${formatIndonesianDate(invoice.dueDate)}\n`;
  message += `💰 *Total Tagihan:* ${formatIDR(invoice.grandTotal)}\n`;

  if (isPaid) {
    message += `✅ *Status:* LUNAS (Terima kasih atas pembayarannya!)\n\n`;
  } else if (isPartiallyPaid) {
    message += `💳 *Sudah Dibayar:* ${formatIDR(invoice.paidAmount)}\n`;
    message += `⚠️ *Sisa Tagihan:* ${formatIDR(invoice.outstandingAmount)}\n\n`;
  } else {
    message += `⚠️ *Status:* Belum Dibayar\n`;
    if (invoice.downPayment > 0) {
      message += `💵 *Down Payment (DP):* ${formatIDR(invoice.downPayment)}\n`;
    }
    message += `\n`;
  }

  if (!isPaid && business.bankAccountNumber) {
    message += `💳 *Instruksi Pembayaran:*\n`;
    message += `Bank: *${business.bankName}*\n`;
    message += `No. Rekening: *${business.bankAccountNumber}*\n`;
    message += `Atas Nama: *${business.bankAccountHolder}*\n\n`;
  }

  if (shareLink) {
    message += `🔗 *Detail & Download Invoice (PDF):*\n${shareLink}\n\n`;
  }

  message += `Jika ada pertanyaan atau butuh penyesuaian, jangan ragu untuk menghubungi kami.\nTerima kasih atas kerja samanya! 🙏\n\nSalam,\n*${business.name}*`;

  return message;
}

/**
 * Generate secure random unguessable token
 */
export function generateSecureToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const cryptoObj = window.crypto || (window as unknown as { msCrypto: Crypto }).msCrypto;
  if (cryptoObj && cryptoObj.getRandomValues) {
    const values = new Uint8Array(length);
    cryptoObj.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      result += chars[values[i] % chars.length];
    }
    return result;
  }
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
