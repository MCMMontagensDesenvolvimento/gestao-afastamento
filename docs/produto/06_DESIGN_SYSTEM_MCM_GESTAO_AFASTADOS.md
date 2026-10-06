# 06 — Design System — MCM Gestão de Afastados

**Versão do documento:** 1.0  
**Data:** 05/10/2026  
**Status:** Pronto para revisão visual do protótipo  
**Produto:** MCM Gestão de Afastados  
**Tipo:** Sistema interno corporativo  
**Escopo desta etapa:** contrato visual e experiencial para consolidação do frontend antes da exportação.

---

## 1. Objetivo

Definir o padrão visual e experiencial da aplicação MCM Gestão de Afastados, consolidando os padrões que devem ser aplicados ao protótipo atual e preservados no frontend final.

Este documento não define arquitetura de backend, banco de dados, contratos de API, autenticação Microsoft, infraestrutura ou modelo definitivo de permissões. Ele define como as telas devem parecer, se comportar e responder em desktop, tablet e mobile.

A identidade visual atual do protótipo será tratada como referência de continuidade, sem rebranding nesta fase. Cores, tipografia e superfícies existentes devem ser centralizadas em tokens antes de qualquer alteração visual relevante.

---

## 2. Fontes consideradas

- auditoria técnica do estado atual;
- requisitos funcionais e não funcionais consolidados;
- especificação funcional;
- questionário do idealizador;
- telas e fluxos existentes no protótipo;
- decisões de entrega da base full stack para continuidade por outra desenvolvedora.

### 2.1 Evidências visuais do estado atual

Foram observados ou relatados:

- layout principal já existente;
- dashboard com cards e gráficos;
- listagem de afastamentos;
- formulários de criação e edição;
- detalhe do afastamento com histórico e documentos;
- tela de colaboradores;
- configurações com cadastros auxiliares;
- componente de notificações;
- uso de Tailwind CSS e componentes baseados em shadcn/Radix;
- confirmações destrutivas não totalmente padronizadas;
- loading predominantemente textual;
- ausência ou fragilidade de estados de erro em algumas leituras;
- tabelas que dependem de scroll horizontal em telas menores;
- padrões de interface que precisam de consolidação antes da exportação;
- telas de erro ainda não totalmente adequadas ao idioma e ao padrão do produto.

---

## 3. Design System Blueprint

```yaml
design_system_blueprint:
  project_name: "MCM Gestão de Afastados"
  product_type: "Sistema interno corporativo"
  visual_maturity:
    current: "Nível 2 — base visual existente, porém com padronização parcial"
    target_before_export: "Nível 4 — estados, responsividade e acessibilidade mínima consolidados"
  identity_status: "Parcial — preservar linguagem visual atual, sem inventar nova marca"
  branding_strategy:
    rebrand_in_this_phase: false
    use_existing_visual_language: true
    centralize_existing_colors_as_tokens: true
  typography:
    strategy: "preservar fonte atual quando consistente; caso ausente, usar Inter"
    fallback: "system-ui, sans-serif"
  interface_stack:
    styling: "Tailwind CSS"
    component_base: "shadcn/ui + Radix"
    feedback: "Sonner ou mecanismo já compatível com o projeto"
  screen_patterns:
    - "Aplicação autenticada"
    - "Dashboard"
    - "Listagem com filtros"
    - "CRUD"
    - "Detalhe"
    - "Configurações"
    - "Timeline"
    - "Documentos"
  responsiveness:
    desktop: "layout completo e tabelas"
    tablet: "redução de colunas, priorização de conteúdo e menus adaptados"
    mobile: "listas/cards, filtros em sheet/drawer e ações adaptadas"
  accessibility:
    required: true
    minimum_level: "WCAG AA como direção de projeto, sem certificação nesta etapa"
  dark_mode:
    required_in_current_delivery: false
    rule: "não ampliar escopo para dark mode; não criar hardcodes que impeçam adoção futura"
  pwa:
    required: false
  white_label:
    required: false
  public_pages:
    required: false
  motion:
    specialized_motion_required: false
    scope: "microinterações básicas de feedback, sem animação complexa"
  ai_interfaces:
    required: false
```

