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

  // Accent Colors depending on template
  let primaryR = 79, primaryG = 70, primaryB = 229; // Creative Indigo (#4f46e5)
  let secondaryR = 2, secondaryG = 132, secondaryB = 199; // Sky (#0284c7)
  let darkR = 15, darkG = 23, darkB = 42; // Slate 900 (#0f172a)

  if (invoice.template === 'corporate') {
    primaryR = 15; primaryG = 23; primaryB = 42; // Deep Navy
    secondaryR = 30; secondaryG = 58; secondaryB = 138;
  } else if (invoice.template === 'minimalist') {
    primaryR = 51; primaryG = 65; primaryB = 85; // Slate 700
    secondaryR = 100; secondaryG = 116; secondaryB = 139;
  }

  // 1. Top Header Accent Bar
  doc.setFillColor(primaryR, primaryG, primaryB);
  doc.rect(0, 0, pageWidth, 7, 'F');

  let currentY = 18;

  // 2. Business Details (Left Column)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(darkR, darkG, darkB);
  doc.text(business.name, margin, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);

  if (business.address) {
    const addressLines = doc.splitTextToSize(business.address, 90);
    doc.text(addressLines, margin, currentY);
    currentY += addressLines.length * 4;
  }

  const contactText = `WhatsApp: ${business.phone}${business.email ? ` | Email: ${business.email}` : ''}`;
  doc.text(contactText, margin, currentY);
  currentY += 4;

  if (business.npwp) {
    doc.text(`NPWP: ${business.npwp}`, margin, currentY);
    currentY += 4;
  }

  // 3. Invoice Header (Right Column)
  const rightX = pageWidth - margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryR, primaryG, primaryB);
  doc.text('INVOICE', rightX, 18, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkR, darkG, darkB);
  doc.text(invoice.invoiceNumber, rightX, 25, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Tanggal Terbit: ${formatIndonesianDate(invoice.issueDate)}`, rightX, 31, { align: 'right' });
  doc.text(`Jatuh Tempo: ${formatIndonesianDate(invoice.dueDate)}`, rightX, 36, { align: 'right' });

  // Status Badge
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
    doc.setFillColor(220, 252, 231); // Light emerald
    doc.setTextColor(22, 101, 52); // Dark emerald
  } else if (invoice.status === 'partially_paid') {
    doc.setFillColor(254, 243, 199); // Light amber
    doc.setTextColor(180, 83, 9); // Amber
  } else {
    doc.setFillColor(241, 245, 249);
    doc.setTextColor(71, 85, 105);
  }
  doc.roundedRect(rightX - 35, 39, 35, 6, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(statusText, rightX - 17.5, 43.5, { align: 'center' });

  // Divider
  currentY = Math.max(currentY + 4, 48);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, currentY, rightX, currentY);
  currentY += 6;

  // 4. Billed To & Project Description Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, contentWidth, 26, 2, 2, 'F');

  // Left side: Client
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('DITAGIHKAN KEPADA:', margin + 4, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(darkR, darkG, darkB);
  doc.text(invoice.clientName, margin + 4, currentY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const clientSub = `${invoice.clientCompany ? `${invoice.clientCompany} | ` : ''}WA: ${invoice.clientPhone}`;
  doc.text(clientSub, margin + 4, currentY + 15);

  if (invoice.clientAddress) {
    const addr = doc.splitTextToSize(invoice.clientAddress, 85);
    doc.text(addr[0], margin + 4, currentY + 19.5);
  }

  // Right side: Project Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('DESKRIPSI PROJECT VIDEO:', margin + 100, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryR, primaryG, primaryB);
  const projLines = doc.splitTextToSize(invoice.projectTitle, 75);
  doc.text(projLines, margin + 100, currentY + 10);

  currentY += 32;

  // 5. Line Items Table Header
  doc.setFillColor(primaryR, primaryG, primaryB);
  doc.rect(margin, currentY, contentWidth, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  doc.text('Item / Layanan Video', margin + 3, currentY + 4.8);
  doc.text('Qty', margin + 105, currentY + 4.8, { align: 'center' });
  doc.text('Satuan', margin + 120, currentY + 4.8, { align: 'center' });
  doc.text('Tarif (IDR)', margin + 150, currentY + 4.8, { align: 'right' });
  doc.text('Total (IDR)', margin + 177, currentY + 4.8, { align: 'right' });

  currentY += 7;

  // 6. Line Items Content
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  invoice.items.forEach((item, index) => {
    const isEven = index % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY, contentWidth, 7, 'F');
    }

    doc.setTextColor(30, 41, 59);
    const itemDesc = doc.splitTextToSize(item.description, 98);
    doc.text(itemDesc[0], margin + 3, currentY + 4.8);

    doc.setTextColor(71, 85, 105);
    doc.text(String(item.quantity), margin + 105, currentY + 4.8, { align: 'center' });
    doc.text(item.unit || '-', margin + 120, currentY + 4.8, { align: 'center' });
    doc.text(formatIDR(item.price).replace('Rp', '').trim(), margin + 150, currentY + 4.8, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkR, darkG, darkB);
    doc.text(formatIDR(item.amount).replace('Rp', '').trim(), margin + 177, currentY + 4.8, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    currentY += 7;
  });

  // Bottom table line
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, currentY, rightX, currentY);
  currentY += 6;

  // 7. Totals & Payment Details
  const totalsY = currentY;

  // Left Column: Bank Details & Notes
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, totalsY, 100, 38, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryR, primaryG, primaryB);
  doc.text('INSTRUKSI REKENING PEMBAYARAN:', margin + 4, totalsY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  if (business.bankAccountNumber) {
    doc.text(`Bank: ${business.bankName}`, margin + 4, totalsY + 10);
    doc.setFont('helvetica', 'bold');
    doc.text(`No. Rekening: ${business.bankAccountNumber}`, margin + 4, totalsY + 14.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Atas Nama: ${business.bankAccountHolder}`, margin + 4, totalsY + 19);
  } else {
    doc.text('Transfer sesuai kesepakatan.', margin + 4, totalsY + 10);
  }

  if (invoice.notes) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    const noteLines = doc.splitTextToSize(`Catatan: ${invoice.notes}`, 92);
    doc.text(noteLines, margin + 4, totalsY + 26);
  }

  // Right Column: Financial Calculations Summary
  const calcX = margin + 105;
  const calcValX = rightX - 2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);

  let rightY = totalsY + 5;
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

  // Grand Total Box
  rightY += 6;
  doc.setFillColor(darkR, darkG, darkB);
  doc.roundedRect(calcX, rightY - 4, 75, 8, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text('GRAND TOTAL:', calcX + 3, rightY + 1.5);
  doc.text(formatIDR(invoice.grandTotal), calcValX - 2, rightY + 1.5, { align: 'right' });

  // Paid & Outstanding
  if (invoice.paidAmount > 0) {
    rightY += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(22, 101, 52);
    doc.text('Sudah Dibayar:', calcX, rightY);
    doc.text(`- ${formatIDR(invoice.paidAmount)}`, calcValX, rightY, { align: 'right' });
  }

  rightY += 6;
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(calcX, rightY - 3.5, 75, 7, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(146, 64, 14);
  doc.text('Sisa Tagihan:', calcX + 3, rightY + 1.2);
  doc.text(formatIDR(invoice.outstandingAmount), calcValX - 2, rightY + 1.2, { align: 'right' });

  // 8. Formal Stamp / Signatures (for Corporate or Creative)
  if (invoice.template === 'corporate') {
    const signY = 250;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, signY - 5, rightX, signY - 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Dokumen ini digenerate secara sah melalui CineInvoice SaaS.', margin, signY + 15);

    const signBoxX = rightX - 50;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Hormat Kami,', signBoxX, signY, { align: 'center' });

    doc.line(signBoxX - 20, signY + 22, signBoxX + 20, signY + 22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkR, darkG, darkB);
    doc.text(business.name, signBoxX, signY + 26, { align: 'center' });
  }

  // 9. Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `CineInvoice • Solusi Invoice Video Production & UMKM Kreatif • Dicetak pada ${formatIndonesianDate(new Date().toISOString())}`,
    margin,
    pageHeight - 6
  );

  // Trigger download
  const cleanFilename = `Invoice_${invoice.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  doc.save(cleanFilename);
}
