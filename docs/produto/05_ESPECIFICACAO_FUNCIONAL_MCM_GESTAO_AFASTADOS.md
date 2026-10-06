# 05 — Especificação Funcional — MCM Gestão de Afastados

**Versão:** 1.0  
**Data:** 05/10/2026  
**Status:** Em revisão  
**Objetivo:** transformar os requisitos do sistema em fluxos implementáveis, testáveis e rastreáveis para a base full stack.

## Sumário

1. Metadados e entradas
2. Functional Specification Blueprint
3. Padrões funcionais transversais
4. FUNC-001 — Autenticação e sessão corporativa
5. FUNC-002 — Gestão de usuários e permissões
6. FUNC-003 — Cadastros auxiliares
7. FUNC-004 — Gestão de colaboradores
8. FUNC-005 — Histórico do colaborador
9. FUNC-006 — Listagem e filtros de afastamentos
10. FUNC-007 — Cadastro, edição e encerramento de afastamento
11. FUNC-008 — Detalhe do afastamento
12. FUNC-009 — Andamentos e linha do tempo
13. FUNC-010 — Documentos
14. FUNC-011 — Notificações e leitura por usuário
15. FUNC-012 — Dashboard operacional
16. Entidades estruturantes
17. Mensagens e estados de interface
18. Matriz Funcionalidade → Fluxo → Estado → API → Entidade → Teste
19. Maturidade funcional
20. Impactos técnicos e operacionais
21. Cenários de teste prioritários
22. Handoff técnico
23. Checklist de revisão

---

# 1. Metadados e entradas

```yaml
document:
  name: "Especificação Funcional"
  project: "MCM Gestão de Afastados"
  version: "1.0"
  status: "Em revisão"
  created_at: "2026-10-05"
  updated_at: "2026-10-05"

inputs:
  requirements_ref: "04 — Requisitos do Sistema"
  current_state_ref: "Auditoria técnica do estado atual"
  discovery_ref: "Discovery Técnica e Estratégica"
  brief_ref: "Brief Mestre"
  decision_log_ref: "Registro de Decisões"

delivery_context:
  target: "Base full stack integrada para handoff técnico"
  frontend_database_direct_access: false
  corporate_authentication: "Microsoft"
  eligible_domains:
    - "mcm.eng.br"
    - "mcmmontagens.com.br"
  external_employee_source_future: "Apdata"
```

### 1.1 Regra de interpretação

- API indicada neste documento é **candidata**, não contrato final.
- Entidade indicada é **funcional/candidata**, não schema final.
- Rota indicada pode ser ajustada na definição de frontend, desde que preserve o comportamento funcional.
- Toda permissão crítica deve ser aplicada no backend.
- Todo dado sensível deve ser protegido independentemente da visibilidade da interface.
- A base final deve permanecer independente da infraestrutura temporária utilizada apenas no protótipo.

---

# 2. Functional Specification Blueprint

```yaml
functional_specification_blueprint:
  project_name: "MCM Gestão de Afastados"
  source_requirements:
    - "RF-001 a RF-015"
    - "RN-001 a RN-016"
    - "RNF-001 a RNF-012"
    - "RX-001 a RX-008"
    - "RP-001 a RP-014"

  functionalities:
    - "FUNC-001 - Autenticação e sessão corporativa"
    - "FUNC-002 - Gestão de usuários e permissões"
    - "FUNC-003 - Cadastros auxiliares"
    - "FUNC-004 - Gestão de colaboradores"
    - "FUNC-005 - Histórico do colaborador"
    - "FUNC-006 - Listagem e filtros de afastamentos"
    - "FUNC-007 - Cadastro, edição e encerramento de afastamento"
    - "FUNC-008 - Detalhe do afastamento"
    - "FUNC-009 - Andamentos e linha do tempo"
    - "FUNC-010 - Documentos"
    - "FUNC-011 - Notificações e leitura por usuário"
    - "FUNC-012 - Dashboard operacional"

  critical_flows:
    - "Login corporativo e autorização local"
    - "Cadastrar/editar/encerrar afastamento"
    - "Consultar histórico"
    - "Registrar andamento"
    - "Upload/download/exclusão controlada de documento"
    - "Consultar alertas"
    - "Marcar alerta como lido"
    - "Consultar dashboard"

  structural_entities_required:
    - "Usuário"
    - "Papel"
    - "Permissão"
    - "Auditoria"
    - "Leitura de alerta"
    - "Metadados de documento"

  frontend_outputs:
    - "Layout autenticado"
    - "Rotas e páginas do domínio"
    - "Forms padronizados"
    - "Tabelas/listas responsivas"
    - "Estados loading/empty/error/success/forbidden/not-found"
    - "Services consumindo apenas API"

  backend_outputs:
    - "Identidade/sessão"
    - "Autorização"
    - "Usuários/permissões"
    - "Cadastros"
    - "Colaboradores"
    - "Afastamentos"
    - "Andamentos"
    - "Documentos"
    - "Notificações"
    - "Dashboard"
    - "Auditoria"

  database_outputs:
    - "Persistência relacional"
    - "Integridade de referências"
    - "Auditoria"
    - "Leitura de alertas por usuário"
    - "Metadados de documentos"

  decisions_required:
    - "Matriz final de papéis além do perfil SMS"
    - "Storage físico definitivo"
    - "Provisionamento inicial do primeiro administrador"
    - "Regra final de cálculo/visual da duração dos afastamentos"
    - "Contrato técnico futuro do Apdata"
```

---

# 3. Padrões funcionais transversais

## 3.1 Estados obrigatórios

Toda tela ou bloco que consome dados deve prever, quando aplicável:

