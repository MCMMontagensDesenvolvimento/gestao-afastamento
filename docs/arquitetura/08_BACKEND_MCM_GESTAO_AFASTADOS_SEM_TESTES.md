# 08 — Backend — MCM Gestão de Afastados

**Versão:** 1.0  
**Data:** 05/10/2026  
**Status:** Blueprint aprovado para implementação  
**Maturidade:** Nível 3 — Backend planejado e pronto para construção  
**Branch de referência:** `arquitetura/base-integrada`

---

## 1. Objetivo

Definir a implementação server-side da MCM Gestão de Afastados, transformando as funcionalidades e decisões arquiteturais já validadas em módulos, responsabilidades, validações, policies, repositories, integrações e critérios técnicos claros.

O backend será a autoridade final de:

- autenticação;
- autorização;
- regras de negócio;
- integridade;
- validações contextuais;
- persistência;
- auditoria;
- acesso a documentos;
- cálculo de alertas;
- cálculos do dashboard.

O frontend não acessará banco, storage ou provedor de identidade diretamente.

---

## 2. Diagnóstico atual

O repositório possui `/backend`, mas ainda não contém aplicação backend funcional.

O frontend exportado possui comportamento de produto suficiente para orientar a construção do backend, porém a persistência atual ainda está acoplada ao navegador/infraestrutura temporária.

### Lacunas server-side atuais

- API de aplicação inexistente;
- autenticação corporativa inexistente;
- sessão de aplicação inexistente;
- autorização server-side inexistente;
- Prisma definitivo inexistente;
- migrations definitivas inexistentes;
- storage definitivo inexistente;
- audit log inexistente;
- paginação server-side inexistente;
- healthchecks definitivos inexistentes.

---

## 3. Backend Blueprint

```yaml
backend_blueprint:
  project:
    name: "MCM Gestão de Afastados"
    execution_mode: "Frontend validado exportado"
    current_status: "não iniciado"
    target_for_handoff: "integrado"

  stack:
    runtime: "Node.js LTS"
    framework: "Express"
    language: "TypeScript strict"
    validation: "Zod"
    orm: "Prisma"
    database: "PostgreSQL"
    package_manager: "npm"
    logger: "Pino + pino-http"
    automated_tests: "fora do escopo desta entrega"

  architecture:
    style: "monólito modular"
    module_pattern: "routes → controller → service → repository"
    controllers_thin: true
    repository_layer: true
    direct_prisma_from_controller: false

  auth:
    provider: "Microsoft Entra ID"
    protocol: "OIDC/OAuth2 Authorization Code"
    local_passwords: false
    application_session: "server-side PostgreSQL"
    cookie: "HttpOnly opaco"
    bootstrap_endpoint: "/api/v1/auth/me"
    allowed_email_domains:
      - "mcm.eng.br"
      - "mcmmontagens.com.br"

  authorization:
    strategy: "RBAC por capacidades"
    backend_authority: true
    abac_initial: false

  persistence:
    soft_delete: "selecionado por entidade"
    audit_required: true
    multi_tenant: false

  storage:
    abstraction: "DocumentStorage"
    development: "filesystem privado"
    production: "S3-compatible privado preferencial"
    provider: "pendente"

  async:
    redis: false
    queue: false
    worker: false

  api:
    base_path: "/api/v1"
    format: "REST JSON UTF-8"
    pagination: "page-based"
    default_per_page: 10

  operations:
    health: "/health"
    health_db: "/health/db"
    request_id: true
    logs_json: true
```

---

