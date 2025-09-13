import { useAppStore } from '@/core/store'
import { generateId } from '@/core/utils/id'
import { Household, User } from '@/types/global'

export const initializeTestData = () => {
  const store = useAppStore.getState()
  
  // Se já tem dados, não inicializar novamente
  if (store.currentHousehold && store.currentUser) {
    return
  }

  // Criar usuário de teste
  const testUser: User = {
    id: generateId(),
    name: 'Usuário Teste',
    email: 'teste@exemplo.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    householdId: '',
  }

  // Criar household de teste
  const testHousehold: Household = {
    id: generateId(),
    name: 'Casa de Teste',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // Atualizar o usuário com o householdId
  testUser.householdId = testHousehold.id

  // Definir no store
  store.setCurrentUser(testUser)
  store.setCurrentHousehold(testHousehold)

  console.log('Dados de teste inicializados:', { testUser, testHousehold })
}