# Execução local

## Pré-requisitos

- Docker com Docker Compose;
- Node.js 24 LTS recomendado (mínimo 22.12) e npm 10 ou superior fora dos containers.
- Nenhuma credencial Microsoft é necessária para iniciar os healthchecks ou a tela de login.

## Inicialização com Docker

1. Copie `.env.example` para `.env` na raiz. Defina `SESSION_SECRET` com um segredo
   aleatório de pelo menos 32 caracteres, por exemplo usando `openssl rand -hex 32`.
   Não versione esse arquivo. Não preencha credenciais Microsoft com valores fictícios.
2. Execute `docker compose -f docker-compose.dev.yml config` para validar a configuração.
   A saída pode conter valores de ambiente: não a publique com secrets.
3. Execute `docker compose -f docker-compose.dev.yml up -d --build`.
4. Aplique as migrations:
   `docker compose -f docker-compose.dev.yml exec backend npm run prisma:migrate:deploy`.
5. Execute a seed:
   `docker compose -f docker-compose.dev.yml exec backend npm run prisma:seed`.
6. Confira `docker compose -f docker-compose.dev.yml ps`.

O bootstrap administrativo é opcional e só ocorre quando `BOOTSTRAP_ADMIN_EMAIL`
contém um endereço corporativo autorizado. A seed mantém permissões e ADMIN
idempotentes; não existe autoelevação nem papel SMS com matriz inventada.
As migrations não rodam implicitamente no startup.

O Compose dev publica frontend 5173, backend 3000 e banco 5432. Volumes preservam
banco e documentos. Quando o lockfile mudar em um ambiente existente, sincronize
o volume de dependências: `docker compose -f docker-compose.dev.yml run --rm --no-deps frontend npm ci`
e recrie o serviço frontend. Não remova volumes de banco/documentos para atualizar dependências.

## Execução fora dos containers

1. `npm --prefix frontend install` e `npm --prefix backend install`.
2. Copie os `.env.example` de cada camada para `.env` na mesma pasta e configure
   backend conforme ambiente (banco, secret local e origem `http://localhost:5173`).
3. Frontend: `npm --prefix frontend run dev`; backend: `npm --prefix backend run dev`.

O frontend usa somente `VITE_API_BASE_URL` e `VITE_APP_NAME`. O endereço local da
API é `http://localhost:3000/api/v1`; produção utiliza `/api/v1` no mesmo domínio.
Variáveis Vite são públicas e incorporadas no build; nunca coloque secrets nelas.

## Login, sessão e capacidades

