# Brief Mestre — MCM Gestão de Afastados

**Versão:** 1.0  
**Data:** 05/10/2026  
**Status:** Em revisão / pronto para Discovery  
**Classificação:** Sistema interno corporativo / base full stack

## 1. Brief Master Blueprint

```yaml
brief_master_blueprint:
  project_name: "MCM Gestão de Afastados"
  project_type: "Sistema interno"
  execution_mode: "Evolução de protótipo existente para base full stack"
  purpose: "Centralizar e proteger o controle de afastamentos dos colaboradores, preservando histórico, documentos, prazos e indicadores."
  value_proposition: "Disponibilizar uma fonte única, rastreável e segura para acompanhamento do ciclo completo do afastamento, reduzindo controles paralelos e risco de perda de prazos."
  target_audience:
    - "SMS CAC"
    - "Administradores autorizados"
  business_objectives:
    - "Reduzir dependência de planilhas e arquivos dispersos."
    - "Diminuir risco de esquecimento de vencimentos e retornos."
    - "Aumentar rastreabilidade e segurança do processo."
  product_objectives:
    - "Permitir acompanhar um afastamento do cadastro ao encerramento."
    - "Preservar histórico e documentos."
    - "Disponibilizar filtros, alertas e indicadores coerentes com os registros."
  technical_objectives:
    - "Entregar frontend, backend, API e banco integrados."
    - "Aplicar autenticação Microsoft com domínios corporativos permitidos."
    - "Implementar autorização server-side e proteção de documentos."
    - "Eliminar acesso direto do frontend ao banco."
    - "Remover dependências específicas da ferramenta e infraestrutura temporária do protótipo após exportação."
    - "Deixar base documentada e reproduzível para handoff à Milena."
  operational_objectives:
    - "Padronizar cadastros e acompanhamento."
    - "Garantir alertas de prazo coerentes."
    - "Facilitar consulta do histórico e documentos."
  mvp_scope:
    must_have:
      - "Autenticação Microsoft e restrição aos domínios mcm.eng.br e mcmmontagens.com.br."
      - "Modelo de usuário e autorização mínima da aplicação."
      - "CRUDs funcionais de cadastros auxiliares, colaboradores e afastamentos."
      - "Histórico/andamentos funcionais."
      - "Upload, consulta, download e exclusão controlada de documentos."
      - "Notificações in-app com leitura persistida por usuário."
      - "Dashboard e alertas essenciais."
      - "Backend/API server-side e banco relacional próprio."
      - "Auditoria mínima para operações sensíveis."
      - "Migrations, seeds, variáveis de ambiente, setup e documentação de handoff."
    should_have:
      - "Padronização consistente de tabelas, filtros, modais, paginação e estados de interface."
      - "Testes automatizados dos fluxos críticos."
      - "Procedimento inicial de backup e recuperação."
    could_have:
      - "Refinamentos adicionais de UX e microinterações sem impacto funcional."
      - "Relatórios ou exportações adicionais se já estiverem simples de suportar."
    wont_have_now:
      - "Consulta automática ao INSS."
      - "Acesso a contas ou credenciais do Meu INSS."
      - "Resumo de pendências por e-mail."
      - "IA."
      - "Integrações adicionais sem contrato técnico validado."
  delivery_strategy: "Full stack baseline + handoff técnico"
  specialized_scope_signals:
    motion_required: false
    ai_required: false
  decisions_required:
    - "Granularidade final de perfis e permissões."
    - "Estratégia definitiva de armazenamento de documentos."
    - "Estratégia e fase da integração Apdata."
    - "Ambiente de homologação/produção e política de backup."
```

## 2. Propósito

O projeto existe para transformar o controle de afastamentos em um processo centralizado, rastreável e seguro. O produto deve substituir controles paralelos e permitir que o SMS CAC acompanhe cada afastamento com contexto suficiente para agir no tempo correto.

A entrega desta fase é deliberadamente uma **base de engenharia funcional**, não a conclusão integral do produto. Ela deve ser suficientemente robusta para uso de homologação e continuidade do desenvolvimento por Milena, reduzindo retrabalho e evitando que a próxima desenvolvedora precise reconstruir decisões básicas de frontend, backend, autenticação, banco e integração.

