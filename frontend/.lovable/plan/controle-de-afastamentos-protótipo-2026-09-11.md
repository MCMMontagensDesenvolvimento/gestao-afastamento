# Controle de Afastamentos — protótipo

Sistema web em português (pt-BR) para acompanhar afastamentos de colaboradores, com banco de dados e dados fictícios já carregados para teste.

## Identidade visual
- Laranja MCM (#ff4b00) como cor de destaque, cinza escuro (#4a4a4a) para textos, cinza claro (#eaeaea) para bordas/fundos, branco nas áreas de conteúdo.
- Layout limpo: menu lateral fixo, tabelas simples, sem gráficos e sem efeitos visuais pesados.

## Telas

### 1. Afastados (tela inicial)
- Três cartões discretos no topo: Ativos, Encerrados, Aposentados.
- Filtros: busca por colaborador, obra, função, tipo de benefício e situação.
- Atalhos em pílulas: Todos | Ativos | Encerrados | Aposentados.
- Tabela: Colaborador, Obra, Função, Tipo de benefício, Situação (etiqueta colorida), Data do afastamento, Início do benefício, Fim do benefício, Ações (Visualizar / Editar).
- Botão "+ Novo afastamento".

### 2. Novo / Editar afastamento
Formulário em página própria: colaborador (lista pesquisável, só ativos ao criar), obra e função (preenchidas com as do colaborador e alteráveis), data do afastamento (obrigatória), tipo de benefício (opcional), situação (obrigatória), datas opcionais (início e fim do benefício, retorno previsto, retorno efetivo, aposentadoria), causa/CID e observações.

### 3. Detalhe do afastamento
Cabeçalho com nome do colaborador, código interno, obra, função, tipo de benefício, situação e datas principais; bloco "Dados do afastamento" completo e botão "Editar afastamento". Sem histórico e sem anexos.

### 4. Colaboradores
Busca por nome, filtro por obra e por Ativos/Inativos; botão "+ Novo colaborador"; tabela com código, nome, contato, obra, função, status e ações (visualizar/editar, inativar/reativar). Código interno gerado automaticamente (COL-0001...). Nunca há CPF. Colaborador com afastamentos vinculados só pode ser inativado, nunca excluído.

### 5. Configurações
Abas para Obras, Funções, Tipos de benefício, Situações (com a classificação ATIVO / ENCERRADO / APOSENTADO), Tipos de andamento e Tipos de documento. Cada aba permite cadastrar, editar e inativar/reativar.

## Regras de negócio
- Contagens e filtros de status sempre usam a classificação da situação (ATIVO / ENCERRADO / APOSENTADO), nunca o nome digitado.
- Todas as listas de seleção vêm das tabelas de configuração, apenas itens ativos.
- Registros são inativados, nunca apagados; itens com vínculos não podem ser removidos.
- CPF não é solicitado nem exibido em nenhum lugar.

## Dados iniciais
- Tipos de benefício B31, B91, B32; sete situações; nove tipos de andamento; oito tipos de documento.
- 4 obras (Alpha, Beta, Galpão Sul, Sede Administrativa), 4 funções (Pedreiro, Eletricista, Encarregado, Assistente Técnico), 5 colaboradores.
- 5 afastamentos de exemplo: em acompanhamento, aguardando perícia, benefício ativo, encerrado e aposentado.

## Detalhes técnicos
- Lovable Cloud (Supabase) ativado; tabelas `obras`, `funcoes`, `tipos_beneficio`, `situacoes_afastamento`, `tipos_andamento_afastamento`, `tipos_documento_afastamento`, `colaboradores`, `afastamentos` conforme o esquema informado, com GRANTs, RLS habilitada e políticas públicas (protótipo sem login).
- Seed de configurações e dados fictícios via INSERTs na própria migração.
- Rotas: `/` (afastados), `/afastamentos/novo`, `/afastamentos/$id`, `/afastamentos/$id/editar`, `/colaboradores`, `/configuracoes`.
- Leitura de dados via server functions com cliente publishable + TanStack Query; escrita via server functions.
- Tokens de cor definidos em `src/styles.css`; componentes shadcn para tabelas, abas, diálogos e formulários.
- `head()` próprio por rota com título e descrição em pt-BR.
