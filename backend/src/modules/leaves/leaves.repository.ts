import type { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prisma.js";

const include = {
  colaborador: {
    select: { id: true, codigoCorporativo: true, nome: true, ativo: true },
  },
  obra: true,
  funcao: true,
  situacao: true,
  tipoBeneficio: true,
  createdBy: { select: { id: true, name: true } },
  updatedBy: { select: { id: true, name: true } },
} satisfies Prisma.AfastamentoInclude;

export interface LeaveListInput {
  page: number;
  perPage: number;
  search?: string | undefined;
  colaboradorId?: string | undefined;
  obraId?: string | undefined;
  funcaoId?: string | undefined;
  tipoBeneficioId?: string | undefined;
  situacaoId?: string | undefined;
  classificacao?: "ATIVO" | "ENCERRADO" | "APOSENTADO" | undefined;
  sortBy:
    | "dataAfastamento"
    | "dataRetornoPrevista"
    | "dataFimBeneficio"
    | "createdAt";
  sortDirection: "asc" | "desc";
}
export interface LeaveWriteData {
  colaboradorId?: string;
  obraId?: string;
  funcaoId?: string;
  situacaoId?: string;
  tipoBeneficioId?: string | null;
  dataAfastamento?: Date;
  dataFimBeneficio?: Date | null;
  dataRetornoPrevista?: Date | null;
  dataRetornoEfetiva?: Date | null;
  causaCid?: string | null;
  observacoes?: string | null;
}

export class LeavesRepository {
  async list(input: LeaveListInput) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const condicoesClassificacao: Prisma.AfastamentoWhereInput[] = [];

    if (input.classificacao === "APOSENTADO") {
      // Aposentados são identificados pela classificação da situação.
      condicoesClassificacao.push({
        situacao: { classificacao: "APOSENTADO" },
      });
    }

    if (input.classificacao === "ATIVO") {
      condicoesClassificacao.push(
        { situacao: { classificacao: { not: "APOSENTADO" } } },
        { dataAfastamento: { lte: hoje } },
        { dataFimBeneficio: { gte: hoje } },
      );
    }

    if (input.classificacao === "ENCERRADO") {
      condicoesClassificacao.push(
        { situacao: { classificacao: { not: "APOSENTADO" } } },
        { dataFimBeneficio: { lt: hoje } },
      );
    }

    const where: Prisma.AfastamentoWhereInput = {
      ...(input.search
        ? {
            colaborador: {
              OR: [
                { nome: { contains: input.search, mode: "insensitive" } },
                {
                  codigoCorporativo: {
                    contains: input.search,
                    mode: "insensitive",
                  },
                },
              ],
            },
          }
        : {}),
      ...(input.colaboradorId ? { colaboradorId: input.colaboradorId } : {}),
      ...(input.obraId ? { obraId: input.obraId } : {}),
      ...(input.funcaoId ? { funcaoId: input.funcaoId } : {}),
      ...(input.tipoBeneficioId
        ? { tipoBeneficioId: input.tipoBeneficioId }
        : {}),
      ...(input.situacaoId ? { situacaoId: input.situacaoId } : {}),
      ...(condicoesClassificacao.length > 0
        ? { AND: condicoesClassificacao }
        : {}),
    };

    const [data, total] = await prisma.$transaction([
      prisma.afastamento.findMany({
        where,
        include,
        orderBy: [
          { [input.sortBy]: input.sortDirection },
          { id: input.sortDirection },
        ],
        skip: (input.page - 1) * input.perPage,
        take: input.perPage,
      }),
      prisma.afastamento.count({ where }),
    ]);

    return { data, total };
  }
  findById(id: string) {
    return prisma.afastamento.findUnique({ where: { id }, include });
  }
  create(
    data: Required<
      Pick<
        LeaveWriteData,
        | "colaboradorId"
        | "obraId"
        | "funcaoId"
        | "situacaoId"
        | "dataAfastamento"
      >
    > &
      LeaveWriteData & { createdById: string },
  ) {
    return prisma.afastamento.create({ data, include });
  }
  update(id: string, data: LeaveWriteData & { updatedById: string }) {
    return prisma.afastamento.update({ where: { id }, data, include });
  }
  async validateReferences(ids: {
    colaboradorId: string;
    obraId: string;
    funcaoId: string;
    situacaoId: string;
    tipoBeneficioId?: string | null | undefined;
  }) {
    const [colaborador, obra, funcao, situacao, beneficio] = await Promise.all([
      prisma.colaborador.findFirst({
        where: { id: ids.colaboradorId, ativo: true },
        select: { id: true },
      }),
      prisma.obra.findFirst({
        where: { id: ids.obraId, ativo: true },
        select: { id: true },
      }),
      prisma.funcao.findFirst({
        where: { id: ids.funcaoId, ativo: true },
        select: { id: true },
      }),
      prisma.situacaoAfastamento.findFirst({
        where: { id: ids.situacaoId, ativo: true },
        select: { id: true },
      }),
      ids.tipoBeneficioId
        ? prisma.tipoBeneficio.findFirst({
            where: { id: ids.tipoBeneficioId, ativo: true },
            select: { id: true },
          })
        : Promise.resolve({ id: "none" }),
    ]);
    return {
      colaborador: Boolean(colaborador),
      obra: Boolean(obra),
      funcao: Boolean(funcao),
      situacao: Boolean(situacao),
      beneficio: Boolean(beneficio),
    };
  }
}
