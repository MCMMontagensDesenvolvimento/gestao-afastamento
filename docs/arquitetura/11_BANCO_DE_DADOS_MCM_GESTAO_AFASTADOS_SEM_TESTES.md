# 11 — Banco de Dados — MCM Gestão de Afastados

**Versão:** 1.1
**Data:** 06/10/2026
**Status:** Schema, migrations e seed implementados e auditados
**Maturidade:** Banco local validado; homologação autenticada e operação de produção pendentes
**Stack:** PostgreSQL + Prisma

---

## 1. Objetivo

Documentar o modelo PostgreSQL/Prisma implementado e governado pelo backend da MCM Gestão de Afastados.

O banco deve proteger:

- integridade relacional;
- histórico;
- autorização estrutural;
- dados sensíveis;
- consultas do produto;
- auditoria;
- evolução via migrations.

---

## 2. Database Blueprint

```yaml
database_blueprint:
  engine: "PostgreSQL 16"
  orm: "Prisma"
  schema: "backend/prisma/schema.prisma"
  migrations: "backend/prisma/migrations"
  seed: "backend/prisma/seed.ts"

  naming:
    tables: "snake_case plural"
    columns: "snake_case"
    prisma_models: "PascalCase singular"
    prisma_fields: "camelCase"
    map_required: true

  ids:
    default: "UUID"

  multi_tenant:
    enabled: false

  delete_policy:
    business_history: "preserve"
    settings: "inactivate"
    progress: "soft delete"
    documents: "binary deletion + metadata tombstone according to retention"
    sessions: "hard purge after operational retention"

  audit:
    level: "operational"
    audit_log: true
    sensitive_snapshots: false

  sensitive_data:
    present: true
    health_data: true
    log_masking_required: true

  seeds:
    base: true
    demo: false
    test: false

  performance:
    page_based_pagination: true
    default_page_size: 10
    indexes_driven_by_contracts: true
```

---

## 3. Convenções

### PostgreSQL

```text
tables: snake_case plural
columns: snake_case
foreign keys: entidade_id
indexes: idx_tabela_campos
unique: uq_tabela_campos
checks: chk_tabela_regra
```

### Prisma

```text
models: PascalCase singular
fields: camelCase
@@map para tabela
@map para coluna quando necessário
```

### IDs

UUID para todas as entidades persistidas desta base.

---

## 4. Entidades

