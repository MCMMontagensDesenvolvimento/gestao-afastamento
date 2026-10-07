# 12 — Infraestrutura — MCM Gestão de Afastados

**Versão:** 1.1
**Data:** 06/10/2026
**Status:** Docker local implementado; ambiente corporativo de produção pendente
**Produto:** MCM Gestão de Afastados
**Branch de consolidação:** `arquitetura/base-integrada`

---

## 1. Objetivo

Definir a infraestrutura necessária para executar a MCM Gestão de Afastados de forma reproduzível em desenvolvimento, homologação e produção.

A base possui Dockerfiles, Compose, envs de exemplo e healthchecks funcionais. Este documento distingue a implementação local das decisões operacionais ainda necessárias para homologação e produção.

A infraestrutura será portável e não ficará presa a um único provedor.

---

## 2. Estado atual do repositório

A estrutura já contém:

```text
/frontend
/backend
docker-compose.dev.yml
docker-compose.prod.yml
.env.example
.gitignore
```

Também existem Dockerfiles, `.dockerignore` e `.env.example` por camada.

O Compose de desenvolvimento executa frontend Vite em 5173, backend Express em
3000 e PostgreSQL 16 em 5432, com volumes persistentes e storage privado local.
Os três serviços foram observados em estado `healthy` na auditoria local.

A produção possui imagens e configuração portáveis: frontend estático Nginx com
fallback SPA e proxy da API; backend e banco internos. Host, domínio, HTTPS,
secrets corporativos e storage definitivo continuam pendentes. Não houve deploy.

A homologação autenticada depende da App Registration Microsoft. Consulte o
[setup local](../runbooks/setup-local.md), o
[handoff](../handoff/HANDOFF_MILENA.md) e as
[pendências](../handoff/PENDENCIAS_HANDOFF.md).

---

## 3. Infrastructure Blueprint

```yaml
infrastructure_blueprint:
  project:
    slug: "gestao-afastados"
    timezone: "America/Recife"

  repository:
    frontend: "./frontend"
    backend: "./backend"
    compose_dev: "./docker-compose.dev.yml"
    compose_prod: "./docker-compose.prod.yml"
    root_env_example: "./.env.example"
    root_gitignore: "./.gitignore"

  compose:
    project_name: "gestao-afastados"
    container_name: false
    env_file_default: true
    inline_environment: "somente overrides pontuais"

  required_services:
    frontend:
      local_port: 5173
      public_in_production: true
    backend:
      local_port: 3000
      public_in_production: false
    db:
      local_port: 5432
      public_in_production: false
      image_family: "PostgreSQL 16"

  initial_optional_services:
    redis: false
    worker: false
    mail: false
    n8n: false
    local_storage_service: false

  storage:
    development: "volume privado montado no backend"
    production: "S3-compatible privado preferencial"
    production_provider: "PENDENTE"

  networking:
    internal_database_host: "db"
    fixed_ips: false
    one_project_network: true

  healthchecks:
    frontend: "/health.html"
    backend: "/health"
    backend_database: "/health/db"
    database: "pg_isready"

  environments:
    local: true
    homologation: true
    production: true

  production:
    orchestrator: "PENDENTE"
    reverse_proxy: "PENDENTE"
    ssl: "obrigatório"
    secrets_manager: "ambiente/orquestrador"
    database_public_port: false

  backups:
    database:
      frequency: "diário"
      minimum_retention_days: 14
      before_critical_migration: true
    storage:
      required: true
    restore_test:
      before_go_live: true
      periodicity: "trimestral recomendado"

  observability:
    container_logs: true
    backend_json_logs: true
    request_id: true

  migration:
    development: "npx prisma migrate dev"
    production: "npx prisma migrate deploy"
    automatic_destructive_migration: false
```

---

## 4. Serviços

### 4.1 Frontend

**Tipo:** aplicação web SPA.

Desenvolvimento:

```text
Node.js
npm
Vite
porta 5173
host 0.0.0.0
strictPort true
hot reload
```

Produção:

```text
build estático
servidor web enxuto
fallback de SPA para index.html
health estático
```

Não expõe secrets.

### 4.2 Backend

**Tipo:** API.

Desenvolvimento:

```text
Node.js LTS
TypeScript
tsx watch
porta 3000
```

Produção:

```text
build TypeScript
node dist/server.js
```

