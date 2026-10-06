# 09 — Frontend — MCM Gestão de Afastados

**Versão do documento:** 1.1
**Data:** 06/10/2026
**Status:** Fase 3 implementada; validação autenticada depende da App Registration Microsoft
**Produto:** MCM Gestão de Afastados  
**Objetivo da fase:** transformar o frontend atual em uma base sustentável, integrada a backend real e pronta para handoff técnico à Milena.

---

## 1. Objetivo

Definir a arquitetura e os padrões do frontend final da MCM Gestão de Afastados.

O frontend final deverá:

- manter a experiência validada do protótipo;
- seguir o Design System consolidado;
- deixar de acessar banco ou storage diretamente;
- consumir somente a API do backend;
- suportar autenticação corporativa Microsoft;
- aplicar permissões visuais coerentes com a autorização server-side;
- oferecer CRUDs reais, estados completos e tratamento de erros;
- ser modular, tipado, testável e documentado;
- não manter dependências, nomenclaturas ou acoplamentos da infraestrutura temporária usada no protótipo.

---

## 2. Estado implementado — Fase 3

O frontend usa exclusivamente `/api/v1`, através de API client centralizado com
JSON/multipart, `credentials: include`, erros oficiais e `requestId`. Não há acesso
direto a banco ou storage. Supabase, Lovable e Bun foram removidos da stack do
produto. O build é SPA Vite/React, com TanStack Router e TanStack Query; não há
TanStack Start, Nitro, Wrangler nem runtime frontend server-side.

`src/main.tsx` monta a SPA; `routes/__root.tsx` valida sessão e capabilities antes
de renderizar as rotas privadas. `/login` é pública e `/usuarios` administra
usuários, papéis e permissões existentes, sem criar SMS nem grants finais.

Fluxo implementado:

```text
Page / Component → Query / Mutation Hook → Domain Service → API Client → /api/v1
```

Estrutura concreta:

- `src/lib/api`: client, erros e envelopes de resposta;
- `src/lib/auth/session.ts`: query de sessão, `useAuth().can()` e logout;
- `src/lib/query/keys.ts`: prefixos de domínios e sessão;
- `src/services`: auth, access, users, catalogs, employees, leaves, progress,
  documents, notifications e dashboard;
- `src/hooks`: queries e mutations dos módulos, paginação server-side;
- `src/lib/dados.ts`: somente modelos de apresentação, formatação e reexports;
- `src/routes` e `src/components`: UI existente preservada, novos login/usuários;
- `index.html`, `vite.config.ts`, `nginx.conf`: entrada, build e fallback SPA.

Queries usam `['auth','me']`, `['users',...]`, `['roles']`, `['permissions']`,
`['catalogs',...]`, `['employees','list',...]`, `['employees','detail',id]`,
`['employees','history',id,...]`, `['leaves','list',...]`,
`['leaves','detail',id]`, `['progress',id]`, `['documents',id]`,
`['notifications',...]` e `['dashboard']`. `['audit']` está reservado; não foi
criada tela de auditoria complexa nesta fase. Mutations invalidam os domínios
relacionados, sem reload total.

Afastamentos, colaboradores, configurações e usuários filtram/paginam no
servidor (10, 20, 50, 100). Lookup de colaboradores também possui busca e páginas;
catálogos de referência são obtidos por páginas da API. Andamentos, documentos,
papéis, permissões e notificações seguem seus contratos atuais não paginados.

Limites explicitamente registrados antes da adaptação no Decision Log: a API
não persiste alguns campos do protótipo; eles foram retirados dos formulários.
Não houve redefinição de regras pendentes. Filtro de obra no dashboard permanece
indisponível e duração informa `pending_final_validation`; nenhum cálculo
substituto é feito no browser. Catálogos de apoio ainda exigem `settings.manage`.
O filtro de classificação foi acrescentado à API de afastamentos para preservar
as abas existentes; a edição valida atividade apenas das referências alteradas,
mantendo vínculos históricos inativos.

A paleta, CSS, tipografia, componentes base, tabelas/cards e navegação responsiva
foram preservados. O logo agora é um PNG local, sem resolvedor de assets externo.
A equivalência visual completa dos módulos autenticados precisa ser homologada
com sessão Microsoft real.

---

## 3. Frontend Blueprint