| Model | Tabela | Tipo | Campos principais | Política de exclusão | Sensibilidade | Índices/constraints principais |
|---|---|---|---|---|---|---|
| `User` | `users` | Estruturante | id UUID; name; email; isActive; lastLoginAt?; createdAt; updatedAt | inativação; sem hard delete operacional | email=PII | UNIQUE email; INDEX isActive |
| `ExternalIdentity` | `external_identities` | Estruturante | id UUID; userId; provider; providerSubject; providerTenantId; emailAtLink?; linkedAt; lastLoginAt? | preservar vínculo enquanto usuário existir | subject/tenant=external_identifier; email=PII | UNIQUE(provider, providerTenantId, providerSubject); INDEX userId |
| `UserSession` | `user_sessions` | Técnica | id UUID; userId; tokenHash; expiresAt; lastSeenAt; revokedAt?; createdAt | hard delete após retenção operacional | tokenHash=credential | UNIQUE tokenHash; INDEX userId; INDEX expiresAt; INDEX revokedAt |
| `Role` | `roles` | Estruturante | id UUID; code; name; description?; isActive; createdAt; updatedAt | inativação | internal | UNIQUE code; INDEX isActive |
| `Permission` | `permissions` | Estruturante | id UUID; code; description?; createdAt | catálogo controlado; não excluir em uso | internal | UNIQUE code |
| `UserRole` | `user_roles` | Pivot | userId; roleId; assignedById?; createdAt | hard delete da associação com auditoria | internal | UNIQUE(userId, roleId); INDEX roleId |
| `RolePermission` | `role_permissions` | Pivot | roleId; permissionId; createdAt | hard delete da associação com auditoria | internal | UNIQUE(roleId, permissionId); INDEX permissionId |
| `Obra` | `obras` | Configuração | id UUID; nome; ativo; createdAt; updatedAt | inativação | internal | INDEX ativo; UNIQUE nome (exato) |
| `Funcao` | `funcoes` | Configuração | id UUID; nome; ativo; createdAt; updatedAt | inativação | internal | INDEX ativo; UNIQUE nome (exato) |
| `TipoBeneficio` | `tipos_beneficio` | Configuração | id UUID; nome; ativo; createdAt; updatedAt | inativação | internal | INDEX ativo; UNIQUE nome (exato) |
| `SituacaoAfastamento` | `situacoes_afastamento` | Configuração | id UUID; nome; classificacao {ATIVO|ENCERRADO|APOSENTADO}; ativo; createdAt; updatedAt | inativação | internal | INDEX ativo; INDEX classificacao; UNIQUE nome (exato) |
| `TipoAndamento` | `tipos_andamento_afastamento` | Configuração | id UUID; nome; ativo; createdAt; updatedAt | inativação | internal | INDEX ativo; UNIQUE nome (exato) |
| `TipoDocumento` | `tipos_documento_afastamento` | Configuração | id UUID; nome; ativo; createdAt; updatedAt | inativação | internal | INDEX ativo; UNIQUE nome (exato) |
| `Colaborador` | `colaboradores` | Domínio | id UUID; codigoCorporativo; nome; contato?; obraId; funcaoId; ativo; sourceSystem; createdAt; updatedAt | inativação; histórico preservado | nome/contato=PII; codigoCorporativo=external_identifier | UNIQUE codigoCorporativo; INDEX nome; INDEX obraId; INDEX funcaoId; INDEX ativo |
| `Afastamento` | `afastamentos` | Domínio | id UUID; colaboradorId; obraId; funcaoId; situacaoId; tipoBeneficioId?; dataAfastamento; dataFimBeneficio?; dataRetornoPrevista?; dataRetornoEfetiva?; causaCid?; observacoes?; createdById; updatedById?; createdAt; updatedAt | não excluir; encerramento por situação | causaCid=health; observacoes pode conter sensitive | INDEX colaboradorId; obraId; funcaoId; situacaoId; tipoBeneficioId; dataAfastamento; dataFimBeneficio; dataRetornoPrevista |
| `AfastamentoAndamento` | `afastamento_andamentos` | Domínio | id UUID; afastamentoId; tipoAndamentoId; dataAndamento; descricao; proximaAcao?; dataProximaAcao?; createdById; updatedById?; deletedAt?; deletedById?; deleteReason?; createdAt; updatedAt | soft delete controlado | descricao/proximaAcao podem conter sensitive | INDEX(afastamentoId,dataAndamento); INDEX dataProximaAcao; INDEX deletedAt |
| `AfastamentoDocumento` | `afastamento_documentos` | Domínio | id UUID; afastamentoId; andamentoId?; tipoDocumentoId; originalName; storageKey; mimeType; sizeBytes; sha256?; uploadedById; deletedAt?; deletedById?; deleteReason?; createdAt | binário excluído quando autorizado; metadata/tombstone conforme retenção | conteúdo=health/sensitive; nome pode ser PII | UNIQUE storageKey; INDEX afastamentoId; INDEX andamentoId; INDEX tipoDocumentoId; INDEX deletedAt |
| `NotificationRead` | `notification_reads` | Técnica | id UUID; userId; alertKey; readAt; createdAt | pode ser expurgada quando alerta não puder mais reaparecer | internal | UNIQUE(userId, alertKey); INDEX userId; INDEX readAt |
| `AuditLog` | `audit_logs` | Log | id UUID; actorUserId?; action; entityType; entityId?; metadata?; requestId?; createdAt | append-only; retenção pendente | metadata deve ser sanitizado | INDEX actorUserId; INDEX(entityType,entityId); INDEX createdAt; INDEX requestId |

---

## 5. Enums

### Classificação da situação

```text
ATIVO
ENCERRADO
APOSENTADO
```

Representada como enum Prisma/PostgreSQL ou constraint equivalente.

### Provider de identidade

```text
MICROSOFT
```

Pode ser string controlada/enum, mantendo espaço de evolução sem expor provider ao domínio.

---

## 6. Usuários

### `users`

Campos:

```text
id UUID PK
name VARCHAR NOT NULL
email VARCHAR NOT NULL UNIQUE
is_active BOOLEAN NOT NULL DEFAULT true
last_login_at TIMESTAMPTZ NULL
created_at TIMESTAMPTZ NOT NULL
updated_at TIMESTAMPTZ NOT NULL
```

### Regras

- `email` armazenado normalizado em lowercase;
- somente domínios permitidos podem ser habilitados;
- nenhuma senha local;
- usuário inativo não autentica;
- não hard-delete em operação normal.

---

## 7. Identidade externa

### `external_identities`

Campos:

