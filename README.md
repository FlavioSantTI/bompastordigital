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
| **7.0.0** | **02/09/2026** | **Módulo Completo de Círculos, Relatórios & Painel de Inscrições**: Módulo CRUD de Círculos com Casal Coordenador estrito, Alocação Dual-List fixo lado a lado, Seletor de Cores Nativo com Roda de Cores, Relatório de Círculos por Evento (PDF e Excel), Assinatura Visual Estrela Guia v7.0.0, Painel de Inscrições e Alerta de Contagem Regressiva em Vermelho. |
| **6.5.0** | **02/09/2026** | **Módulo de CRUD de Círculos**: Lançamento do módulo de Círculos por evento, com metadados visuais (nome, descrição e cores em Hexadecimal), busca de Casal Coordenador elegível na base global (não inscritos no evento atual), gerenciador Dual-List de membros com regra de pertencimento único por participante e dashboard com métricas de alocação. |
| **6.4.1** | **02/09/2026** | **Novos Relatórios de Equipes e por Paróquia**: Lançamento dos relatórios "Equipes por Evento" (Casal Coordenador e Membros com Telefone e Paróquia) e "Relatório por Paróquia" (agrupamento inteligente com quebra de página e exportação em PDF e Excel). |
| **6.4** | **02/09/2026** | **Gestão de Equipes (Casal Coordenador & Exibição de Contato)**: Atualização do rótulo da liderança de equipes de "Chefe / Subchefe" para "Casal Coordenador". Remoção do CPF da lista e autocomplete de componentes/liderança, substituído pela exibição direta de Telefone e Paróquia. |
| **6.3** | **30/07/2026** | **Correção de Pagamento PIX em Eventos Pagos**: Ajuste no retorno das RPCs PostgreSQL (`registrar_casal_ecc` e `registrar_individual_ecc`), no `registrationService` e no `RegistrationStepper` para trafegar corretamente os campos de pagamento PIX (`is_paid`, `event_price`, `pix_key`, etc.) para a tela final de confirmação. |

---

### 🌟 Módulo de Círculos, Relatórios & Painel de Inscrições (v7.0.0)
- [x] **Gestão Completa de Círculos**: Tabelas PostgreSQL `circulos` e `circulo_membros` integradas no painel administrativo `/admin/circulos`.
- [x] **Regra Estrita de Casais Coordenadores**: Filtro de busca na base global de `pessoas` exigindo cadastro completo de casal (`tipo = 'casal'`), bloqueando indivíduos solteiros e desvinculações incorretas.
- [x] **Interface Dual-List (Transfer List)**: Gerenciador de membros com duas listas fixas lado a lado (`minWidth: 780px`, sem quebra vertical) com botões centrais de transferência (`Mover`, `Mover Todos`, `Remover`, `Remover Todos`).
- [x] **Seletor de Cores Personalizado**: Formulário com paleta rápida de cores e botão de **Roda de Cores nativa (`<input type="color">`)** para seleção customizada de qualquer tom de cor no espectro RGB/HSL.
- [x] **Relatório de Círculos por Evento**: Adicionado card no módulo *Relatórios e Fichas* permitindo pré-visualização em PDF e download de planilhas Excel (XLSX) contendo o Casal Coordenador e os membros alocados em cada círculo.
- [x] **Assinatura Visual Estrela Guia v7.0.0**: Animação celestial etérea de 10 segundos ao carregar o painel administrativo com auréola dourada (`shepherd-glow`) no selo de versão.
- [x] **Painel de Inscrições & Contagem Regressiva**: Atualização do rótulo para **Painel de Inscrições** e adição de badge vermelho dinâmico (`⏰ Faltam XX dia(s) para o Evento`) calculando o prazo de realização do evento selecionado.

