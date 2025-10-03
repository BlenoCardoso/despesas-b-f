# FIREBASE SETUP (Console + Emulator)

Este guia explica o que você precisa fazer no Console do Firebase e como testar localmente com o Emulator, para que o fluxo de "lar/couple" funcione sem Cloud Functions (Auth + Firestore + Regras).

1) No Firebase Console (projeto: despesas-compartilhadas)
  - Auth:
    - Habilite o provedor de Google (ou Email/Password, conforme preferir).
    - Se usar Google, pegue o clientId para mobile (já está no `src/config/firebase.ts`).
  - Firestore:
    - Criar base em modo de teste temporariamente para debug, mas depois aplique regras seguras.
    - No painel de Regras, cole o conteúdo de `firestore.rules` deste repositório e publique.
  - Storage (opcional): configure se quiser armazenar attachments.

2) Estrutura mínima esperada (a aplicação criará documentos automaticamente no primeiro uso):
  - collections: users, households, invitations, expenses

3) Regras:
  - Já incluí `firestore.rules` no repositório. Cole no Console e publique.
  - Teste no Emulator antes de publicar em produção.

4) Testando local com Firebase Emulator Suite (recomendado)
  - Instale CLI se ainda não tem:
    npm install -g firebase-tools

  - No projeto, crie `firebase.json` (se ainda não existir) com config mínima:
    {
      "emulators": {
        "firestore": { "port": 8080 },
        "auth": { "port": 9099 },
        "storage": { "port": 9199 }
      }
    }

  - Rode emuladores:
    firebase emulators:start --only firestore,auth,storage

  - Para desenvolvimento com Vite, habilite a variável de ambiente `VITE_USE_FIREBASE_EMULATOR=true`.
    - Você pode criar um arquivo `.env.local` com:
      VITE_USE_FIREBASE_EMULATOR=true
      VITE_FIRESTORE_EMULATOR_PORT=8080
      VITE_AUTH_EMULATOR_HOST=http://localhost:9099
      VITE_STORAGE_EMULATOR_PORT=9199

  - Inicie a aplicação (já com `npm run dev`) e ela tentará conectar aos emuladores.

5) Fluxo para testar funcionalmente (manual):
  - Usuário A: cria household -> gera invitation (copie o link com inviteId + code)
  - Usuário B: registra conta com o email convidado no Auth emulator (ou cria login) -> cola invite link na URL do app
  - O app deve ler a query (`?invite=ID&code=CODE`) e apresentar tela para aceitar; ao aceitar, o client executa `acceptInvitation` que atualiza invitation e adiciona o usuário ao household.

6) Importante para produção:
  - Não dependa de `--legacy-peer-deps` em produção; alinhe pacotes.
  - Garanta `email_verified` se desejar maior segurança.
  - Remova `VITE_USE_FIREBASE_EMULATOR` em produção.

Se quiser, eu posso: (1) aplicar código que detecta query string `invite` e mostra UI de aceite, (2) rodar o Emulator aqui e simular dois usuários para provar o fluxo.
# 🔐 Configuração Firebase - Domínios Autorizados

## ❌ Problema Identificado
Erro: `auth/api-key-not-valid` - Domínios não autorizados no Firebase

## ✅ Solução: Adicionar Domínios Autorizados

### 1. Acesse o Firebase Console
- URL: https://console.firebase.google.com/project/despesas-bf/authentication/settings

### 2. Vá para Authentication > Settings > Authorized Domains

### 3. Adicione os seguintes domínios:
```
localhost
localhost:5173
127.0.0.1
127.0.0.1:5173
despesas-bf.firebaseapp.com (já deve estar)
```

### 4. Clique em "Add Domain" para cada um

### 5. Salve as configurações

## 🧪 Depois de configurar, teste novamente:
- http://localhost:5173 (página de login)
- http://localhost:5173/debug (página de teste)

## 📝 Outros problemas possíveis:
1. **Popup bloqueado**: Verifique se o navegador está bloqueando popups
2. **Cache**: Limpe o cache do navegador (Ctrl+Shift+R)
3. **API Key**: Verifique se a API key está correta no Firebase Console

## 🔍 Para verificar a API Key:
Firebase Console > Project Settings > General > Web apps > Config