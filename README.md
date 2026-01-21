# 🚀 CRM Moderno - Documentação Completa do Projeto

> **Objetivo:** Documentação técnica exaustiva para replicação e manutenção do sistema.

---

## 📦 Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| **Framework** | Next.js (App Router) | 16.x |
| **React** | React | 19.x |
| **Banco de Dados** | PostgreSQL (Neon Serverless) | - |
| **ORM** | Drizzle ORM | 0.44.x |
| **Autenticação** | Stack Auth | 2.8.x |
| **UI Framework** | Tailwind CSS | 4.x |
| **Componentes** | Radix UI + shadcn/ui | - |
| **Charts** | Recharts | 3.6.x |
| **Tabelas** | TanStack Table | 8.21.x |
| **Drag & Drop** | dnd-kit | 6.3.x |
| **Temas** | next-themes | 0.4.x |
| **Deploy** | Vercel | - |

---

# 🖥️ FRONTEND - Componentes por Página

---

## Página 1: Dashboard CRM (`/crm`)

### Arquivos Envolvidos
| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/app/(dashboard)/crm/page.tsx` | Page (Server) | Carrega dados e renderiza CrmView |
| `src/components/features/crm/crm-view.tsx` | Component (Client) | Orquestra todo o Dashboard |
| `src/components/features/crm/date-range-picker.tsx` | Component (Client) | Seletor de período com presets |

### Elementos da Interface

#### Header
| Elemento | Descrição | Arquivo |
|----------|-----------|---------|
| **Logo/Nome Empresa** | Exibe `companyName` das settings | `crm-view.tsx` |
| **Barra de Pesquisa** | Filtra leads em tempo real | `crm-view.tsx` |
| **Toggle Kanban/Lista** | Alterna entre vistas | `crm-view.tsx` |
| **Seletor de Período** | Dropdown + Calendário | `date-range-picker.tsx` |

#### KPI Cards (4 Cards Estatísticos)
| Card | Fonte de Dados | Lógica de Cálculo | Ícone |
|------|----------------|-------------------|-------|
| **Total de Leads** | `leads.length` | Contagem total de leads carregados (filtrados) | Users (Slate) |
| **Novos Leads** | Coluna Index 0 | Leads na coluna com ordem 0 ou nome "Novos" | AlertCircle (Blue) |
| **Potencial (Pipeline)** | Colunas "Proposta" | Soma do `value` de leads com status "Proposta" ou "Enviada" | TrendingUp (Amber) |
| **Ganhos (Receita)** | Coluna "Ganho" | Soma do `value` de leads na coluna "Fechado/Ganho" | Wallet (Emerald) |
*Nota: Alguns cards possuem indicadores de tendência (ex: "+12% vs mês anterior") que atualmente são estáticos para fins visuais.*

---

## Vista Kanban

### Arquivos Envolvidos
| Arquivo | Descrição |
|---------|-----------|
| `src/components/kanban-board.tsx` | Board principal com DnD |
| `src/components/features/kanban/board.tsx` | Lógica de drag & drop |
| `src/components/features/kanban/column.tsx` | Coluna do Kanban |
| `src/components/features/kanban/lead-card.tsx` | Card de cada lead |

### Funcionalidades

#### Board (`board.tsx`)
| Funcionalidade | Descrição |
|----------------|-----------|
| **Drag & Drop de Cards** | Move leads entre colunas |
| **Drag & Drop de Colunas** | Reordena colunas |
| **Adicionar Coluna** | Botão "+" cria nova coluna |
| **Contador por Coluna** | Badge com quantidade de leads |

#### Column (`column.tsx`)
| Funcionalidade | Descrição |
|----------------|-----------|
| **Renomear** | Clique duplo ou menu → input inline |
| **Excluir** | Menu dropdown → Move leads para coluna anterior |
| **Contador** | Badge no header |
| **Área de Drop** | SortableContext para cards |

#### Lead Card (`lead-card.tsx`)

**Layout Visual:**
1.  **Cabeçalho:**
    *   **Origem:** Badge clicável (Google, Meta, etc). Clique abre popover para troca rápida.
    *   **WhatsApp:** Ícone verde ativo se houver número. Tooltip "Conversar no WhatsApp".
    *   **Valor:** Badge verde com valor monetário (se > 0).
    *   **Editar:** Ícone lápis (aparece apenas no hover do card).
2.  **Corpo:**
    *   **Nome:** Texto em negrito.
    *   **Nota:** Última observação (truncada em 2 linhas).
3.  **Rodapé:**
    *   **Avatar:** Gerado via Vercel Avatars com iniciais.
    *   **Follow-up:** Badge condicional:
        *   🔴 Vermelho: Atrasado (`date < hoje`)
        *   🟡 Âmbar: Hoje (`date == hoje`)
        *   🔵 Azul: Futuro (`date > hoje`)
    *   **Data Criação:** Ícone calendário + data curta (ex: "20 jan").

**Interações:**
*   **Drag:** Rotaciona levemente (2 graus) e fica semitransparente ao arrastar.
*   **Clique:** Abre o modal de edição completo.
*   **Botão WhatsApp:** Abre link `wa.me` em nova aba (previne abertura do modal).

---

## Vista Lista

### Arquivo
`src/components/features/crm/leads-list.tsx`

### Colunas da Tabela
| Coluna | Campo | Estilo | Descrição |
|--------|-------|--------|-----------|
| **Lead** | name + email | Bold + cinza abaixo | Nome principal e email secundário |
| **Empresa** | company | Medium | Nome da empresa |
| **Status** | columnId → column.title | Badge pastel | Cor varia: Ganho=verde, Perdido=cinza, Novo=blue |
| **Origem** | campaignSource | Badge colorido | Google=rose, Meta=sky, Captação=amber, Orgânicos=emerald |
| **Contato** | whatsapp | Ícone | Botão WhatsApp (aparece no hover) |
| **Próximo Passo** | followUpDate | Badge com dot | Vermelho=atrasado, Âmbar=hoje, Cinza=futuro |
| **Valor** | value | Monospace, direita | R$ formatado |

### Recursos
| Recurso | Biblioteca | Descrição |
|---------|------------|-----------|
| **Ordenação** | TanStack Table | Clique no header |
| **Filtro Global** | TanStack Table | Pesquisa por texto |
| **Paginação** | TanStack Table | Automática |
| **Hover Effect** | Tailwind | Linha destaca |
| **Clique para Editar** | useState | Abre EditLeadDialog |
| **Total no Rodapé** | Manual | Soma dos valores |

---

## Modal de Edição de Lead

### Arquivo
`src/components/features/kanban/edit-lead-dialog.tsx`

### Campos do Formulário (`EditLeadDialog`)

O formulário é dividido em seções grid para melhor usabilidade:

1.  **Dados Pessoais:**
    *   **Nome:** (Obrigatório) Input texto.
    *   **WhatsApp:** (Obrigatório) Input telefone c/ máscara visual.
2.  **Contato & Empresa:**
    *   **Email:** Input email.
    *   **Empresa:** Input texto.
3.  **Negócio:**
    *   **Valor (R$):** Input number (step 0.01).
    *   **Origem:** Select (Google, Meta, Captação, Orgânicos).
4.  **Agendamento (Destaque Azul):**
    *   **Data do Retorno:** Date Picker nativo.
    *   **Motivo:** Input texto para explicar o follow-up.
5.  **Detalhes:**
    *   **Observações:** Textarea redimensionável.

**Botão de Exclusão:**
*   Localizado no rodapé esquerdo.
*   Requer confirmação (clique duplo: "Excluir Lead" -> "Tem certeza? Sim/Não").

### Ações
| Ação | Função Backend | Descrição |
|------|----------------|-----------|
| **Salvar** | `updateLeadContent()` | Atualiza campos editáveis |
| **Excluir** | `deleteLead()` | Remove lead permanentemente |

---

## Modal de Novo Lead

### Arquivo
`src/components/features/kanban/new-lead-dialog.tsx`

### Campos
| Campo | Obrigatório |
|-------|-------------|
| Nome | ✅ Sim |
| WhatsApp | ❌ Não |
| Email | ❌ Não |
| Empresa | ❌ Não |
| Valor | ❌ Não |
| Observações | ❌ Não |

### Comportamento
- Lead é criado na **primeira coluna** ("Novos Leads")
- Posição inicial: **0** (topo da coluna)

---

## Página 2: Analytics (`/crm/analytics`)

### Arquivos
| Arquivo | Descrição |
|---------|-----------|
| `src/app/(dashboard)/crm/analytics/page.tsx` | Page (Server) |
| `src/components/features/crm/analytics-dashboard.tsx` | Dashboard completo |

### Filtros Disponíveis
| Filtro | Tipo | Opções |
|--------|------|--------|
| **Período** | DatePicker Range | Calendário livre |
| **Origem** | Select | Todas, Google, Meta, Captação, Orgânicos |
| **Estado** | Select | Todos, SP, RJ, MG... (extraído do DDD) |

### Gráficos

#### 1. Evolução de Vendas (ComposedChart)
| Série | Tipo | Cor | Dados |
|-------|------|-----|-------|
| **Leads** | Area | Indigo | Contagem por mês |
| **Receita** | Line | Emerald | Soma valores ganhos por mês |

#### 2. Performance Regional (BarChart Horizontal)
| Eixo | Dados |
|------|-------|
| Y | Estados (SP, RJ, MG...) |
| X | Quantidade de leads |

#### 3. Leads Diários (BarChart Vertical)
| Eixo | Dados |
|------|-------|
| X | Dia do mês |
| Y | Quantidade de leads |

### Dados Detalhados (KPIs e Gráficos)

#### 1. KPI Cards (Topo)
Uma visão geral métrica do desempenho no período selecionado.

| KPI | Fórmula / Lógica | Ícone/Cor |
|-----|------------------|-----------|
| **Receita Fechada** | Soma de `value` onde status é "Ganho" | 📈 Emerald |
| **Pipeline Aberto** | Soma de `value` onde status NÃO é "Ganho" nem "Perdido" | 🎯 Blue |
| **Total de Leads** | Contagem total de leads no filtro | ↗️ Indigo |
| **Taxa de Conversão** | `(Leads Ganhos / Total Leads) * 100` | 📊 Green |
| **Taxa de Perda** | `(Leads Perdidos / Total Leads) * 100` | ⚠️ Red |
| **Ciclo Médio** | Média de `(Hoje - Data Criação)` para leads ganhos | 🕒 Amber |
| **Follow-ups** | Contagem de datas futuras (`>= Hoje`) | 📅 Sky |

#### 2. Gráficos Principais

**A) Evolução de Vendas (Linha Temporal)**
*   **Tipo:** Gráfico Composto (Área + Linha).
*   **Eixo X:** Meses (ex: "Jan/24").
*   **Eixo Y (Esq):** Volume de Leads (Área Indigo).
*   **Eixo Y (Dir):** Receita em R$ (Linha Emerald).
*   **Interação:** Tooltip com valores exatos ao passar o mouse.

**B) Performance Regional (Mapa de Calor via DDD)**
*   **Tipo:** Barras Horizontais.
*   **Lógica:** Extrai o DDD do telefone (ex: "11" -> "SP").
*   **Uso:** Identificar de onde vêm os leads geograficamente.
*   **Interação:** Clique na barra filtra o dashboard inteiro por aquele estado.

**C) Leads Diários (Volume)**
*   **Tipo:** Barras Verticais.
*   **Eixo X:** Dias (ex: "20/01").
*   **Eixo Y:** Quantidade de Leads.
*   **Uso:** Identificar picos de tráfego/campanhas.

**D) Temperatura do Pipeline (Funil)**
*   **Tipo:** Barras Horizontais Coloridas.
*   **Eixo Y:** Etapas do Kanban (colunas).
*   **Eixo X:** Quantidade de leads na etapa.
*   **Interação:** **Clique na barra** filtra a lista de leads abaixo mostrando apenas quem está naquela etapa.

#### 3. Insights Inteligentes (IA Simulado)
Analisa o texto do campo `notes` (observações) para gerar métricas de qualidade.

*   **Sentimento:** Busca palavras-chave como "interessado", "fechou" (Positivo) ou "cancelou", "perdido" (Negativo).
*   **Ações:** Classifica leads por intenção (ex: "Agendou", "Pediu Proposta") baseado em keywords.
*   **Qualidade:** Mostra % de leads com telefone, com email, e com valor preenchido.
*   **Prévia:** Exibe os 3 últimos comentários registrados para contexto rápido.

---

## Página 3: Calendário (`/crm/calendar`)

### Arquivos
| Arquivo | Descrição |
|---------|-----------|
| `src/app/(dashboard)/crm/calendar/page.tsx` | Page (Server) |
| `src/components/features/crm/calendar-header.tsx` | Navegação de datas |

### Elementos

#### Grid Mensal
| Elemento | Descrição |
|----------|-----------|
| **Células** | Um quadrado por dia |
| **Lead Badges** | Cards com leads criados naquele dia |
| **Cor do Dia** | Destaque para hoje |

#### Lista de Follow-ups
| Seção | Cor | Filtro |
|-------|-----|--------|
| **Atrasados** | Vermelho | `followUpDate < hoje` |
| **Hoje** | Amarelo | `followUpDate == hoje` |
| **Próximos** | Azul | `followUpDate > hoje` |

#### Navegação
| Elemento | Descrição |
|----------|-----------|
| **Seletor de Período** | Dropdown: Hoje, 7 dias, 30 dias... |
| **Setas Mês** | Navega mês anterior/próximo |
| **Picker de Data** | Popover com calendário |
| **Botão Hoje** | Volta para o mês atual |

---

## Página 4: Configurações (`/settings`)

### Arquivo
`src/app/(dashboard)/settings/page.tsx`

### Configurações Disponíveis
| Configuração | Tipo | Persistência | Descrição |
|--------------|------|--------------|-----------|
| **Nome da Empresa** | Input | Banco (settings.companyName) | Aparece no header |
| **Tema** | Toggle 3 opções | LocalStorage (next-themes) | Claro / Escuro / Auto |
| **URL Webhook** | Texto + Copiar | - | Endpoint para integrações |
| **Vista Padrão** | Toggle | Banco (settings.viewMode) | Kanban ou Lista |

---

# ⚙️ BACKEND - Server Actions

---

## Arquivo: `src/server/actions/leads.ts`

### Funções de Leads

| Função | Parâmetros | Retorno | Descrição |
|--------|------------|---------|-----------|
| `getLeads()` | - | `Lead[]` | Busca todos os leads (todos os orgs em modo single-tenant) |
| `createLead(formData)` | FormData | void | Cria lead na primeira coluna |
| `updateLeadStatus(id, columnId, position)` | string, string, number | void | Move lead (drag & drop) |
| `updateLeadContent(id, data)` | string, Partial<Lead> | void | Atualiza campos editáveis |
| `deleteLead(id)` | string | void | Remove lead permanentemente |

### Funções de Colunas

| Função | Parâmetros | Retorno | Descrição |
|--------|------------|---------|-----------|
| `getColumns()` | - | `Column[]` | Busca todas as colunas (cria padrão se vazio) |
| `createColumn(title)` | string | void | Adiciona nova coluna no final |
| `updateColumn(id, title)` | string, string | void | Renomeia coluna |
| `updateColumnOrder(orderedIds)` | string[] | void | Reordena colunas |
| `deleteColumn(id)` | string | void | Remove coluna (move leads) |

### Campos Editáveis (Whitelist)
```typescript
const allowedFields = [
  'name',           // Nome do lead
  'company',        // Empresa
  'email',          // Email
  'whatsapp',       // Telefone
  'notes',          // Observações
  'value',          // Valor R$
  'campaignSource', // Origem
  'followUpDate',   // Data follow-up
  'followUpNote'    // Nota follow-up
];
```

---

## Arquivo: `src/server/actions/settings.ts`

| Função | Parâmetros | Retorno | Descrição |
|--------|------------|---------|-----------|
| `getSettings()` | - | `Settings` | Busca configurações (cria se não existe) |
| `updateCompanyName(name)` | string | void | Atualiza nome da empresa |
| `updateViewMode(viewMode)` | string | void | Salva preferência Kanban/Lista |

---

## API Routes

### Webhook de Leads
| Endpoint | Método | Arquivo |
|----------|--------|---------|
| `/api/webhooks/leads` | POST | `src/app/api/webhooks/leads/route.ts` |

#### Payload Aceito
```json
{
  "name": "João Silva",       // ✅ OBRIGATÓRIO
  "email": "joao@email.com",  // ❌ Opcional
  "whatsapp": "11999998888",  // ❌ Opcional
  "phone": "11999998888",     // ❌ Alternativo ao whatsapp
  "company": "Empresa LTDA",  // ❌ Opcional
  "notes": "Observações",     // ❌ Opcional
  "campaignSource": "Google"  // ❌ Opcional (Google, Meta, Captação Ativa, Organicos)
}
```

---

# 🌓 Sistema de Temas (Dark/Light Mode)

### Arquivos
| Arquivo | Função |
|---------|--------|
| `src/components/theme-provider.tsx` | Provider next-themes |
| `src/app/layout.tsx` | Monta o provider |
| `src/app/globals.css` | Variáveis CSS por tema |
| `src/app/(dashboard)/settings/page.tsx` | Toggle do usuário |

### Padrão de Classes
```tsx
// Light mode primeiro, dark: depois
<div className="bg-white dark:bg-slate-900">
  <button className="hover:bg-slate-50 dark:hover:bg-slate-800">