Responsável por:

- API;
- OIDC Microsoft;
- sessão;
- RBAC;
- Prisma;
- storage;
- logs;
- auditoria.

### 4.3 Banco

**Serviço:** `db`.

Base:

```text
PostgreSQL 16
```

Desenvolvimento:

- porta 5432 publicada para ferramenta local quando necessário;
- volume persistente.

Produção:

- sem porta pública;
- acesso somente pela rede da aplicação;
- backup obrigatório.

---

## 5. Nomes e Docker Compose

### Regra

Não usar `container_name`.

Usar:

```env
COMPOSE_PROJECT_NAME=gestao-afastados
TZ=America/Recife
```

Nomes esperados:

```text
gestao-afastados-frontend-1
gestao-afastados-backend-1
gestao-afastados-db-1
```

DNS interno:

```text
frontend
backend
db
```

---

## 6. Docker Compose de desenvolvimento

Serviços previstos:

```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    env_file:
      - ./frontend/.env
    ports:
      - "5173:5173"
    depends_on:
      backend:
        condition: service_healthy

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    env_file:
      - ./backend/.env
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    env_file:
      - ./backend/.env
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data
```

O `docker-compose.dev.yml` implementado inclui:

- volumes de source/hot reload quando adequados;
- healthchecks;
- rede;
- volume local de documentos do backend;
- restart quando pertinente.

---

## 7. Docker Compose de produção

Serviços mínimos:

```text
frontend
backend
db
```

Regras:

- frontend em build de produção;
- backend em build de produção;
- PostgreSQL persistente;
- banco sem porta pública;
- tráfego externo via proxy/reverse proxy;
- HTTPS;
- healthchecks;
- restart policy;
- secrets fora do arquivo;
- migrations controladas.

Se storage for externo S3-compatible, não é criado container de storage.

---

## 8. Dockerfiles

### 8.1 Frontend dev

Responsabilidades:

- instalar com `npm ci`;
- executar Vite;
- porta 5173;
- host 0.0.0.0.

### 8.2 Frontend prod

Multi-stage:

```text
stage build: Node.js
→ npm ci
→ npm run build

stage runtime: Nginx estático
→ copiar dist
→ configurar fallback SPA
→ servir /health.html
```

### 8.3 Backend dev

- Node.js LTS;
- `npm ci`;
- Prisma generate;
- `tsx watch src/server.ts`;
- porta 3000.

### 8.4 Backend prod

Multi-stage quando conveniente:

- instalar dependências;
- Prisma generate;
- compilar TypeScript;
- runtime com somente dependências necessárias;
- iniciar `node dist/server.js`.

Migrations não devem rodar implicitamente a cada inicialização do container.

---

## 9. `.gitignore` raiz

O `.gitignore` raiz está implementado e protege envs, dependências, builds, caches, logs, uploads, dumps e backups. O bloco abaixo resume a política; o arquivo versionado é a referência efetiva:

```gitignore
# Environment
.env
.env.*
!*.env.example
!**/*.env.example

# Dependencies
node_modules/
frontend/node_modules/
backend/node_modules/

# Builds
frontend/dist/
backend/dist/
dist/
build/

# Tests
coverage/

# Logs
logs/
*.log

# Tool caches
.vite/
.cache/
.tmp/

# OS/editor
.DS_Store
Thumbs.db

# Runtime storage
backend/storage/*
!backend/storage/.gitkeep
```

---

## 10. `.dockerignore`

Em `/frontend` e `/backend`.

Mínimo:

```text
node_modules
dist
build
coverage
.env
.env.*
.git
*.log
logs
.cache
.tmp
.DS_Store
```

No backend, storage local também deve ser excluído do contexto de build.

---

## 11. Package manager

### Decisão

npm em frontend e backend.

Após higienização:

```text
frontend/package-lock.json
backend/package-lock.json
```

Remover lockfiles de outros gerenciadores.

Usar:

```bash
npm ci
```

em builds reproduzíveis.

---

## 12. Variáveis raiz

`.env.example`:

```env
COMPOSE_PROJECT_NAME=gestao-afastados
TZ=America/Recife
```

O `.env` real não é versionado.

---

## 13. Variáveis frontend

