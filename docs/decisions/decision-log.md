# Registro de Decisões — MCM Gestão de Afastados

**Atualizado em:** 06/10/2026

| ID | Data | Status | Decisão | Justificativa | Impacto |
|---|---|---|---|---|---|
| DEC-001 | 05/10/2026 | Decidida | A fase atual entregará uma base full stack funcional para handoff à Milena, e não o produto final completo. | Priorizar fundação técnica e continuidade. | Escopo, documentação, qualidade. |
| DEC-002 | 05/10/2026 | Decidida | Frontend, backend/API e banco serão integrados com CRUDs reais. | A entrega precisa ser operacional e evolutiva. | Arquitetura, backend, frontend, banco. |
| DEC-003 | 05/10/2026 | Decidida | Autenticação corporativa será Microsoft. | Alinhamento ao ambiente corporativo. | Segurança, integração, ambiente. |
| DEC-004 | 05/10/2026 | Decidida | Login será elegível somente para `mcm.eng.br` e `mcmmontagens.com.br`. | Restringir identidades ao ambiente corporativo. | Autenticação e testes. |
| DEC-005 | 05/10/2026 | Decidida | Autorização será controlada pela aplicação, independentemente do domínio Microsoft. | Domínio não determina permissão por recurso/ação. | Backend, API, banco, frontend. |
| DEC-006 | 05/10/2026 | Decidida | Após exportação, dependências e acoplamentos específicos da ferramenta/infraestrutura temporária do protótipo serão removidos. | Evitar dependência tecnológica e preparar base sustentável. | Repositório, frontend, backend, configuração. |
| DEC-007 | 05/10/2026 | Decidida | Resumo de pendências por e-mail fica fora da base atual. | Requisito previsto para implantação ou etapa posterior. | Escopo. |
| DEC-P01 | 05/10/2026 | Pendente | Definir perfis, roles e permissões granulares. | Necessário antes de fechar RBAC. | Segurança, UX, API. |
| DEC-P02 | 05/10/2026 | Parcialmente resolvida | Storage será abstraído; desenvolvimento usará volume privado e produção preferirá S3-compatible privado. Provider específico permanece pendente. | Permite implementar sem lock-in e preservar segurança. | Arquitetura, infra, backend. |
| DEC-P03 | 05/10/2026 | Pendente | Definir forma e fase da integração com Apdata. | Falta contrato técnico da fonte. | Integração, modelo de dados. |
| DEC-P04 | 05/10/2026 | Parcialmente resolvida | Local, homologação e produção foram previstos; backup diário com retenção mínima inicial de 14 dias e restore antes do go-live. Host, domínio e provider de produção permanecem pendentes. | Define baseline operacional sem inventar infraestrutura MCM. | Infraestrutura e operação. |

| DEC-008 | 05/10/2026 | Decidida | O frontend não acessará o banco diretamente; toda operação protegida passará pelo backend/API. | Centralizar autorização, validação e regras críticas no servidor. | Arquitetura, segurança, backend, frontend. |
| DEC-009 | 05/10/2026 | Decidida | A aplicação deverá representar o perfil funcional SMS e manter autorização por capacidades configuráveis. | Atender o perfil conhecido sem impedir evolução da matriz de acesso. | Usuários, permissões, frontend, API. |
| DEC-P05 | 05/10/2026 | Resolvida | Primeiro administrador será provisionado explicitamente por seed/CLI usando e-mail corporativo informado por variável de ambiente; não haverá autoelevação no primeiro login. | Bootstrap controlado e auditável. | Segurança, operação, autenticação. |
| DEC-P06 | 05/10/2026 | Pendente | Validar a fórmula e a apresentação final do indicador/gráfico de duração dos afastamentos. | A necessidade do indicador é confirmada, mas o cálculo atual não foi auditado integralmente. | Dashboard, testes, backend. |
| DEC-P07 | 05/10/2026 | Pendente | Definir política definitiva de retenção/exclusão de documentos e registros de auditoria. | Necessário para segurança, privacidade, backup e comportamento de exclusão. | Segurança, banco, storage, operação. |


