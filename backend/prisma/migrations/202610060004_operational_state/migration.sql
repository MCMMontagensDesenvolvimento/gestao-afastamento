CREATE TABLE "notification_reads" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "alert_key" VARCHAR(500) NOT NULL,
  "read_at" TIMESTAMPTZ(6) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_reads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "actor_user_id" UUID,
  "action" VARCHAR(150) NOT NULL,
  "entity_type" VARCHAR(150) NOT NULL,
  "entity_id" UUID,
  "metadata" JSONB,
  "request_id" VARCHAR(128),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_notification_reads_user_alert" ON "notification_reads"("user_id", "alert_key");
CREATE INDEX "idx_notification_reads_user_id" ON "notification_reads"("user_id");
CREATE INDEX "idx_notification_reads_read_at" ON "notification_reads"("read_at");
CREATE INDEX "idx_audit_logs_actor_user_id" ON "audit_logs"("actor_user_id");
CREATE INDEX "idx_audit_logs_entity" ON "audit_logs"("entity_type", "entity_id");
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("created_at");
CREATE INDEX "idx_audit_logs_request_id" ON "audit_logs"("request_id");
CREATE INDEX "idx_afastamentos_situacao_obra" ON "afastamentos"("situacao_id", "obra_id");
CREATE INDEX "idx_afastamentos_situacao_retorno" ON "afastamentos"("situacao_id", "data_retorno_prevista");
CREATE INDEX "idx_afastamentos_situacao_beneficio" ON "afastamentos"("situacao_id", "data_fim_beneficio");

ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
