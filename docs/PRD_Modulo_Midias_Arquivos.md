# PRD — Módulo de Arquivamento de Mídias e Documentos (v7.3.0)

**Sistema:** Bom Pastor Digital  
**Versão:** 7.3.0  
**Data:** 25/09/2026  
**Status:** Implementado (Ambiente Local)

---

## 1. Visão Geral e Objetivo
O **Módulo de Arquivamento de Mídias e Documentos** foi concebido para centralizar, catalogar e proteger o acervo de materiais vinculados aos eventos do Bom Pastor Digital (como encontros de casais, retiros e formações).

### 🎯 Problema Resolvido:
- Fim da dispersão de arquivos operacionais e registros pastorais (cronogramas, roteiros, escalas em Excel, fotos e gravações) em chats de WhatsApp e aparelhos celulares individuais de membros da coordenação.
- Eliminação do risco de corrupção ou perda de arquivos após o término do encontro.

### 🛡️ Travas e Princípios Arquiteturais:
- **Zero Impacto no Backend Existente:** Nenhuma tabela existente (`eventos`, `inscricoes`, `pessoas`, etc.) foi alterada ou afetada. Foi criada uma única tabela aditiva e isolada (`evento_arquivos`).
- **Segurança e Isolamento:** Módulo 100% restrito à Área Administrativa (`/admin/midias`), visível apenas para administradores e coordenadores autenticados. Participantes não possuem acesso a esta área.
- **Desenvolvimento Local:** Nenhuma alteração foi ou será enviada para o GitHub remoto até a validação e homologação expressa.

---

## 2. Regras de Negócio e Limites de Cota

### 📊 Cota por Evento: **150 MB**
- **Cálculo:** Em tempo real, somando os bytes exatos registrados na coluna `tamanho_bytes` da tabela `evento_arquivos` para o `evento_id` selecionado.
- **Barra de Progresso Visual (`QuotaBar`):**
  - 🟢 **Faixa Normal (< 80% / 0 a 119 MB):** Operação regular com barra verde.
  - 🟠 **Faixa de Atenção (80% a 89% / 120 a 134 MB):** Notificação de consumo elevado com barra âmbar/laranja.
  - 🔴 **Faixa Crítica (≥ 90% / 135 a 150 MB):** Notificação em vermelho e bloqueio preventivo de novos uploads.

### 📁 Categorias Permitidas e Limites Individuais:
| Categoria | Extensões | Limite Máximo | Ícone |
|---|---|:---:|:---:|
| **Planilhas** | `.xlsx`, `.xls`, `.csv` | 15 MB | 📊 |
| **Fotos** | `.jpg`, `.jpeg`, `.png`, `.webp` | 10 MB | 🖼️ |
| **Vídeos** | `.mp4` | 50 MB | 🎬 |
| **Áudios** | `.mp3`, `.aac`, `.m4a` | 25 MB | 🎙️ |
| **Documentos** | `.pdf`, `.docx`, `.doc`, etc. | 15 MB | 📁 |

> 🚫 **Formato Estritamente Proibido:** Arquivos com extensão `.wav` (MIME types `audio/wav`, `audio/x-wav`) são rejeitados imediatamente no cliente antes de qualquer upload para evitar consumo excessivo de cota.

---

## 3. Experiência do Usuário (UX) & Design

Inspirado nos padrões modernos do **Windows Explorer** e **Google Drive**:

### 3.1 Seletor de Modo de Exibição
- **Lista Detalhada (Padrão ☰):**
  - Tabela compacta (linhas de ~44px) com excelente densidade de informação.
  - Colunas: *Tipo (Ícone colorido)*, *Nome do Arquivo / Título*, *Categoria (Badge)*, *Tamanho formatado*, *Data e Hora de Envio* e *Ações*.
- **Mini-Cards Horizontais (Grade ⊞):**
  - Cards horizontais compactos (~60px de altura) dispostos em grid de 3 colunas no desktop.
- **Persistência:** A preferência de visualização escolhida é salva no `localStorage` do navegador.

### 3.2 Ações por Arquivo:
1. ✏️ **Editar Título:** Abre um modal dedicado para alterar o título amigável de exibição sem tocar no arquivo físico.
2. 📥 **Baixar Arquivo:** Força o download do arquivo diretamente para o computador com seu nome original e extensão.
3. ↗️ **Visualizar:** Abre o arquivo em uma nova aba do navegador para pré-visualização rápida.
4. 🗑️ **Excluir Arquivo:** Remove o registro do banco de dados e apaga o arquivo físico do Supabase Storage, liberando o espaço na cota do evento.

---

## 4. Arquitetura Técnica

### 4.1 Banco de Dados (PostgreSQL / Supabase):
```sql
CREATE TABLE public.evento_arquivos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id BIGINT NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    nome_original VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) DEFAULT 'documentos',
    tamanho_bytes BIGINT NOT NULL,
    mimetype VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL,
    storage_url TEXT NOT NULL,
    criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 4.2 Supabase Storage:
- **Bucket:** `eventos_midias` (Public)
- **Estrutura de Pastas:** `evento_{evento_id}/{categoria}/{timestamp}_{hash}_{nome_sanitizado}.ext`
- **Políticas RLS:** Políticas para `SELECT`, `INSERT`, `UPDATE` e `DELETE` em `storage.objects` para o `bucket_id = 'eventos_midias'`.

### 4.3 Componentes Frontend:
- `midiaService.ts`: Serviço com validações, cálculo de cota em tempo real, upload, deleção e atualização de título.
- `QuotaBar.tsx`: Barra de progresso dinâmica em 3 cores.
- `MidiaUploadDialog.tsx`: Modal de envio com drag-and-drop, autodetecção de categoria e título, e bloqueio de formatos inválidos.
- `MidiaGalleryGrid.tsx`: Visualização alternável Lista / Grade com filtros por abas e busca textual.
- `MidiasPage.tsx`: Página administrativa integrando os componentes com seletor de evento.
- Rota: `/admin/midias` (protegida com `requireAdmin={true}`).

---

*Documento homologado em 25/09/2026 para a versão 7.3.0 do Bom Pastor Digital.*
