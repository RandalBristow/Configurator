import type { Prisma, PrismaClient, OptionListItem } from "@prisma/client";
import { prisma as defaultPrisma } from "../prisma/client";

export type CreateOptionListItemInput = {
  optionListId: string;
  value: string;
  label: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type UpdateOptionListItemInput = {
  value?: string;
  label?: string;
  sortOrder?: number;
  isActive?: boolean;
};

type PrismaClientOrTx = Prisma.TransactionClient | PrismaClient;
const withClient = (client?: PrismaClientOrTx) => client ?? defaultPrisma;

export async function listOptionListItems(opts?: {
  optionListId?: string;
  includeInactive?: boolean;
  client?: PrismaClientOrTx;
}): Promise<OptionListItem[]> {
  const client = withClient(opts?.client);
  return client.optionListItem.findMany({
    where: {
      ...(opts?.optionListId ? { optionListId: opts.optionListId } : {}),
      ...(opts?.includeInactive ? {} : { isActive: true }),
    },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });
}

export async function getOptionListItemById(
  id: string,
  client?: PrismaClientOrTx,
) {
  return withClient(client).optionListItem.findUnique({ where: { id } });
}

export async function createOptionListItem(
  input: CreateOptionListItemInput,
  client?: PrismaClientOrTx,
): Promise<OptionListItem> {
  return withClient(client).optionListItem.create({
    data: {
      optionListId: input.optionListId,
      value: input.value,
      label: input.label,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateOptionListItem(
  id: string,
  input: UpdateOptionListItemInput,
  client?: PrismaClientOrTx,
): Promise<OptionListItem> {
  return withClient(client).optionListItem.update({
    where: { id },
    data: { ...input },
  });
}

export async function deactivateOptionListItem(
  id: string,
  client?: PrismaClientOrTx,
): Promise<OptionListItem> {
  return withClient(client).optionListItem.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function deleteOptionListItem(
  id: string,
  client?: PrismaClientOrTx,
) {
  return withClient(client).optionListItem.delete({ where: { id } });
}