- `loading`;
- `empty`;
- `success`;
- `validation_error`;
- `server_error`;
- `unauthenticated`;
- `forbidden`;
- `not_found`;
- `disabled/submitting`;
- `offline/network_error`.

## 3.2 Validação

**Frontend**
- obrigatoriedade;
- formato;
- feedback imediato;
- prevenção de duplo submit;
- preservação de preenchimento quando houver erro.

**Backend**
- identidade;
- autorização;
- existência das referências;
- integridade;
- unicidade;
- regra de negócio;
- situação/estado permitido;
- tipo/tamanho de documento;
- segurança.

Quando houver divergência, o backend é a autoridade final.

## 3.3 Datas

- datas de negócio sem horário devem ser tratadas como datas civis;
- exibição em `pt-BR`;
- evitar conversões automáticas que alterem o dia por timezone;
- cálculos de janelas de 15/30 dias devem ser feitos por regra única e testada.

## 3.4 Feedback

- sucesso simples: toast;
- erro de campo: inline;
- erro geral de formulário: alerta contextual;
- acesso negado: estado 403;
- recurso inexistente: estado 404;
- ação destrutiva: confirmação explícita;
- erro técnico nunca deve ser exposto cru ao usuário.

## 3.5 Permissões

A interface pode ocultar ações não permitidas, porém a API sempre deve validar a autorização. Chamadas manuais não podem contornar a permissão.

---

# 4. FUNC-001 — Autenticação e sessão corporativa

```yaml
functionality:
  id: "FUNC-001"
  name: "Autenticação e sessão corporativa"
  priority: "Must"
  maturity_level: 4
  implementation_readiness: "Pronta para revisão"
  requirements:
    - "RF-001"
    - "RF-002"
  permissions:
    - "session.access"
```

## Objetivo

Permitir entrada segura usando conta Microsoft corporativa e estabelecer uma sessão vinculada a usuário local autorizado.

## Atores

- usuário corporativo;
- provedor de identidade Microsoft;
- backend da aplicação.

## Tela/rota

- rota pública de entrada ou redirecionamento de autenticação;
- callback técnico;
- layout autenticado;
- ação de logout.

## Pré-condições

- configuração de autenticação por ambiente;
- identidade Microsoft válida;
- e-mail pertencente a `mcm.eng.br` ou `mcmmontagens.com.br`;
- usuário local ativo/habilitado.

## Fluxo principal

1. Usuário acessa o sistema sem sessão.
2. Aplicação apresenta ou inicia entrada corporativa.
3. Usuário autentica no provedor Microsoft.
4. Retorno de autenticação chega ao fluxo seguro da aplicação.
5. Backend valida identidade/claims necessários.
6. Backend normaliza o e-mail e valida domínio permitido.
7. Backend localiza o usuário local.
8. Backend confirma que o usuário local está ativo.
9. Backend resolve papéis/permissões.
10. Sessão da aplicação é estabelecida.
11. Usuário é direcionado à área autenticada.

## Fluxos alternativos

### ALT-001 — Sessão já válida

Ao acessar o sistema com sessão válida, a aplicação recupera `/auth/me` (ou equivalente), carrega usuário/permissões e evita novo login.

### ALT-002 — Logout

1. Usuário aciona logout.
2. Sessão da aplicação é encerrada.
3. Dados protegidos em cache são descartados.
4. Usuário volta ao estado não autenticado.

## Exceções

### EXC-001 — Domínio não permitido

**Mensagem:** “Sua conta não está autorizada a acessar este sistema.”

**Tratamento:** negar sessão da aplicação e não criar privilégio local.

### EXC-002 — Usuário corporativo válido, mas não habilitado localmente

**Mensagem:** “Sua conta corporativa foi reconhecida, mas seu acesso ao sistema ainda não está habilitado.”

### EXC-003 — Falha no provedor

**Mensagem:** “Não foi possível concluir o login corporativo. Tente novamente.”

### EXC-004 — Sessão expirada

Requisição protegida deve resultar em 401; frontend direciona ao fluxo de autenticação preservando, quando seguro, a intenção de navegação.

## Regras

- RN-013 — somente domínios permitidos.
- RN-014 — domínio permitido não concede permissão.
- Conta local inativa bloqueia acesso.
- Claims recebidas não devem ser usadas para conceder ação que não exista no modelo local, salvo decisão futura explícita.

## API candidata

- `GET /api/v1/auth/me`
- endpoint/callback de autenticação corporativa conforme biblioteca/arquitetura;
- `POST /api/v1/auth/logout` quando aplicável à estratégia de sessão.

## Dados

- Usuário;
- Papel;
- Permissão;
- sessão/token/cookie conforme arquitetura.

## Estados de interface

- checking_session;
- unauthenticated;
- redirecting;
- authenticated;
- unauthorized;
- provider_error.

## Critérios de aceite

- conta de domínio permitido + usuário local ativo entra;
- domínio não permitido é bloqueado;
- usuário local inativo é bloqueado;
- rota/API protegida sem sessão retorna 401;
- logout encerra a sessão da aplicação;
- permissões são carregadas da aplicação.

## Testes

- integração de domínio permitido;
- domínio bloqueado;
- usuário não cadastrado/inativo;
- sessão expirada;
- logout;
- chamada manual sem sessão.

---

# 5. FUNC-002 — Gestão de usuários e permissões

```yaml
functionality:
  id: "FUNC-002"
  name: "Gestão de usuários e permissões"
  priority: "Must"
  maturity_level: 4
  implementation_readiness: "Pronta para revisão"
  requirements:
    - "RF-003"
  permissions:
    - "users.read"
    - "users.manage"
    - "permissions.manage"
```

## Objetivo

Manter a autorização da aplicação separada da identidade Microsoft.

## Atores

- usuário com permissão administrativa;
- backend.

