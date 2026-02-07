# Script de Deploy Simplificado para Bom Pastor Digital

param (
    [string]$Mensagem = "Update: Atualizacao automatica"
)

Write-Host "Iniciando processo de deploy..." -ForegroundColor Cyan

# Adiciona todas as mudanças
git add .

# Realiza o commit
git commit -m "$Mensagem"

# Envia para o GitHub
Write-Host "Enviando para o GitHub..." -ForegroundColor Yellow
git push

if ($?) {
    Write-Host "Sucesso! O GitHub Actions iniciou o build." -ForegroundColor Green
    Write-Host "Apos o build terminar (verde), va no Portainer e clique em Update the stack!" -ForegroundColor White
} else {
    Write-Host "Erro ao enviar para o GitHub." -ForegroundColor Red
}