```text
id UUID PK
user_id UUID FK users
provider VARCHAR NOT NULL
provider_subject VARCHAR NOT NULL
provider_tenant_id VARCHAR NOT NULL
email_at_link VARCHAR NULL
display_name_at_link VARCHAR NULL
linked_at TIMESTAMPTZ NOT NULL
last_login_at TIMESTAMPTZ NULL
```

Constraint:

```text
UNIQUE(provider, provider_tenant_id, provider_subject)
```

Não persistir access token/refresh token da Microsoft para manter sessão da aplicação.

---

## 8. Sessões

### `user_sessions`

```text
id UUID PK
user_id UUID FK users
token_hash VARCHAR NOT NULL UNIQUE
expires_at TIMESTAMPTZ NOT NULL
last_seen_at TIMESTAMPTZ NULL
revoked_at TIMESTAMPTZ NULL
created_at TIMESTAMPTZ NOT NULL
```

### Regras

- raw session ID só existe no cookie;
- banco armazena hash;
- logout preenche `revoked_at`;
- usuário inativado revoga sessões;
- sessões antigas podem ser expurgadas após retenção operacional definida.

---

## 9. RBAC

### `roles`

```text
id
code UNIQUE
name
description?
is_active
created_at
updated_at
```

### `permissions`

```text
id
code UNIQUE
description?
created_at
```

### `user_roles`

```text
user_id
role_id
assigned_by_id?
created_at
UNIQUE(user_id, role_id)
```

### `role_permissions`

```text
role_id
permission_id
created_at
UNIQUE(role_id, permission_id)
```

Não usar nome do papel como regra de autorização dentro do domínio.

---

## 10. Cadastros auxiliares

Tabelas:

```text
obras
funcoes
tipos_beneficio
situacoes_afastamento
tipos_andamento_afastamento
tipos_documento_afastamento
```

Padrão:

```text
id UUID
nome
ativo BOOLEAN DEFAULT true
created_at
updated_at
```

Situação acrescenta:

```text
classificacao
```

### Exclusão

Não existe hard delete normal.

Inativação mantém FKs históricas.

---

## 11. Colaboradores

### `colaboradores`

```text
id UUID PK
codigo_corporativo VARCHAR NOT NULL UNIQUE
nome VARCHAR NOT NULL
contato VARCHAR NULL
obra_id UUID NOT NULL FK obras
funcao_id UUID NOT NULL FK funcoes
ativo BOOLEAN NOT NULL DEFAULT true
source_system VARCHAR NOT NULL DEFAULT 'MANUAL'
created_at TIMESTAMPTZ NOT NULL
updated_at TIMESTAMPTZ NOT NULL
```

### Regras

- CPF não existe como obrigatório;
- código corporativo não é gerado em paralelo pelo frontend;
- código é a referência funcional preparada para fonte corporativa futura;
- inativação não remove histórico.

---

## 12. Afastamentos

### `afastamentos`

```text
id UUID PK
colaborador_id UUID NOT NULL FK colaboradores
obra_id UUID NOT NULL FK obras
funcao_id UUID NOT NULL FK funcoes
situacao_id UUID NOT NULL FK situacoes_afastamento
tipo_beneficio_id UUID NULL FK tipos_beneficio
data_afastamento DATE NOT NULL
data_fim_beneficio DATE NULL
data_retorno_prevista DATE NULL
data_retorno_efetiva DATE NULL
causa_cid TEXT NULL
observacoes TEXT NULL
created_by_id UUID NOT NULL FK users
updated_by_id UUID NULL FK users
created_at TIMESTAMPTZ NOT NULL
updated_at TIMESTAMPTZ NOT NULL
```

### Decisão histórica

`obra_id` e `funcao_id` são snapshot relacional do contexto do afastamento.

Eles não são recalculados a partir do cadastro atual do colaborador nas consultas históricas.

### Constraints de regra simples

- datas precisam ser valores válidos;
- todas as FKs devem existir;
- classificação vem da situação;
- não criar coluna duplicada `status` no afastamento.

Regras condicionais mais complexas sobre datas/benefício ficam no service, com testes.

---

## 13. Andamentos

### `afastamento_andamentos`

```text
id UUID PK
afastamento_id UUID NOT NULL
tipo_andamento_id UUID NOT NULL
data_andamento DATE NOT NULL
descricao TEXT NOT NULL
proxima_acao TEXT NULL
data_proxima_acao DATE NULL
created_by_id UUID NOT NULL
updated_by_id UUID NULL
deleted_at TIMESTAMPTZ NULL
deleted_by_id UUID NULL
delete_reason TEXT NULL
created_at TIMESTAMPTZ NOT NULL
updated_at TIMESTAMPTZ NOT NULL
```

