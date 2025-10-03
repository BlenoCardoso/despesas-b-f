# Despesas Compartilhadas - Sistema Reformulado

## 🎯 Objetivo

Sistema simples e eficiente de **despesas compartilhadas ao vivo** usando Firebase Firestore. Foco total na funcionalidade principal: gerenciar despesas em tempo real entre membros de uma household.

## 🚀 Funcionalidades Principais

### ✅ Implementado

- **Sistema de Households**: Criar e gerenciar grupos de despesas
- **Convites em Tempo Real**: Sistema de convites via código único
- **Despesas ao Vivo**: Updates instantâneos via Firestore listeners  
- **Interface Limpa**: Design moderno focado na usabilidade
- **Autenticação Firebase**: Login seguro com Google/Email
- **Multiplataforma**: Web responsivo + Capacitor (Android/iOS)

### 🔧 Recursos Técnicos

- **Real-time**: Todas as despesas sincronizam instantaneamente
- **Offline First**: Funciona offline com sincronização automática
- **Performance**: Carregamento rápido com React Query + Zustand
- **Segurança**: Regras Firestore robustas para controle de acesso

## 🏗️ Arquitetura

```
src/
├── services/           # Lógica de negócio (Firebase)
│   ├── householdService.ts
│   ├── expenseService.ts
│   └── authService.ts
├── hooks/              # Hooks de estado global
│   ├── useHouseholds.ts
│   ├── useExpenses.ts
│   └── useAuth.ts
├── pages/              # Páginas principais
│   ├── NewExpensesPage.tsx
│   ├── NewSettingsPage.tsx
│   └── InvitePage.tsx
└── components/         # Componentes UI
    └── Layout.tsx
```

## 🔄 Como Funciona o Compartilhamento

### 1. Criar Household
```typescript
const { createHousehold } = useHouseholds()
await createHousehold("Casa da Família")
```

### 2. Gerar Convite
```typescript
const { generateInviteCode } = useHouseholds()
const { code, link } = await generateInviteCode()
// Link: https://app.com/convite/XYZ123
```

### 3. Aceitar Convite
- Usuário acessa o link
- Faz login se necessário
- Convite aceito automaticamente
- Já pode ver/criar despesas da household

### 4. Despesas em Tempo Real
```typescript
const { expenses, createExpense } = useExpenses()

// Criar despesa
await createExpense({
  title: "Supermercado",
  amount: 150.50,
  category: "alimentacao",
  date: new Date()
})

// Todos os membros veem instantaneamente
```

## 🚀 Início Rápido

### 1. Instalar dependências
```bash
pnpm install
```

### 2. Configurar Firebase
- Criar projeto no Firebase Console
- Habilitar Firestore e Authentication
- Copiar config para `src/config/firebase.ts`

### 3. Configurar regras Firestore
- Aplicar o conteúdo de `firestore.rules` no Firebase Console

### 4. Executar
```bash
# Desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Android (Capacitor)
pnpm build && npx cap run android
```

## 📱 Funcionalidades da Interface

### Página de Despesas
- **Lista em tempo real** de todas as despesas
- **Filtros por categoria**, status (pago/pendente), data
- **Cards informativos** com totais e estatísticas
- **CRUD completo**: criar, editar, duplicar, excluir
- **Status de pagamento** com toggle rápido
- **Categorização visual** com ícones e cores

### Página de Configurações
- **Gerenciar households**: criar, trocar, renomear, excluir
- **Sistema de convites**: gerar e compartilhar links
- **Gerenciar membros**: visualizar, remover (se owner)
- **Perfil do usuário** com logout

### Sistema de Convites
- **Links únicos** com códigos de 8 caracteres
- **Auto-accept** quando usuário abre o link logado
- **Feedback visual** durante o processo
- **Expiração automática** em 7 dias

## 🔒 Segurança

### Regras Firestore
- Usuários só acessam households onde são membros
- Apenas owners podem deletar households
- Despesas só visíveis para membros da household
- Convites têm acesso público para permitir aceitar

### Validações
- Autenticação obrigatória para todas as operações
- Validação de membership em tempo real
- Sanitização de dados de entrada
- Rate limiting automático do Firebase

## 🎨 Design System

### Cores
- **Primary**: Blue (empresarial, confiável)
- **Success**: Green (despesas pagas)
- **Warning**: Orange (pendências)
- **Error**: Red (exclusões, erros)

### Componentes
- **Cards**: Para despesas e informações
- **Badges**: Status e categorias
- **Buttons**: CTAs claros com ícones
- **Dialogs**: Formulários e confirmações

## 🔧 Configuração do Ambiente

### Variáveis de Ambiente (.env)
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Firebase Emulator (Desenvolvimento)
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Iniciar emulators
firebase emulators:start

# App usará automaticamente os emulators
pnpm dev
```

## 📊 Estado Global

### Hooks Principais
- `useAuth()`: Autenticação e usuário atual
- `useHouseholds()`: Lista e household atual
- `useExpenses()`: Despesas em tempo real

### Fluxo de Dados
1. Auth state sincroniza com Firebase Auth
2. Household state escuta mudanças via onSnapshot
3. Expenses state filtra por household atual
4. UI reativa a mudanças automaticamente

## 🚀 Deploy

### Web (Firebase Hosting)
```bash
pnpm build
firebase deploy --only hosting
```

### Android/iOS (Capacitor)
```bash
pnpm build
npx cap copy
npx cap open android # ou ios
```

## 🤝 Contribuindo

1. Fork do projeto
2. Criar branch para feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit das mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para branch (`git push origin feature/nova-funcionalidade`)
5. Abrir Pull Request

## 📝 Licença

MIT License - veja arquivo LICENSE para detalhes.

---

**Sistema focado em simplicidade e eficiência para despesas compartilhadas ao vivo! 🎯**