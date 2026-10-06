# 04 — Requisitos do Sistema — MCM Gestão de Afastados

**Versão:** 1.0  
**Data:** 05/10/2026  
**Status:** Em revisão  
**Escopo desta versão:** base full stack integrada para continuidade técnica

## Sumário

1. Metadados e fontes
2. Requirements Blueprint
3. Resumo executivo
4. Governança e classificação dos requisitos
5. Requisitos funcionais
6. Requisitos não funcionais
7. Requisitos de experiência
8. Requisitos de dados
9. Regras de negócio
10. Requisitos de permissão e controle de acesso
11. Requisitos de integração
12. Requisitos operacionais e de ambiente
13. Fora do escopo desta fase
14. Restrições, premissas e decisões pendentes
15. Riscos
16. Matriz Requisito → Fluxo → Tela → API candidata → Entidade candidata → Teste
17. Critérios de validação e maturidade
18. Handoff para as próximas etapas
19. Checklist de revisão

---

## 1. Metadados e fontes

```yaml
document:
  name: "Requisitos do Sistema"
  project: "MCM Gestão de Afastados"
  version: "1.0"
  status: "Em revisão"
  owner: "Responsável técnico do projeto"
  created_at: "2026-10-05"
  updated_at: "2026-10-05"

sources:
  - "Questionário de descoberta funcional respondido pelo idealizador"
  - "Auditoria técnica do estado atual do protótipo"
  - "Fato e Contexto"
  - "Brief Mestre"
  - "Discovery Técnica e Estratégica"
  - "Registro de Decisões"

delivery_context:
  goal: "Entregar uma base full stack funcional, integrada e documentada para continuidade por outro desenvolvedor."
  frontend_backend_database_integrated: true
  corporate_authentication: "Microsoft"
  allowed_identity_domains:
    - "mcm.eng.br"
    - "mcmmontagens.com.br"
  direct_browser_database_access_allowed: false
  final_base_must_be_independent_from_prototype_platform: true
```

### 1.1 Classificação das evidências

- **CONFIRMADO:** informado diretamente pelo responsável/idealizador ou por decisão explícita do projeto.
- **OBSERVADO:** encontrado na auditoria técnica do estado atual.
- **INFERIDO:** deduzido de comportamento existente, ainda sem confirmação funcional.
- **RECOMENDADO:** requisito técnico proposto para tornar a base segura e sustentável.
- **REQUER_DECISAO:** depende de decisão adicional antes de fechamento definitivo.
- **FUTURO:** necessidade reconhecida, mas propositalmente fora desta entrega.

---

## 2. Requirements Blueprint

```yaml
requirements_blueprint:
  project_name: "MCM Gestão de Afastados"
  delivery_mode: "Base full stack integrada para handoff"
  requirement_groups:
    functional:
      total: 15
      must: 15
      blocked: 0
    non_functional:
      total: 12
    experience:
      total: 8
    data:
      total: 14
    permissions:
      total: 14
    business_rules:
      total: 16
    integrations:
      total: 3
    operational_infrastructure:
      total: 8
    acquisition:
      total: 0
    motion_microinteractions:
      total: 0
    ai_orchestration:
      total: 0

  mvp_requirements:
    - "RF-001 a RF-015"
    - "RNF-001 a RNF-012"
    - "RX-001 a RX-008"
    - "RD-001 a RD-014"
    - "RP-001 a RP-014"
    - "RN-001 a RN-016"
    - "RI-001"
    - "RO-001 a RO-008"

  future_requirements:
    - "RI-002 - Integração com Apdata"
    - "RI-003 - Resumo de pendências por e-mail"

  blocked_requirements: []

  decisions_required:
    - "Definir matriz final de papéis/permissões além do perfil funcional SMS."
    - "Definir mecanismo definitivo de armazenamento físico dos documentos."
    - "Definir contrato técnico e fase da integração com Apdata."
    - "Definir ambiente alvo e parâmetros finais de backup/recuperação."
    - "Definir mecanismo de provisionamento do primeiro usuário com permissão administrativa."

  readiness_summary:
    requirements_maturity_level: 4
    ready_for_functional_spec: true
    ready_for_architecture: true
    ready_for_technical_execution: true
    caveat: "Decisões pendentes devem permanecer configuráveis ou ser fechadas antes da implantação em produção."
```

### 2.1 Interpretação

O conjunto de requisitos está suficientemente definido para orientar especificação funcional e desenho técnico da base. Os itens pendentes não impedem a construção da fundação, desde que não sejam transformados em decisões irreversíveis antes das etapas de arquitetura, segurança, integração e infraestrutura.

---

## 3. Resumo executivo

A solução deve centralizar o controle de afastamentos de colaboradores, substituindo controles dispersos em planilhas e arquivos separados e reduzindo risco de perda de informação, esquecimento de prazos e dificuldade de reconstrução histórica.

A entrega desta fase não corresponde ao produto final completo. O objetivo é construir uma **base operacional e sustentável**, composta por:

- frontend integrado à API;
- backend com autenticação, autorização e regras de domínio;
- banco relacional persistente;
- CRUDs reais;
- documentos protegidos;
- notificações e dashboard conectados aos dados reais;
- migrations, seeds, configuração por ambiente e testes críticos;
- documentação suficiente para continuidade técnica.

O acesso deverá utilizar identidade corporativa Microsoft e somente contas dos domínios `mcm.eng.br` e `mcmmontagens.com.br` poderão ser consideradas elegíveis. A elegibilidade por domínio não substitui a autorização da aplicação: o usuário também deverá existir/estar habilitado localmente e possuir permissões compatíveis com cada ação.

A interface atual é uma referência útil de fluxo e experiência, mas não define arquitetura, contratos de API ou modelo final de dados.