Abra [a entrada local](http://localhost:5173/login). O botão **Entrar com Microsoft**
navega para `/api/v1/auth/login` no backend. Sem App Registration configurada,
a navegação recebe HTTP 503 com página amigável e link para voltar ao login;
requisições que aceitam JSON recebem o erro estruturado original, com `requestId`.

Preencha no backend `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`,
`MICROSOFT_TENANT_IDS` e o callback
`http://localhost:3000/api/v1/auth/callback` somente com os valores reais da MCM.
É preciso usuário local ativo, tenant autorizado e domínio corporativo elegível.

`GET /api/v1/auth/me` devolve `{ data: { user, roles, permissions } }`. O cookie
HttpOnly é administrado pelo backend; o browser envia `credentials: include`.
401 direciona ao login e limpa cache; 403 apresenta acesso negado. O logout chama
`POST /api/v1/auth/logout`, limpa cache TanStack Query e volta ao login. Não há
senha local, bearer token de aplicação ou persistência manual de sessão.

Consultas de catálogos exigem `settings.manage` também como apoio aos formulários.
Papéis sem essa capacidade receberão indicação de acesso negado nos apoios. A
matriz final de capacidades é uma decisão administrativa, não um grant implícito.

## Verificações

```bash
npm --prefix frontend run typecheck
npm --prefix frontend run build
npm --prefix frontend run lint
npm --prefix frontend ls
npm --prefix frontend audit
npm --prefix backend run typecheck
npm --prefix backend run build
npm --prefix backend run lint
curl -f http://localhost:3000/health
curl -f http://localhost:3000/health/db
curl -f http://localhost:5173/health.html
```

Smoke no navegador, incluindo reload direto: `/login`, `/`, `/dashboard`,
`/afastamentos/novo`, `/afastamentos/:id`, `/afastamentos/:id/editar`,
`/colaboradores`, `/configuracoes`, `/usuarios`. Sem sessão, as rotas privadas
redirecionam ao login antes de carregar dados protegidos. Com App Registration e
usuário autorizado, validar CRUDs, filtros, paginação 10/20/50/100, histórico,
upload/download/exclusão, leitura de notificações, RBAC e logout. Essa parte
exige autenticação Microsoft real; não existe bypass de login para o smoke.

Não são implementados testes automatizados nesta fase (DEC-036).

## Produção

O frontend é SPA Vite estática: build em `dist/`, servido por Nginx na porta 80,
com fallback de rotas para `index.html`, health em `/health.html` e proxy de
`/api/v1` para `backend:3000`. O limite do proxy permite multipart de arquivo de
10 MB mais metadados; o backend mantém a validação final. Assets com hash têm
cache imutável; `index.html` exige revalidação. Não há runtime frontend server-side.

`docker-compose.prod.yml` mantém backend interno e DB sem porta publicada. Um
proxy HTTPS externo deve encaminhar o domínio para o frontend. Configure origem,
callback e secrets reais: Compose rejeita variáveis obrigatórias vazias. URLs,
host, provider de storage, backup/restore e gestão corporativa de secrets ainda
precisam ser definidos antes do go-live. O driver S3 não é simulado.

A imagem aceita `VITE_API_BASE_URL` e `VITE_APP_NAME` como argumentos de build;
variáveis no runtime do Nginx não reescrevem os arquivos estáticos.

## Limitações conhecidas dos contratos

A Fase 3 está descrita no documento 09 e no Decision Log. Alguns campos do
protótipo não existem na API (datas de nascimento/admissão, início do benefício,
aposentadoria, código/ordem dos catálogos e data documental). Esses campos não
são apresentados como graváveis. Documentos exibem a data técnica de envio.
Dashboard não suporta filtro de obra e mantém duração pendente de validação.
Notificações, andamentos e documentos têm resposta não paginada no contrato
atual; as listas administrativas e de afastamentos usam paginação do servidor.

Supabase, Lovable e Bun foram removidos da stack operacional. Existe metadado
opcional do pacote transitivo `unplugin` no lockfile citando tipos de outro runtime;
esse pacote de tipos não é instalado, não é requisito e não é utilizado pelo produto.


## Evidências da execução em 06/10/2026

- Frontend: typecheck, build estático e lint aprovados; lint mantém sete avisos
  não bloqueantes de Fast Refresh em exports dos componentes existentes.
- Backend: typecheck, build e lint aprovados.
- `npm install`, `npm ls` e `npm audit`: aprovados; zero vulnerabilidades no frontend.
- Compose dev reconstruído; frontend, backend e banco saudáveis. Os endpoints
  `/health`, `/health/db` e `/health.html` retornam HTTP 200.
- Imagem de produção Nginx construída; sintaxe, health, fallback das nove rotas,
  assets e proxy da API verificados em container temporário, removido ao final.
- Smoke no Chromium: login desktop/mobile sem erro JavaScript nem overflow;
  link aponta ao backend; retorno 503 amigável e retorno à tela de login conferidos.
- Acesso direto às oito rotas privadas redireciona ao login preservando `returnTo`,
  com uma única consulta de sessão e nenhuma consulta de dados protegidos.
- CRUDs autenticados, logout com sessão válida, matriz de RBAC real e equivalência
  visual dos módulos internos aguardam App Registration e usuário autorizado.

Não houve commit, push, deployment em produção, criação de testes automatizados
ou simulação de autenticação. O código é independente; as pendências acima são
explícitas e não devem ser confundidas com validação autenticada concluída.
