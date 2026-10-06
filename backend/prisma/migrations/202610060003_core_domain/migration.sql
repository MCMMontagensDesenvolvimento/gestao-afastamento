CREATE TABLE "colaboradores" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "codigo_corporativo" VARCHAR(100) NOT NULL,
  "nome" VARCHAR(200) NOT NULL,
  "contato" VARCHAR(255),
  "obra_id" UUID NOT NULL,
  "funcao_id" UUID NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "source_system" VARCHAR(100) NOT NULL DEFAULT 'MANUAL',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "colaboradores_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "afastamentos" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "colaborador_id" UUID NOT NULL,
  "obra_id" UUID NOT NULL,
  "funcao_id" UUID NOT NULL,
  "situacao_id" UUID NOT NULL,
  "tipo_beneficio_id" UUID,
  "data_afastamento" DATE NOT NULL,
  "data_fim_beneficio" DATE,
  "data_retorno_prevista" DATE,
  "data_retorno_efetiva" DATE,
  "causa_cid" TEXT,
  "observacoes" TEXT,
  "created_by_id" UUID NOT NULL,
  "updated_by_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "afastamentos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "afastamento_andamentos" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "afastamento_id" UUID NOT NULL,
  "tipo_andamento_id" UUID NOT NULL,
  "data_andamento" DATE NOT NULL,
  "descricao" TEXT NOT NULL,
  "proxima_acao" TEXT,
  "data_proxima_acao" DATE,
  "created_by_id" UUID NOT NULL,
  "updated_by_id" UUID,
  "deleted_at" TIMESTAMPTZ(6),
  "deleted_by_id" UUID,
  "delete_reason" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "afastamento_andamentos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "afastamento_documentos" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "afastamento_id" UUID NOT NULL,
  "andamento_id" UUID,
  "tipo_documento_id" UUID NOT NULL,
  "original_name" VARCHAR(255) NOT NULL,
  "storage_key" VARCHAR(500) NOT NULL,
  "mime_type" VARCHAR(150) NOT NULL,
  "size_bytes" BIGINT NOT NULL,
  "sha256" VARCHAR(64),
  "uploaded_by_id" UUID NOT NULL,
  "deleted_at" TIMESTAMPTZ(6),
  "deleted_by_id" UUID,
  "delete_reason" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "afastamento_documentos_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chk_documentos_size_bytes_nonnegative" CHECK ("size_bytes" >= 0)
);

CREATE UNIQUE INDEX "uq_colaboradores_codigo_corporativo" ON "colaboradores"("codigo_corporativo");
CREATE INDEX "idx_colaboradores_nome" ON "colaboradores"("nome");
CREATE INDEX "idx_colaboradores_obra_id" ON "colaboradores"("obra_id");
CREATE INDEX "idx_colaboradores_funcao_id" ON "colaboradores"("funcao_id");
CREATE INDEX "idx_colaboradores_ativo" ON "colaboradores"("ativo");
CREATE INDEX "idx_afastamentos_colaborador_id" ON "afastamentos"("colaborador_id");
CREATE INDEX "idx_afastamentos_obra_id" ON "afastamentos"("obra_id");
CREATE INDEX "idx_afastamentos_funcao_id" ON "afastamentos"("funcao_id");
CREATE INDEX "idx_afastamentos_situacao_id" ON "afastamentos"("situacao_id");
CREATE INDEX "idx_afastamentos_tipo_beneficio_id" ON "afastamentos"("tipo_beneficio_id");
CREATE INDEX "idx_afastamentos_data_afastamento" ON "afastamentos"("data_afastamento");
CREATE INDEX "idx_afastamentos_data_fim_beneficio" ON "afastamentos"("data_fim_beneficio");
CREATE INDEX "idx_afastamentos_data_retorno_prevista" ON "afastamentos"("data_retorno_prevista");
CREATE INDEX "idx_andamentos_afastamento_data" ON "afastamento_andamentos"("afastamento_id", "data_andamento");
CREATE INDEX "idx_andamentos_data_proxima_acao" ON "afastamento_andamentos"("data_proxima_acao");
CREATE INDEX "idx_andamentos_deleted_at" ON "afastamento_andamentos"("deleted_at");
CREATE UNIQUE INDEX "uq_documentos_storage_key" ON "afastamento_documentos"("storage_key");
CREATE INDEX "idx_documentos_afastamento_id" ON "afastamento_documentos"("afastamento_id");
CREATE INDEX "idx_documentos_andamento_id" ON "afastamento_documentos"("andamento_id");
CREATE INDEX "idx_documentos_tipo_documento_id" ON "afastamento_documentos"("tipo_documento_id");
CREATE INDEX "idx_documentos_deleted_at" ON "afastamento_documentos"("deleted_at");

ALTER TABLE "colaboradores" ADD CONSTRAINT "colaboradores_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "colaboradores" ADD CONSTRAINT "colaboradores_funcao_id_fkey" FOREIGN KEY ("funcao_id") REFERENCES "funcoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "afastamentos" ADD CONSTRAINT "afastamentos_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "colaboradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "afastamentos" ADD CONSTRAINT "afastamentos_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "afastamentos" ADD CONSTRAINT "afastamentos_funcao_id_fkey" FOREIGN KEY ("funcao_id") REFERENCES "funcoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "afastamentos" ADD CONSTRAINT "afastamentos_situacao_id_fkey" FOREIGN KEY ("situacao_id") REFERENCES "situacoes_afastamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "afastamentos" ADD CONSTRAINT "afastamentos_tipo_beneficio_id_fkey" FOREIGN KEY ("tipo_beneficio_id") REFERENCES "tipos_beneficio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "afastamentos" ADD CONSTRAINT "afastamentos_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "afastamentos" ADD CONSTRAINT "afastamentos_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "afastamento_andamentos" ADD CONSTRAINT "afastamento_andamentos_afastamento_id_fkey" FOREIGN KEY ("afastamento_id") REFERENCES "afastamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "afastamento_andamentos" ADD CONSTRAINT "afastamento_andamentos_tipo_andamento_id_fkey" FOREIGN KEY ("tipo_andamento_id") REFERENCES "tipos_andamento_afastamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "afastamento_andamentos" ADD CONSTRAINT "afastamento_andamentos_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "afastamento_andamentos" ADD CONSTRAINT "afastamento_andamentos_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "afastamento_andamentos" ADD CONSTRAINT "afastamento_andamentos_deleted_by_id_fkey" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "afastamento_documentos" ADD CONSTRAINT "afastamento_documentos_afastamento_id_fkey" FOREIGN KEY ("afastamento_id") REFERENCES "afastamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "afastamento_documentos" ADD CONSTRAINT "afastamento_documentos_andamento_id_fkey" FOREIGN KEY ("andamento_id") REFERENCES "afastamento_andamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "afastamento_documentos" ADD CONSTRAINT "afastamento_documentos_tipo_documento_id_fkey" FOREIGN KEY ("tipo_documento_id") REFERENCES "tipos_documento_afastamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "afastamento_documentos" ADD CONSTRAINT "afastamento_documentos_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "afastamento_documentos" ADD CONSTRAINT "afastamento_documentos_deleted_by_id_fkey" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
