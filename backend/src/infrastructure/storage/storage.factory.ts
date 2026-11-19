import { env } from "../../config/env.js";

import { AppError } from "../../shared/errors/app-error.js";

import type {
  DocumentStorage,
} from "./document-storage.js";

import {
  LocalDocumentStorage,
} from "./local-document-storage.js";

import {
  AzureDocumentStorage,
} from "./azure-document-storage.js";

function createAzureDocumentStorage(): AzureDocumentStorage {
  const accountName = env.AZURE_STORAGE_NAME;
  const accountKey = env.AZURE_STORAGE_KEY;
  const containerName = env.AZURE_STORAGE_CONTAINER;

  if (!accountName || !accountKey || !containerName) {
    throw new AppError(
      503,
      "AZURE_STORAGE_NOT_CONFIGURED",
      "O armazenamento Azure não está configurado.",
    );
  }

  return new AzureDocumentStorage(
    accountName,
    accountKey,
    containerName,
  );
}

export function createDocumentStorage(): DocumentStorage {
  if (env.STORAGE_DRIVER === "azure") {
    return createAzureDocumentStorage();
  }

  return new LocalDocumentStorage(
    env.LOCAL_STORAGE_PATH,
  );
}

export async function validateDocumentStorage(): Promise<void> {
  if (env.STORAGE_DRIVER === "azure") {
    const storage = createAzureDocumentStorage();

    await storage.assertReady();
  }
}
