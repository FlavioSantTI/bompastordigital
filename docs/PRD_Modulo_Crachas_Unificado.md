# PRD — Módulo Unificado e Desacoplado de Geração de Crachás

**Sistema:** Bom Pastor Digital — Gestão Paroquial e de Movimentos Eclesiais (ECC, EJC, Cursilho, Retiros)  
**Documento:** Product Requirements Document (PRD)  
**Versão:** 1.0.0  
**Status:** Aprovado para Desenvolvimento  
**Data:** Setembro de 2026  
**Autor:** Flávio Santiago  

---

## 1. Visão Geral e Contexto Executivo

### 1.1 Contexto do Sistema Bom Pastor

O **Sistema Bom Pastor Digital** é uma plataforma web (React 18 + TypeScript + Vite + Material UI + Supabase) concebida para a gestão integrada de paróquias, pastorais e grandes encontros/movimentos de espiritualidade — notadamente Encontro de Casais com Cristo (ECC), Encontro de Jovens com Cristo (EJC), Cursilhos e retiros de fim de semana.

Estes eventos caracterizam-se por estruturas dinâmicas, com centenas de pessoas categorizadas em múltiplos grupos com propósitos operacionais distintos:

- **Participantes / Encontristas:** Inscritos (casais ou individuais) organizados frequentemente em *Círculos* ou *Grupos de Partilha*, identificados por cores, nomes de santos ou números.
- **Equipes de Serviço / Apoio:** Agrupadas por funções de retaguarda (Cozinha, Liturgia, Sala/Ordem, Vigília, Acolhida, Trânsito, Mini-Mercado, Compras), com hierarquia de Chefe, Subchefe e Componente.
- **Palestrantes e Dirigentes Espirituais:** Padres, diáconos, casais palestrantes convidados que necessitam de credenciamento especial e controle de entrada/saída.

### 1.2 Stack Tecnológica Atual

| Camada       | Tecnologia                                                          |
| :----------- | :------------------------------------------------------------------ |
| **Frontend** | React 18 + TypeScript + Vite + Material UI                         |
| **Backend**  | Supabase (PostgreSQL + Auth JWT + Storage + Edge Functions)         |
| **PDF**      | `@react-pdf/renderer` (renderização vetorial client-side)           |
| **Deploy**   | Docker + Nginx / Hosting Supabase                                  |

### 1.3 O Problema

O módulo de crachás atual (`CrachasPage.tsx` + `CrachaTemplate.tsx`) está **fortemente acoplado** à entidade de **inscrições** (casais e individuais), atendendo somente ao caso de uso de encontristas. As limitações concretas são:

| Problema                                                   | Impacto                                                                 |
| :--------------------------------------------------------- | :---------------------------------------------------------------------- |
| RPC `get_inscritos_para_cracha` retorna **apenas inscritos** | Equipes e palestrantes não têm crachás no sistema                       |
| `CrachaData` interface com campos fixos (paróquia, diocese) | Impossível adaptar para equipes (cargo, cor) ou círculos (sala, grupo)  |
| Layout hardcoded (2 por folha, 100×140mm)                   | Não suporta grades 2x4, térmicas ou mesa/tenda                         |
| Texto de rodapé fixo ("Palmas - 2026")                      | Não dinâmico; precisa editar código a cada evento                       |
| Logo hardcoded (`/img/logo.jpg`)                            | Não personalizável por evento                                           |
| Nomes longos sem tratamento                                 | Overflow de texto quando o nome excede a largura do crachá              |
| Sem QR Code                                                 | Impossível fazer check-in ou controle de acesso automatizado            |

### 1.4 A Solução

Implementar o **Módulo Unificado de Emissão de Crachás**, estruturado sob uma **arquitetura estritamente desacoplada** baseada no padrão *Adapter/Canonical Payload*. A camada de renderização visual e diagramação é 100% independente da fonte dos dados, permitindo plugar qualquer entidade (cadastros atuais ou futuros) e emitir folhas A4 diagramadas, etiquetas individuais ou crachás térmicos.

---

## 2. Objetivos de Negócio e Métricas de Sucesso (KPIs)

### 2.1 Objetivos de Negócio

1. **Reutilização Total:** Centralizar 100% da emissão de crachás do sistema em uma engine única.
2. **Autonomia das Equipes:** Permitir que coordenadores paroquiais customizem modelos (cores, logos, versos de oração/cronograma) sem intervenção técnica.
3. **Agilidade no Credenciamento:** Reduzir o tempo de confecção e reimpressão de crachás de substituição para menos de 10 segundos por pessoa.

### 2.2 Métricas de Sucesso (KPIs)

| KPI                              | Meta                                                              |
| :------------------------------- | :---------------------------------------------------------------- |
| Tempo de Geração de Lote         | ≤ 8s para 300 crachás em PDF A4 pronto para corte                |
| Taxa de Desperdício por Overflow | 0% de textos cortados via auto-ajuste de fonte (*fit-to-width*)   |
| Adoção Unificada                 | 100% dos crachás (equipes, círculos, palestrantes) migrados       |
| Cobertura de Entidades           | ≥ 4 fontes de dados distintas plugadas via Adapters               |

---

## 3. Arquitetura Conceitual e Técnica