---

## 4. Governança e classificação dos requisitos

### 4.1 Status do documento

Todos os requisitos desta versão estão em **Ready for Review**. Eles podem ser usados para especificação funcional e desenho técnico, mas decisões marcadas como `REQUER_DECISAO` devem continuar visíveis.

### 4.2 Prioridade

- **Must:** necessário para a base e/ou para os critérios de aceite informados.
- **Should:** importante, mas não bloqueia a entrega da base.
- **Could:** desejável.
- **Won't now:** explicitamente fora desta fase.

### 4.3 Autoridade das regras

- validação frontend melhora a experiência;
- validação backend é obrigatória para regras, permissões, integridade e segurança;
- o frontend não pode ser a autoridade final de acesso;
- o frontend não pode acessar o banco diretamente.

---

# 5. Requisitos Funcionais (RF)

## RF-001 — Autenticação corporativa Microsoft

**Descrição:** o sistema deve autenticar usuários utilizando identidade corporativa Microsoft.

**Objetivo do usuário:** acessar a aplicação com a conta corporativa, sem senha específica da aplicação.

**Fonte:** decisão do projeto.  
**Evidência:** autenticação corporativa explicitamente definida para esta fase.  
**Confiança:** Alta.  
**Status da evidência:** CONFIRMADO.  
**Prioridade:** Must.  
**Status:** Ready for Review.

**Pré-condições**
- configuração de identidade corporativa disponível por ambiente;
- conta Microsoft válida.

**Pós-condições**
- identidade validada;
- sessão de aplicação estabelecida somente se as regras de elegibilidade/autorização forem atendidas.

**Critérios de aceite**
- Dado um usuário com conta Microsoft válida, quando iniciar o login, então o fluxo de autenticação corporativa deve ser iniciado.
- Dado um usuário autenticado com e-mail fora dos domínios permitidos, quando retornar à aplicação, então o acesso deve ser negado.
- Dado um usuário autenticado pertencente a domínio permitido mas não habilitado localmente, quando retornar à aplicação, então o acesso deve ser negado com mensagem amigável.
- O backend deve validar a identidade recebida; o frontend não pode confiar apenas em informação de e-mail enviada pelo navegador.

**Relacionamentos:** RN-013, RN-014, RP-001, RI-001, RNF-001, RNF-002.

---

## RF-002 — Sessão, identificação do usuário atual e logout

**Descrição:** o sistema deve manter sessão autenticada, identificar o usuário atual, carregar suas permissões e permitir encerramento seguro da sessão.

**Fonte:** decisão do projeto + necessidade estrutural de autenticação.  
**Confiança:** Alta.  
**Status da evidência:** RECOMENDADO/CONFIRMADO.  
**Prioridade:** Must.

**Critérios de aceite**
- A aplicação deve disponibilizar a identidade do usuário logado e suas permissões após autenticação.
- Requisições protegidas sem sessão válida devem ser rejeitadas.
- O logout deve invalidar/encerrar a sessão da aplicação conforme estratégia técnica adotada.
- Conta local inativa não pode continuar realizando operações protegidas após nova validação da sessão.

**Relacionamentos:** RP-001, RP-002, RNF-001, RNF-002.

---

## RF-003 — Gestão de usuários e autorizações da aplicação

**Descrição:** usuários autorizados devem conseguir consultar usuários locais, habilitar/desabilitar acesso e associar papéis/permissões conforme autorização.

**Fonte:** questionário do idealizador.  
**Confiança:** Alta.  
**Status da evidência:** CONFIRMADO.  
**Prioridade:** Must.

**Critérios de aceite**
- Usuário com permissão de administração deve listar usuários e visualizar status de acesso.
- Deve ser possível habilitar e desabilitar usuário local sem alterar a conta corporativa externa.
- Deve ser possível associar permissões por papel ou estrutura equivalente.
- Usuário sem permissão administrativa não deve visualizar ações de gestão de acesso nem executá-las via API.
- A aplicação deve suportar pelo menos o perfil funcional conhecido como `SMS`, sem impedir criação futura de outros perfis.

**Observação:** a matriz final de papéis além do perfil SMS permanece configurável e requer decisão.

**Relacionamentos:** RP-002, RP-003, RN-015, RD-001, RD-002, RD-003.

---

## RF-004 — Gestão de cadastros auxiliares

**Descrição:** o sistema deve permitir consultar, cadastrar, editar, ordenar quando aplicável e inativar cadastros de referência utilizados pelo domínio.

**Cadastros mínimos**
- obras;
- funções;
- tipos de benefício;
- situações de afastamento;
- tipos de andamento;
- tipos de documento.

**Fonte:** questionário + estado atual observado.  
**Confiança:** Alta.  
**Status da evidência:** CONFIRMADO/OBSERVADO.  
**Prioridade:** Must.

**Critérios de aceite**
- Usuário autorizado deve criar e editar itens de cadastro.
- Deve ser possível inativar item sem apagar referências históricas.
- Item inativo não deve ser oferecido para novos registros.
- Registro histórico que já referencia item inativo deve continuar exibindo esse valor.
- Situação de afastamento deve possuir classificação de sistema válida: `ATIVO`, `ENCERRADO` ou `APOSENTADO`.

**Relacionamentos:** RN-001, RN-002, RN-003, RP-004, RD-004 a RD-009.

---

## RF-005 — Gestão de colaboradores

**Descrição:** o sistema deve permitir consultar, cadastrar e editar colaboradores necessários ao acompanhamento dos afastamentos.

**Dados funcionais mínimos**
- identificador corporativo do colaborador;
- nome;
- obra;
- função;
- contato;
- status ativo/inativo.

**Fonte:** questionário + estado atual observado.  
**Confiança:** Alta.  
**Status da evidência:** CONFIRMADO/OBSERVADO.  
**Prioridade:** Must.

