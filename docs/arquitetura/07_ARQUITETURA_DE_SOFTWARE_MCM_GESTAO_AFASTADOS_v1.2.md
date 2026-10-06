# 07 — Arquitetura de Software — MCM Gestão de Afastados

**Versão:** 1.2  
**Data:** 05/10/2026  
**Status:** Arquitetura pronta para implementação — Backend, APIs e Banco consolidados  
**Branch de consolidação:** `arquitetura/base-integrada`  
**Produto:** MCM Gestão de Afastados  
**Tipo:** Sistema interno corporativo  
**Criticidade:** Alta, por tratar dados pessoais e informações potencialmente sensíveis de saúde.

---

## 1. Objetivo

Definir a arquitetura macro da MCM Gestão de Afastados a partir do frontend validado, de forma suficiente para orientar a construção do backend, APIs, banco, autenticação, storage, infraestrutura, testes e handoff técnico.

A arquitetura deve manter o produto simples e sustentável:

- frontend e backend desacoplados;
- API REST versionada;
- backend como autoridade de autenticação, autorização e regras críticas;
- PostgreSQL como fonte de consistência;
- módulos organizados por domínio;
- documentação e decisões rastreáveis;
- infraestrutura reproduzível;
- sem adicionar serviços sem necessidade real.

Esta fase não encerra todos os detalhes técnicos. Os contratos endpoint por endpoint, modelagem física completa e implementação do backend serão detalhados nos documentos técnicos subsequentes.

---

## 2. Estado de origem

A baseline exportada contém:

- frontend React + TypeScript funcional;
- Vite como ferramenta de build;
- TanStack Router;
- TanStack Query;
- Tailwind CSS;
- componentes baseados em shadcn/ui e Radix;
- React Hook Form e Zod disponíveis;
- Recharts;
- Sonner;
- CRUDs e fluxo visual validados;
- persistência temporária acessada diretamente pelo frontend;
- arquivos de infraestrutura existentes apenas como estrutura inicial;
- diretório `/backend` ainda sem implementação real.

Há resíduos técnicos da plataforma utilizada para prototipação e da persistência temporária. Eles serão removidos de forma controlada após existirem substitutos funcionais.

### Regra de transição

Não remover uma dependência funcional antes de existir o caminho definitivo correspondente.

Exemplo:

```text
acesso direto à persistência temporária
→ criar backend/API
→ integrar frontend à API
→ validar CRUD
→ remover acesso antigo
→ remover dependências/configurações antigas
```

---

## 3. Architecture Blueprint

