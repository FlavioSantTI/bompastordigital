# 📖 Guia de Versionamento e Envio (GitHub) - Bom Pastor Digital

Este documento define o processo padrão para salvar e enviar alterações para o repositório oficial, garantindo a integridade do código e o histórico de versões.

---

## 🚀 Passo a Passo para o Envio

Sempre que terminarmos uma rodada de ajustes ou uma nova versão, siga estas etapas no terminal (dentro da pasta raiz do projeto):

### 1. Verificar Alterações
Antes de mais nada, veja o que foi modificado:
```bash
git status
```

### 2. Adicionar Arquivos
Prepare todos os arquivos novos e modificados para o commit:
```bash
git add .
```

### 3. Criar o Commit (Registro)
Use mensagens claras e padronizadas. O modelo que seguimos é:
```bash
git commit -m "feat: Versão X.Y - Resumo das principais mudanças"
```
*Exemplo:* `git commit -m "feat: Versão 5.0 - Unificação do Hub e Travas de Segurança"`

### 4. Enviar para o GitHub
Suba as alterações para a nuvem:
```bash
git push
```

---

## 🛠️ Solução de Problemas Comuns

### "Git não é reconhecido como um comando"
Se o terminal falhar ao encontrar o `git`, verifique se ele está no PATH do sistema ou use o caminho completo no Windows:
- `& "C:\Program Files\Git\bin\git.exe" add .` (em terminais PowerShell)
- Ou utilize a interface gráfica do **VS Code** (ícone de Source Control no menu lateral esquerdo).

### Conflito de Versão (Merge)
Caso alguém tenha alterado o código no GitHub antes de você, use:
```bash
git pull origin main
```
(E depois proceda com o `add`, `commit` e `push`).

---

## 📋 Convenções do Projeto
- **Versões**: Sempre atualizar o `README.md` e o rodapé do sistema (`EventoPublicoHome.tsx`) antes do commit de versão.
- **Mensagens**: Usar prefixos como `feat:` (funcionalidade), `fix:` (correção) ou `style:` (estética).

---
*Documento gerado automaticamente em 24/04/2026 para consolidar o fluxo de trabalho da v5.0.*
