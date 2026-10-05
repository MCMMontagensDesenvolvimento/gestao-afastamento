-- Tabelas base
CREATE TABLE public.obras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.funcoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tipos_beneficio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text,
  nome text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  ordem_exibicao int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.situacoes_afastamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  classificacao_sistema text NOT NULL CHECK (classificacao_sistema IN ('ATIVO','ENCERRADO','APOSENTADO')),
  ativo boolean NOT NULL DEFAULT true,
  ordem_exibicao int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tipos_andamento_afastamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  ordem_exibicao int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tipos_documento_afastamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  ordem_exibicao int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE SEQUENCE public.colaboradores_codigo_seq START 1;

CREATE TABLE public.colaboradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_interno text NOT NULL DEFAULT ('COL-' || lpad(nextval('public.colaboradores_codigo_seq')::text, 4, '0')),
  nome text NOT NULL,
  contato text,
  data_nascimento date,
  data_admissao date,
  obra_id uuid REFERENCES public.obras(id),
  funcao_id uuid REFERENCES public.funcoes(id),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.afastamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid NOT NULL REFERENCES public.colaboradores(id),
  obra_id uuid REFERENCES public.obras(id),
  funcao_id uuid REFERENCES public.funcoes(id),
  data_afastamento date NOT NULL,
  tipo_beneficio_id uuid REFERENCES public.tipos_beneficio(id),
  situacao_afastamento_id uuid NOT NULL REFERENCES public.situacoes_afastamento(id),
  data_inicio_beneficio date,
  data_fim_beneficio date,
  data_retorno_previsto date,
  data_retorno_efetivo date,
  data_aposentadoria date,
  causa_cid text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.obras TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funcoes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tipos_beneficio TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.situacoes_afastamento TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tipos_andamento_afastamento TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tipos_documento_afastamento TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.colaboradores TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.afastamentos TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.colaboradores_codigo_seq TO anon, authenticated;
GRANT ALL ON public.obras TO service_role;
GRANT ALL ON public.funcoes TO service_role;
GRANT ALL ON public.tipos_beneficio TO service_role;
GRANT ALL ON public.situacoes_afastamento TO service_role;
GRANT ALL ON public.tipos_andamento_afastamento TO service_role;
GRANT ALL ON public.tipos_documento_afastamento TO service_role;
GRANT ALL ON public.colaboradores TO service_role;
GRANT ALL ON public.afastamentos TO service_role;
GRANT ALL ON SEQUENCE public.colaboradores_codigo_seq TO service_role;

-- RLS (protótipo: acesso público)
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_beneficio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.situacoes_afastamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_andamento_afastamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_documento_afastamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.afastamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acesso_publico_obras" ON public.obras FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_funcoes" ON public.funcoes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_tipos_beneficio" ON public.tipos_beneficio FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_situacoes" ON public.situacoes_afastamento FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_tipos_andamento" ON public.tipos_andamento_afastamento FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_tipos_documento" ON public.tipos_documento_afastamento FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_colaboradores" ON public.colaboradores FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_afastamentos" ON public.afastamentos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_colaboradores_updated_at BEFORE UPDATE ON public.colaboradores
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_afastamentos_updated_at BEFORE UPDATE ON public.afastamentos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seeds de configuração
INSERT INTO public.tipos_beneficio (codigo, nome, ordem_exibicao) VALUES
  ('B31', 'Benefício por incapacidade temporária', 1),
  ('B91', 'Benefício por incapacidade temporária acidentário', 2),
  ('B32', 'Aposentadoria por incapacidade permanente', 3);

INSERT INTO public.situacoes_afastamento (nome, classificacao_sistema, ordem_exibicao) VALUES
  ('Em acompanhamento', 'ATIVO', 1),
  ('Aguardando perícia', 'ATIVO', 2),
  ('Aguardando decisão', 'ATIVO', 3),
  ('Benefício ativo', 'ATIVO', 4),
  ('Retorno previsto', 'ATIVO', 5),
  ('Encerrado', 'ENCERRADO', 6),
  ('Aposentado', 'APOSENTADO', 7);

INSERT INTO public.tipos_andamento_afastamento (nome, ordem_exibicao) VALUES
  ('Atestado', 1), ('Requerimento INSS', 2), ('Perícia', 3), ('Decisão INSS', 4),
  ('Prorrogação', 5), ('Contato com colaborador', 6), ('Retorno ao trabalho', 7),
  ('Observação', 8), ('Outros', 9);