## 4. Estrutura alvo do backend

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
│   │   ├── env.ts
│   │   ├── cors.ts
│   │   ├── cookies.ts
│   │   └── rate-limit.ts
│   ├── modules/
│   │   ├── auth/
│   │   ├── usuarios/
│   │   ├── acessos/
│   │   ├── configuracoes/
│   │   ├── colaboradores/
│   │   ├── afastamentos/
│   │   ├── andamentos/
│   │   ├── documentos/
│   │   ├── notificacoes/
│   │   ├── dashboard/
│   │   └── auditoria/
│   ├── infrastructure/
│   │   ├── database/
│   │   ├── identity/
│   │   ├── storage/
│   │   └── logger/
│   ├── shared/
│   │   ├── errors/
│   │   ├── http/
│   │   ├── middlewares/
│   │   ├── security/
│   │   ├── utils/
│   │   └── types/
│   └── server.ts
├── Dockerfile.dev
├── Dockerfile.prod
├── .dockerignore
├── .env.example
├── package.json
├── package-lock.json
└── tsconfig.json
```

---

## 5. Padrão por módulo

Cada módulo usa, quando necessário:

```text
{modulo}/
├── {modulo}.routes.ts
├── {modulo}.controller.ts
├── {modulo}.service.ts
├── {modulo}.repository.ts
├── {modulo}.schema.ts
├── {modulo}.types.ts
├── {modulo}.policy.ts
├── {modulo}.mapper.ts
└── index.ts
```

### Responsabilidade por camada

| Camada | Responsabilidade |
|---|---|
| route | método, path, middlewares, policy |
| controller | HTTP in/out; sem regra de negócio |
| service | regra de negócio e orquestração |
| repository | Prisma e persistência |
| schema | Zod para params/query/body |
| policy | autorização contextual |
| mapper | DTO público seguro |
| types | tipos do módulo |

---

## 6. Mapa de módulos

| Módulo | Tipo | Responsabilidade | Entidades principais | Capacidades |
|---|---|---|---|---|
| `auth` | Estrutural | Autenticação Microsoft, vínculo da identidade e sessão local | User, ExternalIdentity, UserSession | `público + autenticado` |
| `usuarios` | Administrativo | Usuários locais, status e pré-cadastro | User, UserRole | `users.read / users.manage` |
| `acessos` | Administrativo | Papéis, permissões e associações | Role, Permission, UserRole, RolePermission | `permissions.manage` |
| `configuracoes` | Domínio | Cadastros auxiliares | Obra, Funcao, TipoBeneficio, SituacaoAfastamento, TipoAndamento, TipoDocumento | `settings.manage` |
| `colaboradores` | Domínio | Cadastro, edição, inativação e histórico consolidado | Colaborador | `employees.read / employees.manage` |
| `afastamentos` | Domínio | Listagem, criação, edição, detalhe e encerramento por situação | Afastamento | `leaves.read/create/update` |
| `andamentos` | Domínio | Linha do tempo e próxima ação | AfastamentoAndamento | `progress.read / progress.manage` |
| `documentos` | Domínio | Metadados, upload, download e exclusão controlada | AfastamentoDocumento | `documents.*` |
| `notificacoes` | Domínio | Alertas derivados e leitura persistente por usuário | NotificationRead + consultas de domínio | `notifications.read / notifications.read_state` |
| `dashboard` | Domínio | Indicadores e agregações oficiais | Afastamento + cadastros relacionados | `dashboard.read` |
| `auditoria` | Técnico | Trilha de ações críticas sanitizada | AuditLog | `audit.read` |

---

## 7. Auth — Microsoft Entra ID

### 7.1 Não haverá autenticação local por senha

Não implementar:

- senha local;
- bcrypt para usuário final;
- `forgot-password`;
- `reset-password`;
- cadastro público;
- autoelevação do primeiro login.

### 7.2 Fluxo

```text
GET /api/v1/auth/login
→ backend gera state + nonce
→ redireciona para Microsoft

Microsoft
→ GET /api/v1/auth/callback

callback
→ validar state
→ validar nonce
→ validar issuer/tenant
→ validar identidade
→ normalizar e-mail
→ validar domínio corporativo
→ localizar usuário local
→ validar usuário ativo
→ vincular ExternalIdentity quando autorizado
→ resolver roles/permissions
→ criar UserSession
→ gravar cookie HttpOnly
→ redirecionar ao frontend