### Política

Soft delete.

Listagens padrão:

```text
WHERE deleted_at IS NULL
```

Nenhuma cascata física a partir do afastamento.

---

## 14. Documentos

### `afastamento_documentos`

```text
id UUID PK
afastamento_id UUID NOT NULL
andamento_id UUID NULL
tipo_documento_id UUID NOT NULL
original_name VARCHAR NOT NULL
storage_key VARCHAR NOT NULL UNIQUE
mime_type VARCHAR NOT NULL
size_bytes BIGINT NOT NULL
sha256 VARCHAR NULL
uploaded_by_id UUID NOT NULL
deleted_at TIMESTAMPTZ NULL
deleted_by_id UUID NULL
delete_reason TEXT NULL
created_at TIMESTAMPTZ NOT NULL
```

### Regras

- storage key nunca é response pública;
- `size_bytes <= 10485760`;
- MIME validado no backend;
- metadata não contém binário;
- documento de afastamento encerrado permanece disponível;
- exclusão autorizada remove binário e preserva evidência mínima conforme política final.

### `andamento_id`

Opcional para documento associado especificamente a um andamento.

---

## 15. Leitura de alertas

### `notification_reads`

```text
id UUID PK
user_id UUID NOT NULL
alert_key VARCHAR NOT NULL
read_at TIMESTAMPTZ NOT NULL
created_at TIMESTAMPTZ NOT NULL
UNIQUE(user_id, alert_key)
```

### Por que não existe `notifications`

Os alertas são derivados dos fatos atuais do domínio.

Persistir a notificação inteira criaria risco de divergência entre tabela e regra real.

A tabela mantém somente a interação do usuário.

---

## 16. Auditoria

### `audit_logs`

```text
id UUID PK
actor_user_id UUID NULL
action VARCHAR NOT NULL
entity_type VARCHAR NOT NULL
entity_id UUID NULL
metadata JSONB NULL
request_id VARCHAR NULL
created_at TIMESTAMPTZ NOT NULL
```

### Regra de segurança

Não armazenar automaticamente `before`/`after` completos.

O metadata deve ser montado por allowlist e evitar:

- causa/CID integral;
- observação médica;
- nome/conteúdo de documento quando desnecessário;
- cookie/token;
- credencial;
- payload bruto da Microsoft.

---

## 17. Relacionamentos

```text
User 1:N ExternalIdentity
User 1:N UserSession

User N:N Role via UserRole
Role N:N Permission via RolePermission

Obra 1:N Colaborador
Funcao 1:N Colaborador

Colaborador 1:N Afastamento
Obra 1:N Afastamento
Funcao 1:N Afastamento
SituacaoAfastamento 1:N Afastamento
TipoBeneficio 1:N Afastamento

Afastamento 1:N AfastamentoAndamento
TipoAndamento 1:N AfastamentoAndamento

Afastamento 1:N AfastamentoDocumento
AfastamentoAndamento 0..1:N AfastamentoDocumento
TipoDocumento 1:N AfastamentoDocumento

User 1:N NotificationRead
User 1:N AuditLog como actor
```

---

## 18. Delete behavior de FKs

### Preservar histórico

Para entidades de domínio:

```text
Colaborador → Afastamento: RESTRICT
Afastamento → Andamento: RESTRICT
Afastamento → Documento: RESTRICT
Cadastros → registros históricos: RESTRICT
```

Como as entidades pai não são apagadas normalmente, o objetivo é impedir cascata acidental.

### Pivots

Pode usar cascade apenas para associações puramente estruturais:

```text
UserRole
RolePermission
NotificationRead quando User for removido por procedimento excepcional
```

### Auth

Sessões e identidades podem ser removidas por procedimento de expurgo quando a conta for definitivamente tratada, conforme política de segurança/compliance.

---

## 19. Constraints

Obrigatórias:

- `users.email` unique;
- identidade Microsoft unique por provider + tenant + subject;
- `user_sessions.token_hash` unique;
- `roles.code` unique;
- `permissions.code` unique;
- `user_roles(user_id, role_id)` unique;
- `role_permissions(role_id, permission_id)` unique;
- `colaboradores.codigo_corporativo` unique;
- `notification_reads(user_id, alert_key)` unique;
- classificação de situação limitada a `ATIVO|ENCERRADO|APOSENTADO`;
- `size_bytes >= 0`;
- FKs obrigatórias.