```yaml
architecture_blueprint:
  project:
    name: "MCM Gestão de Afastados"
    type: "Sistema interno corporativo"
    maturity:
      current: "Arquitetura pronta para prompts de implementação"
      target_delivery: "Arquitetura integrada e validada para homologação"
    criticality: "Alta"
    execution_mode: "Frontend validado exportado para implementação full stack"

  style:
    primary: "Monólito modular com separação frontend/backend"
    backend_style: "Clean Architecture pragmática + DDD leve"
    modularity: "por domínio/feature"
    complexity: "intermediária"
    microservices: false

  repository:
    root: "gestao-afastados"
    frontend: "/frontend"
    backend: "/backend"
    package_manager: "npm"
    lockfile: "package-lock.json"
    compose_dev: "docker-compose.dev.yml"
    compose_prod: "docker-compose.prod.yml"

  frontend:
    runtime: "SPA"
    framework: "React + Vite + TypeScript"
    router: "TanStack Router"
    remote_state: "TanStack Query"
    forms: "React Hook Form + Zod"
    direct_database_access: false
    direct_storage_access: false

  backend:
    runtime: "Node.js LTS"
    framework: "Express"
    language: "TypeScript strict"
    api_base_path: "/api/v1"
    orm: "Prisma"
    architecture: "controller → service → repository"
    stateless_business_api: true

  database:
    engine: "PostgreSQL"
    initial_major: 16
    orm: "Prisma"
    id_strategy: "UUID"
    multi_tenant: false
    migrations: "versionadas"
    seeds: "catálogos base e RBAC/primeiro administrador quando autorizado"

  authentication:
    provider: "Microsoft Entra ID"
    protocol: "OpenID Connect / OAuth 2.0 Authorization Code"
    browser_tokens: false
    application_session: "cookie HttpOnly com identificador opaco"
    session_store: "PostgreSQL"
    eligible_email_domains:
      - "mcm.eng.br"
      - "mcmmontagens.com.br"
    local_user_required: true
    local_user_must_be_active: true
    allowed_tenant_validation: true

  authorization:
    strategy: "RBAC por capacidades"
    backend_authoritative: true
    frontend_visual_only: true
    abac_initially_required: false
    extensible_for_attribute_rules: true

  storage:
    abstraction_required: true
    dev_driver: "filesystem privado em volume local"
    prod_preferred_driver: "S3-compatible private object storage"
    final_provider: "PENDENTE"
    public_urls: false

  async:
    redis: false
    queue: false
    worker: false
    scheduled_jobs_initial: false

  observability:
    logs: "JSON estruturado"
    logger: "Pino"
    request_id: true
    audit_log: true
    external_error_tracking: "opcional, decisão posterior"

  infrastructure:
    containers: true
    minimum_services:
      - frontend
      - backend
      - db
    production_orchestrator: "PENDENTE"
    portable_compose_required: true
    deployment_compatible_with_managed_reverse_proxy: true

  specialized:
    public_marketing_site: false
    seo: false
    pwa: false
    advanced_motion: false
    ai: false
    multi_tenant: false
    white_label: false
```

---

## 4. Decisão de estilo arquitetural

### 4.1 Monólito modular

O backend será um único serviço de aplicação, modularizado por domínio.

Não serão criados microsserviços nesta base.

### Justificativas

- domínio de tamanho controlado;
- baixa necessidade de escalabilidade independente por módulo;
- simplifica desenvolvimento e handoff;
- reduz custo de deploy, rede e observabilidade;
- mantém fronteiras internas claras;
- pode ser decomposto futuramente se existir necessidade concreta.

### Regra

Modularidade lógica não significa múltiplos containers de aplicação.

---

## 5. Arquitetura lógica

```text
┌───────────────────────────────┐
│          Navegador            │
│ React + Vite + TanStack Router│
└───────────────┬───────────────┘
                │ HTTPS / JSON
                │ cookie HttpOnly
                ▼
┌───────────────────────────────┐
│        Backend / API          │
│ Node.js + Express + TypeScript│
│ /api/v1                      │
│                               │
│ Auth / RBAC / Regras / Audit  │
└───────┬──────────┬────────────┘
        │          │
        │ Prisma   │ Storage Adapter
        ▼          ▼
┌──────────────┐  ┌─────────────────────┐
│ PostgreSQL   │  │ Documentos privados │
│              │  │ local dev / S3 prod │
└──────────────┘  └─────────────────────┘
        ▲
        │ sessão / usuários /
        │ permissões / domínio
        │
┌───────────────────────────────┐
│ Microsoft Entra ID            │
│ Identidade corporativa        │
└───────────────────────────────┘
```

O frontend nunca acessa PostgreSQL ou storage diretamente.

---

## 6. Arquitetura física inicial

### Desenvolvimento local

```text
Docker Compose
├── frontend  :5173
├── backend   :3000
└── db        :5432
```

Storage local de desenvolvimento:

```text
backend
└── volume privado de documentos
```

### Produção

```text
Navegador
   ↓ HTTPS
Proxy/Reverso do ambiente
   ├── frontend
   └── backend
          ├── PostgreSQL privado
          ├── storage privado
          └── Microsoft Entra ID
```

O banco não deve possuir exposição pública em produção.

---

## 7. Frontend

### 7.1 Decisão

O frontend final será uma SPA React/Vite.

Será mantido **TanStack Router**, pois as rotas existentes estão funcionais e não há justificativa para uma migração de roteador.

A camada server-side atualmente herdada no frontend será removida se ficar sem função depois da criação do backend Express.