### ✅ Novos Relatórios: Equipes por Evento & Por Paróquia (v6.4.1)
- [x] **Relatório de Equipes por Evento**: Geração de relatório PDF e Excel estruturado por equipe, apresentando o **Casal Coordenador** e os **Membros** com seus respectivos números de **Telefone** e **Paróquia**.
- [x] **Relatório por Paróquia**: Agrupamento automático dos participantes do evento selecionado por Paróquia, com quebra de página por comunidade em PDF e exportação para planilha Excel (XLSX).
- [x] **Pré-visualização Interativa**: Integração com o componente de preview em tela cheia com alternância instantânea entre PDF e Excel.

---

### ✅ Gestão de Equipes (Casal Coordenador & Exibição de Contato) (v6.4)
- [x] **Rótulo de Liderança de Equipes**: Atualizado o rótulo de liderança no modal de cadastro/edição de equipes e nos cards da interface de "Chefe / Subchefe" para **"Casal Coordenador"**, preservando intacta a estrutura de dados existente (níveis de cargo 1 e 2).
- [x] **Privacidade no Gerenciamento**: Remoção da exibição do **CPF** na lista de componentes da equipe e no seletor de busca de pessoas.
- [x] **Apresentação de Contato e Paróquia**: Exibição em tempo real do **Telefone** e da **Paróquia** dos integrantes e resultados de busca no cadastro de equipes.
| **6.2** | **29/07/2026** | **Configuração Dinâmica de Inscrição Individual & Entrada Direta**: Controle por evento no Admin (`permite_individual`), ocultando modalidade individual no público e travando no Admin para eventos de Casais. Remoção da rota `/` para Landing Page com entrada direta no app. |
| **6.1** | **04/07/2026** | **Correções Pastorais Críticas & Consolidação**: Unificação da lista de pastorais (types.ts), limpeza de dados ao desmarcar membro da Pasfam, campo de pastorais inserido no AdminInscricaoDialog, validação de campos obrigatórios no editor admin, e resolução do bug crítico `v_evento is not assigned yet` nas RPCs de casal e individual. |
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
| **5.1** | 24/04/2026 | **Geração de PDF de Presença Ultra-Compatível**: PDF em P&B de alta fidelidade, fontes nativas e memória de WhatsApp. |
| **5.2** | 27/06/2026 | **Períodos de Inscrição e Realização**: Separação das datas do evento das datas de inscrição, com controle de status automatizado e RPC. |
| **5.3** | 27/06/2026 | **Módulo de Gestão de Palestrantes**: Cadastro global, upload de foto no Storage, redes sociais, associação N:N no cronograma e exibição na timeline pública. |
| **5.4** | 27/06/2026 | **Segurança Fortalecida & Otimização de Performance**: Regras de Senha Forte (10+ carac, letras, núm, símbolos), visualizador de senha 👁️ e Code Splitting (bundle 78% mais leve para conexões móveis). |
| **5.5** | **27/06/2026** | **Cadastro de Reserva (Lista de Espera)**: Aceite automatizado de inscrições com status de reserva ao atingir o limite de vagas, suspensão de PIX na reserva e promoção manual pelo Admin. |
| **5.5.5** | **03/07/2026** | **Promoção Semi-Automática FIFO & Otimização do Dashboard**: Promoção em lote da lista de espera respeitando ordem cronológica com preview e relatório (WhatsApp/PDF) + Otimização da carga inicial do painel administrativo via lazy loading e dropdown de eventos ativos. |
| **6.0** | **04/07/2026** | **Simplificação do Formulário de Inscrição**: Remoção completa dos campos "Restrições Alimentares" e "Necessito de Hospedagem" do formulário público, formulários admin (criação e edição) e de todas as exportações (Excel, PDF de fichas e template @react-pdf). |

---

### ✅ Correção de Pagamento PIX em Eventos Pagos (v6.3)
- [x] **Retorno das RPCs de Inscrição**: Atualizadas as funções PostgreSQL `registrar_casal_ecc` e `registrar_individual_ecc` para carregar e retornar os campos financeiros do evento (`is_paid`, `event_price`, `pix_key`, `pix_key_type`, `merchant_name`, `merchant_city`).
- [x] **Mapeamento no Service**: Ajustadas as interfaces TypeScript `RpcResponse` e os métodos `registerCouple` e `registerIndividual` em `registrationService.ts` para repassar as informações financeiras.
- [x] **Integração no Stepper**: Atualizado o `RegistrationStepper.tsx` para repassar os dados completos do evento ao estado `savedRegistration`, garantindo a exibição do QR Code PIX e chave copia e cola na tela final (`ConfirmationStep.tsx`).

