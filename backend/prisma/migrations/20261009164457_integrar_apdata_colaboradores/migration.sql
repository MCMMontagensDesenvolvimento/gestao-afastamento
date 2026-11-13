/*
  Warnings:

  - A unique constraint covering the columns `[apdata_contratado_id]` on the table `colaboradores` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apdata_cargo_id]` on the table `funcoes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apdata_centro_custo_id]` on the table `obras` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "colaboradores" ADD COLUMN     "apdata_contratado_id" VARCHAR(100),
ADD COLUMN     "apdata_situacao_id" VARCHAR(100),
ADD COLUMN     "apdata_situacao_nome" VARCHAR(200);

-- AlterTable
ALTER TABLE "funcoes" ADD COLUMN     "apdata_cargo_id" VARCHAR(100);

-- AlterTable
ALTER TABLE "obras" ADD COLUMN     "apdata_centro_custo_id" VARCHAR(100);

-- CreateIndex
CREATE UNIQUE INDEX "uq_colaboradores_apdata_contratado" ON "colaboradores"("apdata_contratado_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_funcoes_apdata_cargo" ON "funcoes"("apdata_cargo_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_obras_apdata_centro_custo" ON "obras"("apdata_centro_custo_id");