```yaml
frontend_blueprint:
  app:
    name: "MCM Gestão de Afastados"
    type: "Sistema interno corporativo"
    target_delivery: "Base full stack funcional para handoff"
  maturity:
    current: "SPA integrada à API; autenticação real aguardando App Registration"
    target: "Nível 4 — pronto para homologação e continuidade pela desenvolvedora"
  stack_target:
    framework: "React 19"
    build_tool: "Vite"
    language: "TypeScript"
    package_manager: "npm"
    lockfile: "package-lock.json"
    styling: "Tailwind CSS"
    ui: "shadcn/ui + Radix"
    router: "TanStack Router mantido como exceção documentada"
    remote_state: "TanStack Query"
    forms: "React Hook Form + Zod"
    charts: "Recharts"
    feedback: "Sonner"
  final_repository:
    frontend_dir: "/frontend"
    direct_database_access: false
    direct_storage_access: false
  api:
    version: "/api/v1"
    base_url_env: "VITE_API_BASE_URL"
    client_centralized: true
    services_by_domain: true
  authentication:
    provider: "Microsoft"
    eligible_domains:
      - "mcm.eng.br"
      - "mcmmontagens.com.br"
    session_strategy: "sessão HttpOnly opaca do backend, persistida server-side"
    local_storage_auth_tokens: false
  mocks:
    allowed_during_development: false
    allowed_in_production: false
    import_directly_in_pages: false
  pwa_required: false
  public_routes_required: true
  seo_required: false
  advanced_motion_required: false
  ai_interface_required: false
```

---

## 4. Decisão de roteamento

O projeto atual já utiliza TanStack Router e possui conjunto de rotas funcional.

A decisão desta base é:

- **manter TanStack Router**;
- não migrar apenas por padronização;
- documentar a exceção;
- preservar URLs existentes nesta fase;
- após exportação, remover ou simplificar recursos de runtime server-side do framework atual que não forem necessários quando a arquitetura final tiver backend separado.

A eventual remoção de recursos server-side não deve exigir mudança automática do roteador.

---

## 5. Estrutura de repositório alvo

```text
mcm-gestao-afastados/
├── frontend/
│   ├── Dockerfile.dev
│   ├── Dockerfile.prod
│   ├── .dockerignore
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.ts
│   └── src/
├── backend/
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── .gitignore
├── README.md
└── docs/
```

A implementação de Docker e infraestrutura é fechada posteriormente, mas o frontend deve ser compatível com esta organização.

---

## 6. Estrutura frontend alvo

```text
frontend/src/
├── app/
│   ├── providers/
│   ├── routes/
│   └── config/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── feedback/
│   ├── forms/
│   └── data-display/
├── layouts/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── settings/
│   ├── employees/
│   ├── leaves/
│   ├── notifications/
│   └── dashboard/
├── services/
│   ├── api/
│   └── errors/
├── hooks/
├── lib/
├── types/
├── utils/
└── styles/
```

### Regra

Pages devem orquestrar telas. Regras de comunicação, transformação de payload e acesso remoto não devem permanecer dentro de pages/components.

---

## 7. Módulos

### auth

Responsabilidades:

- bootstrap de sessão;
- estado do usuário atual;
- login corporativo;
- logout;
- tratamento de sessão expirada;
- permissões carregadas;
- redirecionamento para login/403.

### users

Responsabilidades:

- listagem de usuários autorizados;
- habilitação/inativação;
- associação de perfis/capacidades;
- busca/filtros;
- feedback e estados.

### settings

Responsabilidades:

- obras;
- funções;
- tipos de benefício;
- situações;
- tipos de andamento;
- tipos de documento.

### employees

Responsabilidades:

- listagem;
- criação;
- edição;
- inativação;
- consulta de histórico consolidado.

### leaves

Responsabilidades:

- listagem;
- filtros;
- cadastro;
- edição;
- detalhe;
- encerramento;
- histórico/andamentos;
- documentos.

### notifications

Responsabilidades:

- consulta dos alertas;
- quantidade de não lidas;
- marcar como lida;
- navegação contextual.

### dashboard

Responsabilidades:

- indicadores;
- gráficos;
- tabela prioritária;
- estados loading/empty/error.

---

## 8. Rotas alvo

### Públicas

| Rota | Uso |
|---|---|
| `/login` | entrada para autenticação Microsoft |
| callback técnico de autenticação | definir conforme integração final |

Não haverá cadastro público nem recuperação de senha local.

### Autenticadas

| Rota | Tela |
|---|---|
| `/` | Afastamentos |
| `/dashboard` | Dashboard |
| `/afastamentos/novo` | Novo afastamento |
| `/afastamentos/:id` | Detalhe |
| `/afastamentos/:id/editar` | Edição |
| `/colaboradores` | Colaboradores |
| `/colaboradores/:id` | Histórico consolidado do colaborador |
| `/configuracoes` | Cadastros auxiliares |
| `/usuarios` | Usuários e acessos |

