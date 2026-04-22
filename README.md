# ✝️ Bom Pastor Digital

**Sistema de Gestão de Inscrições para Encontros de Casais de Nova União  e Eventos Pastorais**

Uma plataforma moderna desenvolvida para facilitar o processo de inscrição, gestão financeira e organização de eventos pastorais.

---

## 🎯 Visão Geral

O **Bom Pastor Digital** automatiza todo o ciclo de vida de um evento pastoral:
1. **Inscrição Online** - Formulário multi-etapas para casais
2. **Gestão de Pagamentos** - Upload de comprovantes e confirmação
3. **Painel Administrativo** - Controle total para a equipe dirigente
4. **Relatórios** - Exportação para PDF e Excel

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

## 📦 Estrutura do Projeto

```
bom-pastor-digital/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/               # Painel administrativo
│   │   │   │   ├── AdminLayout.tsx
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   ├── DiocesesPage.tsx
│   │   │   │   ├── EventosPage.tsx
│   │   │   │   ├── InscricoesPage.tsx
│   │   │   │   ├── SalasDialog.tsx
│   │   │   │   ├── CategoriasDialog.tsx
│   │   │   │   ├── AtividadeDialog.tsx
│   │   │   │   ├── CronogramaPage.tsx
│   │   │   │   ├── ReportsPage.tsx
│   │   │   │   ├── UsuariosPage.tsx       # v2.0
│   │   │   │   ├── ManageUserDialog.tsx   # v2.0
│   │   │   │   ├── CrachasPage.tsx        # v2.0
│   │   │   │   ├── CrachaTemplate.tsx     # v2.0
│   │   │   │   ├── CrachaPreviewDialog.tsx # v2.0
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── UpdatePasswordPage.tsx
│   │   │   │   └── ForgotPasswordDialog.tsx
│   │   │   ├── steps/               # Etapas do formulário
│   │   │   │   ├── CoupleStep.tsx
│   │   │   │   ├── LocationStep.tsx
│   │   │   │   ├── JointStep.tsx
│   │   │   │   ├── ReviewStep.tsx
│   │   │   │   ├── EventSelectionStep.tsx
│   │   │   │   └── ConfirmationStep.tsx
│   │   │   ├── ClientLayout.tsx     # Layout com header/logout
│   │   │   ├── NewLandingPage.tsx    # Página inicial pública
│   │   │   ├── ParticipantDashboard.tsx  # Dashboard do participante
│   │   │   ├── RegistrationSummary.tsx  # Resumo + PIX
│   │   │   └── RegistrationStepper.tsx  # Stepper multi-etapas
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx       # Autenticação
│   │   ├── services/
│   │   │   ├── registrationService.ts
│   │   │   ├── pdfService.ts        # Geração de PDF de confirmação
│   │   │   └── exportService.ts     # Exportação PDF/Excel (admin)
│   │   ├── lib/
│   │   │   └── supabase.ts          # Cliente Supabase
│   │   ├── types.ts                 # Tipos e configuração PIX
│   │   └── App.tsx                  # Rotas da aplicação
│   └── package.json
├── supabase/
│   ├── schema.sql                   # Schema do banco de dados
│   ├── seed.sql                     # Dados iniciais
│   ├── fix_rls_jwt.sql              # Políticas RLS com JWT
│   ├── fix_admin_permissions.sql
│   ├── secure_inscricoes.sql
│   ├── rpc_registrar_casal.sql      # RPC transacional
│   ├── rpc_admin_users.sql          # v2.0
│   ├── rpc_inscritos_para_cracha.sql # v2.0
│   └── functions/
│       └── admin-users/index.ts     # Edge Function (Deno) v2.0
├── PRD.md                           # Documento de Requisitos
└── README.md                        # Este arquivo
```

---

## ⚙️ Configuração do Ambiente

