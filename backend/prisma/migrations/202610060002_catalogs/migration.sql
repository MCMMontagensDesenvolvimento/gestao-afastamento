CREATE TYPE "ClassificacaoSituacao" AS ENUM ('ATIVO', 'ENCERRADO', 'APOSENTADO');

CREATE TABLE "obras" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "nome" VARCHAR(200) NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "obras_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "funcoes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "nome" VARCHAR(200) NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "funcoes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tipos_beneficio" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "nome" VARCHAR(200) NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "tipos_beneficio_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "situacoes_afastamento" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "nome" VARCHAR(200) NOT NULL,
  "classificacao" "ClassificacaoSituacao" NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "situacoes_afastamento_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tipos_andamento_afastamento" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "nome" VARCHAR(200) NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "tipos_andamento_afastamento_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tipos_documento_afastamento" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "nome" VARCHAR(200) NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "tipos_documento_afastamento_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_obras_nome" ON "obras"("nome");
CREATE INDEX "idx_obras_ativo" ON "obras"("ativo");
CREATE UNIQUE INDEX "uq_funcoes_nome" ON "funcoes"("nome");
CREATE INDEX "idx_funcoes_ativo" ON "funcoes"("ativo");
CREATE UNIQUE INDEX "uq_tipos_beneficio_nome" ON "tipos_beneficio"("nome");
CREATE INDEX "idx_tipos_beneficio_ativo" ON "tipos_beneficio"("ativo");
CREATE UNIQUE INDEX "uq_situacoes_afastamento_nome" ON "situacoes_afastamento"("nome");
CREATE INDEX "idx_situacoes_afastamento_ativo" ON "situacoes_afastamento"("ativo");
CREATE INDEX "idx_situacoes_afastamento_classificacao" ON "situacoes_afastamento"("classificacao");
CREATE UNIQUE INDEX "uq_tipos_andamento_nome" ON "tipos_andamento_afastamento"("nome");
CREATE INDEX "idx_tipos_andamento_ativo" ON "tipos_andamento_afastamento"("ativo");
CREATE UNIQUE INDEX "uq_tipos_documento_nome" ON "tipos_documento_afastamento"("nome");
CREATE INDEX "idx_tipos_documento_ativo" ON "tipos_documento_afastamento"("ativo");