**Critérios de aceite**
- CPF não deve ser obrigatório nem necessário para o fluxo.
- Identificador corporativo do colaborador deve ser preservado.
- Contato deve ser editável na aplicação.
- Inativação deve preservar os afastamentos existentes.
- Usuário sem permissão de manutenção deve ter somente acesso de consulta quando autorizado.

**Relacionamentos:** RN-004, RN-005, RP-005, RD-010, RI-002.

---

## RF-006 — Consulta do histórico do colaborador

**Descrição:** ao consultar um colaborador, o sistema deve permitir recuperar seus afastamentos e a linha do tempo relacionada, preservando histórico mesmo após encerramentos.

**Fonte:** questionário do idealizador; lacuna observada no estado atual, onde o histórico é centrado no afastamento.  
**Confiança:** Alta quanto à necessidade; Média quanto à forma visual final.  
**Status da evidência:** CONFIRMADO + RECOMENDADO para consolidação da visão.  
**Prioridade:** Must.

**Critérios de aceite**
- Usuário autorizado deve localizar um colaborador e consultar seus afastamentos.
- A consulta deve permitir acessar andamentos e documentos vinculados a cada afastamento, respeitando permissão.
- Afastamentos encerrados e aposentados devem permanecer acessíveis no histórico.
- A forma visual definitiva pode ser tela dedicada, aba ou drill-down, desde que o comportamento funcional seja atendido.

**Relacionamentos:** RN-006, RP-006, RD-010, RD-011, RD-012, RD-013.

---

## RF-007 — Listagem, pesquisa e filtros de afastamentos

**Descrição:** o sistema deve listar afastamentos e permitir busca/filtros para operação cotidiana.

**Filtros mínimos**
- colaborador;
- obra;
- função;
- benefício;
- situação.

**Fonte:** questionário + estado atual observado.  
**Confiança:** Alta.  
**Status da evidência:** CONFIRMADO/OBSERVADO.  
**Prioridade:** Must.

**Critérios de aceite**
- Usuário autorizado deve combinar filtros disponíveis.
- A listagem deve refletir dados persistidos e não valores fixos.
- Resultado vazio deve ser tratado explicitamente.
- A paginação/ordenação deve suportar crescimento do volume sem exigir carregamento integral no navegador.
- Ações por linha devem respeitar permissões.

**Relacionamentos:** RP-006, RX-002, RNF-005.

---

## RF-008 — Cadastro de afastamento

**Descrição:** o sistema deve registrar novo afastamento para colaborador existente.

**Dados funcionais mínimos**
- colaborador;
- data de afastamento;
- situação;
- tipo de benefício quando aplicável;
- data de fim de benefício quando aplicável;
- previsão de retorno quando aplicável;
- obra e função relacionadas ao caso;
- causa/CID quando aplicável;
- observações.

**Fonte:** questionário + estado atual observado.  
**Confiança:** Alta.  
**Status da evidência:** CONFIRMADO/OBSERVADO.  
**Prioridade:** Must.

**Critérios de aceite**
- O backend deve validar campos obrigatórios e referências.
- Cadastros inativos não podem ser escolhidos em novo afastamento.
- O sistema deve persistir o novo afastamento antes de confirmar sucesso.
- Erro de validação deve indicar campos a corrigir sem perder dados já preenchidos.
- Usuário sem permissão não deve criar o registro.

**Relacionamentos:** RN-001 a RN-005, RP-007, RD-011.

---

## RF-009 — Edição, atualização e encerramento do afastamento

**Descrição:** usuário autorizado deve poder atualizar informações de afastamento e alterar sua situação, inclusive para condições de encerrado ou aposentado conforme cadastro de situação.

**Fonte:** questionário + estado atual observado.  
**Confiança:** Alta.  
**Status da evidência:** CONFIRMADO/OBSERVADO.  
**Prioridade:** Must.

**Critérios de aceite**
- O backend deve validar situação e referências.
- Valor histórico inativo já associado pode permanecer visível durante edição.
- A alteração para situação classificada como encerrada/aposentada não pode apagar histórico nem documentos.
- O encerramento funcional deve ocorrer por situação/regra de domínio, não por exclusão física do afastamento.
- Alterações relevantes devem gerar trilha de auditoria.

**Relacionamentos:** RN-001, RN-002, RN-006, RN-016, RP-008.

---

## RF-010 — Detalhe do afastamento

**Descrição:** o sistema deve exibir visão consolidada do afastamento com dados principais, situação, histórico/andamentos e documentos permitidos.

**Fonte:** estado atual observado + questionário.  
**Confiança:** Alta.  
**Status da evidência:** OBSERVADO/CONFIRMADO.  
**Prioridade:** Must.

**Critérios de aceite**
- Informações devem ser recuperadas por identificador do afastamento.
- Recurso inexistente deve gerar estado de não encontrado.
- Usuário sem permissão deve receber estado de acesso negado.
- Histórico e documentos devem respeitar as permissões específicas.

**Relacionamentos:** RF-011, RF-012, RP-006, RX-003.

---

## RF-011 — Registro e manutenção de andamentos

**Descrição:** o sistema deve permitir registrar e consultar andamentos associados ao afastamento, formando linha do tempo operacional.

**Dados mínimos**
- data do andamento;
- tipo de andamento;
- descrição;
- próxima ação quando aplicável;
- data da próxima ação quando aplicável.

**Fonte:** questionário + estado atual observado.  
**Confiança:** Alta.  
**Status da evidência:** CONFIRMADO/OBSERVADO.  
**Prioridade:** Must.

