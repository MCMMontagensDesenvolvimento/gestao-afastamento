import type { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prisma.js";

const include = { obra: true, funcao: true } satisfies Prisma.ColaboradorInclude;
export interface EmployeeListInput { page: number; perPage: number; search?: string | undefined; obraId?: string | undefined; funcaoId?: string | undefined; ativo?: boolean | undefined; sortBy: "nome" | "codigoCorporativo" | "createdAt"; sortDirection: "asc" | "desc"; }

export class EmployeesRepository {
  async list(input: EmployeeListInput) {
    const where: Prisma.ColaboradorWhereInput = {
      ...(input.search ? { OR: [
        { nome: { contains: input.search, mode: "insensitive" } },
        { codigoCorporativo: { contains: input.search, mode: "insensitive" } },
      ] } : {}),
      ...(input.obraId ? { obraId: input.obraId } : {}),
      ...(input.funcaoId ? { funcaoId: input.funcaoId } : {}),
      ...(input.ativo === undefined ? {} : { ativo: input.ativo }),
    };
    const [data, total] = await prisma.$transaction([
      prisma.colaborador.findMany({ where, include, orderBy: [{ [input.sortBy]: input.sortDirection }, { id: "asc" }], skip: (input.page - 1) * input.perPage, take: input.perPage }),
      prisma.colaborador.count({ where }),
    ]);
    return { data, total };
  }
  findById(id: string) { return prisma.colaborador.findUnique({ where: { id }, include }); }
  findByCode(codigoCorporativo: string) { return prisma.colaborador.findUnique({ where: { codigoCorporativo } }); }
  async activeContext(obraId: string, funcaoId: string) {
    const [obra, funcao] = await Promise.all([
      prisma.obra.findFirst({ where: { id: obraId, ativo: true } }),
      prisma.funcao.findFirst({ where: { id: funcaoId, ativo: true } }),
    ]);
    return { obra: Boolean(obra), funcao: Boolean(funcao) };
  }
  create(data: { codigoCorporativo: string; nome: string; contato?: string; obraId: string; funcaoId: string }) { return prisma.colaborador.create({ data, include }); }
  update(id: string, data: { nome?: string | undefined; contato?: string | null | undefined; obraId?: string | undefined; funcaoId?: string | undefined }) {
    return prisma.colaborador.update({ where: { id }, data: {
      ...(data.nome === undefined ? {} : { nome: data.nome }), ...(data.contato === undefined ? {} : { contato: data.contato }),
      ...(data.obraId === undefined ? {} : { obraId: data.obraId }), ...(data.funcaoId === undefined ? {} : { funcaoId: data.funcaoId }),
    }, include });
  }
  setActive(id: string, ativo: boolean) { return prisma.colaborador.update({ where: { id }, data: { ativo }, include }); }
  async history(id: string, page: number, perPage: number) {
    const [data, total] = await prisma.$transaction([
      prisma.afastamento.findMany({
        where: { colaboradorId: id },
        include: { obra: true, funcao: true, situacao: true, tipoBeneficio: true },
        orderBy: [{ dataAfastamento: "desc" }, { id: "desc" }], skip: (page - 1) * perPage, take: perPage,
      }),
      prisma.afastamento.count({ where: { colaboradorId: id } }),
    ]);
    return { data, total };
  }
}
