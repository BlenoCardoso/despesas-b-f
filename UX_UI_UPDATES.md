# Atualizações de UI/UX focadas em experiência de aplicativo

Este patch aplica melhorias visuais e de organização sem alterar a lógica de negócio nem as rotas. O objetivo é dar “cara de aplicativo” (PWA/mobile-first), mantendo 100% das funcionalidades.

## O que foi feito

- AppBar (cabeçalho) fixo com título, casa atual e ações rápidas (Entrar via código, Gerar convite, Relatórios e status de conexão).
- Barra de abas inferior (Bottom Tab Bar) no mobile com ícones para Despesas e Configurações.
- Botão de ação flutuante (FAB) para “Adicionar Despesa” no mobile; em telas maiores o botão continua na página.
- Menu de ações em cada despesa agora usa ícones (editar, marcar pago/pendente, excluir) com os mesmos handlers.
- Respeito ao safe-area de dispositivos com notch (top/bottom) usando utilitários existentes em `index.css`.
- Nenhum endpoint/serviço foi alterado. As ações foram apenas reposicionadas/estilizadas.

## Arquivos tocados

- `src/router.tsx`: estilização do componente `ExpenseApp` com AppBar, FAB e Tab Bar; troca de alguns botões por ícones (lucide-react) mantendo os mesmos callbacks.
- `UX_UI_UPDATES.md`: este documento.

## Notas de acessibilidade

- Botões com `aria-label` onde a ação é apenas por ícone.
- Alvos de toque mínimos (44px+) usando classes utilitárias existentes.

## Como voltar

Caso prefira a barra de ações antiga no topo, é possível:
- Remover o bloco do `<header className="appbar ...">` e restaurar o cabeçalho anterior (que já estava no arquivo, mas foi substituído).
- Remover o FAB e a Tab Bar no final do componente `ExpenseApp`.

## Próximos passos sugeridos (opcionais)

- Adicionar tema escuro explícito para a tela de despesas.
- Melhorar o formulário com máscara de moeda BRL e navegação por teclado no mobile.
- Adicionar micro-interações com feedback háptico no Capacitor (Haptics) em ações críticas.
