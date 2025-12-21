import type { Prisma, PrismaClient, Subcategory } from "@prisma/client";
import { prisma as defaultPrisma } from "../prisma/client";

export type CreateSubcategoryInput = {
  categoryId: string;
  name: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export type UpdateSubcategoryInput = {
  name?: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

type PrismaClientOrTx = Prisma.TransactionClient | PrismaClient;

const withClient = (client?: PrismaClientOrTx) => client ?? defaultPrisma;

export async function listSubcategories(opts?: {
  categoryId?: string;
  includeInactive?: boolean;
  client?: PrismaClientOrTx;
}): Promise<Subcategory[]> {
  const client = withClient(opts?.client);
  return client.subcategory.findMany({
    where: {
      ...(opts?.categoryId ? { categoryId: opts.categoryId } : {}),
      ...(opts?.includeInactive ? {} : { isActive: true }),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getSubcategoryById(
  id: string,
  client?: PrismaClientOrTx,
) {
  return withClient(client).subcategory.findUnique({ where: { id } });
}

export async function createSubcategory(
  input: CreateSubcategoryInput,
  client?: PrismaClientOrTx,
): Promise<Subcategory> {
  return withClient(client).subcategory.create({
    data: {
      categoryId: input.categoryId,
      name: input.name,
      description: input.description ?? null,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateSubcategory(
  id: string,
  input: UpdateSubcategoryInput,
  client?: PrismaClientOrTx,
): Promise<Subcategory> {
  return withClient(client).subcategory.update({
    where: { id },
    data: {
      ...input,
    },
  });
}

// Soft delete: mark inactive
export async function deactivateSubcategory(
  id: string,
  client?: PrismaClientOrTx,
) {
  return withClient(client).subcategory.update({
    where: { id },
    data: { isActive: false },
  });
}

// Hard delete if ever needed
export async function deleteSubcategory(
  id: string,
  client?: PrismaClientOrTx,
) {
  return withClient(client).subcategory.delete({ where: { id } });
}
