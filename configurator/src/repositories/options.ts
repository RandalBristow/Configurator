import type { Prisma, PrismaClient, Option } from "@prisma/client";
import { prisma as defaultPrisma } from "../prisma/client";

export type CreateOptionInput = {
  subcategoryId: string;
  code: string;
  name: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export type UpdateOptionInput = {
  code?: string;
  name?: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

type PrismaClientOrTx = Prisma.TransactionClient | PrismaClient;
const withClient = (client?: PrismaClientOrTx) => client ?? defaultPrisma;

export async function listOptions(opts?: {
  subcategoryId?: string;
  includeInactive?: boolean;
  client?: PrismaClientOrTx;
}): Promise<Option[]> {
  const client = withClient(opts?.client);
  return client.option.findMany({
    where: {
      ...(opts?.subcategoryId ? { subcategoryId: opts.subcategoryId } : {}),
      ...(opts?.includeInactive ? {} : { isActive: true }),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getOptionById(id: string, client?: PrismaClientOrTx) {
  return withClient(client).option.findUnique({ where: { id } });
}

export async function createOption(
  input: CreateOptionInput,
  client?: PrismaClientOrTx,
): Promise<Option> {
  return withClient(client).option.create({
    data: {
      subcategoryId: input.subcategoryId,
      code: input.code,
      name: input.name,
      description: input.description ?? null,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateOption(
  id: string,
  input: UpdateOptionInput,
  client?: PrismaClientOrTx,
): Promise<Option> {
  return withClient(client).option.update({
    where: { id },
    data: { ...input },
  });
}

export async function deactivateOption(
  id: string,
  client?: PrismaClientOrTx,
): Promise<Option> {
  return withClient(client).option.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function deleteOption(id: string, client?: PrismaClientOrTx) {
  return withClient(client).option.delete({ where: { id } });
}
