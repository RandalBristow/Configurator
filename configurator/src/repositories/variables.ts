import { Prisma } from "@prisma/client";
import type { PrismaClient, Variable, VariableDataType } from "@prisma/client";
import { prisma as defaultPrisma } from "../prisma/client";

export type CreateVariableInput = {
  optionId?: string | null;
  name: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  dataType: VariableDataType;
  defaultValue?: Prisma.InputJsonValue | null;
};

export type UpdateVariableInput = {
  name?: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  dataType?: VariableDataType;
  defaultValue?: Prisma.InputJsonValue | null;
};

type PrismaClientOrTx = Prisma.TransactionClient | PrismaClient;
const withClient = (client?: PrismaClientOrTx) => client ?? defaultPrisma;

const mapNullableJson = (
  value?: Prisma.InputJsonValue | null,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.DbNull;
  return value;
};

const GLOBAL_OWNER_KEY = "global";

export async function listVariables(opts?: {
  optionId?: string;
  includeInactive?: boolean;
  client?: PrismaClientOrTx;
}): Promise<Variable[]> {
  const client = withClient(opts?.client);
  const where: Prisma.VariableWhereInput = {};
  if (opts?.optionId) {
    where.optionId = opts.optionId;
  } else {
    where.optionId = null;
    where.ownerKey = GLOBAL_OWNER_KEY;
  }
  if (!opts?.includeInactive) {
    where.isActive = true;
  }
  return client.variable.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getVariableById(id: string, client?: PrismaClientOrTx) {
  return withClient(client).variable.findUnique({ where: { id } });
}

export async function createVariable(
  input: CreateVariableInput,
  client?: PrismaClientOrTx,
): Promise<Variable> {
  const ownerKey = input.optionId ? input.optionId : GLOBAL_OWNER_KEY;
  const defaultValue = mapNullableJson(input.defaultValue);

  return withClient(client).variable.create({
    data: {
      optionId: input.optionId ?? null,
      ownerKey,
      name: input.name,
      description: input.description ?? null,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
      dataType: input.dataType,
      ...(defaultValue !== undefined ? { defaultValue } : {}),
    },
  });
}

export async function updateVariable(
  id: string,
  input: UpdateVariableInput,
  client?: PrismaClientOrTx,
): Promise<Variable> {
  const defaultValue = mapNullableJson(input.defaultValue);
  const data: Prisma.VariableUpdateInput = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.dataType !== undefined) data.dataType = input.dataType;
  if (defaultValue !== undefined) data.defaultValue = defaultValue;

  return withClient(client).variable.update({
    where: { id },
    data,
  });
}

export async function deactivateVariable(
  id: string,
  client?: PrismaClientOrTx,
): Promise<Variable> {
  return withClient(client).variable.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function deleteVariable(id: string, client?: PrismaClientOrTx) {
  return withClient(client).variable.delete({ where: { id } });
}

export const variableOwnerKeys = {
  GLOBAL: GLOBAL_OWNER_KEY,
};
