/**
 * Invoice PDF Generator
 *
 * Generates a professional invoice PDF from order data.
 * Uses jsPDF (when available) or returns structured data for rendering.
 */

export interface InvoiceData {
  invoiceNo: string
  date: string
  dueDate?: string
  customer: {
    name: string
    code: string
    taxId?: string
    address?: string
    city?: string
    country?: string
  }
  currency: string
  items: {
    productName: string
    sku?: string
    quantity: string
    unit: string
    unitPrice: string
    totalPrice: string
  }[]
  subtotal: string
  vatRate: string
  vatAmount: string
  grandTotal: string
  notes?: string
}

/**
 * Generate invoice PDF as a Blob.
 * Falls back to a simple HTML-to-print approach if jsPDF is unavailable.
 */
export async function generateInvoicePdf(data: InvoiceData): Promise<Blob> {
  // Dynamic import to keep bundle lean
  try {
    const { default: jsPDF } = await import('jspdf')
    return generateWithJsPDF(jsPDF, data)
  } catch {
    // Fallback: generate HTML blob for printing
    return generateHtmlFallback(data)
  }
}

function generateWithJsPDF(jsPDF: any, data: InvoiceData): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const w = doc.internal.pageSize.getWidth()

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('KOYUNCU HALI', 14, 22)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Export Trading Company', 14, 28)

  // Invoice info
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', w - 14, 22, { align: 'right' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`No: ${data.invoiceNo}`, w - 14, 30, { align: 'right' })
  doc.text(`Date: ${data.date}`, w - 14, 36, { align: 'right' })
  if (data.dueDate) {
    doc.text(`Due: ${data.dueDate}`, w - 14, 42, { align: 'right' })
  }

  // Divider
  doc.setDrawColor(200)
  doc.line(14, 48, w - 14, 48)

  // Customer
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Bill To:', 14, 56)
  doc.setFont('helvetica', 'normal')
  doc.text(data.customer.name, 14, 62)
  if (data.customer.address) doc.text(data.customer.address, 14, 68)
  const cityLine = [data.customer.city, data.customer.country].filter(Boolean).join(', ')
  if (cityLine) doc.text(cityLine, 14, 74)
  if (data.customer.taxId) doc.text(`Tax ID: ${data.customer.taxId}`, 14, 80)

  // Table header
  let y = 92
  doc.setFillColor(245, 245, 245)
  doc.rect(14, y - 5, w - 28, 8, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Product', 16, y)
  doc.text('Qty', 110, y, { align: 'right' })
  doc.text('Unit', 125, y)
  doc.text('Price', 160, y, { align: 'right' })
  doc.text('Total', w - 16, y, { align: 'right' })
  y += 8

  // Table rows
  doc.setFont('helvetica', 'normal')
  for (const item of data.items) {
    doc.text(item.productName, 16, y)
    doc.text(item.quantity, 110, y, { align: 'right' })
    doc.text(item.unit, 125, y)
    doc.text(`${data.currency} ${item.unitPrice}`, 160, y, { align: 'right' })
    doc.text(`${data.currency} ${item.totalPrice}`, w - 16, y, { align: 'right' })
    y += 7
    if (y > 260) {
      doc.addPage()
      y = 20
    }
  }

  // Totals
  y += 6
  doc.line(120, y - 4, w - 14, y - 4)
  doc.text('Subtotal:', 140, y)
  doc.text(`${data.currency} ${data.subtotal}`, w - 16, y, { align: 'right' })
  y += 7
  doc.text(`VAT (${data.vatRate}%):`, 140, y)
  doc.text(`${data.currency} ${data.vatAmount}`, w - 16, y, { align: 'right' })
  y += 7
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('GRAND TOTAL:', 140, y)
  doc.text(`${data.currency} ${data.grandTotal}`, w - 16, y, { align: 'right' })

  // Notes
  if (data.notes) {
    y += 14
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Notes:', 14, y)
    doc.text(data.notes, 14, y + 6)
  }

  return doc.output('blob')
}

function generateHtmlFallback(data: InvoiceData): Blob {
  const rows = data.items
    .map(
      (item) =>
        `<tr>
          <td>${item.productName}</td>
          <td style="text-align:right">${item.quantity}</td>
          <td>${item.unit}</td>
          <td style="text-align:right">${data.currency} ${item.unitPrice}</td>
          <td style="text-align:right">${data.currency} ${item.totalPrice}</td>
        </tr>`,
    )
    .join('')

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoice ${data.invoiceNo}</title>
<style>
  body { font-family: Helvetica, Arial, sans-serif; padding: 40px; color: #1a1a1a; }
  h1 { margin: 0; font-size: 22px; }
  .meta { color: #666; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 13px; }
  th { background: #f5f5f5; text-align: left; padding: 8px; border-bottom: 2px solid #ddd; }
  td { padding: 8px; border-bottom: 1px solid #eee; }
  .totals td { border: none; padding: 4px 8px; }
  .grand { font-weight: bold; font-size: 16px; }
</style></head><body>
  <h1>KOYUNCU HALI</h1>
  <p class="meta">Invoice No: ${data.invoiceNo} | Date: ${data.date}${data.dueDate ? ` | Due: ${data.dueDate}` : ''}</p>
  <p><strong>${data.customer.name}</strong><br>${data.customer.address || ''}${data.customer.city ? ', ' + data.customer.city : ''}</p>
  <table>
    <thead><tr><th>Product</th><th style="text-align:right">Qty</th><th>Unit</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <table class="totals" style="width:40%;margin-left:auto;margin-top:16px">
    <tr><td>Subtotal</td><td style="text-align:right">${data.currency} ${data.subtotal}</td></tr>
    <tr><td>VAT (${data.vatRate}%)</td><td style="text-align:right">${data.currency} ${data.vatAmount}</td></tr>
    <tr class="grand"><td>GRAND TOTAL</td><td style="text-align:right">${data.currency} ${data.grandTotal}</td></tr>
  </table>
</body></html>`

  return new Blob([html], { type: 'text/html' })
}

/**
 * Download a blob as file in the browser.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}
