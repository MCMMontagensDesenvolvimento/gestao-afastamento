
import { prisma } from "../../../infrastructure/database/prisma.js";
import type { AuditService } from "../../audit/audit.service.js";
import type { EmployeesRepository } from "../employees.repository.js";
import type { ApdataService } from "./apdata.service.js";

type RegistroApdata = Record<string, unknown>;

type DadosSituacao = {
  codigo: string | null;
  nome: string | null;
};

type DadosCargo = {
  codigo: string | null;
  nome: string | null;
};

type ResultadoFuncoes = {
  recebidas: number;
  cadastradas: number;
  jaExistentes: number;
  semCodigo: number;
  semNome: number;
  conflitos: number;
};

export class ApdataSyncService {
  constructor(
    private readonly apdata: ApdataService,
    private readonly employees: EmployeesRepository,
    private readonly audit: AuditService,
  ) {}

  async sincronizar(userId: string, requestId: string) {
    // Busca todos os contratados da APDATA.
    const registros = await this.apdata.listarTodos(userId);

    console.info("[APDATA SYNC] Total recebido:", registros.length);

    // IMPORTANTE:
    // Sincroniza as funções antes de filtrar os colaboradores.
    // Assim, também serão cadastradas funções utilizadas por demitidos.
    const funcoes = await this.sincronizarFuncoesApdata(registros);

    // Mantém a regra atual de não sincronizar colaboradores demitidos.
    const registrosFiltrados = registros.filter(
      (registro) => textoCampo(registro, "CON_CdiSituacao") !== "2",
    );

    console.info(
      "[APDATA SYNC] Total após excluir demitidos:",
      registrosFiltrados.length,
    );

    // Sincroniza os colaboradores normalmente.
    const resultadoColaboradores =
      await this.employees.sincronizarApdata(registrosFiltrados);

    const resultado = {
      ...resultadoColaboradores,
      funcoes,
    };

    console.info("[APDATA SYNC] Resultado das funções:", funcoes);
    console.info("[APDATA SYNC] Resultado final:", resultado);

    await this.audit.record({
      actorUserId: userId,
      action: "employee.apdata.sync",
      entityType: "Colaborador",
      requestId,
      metadata: resultado,
    });

    return { data: resultado };
  }

