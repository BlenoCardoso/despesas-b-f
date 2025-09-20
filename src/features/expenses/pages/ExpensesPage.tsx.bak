import React, { useState, useMemo, useEffect } from 'react'
import { ATTACHMENTS_ENABLED } from '../../../config/features'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  TrendingUp,
  X,
  FilterX
} from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ExpenseSummaryCard } from '../components/ExpenseSummaryCard'
import { ExpenseList } from '../components/ExpenseList'
import { ExpenseForm } from '../components/ExpenseForm'
import { ExpenseFiltersForm } from '../components/ExpenseFiltersForm'
import { useFirebaseExpenses } from '@/hooks/useFirebaseExpenses'
import { useFirebaseHousehold } from '@/hooks/useFirebaseHousehold'
import { useAuth } from '@/hooks/useAuth'
import { firebaseExpenseService } from '@/services/firebaseExpenseService'
import { 
  useBudgetSummary,
  useCategories,
} from '../hooks/useExpenses'
import { Expense, ExpenseFilter } from '../types'

import { toast } from 'sonner'
import { useExportReport } from '@/features/reports/hooks/useReports'
import { useNavigate } from 'react-router-dom'

export function ExpensesPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [activeFilters, setActiveFilters] = useState<ExpenseFilter>({})
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [headerCollapsed, setHeaderCollapsed] = useState(false)

  // Scroll listener para colapsar header
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 8
      setHeaderCollapsed(scrolled)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Error boundary para capturar erros
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('❌ Erro capturado:', event.error);
      setPageError(event.error?.message || 'Erro desconhecido');
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Se há erro na página, mostrar mensagem amigável
  if (pageError) {
    return (
      <div className="readable space-consistent min-h-full">
        <div className="bg-red-50 border border-red-200 rounded-lg padding-consistent-sm mb-4">
          <h3 className="font-semibold text-red-800 mb-2">Ops! Algo deu errado</h3>
          <p className="text-red-700 mb-4">
            {pageError}
          </p>
          <Button 
            onClick={() => {
              setPageError(null);
              window.location.reload();
            }}
            className="button-secondary-touch gap-2"
          >
            <span>🔄</span>
            Recarregar Página
          </Button>
        </div>
      </div>
    );
  }

  const navigate = useNavigate()
  const exportReport = useExportReport()

  // Firebase hooks
  const { currentHousehold, loading: householdLoading } = useFirebaseHousehold()
  const { user } = useAuth()
  // Usar o mesmo household ID fixo que usamos para criar despesas
  const fixedHouseholdId = currentHousehold?.id || '84d0cc61-1d5b-4cc6-8514-6388ce351bd8';
  
  console.log('🏠 Usando household ID para buscar despesas:', fixedHouseholdId);
  console.log('🏠 currentHousehold completo:', currentHousehold);
  console.log('🏠 householdLoading:', householdLoading);
  
  const {
    expenses: monthlyExpenses, 
    loading: expensesLoading, 
    createExpense, 
    updateExpense, 
    deleteExpense 
  } = useFirebaseExpenses(fixedHouseholdId)

  // Debug adicional para verificar o que está chegando
  React.useEffect(() => {
    console.log('🔍 HOOK RETORNOU - monthlyExpenses:', monthlyExpenses);
    console.log('🔍 HOOK RETORNOU - tipo:', typeof monthlyExpenses);
    console.log('🔍 HOOK RETORNOU - é array?', Array.isArray(monthlyExpenses));
    console.log('🔍 HOOK RETORNOU - length:', monthlyExpenses?.length);
  }, [monthlyExpenses]);  // Hooks do Firebase e locais
  const { data: categories = [] } = useCategories()
  const { data: budgetSummary } = useBudgetSummary(format(currentMonth, 'yyyy-MM'))
  
  // Debug: verificar se há categorias
  React.useEffect(() => {
    console.log('=== DEBUG CATEGORIAS ===');
    console.log('Household atual:', currentHousehold);
    console.log('Categorias disponíveis:', categories);
    console.log('Tipo de categories:', typeof categories);
    console.log('É array?', Array.isArray(categories));
    console.log('Quantidade:', categories?.length);
    console.log('========================');
  }, [categories, currentHousehold]);

  // Debug: verificar despesas com tratamento de erro
  React.useEffect(() => {
    try {
      console.log('=== DEBUG DESPESAS PAGE ===');
      console.log('monthlyExpenses:', monthlyExpenses);
      console.log('monthlyExpenses length:', monthlyExpenses?.length);
      console.log('expensesLoading:', expensesLoading);
      console.log('fixedHouseholdId:', fixedHouseholdId);
      console.log('user:', user);
      console.log('currentHousehold:', currentHousehold);
      console.log('===========================');
    } catch (error) {
      console.error('❌ Erro no debug das despesas:', error);
    }
  }, [monthlyExpenses, expensesLoading, fixedHouseholdId, user, currentHousehold]);

  // Filtrar expenses localmente - TEMPORARIAMENTE SEM FILTROS PARA DEBUG
  const filteredExpenses = useMemo(() => {
    console.log('🔍 FILTRO - monthlyExpenses originais:', monthlyExpenses);
    console.log('🔍 FILTRO - quantidade original:', monthlyExpenses?.length);
    console.log('🔍 FILTRO - primeira despesa (se houver):', monthlyExpenses?.[0]);
    
    // TEMPORÁRIO: retornar todas as despesas sem filtro
    console.log('⚠️ MODO DEBUG: Retornando TODAS as despesas sem filtro');
    return monthlyExpenses || [];

    // CÓDIGO ORIGINAL DOS FILTROS (comentado temporariamente)
    /*
    let filtered = monthlyExpenses

    // Search filter
    if (searchText.trim()) {
      const search = searchText.toLowerCase()
      filtered = filtered.filter(expense => 
        expense.description?.toLowerCase().includes(search) ||
        categories.find(cat => cat.id === expense.category)?.name.toLowerCase().includes(search)
      )
    }

    // Additional filters
    if (activeFilters.categoryIds?.length) {
      filtered = filtered.filter(expense => 
        activeFilters.categoryIds!.includes(expense.category)
      )
    }

    if (activeFilters.paymentMethods?.length) {
      filtered = filtered.filter(expense => 
        activeFilters.paymentMethods!.includes(expense.paymentMethod as any)
      )
    }

    if (activeFilters.minAmount !== undefined) {
      filtered = filtered.filter(expense => expense.amount >= activeFilters.minAmount!)
    }

    if (activeFilters.maxAmount !== undefined) {
      filtered = filtered.filter(expense => expense.amount <= activeFilters.maxAmount!)
    }

    console.log('🎯 FILTRO - resultado final:', filtered);
    console.log('🎯 FILTRO - quantidade final:', filtered?.length);
    return filtered
    */
  }, [monthlyExpenses, searchText, activeFilters, categories])

  // Removido summary de anexos via feature flag

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (activeFilters.categoryIds?.length) count++
    if (activeFilters.paymentMethods?.length) count++
    if (activeFilters.minAmount !== undefined) count++
    if (activeFilters.maxAmount !== undefined) count++
    if (activeFilters.hasRecurrence) count++
    if (activeFilters.hasInstallments) count++
    if (searchText.trim()) count++
    return count
  }, [activeFilters, searchText])

  // Old filtering logic - now handled by useFilteredExpenses hook
  /*
  const filteredExpenses = useMemo(() => {
    let filtered = monthlyExpenses

    // Search filter
    if (searchText.trim()) {
      const search = searchText.toLowerCase()
      filtered = filtered.filter(expense => 
        expense.title.toLowerCase().includes(search) ||
        expense.notes?.toLowerCase().includes(search) ||
        categories.find(cat => cat.id === expense.categoryId)?.name.toLowerCase().includes(search)
      )
    }

    // Additional filters
    if (activeFilters.categoryIds?.length) {
      filtered = filtered.filter(expense => 
        activeFilters.categoryIds!.includes(expense.categoryId)
      )
    }

    if (activeFilters.paymentMethods?.length) {
      filtered = filtered.filter(expense => 
        activeFilters.paymentMethods!.includes(expense.paymentMethod)
      )
    }

    if (activeFilters.minAmount !== undefined) {
      filtered = filtered.filter(expense => expense.amount >= activeFilters.minAmount!)
    }

    if (activeFilters.maxAmount !== undefined) {
      filtered = filtered.filter(expense => expense.amount <= activeFilters.maxAmount!)
    }

    return filtered
  }, [monthlyExpenses, searchText, activeFilters, categories])
  */

  // Calculate summary data
  const summaryData = useMemo(() => {
    const totalMonth = monthlyExpenses.reduce((sum: number, expense: any) => sum + expense.amount, 0)
    const budget = budgetSummary?.totalBudget || 0
    const remaining = Math.max(0, budget - totalMonth)
    
    // Cálculo simplificado por enquanto
    const dailyAverage = totalMonth / new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
    const projection = dailyAverage * 30
    
    // Calculate variation from last month (mock data for now)
    const variationFromLastMonth = 0 // TODO: Implement actual calculation

    return {
      totalMonth,
      budget,
      remaining,
      dailyAverage,
      projection,
      variationFromLastMonth,
    }
  }, [monthlyExpenses, budgetSummary, currentMonth])

  // Filter handlers
  const handleFiltersChange = (filters: ExpenseFilter) => {
    setActiveFilters(filters)
  }

  const handleResetFilters = () => {
    setActiveFilters({})
    setSearchText('')
  }

  // Handlers
  const handleCreateExpense = async (data: any) => {
    console.log('🚀 INICIANDO handleCreateExpense');
    console.log('🚀 Data recebida:', data);
    console.log('🚀 householdLoading:', householdLoading);
    console.log('🚀 currentHousehold:', currentHousehold);
    console.log('🚀 user:', user);
    
    // Verificar se temos os dados necessários
    if (!user) {
      console.error('❌ Usuário não autenticado');
      toast.error('Você precisa fazer login para criar despesas');
      return;
    }

    // Vamos usar o ID do household atual ou criar um temporário se necessário
    let householdId = currentHousehold?.id;
    
    if (!householdId) {
      console.log('⚠️ Nenhum household encontrado, vamos usar um household padrão temporariamente');
      // Por enquanto, vamos usar um ID fixo para testar
      householdId = '84d0cc61-1d5b-4cc6-8514-6388ce351bd8'; // ID que apareceu nos logs
      console.log('🔧 Usando household ID:', householdId);
    }

    try {
      console.log('📋 Dados do formulário:', data);
      console.log('🏠 Household atual:', currentHousehold);
      console.log('👤 Usuário atual:', user);
      
      // Mapear método de pagamento para o formato do Firebase
      const paymentMethodMap: Record<string, 'money' | 'card' | 'pix' | 'transfer'> = {
        'dinheiro': 'money',
        'cartao_credito': 'card',
        'cartao_debito': 'card',
        'pix': 'pix',
        'transferencia': 'transfer',
        'boleto': 'transfer'
      };
      
      // Validar dados obrigatórios
      if (!data.title || !data.amount || !data.categoryId) {
        console.error('❌ Dados obrigatórios faltando:', {
          title: !!data.title,
          amount: !!data.amount,
          categoryId: !!data.categoryId
        });
        toast.error('Por favor, preencha todos os campos obrigatórios');
        return;
      }
      
      // Adaptar os dados para o Firebase schema
      const expenseData = {
        description: data.title, // Converter title para description
        amount: Number(data.amount),
        category: data.categoryId, // Usar category em vez de categoryId
        paymentMethod: paymentMethodMap[data.paymentMethod as keyof typeof paymentMethodMap] || 'money',
        householdId: householdId,
        createdBy: user.id,
        // Campos opcionais
        ...(data.notes && { notes: data.notes }),
        ...(data.tags && { tags: data.tags }),
        ...(data.attachments && { attachments: data.attachments }),
      };
      
      console.log('✨ Dados adaptados para Firebase:', expenseData);
      
      // Anexos desativados via feature flag
      if (!ATTACHMENTS_ENABLED) {
        expenseData.attachments = []
      }

      // Usar o serviço do Firebase em vez do local
      console.log('💾 Chamando firebaseExpenseService.createExpense...');
      const expenseId = await firebaseExpenseService.createExpense(expenseData);
      console.log('✅ Despesa criada com ID:', expenseId);
      
      // Aguardar um pouco para o listener capturar a mudança
      setTimeout(() => {
        console.log('🔄 Verificando se a despesa apareceu na lista...');
      }, 1000);
      
      setShowExpenseForm(false)
      toast.success('Despesa criada com sucesso!')
    } catch (error) {
      console.error('❌ Erro detalhado ao criar despesa:', error);
      toast.error('Erro ao criar despesa: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    }
  }

  const handleUpdateExpense = async (data: any) => {
    if (!editingExpense) return
    
    try {
      await updateExpense(editingExpense.id, data)
      setEditingExpense(null)
      toast.success('Despesa atualizada com sucesso!')
    } catch (error) {
      toast.error('Erro ao atualizar despesa')
    }
  }

  const handleDeleteExpense = async (expense: any) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return
    
    try {
      await deleteExpense(expense.id)
      toast.success('Despesa excluída com sucesso!')
    } catch (error) {
      toast.error('Erro ao excluir despesa')
    }
  }

  const handleDuplicateExpense = async (expense: any) => {
    try {
      await createExpense({
        ...expense,
        id: undefined,
        createdAt: undefined,
        syncVersion: undefined
      });
      toast.success('Despesa duplicada com sucesso!')
    } catch (error) {
      toast.error('Erro ao duplicar despesa')
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
  }

  // Estado e handlers de anexos removidos via feature flag

  // Handler removidos - funcionalidade de exportação removida temporariamente

    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    
    // Criar ícones usando SVG para manter compatibilidade
    const downloadIcon = '<svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>'
    const fileTextIcon = '<svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>'
    const fileSpreadsheetIcon = '<svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="8" y1="9" x2="10" y2="9"/></svg>'
    
    modal.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-lg">
        <h3 class="font-semibold mb-4">Escolha o formato de exportação</h3>
          <div class="flex flex-col sm:flex-row gap-2 mb-4">
          <button id="csv-btn" class="button-secondary-touch bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center gap-2">
            ${fileTextIcon}<span aria-hidden="true">⬇️</span> CSV
          </button>
          <button id="excel-btn" class="button-secondary-touch bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2">
            ${fileSpreadsheetIcon}<span aria-hidden="true">⬇️</span> Excel
          </button>
          <button id="pdf-btn" class="button-secondary-touch bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center gap-2">
            ${downloadIcon}<span aria-hidden="true">⬇️</span> PDF
          </button>
        </div>
        <button id="cancel-btn" class="button-secondary-touch bg-gray-400 text-white rounded hover:bg-gray-500">Cancelar</button>
      </div>
    `
    
    document.body.appendChild(modal)
    
    // Add event listeners
    modal.querySelector('#csv-btn')?.addEventListener('click', () => {
      handleExportFormat('csv')
      document.body.removeChild(modal)
    })
    modal.querySelector('#excel-btn')?.addEventListener('click', () => {
      handleExportFormat('excel')
      document.body.removeChild(modal)
    })
    modal.querySelector('#pdf-btn')?.addEventListener('click', () => {
      handleExportFormat('pdf')
      document.body.removeChild(modal)
    })
    modal.querySelector('#cancel-btn')?.addEventListener('click', () => {
      document.body.removeChild(modal)
    })
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
      }
    })
  }

  const handleShowExportDialog = () => {
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    
    // Criar ícones usando SVG para manter compatibilidade
    const downloadIcon = '<svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>'
    const fileTextIcon = '<svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>'
    const fileSpreadsheetIcon = '<svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="8" y1="9" x2="10" y2="9"/></svg>'
    
    modal.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-lg">
        <h3 class="font-semibold mb-4">Escolha o formato de exportação</h3>
          <div class="flex flex-col sm:flex-row gap-2 mb-4">
          <button id="csv-btn" class="button-secondary-touch bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center gap-2">
            ${fileTextIcon}<span aria-hidden="true">⬇️</span> CSV
          </button>
          <button id="excel-btn" class="button-secondary-touch bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2">
            ${fileSpreadsheetIcon}<span aria-hidden="true">⬇️</span> Excel
          </button>
          <button id="pdf-btn" class="button-secondary-touch bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center gap-2">
            ${downloadIcon}<span aria-hidden="true">⬇️</span> PDF
          </button>
        </div>
        <button id="cancel-btn" class="button-secondary-touch bg-gray-400 text-white rounded hover:bg-gray-500">Cancelar</button>
      </div>
    `
    
    document.body.appendChild(modal)
    
    // Add event listeners
    modal.querySelector('#csv-btn')?.addEventListener('click', () => {
      handleExportFormat('csv')
      document.body.removeChild(modal)
    })
    modal.querySelector('#excel-btn')?.addEventListener('click', () => {
      handleExportFormat('excel')
      document.body.removeChild(modal)
    })
    modal.querySelector('#pdf-btn')?.addEventListener('click', () => {
      handleExportFormat('pdf')
      document.body.removeChild(modal)
    })
    modal.querySelector('#cancel-btn')?.addEventListener('click', () => {
      document.body.removeChild(modal)
    })
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
      }
    })
  }

  const handleExportFormat = async (exportFormat: 'csv' | 'excel' | 'pdf') => {
    try {
      const expensesToExport = filteredExpenses.map(expense => ({
        data: format(new Date(expense.createdAt), 'dd/MM/yyyy'),
        descricao: expense.description,
        categoria: categories.find(c => c.id === expense.category)?.name || 'Não categorizada',
        valor: expense.amount,
        metodo_pagamento: expense.paymentMethod,
        notas: expense.tags?.join(', ') || ''
      }))

      const filename = `despesas_${format(currentMonth, 'yyyy-MM')}`

      if (exportFormat === 'pdf') {
        // Para PDF, usar os dados de relatório mais completos
        const { reportService } = await import('@/features/reports/services/reportService')
        const reportData = {
          period: format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR }),
          totalExpenses: filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0),
          totalIncome: 0,
          balance: -filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0),
          expensesByCategory: categories.map(cat => {
            const categoryExpenses = filteredExpenses.filter(exp => exp.category === cat.id)
            const amount = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0)
            return {
              category: cat.name,
              amount,
              percentage: filteredExpenses.length > 0 ? (amount / filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)) * 100 : 0,
              count: categoryExpenses.length
            }
          }).filter(cat => cat.amount > 0)
        }
        
        const pdfBlob = await reportService.exportToPDF(reportData, 'expenses')
        const url = window.URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${filename}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else if (exportFormat === 'excel') {
        const { reportService } = await import('@/features/reports/services/reportService')
        const excelBlob = await reportService.exportToExcel(expensesToExport, filename)
        const url = window.URL.createObjectURL(excelBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${filename}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        await exportReport.mutateAsync({
          data: expensesToExport,
          format: exportFormat as 'csv',
          filename
        })
      }

      toast.success(`Despesas exportadas em ${exportFormat.toUpperCase()} com sucesso!`)
    } catch (error) {
      toast.error(`Erro ao exportar despesas em ${exportFormat.toUpperCase()}`)
    }
  }

  // Handler para importar despesas
  const handleImportExpenses = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.xlsx,.xls'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        toast.info('Funcionalidade de importação em desenvolvimento')
        // TODO: Implementar importação de arquivo
      }
    }
    input.click()
  }

  // Handler para navegar para relatórios
  const handleViewReports = () => {
    navigate('/reports')
  }

  return (
    <>
      {/* Header Compacto e Inteligente */}
      <header
        className="appbar sticky z-30 bg-zinc-950/90 backdrop-blur px-3 transition-all duration-200 hidden lg:block"
        role="banner"
      >
  <div className="appbar-inner readable w-full flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="appbar-title text-base font-semibold text-accessible-light truncate">
              Despesas
            </h1>
            {!headerCollapsed && (
              <p className="text-xs text-accessible-muted truncate">
                {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            )}
          </div>
          <div className="flex gap-2" role="toolbar" aria-label="Ações da página">
          {/* Unified search input with embedded icons for filter and calendar */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-accessible-light" aria-hidden="true" />
            <Input
              placeholder="Buscar despesas..."
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
              className="pl-10 pr-24 h-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors focus-visible"
              aria-label="Buscar despesas"
              role="searchbox"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                  <SheetTrigger asChild>
                  <button
                    aria-label={`Filtros${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}`}
                    className="relative button-icon-touch hover:bg-white/10 rounded-md transition-colors p-1"
                  >
                    <span aria-hidden="true" className="mr-1">🧪</span>
                    <Filter className="h-4 w-4 text-gray-500" />
                    {activeFilterCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs"
                        aria-hidden="true"
                      >
                        {activeFilterCount}
                      </Badge>
                    )}
                  </button>
                </SheetTrigger>
                <SheetContent className="flex flex-col h-full">
                  <SheetHeader className="shrink-0">
                    <SheetTitle>Filtros</SheetTitle>
                    <SheetDescription>
                      Filtre suas despesas por categoria, forma de pagamento e valor
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex-1 min-h-0 -mx-6 px-6">
                    <ExpenseFiltersForm
                      filters={activeFilters}
                      categories={categories}
                      onFiltersChange={handleFiltersChange}
                      onReset={handleResetFilters}
                      activeFilterCount={activeFilterCount}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Calendar dialog trigger */}
              <Dialog open={false} onOpenChange={() => {}}>
                {/* Placeholder to satisfy structure; actual dialog created below */}
              </Dialog>
              <button
                aria-label="Selecionar mês"
                className="button-icon-touch hover:bg-white/10 rounded-md transition-colors p-1"
                onClick={() => setShowMonthPicker(true)}
              >
                <span aria-hidden="true" className="mr-1">📅</span>
                <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
        </div>
      </header>

  {/* Barra de Busca Sticky */}
  <div className="sticky sticky-below-appbar z-20 bg-white/95 backdrop-blur py-2 border-b border-gray-200 hidden lg:block">
    <div className="readable">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
            <Input
              placeholder="Buscar despesas..."
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
              className="pl-10 h-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors focus-visible"
              aria-label="Campo de busca de despesas"
              role="searchbox"
            />
          </div>
        </div>
      </div>

      {/* Main Content com Safe Area */}
      <main 
        className="safe-bottom content-with-fab readable space-consistent min-h-full"
        role="main"
        aria-label="Lista de despesas"
      >{/* pb-24 para não brigar com o FAB */}

      {/* Área de anexos removida via feature flag */}

      {/* Summary Card Otimizado */}
      <ExpenseSummaryCard
        {...summaryData}
        isLoading={expensesLoading}
      />

      {/* Centralized search bar (matches mobile screenshot) */}
      <div className="py-3">
        <div className="readable">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
            <Input
              placeholder="Buscar despesas..."
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
              className="pl-12 pr-28 h-11 bg-zinc-900/70 text-white border border-zinc-800 focus:bg-zinc-900 transition-colors"
              aria-label="Buscar despesas"
              role="searchbox"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <button
                    aria-label={`Filtros${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}`}
                    className="button-icon-touch hover:bg-white/5 rounded-md transition-colors p-2 text-white"
                  >
                    <span aria-hidden="true" className="mr-1">🧪</span>
                    <Filter className="h-4 w-4 text-white" />
                  </button>
                </SheetTrigger>
              </Sheet>

              <button
                aria-label="Selecionar mês"
                className="button-icon-touch hover:bg-white/5 rounded-md transition-colors p-2 text-white"
                onClick={() => setShowMonthPicker(true)}
              >
                <span aria-hidden="true" className="mr-1">📅</span>
                <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters - Mobile Optimized */}
      {activeFilterCount > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-2 flex-wrap"
        >
          <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
            <FilterX className="h-3 w-3" aria-hidden="true" />
            <span>Filtros:</span>
          </div>
          {searchText.trim() && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Search className="h-3 w-3" aria-hidden="true" />
              "{searchText.length > 10 ? searchText.substring(0, 10) + '...' : searchText}"
              <button 
                onClick={() => setSearchText('')}
                className="touch-target-small ml-1 hover:bg-gray-200 rounded"
                aria-label="Remover filtro de busca"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {activeFilters.categoryIds?.length && (
            <Badge variant="secondary" className="gap-1 text-xs">
              🏷️ {activeFilters.categoryIds.length} cat.
              <button 
                onClick={() => setActiveFilters(prev => ({ ...prev, categoryIds: [] }))}
                className="touch-target-small ml-1 hover:bg-gray-200 rounded"
                aria-label="Remover filtro de categorias"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {activeFilters.paymentMethods?.length && (
            <Badge variant="secondary" className="gap-1 text-xs">
              💳 {activeFilters.paymentMethods.length} pag.
              <button 
                onClick={() => setActiveFilters(prev => ({ ...prev, paymentMethods: [] }))}
                className="touch-target-small ml-1 hover:bg-gray-200 rounded"
                aria-label="Remover filtro de formas de pagamento"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {(activeFilters.minAmount !== undefined || activeFilters.maxAmount !== undefined) && (
            <Badge variant="secondary" className="gap-1 text-xs">
              💰 Valor
              <button 
                onClick={() => setActiveFilters(prev => ({ ...prev, minAmount: undefined, maxAmount: undefined }))}
                className="touch-target-small ml-1 hover:bg-gray-200 rounded"
                aria-label="Remover filtro de valor"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          <Button variant="outline" size="sm" onClick={handleResetFilters} className="btn-touch-safe-sm text-xs">
            Limpar
          </Button>
        </motion.div>
      )}

      {/* Expense List */}
      <ExpenseList
        expenses={filteredExpenses as any}
        categories={categories}
        onEdit={handleEditExpense}
        onDuplicate={handleDuplicateExpense}
        onDelete={handleDeleteExpense}
        onViewAttachments={() => {}}
        isLoading={expensesLoading}
        emptyMessage={
          searchText.trim() || activeFilterCount > 0
            ? "Nenhuma despesa encontrada com os filtros aplicados"
            : "Nenhuma despesa neste mês. Clique em 'Nova Despesa' para começar."
        }
      />

      {/* Create Expense Dialog */}
      <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Despesa</DialogTitle>
            <DialogDescription>
              Adicione uma nova despesa ao seu orçamento
            </DialogDescription>
          </DialogHeader>
          <ExpenseForm
            categories={categories}
            onSubmit={handleCreateExpense}
            onCancel={() => setShowExpenseForm(false)}
            isLoading={false}
          />
        </DialogContent>
      </Dialog>

      {/* Month picker dialog */}
      <Dialog open={showMonthPicker} onOpenChange={setShowMonthPicker}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Selecionar mês</DialogTitle>
            <DialogDescription>Escolha o mês para visualizar as despesas</DialogDescription>
          </DialogHeader>
          <div className="py-2 flex items-center justify-between gap-2">
            <Button variant="outline" onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>◀</Button>
            <div className="text-center">
              <div className="font-medium">{format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}</div>
            </div>
            <Button variant="outline" onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>▶</Button>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowMonthPicker(false)}>Cancelar</Button>
            <Button onClick={() => setShowMonthPicker(false)}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={!!editingExpense} onOpenChange={() => setEditingExpense(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Despesa</DialogTitle>
            <DialogDescription>
              Modifique os dados da despesa
            </DialogDescription>
          </DialogHeader>
          {editingExpense && (
            <ExpenseForm
              expense={editingExpense}
              categories={categories}
              onSubmit={handleUpdateExpense}
              onCancel={() => setEditingExpense(null)}
              isLoading={false}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Visualizador de Anexos removido via feature flag */}

        {/* Floating Action Button (FAB) */}
        <Button
          onClick={() => setShowExpenseForm(true)}
          className="fixed fab-safe-bottom right-5 h-14 w-14 min-h-[56px] min-w-[56px] rounded-full shadow-2xl hover:shadow-2xl transition-all duration-200 z-50 bg-blue-600 hover:bg-blue-700 active:scale-95 flex items-center justify-center focus-visible"
          size="default"
          aria-label="Adicionar nova despesa"
          style={{
            boxShadow: '0 8px 25px -8px rgba(59, 130, 246, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
          }}
        >
          <Plus className="h-6 w-6" aria-hidden="true" />
        </Button>
        {/* Mobile-only floating menu button (fallback) */}
        <button
          className="lg:hidden fixed left-4 bottom-5 z-50 h-12 w-12 rounded-full bg-white shadow-md flex items-center justify-center focus-visible"
          aria-label="Abrir menu"
          onClick={() => {
            console.debug('[ExpensesPage] mobile menu button clicked - dispatching event')
            window.dispatchEvent(new Event('open-mobile-sidebar-forced'))
          }}
        >
          <svg className="h-6 w-6 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </main>
    </>
  )
}