## Tela candidata

`/usuarios`

## Fluxo principal — listar e editar acesso

1. Administrador abre Usuários.
2. Sistema lista usuários locais com status e papéis.
3. Administrador seleciona usuário.
4. Sistema exibe dados corporativos básicos e autorização local.
5. Administrador altera status/papel/permissões permitidas.
6. Backend valida `users.manage`/`permissions.manage`.
7. Alteração é persistida.
8. Auditoria registra responsável e mudança.
9. Interface confirma sucesso.

## Fluxo alternativo — criação/pré-cadastro

A aplicação pode permitir cadastrar antecipadamente um e-mail corporativo autorizado, preparando o usuário local antes do primeiro login. O mecanismo exato deve ser compatível com a decisão de provisionamento.

## Exceções

- tentativa de incluir e-mail fora dos domínios permitidos;
- usuário sem permissão administrativa;
- associação a papel inexistente/inativo;
- conflito de atualização.

## Regras

- conta externa e usuário local são conceitos distintos;
- desabilitar usuário local não altera conta Microsoft;
- perfil `SMS` deve ser representável;
- demais papéis são configuráveis;
- o sistema não deve depender apenas do nome do papel no frontend; permissões são verificadas por capacidade.

## API candidata

- `GET /api/v1/usuarios`
- `GET /api/v1/usuarios/:id`
- `POST /api/v1/usuarios`
- `PATCH /api/v1/usuarios/:id`
- `GET /api/v1/papeis`
- `PATCH /api/v1/usuarios/:id/papeis`

## Estados

loading, empty, success, validation_error, server_error, forbidden.

## Critérios

- usuário sem permissão recebe 403;
- status inativo bloqueia acesso subsequente;
- alteração de papel muda autorização efetiva;
- alteração gera auditoria;
- e-mail fora dos domínios não pode ser habilitado.

---

# 6. FUNC-003 — Cadastros auxiliares

```yaml
functionality:
  id: "FUNC-003"
  name: "Cadastros auxiliares"
  priority: "Must"
  maturity_level: 4
  requirements:
    - "RF-004"
  permissions:
    - "settings.manage"
```

## Escopo

- obras;
- funções;
- tipos de benefício;
- situações de afastamento;
- tipos de andamento;
- tipos de documento.

## Tela

`/configuracoes`, organizada em abas/seções padronizadas.

## Fluxo principal — criar item

1. Usuário abre a aba desejada.
2. Sistema lista registros ativos/inativos.
3. Usuário aciona “Novo”.
4. Formulário exibe campos do cadastro.
5. Usuário salva.
6. Backend valida permissão, obrigatoriedade e conflitos.
7. Registro é persistido.
8. Cache/listagem é atualizado.
9. Toast confirma sucesso.

## Fluxo principal — editar

1. Usuário seleciona registro.
2. Sistema carrega dados atuais.
3. Usuário altera campos.
4. Backend valida e persiste.
5. Auditoria registra mudança.

## Fluxo principal — inativar

1. Usuário aciona inativação.
2. Interface explica que registros históricos continuarão usando o valor.
3. Usuário confirma.
4. Backend altera `ativo`/estado equivalente.
5. Item deixa de aparecer em novos selects.

## Regras

- não realizar exclusão física como fluxo normal;
- registros históricos preservam referência;
- item inativo não aparece em novo registro;
- em edição de registro antigo, valor inativo já associado continua visível;
- situação exige classificação `ATIVO`, `ENCERRADO` ou `APOSENTADO`;
- nomes/códigos duplicados devem seguir regras definidas no modelo de dados.

## APIs candidatas

Recursos podem ser separados ou unificados por camada de serviço, por exemplo:

- `/api/v1/obras`
- `/api/v1/funcoes`
- `/api/v1/tipos-beneficio`
- `/api/v1/situacoes-afastamento`
- `/api/v1/tipos-andamento`
- `/api/v1/tipos-documento`

## Estados

loading, empty, error, success, disabled, forbidden.

## Critérios

- inativação preserva registros históricos;
- novos forms usam apenas ativos;
- classificação inválida de situação é rejeitada pelo backend;
- toda alteração administrativa gera auditoria.

---

# 7. FUNC-004 — Gestão de colaboradores

```yaml
functionality:
  id: "FUNC-004"
  name: "Gestão de colaboradores"
  priority: "Must"
  maturity_level: 4
  requirements:
    - "RF-005"
  permissions:
    - "employees.read"
    - "employees.manage"
```

## Tela

`/colaboradores`

## Campos funcionais

- ID corporativo;
- nome;
- obra;
- função;
- contato;
- ativo/inativo;
- origem do registro quando aplicável.

CPF não faz parte do formulário obrigatório.

## Fluxo — listar

1. Usuário abre Colaboradores.
2. Sistema consulta backend com paginação/busca.
3. Tabela/lista exibe colaboradores.
4. Usuário pode pesquisar/filtrar conforme frontend definido.

## Fluxo — criar

1. Usuário aciona “Novo colaborador”.
2. Preenche campos.
3. Frontend valida obrigatórios.
4. Backend valida permissão, ID corporativo, referências e duplicidade.
5. Registro é persistido.
6. Interface confirma sucesso.

## Fluxo — editar

Contato, obra, função e demais campos permitidos podem ser atualizados conforme autorização. Se futuramente algum campo passar a ser controlado por integração externa, a regra de edição deverá ser revisada.

## Fluxo — inativar

Inativar colaborador não remove afastamentos anteriores.

## Exceções

- ID corporativo duplicado;
- obra/função inválida;
- tentativa de alterar sem permissão;
- dado desatualizado/conflito.

## APIs candidatas

