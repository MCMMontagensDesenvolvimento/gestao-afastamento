import type { Readable } from "node:stream";

export interface StagedDeletion {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface DocumentStorage {
  save(content: Buffer, extension: string): Promise<string>;
  open(key: string): Promise<Readable>;
  remove(key: string): Promise<void>;
  stageDelete(key: string): Promise<StagedDeletion>;
}
