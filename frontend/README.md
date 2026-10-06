# MCM Gestão de Afastados — frontend

SPA React, TypeScript e Vite, com TanStack Router para navegação e TanStack Query
para o estado recebido do servidor. O layout e os componentes existentes são
preservados.

## Desenvolvimento

Use Node.js 24 LTS e npm 10 ou superior. Na raiz do repositório:

```bash
cp frontend/.env.example frontend/.env
npm --prefix frontend ci
npm --prefix frontend run dev
```

A aplicação abre em `http://localhost:5173`. A API deve estar disponível em
`http://localhost:3000/api/v1`. O setup completo, migrations e seed estão em
[Execução local](../docs/runbooks/setup-local.md).

`VITE_API_BASE_URL` é pública e define somente a URL da API. `VITE_APP_NAME`
controla o título exibido no login. Não configure segredos no frontend.

## Organização

```text
routes/components → hooks → services → lib/api/client → /api/v1
```

- `routes/`: telas e navegação;
- `components/`: componentes e estados de interface;
- `hooks/`: queries e mutations dos módulos;
- `services/`: contratos e chamadas da API por domínio;
- `lib/api/`: cliente HTTP e erros estruturados;
- `lib/auth/`: sessão e capacidades recebidas do backend;
- `lib/query/`: cache e chaves de consultas.

Todas as operações passam pelo backend. O navegador não acessa banco ou storage
diretamente. O login usa Microsoft pelo backend; a sessão é mantida por cookie
HttpOnly, enviado com `credentials: "include"`. Não há senha local ou token da
aplicação persistido no browser.

O acesso autenticado depende da App Registration Microsoft e de usuário local
ativo com as capacidades necessárias. Sem a configuração Microsoft, `/login`
continua acessível e apresenta indisponibilidade ao tentar entrar.

## Validação

```bash
npm --prefix frontend run typecheck
npm --prefix frontend run build
npm --prefix frontend run lint
npm --prefix frontend ls
npm --prefix frontend audit
```

Não são implementados testes automatizados nesta fase. O build gera somente
arquivos estáticos em `frontend/dist/`. Os aliases de `tsconfig.json` são
resolvidos pelo suporte nativo do Vite.

## Containers

- `Dockerfile.dev`: Node.js 24, npm e Vite em `5173`.
- `Dockerfile.prod`: build estático e Nginx em `80`, com fallback para as rotas da
  SPA, `/health.html` e proxy de `/api/v1` para `backend:3000`.
- O limite do proxy permite o multipart de arquivos de até 10 MB; o backend
  continua responsável por validar o tamanho e o conteúdo.

Em produção, o frontend usa `/api/v1` na mesma origem. HTTPS e o domínio público
são configurados pelo ambiente de implantação. As variáveis `VITE_*` usadas no
build são públicas; mudanças nelas exigem novo build.

O filtro por obra do dashboard aguarda suporte no contrato do backend. O
indicador de duração permanece indisponível enquanto sua fórmula está em
validação. O feed de notificações segue o contrato atual, que retorna os alertas
e `unreadCount`, sem parâmetros de paginação.