`frontend/.env.example` implementado:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=MCM Gestão de Afastados
```

Não colocar:

- secret Microsoft;
- connection string;
- chave de storage;
- session secret;
- credencial administrativa.

---

## 14. Variáveis backend

Exemplo de responsabilidades das variáveis backend (para copiar, use o [`backend/.env.example`](../../backend/.env.example) versionado):

```env
NODE_ENV=development
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173
LOG_LEVEL=debug

POSTGRES_DB=gestao_afastados
POSTGRES_USER=gestao_afastados
POSTGRES_PASSWORD=
DATABASE_URL=postgresql://gestao_afastados:senha@db:5432/gestao_afastados

SESSION_COOKIE_NAME=mcm_afastados_session
SESSION_SECRET=
SESSION_TTL_SECONDS=28800
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax

MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_IDS=
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/v1/auth/callback
MICROSOFT_ALLOWED_EMAIL_DOMAINS=mcm.eng.br,mcmmontagens.com.br

BOOTSTRAP_ADMIN_EMAIL=

STORAGE_DRIVER=local
LOCAL_STORAGE_PATH=/app/storage
S3_ENDPOINT=
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_FORCE_PATH_STYLE=false

MAX_UPLOAD_BYTES=10485760
```

A lista efetiva e os valores locais estão no arquivo versionado e no [setup local](../runbooks/setup-local.md). Dentro do Compose, o host PostgreSQL é `db`; fora dele, use a conexão local documentada.

---

## 15. Healthchecks

### Frontend

```text
GET /health.html
200 OK
```

Arquivo estático, sem autenticação e sem informação sensível.

### Backend — liveness

```text
GET /health
```

Exemplo:

```json
{
  "status": "ok",
  "service": "gestao-afastados-backend"
}
```

### Backend — database readiness

```text
GET /health/db
```

Valida conexão simples com o PostgreSQL.

### Banco

```text
pg_isready
```

Não criar healthcheck que dependa da Microsoft estar online para considerar o backend saudável.

---

## 16. Rede

Uma rede de aplicação por projeto.

Regras:

- comunicação backend → DB pelo hostname `db`;
- não usar IP fixo;
- frontend consome URL configurada por ambiente;
- banco sem exposição pública em produção;
- storage externo por TLS;
- callbacks Microsoft apenas por HTTPS fora do local.

---

## 17. Volumes

### Desenvolvimento

```text
db_data
uploads_data
```

`db_data` é obrigatório.

`uploads_data` é usado apenas pelo driver local.

### Produção

- DB persistente;
- a configuração atual mantém `uploads_data` para o driver local; adequar volumes quando um adapter S3 real for aprovado e implementado;
- se storage local for aprovado, volume persistente separado e incluído em backup.

Nunca armazenar documentos dentro da imagem do container.

---

## 18. Storage

### Desenvolvimento

```text
STORAGE_DRIVER=local
```

Arquivos ficam em volume privado do backend.

### Produção

Direção preferida:

```text
STORAGE_DRIVER=s3
```

Requisitos:

- bucket privado;
- TLS;
- encryption at rest do provider;
- credenciais somente no backend;
- backup/versionamento conforme provider e política aprovada.

O provider e o adapter S3 reais continuam pendentes. Hoje, `STORAGE_DRIVER=s3` interrompe a inicialização com `S3_STORAGE_NOT_CONFIGURED`; não é um modo operacional disponível. O único adapter implementado é o local privado.

---

## 19. Ambientes

### 19.1 Local

Objetivo:

- desenvolvimento;
- testes;
- migrations;
- seed;
- storage local.

URLs:

```text
frontend: http://localhost:5173
backend:  http://localhost:3000
api:      http://localhost:3000/api/v1
```

### 19.2 Homologação

Objetivo:

- autenticação Microsoft real;
- validação de RBAC;
- smoke tests;
- CRUD;
- documentos;
- validação com usuários responsáveis.

Deve possuir:

- banco separado;
- storage separado;
- credenciais próprias;
- callback Microsoft próprio;
- URL própria.

### 19.3 Produção

Deve possuir:

- HTTPS;
- banco privado;
- secrets seguros;
- storage privado;
- backup;
- logs;
- healthchecks;
- rollback;
- migrations controladas.

---

## 20. Provider de deploy

Não há evidência suficiente para fixar o provider de infraestrutura da MCM nesta fase.

### Decisão

Artefatos devem funcionar com:

- Docker Compose padrão;
- reverse proxy gerenciado;
- plataformas compatíveis com Docker/Git.

Se a MCM disponibilizar Coolify/Traefik, a estrutura é compatível.

Se utilizar outro ambiente, a aplicação não deve precisar ser reescrita.

### Pendente

- host;
- acesso;
- DNS;
- proxy;
- estratégia de secrets;
- política de firewall;
- política de backup da infraestrutura.

---

## 21. Domínios

Ainda pendentes:

```text
URL de homologação
URL de produção
URL da API de homologação
URL da API de produção
```

Os domínios influenciam:

- CORS;
- cookies;
- callbacks Microsoft;
- SSL;
- redirects;
- configuração de proxy.

Não inventar os valores antes da definição da MCM.

---

## 22. Microsoft Entra ID

Infraestrutura necessária:

- App Registration;
- Client ID;
- tenant ID(s);
- credential server-side;
- redirect URI por ambiente;
- logout/post-logout URI quando necessário;
- configuração segura das secrets.

Secrets nunca entram em:

- Git;
- `.env.example`;
- frontend;
- variáveis `VITE_*`.

---

## 23. Migrations

### Desenvolvimento

Para subir a base existente, dentro do backend/container:

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

Usar `npx prisma migrate dev --name descricao` apenas para uma nova alteração de schema em desenvolvimento. Não recriar migrations aplicadas.

### Produção

```bash
npx prisma migrate deploy
```

### Regras

- migrations versionadas;
- review antes de deploy;
- backup antes de migration crítica;
- migrations destrutivas não automáticas;
- seed de produção apenas para base necessária;
- migrations não executadas implicitamente no startup do backend.

---

## 24. Seeds

Seed implementada:

- 20 permissões base;
- papel `ADMIN` e associação às permissões;
- primeiro administrador somente por `BOOTSTRAP_ADMIN_EMAIL` explícito.

Não há seed demo, perfil SMS nem catálogos operacionais sem lista aprovada. A execução repetida foi validada sem duplicação.

Não criar usuário administrador hardcoded.

---

## 25. Backup

### Banco

Produção:

- backup diário;
- retenção mínima inicial de 14 dias;
- backup extraordinário antes de migration crítica;
- cópia protegida fora do volume principal quando possível.

### Documentos

Se storage externo:

- utilizar recursos de durabilidade/versionamento/backup do provider conforme contrato;
- documentar procedimento de recuperação.

Se volume local:

- incluir `uploads_data` no backup.

### Restore

Obrigatório:

- teste antes do go-live;
- teste periódico recomendado a cada trimestre;
- runbook documentado.

---

## 26. Rollback

Um rollback não deve depender somente de `git revert`.

Deve considerar:

- versão da imagem;
- compatibilidade de migration;
- versão do schema;
- backup;
- alterações de env;
- frontend/backend compatíveis.

Migrations destrutivas exigem plano próprio de reversão/recuperação.

---

## 27. Logs

### Containers

stdout/stderr.

### Backend

JSON estruturado.

Campos úteis:

- timestamp;
- level;
- service;
- requestId;
- method;
- path;
- status;
- duration;
- userId quando seguro.

Não registrar:

- cookies;
- tokens;
- secrets;
- conteúdo de documentos;
- CID completo;
- texto médico sensível;
- passwords inexistentes;
- Authorization header.

---

## 28. Segurança operacional

- HTTPS em homologação/produção;
- DB não público em produção;
- CORS restrito;
- secrets por ambiente;
- credenciais distintas por ambiente;
- cookies Secure em produção;
- limite de upload;
- storage privado;
- Docker build sem `.env`;
- containers sem dados persistentes dentro da imagem;
- menor exposição possível de portas;
- atualizações de dependência revisadas;
- princípio do menor privilégio para credenciais do banco/storage.

---

## 29. Serviços não incluídos inicialmente

Não criar agora:

- Redis;
- BullMQ;
- worker;
- n8n;
- servidor de e-mail;
- vector store;
- serviço de IA;
- servidor MCP;
- analytics público;
- CDN de motion.

A inclusão futura exige caso de uso real.

---

## 30. Infraestrutura e integração futura de colaboradores

A futura integração corporativa poderá exigir:

- secrets;
- outbound network;
- cron/job;
- retry;
- worker.

Nenhum desses serviços entra antes do contrato técnico da integração.

---

## 31. Estrutura alvo

```text
gestao-afastados/
├── frontend/
│   ├── Dockerfile.dev
│   ├── Dockerfile.prod
│   ├── .dockerignore
│   ├── .env.example
│   └── ...
├── backend/
│   ├── Dockerfile.dev
│   ├── Dockerfile.prod
│   ├── .dockerignore
│   ├── .env.example
│   ├── storage/
│   │   └── .gitkeep
│   └── ...
├── docs/
│   ├── adr/
│   ├── decisions/
│   └── runbooks/
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 32. Runbooks exigidos antes de produção

