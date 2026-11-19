#!/bin/sh

set -eu

echo "=========================================="
echo " MCM - Gestao de Afastados"
echo " Inicializacao do ambiente de producao"
echo "=========================================="

echo "[STARTUP] Validando configuracao..."

node --input-type=module <<'JS'
import { env } from "./dist/config/env.js";

import {
  validateDocumentStorage
} from "./dist/infrastructure/storage/storage.factory.js";

const database = new URL(env.DATABASE_URL);

if (
  !["postgresql:", "postgres:"].includes(database.protocol) ||
  database.searchParams.getAll("schema").length !== 1 ||
  database.searchParams.get("schema") !== "gestao_afastamento"
) {
  throw new Error(
    "DATABASE_URL invalida: schema gestao_afastamento obrigatorio."
  );
}

const runSeed = process.env.RUN_SEED_ON_DEPLOY ?? "false";

if (!["true", "false"].includes(runSeed)) {
  throw new Error(
    "RUN_SEED_ON_DEPLOY deve ser true ou false."
  );
}

if (runSeed === "true" && !env.BOOTSTRAP_ADMIN_EMAIL) {
  throw new Error(
    "BOOTSTRAP_ADMIN_EMAIL deve ser informado para o seed inicial."
  );
}

console.log("[STARTUP] Configuracao validada.");
console.log("[STARTUP] Schema: gestao_afastamento");
console.log("[STORAGE] Driver:", env.STORAGE_DRIVER);

if (env.STORAGE_DRIVER === "azure") {
  console.log("[STORAGE] Validando acesso ao Azure Blob...");

  try {
    await validateDocumentStorage();
  } catch (error) {
    const status = error?.statusCode;
    const code = error?.code;

    console.error(
      "[STORAGE] Falha na validacao Azure.",
      {
        statusCode:
          typeof status === "number" ? status : undefined,
        code:
          typeof code === "string" &&
          /^[a-zA-Z0-9_-]+$/.test(code)
            ? code
            : "AZURE_STORAGE_VALIDATION_FAILED"
      }
    );

    process.exit(1);
  }

  console.log("[STORAGE] Azure Blob validado.");
  console.log("[STORAGE] Container: gestao-afastamento");
} else {
  console.log("[STORAGE] Armazenamento local selecionado.");
}
JS

echo ""
echo "[MIGRATIONS] Verificando migrations pendentes..."

npm run prisma:migrate:deploy

echo "[MIGRATIONS] Processo concluido com sucesso."

echo ""

if [ "${RUN_SEED_ON_DEPLOY:-false}" = "true" ]; then

    echo "[SEED] Executando inicializacao de dados..."

    npm run prisma:seed

    echo "[SEED] Processo concluido com sucesso."

else

    echo "[SEED] Execucao desabilitada neste deploy."

fi

echo ""
echo "[STARTUP] Iniciando backend..."

exec node dist/server.js
