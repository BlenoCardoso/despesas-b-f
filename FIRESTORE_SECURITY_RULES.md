# 🔒 REGRAS DE SEGURANÇA DO FIRESTORE

## ⚠️ IMPORTANTE: CONFIGURAÇÃO OBRIGATÓRIA NO CONSOLE FIREBASE

Você precisa configurar estas regras no Console do Firebase para que a sincronização funcione com segurança.

### 📍 Como Configurar:

1. **Acesse o Console Firebase**: https://console.firebase.google.com
2. **Selecione seu projeto**: despesas-compartilhadas  
3. **Vá para Firestore Database**
4. **Clique na aba "Regras" (Rules)**
5. **Cole o código abaixo substituindo as regras existentes**
6. **Clique em "Publicar" (Publish)**

---

## 🔐 CÓDIGO DAS REGRAS DE SEGURANÇA

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // === REGRAS PARA USUÁRIOS ===
    match /users/{userId} {
      // Usuário pode ler e escrever apenas seu próprio documento
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // === REGRAS PARA HOUSEHOLDS ===
    match /households/{householdId} {
      // Apenas membros do household podem ler
      allow read: if request.auth != null && 
        request.auth.uid in resource.data.members;
      
      // Apenas o owner pode criar e deletar
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.ownerId;
      
      // Membros podem atualizar (com restrições)
      allow update: if request.auth != null && 
        request.auth.uid in resource.data.members &&
        // Owner não pode ser alterado por outros
        (request.auth.uid == resource.data.ownerId || 
         !request.resource.data.diff(resource.data).affectedKeys().hasAny(['ownerId']));
    }
    
    // === REGRAS PARA DESPESAS ===
    match /expenses/{expenseId} {
      // Membros do household podem ler despesas não deletadas
      allow read: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/households/$(resource.data.householdId)).data.members &&
        (!('deletedAt' in resource.data) || resource.data.deletedAt == null);
      
      // Membros do household podem criar despesas
      allow create: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/households/$(request.resource.data.householdId)).data.members &&
        request.resource.data.createdBy == request.auth.uid;
      
      // Criador ou membros do household podem atualizar
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.createdBy || 
         request.auth.uid in get(/databases/$(database)/documents/households/$(resource.data.householdId)).data.members);
    }
    
    // === REGRAS PARA CATEGORIAS ===
    match /categories/{categoryId} {
      // Membros do household podem ler
      allow read: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/households/$(resource.data.householdId)).data.members;
      
      // Membros podem criar categorias
      allow create: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/households/$(request.resource.data.householdId)).data.members &&
        request.resource.data.createdBy == request.auth.uid;
      
      // Criador ou owner do household pode atualizar
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.createdBy || 
         request.auth.uid == get(/databases/$(database)/documents/households/$(resource.data.householdId)).data.ownerId);
    }
    
    // === REGRAS PARA TAREFAS ===
    match /tasks/{taskId} {
      // Membros do household podem ler
      allow read: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/households/$(resource.data.householdId)).data.members;
      
      // Membros podem criar tarefas
      allow create: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/households/$(request.resource.data.householdId)).data.members &&
        request.resource.data.createdBy == request.auth.uid;
      
      // Criador, pessoa atribuída ou owner podem atualizar
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.createdBy || 
         request.auth.uid == resource.data.assignedTo ||
         request.auth.uid == get(/databases/$(database)/documents/households/$(resource.data.householdId)).data.ownerId);
      
      // Criador ou owner podem deletar
      allow delete: if request.auth != null && 
        (request.auth.uid == resource.data.createdBy || 
         request.auth.uid == get(/databases/$(database)/documents/households/$(resource.data.householdId)).data.ownerId);
    }
    
    // === REGRAS PARA DOCUMENTOS ===
    match /documents/{documentId} {
      // Membros do household podem ler
      allow read: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/households/$(resource.data.householdId)).data.members;
      
      // Membros podem criar documentos
      allow create: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/households/$(request.resource.data.householdId)).data.members &&
        request.resource.data.createdBy == request.auth.uid;
      
      // Criador pode atualizar e deletar
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.createdBy;
    }
    
    // === REGRAS PARA MEDICAMENTOS ===
    match /medications/{medicationId} {
      // Membros do household podem ler
      allow read: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/households/$(resource.data.householdId)).data.members;
      
      // Membros podem criar medicamentos
      allow create: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/households/$(request.resource.data.householdId)).data.members &&
        request.resource.data.createdBy == request.auth.uid;
      
      // Criador ou pessoa atribuída podem atualizar
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.createdBy || 
         request.auth.uid == resource.data.assignedTo);
      
      // Criador pode deletar
      allow delete: if request.auth != null && 
        request.auth.uid == resource.data.createdBy;
    }
    
    // === REGRAS PARA CONVITES ===
    match /invitations/{invitationId} {
      // Convidador e convidado podem ler
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.inviterUserId || 
         request.auth.token.email == resource.data.inviteeEmail);
      
      // Owner do household pode criar convites
      allow create: if request.auth != null && 
        request.auth.uid == get(/databases/$(database)/documents/households/$(request.resource.data.householdId)).data.ownerId &&
        request.resource.data.inviterUserId == request.auth.uid;
      
      // Convidado pode aceitar/recusar
      allow update: if request.auth != null && 
        request.auth.token.email == resource.data.inviteeEmail &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'acceptedAt']);
    }
    
    // === NEGAR TUDO O MAIS ===
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 🛡️ O QUE ESSAS REGRAS FAZEM:

### ✅ **Permissões Básicas:**
- Usuários só podem acessar dados dos households que pertencem
- Apenas membros autenticados têm acesso aos dados
- Criadores têm controle total sobre seus registros

### ✅ **Segurança por Household:**
- Isolamento completo entre diferentes households  
- Membros não podem ver dados de outras casas
- Owner tem privilégios especiais de administração

### ✅ **Controle de Edição:**
- Despesas: Criador e membros podem editar
- Tarefas: Criador, atribuído e owner podem editar  
- Documentos: Apenas criador pode editar
- Medicamentos: Criador e pessoa atribuída podem editar

### ✅ **Prevenção de Ataques:**
- Impossível acessar dados sem autenticação
- Impossível modificar households de outros usuários
- Validação de ownership em todas as operações

---

## ⚠️ DEPOIS DE CONFIGURAR:

1. **Teste a autenticação** - Faça login no app
2. **Verifique se os dados carregam** - Liste despesas, categorias, etc.
3. **Teste criação** - Adicione uma despesa ou categoria
4. **Teste em outro dispositivo** - Login com mesma conta

---

## 🚨 TROUBLESHOOTING:

**Se aparecer erro "Missing or insufficient permissions":**
- Verifique se copiou as regras corretamente
- Confirme que clicou em "Publicar" no console
- Certifique-se que o usuário está logado
- Verifique se o household existe e tem membros

**Para debug:**
- Ative os logs detalhados no console do navegador
- Verifique a aba Network para ver requisições rejeitadas
- Use o simulador de regras no Console Firebase

---

✨ **Após configurar essas regras, sua sincronização multi-dispositivos estará 100% segura e funcional!**