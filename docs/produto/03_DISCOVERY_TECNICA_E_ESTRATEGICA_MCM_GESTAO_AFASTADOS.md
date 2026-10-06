# Discovery Técnica e Estratégica — MCM Gestão de Afastados

**Versão:** 1.0  
**Data:** 05/10/2026  
**Status:** Síntese / direção definida  
**Maturidade:** Nível 4 — pronto para derivar requisitos e fluxos

## 1. Discovery Blueprint

```yaml
discovery_blueprint:
  project_name: "MCM Gestão de Afastados"
  discovery_status: "sintese"
  source_mode: "Projeto existente com protótipo funcional"
  validated_problem: "O processo de afastamentos depende de controles dispersos e precisa de uma aplicação corporativa segura, rastreável e preparada para continuidade técnica."
  validated_audience:
    - "SMS CAC"
    - "Administradores autorizados"
  validated_value: "Centralizar histórico, documentos, prazos e indicadores, reduzindo risco operacional e protegendo dados sensíveis."
  recommended_solution: "Evoluir o protótipo para uma base full stack separada em frontend, backend/API e banco, com autenticação Microsoft, autorização local e persistência protegida."
  mvp_direction:
    must_have:
      - "Autenticação Microsoft + allowlist de domínios"
      - "Usuário local e autorização server-side"
      - "CRUDs reais e integrados"
      - "Afastamentos, histórico, documentos, notificações e dashboard"
      - "Banco próprio, migrations e seeds"
      - "Documentação e setup para handoff"
    should_have:
      - "Testes automatizados dos fluxos críticos"
      - "Auditoria mínima"
      - "Padronização de componentes e estados"
      - "Procedimento inicial de backup/restore"
    could_have:
      - "Refinamentos de UX não essenciais"
    not_now:
      - "INSS"
      - "Resumo por e-mail"
      - "IA"
      - "Integrações sem contrato técnico validado"
  experience_direction:
    critical_flows:
      - "Autenticação"
      - "Listar/filtrar afastamentos"
      - "Criar/editar/encerrar afastamento"
      - "Registrar andamento"
      - "Gerenciar documentos"
      - "Consultar alertas e dashboard"
    design_system_implications:
      - "Padronizar filtros, tabelas, paginação, modais, formulários, estados e ações destrutivas"
    frontend_implications:
      - "Remover acesso direto a dados; consumir somente API da aplicação"
  technical_direction:
    architecture_implications:
      - "Separar frontend, backend/API e banco"
      - "Aplicar autorização e regras críticas no servidor"
      - "Desacoplar domínio da infraestrutura temporária do protótipo"
    backend_implications:
      - "Módulos de identidade/usuários, cadastros, colaboradores, afastamentos, andamentos, documentos, notificações e dashboard"
    api_implications:
      - "API autenticada e autorizada para todos os recursos protegidos"
    database_implications:
      - "Modelo relacional com histórico, integridade, auditoria e leitura de notificações por usuário"
    infrastructure_implications:
      - "Ambientes reproduzíveis, secrets externos, banco e storage protegidos, backup"
  validation_summary:
    validated_hypotheses:
      - "Centralizar o processo resolve uma dor operacional real"
      - "Os fluxos centrais do protótipo representam necessidades reais do usuário"
      - "A aplicação exige autenticação e autorização antes de dados reais"
      - "Uma base full stack organizada reduz risco de handoff"
    partial_hypotheses:
      - "O dashboard atual possui todos os cálculos corretos"
      - "A responsividade atual é suficiente para todos os dispositivos"
      - "O modelo atual de documentos representa a política definitiva de retenção/exclusão"
    pending_hypotheses:
      - "Modelo final de perfis e permissões"
      - "Mecanismo final de storage de documentos"
      - "Forma de integração com Apdata"
      - "Ambiente e topologia final de deploy"
  recommendation: "seguir com ajustes e formalização de requisitos"
```

## 2. Problema validado

O problema não é “precisar de um dashboard” ou “precisar refazer o protótipo”. O problema é a falta de uma plataforma corporativa única, segura e rastreável para gerir afastamentos, histórico, documentos e prazos.

O protótipo existente constitui evidência de que as jornadas principais são compreensíveis e tecnicamente realizáveis, mas também demonstra que uma implementação rápida sem identidade, autorização e backend de aplicação não é adequada para dados reais.

