# 10 — APIs e Contratos — MCM Gestão de Afastados

**Versão:** 1.0  
**Data:** 05/10/2026  
**Status:** Contratos validados para implementação  
**Maturidade:** Nível 3 — contratos validados  
**Base local:** `http://localhost:3000/api/v1`

---

## 1. Objetivo

Definir o contrato oficial entre o frontend, o backend e o banco da MCM Gestão de Afastados.

Nenhuma page ou componente deve inferir formato de banco ou provider. O frontend consome apenas os contratos descritos aqui.

---

## 2. API Contract Blueprint

```yaml
api_contract_blueprint:
  project:
    name: "MCM Gestão de Afastados"
    version: "v1"
    base_path: "/api/v1"
    local_base_url: "http://localhost:3000/api/v1"
    production_base_url: "PENDENTE"
    status: "validado_para_implementacao"

  protocol:
    style: "REST"
    format: "JSON UTF-8"
    naming: "camelCase"

  authentication:
    provider: "Microsoft Entra ID"
    session: "Cookie HttpOnly + sessão server-side"
    credentials_include: true
    local_password_endpoints: false

  authorization:
    backend_authority: true
    permission_per_endpoint: true

  pagination:
    strategy: "page-based"
    default_page: 1
    default_per_page: 10
    max_per_page: 100

  request_id:
    header: "X-Request-Id"
    generated_by_backend_when_absent: true

  documentation:
    openapi_required: true
    api_reference_required: true
    contract_tests_required: false

  specialized:
    webhooks: false
    public_forms: false
    ai: false
    realtime: false
```

---

## 3. Convenções globais

### Headers

Request JSON:

```http
Accept: application/json
Content-Type: application/json
```

Sessão:

```text
credentials: include
```

Request ID:

```http
X-Request-Id: opcional no request
```

Backend deve gerar quando ausente.

### Identificadores

IDs expostos são strings UUID.

### Datas

Date-only:

```text
YYYY-MM-DD
```

Timestamp:

```text
ISO 8601 UTC
```

### Campos

Contratos externos em `camelCase`.

---

## 4. Formato de sucesso

### Item

```json
{
  "data": {
    "id": "..."
  }
}
```

### Lista paginada

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "perPage": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

### DELETE sem payload

```text
204 No Content
```

---

## 5. Erro oficial

```json
{
  "status": 422,
  "code": "VALIDATION_ERROR",
  "message": "Existem campos inválidos.",
  "fieldErrors": [
    {
      "field": "campo",
      "message": "Mensagem amigável."
    }
  ],
  "requestId": "req_..."
}
```

`fieldErrors` é opcional.

### Códigos HTTP

| Status | Uso |
|---:|---|
| 200 | sucesso |
| 201 | criado |
| 204 | sucesso sem body |
| 302 | redirects técnicos de OIDC |
| 400 | request malformado |
| 401 | sem sessão / sessão expirada |
| 403 | sem permissão |
| 404 | recurso não encontrado |
| 409 | duplicidade ou conflito de estado |
| 422 | validação/regra de negócio |
| 429 | rate limit |
| 500 | erro interno |
| 503 | dependência indisponível |

---

## 6. Paginação

Query padrão:

```text
?page=1&perPage=10
```

Permitidos:

```text
10, 20, 50, 100
```

Filtros e paginação são enviados juntos e permanecem na query key do frontend.

---

## 7. Ordenação

Padrão:

```text
sortBy
sortDirection=asc|desc
```

Cada endpoint possui allowlist.

Parâmetro desconhecido deve ser rejeitado com erro de validação quando puder indicar typo/uso incorreto.

---

## 8. Mapa endpoint por endpoint