### Erro/fallback

| Estado | Comportamento |
|---|---|
| 401 | redirecionar para login com feedback |
| 403 | tela amigável de acesso negado |
| 404 | tela em português |
| 500 | fallback de erro interno |
| offline/indisponibilidade | alerta ou fallback quando detectável |

---

## 9. Autenticação e sessão

### 9.1 Microsoft

A autenticação será feita por identidade Microsoft.

Somente identidades pertencentes a:

- `mcm.eng.br`;
- `mcmmontagens.com.br`;

são elegíveis.

Elegibilidade de domínio não equivale a autorização para usar todos os recursos.

### 9.2 Regra de frontend

O frontend:

- não armazena segredo de aplicação Microsoft;
- não deve armazenar tokens sensíveis em localStorage;
- consulta a sessão atual no backend;
- usa cookie HttpOnly quando a arquitetura final suportar;
- aguarda bootstrap de sessão antes de renderizar área privada;
- limpa cache e estado remoto no logout;
- trata `401` globalmente.

### 9.3 Estado de autenticação

```ts
type AuthState = {
  user: UserSummary | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  roles: string[];
  permissions: string[];
};
```

---

## 10. Permissões visuais

O backend é sempre a autoridade final.

O frontend deve implementar:

- ProtectedRoute;
- PermissionGate ou equivalente;
- menus condicionais;
- ações condicionais;
- fallback durante carregamento;
- tela 403.

Padrão:

| Situação | Interface |
|---|---|
| ação não deve ser conhecida | ocultar |
| ação é conhecida, mas estado não permite | desabilitar |
| bloqueio precisa de explicação | tooltip/helper |
| rota sem acesso | 403 |
| permissões carregando | skeleton/fallback |

A matriz granular de perfis continua configurável no backend.

---

## 11. API client

Todo acesso remoto deve passar por um API client centralizado.

```text
services/api/
├── api-client.ts
├── api-error.ts
├── api-response.ts
├── endpoints.ts
└── http-status.ts
```

Responsabilidades:

- `VITE_API_BASE_URL`;
- `credentials: include` quando aplicável;
- headers padrão;
- parsing de resposta;
- normalização de erro;
- timeout quando necessário;
- tratamento central de 401;
- não exibir mensagem técnica crua;
- não conter regra visual.

Nenhuma page/component deve chamar banco, storage ou provider diretamente.

---

## 12. Services por domínio

Exemplos:

```text
modules/employees/services/employees.service.ts
modules/leaves/services/leaves.service.ts
modules/settings/services/settings.service.ts
modules/notifications/services/notifications.service.ts
modules/dashboard/services/dashboard.service.ts
modules/users/services/users.service.ts
```

Padrão esperado:

```text
Page
→ Hook TanStack Query
→ Service do domínio
→ API Client
→ Backend
```

---

## 13. TanStack Query

Query keys devem ser previsíveis.

Exemplo:

```ts
["employees", "list", filters]
["employees", "detail", id]
["leaves", "list", filters, page]
["leaves", "detail", id]
["notifications"]
["dashboard", filters]
```

Regras:

- filtros/paginação participam da query key;
- mutations invalidam queries relacionadas;
- cache é limpo no logout;
- retry não deve mascarar erro de permissão/validação;
- optimistic update apenas quando seguro.

---

## 14. Forms

Stack alvo:

- React Hook Form;
- Zod;
- componentes do Design System.

Estrutura:

```text
Page
→ Form específico
→ Schema Zod
→ Mutation hook
→ Service
→ API
```

Regras:

- validação rápida no frontend;
- backend continua autoridade de regra;
- erros de campo inline;
- erro geral no topo;
- bloqueio de duplo submit;
- payload transformado fora do componente visual quando necessário.

---

## 15. Listagens e DataTable

### Desktop

- filtros;
- busca;
- ordenação;
- paginação;
- cabeçalho fixo em container rolável quando aplicável;
- ações por linha;
- estados loading/empty/error.

### Tablet

- reduzir colunas;
- ações secundárias em menu;
- preservar busca/filtros/paginação.

### Mobile

- MobileCardList;
- filtros em drawer/sheet;
- ordenação em select;
- ações essenciais preservadas.

### Paginação

No backend final, paginação server-side é a direção padrão para listas potencialmente crescentes.

---

## 16. Mocks

A aplicação utiliza a API real em todos os ambientes. Não há mocks permanentes,
flag de mocks nem fluxo de autenticação simulado.

---

## 17. Estados globais de interface

Telas relevantes devem implementar:

- loading/skeleton;
- empty;
- error;
- success;
- disabled;
- forbidden;
- not found.

