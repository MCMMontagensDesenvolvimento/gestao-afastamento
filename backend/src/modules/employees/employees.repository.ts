import type { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prisma.js";

const APDATA_BATCH_SIZE = 25;
const APDATA_BATCH_TIMEOUT_MS = 60_000;

const include = {
  obra: true,
  funcao: true,
} satisfies Prisma.ColaboradorInclude;

export interface EmployeeListInput {
  page: number;
  perPage: number;
  search?: string | undefined;
  obraId?: string | undefined;
  funcaoId?: string | undefined;
  ativo?: boolean | undefined;
  sortBy: "nome" | "codigoCorporativo" | "createdAt";
  sortDirection: "asc" | "desc";
}

export class EmployeesRepository {
  async list(input: EmployeeListInput) {
    const where: Prisma.ColaboradorWhereInput = {
      ...(input.search
        ? {
            OR: [
              { nome: { contains: input.search, mode: "insensitive" } },
              {
                codigoCorporativo: {
                  contains: input.search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
      ...(input.obraId ? { obraId: input.obraId } : {}),
      ...(input.funcaoId ? { funcaoId: input.funcaoId } : {}),
      ...(input.ativo === undefined ? {} : { ativo: input.ativo }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.colaborador.findMany({
        where,
        include,
        orderBy: [{ [input.sortBy]: input.sortDirection }, { id: "asc" }],
        skip: (input.page - 1) * input.perPage,
        take: input.perPage,
      }),
      prisma.colaborador.count({ where }),
    ]);

    return { data, total };
  }

  findById(id: string) {
    return prisma.colaborador.findUnique({ where: { id }, include });
  }

  findByCode(codigoCorporativo: string) {
    return prisma.colaborador.findUnique({ where: { codigoCorporativo } });
  }

  async activeContext(obraId: string, funcaoId: string) {
    const [obra, funcao] = await Promise.all([
      prisma.obra.findFirst({ where: { id: obraId, ativo: true } }),
      prisma.funcao.findFirst({ where: { id: funcaoId, ativo: true } }),
    ]);

    return { obra: Boolean(obra), funcao: Boolean(funcao) };
  }

  create(data: {
    codigoCorporativo: string;
    nome: string;
    contato?: string;
    obraId: string;
    funcaoId: string;
  }) {
    return prisma.colaborador.create({ data, include });
  }

  update(
    id: string,
    data: {
      nome?: string | undefined;
      contato?: string | null | undefined;
      obraId?: string | undefined;
      funcaoId?: string | undefined;
    },
  ) {
    return prisma.colaborador.update({
      where: { id },
      data: {
        ...(data.nome === undefined ? {} : { nome: data.nome }),
        ...(data.contato === undefined ? {} : { contato: data.contato }),
        ...(data.obraId === undefined ? {} : { obraId: data.obraId }),
        ...(data.funcaoId === undefined ? {} : { funcaoId: data.funcaoId }),
      },
      include,
    });
  }

  setActive(id: string, ativo: boolean) {
    return prisma.colaborador.update({
      where: { id },
      data: { ativo },
      include,
    });
  }

  async history(id: string, page: number, perPage: number) {
    const where = { colaboradorId: id };

    const [data, total] = await prisma.$transaction([
      prisma.afastamento.findMany({
        where,
        include: {
          obra: true,
          funcao: true,
          situacao: true,
          tipoBeneficio: true,
        },
        orderBy: [{ dataAfastamento: "desc" }, { id: "desc" }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.afastamento.count({ where }),
    ]);

    return { data, total };
  }

  async sincronizarApdata(registros: ApdataRecord[]) {
    let criados = 0;
    let atualizados = 0;
    let ignorados = 0;
    let situacoesCriadas = 0;

    // Os caches reduzem consultas repetidas entre registros e lotes.
    const obrasPorCodigo = new Map<string, string>();
    const obrasPorNome = new Map<string, string>();
    const funcoesPorCodigo = new Map<string, string>();
    const funcoesPorNome = new Map<string, string>();
    const situacoesConhecidas = new Set<string>();

    const totalLotes = Math.ceil(registros.length / APDATA_BATCH_SIZE);

    for (
      let offset = 0, numeroLote = 1;
      offset < registros.length;
      offset += APDATA_BATCH_SIZE, numeroLote++
    ) {
      const lote = registros.slice(offset, offset + APDATA_BATCH_SIZE);
      const inicio = Date.now();

      console.info("[APDATA SYNC] Iniciando lote", {
        lote: numeroLote,
        totalLotes,
        registrosNoLote: lote.length,
        processadosAnteriormente: offset,
        totalRegistros: registros.length,
      });

      try {
        const resultadoLote = await prisma.$transaction(
          async (tx) => {
            let loteCriados = 0;
            let loteAtualizados = 0;
            let loteIgnorados = 0;
            let loteSituacoesCriadas = 0;

            for (const registro of lote) {
              const contratadoId = campo(registro, "CON_CdiContratado");
              const nome = campo(registro, "CON_DssNome");

              if (!contratadoId) {
                loteIgnorados++;

                console.warn("[APDATA SYNC] Registro sem identificador", {
                  nome: nome ?? "(vazio)",
                  lote: numeroLote,
                });

                continue;
              }

              const nomeColaborador = nome ?? "";

              const centroCustoId = campo(registro, "CON_CdiCentroCusto");

              const centroCustoNome =
                campoAninhado(registro, "centro_custo", "CCU_D1sCentroCusto") ??
                campo(registro, "CCU_D1sCentroCusto");

              const cargoId =
                campo(registro, "CON_CdiCargo") ??
                campoAninhado(registro, "cargo", "CAR_CdiCargo");

              const cargoNome = campoAninhado(
                registro,
                "cargo",
                "CAR_D1sCargo",
              );

              const situacaoId = campo(registro, "CON_CdiSituacao");

              const situacaoNome =
                (
                  campoAninhado(registro, "situacao", "SIT_D1sSituacao") ??
                  campo(registro, "SIT_D1sSituacao")
                )?.trim() || null;

              let obraId: string | null = null;

              if (centroCustoId && centroCustoNome) {
                obraId =
                  obrasPorCodigo.get(centroCustoId) ??
                  obrasPorNome.get(centroCustoNome) ??
                  null;

                if (!obraId) {
                  let obra = await tx.obra.findUnique({
                    where: {
                      apdataCentroCustoId: centroCustoId,
                    },
                  });

                  if (!obra) {
                    obra = await tx.obra.findUnique({
                      where: { nome: centroCustoNome },
                    });
                  }

                  if (!obra) {
                    obra = await tx.obra.create({
                      data: {
                        nome: centroCustoNome,
                        apdataCentroCustoId: centroCustoId,
                      },
                    });
                  }

                  obraId = obra.id;
                }

                obrasPorCodigo.set(centroCustoId, obraId);
                obrasPorNome.set(centroCustoNome, obraId);
              }

              let funcaoId: string | null = null;

              if (cargoId && cargoNome) {
                funcaoId =
                  funcoesPorCodigo.get(cargoId) ??
                  funcoesPorNome.get(cargoNome.trim()) ??
                  null;

                if (!funcaoId) {
                  let funcao = await tx.funcao.findUnique({
                    where: { apdataCargoId: cargoId },
                  });

                  if (!funcao) {
                    funcao = await tx.funcao.findFirst({
                      where: { nome: cargoNome.trim() },
                    });
                  }

                  if (!funcao) {
                    funcao = await tx.funcao.create({
                      data: {
                        nome: cargoNome.trim(),
                        apdataCargoId: cargoId,
                      },
                    });
                  }

                  funcaoId = funcao.id;
                }

                funcoesPorCodigo.set(cargoId, funcaoId);
                funcoesPorNome.set(cargoNome.trim(), funcaoId);
              }

              if (situacaoNome) {
                const nomeNormalizado = situacaoNome.trim();
                const chaveSituacao =
                  nomeNormalizado.toLocaleLowerCase("pt-BR");

                if (!situacoesConhecidas.has(chaveSituacao)) {
                  const existenteSituacao =
                    await tx.situacaoAfastamento.findFirst({
                      where: {
                        nome: {
                          equals: nomeNormalizado,
                          mode: "insensitive",
                        },
                      },
                    });

                  if (!existenteSituacao) {
                    const novaSituacao = await tx.situacaoAfastamento.create({
                      data: {
                        nome: nomeNormalizado,
                        classificacao: "ATIVO",
                        ativo: true,
                      },
                    });

                    loteSituacoesCriadas++;

                    console.info("[APDATA SYNC] Situação criada:", {
                      codigo: situacaoId,
                      nome: novaSituacao.nome,
                      id: novaSituacao.id,
                    });
                  }

                  situacoesConhecidas.add(chaveSituacao);
                }
              }

              const email =
                campo(registro, "CON_CosEMail") ??
                campo(registro, "CON_CosEMailPessoal");

              const dados = {
                nome: nomeColaborador,
                contato: email,
                obraId,
                funcaoId,
                apdataSituacaoId: situacaoId,
                apdataSituacaoNome: situacaoNome,
                sourceSystem: "APDATA",
              };

              const existente = await tx.colaborador.findUnique({
                where: { apdataContratadoId: contratadoId },
              });

              if (existente) {
                await tx.colaborador.update({
                  where: { id: existente.id },
                  data: dados,
                });

                loteAtualizados++;
                continue;
              }

              const codigoCorporativo = `APDATA-${contratadoId}`;

              const existentePorCodigo = await tx.colaborador.findUnique({
                where: { codigoCorporativo },
              });

              if (existentePorCodigo) {
                await tx.colaborador.update({
                  where: { id: existentePorCodigo.id },
                  data: {
                    ...dados,
                    apdataContratadoId: contratadoId,
                  },
                });

                loteAtualizados++;
              } else {
                await tx.colaborador.create({
                  data: {
                    ...dados,
                    apdataContratadoId: contratadoId,
                    codigoCorporativo,
                    ativo: true,
                  },
                });

                loteCriados++;
              }
            }

            return {
              criados: loteCriados,
              atualizados: loteAtualizados,
              ignorados: loteIgnorados,
              situacoesCriadas: loteSituacoesCriadas,
            };
          },
          {
            maxWait: 10_000,
            timeout: APDATA_BATCH_TIMEOUT_MS,
          },
        );

        // Somar apenas depois de a transação do lote ser confirmada.
        criados += resultadoLote.criados;
        atualizados += resultadoLote.atualizados;
        ignorados += resultadoLote.ignorados;
        situacoesCriadas += resultadoLote.situacoesCriadas;

        console.info("[APDATA SYNC] Lote concluído", {
          lote: numeroLote,
          totalLotes,
          processados: Math.min(offset + lote.length, registros.length),
          totalRegistros: registros.length,
          duracaoMs: Date.now() - inicio,
          ...resultadoLote,
        });
      } catch (error) {
        console.error("[APDATA SYNC] Falha no lote", {
          lote: numeroLote,
          totalLotes,
          inicio: offset,
          fim: offset + lote.length,
          totalRegistros: registros.length,
          duracaoMs: Date.now() - inicio,
          error:
            error instanceof Error
              ? {
                  name: error.name,
                  message: error.message,
                  stack: error.stack,
                }
              : String(error),
        });

        throw error;
      }
    }

    const resultado = {
      recebidos: registros.length,
      criados,
      atualizados,
      ignorados,
      situacoesCriadas,
    };

    console.info("[APDATA SYNC] Sincronização concluída", resultado);

    return resultado;
  }
}

type ApdataRecord = Record<string, unknown>;

function texto(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  const result = String(value).trim();

  return result || null;
}

function campo(record: ApdataRecord, key: string): string | null {
  return texto(record[key]);
}

function campoAninhado(
  record: ApdataRecord,
  objectKey: string,
  fieldKey: string,
): string | null {
  const nested = record[objectKey];

  if (!nested || typeof nested !== "object") {
    return null;
  }

  return texto((nested as ApdataRecord)[fieldKey]);
}