### Nomes de cadastros

Criar unique exato em `nome`.

O service remove espaços nas extremidades; a unicidade atual do nome é exata. Se a MCM exigir equivalência sem distinção de maiúsculas/minúsculas, essa alteração deve ser revisada e aplicada por nova migration.

---

## 20. Índices

### `users`

```text
email UNIQUE
is_active
```

### `external_identities`

```text
(provider, provider_tenant_id, provider_subject) UNIQUE
user_id
```

### `user_sessions`

```text
token_hash UNIQUE
user_id
expires_at
revoked_at
```

### `roles`

```text
code UNIQUE
is_active
```

### Cadastros

```text
ativo
nome UNIQUE
```

### `colaboradores`

```text
codigo_corporativo UNIQUE
nome
obra_id
funcao_id
ativo
```

### `afastamentos`

```text
colaborador_id
obra_id
funcao_id
situacao_id
tipo_beneficio_id
data_afastamento
data_fim_beneficio
data_retorno_prevista
```

Avaliar compostos após carga real:

```text
(situacao_id, obra_id)
(situacao_id, data_retorno_prevista)
(situacao_id, data_fim_beneficio)
```

### `afastamento_andamentos`

```text
(afastamento_id, data_andamento)
data_proxima_acao
deleted_at
```

### `afastamento_documentos`

```text
afastamento_id
andamento_id
tipo_documento_id
deleted_at
storage_key UNIQUE
```

### `notification_reads`

```text
(user_id, alert_key) UNIQUE
user_id
read_at
```

### `audit_logs`

```text
actor_user_id
(entity_type, entity_id)
created_at
request_id
```

---

## 21. Matriz API → Banco

