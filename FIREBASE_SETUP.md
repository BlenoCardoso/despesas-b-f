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