import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";

import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  type ContainerClient,
} from "@azure/storage-blob";

import type {
  DocumentStorage,
  StagedDeletion,
} from "./document-storage.js";

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const LEASE_DURATION_SECONDS = 60;

export class AzureDocumentStorage implements DocumentStorage {
  private readonly container: ContainerClient;

  constructor(
    accountName: string,
    accountKey: string,
    containerName: string,
  ) {
    const credential = new StorageSharedKeyCredential(
      accountName,
      accountKey,
    );

    const service = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      credential,
    );

    this.container = service.getContainerClient(containerName);
  }

  /**
   * Valida o acesso ao container previamente provisionado.
   * Nao cria containers nem altera suas permissoes.
   */
  async assertReady(): Promise<void> {
    const properties = await this.container.getProperties();

    if (properties.blobPublicAccess) {
      throw new Error(
        "O container Azure destinado aos documentos deve ser privado.",
      );
    }
  }

  /**
   * Preserva o formato de chave utilizado pelo storage local.
   * Exemplo: 2026/11/uuid.pdf
   */
  async save(
    content: Buffer,
    extension: string,
  ): Promise<string> {
    const normalizedExtension = extension.toLowerCase();
    const contentType = CONTENT_TYPES[normalizedExtension];

    if (!contentType) {
      throw new Error("Extensao de documento nao permitida.");
    }

    const now = new Date();

    const year = String(now.getUTCFullYear());

    const month = String(
      now.getUTCMonth() + 1,
    ).padStart(2, "0");

    const key =
      `${year}/${month}/${randomUUID()}${normalizedExtension}`;

    const blob = this.container.getBlockBlobClient(key);

    await blob.uploadData(content, {
      blobHTTPHeaders: {
        blobContentType: contentType,
        blobCacheControl: "private, no-store",
      },
      conditions: {
        ifNoneMatch: "*",
      },
    });

    return key;
  }

  /**
   * Retorna o fluxo binario para a API autenticada.
   * Nao gera URLs publicas ou tokens SAS.
   */
  async open(key: string): Promise<Readable> {
    this.validateKey(key);

    const blob = this.container.getBlobClient(key);

    const response = await blob.download();

    const stream = response.readableStreamBody;

    if (!(stream instanceof Readable)) {
      throw new Error(
        "Nao foi possivel obter o stream do documento.",
      );
    }

    return stream;
  }

  /**
   * Remove um blob de maneira idempotente.
   * Utilizado tambem para compensar falhas no upload.
   */
  async remove(key: string): Promise<void> {
    this.validateKey(key);

    const blob = this.container.getBlobClient(key);

    await blob.deleteIfExists();
  }

  /**
   * Reserva temporariamente o blob antes de atualizar
   * os metadados no PostgreSQL.
   */
  async stageDelete(key: string): Promise<StagedDeletion> {
    this.validateKey(key);

    const blob = this.container.getBlobClient(key);

    const lease = blob.getBlobLeaseClient(randomUUID());

    await lease.acquireLease(LEASE_DURATION_SECONDS);

    return {
      commit: async (): Promise<void> => {
        await blob.delete({
          conditions: {
            leaseId: lease.leaseId,
          },
        });
      },

      rollback: async (): Promise<void> => {
        await lease.releaseLease();
      },
    };
  }

  /**
   * Impede chaves fora do formato definido pela aplicacao.
   */
  private validateKey(key: string): void {
    const pattern =
      /^\d{4}\/(?:0[1-9]|1[0-2])\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:pdf|jpe?g|png|docx?)$/i;

    if (!pattern.test(key)) {
      throw new Error("Chave de storage invalida.");
    }
  }
}
