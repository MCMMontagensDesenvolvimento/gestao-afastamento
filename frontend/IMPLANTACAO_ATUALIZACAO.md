# Atualização: histórico, documentos e alertas

## Como enviar ao GitHub

1. Copie o conteúdo desta pasta para a pasta clonada pelo GitHub Desktop.
2. Não substitua nem apague a pasta oculta `.git` da pasta clonada.
3. No GitHub Desktop, confira os arquivos alterados.
4. Use o resumo: `Implementa histórico, documentos e alertas`.
5. Clique em **Commit to main** e depois em **Push origin**.

## Banco de dados

A migration `supabase/migrations/20260917150000_historico_documentos.sql` cria:

- `afastamento_andamentos`;
- `afastamento_documentos`;
- bucket privado `afastamentos-documentos`;
- índices, gatilho e políticas temporárias do protótipo.

Se a migration não for aplicada automaticamente pelo fluxo Lovable/Supabase, execute o conteúdo desse arquivo uma única vez no SQL Editor do Supabase.

## Atenção

O protótipo permanece sem autenticação e com políticas temporárias. Não use dados ou documentos reais. A TI deve revisar autenticação, RLS e Storage antes da produção.

## Validação realizada

- verificação TypeScript (`tsc --noEmit`) concluída sem erros;
- build-base do projeto validado antes da inclusão;
- componentes novos conectados à tela de detalhe do afastamento.

Observação: o comando de build deste projeto usa um plugin do Lovable que restaura arquivos gerenciados durante a execução local. Por isso, a validação final das alterações foi feita pelo compilador TypeScript, e o build definitivo deve ser conferido após a sincronização no Lovable.