## 3. Usuários e contexto de uso

### Persona principal — Operador SMS CAC

**Objetivos**

- localizar rapidamente um colaborador/afastamento;
- registrar e atualizar situação;
- acompanhar prazos;
- registrar andamentos;
- consultar documentos;
- identificar pendências prioritárias.

**Dores**

- fontes dispersas;
- risco de esquecer prazos;
- histórico difícil de reconstruir;
- falta de segurança/rastreabilidade em controles informais.

**Contexto de uso**

- predominantemente desktop corporativo;
- uso administrativo recorrente;
- necessidade de consulta rápida e edição cuidadosa;
- possíveis restrições de rede corporativa devem ser consideradas na implantação.

### Persona administrativa

Administra usuários, permissões, configurações e cadastros gerais conforme definição futura de RBAC.

## 4. Jobs to be done

- Quando um colaborador entrar em afastamento, quero registrar os dados essenciais para que o caso passe a ser acompanhado de forma centralizada.
- Quando houver atualização do caso, quero registrar um andamento para preservar a linha do tempo.
- Quando houver documento relacionado, quero vinculá-lo ao afastamento e recuperá-lo com segurança.
- Quando um benefício ou retorno estiver próximo ou vencido, quero ser alertado para não perder prazo.
- Quando eu abrir o dashboard, quero enxergar indicadores coerentes com os registros reais.
- Quando outro desenvolvedor assumir o projeto, quero que consiga iniciar o ambiente e evoluir o sistema sem depender de conhecimento informal.

## 5. Hipóteses e validação

| ID | Tipo | Hipótese | Evidência | Resultado | Decisão |
|---|---|---|---|---|---|
| H-VAL-01 | Valor | Centralizar afastamentos reduz perda de informação e risco de prazo. | Questionário + processo atual relatado. | Validada | Seguir |
| H-SOL-01 | Solução | Cadastro + histórico + documentos + alertas cobrem o núcleo do problema. | Questionário + protótipo funcional. | Validada | Seguir |
| H-SOL-02 | Solução | Dashboard é útil para priorização operacional. | Requisito do usuário + protótipo. | Parcial | Validar cálculos e uso final |
| H-TEC-01 | Técnica | A base pode ser construída com frontend/API/banco separados. | Domínio relacional e CRUD já observados. | Validada | Seguir |
| H-TEC-02 | Técnica | Login corporativo Microsoft atende à identidade necessária. | Decisão do projeto. | Validada como direção | Detalhar integração |
| H-TEC-03 | Técnica | Restrição por domínio é suficiente para controle de acesso. | Análise de segurança. | Refutada | Implementar RBAC local além do domínio |
| H-TEC-04 | Técnica | O mecanismo atual de persistência pode permanecer após exportação. | Direcionamento do projeto. | Refutada | Substituir completamente |
| H-EXP-01 | Experiência | A navegação e telas atuais são uma boa base para evolução. | Auditoria do protótipo. | Parcial | Preservar fluxos e padronizar UI |
| H-EXP-02 | Experiência | Tabelas com scroll horizontal são suficientes no mobile. | Apenas evidência de código. | Pendente | Validar no refinamento frontend |
| H-INT-01 | Integração | Apdata será fonte de cadastro corporativo de colaboradores. | Questionário. | Validada como necessidade futura | Contrato técnico pendente |

## 6. Direção da solução

### Solução recomendada

Construir uma aplicação web interna com:

- frontend administrativo;
- backend/API de aplicação;
- banco relacional;
- armazenamento protegido de documentos;
- autenticação Microsoft;
- usuário/permissões locais;
- módulos de colaboradores, afastamentos, histórico, documentos, configurações, notificações e dashboard;
- documentação e ambientes suficientes para continuidade por Milena.

### Alternativas descartadas ou não recomendadas

**Manter acesso direto do navegador ao banco** — descartado por segurança, governança e acoplamento.

**Usar apenas domínio Microsoft como autorização** — descartado; domínio valida identidade elegível, mas não substitui permissão por recurso/ação.

**Concluir todas as integrações nesta fase** — descartado para não inflar o handoff e porque Apdata ainda não possui contrato técnico conhecido.

## 7. Discovery de experiência, Design System e frontend

### Fluxos críticos

