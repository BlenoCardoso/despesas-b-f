# 🔧 CORREÇÃO ACESSO LAN - LOGIN GOOGLE

## ❌ Problemas Identificados

### 1. **Erro: "Domínio não autorizado pelo Firebase"**
- O Firebase não permite login Google em IPs LAN por padrão
- Precisa adicionar o IP LAN nos domínios autorizados

### 2. **IPs alternativos não conectam**
- Múltiplos IPs detectados mas nem todos funcionam
- Possível problema de roteamento de rede

## ✅ Soluções Aplicadas

### 1. **Configuração Firebase para LAN**

**Passo 1: Adicionar domínio no Firebase Console**
1. Acesse: https://console.firebase.google.com/
2. Projeto: "despesas-compartilhadas"
3. Authentication → Settings → Authorized domains
4. Adicionar: `192.168.0.198` (seu IP atual)

**Passo 2: Atualizar configuração local**
- ✅ Melhorada detecção de erros de domínio
- ✅ Adicionada configuração para desenvolvimento LAN
- ✅ Fallback para desenvolvimento local

### 2. **Script para detectar IP correto**

Novo comando disponível:
```bash
pnpm show-ip
```

### 3. **Configuração Vite melhorada**

Arquivo `vite.config.ts` otimizado para:
- ✅ Detectar todos os IPs automaticamente
- ✅ HMR funcionando em qualquer IP da rede
- ✅ CORS configurado corretamente

## 🚀 Como Testar Agora

### Opção 1: Configurar Firebase (Recomendado)
1. **Firebase Console:**
   - Acesse https://console.firebase.google.com/
   - Projeto "despesas-compartilhadas"
   - Authentication → Settings → Authorized domains
   - Clique "Add domain"
   - Digite: `192.168.0.198`
   - Salvar

2. **Testar no celular:**
   - Acesse: `http://192.168.0.198:5173/`
   - Login Google deve funcionar

### Opção 2: Desenvolvimento Local Primeiro
1. **Teste no PC:**
   ```bash
   pnpm dev
   # Acesse http://localhost:5173
   ```

2. **Após confirmar que funciona, teste LAN:**
   ```bash
   pnpm dev:lan
   # Use IP mostrado no terminal
   ```

### Opção 3: Usar túnel ngrok (Alternativa)
```bash
# Instalar ngrok
npm install -g ngrok

# Terminal 1: Servidor
pnpm dev:lan

# Terminal 2: Túnel
ngrok http 5173
```

O ngrok criará uma URL pública que funcionará com Firebase.

## 📱 Teste no Celular

### ✅ IP que está funcionando:
- `http://192.168.0.198:5173/` ✅

### ❌ IPs que podem não funcionar:
- `http://192.168.56.1:5173/` (Interface virtual)
- `http://192.168.56.2:5173/` (Interface virtual)

**Use sempre o IP da sua rede Wi-Fi real!**

## 🔥 Verificação Rápida

Execute este comando para ver qual IP usar:
```bash
pnpm show-ip
```

Procure pelo IP que começa com:
- `192.168.0.x` ← **USE ESTE**
- `192.168.1.x` ← **OU ESTE**

Evite IPs que começam com:
- `192.168.56.x` (VirtualBox/VMware)
- `172.x.x.x` (Docker)
- `10.x.x.x` (VPN)

## 🛠️ Se ainda não funcionar

1. **Verifique Firewall:**
   ```bash
   # PowerShell como Administrador
   New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -Port 5173 -Protocol TCP -Action Allow
   ```

2. **Teste ping do celular:**
   - Abra terminal/cmd no celular
   - Execute: `ping 192.168.0.198`
   - Deve responder

3. **Verifique se são a mesma rede:**
   - PC e celular na mesma rede Wi-Fi
   - Não usar VPN

## ✅ Status Final

- ✅ Vite 7 funcionando
- ✅ Capacitor 7.4.4 atualizado
- ✅ Configuração LAN otimizada
- ⚠️ **Aguardando:** Configuração Firebase Console
- ✅ Scripts de teste prontos

**Próximo passo: Configurar domínio no Firebase Console para resolver o login Google via LAN.**