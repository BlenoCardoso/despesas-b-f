// Hook para análise inteligente de despesas
import { useState, useCallback, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'

interface ExpensePattern {
  id: string
  keywords: string[]
  category: string
  confidence: number
  frequency: number
  lastUsed: Date
}

interface Expense {
  id: string
  description: string
  category: string
  amount: number
  date: Date
}

interface ExpenseAnalysis {
  suggestedCategory: string
  confidence: number
  suggestedAmount?: number
  patterns: string[]
  isRecurring: boolean
  similarExpenses: Expense[]
}

export function useIntelligentExpenses() {
  const [patterns, setPatterns] = useLocalStorage<ExpensePattern[]>('expense-patterns', [])
  const [expenseHistory, setExpenseHistory] = useLocalStorage<Expense[]>('expense-history', [])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Padrões pré-definidos baseados em dados brasileiros
  const defaultPatterns: ExpensePattern[] = useMemo(() => [
    {
      id: 'transport',
      keywords: ['uber', 'taxi', '99', 'combustível', 'gasolina', 'etanol', 'diesel', 'estacionamento', 'pedágio', 'ônibus', 'metrô', 'passagem'],
      category: 'Transporte',
      confidence: 0.9,
      frequency: 0,
      lastUsed: new Date()
    },
    {
      id: 'food',
      keywords: ['restaurante', 'lanchonete', 'ifood', 'delivery', 'pizza', 'hambúrguer', 'açaí', 'padaria', 'supermercado', 'mercado', 'feira'],
      category: 'Alimentação',
      confidence: 0.9,
      frequency: 0,
      lastUsed: new Date()
    },
    {
      id: 'health',
      keywords: ['farmácia', 'remédio', 'medicamento', 'consulta', 'médico', 'dentista', 'exame', 'laboratório', 'hospital', 'clínica'],
      category: 'Saúde',
      confidence: 0.9,
      frequency: 0,
      lastUsed: new Date()
    },
    {
      id: 'shopping',
      keywords: ['shopping', 'loja', 'magazine', 'americanas', 'casas bahia', 'amazon', 'mercado livre', 'shopee', 'aliexpress'],
      category: 'Compras',
      confidence: 0.85,
      frequency: 0,
      lastUsed: new Date()
    },
    {
      id: 'utilities',
      keywords: ['conta de luz', 'energia elétrica', 'água', 'saneamento', 'telefone', 'internet', 'tv', 'streaming', 'netflix', 'spotify'],
      category: 'Utilidades',
      confidence: 0.95,
      frequency: 0,
      lastUsed: new Date()
    },
    {
      id: 'education',
      keywords: ['escola', 'faculdade', 'universidade', 'curso', 'livro', 'material escolar', 'mensalidade', 'matrícula'],
      category: 'Educação',
      confidence: 0.9,
      frequency: 0,
      lastUsed: new Date()
    }
  ], [])

  // Analisar texto da despesa
  const analyzeExpense = useCallback(async (description: string, amount?: number): Promise<ExpenseAnalysis> => {
    setIsAnalyzing(true)
    
    try {
      const lowerDescription = description.toLowerCase()
      const allPatterns = [...defaultPatterns, ...patterns]
      
      // Encontrar padrões correspondentes
      const matchingPatterns = allPatterns
        .map(pattern => {
          const matches = pattern.keywords.filter(keyword => 
            lowerDescription.includes(keyword.toLowerCase())
          )
          
          const score = matches.length / pattern.keywords.length * pattern.confidence
          
          return {
            pattern,
            matches,
            score
          }
        })
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score)

      // Buscar despesas similares no histórico
      const similarExpenses = expenseHistory.filter(expense => {
        const similarity = calculateTextSimilarity(
          expense.description.toLowerCase(),
          lowerDescription
        )
        return similarity > 0.6
      })

      // Verificar se é despesa recorrente
      const isRecurring = similarExpenses.length >= 3 && 
        similarExpenses.some(expense => isWithinDays(expense.date, new Date(), 35))

      // Sugerir categoria baseada no melhor match
      const bestMatch = matchingPatterns[0]
      const suggestedCategory = bestMatch?.pattern.category || 'Outros'
      const confidence = bestMatch?.score || 0

      // Sugerir valor baseado em histórico similar
      let suggestedAmount: number | undefined
      if (similarExpenses.length > 0 && !amount) {
        const amounts = similarExpenses.map(exp => exp.amount)
        suggestedAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length
      }

      const analysis: ExpenseAnalysis = {
        suggestedCategory,
        confidence,
        suggestedAmount,
        patterns: matchingPatterns.map(m => m.pattern.category),
        isRecurring,
        similarExpenses: similarExpenses.slice(0, 5)
      }

      // Atualizar padrões com nova informação
      if (bestMatch && confidence > 0.7) {
        updatePatternUsage(bestMatch.pattern.id)
      }

      return analysis
    } catch (error) {
      console.error('Erro na análise inteligente:', error)
      return {
        suggestedCategory: 'Outros',
        confidence: 0,
        patterns: [],
        isRecurring: false,
        similarExpenses: []
      }
    } finally {
      setIsAnalyzing(false)
    }
  }, [patterns, expenseHistory, defaultPatterns])

  // Calcular similaridade entre textos
  const calculateTextSimilarity = useCallback((text1: string, text2: string): number => {
    const words1 = text1.split(/\s+/)
    const words2 = text2.split(/\s+/)
    
    const commonWords = words1.filter(word => 
      words2.some(w2 => w2.includes(word) || word.includes(w2))
    )
    
    return commonWords.length / Math.max(words1.length, words2.length)
  }, [])

  // Verificar se data está dentro de X dias
  const isWithinDays = useCallback((date1: Date, date2: Date, days: number): boolean => {
    const diffTimeMs = Math.abs(date2.getTime() - date1.getTime())
    const diffDays = diffTimeMs / (1000 * 60 * 60 * 24)
    return diffDays <= days
  }, [])

  // Atualizar uso de padrão
  const updatePatternUsage = useCallback((patternId: string) => {
    setPatterns(prev => prev.map(pattern => 
      pattern.id === patternId
        ? {
            ...pattern,
            frequency: pattern.frequency + 1,
            lastUsed: new Date()
          }
        : pattern
    ))
  }, [setPatterns])

  // Adicionar novo padrão baseado no comportamento do usuário
  const learnFromExpense = useCallback((expense: Expense) => {
    // Adicionar ao histórico
    setExpenseHistory(prev => [expense, ...prev.slice(0, 999)]) // Manter últimas 1000 despesas

    // Extrair palavras-chave da descrição
    const words = expense.description.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5) // Primeiras 5 palavras significativas

    if (words.length === 0) return

    // Verificar se já existe padrão para esta categoria
    const existingPattern = patterns.find(p => p.category === expense.category)
    
    if (existingPattern) {
      // Atualizar padrão existente com novas palavras-chave
      const newKeywords = words.filter(word => 
        !existingPattern.keywords.some(keyword => 
          keyword.toLowerCase().includes(word) || word.includes(keyword.toLowerCase())
        )
      )

      if (newKeywords.length > 0) {
        setPatterns(prev => prev.map(pattern =>
          pattern.id === existingPattern.id
            ? {
                ...pattern,
                keywords: [...pattern.keywords, ...newKeywords],
                frequency: pattern.frequency + 1,
                lastUsed: new Date()
              }
            : pattern
        ))
      }
    } else {
      // Criar novo padrão se tiver pelo menos 3 despesas similares
      const similarExpenses = expenseHistory.filter(exp => 
        exp.category === expense.category &&
        calculateTextSimilarity(exp.description.toLowerCase(), expense.description.toLowerCase()) > 0.4
      )

      if (similarExpenses.length >= 2) {
        const newPattern: ExpensePattern = {
          id: `custom-${Date.now()}`,
          keywords: words,
          category: expense.category,
          confidence: 0.7,
          frequency: 1,
          lastUsed: new Date()
        }

        setPatterns(prev => [...prev, newPattern])
      }
    }
  }, [patterns, expenseHistory, setPatterns, setExpenseHistory, calculateTextSimilarity])

  // Obter insights sobre padrões de gastos
  const getSpendingInsights = useCallback(() => {
    if (expenseHistory.length < 10) return null

    const last30Days = expenseHistory.filter(expense => 
      isWithinDays(expense.date, new Date(), 30)
    )

    const categoryTotals = last30Days.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)

    const topCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)

    const avgDailySpending = last30Days.reduce((sum, exp) => sum + exp.amount, 0) / 30

    return {
      topCategories,
      avgDailySpending,
      totalExpenses: last30Days.length,
      totalAmount: last30Days.reduce((sum, exp) => sum + exp.amount, 0),
      mostFrequentCategory: topCategories[0]?.[0] || 'N/A'
    }
  }, [expenseHistory, isWithinDays])

  // Prever próximas despesas baseado em padrões
  const predictUpcomingExpenses = useCallback(() => {
    const recurringExpenses = expenseHistory
      .filter(expense => {
        const similar = expenseHistory.filter(exp => 
          exp.category === expense.category &&
          calculateTextSimilarity(exp.description, expense.description) > 0.7
        )
        return similar.length >= 3
      })
      .slice(0, 10)

    return recurringExpenses.map(expense => ({
      ...expense,
      predictedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dias
      confidence: 0.8
    }))
  }, [expenseHistory, calculateTextSimilarity])

  return {
    analyzeExpense,
    learnFromExpense,
    getSpendingInsights,
    predictUpcomingExpenses,
    patterns: [...defaultPatterns, ...patterns],
    isAnalyzing,
    expenseHistory: expenseHistory.slice(0, 100) // Retornar apenas últimas 100 para performance
  }
}