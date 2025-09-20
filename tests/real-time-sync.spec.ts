import { test, expect } from '../fixtures'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Testes de sincronização em tempo real
test.describe('Real-time Sync', () => {
  // Criar despesa e verificar sync
  test('should sync new expense between users', async ({ browser, household }) => {
    // Contexto dos usuários
    const userA = await browser.newContext()
    const userB = await browser.newContext()
    const pageA = await userA.newPage()
    const pageB = await userB.newPage()

    // Setup inicial
    await pageA.goto(`/app/h/${household.id}/expenses`)
    await pageB.goto(`/app/h/${household.id}/expenses`)

    // Usuário A: Criar despesa
    await pageA.getByRole('button', { name: 'Adicionar despesa' }).click()
    await pageA.getByPlaceholder('R$ 0,00').fill('50,00')
    await pageA.getByRole('button', { name: 'Alimentação' }).click()

    // Usuário B: Verificar se despesa apareceu
    const formattedDate = format(new Date(), 'd MMM', { locale: ptBR })
    await expect(pageB.getByText('Alimentação')).toBeVisible()
    await expect(pageB.getByText('R$ 50,00')).toBeVisible()
    await expect(pageB.getByText(formattedDate)).toBeVisible()
  })

  // Editar despesa e verificar sync
  test('should sync expense updates between users', async ({ browser, household }) => {
    // Setup dos usuários
    const userA = await browser.newContext()
    const userB = await browser.newContext()
    const pageA = await userA.newPage()
    const pageB = await userB.newPage()

    // Navegar para despesas
    await pageA.goto(`/app/h/${household.id}/expenses`)
    await pageB.goto(`/app/h/${household.id}/expenses`)

    // Usuário A: Criar despesa inicial
    await pageA.getByRole('button', { name: 'Adicionar despesa' }).click()
    await pageA.getByPlaceholder('R$ 0,00').fill('50,00')
    await pageA.getByRole('button', { name: 'Alimentação' }).click()

    // Usuário A: Editar despesa
    await pageA.getByText('Alimentação').click()
    await pageA.getByPlaceholder('R$ 0,00').fill('75,00')
    await pageA.getByRole('button', { name: 'Salvar' }).click()

    // Usuário B: Verificar atualização
    await expect(pageB.getByText('R$ 75,00')).toBeVisible()
  })

  // Excluir despesa e verificar sync
  test('should sync expense deletion between users', async ({ browser, household }) => {
    // Setup dos usuários
    const userA = await browser.newContext()
    const userB = await browser.newContext()
    const pageA = await userA.newPage()
    const pageB = await userB.newPage()

    // Navegar para despesas
    await pageA.goto(`/app/h/${household.id}/expenses`)
    await pageB.goto(`/app/h/${household.id}/expenses`)

    // Usuário A: Criar despesa
    await pageA.getByRole('button', { name: 'Adicionar despesa' }).click()
    await pageA.getByPlaceholder('R$ 0,00').fill('50,00')
    await pageA.getByRole('button', { name: 'Alimentação' }).click()

    // Usuário A: Excluir despesa
    await pageA.getByText('Alimentação').click()
    await pageA.getByRole('button', { name: 'Excluir' }).click()
    await pageA.getByRole('button', { name: 'Confirmar' }).click()

    // Usuário B: Verificar remoção
    await expect(pageB.getByText('Alimentação')).not.toBeVisible()
    await expect(pageB.getByText('R$ 50,00')).not.toBeVisible()
  })

  // Testar comportamento offline
  test('should handle offline/online sync', async ({ browser, household }) => {
    // Setup dos usuários
    const userA = await browser.newContext()
    const userB = await browser.newContext()
    const pageA = await userA.newPage()
    const pageB = await userB.newPage()

    // Navegar para despesas
    await pageA.goto(`/app/h/${household.id}/expenses`)
    await pageB.goto(`/app/h/${household.id}/expenses`)

    // Usuário B: Ficar offline
    await userB.setOffline(true)

    // Usuário A: Criar despesa
    await pageA.getByRole('button', { name: 'Adicionar despesa' }).click()
    await pageA.getByPlaceholder('R$ 0,00').fill('50,00')
    await pageA.getByRole('button', { name: 'Alimentação' }).click()

    // Usuário B: Verificar que despesa não aparece offline
    await expect(pageB.getByText('Alimentação')).not.toBeVisible()

    // Usuário B: Voltar online
    await userB.setOffline(false)

    // Usuário B: Verificar que despesa aparece após sync
    await expect(pageB.getByText('Alimentação')).toBeVisible()
    await expect(pageB.getByText('R$ 50,00')).toBeVisible()
  })
})