## 3. Visão e proposta de valor

### Visão

Ter uma aplicação corporativa única para registrar, acompanhar e consultar afastamentos, seus eventos, documentos, situações e prazos, com segurança e rastreabilidade.

### Proposta de valor

- uma fonte única de informação;
- histórico preservado;
- acesso protegido aos documentos;
- alertas de benefício e retorno;
- indicadores operacionais coerentes;
- redução de retrabalho;
- base técnica sustentável para evolução.

## 4. Público e stakeholders

### Usuário final principal

**SMS CAC** — responsável por cadastrar, atualizar, consultar e acompanhar afastamentos, andamentos, documentos, prazos e indicadores dentro das permissões concedidas.

### Stakeholders técnicos

- responsáveis internos da MCM pelo produto/processo;
- desenvolvedora Milena, responsável pela continuidade após o handoff;
- TI/infraestrutura da MCM, para identidade Microsoft, ambientes, backup e futuras integrações;
- responsáveis pela fonte Apdata.

### Poder de decisão ainda a formalizar

Os nomes de sponsor, aprovador funcional e owner técnico devem ser registrados antes da homologação final da base.

## 5. Objetivos

### Negócio

- centralizar o processo;
- reduzir perda de informação;
- reduzir esquecimento de prazos;
- melhorar rastreabilidade do acompanhamento.

### Produto

- permitir acompanhar o ciclo completo do afastamento;
- consultar histórico e documentos de forma contextual;
- diferenciar corretamente ativos, encerrados e aposentados;
- aplicar filtros úteis à operação;
- apresentar alertas e dashboard consistentes.

### Técnico

- substituir a infraestrutura temporária do protótipo por backend, API e banco próprios;
- impedir acesso direto do browser ao banco;
- aplicar autenticação corporativa Microsoft;
- restringir login aos domínios `mcm.eng.br` e `mcmmontagens.com.br`;
- manter autorização da aplicação independente da autenticação externa;
- proteger documentos;
- versionar schema por migrations;
- documentar setup e arquitetura suficiente para handoff.

### Operacional

- manter cadastros inativados referenciáveis no histórico;
- impedir seleção de inativos em novos registros;
- manter alertas vencidos até a resolução da pendência;
- separar estado “lido” de estado “resolvido”;
- manter próximas ações vencidas fora do dashboard e disponíveis no sininho.

## 6. Escopo da fase

### Incluído

1. **Identidade e acesso**
   - login Microsoft;
   - allowlist dos dois domínios corporativos;
   - usuário local vinculado à identidade corporativa;
   - autorização da aplicação;
   - logout e sessão.

2. **Cadastros auxiliares**
   - tipos de benefício;
   - situações;
   - tipos de andamento;
   - tipos de documento;
   - obras e funções conforme necessidade da base;
   - inativação e preservação histórica.

3. **Colaboradores**
   - cadastro/consulta/edição suficientes para homologação;
   - uso de ID interno/corporativo sem exigência de CPF;
   - obra, função e contato;
   - preparação de modelo para futura origem Apdata.

4. **Afastamentos**
   - criar;
   - editar;
   - consultar;
   - encerrar/alterar situação conforme regra;
   - datas, benefício, situação, previsão de retorno, CID/causa quando aplicável e observações.

5. **Histórico e andamentos**
   - registrar eventos;
   - preservar sequência cronológica;
   - permitir manutenção conforme autorização;
   - manter rastreabilidade de operações críticas.

6. **Documentos**
   - upload;
   - consulta;
   - download protegido;
   - exclusão controlada;
   - vínculo com afastamento e, quando aplicável, andamento;
   - controle de tipo e tamanho;
   - acesso somente por usuário autorizado.

7. **Notificações**
   - fim de benefício em 30 dias e vencidos;
   - retorno previsto em 15 dias;
   - próximas ações no sininho conforme regra;
   - leitura persistida por usuário;
   - leitura não resolve a pendência.

