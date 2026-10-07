# MCM Gestão de Afastados

Sistema interno para acompanhar afastamentos de colaboradores, histórico,
documentos, prazos e indicadores. A entrega é uma base full stack para continuidade
pela Milena; o uso autenticado depende da configuração Microsoft da MCM.

## Arquitetura e stack

```text
React / Vite → API REST /api/v1 → Node.js / Express → PostgreSQL
                                      └─────────→ storage privado
```

Frontend TypeScript com TanStack Router, TanStack Query, Tailwind/Radix e Recharts.
Backend TypeScript com Prisma, Zod, Microsoft Entra ID, sessão HttpOnly e RBAC.
Docker Compose executa os serviços; a imagem frontend de produção serve a SPA por
Nginx. Banco e arquivos são acessados exclusivamente pelo backend.

```text
frontend/                  SPA, componentes, hooks e services
backend/src/               API e módulos de negócio
backend/prisma/            schema, migrations e seed
backend/openapi/           contrato HTTP
docs/                      produto, arquitetura, decisões, runbooks e handoff
```

## Início rápido

Requisitos: Git, Docker com Compose e OpenSSL para gerar o segredo local. Para
executar ferramentas fora dos containers, use Node.js 24 LTS (mínimo 22.12) e
npm 10 ou superior.

Após clonar o repositório e entrar em `gestao-afastados`:

```bash
git switch arquitetura/base-integrada
cp .env.example .env
openssl rand -hex 32
```

Copie o valor gerado para `SESSION_SECRET` no `.env` da raiz. Para o Compose local,
esse é o arquivo de configuração; os `.env` das camadas são usados na execução
nativa. Deixe Microsoft em branco enquanto a MCM não fornecer os valores reais.

```bash
docker compose -f docker-compose.dev.yml config --quiet
docker compose -f docker-compose.dev.yml up -d --build
docker compose -f docker-compose.dev.yml exec backend npm run prisma:migrate:deploy
docker compose -f docker-compose.dev.yml exec backend npm run prisma:seed
docker compose -f docker-compose.dev.yml ps
curl -f http://localhost:3000/health
curl -f http://localhost:3000/health/db
curl -f http://localhost:5173/health.html
```

Abra [o login local](http://localhost:5173/login). A seed cria permissões e o papel
ADMIN; usuário inicial somente com `BOOTSTRAP_ADMIN_EMAIL` real e autorizado.
Ela não popula catálogos ou dados de demonstração. Microsoft não configurada
retorna 503 amigável; não há login alternativo. Banco e documentos persistem em
volumes — não use `down -v` para atualizar a aplicação.

## Continuidade e documentação

- [Handoff para Milena](docs/handoff/HANDOFF_MILENA.md): módulos, fluxos e onboarding.
- [Pendências classificadas](docs/handoff/PENDENCIAS_HANDOFF.md): o que depende da MCM e o que pode evoluir depois.
- [Setup local](docs/runbooks/setup-local.md): envs, execução nativa, validação e problemas conhecidos.
- [Contrato OpenAPI](backend/openapi/openapi.yaml) e [ADRs](docs/arquitetura/ADRS_ARQUITETURA_MCM_GESTAO_AFASTADOS.md).
- [Frontend](docs/produto/09_FRONTEND_MCM_GESTAO_AFASTADOS.md), [backend](docs/arquitetura/08_BACKEND_MCM_GESTAO_AFASTADOS_SEM_TESTES.md) e [decisões](docs/decisions/decision-log.md).

App Registration, matriz operacional SMS, infraestrutura pública, armazenamento
de produção e retenção precisam de definições da MCM. O adapter implementado é
somente local; duração no dashboard aguarda regra validada. Essas limitações estão
separadas das instruções de desenvolvimento no handoff. Resultados da verificação
técnica desta entrega são registrados no runbook.
