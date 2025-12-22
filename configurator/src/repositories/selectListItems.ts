import type { Prisma, PrismaClient, SelectListItem } from "@prisma/client";
import { prisma as defaultPrisma } from "../prisma/client";

export type CreateOptionListItemInput = {
  selectListId: string;
  value: string;
  displayValue: string;
  order?: number;
  isActive?: boolean;
  tooltip?: string | null;
  comments?: string | null;
};

export type UpdateOptionListItemInput = {
  value?: string;
  displayValue?: string;
  order?: number;
  isActive?: boolean;
  tooltip?: string | null;
  comments?: string | null;
};

type PrismaClientOrTx = Prisma.TransactionClient | PrismaClient;
const withClient = (client?: PrismaClientOrTx) => client ?? defaultPrisma;

export async function listSelectListItems(opts?: {
  selectListId?: string;
  includeInactive?: boolean;
  client?: PrismaClientOrTx;
}): Promise<SelectListItem[]> {
  const client = withClient(opts?.client);
  return client.selectListItem.findMany({
    where: {
      ...(opts?.selectListId ? { selectListId: opts.selectListId } : {}),
      ...(opts?.includeInactive ? {} : { isActive: true }),
    },
    orderBy: [{ order: "asc" }, { displayValue: "asc" }],
  });
}

export async function getSelectListItemById(
  id: string,
  client?: PrismaClientOrTx,
) {
  return withClient(client).selectListItem.findUnique({ where: { id } });
}

export async function createSelectListItem(
  input: CreateOptionListItemInput,
  client?: PrismaClientOrTx,
): Promise<SelectListItem> {
  return withClient(client).selectListItem.create({
    data: {
      selectListId: input.selectListId,
      value: input.value,
      displayValue: input.displayValue,
      order: input.order ?? 0,
      isActive: input.isActive ?? true,
      tooltip: input.tooltip ?? null,
      comments: input.comments ?? null,
    },
  });
}

export async function updateSelectListItem(
  id: string,
  input: UpdateOptionListItemInput,
  client?: PrismaClientOrTx,
): Promise<SelectListItem> {
  return withClient(client).selectListItem.update({
    where: { id },
    data: { ...input },
  });
}

export async function deactivateOptionListItem(
  id: string,
  client?: PrismaClientOrTx,
): Promise<SelectListItem> {
  return withClient(client).selectListItem.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function deleteSelectListItem(
  id: string,
  client?: PrismaClientOrTx,
) {
  return withClient(client).selectListItem.delete({ where: { id } });
}