| Endpoint | Funcionalidade | Contrato | Método | Permissão | Entidades |
|---|---|---|---|---|---|
| API-AUTH-001 | FUNC-001 | `/api/v1/auth/login` | `GET` | `público` | User/ExternalIdentity |
| API-AUTH-002 | FUNC-001 | `/api/v1/auth/callback` | `GET` | `público` | User/ExternalIdentity/UserSession |
| API-AUTH-003 | FUNC-001 | `/api/v1/auth/me` | `GET` | `session.access` | User/Role/Permission |
| API-AUTH-004 | FUNC-001 | `/api/v1/auth/logout` | `POST` | `session.access` | UserSession |
| API-USR-001 | FUNC-002 | `/api/v1/usuarios` | `GET` | `users.read` | User/UserRole/Role |
| API-USR-002 | FUNC-002 | `/api/v1/usuarios/:id` | `GET` | `users.read` | User/ExternalIdentity/UserRole/Role |
| API-USR-003 | FUNC-002 | `/api/v1/usuarios` | `POST` | `users.manage` | User |
| API-USR-004 | FUNC-002 | `/api/v1/usuarios/:id` | `PATCH` | `users.manage` | User |
| API-USR-005 | FUNC-002 | `/api/v1/usuarios/:id/ativar` | `POST` | `users.manage` | User |
| API-USR-006 | FUNC-002 | `/api/v1/usuarios/:id/inativar` | `POST` | `users.manage` | User/UserSession |
| API-USR-007 | FUNC-002 | `/api/v1/usuarios/:id/papeis` | `PUT` | `permissions.manage` | UserRole/Role |
| API-ACL-001 | FUNC-002 | `/api/v1/papeis` | `GET` | `users.read` | Role |
| API-ACL-002 | FUNC-002 | `/api/v1/papeis` | `POST` | `permissions.manage` | Role |
| API-ACL-003 | FUNC-002 | `/api/v1/papeis/:id` | `PATCH` | `permissions.manage` | Role |
| API-ACL-004 | FUNC-002 | `/api/v1/papeis/:id/permissoes` | `PUT` | `permissions.manage` | RolePermission/Permission |
| API-ACL-005 | FUNC-002 | `/api/v1/permissoes` | `GET` | `permissions.manage` | Permission |
| API-CFG-OBR-001 | FUNC-003 | `/api/v1/obras` | `GET` | `settings.manage` | Obra |
| API-CFG-OBR-002 | FUNC-003 | `/api/v1/obras` | `POST` | `settings.manage` | Obra |
| API-CFG-OBR-003 | FUNC-003 | `/api/v1/obras/:id` | `PATCH` | `settings.manage` | Obra |
| API-CFG-FUN-001 | FUNC-003 | `/api/v1/funcoes` | `GET` | `settings.manage` | Funcao |
| API-CFG-FUN-002 | FUNC-003 | `/api/v1/funcoes` | `POST` | `settings.manage` | Funcao |
| API-CFG-FUN-003 | FUNC-003 | `/api/v1/funcoes/:id` | `PATCH` | `settings.manage` | Funcao |
| API-CFG-BEN-001 | FUNC-003 | `/api/v1/tipos-beneficio` | `GET` | `settings.manage` | TipoBeneficio |
| API-CFG-BEN-002 | FUNC-003 | `/api/v1/tipos-beneficio` | `POST` | `settings.manage` | TipoBeneficio |
| API-CFG-BEN-003 | FUNC-003 | `/api/v1/tipos-beneficio/:id` | `PATCH` | `settings.manage` | TipoBeneficio |
| API-CFG-SIT-001 | FUNC-003 | `/api/v1/situacoes-afastamento` | `GET` | `settings.manage` | SituacaoAfastamento |
| API-CFG-SIT-002 | FUNC-003 | `/api/v1/situacoes-afastamento` | `POST` | `settings.manage` | SituacaoAfastamento |
| API-CFG-SIT-003 | FUNC-003 | `/api/v1/situacoes-afastamento/:id` | `PATCH` | `settings.manage` | SituacaoAfastamento |
| API-CFG-AND-001 | FUNC-003 | `/api/v1/tipos-andamento` | `GET` | `settings.manage` | TipoAndamento |
| API-CFG-AND-002 | FUNC-003 | `/api/v1/tipos-andamento` | `POST` | `settings.manage` | TipoAndamento |
| API-CFG-AND-003 | FUNC-003 | `/api/v1/tipos-andamento/:id` | `PATCH` | `settings.manage` | TipoAndamento |
| API-CFG-DOC-001 | FUNC-003 | `/api/v1/tipos-documento` | `GET` | `settings.manage` | TipoDocumento |
| API-CFG-DOC-002 | FUNC-003 | `/api/v1/tipos-documento` | `POST` | `settings.manage` | TipoDocumento |
| API-CFG-DOC-003 | FUNC-003 | `/api/v1/tipos-documento/:id` | `PATCH` | `settings.manage` | TipoDocumento |
| API-COL-001 | FUNC-004 | `/api/v1/colaboradores` | `GET` | `employees.read` | Colaborador/Obra/Funcao |
| API-COL-002 | FUNC-004 | `/api/v1/colaboradores/:id` | `GET` | `employees.read` | Colaborador/Obra/Funcao |
| API-COL-003 | FUNC-004 | `/api/v1/colaboradores` | `POST` | `employees.manage` | Colaborador |
| API-COL-004 | FUNC-004 | `/api/v1/colaboradores/:id` | `PATCH` | `employees.manage` | Colaborador |
| API-COL-005 | FUNC-004 | `/api/v1/colaboradores/:id/ativar` | `POST` | `employees.manage` | Colaborador |
| API-COL-006 | FUNC-004 | `/api/v1/colaboradores/:id/inativar` | `POST` | `employees.manage` | Colaborador |
| API-COL-007 | FUNC-005 | `/api/v1/colaboradores/:id/historico` | `GET` | `employees.read + leaves.read` | Colaborador/Afastamento |
| API-AFA-001 | FUNC-006 | `/api/v1/afastamentos` | `GET` | `leaves.read` | Afastamento + relações |
| API-AFA-002 | FUNC-008 | `/api/v1/afastamentos/:id` | `GET` | `leaves.read` | Afastamento + relações |
| API-AFA-003 | FUNC-007 | `/api/v1/afastamentos` | `POST` | `leaves.create` | Afastamento |
| API-AFA-004 | FUNC-007 | `/api/v1/afastamentos/:id` | `PATCH` | `leaves.update` | Afastamento |
| API-AND-001 | FUNC-009 | `/api/v1/afastamentos/:id/andamentos` | `GET` | `progress.read` | AfastamentoAndamento |
| API-AND-002 | FUNC-009 | `/api/v1/afastamentos/:id/andamentos` | `POST` | `progress.manage` | AfastamentoAndamento |
| API-AND-003 | FUNC-009 | `/api/v1/andamentos/:id` | `PATCH` | `progress.manage` | AfastamentoAndamento |
| API-AND-004 | FUNC-009 | `/api/v1/andamentos/:id` | `DELETE` | `progress.manage` | AfastamentoAndamento |
| API-DOC-001 | FUNC-010 | `/api/v1/afastamentos/:id/documentos` | `GET` | `documents.read` | AfastamentoDocumento |
| API-DOC-002 | FUNC-010 | `/api/v1/afastamentos/:id/documentos` | `POST` | `documents.upload` | AfastamentoDocumento |
| API-DOC-003 | FUNC-010 | `/api/v1/documentos/:id/download` | `GET` | `documents.download` | AfastamentoDocumento |
| API-DOC-004 | FUNC-010 | `/api/v1/documentos/:id` | `DELETE` | `documents.delete` | AfastamentoDocumento/AuditLog |
| API-NOT-001 | FUNC-011 | `/api/v1/notificacoes` | `GET` | `notifications.read` | NotificationRead + Afastamento + Andamento |
| API-NOT-002 | FUNC-011 | `/api/v1/notificacoes/:id/leitura` | `PUT` | `notifications.read_state` | NotificationRead |
| API-DAS-001 | FUNC-012 | `/api/v1/dashboard` | `GET` | `dashboard.read` | Afastamento + cadastros |
| API-AUD-001 | RF-003/RP-014 | `/api/v1/auditoria` | `GET` | `audit.read` | AuditLog |

