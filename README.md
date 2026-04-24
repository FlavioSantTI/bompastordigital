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
| **4.5** | 22/04/2026 | **Otimização e Crachás Premium**: Substituição de assets; Agrupamento 2 por folha A4; Crachás em Branco; Exportação XLS. |
| **4.6** | 24/04/2026 | **Portal do Participante & Hub Público**: Lançamento do Hub Central, Painel de Presença Ao Vivo e nova identidade. |
| **4.7** | 24/04/2026 | **Hub Central Premium & Segurança**: Melhorias em UX, grid 2x2 e trava de segurança. |
| **5.0** | 24/04/2026 | **Edição Especial Bom Pastor Digital**: Unificação do Hub, segurança admin e navegação premium. |
| **5.1** | **24/04/2026** | **Geração de PDF de Presença Ultra-Compatível**: PDF em P&B de alta fidelidade, fontes nativas e memória de WhatsApp. |

---

### ✅ Geração de PDF de Presença Ultra-Compatível (v5.1)
- [x] **PDF de Alta Fidelidade (P&B)**: Design minimalista otimizado para impressão econômica e legibilidade máxima.
- [x] **Fontes Nativas**: Uso de Helvetica interna do PDF para garantir 100% de sucesso na geração (sem falhas de download).
- [x] **Memória Local**: Persistência do número de validação via `localStorage` (o sistema lembra seu WhatsApp).
- [x] **Captura Inteligente**: Lógica de captura de QR Code via DataURL com fallback manual e tempo de espera otimizado.
- [x] **Interface Admin**: Botão de ação em Laranja Premium e layout de página limpo (sem poluição visual).

### ✅ Edição Especial Bom Pastor Digital (v5.0)
- [x] **Hub Central 2x2 Premium**: Layout rígido com navegação fluida e imponente.
- [x] **Segurança Admin Máxima**: Travas de edição no WhatsApp n8n e validação de QR Code.
- [x] **Identidade Visual v5.0**: Efeitos de hover premium e tipografia ampliada para alta visibilidade.
- [x] **Navegação Unificada**: Experiência circular completa com o Hub como espinha dorsal.

### ✅ Hub Central Premium & Segurança (v4.7)
- [x] **Grid 2x2**: Organização em "tabela" para fácil acesso mobile.
- [x] **Segurança**: Validação de telefone no gerador.

### ✅ Portal do Participante (Hub Público - v4.6)
- [x] **Hub Central (`/central`)**: Ponto de entrada único para o participante acessar Agenda, Status de Presença e Painel de Exibição.
- [x] **Painel de Presença Ao Vivo (`/presenca-viva`)**: Interface otimizada para telões com atualização automática via **Supabase Realtime**.
- [x] **Nova Identidade Visual**: Rebranding completo com paleta **Laranja Sol (#FF921C)** e **Amarelo Ouro (#ECA427)**.
- [x] **Relatório de Presença Dinâmico**: Visualização de status com filtragem por abas de data.

### ✅ Gestão de Crachás & Documentos (v4.5)
- [x] **Crachás Automáticos**: Agrupamento inteligente (2 por A4) suportando casais e indivíduos.
- [x] **Otimização de Asset**: Transição para `.jpg` otimizado (redução de 95% no peso).

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
Desenvolvido por **Flávio Santiago** com assistência de IA (Antigravity).
Contato: flavio.santiago.ti@outlook.com
© 2026 Bom Pastor Digital • **Versão 5.1**
