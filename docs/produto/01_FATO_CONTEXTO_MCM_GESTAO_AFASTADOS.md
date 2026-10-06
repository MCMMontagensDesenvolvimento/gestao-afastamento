# Fato e Contexto — MCM Gestão de Afastados

**Versão:** 1.0  
**Data:** 05/10/2026  
**Status:** Validado para avanço  
**Tipo:** Projeto / evolução de protótipo existente para base full stack

## 1. Síntese executiva

A MCM necessita centralizar o controle de afastamentos de colaboradores, substituindo o uso disperso de planilhas e arquivos por uma aplicação corporativa com cadastro, histórico, documentos, prazos, alertas e indicadores. Já existe um protótipo funcional que comprovou boa parte da jornada e do modelo de dados, porém sua implementação atual não possui os controles de segurança, autenticação, autorização e separação de camadas necessários para uso com dados reais.

A fase atual não tem como objetivo finalizar todo o produto. O objetivo é construir uma **base full stack integrada, segura, documentada e funcional**, com frontend, backend, API e banco de dados próprios, pronta para ser repassada à desenvolvedora Milena para continuidade da evolução.

## 2. Fact Context Blueprint

```yaml
fact_context_blueprint:
  trigger: "Necessidade de transformar um protótipo funcional de gestão de afastamentos em uma base corporativa full stack segura e evolutiva."
  problem_type: "Dor operacional + risco de segurança + oportunidade de padronização"
  strategic_context: "A operação precisa deixar de depender de planilhas e arquivos dispersos e passar a possuir uma fonte central, rastreável e protegida para acompanhamento dos afastamentos."
  experience_context: "A equipe SMS CAC precisa consultar rapidamente situação, histórico, documentos, prazos, alertas e indicadores de cada afastamento sem depender de múltiplas fontes manuais."
  technical_context: "O protótipo atual possui persistência real e fluxos funcionais, mas realiza acesso de dados diretamente pelo navegador, sem autenticação aplicada, autorização efetiva, trilha de auditoria e camada de backend de aplicação."
  affected_users:
    - "Equipe SMS CAC"
    - "Administradores e responsáveis pelo controle de acesso"
    - "Desenvolvedora responsável pela continuidade do produto"
  affected_journeys:
    - "Cadastrar e atualizar afastamento"
    - "Acompanhar histórico e andamentos"
    - "Gerenciar documentos"
    - "Acompanhar benefícios, retornos e pendências"
    - "Consultar indicadores no dashboard"
    - "Administrar cadastros, usuários e permissões"
  evidence_summary:
    - "Questionário respondido pelo idealizador do sistema"
    - "Auditoria técnica do protótipo existente"
    - "Existência de banco, documentos, histórico, dashboard e notificações no protótipo"
    - "Ausência de autenticação aplicada e regras de acesso efetivas no estado atual"
  root_cause_summary: "O processo de afastamentos cresceu sobre controles manuais e o protótipo foi construído para validar rapidamente fluxos e telas, sem a camada corporativa de segurança, backend e governança exigida para produção."
  impact_if_ignored: "Risco de exposição de dados de saúde e documentos, perda de rastreabilidade, falhas em prazos e continuidade do controle manual/descentralizado."
  opportunity_or_risk: "Converter o fluxo já validado em uma base técnica sustentável, segura e de fácil continuidade para o time de desenvolvimento."
  priority: "Alta"
  confidence_level: "Alta"
  decisions_required:
    - "Definir granularidade final de perfis e permissões da aplicação."
    - "Definir mecanismo definitivo de armazenamento protegido de documentos."
    - "Definir estratégia e momento da integração com o Apdata."
    - "Definir ambiente alvo de homologação e produção."
```

## 3. Fatos confirmados

| Fato | Evidência | Confiança | Impacto |
|---|---|---:|---|
| O controle atual precisa substituir planilhas e arquivos separados. | Questionário do idealizador. | Alta | Justifica centralização e rastreabilidade. |
| O público inicial é a equipe SMS CAC. | Questionário do idealizador. | Alta | Direciona experiência, permissões e operação. |
| O protótipo já possui fluxo funcional de afastamentos, histórico, documentos, dashboard e notificações. | Auditoria técnica do estado atual. | Alta | Reduz incerteza funcional e permite preservar boas decisões de UX. |
| A implementação atual não possui login aplicado. | Auditoria técnica. | Alta | Bloqueia uso com dados reais. |
| O acesso aos dados e documentos atualmente não está segregado por usuário. | Auditoria técnica. | Alta | Risco crítico de segurança e privacidade. |
| As gravações atualmente partem diretamente do frontend para a persistência. | Auditoria técnica. | Alta | Requer camada backend/API para regras server-side. |
| O projeto lida com CID e documentos potencialmente sensíveis. | Modelo atual e questionário. | Alta | Exige autenticação, autorização, auditoria e proteção de arquivos. |
| A leitura das notificações precisa ser persistida por usuário. | Questionário + auditoria do protótipo. | Alta | Necessita modelo de usuário e persistência server-side. |
| A autenticação da nova base será Microsoft. | Decisão do projeto. | Alta | Gera dependência de integração corporativa de identidade. |
| Somente contas dos domínios `mcm.eng.br` e `mcmmontagens.com.br` devem ser aceitas. | Decisão do projeto. | Alta | Exige allowlist de domínio além da autenticação. |
| A fase atual deve entregar frontend, backend, API e banco integrados com CRUDs reais. | Decisão do projeto. | Alta | Define o recorte técnico da entrega. |
| A entrega será repassada à desenvolvedora Milena para continuidade. | Decisão do projeto. | Alta | Aumenta exigência de documentação, setup reproduzível e código organizado. |
| A infraestrutura temporária usada pelo protótipo não fará parte da solução pós-exportação. | Decisão do projeto. | Alta | Exige higienização e substituição completa da persistência/acoplamentos atuais. |