Erros HTTP mínimos:

| Status | Tratamento |
|---|---|
| 400 | erro de requisição amigável |
| 401 | sessão/login |
| 403 | acesso negado |
| 404 | não encontrado |
| 409 | conflito de regra/estado |
| 422 | validação |
| 429 | muitas solicitações |
| 500 | erro interno |
| 503 | indisponibilidade |

---

## 18. Feedback

- Sonner para sucesso/erro simples;
- erro de campo inline;
- alerta no topo para erro geral de form;
- banner para indisponibilidade sistêmica;
- ConfirmDialog para ações destrutivas.

`window.confirm` não deve permanecer no frontend final.

---

## 19. Documentos

O frontend final:

- envia arquivo somente para endpoint autorizado do backend;
- não recebe credencial de storage;
- valida tipo/tamanho para UX antes do envio;
- backend repete todas as validações;
- exibe progresso/estado de processamento;
- solicita download ao backend;
- exclusão exige confirmação;
- falhas são normalizadas.

---

## 20. Notificações

O frontend deverá:

- carregar alertas da API;
- exibir quantidade de não lidas;
- marcar leitura pela API;
- manter cache coerente;
- não usar localStorage como fonte definitiva de leitura;
- apresentar empty/error/loading.

---

## 21. Dashboard

O frontend consome dados agregados do backend.

Não deve reproduzir regras críticas de cálculo que pertencem ao servidor.

Deve suportar:

- cards;
- gráficos;
- tabela prioritária;
- skeleton;
- empty;
- error;
- tooltips;
- responsividade.

---

## 22. Datas

Datas puras do domínio devem ser tratadas como datas de calendário, evitando conversões indevidas de timezone.

Regras:

- não usar `new Date("YYYY-MM-DD")` indiscriminadamente;
- exibir em `pt-BR`;
- normalizar payload conforme contrato da API;
- timezone só deve ser aplicado a timestamps reais.

---

## 23. Variáveis frontend