### 1. Pré-requisitos
- Node.js 18+
- Conta no [Supabase](https://supabase.com)

### 2. Variáveis de Ambiente

Crie o arquivo `frontend/.env.local`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

### 3. Configuração do Supabase

#### 3.1 Banco de Dados
Execute os scripts SQL na ordem:
1. `supabase/schema.sql`
2. `supabase/seed.sql`
3. `supabase/fix_rls_jwt.sql`
4. `supabase/fix_admin_permissions.sql`

#### 3.2 Autenticação (SMTP)
Configure em **Authentication > Email Templates**:
- **SMTP Host**: smtp.hostinger.com (ou seu provedor)
- **SMTP Port**: 465
- **SMTP User**: seu-email@dominio.com
- **SMTP Password**: sua-senha

#### 3.3 Storage
Crie um bucket chamado `comprovantes` com:
- **Public**: false
- **Allowed MIME types**: image/*, application/pdf

#### 3.4 URL Configuration
Em **Authentication > URL Configuration**, adicione:
```
http://localhost:5173/**
http://localhost:5174/**
https://seu-dominio.com/**
```

### 4. Instalação e Execução

```bash
cd frontend
npm install
npm run dev
```

Acesse: `http://localhost:5173`

---

## 📜 Versões e Histórico de Mudanças

| Versão | Data | Mudanças |
|--------|----------|----------|
| 1.0 | 03/02/2026 | Estrutura inicial, cadastro de eventos |
| 1.1 | 04/02/2026 | Formulário de inscrição completo |
| 1.2 | 06/02/2026 | Módulo de relatórios (PDF/Excel), recuperação de senha via SMTP, correções de RLS |
| 1.3 | 07/02/2026 | Área do participante (Dashboard), visualização de status e inscrição |
| 1.4 | 09/02/2026 | Nova landing page, PDF de confirmação, PIX no dashboard, botão Sair visível, seleção de evento |
| **2.0** | **02/03/2026** | **Gerenciamento de Usuários (CRUD via Edge Function Deno), Módulo de Crachás (PDF A4 casal com @react-pdf/renderer), exibição de nome do usuário logado, versionamento v2.0 global** |
| **2.1** | **17/03/2026** | **Refatoração de Localização (Diocese e Cidade independentes), salvamento da Cidade no banco, nova Coluna de Localização unificada no Admin (Inscrições e Crachás), Melhoria nos Relatórios Excel/PDF com dados estruturados e Redirecionamento Automático pós-inscrição.** |
| **3.0** | **03/04/2026** | **Suporte completo a inscrições individuais, correção de exclusão de registros dinâmicos no admin, autocomplete de cidades no formulário do admin, correção atômica de estados de login prevenindo "tela branca", proteção contra quebras de DOM por tradutores automáticos, estilos "pulse glow" atraentes e layout consolidado para a versão 3.0.** |
| **3.1** | **03/04/2026** | **Busca e ordenação na página de Inscrições (nome, cidade, status, data), exibição do tipo de inscrição (Casal/Individual) no Dashboard, coluna Participante atualizada para suportar inscrições individuais.** |
| **3.2** | **03/04/2026** | **Correção crítica na edição de inscrições individuais (erro UUID ao salvar), seção Esposa oculta e rótulo adaptado para "Participante" em inscrições individuais, nomes completos exibidos no Dashboard.** |
| **3.3** | **03/04/2026** | **Refinamento do UI de Login (mais compacto e proporcional) e remoção de erros de console em buscas de cônjuges inexistentes.** |
| **3.4** | **04/04/2026** | **Nova Central de Relatórios unificada (Crachás, Listas e Fichas), motor de geração de PDF premium com `@react-pdf/renderer` para todos os documentos e layout administrativo ultra-compacto.** |
| **3.5** | **04/04/2026** | **Correção crítica de fuso horário em todas as datas de eventos e nascimentos (off-by-one bug), sistema de versionamento centralizado (`APP_VERSION`), robustez no parsing de datas/timestamps e melhoria visual no Dashboard Administrativo.** |
| **3.6** | **11/04/2026** | **Correção crítica de loop infinito de login (race condition no refresh token do Supabase Auth), tratamento inteligente de eventos `TOKEN_REFRESHED` no AuthContext, proteção contra sessões corrompidas, logging estruturado em todo o fluxo de autenticação (`[Auth]`, `[Login]`, `[Dashboard]`, `[ProtectedRoute]`), tratamento gracioso de erros JWT no ParticipantDashboard e mensagens de erro humanizadas para falhas de rede e sessão expirada.** |
| **3.7** | **12/04/2026** | **Dashboard Analítico com gráficos Recharts (Pizza: status e tipo, Barras: inscrições por evento com gradientes), Tabela Pivot Diocese × Tipo (Casal/Individual) com heatmap visual, correção crítica de dados faltantes em relatórios (inscrições individuais excluídas por INNER JOIN do Supabase), paginação automática em todos os relatórios PDF (Lista de Presença, Lista Geral, Fichas), Lista de Presença com uma pessoa por linha em ordem alfabética, e Lista Geral enriquecida com colunas de Contato e Tipo.** |
| **4.0** | **21/04/2026** | **Módulo de Cronograma do Evento: Gestão dinâmica de Salas e Atividades, Categorias Dinâmicas no banco (com nomes, cores e ícones customizados), Suporte a ícones de imagem (PNG) da pasta pública, Grid de Horários administrativo com "Ajuste Magnético" de continuidade, Timeline Pública para participantes, e Exportação do Cronograma (PDF/Excel).** |
| **4.1** | **21/04/2026** | **Novo Relatório: Lista de Presença por Diocese (Individualizado com quebra de página automática no PDF e XLS), inclusão de campo para Assinatura, exportação XLS com colunas simplificadas (#, Diocese, Nome, Tipo, Assinatura) e feedback visual de carregamento (Backdrop com Circular Progress).** |
| **4.2** | **21/04/2026** | **Estabilização Crítica: Implementação de Seletores Nativos (native: true) para máxima confiabilidade em Drawers, design "Premium" para cards de atividade (Labels de Categoria, Preview de Descrição e visual de Rascunho pontilhado), correção de contraste nos botões de download e remoção da restrição de categorias no banco de dados.** |

---

## 👥 Usuários e Permissões

| Tipo | Acesso | Como Criar |
|------|--------|------------|
| **Admin** | Painel completo (`/admin/*`) | Via tela Gerenciar Usuários (`/admin/usuarios`) com role `admin` |
| **Casal** | Área do participante | Criado automaticamente na inscrição |

---

## 📋 Funcionalidades Implementadas

### ✅ Módulo de Inscrição
- [x] Landing page com informações do evento
- [x] Seleção de evento disponível
- [x] Formulário multi-etapas (6 passos)
- [x] Validação de CPF em tempo real
- [x] Seleção independente de Diocese e Cidade (Nova lógica v2.1)
- [x] Busca de municípios via API do IBGE
- [x] Salvamento persistente da Cidade nos dados do casal
- [x] Geração de PDF de confirmação com dados PIX
- [x] Persistência no Supabase

### ✅ Módulo de Autenticação
- [x] Login com email/senha (Layout compacto v3.4)
- [x] Recuperação de senha via email (Magic Link)
- [x] Proteção de rotas (Admin vs Participante)
- [x] Botão de Logout visível no header
- [x] Gerenciamento inteligente de sessão — proteção contra refresh token inválido (v3.6)
- [x] Logging estruturado de autenticação com prefixos `[Auth]`, `[Login]`, `[ProtectedRoute]` (v3.6)
- [x] Tratamento gracioso de sessões corrompidas sem loop de redirecionamento (v3.6)

### ✅ Painel Administrativo (v3.7)
- [x] Dashboard analítico com gráficos Recharts (v3.7)
- [x] Gráfico de pizza: Confirmadas vs Pendentes (v3.7)
- [x] Gráfico de pizza: Casais vs Individuais (v3.7)
- [x] Gráfico de barras: Inscrições por evento com gradientes (v3.7)
- [x] Tabela Pivot: Diocese × Tipo (Casal/Individual) com heatmap (v3.7)
- [x] CRUD de Dioceses e Eventos
- [x] Lista de Inscrições com filtros, busca e ordenação
- [x] Visualização de comprovantes e alteração de status
- [x] **Relatórios & Fichas**: Central unificada para geração de documentos

### ✅ Central de Relatórios & Crachás (v3.7)
- [x] **Crachás**: Geração automatizada (2 por folha A4) integrada
- [x] **Lista Geral**: Por Diocese/Paróquia com colunas Contato e Tipo (v3.7)
- [x] **Lista de Check-in**: Uma pessoa por linha, ordem alfabética (v3.7)
- [x] **Fichas Individuais**: Suporte a casais e individuais (v3.7)
- [x] **Paginação automática**: Todos os relatórios quebram páginas corretamente (v3.7)
- [x] **Preview Real-time**: Visualização direta no modal antes de baixar
- [x] **Motor @react-pdf/renderer**: Máxima fidelidade visual e compatibilidade
- [x] **Cronograma do Evento (v4.0)**: Gestão de agenda completa
    - [x] CRUD de Salas/Espaços por evento
    - [x] Categorias Dinâmicas (Manageable UI + Icon Selector)
    - [x] Suporte a Ícones PNG personalizados
    - [x] Grid administrativo de alta densidade
    - [x] Lógica de continuidade automática (Magnet snap)
    - [x] Timeline pública elegante para participantes
    - [x] Exportação de Agenda em PDF e Excel
    - [x] **Relatório de Presença por Diocese (v4.1)**: Individualizado e com campo para assinatura
    - [x] **Seletores Nativos (v4.2)**: Maior robustez na edição de atividades
    - [x] **Visual de Rascunho (v4.2)**: Sinalização clara de conteúdo privado no cronograma

### ✅ Gerenciamento de Usuários
- [x] CRUD completo de usuários via Edge Function (Deno)
- [x] Atribuição de roles (Admin / Usuário Padrão)
- [x] Exibição do nome do usuário logado na barra superior

### ✅ Segurança
- [x] Row Level Security (RLS) em todas as tabelas
- [x] Políticas baseadas em JWT metadata
- [x] Bucket privado para comprovantes
- [x] Verificação de existência de IDs de cônjuges antes de requisições (v3.4)
- [x] Proteção contra loop de redirecionamento por token de sessão expirado (v3.6)
- [x] Limpeza automática de sessões locais corrompidas (v3.6)

### ✅ Área do Participante
- [x] Dashboard com resumo da inscrição
- [x] Visualização de status (Pendente/Confirmado)
- [x] Informações PIX (QR Code, chave, copia-e-cola, WhatsApp)
- [x] Botão de edição habilitado para inscrições pendentes
- [ ] Upload de comprovante pelo próprio usuário (Em breve)

---

## 🔜 Roadmap (Próximas Funcionalidades)

| Prioridade | Feature |
|------------|---------|
| Alta | Upload de comprovante pelo participante |
| Alta | Notificações por email (confirmação de inscrição) |
| Alta | Deploy online (Vercel + domínio customizado) |
| Média | Área do Participante — edição de dados cadastrais |
| Média | Check-in no dia do evento (validação via QR Code do crachá) |
| ~~Baixa~~ | ~~Dashboard com gráficos~~ ✅ Implementado na v3.7 (Recharts) |
| Baixa | Multi-idioma (i18n) |

---

## 🛠️ Scripts Disponíveis

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run preview  # Preview do build
npm run lint     # Verificação de código
```

---

## 📄 Licença

Projeto desenvolvido para uso interno da comunidade pastoral.

---

## 🤝 Contribuição

Desenvolvido por **Flávio Santiago** com assistência de IA.

Para dúvidas ou sugestões: flavio.santiago.ti@outlook.com