| DEC-010 | 05/10/2026 | Decidida | A rodada pré-exportação será exclusivamente de refinamento visual e de experiência das telas existentes; funcionalidades estruturantes novas serão implementadas no pós-exportação. | Evitar ampliar código temporário que será substituído pela arquitetura final. | Frontend, cronograma, handoff. |
| DEC-011 | 05/10/2026 | Decidida | A linguagem visual atual será preservada e consolidada em tokens; não haverá rebranding nesta fase. | Não existe identidade nova aprovada e o objetivo é consistência, não redesign. | Design System e frontend. |
| DEC-012 | 05/10/2026 | Decidida | Dark mode, PWA, white label, SEO, páginas públicas e motion avançado ficam fora da base atual. | Não são necessários aos critérios funcionais confirmados. | Escopo frontend. |
| DEC-013 | 05/10/2026 | Decidida | TanStack Router será mantido; não haverá migração de roteador apenas por padronização. | As rotas atuais são funcionais e a troca não entrega valor proporcional. | Frontend e manutenção. |
| DEC-014 | 05/10/2026 | Decidida | O frontend final usará API client centralizado e services por domínio; nenhuma page/component acessará banco ou storage diretamente. | Separar UI, comunicação e autorização e facilitar continuidade pela Milena. | Frontend, backend, segurança. |
| DEC-015 | 05/10/2026 | Decidida | Listagens relevantes terão paginação e comportamento responsivo; no mobile, tabelas extensas serão adaptadas para cards/lista. | Corrigir o principal gap de responsividade observado e preparar crescimento dos dados. | UX, frontend e API. |
| DEC-016 | 05/10/2026 | Decidida | O frontend entregue à Milena deve atingir nível equivalente a pronto para homologação: API/auth integradas, estados completos, testes mínimos e build validado. | A entrega é uma base operacional, não somente um protótipo visual. | Qualidade e handoff. |

| DEC-017 | 05/10/2026 | Decidida | Backend será monólito modular separado do frontend e exporá REST JSON em `/api/v1`. | Complexidade proporcional ao domínio e handoff sustentável. | Arquitetura, backend, API, deploy. |
| DEC-018 | 05/10/2026 | Decidida | Frontend final será SPA React/Vite, mantendo TanStack Router; runtime server-side herdado será removido quando redundante. | Não há necessidade de SSR e não há ganho em migrar o router funcional. | Frontend, Docker, manutenção. |
| DEC-019 | 05/10/2026 | Decidida | Login Microsoft será mediado pelo backend via OIDC; sessão local será server-side em PostgreSQL, identificada por cookie HttpOnly opaco. | Revogação central, menor exposição no navegador e ausência de necessidade de Redis. | Auth, backend, banco, frontend, segurança. |
| DEC-020 | 05/10/2026 | Decidida | A aplicação será single-tenant; os dois domínios corporativos elegíveis não representam tenants distintos. | Evitar isolamento multi-tenant desnecessário. | Banco, autorização, arquitetura. |
| DEC-021 | 05/10/2026 | Decidida | Backend utilizará PostgreSQL + Prisma com migrations versionadas. | Domínio relacional e necessidade de integridade, tipagem e manutenção. | Banco, backend, infra. |
| DEC-022 | 05/10/2026 | Decidida | Redis, fila e worker não entram na base inicial. | Não há demanda atual que justifique complexidade operacional adicional. | Backend, infra, observabilidade. |
| DEC-023 | 05/10/2026 | Decidida | Logs backend serão estruturados em JSON com request ID; audit log será separado e sanitizado. | Diagnóstico e rastreabilidade sem expor dados sensíveis. | Backend, segurança, observabilidade. |
| DEC-024 | 05/10/2026 | Decidida | A infraestrutura será Docker/Compose portável; host/orquestrador real de produção será definido pela MCM antes do go-live. | Não assumir infraestrutura corporativa não informada. | Infraestrutura, deploy. |
| DEC-025 | 05/10/2026 | Decidida | A baseline de backup de produção será diária com retenção mínima inicial de 14 dias, backup antes de migration crítica e restore testado antes do go-live. | Proteger persistência e reduzir risco operacional. | Infraestrutura, banco, operação. |
| DEC-P08 | 05/10/2026 | Pendente | Obter tenant ID(s), Client ID, responsáveis e callbacks da App Registration Microsoft da MCM. | Necessário para implementar autenticação real. | Auth, segurança, ambiente. |
| DEC-P09 | 05/10/2026 | Pendente | Definir URLs/domínios de homologação, produção e API. | Necessário para CORS, cookies, callbacks, SSL e deploy. | Infraestrutura, auth. |
| DEC-P10 | 05/10/2026 | Pendente | Definir host/orquestrador de homologação e produção e estratégia corporativa de secrets. | Infraestrutura MCM ainda não informada. | Infraestrutura, operação. |
| DEC-P11 | 05/10/2026 | Pendente | Definir provider S3-compatible de produção ou aprovar volume persistente privado com backup equivalente. | Fechar storage de documentos. | Infra, backend, segurança. |

