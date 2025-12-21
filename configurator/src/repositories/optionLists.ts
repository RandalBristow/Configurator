import type { Prisma, PrismaClient, OptionList } from "@prisma/client";
import { prisma as defaultPrisma } from "../prisma/client";

export type CreateOptionListInput = {
  name: string;
  description?: string | null;
};

export type UpdateOptionListInput = {
  name?: string;
  description?: string | null;
};

type PrismaClientOrTx = Prisma.TransactionClient | PrismaClient;
const withClient = (client?: PrismaClientOrTx) => client ?? defaultPrisma;

export async function listOptionLists(client?: PrismaClientOrTx) {
  return withClient(client).optionList.findMany({
    orderBy: [{ name: "asc" }],
  });
}

export async function getOptionListById(id: string, client?: PrismaClientOrTx) {
  return withClient(client).optionList.findUnique({ where: { id } });
}

export async function createOptionList(
  input: CreateOptionListInput,
  client?: PrismaClientOrTx,
): Promise<OptionList> {
  return withClient(client).optionList.create({
    data: {
      name: input.name,
      description: input.description ?? null,
    },
  });
}

export async function updateOptionList(
  id: string,
  input: UpdateOptionListInput,
  client?: PrismaClientOrTx,
): Promise<OptionList> {
  return withClient(client).optionList.update({
    where: { id },
    data: { ...input },
  });
}

export async function deleteOptionList(id: string, client?: PrismaClientOrTx) {
  return withClient(client).optionList.delete({ where: { id } });
}