---

## 22. Dados derivados, não persistidos

Não criar colunas/tabelas apenas para:

- total de ativos;
- benefícios vencidos;
- retornos próximos;
- ativos por obra;
- novos afastamentos por mês;
- alertas correntes;
- duração calculada.

Esses valores são derivados por consulta.

Materialização só será considerada se volume/performance real justificar.

---

## 23. Dados sensíveis

### PII

- nome do usuário;
- e-mail;
- nome do colaborador;
- contato;
- código corporativo.

### Saúde/sensível

- causa/CID;
- observações quando contiverem informação médica;
- documentos;
- descrições/andamentos quando contiverem informação médica.

### Credencial

- session token hash;
- secrets ficam fora do banco de domínio quando possível.

### Regras

- não logar;
- não incluir em audit metadata sem necessidade;
- não usar em seed;
- limitar responses;
- aplicar autorização;
- definir retenção antes de produção.

---

## 24. Retenção

### Definido

- afastamentos encerrados permanecem;
- andamentos permanecem salvo exclusão controlada;
- documentos permanecem para afastamentos encerrados;
- sessões podem ser expurgadas após prazo operacional;
- leituras de alerta podem ser limpas quando definitivamente obsoletas.

### Pendente de segurança/compliance

- prazo de retenção de documentos;
- prazo de retenção de causa/CID;
- prazo de auditoria;
- anonimização de colaborador;
- expurgo a pedido/obrigação legal;
- retenção de tombstones de documentos.

Não fixar prazo arbitrário antes dessa definição.

---

## 25. Seeds

### Base

1. catálogo de permissões;
2. role `ADMIN`;
3. associação ADMIN → todas as permissões;
4. bootstrap admin via `BOOTSTRAP_ADMIN_EMAIL`;
5. cadastros base somente se houver lista aprovada.

### Permissões seed

```text
session.access
users.read
users.manage
permissions.manage
settings.manage
employees.read
employees.manage
leaves.read
leaves.create
leaves.update
progress.read
progress.manage
documents.read
documents.upload
documents.download
documents.delete
notifications.read
notifications.read_state
dashboard.read
audit.read
```

### Papel `SMS`

Não hardcodar a matriz antes da confirmação final.

A seed não cria `SMS`, e a API bloqueia sua criação enquanto a definição formal estiver pendente. A implementação dessa matriz depende de aprovação da MCM.

### Dev/demo

Não há seed demo implementada. A seed base não cria dados operacionais nem usuários sem `BOOTSTRAP_ADMIN_EMAIL`.

---

## 26. Migrations implementadas

### `202610060001_foundation_auth`

Contém:

- users;
- external_identities;
- user_sessions;
- roles;
- permissions;
- user_roles;
- role_permissions.

### `202610060002_catalogs`

Contém:

- obras;
- funcoes;
- tipos_beneficio;
- situacoes_afastamento;
- tipos_andamento_afastamento;
- tipos_documento_afastamento.

### `202610060003_core_domain`

Contém:

- colaboradores;
- afastamentos;
- afastamento_andamentos;
- afastamento_documentos.

### `202610060004_operational_state`

Contém:

- notification_reads;
- audit_logs;
- índices compostos iniciais.

### Evolução