- `GET /api/v1/colaboradores`
- `POST /api/v1/colaboradores`
- `GET /api/v1/colaboradores/:id`
- `PATCH /api/v1/colaboradores/:id`

## Critérios

- CPF não é exigido;
- ID corporativo é persistido;
- contato é editável;
- inativação preserva histórico;
- frontend não gera identificador concorrente ao mecanismo definido no banco/backend.

---

# 8. FUNC-005 — Histórico do colaborador

```yaml
functionality:
  id: "FUNC-005"
  name: "Histórico do colaborador"
  priority: "Must"
  maturity_level: 3
  implementation_readiness: "Pronta para implementação com decisão visual pendente"
  requirements:
    - "RF-006"
  permissions:
    - "employees.read"
    - "leaves.read"
```

## Objetivo

Oferecer visão consolidada dos afastamentos de um colaborador, sem limitar a história a um único afastamento.

## Apresentação

A forma visual pode ser:

- rota candidata `/colaboradores/:id`;
- aba/drawer de histórico dentro de Colaboradores;
- outra composição aprovada no frontend.

O comportamento funcional é obrigatório mesmo que a rota mude.

## Fluxo principal

1. Usuário seleciona colaborador.
2. Sistema carrega dados básicos.
3. Sistema lista afastamentos em ordem definida.
4. Cada afastamento mostra situação/classificação e datas relevantes.
5. Usuário expande/entra no afastamento.
6. Andamentos e documentos são acessíveis conforme permissão.

## Exceções

- colaborador sem afastamentos → empty state;
- colaborador inexistente → 404;
- sem permissão de afastamentos → conteúdo protegido/403.

## API candidata

`GET /api/v1/colaboradores/:id/historico`

## Critérios

- afastamentos encerrados continuam visíveis;
- histórico não é perdido por inativação de colaborador;
- navegação permite chegar ao detalhe do afastamento;
- documentos respeitam permissão própria.

## Bloqueio residual

Somente a composição visual/rota definitiva. Não bloqueia backend nem modelo funcional.

---

# 9. FUNC-006 — Listagem e filtros de afastamentos

```yaml
functionality:
  id: "FUNC-006"
  name: "Listagem e filtros de afastamentos"
  priority: "Must"
  maturity_level: 4
  requirements:
    - "RF-007"
  permissions:
    - "leaves.read"
```

## Tela

Rota principal `/`.

## Dados exibidos

O conjunto de colunas será consolidado no frontend, preservando no mínimo identificação do colaborador, obra, função, benefício, situação/classificação e datas operacionais relevantes.

## Filtros obrigatórios

- colaborador;
- obra;
- função;
- benefício;
- situação.

## Fluxo

1. Usuário acessa Afastamentos.
2. Frontend solicita primeira página.
3. Backend aplica autorização.
4. Usuário informa busca/filtros.
5. Frontend envia parâmetros normalizados.
6. Backend filtra, ordena e pagina.
7. Lista é atualizada sem recarregar a aplicação.
8. Usuário abre detalhe/edição conforme permissão.

## Estados

- loading inicial;
- refreshing;
- empty sem registros;
- empty por filtros;
- error;
- forbidden.

## API candidata

`GET /api/v1/afastamentos?page=&pageSize=&colaboradorId=&obraId=&funcaoId=&beneficioId=&situacaoId=&sort=`

## Critérios

- combinar filtros retorna interseção coerente;
- remover filtros restaura listagem;
- paginação não perde filtros;
- erro de API não deixa tabela em estado enganoso;
- usuário sem `leaves.read` não acessa rota/API.

---

# 10. FUNC-007 — Cadastro, edição e encerramento de afastamento

```yaml
functionality:
  id: "FUNC-007"
  name: "Cadastro, edição e encerramento de afastamento"
  priority: "Must"
  maturity_level: 4
  requirements:
    - "RF-008"
    - "RF-009"
  permissions:
    - "leaves.create"
    - "leaves.update"
```

## Telas

- `/afastamentos/novo`
- `/afastamentos/:id/editar`

## Campos funcionais mínimos

| Campo | Obrigatório | Regra |
|---|---:|---|
| Colaborador | Sim | deve existir e estar disponível para uso conforme regra |
| Data de afastamento | Sim | data civil válida |
| Situação | Sim | situação válida; classificação controlada |
| Tipo de benefício | Quando aplicável | cadastro ativo em novo registro |
| Fim do benefício | Quando aplicável | data válida |
| Previsão de retorno | Quando aplicável | data válida |
| Retorno efetivo | Opcional | quando o processo possuir esse dado |
| Obra | Conforme modelo | referência válida |
| Função | Conforme modelo | referência válida |
| Causa/CID | Opcional/sensível | acesso protegido |
| Observações | Opcional | texto controlado |

## Fluxo — criação

1. Usuário abre Novo afastamento.
2. Sistema carrega selects ativos.
3. Usuário preenche.
4. Frontend valida obrigatórios/formato.
5. Usuário salva.
6. Backend valida autorização, referências e regra de negócio.
7. Banco persiste.
8. Auditoria registra criação.
9. Frontend confirma sucesso.
10. Usuário é direcionado ao detalhe ou listagem conforme decisão de frontend.

## Fluxo — edição

1. Sistema carrega o afastamento.
2. Campos exibem valores atuais, inclusive referência histórica inativa já associada.
3. Usuário altera campos permitidos.
4. Backend valida estado e referência.
5. Persistência e auditoria são realizadas.
6. Interface confirma.

## Fluxo — encerramento/aposentadoria

Não existe “apagar afastamento” como forma de encerrar.

1. Usuário seleciona situação cuja classificação seja `ENCERRADO` ou `APOSENTADO`.
2. Backend valida situação.
3. Salva alteração.
4. Histórico e documentos permanecem.
5. Alertas deixam de ser aplicáveis conforme regra funcional definida.
6. Auditoria registra mudança de situação.