  /**
   * Sincroniza o catálogo de funções encontradas nos registros da APDATA.
   *
   * Este método recebe todos os contratados, inclusive os demitidos.
   * A identificação é feita preferencialmente pelo código da APDATA.
   */
  private async sincronizarFuncoesApdata(
    registros: RegistroApdata[],
  ): Promise<ResultadoFuncoes> {
    const resultado: ResultadoFuncoes = {
      recebidas: 0,
      cadastradas: 0,
      jaExistentes: 0,
      semCodigo: 0,
      semNome: 0,
      conflitos: 0,
    };

    // Evita processar repetidamente o mesmo cargo durante a execução.
    const cargosProcessados = new Set<string>();

    for (const registro of registros) {
      const { codigo, nome } = obterDadosCargo(registro);

      if (!nome) {
        resultado.semNome++;
        continue;
      }

      const nomeNormalizado = nome.trim().replace(/\s+/g, " ");

      if (!nomeNormalizado) {
        resultado.semNome++;
        continue;
      }

      resultado.recebidas++;

      if (!codigo) {
        resultado.semCodigo++;
      }

      const chave = codigo
        ? `codigo:${codigo}`
        : `nome:${nomeNormalizado.toLocaleLowerCase("pt-BR")}`;

      if (cargosProcessados.has(chave)) {
        continue;
      }

      cargosProcessados.add(chave);

      // 1. Primeiro tenta localizar pelo código da APDATA.
      if (codigo) {
        const funcaoPorCodigo = await prisma.funcao.findUnique({
          where: {
            apdataCargoId: codigo,
          },
          select: {
            id: true,
            nome: true,
            apdataCargoId: true,
          },
        });

        if (funcaoPorCodigo) {
          resultado.jaExistentes++;
          continue;
        }
      }

      // 2. Se não encontrou pelo código, tenta localizar pelo nome.
      const funcaoPorNome = await prisma.funcao.findFirst({
        where: {
          nome: {
            equals: nomeNormalizado,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          nome: true,
          apdataCargoId: true,
        },
      });

      if (funcaoPorNome) {
        // Se a função existe, mas ainda não possui código APDATA,
        // associa o código recebido.
        if (codigo && !funcaoPorNome.apdataCargoId) {
          await prisma.funcao.update({
            where: {
              id: funcaoPorNome.id,
            },
            data: {
              apdataCargoId: codigo,
            },
          });

          resultado.jaExistentes++;

          console.info("[APDATA FUNÇÕES] Código associado à função:", {
            nome: funcaoPorNome.nome,
            codigo,
          });

          continue;
        }

        // Não associa um código diferente a uma função já vinculada.
        if (
          codigo &&
          funcaoPorNome.apdataCargoId &&
          funcaoPorNome.apdataCargoId !== codigo
        ) {
          resultado.conflitos++;

          console.warn("[APDATA FUNÇÕES] Conflito de código:", {
            nomeRecebido: nomeNormalizado,
            codigoRecebido: codigo,
            codigoExistente: funcaoPorNome.apdataCargoId,
          });

          continue;
        }

        resultado.jaExistentes++;
        continue;
      }

      // 3. Não encontrou pelo código nem pelo nome: cadastra a função.
      await prisma.funcao.create({
        data: {
          nome: nomeNormalizado,
          apdataCargoId: codigo,
          ativo: true,
        },
      });

      resultado.cadastradas++;

      console.info("[APDATA FUNÇÕES] Nova função cadastrada:", {
        nome: nomeNormalizado,
        codigo,
      });
    }

    return resultado;
  }

  async sincronizarAfastamentos(userId: string, requestId: string) {
    const registros = await this.apdata.listarAfastadosComHistorico(userId);

    const distribuicao = registros.reduce<Record<string, number>>(
      (acc, registro) => {
        const codigo = obterDadosSituacao(registro).codigo ?? "(vazio)";

        acc[codigo] = (acc[codigo] ?? 0) + 1;
        return acc;
      },
      {},
    );

    console.info(
      "[APDATA AFASTAMENTOS] Distribuição por situação:",
      distribuicao,
    );

    const CODIGOS_AFASTAMENTO = new Set(["6", "7", "26"]);

    const afastados = registros.filter((registro) => {
      const { codigo } = obterDadosSituacao(registro);

      return codigo !== null && CODIGOS_AFASTAMENTO.has(codigo);
    });

    console.info("[APDATA AFASTAMENTOS] Total recebido:", registros.length);
    console.info(
      "[APDATA AFASTAMENTOS] Total de candidatos:",
      afastados.length,
    );

    let criados = 0;
    let ignorados = 0;
    let colaboradorNaoEncontrado = 0;
    let semObraOuFuncao = 0;
    let jaExistentes = 0;
    let situacoesCriadas = 0;
    let situacoesSemNome = 0;

    for (const registro of afastados) {
      const contratadoId = textoCampo(registro, "CON_CdiContratado");

      if (!contratadoId) {
        console.warn("[APDATA AFASTAMENTOS] Registro sem código de contratado");
        ignorados++;
        continue;
      }

      const { codigo: codigoSituacao, nome: nomeRecebido } =
        obterDadosSituacao(registro);

      const nomesPorCodigo: Record<string, string> = {
        "6": "Acidente do trabalho",
        "26": "Reafastado por Acidente do Trabalho",
        "7": "Auxílio-Doença",
      };

      const nomeSituacaoApdata =
        nomeRecebido ??
        (codigoSituacao ? nomesPorCodigo[codigoSituacao] : null);

      if (!nomeSituacaoApdata) {
        console.warn("[APDATA AFASTAMENTOS] Situação sem nome ou mapeamento:", {
          contratadoId,
          codigoSituacao,
        });

        situacoesSemNome++;
        ignorados++;
        continue;
      }

      let situacaoAfastamento = await prisma.situacaoAfastamento.findFirst({
        where: {
          nome: {
            equals: nomeSituacaoApdata,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          nome: true,
        },
      });

      if (!situacaoAfastamento) {
        situacaoAfastamento = await prisma.situacaoAfastamento.create({
          data: {
            nome: nomeSituacaoApdata,
            ativo: true,
            classificacao: "ATIVO",
          },
          select: {
            id: true,
            nome: true,
          },
        });

        situacoesCriadas++;

        console.info("[APDATA AFASTAMENTOS] Situação cadastrada:", {
          id: situacaoAfastamento.id,
          nome: situacaoAfastamento.nome,
          codigoSituacao,
          classificacao: "ATIVO",
        });
      }

      const colaborador = await prisma.colaborador.findUnique({
        where: {
          apdataContratadoId: contratadoId,
        },
      });

      if (!colaborador) {
        colaboradorNaoEncontrado++;
        ignorados++;

        console.warn("[APDATA AFASTAMENTOS] Colaborador não encontrado:", {
          contratadoId,
        });

        continue;
      }

      const { codigo: codigoCargoApdata, nome: nomeCargoApdata } =
        obterDadosCargo(registro);

      let funcaoId = colaborador.funcaoId;

      if (codigoCargoApdata) {
        const funcao = await prisma.funcao.findUnique({
          where: {
            apdataCargoId: codigoCargoApdata,
          },
          select: {
            id: true,
            nome: true,
          },
        });

        if (funcao) {
          funcaoId = funcao.id;
        } else {
          console.warn("[APDATA AFASTAMENTOS] Função não encontrada:", {
            contratadoId,
            codigoCargoApdata,
            nomeCargoApdata,
          });
        }
      }

      if (!colaborador.obraId) {
        console.warn("[APDATA AFASTAMENTOS] Ignorado: sem obra", {
          contratadoId,
          nome: colaborador.nome,
        });

        semObraOuFuncao++;
        ignorados++;
        continue;
      }

      const existente = await prisma.afastamento.findFirst({
        where: {
          colaboradorId: colaborador.id,
          dataRetornoEfetiva: null,
        },
        select: {
          id: true,
        },
      });

      if (existente) {
        jaExistentes++;
        ignorados++;
        continue;
      }

      const { dataInicio: dataInicioApdata, dataFim: dataFimApdata } =
        obterDatasSituacao(registro);

      if (!dataInicioApdata) {
        console.warn("[APDATA AFASTAMENTOS] Sem data de início:", contratadoId);
        ignorados++;
        continue;
      }

      const dataAfastamento = new Date(
        `${dataInicioApdata.split(" ")[0]}T00:00:00.000Z`,
      );

      const dataFimBeneficio = dataFimApdata
        ? new Date(`${dataFimApdata.split(" ")[0]}T00:00:00.000Z`)
        : null;

      await prisma.afastamento.create({
        data: {
          colaboradorId: colaborador.id,
          obraId: colaborador.obraId,
          funcaoId: funcaoId ?? null,
          situacaoId: situacaoAfastamento.id,
          dataAfastamento,
          createdById: userId,
          dataFimBeneficio,
          dataRetornoPrevista: null,
          dataRetornoEfetiva: null,
          tipoBeneficioId: null,
          causaCid: null,
          observacoes:
            `Importado da APDATA. ` +
            `Código da situação: ${codigoSituacao}. ` +
            `Situação APDATA: ${nomeSituacaoApdata}`,
        },
      });

      criados++;
    }

    const resultado = {
      recebidos: registros.length,
      afastadosEncontrados: afastados.length,
      criados,
      ignorados,
      colaboradorNaoEncontrado,
      semObraOuFuncao,
      jaExistentes,
      situacoesCriadas,
      situacoesSemNome,
    };

    console.info("[APDATA AFASTAMENTOS] Resultado:", resultado);

    await this.audit.record({
      actorUserId: userId,
      action: "leave.apdata.sync",
      entityType: "Afastamento",
      requestId,
      metadata: resultado,
    });

    return { data: resultado };
  }
}

function obterDadosSituacao(registro: RegistroApdata): DadosSituacao {
  const situacao = registro["situacao"];

  const dadosSituacao =
    situacao !== null &&
    typeof situacao === "object" &&
    !Array.isArray(situacao)
      ? (situacao as RegistroApdata)
      : {};

  const codigo =
    textoCampo(registro, "CON_CdiSituacao") ??
    textoCampo(dadosSituacao, "SIT_CdiSituacao");

  const nome =
    textoCampo(dadosSituacao, "SIT_D1sSituacao") ??
    textoCampo(registro, "SIT_D1sSituacao");

  return {
    codigo,
    nome,
  };
}

type DadosDatasSituacao = {
  dataInicio: string | null;
  dataFim: string | null;
};

function obterDatasSituacao(registro: RegistroApdata): DadosDatasSituacao {
  const situacoes = registro["situacoes"];

  if (!Array.isArray(situacoes) || situacoes.length === 0) {
    return {
      dataInicio: null,
      dataFim: null,
    };
  }

  const primeiraSituacao = situacoes[0] as RegistroApdata;

  return {
    dataInicio: textoCampo(primeiraSituacao, "CST_DtdSituacaoInicio"),
    dataFim: textoCampo(primeiraSituacao, "CST_DtdSituacaoFim"),
  };
}

function textoCampo(registro: RegistroApdata, chave: string): string | null {
  const valor = registro[chave];

  if (valor === null || valor === undefined) {
    return null;
  }

  const texto = String(valor).trim();

  return texto || null;
}

function obterDadosCargo(registro: RegistroApdata): DadosCargo {
  const cargo = registro["cargo"];

  const dadosCargo =
    cargo !== null && typeof cargo === "object" && !Array.isArray(cargo)
      ? (cargo as RegistroApdata)
      : {};

  return {
    codigo:
      textoCampo(dadosCargo, "CAR_CdiCargo") ??
      textoCampo(registro, "CAR_CdiCargo") ??
      textoCampo(registro, "CON_CdiCargo"),

    nome:
      textoCampo(dadosCargo, "CAR_D1sCargo") ??
      textoCampo(registro, "CAR_D1sCargo"),
  };
}
