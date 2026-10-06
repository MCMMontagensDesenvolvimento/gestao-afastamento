# ADRs — MCM Gestão de Afastados

**Data:** 05/10/2026  
**Status:** Aprovados para orientar os próximos documentos técnicos.

---

## ADR-001 — Monólito modular com frontend e backend separados

**Status:** Aprovada

### Contexto

A aplicação possui um domínio corporativo de tamanho controlado, CRUDs, autenticação, documentos, alertas e dashboard. Não existe necessidade atual de escalabilidade independente por domínio.

### Decisão

Usar:

```text
frontend React/Vite
→ REST API
→ backend Node/Express modular
→ PostgreSQL
```

Um único backend de aplicação será modularizado por domínio.

### Consequências positivas

- menor complexidade operacional;
- handoff mais simples;
- transações locais;
- teste e deploy mais fáceis;
- fronteiras internas continuam claras.

### Trade-offs

- os módulos compartilham processo/deploy;
- uma futura necessidade real de escala independente pode exigir extração.

---

## ADR-002 — SPA React/Vite mantendo TanStack Router

**Status:** Aprovada

### Contexto

A baseline já possui rotas funcionais com TanStack Router. O produto é privado e não necessita SSR para SEO.

### Decisão

Manter TanStack Router e consolidar o frontend como SPA React/Vite.

Remover a camada server-side herdada do frontend quando não houver mais função após a criação do backend Express.

### Consequências positivas

- reduz superfície de runtime;
- simplifica Docker frontend;
- evita migração desnecessária de rotas;
- mantém UX validada.

### Trade-offs

- funcionalidades específicas de SSR/server functions não poderão ser pressupostas.

---

## ADR-003 — Microsoft Entra ID com sessão local server-side

**Status:** Aprovada

### Contexto

O sistema deve aceitar apenas identidades Microsoft corporativas elegíveis e ainda aplicar autorização local.

### Decisão

- OpenID Connect/OAuth 2.0 Authorization Code no backend;
- validar tenant configurado;
- permitir e-mails dos domínios corporativos definidos;
- exigir usuário local ativo;
- sessão de aplicação persistida em PostgreSQL;
- cookie HttpOnly com identificador opaco;
- não guardar token de sessão da aplicação em localStorage.

### Consequências positivas

- logout/revogação central;
- menor exposição de tokens no navegador;
- domínio Microsoft separado de autorização;
- não exige Redis inicialmente.

### Trade-offs

- consulta de sessão ao banco;
- exige limpeza periódica de sessões expiradas.

---

## ADR-004 — PostgreSQL + Prisma

**Status:** Aprovada

### Contexto

A aplicação é relacional e possui entidades, relacionamentos, filtros, histórico e requisitos de integridade.

### Decisão

PostgreSQL como banco principal e Prisma como ORM/migrations.

### Consequências positivas

- integridade relacional;
- migrations versionadas;
- tipagem;
- facilidade de manutenção;
- boa adequação aos filtros e relações do domínio.

### Trade-offs

- equipe deve manter disciplina de migrations;
- alterações destrutivas exigem processo controlado.

---

## ADR-005 — Storage de documentos por adapter

**Status:** Aprovada

### Contexto

Documentos são privados e podem conter dados sensíveis. O provider de produção ainda não foi definido.

### Decisão

Criar abstração de storage:

```text
DocumentStorage
├── LocalStorageAdapter
└── S3StorageAdapter
```

Desenvolvimento usa volume local privado.

Produção prefere object storage S3-compatible privado; provider específico permanece pendente.

### Consequências positivas

- evita lock-in;
- permite desenvolvimento local simples;
- mantém credenciais fora do frontend;
- facilita troca de provider.

### Trade-offs

- exige testar os dois adapters;
- operação de exclusão precisa tratar banco e storage de forma compensatória.

---

## ADR-006 — Single-tenant e sem Redis/fila/worker na base inicial

**Status:** Aprovada

### Contexto

O produto atende uma operação corporativa única. Não existem tarefas assíncronas pesadas, e-mail ou volume que justifique infraestrutura adicional.

### Decisão

- single-tenant;
- sem `tenant_id`;
- sem Redis;
- sem fila;
- sem worker.

Sessões ficam no PostgreSQL e alertas são calculados pelo backend.

### Consequências positivas

- menor custo;
- menos serviços;
- deploy mais simples;
- menor carga operacional.

### Trade-offs

- futuras integrações ou notificações assíncronas podem exigir revisão.
