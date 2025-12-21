import type { Prisma, PrismaClient } from "@prisma/client";
import {
  createSubcategory,
  deactivateSubcategory,
  deleteSubcategory,
  getSubcategoryById,
  listSubcategories,
  updateSubcategory,
} from "../repositories/subcategories";

type Client = Prisma.TransactionClient | PrismaClient;

export const subcategoriesService = {
  list: (opts?: {
    categoryId?: string;
    includeInactive?: boolean;
    client?: Client;
  }) => {
    const args: {
      categoryId?: string;
      includeInactive?: boolean;
      client?: Client;
    } = {};
    if (opts?.categoryId) args.categoryId = opts.categoryId;
    if (opts?.includeInactive !== undefined) args.includeInactive = opts.includeInactive;
    if (opts?.client) args.client = opts.client;
    return listSubcategories(args);
  },

  get: (id: string, client?: Client) => getSubcategoryById(id, client),

  create: (
    input: Parameters<typeof createSubcategory>[0],
    client?: Client,
  ) => createSubcategory(input, client),

  update: (
    id: string,
    input: Parameters<typeof updateSubcategory>[1],
    client?: Client,
  ) => updateSubcategory(id, input, client),

  deactivate: (id: string, client?: Client) => deactivateSubcategory(id, client),

  deleteSummary: async (id: string, client?: PrismaClient) => {
    const prismaClient = client ?? (await import("../prisma/client")).prisma;
    const exists = await prismaClient.subcategory.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return null;
    const [options, attributes] = await prismaClient.$transaction([
      prismaClient.option.count({ where: { subcategoryId: id } }),
      prismaClient.attribute.count({ where: { option: { subcategoryId: id } } }),
    ]);
    return { options, attributes };
  },

  // Deactivate a subcategory and its options/attributes.
  deactivateDeep: async (id: string, client?: PrismaClient) => {
    const prismaClient = client ?? (await import("../prisma/client")).prisma;
    return prismaClient.$transaction(async (tx) => {
      const options = await tx.option.findMany({
        where: { subcategoryId: id },
        select: { id: true },
      });
      const optionIds = options.map((o) => o.id);

      if (optionIds.length) {
        await tx.attribute.updateMany({
          where: { optionId: { in: optionIds } },
          data: { isActive: false },
        });
      }

      await tx.option.updateMany({
        where: { subcategoryId: id },
        data: { isActive: false },
      });

      return tx.subcategory.update({
        where: { id },
        data: { isActive: false },
      });
    });
  },

  // Hard delete a subcategory and all children (options/attributes).
  deleteDeep: async (id: string, client?: PrismaClient) => {
    const prismaClient = client ?? (await import("../prisma/client")).prisma;
    return prismaClient.$transaction(async (tx) => {
      const options = await tx.option.findMany({
        where: { subcategoryId: id },
        select: { id: true },
      });
      const optionIds = options.map((o) => o.id);

      if (optionIds.length) {
        await tx.attribute.deleteMany({ where: { optionId: { in: optionIds } } });
      }
      await tx.option.deleteMany({ where: { subcategoryId: id } });
      return tx.subcategory.delete({ where: { id } });
    });
  },

  activate: async (id: string, client?: PrismaClient) => {
    const prismaClient = client ?? (await import("../prisma/client")).prisma;
    return prismaClient.$transaction(async (tx) => {
      await tx.option.updateMany({
        where: { subcategoryId: id },
        data: { isActive: true },
      });
      await tx.attribute.updateMany({
        where: { option: { subcategoryId: id } },
        data: { isActive: true },
      });
      return tx.subcategory.update({
        where: { id },
        data: { isActive: true },
      });
    });
  },
  delete: (id: string, client?: Client) => deleteSubcategory(id, client),
};
