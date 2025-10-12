# 🔧 TROUBLESHOOTING AVANÇADO

## 🎯 Problemas e Soluções Definitivas

---

## ❌ PROBLEMA 1: Despesas Não Salvam

### Sintomas:
- Formulário é preenchido
- Clica em "Salvar"
- Nada acontece OU erro aparece
- Despesa não aparece no Firestore

### Diagnóstico:

#### A) Verificar Console do Navegador (F12)
Procure por:
```
❌ [expenseService] Erro ao criar despesa: permission-denied
```

**Causa**: Regras do Firestore não foram implantadas
**Solução**:
```powershell
firebase deploy --only firestore:rules
```

---

#### B) Verificar Household ID
Procure no console por:
```
💾 [expenseService] Criando despesa: {title: "...", householdId: undefined}
```

**Causa**: Nenhuma household selecionada
**Solução**:
1. Criar uma household primeiro
2. Selecionar a household antes de criar despesa
3. Verificar se `currentHousehold` existe no `useHouseholds()`

---

#### C) Verificar Autenticação
Procure por:
```
❌ Usuário não autenticado
```

**Causa**: Sessão expirada ou não logado
**Solução**:
1. Fazer logout e login novamente
2. Limpar cache (Ctrl+Shift+Delete)
3. Verificar no Firebase Console se usuário existe em `users`

---

## ❌ PROBLEMA 2: Sincronização Não Funciona

### Sintomas:
- Usuário A cria despesa
- Usuário B não vê (mesmo depois de minutos)
- Precisa dar F5 para aparecer

### Diagnóstico:

#### A) Verificar Listeners
No console de AMBOS os usuários, procure:
```
🔄 [expenseService] Configurando listener para household: xxx
```

Se NÃO aparecer = listener não foi configurado!

**Solução**:
1. Verificar se `useExpenses()` está sendo usado no componente
2. Verificar se `householdId` está definido
3. Verificar código em `src/hooks/useExpenses.ts`:

```typescript
useEffect(() => {
  if (!currentHousehold?.id) {
    setExpenses([])
    setLoading(false)
    return
  }

  const unsubscribe = expenseService.subscribeToExpenses(
    currentHousehold.id,
    (newExpenses) => {
      setExpenses(newExpenses)
      setLoading(false)
    }
  )

  return unsubscribe
}, [currentHousehold?.id])
```

---

#### B) Verificar Snapshots
Quando despesa é criada, no console de AMBOS os usuários deve aparecer:
```
📸 [expenseService] Snapshot recebido: X despesas
✅ [expenseService] Despesas processadas: X
```

Se aparecer apenas no Usuário A = problema no listener do Usuário B!

**Solução**:
1. Usuário B: dar F5 e verificar logs novamente
2. Verificar se ambos estão na mesma household
3. Verificar no Firebase Console se `members` da household tem ambos IDs

---

#### C) Verificar Household ID nos Listeners
No console, verifique se o `householdId` é o mesmo:

**Usuário A**:
```
🔄 Configurando listener para household: abc123xyz
```

**Usuário B**:
```
🔄 Configurando listener para household: abc123xyz
```

Se IDs forem DIFERENTES = estão em households diferentes!

**Solução**:
1. Verificar qual household está selecionada
2. Trocar para a household correta
3. Verificar se convite foi aceito corretamente

---

## ❌ PROBLEMA 3: Convite "Código Inválido"

### Sintomas:
- Código gerado corretamente
- Usuário tenta aceitar
- Erro: "Código de convite inválido ou já utilizado"

### Diagnóstico:

#### A) Verificar no Firebase Console
1. Acesse Firestore Database
2. Coleção `invites`
3. Encontre o documento com o `code`
4. Verifique:
   - `used: false` ?
   - `expiresAt` ainda não passou?

**Causa A**: Convite já foi usado
**Solução**: Gerar novo código

**Causa B**: Convite expirou (>7 dias)
**Solução**: Gerar novo código

---

#### B) Verificar Código Digitado
Console mostra:
```
✅ [householdService] Aceitando convite com código: AB12CD34
```

Código está correto?

**Solução**:
- Copiar e colar código diretamente
- Não digitar manualmente (pode ter erro de digitação)
- Código é CASE SENSITIVE (maiúsculas e minúsculas importam!)

---

#### C) Verificar Permissões
Console mostra:
```
❌ [householdService] Erro ao aceitar convite: permission-denied
```

**Causa**: Regras do Firestore incorretas
**Solução**:
```powershell
firebase deploy --only firestore:rules
```

Verificar em `firestore.rules` se existe:
```javascript
match /invites/{inviteId} {
  allow read: if true;
  allow update: if isSignedIn();
}
```

---

## ❌ PROBLEMA 4: Índices Faltando