---

## 4. Princípios de interface

1. **Clareza operacional antes de decoração.**  
   O usuário deve identificar rapidamente situação, prazos, status, ações e pendências.

2. **Consistência entre telas.**  
   A mesma intenção deve usar o mesmo padrão de componente, feedback e posicionamento de ação.

3. **Dados sensíveis com apresentação discreta.**  
   Informações de saúde e documentos não devem ganhar destaque visual desnecessário nem aparecer em superfícies onde não sejam necessárias.

4. **Desktop como contexto principal, sem abandonar mobile.**  
   A operação é majoritariamente administrativa, mas funcionalidades essenciais devem continuar utilizáveis em telas menores.

5. **Ação destrutiva sempre explícita.**  
   Exclusão ou remoção deve passar por confirmação padronizada.

6. **Estado da aplicação sempre compreensível.**  
   Loading, vazio, erro, sucesso, bloqueio e ausência de permissão não podem resultar em tela silenciosa ou ambígua.

7. **Sem rebranding nesta fase.**  
   O objetivo é consolidar a interface existente, não redesenhar a identidade do produto.

---

## 5. Tokens

### 5.1 Regra principal

Os valores atualmente utilizados no protótipo devem ser extraídos e centralizados em tokens. Não devem ser inventadas novas cores de marca sem aprovação.

### 5.2 Tokens obrigatórios

```yaml
brand:
  primary: "derivar da interface atual"
  primary_foreground: "derivar da interface atual"
  secondary: "derivar da interface atual"
  accent: "derivar da interface atual"

surface:
  background: "token"
  foreground: "token"
  card: "token"
  card_foreground: "token"
  muted: "token"
  muted_foreground: "token"
  border: "token"
  input: "token"
  ring: "token"

semantic:
  success: "#16A34A"
  warning: "#D97706"
  error: "#DC2626"
  info: "#2563EB"

status:
  active: "success semantic"
  closed: "neutral semantic"
  retired: "neutral/info semantic conforme contexto"
  overdue: "error semantic"
  due_soon: "warning semantic"
  inactive: "muted semantic"
```

### 5.3 Regras

- evitar cores importantes escritas diretamente em componentes;
- status não pode depender somente de cor;
- focus ring deve permanecer visível;
- gráficos devem usar uma paleta controlada;
- cores semânticas devem manter significado constante.

---

## 6. Tipografia

Quando a fonte atual estiver consistente, preservá-la. Se o projeto não tiver uma fonte claramente definida, usar **Inter**.

Hierarquia recomendada:

- H1: título da página;
- H2: seções principais;
- H3: cards/blocos;
- body: conteúdo padrão;
- body-small: metadados;
- label: campos e filtros;
- helper/error: apoio e validação.

Regras:

- um H1 por tela;
- labels visíveis nos formulários;
- contraste suficiente para textos secundários;
- textos e valores não devem estourar cards;
- evitar excesso de peso tipográfico.

---

## 7. Espaçamento e densidade

Base de espaçamento: múltiplos de 4px.

```yaml
spacing:
  xs: 4
  sm: 8
  md: 12
  base: 16
  lg: 24
  xl: 32
  2xl: 40
```

O sistema pode ter densidade administrativa moderada, mas deve preservar:

- separação entre filtros e conteúdo;
- respiro entre cards;
- espaçamento consistente entre campos;
- área de toque adequada;
- alinhamento entre títulos e ações.

---

## 8. Layouts

### 8.1 AppLayout

É o layout principal das áreas internas.

Deve possuir:

- navegação lateral ou padrão equivalente já existente;
- cabeçalho/topbar consistente;
- identificação da tela;
- ação principal da página;
- conteúdo central com largura e padding previsíveis;
- área de filtros;
- área de conteúdo;
- paginação quando aplicável;
- acesso às notificações;
- identificação do usuário quando a autenticação real for adicionada.

### 8.2 DashboardLayout

Variação do AppLayout voltada a:

