# 🔥 Guia de Configuração Firebase - Sistema de Convites Bidirecional

## 📋 **Passo a Passo Completo**

### 1. **Atualizar Firestore Security Rules** ⚡ OBRIGATÓRIO

#### 1.1 Acesse o Console do Firebase
- Vá para [console.firebase.google.com](https://console.firebase.google.com)
- Selecione seu projeto `despesas-b-f`

#### 1.2 Atualize as Security Rules
1. **Firestore Database** → **Rules**
2. **Substitua** todo o conteúdo pelo que está no arquivo `firestore.rules` 
3. **Clique em "Publish"**

#### 1.3 Principais Mudanças nas Rules:
- ✅ Adicionada função `isOwnerOrAdmin()` mais robusta
- ✅ Regras para coleção `invitations` (global)
- ✅ Regras para coleção `joinRequests` (global)  
- ✅ Permissões para leitura pública de convites (necessário para links)
- ✅ Controle de criação/atualização baseado em roles

---

### 2. **Criar Índices no Firestore** 📊 RECOMENDADO

#### 2.1 Acessar Indexes
- **Firestore Database** → **Indexes**

#### 2.2 Criar Índices Necessários:

**Para `invitations`:**
```
Collection: invitations
Fields:
- code (Ascending)
- status (Ascending) 
- expiresAt (Ascending)
```

**Para `joinRequests`:**
```
Collection: joinRequests  
Fields:
- code (Ascending)
- status (Ascending)
- requesterUid (Ascending)
```

**Para `joinRequests` (admin view):**
```
Collection: joinRequests
Fields:
- householdId (Ascending)
- status (Ascending)
- createdAt (Descending)
```

#### 2.3 Como Criar (2 opções):

**Opção A - Automático:**
- Execute o app e use as funcionalidades
- Firebase mostrará erros com links para criar índices automaticamente

**Opção B - Manual:**
1. **Indexes** → **Add Index**
2. Preencha os campos acima
3. **Create**

---

### 3. **Configurar Dados Iniciais** 🗄️ OPCIONAL

#### 3.1 Estrutura de Dados para Teste
No **Firestore Database** → **Data**, certifique-se que existem:

**households/{id}:**
```json
{
  "name": "Casa Teste",
  "ownerId": "uid-do-usuario",
  "members": ["uid-do-usuario"],
  "memberRoles": {
    "uid-do-usuario": "admin"
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**users/{uid}:**
```json
{
  "displayName": "Nome do Usuário",
  "email": "email@exemplo.com", 
  "households": ["household-id"],
  "createdAt": "timestamp"
}
```

---

### 4. **Testar Permissões** 🧪 IMPORTANTE

#### 4.1 Teste Básico de Convites:
1. **Faça login** como admin/owner
2. **Tente criar convite** → deve funcionar
3. **Logout** e acesse `/convite/CODIGO` → deve mostrar info
4. **Login como usuário diferente** → deve conseguir aceitar

#### 4.2 Teste Sistema Bidirecional:
1. **Como usuário** → "Solicitar Entrada" → deve gerar código
2. **Como admin** → "Processar Solicitação" → deve encontrar e processar

#### 4.3 Verificar Erros:
- Abra **Console do Navegador** 
- Procure por erros de permissão do Firestore
- Se houver erros, verifique as rules novamente

---

### 5. **Deploy das Rules** 🚀 CRÍTICO

#### 5.1 Via Console (Recomendado):
- **Firestore** → **Rules** → **Publish**
- Aguarde confirmação: "Rules published successfully"

#### 5.2 Via CLI (Alternativa):
```bash
firebase deploy --only firestore:rules
```

---

### 6. **Monitoramento** 📊 OPCIONAL

#### 6.1 Configurar Alertas:
- **Firestore** → **Usage** → Configure alertas
- Monitore operações de leitura/escrita

#### 6.2 Verificar Logs:
- **Functions** → **Logs** (se usar Cloud Functions)
- **Authentication** → **Users** (verificar criação de usuários)

---

### 7. **Backup de Segurança** 💾 RECOMENDADO

#### 7.1 Backup das Rules Antigas:
```bash
# Salve o conteúdo atual em um arquivo
firestore-rules-backup-$(date +%Y%m%d).txt
```

#### 7.2 Teste de Rollback:
- Tenha as rules antigas salvas
- Em caso de problemas, faça rollback rápido

---

## ⚠️ **PONTOS CRÍTICOS**

### 🔴 **OBRIGATÓRIO - Não Funciona Sem:**
1. **Atualizar Security Rules** - Sistema não funciona sem isso
2. **Publicar as Rules** - Mudanças só valem após publish

### 🟡 **RECOMENDADO - Melhora Performance:**
1. **Criar Índices** - Evita errors e melhora velocidade
2. **Testar Permissões** - Garante que tudo funciona

### 🟢 **OPCIONAL - Nice to Have:**
1. **Configurar Alertas** - Monitora uso
2. **Backup das Rules** - Segurança extra

---

## 🔧 **Comandos Úteis**

### Deploy apenas das Rules:
```bash
firebase deploy --only firestore:rules
```

### Verificar projeto atual:
```bash
firebase projects:list
firebase use --add
```

### Testar rules localmente:
```bash
firebase emulators:start --only firestore
```

---

## 🚨 **Possíveis Erros e Soluções**

### Erro: "Missing or insufficient permissions"
- **Causa:** Rules não publicadas ou incorretas
- **Solução:** Republique as rules no console

### Erro: "The query requires an index"  
- **Causa:** Índice não criado
- **Solução:** Clique no link do erro para criar automático

### Erro: "Document doesn't exist"
- **Causa:** Household ou user não existe
- **Solução:** Crie dados de teste ou verifique referências

---

## ✅ **Checklist Final**

- [ ] Rules atualizadas e publicadas no Firebase Console
- [ ] Testei criação de convite (admin)  
- [ ] Testei aceitar convite (usuário)
- [ ] Testei solicitar entrada (usuário)
- [ ] Testei processar solicitação (admin)
- [ ] Não há erros no console do navegador
- [ ] Backup das rules antigas salvo

**🎉 Quando todos os checkboxes estiverem marcados, o sistema estará funcionando perfeitamente!**