### 3.1 Padrão Arquitetural: Adapter + Canonical Payload

Para garantir desacoplamento estrito, os módulos de origem nunca chamam diretamente o renderizador de PDF. O fluxo é mediado por um contrato canônico:

```
+---------------------+    +---------------------+    +---------------------+    +---------------------+
|  Módulo Inscrições  |    |  Módulo Palestrantes |    |   Módulo Círculos   |    |    Módulo Equipes   |
|  (inscricoes +      |    |  (palestrantes +     |    |  (circulos +        |    |  (equipes +         |
|   pessoas + dioceses)|   |   atividade_palestr.)|    |   circulo_membros)  |    |   equipe_membros +  |
+---------------------+    +---------------------+    +---------------------+    |   cargos_equipe)    |
           \                          |                         |                +---------------------+
            \                         |                         |                         /
             v                        v                         v                        v
        +--------------------------------------------------------------------------+
        |                     CAMADA DE ADAPTERS (TypeScript)                       |
        |  Cada Adapter implementa:  (entidade) → CanonicalBadgePayload[]          |
        |  • InscritosAdapter                                                      |
        |  • PalestrantesAdapter                                                   |
        |  • CirculosAdapter                                                       |
        |  • EquipesAdapter                                                        |
        +--------------------------------------------------------------------------+
                                           |
                                           v
        +--------------------------------------------------------------------------+
        |                    CANONICAL BADGE PAYLOAD (Interface TS)                 |
        |  Estrutura normalizada que unifica TODOS os dados de crachá               |
        +--------------------------------------------------------------------------+
                                           |
                                           v
        +--------------------------------------------------------------------------+
        |                 MOTOR DE TEMPLATES & LAYOUT (@react-pdf/renderer)         |
        |  • Aplica Tema, Dimensões, Margens, Grade A4, Verso                       |
        |  • Fit-to-width para nomes longos                                         |
        |  • Marcas de corte configuráveis                                           |
        |  • QR Code embutido                                                       |
        +--------------------------------------------------------------------------+
                                           |
                                           v
        +--------------------------------------------------------------------------+
        |                RENDERIZADOR PDF (Blob → Download / Impressão)             |
        |  Geração client-side via @react-pdf/renderer ou server-side via Edge Fn   |
        +--------------------------------------------------------------------------+
```

### 3.2 Mapeamento das Tabelas Existentes para o Payload

O sistema já possui as seguintes tabelas que alimentarão os Adapters:

| Fonte de Dados      | Tabelas Supabase Envolvidas                                           | Schema SQL de Referência                    |
| :------------------- | :--------------------------------------------------------------------- | :------------------------------------------ |
| **Inscritos**        | `inscricoes`, `pessoas`, `dioceses`, `municipios`, `eventos`           | `schema.sql`                                |
| **Equipes**          | `equipes`, `equipe_membros`, `cargos_equipe`, `pessoas`               | `equipes_schema.sql`                        |
| **Palestrantes**     | `palestrantes`, `atividade_palestrantes`, `atividades`                 | `palestrantes_schema.sql`                   |
| **Círculos**         | `circulos`, `circulo_membros`, `inscricoes`, `pessoas`                | (migração de círculos v6.5)                 |

### 3.3 Especificação do Canonical Badge Payload (TypeScript Interface)

Todo e qualquer Adapter deve produzir objetos aderentes ao seguinte contrato:

```typescript
/**
 * CanonicalBadgePayload
 * Contrato canônico para o motor unificado de crachás.
 * Qualquer fonte de dados (inscritos, equipes, palestrantes, círculos)
 * deve ser normalizada para esta interface antes da renderização.
 */
export interface CanonicalBadgePayload {
  /** Identificador único da entidade/inscrição */
  id: string;

  /** URL ou Base64 da foto do titular (opcional) */
  avatar_url?: string | null;

  /** Nome principal exibido em destaque (nome de crachá) */
  primary_name: string;

  /** Nome completo formal ou subtítulo (opcional) */
  secondary_name?: string | null;

  /**
   * Rótulo da categoria.
   * Ex: "Círculo Amarelo", "Equipe Cozinha", "Palestrante", "Encontrista"
   */
  category_label: string;

  /**
   * Tag visual de cargo/papel.
   * Ex: "Coordenador", "Casal Apoio", "Chefe", "Convidado"
   */
  role_badge?: string | null;

  /** Hexadecimal (#RRGGBB) para tarja temática / acento de cor */
  accent_color: string;

  /** Informações do evento */
  event_info: {
    event_name: string;
    edition?: string;
    date_range?: string;
    parish_name?: string;
  };

  /**
   * Conteúdo para geração do QR Code.
   * Token encriptado ou URL de check-in.
   */
  qr_code_content?: string | null;

  /**
   * Metadados exibidos no rodapé do crachá.
   * Ex: [{ label: "Paróquia", value: "São José" }, { label: "Diocese", value: "Palmas" }]
   */
  footer_metadata: Array<{
    label: string;
    value: string;
  }>;

  /** Conteúdo do verso do crachá (opcional) */
  backside_content?: {
    type: 'PRAYER' | 'SCHEDULE' | 'MAP' | 'CUSTOM_TEXT' | 'BLANK';
    title?: string;
    body_markdown?: string;
  } | null;
}

/**
 * Tipo de fonte de dados para o seletor de origem.
 */
export type BadgeSourceEntity =
  | 'INSCRITO'
  | 'PALESTRANTE'
  | 'EQUIPE'
  | 'CIRCULO';
```

