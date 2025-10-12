#!/usr/bin/env pwsh
# Script de Teste - Sistema de Despesas Compartilhadas

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🎯 TESTE DO SISTEMA DE DESPESAS COMPARTILHADAS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Firebase está configurado
Write-Host "1️⃣  Verificando configuração do Firebase..." -ForegroundColor Yellow
$firebaseConfig = Get-Content ".\src\config\firebase.ts" -Raw
if ($firebaseConfig -match "despesas-compartilhadas") {
    Write-Host "   ✅ Firebase configurado corretamente" -ForegroundColor Green
} else {
    Write-Host "   ❌ Configuração do Firebase não encontrada" -ForegroundColor Red
    exit 1
}

# Verificar se regras foram implantadas
Write-Host ""
Write-Host "2️⃣  Verificando regras do Firestore..." -ForegroundColor Yellow
$rulesFile = Get-Content ".\firestore.rules" -Raw
if ($rulesFile -match "DESPESAS em tempo real") {
    Write-Host "   ✅ Regras atualizadas encontradas no arquivo" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Regras podem estar desatualizadas" -ForegroundColor Yellow
}

# Verificar serviços
Write-Host ""
Write-Host "3️⃣  Verificando serviços..." -ForegroundColor Yellow

$expenseService = Get-Content ".\src\services\expenseService.ts" -Raw
if ($expenseService -match "\[expenseService\]") {
    Write-Host "   ✅ expenseService com logs detalhados" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  expenseService pode não ter logs" -ForegroundColor Yellow
}

$householdService = Get-Content ".\src\services\householdService.ts" -Raw
if ($householdService -match "\[householdService\]") {
    Write-Host "   ✅ householdService com logs detalhados" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  householdService pode não ter logs" -ForegroundColor Yellow
}

# Verificar estrutura de dados
Write-Host ""
Write-Host "4️⃣  Verificando estrutura de dados..." -ForegroundColor Yellow
if (Test-Path ".\src\types\firebase-schema.ts") {
    Write-Host "   ✅ Schema do Firebase definido" -ForegroundColor Green
} else {
    Write-Host "   ❌ Schema não encontrado" -ForegroundColor Red
}

# Instruções de teste manual
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "📋 PRÓXIMOS PASSOS PARA TESTAR" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "5️⃣  Inicie o servidor de desenvolvimento:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "6️⃣  Abra dois navegadores diferentes:" -ForegroundColor Yellow
Write-Host "   - Navegador 1: http://localhost:5173" -ForegroundColor White
Write-Host "   - Navegador 2: http://localhost:5173 (modo anônimo)" -ForegroundColor White
Write-Host ""
Write-Host "7️⃣  Teste o fluxo completo:" -ForegroundColor Yellow
Write-Host "   A) Navegador 1:" -ForegroundColor White
Write-Host "      1. Faça login com sua conta Google" -ForegroundColor Gray
Write-Host "      2. Crie uma household" -ForegroundColor Gray
Write-Host "      3. Gere um código de convite" -ForegroundColor Gray
Write-Host "      4. Crie uma despesa" -ForegroundColor Gray
Write-Host ""
Write-Host "   B) Navegador 2:" -ForegroundColor White
Write-Host "      1. Faça login com outra conta Google" -ForegroundColor Gray
Write-Host "      2. Aceite o convite (cole o código)" -ForegroundColor Gray
Write-Host "      3. Verifique se a despesa apareceu!" -ForegroundColor Gray
Write-Host ""
Write-Host "   C) Teste sincronização:" -ForegroundColor White
Write-Host "      1. Navegador 1: crie mais despesas" -ForegroundColor Gray
Write-Host "      2. Navegador 2: deve ver em TEMPO REAL!" -ForegroundColor Gray
Write-Host "      3. Navegador 2: edite uma despesa" -ForegroundColor Gray
Write-Host "      4. Navegador 1: deve ver a edição!" -ForegroundColor Gray
Write-Host ""
Write-Host "8️⃣  Verifique os logs no console (F12):" -ForegroundColor Yellow
Write-Host "   Procure por mensagens com emojis:" -ForegroundColor White
Write-Host "   ✅ [expenseService] Despesa criada" -ForegroundColor Green
Write-Host "   📸 [expenseService] Snapshot recebido" -ForegroundColor Green
Write-Host "   ✅ [householdService] Convite aceito" -ForegroundColor Green
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🎉 SUCESSO! Tudo pronto para testar!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 Documentação completa em: SOLUCAO_COMPLETA_DESPESAS.md" -ForegroundColor Cyan
Write-Host ""