### 7.2 Responsabilidades

O frontend é responsável por:

- experiência do usuário;
- rotas e layouts;
- estados de interface;
- formulários e validação inicial;
- consumo da API;
- cache remoto com TanStack Query;
- mensagens amigáveis;
- comportamento visual baseado em permissões.

O frontend não é autoridade para:

- autenticação definitiva;
- autorização;
- regras críticas;
- integridade de dados;
- cálculo crítico de negócio;
- upload/download direto em storage;
- acesso direto ao banco.

### 7.3 Fluxo técnico

```text
Route/Page
→ component/form
→ query/mutation hook
→ service de domínio
→ API client
→ backend
```

---

## 8. Backend

### 8.1 Stack

- Node.js LTS;
- Express;
- TypeScript strict;
- Zod para validação de entrada/contratos internos;
- Prisma;
- PostgreSQL;
- Pino.

### 8.2 Estrutura macro

```text
backend/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── app.ts
│   │   ├── routes.ts
│   │   └── middlewares.ts
│   ├── config/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── access/
│   │   ├── settings/
│   │   ├── employees/
│   │   ├── leaves/
│   │   ├── progress/
│   │   ├── documents/
│   │   ├── notifications/
│   │   ├── dashboard/
│   │   └── audit/
│   ├── infrastructure/
│   │   ├── database/
│   │   ├── identity/
│   │   ├── storage/
│   │   └── logger/
│   ├── shared/
│   │   ├── errors/
│   │   ├── http/
│   │   ├── security/
│   │   ├── utils/
│   │   └── types/
│   └── server.ts
├── package.json
├── package-lock.json
├── tsconfig.json
└── .env.example
```

### 8.3 Regra de dependência

```text
routes
→ controller
→ service
→ repository / integration adapter
```

Controllers não acessam Prisma diretamente.

---

## 9. Módulos de domínio

### 9.1 Auth

Responsável por:

- iniciar autenticação Microsoft;
- callback;
- validação de identidade;
- validação de tenant configurado;
- validação de domínio de e-mail;
- vínculo com usuário local;
- criação da sessão;
- `/auth/me`;
- logout;
- invalidação de sessão.

### 9.2 Users

Responsável por:

- usuários locais;
- status ativo/inativo;
- vínculo com identidade Microsoft;
- provisionamento;
- consulta administrativa.

### 9.3 Access

Responsável por:

- roles;
- permissions/capabilities;
- associação role-permission;
- associação user-role;
- resolução de capacidades efetivas;
- policies de autorização.

### 9.4 Settings

Agrega cadastros auxiliares:

- obras;
- funções;
- tipos de benefício;
- situações;
- tipos de andamento;
- tipos de documento.

### 9.5 Employees

Responsável por:

- colaboradores;
- identificador corporativo;
- contato;
- obra/função;
- inativação;
- histórico consolidado;
- preparação para integração futura com fonte corporativa.

### 9.6 Leaves

Responsável por:

- afastamentos;
- criação;
- atualização;
- encerramento pela situação;
- regras de datas;
- classificação ativa/encerrada/aposentada.

### 9.7 Progress

Responsável por:

- andamentos;
- próximos passos;
- data da próxima ação;
- timeline.

### 9.8 Documents

Responsável por:

- metadados;
- upload;
- download;
- autorização;
- exclusão controlada;
- integração com storage.

### 9.9 Notifications

Responsável por:

- alertas de benefício;
- alertas de retorno;
- alertas de próxima ação;
- estado lida/não lida por usuário.

### 9.10 Dashboard

Responsável por:

- indicadores agregados;
- séries de gráficos;
- tabela prioritária;
- cálculos oficiais no backend.

### 9.11 Audit

Responsável por:

- operações críticas;
- alterações administrativas;
- eventos de acesso;
- mutations relevantes.

---

## 10. Autenticação Microsoft

### 10.1 Estratégia

A aplicação usará Microsoft Entra ID para identidade.

Não haverá:

- cadastro público;
- senha local;
- recuperação de senha local.

