# 🔥 CONFIGURAÇÃO DE DOMÍNIOS AUTORIZADOS NO FIREBASE

## ❌ **Problema**
A aplicação fica com tela branca porque o Firebase está bloqueando o acesso via IP da rede local.

## ✅ **Solução: Adicionar Domínios Autorizados**

### **Passo 1: Acessar Firebase Console**
1. Acesse: https://console.firebase.google.com
2. Clique no projeto **"despesas-compartilhadas"**

### **Passo 2: Ir para Authentication**
1. No menu lateral esquerdo, clique em **"Authentication"**
2. Clique na aba **"Settings"** (Configurações)
3. Role a página para baixo até encontrar **"Authorized domains"** (Domínios autorizados)

### **Passo 3: Adicionar Domínios**
Clique em **"Add domain"** e adicione os seguintes domínios:

```
localhost
127.0.0.1
192.168.1.9
192.168.56.1
192.168.56.2
```

### **Passo 4: Salvar**
1. Clique em **"Add"** para cada domínio
2. Clique em **"Save"** (Salvar)

## 🧪 **Teste**
Após adicionar os domínios:
1. Recarregue a página no navegador
2. Teste o login novamente
3. Teste a geração/uso de códigos

---

## 📋 **Domínios que DEVEM estar na lista:**
- localhost ✅
- 127.0.0.1 ✅  
- 192.168.1.9 ✅ (IP da sua rede)
- 192.168.56.1 ✅ (IP virtual)
- 192.168.56.2 ✅ (IP virtual)

## 🚨 **Se o problema persistir:**
1. Limpe o cache do navegador
2. Teste em modo anônimo/incógnito
3. Verifique se há erros específicos no console do navegador