### 3.4 JSON Schema (Equivalente para validação server-side)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CanonicalBadgePayload",
  "type": "object",
  "required": ["id", "primary_name", "category_label", "accent_color", "event_info", "footer_metadata"],
  "properties": {
    "id": { "type": "string", "description": "Identificador único da entidade/inscrição" },
    "avatar_url": { "type": ["string", "null"], "description": "URL ou Base64 da foto do titular" },
    "primary_name": { "type": "string", "description": "Nome principal exibido em destaque (nome de crachá)" },
    "secondary_name": { "type": ["string", "null"], "description": "Nome completo formal ou subtítulo" },
    "category_label": { "type": "string", "description": "Ex: Círculo Amarelo, Equipe Cozinha, Palestrante" },
    "role_badge": { "type": ["string", "null"], "description": "Ex: Coordenador, Casal Apoio, Convidado" },
    "accent_color": { "type": "string", "pattern": "^#([A-Fa-f0-9]{6})$", "description": "Hexadecimal para tarja temática" },
    "event_info": {
      "type": "object",
      "required": ["event_name"],
      "properties": {
        "event_name": { "type": "string" },
        "edition": { "type": "string" },
        "date_range": { "type": "string" },
        "parish_name": { "type": "string" }
      }
    },
    "qr_code_content": { "type": ["string", "null"], "description": "Token encriptado ou URL de check-in" },
    "footer_metadata": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["label", "value"],
        "properties": {
          "label": { "type": "string" },
          "value": { "type": "string" }
        }
      }
    },
    "backside_content": {
      "type": ["object", "null"],
      "properties": {
        "type": { "type": "string", "enum": ["PRAYER", "SCHEDULE", "MAP", "CUSTOM_TEXT", "BLANK"] },
        "title": { "type": "string" },
        "body_markdown": { "type": "string" }
      }
    }
  }
}
```

---

## 4. Requisitos Funcionais (RF)

| ID       | Requisito                                       | Descrição Detalhada                                                                                                                                                                                                                                                                                    | Prioridade    |
| :------- | :---------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------ |
| **RF-01** | **Seletor de Fonte de Dados (Source Picker)**    | Substituir o Select de "Evento" atual por uma tela com 2 níveis: (1) Selecionar Evento, (2) Selecionar Origem (`INSCRITO`, `PALESTRANTE`, `EQUIPE`, `CIRCULO`). A lista de participantes é carregada via Adapter correspondente.                                                                        | **Must Have** |
| **RF-02** | **Adapters por Entidade**                       | Implementar 4 Adapters TypeScript que transformam os dados de cada tabela para `CanonicalBadgePayload[]`. Cada Adapter chama sua RPC/query Supabase específica e normaliza os campos.                                                                                                                  | **Must Have** |
| **RF-03** | **Gerenciador de Modelos (Templates)**          | Configuração de layouts de impressão: dimensões (crachá 9x13cm, 8x10cm, 7x10cm, etiqueta adesiva, crachá de mesa/tenda), orientação (retrato/paisagem), plano de fundo, fontes e cabeçalhos. Templates salvos em `badge_templates` no Supabase.                                                       | **Must Have** |
| **RF-04** | **Mapeamento Flexível (Field Binding)**         | Tela onde o operador vincula quais campos nativos do cadastro alimentam o Payload Canônico (ex.: campo `apelido` → `primary_name`, campo `nome_completo` → `secondary_name`). Para MVP, mapeamentos padrão hardcoded nos Adapters.                                                                    | **Should Have** |
| **RF-05** | **Diagramação em Grade A4 com Sangria**         | O motor deve dispor automaticamente os crachás em folhas A4 (grades 2x1, 2x2, 2x3 ou 2x4), inserindo marcas de corte pontilhadas de 0.5pt e margem de segurança configurável (default: 5mm).                                                                                                         | **Must Have** |
| **RF-06** | **Tratamento Dinâmico de Texto (*Fit-to-Width*)** | Nomes com mais de 18 caracteres ou que excedam a largura do contêiner devem ter o tamanho da fonte reduzido progressivamente (de 28pt até o mínimo de 14pt) para evitar overflow ou sobreposição.                                                                                                      | **Must Have** |
| **RF-07** | **Suporte a Impressão Frente e Verso (Duplex)** | Capacidade de gerar páginas pares com o verso espelhado horizontalmente, garantindo que ao imprimir frente-e-verso na mesma folha, a oração ou cronograma coincida exatamente com a frente correspondente.                                                                                             | **Should Have** |
| **RF-08** | **Integração com QR Code Dinâmico**             | Geração automática de código QR em cada crachá contendo token seguro (ID do participante + evento) para controle de entrada nas palestras, refeições e registro de frequência. Utilizar biblioteca `qrcode` ou `react-qr-code` para gerar SVG/imagem inline no PDF.                                    | **Must Have** |
| **RF-09** | **Emissão em Lote e Filtros Avançados**         | Possibilidade de selecionar filtros por: equipe específica, círculo, cargo (Chefe/Subchefe/Componente), status de confirmação. Geração de um único PDF consolidado para download.                                                                                                                      | **Must Have** |
| **RF-10** | **Fila de Contingência / Impressão Rápida**     | Campo de busca rápida por CPF ou nome no balcão de credenciamento para reimpressão imediata de 1 único crachá avulso. Botão "Imprimir este" direto na tabela, gerando PDF de página única.                                                                                                             | **Should Have** |
| **RF-11** | **Cor por Entidade / Equipe / Círculo**         | Utilizar automaticamente a cor (`equipes.cor` ou `circulos.cor`) como `accent_color` do crachá, proporcionando identificação visual instantânea por setor ou grupo.                                                                                                                                    | **Must Have** |

---

## 5. Casos de Uso Específicos por Entidade

### 5.1 Caso de Uso 1: Inscritos (Encontristas — Casais e Individuais)

**Tabelas envolvidas:** `inscricoes` + `pessoas` + `dioceses` + `municipios` + `eventos`  
**RPC existente:** `get_inscritos_para_cracha(p_evento_id)`

- **Necessidade:** Crachá padrão para encontristas com nome, paróquia, diocese e cidade.
- **Mapeamento do Adapter (`InscritosAdapter`):**

  | Campo Payload         | Origem                                           | Exemplo                                  |
  | :-------------------- | :----------------------------------------------- | :--------------------------------------- |
  | `primary_name`        | `pessoas.nome`                                   | "Maria da Silva"                         |
  | `secondary_name`      | —                                                | null                                     |
  | `category_label`      | Derivado de `tipo` (esposo/esposa/individual)    | "Esposa" ou "Individual"                 |
  | `role_badge`          | —                                                | null                                     |
  | `accent_color`        | Cor padrão do evento ou `#4A148C`                | "#4A148C"                                |
  | `footer_metadata`     | paróquia, diocese, cidade                         | `[{label:"Paróquia", value:"São José"}]` |
  | `qr_code_content`     | `inscricao_id` + `evento_id`                     | "BPD:INS:uuid:42"                        |
  | `backside_content`    | null (default)                                   | —                                        |