## 4. Contexto estratégico

O valor principal do projeto é reduzir risco operacional e aumentar a confiança no acompanhamento dos afastamentos. A centralização deve permitir que a equipe responsável visualize o estado atual de cada colaborador afastado, preserve o histórico das ocorrências, mantenha documentos vinculados, acompanhe vencimentos e retornos e tenha indicadores coerentes com os registros.

A fase atual possui também um objetivo de engenharia: entregar uma fundação suficientemente organizada para que a continuidade não dependa do conhecimento de quem fez a migração inicial. O handoff para Milena precisa permitir instalação, execução, entendimento e evolução com baixo atrito.

## 5. Contexto experiencial

Principais dores do usuário:

- informações distribuídas em planilhas e arquivos;
- dificuldade para consultar histórico de forma rápida;
- risco de esquecer fim de benefício e retorno previsto;
- dificuldade para relacionar documentos ao afastamento correto;
- pouca rastreabilidade de alterações;
- risco de inconsistência entre situação cadastrada, alertas e dashboard.

Experiência desejada:

- navegação objetiva para operação administrativa;
- filtros consistentes e previsíveis;
- formulários com validações claras;
- histórico cronológico legível;
- documentos com ações controladas;
- dashboard que reflita exatamente as regras do domínio;
- alertas visíveis sem confundir “lido” com “resolvido”;
- feedback de loading, erro, sucesso e ações destrutivas padronizado.

## 6. Contexto técnico e operacional

### Estado atual observado

O protótipo possui frontend funcional, banco relacional e armazenamento de documentos. Entretanto, a arquitetura atual mistura interface, acesso a dados e parte das regras de negócio no navegador. Não há autenticação efetivamente aplicada, autorização por usuário ou trilha de auditoria suficiente.

### Estado esperado para a base entregue

- frontend desacoplado da persistência direta;
- backend de aplicação com regras server-side;
- API entre frontend e backend;
- banco de dados relacional próprio;
- autenticação Microsoft;
- allowlist dos domínios `mcm.eng.br` e `mcmmontagens.com.br`;
- autorização da aplicação independente da identidade Microsoft;
- CRUDs funcionais ponta a ponta;
- upload/download de documentos protegido;
- auditoria mínima das operações críticas;
- migrations e seeds reproduzíveis;
- configuração por variáveis de ambiente;
- estrutura pronta para execução local e handoff;
- remoção das dependências e artefatos específicos da ferramenta/BaaS usados no protótipo.

## 7. Limites de escopo desta fase

### Dentro do escopo

- preservar e consolidar os fluxos essenciais já validados;
- frontend funcional integrado à nova API;
- backend funcional;
- banco relacional próprio;
- autenticação Microsoft;
- autorização básica da aplicação;
- cadastros auxiliares;
- colaboradores;
- afastamentos;
- andamentos/histórico;
- documentos;
- notificações in-app;
- dashboard e indicadores já previstos;
- usuários/permissões em nível necessário à base;
- auditoria mínima de ações sensíveis;
- configuração, migrations, seeds e documentação de handoff;
- testes dos cenários críticos da base.

### Fora do escopo atual ou para decisão posterior

- acesso ou armazenamento de credenciais do Meu INSS;
- consulta automática ao INSS;
- perícia, concessão de benefício ou decisão médica/previdenciária;
- resumo de pendências por e-mail, previsto para implantação ou etapa posterior;
- integração definitiva com Apdata antes de conhecer contrato/API/mecanismo disponível;
- automações avançadas não necessárias para os CRUDs e critérios de aceite da base;
- funcionalidades de IA;
- funcionalidades públicas, SEO ou aquisição.

## 8. Dependências e integrações

### Microsoft

Integração obrigatória para autenticação corporativa. A autenticação deve validar identidade e domínio aceito. A autorização da aplicação deve permanecer sob controle do próprio sistema.

### Apdata

Dependência funcional futura para origem de:

- ID do colaborador;
- nome do funcionário;
- obra;
- função;
- contato.

