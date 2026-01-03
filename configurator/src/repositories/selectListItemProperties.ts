import type { Prisma, PrismaClient, SelectListItemProperty } from "@prisma/client";
import { prisma as defaultPrisma } from "../prisma/client";

type PrismaClientOrTx = Prisma.TransactionClient | PrismaClient;
const withClient = (client?: PrismaClientOrTx) => client ?? defaultPrisma;

export async function listSelectListItemProperties(selectListId: string, client?: PrismaClientOrTx) {
  return withClient(client).selectListItemProperty.findMany({
    where: { item: { selectListId } },
    orderBy: [{ key: "asc" }, { itemId: "asc" }],
  });
}

export async function upsertSelectListItemProperty(
  input: { itemId: string; key: string; dataType: SelectListItemProperty["dataType"]; value: string },
  client?: PrismaClientOrTx,
) {
  return withClient(client).selectListItemProperty.upsert({
    where: { itemId_key: { itemId: input.itemId, key: input.key } },
    create: {
      itemId: input.itemId,
      key: input.key,
      dataType: input.dataType,
      value: input.value,
    },
    update: {
      dataType: input.dataType,
      value: input.value,
    },
  });
}

export async function deleteSelectListItemProperty(
  input: { itemId: string; key: string },
  client?: PrismaClientOrTx,
) {
  return withClient(client).selectListItemProperty.delete({
    where: { itemId_key: { itemId: input.itemId, key: input.key } },
  });
}

export async function renameSelectListItemPropertyKeyForList(
  selectListId: string,
  input: { from: string; to: string },
  client?: PrismaClientOrTx,
) {
  return withClient(client).selectListItemProperty.updateMany({
    where: { key: input.from, item: { selectListId } },
    data: { key: input.to },
  });
}

export async function deleteSelectListItemPropertiesForListByKey(
  selectListId: string,
  key: string,
  client?: PrismaClientOrTx,
) {
  return withClient(client).selectListItemProperty.deleteMany({
    where: { key, item: { selectListId } },
  });
}