### 5.2 Caso de Uso 2: Palestrantes

**Tabelas envolvidas:** `palestrantes` + `atividade_palestrantes` + `atividades`

- **Necessidade:** Destacar nome do palestrante, tema da palestra, horário e paróquia de origem.
- **Mapeamento do Adapter (`PalestrantesAdapter`):**

  | Campo Payload         | Origem                                           | Exemplo                                           |
  | :-------------------- | :----------------------------------------------- | :------------------------------------------------ |
  | `primary_name`        | `palestrantes.nome`                              | "Pe. Antônio Maria"                               |
  | `secondary_name`      | Paróquia/Diocese de origem (via metadata)        | "Paróquia Nossa Senhora Aparecida"                |
  | `category_label`      | Fixo                                             | "Palestrante"                                     |
  | `role_badge`          | `atividade_palestrantes.tipo_participacao`        | "Principal" / "Painelista" / "Mediador"            |
  | `accent_color`        | Roxo Litúrgico ou Dourado                        | `#7E22CE` ou `#B45309`                            |
  | `avatar_url`          | `palestrantes.foto_url` (Storage Supabase)       | "https://...supabase.co/storage/v1/..."           |
  | `footer_metadata`     | Palestra + Horário                               | `[{label:"Palestra", value:"Família..."}, ...]`   |
  | `qr_code_content`     | `palestrante_id` + evento                        | "BPD:PAL:42:EVT:7"                                |
  | `backside_content`    | Cronograma geral                                 | `{type:"SCHEDULE", ...}`                          |

### 5.3 Caso de Uso 3: Equipes de Apoio (ECC / EJC / Retiros)

**Tabelas envolvidas:** `equipes` + `equipe_membros` + `cargos_equipe` + `pessoas`