frontend
→ GET /api/v1/auth/me
```

### 7.3 Identidade

Não usar e-mail como único identificador externo permanente.

Persistir:

- provider;
- `oid`/subject;
- tenant ID;
- usuário local;
- e-mail observado no vínculo;
- timestamps.

### 7.4 Domínio

Permitidos:

```text
mcm.eng.br
mcmmontagens.com.br
```

Domínio permitido apenas habilita elegibilidade.

### 7.5 Tenant

Tenant ID(s) aceitos serão configurados em ambiente.

Se houver mais de um tenant corporativo, cada um entra em allowlist explícita.

### 7.6 Estado temporário do OIDC

`state` e `nonce` podem ser armazenados em cookie temporário assinado/seguro ou mecanismo equivalente.

Não é necessário Redis para este fluxo.

---

## 8. Sessões

### Modelo

Sessão server-side em PostgreSQL.

Cookie contém identificador aleatório opaco; o banco guarda apenas hash.

### Regras

- `HttpOnly`;
- `Secure` em homologação/produção;
- `SameSite=Lax` como direção inicial;
- expiração definida por env;
- revogação explícita no logout;
- inativação do usuário revoga sessões ativas;
- `/auth/me` valida sessão e usuário;
- sessão expirada retorna `401`.

### Limpeza

Criar mecanismo simples de limpeza de sessões expiradas/revogadas, inicialmente por comando administrativo/script periódico. Não introduzir worker só para isso.

---

## 9. Autorização

### Middleware base

```text
authenticate
requirePermission("...")
```

### Policies

Policies de módulo tratam regras contextuais que não são apenas RBAC.

Exemplos:

- valor inativo não pode ser associado a novo registro;
- usuário só marca a própria notificação como lida;
- documento precisa pertencer a afastamento acessível;
- andamento excluído não pode ser editado.

### Regra

Toda rota protegida declara capacidade.

O frontend nunca substitui a policy do backend.

---

## 10. Capacidades iniciais

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

O catálogo será seed base.

A matriz final do papel `SMS` permanece configurável; a implementação não deve hardcodar autorização por nome de papel.

---

## 11. Bootstrap administrativo

### Seed/CLI

A primeira conta administrativa usa:

```text
BOOTSTRAP_ADMIN_EMAIL
```

Fluxo de seed:

1. validar domínio;
2. criar/atualizar usuário local;
3. criar role `ADMIN` base;
4. associar todas as permissões base;
5. associar usuário à role;
6. não registrar segredo Microsoft.

O e-mail não deve permanecer hardcoded no código.

---

## 12. Configuração e validação de ambiente

Usar Zod na inicialização.

Falhar rápido se faltar env obrigatória para o modo em execução.

Grupos:

- aplicação;
- banco;
- sessão;
- Microsoft;
- storage;
- logs.

Segredos não são impressos em log.

---

## 13. Cadastros auxiliares

Recursos:

- obras;
- funções;
- tipos de benefício;
- situações de afastamento;
- tipos de andamento;
- tipos de documento.

### Regras

- criar/editar/inativar;
- sem hard delete no fluxo normal;
- históricos mantêm FK;
- forms de criação usam apenas ativos;
- edição histórica aceita referência inativa já associada;
- situação exige classificação `ATIVO`, `ENCERRADO` ou `APOSENTADO`;
- toda mutation administrativa é auditada.

---

## 14. Colaboradores

### Campos de domínio

- código corporativo;
- nome;
- obra atual;
- função atual;
- contato;
- ativo;
- sistema/origem do cadastro.

### Regras

- código corporativo único;
- CPF não exigido;
- inativação preserva afastamentos;
- frontend não gera código concorrente;
- contato permanece editável;
- futura integração corporativa entra por adapter, não dentro do controller.

---

## 15. Histórico do colaborador

`GET /api/v1/colaboradores/:id/historico`

Retorna:

- resumo do colaborador;
- afastamentos em ordem decrescente;
- classificação da situação;
- datas relevantes;
- IDs necessários para navegação.

Documentos e timeline completos continuam em endpoints próprios para respeitar permissões e evitar payload excessivo.

---

## 16. Afastamentos

### Campos funcionais

- colaborador;
- data de afastamento;
- situação;
- benefício opcional;
- fim do benefício opcional;
- retorno previsto opcional;
- retorno efetivo opcional;
- obra do caso;
- função do caso;
- causa/CID opcional;
- observações opcionais.

### Decisão histórica

`obraId` e `funcaoId` são persistidos no próprio afastamento.

Isso preserva o contexto do caso mesmo que o cadastro atual do colaborador seja alterado futuramente.

### Criação

Validar:

- colaborador existente/ativo conforme regra;
- obra/função válidas;
- situação ativa;
- benefício ativo quando informado;
- datas;
- permissão;
- referência de classificação.

### Edição

Permitir referência histórica inativa já persistida sem obrigar troca.

### Encerramento

Afastamento não é apagado.

O encerramento ocorre ao trocar a situação para uma classificação `ENCERRADO` ou `APOSENTADO`.

---

## 17. Andamentos

### Regras

- pertencem a um afastamento;
- ordenação mais recente → mais antigo;
- tipo ativo na criação;
- próxima ação e data são opcionais;
- exclusão é lógica/controlada;
- exclusão e edição são auditadas;
- itens excluídos não entram na timeline padrão.

---

## 18. Documentos

### Storage adapter

```ts
interface DocumentStorage {
  save(input: SaveDocumentInput): Promise<StoredDocument>;
  open(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
```

Implementações:

```text
LocalStorageAdapter
S3StorageAdapter
```

### Limites

- 10 MB;
- PDF;
- JPEG/JPG;
- PNG;
- DOC;
- DOCX.

Backend valida:

- extensão;
- MIME;
- tamanho;
- autorização;
- relação com afastamento;
- nome/chave segura.

### Upload consistente

Ordem recomendada:

1. validar;
2. gerar storage key;
3. gravar binário;
4. persistir metadata;
5. se metadata falhar, compensar remoção do binário;
6. auditar sucesso.

### Download

Sempre mediado por autorização backend.

Nenhuma URL pública permanente.

### Exclusão

Baseline técnica:

1. validar `documents.delete`;
2. remover binário do storage;
3. marcar metadata como excluída/tombstone;
4. registrar autor/motivo quando definido;
5. auditar.

A retenção definitiva de metadata/documentos será revisada em segurança/compliance.

---

## 19. Notificações

### Estratégia

Alertas são derivados em consulta. Não criar tabela `notifications`.

Persistir apenas leitura por usuário.

### Tipos

- benefício em até 30 dias / vencido;
- retorno em até 15 dias / vencido;
- próxima ação em até 15 dias / vencida.

### Alert ID

Backend produz um `id` opaco determinístico com base no tipo + entidade + fato de negócio relevante.

Internamente mantém `alertKey`.

Exemplo conceitual:

```text
beneficio:<afastamentoId>:<dataFimBeneficio>
retorno:<afastamentoId>:<dataRetornoPrevista>
proxima_acao:<andamentoId>:<dataProximaAcao>
```

O valor bruto da chave não precisa ser exposto.

Se a data que originou o alerta mudar, nasce um novo fingerprint e o alerta volta como não lido.

### Leitura

`NotificationRead` é única por:

```text
userId + alertKey
```

Leitura não altera a pendência de negócio.

---

## 20. Dashboard

Endpoint agregado:

```text
GET /api/v1/dashboard
```

Backend calcula:

- total de afastamentos ativos;
- benefícios vencidos;
- retornos previstos em até 15 dias;
- ativos por obra;
- novos afastamentos por mês;
- duração;
- prioridades de benefício/retorno.

### Regra

“Próxima ação vencida” não entra como KPI.

A fórmula/apresentação final de duração continuará sinalizada como ponto de validação funcional.

---

## 21. Auditoria

### Service compartilhado

A escrita pode ser centralizada em `AuditService`, chamada por services após mutation confirmada.

### Eventos mínimos

- usuário criado/alterado/ativado/inativado;
- papéis/permissões alterados;
- cadastro auxiliar alterado;
- colaborador criado/editado/inativado;
- afastamento criado/editado/encerrado;
- andamento criado/editado/excluído;
- documento enviado/excluído;
- operações administrativas relevantes.

### Dados

Audit metadata deve ser **allowlist**, não dump automático do objeto.

Não gravar:

- documento;
- conteúdo médico integral;
- cookie;
- token;
- segredo;
- payload OIDC bruto.

---

## 22. Responses e erros

### Sucesso

```json
{
  "data": {}
}
```

### Página

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

### Erro

```json
{
  "status": 422,
  "code": "VALIDATION_ERROR",
  "message": "Existem campos inválidos.",
  "fieldErrors": [
    {
      "field": "dataAfastamento",
      "message": "Informe uma data válida."
    }
  ],
  "requestId": "..."
}
```

### Status principais

- 400 malformed request;
- 401 sessão ausente/expirada;
- 403 sem capacidade;
- 404 recurso inexistente;
- 409 duplicidade/conflito de estado;
- 422 regra/validação;
- 429 rate limit;
- 500 erro interno;
- 503 dependência indisponível.

---

## 23. Paginação, filtro e ordenação

### Padrão

```text
page=1
perPage=10
```

Permitidos inicialmente:

```text
10
20
50
100
```

Máximo:

```text
100
```

Listagens crescentes fazem paginação no servidor.

Ordenação usa allowlist de campos por endpoint.

---

## 24. Datas

- data de negócio: `YYYY-MM-DD`;
- timestamp técnico: ISO 8601 UTC;
- não converter data civil usando parsing UTC ingênuo no frontend.

Timezone operacional de referência quando horário for necessário:

```text
America/Recife
```

---

## 25. Healthchecks

### Liveness

```text
GET /health
```

Não consulta Microsoft nem providers externos.

### Readiness do banco

```text
GET /health/db
```

Executa consulta leve.

---

## 26. Logs

Pino + pino-http.

Incluir quando seguro:

- requestId;
- método;
- path;
- status;
- duração;
- userId;
- evento técnico.

Não incluir:

- cookie;
- Authorization;
- tokens;
- causa/CID;
- texto médico;
- binário;
- secrets.

---

## 27. Rate limit

Aplicar principalmente em:

- `/auth/login`;
- callback quando aplicável sem quebrar OIDC;
- endpoints administrativos sensíveis;
- uploads.

A configuração final pertence à segurança, mas middleware deve existir.

---

## 28. Processamento assíncrono

Não incluir Redis/BullMQ/worker nesta base.

Reavaliar apenas quando houver:

- e-mail;
- integração pesada;
- sincronização recorrente;
- exportação grande;
- processamento de documento;
- volume que justifique.

---

## 29. Integração futura de colaboradores

Criar contrato interno:

```ts
interface EmployeeSourceAdapter {
  listChangedSince?(cursor: string | null): Promise<ExternalEmployee[]>;
  findByCorporateCode?(code: string): Promise<ExternalEmployee | null>;
}
```

Não implementar provider real enquanto contrato da fonte corporativa não existir.

---

## 30. Scripts esperados

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "prisma:generate": "prisma generate",
    "prisma:migrate:dev": "prisma migrate dev",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:seed": "prisma db seed",
    "prisma:studio": "prisma studio"
  }
}
```

---

## 31. Validação técnica desta entrega

Testes automatizados não fazem parte do escopo atual.

Validar por:

- `npm run typecheck`;
- `npm run build`;
- migrations;
- seed;
- `GET /health`;
- `GET /health/db`;
- smoke manual dos fluxos implementados;
- revisão de `git diff` antes de commit.

---

## 32. Critérios de pronto para integração

- [ ] estrutura `/backend` criada;
- [ ] npm/package-lock;
- [ ] TypeScript strict;
- [ ] env validado;
- [ ] Express inicializa;
- [ ] Prisma centralizado;
- [ ] migrations aplicam;
- [ ] seed base roda de forma idempotente;
- [ ] auth Microsoft implementada;
- [ ] sessão em PostgreSQL;
- [ ] `/auth/me`;
- [ ] logout;
- [ ] RBAC server-side;
- [ ] módulos do domínio implementados;
- [ ] paginação server-side;
- [ ] storage adapter;
- [ ] auditoria;
- [ ] Pino/requestId;
- [ ] healthchecks;
- [ ] smoke manual dos fluxos implementados concluído;
- [ ] frontend consome somente API.

---

## 33. Maturidade

### Documento

**Nível 3 — pronto para construção.**

### Código atual

**Nível 0/1 — backend ainda não implementado.**

### Meta de handoff para Milena

**Nível 3 — Backend integrado:**

- frontend consumindo API;
- auth real configurável;
- permissões;
- banco real;
- seeds;
- CRUDs;
- documentos;
- alertas;
- dashboard.

Docker, logs, migrations, smoke e revisão de segurança devem aproximá-lo do Nível 4 antes de homologação formal.

---

## 34. Handoffs

### API

Usar o documento 10 como contrato oficial.

### Banco

Usar o documento 11 para schema, índices e constraints.

### Infra

Usar o documento 12 para containers, envs, storage e deploy.

### Segurança

Aprofundar:

- OIDC;
- sessão/cookie;
- CSRF/CORS;
- LGPD;
- retenção;
- hardening de upload;
- rate limit.

### Testes

Usar os cenários deste documento como entrada mínima.


---

## Escopo de qualidade desta entrega

Não instalar nem configurar framework de testes automatizados nesta fase. A base deve permanecer organizada de modo a permitir testes futuros sem exigir refatoração estrutural.