- setup local;
- deploy;
- rollback;
- migrations;
- backup;
- restore;
- sessão/login Microsoft;
- rotação de secret;
- container unhealthy;
- banco indisponível;
- storage indisponível;
- validação pós-deploy.

---

## 33. Matriz Arquitetura → Infraestrutura

| Necessidade | Serviço/infra | Situação |
|---|---|---|
| React/Vite SPA | frontend | implementada |
| API Express | backend | implementada |
| PostgreSQL | db | implementado |
| Microsoft OIDC | provider externo + backend | código implementado; App Registration pendente |
| Sessões | PostgreSQL | implementadas |
| Documentos dev | volume backend | implementado |
| Documentos prod | S3-compatible | provider pendente |
| Redis | nenhum | não necessário |
| Worker | nenhum | não necessário |
| E-mail | nenhum | fora da base |
| Integração corporativa | backend adapter | contrato pendente |
| Reverse proxy | ambiente de produção | pendente |
| SSL | ambiente de produção | obrigatório |
| Logs | stdout + JSON backend | definida |
| Backup | DB + storage | política base definida |

---

## 34. Maturidade

A base Docker local está implementada com frontend, backend e banco, envs,
volumes, healthchecks e setup reproduzível. Os três serviços foram observados
como `healthy` na auditoria.

