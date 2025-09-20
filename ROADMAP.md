# Roadmap Despesas App

## V2 Pro (Premium Features) 🌟

### Cloud Storage
- [ ] Anexos em nuvem (Firebase Storage)
- [ ] Upload/download de arquivos
- [ ] Preview de imagens/PDFs
- [ ] Feature flag para controle de acesso

### Household Management
- [ ] Cotas por casa/grupo
- [ ] Limite de gastos por categoria
- [ ] Alertas de orçamento
- [ ] Múltiplas casas por usuário (Pro)

### Push Notifications
- [ ] Firebase Cloud Functions setup
- [ ] Firebase Cloud Messaging (FCM) integration
- [ ] Notificações de:
  - [ ] Novas despesas
  - [ ] Lembretes de pagamento
  - [ ] Alertas de orçamento
  - [ ] Convites de casa

### Advanced Analytics
- [ ] Relatórios detalhados por:
  - [ ] Mês
  - [ ] Ano fiscal
  - [ ] Categoria
  - [ ] Membro
- [ ] Gráficos e visualizações
- [ ] Exportação de relatórios
- [ ] Comparação de períodos

### OCR & Receipt Processing 📸
- [ ] Extração automática de:
  - [ ] Valor
  - [ ] Data
  - [ ] Estabelecimento
  - [ ] Itens (quando disponível)
- [ ] Suporte para:
  - [ ] Imagens (jpg, png)
  - [ ] PDF
  - [ ] QR Code de NFe
- [ ] Sugestão automática de categoria

### Data Management
- [ ] Backup completo
  - [ ] Exportação para JSON
  - [ ] Exportação para CSV
  - [ ] Compactação automática
- [ ] Restore de dados
  - [ ] Validação de formato
  - [ ] Merge com dados existentes
  - [ ] Resolução de conflitos

### Paywall & Monetization
- [ ] Tiers de assinatura:
  - [ ] Basic (Free)
  - [ ] Pro (Monthly/Annual)
  - [ ] Family (Share Premium)
- [ ] Features por tier
- [ ] Trials e promoções
- [ ] Pagamentos recorrentes

## Technical Roadmap 🛠️

### Infrastructure
- [ ] CI/CD aprimorado
- [ ] Testes E2E
- [ ] Monitoramento de erros
- [ ] Analytics de uso

### Performance
- [ ] Otimização de bundle size
- [ ] Cache strategies
- [ ] Lazy loading de features premium
- [ ] Offline first melhorado

### Security
- [ ] Encryption em repouso
- [ ] Backup automático
- [ ] Rate limiting
- [ ] Audit logs

## Priorização 📋

1. Fase 1 - Fundação (Q4 2025)
   - Basic backup/restore
   - Push notifications base
   - Paywall structure

2. Fase 2 - Premium Features (Q1 2026)
   - Cloud attachments
   - Basic analytics
   - Household quotas

3. Fase 3 - Advanced Features (Q2 2026)
   - OCR processing
   - Advanced analytics
   - Enhanced push notifications

4. Fase 4 - Scale & Polish (Q3 2026)
   - Performance optimizations
   - Security enhancements
   - Advanced backup features