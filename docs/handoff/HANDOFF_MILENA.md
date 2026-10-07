# Handoff técnico — Milena

**Projeto:** MCM Gestão de Afastados  
**Branch:** `arquitetura/base-integrada`  
**Referência:** 06/10/2026

## 1. O que está sendo entregue

Base para continuidade, com frontend SPA React/Vite, backend Express, API REST
`/api/v1` e PostgreSQL/Prisma. Estão implementados autenticação Microsoft mediada
pelo backend, sessão local, RBAC, usuários, cadastros, colaboradores, afastamentos,
andamentos, documentos privados, alertas, dashboard e auditoria de operações.

O frontend já usa a API; Nginx serve seu build estático em produção. O repositório
inclui Compose dev/prod, exemplos de ambiente, quatro migrations, seed de acessos,
OpenAPI e documentação. Não há integração Apdata, envio de e-mail ou adapter S3
implementado. O KPI de duração permanece indisponível até validação da fórmula.

**Limite da validação:** login Microsoft e jornadas autenticadas dependem da App
Registration e de usuário local autorizado. Não confundir implementação com
homologação autenticada concluída. A verificação da Fase 4 está em andamento;
os resultados finais devem ser conferidos no [runbook](../runbooks/setup-local.md).

## 2. Como subir localmente

Use Git, Docker com Compose e OpenSSL. Node.js 24 LTS (mínimo 22.12) e npm 10+ são
necessários apenas para executar ferramentas fora dos containers.

1. Clone a URL do repositório fornecida pela MCM, entre na pasta e selecione a branch:

   ```bash
   git clone <URL_DO_REPOSITORIO> gestao-afastados
   cd gestao-afastados
   git switch arquitetura/base-integrada
   cp .env.example .env
   openssl rand -hex 32
   ```

2. Copie o segredo aleatório gerado para `SESSION_SECRET` no `.env` da raiz.
   Microsoft pode ficar vazia. `BOOTSTRAP_ADMIN_EMAIL` é opcional: preencha somente
   com o e-mail corporativo real autorizado a receber ADMIN. Não publique `.env`
   nem a saída de `compose config` com segredos.
3. Suba, aplique migrations e execute a seed:

   ```bash
   docker compose -f docker-compose.dev.yml config --quiet
   docker compose -f docker-compose.dev.yml up -d --build
   docker compose -f docker-compose.dev.yml exec backend npm run prisma:migrate:deploy
   docker compose -f docker-compose.dev.yml exec backend npm run prisma:seed
   docker compose -f docker-compose.dev.yml ps
   ```

4. Confira os serviços:

   ```bash
   curl -f http://localhost:3000/health
   curl -f http://localhost:3000/health/db
   curl -f http://localhost:5173/health.html
   ```

