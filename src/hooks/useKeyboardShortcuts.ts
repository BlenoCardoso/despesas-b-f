import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export function useKeyboardShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Verificar se não estamos em um input/textarea
      const target = event.target as HTMLElement
      const isInputFocused = target.tagName === 'INPUT' || 
                            target.tagName === 'TEXTAREA' || 
                            target.contentEditable === 'true'

      if (isInputFocused && !event.ctrlKey && !event.metaKey) {
        return
      }

      const isCtrlOrCmd = event.ctrlKey || event.metaKey

      // Navegação rápida (Ctrl/Cmd + Número)
      if (isCtrlOrCmd && event.shiftKey) {
        switch (event.key) {
          case '1':
            event.preventDefault()
            navigate('/expenses')
            toast.success('📊 Despesas')
            break
          case '2':
            event.preventDefault()
            navigate('/tasks')
            toast.success('✅ Tarefas')
            break
          case '3':
            event.preventDefault()
            navigate('/documents')
            toast.success('📄 Documentos')
            break
          case '4':
            event.preventDefault()
            navigate('/medications')
            toast.success('💊 Medicamentos')
            break
          case '5':
            event.preventDefault()
            navigate('/calendar')
            toast.success('📅 Calendário')
            break
          case '6':
            event.preventDefault()
            navigate('/reports')
            toast.success('📈 Relatórios')
            break
          case '7':
            event.preventDefault()
            navigate('/settings')
            toast.success('⚙️ Configurações')
            break
        }
      }

      // Atalhos adicionais
      if (isCtrlOrCmd) {
        switch (event.key) {
          case 'n':
            // Ctrl+N para nova despesa/item (implementar por contexto)
            if (!isInputFocused) {
              event.preventDefault()
              toast.info('💡 Use Ctrl+Shift+N para novo item')
            }
            break
          case 'r':
            // Ctrl+R para refresh (permitir apenas se não for input)
            if (!isInputFocused) {
              event.preventDefault()
              window.location.reload()
            }
            break
        }
      }

      // Atalhos gerais (sem Ctrl)
      if (!isCtrlOrCmd && !isInputFocused) {
        switch (event.key) {
          case '?':
            event.preventDefault()
            showKeyboardShortcutsHelp()
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [navigate])
}

function showKeyboardShortcutsHelp() {
  toast.info('⌨️ Atalhos: Ctrl+K (buscar), Ctrl+Shift+1-7 (navegar), ? (ajuda)', { duration: 5000 })
}