**Critérios de aceite**
- Usuário autorizado deve registrar andamento.
- Alterações devem ser auditáveis.
- Exclusão, quando permitida, deve exigir confirmação e gerar evidência de auditoria.
- Próxima ação pode alimentar notificações.
- Encerramento do afastamento não deve apagar andamentos.

**Relacionamentos:** RN-006, RN-010, RN-016, RP-009, RD-012.

---

## RF-012 — Gestão protegida de documentos

**Descrição:** o sistema deve permitir upload, consulta, download e exclusão controlada de documentos vinculados a afastamento e, quando aplicável, a um andamento.

**Fonte:** questionário + estado atual observado.  
**Confiança:** Alta.  
**Status da evidência:** CONFIRMADO/OBSERVADO.  
**Prioridade:** Must.

**Critérios de aceite**
- Arquivos não podem ser públicos ou enumeráveis sem autorização.
- Upload deve validar tipo e tamanho no backend.
- Download deve exigir usuário autenticado e autorizado.
- Exclusão deve exigir permissão específica e confirmação.
- Exclusão deve gerar trilha de auditoria.
- Documento de afastamento encerrado deve permanecer disponível enquanto não houver exclusão autorizada/política de retenção em contrário.
- Tipos e limite de arquivo devem ser configuráveis; como baseline de continuidade, considerar até 10 MB e PDF/JPEG/PNG/DOC/DOCX até nova decisão.

**Relacionamentos:** RN-006, RN-011, RN-012, RP-010, RD-013, RNF-003.

---

## RF-013 — Geração e consulta de notificações operacionais

**Descrição:** o sistema deve apresentar notificações relacionadas a prazos e pendências relevantes.

**Eventos mínimos**
- benefício com vencimento dentro de 30 dias;
- benefício vencido;
- retorno previsto dentro de 15 dias;
- retorno previsto vencido enquanto aplicável;
- próxima ação dentro da janela operacional definida;
- próxima ação vencida enquanto pendente.

**Fonte:** questionário + estado atual observado.  
**Confiança:** Alta para benefício/retorno; Média para janela de próxima ação por ter sido observada no estado atual.  
**Status da evidência:** CONFIRMADO/OBSERVADO.  
**Prioridade:** Must.

**Critérios de aceite**
- Alertas devem ser calculados sobre dados reais persistidos.
- Alertas vencidos devem continuar sinalizados enquanto a pendência aplicável não for resolvida.
- Próximas ações permanecem no sininho e não devem compor o indicador de dashboard proibido pela regra RN-010.
- Usuário deve visualizar apenas alertas compatíveis com seu acesso aos respectivos registros.

**Relacionamentos:** RN-007, RN-008, RN-009, RN-010, RP-011, RD-014.

---

## RF-014 — Persistência de leitura de notificações por usuário

**Descrição:** o sistema deve persistir o estado de leitura de cada notificação por usuário.

**Fonte:** questionário + lacuna observada no estado atual.  
**Confiança:** Alta.  
**Status da evidência:** CONFIRMADO/RECOMENDADO.  
**Prioridade:** Must.

**Critérios de aceite**
- Marcar alerta como lido deve persistir no banco e acompanhar o usuário em outro navegador/dispositivo.
- Limpar armazenamento local do navegador não pode restaurar uma notificação já lida.
- Leitura não deve alterar afastamento, situação, prazo ou estado de resolução da pendência.
- Usuário não pode alterar leitura de outro usuário.

**Relacionamentos:** RN-009, RP-012, RD-014.

---

## RF-015 — Dashboard operacional

**Descrição:** o sistema deve apresentar visão gerencial coerente com os registros persistidos.

**Indicadores e visões mínimas**
- afastamentos ativos;
- benefícios vencidos;
- retornos previstos em até 15 dias;
- ativos por obra;
- novos afastamentos por mês;
- duração dos afastamentos;
- tabela de benefícios/retornos prioritários.

**Fonte:** questionário + estado atual observado.  
**Confiança:** Alta quanto à necessidade; Média quanto à fórmula atual observada, que ainda deverá ser validada na implementação.  
**Status da evidência:** CONFIRMADO/OBSERVADO.  
**Prioridade:** Must.

**Critérios de aceite**
- Dados devem vir de backend/banco reais.
- Cada indicador deve possuir regra de cálculo documentada e testável.
- Próximas ações vencidas não devem ser adicionadas ao dashboard.
- Resultado deve ser coerente com a listagem de afastamentos.
- Estado sem dados, loading e erro devem ser tratados.

**Relacionamentos:** RN-001, RN-007 a RN-010, RP-013, RX-004.

---

# 6. Requisitos Não Funcionais (RNF)

| ID | Categoria | Requisito | Validação |
|---|---|---|---|
| RNF-001 | Segurança | Toda rota e operação protegida deve exigir identidade autenticada válida. | Testes 401/fluxo de login |
| RNF-002 | Segurança | Autorização deve ser validada no backend em toda ação protegida; esconder UI não é controle de segurança. | Testes 403 por permissão |
| RNF-003 | Privacidade | Dados de afastamento, CID/causa e documentos devem ser tratados como dados sensíveis e nunca expostos publicamente. | Revisão de API/storage + testes |
| RNF-004 | Auditoria | Operações críticas devem registrar usuário, ação, recurso, data/hora e contexto mínimo de alteração. | Teste de integração + consulta de log |
| RNF-005 | Desempenho/escala | Listagens devem suportar paginação e filtros no backend, evitando carregar todo o conjunto de dados no navegador. | Teste funcional com volume representativo |
| RNF-006 | Manutenibilidade | Frontend, backend e persistência devem estar desacoplados por API e organizados para continuidade técnica. | Revisão arquitetural |
| RNF-007 | Portabilidade | A base final não deve depender de serviços específicos usados apenas pelo protótipo; configuração deve ser reproduzível por ambiente. | Busca de dependências + setup limpo |
| RNF-008 | Qualidade | Fluxos críticos de autenticação, autorização e CRUD devem possuir testes automatizados de integração e/ou E2E conforme estratégia de QA. | Pipeline/local test |
| RNF-009 | Usabilidade | Erros técnicos crus não devem ser apresentados ao usuário; mensagens devem ser acionáveis e em pt-BR. | Testes de interface |
| RNF-010 | Responsividade | Fluxos essenciais devem permanecer utilizáveis em desktop, tablet e mobile, com prioridade de experiência em desktop corporativo. | Testes responsivos |
| RNF-011 | Operação | Deve existir procedimento documentado de backup e recuperação antes da implantação com dados reais. | Execução/ensaio documentado |
| RNF-012 | Segredos | Credenciais, secrets, tokens e chaves não podem ser versionados; devem ser fornecidos por ambiente. | revisão de repositório/configuração |

