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
    let funcoesCriadas = 0;
    let funcoesSemNome = 0;

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
        totalRegistros: registros.length,
      });

      try {
        const resultadoLote = await prisma.$transaction(
          async (tx) => {
            let loteCriados = 0;
            let loteAtualizados = 0;
            let loteIgnorados = 0;
            let loteSituacoesCriadas = 0;
            let loteFuncoesCriadas = 0;
            let loteFuncoesSemNome = 0;

            for (const registro of lote) {
              const contratadoId = campo(registro, "CON_CdiContratado");
              const nomeColaborador = campo(registro, "CON_DssNome");

              if (!contratadoId || !nomeColaborador) {
                loteIgnorados++;

                console.warn("[APDATA SYNC] Registro sem dados obrigatórios", {
                  contratadoId,
                  nome: nomeColaborador,
                  lote: numeroLote,
                });

                continue;
              }

              const centroCustoId = campo(registro, "CON_CdiCentroCusto");

              const centroCustoNome =
                campoAninhado(registro, "centro_custo", "CCU_D1sCentroCusto") ??
                campo(registro, "CCU_D1sCentroCusto");

              const codigoCargo =
                campo(registro, "CON_CdiCargo") ??
                campoAninhado(registro, "cargo", "CAR_CdiCargo");

              const nomeCargo =
                campoAninhado(registro, "cargo", "CAR_D1sCargo") ??
                campo(registro, "CAR_D1sCargo");

              const situacaoId = campo(registro, "CON_CdiSituacao");

              const situacaoNome =
                campoAninhado(registro, "situacao", "SIT_D1sSituacao") ??
                campo(registro, "SIT_D1sSituacao");

              const email =
                campo(registro, "CON_CosEMail") ??
                campo(registro, "CON_CosEMailPessoal");

              /*
               * Procura o colaborador antes de resolver os relacionamentos.
               * Assim, quando um cargo não puder ser resolvido, o update
               * poderá preservar o funcaoId que já estiver cadastrado.
               */
              const existente = await tx.colaborador.findUnique({
                where: {
                  apdataContratadoId: contratadoId,
                },
              });

              /*
               * 1. Resolver ou cadastrar a obra.
               */
              let obraId: string | null = null;

              const codigoCentroCusto = centroCustoId?.trim() || null;
              const nomeCentroCusto = centroCustoNome?.trim() || null;

              if (codigoCentroCusto) {
                obraId = obrasPorCodigo.get(codigoCentroCusto) ?? null;

                if (!obraId) {
                  let obra = await tx.obra.findUnique({
                    where: {
                      apdataCentroCustoId: codigoCentroCusto,
                    },
                  });

                  if (!obra && nomeCentroCusto) {
                    obra = await tx.obra.findFirst({
                      where: {
                        nome: {
                          equals: nomeCentroCusto,
                          mode: "insensitive",
                        },
                      },
                    });
                  }

                  if (obra) {
                    /*
                     * Só associa o código se a obra ainda não possuir
                     * outro código da APDATA.
                     */
                    if (!obra.apdataCentroCustoId) {
                      obra = await tx.obra.update({
                        where: { id: obra.id },
                        data: {
                          apdataCentroCustoId: codigoCentroCusto,
                        },
                      });
                    } else if (obra.apdataCentroCustoId !== codigoCentroCusto) {
                      console.warn(
                        "[APDATA SYNC] Obra encontrada pelo nome com outro código",
                        {
                          nomeCentroCusto,
                          codigoRecebido: codigoCentroCusto,
                          codigoCadastrado: obra.apdataCentroCustoId,
                        },
                      );
                    }
                  } else if (nomeCentroCusto) {
                    obra = await tx.obra.create({
                      data: {
                        nome: nomeCentroCusto,
                        apdataCentroCustoId: codigoCentroCusto,
                      },
                    });
                  }

                  obraId = obra?.id ?? null;
                }

                if (obraId) {
                  obrasPorCodigo.set(codigoCentroCusto, obraId);

                  if (nomeCentroCusto) {
                    obrasPorNome.set(
                      nomeCentroCusto.toLocaleLowerCase("pt-BR"),
                      obraId,
                    );
                  }
                }
              } else if (nomeCentroCusto) {
                const chaveNomeObra =
                  nomeCentroCusto.toLocaleLowerCase("pt-BR");

                obraId = obrasPorNome.get(chaveNomeObra) ?? null;

                if (!obraId) {
                  const obra = await tx.obra.findFirst({
                    where: {
                      nome: {
                        equals: nomeCentroCusto,
                        mode: "insensitive",
                      },
                    },
                  });

                  obraId = obra?.id ?? null;

                  if (obraId) {
                    obrasPorNome.set(chaveNomeObra, obraId);
                  }
                }
              }

              /*
               * 2. Resolver ou cadastrar a função.
               *
               * O código da APDATA tem prioridade. O nome é usado como
               * alternativa quando a função ainda não está mapeada.
               */
              let funcaoId: string | null = null;

              const codigoCargoNormalizado = codigoCargo?.trim() || null;
              const nomeCargoNormalizado = nomeCargo?.trim() || null;

              const chaveNomeFuncao =
                nomeCargoNormalizado?.toLocaleLowerCase("pt-BR") ?? null;

              if (codigoCargoNormalizado) {
                funcaoId = funcoesPorCodigo.get(codigoCargoNormalizado) ?? null;

                if (!funcaoId) {
                  let funcao = await tx.funcao.findUnique({
                    where: {
                      apdataCargoId: codigoCargoNormalizado,
                    },
                  });

                  if (!funcao && nomeCargoNormalizado) {
                    funcao = await tx.funcao.findFirst({
                      where: {
                        nome: {
                          equals: nomeCargoNormalizado,
                          mode: "insensitive",
                        },
                      },
                    });
                  }

                  if (funcao) {
                    /*
                     * Recupera uma função existente pelo nome e associa
                     * o código se ela ainda não tiver código APDATA.
                     */
                    if (!funcao.apdataCargoId) {
                      funcao = await tx.funcao.update({
                        where: { id: funcao.id },
                        data: {
                          apdataCargoId: codigoCargoNormalizado,
                        },
                      });
                    } else if (
                      funcao.apdataCargoId !== codigoCargoNormalizado
                    ) {
                      /*
                       * O nome já existe, mas está associado a outro
                       * código. Como o nome é único no banco, não criamos
                       * outra função com o mesmo nome nem sobrescrevemos
                       * o código já cadastrado.
                       */
                      console.warn(
                        "[APDATA SYNC] Nome de função associado a outro código",
                        {
                          codigoRecebido: codigoCargoNormalizado,
                          codigoCadastrado: funcao.apdataCargoId,
                          nomeCargo: nomeCargoNormalizado,
                        },
                      );
                    }
                  } else if (nomeCargoNormalizado) {
                    funcao = await tx.funcao.create({
                      data: {
                        nome: nomeCargoNormalizado,
                        apdataCargoId: codigoCargoNormalizado,
                        ativo: true,
                      },
                    });

                    loteFuncoesCriadas++;

                    console.info("[APDATA SYNC] Função criada", {
                      id: funcao.id,
                      codigoCargo: codigoCargoNormalizado,
                      nomeCargo: nomeCargoNormalizado,
                    });
                  }

                  funcaoId = funcao?.id ?? null;
                }

                if (funcaoId) {
                  funcoesPorCodigo.set(codigoCargoNormalizado, funcaoId);

                  if (chaveNomeFuncao) {
                    funcoesPorNome.set(chaveNomeFuncao, funcaoId);
                  }
                } else if (!nomeCargoNormalizado) {
                  loteFuncoesSemNome++;

                  console.warn(
                    "[APDATA SYNC] Cargo sem nome e sem função cadastrada",
                    {
                      contratadoId,
                      codigoCargo: codigoCargoNormalizado,
                    },
                  );
                }
              } else if (nomeCargoNormalizado && chaveNomeFuncao) {
                /*
                 * Fallback: o registro não contém código de cargo.
                 */
                funcaoId = funcoesPorNome.get(chaveNomeFuncao) ?? null;

                if (!funcaoId) {
                  const funcao = await tx.funcao.findFirst({
                    where: {
                      nome: {
                        equals: nomeCargoNormalizado,
                        mode: "insensitive",
                      },
                    },
                  });

                  if (funcao) {
                    funcaoId = funcao.id;
                  } else {
                    const novaFuncao = await tx.funcao.create({
                      data: {
                        nome: nomeCargoNormalizado,
                        ativo: true,
                      },
                    });

                    funcaoId = novaFuncao.id;
                    loteFuncoesCriadas++;

                    console.info(
                      "[APDATA SYNC] Função criada sem código APDATA",
                      {
                        id: novaFuncao.id,
                        nomeCargo: nomeCargoNormalizado,
                      },
                    );
                  }

                  funcoesPorNome.set(chaveNomeFuncao, funcaoId);
                }
              } else if (!nomeCargoNormalizado) {
                /*
                 * Se a função não foi localizada pelo código e o nome
                 * está ausente, não criamos um registro incompleto.
                 * O colaborador existente manterá o funcaoId atual.
                 */
                loteFuncoesSemNome++;

                console.warn("[APDATA SYNC] Cargo sem nome", {
                  contratadoId,
                  codigoCargo: codigoCargoNormalizado,
                });
              }

              /*
               * 3. Cadastrar a situação, se houver nome.
               */
              if (situacaoNome) {
                const chaveSituacao = situacaoNome.toLocaleLowerCase("pt-BR");

                if (!situacoesConhecidas.has(chaveSituacao)) {
                  const existenteSituacao =
                    await tx.situacaoAfastamento.findFirst({
                      where: {
                        nome: {
                          equals: situacaoNome,
                          mode: "insensitive",
                        },
                      },
                    });

                  if (!existenteSituacao) {
                    const novaSituacao = await tx.situacaoAfastamento.create({
                      data: {
                        nome: situacaoNome,
                        classificacao: "ATIVO",
                        ativo: true,
                      },
                    });

                    loteSituacoesCriadas++;

                    console.info("[APDATA SYNC] Situação criada", {
                      id: novaSituacao.id,
                      codigo: situacaoId,
                      nome: novaSituacao.nome,
                    });
                  }

                  situacoesConhecidas.add(chaveSituacao);
                }
              }

              /*
               * 4. Montar os dados sem sobrescrever campos ausentes.
               *
               * O spread condicional é importante: se a APDATA não
               * retornar uma obra, função, e-mail ou situação, o valor
               * atual do colaborador não será apagado.
               */
              const dados: Prisma.ColaboradorUpdateInput = {
                nome: nomeColaborador,
                sourceSystem: "APDATA",
                ...(email !== null ? { contato: email } : {}),
                ...(situacaoId !== null
                  ? { apdataSituacaoId: situacaoId }
                  : {}),
                ...(situacaoNome !== null
                  ? { apdataSituacaoNome: situacaoNome }
                  : {}),
                ...(obraId ? { obra: { connect: { id: obraId } } } : {}),
                ...(funcaoId ? { funcao: { connect: { id: funcaoId } } } : {}),
              };

              if (existente) {
                await tx.colaborador.update({
                  where: { id: existente.id },
                  data: dados,
                });

                loteAtualizados++;
                continue;
              }

              /*
               * 5. Compatibilidade com colaboradores que já estavam
               * cadastrados usando o código corporativo APDATA-<id>.
               */
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
                    codigoCorporativo,
                    apdataContratadoId: contratadoId,
                    nome: nomeColaborador,
                    sourceSystem: "APDATA",
                    ativo: true,
                    ...(email !== null ? { contato: email } : {}),
                    ...(situacaoId !== null
                      ? { apdataSituacaoId: situacaoId }
                      : {}),
                    ...(situacaoNome !== null
                      ? { apdataSituacaoNome: situacaoNome }
                      : {}),
                    ...(obraId ? { obraId } : {}),
                    ...(funcaoId ? { funcaoId } : {}),
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
              funcoesCriadas: loteFuncoesCriadas,
              funcoesSemNome: loteFuncoesSemNome,
            };
          },
          {
            maxWait: 10_000,
            timeout: APDATA_BATCH_TIMEOUT_MS,
          },
        );

        /*
         * Contabiliza apenas os lotes confirmados pelo banco.
         */
        criados += resultadoLote.criados;
        atualizados += resultadoLote.atualizados;
        ignorados += resultadoLote.ignorados;
        situacoesCriadas += resultadoLote.situacoesCriadas;
        funcoesCriadas += resultadoLote.funcoesCriadas;
        funcoesSemNome += resultadoLote.funcoesSemNome;

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
      funcoesCriadas,
      funcoesSemNome,
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