- **Necessidade:** Identificação clara da equipe para organização da casa de retiro e segurança do evento.
- **Mapeamento do Adapter (`EquipesAdapter`):**

  | Campo Payload         | Origem                                           | Exemplo                                           |
  | :-------------------- | :----------------------------------------------- | :------------------------------------------------ |
  | `primary_name`        | `pessoas.nome`                                   | "João Carlos"                                     |
  | `secondary_name`      | Nome civil completo (se apelido diferir)         | null (mesmo campo)                                |
  | `category_label`      | `equipes.nome`                                   | "Equipe da Cozinha"                               |
  | `role_badge`          | `cargos_equipe.nome`                             | "Chefe" / "Subchefe" / "Componente"               |
  | `accent_color`        | `equipes.cor` (#RRGGBB)                          | "#F44336" (Vermelho para Cozinha)                 |
  | `footer_metadata`     | Cargo + Observação                               | `[{label:"Função", value:"Chefe da Equipe"}]`     |
  | `qr_code_content`     | `pessoa_id` + `equipe_id`                        | "BPD:EQP:42:PES:uuid"                             |

### 5.4 Caso de Uso 4: Círculos / Grupos de Discussão

**Tabelas envolvidas:** `circulos` + `circulo_membros` + `inscricoes` + `pessoas`

- **Necessidade:** Letras grandes e visíveis a longa distância para facilitar a reunião dos participantes nas salas temáticas.
- **Mapeamento do Adapter (`CirculosAdapter`):**

  | Campo Payload         | Origem                                           | Exemplo                                           |
  | :-------------------- | :----------------------------------------------- | :------------------------------------------------ |
  | `primary_name`        | `pessoas.nome` (primeiro nome destacado)         | "Maria"                                           |
  | `secondary_name`      | Nome completo                                    | "Maria Aparecida dos Santos"                      |
  | `category_label`      | `circulos.nome`                                  | "Círculo Amarelo - Sala São Francisco"            |
  | `role_badge`          | "Encontrista" ou "Coordenador de Círculo"        | "Encontrista"                                     |
  | `accent_color`        | `circulos.cor`                                   | "#FFC107" (Amarelo)                               |
  | `footer_metadata`     | Casal coordenador + Sala                         | `[{label:"Coord.", value:"João e Maria"}]`        |
  | `backside_content`    | Oração + mapa das salas                          | `{type:"PRAYER", title:"Oração do Encontro", ...}`|

---

## 6. Requisitos Não Funcionais (RNF)

| ID       | Requisito                                | Especificação                                                                                                                                                                                |
| :------- | :--------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RNF-01** | **Performance de Processamento**         | O processador (client-side via `@react-pdf/renderer`) deve renderizar e compilar um lote de 300 crachás em ≤ 8 segundos. Para lotes > 200, exibir barra de progresso. Para > 500, considerar Edge Function com streaming. |
| **RNF-02** | **Precisão de Impressão**                | O motor de PDF deve produzir saída vetorial nativa em 300 DPI, garantindo legibilidade perfeita de QR Codes mesmo em tamanhos reduzidos (15×15mm).                                          |
| **RNF-03** | **Privacidade e LGPD**                   | Dados médicos, restrições alimentares severas e contatos de emergência **não** devem ser impressos na face frontal do crachá. Se necessários, ficam protegidos dentro de URL restrita via QR Code. |
| **RNF-04** | **Compatibilidade de Impressão**         | Suporte para impressoras jato de tinta/laser padrão A4 (folhas couchê/glossy 180g) e impressoras térmicas de rolo contínuo (Zebra, Elgin).                                                 |
| **RNF-05** | **Consistência de Diagramação**          | Quebras de linha automáticas e redução progressiva de fonte (fit-to-width) para nomes extensos, impedindo overflow no layout. Mínimo de 14pt para legibilidade.                             |
| **RNF-06** | **Alinhamento de Margens**               | Margem de sangria (bleed) de ≥ 5mm e marcação de linhas de corte pontilhadas para guilhotina manual.                                                                                        |
| **RNF-07** | **Segurança RLS**                        | Todas as RPCs de dados para crachás devem respeitar as políticas RLS existentes (`role = 'admin'` para escrita).                                                                            |
| **RNF-08** | **Responsividade da Interface**          | A tela de gerenciamento de crachás deve funcionar em tablets (≥ 768px) para uso no balcão de credenciamento.                                                                                 |

---

## 7. Estrutura do Banco de Dados (Schema Relacional — Novas Tabelas)

As tabelas abaixo se integram ao schema existente do Bom Pastor Digital, referenciando `eventos(id)` e `auth.users(id)`:

```sql
-- ================================================================
-- MÓDULO UNIFICADO DE CRACHÁS — NOVAS TABELAS
-- Projeto: Bom Pastor Digital
-- PRD: Módulo Unificado e Desacoplado de Geração de Crachás v1.0
-- ================================================================

-- ========================================
-- 1. TABELA: badge_templates
-- Templates configuráveis de layout de crachás
-- ========================================
CREATE TABLE IF NOT EXISTS badge_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    layout_type VARCHAR(20) NOT NULL DEFAULT 'GRID_A4',
        -- 'GRID_A4': Folha A4 com grade de crachás
        -- 'THERMAL_ROLL': Rolo térmico contínuo (Zebra/Elgin)
        -- 'DESK_TENT': Crachá de mesa/tenda dobrado
    grid_columns INTEGER NOT NULL DEFAULT 2,         -- Colunas na grade A4 (1, 2 ou 3)
    grid_rows INTEGER NOT NULL DEFAULT 2,            -- Linhas na grade A4 (1 a 5)
    width_mm NUMERIC(5,2) NOT NULL DEFAULT 90.00,    -- Largura do crachá em mm
    height_mm NUMERIC(5,2) NOT NULL DEFAULT 130.00,  -- Altura do crachá em mm
    margin_mm NUMERIC(4,2) NOT NULL DEFAULT 5.00,    -- Margem de segurança em mm
    has_backside BOOLEAN NOT NULL DEFAULT FALSE,      -- Gerar verso espelhado?
    has_qr_code BOOLEAN NOT NULL DEFAULT TRUE,        -- Incluir QR Code?
    has_cut_marks BOOLEAN NOT NULL DEFAULT TRUE,      -- Marcas de corte?
    bg_image_url VARCHAR(500),                        -- URL do background (Storage Supabase)
    logo_url VARCHAR(500),                            -- URL do logo do evento
    header_config JSONB DEFAULT '{}',
        -- { "show_event_name": true, "show_edition": true, "font_family": "Playfair Display" }
    styling_rules JSONB DEFAULT '{}',
        -- { "primary_font_size": 22, "min_font_size": 14, "accent_position": "top" }
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE badge_templates IS 'Templates configuráveis de layout para impressão de crachás. Um evento pode ter múltiplos templates.';

-- Índice para busca por evento
CREATE INDEX IF NOT EXISTS idx_badge_templates_evento ON badge_templates(evento_id);

-- ========================================
-- 2. TABELA: badge_generation_jobs
-- Histórico de lotes de crachás gerados
-- ========================================
CREATE TABLE IF NOT EXISTS badge_generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES badge_templates(id) ON DELETE CASCADE,
    source_entity VARCHAR(50) NOT NULL,
        -- 'INSCRITO', 'PALESTRANTE', 'EQUIPE', 'CIRCULO'
    filter_criteria JSONB DEFAULT '{}',
        -- Ex: { "equipe_id": 5 } ou { "circulo_id": "uuid" } ou { "status": "confirmada" }
    total_records INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'QUEUED',
        -- 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'
    pdf_output_url VARCHAR(500),                      -- URL do PDF gerado (Storage Supabase)
    error_message TEXT,
    created_by UUID NOT NULL,                         -- auth.uid() do admin que gerou
    created_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);

COMMENT ON TABLE badge_generation_jobs IS 'Registro histórico de cada lote de crachás gerado, com status e link para o PDF resultante.';

-- Índices
CREATE INDEX IF NOT EXISTS idx_badge_jobs_evento ON badge_generation_jobs(evento_id);
CREATE INDEX IF NOT EXISTS idx_badge_jobs_status ON badge_generation_jobs(status);

-- ========================================
-- 3. ROW LEVEL SECURITY
-- ========================================
ALTER TABLE badge_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Leitura para admins autenticados
CREATE POLICY "badge_templates_select"
    ON badge_templates FOR SELECT TO authenticated
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- CRUD completo para admins
CREATE POLICY "badge_templates_admin"
    ON badge_templates FOR ALL TO authenticated
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Jobs: mesma política
CREATE POLICY "badge_jobs_select"
    ON badge_generation_jobs FOR SELECT TO authenticated
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "badge_jobs_admin"
    ON badge_generation_jobs FOR ALL TO authenticated
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
```

---

## 8. Novas RPCs Supabase (Funções SQL)

### 8.1 RPC: Membros de Equipe para Crachá

```sql
-- ================================================================
-- RPC: get_equipe_membros_para_cracha
-- Retorna membros de equipes de um evento para geração de crachás.
-- ================================================================
CREATE OR REPLACE FUNCTION get_equipe_membros_para_cracha(
    p_evento_id INTEGER,
    p_equipe_id INTEGER DEFAULT NULL  -- Se NULL, retorna TODAS as equipes
)
RETURNS TABLE(
    membro_id     INTEGER,
    pessoa_id     UUID,
    nome          TEXT,
    equipe_nome   TEXT,
    equipe_cor    TEXT,
    cargo_nome    TEXT,
    cargo_nivel   INTEGER,
    observacao    TEXT,
    evento_nome   TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        em.id          AS membro_id,
        p.id           AS pessoa_id,
        p.nome         AS nome,
        eq.nome        AS equipe_nome,
        eq.cor         AS equipe_cor,
        ce.nome        AS cargo_nome,
        ce.nivel       AS cargo_nivel,
        em.observacao  AS observacao,
        ev.nome        AS evento_nome
    FROM equipe_membros em
    JOIN equipes eq       ON eq.id = em.equipe_id
    JOIN pessoas p        ON p.id = em.pessoa_id
    JOIN cargos_equipe ce ON ce.id = em.cargo_id
    JOIN eventos ev       ON ev.id = eq.evento_id
    WHERE eq.evento_id = p_evento_id
      AND (p_equipe_id IS NULL OR eq.id = p_equipe_id)
    ORDER BY eq.nome, ce.nivel, p.nome;
$$;

REVOKE ALL ON FUNCTION get_equipe_membros_para_cracha(INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_equipe_membros_para_cracha(INTEGER, INTEGER) TO authenticated;
```

### 8.2 RPC: Palestrantes para Crachá

```sql
-- ================================================================
-- RPC: get_palestrantes_para_cracha
-- Retorna palestrantes vinculados a atividades de um evento.
-- ================================================================
CREATE OR REPLACE FUNCTION get_palestrantes_para_cracha(p_evento_id INTEGER)
RETURNS TABLE(
    palestrante_id    INTEGER,
    nome              TEXT,
    foto_url          TEXT,
    tipo_participacao TEXT,
    atividade_titulo  TEXT,
    atividade_data    DATE,
    atividade_hora    TEXT,
    evento_nome       TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT DISTINCT ON (pal.id)
        pal.id                 AS palestrante_id,
        pal.nome               AS nome,
        pal.foto_url           AS foto_url,
        ap.tipo_participacao   AS tipo_participacao,
        a.titulo               AS atividade_titulo,
        a.data                 AS atividade_data,
        a.hora_inicio          AS atividade_hora,
        ev.nome                AS evento_nome
    FROM palestrantes pal
    JOIN atividade_palestrantes ap ON ap.palestrante_id = pal.id
    JOIN atividades a              ON a.id = ap.atividade_id
    JOIN eventos ev                ON ev.id = a.evento_id
    WHERE a.evento_id = p_evento_id
    ORDER BY pal.id, a.data, a.hora_inicio;
$$;

REVOKE ALL ON FUNCTION get_palestrantes_para_cracha(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_palestrantes_para_cracha(INTEGER) TO authenticated;
```

### 8.3 RPC: Membros de Círculos para Crachá

```sql
-- ================================================================
-- RPC: get_circulo_membros_para_cracha
-- Retorna membros de círculos de um evento para geração de crachás.
-- ================================================================
CREATE OR REPLACE FUNCTION get_circulo_membros_para_cracha(
    p_evento_id INTEGER,
    p_circulo_id UUID DEFAULT NULL
)
RETURNS TABLE(
    membro_id          UUID,
    inscricao_id       UUID,
    pessoa_nome        TEXT,
    circulo_nome       TEXT,
    circulo_cor        TEXT,
    is_coordenador     BOOLEAN,
    coord_esposo_nome  TEXT,
    coord_esposa_nome  TEXT,
    evento_nome        TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        cm.id                  AS membro_id,
        cm.inscricao_id        AS inscricao_id,
        p.nome                 AS pessoa_nome,
        c.nome                 AS circulo_nome,
        c.cor                  AS circulo_cor,
        (c.esposo_coordenador_id = i.esposo_id
         OR c.esposa_coordenador_id = i.esposa_id
         OR c.esposo_coordenador_id = i.esposa_id
        )                      AS is_coordenador,
        pc_esp.nome            AS coord_esposo_nome,
        pc_esa.nome            AS coord_esposa_nome,
        ev.nome                AS evento_nome
    FROM circulo_membros cm
    JOIN circulos c          ON c.id = cm.circulo_id
    JOIN inscricoes i        ON i.id = cm.inscricao_id
    JOIN pessoas p           ON p.id = COALESCE(i.esposo_id, i.esposa_id)
    JOIN eventos ev          ON ev.id = c.evento_id
    LEFT JOIN pessoas pc_esp ON pc_esp.id = c.esposo_coordenador_id
    LEFT JOIN pessoas pc_esa ON pc_esa.id = c.esposa_coordenador_id
    WHERE c.evento_id = p_evento_id
      AND (p_circulo_id IS NULL OR c.id = p_circulo_id)
    ORDER BY c.nome, p.nome;
$$;

REVOKE ALL ON FUNCTION get_circulo_membros_para_cracha(INTEGER, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_circulo_membros_para_cracha(INTEGER, UUID) TO authenticated;
```

---

## 9. Estrutura de Arquivos Frontend (Proposta)

```
frontend/src/
├── types/
│   └── badge.ts                          # CanonicalBadgePayload + BadgeSourceEntity + BadgeTemplate
│
├── services/
│   └── badgeAdapters.ts                  # InscritosAdapter, PalestrantesAdapter, EquipesAdapter, CirculosAdapter
│
├── components/
│   └── admin/
│       ├── badges/                       # [NOVO] Diretório do módulo unificado
│       │   ├── BadgesPage.tsx            # Página principal (substitui CrachasPage.tsx)
│       │   ├── BadgeSourcePicker.tsx      # Seletor: Evento → Fonte (Inscritos, Equipes, etc.)
│       │   ├── BadgeFilterBar.tsx         # Barra de filtros contextuais por fonte
│       │   ├── BadgeParticipantTable.tsx  # Tabela de seleção com checkboxes
│       │   ├── BadgePreviewDialog.tsx     # Preview do PDF gerado (substitui CrachaPreviewDialog)
│       │   ├── BadgeTemplateConfig.tsx    # Configuração visual do template
│       │   └── templates/
│       │       ├── BadgeRenderer.tsx      # Motor de renderização @react-pdf (Document/Page)
│       │       ├── BadgeCard.tsx          # Componente visual de um crachá individual
│       │       ├── BadgeCutMarks.tsx      # Marcas de corte reutilizáveis
│       │       ├── BadgeQRCode.tsx        # Componente de QR Code para PDF
│       │       └── BadgeBackside.tsx      # Verso do crachá (oração, cronograma, mapa)
│       │
│       ├── CrachasPage.tsx               # [DEPRECATED] Manter temporariamente como fallback
│       ├── CrachaTemplate.tsx            # [DEPRECATED] Manter temporariamente como fallback
│       └── CrachaPreviewDialog.tsx       # [DEPRECATED] Manter temporariamente como fallback
```

---

## 10. Matriz de Riscos e Estratégias de Mitigação

| Risco Identificado                                          | Severidade | Probabilidade | Estratégia de Mitigação                                                                                                                                                         |
| :---------------------------------------------------------- | :--------: | :-----------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Alinhamento do Duplex (Frente e Verso) descalibrado**     |    Alta    |     Média     | Grade espelhada matemática (inversão da coluna ímpar com a par na página de verso) e margens de corte simétricas de ≥ 6mm.                                                       |
| **Gargalo de memória client-side com lotes grandes**        |    Média   |     Média     | Renderização em chunks paginados (50 por vez) com `requestAnimationFrame`. Para > 500, migrar para Edge Function com streaming para Storage Supabase.                           |
| **Nomes ou apelidos compostos muito longos**                |    Média   |     Alta      | Algoritmo de redução proporcional de escala (font-size clamping de 28pt → 14pt) e truncamento controlado com reticências para sobrenomes > 35 chars.                            |
| **Falta de conexão de internet durante o credenciamento**   |    Alta    |     Baixa     | Mecanismo de exportação prévia do lote completo em PDF 48h antes do início do evento. PWA com cache offline do último PDF gerado.                                                |
| **QR Code ilegível em impressão de baixa qualidade**        |    Média   |     Média     | Tamanho mínimo de 18×18mm. Nível de correção de erro "M" (15%). Teste de leitura com câmera de celular antes da impressão em massa.                                            |
| **Incompatibilidade de `@react-pdf/renderer` com QR Code**  |    Média   |     Baixa     | Gerar QR Code como imagem PNG base64 via `qrcode.toDataURL()` e incorporar como `<Image>` no PDF, em vez de SVG inline.                                                        |

---

## 11. Plano de Lançamento e Fases de Desenvolvimento

| Fase   | Semana  | Entregas                                                                                                                                                                                           |
| :----- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1**  | 1–2     | Definição da interface `CanonicalBadgePayload` em `types/badge.ts`. Implementação do `InscritosAdapter` (migrando lógica de `CrachasPage.tsx`). Motor de renderização base (`BadgeRenderer.tsx`).   |
| **2**  | 3–4     | `EquipesAdapter` + `CirculosAdapter`. RPC `get_equipe_membros_para_cracha` e `get_circulo_membros_para_cracha`. Componente `BadgeSourcePicker`.                                                    |
| **3**  | 5       | `PalestrantesAdapter` + RPC `get_palestrantes_para_cracha`. Integração com QR Code. Tela de `BadgeTemplateConfig` (MVP com presets).                                                               |
| **4**  | 6       | Fit-to-width. Suporte a frente-e-verso (Duplex). Schema SQL para `badge_templates` e `badge_generation_jobs`.                                                                                      |
| **5**  | 7       | Piloto em evento real (Encontro de Casais ou Jovens da Paróquia Bom Pastor). Coleta de feedback. Impressão rápida de contingência.                                                                 |
| **6**  | 8       | Ajustes finais. Deprecação dos arquivos legados (`CrachasPage.tsx`, `CrachaTemplate.tsx`, `CrachaPreviewDialog.tsx`). Atualização do PRD principal e ROADMAP.                                      |

---

## 12. Referências Cruzadas no Projeto

| Artefato Existente                                                 | Relação com este PRD                                                           |
| :----------------------------------------------------------------- | :----------------------------------------------------------------------------- |
| `supabase/rpc_inscritos_para_cracha_v2.sql`                        | RPC atual que será encapsulada dentro do `InscritosAdapter`                    |
| `frontend/src/components/admin/CrachaTemplate.tsx`                 | Componente legado a ser substituído por `BadgeRenderer.tsx`                    |
| `frontend/src/components/admin/CrachasPage.tsx`                    | Página legada a ser substituída por `BadgesPage.tsx`                           |
| `frontend/src/components/admin/CrachaPreviewDialog.tsx`            | Dialog legado a ser substituído por `BadgePreviewDialog.tsx`                   |
| `frontend/src/types.ts` (interfaces `Equipe`, `Circulo`, etc.)     | Interfaces TS existentes usadas como input pelos Adapters                     |
| `supabase/equipes_schema.sql`                                      | Schema de equipes cujos dados alimentam o `EquipesAdapter`                    |
| `supabase/palestrantes_schema.sql`                                 | Schema de palestrantes cujos dados alimentam o `PalestrantesAdapter`          |
| `PRD.md` (v5.5)                                                    | PRD principal do sistema — atualizar com referência a este módulo na v6.0     |

---

## 13. Glossário

| Termo                    | Definição                                                                                              |
| :----------------------- | :----------------------------------------------------------------------------------------------------- |
| **Adapter**              | Módulo TypeScript que transforma dados de uma tabela específica para o formato `CanonicalBadgePayload` |
| **Canonical Payload**    | Estrutura de dados normalizada que o motor de renderização consome, independente da origem              |
| **Fit-to-Width**         | Algoritmo que reduz progressivamente o tamanho da fonte para caber no espaço disponível                |
| **Sangria (Bleed)**      | Margem extra além da área de corte para evitar bordas brancas indesejadas                              |
| **Grade A4**             | Disposição de múltiplos crachás em uma folha A4 padrão (210×297mm)                                     |
| **Duplex**               | Impressão frente-e-verso com alinhamento espelhado                                                     |
| **ECC**                  | Encontro de Casais com Cristo — movimento eclesial                                                     |
| **EJC**                  | Encontro de Jovens com Cristo — movimento eclesial                                                     |
| **RLS**                  | Row Level Security — mecanismo de segurança por linha do PostgreSQL/Supabase                           |

---

**Desenvolvedor:** Flávio Santiago  
**Email:** flavio.santiago.ti@outlook.com  
**Repositório:** (privado)

---

*Documento criado em Setembro de 2026*