---

# 7. Requisitos de Experiência (RX)

## RX-001 — Layout autenticado consistente

Navegação, cabeçalho, identificação do usuário e ações de sessão devem seguir padrão único em todas as áreas autenticadas.

**Estados:** loading de sessão, autenticado, acesso negado, erro de sessão.

## RX-002 — Listagens padronizadas

Tabelas/listas devem possuir, quando aplicável:

- busca;
- filtros;
- ordenação;
- paginação;
- loading;
- vazio;
- erro;
- ações por linha;
- comportamento responsivo.

## RX-003 — Detalhe com hierarquia clara

Detalhe do afastamento deve separar visualmente dados principais, histórico e documentos, mantendo ações condicionadas à permissão.

## RX-004 — Dashboard com fonte e estado explícitos

Cards, gráficos e tabela prioritária devem possuir loading, vazio e erro e não podem exibir números hardcoded.

## RX-005 — Formulários com validação previsível

- erro de campo inline;
- erro geral no topo ou alerta contextual;
- submit com estado de processamento;
- bloqueio de duplo envio;
- preservação de dados após erro;
- mensagem de sucesso.

## RX-006 — Ações destrutivas consistentes

Exclusões permitidas devem sempre usar confirmação padronizada, descrição do impacto e feedback de resultado.

## RX-007 — Acessibilidade mínima

- navegação por teclado;
- foco visível;
- nome acessível em botões/ícones;
- contraste adequado;
- erro não comunicado apenas por cor;
- campos associados a labels.

## RX-008 — Responsividade funcional

Desktop é prioridade. Em tablet/mobile, tabelas podem se transformar em lista/cards ou reduzir colunas, desde que busca, filtros, consulta e ações essenciais permaneçam acessíveis.

---

# 8. Requisitos de Dados (RD)

> Os nomes abaixo representam entidades funcionais. Tabelas, nomes físicos, tipos e índices definitivos serão definidos na modelagem de banco.

| ID | Entidade funcional | Dados/propósito | Sensibilidade | Auditoria |
|---|---|---|---|---|
| RD-001 | Usuário | identidade local, e-mail corporativo, nome, status, vínculo externo | PII/Interno | Sim |
| RD-002 | Papel | agrupamento de permissões | Interno | Sim |
| RD-003 | Permissão | recurso/ação autorizável e associações | Interno | Sim |
| RD-004 | Obra | nome/código/origem/status | Interno | Sim |
| RD-005 | Função | nome/código/origem/status | Interno | Sim |
| RD-006 | Tipo de benefício | código/nome/status/ordem | Interno | Sim |
| RD-007 | Situação de afastamento | nome/status/classificação de sistema | Interno | Sim |
| RD-008 | Tipo de andamento | nome/status/ordem | Interno | Sim |
| RD-009 | Tipo de documento | nome/status/ordem | Interno | Sim |
| RD-010 | Colaborador | ID corporativo, nome, obra, função, contato, status, origem | PII/Interno | Sim |
| RD-011 | Afastamento | colaborador, datas, benefício, situação, causa/CID quando aplicável, observações | Sensível | Sim |
| RD-012 | Andamento | data, tipo, descrição, próxima ação, data da próxima ação, autor | Sensível/Interno | Sim |
| RD-013 | Documento | metadados, vínculo, tipo, localização lógica, integridade, autor | Sensível | Sim |
| RD-014 | Leitura de alerta | usuário, chave/alerta, data de leitura | Interno | Sim |

### 8.1 Dados adicionais estruturantes

A implementação deve também manter trilha de auditoria, ainda que sua modelagem física definitiva seja definida posteriormente.

### 8.2 Regras de dados

- identificadores técnicos internos não substituem o ID corporativo do colaborador;
- CPF não é necessário;
- contato do colaborador deve ser editável;
- cadastros inativados devem preservar vínculos históricos;
- data sem horário deve ser tratada como data civil, evitando conversão indevida por timezone;
- timestamps de auditoria devem utilizar padrão consistente;
- arquivos devem ser armazenados fora de conteúdo binário direto das tabelas, salvo decisão arquitetural contrária;
- o frontend não deve possuir credencial que permita acesso administrativo direto ao banco.

---

# 9. Regras de Negócio (RN)

