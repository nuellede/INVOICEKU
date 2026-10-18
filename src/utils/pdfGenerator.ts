import { jsPDF } from 'jspdf';
import { Invoice, Business } from '../types';
import { formatIDR, formatIndonesianDate } from './formatters';

export function downloadInvoicePdf(invoice: Invoice, business: Business): void {
  // Create A4 PDF (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2; // 180mm
  const rightX = pageWidth - margin;

  // Theme Colors
  let primaryR = 79, primaryG = 70, primaryB = 229; // Indigo (#4f46e5)
  let darkR = 15, darkG = 23, darkB = 42; // Slate 900 (#0f172a)

  if (invoice.template === 'corporate') {
    primaryR = 15; primaryG = 23; primaryB = 42; // Deep Navy
  } else if (invoice.template === 'minimalist') {
    primaryR = 51; primaryG = 65; primaryB = 85; // Slate 700
  }

  // 1. Top Decorative Brand Bar
  doc.setFillColor(primaryR, primaryG, primaryB);
  doc.rect(0, 0, pageWidth, 4, 'F');

  let currentY = 14;

  // 2. Top Header Section: Clean Two-Column Layout (Both Left-Aligned!)
  // Left Column: Business Identity
  const col1X = margin;
  const col2X = margin + 110;
  const col2Width = contentWidth - 110;

  // Business Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(darkR, darkG, darkB);
  doc.text(business.name, col1X, currentY);

  let bizY = currentY + 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  if (business.address) {
    const addressLines = doc.splitTextToSize(business.address, 95);
    doc.text(addressLines, col1X, bizY);
    bizY += addressLines.length * 3.8;
  }

  doc.text(`WhatsApp / Telp: ${business.phone}`, col1X, bizY);
  bizY += 3.8;

  if (business.email) {
    doc.text(`Email: ${business.email}`, col1X, bizY);
    bizY += 3.8;
  }

  if (business.npwp) {
    doc.text(`NPWP: ${business.npwp}`, col1X, bizY);
    bizY += 3.8;
  }

  // Right Column: Invoice Document Info Box (All Left-Aligned inside this box!)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(col2X, currentY - 2, col2Width, 32, 2, 2, 'FD');

  let metaY = currentY + 3;
  const metaPaddingX = col2X + 4;

  // Invoice Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(primaryR, primaryG, primaryB);
  doc.text('INVOICE', metaPaddingX, metaY);

  metaY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(darkR, darkG, darkB);
  doc.text(invoice.invoiceNumber, metaPaddingX, metaY);

  metaY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Tanggal Terbit : ${formatIndonesianDate(invoice.issueDate)}`, metaPaddingX, metaY);

  metaY += 4;
  doc.text(`Jatuh Tempo   : ${formatIndonesianDate(invoice.dueDate)}`, metaPaddingX, metaY);

  // Status Badge (Inside Info Box)
  metaY += 4.5;
  const statusLabels: Record<string, string> = {
    draft: 'DRAFT',
    sent: 'TERKIRIM',
    partially_paid: 'SEBAGIAN DIBAYAR',
    paid: 'LUNAS',
    overdue: 'JATUH TEMPO',
    cancelled: 'DIBATALKAN',
  };
  const statusText = statusLabels[invoice.status] || invoice.status.toUpperCase();

  if (invoice.status === 'paid') {
    doc.setFillColor(220, 252, 231);
    doc.setTextColor(22, 101, 52);
  } else if (invoice.status === 'partially_paid') {
    doc.setFillColor(254, 243, 199);
    doc.setTextColor(180, 83, 9);
  } else if (invoice.status === 'overdue') {
    doc.setFillColor(254, 226, 226);
    doc.setTextColor(185, 28, 28);
  } else {
    doc.setFillColor(241, 245, 249);
    doc.setTextColor(71, 85, 105);
  }

  doc.roundedRect(metaPaddingX, metaY - 3, 34, 5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(statusText, metaPaddingX + 17, metaY + 0.6, { align: 'center' });

  currentY = Math.max(bizY + 2, 48);

  // 3. Client & Project Details: 2 Balanced Left-Aligned Cards
  const cardWidth = (contentWidth - 6) / 2;
  const card1X = margin;
  const card2X = margin + cardWidth + 6;
  const cardHeight = 27;

  // Card 1: Billed To (Klien)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(card1X, currentY, cardWidth, cardHeight, 2, 2, 'FD');

  let c1Y = currentY + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('DITAGIHKAN KEPADA:', card1X + 4, c1Y);

  c1Y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(darkR, darkG, darkB);
  doc.text(invoice.clientName, card1X + 4, c1Y);

  c1Y += 4.2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  if (invoice.clientCompany) {
    doc.text(invoice.clientCompany, card1X + 4, c1Y);
    c1Y += 3.8;
  }
  doc.text(`WhatsApp: ${invoice.clientPhone}${invoice.clientEmail ? ` | ${invoice.clientEmail}` : ''}`, card1X + 4, c1Y);

  if (invoice.clientAddress) {
    c1Y += 3.8;
    const addr = doc.splitTextToSize(invoice.clientAddress, cardWidth - 8);
    doc.text(addr[0], card1X + 4, c1Y);
  }

  // Card 2: Project Details (All Left-Aligned!)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 2, 2, 'FD');

  let c2Y = currentY + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('RINCIAN PROYEK:', card2X + 4, c2Y);

  c2Y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryR, primaryG, primaryB);
  const projLines = doc.splitTextToSize(invoice.projectTitle, cardWidth - 8);
  doc.text(projLines, card2X + 4, c2Y);

  c2Y += Math.max(projLines.length * 4.2, 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Kategori: Layanan Video Production & Kreatif', card2X + 4, c2Y);
  c2Y += 3.8;
  doc.text(`Batas Pelunasan: ${formatIndonesianDate(invoice.dueDate)}`, card2X + 4, c2Y);

  currentY += cardHeight + 6;

  // 4. Line Items Table Header (Crisp & Clean)
  const colDescX = margin + 4;
  const colQtyX = margin + 105;
  const colUnitX = margin + 120;
  const colPriceX = margin + 150;
  const colTotalX = rightX - 4;

  doc.setFillColor(primaryR, primaryG, primaryB);
  doc.rect(margin, currentY, contentWidth, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  doc.text('Item / Layanan Video', colDescX, currentY + 4.8);
  doc.text('Qty', colQtyX, currentY + 4.8, { align: 'center' });
  doc.text('Satuan', colUnitX, currentY + 4.8, { align: 'center' });
  doc.text('Tarif (IDR)', colPriceX, currentY + 4.8, { align: 'right' });
  doc.text('Total (IDR)', colTotalX, currentY + 4.8, { align: 'right' });

  currentY += 7;

  // 5. Line Items Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  invoice.items.forEach((item, index) => {
    const isEven = index % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY, contentWidth, 7, 'F');
    }

    doc.setTextColor(30, 41, 59);
    const itemDesc = doc.splitTextToSize(item.description, 95);
    doc.text(itemDesc[0], colDescX, currentY + 4.8);

    doc.setTextColor(71, 85, 105);
    doc.text(String(item.quantity), colQtyX, currentY + 4.8, { align: 'center' });
    doc.text(item.unit || '-', colUnitX, currentY + 4.8, { align: 'center' });
    doc.text(formatIDR(item.price).replace('Rp', '').trim(), colPriceX, currentY + 4.8, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkR, darkG, darkB);
    doc.text(formatIDR(item.amount).replace('Rp', '').trim(), colTotalX, currentY + 4.8, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    currentY += 7;
  });

  // Table bottom border
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, currentY, rightX, currentY);
  currentY += 6;

  // 6. Payment Instructions & Summary Totals Section
  const totalsY = currentY;

  // Left Column: Bank Details & Notes (Width: 95mm)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, totalsY, 95, 42, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(primaryR, primaryG, primaryB);
  doc.text('INSTRUKSI REKENING PEMBAYARAN:', margin + 4, totalsY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(51, 65, 85);

  if (business.bankAccountNumber) {
    doc.text(`Bank Tujuan: ${business.bankName}`, margin + 4, totalsY + 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(darkR, darkG, darkB);
    doc.text(`No. Rekening: ${business.bankAccountNumber}`, margin + 4, totalsY + 16.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Atas Nama: ${business.bankAccountHolder}`, margin + 4, totalsY + 21.5);
  } else {
    doc.text('Pembayaran sesuai kesepakatan kontrak.', margin + 4, totalsY + 11);
  }

  if (invoice.notes) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    const noteLines = doc.splitTextToSize(`Catatan: ${invoice.notes}`, 87);
    doc.text(noteLines, margin + 4, totalsY + 29);
  }

  // Right Column: Summary Ledger (All labels left-aligned, values right-aligned)
  const calcX = margin + 103;
  const calcValX = rightX - 2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);

  let rightY = totalsY + 4.5;
  doc.text('Subtotal:', calcX, rightY);
  doc.text(formatIDR(invoice.subtotal), calcValX, rightY, { align: 'right' });

  if (invoice.discountTotal > 0) {
    rightY += 5;
    doc.setTextColor(225, 29, 72);
    doc.text('Diskon:', calcX, rightY);
    doc.text(`- ${formatIDR(invoice.discountTotal)}`, calcValX, rightY, { align: 'right' });
    doc.setTextColor(100, 116, 139);
  }

  if (invoice.ppnEnabled) {
    rightY += 5;
    doc.text(`PPN (${invoice.ppnRate || 11}%):`, calcX, rightY);
    doc.text(`+ ${formatIDR(invoice.ppnAmount)}`, calcValX, rightY, { align: 'right' });
  }

  // Grand Total Highlight Box
  rightY += 6;
  doc.setFillColor(darkR, darkG, darkB);
  doc.roundedRect(calcX - 2, rightY - 3.8, 79, 7.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('GRAND TOTAL:', calcX + 2, rightY + 1.4);
  doc.text(formatIDR(invoice.grandTotal), calcValX - 2, rightY + 1.4, { align: 'right' });

  // Paid & Outstanding
  if (invoice.paidAmount > 0) {
    rightY += 7.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(22, 101, 52);
    doc.text('Sudah Dibayar:', calcX, rightY);
    doc.text(`- ${formatIDR(invoice.paidAmount)}`, calcValX, rightY, { align: 'right' });
  }

  rightY += 6;
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(calcX - 2, rightY - 3.5, 79, 7, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(146, 64, 14);
  doc.text('Sisa Tagihan:', calcX + 2, rightY + 1.2);
  doc.text(formatIDR(invoice.outstandingAmount), calcValX - 2, rightY + 1.2, { align: 'right' });

  // 7. Signature & Closing Block (Clean & Official, Zero SaaS Watermarks)
  const signY = Math.min(250, pageHeight - 35);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, signY - 6, rightX, signY - 6);

  // Left Note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Terima kasih atas kerja sama dan kepercayaan Anda.', margin, signY + 2);

  // Right Signature Block
  const signBoxX = rightX - 35;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Hormat Kami,', signBoxX, signY, { align: 'center' });

  // Signature Underline
  doc.setDrawColor(148, 163, 184);
  doc.line(signBoxX - 22, signY + 20, signBoxX + 22, signY + 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(darkR, darkG, darkB);
  doc.text(business.name, signBoxX, signY + 24.5, { align: 'center' });

  // Download PDF
  const cleanFilename = `Invoice_${invoice.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  doc.save(cleanFilename);
}