Exemplo inicial:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=MCM Gestão de Afastados
```

Não devem existir no frontend final:

- connection string de banco;
- secrets Microsoft;
- secret de sessão;
- credencial de storage;
- chave administrativa;
- credencial privada de integração.

---

## 24. Higienização pós-exportação

Checklist obrigatório:

- [ ] mover/garantir frontend em `/frontend`;
- [ ] usar somente npm;
- [ ] manter `package-lock.json`;
- [ ] remover lockfiles de outros gerenciadores;
- [ ] remover dependências, tags, plugins e metadados específicos da ferramenta de prototipação;
- [ ] remover cliente, SDKs, tipos gerados e envs vinculados à persistência temporária;
- [ ] eliminar acesso direto ao banco;
- [ ] eliminar acesso direto ao storage;
- [ ] substituir leitura/gravação por services/API;
- [ ] revisar scripts `dev`, `build`, `preview`, `lint`, `typecheck` e `test`;
- [ ] normalizar `vite.config.ts`;
- [ ] usar `host: "0.0.0.0"`;
- [ ] usar porta 5173;
- [ ] usar `strictPort: true`;
- [ ] preservar alias `@`;
- [ ] revisar arquivos server-side herdados do framework atual;
- [ ] remover runtime server-side frontend que se torne redundante com backend separado;
- [ ] manter TanStack Router salvo decisão técnica posterior;
- [ ] remover casts `as unknown as` evitáveis;
- [ ] revisar imports não utilizados;
- [ ] validar build/typecheck;
- [ ] confirmar que não existem referências residuais à infraestrutura temporária.

---

## 25. Validação desta fase

Conforme DEC-036, não foram criados testes automatizados. A validação usa
TypeScript, build, ESLint, auditoria npm, Compose, healthchecks, revisão dos
contratos e smoke manual das rotas. O fluxo autenticado de ponta a ponta exige
App Registration Microsoft real e usuário local autorizado. Consulte o runbook
`docs/runbooks/setup-local.md` para os comandos e limites de validação.

---

## 26. Mapa tela por tela

| Tela | Rota | Acesso | Entidade principal | Componentes/padrões | API necessária |
|---|---|---|---|---|---|
| Login | `/login` | pública | sessão/usuário | AuthLayout, MicrosoftButton, Alert | auth |
| Afastamentos | `/` | autenticada | afastamento | FilterBar, DataTable/MobileCardList, Pagination | afastamentos |
| Dashboard | `/dashboard` | autenticada + permissão | agregações | MetricCard, ChartCard, PriorityTable | dashboard |
| Novo afastamento | `/afastamentos/novo` | permissão create | afastamento | Form, DatePicker, Select/Combobox | afastamentos |
| Detalhe | `/afastamentos/:id` | read | afastamento | Details, Timeline, Documents | afastamentos/andamentos/documentos |
| Editar | `/afastamentos/:id/editar` | update | afastamento | Form | afastamentos |
| Colaboradores | `/colaboradores` | autenticada | colaborador | FilterBar, DataTable/MobileCardList | colaboradores |
| Histórico colaborador | `/colaboradores/:id` | read | colaborador/afastamentos | Timeline/List | histórico |
| Configurações | `/configuracoes` | manage | catálogos | Tabs, DataTable, Dialog | configurações |
| Usuários | `/usuarios` | manage | usuário/permissão | DataTable, filters, dialogs | usuários/RBAC |
| 403 | fallback | autenticada | NA | ErrorState | NA |
| 404 | fallback | qualquer | NA | ErrorState | NA |
| 500 | fallback | qualquer | NA | ErrorState | NA |

---

## 27. Matriz de permissões visuais candidata

Os nomes abaixo representam capacidades e não fecham o modelo definitivo de papéis.

| Capacidade | Tela/ação |
|---|---|
| `leaves.read` | listar/detalhar afastamentos |
| `leaves.create` | criar afastamento |
| `leaves.update` | editar/encerrar |
| `progress.read/manage` | andamentos |
| `documents.read/upload/download/delete` | documentos |
| `employees.read/manage` | colaboradores |
| `settings.manage` | cadastros auxiliares |
| `users.manage` | usuários e acessos |
| `notifications.read` | notificações |
| `dashboard.read` | dashboard |

---

## 28. Handoff para backend/API/banco

O frontend exige da camada técnica:

- autenticação Microsoft;
- sessão;
- endpoint de usuário atual;
- permissões/capacidades;
- usuários e acessos;
- CRUDs de domínio;
- paginação e filtros;
- regras de negócio server-side;
- upload/download protegido;
- leitura de notificações por usuário;
- agregações de dashboard;
- auditoria;
- respostas padronizadas de erro.

Os contratos implementados estão no backend e em `backend/openapi/openapi.yaml`; divergências encontradas na integração estão registradas no Decision Log.

---

## 29. Maturidade

### Estado atual

**SPA integrada à API com autenticação/capacidades estruturadas; homologação autenticada pendente da configuração Microsoft.**

### Meta da base entregue

**Nível 4 — pronto para homologação e continuidade.**

Para atingir a meta:

- backend/API integrados;
- autenticação e permissões funcionais;
- sem acesso direto ao banco/storage;
- formulários padronizados;
- estados e erros completos;
- responsividade validada;
- smoke autenticado com a configuração Microsoft real;
- build e ambiente documentados.

---

## 30. Critérios de aceite frontend

- [ ] frontend reside em `/frontend`;
- [ ] npm + package-lock são a única estratégia de pacote;
- [ ] nenhuma dependência residual da ferramenta de prototipação;
- [ ] nenhuma dependência residual da persistência temporária;
- [ ] frontend não acessa banco diretamente;
- [ ] frontend não acessa storage diretamente;
- [ ] API client centralizado;
- [ ] services por domínio;
- [ ] TanStack Query centraliza estado remoto;
- [ ] forms críticos usam RHF + Zod;
- [ ] autenticação Microsoft integrada;
- [ ] domínios corporativos validados pelo fluxo de autenticação;
- [ ] autorização visual baseada nas capacidades retornadas pelo backend;
- [ ] rotas protegidas;
- [ ] 401/403/404/500 tratados;
- [ ] tabelas responsivas;
- [ ] paginação;
- [ ] estados loading/empty/error/success;
- [ ] `window.confirm` removido;
- [ ] notificações lidas persistidas por usuário via API;
- [ ] documentos protegidos via backend;
- [ ] dashboard sem dados hardcoded;
- [ ] smoke autenticado completo após configuração Microsoft;
- [ ] `npm run build` e typecheck passam;
- [ ] README permite à Milena subir o frontend e entender os módulos.

---

## 31. Handoff para Milena

A base entregue deve permitir que a desenvolvedora:

1. clone o repositório;
2. configure os `.env` a partir dos exemplos;
3. suba ambiente local;
4. autentique com usuário de teste válido;
5. execute os CRUDs principais;
6. compreenda os módulos por domínio;
7. encontre regras e permissões no backend/API, não em código disperso de UI;
8. executar typecheck, build, lint e smoke;
9. localizar documentação de decisões;
10. continuar evolução sem conhecer a ferramenta utilizada na prototipação inicial.
