import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const formatDateRange = (startDate: Date, endDate: Date): string => {
  const formattedStart = format(startDate, "d 'de' MMMM", { locale: ptBR })
  const formattedEnd = format(endDate, "d 'de' MMMM", { locale: ptBR })

  const yearStart = format(startDate, 'yyyy')
  const yearEnd = format(endDate, 'yyyy')

  if (yearStart === yearEnd) {
    return `${formattedStart} a ${format(endDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`
  }

  return `${formattedStart} de ${yearStart} a ${format(endDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`
}