## Exceções

- cadastro auxiliar inativo escolhido em novo registro;
- registro inexistente;
- conflito de atualização;
- usuário sem permissão;
- data inválida;
- referência inválida.

## APIs candidatas

- `POST /api/v1/afastamentos`
- `GET /api/v1/afastamentos/:id`
- `PATCH /api/v1/afastamentos/:id`

## Critérios

- nenhum sucesso é mostrado antes da confirmação do backend;
- encerramento preserva dependências;
- backend rejeita situação inválida;
- referência inativa histórica não quebra edição;
- alteração gera auditoria.

---

# 11. FUNC-008 — Detalhe do afastamento

```yaml
functionality:
  id: "FUNC-008"
  name: "Detalhe do afastamento"
  priority: "Must"
  maturity_level: 4
  requirements:
    - "RF-010"
  permissions:
    - "leaves.read"
```

## Tela

`/afastamentos/:id`

## Blocos

1. resumo/dados do afastamento;
2. situação/classificação;
3. ações permitidas;
4. histórico/andamentos;
5. documentos.

## Fluxo

1. Usuário abre detalhe.
2. Frontend carrega recurso via API.
3. Backend valida acesso.
4. Página renderiza os blocos.
5. Ações de editar/adicionar andamento/documento aparecem conforme permissão.
6. Alterações realizadas por subfluxos atualizam os blocos necessários.

## Exceções

- 404 se não existir;
- 403 se não autorizado;
- erro de leitura com opção de tentar novamente.

## API candidata

`GET /api/v1/afastamentos/:id`

## Critérios

- detalhe não depende de consulta direta ao banco;
- blocos respeitam permissões independentes;
- 403/404 são distinguíveis;
- dados sensíveis não aparecem para usuário não autorizado.

---

# 12. FUNC-009 — Andamentos e linha do tempo

```yaml
functionality:
  id: "FUNC-009"
  name: "Andamentos e linha do tempo"
  priority: "Must"
  maturity_level: 4
  requirements:
    - "RF-011"
  permissions:
    - "progress.read"
    - "progress.manage"
```

## Tela

Bloco da tela de detalhe do afastamento.

## Campos

- data do andamento;
- tipo;
- descrição;
- próxima ação;
- data da próxima ação.

## Fluxo — incluir

1. Usuário aciona “Novo andamento”.
2. Form/modal é aberto.
3. Usuário preenche.
4. Frontend valida.
5. Backend valida afastamento, permissão e tipo.
6. Andamento é criado.
7. Auditoria registra.
8. Timeline é atualizada.
9. Notificações derivadas da próxima ação passam a considerar o novo dado.

## Fluxo — editar

Permitido conforme `progress.manage`, com registro de auditoria.

## Fluxo — excluir

1. Ação só aparece a usuário autorizado.
2. Confirmação explica impacto.
3. Backend valida permissão.
4. Operação de remoção/arquivamento segue estratégia de dados definida.
5. Auditoria deve manter evidência da ação.

## Exceções

- afastamento inexistente;
- tipo inativo em nova inclusão;
- data inválida;
- sem permissão;
- conflito de atualização.

## APIs candidatas

- `GET /api/v1/afastamentos/:id/andamentos`
- `POST /api/v1/afastamentos/:id/andamentos`
- `PATCH /api/v1/andamentos/:id`
- `DELETE /api/v1/andamentos/:id` se exclusão for efetivamente aprovada no modelo final.

## Critérios

- timeline preserva ordenação;
- encerramento do afastamento não apaga andamentos;
- exclusão não ocorre sem confirmação;
- operações críticas são auditadas.

---

# 13. FUNC-010 — Documentos

```yaml
functionality:
  id: "FUNC-010"
  name: "Documentos"
  priority: "Must"
  maturity_level: 4
  requirements:
    - "RF-012"
  permissions:
    - "documents.read"
    - "documents.upload"
    - "documents.download"
    - "documents.delete"
```

## Escopo

- upload;
- listagem;
- download;
- exclusão controlada;
- vínculo com afastamento;
- vínculo opcional com andamento.

## Baseline de arquivo

Até decisão diferente:

- até 10 MB;
- PDF;
- JPEG/JPG;
- PNG;
- DOC;
- DOCX.

O backend é a autoridade para tipo e tamanho.

## Fluxo — upload

1. Usuário abre Documentos.
2. Seleciona arquivo e tipo.
3. Frontend valida formato/tamanho para feedback rápido.
4. Upload é enviado ao backend ou mecanismo mediado pela aplicação.
5. Backend valida sessão, permissão, MIME, limite e vínculo.
6. Arquivo é persistido.
7. Metadata é persistida.
8. Operação é registrada em auditoria.
9. Lista é atualizada.

## Compensação de falha

Se arquivo for gravado e metadata falhar, a implementação deve executar compensação/limpeza ou registrar estado recuperável; não pode deixar inconsistência silenciosa.

## Fluxo — download

1. Usuário aciona download.
2. Backend valida `documents.download`.
3. Backend entrega arquivo diretamente ou autorização temporária restrita.
4. Nenhuma URL pública permanente é exibida.
5. Auditoria de download pode ser registrada conforme política.

## Fluxo — exclusão

1. Usuário com `documents.delete` aciona excluir.
2. Interface abre confirmação.
3. Backend valida permissão.
4. Operação remove/inativa arquivo e metadata conforme política de retenção.
5. Auditoria preserva responsável e identificação do documento.
6. Interface confirma.

## Exceções

