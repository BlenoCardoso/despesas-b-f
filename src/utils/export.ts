import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'

export async function exportToPDF(title: string, element: HTMLElement | null) {
  if (!element) {
    console.warn('element for PDF not found')
    return
  }
  const canvas = await html2canvas(element, { scale: 2 })
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgProps = (pdf as any).getImageProperties(imgData)
  const imgWidth = pageWidth - 40
  const imgHeight = (imgProps.height * imgWidth) / imgProps.width
  pdf.setFontSize(16)
  pdf.text(title, 20, 30)
  pdf.addImage(imgData, 'PNG', 20, 50, imgWidth, imgHeight)
  pdf.save(`${title.replace(/\s+/g, '_')}.pdf`)
}

export async function exportToExcel(rows: any[], filename = 'report') {
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Report')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export default { exportToPDF, exportToExcel }
