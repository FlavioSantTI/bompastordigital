# 📖 Manual do Usuário — Módulo de Círculos & Alocação de Membros
**Sistema Bom Pastor Digital — Versão 7.0.0**

---

## 📌 1. Visão Geral

O **Módulo de Círculos** foi desenvolvido para permitir a organização dos participantes de um evento em pequenos grupos de convivência, estudo ou partilha (Círculos), sob a coordenação de um **Casal Coordenador** dedicado.

---

## 🛠️ 2. Gerenciamento de Círculos (CRUD)

### 📍 Como Acessar:
No menu lateral do Painel Administrativo, clique em **Círculos** (ou acesse a rota `/admin/circulos`).

---

### ➕ Criar um Novo Círculo:
1. Clique no botão **`+ Novo Círculo`** no topo da tela.
2. **Nome do Círculo** *(Obrigatório)*: Digite o nome de identificação (ex: *Círculo São José*, *Círculo Azul*, *Círculo Sagrada Família*).
3. **Descrição** *(Opcional)*: Escreva um breve resumo do propósito ou tema do círculo.
4. **Cor do Círculo**:
   - Selecione um tom rápido na paleta de cores pré-definidas **OU**
   - Clique na **Roda de Cores Gradiente** / botão **Seletor Personalizado** para abrir o espectro de cores nativo (RGB/HSL/Conta-gotas) e escolher qualquer cor desejada.
5. **Casal Coordenador** *(Obrigatório)*:
   - Digite no campo de busca o nome do esposo ou da esposa.
   - O sistema buscará exclusivamente **casais ativos na base geral de cadastros**.
   - *Nota:* Pessoas que já possuem inscrição ativa como participantes neste mesmo evento **não** podem ser selecionadas como coordenadoras.
6. Clique em **`Criar Círculo`** para salvar.

---

### ✏️ Editar ou Excluir um Círculo:
- **Editar**: No cartão do círculo desejado, clique no ícone de lápis **`Editar`** para alterar o nome, a cor ou a dupla de coordenadores.
- **Excluir**: Clique no ícone de lixeira **`Excluir`** e confirme. *Importante:* A exclusão do círculo remove automaticamente o vínculo dos membros com aquele grupo, mas mantém as inscrições dos participantes intactas no evento.

---

## ↔️ 3. Alocação Dinâmica de Membros (Interface Dual-List)

A alocação de participantes nos círculos é realizada por meio de uma interface inteligente de transferência dupla (**Dual-List / Transfer List**).

---

### 🔄 Como Gerenciar os Membros de um Círculo:
1. No cartão do círculo desejado, clique no botão **`👥 Membros`**.
2. O modal de alocação será exibido em tela cheia com duas listas paralelas:
   - 👈 **Painel da Esquerda (Participantes Sem Círculo)**: Exibe todos os inscritos no evento que ainda não foram vinculados a **nenhum** círculo.
   - 👉 **Painel da Direita (Membros no Círculo)**: Exibe os participantes atualmente pertencentes a **este** círculo.

---

### ⬆️⬇️ Como Transferir Participantes:
- **Mover Selecionados (`Mover (X)`)**: Marque as caixas de seleção dos participantes desejados no painel da esquerda e clique no botão **`>` (Mover)**.
- **Mover Todos (`Mover Todos`)**: Clique em **`>>` (Mover Todos)** para transferir instantaneamente todos os elegíveis da lista esquerda para o círculo.
- **Remover Selecionados (`Remover (X)`)**: Marque os participantes na lista da direita e clique em **`<` (Remover)** para devolvê-los à lista de disponíveis.
- **Remover Todos (`Remover Todos`)**: Clique em **`<<` (Remover Todos)** para esvaziar a lista do círculo.

---

### 🔍 Filtros de Busca Rápidos:
Cada painel possui seu próprio campo de busca independente:
- Digite o **nome do participante** ou a **paróquia** no topo da lista para filtrar instantaneamente.
- Utilize o link **Marcar/Desmarcar Todos** para selecionar em lote os participantes filtrados.

---

### 💾 Salvar a Alocação:
Ao finalizar a movimentação dos participantes, clique no botão **`Salvar Alocação (X)`** no canto inferior direito para gravar todas as alterações no banco de dados.

---

## 📄 4. Emissão de Relatório de Círculos (PDF & Excel)

Para imprimir ou exportar a relação dos círculos com seus coordenadores e membros:

1. No menu lateral, acesse **Relatórios & Fichas** (`/admin/relatorios`).
2. Selecione o evento desejado no menu suspenso.
3. Clique no card **`Círculos por Evento`** (cor lilás/roxa).
4. O sistema exibirá a tela de **Pré-visualização Interativa**:
   - 📄 **Baixar PDF**: Gera o documento oficial formatado para impressão em A4, com banners coloridos para cada círculo, dados de contato e paróquias.
   - 📊 **Baixar XLS**: Baixa a planilha Excel (`.xlsx`) com os dados estruturados da coordenação e integrantes.

---

## 🔒 5. Regras de Negócio Importantes

1. **Pertencimento Único por Evento**: Cada participante inscrito pode pertencer a no máximo **1 único círculo** por evento.
2. **Elegibilidade de Coordenação**: Coordenadores de círculo devem obrigatoriamente ser **casais ativos na base global de cadastros** e não podem constar como participantes do próprio evento.
3. **Preservação de Dados**: Adicionar ou remover membros dos círculos altera apenas o agrupamento do encontro, sem modificar a ficha de inscrição original ou o status financeiro do participante.
