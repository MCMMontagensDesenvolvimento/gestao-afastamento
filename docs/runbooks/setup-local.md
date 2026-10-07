# Execução local

## Pré-requisitos

- Git e Docker com Docker Compose v2, em execução.
- OpenSSL para gerar um segredo local com `openssl rand -hex 32`.
- Fora dos containers: Node.js 24 LTS recomendado (`.nvmrc`), mínimo 22.12, e npm 10+.
  Com nvm instalado, execute `nvm install` e `nvm use` na raiz.
- Portas locais livres: frontend 5173, backend 3000 e PostgreSQL 5432.

Não é necessário possuir App Registration para iniciar os serviços, consultar
healthchecks e abrir a tela de login. O login real exige os valores da MCM.

## Clone e configuração com Docker

```bash
git clone <URL_DO_REPOSITORIO> gestao-afastados
cd gestao-afastados
git switch arquitetura/base-integrada
cp .env.example .env
openssl rand -hex 32
```

Obtenha a URL real do repositório com a MCM. Copie o segredo gerado para
`SESSION_SECRET` no `.env` da raiz; não versione esse arquivo. Preserve um `.env`
já configurado em vez de sobrescrevê-lo. Deixe as variáveis Microsoft em branco
até receber as credenciais reais. Não preencha valores fictícios.

O Compose usa o `.env` da raiz e injeta as variáveis de cada serviço. Os arquivos
`frontend/.env` e `backend/.env` são destinados à execução nativa. Alterar o `.env`
não muda o ambiente de um container em execução: recrie o serviço com `up -d`.

```bash
docker compose -f docker-compose.dev.yml config --quiet
docker compose -f docker-compose.dev.yml up -d --build
docker compose -f docker-compose.dev.yml exec backend npm run prisma:migrate:deploy
docker compose -f docker-compose.dev.yml exec backend npm run prisma:seed
docker compose -f docker-compose.dev.yml ps
```

`config` sem `--quiet` exibe o ambiente resolvido e pode revelar segredos; não
publique sua saída. As migrations não rodam automaticamente no startup.

A seed mantém 20 permissões e o papel ADMIN idempotentes. Não cria catálogos,
colaboradores, afastamentos ou usuários de demonstração. Num banco novo, listas
vazias são esperadas. O primeiro administrador somente é provisionado se
`BOOTSTRAP_ADMIN_EMAIL` contiver um e-mail corporativo real, autorizado pela MCM.
Reaplicar a seed restaura os grants base de ADMIN e reativa o usuário indicado;
trate o bootstrap como operação administrativa explícita, não como login alternativo.

## URLs e healthchecks

| Serviço | Endereço local |
| --- | --- |
| Login | http://localhost:5173/login |
| API | http://localhost:3000/api/v1 |
| Processo backend | http://localhost:3000/health |
| Conexão com banco | http://localhost:3000/health/db |
| Arquivo de saúde da SPA | http://localhost:5173/health.html |
| PostgreSQL | localhost:5432, ajustável por `POSTGRES_PORT` |

```bash
curl -f http://localhost:3000/health
curl -f http://localhost:3000/health/db
curl -f http://localhost:5173/health.html
```

O healthcheck do backend confirma processo ativo; `/health/db` confirma conexão
com PostgreSQL. Eles não substituem a conferência das migrations.

## Banco e persistência

O host do banco dentro do Compose é `db`; fora dele é `localhost`. Banco e
arquivos usam volumes `db_data` e `uploads_data`. O storage privado do backend é
`/app/storage` no container. Não use `down -v` nem apague esses volumes para
atualizar código ou dependências.

Para conferir migrations e ausência de divergência, sem reset:

```bash
docker compose -f docker-compose.dev.yml exec backend npx --no-install prisma migrate status
docker compose -f docker-compose.dev.yml exec backend npx --no-install prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code
```

Para evoluir o schema somente em banco de desenvolvimento, revise o SQL gerado:

```bash
docker compose -f docker-compose.dev.yml exec backend npm run prisma:migrate:dev -- --name nome_da_mudanca
docker compose -f docker-compose.dev.yml exec backend npm run prisma:generate
```

