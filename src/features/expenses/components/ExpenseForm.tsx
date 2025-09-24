import React, { useEffect, useState } from 'react'
import { formatCurrency, formatDate, parseCurrency } from '@/core/utils/formatters'
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem
} from '@/components/ui/select'
import CategoryIcon from './categoryIcon'

interface Member { id: string; name: string }

interface User { id: string; name?: string }

interface Props {
	expense?: any
	initialData?: any
	categories?: any[]
	onSubmit?: (data: any) => void
	onSuccess?: (data: any) => void
	onCancel?: () => void
	isLoading?: boolean
	coupleMode?: boolean
	members?: Member[]
	currentUser?: User | null
}

function ExpenseFormComponent({ expense, initialData, categories = [], onSubmit, onSuccess, onCancel, isLoading = false, coupleMode = false, members = [], currentUser = null }: Props) {
	if (!expense && initialData) expense = initialData

	const [title, setTitle] = useState<string>(expense?.title || expense?.description || '')
	const [amountInput, setAmountInput] = useState<string>(expense?.amount != null ? formatCurrency(expense.amount) : '')
	const [date, setDate] = useState<string>(expense?.date ? new Date(expense.date).toISOString().slice(0,10) : new Date().toISOString().slice(0,10))
	const [type, setType] = useState<'expense' | 'income'>((expense?.type as any) || 'expense')
	const [categoryId, setCategoryId] = useState<string>(expense?.categoryId || (categories[0]?.id || ''))
	const [tagsRaw, setTagsRaw] = useState<string>(expense?.tags ? (expense.tags.join(', ')) : '')
	const [tags, setTags] = useState<string[]>(expense?.tags ? [...expense.tags] : [])
	const [recorrente, setRecorrente] = useState<boolean>(!!expense?.recurrence)
	const [frequency, setFrequency] = useState<string>('monthly')
	const [interval, setInterval] = useState<number>(1)
	const [advancedOpen, setAdvancedOpen] = useState<boolean>(false)
	const [errors, setErrors] = useState<string[]>([])
	const [splitMethod, setSplitMethod] = useState<'equal'|'percentage'|'exact'>('equal')
	const [participants, setParticipants] = useState<string[]>([])
	const [splitPreview, setSplitPreview] = useState<Array<{ participantId: string; percentage: number }>>([])

	useEffect(() => {
		if (expense?.amount != null) setAmountInput(formatCurrency(expense.amount))
		if (expense?.categoryId) setCategoryId(expense.categoryId)
		if (expense?.split && Array.isArray(expense.split.parts)) {
			setSplitPreview(expense.split.parts.map((p: any) => ({ participantId: p.participantId, percentage: p.percentage })))
			setParticipants(expense.split.parts.map((p: any) => p.participantId))
		}
	}, [expense])

	const validate = () => {
		const errs: string[] = []
		if (!title || !title.trim()) errs.push('Descrição é obrigatória')
		if (!amountInput) errs.push('Valor é obrigatório')
		else if ((parseCurrency(amountInput) || 0) <= 0) errs.push('Valor deve ser positivo')
		if (!categoryId) errs.push('Categoria é obrigatória')
		setErrors(errs)
		return errs.length === 0
	}

	const handleSubmit = (e?: React.FormEvent) => {
		e?.preventDefault()
		if (!validate()) return
		const data: any = {
			title,
			amount: parseCurrency(amountInput) || 0,
			date: date ? new Date(date).toISOString() : undefined,
			categoryId,
			type,
			tags: tags.length ? tags : undefined,
			recurrence: recorrente ? { frequency, interval } : undefined,
		}

		// If coupleMode is active and there are at least 2 members selected, include split based on preview
		if (coupleMode && splitPreview.length >= 1) {
			data.split = {
				mode: 'percentage',
				participants: splitPreview.map(p => ({ memberId: p.participantId, percentage: p.percentage })),
				visibility: 'shared'
			}
		} else if (splitMethod === 'equal' && participants.length >= 2) {
			// default equal split among selected participants
			const per = Math.round(100 / participants.length)
			data.split = { mode: 'percentage', participants: participants.map(id => ({ memberId: id, percentage: per })), visibility: 'shared' }
		}
		onSubmit?.(data)
		onSuccess?.(data)
	}

	const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setAmountInput(e.target.value)
	}

	const handleAmountBlur = () => {
		const parsed = parseCurrency(amountInput)
		setAmountInput(formatCurrency(parsed))
	}

	const handleAmountFocus = () => {
		const parsed = parseCurrency(amountInput)
		setAmountInput(parsed ? parsed.toFixed(2).replace('.', ',') : '')
	}

	const handleTagsBlur = () => {
		const parsed = String(tagsRaw || '').split(',').map(s => s.trim()).filter(Boolean)
		setTags(parsed)
		setTagsRaw(parsed.join(', '))
	}

	const handleTagsKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault()
			const parsed = String(tagsRaw || '').split(',').map(s => s.trim()).filter(Boolean)
			setTags(parsed)
			setTagsRaw(parsed.join(', '))
		}
	}

	return (
		<form onSubmit={handleSubmit}>
			<div className="grid gap-3 md:grid-cols-2">
				<div className="md:col-span-2">
					<label htmlFor="expense-title" className="block text-sm font-medium mb-1">Descrição</label>
					<input id="expense-title" aria-label="Descrição" value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded px-3 py-2" />
				</div>

				<div>
					<label htmlFor="expense-amount" className="block text-sm font-medium mb-1">Valor</label>
					<input id="expense-amount" aria-label="Valor" value={amountInput} onChange={handleAmountChange} onBlur={handleAmountBlur} onFocus={handleAmountFocus} className="w-full border rounded px-3 py-2 text-right" />
				</div>

				<div>
					<label className="block text-sm font-medium mb-1">Tipo</label>
					<div className="flex items-center gap-4">
						<label className="flex items-center gap-2">
							<input type="radio" aria-label="receita" name="expense-type" checked={type === 'income'} onChange={() => setType('income')} />
							<span className="text-sm">Receita</span>
						</label>
						<label className="flex items-center gap-2">
							<input type="radio" aria-label="despesa" name="expense-type" checked={type === 'expense'} onChange={() => setType('expense')} />
							<span className="text-sm">Despesa</span>
						</label>
					</div>
				</div>

				<div className="md:col-span-2">
					<label htmlFor="expense-category" className="block text-sm font-medium mb-1">Categoria</label>
					<div className="flex items-center gap-2">
						<Select value={categoryId} onValueChange={(v) => setCategoryId(v)}>
							<SelectTrigger aria-label="Categoria" className="w-full">
								<SelectValue placeholder="Selecione" />
							</SelectTrigger>
							<SelectContent>
								{categories.map(c => (
									<SelectItem key={c.id} value={c.id}>
										<div className="flex items-center gap-2">
											<span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs" style={{ backgroundColor: c.color || '#6b7280' }}>
												<CategoryIcon icon={c.icon} className="h-4 w-4" />
											</span>
											<span>{c.name}</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{categoryId && (() => {
							const sel = categories.find(c => c.id === categoryId)
							if (!sel) return null
							return (
								<div className="flex items-center gap-2 px-2 py-1 rounded-full text-sm text-white" style={{ backgroundColor: sel.color || '#6b7280' }}>
									<span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs" style={{ backgroundColor: sel.color || '#6b7280' }}>
										<CategoryIcon icon={sel.icon} className="h-3 w-3" />
									</span>
									<span className="font-medium text-xs">{sel.name}</span>
								</div>
							)
						})()}
					</div>
				</div>

				<div>
					<label htmlFor="expense-date" className="block text-sm font-medium mb-1">Data</label>
					<input id="expense-date" aria-label="Data" type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded px-3 py-2" />
					<div className="text-xs text-muted-foreground mt-1">Exibido como {formatDate(date)}</div>
				</div>
			</div>

			<div className="mt-3">
				<button type="button" className="text-sm text-primary underline" onClick={() => setAdvancedOpen(v => !v)}>
					{advancedOpen ? 'Ocultar opções avançadas' : 'Mostrar opções avançadas'}
				</button>
			</div>

			{advancedOpen && (
				<div className="mt-3 space-y-3">
					<div>
						<label htmlFor="expense-tags" className="block text-sm font-medium mb-1">Tags</label>
						<input id="expense-tags" aria-label="tags" value={tagsRaw} onChange={e => setTagsRaw(e.target.value)} onBlur={handleTagsBlur} onKeyDown={handleTagsKey} className="w-full border rounded px-3 py-2" />
						<div data-testid="tags-list" className="flex gap-2 mt-2 flex-wrap">
							{tags.map(t => (
								<span key={t} className="inline-flex items-center gap-2 bg-gray-100 text-xs text-muted-foreground px-2 py-1 rounded-full">
									<span className="text-[10px] text-muted-foreground">#{t}</span>
								</span>
							))}
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1">Participantes</label>
						<select multiple value={participants} onChange={(e) => setParticipants(Array.from(e.target.selectedOptions).map(o => o.value))} className="w-full border rounded px-3 py-2">
							{(members || []).map((m: Member) => (
								<option key={m.id} value={m.id}>{m.name}</option>
							))}
						</select>

																	<div className="flex items-center gap-2 mt-2">
																		<button type="button" onClick={() => {
																			// quick 50/50 between first two selected or members[0/1]
																			const ids = participants.length >= 2 ? participants.slice(0,2) : (members && members.length >=2 ? [members[0].id, members[1].id] : [])
																			if (ids.length === 2) setSplitPreview([{ participantId: ids[0], percentage: 50 }, { participantId: ids[1], percentage: 50 }])
																			else alert('Selecione pelo menos 2 participantes para usar o atalho 50/50')
																		}} className="px-2 py-1 rounded border text-sm">50/50</button>
																		<button type="button" onClick={() => {
																			const ids = participants.length >= 2 ? participants.slice(0,2) : (members && members.length >=2 ? [members[0].id, members[1].id] : [])
																			if (ids.length === 2) setSplitPreview([{ participantId: ids[0], percentage: 70 }, { participantId: ids[1], percentage: 30 }])
																			else alert('Selecione pelo menos 2 participantes para usar o atalho 70/30')
																		}} className="px-2 py-1 rounded border text-sm">70/30</button>
																		<button type="button" onClick={() => {
																			const me = currentUser?.id
																			if (me) setSplitPreview([{ participantId: me, percentage: 100 }])
																			else alert('Usuário atual não encontrado')
																		}} className="px-2 py-1 rounded border text-sm">Só eu</button>
																	</div>

																	{splitPreview.length > 0 && (
																		<div className="mt-2 text-sm">
																			<strong>Divisão:</strong> {splitPreview.map(s => {
																				const member = members.find(m => m.id === s.participantId)
																				const name = member ? member.name : s.participantId
																				return `${name}: ${s.percentage}%`
																			}).join(' • ')}
																		</div>
																	)}
					</div>

					<div>
						<label htmlFor="split-method" className="block text-sm font-medium mb-1">Método de Divisão</label>
						<select id="split-method" aria-label="método de divisão" value={splitMethod} onChange={e => setSplitMethod(e.target.value as any)} className="w-full border rounded px-3 py-2">
							<option value="equal">Igual</option>
							<option value="percentage">Por porcentagem</option>
							<option value="exact">Valores exatos</option>
						</select>
					</div>

					{splitMethod === 'percentage' && (
						<div className="text-sm">Definir porcentagens</div>
					)}

					<div className="flex items-center gap-3">
						<label htmlFor="recorrente" className="text-sm">Despesa recorrente</label>
						<input id="recorrente" aria-label="recorrente" type="checkbox" checked={recorrente} onChange={e => setRecorrente(e.target.checked)} />
					</div>

					{recorrente && (
						<div className="grid gap-2 md:grid-cols-2">
							<div>
								<label htmlFor="frequency" className="block text-sm font-medium mb-1">Frequência</label>
								<select aria-label="Frequência" id="frequency" value={frequency} onChange={e => setFrequency(e.target.value)} className="w-full border rounded px-3 py-2">
									<option value="daily">Diário</option>
									<option value="weekly">Semanal</option>
									<option value="monthly">Mensal</option>
								</select>
							</div>

							<div>
								<label htmlFor="interval" className="block text-sm font-medium mb-1">Intervalo</label>
								<input aria-label="Intervalo" id="interval" type="number" min={1} value={interval} onChange={e => setInterval(Number(e.target.value) || 1)} className="w-full border rounded px-3 py-2" />
							</div>
						</div>
					)}
				</div>
			)}

			<div className="mt-4 flex items-center justify-end gap-2">
				<div className="text-xs text-muted-foreground mr-auto">Valor formatado: {formatCurrency(parseCurrency(amountInput) || 0)}</div>
				<button type="button" onClick={onCancel} className="px-3 py-2 rounded border">Cancelar</button>
				<button type="submit" className="px-3 py-2 rounded bg-primary text-white">{isLoading ? 'Salvando...' : 'Salvar'}</button>
			</div>

			<div className="mt-2">
				{errors.map(err => <div key={err} className="text-sm text-destructive">{err}</div>)}
			</div>
		</form>
	)
}

export const ExpenseForm = ExpenseFormComponent
export default ExpenseFormComponent