| ID | Regra | Fonte/Status |
|---|---|---|
| RN-001 | Toda situação de afastamento deve pertencer a uma classificação de sistema: `ATIVO`, `ENCERRADO` ou `APOSENTADO`. | CONFIRMADO |
| RN-002 | Cadastro auxiliar inativo permanece válido para registros históricos já existentes. | CONFIRMADO |
| RN-003 | Cadastro auxiliar inativo não pode ser selecionado em novo registro. | CONFIRMADO |
| RN-004 | CPF não é requisito funcional para o colaborador. | CONFIRMADO |
| RN-005 | O ID corporativo do colaborador é a referência funcional externa esperada; contato permanece editável localmente. | CONFIRMADO |
| RN-006 | Encerrar/aposentar afastamento não pode apagar histórico nem documentos. | CONFIRMADO |
| RN-007 | Fim de benefício deve gerar alerta a partir de 30 dias antes do vencimento e continuar sinalizando quando vencido, se aplicável. | CONFIRMADO |
| RN-008 | Retorno previsto deve gerar alerta a partir de 15 dias antes da data e permanecer vencido enquanto a pendência for aplicável. | CONFIRMADO |
| RN-009 | Marcar alerta como lido não encerra afastamento nem resolve pendência. | CONFIRMADO |
| RN-010 | Próximas ações vencidas pertencem ao sininho/notificações e não devem ser incluídas como indicador do dashboard. | CONFIRMADO |
| RN-011 | Dados e documentos somente podem ser acessados por usuário autenticado e autorizado. | CONFIRMADO |
| RN-012 | Exclusão de documento deve ser controlada, confirmada e auditada; a política de retenção definitiva será definida na etapa de segurança/dados. | CONFIRMADO + REQUER_DECISAO |
| RN-013 | Somente identidades Microsoft com e-mail nos domínios `mcm.eng.br` ou `mcmmontagens.com.br` são elegíveis ao acesso. | DECIDIDO |
| RN-014 | Domínio permitido não concede autorização por si só; o usuário local deve estar ativo e possuir permissão. | DECIDIDO |
| RN-015 | Perfil funcional `SMS` deve ser representável no modelo de autorização e receber as capacidades aprovadas para a operação; demais perfis permanecem configuráveis. | CONFIRMADO/PARCIAL |
| RN-016 | Operações críticas de criação, alteração, mudança de situação, exclusão controlada e gestão de acesso devem gerar trilha de auditoria. | RECOMENDADO/NECESSÁRIO |

### 9.1 Caso de borda relevante

Se uma situação ou cadastro auxiliar for inativado depois de ter sido usado, registros antigos não podem quebrar nem trocar de valor silenciosamente.

---

# 10. Requisitos de Permissão e Controle de Acesso (RP)

> As chaves abaixo são capacidades funcionais. Nomenclatura e modelagem técnica final podem mudar, preservando o comportamento.

| ID | Recurso | Ação | Capacidade candidata | Observação |
|---|---|---|---|---|
| RP-001 | Sessão | acessar | `session.access` | exige identidade elegível + usuário local ativo |
| RP-002 | Usuários | visualizar | `users.read` | administrativo |
| RP-003 | Usuários/permissões | gerenciar | `users.manage` / `permissions.manage` | administrativo |
| RP-004 | Cadastros auxiliares | gerenciar | `settings.manage` | perfil SMS informado possui essa responsabilidade |
| RP-005 | Colaboradores | consultar/manter | `employees.read` / `employees.manage` | conforme autorização |
| RP-006 | Afastamentos | consultar | `leaves.read` | necessário para operação |
| RP-007 | Afastamentos | criar | `leaves.create` | backend valida |
| RP-008 | Afastamentos | atualizar/encerrar | `leaves.update` | sem exclusão física como fluxo de encerramento |
| RP-009 | Andamentos | consultar/manter | `progress.read` / `progress.manage` | delete controlado quando habilitado |
| RP-010 | Documentos | consultar/enviar/baixar/excluir | `documents.read`, `documents.upload`, `documents.download`, `documents.delete` | delete deve ser grant explícito |
| RP-011 | Notificações | consultar | `notifications.read` | respeita acesso ao registro |
| RP-012 | Notificações | marcar como lida | `notifications.read_state` | somente próprio usuário |
| RP-013 | Dashboard | consultar | `dashboard.read` | dados filtrados conforme autorização |
| RP-014 | Auditoria | consultar | `audit.read` | acesso administrativo; UI pode ficar fora da base se log for acessível tecnicamente |

### 10.1 Comportamento obrigatório

- menu e ações sem permissão devem ser ocultados quando isso melhorar UX;
- rota acessada sem permissão deve retornar estado 403;
- API deve negar a ação mesmo se a chamada for feita manualmente;
- permissões destrutivas devem ser separáveis das permissões de leitura;
- associação final das capacidades aos papéis deve ser configurável.

---

# 11. Requisitos de Integração (RI)

## RI-001 — Microsoft corporativo

**Prioridade:** Must.  
**Direção:** entrada de identidade.  
**Objetivo:** autenticação/SSO corporativo.  
**Dados esperados:** identificador externo, nome, e-mail e claims mínimas necessárias.  
**Restrição:** somente domínios corporativos permitidos; autorização local continua obrigatória.  
**Falha:** acesso negado com mensagem amigável, sem criação automática de privilégio.  
**Aprofundamento necessário:** tenant(s), claims, callback, segredo/certificado, renovação de sessão, logout e provisionamento.

## RI-002 — Apdata

**Prioridade:** Future/Should.  
**Objetivo futuro:** fornecer ID do funcionário, funcionário, obra, função e contato.  
**Status:** contrato técnico não disponível.  
**Comportamento nesta fase:** modelo deve estar preparado para guardar origem/identificador externo sem exigir integração real.  
**Falha futura:** a indisponibilidade do Apdata não deve impedir consulta de dados já persistidos; comportamento de sincronização será definido posteriormente.

## RI-003 — Resumo de pendências por e-mail

**Prioridade:** Won't now.  
**Status:** explicitamente fora da base atual.  
**Observação:** poderá ser implementado pela TI na implantação ou em fase posterior.

---

# 12. Requisitos Operacionais e de Ambiente (RO)