- tipo inválido;
- arquivo acima do limite;
- malware/validação adicional se adotada;
- storage indisponível;
- metadata indisponível;
- usuário sem permissão;
- documento inexistente.

## APIs candidatas

- `GET /api/v1/afastamentos/:id/documentos`
- `POST /api/v1/afastamentos/:id/documentos`
- `GET /api/v1/documentos/:id/download`
- `DELETE /api/v1/documentos/:id`

## Critérios

- documento nunca é público;
- usuário sem permissão não lista nem baixa;
- backend valida MIME/tamanho;
- exclusão exige confirmação e auditoria;
- falha parcial não pode ficar silenciosa;
- documentos de afastamento encerrado continuam acessíveis conforme autorização.

---

# 14. FUNC-011 — Notificações e leitura por usuário

```yaml
functionality:
  id: "FUNC-011"
  name: "Notificações e leitura por usuário"
  priority: "Must"
  maturity_level: 4
  requirements:
    - "RF-013"
    - "RF-014"
  permissions:
    - "notifications.read"
    - "notifications.read_state"
```

## Local de uso

Sininho no layout autenticado + lista/painel de notificações.

## Tipos de alerta

### Benefício

- fim do benefício em até 30 dias;
- benefício vencido enquanto aplicável.

### Retorno

- retorno previsto em até 15 dias;
- retorno previsto vencido enquanto aplicável.

### Próxima ação

- próxima ação em janela de acompanhamento;
- próxima ação vencida enquanto pendente.

A janela observada para próximas ações é de 15 dias e deve ser preservada como baseline até validação diferente.

## Geração

As notificações podem ser:

- derivadas em consulta a partir dos dados;
- materializadas por job;
- combinação dos dois.

A escolha pertence à arquitetura, desde que o comportamento funcional seja preservado.

## Fluxo — consultar

1. Usuário autenticado carrega layout.
2. Frontend consulta notificações.
3. Backend filtra registros conforme autorização.
4. Sistema calcula/obtém alertas aplicáveis.
5. Backend combina o estado de leitura do usuário.
6. Frontend exibe quantidade e lista.

## Fluxo — marcar como lida

1. Usuário seleciona notificação.
2. Frontend envia marcação.
3. Backend grava leitura somente para o usuário corrente.
4. Interface atualiza.
5. Pendência original não é alterada.

## Regras

- leitura ≠ resolução;
- limpar armazenamento do navegador não muda leitura persistida;
- outro usuário mantém seu próprio estado;
- próxima ação vencida não deve virar indicador adicional no dashboard;
- alertas só devem existir enquanto a regra de negócio indicar aplicabilidade.

## APIs candidatas

- `GET /api/v1/notificacoes`
- `POST/PATCH /api/v1/notificacoes/:id/leitura`
- opcional `POST /api/v1/notificacoes/marcar-lidas` se futuramente aprovado.

## Critérios

- leitura acompanha usuário em outro dispositivo;
- leitura de um usuário não afeta outro;
- alerta lido continua pendente se a causa permanecer;
- benefício/retorno respeitam 30/15 dias;
- alerta não expõe caso sem autorização.

---

# 15. FUNC-012 — Dashboard operacional

```yaml
functionality:
  id: "FUNC-012"
  name: "Dashboard operacional"
  priority: "Must"
  maturity_level: 3
  implementation_readiness: "Pronta com validação final dos cálculos"
  requirements:
    - "RF-015"
  permissions:
    - "dashboard.read"
```

## Tela

`/dashboard`

## Indicadores obrigatórios

1. afastamentos ativos;
2. benefícios vencidos;
3. retornos previstos em até 15 dias.

## Gráficos/visões obrigatórios

- ativos por obra;
- novos afastamentos por mês;
- duração dos afastamentos;
- tabela de benefícios/retornos prioritários.

## Regras confirmadas

### Afastamentos ativos

Contar afastamentos cuja situação esteja classificada como `ATIVO`.

### Benefícios vencidos

Considerar registros aplicáveis com fim de benefício anterior à data de referência e ainda pendentes conforme regra de domínio.

### Retornos previstos em 15 dias

Considerar afastamentos aplicáveis com previsão de retorno dentro da janela de 15 dias.

### Ativos por obra

Agrupar afastamentos ativos pela obra associada ao caso.

### Novos afastamentos por mês

Agrupar registros pela data de afastamento.

### Duração

A duração deve ser derivada de datas reais do afastamento. A fórmula e a visualização final devem ser verificadas contra o comportamento desejado e um dataset de referência antes de considerar a funcionalidade validada.

### Tabela prioritária

Deve destacar benefícios/retornos que exigem atenção segundo as regras de prazo.

## Regra de exclusão

“Próximas ações vencidas” não devem ser adicionadas como KPI/indicador do dashboard. Elas permanecem no fluxo de notificações.

## Fluxo

1. Usuário abre Dashboard.
2. Frontend consulta endpoint agregado.
3. Backend aplica autorização.
4. Backend calcula agregações sobre dados persistidos.
5. Frontend renderiza cards, gráficos e tabela.
6. Estado vazio/erro é tratado.

## API candidata

`GET /api/v1/dashboard`

A API pode ser subdividida na arquitetura caso volume/performance justifique.

## Critérios

- nenhum valor hardcoded;
- totais coerentes com listagem;
- KPI de ativos usa classificação e não texto livre de situação;
- próximas ações vencidas não aparecem como KPI;
- dataset conhecido deve possuir resultados esperados documentados.

## Bloqueio residual

A regra exata de apresentação/cálculo do gráfico “duração dos afastamentos” deve ser fechada antes da validação final.

---

# 16. Entidades estruturantes