1. login corporativo;
2. entrada na listagem principal;
3. pesquisa e filtros;
4. novo afastamento;
5. edição/encerramento;
6. detalhes do afastamento;
7. histórico/andamentos;
8. documentos;
9. notificações;
10. dashboard;
11. configurações;
12. usuários/permissões.

### Padrões a consolidar antes da exportação final

- filtros e barra de filtros;
- selects/comboboxes;
- botões e hierarquia de ações;
- modais e confirmações;
- tabela e cabeçalho fixo;
- scroll e overflow;
- paginação;
- formulários;
- campos de data;
- badges de situação;
- timeline;
- upload/documentos;
- loading;
- empty state;
- erro;
- sucesso;
- disabled/submitting;
- feedback de permissão negada.

### Motion

Não há hipótese de valor que justifique uma camada especializada de animação. Manter microinterações funcionais discretas e acessíveis. Não é escopo prioritário.

## 8. Discovery técnico

### 8.1 Camadas necessárias

**Frontend**

- interface e estado de apresentação;
- cache e data fetching via API;
- validação de UX/formulário;
- nenhuma credencial privilegiada;
- nenhuma query direta ao banco.

**Backend/API**

- autenticação da sessão;
- resolução do usuário local;
- autorização/RBAC;
- validação de payload;
- regras de domínio;
- operações de CRUD;
- geração/acesso protegido de documentos;
- auditoria;
- agregações do dashboard;
- regras de notificações.

**Banco**

- cadastros auxiliares;
- usuários e perfis/permissões;
- colaboradores;
- afastamentos;
- andamentos;
- documentos/metadata;
- leitura de notificações por usuário;
- auditoria;
- integridade referencial e índices.

### 8.2 Autenticação e autorização

**Decidido:** autenticação Microsoft.

**Regra de elegibilidade:** somente identidades pertencentes aos domínios:

- `mcm.eng.br`;
- `mcmmontagens.com.br`.

**Obrigatório:** após autenticar, a identidade deve ser resolvida para um usuário local. A aplicação não pode deduzir permissões apenas pelo domínio do e-mail. O usuário local deve possuir status e permissões/roles compatíveis com as ações permitidas.

Pontos a detalhar na arquitetura:

- tenant único ou múltiplos tenants Microsoft;
- claims utilizadas;
- criação/provisionamento de usuário local;
- tratamento de usuário válido no domínio porém não habilitado na aplicação;
- expiração e renovação de sessão;
- logout;
- política para conta desabilitada.

### 8.3 Documentos

Necessidades validadas:

- arquivos não públicos;
- acesso autorizado;
- metadata no banco;
- vínculo ao afastamento;
- limite e MIME validados também no servidor;
- download autenticado/temporário;
- exclusão controlada e auditada;
- backup.

**Decisão técnica pendente:** provider/mecanismo definitivo de armazenamento.

### 8.4 Auditoria

Pelo caráter sensível do domínio, registrar pelo menos operações críticas como:

- criação/edição de afastamento;
- mudança de situação;
- criação/edição/exclusão de andamento;
- upload/download quando necessário para governança;
- exclusão de documento;
- alteração de cadastro auxiliar;
- alterações em usuários/permissões.

O detalhamento final de retenção e conteúdo dos logs deve ser definido posteriormente.

## 9. Modelo funcional preliminar

Principais entidades esperadas:

- User;
- Role/Permission ou estrutura equivalente;
- Obra;
- Funcao;
- Colaborador;
- TipoBeneficio;
- SituacaoAfastamento;
- TipoAndamento;
- TipoDocumento;
- Afastamento;
- AfastamentoAndamento;
- AfastamentoDocumento;
- NotificationRead/AlertRead ou equivalente;
- AuditLog.

A modelagem final, tipos, constraints e índices pertencem à etapa de banco/arquitetura.

## 10. Regras de domínio a levar para requisitos

1. situação possui classificação de sistema `ATIVO`, `ENCERRADO` ou `APOSENTADO`;
2. encerramento não remove histórico nem documentos;
3. cadastros auxiliares usam inativação para impedir novos usos sem quebrar registros antigos;
4. colaborador usa ID e não exige CPF;
5. fim de benefício: aviso 30 dias antes e permanência após vencimento enquanto aplicável;
6. retorno previsto: aviso 15 dias antes e permanência conforme pendência;
7. leitura do alerta é estado por usuário e não altera estado de negócio;
8. próximas ações vencidas não entram no dashboard;
9. próximas ações continuam no sininho;
10. documentos e dados são restritos a usuários autorizados;
11. geração de identificadores internos deve ocorrer de forma transacional/única no servidor/banco, não por cálculo concorrente no browser.