Não edite migrations já aplicadas. Use `migrate deploy` para aplicar as existentes;
não substitua o histórico por `db push` ou reset. Seed pode ser repetida para
conferir idempotência, observando os efeitos administrativos descritos acima.

Se um lockfile mudar, sincronize o volume de dependências da camada afetada e
recrie o serviço. Para ambas as camadas:

```bash
docker compose -f docker-compose.dev.yml run --rm --no-deps frontend npm ci
docker compose -f docker-compose.dev.yml run --rm --no-deps backend npm ci
docker compose -f docker-compose.dev.yml run --rm --no-deps backend npm run prisma:generate
docker compose -f docker-compose.dev.yml up -d --force-recreate frontend backend
```

## Execução nativa

Use este procedimento como alternativa aos serviços frontend/backend do Compose.
Se eles já estiverem ativos, pare-os para liberar as portas; é possível manter
somente o banco Docker com `docker compose -f docker-compose.dev.yml up -d db`.

```bash
npm --prefix frontend ci
npm --prefix backend ci
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Edite `backend/.env`: informe `DATABASE_URL` com usuário/senha/banco reais do
PostgreSQL local e porta publicada, substituindo o marcador do exemplo. Codifique
caracteres reservados da senha na URL. Use `LOCAL_STORAGE_PATH=./storage`,
`FRONTEND_ORIGIN=http://localhost:5173`, cookie local sem Secure e um
`SESSION_SECRET` aleatório. O caminho relativo é resolvido na pasta `backend`,
onde os scripts npm executam. Não copie `db` ou `/app/storage` para execução nativa.

O frontend usa somente `VITE_API_BASE_URL` e `VITE_APP_NAME`. Vite incorpora essas
variáveis públicas ao build: não coloque credenciais nelas.

```bash
npm --prefix backend run prisma:generate
npm --prefix backend run prisma:migrate:deploy
npm --prefix backend run prisma:seed
```

Em dois terminais separados, a partir da raiz:

```bash
npm --prefix backend run dev
```

```bash
npm --prefix frontend run dev
```

## Login, sessão e capacidades

O botão **Entrar com Microsoft** navega para `/api/v1/auth/login` no backend.
Sem App Registration configurada, recebe HTTP 503 com página amigável e retorno
à tela de login. Clientes JSON recebem erro estruturado com `requestId`.

A MCM precisa fornecer `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`,
`MICROSOFT_TENANT_IDS` e registrar o callback local
`http://localhost:3000/api/v1/auth/callback`. Configure os valores em conjunto.
Também é necessário usuário local ativo e elegível num dos domínios corporativos
permitidos. IDs, segredo e tokens Microsoft não pertencem ao frontend.

`GET /api/v1/auth/me` retorna `{ data: { user, roles, permissions } }`. O backend
controla sessão e cookie HttpOnly; o cliente usa `credentials: include`. 401
leva ao login e limpa cache; 403 apresenta acesso negado. Logout revoga a sessão
e limpa cookie e cache. Capabilities controlam a UX; o backend autoriza cada ação.

Catálogos de apoio exigem `settings.manage`, inclusive para leitura. A matriz
operacional SMS ainda depende da MCM; não amplie grants implicitamente para
contornar essa dependência. Após login administrativo, cadastre as referências
reais antes de colaboradores e afastamentos.

## Qualidade e smoke

Com o ambiente nativo configurado e dependências instaladas:

```bash
npm --prefix frontend run typecheck
npm --prefix frontend run build
npm --prefix frontend run lint
npm --prefix frontend audit
npm --prefix backend run typecheck
npm --prefix backend run build
npm --prefix backend run lint
npm --prefix backend audit --omit=dev
```

Execute o Prisma instalado no backend; um `npx prisma` na raiz, onde não existe
`package.json`, pode tentar baixar outra versão:

```bash
cd backend
npx --no-install prisma validate --schema prisma/schema.prisma
npx --no-install prisma generate --schema prisma/schema.prisma
cd ..
```

No navegador, abra `/login`, clique Microsoft, confira o retorno amigável sem
configuração e recarregue rotas privadas diretamente: `/`, `/dashboard`,
`/afastamentos/novo`, `/afastamentos/:id`, `/afastamentos/:id/editar`,
`/colaboradores`, `/configuracoes` e `/usuarios`. Sem sessão, devem ir ao login
antes de consultar dados de negócio. Confira assets e console JavaScript.

