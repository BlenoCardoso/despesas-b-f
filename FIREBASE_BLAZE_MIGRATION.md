# 🚀 Migração para Firebase Blaze - Checklist

## ✅ O que você precisa verificar/ajustar após migrar para Blaze

### 1. **Configuração do Projeto (Já está OK! ✓)**

Sua configuração atual em `src/config/firebase.ts` está correta e funcionará perfeitamente no plano Blaze:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyBs0Xurf3zvOLyJDlttCWhgSdiaZ4D7PIo",
  authDomain: "despesas-compartilhadas.firebaseapp.com",
  projectId: "despesas-compartilhadas",
  storageBucket: "despesas-compartilhadas.firebasestorage.app",
  messagingSenderId: "958999401996",
  appId: "1:958999401996:web:2da3790e89cb2b93700029",
  measurementId: "G-97V1985F5B"
};
```

**✅ Nenhuma alteração necessária no código!**

---

### 2. **Regras de Segurança do Firestore (Já estão OK! ✓)**

Suas regras em `firestore.rules` estão bem estruturadas e seguras. Elas funcionam perfeitamente no plano Blaze.

**✅ Nenhuma alteração necessária nas regras!**

---

### 3. **Verificações no Console do Firebase**

Acesse: https://console.firebase.google.com/project/despesas-compartilhadas

#### 3.1 **Confirmar Plano Blaze Ativo**
1. Vá em **Settings** (⚙️) → **Usage and billing**
2. Verifique se está em **Blaze Plan**
3. Configure alertas de orçamento (recomendado!)

#### 3.2 **Configurar Alertas de Orçamento** (IMPORTANTE! 💰)
1. No Console Firebase → **Settings** → **Usage and billing**
2. Clique em **Set budget alerts**
3. Configure alertas para:
   - **R$ 50/mês** (alerta de aviso)
   - **R$ 100/mês** (alerta crítico)
4. Isso evita surpresas na fatura!

#### 3.3 **Verificar Quotas e Limites**
No plano Blaze você tem:
- ✅ **Firestore:** 50K leituras/dia grátis, depois $0.06/100K
- ✅ **Storage:** 5GB grátis, depois $0.026/GB
- ✅ **Authentication:** Ilimitado e gratuito
- ✅ **Cloud Functions:** 2M invocações/mês grátis

---

### 4. **Novos Recursos Disponíveis no Blaze**

Agora você pode usar:

#### 4.1 **Cloud Functions** (Opcional)
Você pode criar funções serverless para:
- Enviar notificações automáticas
- Processar dados em background
- Validações complexas no servidor

**Exemplo de uso futuro:**
```javascript
// functions/index.js
exports.onExpenseCreated = functions.firestore
  .document('expenses/{expenseId}')
  .onCreate((snap, context) => {
    // Enviar notificação para membros da household
    // Atualizar totais automaticamente
  });
```

#### 4.2 **Firebase Extensions** (Opcional)
Extensões úteis que você pode instalar:
- **Trigger Email:** Enviar emails automáticos
- **Resize Images:** Otimizar imagens de recibos
- **Export Collections:** Backup automático

#### 4.3 **APIs Externas** (Opcional)
Agora você pode fazer chamadas para APIs externas:
- Integração com sistemas de pagamento
- OCR para ler recibos automaticamente
- Conversão de moedas em tempo real

---

### 5. **Otimizações Recomendadas para Blaze**

#### 5.1 **Índices Compostos**
Seus índices em `firestore.indexes.json` estão bons, mas você pode adicionar mais se necessário:

```json
{
  "indexes": [
    {
      "collectionGroup": "expenses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "householdId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" },
        { "fieldPath": "amount", "order": "DESCENDING" }
      ]
    }
  ]
}
```

#### 5.2 **Monitoramento de Uso**
Configure o monitoramento:
1. Firebase Console → **Usage and billing** → **Details**
2. Monitore:
   - Leituras/escritas do Firestore
   - Uso de Storage
   - Tráfego de rede

---

### 6. **Checklist de Verificação Pós-Migração**

Execute estes testes:

- [ ] **Teste 1:** Login funciona normalmente
- [ ] **Teste 2:** Criar nova despesa
- [ ] **Teste 3:** Editar despesa existente
- [ ] **Teste 4:** Deletar despesa
- [ ] **Teste 5:** Sistema de convites funciona
- [ ] **Teste 6:** Upload de imagens (se usar)
- [ ] **Teste 7:** Sincronização em tempo real
- [ ] **Teste 8:** Verificar console do navegador (sem erros)

---

### 7. **Comandos Úteis**

#### Verificar status do Firebase:
```bash
firebase projects:list
```

#### Ver uso atual:
```bash
firebase use despesas-compartilhadas
firebase firestore:usage
```

#### Deploy de regras (se precisar):
```bash
firebase deploy --only firestore:rules
```

#### Deploy de índices (se precisar):
```bash
firebase deploy --only firestore:indexes
```

---

### 8. **Custos Estimados (Referência)**

Para um app de despesas compartilhadas com uso moderado:

| Serviço | Uso Mensal Estimado | Custo |
|---------|---------------------|-------|
| **Firestore** | 500K leituras, 100K escritas | ~$0.50 |
| **Storage** | 1GB de imagens | ~$0.03 |
| **Hosting** | 10GB transferência | Grátis |
| **Authentication** | Ilimitado | Grátis |
| **TOTAL** | | **~$0.53/mês** |

💡 **Dica:** Com uso normal, você provavelmente ficará dentro dos limites gratuitos!

---

### 9. **Próximos Passos Recomendados**

1. ✅ **Configure alertas de orçamento** (PRIORITÁRIO!)
2. ✅ **Teste todas as funcionalidades** do app
3. ✅ **Monitore o uso** nos primeiros dias
4. 🔄 **Considere implementar Cloud Functions** (futuro)
5. 🔄 **Adicione backup automático** (futuro)

---

## 🎉 Conclusão

**Boa notícia:** Seu código já está 100% compatível com o plano Blaze!

**Você NÃO precisa fazer nenhuma alteração no código.**

**O que você DEVE fazer:**
1. ✅ Configurar alertas de orçamento no Console Firebase
2. ✅ Testar o app para garantir que tudo funciona
3. ✅ Monitorar o uso nos primeiros dias

**Benefícios que você ganhou:**
- ✅ Sem limites de leituras/escritas (dentro do razoável)
- ✅ Pode usar Cloud Functions
- ✅ Pode usar Firebase Extensions
- ✅ Pode fazer chamadas para APIs externas
- ✅ Melhor performance e escalabilidade

---

## 📞 Suporte

Se tiver dúvidas ou problemas:
1. Verifique o Console do Firebase para erros
2. Monitore os logs do navegador (F12 → Console)
3. Verifique a aba "Usage and billing" para uso atual

**Tudo pronto para usar o Firebase Blaze! 🚀**