O backend realizará o fluxo OpenID Connect/OAuth 2.0 Authorization Code.

### 10.2 Fluxo

```text
1. Usuário acessa /login.
2. Frontend chama/redireciona para GET /api/v1/auth/login.
3. Backend inicia o fluxo Microsoft.
4. Microsoft autentica o usuário.
5. Microsoft redireciona para o callback do backend.
6. Backend valida state, nonce, issuer, tenant e token.
7. Backend extrai a identidade corporativa.
8. Backend verifica domínio permitido.
9. Backend encontra usuário local ativo.
10. Se for primeiro vínculo autorizado, associa oid/tid ao usuário local.
11. Backend cria sessão local.
12. Backend grava cookie HttpOnly.
13. Backend redireciona ao frontend.
14. Frontend chama GET /api/v1/auth/me.
15. API retorna usuário, roles e permissions.
```

### 10.3 Identidade estável

A identificação externa deverá armazenar, quando disponíveis:

- `oid` da identidade;
- tenant ID (`tid`);
- e-mail/username normalizado;
- nome de exibição.

A aplicação não deve depender somente do e-mail como chave técnica permanente.

### 10.4 Domínios elegíveis

```text
mcm.eng.br
mcmmontagens.com.br
```

A verificação de domínio é uma condição de elegibilidade, não uma autorização.

### 10.5 Tenant

Um ou mais tenant IDs permitidos deverão ser configurados no backend.

Os IDs reais da MCM permanecem pendentes até o registro/configuração da aplicação no Entra ID.

Não usar endpoint aberto a qualquer tenant sem validação posterior estrita.

---

## 11. Sessão de aplicação

### 11.1 Decisão

Usar sessão server-side armazenada no PostgreSQL e cookie com token opaco.

Não usar token de autenticação da aplicação em `localStorage`.

### 11.2 Modelo lógico

```text
UserSession
- id
- userId
- tokenHash
- expiresAt
- createdAt
- lastSeenAt
- revokedAt
- userAgent opcional
- ipHash ou metadado minimizado opcional
```

O valor bruto da sessão permanece apenas no cookie do navegador. O banco guarda hash.

### 11.3 Cookie

Direção:

```text
HttpOnly = true
Secure = true em produção
SameSite = Lax
Path = /
```

Nome sugerido:

```text
mcm_afastados_session
```

### 11.4 Logout

Logout deve:

- revogar a sessão;
- limpar cookie;
- limpar cache remoto do frontend;
- redirecionar para `/login`.

### 11.5 CSRF

A implementação final deve aplicar controles compatíveis com a topologia escolhida, incluindo:

- validação de Origin em operações mutáveis;
- política CORS exata;
- SameSite;
- token CSRF adicional se a topologia exigir.

---

## 12. Provisionamento de usuários

### 12.1 Regra

Usuário Microsoft válido não recebe acesso automaticamente.

É necessário:

1. domínio elegível;
2. tenant válido;
3. usuário local existente;
4. usuário local ativo;
5. permissões resolvidas.

### 12.2 Primeiro administrador

O primeiro administrador será provisionado de forma explícita por seed/CLI, utilizando valor informado por variável de ambiente durante a inicialização controlada.

Exemplo conceitual:

```text
BOOTSTRAP_ADMIN_EMAIL=<email corporativo autorizado>
```

A aplicação não promoverá automaticamente o “primeiro usuário que entrar”.

Após o bootstrap, gestão normal de acessos ocorrerá pela aplicação.

---

## 13. Autorização

### 13.1 Estratégia

RBAC por capacidades.

Estrutura lógica:

```text
User
  └── UserRole
        └── Role
              └── RolePermission
                    └── Permission
```

### 13.2 Capacidades candidatas

```text
session.access

users.read
users.manage
permissions.manage

settings.read
settings.manage

employees.read
employees.create
employees.update

leaves.read
leaves.create
leaves.update

progress.read
progress.create
progress.update
progress.delete

documents.read
documents.upload
documents.download
documents.delete

notifications.read
notifications.mark_read

dashboard.read
audit.read
```