### Sintomas:
Console mostra:
```
⚠️ Índice faltando para (householdId + createdAt)
```

### Solução Imediata:
**NÃO FAZER NADA!** O sistema usa fallback automático.

### Solução Ideal (Melhor Performance):
1. Console mostrará um link tipo:
   ```
   https://console.firebase.google.com/v1/...
   ```
2. Clicar no link
3. Firebase criará o índice automaticamente
4. Aguardar 1-2 minutos
5. Recarregar página

---

## ❌ PROBLEMA 5: Despesas Duplicadas

### Sintomas:
- Cria uma despesa
- Aparecem 2 ou 3 cópias

### Diagnóstico:

#### A) Verificar Múltiplos Listeners
Procure no console:
```
🔄 Configurando listener para household: xxx
🔄 Configurando listener para household: xxx
🔄 Configurando listener para household: xxx
```

**Causa**: Componente renderiza múltiplas vezes criando vários listeners
**Solução**: Verificar dependências do `useEffect` em `useExpenses.ts`

---

#### B) Verificar Cleanup
Listener deve ter cleanup:
```typescript
useEffect(() => {
  const unsubscribe = expenseService.subscribeToExpenses(...)
  return unsubscribe // ⬅️ CRUCIAL!
}, [currentHousehold?.id])
```

Se falta `return unsubscribe` = múltiplos listeners ativos!

---

## ❌ PROBLEMA 6: Performance Ruim

### Sintomas:
- App lento
- Demora para carregar despesas
- Travamentos

### Soluções:

#### A) Limitar Número de Despesas
Em `expenseService.ts`:
```typescript
subscribeToExpenses(householdId, callback, limitCount = 50) // Reduzir de 100 para 50
```

#### B) Criar Índices
Seguir seção "PROBLEMA 4" acima

#### C) Pagination
Implementar paginação para não carregar todas de uma vez

---

## ❌ PROBLEMA 7: Erro "Failed Precondition"

### Sintomas:
Console mostra:
```
❌ Erro: failed-precondition
⚠️ Usando fallback sem orderBy
```

### O Que Acontece:
Sistema continua funcionando mas sem ordenação otimizada.

### Solução:
Criar índice conforme instruções no próprio erro do Firebase.

---

## 🔍 COMANDOS ÚTEIS PARA DEBUG

### Verificar Estado do Firebase
```powershell
firebase projects:list
firebase use despesas-compartilhadas
firebase firestore:indexes
```

### Limpar Cache do Navegador
```
Ctrl + Shift + Delete
Ou F12 → Application → Clear storage
```

### Ver Regras Atuais
```powershell
firebase firestore:rules
```

### Logs do Firebase no Navegador
```javascript
// No console do navegador:
localStorage.debug = 'firestore:*'
location.reload()
```

---

## 🎯 CHECKLIST DE VERIFICAÇÃO RÁPIDA

Quando algo não funciona:

- [ ] F12 → Console aberto
- [ ] Procurar por `❌` (erros em vermelho)
- [ ] Verificar se vê `🔄 Configurando listener`
- [ ] Confirmar regras implantadas: `firebase deploy --only firestore:rules`
- [ ] Verificar se está logado (usuário aparece na tela)
- [ ] Confirmar household selecionada
- [ ] Verificar no Firebase Console se dados existem

---

## 📞 ÚLTIMO RECURSO

Se NADA funcionar:

1. **Limpar TUDO**:
```powershell
# Parar servidor
Ctrl+C

# Limpar cache do navegador
Ctrl+Shift+Delete

# Reinstalar dependências
Remove-Item node_modules -Recurse -Force
npm install

# Reimplantar regras
firebase deploy --only firestore:rules

# Reiniciar servidor
npm run dev
```

2. **Verificar Firebase Console**:
   - Regras estão corretas?
   - Dados existem nas coleções?
   - Usuário está autenticado?

3. **Logs Detalhados**:
   - Console do navegador (F12)
   - Procurar por `❌` e `⚠️`
   - Ler mensagens de erro completas

---

## 🎉 TUDO FUNCIONANDO?

Se após seguir este guia tudo está OK:

✅ Convites gerando e sendo aceitos
✅ Despesas salvando no Firestore
✅ Sincronização em tempo real funcionando
✅ Zero necessidade de F5

**PARABÉNS! SEU SISTEMA ESTÁ 100% OPERACIONAL!** 🚀

---

## 📚 REFERÊNCIAS

- Documentação Firebase: https://firebase.google.com/docs/firestore
- Regras de Segurança: https://firebase.google.com/docs/firestore/security/get-started
- Realtime Updates: https://firebase.google.com/docs/firestore/query-data/listen

**💪 AGORA VOCÊ TEM UM SISTEMA PROFISSIONAL DE DESPESAS COMPARTILHADAS!**
