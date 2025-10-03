# 📱💻 **Guia de Teste - PC + Celular**

## 🌐 **Servidor Está Rodando!**

### 📍 **URLs Disponíveis:**
- **PC (Local):** http://localhost:5173/
- **Celular (Rede):** http://192.168.1.9:5173/
- **Alternativo:** http://192.168.56.1:5173/

---

## 🧪 **Plano de Teste Completo**

### 👤 **Configuração das Contas:**

#### **PC (Administrador):**
- **URL:** http://localhost:5173/
- **Conta:** Use sua conta principal (que será admin)
- **Papel:** Administrador da casa

#### **Celular (Usuário):**
- **URL:** http://192.168.1.9:5173/
- **Conta:** Use uma conta diferente (Google, email diferente)
- **Papel:** Usuário normal

---

## 🔄 **Cenários de Teste**

### **🎯 Teste 1: Admin convida Usuário (PC → Celular)**

#### **No PC (Admin):**
1. **Login** com sua conta principal
2. **Ir para Configurações** → Sistema de Convites
3. **Clicar "Sistema de Convites"**
4. **Escolher:**
   - Tipo: Membro
   - Expira em: 24 horas
   - Máximo de usos: 1
5. **Gerar Convite** → Anotar o código (ex: ABC123)

#### **No Celular (Usuário):**
1. **Abrir:** http://192.168.1.9:5173/
2. **Login** com conta diferente
3. **Ir para Configurações** → Sistema de Convites
4. **Clicar "Entrar com código"**
5. **Digitar código** recebido do PC
6. **Aceitar convite**

#### **✅ Resultado Esperado:**
- Usuário deve entrar na casa automaticamente
- No PC: ver usuário na lista de membros

---

### **🎯 Teste 2: Usuário solicita entrada (Celular → PC)**

#### **No Celular (Usuário):**
1. **Abrir:** http://192.168.1.9:5173/
2. **Login** com conta diferente
3. **Ir para Configurações** → Sistema de Convites
4. **Clicar "Solicitar Entrada"**
5. **Preencher:**
   - Nome da Casa: "Casa de Teste"
   - Tipo: Membro
   - Mensagem: "Quero entrar na casa"
6. **Gerar código** → Anotar (ex: XYZ789)

#### **No PC (Admin):**
1. **Login** com sua conta principal
2. **Ir para Configurações** → Sistema de Convites
3. **Clicar "Processar Solicitação"**
4. **Digitar código** recebido do celular
5. **Revisar informações**
6. **Aprovar solicitação**

#### **✅ Resultado Esperado:**
- Admin vê todas as informações do solicitante
- Após aprovação, usuário entra na casa

---

### **🎯 Teste 3: Solicitação de Admin (Requer Aprovação)**

#### **No Celular (Usuário):**
1. **Clicar "Solicitar Entrada"**
2. **Escolher tipo: Administrador**
3. **Gerar código**

#### **No PC (Admin):**
1. **Processar código**
2. **Ver aviso especial** sobre solicitação de admin
3. **Aprovar ou rejeitar**

#### **✅ Resultado Esperado:**
- Sistema mostra aviso sobre privilégios de admin
- Aprovação funciona corretamente

---

## 🔧 **Instruções de Conexão**

### **Para o Celular:**
1. **Conectar na mesma rede Wi-Fi** que o PC
2. **Abrir navegador** (Chrome, Safari, etc.)
3. **Digitar:** http://192.168.1.9:5173/
4. **Se não funcionar, tentar:** http://192.168.56.1:5173/

### **Possíveis Problemas:**
- **Firewall:** Windows pode bloquear - permitir se perguntado
- **Rede diferente:** Certifique-se que PC e celular estão na mesma Wi-Fi
- **HTTPS:** Use HTTP (não HTTPS) para teste local

---

## 📊 **Checklist de Teste**

### **Funcionalidades Básicas:**
- [ ] PC: Login como admin
- [ ] Celular: Login como usuário diferente
- [ ] PC: Acessar configurações
- [ ] Celular: Acessar configurações

### **Sistema de Convites (PC → Celular):**
- [ ] PC: Gerar convite membro
- [ ] Celular: Aceitar convite com código
- [ ] PC: Ver usuário na lista de membros
- [ ] PC: Gerar convite admin
- [ ] Sistema: Mostrar que requer aprovação

### **Sistema de Solicitações (Celular → PC):**
- [ ] Celular: Gerar solicitação membro
- [ ] PC: Processar código e aprovar
- [ ] Celular: Gerar solicitação admin
- [ ] PC: Ver aviso especial e aprovar
- [ ] Sistema: Usuário vira admin após aprovação

### **Interface e UX:**
- [ ] Botões aparecem corretamente
- [ ] Códigos são gerados (6 dígitos)
- [ ] Mensagens de sucesso/erro funcionam
- [ ] Informações detalhadas aparecem
- [ ] Sistema é intuitivo

---

## 🐛 **Se algo der errado:**

### **Problemas de Conexão:**
```bash
# Verificar se servidor está rodando
# No PC, deve mostrar: "Network: http://192.168.1.9:5173/"
```

### **Problemas de Autenticação:**
```bash
# Verificar no DevTools → Console
# Não deve haver erros 403 (permission denied)
```

### **Problemas de Código:**
```bash
# Códigos devem ter 6 dígitos
# Verificar se não expirou
# Tentar gerar novo código
```

---

## 🎯 **Objetivo Final:**

**Provar que o sistema é 100% bidirecional:**
- ✅ Admin pode convidar usuário (direção tradicional)
- ✅ Usuário pode solicitar entrada (direção nova)
- ✅ Aprovação manual funciona para admins
- ✅ Interface é clara e intuitiva
- ✅ Segurança está funcionando

---

## 📱 **Para Começar AGORA:**

1. **PC:** Abra http://localhost:5173/
2. **Celular:** Abra http://192.168.1.9:5173/
3. **Login** com contas diferentes
4. **Comece com Teste 1** (PC → Celular)

**Boa sorte! 🚀 Se precisar de ajuda, me avise o que aconteceu!**