## 11. Integrações externas

### Microsoft — obrigatória

Impacta autenticação, segurança, backend, ambiente e testes.

### Apdata — requerida pelo produto, ainda não pronta para implementação

Perguntas pendentes:

- existe API oficial?
- existe OAuth, token, VPN ou acesso de rede?
- leitura é online ou sincronização periódica?
- qual é a chave imutável do colaborador?
- obra/função são master data do Apdata?
- contato editado localmente sobrescreve ou apenas complementa a fonte?
- como tratar colaborador desligado/inativo?

### E-mail — futuro

Resumo periódico de pendências permanece fora da base atual.

## 12. Dados e migração

A base atual contém dados e estrutura úteis como referência, mas a nova solução não deve depender da infraestrutura temporária do protótipo.

A estratégia de migração deverá distinguir:

- schema que vale reaproveitar conceitualmente;
- registros de teste que devem virar seed ou ser descartados;
- dados reais, caso existam, que exigirão migração controlada;
- documentos que eventualmente precisem ser transferidos para o storage definitivo.

Antes de qualquer migração de dados reais, deve existir autenticação, autorização e destino protegido.

## 13. Qualidade e testes

Cenários mínimos da base:

- login Microsoft aceito para domínio permitido;
- login recusado para domínio não permitido;
- usuário corporativo não habilitado localmente sem acesso às funções protegidas;
- autorização negando operações proibidas;
- CRUD de cadastros auxiliares;
- CRUD de colaboradores;
- criação/edição/encerramento de afastamento;
- registro e preservação de histórico;
- upload/download/exclusão controlada de documento;
- regras de alertas 30/15 dias;
- persistência de notificação lida por usuário;
- dashboard com cálculos de dados reais;
- tentativa de acessar dados/documentos sem autenticação;
- reconstrução do banco via migrations/seeds.

## 14. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| RBAC insuficiente para dados sensíveis | Média | Alto/Crítico | Formalizar permissões e testar API server-side. |
| Configuração incorreta da autenticação Microsoft | Média | Alto | Validar tenant/domínios/claims em homologação. |
| Regras de domínio permanecerem no frontend | Média | Alto | Centralizar regras críticas no backend. |
| Storage permitir acesso indireto não autorizado | Média | Crítico | Política de acesso via backend e testes negativos. |
| Exclusões apagarem evidência necessária | Média | Alto | Definir soft delete/auditoria por recurso. |
| Integração Apdata gerar retrabalho de modelagem | Alta | Médio | Desacoplar master data e manter IDs externos mapeáveis. |
| Handoff sem documentação suficiente | Média | Alto | Checklist de entrega e setup reproduzível. |
| Escopo da base crescer | Média | Médio | Manter critérios de aceite e itens fora do momento atual. |

## 15. Decisões registradas

| ID | Decisão | Status | Motivo |
|---|---|---|---|
| DEC-001 | A fase atual entrega uma base full stack para continuidade por Milena. | Decidida | Evitar tentativa de concluir toda a evolução nesta etapa. |
| DEC-002 | Frontend, backend/API e banco serão integrados com CRUDs reais. | Decidida | Handoff precisa ser funcional, não apenas visual. |
| DEC-003 | Autenticação será Microsoft. | Decidida | Alinhamento corporativo. |
| DEC-004 | Somente `mcm.eng.br` e `mcmmontagens.com.br` são domínios elegíveis para login. | Decidida | Restringir identidade ao ambiente corporativo. |
| DEC-005 | Identidade Microsoft não substitui autorização local/RBAC. | Decidida | Necessidade de controle por recurso/ação. |
| DEC-006 | A infraestrutura temporária e dependências específicas do protótipo serão removidas após exportação. | Decidida | Base deve ser independente e sustentável. |
| DEC-007 | Resumo por e-mail não será entregue nesta fase. | Decidida | Previsto para implantação ou etapa posterior. |
| DEC-P01 | Granularidade de perfis/permissões. | Pendente | Deve ser formalizada em requisitos/funcional. |
| DEC-P02 | Storage definitivo de documentos. | Pendente | Depende de arquitetura/infra. |
| DEC-P03 | Forma e fase de integração Apdata. | Pendente | Falta contrato técnico da fonte. |