INSERT INTO public.tipos_documento_afastamento (nome, ordem_exibicao) VALUES
  ('Atestado', 1), ('Requerimento', 2), ('Comprovante de perícia', 3), ('Comunicado de decisão', 4),
  ('Documento INSS', 5), ('Relatório médico', 6), ('Laudo médico', 7), ('Outros', 8);

INSERT INTO public.obras (nome) VALUES
  ('Obra Alpha'), ('Obra Beta'), ('Obra Galpão Sul'), ('Sede Administrativa');

INSERT INTO public.funcoes (nome) VALUES
  ('Pedreiro'), ('Eletricista'), ('Encarregado'), ('Assistente Técnico');

INSERT INTO public.colaboradores (nome, contato, data_nascimento, data_admissao, obra_id, funcao_id)
SELECT v.nome, v.contato, v.nasc::date, v.adm::date,
       (SELECT id FROM public.obras WHERE nome = v.obra),
       (SELECT id FROM public.funcoes WHERE nome = v.funcao)
FROM (VALUES
  ('Carlos Henrique Souza', '(11) 98812-4477', '1985-04-12', '2018-03-05', 'Obra Alpha', 'Pedreiro'),
  ('Marcos Vinícius Lima', '(11) 99654-2210', '1979-11-30', '2015-07-21', 'Obra Beta', 'Eletricista'),
  ('Fernanda Alves Ribeiro', '(11) 97321-8890', '1990-02-08', '2020-01-13', 'Sede Administrativa', 'Assistente Técnico'),
  ('João Batista Ferreira', '(11) 98110-5533', '1972-08-19', '2011-09-01', 'Obra Galpão Sul', 'Encarregado'),
  ('Rafael Moreira Pinto', '(11) 99987-1122', '1988-06-25', '2019-05-06', 'Obra Alpha', 'Eletricista')
) AS v(nome, contato, nasc, adm, obra, funcao);

INSERT INTO public.afastamentos (
  colaborador_id, obra_id, funcao_id, data_afastamento, tipo_beneficio_id,
  situacao_afastamento_id, data_inicio_beneficio, data_fim_beneficio,
  data_retorno_previsto, data_retorno_efetivo, data_aposentadoria, causa_cid, observacoes
)
SELECT c.id, c.obra_id, c.funcao_id, v.data_afast::date,
       (SELECT id FROM public.tipos_beneficio WHERE codigo = v.beneficio),
       (SELECT id FROM public.situacoes_afastamento WHERE nome = v.situacao),
       v.ini::date, v.fim::date, v.prev::date, v.efet::date, v.apos::date, v.cid, v.obs
FROM (VALUES
  ('Carlos Henrique Souza', '2026-06-10', 'B31', 'Em acompanhamento', NULL, NULL, '2026-09-30', NULL, NULL, 'M54.5 - Dor lombar baixa', 'Atestado inicial de 30 dias, em acompanhamento pelo RH.'),
  ('Marcos Vinícius Lima', '2026-07-02', 'B91', 'Aguardando perícia', NULL, NULL, NULL, NULL, NULL, 'S62.6 - Fratura de dedo da mão', 'Acidente de trabalho comunicado via CAT. Perícia agendada.'),
  ('Fernanda Alves Ribeiro', '2026-04-15', 'B31', 'Benefício ativo', '2026-05-01', '2026-10-31', '2026-11-03', NULL, NULL, 'F32.1 - Episódio depressivo moderado', 'Benefício concedido pelo INSS com prorrogação em análise.'),
  ('Rafael Moreira Pinto', '2026-01-20', 'B31', 'Encerrado', '2026-02-05', '2026-04-30', '2026-05-02', '2026-05-02', NULL, 'S83.5 - Entorse de joelho', 'Colaborador retornou ao trabalho na data prevista.'),
  ('João Batista Ferreira', '2025-03-11', 'B32', 'Aposentado', '2025-04-01', NULL, NULL, NULL, '2026-02-28', 'I25.1 - Doença cardíaca isquêmica', 'Aposentadoria por incapacidade permanente concedida.')
) AS v(colab, data_afast, beneficio, situacao, ini, fim, prev, efet, apos, cid, obs)
JOIN public.colaboradores c ON c.nome = v.colab;