8. **Dashboard**
   - afastamentos ativos;
   - benefícios vencidos;
   - retornos previstos em 15 dias;
   - ativos por obra;
   - novos afastamentos por mês;
   - duração dos afastamentos;
   - tabela de benefícios/retornos prioritários.

9. **Fundação técnica e handoff**
   - frontend integrado à API;
   - backend organizado por domínio;
   - banco relacional com migrations;
   - seeds de desenvolvimento/homologação;
   - configuração por ambiente;
   - tratamento de erros;
   - logs mínimos;
   - testes críticos;
   - documentação de setup e continuidade.

### Fora desta fase

- automação/consulta do INSS;
- armazenamento de credenciais do Meu INSS;
- decisões médicas ou previdenciárias;
- resumo de pendências por e-mail;
- IA;
- SEO, landing page ou aquisição;
- funcionalidades não necessárias para os critérios de aceite da base;
- integração Apdata sem definição de contrato técnico e acesso.

## 7. Regras e restrições já conhecidas

- um afastamento deve refletir a classificação da situação cadastrada: `ATIVO`, `ENCERRADO` ou `APOSENTADO`;
- registros encerrados devem preservar histórico e documentos;
- cadastro auxiliar inativado continua aparecendo em registros antigos;
- cadastro auxiliar inativado não pode ser escolhido em novos registros;
- CPF não é requisito para colaborador;
- fim do benefício gera alerta com antecedência de 30 dias;
- retorno previsto gera alerta com antecedência de 15 dias;
- pendência vencida continua sinalizada até ser resolvida;
- marcar alerta como lido não altera o afastamento nem resolve pendência;
- próximas ações vencidas não entram no dashboard;
- dados e documentos só podem ser acessados por usuários autorizados.

## 8. Direção de experiência e frontend

A interface atual deve ser tratada como referência funcional e visual, não como arquitetura definitiva. Antes da exportação final, devem ser revisados os padrões de:

- filtros;
- botões e ações;
- modais e confirmações;
- tabelas;
- cabeçalho fixo e scroll;
- paginação;
- formulários;
- estados de loading, erro, vazio e sucesso;
- documentos;
- timeline/histórico;
- badges de situação;
- comportamento responsivo.

Diretrizes:

- experiência prioritariamente desktop, sem degradar tablet/mobile;
- interface administrativa clara e sóbria;
- componentes reutilizáveis;
- ações destrutivas sempre confirmadas;
- erros de leitura/gravação visíveis ao usuário;
- nada de regra de autorização baseada somente em esconder elementos no frontend.

## 9. Direção técnica inicial

Sem fechar ainda a arquitetura detalhada, esta fase deve seguir os seguintes princípios:

- separação clara entre frontend, backend e banco;
- frontend nunca acessa banco diretamente;
- API como fronteira de aplicação;
- regras críticas e autorização aplicadas no servidor;
- banco relacional próprio;
- documentos persistidos em mecanismo protegido acessível via backend;
- autenticação Microsoft usando protocolo corporativo apropriado;
- validação explícita dos domínios permitidos;
- RBAC/permissões da aplicação controlados localmente;
- migrations versionadas;
- ambiente local reproduzível;
- configuração por `.env.example` e secrets fora do repositório;
- estrutura organizada para handoff.

A escolha final de frameworks, bibliotecas de ORM, mecanismo de storage, topologia de deploy e pipeline deve ser formalizada na etapa de arquitetura.

## 10. Integrações

### Microsoft — obrigatória na base

Responsável por autenticação/SSO. O sistema deverá validar o domínio da identidade autenticada e vincular a conta a um usuário local.

### Apdata — dependência futura/pendente de contrato técnico

Dados esperados: ID, funcionário, obra, função e contato. O contato terá possibilidade de edição na aplicação. A base deve evitar decisões que impeçam futura sincronização, mas a integração efetiva não será assumida até existir definição técnica da origem.

### E-mail — fora da base

Resumo de pendências por e-mail ficará para implantação ou etapa posterior.

## 11. Entregáveis

### Produto/funcional

- fluxos principais operáveis;
- CRUDs ponta a ponta;
- autenticação e autorização;
- histórico;
- documentos;
- alertas;
- dashboard.