---

### ✅ Configuração Dinâmica de Inscrição Individual, Entrada Direta & Nova Identidade Visual (v6.2)
- [x] **Controle de Modalidade por Evento (Admin)**: Adicionada a flag `permite_individual` no formulário de criação e edição de eventos no painel Admin.
- [x] **Experiência do Usuário (Formulário Público)**: Quando o evento selecionado não aceita inscrições individuais, o formulário público omite a opção "Individual" e exibe aviso informativo orientando a inscrição de casal.
- [x] **Trava de Segurança no Admin**: No diálogo de nova inscrição do Admin, a opção "Individual" é desabilitada com tooltip explicativo caso o evento selecionado seja exclusivo para casais.
- [x] **Script de Migração SQL**: Criado o script `supabase/add_permite_individual.sql` para adicionar a coluna `permite_individual` (padrão `TRUE`) no PostgreSQL.
- [x] **Redirecionamento Direto (App Route)**: Rota raiz `/` alterada para chamar diretamente a aplicação (`AuthRedirect`), direcionando o usuário para Login ou Dashboard sem passar pela Landing Page.
- [x] **Nova Identidade Visual (Azul Celestial & Orvalho)**: Nova paleta leve e moderna 100% azul no `theme.ts` (Azul Celeste `#0284C7`, Azul Oceano `#0369A1`, Fundo Ice `#F0F7FF` e botões em degradê suave), sem alteração de rotas ou regras de negócio.

---

### ✅ Correções Pastorais Críticas & Consolidação (v6.1)
- [x] **Sincronização de Pastorais**: Unificação de `PASTORAIS_DISPONIVEIS` centralizado em `types.ts` utilizado simultaneamente nas telas públicas e de admin, evitando perda de dados na edição.
- [x] **Limpeza de Seleções Órfãs**: Pastorais selecionadas são limpas automaticamente caso o usuário ou admin desmarque o checkbox "Membro Pasfam".
- [x] **Pastorais na Criação Admin**: Campo de seleção múltipla de pastorais adicionado ao `AdminInscricaoDialog.tsx`.
- [x] **Validação no Editor**: Adicionadas travas de segurança contra campos obrigatórios vazios ou inválidos no painel admin de edição.
- [x] **Consolidação de RPCs**: Escrita de script SQL unificado em `supabase/fix_rpcs_consolidated.sql` resolvendo o erro crítico `record "v_evento" is not assigned yet` nas funções PostgreSQL.

---

### ✅ Simplificação do Formulário de Inscrição & Assinatura Premium (v6.0)
- [x] **Remoção do Campo "Restrições Alimentares"**: Eliminado do formulário público (JointStep), tela de revisão (ReviewStep), schema Zod, formulários admin de criação e edição, e de todas as exportações (Excel e PDF).
- [x] **Remoção do Campo "Necessito de Hospedagem"**: Eliminado do formulário público (checkbox), tela de revisão (chip visual), formulários admin, templates PDF (@react-pdf e jsPDF) e exportação Excel.
- [x] **Rodapés de Assinatura Atualizados**: Inclusão da assinatura personalizada `© 2026 Bom Pastor Digital - Versão 6.O / Powered by Flavio Santiago – Consultor IA` em todas as páginas, inclusive na tela de login.
- [x] **Atualização de UX no Dashboard**: Botão "Fazer Minha Primeira Inscrição" renomeado para "Efetuar Cadastro" para melhor adequação de contexto.
- [x] **Compatibilidade com Dados Históricos**: Os dados de inscrições antigas são preservados intactos no banco (JSONB `dados_conjuntos`) sem necessidade de migração.
- [x] **Sem Impacto no Banco de Dados**: Nenhuma alteração de schema, RPCs ou migrações SQL foi necessária.
- [x] **Build Validado**: Compilação limpa confirmada (`npm run build` — 0 erros, 0 warnings de tipagem).

