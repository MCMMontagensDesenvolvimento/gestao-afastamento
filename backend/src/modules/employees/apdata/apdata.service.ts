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
      options.apenasAtivos ?? true,
    );
  }

  async listarAtivos(userIdBaseSigob: string): Promise<ApdataContratado[]> {
    return this.listarContratados({
      userIdBaseSigob,
      apenasAtivos: true,
    });
  }

  async listarTodos(userIdBaseSigob: string): Promise<ApdataContratado[]> {
    return this.listarContratados({
      userIdBaseSigob,
      apenasAtivos: false,
    });
  }
  
  async listarAfastados(userIdBaseSigob: string): Promise<ApdataContratado[]> {
    return this.listarContratados({
      userIdBaseSigob,
      apenasAtivos: true,
    });
  }

  
}

export const apdataService = new ApdataService();
