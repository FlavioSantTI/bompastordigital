# ✝️ Bom Pastor Digital

**Sistema de Gestão de Inscrições para Encontros de Casais de Nova União e Eventos Pastorais**

Uma plataforma moderna desenvolvida para facilitar o processo de inscrição, gestão financeira e organização de eventos pastorais.

---

## 🎯 Visão Geral

O **Bom Pastor Digital** automatiza todo o ciclo de vida de um evento pastoral:
1. **Inscrição Online** - Formulário multi-etapas para casais
2. **Gestão de Pagamentos** - Upload de comprovantes e confirmação
3. **Painel Administrativo** - Controle total para a equipe dirigente
4. **Relatórios** - Exportação para PDF e Excel
5. **Módulo de Presença** - QR Codes Dinâmicos e Gerenciamento de Crachás (v4.5)

---

## 🚀 Tecnologias

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **UI Library** | Material UI (MUI) v5 |
| **Backend** | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| **Autenticação** | Supabase Auth com Magic Link |
| **Estilização** | Emotion (CSS-in-JS) |
| **Geração de PDF** | @react-pdf/renderer (crachás) + jsPDF + xlsx (relatórios) |
| **Icons** | Material Icons + Lucide React |
| **QR Code** | qrcode.react |

---

## 📜 Versões e Histórico de Mudanças

| Versão | Data | Mudanças |
|--------|----------|----------|
| 1.0 - 3.7| Jan-Abr 2026 | Evolução do sistema (Auth, Inscrições, Dashboard, Gráficos Recharts, Relatórios PDF Base) |
| **4.0** | 21/04/2026 | **Módulo de Cronograma do Evento**: Gestão de Salas, Atividades e Categorias Dinâmicas. Timeline Pública. |
| **4.1** | 21/04/2026 | **Lista de Presença por Diocese**: Relatório automatizado com campo de assinatura e exportação XLS. |
| **4.2** | 21/04/2026 | **Estabilização Crítica**: Seletores Nativos e visual de rascunho para atividades não publicadas. |
| **4.3** | 21/04/2026 | **Link Amigável /agenda**: Redirecionamento inteligente para o cronograma ativo. |
| **4.4** | 22/04/2026 | **Módulo de QR Code de Presença**: Geração de códigos diários por turno via Admin com log no Supabase. Integração com WhatsApp/n8n. |
| **4.5** | **22/04/2026** | **Otimização e Crachás Premium**: Substituição de assets (Logo 1.4MB -> 61KB) para geração ultra-rápida de PDFs; Agrupamento otimizado de crachás (2 por folha A4 para casais e individuais); Crachás em Branco para preenchimento manual; Exportação de Crachás para Excel (Nome, Paróquia, Diocese, Cidade); Fluxo de impressão direta otimizado. |

---

## 📋 Funcionalidades Implementadas (Destaques v4.5)

### ✅ Gestão de Crachás & Documentos
- [x] **Crachás Automáticos**: Agrupamento inteligente (2 por A4) suportando casais e indivíduos simultaneamente.
- [x] **Crachás em Branco**: Opção de gerar crachás apenas com as etiquetas para inscrições de última hora.
- [x] **Relatório de Crachás (XLS)**: Exportação simplificada para etiquetas ou conferência (Nome, Paróquia, Diocese, Cidade).
- [x] **Otimização de Asset**: Transição para `.jpg` otimizado (redução de 95% no peso da logo), agilizando a renderização de PDF.
- [x] **Correção de Dados**: Lógica de suporte para dados já normalizados e opção de impressão direta via browser.

### ✅ Cronograma & Agenda (v4.0 - v4.3)
- [x] Gestão de Salas e Espaços
- [x] Categorias Dinâmicas com cores e ícones personalizáveis
- [x] Timeline pública elegante para participantes em `[app-url]/agenda`
- [x] Exportação de Agenda em PDF/Excel

### ✅ Inscrições & Financeiro
- [x] Formulário multi-etapas com validação de CPF e IBGE
- [x] Dashboard Analítico com gráficos Recharts e Heatmaps de Diocese
- [x] Sistema de upload e conferência de comprovantes PIX

---

## ⚙️ Configuração do Ambiente

### 1. Pré-requisitos
- Node.js 18+
- Conta no [Supabase](https://supabase.com)

### 2. Execução Local
```bash
cd frontend
npm install
npm run dev
```
Acesse: `http://localhost:5173`

---

## 🤝 Contribuição
Desenvolvido por **Flávio Santiago** com assistência de IA.
Contato: flavio.santiago.ti@outlook.com
© 2026 Bom Pastor Digital • Versão 4.5
