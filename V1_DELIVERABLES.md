# V1 - Entregáveis e Requisitos

## Core Features ✅

### Gestão de Despesas
- [ ] CRUD completo de despesas
- [ ] Compartilhamento em tempo real
- [ ] Unificação opcional de despesas similares
- [ ] Acerto de contas mensal
- [ ] Exportação para CSV

### Membros e Convites
- [ ] Sistema de convites
  - [ ] Link compartilhável
  - [ ] Código de convite
  - [ ] Expiração de convites (24h)
- [ ] Gestão de membros
  - [ ] Roles (admin/member)
  - [ ] Permissões por função

### Feature Flags
- [ ] Anexos desabilitados globalmente
- [ ] Preparação para features V2

## Regras do Banco (Firestore) 🔒

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Funções auxiliares
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isMember(householdId) {
      return isSignedIn() && 
        exists(/databases/$(database)/documents/households/$(householdId)/members/$(request.auth.uid));
    }
    
    function isAdmin(householdId) {
      let memberDoc = get(/databases/$(database)/documents/households/$(householdId)/members/$(request.auth.uid));
      return memberDoc != null && memberDoc.data.role == 'admin';
    }

    // Households
    match /households/{householdId} {
      allow read: if isMember(householdId);
      allow create: if isSignedIn();
      allow update, delete: if isAdmin(householdId);
      
      // Members subcollection
      match /members/{memberId} {
        allow read: if isMember(householdId);
        allow create: if isAdmin(householdId) || 
          (isSignedIn() && memberId == request.auth.uid && resource == null);
        allow update: if isAdmin(householdId) || 
          (memberId == request.auth.uid && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']));
        allow delete: if isAdmin(householdId);
      }
      
      // Expenses subcollection
      match /expenses/{expenseId} {
        allow read: if isMember(householdId);
        allow create: if isMember(householdId) && 
          request.resource.data.createdBy == request.auth.uid;
        allow update: if isMember(householdId) && 
          (resource.data.createdBy == request.auth.uid || isAdmin(householdId));
        allow delete: if isMember(householdId) && 
          (resource.data.createdBy == request.auth.uid || isAdmin(householdId));
      }
      
      // Invites subcollection
      match /invites/{inviteId} {
        allow read: if true; // Permite verificar convite pelo link
        allow create: if isAdmin(householdId);
        allow delete: if isAdmin(householdId);
      }
    }
    
    // Users (perfis públicos)
    match /users/{userId} {
      allow read: if true;
      allow create, update: if request.auth.uid == userId;
      allow delete: if false;
    }
  }
}
```

## Testes e Validação 🧪

### Despesas
- [ ] Criar despesa básica
- [ ] Editar despesa existente
- [ ] Excluir despesa (com undo)
- [ ] Filtrar por mês/categoria
- [ ] Compartilhar despesa
- [ ] Unificar despesas similares
- [ ] Exportar CSV

### Membros
- [ ] Criar convite
- [ ] Entrar via link
- [ ] Entrar via código
- [ ] Gerenciar permissões
- [ ] Remover membro

### Tempo Real
- [ ] Sync de despesas
- [ ] Sync de membros
- [ ] Sync de convites
- [ ] Estado offline

### Performance
- [ ] Lazy loading
- [ ] Paginação
- [ ] Cache local
- [ ] Tempo de carregamento

### Offline
- [ ] Criar despesa offline
- [ ] Editar offline
- [ ] Resolução de conflitos
- [ ] Sync ao reconectar

## Lançamento 🚀

### Pré-lançamento
- [ ] Testes completos
- [ ] Feature flags configuradas
- [ ] Regras do banco validadas
- [ ] Documentação atualizada

### Go-live
- [ ] Deploy para produção
- [ ] Monitoramento ativo
- [ ] Backup configurado
- [ ] Suporte inicial