| ID | Requisito | Escopo | Validação |
|---|---|---|---|
| RO-001 | Repositório deve separar frontend e backend, mantendo orquestração de ambiente na raiz. | Local/Entrega | revisão estrutural |
| RO-002 | Banco relacional persistente deve subir de forma reproduzível no ambiente local. | Local | setup do zero + migrations |
| RO-003 | Frontend deve consumir backend/API e não possuir acesso direto ao banco. | Todos | revisão + teste |
| RO-004 | Configuração e secrets devem ser fornecidos por ambiente, com exemplos sem credenciais reais. | Todos | revisão de arquivos |
| RO-005 | Deve existir migration inicial e seeds adequados para desenvolvimento/homologação sem dados pessoais reais. | Local/Homologação | reset + migrate + seed |
| RO-006 | Upload/download de documentos deve possuir armazenamento persistente e protegido, desacoplado do navegador. | Todos | smoke funcional |
| RO-007 | Deve existir healthcheck mínimo do backend e logging de erro suficiente para diagnóstico. | Homologação/Produção | smoke/observabilidade |
| RO-008 | Deve existir documentação de setup, execução, migrations, autenticação, variáveis e handoff. | Entrega | outro desenvolvedor sobe a base seguindo somente a documentação |

### 12.1 Independência do protótipo

Antes do handoff técnico final, a base deve estar livre de:

- SDKs usados somente pela infraestrutura temporária do protótipo;
- configurações de build específicas da ferramenta de prototipação;
- clients de dados temporários;
- tipos gerados por infraestrutura que não fará parte da solução final;
- queries diretas do frontend para a persistência;
- referências de documentação que induzam manutenção da plataforma temporária.

---

# 13. Fora do escopo desta fase

- consulta automática ao Meu INSS;
- armazenamento de senha/credencial do Meu INSS;
- avaliação médica;
- concessão ou decisão de benefício;
- consulta automática ao INSS;
- resumo de pendências por e-mail;
- integração real com Apdata antes de contrato técnico;
- IA, agentes, RAG ou automação inteligente;
- páginas públicas, SEO ou aquisição;
- refinamentos visuais que não afetem uso, segurança, consistência ou handoff;
- implantação final em produção sem fechamento dos requisitos de segurança, infraestrutura e backup.

---

# 14. Restrições, premissas e decisões pendentes

## 14.1 Restrições

- sistema interno;
- dados potencialmente sensíveis;
- acesso restrito a usuários corporativos autorizados;
- sem CPF como requisito;
- sem credenciais de Meu INSS;
- a base será entregue a outro desenvolvedor;
- não pode depender da infraestrutura temporária do protótipo.

## 14.2 Premissas

- o perfil funcional SMS é o perfil de negócio conhecido nesta etapa;
- o cliente fornecerá configuração corporativa necessária para autenticação Microsoft;
- dados de produção reais só devem ser utilizados após os controles de segurança mínimos estarem ativos;
- a integração Apdata será tratada posteriormente quando houver documentação/acesso;
- a interface atual poderá ser refinada antes da exportação técnica.

## 14.3 Decisões pendentes

1. Matriz completa de papéis e permissões além do perfil SMS.
2. Provisionamento inicial do primeiro usuário administrativo.
3. Mecanismo físico de storage de documentos.
4. Política definitiva de retenção/exclusão de documentos e logs.
5. Contrato e periodicidade da futura integração Apdata.
6. Topologia final de homologação/produção.
7. RPO/RTO e periodicidade de backup.

---

# 15. Riscos

| ID | Tipo | Descrição | Prob. | Impacto | Mitigação |
|---|---|---|---|---|---|
| RISK-01 | Segurança | usuário autenticado acessar recurso sem autorização server-side | Média | Alto | permissionamento obrigatório no backend |
| RISK-02 | Privacidade | documentos/dados sensíveis expostos por URL pública ou regra aberta | Média | Alto | acesso mediado e storage privado |
| RISK-03 | Dados | regra crítica existir apenas no frontend | Alta | Alto | centralizar autoridade no backend + constraints |
| RISK-04 | Handoff | base depender de conhecimento não documentado | Média | Alto | README/setup/decisões/migrations/tests |
| RISK-05 | Integração | modelagem acoplar colaborador à futura fonte externa | Média | Médio | ID interno + identificador/origem externa |
| RISK-06 | Autenticação | domínio permitido ser confundido com autorização | Média | Alto | usuário local + permissões |
| RISK-07 | Documentos | exclusão deixar metadata/arquivo órfão | Média | Médio | transação lógica/compensação + auditoria |
| RISK-08 | UX | fluxos do protótipo manterem inconsistências e erros pouco claros | Média | Médio | revisão de design system/frontend |
| RISK-09 | Dashboard | fórmula não coincidir com regra funcional | Média | Alto | formalizar cálculos e testar contra dataset conhecido |
| RISK-10 | Operação | backup existir apenas nominalmente | Média | Alto | executar teste de restauração antes de produção |

---

# 16. Matriz Requisito → Fluxo → Tela → API candidata → Entidade candidata → Teste

> APIs e entidades são candidatas; contratos e schema finais serão fechados posteriormente.