| ID | Método | Endpoint | Permissão | Finalidade | Origem |
|---|---|---|---|---|---|
| API-AUTH-001 | `GET` | `/api/v1/auth/login` | `público` | Iniciar login Microsoft | FUNC-001 |
| API-AUTH-002 | `GET` | `/api/v1/auth/callback` | `público` | Receber callback OIDC, validar identidade e criar sessão | FUNC-001 |
| API-AUTH-003 | `GET` | `/api/v1/auth/me` | `session.access` | Retornar usuário, papéis e permissões atuais | FUNC-001 |
| API-AUTH-004 | `POST` | `/api/v1/auth/logout` | `session.access` | Revogar sessão e limpar cookie | FUNC-001 |
| API-USR-001 | `GET` | `/api/v1/usuarios` | `users.read` | Listar usuários locais | FUNC-002 |
| API-USR-002 | `GET` | `/api/v1/usuarios/:id` | `users.read` | Consultar usuário e autorização | FUNC-002 |
| API-USR-003 | `POST` | `/api/v1/usuarios` | `users.manage` | Pré-cadastrar usuário corporativo | FUNC-002 |
| API-USR-004 | `PATCH` | `/api/v1/usuarios/:id` | `users.manage` | Atualizar dados locais permitidos | FUNC-002 |
| API-USR-005 | `POST` | `/api/v1/usuarios/:id/ativar` | `users.manage` | Ativar acesso local | FUNC-002 |
| API-USR-006 | `POST` | `/api/v1/usuarios/:id/inativar` | `users.manage` | Inativar acesso e revogar sessões | FUNC-002 |
| API-USR-007 | `PUT` | `/api/v1/usuarios/:id/papeis` | `permissions.manage` | Substituir conjunto de papéis do usuário | FUNC-002 |
| API-ACL-001 | `GET` | `/api/v1/papeis` | `users.read` | Listar papéis | FUNC-002 |
| API-ACL-002 | `POST` | `/api/v1/papeis` | `permissions.manage` | Criar papel configurável | FUNC-002 |
| API-ACL-003 | `PATCH` | `/api/v1/papeis/:id` | `permissions.manage` | Editar/inativar papel | FUNC-002 |
| API-ACL-004 | `PUT` | `/api/v1/papeis/:id/permissoes` | `permissions.manage` | Substituir permissões de um papel | FUNC-002 |
| API-ACL-005 | `GET` | `/api/v1/permissoes` | `permissions.manage` | Listar catálogo de capacidades | FUNC-002 |
| API-CFG-OBR-001 | `GET` | `/api/v1/obras` | `settings.manage` | Listar obras | FUNC-003 |
| API-CFG-OBR-002 | `POST` | `/api/v1/obras` | `settings.manage` | Criar registro em obras | FUNC-003 |
| API-CFG-OBR-003 | `PATCH` | `/api/v1/obras/:id` | `settings.manage` | Editar ou ativar/inativar registro em obras | FUNC-003 |
| API-CFG-FUN-001 | `GET` | `/api/v1/funcoes` | `settings.manage` | Listar funcoes | FUNC-003 |
| API-CFG-FUN-002 | `POST` | `/api/v1/funcoes` | `settings.manage` | Criar registro em funcoes | FUNC-003 |
| API-CFG-FUN-003 | `PATCH` | `/api/v1/funcoes/:id` | `settings.manage` | Editar ou ativar/inativar registro em funcoes | FUNC-003 |
| API-CFG-BEN-001 | `GET` | `/api/v1/tipos-beneficio` | `settings.manage` | Listar tipos-beneficio | FUNC-003 |
| API-CFG-BEN-002 | `POST` | `/api/v1/tipos-beneficio` | `settings.manage` | Criar registro em tipos-beneficio | FUNC-003 |
| API-CFG-BEN-003 | `PATCH` | `/api/v1/tipos-beneficio/:id` | `settings.manage` | Editar ou ativar/inativar registro em tipos-beneficio | FUNC-003 |
| API-CFG-SIT-001 | `GET` | `/api/v1/situacoes-afastamento` | `settings.manage` | Listar situacoes-afastamento | FUNC-003 |
| API-CFG-SIT-002 | `POST` | `/api/v1/situacoes-afastamento` | `settings.manage` | Criar registro em situacoes-afastamento | FUNC-003 |
| API-CFG-SIT-003 | `PATCH` | `/api/v1/situacoes-afastamento/:id` | `settings.manage` | Editar ou ativar/inativar registro em situacoes-afastamento | FUNC-003 |
| API-CFG-AND-001 | `GET` | `/api/v1/tipos-andamento` | `settings.manage` | Listar tipos-andamento | FUNC-003 |
| API-CFG-AND-002 | `POST` | `/api/v1/tipos-andamento` | `settings.manage` | Criar registro em tipos-andamento | FUNC-003 |
| API-CFG-AND-003 | `PATCH` | `/api/v1/tipos-andamento/:id` | `settings.manage` | Editar ou ativar/inativar registro em tipos-andamento | FUNC-003 |
| API-CFG-DOC-001 | `GET` | `/api/v1/tipos-documento` | `settings.manage` | Listar tipos-documento | FUNC-003 |
| API-CFG-DOC-002 | `POST` | `/api/v1/tipos-documento` | `settings.manage` | Criar registro em tipos-documento | FUNC-003 |
| API-CFG-DOC-003 | `PATCH` | `/api/v1/tipos-documento/:id` | `settings.manage` | Editar ou ativar/inativar registro em tipos-documento | FUNC-003 |
| API-COL-001 | `GET` | `/api/v1/colaboradores` | `employees.read` | Listar/pesquisar colaboradores | FUNC-004 |
| API-COL-002 | `GET` | `/api/v1/colaboradores/:id` | `employees.read` | Consultar colaborador | FUNC-004 |
| API-COL-003 | `POST` | `/api/v1/colaboradores` | `employees.manage` | Criar colaborador | FUNC-004 |
| API-COL-004 | `PATCH` | `/api/v1/colaboradores/:id` | `employees.manage` | Editar colaborador | FUNC-004 |
| API-COL-005 | `POST` | `/api/v1/colaboradores/:id/ativar` | `employees.manage` | Reativar colaborador | FUNC-004 |
| API-COL-006 | `POST` | `/api/v1/colaboradores/:id/inativar` | `employees.manage` | Inativar colaborador sem apagar histórico | FUNC-004 |
| API-COL-007 | `GET` | `/api/v1/colaboradores/:id/historico` | `employees.read + leaves.read` | Consultar histórico consolidado | FUNC-005 |
| API-AFA-001 | `GET` | `/api/v1/afastamentos` | `leaves.read` | Listar com filtros, ordenação e paginação | FUNC-006 |
| API-AFA-002 | `GET` | `/api/v1/afastamentos/:id` | `leaves.read` | Detalhe do afastamento | FUNC-008 |
| API-AFA-003 | `POST` | `/api/v1/afastamentos` | `leaves.create` | Criar afastamento | FUNC-007 |
| API-AFA-004 | `PATCH` | `/api/v1/afastamentos/:id` | `leaves.update` | Editar/encerrar por situação | FUNC-007 |
| API-AND-001 | `GET` | `/api/v1/afastamentos/:id/andamentos` | `progress.read` | Listar timeline | FUNC-009 |
| API-AND-002 | `POST` | `/api/v1/afastamentos/:id/andamentos` | `progress.manage` | Criar andamento | FUNC-009 |
| API-AND-003 | `PATCH` | `/api/v1/andamentos/:id` | `progress.manage` | Editar andamento | FUNC-009 |
| API-AND-004 | `DELETE` | `/api/v1/andamentos/:id` | `progress.manage` | Excluir logicamente andamento com auditoria | FUNC-009 |
| API-DOC-001 | `GET` | `/api/v1/afastamentos/:id/documentos` | `documents.read` | Listar documentos do afastamento | FUNC-010 |
| API-DOC-002 | `POST` | `/api/v1/afastamentos/:id/documentos` | `documents.upload` | Enviar documento privado | FUNC-010 |
| API-DOC-003 | `GET` | `/api/v1/documentos/:id/download` | `documents.download` | Baixar documento autorizado | FUNC-010 |
| API-DOC-004 | `DELETE` | `/api/v1/documentos/:id` | `documents.delete` | Excluir binário e manter tombstone/auditoria conforme política | FUNC-010 |
| API-NOT-001 | `GET` | `/api/v1/notificacoes` | `notifications.read` | Obter alertas aplicáveis e leitura do usuário | FUNC-011 |
| API-NOT-002 | `PUT` | `/api/v1/notificacoes/:id/leitura` | `notifications.read_state` | Marcar alerta derivado como lido para usuário atual | FUNC-011 |
| API-DAS-001 | `GET` | `/api/v1/dashboard` | `dashboard.read` | Obter indicadores, séries e prioridades | FUNC-012 |
| API-AUD-001 | `GET` | `/api/v1/auditoria` | `audit.read` | Consultar trilha de auditoria | RF-003/RP-014 |
| API-HLT-001 | `GET` | `/health` | `público` | Liveness do backend | RNF |
| API-HLT-002 | `GET` | `/health/db` | `interno/operacional` | Readiness do banco | RNF |

