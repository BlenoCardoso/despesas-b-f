import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table'
import { ChevronDownIcon, ChevronUpIcon, ArrowRightIcon } from '@/components/ui/icons'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useHouseholdBalance } from '../hooks/useHouseholdBalance'
import { formatCurrency } from '@/utils/formatters'
import { subMonths, addMonths, startOfMonth, endOfMonth } from 'date-fns'
import { useHouseholdMembers } from '@/features/households/hooks/useHouseholdMembers'
import { useBudgets, useBudgetSummary, useBudgetAlerts } from '../hooks/useExpenses'
// ... existing imports
import { Modal, ModalContent, ModalHeader, ModalFooter, ModalBody } from '@/components/ui/modal'
import { Checkbox } from '@/components/ui/checkbox'
import { useQueryClient } from '@tanstack/react-query'
import { BalanceService } from '../services/balanceService'
import { accountService } from '@/features/accounts/services/accountService'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import ActivityFeed from '@/features/notifications/components/ActivityFeed'

interface BalanceSummaryProps {
  householdId: string
}

export function BalanceSummary({ householdId }: BalanceSummaryProps) {
  const [showHistory, setShowHistory] = useState(false)
  const [showSettleModal, setShowSettleModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [accountsList, setAccountsList] = useState<Array<{ id: string; name: string; balance?: number }>>([])
  const [fromAccount, setFromAccount] = useState('')
  const [toAccount, setToAccount] = useState('')
  const [transferAmount, setTransferAmount] = useState<number | ''>('')
  const [selectedTransfers, setSelectedTransfers] = useState<number[]>([])
  // local editable map for transfer metadata
  const [transferEdits, setTransferEdits] = useState<Record<number, { amount?: number; paymentDate?: string; paymentMethod?: string }>>({})
  const queryClient = useQueryClient()
  const balanceService = new BalanceService()
  const { 
    balance,
    settings,
    settleHistory,
    stats,
    isLoading,
    toggleUnifyExpenses
  } = useHouseholdBalance(householdId)

  const { members } = useHouseholdMembers(householdId)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const monthStr = selectedMonth.toISOString().slice(0,7) // YYYY-MM
  const periodStart = startOfMonth(selectedMonth)
  const periodEnd = endOfMonth(selectedMonth)
  const { data: budgets } = useBudgets(monthStr)
  const { data: budgetSummary } = useBudgetSummary(monthStr)
  const { data: budgetAlerts } = useBudgetAlerts(monthStr)
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem(`budget-alert-dismissed-${monthStr}`)
    } catch (e) {
      return false
    }
  })

  // Load accounts for transfer UI
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const list = await accountService.listAccounts(householdId)
        if (!mounted) return
        setAccountsList(list.map(a => ({ id: a.id, name: a.name, balance: a.balance })))
      } catch (e) {
        // ignore
      }
    })()
    return () => { mounted = false }
  }, [householdId])
  
  if (isLoading || !balance || !settings || !members) {
    return (
      <Card className="w-full animate-pulse">
        <CardHeader>
          <div className="h-8 w-3/4 bg-muted rounded" />
          <div className="h-4 w-1/2 bg-muted rounded mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // previous month opening balance not used currently
  const memberMap = new Map(members.map(m => [m.userId, m.user]))

  return (
    <Card className="w-full">
      {/* Budget alerts banner */}
      {budgetAlerts && budgetAlerts.length > 0 && !dismissed && (
        <div className="bg-yellow-100 dark:bg-yellow-900/60 border-b p-3 flex items-start gap-3">
          <div className="flex-1">
            <div className="font-medium">Aviso de orçamento</div>
            <div className="text-sm text-muted-foreground">
              {budgetAlerts.slice(0,3).map((a: any) => (
                <div key={a.budget.id} className={a.alertType === 'exceeded' ? 'text-red-700' : 'text-yellow-800'}>
                  {a.message}
                </div>
              ))}
              {budgetAlerts.length > 3 && <div className="text-xs text-muted-foreground">E mais {budgetAlerts.length - 3} alertas...</div>}
            </div>
          </div>
          <div>
            <Button size="sm" variant="ghost" onClick={() => {
              try {
                localStorage.setItem(`budget-alert-dismissed-${monthStr}`, '1')
              } catch (e) {}
              setDismissed(true)
            }}>Fechar</Button>
          </div>
        </div>
      )}
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => setSelectedMonth(m => subMonths(m, 1))}>&lt;</Button>
              <span>Resumo do mês</span>
            </div>
            <div className="text-sm text-muted-foreground">{format(selectedMonth, "MMMM yyyy", { locale: ptBR })}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-normal">Unificar despesas</span>
            <Switch 
              checked={settings.unifyExpenses}
              onCheckedChange={toggleUnifyExpenses}
            />
          </div>
        </CardTitle>
        <CardDescription>
          Período: {format(periodStart, "dd/MM/yyyy")} - {format(periodEnd, "dd/MM/yyyy")} • Total: {formatCurrency(balance.totalExpenses)}
        </CardDescription>
      </CardHeader>

      {/* Sticky summary bar - aparece ao rolar */}
      <div className="sticky top-0 z-20 bg-white dark:bg-black/80 border-b">
        <div className="max-w-full mx-auto px-4 py-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Total do mês</span>
              <span className="text-sm font-semibold">{formatCurrency(balance.totalExpenses)}</span>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar">
              {/* show compact chips for each member with avatar and their balance */}
              {balance.memberBalances.map(mb => {
                const member = memberMap.get(mb.memberId) as any
                if (!member) return null
                return (
                  <div key={mb.memberId} className="flex-shrink-0 flex items-center gap-2 px-2 py-1 rounded-md border">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={member.photoURL || member.displayName || ''} />
                      <AvatarFallback>{member.name?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                      <div className="text-sm">
                        <div className="font-medium">{member.name}</div>
                        <div className={mb.balance > 0 ? 'text-emerald-600 dark:text-emerald-400 text-xs' : mb.balance < 0 ? 'text-rose-600 dark:text-rose-400 text-xs' : 'text-xs'}>{formatCurrency(mb.balance)}</div>
                      </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <CardContent>
        <div className="space-y-6">
          {/* Monthly summary header actions */}
          <div className="flex items-center justify-end gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <Button size="sm" onClick={async () => {
                try {
                  const { exportCSV, download } = await import('@/services/exportService')
                  const csvBlob = await exportCSV({ householdId, startDate: periodStart, endDate: periodEnd })
                  await download(`despesas-${monthStr}.csv`, csvBlob)
                } catch (e) {
                  console.warn('Export CSV failed', e)
                }
              }}>Exportar CSV</Button>

              <Button size="sm" onClick={async () => {
                try {
                  const { exportPDF } = await import('@/services/exportService')
                  await exportPDF({ householdId, startDate: periodStart, endDate: periodEnd })
                } catch (e) {
                  console.warn('Export PDF failed', e)
                }
              }}>Exportar PDF</Button>
            </div>

            {/* Mobile compact menu */}
            <div className="sm:hidden relative">
              <button className="px-3 py-2 border rounded" onClick={() => {
                const menu = document.getElementById('export-menu-mobile')
                if (menu) menu.classList.toggle('hidden')
              }}>⋯</button>
              <div id="export-menu-mobile" className="hidden absolute right-0 mt-2 w-40 bg-white shadow rounded border z-40">
                <button className="w-full text-left px-3 py-2 hover:bg-muted" onClick={async () => {
                  try {
                    const { exportCSV, download } = await import('@/services/exportService')
                    const csvBlob = await exportCSV({ householdId, startDate: periodStart, endDate: periodEnd })
                    await download(`despesas-${monthStr}.csv`, csvBlob)
                  } catch (e) { console.warn(e) }
                }}>Exportar CSV</button>
                <button className="w-full text-left px-3 py-2 hover:bg-muted" onClick={async () => {
                  try {
                    const { exportPDF } = await import('@/services/exportService')
                    await exportPDF({ householdId, startDate: periodStart, endDate: periodEnd })
                  } catch (e) { console.warn(e) }
                }}>Exportar PDF</button>
              </div>
            </div>
          </div>
          {/* Lista de saldos por membro */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Saldos individuais</h4>

            {/* Mobile stacked view (small screens) */}
            <div className="block sm:hidden space-y-2">
              {balance.memberBalances.map(memberBalance => {
                const member = memberMap.get(memberBalance.memberId) as any
                if (!member) return null
                return (
                  <div key={memberBalance.memberId} className="flex items-center justify-between p-3 rounded border bg-white">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={member.photoURL || member.displayName || ''} />
                        <AvatarFallback>{member.name?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-sm">{member.name}</div>
                        <div className="text-xs text-muted-foreground">Pagou {formatCurrency(memberBalance.paid)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{formatCurrency(memberBalance.balance)}</div>
                      <div className="text-xs text-muted-foreground">Deve {formatCurrency(memberBalance.share)}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop/tablet view */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membro</TableHead>
                    <TableHead>Pagou</TableHead>
                    <TableHead>Deve pagar</TableHead>
                    <TableHead>Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balance.memberBalances.map(memberBalance => {
                    const member = memberMap.get(memberBalance.memberId) as any
                    if (!member) return null

                    return (
                      <TableRow key={memberBalance.memberId}>
                        <TableCell className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.photoURL || member.displayName || ''} />
                            <AvatarFallback>
                              {member.name?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-2">
                            <span>{member.name || member.displayName}</span>
                            {balance.roundingAdjustments && (
                              (() => {
                                const r = balance.roundingAdjustments!.find(x => x.memberId === memberBalance.memberId)
                                if (!r || r.cents === 0) return null
                                const sign = r.cents > 0 ? '+' : '-'
                                return <span className="text-xs text-muted-foreground">{sign}{Math.abs(r.cents)}c</span>
                              })()
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(memberBalance.paid)}</TableCell>
                        <TableCell>{formatCurrency(memberBalance.share)}</TableCell>
                        <TableCell>
                          <span className={
                            memberBalance.balance > 0 
                              ? 'text-green-600 dark:text-green-400'
                              : memberBalance.balance < 0
                                ? 'text-red-600 dark:text-red-400'
                                : ''
                          }>
                            {formatCurrency(memberBalance.balance)}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Transferências sugeridas */}
          {balance.suggestedTransfers.length > 0 && (
            <div>
              {/* Humanized suggestion */}
              {balance.suggestedTransfers.length > 0 && (
                <div className="text-sm text-muted-foreground mb-2">
                  {(() => {
                    const t = balance.suggestedTransfers[0]
                    const from = memberMap.get(t.fromMemberId)
                    const to = memberMap.get(t.toMemberId)
                    if (!from || !to) return null
                    return <div>Para fechar, <strong>{from.name}</strong> transfere {formatCurrency(t.amount)} para <strong>{to.name}</strong>.</div>
                  })()}
                </div>
              )}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold mb-3">Acertos sugeridos</h4>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => setShowSettleModal(true)}>
                    Acertar mês
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowTransferModal(true)}>
                    Transferir entre contas
                  </Button>
                </div>
              </div>
                <div className="space-y-2">
                  {balance.suggestedTransfers.map((transfer, index) => {
                  const from = memberMap.get(transfer.fromMemberId)
                  const to = memberMap.get(transfer.toMemberId)
                  if (!from || !to) return null

                  return (
                      <div 
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={(from as any).photoURL || (from as any).displayName || ''} />
                            <AvatarFallback>
                              {from.name?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{from.name}</span>
                          <ArrowRightIcon className="mx-2 hidden sm:inline" />
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={(to as any).photoURL || (to as any).displayName || ''} />
                            <AvatarFallback>
                              {to.name?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{to.name}</span>
                        </div>
                        <div className="ml-auto font-medium text-right sm:text-right">
                          {formatCurrency(transfer.amount)}
                        </div>
                      </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Modal para confirmar acerto do mês */}
          <Modal open={showSettleModal} onOpenChange={setShowSettleModal}>
            <ModalContent>
              <ModalHeader>
                <h3 className="text-lg font-medium">Acertar mês</h3>
                <p className="text-sm text-muted-foreground">Confirme as transferências que deseja registrar.</p>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-2">
                  {balance.suggestedTransfers.map((transfer, index) => {
                    const from = memberMap.get(transfer.fromMemberId)
                    const to = memberMap.get(transfer.toMemberId)
                    if (!from || !to) return null

                    return (
                      <div key={index} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                        <div className="flex items-center gap-2 w-full">
                          <div className="flex items-center gap-2">
                            <Checkbox 
                              checked={selectedTransfers.includes(index)}
                              onCheckedChange={(v: boolean | undefined) => {
                                setSelectedTransfers(prev => v ? [...prev, index] : prev.filter(i => i !== index))
                              }}
                            />
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={(from as any).photoURL || (from as any).displayName || ''} />
                              <AvatarFallback>{from.name?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{from.name}</span>
                            <ArrowRightIcon className="mx-2" />
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={(to as any).photoURL || (to as any).displayName || ''} />
                              <AvatarFallback>{to.name?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{to.name}</span>
                          </div>
                          <div className="ml-auto flex items-center gap-2">
                            <Input className="w-28" value={(transferEdits[index]?.amount ?? transfer.amount) as any} onChange={e => {
                              const v = Number(e.target.value) || 0
                              setTransferEdits(prev => ({ ...prev, [index]: { ...(prev[index] || {}), amount: v } }))
                            }} />
                            <Input type="date" className="w-36" value={transferEdits[index]?.paymentDate ?? ''} onChange={e => {
                              setTransferEdits(prev => ({ ...prev, [index]: { ...(prev[index] || {}), paymentDate: e.target.value } }))
                            }} />
                            <Select onValueChange={v => setTransferEdits(prev => ({ ...prev, [index]: { ...(prev[index] || {}), paymentMethod: v } }))} defaultValue={transferEdits[index]?.paymentMethod || 'pix'}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pix">Pix</SelectItem>
                                <SelectItem value="bank_transfer">Transferência</SelectItem>
                                <SelectItem value="money">Dinheiro</SelectItem>
                                <SelectItem value="other">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ModalBody>
              <ModalFooter>
                <div className="flex gap-2 w-full">
                  <Button variant="ghost" onClick={() => setShowSettleModal(false)}>Cancelar</Button>
                  <Button
                    onClick={async () => {
                      // Registrar cada transferência selecionada
                      const picks = selectedTransfers.length > 0 ? selectedTransfers : balance.suggestedTransfers.map((_, i) => i)

                      for (const idx of picks) {
                        const t = balance.suggestedTransfers[idx]
                        const edited = transferEdits[idx] || {}
                        try {
                          const amount = edited.amount ?? t.amount
                          const paymentDate = edited.paymentDate ? new Date(edited.paymentDate) : new Date()
                          const paymentMethod = edited.paymentMethod || 'pix'

                          await balanceService.settleUp({
                            householdId,
                            fromMemberId: t.fromMemberId,
                            toMemberId: t.toMemberId,
                            amount,
                            expenseIds: [],
                            month: selectedMonth.getMonth() + 1,
                            year: selectedMonth.getFullYear(),
                            notes: 'Acerto mensal',
                            paymentMethod,
                            paymentDate,
                            status: 'registered'
                          })
                        } catch (e) {
                          // continue com próximas, coleta de erros pode ser adicionada
                        }
                      }

                      // Atualiza queries locais
                      await queryClient.invalidateQueries({ queryKey: ['balance', householdId] })
                      await queryClient.invalidateQueries({ queryKey: ['settleHistory', householdId] })
                      setSelectedTransfers([])
                      setShowSettleModal(false)
                    }}
                  >
                    Confirmar acerto
                  </Button>
                </div>
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* Transfer modal */}
          <Modal open={showTransferModal} onOpenChange={setShowTransferModal}>
            <ModalContent>
              <ModalHeader>
                <h3 className="text-lg font-medium">Transferência entre contas</h3>
                <p className="text-sm text-muted-foreground">Transferências entre suas carteiras não são registradas como despesa.</p>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Origem</label>
                    <Select onValueChange={v => setFromAccount(v)} defaultValue={fromAccount}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {accountsList.map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.name} {a.balance !== undefined ? `(${formatCurrency(a.balance)})` : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Destino</label>
                    <Select onValueChange={v => setToAccount(v)} defaultValue={toAccount}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {accountsList.map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.name} {a.balance !== undefined ? `(${formatCurrency(a.balance)})` : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Valor</label>
                    <Input value={transferAmount as any} onChange={e => setTransferAmount(Number(e.target.value) || '')} />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <div className="flex gap-2 w-full">
                  <Button variant="ghost" onClick={() => setShowTransferModal(false)}>Cancelar</Button>
                  <Button onClick={async () => {
                    if (!fromAccount || !toAccount || !transferAmount || transferAmount <= 0) return
                    try {
                      await accountService.transfer({ householdId, fromAccountId: fromAccount, toAccountId: toAccount, amount: Number(transferAmount), createdBy: undefined })
                      setShowTransferModal(false)
                      queryClient.invalidateQueries({ queryKey: ['accounts', householdId] })
                      queryClient.invalidateQueries({ queryKey: ['balance', householdId] })
                    } catch (e) {
                      console.warn('Transfer failed', e)
                    }
                  }}>Confirmar transferência</Button>
                </div>
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* Histórico de acertos */}
          {settleHistory.length > 0 && (
            <div>
              <Button
                variant="ghost"
                className="w-full flex items-center justify-between p-3 -mx-3"
                onClick={() => setShowHistory(h => !h)}
              >
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold">
                    Histórico de acertos
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {settleHistory.length} acertos realizados
                  </span>
                </div>
                {showHistory ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </Button>

              {showHistory && (
                <div className="space-y-2 mt-2">
                  {settleHistory.map(record => {
                    const from = memberMap.get(record.fromMemberId)
                    const to = memberMap.get(record.toMemberId)
                    if (!from || !to) return null

                    return (
                      <div 
                        key={record.id}
                        className="flex items-center gap-2 p-2 rounded bg-muted/50"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarImage src={(from as any).photoURL || (from as any).displayName || ''} />
                            <AvatarFallback>
                              {from.name?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <ArrowRightIcon className="flex-shrink-0" />
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarImage src={(to as any).photoURL || (to as any).displayName || ''} />
                            <AvatarFallback>
                              {to.name?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate">
                            {formatCurrency(record.amount)}
                          </span>
                        </div>
                        <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
                          {format(record.settledAt, "dd 'de' MMM", { locale: ptBR })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* Budgets summary per category */}
      {budgets && budgets.length > 0 && (
        <CardContent className="border-t">
          <h4 className="text-sm font-semibold mb-2">Orçamentos</h4>
          <div className="space-y-3">
            {budgets.map(b => (
              <div key={b.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="truncate font-medium">{b.categoryName || 'Geral'}</div>
                    <div className="text-sm text-muted-foreground">{formatCurrency(b.spent)} / {formatCurrency(b.amount)}</div>
                  </div>
                  <div className="w-full bg-muted h-2 rounded mt-1 overflow-hidden">
                    <div style={{ width: `${Math.min(100, Math.round(b.percentage))}%` }} className={`h-2 ${b.percentage >= 100 ? 'bg-red-600' : b.percentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'}`} />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{Math.round(b.percentage)}%</span>
                    {b.percentage >= 100 ? <span className="text-xs text-red-600">Ultrapassou</span> : b.percentage >= 80 ? <span className="text-xs text-yellow-600">Perigo</span> : <span className="text-xs text-muted-foreground">OK</span>}
                  </div>
                </div>
              </div>
            ))}
            {budgetSummary && (
              <div className="text-sm text-muted-foreground">
                Orçamento total: {formatCurrency(budgetSummary.totalBudget)} • Gasto: {formatCurrency(budgetSummary.totalSpent)} • Restante: {formatCurrency(budgetSummary.totalRemaining)}
              </div>
            )}
          </div>
        </CardContent>
      )}
      {stats && (
        <CardFooter className="flex flex-col gap-2">
          <div className="w-full flex items-center justify-between text-sm text-muted-foreground">
            <span>Total pendente</span>
            <span>{formatCurrency(stats.pendingBalance)}</span>
          </div>
          {stats.lastSettleDate && (
            <div className="w-full flex items-center justify-between text-sm text-muted-foreground">
              <span>Último acerto</span>
              <span>
                {format(stats.lastSettleDate, "dd 'de' MMMM", { locale: ptBR })}
              </span>
            </div>
          )}
        </CardFooter>
      )}
      {/* Recent activity feed (simple household timeline) */}
      <CardContent className="border-t">
        <h4 className="text-sm font-semibold mb-2">Atividade recente</h4>
        <ActivityFeed householdId={householdId} />
      </CardContent>
    </Card>
  )
}