O contato precisa permitir edição local. O mecanismo de integração ainda não foi fornecido e deve permanecer como decisão pendente até existir documentação, acesso ou contrato técnico da fonte.

## 9. Análise de causa raiz

### Ishikawa

| Categoria | Causa identificada | Evidência | Impacto |
|---|---|---|---|
| Processo | Controle baseado em planilhas e arquivos separados. | Questionário. | Retrabalho, perda de histórico e risco de prazo. |
| Tecnologia | Protótipo sem camada corporativa de autenticação/autorização/backend. | Auditoria. | Impede uso seguro em produção. |
| Segurança | Dados sensíveis sem segregação efetiva de acesso. | Auditoria. | Exposição de CID e documentos. |
| Governança | Ausência de trilha robusta de quem alterou/excluiu. | Auditoria. | Baixa rastreabilidade. |
| Experiência | Padrões de UI e estados ainda inconsistentes. | Auditoria. | Mais risco de erro e menor previsibilidade. |
| Integração | Fonte corporativa Apdata ainda sem contrato técnico conhecido. | Questionário. | Pode afetar cadastro de colaboradores e sincronização. |

### 5 Porquês

1. **Por que existe risco de perda de prazo e histórico?** Porque a operação depende de fontes dispersas e acompanhamento manual.
2. **Por que o protótipo ainda não resolve o problema em produção?** Porque validou fluxos e persistência, mas não possui controles corporativos de acesso e arquitetura de aplicação completos.
3. **Por que segurança e governança são críticas?** Porque o domínio envolve dados de saúde, documentos e decisões operacionais sobre afastamentos.
4. **Por que a fase atual precisa reorganizar a base?** Porque a continuidade será assumida por outra desenvolvedora e o código precisa ser compreensível, reproduzível e desacoplado da ferramenta original.
5. **Por que não devemos tentar concluir todo o produto nesta fase?** Porque o objetivo atual é reduzir risco técnico e entregar uma fundação funcional para continuidade, mantendo integrações e evoluções não essenciais para etapas posteriores.

**Causa raiz preliminar:** ausência de uma plataforma corporativa central, segura e governada para o processo, somada a um protótipo que validou a experiência mas não a arquitetura final.

## 10. Matriz de impacto e prioridade

| Dimensão | Nível | Justificativa |
|---|---|---|
| Negócio | Alto | Falhas de acompanhamento podem afetar gestão de pessoas e prazos. |
| Operação | Alto | Processo manual/disperso gera retrabalho e risco de esquecimento. |
| Tecnologia | Alto | Base atual precisa ser reorganizada para continuidade sustentável. |
| Segurança/Privacidade | Crítico | Há dados de saúde e documentos sensíveis. |
| Experiência | Médio/Alto | Fluxos existem, mas padronização e estados precisam ser consolidados. |
| Integrações | Médio | Microsoft é obrigatória; Apdata ainda possui contrato técnico desconhecido. |

**Prioridade final:** Alta.  
**Ação imediata:** avançar para definição de visão/escopo e discovery, preservando os fatos confirmados e registrando decisões pendentes.

## 11. Matriz de rastreabilidade

| Fato | Evidência | Confiança | Impacto | Área | Decisão requerida |
|---|---|---:|---|---|---|
| Protótipo já valida jornadas centrais. | Auditoria técnica. | Alta | Permite reaproveitar UX e regras observadas. | Produto/Experiência | Não |
| Segurança atual é insuficiente. | Auditoria técnica. | Alta | Bloqueia dados reais. | Segurança | Não — correção obrigatória |
| Fase atual é base para handoff. | Direcionamento do projeto. | Alta | Prioriza organização, documentação e CRUDs reais. | Técnica/Operação | Não |
| Login será Microsoft com dois domínios aceitos. | Direcionamento do projeto. | Alta | Define integração de identidade. | Segurança/Integração | Não |
| Granularidade de permissões ainda não está fechada. | Questionário + estado atual. | Alta | Afeta API, UI e banco. | Segurança/Produto | Sim |
| Apdata será fonte corporativa de colaboradores. | Questionário. | Alta | Afeta ownership e sincronização de dados. | Integração/Dados | Sim, quanto ao mecanismo e fase |
| Resumo por e-mail não é necessário na base. | Questionário. | Alta | Evita inflar a entrega. | Produto | Não |

## 12. Maturidade do contexto

**Nível 5 — iniciativa pronta para Brief e Discovery.**

O problema, público, estado atual, riscos, objetivo desta fase, decisões técnicas obrigatórias e principais pendências estão claros o suficiente para avançar.

## 13. Próximas etapas

1. Consolidar visão, escopo, MVP da fase e entregáveis.
2. Validar hipóteses de solução, experiência e técnica.
3. Formalizar requisitos e especificação funcional.
4. Revisar Design System e frontend antes da exportação final do protótipo.
5. Definir arquitetura, backend, APIs, banco, segurança e infraestrutura.
6. Executar migração/higienização pós-exportação e montar a base full stack para handoff à Milena.