A nomenclatura final será fechada no detalhamento do backend/segurança.

### 13.3 Autoridade

```text
backend = autoridade
frontend = apresentação
```

Ocultar um botão não é controle de acesso.

---

## 14. Multi-tenant

### Decisão

A base será **single-tenant**.

Os dois domínios de e-mail permitidos não serão tratados como tenants diferentes.

Consequências:

- sem `tenant_id` nas tabelas de domínio;
- sem tenant switch;
- sem branding por tenant;
- menor complexidade de filtros e autorização.

Se no futuro a aplicação precisar atender empresas independentes, a decisão deve ser revista formalmente.

---

## 15. API

### 15.1 Estilo

REST JSON versionado:

```text
/api/v1
```

### 15.2 Recursos de alto nível

```text
/auth
/users
/roles
/permissions
/settings/*
/employees
/leaves
/leaves/:id/progress
/leaves/:id/documents
/notifications
/dashboard
/audit
/health
```

### 15.3 Padrão de sucesso

Exemplo:

```json
{
  "data": {}
}
```

Listagem:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

### 15.4 Padrão de erro

```json
{
  "status": 422,
  "code": "VALIDATION_ERROR",
  "message": "Não foi possível concluir a operação.",
  "fieldErrors": [],
  "requestId": "..."
}
```

Não retornar stack trace ao cliente em produção.

### 15.5 Paginação

Listagens potencialmente crescentes usarão paginação server-side.

---

## 16. Banco de dados

### 16.1 Decisão

PostgreSQL + Prisma.

### 16.2 Diretrizes

- UUID para identificadores;
- foreign keys;
- constraints no banco;
- índices nos filtros críticos;
- migrations versionadas;
- seeds determinísticos;
- timestamps consistentes;
- valores monetários não são relevantes à base atual;
- datas de calendário tratadas como `date`;
- timestamps técnicos em timezone consistente.

### 16.3 Estratégia de exclusão

Mista:

- cadastros auxiliares: inativação;
- colaborador: inativação;
- afastamento: encerramento por situação, sem exclusão operacional;
- andamento: exclusão lógica/controlada quando permitida;
- documento: exclusão controlada com trilha de auditoria; retenção final depende da política de segurança/compliance;
- usuário: inativação/revogação de acesso.

### 16.4 Identificador do colaborador

O identificador funcional deve representar o código corporativo do colaborador.

A futura integração com a fonte corporativa deve mapear o identificador externo sem depender de códigos temporários do protótipo.

### 16.5 Dados sensíveis

`causa_cid`, observações de saúde e documentos requerem proteção especial.

Não registrar seus conteúdos completos em logs de aplicação ou auditoria técnica.

---

## 17. Modelo lógico de entidades

### Estruturantes

- User
- ExternalIdentity
- UserSession
- Role
- Permission
- UserRole
- RolePermission
- AuditLog
- NotificationRead

### Cadastros

- Obra
- Funcao
- TipoBeneficio
- SituacaoAfastamento
- TipoAndamento
- TipoDocumento

### Domínio

- Colaborador
- Afastamento
- AfastamentoAndamento
- AfastamentoDocumento

A modelagem física completa será detalhada separadamente.

---

## 18. Storage de documentos

### 18.1 Abstração

O backend utilizará uma interface de storage.

```text
DocumentStorage
├── save()
├── open/download()
├── delete()
└── exists()
```

Adapters iniciais:

```text
LocalStorageAdapter
S3StorageAdapter
```

### 18.2 Desenvolvimento

Filesystem privado em volume Docker.

Não usar diretório público do frontend.

### 18.3 Produção

Preferência arquitetural:

- object storage S3-compatible;
- bucket privado;
- criptografia em repouso fornecida pelo provider;
- tráfego TLS;
- nenhum objeto permanentemente público.

O provider final é pendente.

### 18.4 Downloads

Direção preferencial:

```text
frontend
→ endpoint autorizado
→ backend valida permissão
→ backend gera stream ou acesso temporário
→ usuário baixa o arquivo
```

