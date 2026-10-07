import { createHash } from "node:crypto";
import path from "node:path";
import { fileTypeFromBuffer } from "file-type";
import type { DocumentStorage } from "../../infrastructure/storage/document-storage.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { DocumentsRepository } from "./documents.repository.js";

const allowed = new Map([
  [".pdf", ["application/pdf"]], [".jpg", ["image/jpeg"]], [".jpeg", ["image/jpeg"]], [".png", ["image/png"]],
  [".doc", ["application/msword", "application/x-cfb"]],
  [".docx", ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"]],
]);

function publicDocument<T extends { storageKey: string; sizeBytes: bigint }>(item: T) {
  const { storageKey, sizeBytes, ...visible } = item;
  void storageKey;
  return { ...visible, sizeBytes: Number(sizeBytes) };
}

export class DocumentsService {
  constructor(private readonly repository: DocumentsRepository, private readonly storage: DocumentStorage) {}
  async list(leaveId: string) { await this.requireLeave(leaveId); return { data: (await this.repository.list(leaveId)).map(publicDocument) }; }
  async upload(leaveId: string, input: { file?: Express.Multer.File | undefined; tipoDocumentoId: string; andamentoId?: string | undefined }, actor: string, requestId: string) {
    await this.requireLeave(leaveId);
    if (!input.file) throw new AppError(422, "FILE_REQUIRED", "Selecione um arquivo para envio.");
    if (!(await this.repository.activeType(input.tipoDocumentoId))) throw new AppError(422, "INACTIVE_DOCUMENT_TYPE", "O tipo de documento deve existir e estar ativo.");
    if (input.andamentoId && !(await this.repository.progressBelongsToLeave(input.andamentoId, leaveId))) throw new AppError(422, "INVALID_PROGRESS_REFERENCE", "O andamento informado não pertence ao afastamento.");
    const extension = path.extname(input.file.originalname).toLowerCase();
    const allowedMimes = allowed.get(extension);
    // Arquivos truncados também são entrada inválida, não falha interna da API.
    const detected = await fileTypeFromBuffer(input.file.buffer).catch(() => undefined);
    if (!allowedMimes || !allowedMimes.includes(input.file.mimetype) || !detected || !allowedMimes.includes(detected.mime)) {
      throw new AppError(422, "INVALID_DOCUMENT_TYPE", "O formato real do arquivo não corresponde a um tipo permitido.");
    }
    const key = await this.storage.save(input.file.buffer, extension);
    try {
      const item = await this.repository.create({
        afastamentoId: leaveId, andamentoId: input.andamentoId, tipoDocumentoId: input.tipoDocumentoId,
        originalName: path.basename(input.file.originalname).replace(/[\r\n]/g, "_"), storageKey: key,
        mimeType: input.file.mimetype, sizeBytes: BigInt(input.file.size),
        sha256: createHash("sha256").update(input.file.buffer).digest("hex"), uploadedById: actor,
      }, requestId);
      return { data: publicDocument(item) };
    } catch (error) {
      await this.storage.remove(key);
      throw error;
    }
  }
  async download(id: string) {
    const item = await this.requireDocument(id);
    return { item: publicDocument(item), stream: await this.storage.open(item.storageKey) };
  }
  async remove(id: string, reason: string | undefined, actor: string, requestId: string) {
    const item = await this.requireDocument(id);
    const staged = await this.storage.stageDelete(item.storageKey);
    let tombstoned = false;
    try {
      await this.repository.tombstone(id, actor, requestId, item.afastamentoId, item.mimeType, reason);
      tombstoned = true;
      await staged.commit();
    } catch (error) {
      if (tombstoned) await this.repository.restoreAfterDeleteFailure(id, requestId);
      await staged.rollback();
      throw error;
    }
  }
  private async requireLeave(id: string) { if (!(await this.repository.leaveExists(id))) throw new AppError(404, "LEAVE_NOT_FOUND", "Afastamento não encontrado."); }
  private async requireDocument(id: string) { const item = await this.repository.findById(id); if (!item) throw new AppError(404, "DOCUMENT_NOT_FOUND", "Documento não encontrado."); return item; }
}
