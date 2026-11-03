import { prisma } from "../../../infrastructure/database/prisma.js";
import type { AuditService } from "../../audit/audit.service.js";
import type { EmployeesRepository } from "../employees.repository.js";
import type { ApdataService } from "./apdata.service.js";

type RegistroApdata = Record<string, unknown>;

type DadosSituacao = {
  codigo: string | null;
  nome: string | null;
};

export class ApdataSyncService {
  constructor(
    private readonly apdata: ApdataService,
    private readonly employees: EmployeesRepository,
    private readonly audit: AuditService,
  ) {}

  async sincronizar(userId: string, requestId: string) {
    const registros = await this.apdata.listarTodos(userId);

    const registrosFiltrados = registros.filter(
      (registro) => textoCampo(registro, "CON_CdiSituacao") !== "2",
    );

    console.info("[APDATA SYNC] Total recebido:", registros.length);
    console.info(
      "[APDATA SYNC] Total após excluir demitidos:",
      registrosFiltrados.length,
    );

    const resultado =
      await this.employees.sincronizarApdata(registrosFiltrados);

    await this.audit.record({
      actorUserId: userId,
      action: "employee.apdata.sync",
      entityType: "Colaborador",
      requestId,
      metadata: resultado,
    });

    return { data: resultado };
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

      // Procura por nome sem exigir que o cadastro esteja ativo.
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

      // Se não existir, cria a situação local.
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

      // Busca a função pelo código da APDATA.
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

      // Não cria outro afastamento se já houver um aberto.
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

      const situacoesApdata = registro["situacoes"];
      
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

type DadosCargo = {
  codigo: string | null;
  nome: string | null;
};

function obterDadosCargo(registro: RegistroApdata): DadosCargo {
  const cargo = registro["cargo"];

  const dadosCargo =
    cargo !== null && typeof cargo === "object" && !Array.isArray(cargo)
      ? (cargo as RegistroApdata)
      : {};

  return {
    codigo:
      textoCampo(registro, "CON_CdiCargo") ??
      textoCampo(dadosCargo, "CAR_CdiCargo"),

    nome: textoCampo(dadosCargo, "CAR_D1sCargo"),
  };
}
