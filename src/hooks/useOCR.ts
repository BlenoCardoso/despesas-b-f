// Hook para OCR real com Tesseract.js
import { useState, useCallback } from 'react'
import { createWorker, Worker } from 'tesseract.js'

export interface OCRResult {
  text: string
  confidence: number
  detectedData: {
    amount?: number
    date?: Date
    establishment?: string
    category?: string
    items?: Array<{
      description: string
      amount: number
      quantity?: number
    }>
  }
  rawData: any
}

export interface OCRProgress {
  status: string
  progress: number
  message: string
}

export function useOCR() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<OCRProgress>({ status: 'idle', progress: 0, message: '' })
  const [worker, setWorker] = useState<Worker | null>(null)

  // Inicializar worker do Tesseract
  const initializeWorker = useCallback(async (): Promise<Worker> => {
    if (worker) return worker

    const newWorker = await createWorker('por+eng', 1, {
      logger: (m: any) => {
        setProgress({
          status: m.status,
          progress: m.progress || 0,
          message: m.status === 'recognizing text' ? 'Lendo texto...' :
                   m.status === 'loading tesseract core' ? 'Carregando OCR...' :
                   m.status === 'initializing tesseract' ? 'Inicializando...' :
                   m.status === 'loading language traineddata' ? 'Carregando idioma...' :
                   m.status
        })
      }
    })

    setWorker(newWorker)
    return newWorker
  }, [worker])

  // Processar imagem com OCR
  const processImage = useCallback(async (imageData: string | File): Promise<OCRResult | null> => {
    setIsProcessing(true)
    setProgress({ status: 'initializing', progress: 0, message: 'Preparando OCR...' })

    try {
      const ocrWorker = await initializeWorker()
      
      setProgress({ status: 'processing', progress: 10, message: 'Processando imagem...' })

      const { data } = await ocrWorker.recognize(imageData)
      
      setProgress({ status: 'analyzing', progress: 90, message: 'Analisando texto...' })

      // Extrair dados estruturados do texto
      const detectedData = extractStructuredData(data.text)

      const result: OCRResult = {
        text: data.text,
        confidence: data.confidence,
        detectedData,
        rawData: data
      }

      setProgress({ status: 'completed', progress: 100, message: 'Concluído!' })
      
      return result
    } catch (error) {
      console.error('Erro no OCR:', error)
      setProgress({ status: 'error', progress: 0, message: 'Erro no processamento' })
      return null
    } finally {
      setIsProcessing(false)
      setTimeout(() => {
        setProgress({ status: 'idle', progress: 0, message: '' })
      }, 2000)
    }
  }, [initializeWorker])

  // Extrair dados estruturados do texto OCR
  const extractStructuredData = useCallback((text: string) => {
    const detectedData: OCRResult['detectedData'] = {}

    // Normalizar texto para análise
    const normalizedText = text.toLowerCase().replace(/\s+/g, ' ').trim()

    // Detectar valores monetários (R$ 10,50, 10.50, 1050, etc.)
    const moneyPatterns = [
      /r\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g,
      /(\d{1,3}(?:\.\d{3})*(?:,\d{2}))\s*(?:reais?|r\$)?/g,
      /(\d+[.,]\d{2})/g,
      /(\d+)\s*(?:reais?|r\$)/g
    ]

    const amounts: number[] = []
    
    moneyPatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(normalizedText)) !== null) {
        let amountStr = match[1]
        // Converter para formato numérico padrão
        const amount = parseFloat(
          amountStr.replace(/\./g, '').replace(',', '.')
        )
        if (!isNaN(amount) && amount > 0) {
          amounts.push(amount)
        }
      }
    })

    // Pegar o maior valor como total provável
    if (amounts.length > 0) {
      detectedData.amount = Math.max(...amounts)
    }

    // Detectar datas
    const datePatterns = [
      /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/g,
      /(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/g
    ]

    datePatterns.forEach(pattern => {
      const match = pattern.exec(normalizedText)
      if (match) {
        try {
          let day, month, year
          
          if (match[0].includes('de')) {
            // Formato "15 de janeiro de 2024"
            day = parseInt(match[1])
            month = getMonthNumber(match[2])
            year = parseInt(match[3])
          } else {
            // Formato DD/MM/YYYY ou similar
            day = parseInt(match[1])
            month = parseInt(match[2])
            year = parseInt(match[3])
            
            if (year < 100) year += 2000
          }

          if (day <= 31 && month <= 12 && year >= 2020 && year <= new Date().getFullYear() + 1) {
            detectedData.date = new Date(year, month - 1, day)
          }
        } catch (e) {
          // Ignorar erros de parsing de data
        }
      }
    })

    // Detectar estabelecimento/empresa
    const lines = text.split('\n').filter(line => line.trim().length > 0)
    if (lines.length > 0) {
      // Primeira linha não vazia costuma ser o nome do estabelecimento
      const firstLine = lines[0].trim()
      if (firstLine.length > 2 && firstLine.length < 50) {
        detectedData.establishment = firstLine
      }
    }

    // Categorização básica baseada em palavras-chave
    const categoryKeywords = {
      'Alimentação': ['restaurante', 'lanchonete', 'bar', 'padaria', 'supermercado', 'mercado', 'açougue', 'pizza', 'hambúrguer', 'ifood', 'delivery'],
      'Transporte': ['posto', 'gasolina', 'combustível', 'uber', 'taxi', '99', 'estacionamento', 'pedágio'],
      'Saúde': ['farmácia', 'drogaria', 'remédio', 'medicamento', 'hospital', 'clínica', 'médico', 'dentista'],
      'Compras': ['shopping', 'loja', 'magazine', 'americanas', 'casas bahia', 'extra', 'carrefour'],
      'Serviços': ['salão', 'barbeiro', 'lavanderia', 'oficina', 'mecânico', 'conserto']
    }

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => normalizedText.includes(keyword))) {
        detectedData.category = category
        break
      }
    }

    // Tentar extrair itens da nota fiscal
    const items: Array<{ description: string; amount: number; quantity?: number }> = []
    
    lines.forEach(line => {
      // Procurar padrões como "2x Coca Cola R$ 5,00"
      const itemPattern = /(\d+)x?\s+(.+?)\s+r?\$?\s*(\d+[.,]\d{2})/i
      const match = itemPattern.exec(line)
      
      if (match) {
        const quantity = parseInt(match[1]) || 1
        const description = match[2].trim()
        const amount = parseFloat(match[3].replace(',', '.'))
        
        if (!isNaN(amount) && description.length > 2) {
          items.push({ description, amount, quantity })
        }
      }
    })

    if (items.length > 0) {
      detectedData.items = items
    }

    return detectedData
  }, [])

  // Converter nome do mês para número
  const getMonthNumber = useCallback((monthName: string): number => {
    const months = {
      'janeiro': 1, 'jan': 1,
      'fevereiro': 2, 'fev': 2,
      'março': 3, 'mar': 3,
      'abril': 4, 'abr': 4,
      'maio': 5, 'mai': 5,
      'junho': 6, 'jun': 6,
      'julho': 7, 'jul': 7,
      'agosto': 8, 'ago': 8,
      'setembro': 9, 'set': 9,
      'outubro': 10, 'out': 10,
      'novembro': 11, 'nov': 11,
      'dezembro': 12, 'dez': 12
    }
    
    return months[monthName.toLowerCase() as keyof typeof months] || 1
  }, [])

  // Limpar worker quando não precisar mais
  const cleanup = useCallback(async () => {
    if (worker) {
      await worker.terminate()
      setWorker(null)
    }
  }, [worker])

  // Processar múltiplas imagens
  const processMultipleImages = useCallback(async (images: (string | File)[]): Promise<OCRResult[]> => {
    const results: OCRResult[] = []
    
    for (let i = 0; i < images.length; i++) {
      setProgress({ 
        status: 'processing', 
        progress: (i / images.length) * 100, 
        message: `Processando imagem ${i + 1} de ${images.length}...` 
      })
      
      const result = await processImage(images[i])
      if (result) {
        results.push(result)
      }
    }
    
    return results
  }, [processImage])

  // Validar qualidade da imagem antes do OCR
  const validateImageQuality = useCallback(async (imageFile: File): Promise<{
    isValid: boolean
    issues: string[]
    suggestions: string[]
  }> => {
    return new Promise((resolve) => {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        
        const issues: string[] = []
        const suggestions: string[] = []
        
        // Verificar resolução
        if (img.width < 300 || img.height < 300) {
          issues.push('Resolução muito baixa')
          suggestions.push('Use uma imagem maior ou tire uma foto mais próxima')
        }
        
        // Verificar tamanho do arquivo (muito pequeno pode indicar baixa qualidade)
        if (imageFile.size < 50000) { // 50KB
          issues.push('Arquivo muito pequeno')
          suggestions.push('Tire uma foto com maior qualidade')
        }
        
        // Verificar formato
        if (!imageFile.type.startsWith('image/')) {
          issues.push('Formato de arquivo inválido')
          suggestions.push('Use apenas imagens (JPG, PNG, etc.)')
        }
        
        resolve({
          isValid: issues.length === 0,
          issues,
          suggestions
        })
      }
      
      img.onerror = () => {
        resolve({
          isValid: false,
          issues: ['Erro ao carregar imagem'],
          suggestions: ['Verifique se o arquivo não está corrompido']
        })
      }
      
      img.src = URL.createObjectURL(imageFile)
    })
  }, [])

  return {
    // Estado
    isProcessing,
    progress,
    worker: !!worker,

    // Ações principais
    processImage,
    processMultipleImages,
    
    // Validação
    validateImageQuality,
    
    // Utilitários
    cleanup,
    
    // Status
    isReady: !!worker
  }
}