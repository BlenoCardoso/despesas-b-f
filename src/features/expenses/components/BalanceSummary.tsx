import { useState } from 'react'
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
import { ChevronDownIcon, ChevronUpIcon, ArrowRightIcon } from '@radix-ui/react-icons'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useHouseholdBalance } from '../hooks/useHouseholdBalance'
import { formatCurrency } from '@/utils/formatters'
import { useHouseholdMembers } from '@/features/households/hooks/useHouseholdMembers'

interface BalanceSummaryProps {
  householdId: string
}

export function BalanceSummary({ householdId }: BalanceSummaryProps) {
  const [showHistory, setShowHistory] = useState(false)
  const { 
    balance,
    settings,
    settleHistory,
    stats,
    isLoading,
    toggleUnifyExpenses
  } = useHouseholdBalance(householdId)

  const { members } = useHouseholdMembers(householdId)
  
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

  const month = format(new Date(), 'MMMM yyyy', { locale: ptBR })
  const memberMap = new Map(members.map(m => [m.userId, m.user]))

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Resumo do mês</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-normal">Unificar despesas</span>
            <Switch 
              checked={settings.unifyExpenses}
              onCheckedChange={toggleUnifyExpenses}
            />
          </div>
        </CardTitle>
        <CardDescription>
          {month} • Total: {formatCurrency(balance.totalExpenses)}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Lista de saldos por membro */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Saldos individuais</h4>
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
                  const member = memberMap.get(memberBalance.memberId)
                  if (!member) return null

                  return (
                    <TableRow key={memberBalance.memberId}>
                      <TableCell className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.photoURL || ''} />
                          <AvatarFallback>
                            {member.name?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.name}</span>
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

          {/* Transferências sugeridas */}
          {balance.suggestedTransfers.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3">Acertos sugeridos</h4>
              <div className="space-y-2">
                {balance.suggestedTransfers.map((transfer, index) => {
                  const from = memberMap.get(transfer.fromMemberId)
                  const to = memberMap.get(transfer.toMemberId)
                  if (!from || !to) return null

                  return (
                    <div 
                      key={index}
                      className="flex items-center gap-2 p-2 rounded bg-muted/50"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={from.photoURL || ''} />
                        <AvatarFallback>
                          {from.name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{from.name}</span>
                      <ArrowRightIcon className="mx-2" />
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={to.photoURL || ''} />
                        <AvatarFallback>
                          {to.name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{to.name}</span>
                      <span className="ml-auto font-medium">
                        {formatCurrency(transfer.amount)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

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
                            <AvatarImage src={from.photoURL || ''} />
                            <AvatarFallback>
                              {from.name?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <ArrowRightIcon className="flex-shrink-0" />
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarImage src={to.photoURL || ''} />
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
    </Card>
  )
}