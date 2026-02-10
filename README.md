# ✝️ Bom Pastor Digital

**Sistema de Gestão de Inscrições para Encontros de Casais com Cristo (ECC) e Eventos Pastorais**

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
| **Backend** | Supabase (PostgreSQL + Auth + Storage) |
| **Autenticação** | Supabase Auth com Magic Link |
| **Estilização** | Emotion (CSS-in-JS) |
| **Exportação** | jsPDF + jspdf-autotable + xlsx |
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
│   │   │   │   ├── ReportsPage.tsx
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
│   └── secure_inscricoes.sql
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

---

## 👥 Usuários e Permissões

| Tipo | Acesso | Como Criar |
|------|--------|------------|
| **Admin** | Painel completo (`/admin/*`) | Supabase Dashboard > Auth > Users > Editar `user_metadata`: `{"role": "admin"}` |
| **Casal** | Área do participante | Criado automaticamente na inscrição |

---

## 📋 Funcionalidades Implementadas

### ✅ Módulo de Inscrição
- [x] Landing page com informações do evento
- [x] Seleção de evento disponível
- [x] Formulário multi-etapas (6 passos)
- [x] Validação de CPF em tempo real
- [x] Busca automática de municípios (IBGE)
- [x] Geração de PDF de confirmação com dados PIX
- [x] Persistência no Supabase

### ✅ Módulo de Autenticação
- [x] Login com email/senha
- [x] Recuperação de senha via email (Magic Link)
- [x] Proteção de rotas (Admin vs Participante)
- [x] Botão de Logout visível no header

### ✅ Painel Administrativo
- [x] Dashboard com métricas
- [x] CRUD de Dioceses
- [x] CRUD de Eventos
- [x] Lista de Inscrições com filtros
- [x] Visualização de comprovantes
- [x] Alteração de status (Pendente/Confirmada)

### ✅ Módulo de Relatórios
- [x] Exportação para Excel (.xlsx)
- [x] Fichas de inscrição em PDF (uma página por casal)
- [x] Lista de presença simplificada (PDF)

### ✅ Segurança
- [x] Row Level Security (RLS) em todas as tabelas
- [x] Políticas baseadas em JWT metadata
- [x] Bucket privado para comprovantes

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
| Média | Geração de crachás em PDF |
| Média | Check-in no dia do evento (QR Code) |
| Baixa | Dashboard com gráficos (Chart.js) |
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
