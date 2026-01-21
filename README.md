# 🚀 CRM Moderno - Manual de Replicação

> **Objetivo:** Permitir que qualquer desenvolvedor replique este projeto do zero para um novo cliente em 5 minutos.

---

## 📦 Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Framework** | Next.js 16 (App Router, React 19) |
| **Banco de Dados** | PostgreSQL (Neon Serverless) |
| **ORM** | Drizzle ORM |
| **Autenticação** | Stack Auth (Opcional) |
| **UI** | Tailwind CSS v4 + Radix UI + shadcn/ui |
| **Charts** | Recharts |
| **Deploy** | Vercel |

---

## ⚡ Guia de Setup Rápido (5 Minutos)

### 1. Clone e Instale
```bash
git clone https://github.com/seu-usuario/crm-web.git
cd crm-web
npm install
```

### 2. Configure o Ambiente
```bash
# Crie o arquivo de variáveis de ambiente
cp .env.example .env.local
# OU crie manualmente:
touch .env.local
```

### 3. Preencha as Variáveis (veja seção abaixo)

### 4. Configure o Banco de Dados
```bash
# Aplica o schema no banco
npm run db:push
```

### 5. Execute
```bash
npm run dev
```
🎉 Acesse **http://localhost:3000**

---

## 🔐 Dicionário de Variáveis de Ambiente (.env.local)

| Variável | Obrigatória | Exemplo | Descrição |
|----------|-------------|---------|-----------|
| `DATABASE_URL` | ✅ SIM | `postgresql://user:pass@host/db?sslmode=require` | URL de conexão PostgreSQL (Neon, Supabase, etc.) |
| `NEXT_PUBLIC_STACK_PROJECT_ID` | ❌ Não | `proj_abc123` | ID do projeto no Stack Auth. Se ausente, sistema roda SEM login. |
| `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` | ❌ Não | `pk_live_xyz789` | Chave pública do Stack Auth. |

### Exemplo Completo:
```env
# Banco de Dados (OBRIGATÓRIO)
DATABASE_URL="postgresql://neondb_owner:SENHA@ep-host.neon.tech/neondb?sslmode=require"

# Autenticação (OPCIONAL - sem isso, CRM roda em modo público)
NEXT_PUBLIC_STACK_PROJECT_ID="proj_abc123"
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY="pk_live_xyz789"
```

---

## 🗄️ Banco de Dados - Script SQL

O projeto usa **Drizzle ORM** com push automático. Execute `npm run db:push` para criar as tabelas.

### Schema SQL Equivalente:
```sql
-- Tabela de Colunas do Kanban
CREATE TABLE columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  organization_id TEXT NOT NULL,
  color TEXT
);

-- Tabela de Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  whatsapp TEXT,
  campaign_source TEXT,
  status TEXT NOT NULL,
  column_id UUID REFERENCES columns(id),
  position INTEGER NOT NULL DEFAULT 0,
  organization_id TEXT NOT NULL,
  notes TEXT,
  value DECIMAL(10,2),
  follow_up_date TIMESTAMP,
  follow_up_note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela de Configurações
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL UNIQUE,
  company_name TEXT,
  email TEXT,
  view_mode TEXT DEFAULT 'kanban'
);
```

### Colunas Padrão para Inicialização:
Após criar o banco, insira as colunas iniciais do Kanban:
```sql
INSERT INTO columns (title, "order", organization_id) VALUES
  ('Novos Leads', 0, 'bilder_agency_shared'),
  ('Entrar em Contato', 1, 'bilder_agency_shared'),
  ('Não Retornou', 2, 'bilder_agency_shared'),
  ('Proposta Enviada', 3, 'bilder_agency_shared'),
  ('Fechado', 4, 'bilder_agency_shared'),
  ('Perdido', 5, 'bilder_agency_shared');
```

---

## 🔗 Integrações (Backend)

### Webhook para Captura de Leads

**Endpoint:** `POST /api/webhooks/leads`

