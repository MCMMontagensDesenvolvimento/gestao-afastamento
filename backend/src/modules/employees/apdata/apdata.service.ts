
import { ApdataClient } from "./apdata.client.js";
import type {
  ApdataContratado,
  ApdataListarContratadosOptions,
} from "./apdata.schema.js";

export class ApdataService {
  constructor(private readonly client = new ApdataClient()) {}

  async listarContratados(
    options: ApdataListarContratadosOptions,
  ): Promise<ApdataContratado[]> {
    return this.client.listarContratados(
      options.userIdBaseSigob,
      options.apenasAtivos ?? false,
    );
  }

  // Busca todos os colaboradores.
  async listarTodos(userIdBaseSigob: string): Promise<ApdataContratado[]> {
    return this.client.listarContratados(userIdBaseSigob, false);
  }

  // Busca somente os registros do endpoint de afastados com histórico.
  async listarAfastadosComHistorico(
    userIdBaseSigob: string,
  ): Promise<ApdataContratado[]> {
    return this.client.listarContratados(userIdBaseSigob, true);
  }
}

export const apdataService = new ApdataService();