| Entidade | Necessária | Fluxo mínimo |
|---|---:|---|
| Usuário | Sim | listar, criar/pré-cadastrar, editar, ativar/desativar |
| Papel | Sim | listar, associar |
| Permissão | Sim | listar, associar a papel |
| Configurações/cadastros | Sim | listar, criar, editar, inativar |
| Notificação/leitura | Sim | listar alertas e persistir leitura |
| Auditoria | Sim | registrar eventos críticos; consulta administrativa pode evoluir |
| Integrações | Sim, estrutural | Microsoft agora; Apdata futuro |
| Anexos/documentos | Sim | upload, listar, download, exclusão controlada |

---

# 17. Mensagens e estados de interface

## 17.1 Mensagens padrão candidatas

### Sucesso

- “Afastamento cadastrado com sucesso.”
- “Afastamento atualizado com sucesso.”
- “Andamento registrado com sucesso.”
- “Documento enviado com sucesso.”
- “Documento excluído com sucesso.”
- “Alterações salvas com sucesso.”

### Validação

- “Preencha os campos obrigatórios.”
- “Selecione uma situação válida.”
- “A data informada não é válida.”
- “Este cadastro não está mais ativo para novos registros.”
- “Já existe um colaborador com este identificador.”

### Permissão

- “Você não possui permissão para realizar esta ação.”
- “Você não possui acesso a este conteúdo.”

### Autenticação

- “Sua conta não está autorizada a acessar este sistema.”
- “Sua conta corporativa foi reconhecida, mas seu acesso ao sistema ainda não está habilitado.”
- “Sua sessão expirou. Entre novamente.”

### Documentos

- “O arquivo excede o tamanho permitido.”
- “Tipo de arquivo não permitido.”
- “Não foi possível concluir o envio. Tente novamente.”

### Genérico

- “Não foi possível concluir a operação. Tente novamente.”
- “Não foi possível carregar os dados. Tente novamente.”

## 17.2 Estados por listagem

- loading → skeleton ou indicador padronizado;
- empty sem registros → explicar ausência;
- empty por filtros → “Nenhum resultado para os filtros aplicados” + limpar filtros;
- error → mensagem + tentar novamente;
- forbidden → 403;
- success → tabela/lista.

## 17.3 Ações destrutivas

Não usar confirmação nativa inconsistente. Adotar componente único de confirmação com:

- título;
- descrição do impacto;
- cancelar;
- confirmar;
- loading durante a operação;
- erro recuperável.

---

# 18. Matriz Funcionalidade → Fluxo → Estado → API → Entidade → Teste

| Funcionalidade | Fluxo principal | Estados críticos | API candidata | Entidades | Teste |
|---|---|---|---|---|---|
| FUNC-001 | login/sessão | checking, unauth, forbidden, success | `/auth/*` | Usuário/Papel/Permissão | TST-F001 |
| FUNC-002 | gerir usuários | loading, empty, forbidden, validation | `/usuarios`, `/papeis` | Usuário/Papel/Permissão | TST-F002 |
| FUNC-003 | CRUD/inativação de cadastros | loading, empty, confirm, success | `/configuracoes/*` | cadastros auxiliares | TST-F003 |
| FUNC-004 | CRUD colaborador | loading, validation, conflict | `/colaboradores` | Colaborador | TST-F004 |
| FUNC-005 | histórico colaborador | loading, empty, forbidden, 404 | `/colaboradores/:id/historico` | Colaborador/Afastamento | TST-F005 |
| FUNC-006 | lista/filtros | loading, refreshing, empty, error | `GET /afastamentos` | Afastamento | TST-F006 |
| FUNC-007 | criar/editar/encerrar | validation, submitting, success, conflict | `POST/PATCH /afastamentos` | Afastamento | TST-F007 |
| FUNC-008 | detalhe | loading, 403, 404, error | `GET /afastamentos/:id` | Afastamento | TST-F008 |
| FUNC-009 | timeline | loading, validation, confirm, error | `/andamentos` | Andamento | TST-F009 |
| FUNC-010 | documentos | upload, progress, error, confirm | `/documentos` | Documento | TST-F010 |
| FUNC-011 | alertas/leitura | loading, empty, read/unread, error | `/notificacoes` | LeituraAlerta | TST-F011 |
| FUNC-012 | dashboard | loading, empty, error, success | `/dashboard` | agregações | TST-F012 |

---

# 19. Maturidade funcional

| Funcionalidade | Nível | Motivo / bloqueio residual |
|---|---:|---|
| FUNC-001 | 4 | tenant/claims/provisionamento detalham-se tecnicamente depois |
| FUNC-002 | 4 | matriz de papéis adicionais permanece configurável |
| FUNC-003 | 4 | comportamento funcional claro |
| FUNC-004 | 4 | comportamento funcional claro |
| FUNC-005 | 3 | composição visual final ainda precisa ser escolhida |
| FUNC-006 | 4 | comportamento funcional claro |
| FUNC-007 | 4 | comportamento funcional claro |
| FUNC-008 | 4 | comportamento funcional claro |
| FUNC-009 | 4 | política física de delete/retention detalha-se no banco/segurança |
| FUNC-010 | 4 | provider de storage permanece decisão arquitetural |
| FUNC-011 | 4 | materialização vs cálculo dinâmico é decisão arquitetural |
| FUNC-012 | 3 | cálculo/visual final de duração precisa validação |

**Maturidade geral:** Nível 4, com dois pontos específicos em Nível 3 que não impedem a construção da fundação.

---

# 20. Impactos técnicos e operacionais

## 20.1 Frontend

Deve:

- consumir somente API;
- possuir services/hooks ou camada equivalente;
- manter cache e invalidação coerentes;
- padronizar forms, tabelas, filtros e dialogs;
- aplicar visibilidade por permissão sem assumir autoridade de segurança;
- oferecer 401/403/404/error states;
- remover código/clients que conectem diretamente à persistência.

