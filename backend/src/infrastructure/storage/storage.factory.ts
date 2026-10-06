import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { DocumentStorage } from "./document-storage.js";
import { LocalDocumentStorage } from "./local-document-storage.js";

export function createDocumentStorage(): DocumentStorage {
  if (env.STORAGE_DRIVER === "local") return new LocalDocumentStorage(env.LOCAL_STORAGE_PATH);
  throw new AppError(503, "S3_STORAGE_NOT_CONFIGURED", "O provider S3 ainda não foi definido para este ambiente.");
}
