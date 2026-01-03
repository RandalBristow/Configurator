import type { Prisma, PrismaClient, SelectListProperty } from "@prisma/client";
import { prisma as defaultPrisma } from "../prisma/client";

type PrismaClientOrTx = Prisma.TransactionClient | PrismaClient;
const withClient = (client?: PrismaClientOrTx) => client ?? defaultPrisma;

export async function listSelectListProperties(selectListId: string, client?: PrismaClientOrTx) {
  return withClient(client).selectListProperty.findMany({
    where: { selectListId },
    orderBy: [{ createdAt: "asc" }, { key: "asc" }],
  });
}

export async function createSelectListProperty(
  selectListId: string,
  input: { key: string; dataType: SelectListProperty["dataType"] },
  client?: PrismaClientOrTx,
): Promise<SelectListProperty> {
  return withClient(client).selectListProperty.create({
    data: {
      selectListId,
      key: input.key,
      dataType: input.dataType,
    },
  });
}

export async function updateSelectListProperty(
  id: string,
  input: { key?: string; dataType?: SelectListProperty["dataType"] },
  client?: PrismaClientOrTx,
): Promise<SelectListProperty> {
  return withClient(client).selectListProperty.update({
    where: { id },
    data: { ...input },
  });
}

export async function deleteSelectListProperty(id: string, client?: PrismaClientOrTx) {
  return withClient(client).selectListProperty.delete({ where: { id } });
}
