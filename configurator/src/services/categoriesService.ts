import type { Prisma, PrismaClient } from "@prisma/client";
import {
  createCategory,
  deactivateCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  updateCategory,
} from "../repositories/categories";

type Client = Prisma.TransactionClient | PrismaClient;

export const categoriesService = {
  list: (opts?: { includeInactive?: boolean; client?: Client }) => {
    const args: { includeInactive?: boolean; client?: Client } = {};
    if (opts?.includeInactive !== undefined) args.includeInactive = opts.includeInactive;
    if (opts?.client) args.client = opts.client;
    return listCategories(args);
  },

  get: (id: string, client?: Client) => getCategoryById(id, client),

  create: (
    input: Parameters<typeof createCategory>[0],
    client?: Client,
  ) => createCategory(input, client),

  update: (
    id: string,
    input: Parameters<typeof updateCategory>[1],
    client?: Client,
  ) => updateCategory(id, input, client),

  deactivate: (id: string, client?: Client) => deactivateCategory(id, client),

  deleteSummary: async (id: string, client?: PrismaClient) => {
    const prismaClient = client ?? (await import("../prisma/client")).prisma;
    const exists = await prismaClient.category.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return null;
    const [subcategories, options, attributes] = await prismaClient.$transaction([
      prismaClient.subcategory.count({ where: { categoryId: id } }),
      prismaClient.option.count({ where: { subcategory: { categoryId: id } } }),
      prismaClient.attribute.count({ where: { option: { subcategory: { categoryId: id } } } }),
    ]);
    return { subcategories, options, attributes };
  },

  // Deactivate a category and its subcategories/options/attributes in a single transaction.
  deactivateDeep: async (id: string, client?: PrismaClient) => {
    const prismaClient = client ?? (await import("../prisma/client")).prisma;
    return prismaClient.$transaction(async (tx) => {
      const subcategories = await tx.subcategory.findMany({
        where: { categoryId: id },
        select: { id: true },
      });

      const subcategoryIds = subcategories.map((s) => s.id);
      if (subcategoryIds.length) {
        const options = await tx.option.findMany({
          where: { subcategoryId: { in: subcategoryIds } },
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
          where: { subcategoryId: { in: subcategoryIds } },
          data: { isActive: false },
        });

        await tx.subcategory.updateMany({
          where: { id: { in: subcategoryIds } },
          data: { isActive: false },
        });
      }

      return tx.category.update({
        where: { id },
        data: { isActive: false },
      });
    });
  },

  // Hard delete a category and all children (subcategories/options/attributes).
  deleteDeep: async (id: string, client?: PrismaClient) => {
    const prismaClient = client ?? (await import("../prisma/client")).prisma;
    return prismaClient.$transaction(async (tx) => {
      const subcategories = await tx.subcategory.findMany({
        where: { categoryId: id },
        select: { id: true },
      });
      const subcategoryIds = subcategories.map((s) => s.id);

      if (subcategoryIds.length) {
        const options = await tx.option.findMany({
          where: { subcategoryId: { in: subcategoryIds } },
          select: { id: true },
        });
        const optionIds = options.map((o) => o.id);

        if (optionIds.length) {
          await tx.attribute.deleteMany({ where: { optionId: { in: optionIds } } });
        }
        await tx.option.deleteMany({ where: { subcategoryId: { in: subcategoryIds } } });
        await tx.subcategory.deleteMany({ where: { id: { in: subcategoryIds } } });
      }

      return tx.category.delete({ where: { id } });
    });
  },

  activate: async (id: string, client?: PrismaClient) => {
    const prismaClient = client ?? (await import("../prisma/client")).prisma;
    return prismaClient.$transaction(async (tx) => {
      await tx.subcategory.updateMany({ where: { categoryId: id }, data: { isActive: true } });
      await tx.option.updateMany({
        where: { subcategory: { categoryId: id } },
        data: { isActive: true },
      });
      await tx.attribute.updateMany({
        where: { option: { subcategory: { categoryId: id } } },
        data: { isActive: true },
      });
      return tx.category.update({
        where: { id },
        data: { isActive: true },
      });
    });
  },

  delete: (id: string, client?: Client) => deleteCategory(id, client),
};
