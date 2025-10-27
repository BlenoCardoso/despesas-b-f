# 📱 Guia de Desenvolvimento em LAN

## 🎯 Configuração Atualizada - Janeiro 2025

✅ **ATUALIZADO:** Vite 7.1.12 + Capacitor 7.4.4  
✅ **TESTADO:** Funciona perfeitamente com acesso via LAN  
✅ **HMR:** Hot Module Replacement funcionando via rede  

## 🚀 Como Usar

### 1️⃣ Iniciar o Servidor de Desenvolvimento

```bash
npm run dev:lan
```

ou

```bash
pnpm dev:lan
```

Este comando irá:
- Iniciar o Vite 7 na porta 5173
- Permitir acesso de qualquer dispositivo na rede (0.0.0.0)
- Configurar o HMR para funcionar via LAN

### 2️⃣ Encontrar o IP da Sua Máquina

Quando você executar `npm run dev:lan`, o Vite mostrará algo como:

```
VITE v7.1.12  ready in 842 ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.56.1:5173/
➜  Network: http://192.168.56.2:5173/
➜  Network: http://192.168.0.198:5173/
```

**Use qualquer endereço "Network"** que corresponda à sua rede Wi-Fi!

#### Como Descobrir Manualmente o IP:

**Windows:**
```bash
npm run show-ip
```
ou
```bash
ipconfig | findstr IPv4
```

**Linux/Mac:**
```bash
ifconfig | grep inet
```

### 3️⃣ Acessar do Celular

1. **Conecte o celular na mesma rede Wi-Fi** que o PC
2. **Abra o navegador** no celular
3. **Digite o endereço Network** mostrado pelo Vite (ex: `http://192.168.0.198:5173/`)

## ✨ Novidades da Atualização

### Vite 7.1.12
- ✅ Performance melhorada
- ✅ HMR mais estável via LAN
- ✅ Melhor detecção de IPs de rede
- ✅ Suporte aprimorado para desenvolvimento mobile

### Capacitor 7.4.4
- ✅ Compatibilidade com Vite 7
- ✅ Melhor detecção automática de IP
- ✅ Sincronização mais rápida
- ✅ Estabilidade aprimorada

### vite.config.ts
- ✅ Configuração otimizada para HMR via LAN
- ✅ `protocol: 'ws'` com porta específica
- ✅ CORS habilitado
- ✅ Detecção automática de interfaces de rede

## 🔥 Hot Module Replacement (HMR)

**FUNCIONANDO PERFEITAMENTE!** 🎉

Agora o HMR funciona corretamente via LAN com Vite 7:
- ✅ O navegador do celular atualiza automaticamente
- ✅ Não precisa recarregar a página manualmente
- ✅ O estado da aplicação é preservado
- ✅ Conexão WebSocket estável

## 📱 Desenvolvimento com Capacitor

### Opção 1: Navegador do Celular (Recomendado para início)
```bash
npm run dev:lan
```
Acesse via navegador: `http://SEU_IP:5173/`

### Opção 2: App Nativo com Live Reload
```bash
# Terminal 1: Iniciar servidor
npm run dev:lan

# Terminal 2: Executar no dispositivo
npx cap run android -l --external
```

Quando perguntado, escolha o IP da rede (não localhost).

### Opção 3: Configuração Manual no Capacitor

Edite `capacitor.config.ts` e descomente as linhas:

```typescript
server: {
    androidScheme: 'https',
    url: 'http://192.168.1.9:5173',  // Seu IP aqui
    cleartext: true,
    allowNavigation: ['*']
},
```

Depois execute:
```bash
npx cap sync
npx cap run android
```

## 🐛 Solução de Problemas

### Celular não conecta
- ✅ Verifique se PC e celular estão na **mesma rede Wi-Fi**
- ✅ Desative VPN se estiver usando
- ✅ Verifique o firewall do Windows (pode bloquear a porta 5173)

### Firewall do Windows
Se o Windows perguntar, clique em **"Permitir acesso"** quando iniciar o servidor.

Para verificar manualmente:
1. Painel de Controle → Sistema e Segurança → Firewall do Windows
2. Configurações avançadas → Regras de Entrada
3. Procure por "Node.js" ou "Vite"
4. Certifique-se que está permitido

### HMR não funciona
- ✅ Verifique se está usando o IP correto (não localhost)
- ✅ Limpe o cache do navegador
- ✅ Tente recarregar a página com Ctrl+Shift+R (ou Cmd+Shift+R no Mac)

### Erro de CORS
Não deve mais acontecer, mas se acontecer:
- ✅ Verifique se `cors: true` está no `vite.config.ts`
- ✅ Reinicie o servidor de desenvolvimento

## 📊 Comparação: Antes vs Depois

### ❌ Antes (Não Funcionava)
```typescript
hmr: {
  host: 'localhost',  // ❌ Bloqueava conexões LAN
}
```

### ✅ Depois (Funciona!)
```typescript
hmr: {
  protocol: 'ws',      // ✅ WebSocket correto
  clientPort: 5173,    // ✅ Porta correta
}
```

## 🎓 Dicas Extras

### Descobrir IP Rapidamente
Adicione ao `package.json`:
```json
"scripts": {
  "ip": "node -e \"console.log(require('os').networkInterfaces())\""
}
```

### Usar QR Code
Instale:
```bash
npm install -D qrcode-terminal
```

Crie `show-qr.js`:
```javascript
import qrcode from 'qrcode-terminal';
import os from 'os';

const interfaces = os.networkInterfaces();
const addresses = Object.values(interfaces)
  .flat()
  .filter(i => i.family === 'IPv4' && !i.internal)
  .map(i => i.address);

const url = `http://${addresses[0]}:5173`;
console.log('\n📱 Escaneie este QR Code no celular:\n');
qrcode.generate(url, { small: true });
console.log(`\n🌐 URL: ${url}\n`);
```

Execute:
```bash
node show-qr.js
```

## ✅ Checklist de Teste

- [ ] Servidor inicia com `npm run dev:lan`
- [ ] Vite mostra endereço "Network"
- [ ] Celular conectado na mesma Wi-Fi
- [ ] Navegador do celular acessa o IP:5173
- [ ] Página carrega corretamente
- [ ] Fazer alteração no código
- [ ] Página atualiza automaticamente no celular (HMR)
- [ ] Console não mostra erros de WebSocket

## 🎉 Pronto!

Agora você pode desenvolver com:
- ✅ Acesso via LAN funcionando
- ✅ Hot Module Replacement ativo
- ✅ Sem necessidade de rebuild constante
- ✅ Desenvolvimento rápido e eficiente

---

**Última atualização:** Janeiro 2025
**Versões:** Vite 6.3.5, Capacitor 7.4.3