## 20.2 Backend

Módulos funcionais esperados:

- auth;
- users/access;
- settings/reference-data;
- employees;
- leaves;
- progress;
- documents;
- notifications;
- dashboard;
- audit.

Regras críticas devem residir no backend.

## 20.3 Banco

Precisa suportar:

- usuário/papel/permissão;
- cadastros auxiliares;
- colaborador;
- afastamento;
- andamento;
- documento/metadata;
- leitura de alerta;
- auditoria;
- integridade e índices.

## 20.4 Storage

Necessário para FUNC-010.

Requisitos funcionais:

- privado;
- persistente;
- validado pelo backend;
- backup;
- acesso autorizado;
- sem URL pública permanente.

## 20.5 Jobs

Nenhum job é obrigatório para a base se notificações puderem ser derivadas sob demanda com desempenho adequado.

Caso futura estratégia materialize alertas ou envie e-mails, jobs/filas poderão ser adicionados.

## 20.6 Integrações

### Microsoft

Obrigatória e crítica para autenticação.

### Apdata

Não deve ser implementada sem contrato técnico, mas o modelo de colaborador deve aceitar `external_id`/origem equivalente sem acoplamento irreversível.

### E-mail

Fora desta fase.

---

# 21. Cenários de teste prioritários

## Autenticação/autorização

1. login com `mcm.eng.br`;
2. login com `mcmmontagens.com.br`;
3. domínio externo;
4. usuário corporativo válido não habilitado localmente;
5. usuário local inativo;
6. API sem sessão;
7. API com sessão sem permissão;
8. mudança de papel altera acesso.

## Cadastros

9. criar cadastro;
10. inativar;
11. cadastro inativo some de novo formulário;
12. registro antigo mantém valor inativo.

## Colaboradores

13. criar sem CPF;
14. ID corporativo duplicado;
15. editar contato;
16. inativar preservando histórico.

## Afastamentos

17. criar válido;
18. campos obrigatórios inválidos;
19. editar;
20. encerrar preservando andamentos/documentos;
21. selecionar cadastro inativo em novo registro deve falhar.

## Andamentos

22. criar;
23. editar;
24. excluir sem permissão;
25. próxima ação gera alerta esperado.

## Documentos

26. upload permitido;
27. MIME inválido;
28. arquivo acima do limite;
29. download sem permissão;
30. exclusão exige confirmação;
31. falha de metadata após upload não deixa inconsistência silenciosa.

## Notificações

32. benefício +30 dias;
33. benefício vencido;
34. retorno +15 dias;
35. retorno vencido;
36. marcar lida não resolve pendência;
37. leitura persiste em novo navegador;
38. leitura é independente por usuário;
39. próxima ação vencida permanece no sininho.

## Dashboard

40. ativos contam apenas classificação `ATIVO`;
41. benefício vencido bate com dataset de referência;
42. retorno 15 dias bate com dataset;
43. ativos por obra;
44. novos por mês;
45. próximas ações vencidas não aparecem como KPI;
46. duração validada contra dataset antes de considerar funcionalidade concluída.

## Handoff

47. clone limpo;
48. configuração por exemplos de ambiente;
49. banco sobe;
50. migrations executam;
51. seeds executam;
52. frontend e backend sobem;
53. login configurado em ambiente de homologação;
54. CRUD completo funciona ponta a ponta;
55. nenhum client temporário do protótipo é necessário para execução.

---

# 22. Handoff técnico

A implementação derivada desta especificação deve permitir que outro desenvolvedor:

1. clone o repositório;
2. configure variáveis a partir de exemplos;
3. suba frontend, backend e banco;
4. aplique migrations/seeds;
5. configure autenticação corporativa;
6. realize login;
7. execute CRUDs reais;
8. teste permissões;
9. trabalhe com documentos;
10. valide notificações;
11. valide dashboard;
12. entenda decisões pendentes sem depender de conversa anterior.

## Documentação mínima de entrega

- README principal;
- setup local;
- variáveis de ambiente;
- comandos de desenvolvimento/build/test;
- migrations/seeds;
- autenticação corporativa;
- papéis/permissões;
- storage;
- backup/restore;
- mapa de módulos;
- APIs documentadas;
- decisões técnicas relevantes;
- pendências conhecidas.

---

# 23. Checklist de revisão

- [x] Todas as funcionalidades possuem ID.
- [x] Toda funcionalidade está ligada a requisito.
- [x] Fluxos principais foram descritos.
- [x] Fluxos alternativos/exceções foram considerados.
- [x] Permissões estão explícitas.
- [x] Backend é a autoridade final de segurança.
- [x] Validações frontend/backend estão separadas.
- [x] Estados de interface foram definidos.
- [x] APIs são candidatas, não contratos finais.
- [x] Entidades são candidatas, não schema final.
- [x] Documentos possuem fluxo seguro.
- [x] Notificações possuem leitura persistida por usuário.
- [x] Leitura não é confundida com resolução.
- [x] Dashboard não inclui próximas ações vencidas como KPI.
- [x] Histórico do colaborador foi tratado além do histórico de um único afastamento.
- [x] Integração Microsoft foi incluída.
- [x] Apdata permanece futuro sem contrato inventado.
- [x] E-mail permanece fora desta fase.
- [x] IA e aquisição não são aplicáveis.
- [x] Impactos em infraestrutura/storage/auditoria foram registrados.
- [x] Cenários de teste prioritários foram definidos.
- [x] Handoff técnico está definido.
- [x] A base final não depende da infraestrutura temporária do protótipo.

---

**Autor:** Responsável técnico do projeto  
**Versão:** 1.0  
**Última atualização:** 05/10/2026
