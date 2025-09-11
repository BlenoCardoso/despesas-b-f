# Aplicativo de Despesas Compartilhadas

Este é um aplicativo web completo para gerenciamento de despesas compartilhadas, tarefas, documentos, medicamentos e muito mais. Desenvolvido com as tecnologias mais modernas, o aplicativo é uma Progressive Web App (PWA) instalável, com funcionalidades offline, sincronização em tempo real e uma interface rica e acessível.

## Funcionalidades Principais

O aplicativo é dividido em vários módulos, cada um com funcionalidades específicas para atender às necessidades de uma casa ou grupo de pessoas.

### Módulo de Despesas

- **Gerenciamento Completo:** Crie, edite e exclua despesas e receitas.
- **Categorização Inteligente:** Categorias personalizáveis com ícones e cores.
- **Divisão de Contas:** Divida despesas de forma igual, por porcentagem ou valor exato.
- **Recorrência e Parcelamento:** Configure despesas recorrentes e parceladas.
- **Orçamentos:** Crie orçamentos por categoria e receba alertas.
- **Anexos:** Adicione comprovantes e outros arquivos às despesas.

### Módulo de Tarefas

- **Lista de Tarefas:** Gerencie tarefas com prioridades, prazos e responsáveis.
- **Status e Atribuição:** Acompanhe o progresso das tarefas e atribua a membros da casa.
- **Filtros Avançados:** Filtre tarefas por status, prioridade, responsável e data.
- **Anexos e Comentários:** Adicione arquivos e comentários às tarefas.

### Módulo de Documentos

- **Armazenamento Seguro:** Guarde documentos importantes como contas, contratos e garantias.
- **Categorização e Tags:** Organize documentos com categorias e tags.
- **Datas de Vencimento:** Receba alertas para documentos com data de vencimento.
- **Busca Rápida:** Encontre documentos facilmente com a busca avançada.

### Módulo de Calendário

- **Agenda Compartilhada:** Visualize eventos, compromissos e lembretes em um calendário compartilhado.
- **Eventos e Lembretes:** Crie eventos com data, hora, local e lembretes.
- **Categorias de Eventos:** Organize eventos com cores e categorias.
- **Detecção de Conflitos:** O sistema avisa sobre conflitos de horário.

### Módulo de Remédios

- **Controle de Medicamentos:** Gerencie medicamentos, dosagens, frequências e estoque.
- **Cronograma de Tomadas:** O sistema gera automaticamente o cronograma de tomadas.
- **Registro de Tomadas:** Marque as tomadas como realizadas, puladas ou atrasadas.
- **Alertas de Estoque:** Receba alertas quando o estoque de um medicamento estiver baixo.
- **Controle de Aderência:** Acompanhe a taxa de aderência ao tratamento.

### Sistema de Notificações

- **Centro de Notificações:** Um local central para todas as notificações do aplicativo.
- **Notificações Push:** Receba notificações no seu dispositivo, mesmo com o aplicativo fechado.
- **Preferências de Notificação:** Configure quais notificações você deseja receber.

### Relatórios e Gráficos

- **Análise Detalhada:** Relatórios completos sobre despesas, tarefas e medicamentos.
- **Gráficos Interativos:** Visualize seus dados com gráficos de pizza, barras e linhas.
- **Exportação de Dados:** Exporte seus relatórios para CSV e PDF.

## Tecnologias Utilizadas

- **Frontend:** React com TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Gerenciamento de Estado:** Zustand
- **Roteamento:** React Router
- **Banco de Dados Local:** IndexedDB com Dexie.js
- **Testes:** Vitest, React Testing Library
- **Gráficos:** Recharts
- **PWA:** Service Worker, Web App Manifest

## Como Executar o Projeto

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/despesas-compartilhadas.git
   ```

2. **Instale as dependências:**
   ```bash
   cd despesas-compartilhadas
   pnpm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   pnpm run dev
   ```

4. **Abra o navegador em `http://localhost:5173`**

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir uma issue ou enviar um pull request.