### 18.5 Metadados

Banco armazena:

- id;
- afastamento;
- tipo;
- nome original;
- chave interna;
- MIME;
- tamanho;
- hash quando aplicável;
- usuário responsável;
- timestamps;
- estado de exclusão.

---

## 19. Notificações

### Decisão inicial

Não criar fila ou worker para alertas nesta base.

Os alertas operacionais serão derivados pelo backend a partir dos dados atuais:

- fim de benefício;
- retorno previsto;
- próxima ação.

O estado de leitura é persistido por usuário em banco.

Se posteriormente surgirem:

- e-mail;
- notificações externas;
- alto volume;
- rotinas periódicas materializadas;

a necessidade de job/worker será reavaliada.

---

## 20. Dashboard

As regras oficiais de agregação ficam no backend.

O frontend deve receber:

- valores de cards;
- séries;
- agrupamentos;
- tabela prioritária.

Não duplicar fórmula crítica no navegador.

O indicador de duração permanece sujeito a validação funcional antes de ser considerado definitivo.

---

## 21. Integração futura com fonte corporativa

A integração futura de colaboradores deve ser isolada em adapter/service próprio.

```text
EmployeesModule
      │
      └── EmployeeSourceAdapter
              ├── Manual/Internal
              └── CorporateSource futuro
```

Não acoplar entidade de colaborador ao formato de payload de um fornecedor externo.

A API, frequência, autenticação e regras de sincronização permanecem pendentes.

---

## 22. Auditoria

### 22.1 Operações mínimas auditáveis

- ativação/inativação de usuário;
- alteração de role/permissão;
- alteração de cadastros estruturantes;
- criação/edição/encerramento de afastamento;
- criação/edição/exclusão de andamento;
- upload/exclusão de documento;
- eventos administrativos relevantes.

### 22.2 Estrutura lógica

```text
AuditLog
- id
- actorUserId
- action
- entityType
- entityId
- metadata sanitizado
- requestId
- createdAt
```

Não copiar conteúdo sensível integral para o log.

---

## 23. Observabilidade

### Base obrigatória

- Pino;
- logs JSON;
- `request_id`;
- logs de startup/shutdown;
- erros normalizados;
- tempo de request;
- contexto mínimo de usuário quando seguro;
- sem dados médicos/documentos nos logs.

### Fases futuras

Sentry, métricas e alertas podem ser adicionados quando o ambiente operacional for definido.

---

## 24. Cache, Redis, fila e worker

### Decisão inicial

Não incluir.

Motivo:

- volume esperado ainda não exige;
- não há e-mail nesta base;
- não há processamento pesado;
- alertas podem ser calculados por consulta;
- sessões podem residir no PostgreSQL;
- adicionar Redis/worker aumentaria operação sem benefício atual.

### Condições de revisão

Reavaliar se houver:

- processamento assíncrono;
- sincronização frequente com sistemas externos;
- e-mails;
- alto volume;
- rate limit distribuído;
- cache de consultas caras;
- fila de documentos.

---

## 25. Erros entre camadas

Backend:

- gera código estável;
- mensagem de usuário;
- detalhes seguros;
- `requestId`.

Frontend:

- converte erro em feedback amigável;
- usa mensagem de campo quando aplicável;
- 401 → sessão/login;
- 403 → acesso negado;
- 404 → não encontrado;
- 409 → conflito;
- 422 → validação;
- 500/503 → fallback.

---

## 26. Segurança arquitetural mínima

Obrigatório:

- HTTPS em produção;
- cookie `Secure` e `HttpOnly`;
- CORS restrito;
- validação server-side;
- rate limit em autenticação e rotas sensíveis;
- validação de tenant e domínio Microsoft;
- usuário local ativo;
- autorização no backend;
- secrets fora do repositório;
- sanitização de logs;
- limites de upload;
- MIME e extensão validados no backend;
- nomes de arquivos não usados diretamente como caminho;
- banco privado em produção;
- backups;
- erro sem stack trace em produção.

