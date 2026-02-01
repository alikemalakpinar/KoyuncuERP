/**
 * Export to CSV/Excel Button
 *
 * Generates real CSV files from table data and triggers download.
 */
import { useState } from 'react'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'

interface Column {
  key: string
  header: string
  format?: (value: any) => string
}

interface Props {
  data: any[]
  columns: Column[]
  filename: string
  label?: string
}

function escapeCsv(val: any): string {
  const s = String(val ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function generateCsv(data: any[], columns: Column[]): string {
  const header = columns.map((c) => escapeCsv(c.header)).join(',')
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const val = row[c.key]
        return escapeCsv(c.format ? c.format(val) : val)
      })
      .join(','),
  )
  // BOM for Turkish characters in Excel
  return '\ufeff' + [header, ...rows].join('\n')
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
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

export default function ExportButton({ data, columns, filename, label = 'Dışa Aktar' }: Props) {
  const [open, setOpen] = useState(false)

  const exportCsv = () => {
    const csv = generateCsv(data, columns)
    downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8')
    setOpen(false)
  }

  const exportExcel = () => {
    // Generate simple HTML table that Excel can read
    const header = columns.map((c) => `<th>${c.header}</th>`).join('')
    const rows = data
      .map(
        (row) =>
          '<tr>' +
          columns
            .map((c) => {
              const val = c.format ? c.format(row[c.key]) : (row[c.key] ?? '')
              return `<td>${val}</td>`
            })
            .join('') +
          '</tr>',
      )
      .join('')
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></body></html>`
    downloadFile(html, `${filename}.xls`, 'application/vnd.ms-excel')
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-xl border border-border dark:border-border-dark px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors"
      >
        <Download className="h-4 w-4" />
        {label}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-40 w-44 rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary shadow-xl overflow-hidden">
            <button
              onClick={exportCsv}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors"
            >
              <FileText className="h-4 w-4 text-green-600" />
              CSV İndir
            </button>
            <button
              onClick={exportExcel}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              Excel İndir
            </button>
          </div>
        </>
      )}
    </div>
  )
}