## 16. Matriz hipótese → evidência → resultado → decisão

| Hipótese | Tipo | Evidência | Confiabilidade | Resultado | Decisão |
|---|---|---|---|---|---|
| Centralização resolve a dor principal. | Valor | Questionário e processo relatado. | Alta | Validada | Seguir |
| Protótipo atual representa os principais fluxos. | Solução | Auditoria + funcionalidades observadas. | Alta | Parcial/Validada | Preservar fluxos e revisar detalhes |
| Acesso direto ao banco é aceitável. | Técnica | Auditoria de segurança. | Alta | Refutada | Criar backend/API |
| Domínio Microsoft é autorização suficiente. | Segurança | Análise de ameaça. | Alta | Refutada | RBAC local obrigatório |
| Documentos podem ser públicos com link temporário. | Segurança | Natureza dos dados. | Alta | Refutada | Storage protegido |
| Apdata pode ser integrado já nesta fase. | Integração | Falta de contrato técnico. | Média | Pendente | Preparar seam, não assumir implementação |
| Base organizada reduz custo de handoff. | Operação | Objetivo explícito da fase. | Alta | Validada | Priorizar documentação/setup |

## 17. Perguntas abertas para requisitos/arquitetura

- Quais perfis além de “SMS” existirão inicialmente?
- Quais ações exigem permissão específica: visualizar CID, baixar documento, excluir documento, administrar usuários, administrar cadastros?
- Há necessidade de restringir dados por obra/unidade ou todos os usuários autorizados veem todo o conjunto?
- O usuário precisa ser pré-cadastrado na aplicação ou pode ser provisionado no primeiro login?
- Os dois domínios pertencem ao mesmo tenant Microsoft?
- Como deve funcionar remoção/desativação de usuário?
- Exclusões de andamentos/documentos serão físicas, lógicas ou condicionais?
- Qual política de retenção de documentos e logs?
- Qual provider de armazenamento será usado?
- Qual mecanismo de integração Apdata estará disponível?
- O ambiente alvo será infraestrutura própria, cloud corporativa ou outra plataforma?
- Quais RPO/RTO mínimos para backup e recuperação?

## 18. Decisão final do Discovery

**Recomendação: SEGUIR COM AJUSTES E FORMALIZAÇÃO.**

O problema, valor, público e direção da solução estão suficientemente validados. A fase pode avançar para requisitos, especificação funcional e revisão do frontend. Não há necessidade de uma nova rodada ampla de discovery antes disso.

As decisões ainda pendentes não bloqueiam a próxima etapa documental, mas devem ser resolvidas antes de fechar arquitetura e implementação de segurança/storage/integração.

## 19. Handoff

### Para requisitos

- formalizar funcionalidades e regras listadas;
- definir perfis/permissões;
- classificar requisitos de segurança, auditoria e dados;
- formalizar critérios de aceite por módulo;
- registrar integrações obrigatórias e futuras.

### Para especificação funcional

- detalhar jornadas e exceções;
- comportamento de inativação;
- encerramento/aposentadoria;
- notificações lidas versus resolvidas;
- documentos e exclusão controlada;
- usuários e administração;
- erros, loading e feedback.

### Para Design System/frontend

- consolidar padrões de filtros, tabelas, paginação, modais, formulários e estados;
- revisar responsividade;
- remover inconsistências de interface;
- preparar frontend para consumo exclusivo da API.

### Para arquitetura/backend/API/banco

- autenticação Microsoft;
- RBAC;
- separação de camadas;
- storage protegido;
- auditoria;
- migrations/seeds;
- estratégia de IDs externos do Apdata;
- backup, logs e healthchecks;
- substituição completa da infraestrutura temporária do protótipo.

## 20. Critérios de conclusão do Discovery

- problema e público validados: **sim**;
- hipóteses principais registradas: **sim**;
- direção de MVP/base definida: **sim**;
- direção de experiência definida: **sim**;
- direção técnica definida sem fechar arquitetura: **sim**;
- riscos principais classificados: **sim**;
- decisões tomadas e pendências registradas: **sim**;
- handoff para requisitos/funcional/design/arquitetura: **sim**.

**Maturidade:** Nível 4.  
**Pode avançar:** Sim.