---

### ✅ Promoção Semi-Automática FIFO & Otimização de Performance (v5.5.5)
- [x] **Promoção em Lote (RPC)**: Nova função server-side `promover_reservas_lote` para mover registros da lista de reserva para pendente/confirmada respeitando estritamente a fila cronológica.
- [x] **Relatório de Contato**: Geração automatizada de PDF de contato dos contemplados, cópia de resumo e link WhatsApp direto com mensagem pré-formatada.
- [x] **Alerta de Quebra de Fila FIFO**: Alerta explícito no painel caso o admin tente promover individualmente uma inscrição fora da primeira posição.
- [x] **Otimização de Inicialização do Dashboard**: Redução das consultas de carga para 5 HEAD requests rápidos. Gráficos, Pivot e Listas são carregados sob demanda ao expandir blocos.
- [x] **Dropdown Inteligente de Inscrições**: Exibição agrupada de eventos ativos e encerrados, selecionando o primeiro ativo por padrão.

---

### ✅ Cadastro de Reserva / Lista de Espera (v5.5)
- [x] **Regra Automática no Banco (RPCs)**: Checagem dinâmica de vagas (`inscricoes_count >= vagas`) ativando o status `'reserva'`.
- [x] **Suspensão de PIX na Reserva**: Pausa na geração do QR Code para inscritos em lista de espera (evitando cobranças indevidas).
- [x] **Confirmação Pública Diferenciada**: Tela final informativa em tons dourados explicando o funcionamento da lista de espera.
- [x] **Painel de Gestão Admin**: Filtro por "Cadastro de Reserva", etiqueta visual `📋 Reserva` e promoção em 1 clique para vaga confirmada.

### ✅ Segurança Fortalecida & Otimização de Performance (v5.4)
- [x] **Segurança de Autenticação (Senha Forte)**: Validação obrigatória de 10+ caracteres combinando letras, números e símbolos especiais em todos os formulários.
- [x] **UX de Formulários**: Botão de alternância de visibilidade de senha (ícone de olho 👁️) nos campos de entrada.
- [x] **Otimização de Carregamento (Code Splitting)**: Divisão de pacotes de bibliotecas pesadas via `manualChunks` no Vite, reduzindo o arquivo inicial de 4MB para 883KB.
- [x] **Compatibilidade de Rede**: Navegação ultra-rápida testada e otimizada para conexões móveis e provedores regionais de baixa largura de banda.

### ✅ Módulo de Gestão de Palestrantes (v5.3)
- [x] **Banco de Dados (Supabase)**: Novas tabelas `palestrantes`, `atividade_palestrantes` (N:N), RLS e bucket público `palestrantes` no Storage.
- [x] **Painel Admin**: Nova tela de gestão de palestrantes (`/admin/palestrantes`) com upload de foto e links de redes sociais.
- [x] **Modal de Atalho Rápido**: Botão "+ Novo Rápido" no formulário de atividades para criar e vincular palestrantes instantaneamente.
- [x] **Timeline pública & Relatórios**: Exibição de avatares e minibios na agenda pública dos participantes e inclusão em PDFs/Excel.

### ✅ Períodos de Inscrição e Realização (v5.2)
- [x] **Banco de Dados (Supabase)**: Migração com novos campos de datas (inscrição e realização) independentes.
- [x] **Segurança RPC**: Validação inteligente de período no momento do registro.
- [x] **UI Dinâmica (Admin)**: Atualização automática de status (Em Breve, Inscrições Abertas, Encerradas, Em Andamento) baseada no horário atual.
- [x] **Hub Público**: Exibição aprimorada de datas em chips no Portal do Participante.

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
© 2026 Bom Pastor Digital • **Versão 7.0.0**