Os artefatos de produção existem, mas isso não homologa um ambiente corporativo.
App Registration, domínios/HTTPS, operação de secrets, storage definitivo e
exercícios de recuperação ainda dependem da MCM. Não houve deploy nem smoke
autenticado completo. Ver [pendências do handoff](../handoff/PENDENCIAS_HANDOFF.md).

---

## 35. Pendências

### PEND-INFRA-001

Host/orquestrador de homologação e produção.

### PEND-INFRA-002

Domínios/subdomínios.

### PEND-INFRA-003

Provider S3-compatible.

### PEND-INFRA-004

Política corporativa de backup e retenção, caso exista regra MCM superior à baseline.

### PEND-INFRA-005

Ownership:

- deploy;
- backups;
- restore;
- secrets;
- App Registration Microsoft;
- DNS.

---

## 36. Critérios de aceite da implementação

- [x] `.gitignore` real;
- [x] frontend usa npm + package-lock;
- [x] backend usa npm + package-lock;
- [x] lockfiles alternativos removidos;
- [x] frontend Dockerfile dev;
- [x] frontend Dockerfile prod;
- [x] backend Dockerfile dev;
- [x] backend Dockerfile prod;
- [x] `.dockerignore` de frontend;
- [x] `.dockerignore` de backend;
- [x] `.env.example` raiz;
- [x] `.env.example` frontend;
- [x] `.env.example` backend;
- [x] compose dev funcional;
- [x] Compose de produção versionado com backend/DB internos; validação operacional depende do ambiente real;
- [x] `COMPOSE_PROJECT_NAME=gestao-afastados`;
- [x] ausência de `container_name`;
- [x] frontend em 5173 local;
- [x] backend em 3000 local;
- [x] porta 5432 publicada apenas no Compose de desenvolvimento;
- [x] DATABASE_URL usa host `db` dentro do Compose;
- [x] volume `db_data`;
- [x] storage local em volume;
- [x] health frontend;
- [x] health backend;
- [x] health DB;
- [x] banco privado em produção;
- [x] secrets não versionados;
- [x] migrations controladas;
- [x] backup documentado;
- [x] diretrizes de restore documentadas;
- [ ] exercício de restore executado em ambiente corporativo;
- [x] rollback documentado;
- [ ] provider de produção definido antes do go-live;
- [ ] provider de storage definido antes do go-live;
- [ ] homologação autenticada com App Registration Microsoft real.