- cards de indicador;
- gráficos;
- tabela/lista prioritária;
- loading com skeleton;
- estado sem dados;
- erro amigável.

### 8.3 SettingsLayout

Usado em configurações e cadastros auxiliares:

- navegação por abas/seções;
- título e descrição;
- estados independentes por seção;
- ações padronizadas;
- confirmação de inativação/exclusão quando aplicável.

### 8.4 AuthLayout

Será usado na implementação final da autenticação corporativa. Não precisa ser criado no protótipo nesta rodada visual.

Direção visual futura:

- identidade discreta;
- título do sistema;
- breve descrição;
- botão principal “Entrar com Microsoft”;
- mensagens de domínio não permitido, usuário não autorizado e falha de autenticação;
- nenhuma opção de senha local.

---

## 9. Inventário de componentes-alvo

### 9.1 Navegação e layout

- AppLayout
- PageHeader
- PageDescription
- ContentContainer
- Breadcrumb quando necessário
- NotificationTrigger/Popover
- UserMenu futuro

### 9.2 Ações

- Button
- IconButton
- DropdownMenu
- ConfirmDialog
- AlertDialog

### 9.3 Formulários

- Input
- Textarea
- Select
- Combobox
- DatePicker
- Checkbox/Switch quando aplicável
- FileUpload
- FormField
- FormFieldError
- FormActions

### 9.4 Feedback

- Toast
- Alert
- Skeleton
- LoadingState
- EmptyState
- ErrorState
- ForbiddenState futuro

### 9.5 Exibição de dados

- Badge
- StatusBadge
- DataTable
- MobileCardList
- Pagination
- MetricCard
- ChartCard
- Timeline
- DocumentList
- FilterBar

---

## 10. Padrão de listagem e DataTable

### Desktop

- busca visível;
- filtros em barra padronizada;
- cabeçalho de tabela fixo dentro do container quando a tabela possuir scroll vertical;
- paginação visível;
- ações por linha consistentes;
- largura das colunas controlada;
- tooltips quando conteúdo precisar truncar.

### Tablet

- reduzir colunas não essenciais;
- ações secundárias em menu;
- preservar filtros e paginação;
- evitar overflow horizontal sempre que possível.

### Mobile

A tabela deve se transformar em lista/cards.

Cada item deve manter:

- informação principal;
- status;
- metadados relevantes;
- ação principal;
- menu de ações secundárias.

Filtros devem abrir em sheet/drawer.

### Paginação

No protótipo, a paginação pode continuar client-side usando os dados já carregados.

Na integração final, a listagem deve estar preparada para paginação server-side sem alterar a experiência visual.

---

## 11. Padrão de filtros

Todo conjunto de filtros deve seguir o mesmo padrão visual:

- barra de filtros;
- labels claras;
- botão de limpar quando houver filtro ativo;
- comportamento previsível em desktop;
- sheet/drawer no mobile;
- indicador de quantidade de filtros ativos quando útil.

Filtros atualmente exigidos pelo domínio incluem, conforme a tela:

- colaborador;
- obra;
- função;
- benefício;
- situação.

---

## 12. Padrão de CRUD

### Criação

- tela dedicada quando formulário for extenso;
- validações próximas ao campo;
- bloquear duplo submit;
- estado de processamento no botão;
- feedback de sucesso.

### Edição

- carregar dados atuais com skeleton/loading;
- preservar dados após erro;
- identificar claramente modo de edição;
- feedback após salvar.

### Inativação

Preferir inativação para cadastros auxiliares e colaboradores quando essa for a regra de domínio.

### Exclusão

Quando permitida:

- usar ConfirmDialog/AlertDialog;
- nunca usar `window.confirm`;
- informar consequência;
- indicar processamento;
- tratar conflito/dependência.

---

## 13. Formulários

Padrão visual obrigatório:

- label visível;
- indicação de obrigatório;
- helper text apenas quando necessário;
- erro inline;
- erro geral no topo do formulário quando não for específico de campo;
- ações agrupadas;
- consistência de largura e espaçamento;
- foco previsível.

Selects com listas maiores ou dinâmicas devem evoluir para combobox pesquisável no frontend final.