5. Abra [http://localhost:5173/login](http://localhost:5173/login). Sem configuração
   Microsoft, o botão recebe 503 amigável; rotas internas redirecionam ao login.
   O PostgreSQL local usa a porta 5432, configurável por `POSTGRES_PORT`.

O Compose injeta as variáveis do `.env` raiz: não exige criar os `.env` das camadas.
Para execução nativa, siga o [runbook](../runbooks/setup-local.md), que diferencia
`localhost` de `db` e o caminho de storage local do caminho dentro do container.
Se mudar variáveis do backend, recrie o serviço antes de executar a seed.

A seed cria as 20 capacidades base, associa-as a ADMIN e provisiona o administrador
somente quando solicitado. Não cria catálogos nem exemplos: listas vazias num banco
novo são esperadas. Após login autorizado, cadastre obras, funções, situações e
demais referências antes dos registros que dependem delas.

## 3. Estrutura do repositório

| Local                                            | Onde continuar                                                   |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| `frontend/src/routes`, `components`              | Telas, componentes, formulários e estados de interface.          |
| `frontend/src/hooks`, `services`, `lib`          | Queries, mutations, contratos de domínio, sessão e cliente HTTP. |
| `backend/src/modules`                            | Regras, autorização e persistência por módulo.                   |
| `backend/src/shared`, `infrastructure`, `config` | Erros, validação, datas, logging, adapters e envs.               |
| `backend/prisma`                                 | Schema, migrations e seed.                                       |
| `backend/openapi/openapi.yaml`                   | Métodos, payloads, respostas e capacidades da API.               |
| `docs`                                           | Produto, arquitetura, decisões, operação e este handoff.         |

Os documentos 01–03 contextualizam o produto. Para evoluir um módulo, confronte
04–12, ADRs e Decision Log com o código e a OpenAPI; exemplos candidatos de produto
não são autorização para inventar campos ou endpoints.

## 4. Fluxo frontend

```text
Page → Hook → Service → API Client → Backend
```

A entrada é `frontend/src/main.tsx`; o roteador está em `router.tsx` e a proteção em
`routes/__root.tsx`. `/login` é pública. O cliente em `lib/api/client.ts` centraliza
JSON/multipart, erros com `requestId` e `credentials: "include"`.

TanStack Query mantém o estado remoto. `lib/auth/session.ts` fornece sessão,
`can(capability)` e logout; `lib/query/keys.ts` organiza os prefixos. Preserve
invalidação dos domínios afetados por mutations, estados de UI e o Design System.
`routeTree.gen.ts` é gerado pelo plugin do roteador; não o edite manualmente.

## 5. Fluxo backend

```text
Route → Middleware → Controller → Service → Repository → Prisma
```

`src/app/routes.ts` monta os módulos. Middlewares validam sessão, capacidades e
payloads; services aplicam regras; repositories acessam Prisma. Módulos pequenos
mantêm o handler HTTP na própria rota, sem arquivo controller separado.

Erros usam `status`, `code`, `message`, `fieldErrors?` e `requestId`. Datas de
negócio permanecem `YYYY-MM-DD`; timestamps técnicos usam ISO 8601 UTC. Logs
operacionais e auditoria são distintos; não acrescente tokens, documentos ou
conteúdo clínico aos logs.

## 6. Banco e migrations

`backend/prisma/schema.prisma` define UUIDs, relações, índices, RBAC, sessões,
identidades externas, domínio, leituras e auditoria. Há quatro migrations:
`foundation_auth`, `catalogs`, `core_domain` e `operational_state`.

Em desenvolvimento, após editar o schema:

```bash
docker compose -f docker-compose.dev.yml exec backend npm run prisma:migrate:dev -- --name nome_da_mudanca
docker compose -f docker-compose.dev.yml exec backend npm run prisma:generate
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate status
```

Revise o SQL gerado e preserve migrations aplicadas. Para aplicar migrations
existentes, use `prisma:migrate:deploy`; para a seed, `prisma:seed`. As migrations
não rodam no startup. Não use reset ou `db push` como substituto de evolução
versionada. Alterações destrutivas exigem backup e plano de recuperação.

A seed é idempotente, mas reaplicá-la também restabelece capacidades base de ADMIN
e reativa o usuário informado no bootstrap. Trate essa variável como operação
administrativa explícita. Banco e documentos ficam em volumes persistentes;
atualizar dependências não exige apagá-los.

A imagem runtime do backend não inclui Prisma CLI ou `tsx`. Migrations e seed em
ambiente de implantação usam uma imagem de ferramentas do estágio `build`:

```bash
docker build --target build -f backend/Dockerfile.prod -t mcm-backend-tools:local backend
```

Após definir a rede real, um arquivo protegido com o ambiente do backend e o plano
de mudança, o job controlado pode usar o modelo abaixo. As variáveis `MCM_REDE_IMPLANTACAO`
e `MCM_ENV_BACKEND` devem apontar para recursos reais; estes comandos não são uma
instrução de deploy automático:

```bash
docker run --rm --network "$MCM_REDE_IMPLANTACAO" --env-file "$MCM_ENV_BACKEND" mcm-backend-tools:local npm run prisma:migrate:deploy
docker run --rm --network "$MCM_REDE_IMPLANTACAO" --env-file "$MCM_ENV_BACKEND" mcm-backend-tools:local npm run prisma:seed
```

O `DATABASE_URL` desse arquivo precisa alcançar o banco na rede selecionada; não
copie uma configuração nativa com `localhost` para o job em container.

## 7. Autenticação

O backend inicia OIDC Authorization Code com state, nonce e PKCE, valida a
identidade Microsoft, o tenant e os domínios `mcm.eng.br` / `mcmmontagens.com.br`,
e exige usuário local ativo. A identidade externa fica vinculada ao usuário local.
A sessão usa identificador opaco em cookie HttpOnly; o banco guarda seu hash.

| Configuração                                                                   | Finalidade                                                                 |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`                               | Credenciais reais da App Registration, somente no backend.                 |
| `MICROSOFT_TENANT_IDS`                                                         | Tenants corporativos autorizados.                                          |
| `MICROSOFT_REDIRECT_URI`                                                       | Callback registrado; local: `http://localhost:3000/api/v1/auth/callback`.  |
| `MICROSOFT_ALLOWED_EMAIL_DOMAINS`                                              | Domínios corporativos permitidos.                                          |
| `FRONTEND_ORIGIN`                                                              | Origem exata da SPA e destino após autenticação.                           |
| `SESSION_SECRET`                                                               | Segredo de assinatura do fluxo OIDC; gere localmente para desenvolvimento. |
| `SESSION_COOKIE_NAME`, `SESSION_TTL_SECONDS`, `SESSION_TOUCH_INTERVAL_SECONDS` | Nome, validade e intervalo de atualização da sessão.                       |
| `COOKIE_SECURE`, `COOKIE_SAME_SITE`                                            | Política de cookies; produção usa Secure e HTTPS.                          |

`GET /api/v1/auth/me` retorna usuário, papéis e capacidades. 401 volta ao login e limpa
cache; 403 informa acesso negado. `POST /api/v1/auth/logout` revoga a sessão e limpa cookie
e cache da UI. Não há senha local nem persistência manual de tokens no browser.
App Registration ausente bloqueia homologação autenticada, não o setup da base.

## 8. Autorização

Papéis agrupam permissões; usuários recebem papéis. ADMIN recebe as capacidades
base pela seed, sem bypass por nome no frontend. O backend aplica
`requirePermission`; a UI usa somente as capacidades de `/auth/me` para exibir
ações. `session.access` permite consultar sessão/logout.

`/usuarios` oferece usuários, atribuição de papéis e edição de permissões de
papéis existentes. O backend também tem endpoints de criação/edição de papéis.
O papel SMS e sua matriz final dependem da MCM. Não distribua grants presumidos.
Hoje até leitura de catálogos exige `settings.manage`, inclusive nos apoios de
formulários; essa dependência deve ser considerada ao homologar a matriz.

## 9. Documentos

O frontend envia multipart ao backend. O backend valida formato real e limite de
10 MB; são aceitos PDF, JPEG, PNG, DOC e DOCX. Upload exige arquivo e
`tipoDocumentoId`; `andamentoId` é opcional. Download passa por endpoint protegido,
sem URL pública de storage. A UI apresenta a data técnica de envio.

O adapter implementado é `LocalDocumentStorage`, em
`backend/src/infrastructure/storage`. No Compose, o volume privado `uploads_data`
é montado em `/app/storage`. Exclusão remove o binário e mantém evidência mínima
no registro; andamentos usam soft delete e afastamentos não têm DELETE operacional.

A interface `DocumentStorage` permite evolução. Selecionar `STORAGE_DRIVER=s3`
hoje resulta em indisponibilidade: provider e adapter continuam pendentes. Não
considerar o volume local automaticamente aprovado para produção; sua aprovação,
backup e restauração precisam ser definidos com a MCM.

## 10. Principais módulos

Caminhos de backend abaixo são relativos a `backend/src/modules/`; os de frontend,
a `frontend/src/`. Services e hooks acompanham os nomes em inglês do domínio.

| Módulo                    | Frontend                                                                      | Backend           |
| ------------------------- | ----------------------------------------------------------------------------- | ----------------- |
| Usuários e acessos        | `routes/usuarios.tsx`, `services/users.ts`, `services/access.ts`              | `users`, `access` |
| Configurações             | `routes/configuracoes.tsx`, `services/catalogs.ts`                            | `catalogs`        |
| Colaboradores e histórico | `routes/colaboradores.tsx`, `services/employees.ts`; histórico em diálogo     | `employees`       |
| Afastamentos              | `routes/index.tsx`, `routes/afastamentos.*`, `components/AfastamentoForm.tsx` | `leaves`          |
| Andamentos                | `components/AfastamentoHistorico.tsx`, `services/progress.ts`                 | `progress`        |
| Documentos                | `components/AfastamentoDocumentos.tsx`, `services/documents.ts`               | `documents`       |
| Notificações              | `components/Notificacoes.tsx`, `services/notifications.ts`                    | `notifications`   |
| Dashboard                 | `routes/dashboard.tsx`, `services/dashboard.ts`                               | `dashboard`       |
| Auditoria                 | Sem tela específica nesta base; API protegida `GET /api/v1/auditoria`         | `audit`           |

Limites atuais dos contratos:

- Listas de usuários, catálogos, colaboradores, histórico de colaborador e
  afastamentos usam paginação server-side `page/perPage`, com 10/20/50/100.
  Papéis, permissões, andamentos, documentos e notificações não são paginados.
- Notificações são derivadas no servidor; somente leitura por usuário é persistida
  via `PUT /api/v1/notificacoes/:id/leitura`. Ler não resolve a pendência.
- Dashboard não oferece filtro por obra. Duração retorna `pending_final_validation`;
  próximos passos de andamentos pertencem às notificações, não aos indicadores.
- A API atual não persiste nascimento/admissão, início do benefício, aposentadoria,
  código/ordem dos catálogos ou data documental. Não apresentar esses campos como
  graváveis sem evolução coordenada de schema, contratos, backend e frontend.

## 11. Pendências para continuidade

**Dependências da MCM:** App Registration, tenants/client/secret/callback; matriz
SMS; host, domínios e HTTPS; storage de produção; política de retenção e
responsáveis pela operação. Veja impactos e próximos passos em
[Pendências do handoff](PENDENCIAS_HANDOFF.md).

**Evolução funcional:** Apdata após contrato técnico; resumo por e-mail; relatórios,
indicadores e telas priorizados com o produto; KPI de duração somente após a regra
validada. Nenhuma dessas integrações deve ser considerada implementada.

## 12. O que NÃO fazer

- Acessar banco/storage diretamente no frontend ou adicionar SDK de persistência direta.
- Guardar tokens de aplicação ou Microsoft em armazenamento do browser.
- Criar senha local ou bypass de sessão sem nova decisão arquitetural.
- Editar migrations aplicadas, resetar banco compartilhado ou apagar volumes para atualizar código.
- Hardcodar permissões pelo nome do papel no frontend ou substituir a autorização backend pela UI.
- Preencher credenciais, regras de negócio ou matriz SMS com valores presumidos.

## 13. Checklist inicial da Milena

- [ ] Ler README, runbook, ADRs, Decision Log e pendências.
- [ ] Configurar `.env` local e segredo; subir Compose sem credenciais fictícias.
- [ ] Aplicar migrations, executar seed e verificar healthchecks.
- [ ] Entender que seed base não fornece catálogos/dados de demonstração.
- [ ] Executar os comandos abaixo e conferir as evidências atuais no runbook.
- [ ] Solicitar App Registration e usuário autorizado para homologar os fluxos internos.
- [ ] Com sessão real, conferir CRUDs, RBAC, paginação, documentos, leitura de alertas e logout.
- [ ] Validar visual desktop/mobile dos módulos autenticados e registrar diferenças objetivas.
- [ ] Evoluir cada domínio mantendo contrato, backend, frontend e documentação coerentes.

```bash
npm --prefix frontend ci
npm --prefix frontend run typecheck
npm --prefix frontend run build
npm --prefix frontend run lint
npm --prefix frontend audit
npm --prefix backend ci
npm --prefix backend run prisma:generate
npm --prefix backend run typecheck
npm --prefix backend run build
npm --prefix backend run lint
npm --prefix backend audit --omit=dev
```

Os comandos nativos pressupõem Node/npm e o ambiente descrito no runbook. Não
foram implementados testes automatizados nesta entrega.

Evidências confirmadas da Fase 4 em 06/10/2026:

- `npm ci` executado nas duas camadas; audit frontend e audit backend com
  `--omit=dev`: zero vulnerabilidades. O audit completo do backend aponta um
  advisory baixo em `esbuild`, apenas no desenvolvimento: GHSA-g7r4-m6w7-qqqr.
- Frontend: typecheck, build e lint aprovados; sete avisos não bloqueantes de Fast
  Refresh, sem erros. Prisma 6.12: validate e generate aprovados.
- Compose dev e estrutura de produção com `--no-interpolate` validados, sem
  publicar valores de ambiente.
- Quatro migrations aplicadas, nenhuma pendente; comparação Prisma entre banco e
  schema sem diferença.
- Seed executada duas vezes: resultado estável de 20 permissões, um papel ADMIN e
  20 associações; nenhum usuário foi criado sem bootstrap solicitado.

A conclusão do lint backend e o smoke final da Fase 4 **ainda são aguardados**
após as correções da auditoria. Consulte as evidências consolidadas no runbook.