| DEC-026 | 05/10/2026 | Decidida | Endpoints de listagem usarão paginação server-side page-based; padrão do projeto será 10 itens por página, com 10/20/50/100 e máximo 100. | Preserva UX validada e evita carga integral no navegador. | Frontend, API, backend, banco. |
| DEC-027 | 05/10/2026 | Decidida | Datas de negócio usam `YYYY-MM-DD`; timestamps técnicos usam ISO 8601 UTC. | Evita deslocamento indevido de datas civis e padroniza auditoria. | Frontend, API, banco. |
| DEC-028 | 05/10/2026 | Decidida | Cadastros auxiliares e colaboradores usam inativação em vez de hard delete operacional. | Preserva referências históricas. | Backend, banco, UX. |
| DEC-029 | 05/10/2026 | Decidida | `obraId` e `funcaoId` serão persistidos no afastamento como contexto histórico do caso, independentemente do cadastro atual do colaborador. | Mudanças futuras no colaborador não podem reescrever histórico. | Banco, backend, dashboard. |
| DEC-030 | 05/10/2026 | Decidida | Alertas serão derivados em consulta; somente leitura por usuário será persistida usando fingerprint/chave determinística. | Evita tabela de notificações divergente da regra de negócio e atende leitura multi-dispositivo. | Backend, banco, frontend. |
| DEC-031 | 05/10/2026 | Decidida | O sistema não terá endpoints de senha local; autenticação web será exclusivamente Microsoft no escopo atual. | A identidade é corporativa e não deve existir credencial paralela. | Auth, API, backend, frontend. |
| DEC-032 | 05/10/2026 | Decidida | A API usará erro estruturado plano com `status`, `code`, `message`, `fieldErrors?` e `requestId`. | Uniformiza frontend, testes e observabilidade. | API, backend, frontend. |
| DEC-033 | 05/10/2026 | Decidida | OpenAPI será obrigatório para a base técnica e handoff. | Sistema crítico, múltiplas camadas e continuidade por outro dev. | API, testes, documentação. |
| DEC-034 | 05/10/2026 | Decidida | Não persistir access/refresh tokens Microsoft para manter a sessão normal da aplicação; persistir somente identidade externa necessária e sessão local. | Minimiza superfície de credenciais e separa identidade de sessão. | Auth, banco, segurança. |
| DEC-035 | 05/10/2026 | Decidida | Andamentos usam soft delete; afastamentos não possuem delete operacional; documentos removem o binário quando exclusão é autorizada e preservam evidência mínima conforme retenção. | Preserva histórico e auditoria sem manter binário deliberadamente excluído por padrão. | Backend, banco, storage, segurança. |
| DEC-P12 | 05/10/2026 | Pendente | Confirmar matriz final de capacidades do papel `SMS` e quaisquer outros papéis operacionais. | A arquitetura de RBAC está pronta, mas os grants finais são decisão de negócio/governança. | Auth, backend, banco, testes. |
| DEC-P13 | 05/10/2026 | Pendente | Definir prazos corporativos de retenção/anonimização/expurgo de documentos, dados de saúde, audit logs e tombstones. | Necessário antes de produção com dados reais. | Banco, segurança, compliance, infraestrutura. |

