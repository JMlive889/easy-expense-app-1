import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToPdf(
  tableData: any[],
  title = "Report",
  filename?: string
) {
  if (tableData.length === 0) return;

  const doc = new jsPDF({
    orientation: 'landscape'
  });

  doc.text(title, 14, 20);

  const headers = Object.keys(tableData[0] || {});
  const body = tableData.map(row => headers.map(key => row[key] ?? ''));

  autoTable(doc, {
    head: [headers],
    body: body,
    startY: 30,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  const pdfFilename = filename || `${title.toLowerCase().replace(/\s+/g, '-')}.pdf`;
  doc.save(pdfFilename);
}
