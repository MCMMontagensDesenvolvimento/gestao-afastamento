import { prisma } from "../../infrastructure/database/prisma.js";

export type CatalogKind = "obra" | "funcao" | "tipoBeneficio" | "situacao" | "tipoAndamento" | "tipoDocumento";
export interface CatalogListInput { page: number; perPage: number; search?: string | undefined; ativo?: boolean | undefined; }

function where(input: CatalogListInput) {
  return {
    ...(input.search ? { nome: { contains: input.search, mode: "insensitive" as const } } : {}),
    ...(input.ativo === undefined ? {} : { ativo: input.ativo }),
  };
}
function paging(input: CatalogListInput) { return { skip: (input.page - 1) * input.perPage, take: input.perPage } as const; }

export class CatalogsRepository {
  async list(kind: CatalogKind, input: CatalogListInput) {
    const query = { where: where(input), orderBy: [{ nome: "asc" as const }, { id: "asc" as const }], ...paging(input) };
    switch (kind) {
      case "obra": return Promise.all([prisma.obra.findMany(query), prisma.obra.count({ where: query.where })]);
      case "funcao": return Promise.all([prisma.funcao.findMany(query), prisma.funcao.count({ where: query.where })]);
      case "tipoBeneficio": return Promise.all([prisma.tipoBeneficio.findMany(query), prisma.tipoBeneficio.count({ where: query.where })]);
      case "situacao": return Promise.all([prisma.situacaoAfastamento.findMany(query), prisma.situacaoAfastamento.count({ where: query.where })]);
      case "tipoAndamento": return Promise.all([prisma.tipoAndamento.findMany(query), prisma.tipoAndamento.count({ where: query.where })]);
      case "tipoDocumento": return Promise.all([prisma.tipoDocumento.findMany(query), prisma.tipoDocumento.count({ where: query.where })]);
    }
  }

  findById(kind: CatalogKind, id: string) {
    switch (kind) {
      case "obra": return prisma.obra.findUnique({ where: { id } });
      case "funcao": return prisma.funcao.findUnique({ where: { id } });
      case "tipoBeneficio": return prisma.tipoBeneficio.findUnique({ where: { id } });
      case "situacao": return prisma.situacaoAfastamento.findUnique({ where: { id } });
      case "tipoAndamento": return prisma.tipoAndamento.findUnique({ where: { id } });
      case "tipoDocumento": return prisma.tipoDocumento.findUnique({ where: { id } });
    }
  }

  findByName(kind: CatalogKind, nome: string) {
    switch (kind) {
      case "obra": return prisma.obra.findUnique({ where: { nome } });
      case "funcao": return prisma.funcao.findUnique({ where: { nome } });
      case "tipoBeneficio": return prisma.tipoBeneficio.findUnique({ where: { nome } });
      case "situacao": return prisma.situacaoAfastamento.findUnique({ where: { nome } });
      case "tipoAndamento": return prisma.tipoAndamento.findUnique({ where: { nome } });
      case "tipoDocumento": return prisma.tipoDocumento.findUnique({ where: { nome } });
    }
  }

  create(kind: CatalogKind, input: { nome: string; classificacao?: "ATIVO" | "ENCERRADO" | "APOSENTADO" }) {
    if (kind === "situacao") return prisma.situacaoAfastamento.create({ data: { nome: input.nome, classificacao: input.classificacao! } });
    switch (kind) {
      case "obra": return prisma.obra.create({ data: { nome: input.nome } });
      case "funcao": return prisma.funcao.create({ data: { nome: input.nome } });
      case "tipoBeneficio": return prisma.tipoBeneficio.create({ data: { nome: input.nome } });
      case "tipoAndamento": return prisma.tipoAndamento.create({ data: { nome: input.nome } });
      case "tipoDocumento": return prisma.tipoDocumento.create({ data: { nome: input.nome } });
      default: throw new Error("Catálogo inválido.");
    }
  }

  update(kind: CatalogKind, id: string, input: { nome?: string | undefined; ativo?: boolean | undefined; classificacao?: "ATIVO" | "ENCERRADO" | "APOSENTADO" | undefined }) {
    if (kind === "situacao") return prisma.situacaoAfastamento.update({ where: { id }, data: {
      ...(input.nome === undefined ? {} : { nome: input.nome }), ...(input.ativo === undefined ? {} : { ativo: input.ativo }),
      ...(input.classificacao === undefined ? {} : { classificacao: input.classificacao }),
    } });
    const data = { ...(input.nome === undefined ? {} : { nome: input.nome }), ...(input.ativo === undefined ? {} : { ativo: input.ativo }) };
    switch (kind) {
      case "obra": return prisma.obra.update({ where: { id }, data });
      case "funcao": return prisma.funcao.update({ where: { id }, data });
      case "tipoBeneficio": return prisma.tipoBeneficio.update({ where: { id }, data });
      case "tipoAndamento": return prisma.tipoAndamento.update({ where: { id }, data });
      case "tipoDocumento": return prisma.tipoDocumento.update({ where: { id }, data });
      default: throw new Error("Catálogo inválido.");
    }
  }
}