---

## 14. Estados de interface

Telas críticas devem prever:

- loading;
- skeleton;
- empty;
- error;
- success;
- disabled;
- pending;
- forbidden;
- not found.

### Regras

- tabelas, listas, cards e dashboard devem usar skeleton quando a estrutura for conhecida;
- empty state deve explicar a ausência e, quando aplicável, oferecer ação;
- error state deve oferecer tentativa novamente quando possível;
- o usuário nunca deve ver stack trace ou mensagem técnica crua;
- loading textual isolado deve ser substituído por padrão visual quando houver layout previsível.

---

## 15. Feedback e mensagens

### Sucesso

Toast discreto.

Exemplos:

- “Afastamento cadastrado com sucesso.”
- “Alterações salvas com sucesso.”
- “Documento enviado com sucesso.”
- “Cadastro inativado com sucesso.”

### Validação

Erro inline junto ao campo.

### Erro geral

Alert no topo do formulário ou ErrorState no conteúdo.

### Ação destrutiva

Confirmação antes da ação + toast/feedback após resultado.

---

## 16. Dashboard

Componentes:

- MetricCard;
- ChartCard;
- lista/tabela prioritária.

Regras:

- todos os cards devem suportar valores longos;
- gráficos devem ter título, legenda/contexto e estado sem dados;
- não criar números hardcoded;
- loading do dashboard deve usar skeleton;
- tooltips devem ser legíveis;
- cores devem usar tokens;
- a tabela prioritária deve seguir os mesmos padrões de responsividade das demais listagens.

---

## 17. Histórico e documentos

### Timeline

- ordem temporal claramente indicada;
- data, tipo e descrição distinguíveis;
- ações condicionadas à permissão;
- empty state próprio.

### Documentos

- nome do arquivo;
- tipo;
- data;
- ação de download;
- ação de exclusão somente quando permitida;
- upload com indicação de limite e tipos aceitos;
- estado de upload/processamento;
- confirmação de exclusão;
- erro de upload compreensível.

---

## 18. Notificações

O sininho deve:

- indicar existência de pendências;
- exibir tipos de alerta com hierarquia visual;
- distinguir lida/não lida sem depender exclusivamente de cor;
- permitir marcar como lida;
- manter navegação/ação contextual quando aplicável;
- ter empty state.

A persistência real por usuário será implementada após a exportação.

---

## 19. Acessibilidade

Requisitos mínimos:

- foco visível;
- navegação por teclado;
- botões de ícone com nome acessível;
- labels associadas a inputs;
- dialogs com foco controlado;
- feedback não dependente apenas de cor;
- contraste adequado;
- área de toque adequada;
- hierarquia semântica de headings;
- tabelas/cards compreensíveis por tecnologias assistivas quando aplicável.

---

## 20. Motion

Não há necessidade de uma camada especializada de motion nesta fase.

Permitido:

- transições discretas de hover/focus;
- feedback de loading;
- abertura/fechamento padrão de dialog/sheet;
- microinterações já fornecidas pelos componentes base.

Evitar:

- animações decorativas;
- transições de página complexas;
- efeitos que atrasem tarefa;
- introdução de nova biblioteca exclusivamente para animação.

---

## 21. Dark mode

Dark mode não é requisito da base atual.

Regras:

- não investir esforço de escopo em criar ou revisar dark mode nesta etapa;
- evitar novos hardcodes que inviabilizem suporte futuro;
- se o protótipo já tiver dark mode funcional, não quebrá-lo;
- dark mode não bloqueia a exportação.

---

## 22. Matriz de telas

