# Gestão de Afastamentos

Crie o protótipo do sistema web "Controle de Afastamentos" em português (pt-BR) com Supabase e Lovable Cloud.

Identidade visual e estilo:
- Cores: Laranja MCM (#ff4b00), cinza escuro (#4a4a4a), cinza claro (#eaeaea), branco (#ffffff).
- Visual limpo, profissional, sem gráficos, sem sombras exageradas, sem complexidade desnecessária.

Estrutura de dados (tabelas Supabase com RLS e políticas permissivas/públicas para este protótipo inicial):
1. obras (id uuid pk default gen_random_uuid(), nome text not null, ativo boolean default true, created_at timestamptz default now())
2. funcoes (id uuid pk default gen_random_uuid(), nome text not null, ativo boolean default true, created_at timestamptz default now())
3. tipos_beneficio (id uuid pk default gen_random_uuid(), codigo text, nome text not null, ativo boolean default true, ordem_exibicao int default 0, created_at timestamptz default now())
   - Seed inicial:
     - B31 - Benefício por incapacidade temporária (codigo: 'B31')
     - B91 - Benefício por incapacidade temporária acidentário (codigo: 'B91')
     - B32 - Aposentadoria por incapacidade permanente (codigo: 'B32')
4. situacoes_afastamento (id uuid pk default gen_random_uuid(), nome text not null, classificacao_sistema text not null check (classificacao_sistema in ('ATIVO', 'ENCERRADO', 'APOSENTADO')), ativo boolean default true, ordem_exibicao int default 0, created_at timestamptz default now())
   - Seed inicial:
     - Em acompanhamento -> classificacao_sistema: 'ATIVO'
     - Aguardando perícia -> classificacao_sistema: 'ATIVO'
     - Aguardando decisão -> classificacao_sistema: 'ATIVO'
     - Benefício ativo -> classificacao_sistema: 'ATIVO'
     - Retorno previsto -> classificacao_sistema: 'ATIVO'
     - Encerrado -> classificacao_sistema: 'ENCERRADO'
     - Aposentado -> classificacao_sistema: 'APOSENTADO'
5. tipos_andamento_afastamento (id uuid pk default gen_random_uuid(), nome text not null, ativo boolean default true, ordem_exibicao int default 0, created_at timestamptz default now())
   - Seed inicial: Atestado, Requerimento INSS, Perícia, Decisão INSS, Prorrogação, Contato com colaborador, Retorno ao trabalho, Observação, Outros.
6. tipos_documento_afastamento (id uuid pk default gen_random_uuid(), nome text not null, ativo boolean default true, ordem_exibicao int default 0, created_at timestamptz default now())
   - Seed inicial: Atestado, Requerimento, Comprovante de perícia, Comunicado de decisão, Documento INSS, Relatório médico, Laudo médico, Outros.
7. colaboradores (id uuid pk default gen_random_uuid(), codigo_interno text not null, nome text not null, contato text, data_nascimento date, data_admissao date, obra_id uuid references obras(id), funcao_id uuid references funcoes(id), ativo boolean default true, created_at timestamptz default now(), updated_at timestamptz default now())
   - NUNCA usar nem pedir CPF.
   - codigo_interno gerado automaticamente (ex: COL-0001, COL-0002...).
8. afastamentos (id uuid pk default gen_random_uuid(), colaborador_id uuid not null references colaboradores(id), obra_id uuid references obras(id), funcao_id uuid references funcoes(id), data_afastamento date not null, tipo_beneficio_id uuid references tipos_beneficio(id), situacao_afastamento_id uuid not null references situacoes_afastamento(id), data_inicio_beneficio date, data_fim_beneficio date, data_retorno_previsto date, data_retorno_efetivo date, data_aposentadoria date, causa_cid text, observacoes text, created_at timestamptz default now(), updated_at timestamptz default now())

Regras de negócio cruciais:
- Regra de contagem e filtros de afastamento: SEMPRE utilizar situacoes_afastamento.classificacao_sistema ('ATIVO', 'ENCERRADO', 'APOSENTADO'), nunca fazer match direto pelo nome da situação.
- Dropdowns não devem ter opções fixas no código; sempre carregar das tabelas ativas.
- Inativação lógica (soft-inactivation via ativo = false) em vez de exclusão física, impedindo exclusão de registros com vínculos.
- Não cadastrar ou exibir CPF.

Navegação e Telas:
Menu lateral:
1. "Afastados" (Tela Principal):
   - Topo: 3 cards simples e discretos: Ativos, Encerrados, Aposentados (calculados via classificacao_sistema da situação).
   - Filtros: Busca colaborador, Obra, Função, Tipo de benefício, Situação.
   - Filtros rápidos em tabs/pills: Todos | Ativos | Encerrados | Aposentados.
   - Tabela: Colaborador, Obra, Função, Tipo de benefício, Situação (com badge), Data do afastamento, Início do benefício, Fim do benefício, Ações (Visualizar, Editar).
   - Botão "+ Novo afastamento".
2. "Novo / Editar Afastamento" (modal ou página):
   - Colaborador (dropdown pesquisável, apenas ativos ao criar).
   - Obra e Função (ao selecionar colaborador, preencher inicialmente com os dele, mas permitir alterar).
   - Data do afastamento (obrigatório).
   - Tipo de benefício (dropdown configurável, opcional).
   - Situação (dropdown configurável, obrigatório).
   - Datas opcionais: início benefício, fim benefício, retorno previsto, retorno efetivo, aposentadoria.
   - Causa / CID (textarea simples, sem dropdown).
   - Observações (textarea).
3. "Detalhe do Afastamento" (/afastamentos/:id):
   - Cabeçalho com Nome do colaborador, ID interno, Obra, Função, Tipo de benefício, Situação, Data afastamento, Início/Fim do benefício, Retorno previsto.
   - Seção "Dados do afastamento" completa.
   - Botão "Editar afastamento".
   - NÃO incluir histórico/linha do tempo nem upload de documentos.
4. "Colaboradores":
   - Busca por nome, filtro por obra, filtro Ativos/Inativos.
   - Botão "+ Novo colaborador".
   - Tabela com ID, Nome, Contato, Obra, Função, Status, Ações (Visualizar/Editar, Inativar/Reativar).
   - Não permitir excluir se possuir afastamentos vinculados.
5. "Configurações":
   - Seção "Configurações de Afastamentos" com abas:
     - Obras
     - Funções
     - Tipos de benefício
     - Situações (com campo classificacao_sistema: ATIVO, ENCERRADO, APOSENTADO)
     - Tipos de andamento
     - Tipos de documento
   - Cada aba permite cadastrar, editar e inativar/reativar.

Seed de dados fictícios para teste demonstrando:
- Pelo menos 4 obras (ex: Obra Alpha, Obra Beta, Obra Galpão Sul, Sede Administrativa) e 4 funções (ex: Pedreiro, Eletricista, Encarregado, Assistente Técnico).
- 5 colaboradores fictícios.
- Afastamentos simulando: 1 ativo em acompanhamento, 1 aguardando perícia, 1 benefício ativo, 1 encerrado e 1 aposentado.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6212beef-4253-4b73-8cc9-fafe958052e7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
