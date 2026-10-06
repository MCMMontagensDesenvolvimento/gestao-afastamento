import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DocumentStorage, StagedDeletion } from "./document-storage.js";

export class LocalDocumentStorage implements DocumentStorage {
  constructor(private readonly root: string) {}

  async save(content: Buffer, extension: string): Promise<string> {
    const now = new Date();
    const key = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}${extension}`;
    const target = this.resolve(key);
    await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    await writeFile(target, content, { mode: 0o600, flag: "wx" });
    return key;
  }

  async open(key: string) {
    const target = this.resolve(key);
    await stat(target);
    return createReadStream(target);
  }

  async remove(key: string): Promise<void> {
    await rm(this.resolve(key), { force: true });
  }

  async stageDelete(key: string): Promise<StagedDeletion> {
    const source = this.resolve(key);
    const trash = `${source}.deleting-${randomUUID()}`;
    await rename(source, trash);
    return {
      commit: () => rm(trash, { force: true }),
      rollback: () => rename(trash, source),
    };
  }

  private resolve(key: string): string {
    const root = path.resolve(this.root);
    const target = path.resolve(root, key);
    if (!target.startsWith(`${root}${path.sep}`)) throw new Error("Chave de storage inválida.");
    return target;
  }
}