| Tela | Rota atual/candidata | Layout | Componentes principais | Ajuste visual necessário |
|---|---|---|---|---|
| Afastamentos | `/` | AppLayout | PageHeader, FilterBar, DataTable/MobileCardList, Pagination | Padronizar filtros, estados, paginação e mobile |
| Dashboard | `/dashboard` | DashboardLayout | MetricCard, ChartCard, tabela prioritária | Skeleton, erro/vazio, responsividade |
| Novo afastamento | `/afastamentos/novo` | AppLayout | Form, FormActions | Padronizar erros, submit e espaçamento |
| Detalhe do afastamento | `/afastamentos/:id` | AppLayout | blocos de dados, Timeline, DocumentList | Hierarquia, estados e ações |
| Editar afastamento | `/afastamentos/:id/editar` | AppLayout | Form, FormActions | Mesmo padrão do cadastro |
| Colaboradores | `/colaboradores` | AppLayout | FilterBar, DataTable/MobileCardList, dialogs | Paginação, estados, confirmação |
| Configurações | `/configuracoes` | SettingsLayout | Tabs, listagens, dialogs | Unificar padrões entre abas |
| Login Microsoft | futura | AuthLayout | botão Microsoft, feedback | Implementar após exportação |
| Usuários/acessos | futura | SettingsLayout/AppLayout | DataTable, filtros, badges | Implementar após exportação |
| Histórico do colaborador | futura | AppLayout | timeline/lista | Implementar após exportação |
| 403/404/500 | futuras | EmptyLayout | ErrorState | Implementar no frontend final |

---

## 23. Ajustes obrigatórios antes da exportação

1. Padronizar confirmações destrutivas e remover uso de `window.confirm`.
2. Padronizar filtros, botões e ações entre listagens.
3. Introduzir paginação visual consistente nas listagens que possam crescer.
4. Usar cabeçalho fixo nas tabelas com área rolável quando fizer sentido.
5. Criar alternativa em cards/lista para tabelas no mobile.
6. Padronizar estados loading/skeleton/empty/error.
7. Garantir mensagens e textos em português.
8. Revisar responsividade de dashboard, filtros, formulários, configurações, detalhes, histórico e documentos.
9. Preservar a linguagem visual atual, centralizando tokens em vez de redesenhar a marca.
10. Não alterar regras de negócio, banco, storage, autenticação ou políticas de acesso nesta rodada.

---

## 24. Itens explicitamente fora da rodada visual atual

- autenticação Microsoft real;
- proteção de rotas real;
- gestão real de usuários;
- RBAC real;
- API/backend;
- banco definitivo;
- integração Apdata;
- storage definitivo;
- auditoria técnica;
- e-mail;
- PWA;
- white label;
- página pública/SEO;
- IA;
- motion avançado;
- dark mode como novo requisito.

---

## 25. Maturidade

**Estado atual:** Nível 2 — identidade e interface funcionais, porém padrões ainda parciais.

**Meta antes da exportação:** Nível 4 — telas críticas com padrões consistentes, estados, responsividade e acessibilidade mínima consolidados.

A governança visual completa poderá evoluir durante a implementação final, mas não deve bloquear a exportação quando os ajustes obrigatórios deste documento estiverem atendidos.

---

## 26. Critérios de aceite visual

- [ ] linguagem visual atual preservada;
- [ ] tokens centralizados ou preparados para centralização;
- [ ] componentes repetidos seguem padrões consistentes;
- [ ] ações destrutivas usam confirmação padronizada;
- [ ] listagens possuem busca/filtros/paginação quando aplicável;
- [ ] tabelas possuem comportamento mobile adequado;
- [ ] estados loading/empty/error/success estão previstos;
- [ ] formulários exibem validações de modo consistente;
- [ ] dashboard possui skeleton e estados sem dados/erro;
- [ ] documentos possuem feedback de upload/download/exclusão;
- [ ] notificações possuem estado vazio e distinção lida/não lida;
- [ ] textos visíveis estão em português;
- [ ] navegação por teclado e foco são preservados nos componentes críticos;
- [ ] nenhuma nova lógica backend foi adicionada para realizar o refinamento visual;
- [ ] nenhuma funcionalidade temporária foi criada apenas para “parecer pronta”.

---

## 27. Handoff

Este Design System alimenta diretamente:

- arquitetura e organização do frontend;
- prompt de refinamento do protótipo;
- testes visuais e de acessibilidade;
- implementação futura das telas de autenticação, usuários, histórico consolidado e erros;
- documentação de handoff para continuidade do projeto.
