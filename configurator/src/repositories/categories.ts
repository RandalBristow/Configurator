import type { Prisma, PrismaClient, Category } from "@prisma/client";
import { prisma as defaultPrisma } from "../prisma/client";

export type CreateCategoryInput = {
  name: string;
  description: string;
  order?: number;
  isActive?: boolean;
};

export type UpdateCategoryInput = {
  name?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
};

type PrismaClientOrTx = Prisma.TransactionClient | PrismaClient;

const withClient = (client?: PrismaClientOrTx) => client ?? defaultPrisma;

export async function listCategories(opts?: {
  includeInactive?: boolean;
  client?: PrismaClientOrTx;
}): Promise<Category[]> {
  const client = withClient(opts?.client);
  return client.category.findMany({
    where: opts?.includeInactive ? {} : { isActive: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
}

export async function getCategoryById(id: string, client?: PrismaClientOrTx) {
  return withClient(client).category.findUnique({ where: { id } });
}

export async function createCategory(
  input: CreateCategoryInput,
  client?: PrismaClientOrTx,
): Promise<Category> {
  return withClient(client).category.create({
    data: {
      name: input.name,
      description: input.description,
      order: input.order ?? 0,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput,
  client?: PrismaClientOrTx,
): Promise<Category> {
  return withClient(client).category.update({
    where: { id },
    data: {
      ...input,
    },
  });
}

// Soft delete: mark inactive
export async function deactivateCategory(id: string, client?: PrismaClientOrTx) {
  return withClient(client).category.update({
    where: { id },
    data: { isActive: false },
  });
}

// Hard delete if ever needed
export async function deleteCategory(id: string, client?: PrismaClientOrTx) {
  return withClient(client).category.delete({ where: { id } });
}