### Engenharia

- frontend;
- backend;
- API;
- banco;
- migrations;
- seeds;
- autenticação Microsoft;
- autorização;
- armazenamento protegido de documentos;
- logs/auditoria mínimos;
- testes críticos;
- ambiente local reproduzível.

### Documentação de handoff

- README de setup;
- visão da arquitetura;
- configuração de ambientes;
- modelo de dados;
- catálogo de endpoints ou documentação da API;
- decisões técnicas relevantes;
- instruções de migrations/seeds;
- guia de autenticação/configuração Microsoft;
- pendências e próximos passos para Milena.

## 12. Critérios de sucesso e aceite macro

A base será considerada pronta para handoff quando:

1. o usuário autorizado conseguir autenticar com Microsoft e contas fora dos domínios permitidos forem recusadas;
2. o sistema aplicar autorização server-side às operações protegidas;
3. os CRUDs essenciais funcionarem de ponta a ponta com persistência real;
4. for possível acompanhar um afastamento do cadastro ao encerramento preservando histórico;
5. documentos puderem ser gravados, consultados e baixados com acesso protegido;
6. alertas e indicadores essenciais refletirem as regras cadastradas;
7. leitura de notificação estiver persistida por usuário e não resolver pendências;
8. migrations e seeds permitirem reconstruir o ambiente;
9. não houver dependência funcional da infraestrutura temporária do protótipo;
10. existir documentação suficiente para Milena subir o ambiente e continuar o desenvolvimento;
11. houver testes dos principais cenários de autenticação, autorização e CRUD;
12. backup e procedimento inicial de recuperação estiverem definidos para o ambiente de implantação/homologação.

## 13. Matriz problema → valor → escopo → entregável

| Problema/Oportunidade | Valor esperado | Escopo | Entregável | Critério de sucesso |
|---|---|---|---|---|
| Dados dispersos | Fonte única | CRUDs e banco | Base relacional integrada | Dados recuperáveis e consistentes |
| Perda de histórico | Rastreabilidade | Andamentos + auditoria | Histórico persistente | Eventos preservados no ciclo completo |
| Risco de prazo | Ação tempestiva | Alertas + dashboard | Regras de 30/15 dias | Indicadores coerentes com datas |
| Documentos dispersos | Consulta contextual | Storage protegido | Upload/download vinculado | Acesso somente autorizado |
| Segurança insuficiente | Proteção de dados | Microsoft + autorização | SSO + RBAC | Anônimo e não autorizado sem acesso |
| Continuidade com nova dev | Menor retrabalho | Organização + docs | Handoff técnico | Milena consegue executar e evoluir |

## 14. Riscos iniciais

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Autenticação Microsoft configurada sem autorização local adequada | Média | Alto | Separar identidade de RBAC e testar server-side. |
| Dados sensíveis expostos por endpoint/storage | Média | Crítico | Autorização, URLs temporárias e testes de acesso. |
| Regras do protótipo serem copiadas sem validação | Média | Alto | Formalizar requisitos/funcional antes da migração. |
| Integração Apdata alterar ownership dos dados | Alta | Médio/Alto | Manter contrato de domínio desacoplado e decisão pendente. |
| Handoff incompleto | Média | Alto | README, API, migrations, decisões e backlog de pendências. |
| Escopo crescer para além da base | Média | Médio | Usar Must/Should/Could/Won't e critérios de aceite. |

## 15. Maturidade do Brief

**Nível 4 — handoffs, riscos e decisões pendentes mapeados.**

O projeto já possui problema, valor, recorte da fase, entregáveis e critérios macro bem definidos. Ainda existem decisões técnicas e funcionais que pertencem ao Discovery, Requisitos, Funcional e Arquitetura antes da implementação final.

## 16. Próximas etapas

1. concluir Discovery técnico e estratégico;
2. formalizar requisitos e regras;
3. detalhar fluxos funcionais e exceções;
4. revisar Design System/frontend;
5. exportar e higienizar o protótipo;
6. definir arquitetura e construir a base full stack;
7. validar critérios de aceite e preparar handoff para Milena.