Uma rota inexistente de API deve retornar 404 JSON com `status`, `code`,
`message` e `requestId`, por exemplo:

```bash
curl -i http://localhost:3000/api/v1/rota-inexistente
```

Com App Registration e usuário autorizado, homologar CRUDs, filtros, paginação
10/20/50/100, histórico, upload/download/exclusão, leitura de notificações, RBAC,
logout, expiração de sessão e visual desktop/mobile dos módulos internos.
Esses fluxos exigem autenticação Microsoft real; não simule sessão para validá-los.
Não foram implementados testes automatizados nesta entrega (DEC-036).

## Produção

A SPA Vite é compilada em `dist/` e servida por Nginx, com fallback para
`index.html`, `/health.html`, assets com hash e proxy de `/api/v1` para o backend.
Os argumentos `VITE_API_BASE_URL` e `VITE_APP_NAME` são de build; variáveis no
runtime do Nginx não alteram os arquivos estáticos. O proxy aceita multipart de
arquivo de até 10 MB mais metadados; o backend valida o limite do arquivo.

```bash
docker compose -f docker-compose.prod.yml config --no-interpolate
```

Esse comando revisa a estrutura sem exigir credenciais. Não realiza deploy.
Backend e DB não publicam portas no Compose de produção. O frontend expõe porta
80 para a rede configurada; não há host, domínio ou proxy HTTPS corporativo
provisionado. Secrets obrigatórios não têm fallback utilizável em produção.

A imagem runtime do backend contém apenas dependências de produção e não inclui
Prisma CLI/tsx. Use o estágio `build` como imagem de ferramentas para jobs
controlados de migration/seed na rede e ambiente reais. O modelo de comando está
no [handoff](../handoff/HANDOFF_MILENA.md#6-banco-e-migrations).

Somente o storage local está implementado. `STORAGE_DRIVER=s3` retorna
indisponibilidade; provider/adapter, ou aprovação de volume privado com backup
equivalente, dependem de continuidade. Host, domínios, HTTPS, gestão de secrets,
backup/restore e retenção precisam ser concretizados antes do go-live.

## Problemas conhecidos

| Sintoma | Ação |
| --- | --- |
| Node antigo / erro de engine | Use `.nvmrc` ou Node >=22.12 e npm >=10; não altere dependências para acomodar Node 20. |
| Porta ocupada | Pare a execução duplicada; para PostgreSQL ajuste `POSTGRES_PORT` e a URL nativa. |
| Backend não inicia por Microsoft parcial | Preencha client/secret/tenants em conjunto com dados reais, ou deixe todos vazios no dev. |
| Login retorna 503 sem Microsoft | Comportamento esperado; obter App Registration. |
| Login negado mesmo com identidade Microsoft | Verifique tenant/domínio, usuário local ativo e capacidades com administrador autorizado. |
| Formulário sem opções ou com acesso negado | Cadastre catálogos reais e confira `settings.manage`; seed não popula esses cadastros. |
| Prisma não encontra tabelas | Confira conexão e aplique migrations com `migrate deploy`; não resete o banco. |
| Dependência nova ausente no container | Execute `npm ci` no volume da camada afetada e recrie o serviço. |
| Banco rejeita senha após editar `.env` | Credenciais de inicialização não alteram o usuário de um volume já existente; use as credenciais desse banco ou mudança administrativa controlada. |
| Imagem runtime não encontra Prisma CLI | Execute migration/seed pela imagem de ferramentas; não instale dependências em container de produção. |

O dashboard não suporta filtro por obra; duração continua pendente. Papéis,
permissões, notificações, andamentos e documentos têm contrato não paginado.
Campos ausentes na API não são apresentados como graváveis. Consulte as
[pendências classificadas](../handoff/PENDENCIAS_HANDOFF.md).

## Evidências da auditoria de 06/10/2026

Resultados finais são consolidados após as correções da auditoria e a rodada
executável. Login Microsoft e jornadas autenticadas permanecem dependentes da MCM.