| DEC-036 | 06/10/2026 | Decidida | Testes automatizados não fazem parte do escopo desta entrega e não serão implementados via Codex nesta fase. | A validação atual será por typecheck, build, migrations, healthchecks, smoke manual e revisão técnica. | Backend, frontend, API, banco, handoff. |

## Auditoria de integração da Fase 3 — 06/10/2026

Divergências identificadas antes da substituição das fontes de dados:

- O protótipo gera código de colaborador e contém nascimento/admissão; a API exige `codigoCorporativo`, obra e função e não persiste essas datas. A UI solicitará o código corporativo e somente enviará campos suportados.
- A API de afastamentos não persiste início de benefício nem aposentadoria. A UI não apresentará esses campos como editáveis. O filtro de classificação da lista exige extensão mínima do schema/repository da API, usando a classificação já existente na situação, sem nova regra de negócio.
- A validação de edição de afastamento verificava novamente referências inativas já vinculadas, contrariando a preservação histórica (RN-002). Somente referências alteradas serão verificadas quanto à atividade.
- Cadastros auxiliares não possuem código nem ordem de exibição na API. A UI seguirá os campos reais. Consultas de apoio exigem `settings.manage`; não serão criados grants ou ampliadas permissões implicitamente.
- Documentos recebem `file`, `tipoDocumentoId` e `andamentoId` opcionais conforme schema, sem `dataDocumento`. A lista exibirá data de envio técnica, sem fingir persistência de data documental.
- O dashboard atual não recebe filtro de obra nem informa obra na lista prioritária. O filtro ficará explicitamente indisponível; duração continuará `pending_final_validation`, sem cálculo substituto.
- Notificações retornam lista e `meta.unreadCount`, com filtro `status`, sem contrato `page/perPage`. A UI consumirá esse contrato específico e persistirá leitura pela API.
- `/auth/login` devolvia JSON de erro mesmo na navegação do browser. Será mantido o erro JSON oficial para clientes de API e adicionada apresentação HTML amigável em navegação que solicite HTML, preservando o status HTTP.

A auditoria inicial mapeou: lista/form/detalhe de afastamentos, histórico, documentos, colaboradores e configurações → cliente de persistência do protótipo; dashboard → cálculos locais sobre consultas integrais; notificações → consultas integrais e leitura em localStorage. Login e administração de usuários ainda não existiam.


| DEC-037 | 06/10/2026 | Implementada | Frontend SPA Vite/React com TanStack Router, Query, API client e services por domínio; somente `/api/v1`, sessão HttpOnly e capabilities do backend. | Concluir integração e eliminar acesso direto ao banco/storage. | Frontend, auth e handoff. |
| DEC-038 | 06/10/2026 | Implementada | Supabase, Lovable e Bun removidos da stack operacional; npm/package-lock, build estático e Nginx com fallback SPA e proxy da API. | Projeto MCM independente e Docker portável. | Dependências, build e infraestrutura. |

O lockfile conserva metadado de peer opcional de tipos de outro runtime em uma
dependência transitiva do plugin do roteador; esse pacote de tipos não é instalado
nem necessário. Não se adultera o lockfile para esconder metadados publicados.
A App Registration Microsoft, a matriz operacional de capacidades, o provider de
storage de produção, Apdata e a fórmula de duração continuam pendentes.
