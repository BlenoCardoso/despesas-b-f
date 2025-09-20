import 'jspdf'
import 'jspdf-autotable'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: {
      startY?: number
      columns?: Array<{
        header: string
        dataKey: string
      }>
      body?: Array<Record<string, any>>
      theme?: string
      headStyles?: {
        fillColor?: number[]
      }
      footStyles?: {
        fillColor?: number[]
      }
      foot?: Array<Array<{
        content: string
        colSpan?: number
      }>>
    }) => void

    lastAutoTable: {
      finalY: number
    }
  }
}