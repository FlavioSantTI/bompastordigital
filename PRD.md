# Product Requirements Document (PRD)
## Bom Pastor Digital - Sistema de Gestão Pastoral

**Versão**: 1.4  
**Data**: 09/02/2026  
**Autor**: Flávio Santiago  
**Status**: Em Desenvolvimento Ativo

---

## 1. Sumário Executivo

O **Bom Pastor Digital** é uma plataforma web para gestão completa de Encontros de Casais com Cristo (ECC) e outros eventos pastorais. O sistema digitaliza o processo de inscrição, controle financeiro e organização logística, substituindo planilhas manuais por uma solução moderna e segura.

### 1.1 Objetivos Principais
1. **Simplificar Inscrições**: Formulário online intuitivo para casais
2. **Automatizar Confirmações**: Gestão de pagamentos com upload de comprovantes
3. **Centralizar Informações**: Painel único para a equipe dirigente
4. **Facilitar Relatórios**: Exportação de dados para impressão e análise

---

## 2. Arquitetura Técnica

### 2.1 Stack Tecnológica

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│  React 18 + TypeScript + Vite + Material UI             │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                      SUPABASE                           │
│  ┌─────────────┐  ┌──────────┐  ┌─────────────────┐    │
│  │  PostgreSQL │  │   Auth   │  │     Storage     │    │
│  │   (Dados)   │  │  (JWT)   │  │ (Comprovantes)  │    │
│  └─────────────┘  └──────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Modelo de Dados

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   dioceses   │──1:N──│   eventos    │──1:N──│  inscricoes  │
└──────────────┘       └──────────────┘       └──────────────┘
                                                     │
                                              ┌──────┴──────┐
                                              │             │
                                         ┌────▼────┐   ┌────▼────┐
                                         │ pessoas │   │ pessoas │
                                         │ (esposo)│   │ (esposa)│
                                         └─────────┘   └─────────┘