---

## 9. Autenticação Microsoft

### API-AUTH-001 — iniciar login

```http
GET /api/v1/auth/login
```

Auth: não.

Resposta: `302`.

Backend cria proteção de `state` e `nonce` e redireciona ao endpoint Microsoft.

Query opcional:

```text
returnTo
```

`returnTo` só pode apontar para rota interna allowlisted, evitando open redirect.

### API-AUTH-002 — callback

```http
GET /api/v1/auth/callback
```

Auth prévia: não.

Entrada: parâmetros OIDC.

Backend:

- valida `state`;
- troca authorization code;
- valida nonce/issuer/audience/tenant;
- lê subject/oid;
- normaliza e-mail;
- valida domínio;
- valida usuário local ativo;
- vincula identidade externa quando autorizado;
- cria sessão;
- grava cookie;
- redireciona.

Erros de login devem redirecionar para `/login` com código amigável, sem expor token ou detalhe técnico.

### API-AUTH-003 — sessão atual

```http
GET /api/v1/auth/me
```

Response:

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "name": "Nome",
      "email": "usuario@mcm.eng.br"
    },
    "roles": ["ADMIN"],
    "permissions": ["session.access"]
  }
}
```

Não retornar token Microsoft.

### API-AUTH-004 — logout

```http
POST /api/v1/auth/logout
```

Response:

```text
204
```

Backend revoga sessão e expira cookie.

---

## 10. Usuários e acessos

### Criar/pré-cadastrar usuário

```http
POST /api/v1/usuarios
```

Permission:

```text
users.manage
```

Body:

```json
{
  "name": "Nome",
  "email": "usuario@mcm.eng.br",
  "isActive": true
}
```

Regras:

- e-mail normalizado;
- domínio corporativo permitido;
- duplicidade retorna 409;
- criação não autentica usuário;
- criação não cria conta Microsoft.

### Atualizar usuário

```http
PATCH /api/v1/usuarios/:id
```

Campos permitidos:

```json
{
  "name": "Nome ajustado"
}
```

Status usa ações explícitas `ativar`/`inativar`.

### Papéis do usuário

```http
PUT /api/v1/usuarios/:id/papeis
```

Body:

```json
{
  "roleIds": ["uuid"]
}
```

Substitui conjunto de papéis numa transação.

### Inativação

```http
POST /api/v1/usuarios/:id/inativar
```

Além de inativar, revoga sessões correntes.

---

## 11. Papéis e permissões

### Criar papel

```http
POST /api/v1/papeis
```

```json
{
  "code": "SMS",
  "name": "SMS",
  "description": "Perfil operacional",
  "isActive": true
}
```

O conteúdo final do papel `SMS` permanece configurável.

### Associar permissões

```http
PUT /api/v1/papeis/:id/permissoes
```

```json
{
  "permissionIds": ["uuid"]
}
```

Não aceitar códigos de permissão inexistentes.

---

## 12. Cadastros auxiliares

Padrão aplicado a:

```text
/obras
/funcoes
/tipos-beneficio
/situacoes-afastamento
/tipos-andamento
/tipos-documento
```

### Listagem

```http
GET /api/v1/obras?ativo=true&page=1&perPage=10&search=
```

### Criação

```http
POST /api/v1/obras
```

```json
{
  "nome": "Obra A"
}
```

### Atualização/inativação

```http
PATCH /api/v1/obras/:id
```

```json
{
  "nome": "Obra A",
  "ativo": false
}
```

Situação acrescenta:

```json
{
  "nome": "Em afastamento",
  "classificacao": "ATIVO",
  "ativo": true
}
```

Classificações permitidas:

```text
ATIVO
ENCERRADO
APOSENTADO
```

---

## 13. Colaboradores

### Listagem

```http
GET /api/v1/colaboradores
```

Query:

```text
page
perPage
search
obraId
funcaoId
ativo
sortBy
sortDirection
```

Ordenáveis inicialmente:

```text
nome
codigoCorporativo
createdAt
```

### Criação

```http
POST /api/v1/colaboradores
```

```json
{
  "codigoCorporativo": "12345",
  "nome": "Colaborador",
  "obraId": "uuid",
  "funcaoId": "uuid",
  "contato": "opcional"
}
```

### Atualização

```http
PATCH /api/v1/colaboradores/:id
```

```json
{
  "nome": "Colaborador",
  "obraId": "uuid",
  "funcaoId": "uuid",
  "contato": "opcional"
}
```

### Histórico

```http
GET /api/v1/colaboradores/:id/historico?page=1&perPage=10
```

Response:

```json
{
  "data": {
    "colaborador": {
      "id": "uuid",
      "codigoCorporativo": "12345",
      "nome": "Colaborador"
    },
    "afastamentos": []
  },
  "meta": {
    "page": 1,
    "perPage": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

---

## 14. Afastamentos

### Listagem

```http
GET /api/v1/afastamentos
```

Query:

```text
page
perPage
search
colaboradorId
obraId
funcaoId
tipoBeneficioId
situacaoId
sortBy
sortDirection
```

Ordenáveis inicialmente:

```text
dataAfastamento
dataRetornoPrevista
dataFimBeneficio
createdAt
```

### Criar

```http
POST /api/v1/afastamentos
```

```json
{
  "colaboradorId": "uuid",
  "dataAfastamento": "2026-10-05",
  "situacaoId": "uuid",
  "tipoBeneficioId": "uuid ou null",
  "dataFimBeneficio": "2026-11-05 ou null",
  "dataRetornoPrevista": "2026-11-06 ou null",
  "dataRetornoEfetiva": null,
  "obraId": "uuid",
  "funcaoId": "uuid",
  "causaCid": "opcional",
  "observacoes": "opcional"
}
```

### Atualizar/encerrar

```http
PATCH /api/v1/afastamentos/:id
```

Payload parcial com os mesmos campos editáveis.

Não existe DELETE operacional para afastamento.

### Detalhe

```http
GET /api/v1/afastamentos/:id
```

Response deve entregar os dados principais e referências necessárias à tela.

Timeline e documentos podem ser carregados em endpoints separados para invalidar/cachear independentemente.

---

## 15. Andamentos

### Criar

```http
POST /api/v1/afastamentos/:id/andamentos
```

```json
{
  "dataAndamento": "2026-10-05",
  "tipoAndamentoId": "uuid",
  "descricao": "Descrição",
  "proximaAcao": "opcional",
  "dataProximaAcao": "2026-10-20 ou null"
}
```

### Editar

```http
PATCH /api/v1/andamentos/:id
```

### Excluir

```http
DELETE /api/v1/andamentos/:id
```

Response:

```text
204
```

A exclusão é lógica e auditada.

---

## 16. Documentos

### Listar

```http
GET /api/v1/afastamentos/:id/documentos
```

### Upload

```http
POST /api/v1/afastamentos/:id/documentos
Content-Type: multipart/form-data
```

Partes:

```text
file          obrigatório
tipoDocumentoId obrigatório
andamentoId   opcional
```

Limite:

```text
10 MB
```

Tipos:

```text
application/pdf
image/jpeg
image/png
application/msword
application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

Resposta:

```json
{
  "data": {
    "id": "uuid",
    "originalName": "documento.pdf",
    "mimeType": "application/pdf",
    "sizeBytes": 123456,
    "createdAt": "2026-10-05T12:00:00.000Z"
  }
}
```

Nunca retornar storage key/caminho interno.

### Download

```http
GET /api/v1/documentos/:id/download
```

Retorna stream/binário com headers seguros.

### Delete

```http
DELETE /api/v1/documentos/:id
```

Response:

```text
204
```

---

## 17. Notificações

### Listagem

```http
GET /api/v1/notificacoes
```

Query opcional:

```text
status=all|unread
```

Response:

```json
{
  "data": [
    {
      "id": "alert_opaque",
      "type": "BENEFICIO_VENCIDO",
      "title": "Benefício vencido",
      "message": "Mensagem de interface",
      "isOverdue": true,
      "isRead": false,
      "dueDate": "2026-10-01",
      "context": {
        "afastamentoId": "uuid",
        "colaboradorId": "uuid"
      }
    }
  ],
  "meta": {
    "unreadCount": 1
  }
}
```

Não expor CIDs/observações no alerta.

### Marcar leitura

```http
PUT /api/v1/notificacoes/:id/leitura
```

```json
{
  "data": {
    "id": "alert_opaque",
    "isRead": true,
    "readAt": "2026-10-05T12:00:00.000Z"
  }
}
```

---

## 18. Dashboard

```http
GET /api/v1/dashboard
```

Response de referência:

```json
{
  "data": {
    "indicators": {
      "activeLeaves": 0,
      "expiredBenefits": 0,
      "expectedReturnsNext15Days": 0
    },
    "activeByObra": [
      {
        "obraId": "uuid",
        "obraNome": "Obra",
        "total": 0
      }
    ],
    "newLeavesByMonth": [
      {
        "month": "2026-10",
        "total": 0
      }
    ],
    "duration": {
      "status": "pending_final_validation",
      "series": []
    },
    "priorities": []
  }
}
```

`duration.status` deixa explícito que a fórmula/apresentação ainda depende de validação final; quando a regra for fechada, o contrato será atualizado antes de produção.

---

## 19. Auditoria

```http
GET /api/v1/auditoria
```

Permission:

```text
audit.read
```

Query:

```text
page
perPage
actorUserId
entityType
entityId
action
dateFrom
dateTo
sortDirection
```

Nunca retornar campos sanitizados removidos nem conteúdo sensível original.

---

## 20. Filtros e índices esperados

| Endpoint | Filtros principais | Suporte de banco |
|---|---|---|
| `/usuarios` | search, ativo, role | email/name/status |
| `/obras` e cadastros | search, ativo | nome/ativo |
| `/colaboradores` | search, obraId, funcaoId, ativo | nome/código/FKs/ativo |
| `/afastamentos` | colaborador, obra, função, benefício, situação | FKs + datas |
| `/auditoria` | ator, entidade, ação, período | actor/entity/createdAt |
| `/notificacoes` | unread | leitura por userId + alertKey |

---

## 21. Autorização por endpoint

Regras gerais:

- `401`: nenhuma sessão válida;
- `403`: sessão válida, capacidade insuficiente;
- ações administrativas exigem permissão explícita;
- `documents.delete` é separada de upload/download;
- `notifications.read_state` sempre atua somente sobre o usuário atual;
- o frontend não envia `userId` para marcar leitura;
- não existe `tenantId` nos contratos.

---

## 22. Dados sensíveis

Nunca expor automaticamente:

- `tokenHash`;
- secrets;
- storageKey;
- metadados internos de OIDC;
- payload bruto do provider;
- audit metadata não allowlisted.

`causaCid` e observações sensíveis somente aparecem para endpoints/usuários autorizados a consultar o afastamento.

---

## 23. OpenAPI

Obrigatório para esta aplicação devido à criticidade e ao handoff.

Local esperado:

```text
backend/openapi/openapi.yaml
```

A especificação deve refletir este documento, não criar endpoints novos.

Pode ser servida em desenvolvimento/homologação por rota protegida ou usada apenas como artefato estático.

---

## 24. Validação dos contratos nesta entrega

Testes automatizados de contrato não fazem parte do escopo atual.

Validar os contratos por:

- rastreabilidade entre frontend, API, backend e banco;
- OpenAPI;
- validação manual dos endpoints;
- typecheck/build;
- smoke manual dos fluxos principais.

---

## 25. Matriz Frontend → API → Backend → Banco

| Endpoint | Funcionalidade | Contrato | Método | Permissão | Banco |
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

## 26. Breaking changes

Enquanto a API estiver apenas na branch técnica e sem consumidores externos, ajustes compatíveis com a implementação podem ocorrer mantendo `/api/v1`.

Após homologação:

Breaking changes em payload/path/semântica exigem:

1. registro de decisão;
2. atualização de OpenAPI;
3. atualização do frontend;
4. atualização de testes;
5. avaliação de versão quando incompatível.

---

## 27. Não aplicável nesta base

- API pública externa;
- Bearer token para terceiros;
- webhook;
- import/export de planilhas;
- e-mail;
- SSE/WebSocket;
- IA;
- multi-tenant.

---

## 28. Maturidade

**Nível 3 — contratos validados.**

Motivos:

- recursos definidos;
- métodos e paths definidos;
- auth definida;
- permissões definidas;
- paginação definida;
- payloads críticos definidos;
- responses/erros definidos;
- banco correspondente definido no documento 11;
- testes de contrato mapeados.

Para Nível 4:

- OpenAPI gerado;
- implementação conferida;
- contratos testados.

---

## 29. Critérios de aceite

- [x] `/api/v1` definido;
- [x] REST/JSON/camelCase definidos;
- [x] Microsoft login especializado;
- [x] sem endpoints de senha local;
- [x] response padrão definido;
- [x] error padrão definido;
- [x] requestId definido;
- [x] paginação 10 por padrão;
- [x] filtros principais definidos;
- [x] permissões por endpoint definidas;
- [x] upload definido;
- [x] dashboard definido;
- [x] alertas/leitura definidos;
- [x] matriz de rastreabilidade definida;
- [x] OpenAPI obrigatório;
- [x] validação manual dos contratos definida;
- [ ] URL de produção;
- [ ] OpenAPI implementado;
- [ ] contratos validados manualmente contra código executável.