**Payload JSON:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "whatsapp": "11999998888",
  "phone": "11999998888",      // Alternativo ao whatsapp
  "company": "Empresa LTDA",
  "notes": "Interessado no produto X",
  "campaignSource": "Google"   // Valores: Google, Meta, Captação Ativa, Organicos
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "lead": {
    "id": "uuid-do-lead",
    "name": "João Silva",
    ...
  }
}
```

**Validações:**
- `name` e `email` são obrigatórios
- Lead é inserido automaticamente na coluna "Novos Leads"
- `whatsapp` ou `phone` são aceitos (whatsapp tem prioridade)

---

## 🛠️ Troubleshooting (Solução de Problemas)

### ❌ Erro 1: "DATABASE_URL not defined"
**Causa:** Variável de ambiente não configurada.
**Solução:** Verifique se `.env.local` existe e contém `DATABASE_URL`.

### ❌ Erro 2: Hydration Mismatch / Servidor vs Cliente
**Causa:** Componente renderiza diferente no servidor e cliente.
**Solução:** Use `useState(false)` + `useEffect(() => setMounted(true), [])` para componentes que dependem do browser.

### ❌ Erro 3: Botões/Cards Não Clicáveis (z-index)
**Causa:** Outro elemento está sobrepondo.
**Solução:** Verifique se há `overflow-hidden` em containers pai ou ajuste o `z-index` do elemento afetado.

### ❌ Erro 4: Hover com Fundo Branco em Dark Mode
**Causa:** Faltam classes `dark:hover:` nos componentes.
**Solução:** Adicione `dark:hover:bg-slate-800` aos elementos com hover.

---

## 🎨 Guia de Personalização

### Cores (Tema Global)
📁 **Arquivo:** `src/app/globals.css`
```css
@layer base {
  :root {
    --background: #ffffff;      /* Fundo Light Mode */
    --foreground: #171717;      /* Texto Light Mode */
  }
  .dark {
    --background: #0a0a0a;      /* Fundo Dark Mode */
    --foreground: #ededed;      /* Texto Dark Mode */
  }
}
```

### Cores Primárias (Indigo → Outra)
Busque por `indigo` nos arquivos e substitua:
- `bg-indigo-600` → `bg-blue-600`
- `text-indigo-400` → `text-blue-400`

📁 **Principais arquivos:**
- `src/components/features/crm/crm-view.tsx`
- `src/components/features/kanban/*`

### Fontes
📁 **Arquivo:** `src/app/layout.tsx`
```tsx
import { Inter } from "next/font/google";
const font = Inter({ subsets: ["latin"] });
// Troque "Inter" por "Roboto", "Poppins", etc.
```

### Textos/Labels
- **Dashboard Title:** `src/components/features/crm/crm-view.tsx` (linha ~200)
- **Colunas Kanban:** Diretamente no banco de dados (tabela `columns`)
- **KPI Cards:** `src/components/features/crm/crm-view.tsx` (procure por `StatsCard`)

### Logo/Ícone
📁 **Arquivos:**
- `src/app/favicon.ico`
- Sidebar: `src/components/layout/sidebar.tsx`

---

## ✅ Checklist de Replicação para Novo Cliente

```markdown
### Preparação
- [ ] Criar novo repositório Git
- [ ] Configurar projeto no Vercel
- [ ] Criar banco PostgreSQL (Neon/Supabase)

### Configuração
- [ ] Adicionar `DATABASE_URL` nas variáveis do Vercel
- [ ] (Opcional) Configurar Stack Auth e adicionar chaves
- [ ] Executar `npm run db:push` para criar tabelas
- [ ] Inserir colunas padrão do Kanban (SQL acima)

### Personalização
- [ ] Trocar cores primárias (se necessário)
- [ ] Trocar fontes (se necessário)  
- [ ] Atualizar favicon
- [ ] Configurar nome da empresa em Settings

### Integrações
- [ ] Configurar webhook no sistema de captura (ActiveCampaign, Elementor, etc.)
- [ ] Testar envio de lead via Postman/Insomnia
- [ ] Verificar se lead aparece na coluna "Novos Leads"

### Deploy Final
- [ ] Fazer push para main
- [ ] Verificar deploy no Vercel
- [ ] Testar em produção
```

---

## 📂 Estrutura de Pastas (Principais)

```
src/
├── app/                          # Rotas Next.js (App Router)
│   ├── (dashboard)/              # Área logada
│   │   ├── crm/                  # Dashboard principal
│   │   │   ├── analytics/        # Página de Analytics
│   │   │   └── calendar/         # Página de Calendário
│   │   └── settings/             # Configurações
│   ├── api/webhooks/leads/       # Webhook de captura
│   └── login/                    # Página de login
├── components/
│   ├── features/
│   │   ├── crm/                  # Componentes do CRM
│   │   └── kanban/               # Board Kanban
│   ├── layout/                   # Sidebar, Header
│   └── ui/                       # Componentes base (shadcn)
├── lib/                          # Utilitários
└── server/
    ├── actions/                  # Server Actions
    └── db/schema.ts              # Schema do Banco
```

---

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.

---

*Documentação gerada automaticamente - CRM v2.2*
