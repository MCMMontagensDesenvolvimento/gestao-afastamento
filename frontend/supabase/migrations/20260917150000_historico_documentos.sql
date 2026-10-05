-- AMBIENTE DE PROTÓTIPO.
-- Políticas temporárias para dados fictícios. Antes do uso com dados pessoais,
-- médicos ou documentos reais, a TI deve revisar autenticação, RLS e Storage.

CREATE TABLE public.afastamento_andamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  afastamento_id uuid NOT NULL REFERENCES public.afastamentos(id) ON DELETE CASCADE,
  data_andamento date NOT NULL,
  tipo_andamento_id uuid NOT NULL REFERENCES public.tipos_andamento_afastamento(id),
  descricao text NOT NULL,
  proxima_acao text,
  data_proxima_acao date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.afastamento_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  afastamento_id uuid NOT NULL REFERENCES public.afastamentos(id) ON DELETE CASCADE,
  andamento_id uuid REFERENCES public.afastamento_andamentos(id) ON DELETE SET NULL,
  tipo_documento_id uuid NOT NULL REFERENCES public.tipos_documento_afastamento(id),
  data_documento date NOT NULL,
  nome_arquivo text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_andamentos_afastamento_data
  ON public.afastamento_andamentos (afastamento_id, data_andamento DESC);
CREATE INDEX idx_andamentos_proxima_acao
  ON public.afastamento_andamentos (data_proxima_acao)
  WHERE data_proxima_acao IS NOT NULL;
CREATE INDEX idx_documentos_afastamento_data
  ON public.afastamento_documentos (afastamento_id, data_documento DESC);

CREATE TRIGGER trg_afastamento_andamentos_updated_at
BEFORE UPDATE ON public.afastamento_andamentos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.afastamento_andamentos TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.afastamento_documentos TO anon, authenticated;
GRANT ALL ON public.afastamento_andamentos TO service_role;
GRANT ALL ON public.afastamento_documentos TO service_role;

ALTER TABLE public.afastamento_andamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.afastamento_documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso_prototipo_andamentos" ON public.afastamento_andamentos
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_prototipo_documentos" ON public.afastamento_documentos
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'afastamentos-documentos',
  'afastamentos-documentos',
  false,
  10485760,
  ARRAY[
    'application/pdf', 'image/jpeg', 'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Acesso temporário ao bucket privado para o protótipo sem login.
CREATE POLICY "acesso_prototipo_storage_leitura" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'afastamentos-documentos');
CREATE POLICY "acesso_prototipo_storage_insercao" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'afastamentos-documentos');
CREATE POLICY "acesso_prototipo_storage_atualizacao" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'afastamentos-documentos')
  WITH CHECK (bucket_id = 'afastamentos-documentos');
CREATE POLICY "acesso_prototipo_storage_exclusao" ON storage.objects
  FOR DELETE TO anon, authenticated USING (bucket_id = 'afastamentos-documentos');