| RF | Fluxo | Tela/Rota candidata | API candidata | Entidade candidata | Permissão | Teste principal |
|---|---|---|---|---|---|---|
| RF-001 | Login Microsoft | `/login` ou redirect corporativo | `/api/v1/auth/me` + callback técnico | Usuário | session.access | TST-001 login/domínio |
| RF-002 | Sessão/logout | layout autenticado | `/api/v1/auth/me`, `/api/v1/auth/logout` | Usuário/Sessão | session.access | TST-002 sessão |
| RF-003 | Usuários/acessos | `/usuarios` | `GET/POST/PATCH /api/v1/usuarios` | Usuário/Papel/Permissão | users.manage | TST-003 RBAC |
| RF-004 | Cadastros auxiliares | `/configuracoes` | `/api/v1/configuracoes/*` | Cadastros | settings.manage | TST-004 inativação |
| RF-005 | Colaboradores | `/colaboradores` | `/api/v1/colaboradores` | Colaborador | employees.* | TST-005 CRUD |
| RF-006 | Histórico colaborador | `/colaboradores/:id` ou visão equivalente | `/api/v1/colaboradores/:id/historico` | Colaborador/Afastamento | leaves.read | TST-006 histórico |
| RF-007 | Lista/filtros | `/` | `GET /api/v1/afastamentos` | Afastamento | leaves.read | TST-007 filtros |
| RF-008 | Novo afastamento | `/afastamentos/novo` | `POST /api/v1/afastamentos` | Afastamento | leaves.create | TST-008 criação |
| RF-009 | Editar/encerrar | `/afastamentos/:id/editar` | `PATCH /api/v1/afastamentos/:id` | Afastamento | leaves.update | TST-009 encerramento |
| RF-010 | Detalhe | `/afastamentos/:id` | `GET /api/v1/afastamentos/:id` | Afastamento | leaves.read | TST-010 detalhe |
| RF-011 | Andamentos | detalhe | `/api/v1/afastamentos/:id/andamentos` | Andamento | progress.* | TST-011 timeline |
| RF-012 | Documentos | detalhe | `/api/v1/afastamentos/:id/documentos` | Documento | documents.* | TST-012 arquivos |
| RF-013 | Notificações | sininho/layout | `GET /api/v1/notificacoes` | Alerta derivado | notifications.read | TST-013 alertas |
| RF-014 | Lidas | sininho/layout | `PATCH/POST /api/v1/notificacoes/:id/leitura` | LeituraAlerta | notifications.read_state | TST-014 persistência |
| RF-015 | Dashboard | `/dashboard` | `GET /api/v1/dashboard` | agregações | dashboard.read | TST-015 cálculos |

---

# 17. Critérios de validação e maturidade

## 17.1 Critérios gerais

- todos os RF Must possuem fonte e critério de aceite;
- todas as regras críticas possuem autoridade backend;
- dados sensíveis são classificados;
- APIs propostas permanecem candidatas até desenho de contratos;
- entidades propostas permanecem candidatas até modelagem de dados;
- fluxos de erro, vazio, loading e permissão são especificados;
- autenticação e autorização possuem testes negativos;
- documentos possuem testes de acesso e exclusão;
- dashboard possui dataset conhecido para validação de cálculo;
- setup limpo do repositório deve ser reproduzível.

## 17.2 Maturidade

**Nível atual: 4 — requisitos rastreados para fluxo, tela, API candidata, dados e teste.**

Os requisitos estão prontos para especificação funcional, design system, arquitetura e execução técnica planejada. A implantação em produção permanece condicionada ao fechamento de segurança, infraestrutura, storage e backup.

---

# 18. Handoff para as próximas etapas

## Especificação funcional

Deve detalhar:

- fluxos principais, alternativos e exceções;
- estados de interface;
- validações;
- mensagens;
- permissões;
- comportamento de erro;
- APIs/entidades candidatas.

## Design System e Frontend

Priorizar:

- autenticação/layout;
- filtros;
- tabela/lista;
- paginação;
- modais/confirmações;
- formulários;
- estados;
- timeline;
- documentos;
- dashboard;
- responsividade;
- 403/404/erro.

## Arquitetura/Backend/API/Banco

Priorizar:

- identidade Microsoft;
- usuário local e RBAC;
- separação frontend/API/banco;
- regras de domínio no servidor;
- persistência PostgreSQL ou banco relacional definido na arquitetura;
- storage protegido;
- auditoria;
- notificações derivadas + leitura persistida;
- integridade, migrations e seeds.

## Segurança

Aprofundar:

- OAuth/OIDC corporativo;
- tenant(s) e claims;
- sessão;
- RBAC;
- dados de saúde;
- acesso a documentos;
- trilha de auditoria;
- retenção;
- secrets;
- backup.

## Integrações

- Microsoft: obrigatório nesta base.
- Apdata: preparar modelo e aprofundar contrato posteriormente.
- E-mail: fora desta fase.

## Testes

Cobrir prioritariamente:

- login;
- domínio não permitido;
- usuário local inativo;
- 401/403;
- CRUDs;
- inativação e preservação histórica;
- alertas;
- leitura por usuário;
- upload/download/delete de documento;
- cálculos do dashboard;
- setup/migrations/seeds.

---

# 19. Checklist de revisão

- [x] Todos os RFs possuem fonte.
- [x] RFs Must possuem critérios de aceite.
- [x] RNFs possuem método verificável.
- [x] Regras de negócio estão separadas dos RFs.
- [x] Dados sensíveis estão classificados.
- [x] Permissões frontend/backend foram mapeadas.
- [x] Estados de interface foram identificados.
- [x] Integração Microsoft foi classificada como obrigatória.
- [x] Integração Apdata foi mantida como futura, sem contrato inventado.
- [x] E-mail foi mantido fora desta fase.
- [x] IA e aquisição foram considerados não aplicáveis.
- [x] A base full stack e o handoff estão representados como requisito operacional.
- [x] Dependências da infraestrutura temporária do protótipo devem ser removidas da base final.
- [x] APIs desta documentação estão identificadas como candidatas.
- [x] Entidades desta documentação estão identificadas como candidatas.
- [x] Decisões pendentes foram mantidas explícitas.
- [x] Documento está pronto para alimentar a Especificação Funcional.

---

**Autor:** Responsável técnico do projeto  
**Versão:** 1.0  
**Última atualização:** 05/10/2026
