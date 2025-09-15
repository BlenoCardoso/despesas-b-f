# 🔧 CORREÇÃO DA AUTENTICAÇÃO FIREBASE

## ❌ **Problema Identificado**
Erro "Código: 10" no login Google - comum em aplicações Capacitor/Firebase

## ✅ **Correções Implementadas**

### 1. **Client ID Corrigido**
- **Antes**: `958999401996-e6erq73qrbdqkf41hh5paes022jcbd7r.apps.googleauth.com` (incorreto)
- **Depois**: `958999401996-e6erq73qrbdqkf41hh5paes022jcbd7r.apps.googleusercontent.com` (correto)

### 2. **Configuração Unificada**
Atualizados os seguintes arquivos para usar o Client ID correto:
- `src/config/firebase.ts`
- `src/services/authService.ts` 
- `capacitor.config.ts` (já estava correto)

### 3. **Verificação da Configuração**

#### **google-services.json** ✅
```json
{
  "client_id": "958999401996-4on39pe19b7q368takvbmu5i2csuq8e3.apps.googleusercontent.com",
  "client_type": 1,
  "android_info": {
    "package_name": "com.bleno.despesas",
    "certificate_hash": "971fdb3fe14fd6ff6a50f67e4f25a17c835f5ae1"
  }
}
```

#### **Capacitor Config** ✅
```typescript
{
  googleAuth: {
    serverClientId: "958999401996-e6erq73qrbdqkf41hh5paes022jcbd7r.apps.googleusercontent.com",
    androidClientId: "958999401996-4on39pe19b7q368takvbmu5i2csuq8e3.apps.googleusercontent.com"
  }
}
```

## 🔑 **Informações Importantes**

### **SHA-1 Fingerprint**
- **Atual**: `97:1F:DB:3F:E1:4F:D6:FF:6A:50:F6:7E:4F:25:A1:7C:83:5F:5A:E1`
- **Status**: Registrado no Firebase Console ✅

### **IDs de Cliente**
1. **Android Client ID**: `958999401996-4on39pe19b7q368takvbmu5i2csuq8e3.apps.googleusercontent.com`
2. **Web Client ID**: `958999401996-e6erq73qrbdqkf41hh5paes022jcbd7r.apps.googleusercontent.com`

### **Projeto Firebase**
- **Project ID**: `despesas-compartilhadas`
- **App ID**: `1:958999401996:android:8a36397482a2568f700029`
- **Package Name**: `com.bleno.despesas`

## 🚀 **APK Atualizado**

**Localização**: `android/app/build/outputs/apk/debug/app-debug.apk`
**Tamanho**: 11,13 MB (11.130.344 bytes)
**Data**: 14/09/2025 23:37:53

## 🧪 **Como Testar**

1. Instale o novo APK no dispositivo
2. Abra o aplicativo
3. Toque em "Continuar com Google"
4. O login deve funcionar sem erros

## 🔍 **Se o Problema Persistir**

Possíveis causas adicionais:
1. **SHA-1 não registrado**: Verifique no Firebase Console se o SHA-1 está correto
2. **Cache do Google Play Services**: Limpe o cache do Google Play Services no Android
3. **Rede**: Verifique se há bloqueios de firewall/proxy

## 📋 **Log de Debugging**

O aplicativo agora inclui logs detalhados. Para visualizar:
```bash
adb logcat | grep -E "(Firebase|GoogleAuth|AuthService)"
```

---
**Data da Correção**: 14/09/2025
**Versão do APK**: debug-v1.1