```

### Forçar Tema
```tsx
// theme-provider.tsx
<ThemeProvider forcedTheme="dark"> // ou "light"
```

---

# 🗄️ Banco de Dados

### Tabela: `columns`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID (PK) | ID único |
| title | TEXT | Nome da coluna |
| order | INTEGER | Posição no board |
| organization_id | TEXT | Tenant ID |
| color | TEXT | Cor (opcional) |

### Tabela: `leads`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID (PK) | ID único |
| name | TEXT | Nome do lead |
| company | TEXT | Empresa |
| email | TEXT | Email |
| whatsapp | TEXT | Telefone |
| campaign_source | TEXT | Origem |
| status | TEXT | Status textual |
| column_id | UUID (FK) | Referência à coluna |
| position | INTEGER | Posição na coluna |
| organization_id | TEXT | Tenant ID |
| notes | TEXT | Observações |
| value | DECIMAL(10,2) | Valor em R$ |
| follow_up_date | TIMESTAMP | Data do retorno |
| follow_up_note | TEXT | Nota do retorno |
| created_at | TIMESTAMP | Data de criação |

### Tabela: `settings`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID (PK) | ID único |
| organization_id | TEXT (UNIQUE) | Tenant ID |
| company_name | TEXT | Nome da empresa |
| email | TEXT | Email do usuário |
| view_mode | TEXT | 'kanban' ou 'list' |

---

# 🔧 Variáveis de Ambiente

| Variável | Obrigatória | Exemplo |
|----------|-------------|---------|
| `DATABASE_URL` | ✅ Sim | `postgresql://user:pass@host/db?sslmode=require` |
| `NEXT_PUBLIC_STACK_PROJECT_ID` | ❌ Não | `proj_abc123` |
| `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` | ❌ Não | `pk_live_xyz789` |

