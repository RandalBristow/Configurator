import type {
  LookupTable,
  LookupTableColumn,
  LookupTableRow,
  LookupTableDataType,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import { prisma as defaultPrisma } from "../prisma/client";

type PrismaClientOrTx = Prisma.TransactionClient | PrismaClient;
const withClient = (client?: PrismaClientOrTx) => client ?? defaultPrisma;

export async function listLookupTables(client?: PrismaClientOrTx) {
  return withClient(client).lookupTable.findMany({
    orderBy: [{ name: "asc" }],
  });
}

export async function createLookupTable(
  input: { name: string; description?: string | null },
  client?: PrismaClientOrTx,
): Promise<LookupTable> {
  return withClient(client).lookupTable.create({
    data: {
      name: input.name,
      description: input.description ?? null,
    },
  });
}

export async function updateLookupTable(
  id: string,
  input: { name?: string; description?: string | null },
  client?: PrismaClientOrTx,
): Promise<LookupTable> {
  return withClient(client).lookupTable.update({
    where: { id },
    data: { ...input },
  });
}

export async function deleteLookupTable(id: string, client?: PrismaClientOrTx) {
  return withClient(client).lookupTable.delete({ where: { id } });
}

export async function listLookupTableColumns(tableId: string, client?: PrismaClientOrTx) {
  return withClient(client).lookupTableColumn.findMany({
    where: { tableId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { name: "asc" }],
  });
}

export async function createLookupTableColumn(
  tableId: string,
  input: { name: string; dataType: LookupTableDataType; sortOrder?: number },
  client?: PrismaClientOrTx,
): Promise<LookupTableColumn> {
  return withClient(client).lookupTableColumn.create({
    data: {
      tableId,
      name: input.name,
      dataType: input.dataType,
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export async function updateLookupTableColumn(
  id: string,
  input: { name?: string; dataType?: LookupTableDataType; sortOrder?: number },
  client?: PrismaClientOrTx,
): Promise<LookupTableColumn> {
  return withClient(client).lookupTableColumn.update({
    where: { id },
    data: { ...input },
  });
}

export async function deleteLookupTableColumn(id: string, client?: PrismaClientOrTx) {
  return withClient(client).lookupTableColumn.delete({ where: { id } });
}

export async function listLookupTableRows(tableId: string, client?: PrismaClientOrTx) {
  return withClient(client).lookupTableRow.findMany({
    where: { tableId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function createLookupTableRow(
  tableId: string,
  input: { values: Prisma.InputJsonValue; rowHash: string; sortOrder?: number },
  client?: PrismaClientOrTx,
): Promise<LookupTableRow> {
  return withClient(client).lookupTableRow.create({
    data: {
      tableId,
      values: input.values,
      rowHash: input.rowHash,
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export async function updateLookupTableRow(
  id: string,
  input: { values?: Prisma.InputJsonValue; rowHash?: string; sortOrder?: number },
  client?: PrismaClientOrTx,
): Promise<LookupTableRow> {
  return withClient(client).lookupTableRow.update({
    where: { id },
    data: { ...input },
  });
}

export async function deleteLookupTableRow(id: string, client?: PrismaClientOrTx) {
  return withClient(client).lookupTableRow.delete({ where: { id } });
}