A política completa será aprofundada em segurança/compliance.

---

## 27. Repositório alvo

```text
gestao-afastados/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile.dev
│   ├── Dockerfile.prod
│   ├── .dockerignore
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── Dockerfile.dev
│   ├── Dockerfile.prod
│   ├── .dockerignore
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
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

## 28. Normalização da baseline exportada

### Remover somente durante a implementação controlada

- gerenciador/lockfile que não seja npm;
- arquivos de configuração exclusivos da ferramenta de prototipação;
- bibliotecas exclusivas da ferramenta de prototipação;
- SDK da persistência temporária;
- pasta de migrations temporárias depois de migrar o conhecimento necessário;
- integrações diretas do frontend com persistência/storage;
- runtime server-side do frontend que se torne redundante;
- documentação de geração que não represente o produto final.

### Manter

- componentes visuais válidos;
- Design System;
- TanStack Router;
- TanStack Query;
- React Hook Form;
- Zod;
- Recharts;
- Sonner;
- Tailwind;
- shadcn/Radix;
- lógica de UX validada que não viole a nova arquitetura.

---

## 29. Estratégia para os dados da baseline

A persistência atual serve como fonte de entendimento funcional, não como dependência da solução final.

### Dados fictícios/demonstração

Devem virar seeds coerentes no novo banco.

### Dados reais, se existirem

Não serão copiados automaticamente.

Antes de qualquer migração real deve existir:

- inventário;
- classificação de sensibilidade;
- mapeamento origem → destino;
- validação de integridade;
- plano de rollback;
- autorização da MCM.

---

## 30. Ambientes

Arquiteturalmente serão previstos:

### Local

- desenvolvimento;
- Docker Compose;
- banco local/container;
- storage local privado.

### Homologação

Recomendado para:

- login Microsoft;
- permissões;
- CRUD;
- documentos;
- validação do cliente;
- smoke tests.

### Produção

- dados reais;
- HTTPS;
- banco privado;
- storage privado;
- backup;
- logs sanitizados.

O host, domínio e orquestrador reais de homologação/produção continuam pendentes.

---

## 31. Matriz de decisões

| Tema | Decisão |
|---|---|
| Arquitetura | Monólito modular |
| Frontend/backend | Separados |
| Frontend final | SPA React/Vite |
| Router | Manter TanStack Router |
| API | REST JSON `/api/v1` |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Banco | PostgreSQL |
| IDs | UUID |
| Autenticação | Microsoft Entra ID |
| Sessão | Server-side PostgreSQL + cookie HttpOnly opaco |
| Autorização | RBAC por capacidades |
| Multi-tenant | Não |
| Storage dev | Volume/filesystem privado |
| Storage prod | S3-compatible privado preferencial; provider pendente |
| Redis | Não inicialmente |
| Fila/worker | Não inicialmente |
| E-mail | Fora da base |
| IA | Fora da base |
| PWA | Fora da base |
| SEO/páginas públicas | Fora da base |
| Logs | Pino JSON + request_id |
| Auditoria | Sim |
| Package manager | npm |
| Produção | Provider/orquestrador pendente |

---

## 32. ADRs obrigatórios

A arquitetura gera os seguintes ADRs:

1. Monólito modular com frontend e backend separados.
2. SPA React/Vite com manutenção do TanStack Router.
3. Microsoft Entra ID + sessão server-side em PostgreSQL.
4. PostgreSQL + Prisma.
5. Abstração de storage privado.
6. Single-tenant e ausência inicial de Redis/fila/worker.

---

## 33. Decisões pendentes

### PEND-ARCH-001 — Tenant Microsoft

Precisamos obter:

- tenant ID ou tenant IDs;
- client ID;
- política de callback;
- responsáveis pela App Registration;
- secrets/certificados conforme estratégia de segurança.

### PEND-ARCH-002 — URLs

Definir:

- URL de homologação;
- URL de produção;
- URL da API;
- callbacks Microsoft.

### PEND-ARCH-003 — Provider de produção

Definir:

- host/plataforma;
- acesso de deploy;
- reverse proxy;
- gestão de secrets;
- backups.

### PEND-ARCH-004 — Provider de storage

Definir provider S3-compatible ou justificar volume persistente em produção.

### PEND-ARCH-005 — RBAC final

Definir matriz final entre roles e capacidades.

### PEND-ARCH-006 — Retenção

Definir retenção/exclusão definitiva de:

- documentos;
- audit logs;
- sessões;
- logs de aplicação.

### PEND-ARCH-007 — Dashboard duração

Validar fórmula e apresentação final.

---

## 34. Maturidade arquitetural

### Atual após consolidação de Backend, APIs e Banco

**Nível 3 — Arquitetura pronta para prompts de implementação.**

Estão definidos de forma coerente:

- estilo e stack;
- separação das camadas;
- módulos backend;
- contratos REST `/api/v1`;
- autenticação Microsoft em alto nível;
- sessão server-side;
- RBAC por capacidades;
- modelo lógico/físico planejado;
- índices e constraints principais;
- storage por adapter;
- infraestrutura mínima;
- validações técnicas de build, typecheck, migrations e healthchecks.

As pendências de tenant/client ID, domínio de produção, provider de storage e host de produção são parâmetros de ambiente/operação. Elas não impedem a construção local da base, mas precisam estar resolvidas para validar autenticação real em homologação e para go-live.

A matriz final do papel `SMS` e a regra final do indicador de duração continuam pendentes funcionais conhecidas e não devem ser inventadas durante implementação.

---

## 35. Handoff técnico

### Para Backend

- módulos;
- auth Microsoft;
- sessão Postgres;
- RBAC;
- repositories;
- storage adapters;
- auditoria;
- Pino/request ID;
- healthchecks.

### Para APIs

- `/api/v1`;
- respostas/erros;
- paginação;
- filtros;
- auth/session;
- recursos por domínio.

### Para Banco

- PostgreSQL;
- UUID;
- RBAC;
- sessão;
- audit log;
- notification read;
- entidades do domínio;
- índices e constraints.

### Para Infraestrutura

- frontend/backend/db;
- storage;
- envs Microsoft;
- healthchecks;
- backups;
- ambientes;
- produção pendente de provider.

### Para Segurança

- dados sensíveis;
- cookies;
- OIDC;
- CORS/CSRF;
- upload;
- logs;
- auditoria;
- retenção;
- LGPD.

### Para Testes

- login;
- domínio;
- tenant;
- usuário local;
- permissões;
- CRUDs;
- documentos;
- alertas;
- dashboard;
- logout;
- healthchecks.

---

## 36. Critérios de aceite

- [x] estilo arquitetural definido;
- [x] frontend e backend separados;
- [x] backend autoridade de regras e permissões;
- [x] API REST versionada;
- [x] PostgreSQL e Prisma definidos;
- [x] módulos principais definidos;
- [x] autenticação Microsoft definida em alto nível;
- [x] estratégia de sessão definida;
- [x] domínio elegível separado de autorização;
- [x] RBAC previsto;
- [x] single-tenant decidido;
- [x] storage abstraído;
- [x] Redis/fila/worker avaliados e dispensados inicialmente;
- [x] observabilidade mínima definida;
- [x] auditoria prevista;
- [x] ambientes previstos;
- [x] estrutura de repositório definida;
- [x] ADRs identificados;
- [x] pendências explicitadas;
- [x] contratos endpoint por endpoint planejados;
- [x] modelagem física planejada;
- [ ] matriz RBAC do papel SMS definitiva;
- [ ] tenant/app registration Microsoft;
- [ ] provider de produção;
- [ ] provider de storage em produção.


---

## Escopo de qualidade desta entrega

Testes automatizados não fazem parte do escopo atual.

A validação desta entrega será feita por:

- typecheck;
- build;
- migrations;
- healthchecks;
- smoke manual dos fluxos críticos;
- revisão técnica antes de commit.

A arquitetura deve permanecer testável para futura adoção de uma estratégia formal de testes, caso a MCM decida incluí-la.