---

# 🛠️ Troubleshooting

| Erro | Causa | Solução |
|------|-------|---------|
| `DATABASE_URL not defined` | Env não configurado | Criar `.env.local` |
| Hydration Mismatch | Componente renderiza diferente | Usar `useEffect` para client-only |
| Botões não clicáveis | z-index ou overflow | Ajustar CSS |
| Hover branco no dark mode | Faltam classes `dark:hover:` | Adicionar classes |
| Leads não aparecem | Coluna não existe | Inserir colunas padrão no banco |

---

# ✅ Checklist de Replicação

```markdown
### Setup
- [ ] Clone do repositório
- [ ] `npm install`
- [ ] Criar `.env.local` com DATABASE_URL

### Banco
- [ ] `npm run db:push`
- [ ] Inserir colunas padrão (SQL)

### Personalização
- [ ] Cores: `globals.css` + buscar `indigo`
- [ ] Fontes: `layout.tsx`
- [ ] Favicon: `src/app/favicon.ico`

### Integrações
- [ ] Webhook configurado na plataforma de captura
- [ ] Testado com Postman

### Deploy
- [ ] Push para GitHub
- [ ] Conectar Vercel
- [ ] Adicionar env vars no Vercel
```

---

*Documentação Completa - CRM v2.3*