As quatro migrations estão versionadas e aplicadas no ambiente local, sem drift. Novas alterações exigem nova migration revisada; não modificar nem recriar migrations já aplicadas.

---

## 27. Continuidade do schema e importação de dados

### Schema

A base usa as migrations versionadas de `backend/prisma/migrations`. Para subir
um ambiente, aplicar `prisma migrate deploy`. Para uma alteração de modelo em
desenvolvimento, gerar e revisar uma nova migration com `prisma migrate dev`.
Não recriar migrations já aplicadas nem resetar bancos para atualizar a base.

### Dados de desenvolvimento

Não existe seed demo nesta entrega. A seed base atende somente RBAC e bootstrap
administrativo explícito, sem dados operacionais fictícios.

### Importação de dados reais

Não foi implementado importador. Uma eventual migração de dados existentes exige
inventário, aprovação, mapeamento, validação, backup, homologação e plano de
recuperação. Isso é independente da aplicação das migrations existentes.

---

## 28. Prisma

Estrutura:

```text
backend/prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

Comandos:

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npx prisma studio
```

Compartilhado/produção:

```bash
npx prisma migrate deploy
```

Não usar `db push` como mecanismo normal de evolução.

---

## 29. Concorrência

Nesta base, não adicionar version column global sem caso de uso.

Conflitos conhecidos podem ser tratados por:

- estado atual;
- checks no service;
- transação;
- unique constraint.

Se edição concorrente real se tornar problema, adicionar optimistic locking conscientemente.

---

## 30. Transações

Usar transação para:

- substituir roles de usuário;
- substituir permissions de role;
- mutations que precisem de múltiplas escritas atômicas;
- operações críticas de domínio quando aplicável.

Storage não participa de transação PostgreSQL.

Uploads usam compensação explícita.

---

## 31. Dashboard e performance

Consultas iniciais podem usar agregações Prisma/SQL.

Evitar N+1 em:

- listagem de afastamentos;
- histórico de colaborador;
- dashboard;
- usuários/papéis.

Não pré-otimizar com cache.

Quando houver dataset representativo:

- medir;
- usar `EXPLAIN ANALYZE` para consultas críticas;
- revisar índices compostos.

---

## 32. Backup/restore

Alinhado à infraestrutura:

- backup diário em produção;
- retenção mínima inicial 14 dias;
- backup antes de migration crítica;
- restore testado antes do go-live;
- storage incluído na estratégia de recuperação.

---

## 33. Maturidade

O schema Prisma, relações, índices, constraints e quatro migrations estão
implementados. A auditoria local confirmou migrations aplicadas e ausência de
drift entre schema e banco.

A seed executada duas vezes manteve 20 permissões, um papel `ADMIN`, 20 grants e
zero usuários sem bootstrap configurado, confirmando idempotência dessa base.
Nenhum usuário, perfil SMS ou dado operacional foi inventado.

Os fluxos autenticados, consultas com dados corporativos representativos,
retenção e procedimentos de backup/restore de produção ainda precisam de
homologação. Ver [handoff](../handoff/HANDOFF_MILENA.md) e
[pendências](../handoff/PENDENCIAS_HANDOFF.md).

---

## 34. Critérios de aceite

- [x] PostgreSQL/Prisma definidos;
- [x] UUID definido;
- [x] single-tenant definido;
- [x] entidades estruturantes mapeadas;
- [x] entidades de domínio mapeadas;
- [x] sessão mapeada;
- [x] RBAC mapeado;
- [x] histórico de colaborador suportado;
- [x] contexto obra/função do afastamento preservado;
- [x] leitura de alerta por usuário suportada;
- [x] audit log implementado;
- [x] soft delete por entidade decidido;
- [x] dados sensíveis classificados;
- [x] índices principais implementados;
- [x] constraints principais implementadas;
- [x] seed base implementada;
- [x] migrations implementadas;
- [x] retenção indefinida está explicitamente pendente;
- [x] schema Prisma implementado;
- [x] quatro migrations executadas e sem drift;
- [x] seed base executada duas vezes sem duplicação;
- [x] integridade estrutural validada por migrations e constraints;
- [ ] smoke manual autenticado dos fluxos de domínio — depende da App Registration.


---

## Escopo de qualidade desta entrega

Não haverá seed específica para testes automatizados nem suíte de testes de banco nesta fase. A auditoria aplicou/verificou migrations, executou a seed e comparou o banco com o schema sem resetar dados. O smoke autenticado da aplicação continua pendente.