```

#### Tabelas Principais

| Tabela | Descrição | Campos Chave |
|--------|-----------|--------------|
| `dioceses` | Divisões eclesiásticas | id, nome, estado |
| `eventos` | Encontros/retiros | id, nome, data_inicio, data_fim, diocese_id, valor |
| `pessoas` | Dados individuais | id, nome, cpf, nascimento, email, telefone |
| `inscricoes` | Registro do casal | id, evento_id, esposo_id, esposa_id, dados_conjuntos, status, comprovante_url |

### 2.3 Segurança (RLS)

Todas as tabelas possuem **Row Level Security** habilitado:

| Política | Regra |
|----------|-------|
| Admin SELECT | `(auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'` |
| Admin INSERT/UPDATE/DELETE | Mesma regra acima |
| Participante SELECT | `auth.uid() = user_id` |
| Público INSERT (inscrição) | Permitido (com validações no frontend) |

---

## 3. Funcionalidades

### 3.1 Módulo Público

#### 3.1.1 Landing Page ✅
- Hero section com próximo evento
- Informações institucionais
- Botão de chamada para inscrição
- Design responsivo (mobile-first)

**Etapa 0 - Seleção de Evento** (NOVO)
- Lista de eventos disponíveis
- Seleção obrigatória antes dos dados do casal

**Etapa 1 - Dados do Casal**
- Nome completo (esposo e esposa)
- CPF com validação
- Data de nascimento
- Email individual
- Telefone individual
- Religião

**Etapa 2 - Localização**
- Estado (select)
- Município (autocomplete via IBGE API)
- Bairro
- Rua e número

**Etapa 3 - Dados Conjuntos**
- Data do casamento
- Igreja onde casou
- Paróquia atual
- Observações

**Etapa 4 - Revisão**
- Resumo de todos os dados
- Checkbox de aceite dos termos
- Botão de confirmação

**Etapa 5 - Confirmação** (NOVO)
- Geração automática de PDF com dados PIX
- Mensagem de sucesso com número da inscrição
- Orientação para consultar informações de pagamento no dashboard

### 3.2 Módulo de Autenticação ✅

| Funcionalidade | Status |
|----------------|--------|
| Login com email/senha | ✅ Implementado |
| Magic Link (sem senha) | ✅ Implementado |
| Recuperação de senha | ✅ Implementado |
| Redefinição de senha | ✅ Implementado (com confirmação) |
| Botão Sair visível no header | ✅ Implementado |
| Proteção de rotas | ✅ Implementado |

#### Configuração de Email (SMTP)
```
Host: smtp.hostinger.com
Porta: 465
Segurança: SSL/TLS
Remetente: contato@bompastordigital.com.br
```

### 3.3 Painel Administrativo ✅

#### 3.3.1 Dashboard
- Total de inscrições
- Inscrições pendentes vs confirmadas
- Valor arrecadado (estimativa)
- Próximos eventos

#### 3.3.2 Gestão de Dioceses
- Listagem com busca
- Criação/Edição/Exclusão
- Campos: Nome, Estado

#### 3.3.3 Gestão de Eventos
- Listagem com filtros
- CRUD completo
- Campos: Nome, Diocese, Datas, Valor, Descrição

#### 3.3.4 Gestão de Inscrições
- Listagem com filtro por evento e status
- Visualização detalhada de cada inscrição
- Modal de pagamento:
  - Visualizar comprovante (imagem/PDF)
  - Upload de novo comprovante
  - Toggle de confirmação
- Exclusão de inscrição

#### 3.3.5 Relatórios & Fichas ✅ (NOVO)
- **Planilha Excel**: Exporta todos os dados para .xlsx
- **Fichas de Inscrição (PDF)**: Uma página por casal com layout profissional
- **Lista de Presença (PDF)**: Tabela simples para check-in

### 3.4 Área do Participante ✅

| Funcionalidade | Status |
|----------------|--------|
| Ver dados da inscrição | ✅ Implementado |
| Ver status do pagamento | ✅ Implementado |
| Informações PIX (QR Code, chave, copia-e-cola) | ✅ Implementado |
| Contato WhatsApp para comprovante | ✅ Implementado |
| Botão de edição (inscrições pendentes) | ✅ Implementado |
| PDF de confirmação com dados PIX | ✅ Implementado |
| Enviar comprovante pelo dashboard | 🚧 Planejado |

---

## 4. Fluxos de Usuário

### 4.1 Fluxo de Inscrição (Casal)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Landing   │───▶│  Selecionar │───▶│  Formulário │───▶│   Revisão   │───▶│ Confirmação │
│    Page     │    │   Evento    │    │  (4 steps)  │    │   & Termos  │    │   + PDF     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 4.2 Fluxo de Confirmação (Admin)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Login    │───▶│  Inscrições │───▶│   Detalhes  │───▶│  Confirmar  │
│    Admin    │    │   (Lista)   │    │ Comprovante │    │   Status    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 4.3 Fluxo de Recuperação de Senha

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   "Esqueci  │───▶│  Inserir    │───▶│  Recebe     │───▶│  Nova Senha │
│   senha"    │    │   Email     │    │   Link      │    │ (2 campos)  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

---

## 5. Decisões Arquiteturais

### 5.1 Por que Supabase?
1. **PostgreSQL robusto** com RLS nativo
2. **Auth integrado** com suporte a JWT
3. **Storage** para arquivos (comprovantes)
4. **Realtime** (para futuras notificações)
5. **Custo reduzido** (tier gratuito generoso)

### 5.2 Por que Material UI?
1. **Componentes prontos** e acessíveis
2. **Tema customizável** (cores pastorais)
3. **Responsividade** built-in
4. **Documentação extensa**

### 5.3 Por que Vite?
1. **Hot Module Replacement** instantâneo
2. **Build otimizado** (ESBuild)
3. **Suporte nativo** a TypeScript

---

## 6. Regras de Negócio

### 6.1 Inscrição
- ❌ Não permitir CPF duplicado no mesmo evento
- ❌ Não permitir inscrição após data limite (quando definida)
- ✅ Email individual é obrigatório para cada cônjuge
- ✅ Telefone individual é obrigatório para cada cônjuge

### 6.2 Pagamento
- Upload aceita: JPG, PNG, PDF (máx 5MB)
- Status inicial: "pendente"
- Apenas Admin pode mudar para "confirmada"
- Upload de comprovante muda status automaticamente para "confirmada" (se estiver pendente)

### 6.3 Relatórios
- Filtro obrigatório por evento
- Excel inclui TODOS os campos
- PDF de fichas: 1 página por casal
- PDF de lista: tabela simplificada

---

## 7. Requisitos Não-Funcionais

| Requisito | Meta |
|-----------|------|
| **Tempo de carregamento** | < 3s na primeira carga |
| **Suporte a browsers** | Chrome, Firefox, Edge, Safari (últimas 2 versões) |
| **Responsividade** | Mobile-first, telas de 320px a 4K |
| **Disponibilidade** | 99.5% (dependente do Supabase) |
| **Backup** | Automático pelo Supabase |

---

## 8. Histórico de Versões

| Versão | Data | Mudanças |
|--------|------|----------|
| 1.0 | 03/02/2026 | Estrutura inicial, cadastro de eventos |
| 1.1 | 04/02/2026 | Formulário de inscrição completo |
| 1.2 | 06/02/2026 | Módulo de relatórios (PDF/Excel), recuperação de senha via SMTP, correções de RLS |
| 1.3 | 07/02/2026 | Área do participante (Dashboard), visualização de status e inscrição |
| 1.4 | 09/02/2026 | Nova landing page, PDF de confirmação, PIX no dashboard, botão Sair visível, seleção de evento |

---

## 9. Contato

**Desenvolvedor**: Flávio Santiago  
**Email**: flavio.santiago.ti@outlook.com  
**Repositório**: (privado)

---

*Documento atualizado em 09/02/2026*
