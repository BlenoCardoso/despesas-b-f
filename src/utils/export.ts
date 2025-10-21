import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'

type PDFOptions = {
  includeHeaderFooter?: boolean
  headerText?: string
  footerText?: string
}

export async function exportToPDF(title: string, element: HTMLElement | null, opts: PDFOptions = {}) {
  if (!element) {
    console.warn('element for PDF not found')
    return
  }
  const canvas = await html2canvas(element, { scale: 2 })
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const imgProps = (pdf as any).getImageProperties(imgData)
  const margin = 20
  const imgWidth = pageWidth - margin * 2
  const imgHeight = (imgProps.height * imgWidth) / imgProps.width

  let y = margin
  if (opts.includeHeaderFooter && opts.headerText) {
    pdf.setFontSize(12)
    pdf.text(opts.headerText, margin, y + 8)
    y += 24
  } else {
    pdf.setFontSize(16)
    pdf.text(title, margin, y + 10)
    y += 28
  }

  pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight)

  if (opts.includeHeaderFooter && opts.footerText) {
    const footerY = pdf.internal.pageSize.getHeight() - margin
    pdf.setFontSize(10)
    pdf.text(String(opts.footerText), margin, footerY)
  }

  pdf.save(`${title.replace(/\s+/g, '_')}.pdf`)
}

// data: { details: Array, aggregates: Array }
export async function exportToExcel(data: { details?: any[]; aggregates?: any[] }, filename = 'report') {
  const wb = XLSX.utils.book_new()
  if (data.details && data.details.length) {
    const ws1 = XLSX.utils.json_to_sheet(data.details)
    XLSX.utils.book_append_sheet(wb, ws1, 'Detalhes')
  }
  if (data.aggregates && data.aggregates.length) {
    const ws2 = XLSX.utils.json_to_sheet(data.aggregates)
    XLSX.utils.book_append_sheet(wb, ws2, 'Agregados')
  }
  // Fallback: if neither provided, create an empty sheet
  if ((!data.details || !data.details.length) && (!data.aggregates || !data.aggregates.length)) {
    const ws = XLSX.utils.aoa_to_sheet([['Relatório vazio']])
    XLSX.utils.book_append_sheet(wb, ws, 'Report')
  }
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

// Generate a textual table PDF from rows (array of objects) with given columns
export async function exportTableToPDF(title: string, rows: any[], columns: { key: string; label: string }[], filename = 'report_table') {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 40
  const pageWidth = pdf.internal.pageSize.getWidth()
  const usableWidth = pageWidth - margin * 2
  const rowHeight = 18
  const headerHeight = 24
  const startY = 60

  // Header
  pdf.setFontSize(14)
  pdf.text(title, margin, 30)

  // Prepare column widths (simple even split)
  const colCount = columns.length
  const colWidth = usableWidth / colCount

  let y = startY

  const drawHeader = () => {
    pdf.setFontSize(11)
    pdf.setFillColor(240, 240, 240)
    for (let i = 0; i < columns.length; i++) {
      const x = margin + i * colWidth
      pdf.rect(x, y - headerHeight + 4, colWidth, headerHeight, 'F')
      pdf.setTextColor(20,20,20)
      pdf.text(String(columns[i].label), x + 4, y - 6)
    }
    y += headerHeight
  }

  drawHeader()

  pdf.setFontSize(10)
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]
    // check for page break
    if (y + rowHeight > pdf.internal.pageSize.getHeight() - margin) {
      pdf.addPage()
      y = margin
      drawHeader()
    }
    for (let i = 0; i < columns.length; i++) {
      const x = margin + i * colWidth
      let text = String(row[columns[i].key] ?? '')
      // truncate if too long
      const maxChars = Math.floor(colWidth / 6)
      if (text.length > maxChars) text = text.slice(0, maxChars - 3) + '...'
      pdf.text(text, x + 4, y)
    }
    y += rowHeight
  }

  pdf.save(`${filename}.pdf`)
}

export default { exportToPDF, exportToExcel, exportTableToPDF }
