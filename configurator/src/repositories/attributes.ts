import type {
  Prisma,
  PrismaClient,
  Attribute,
  AttributeDataType,
} from "@prisma/client";
import { prisma as defaultPrisma } from "../prisma/client";

export type CreateAttributeInput = {
  optionId: string;
  key: string;
  label: string;
  dataType: AttributeDataType;
  optionListId?: string | null;
  defaultExpression?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export type UpdateAttributeInput = {
  key?: string;
  label?: string;
  dataType?: AttributeDataType;
  optionListId?: string | null;
  defaultExpression?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

type PrismaClientOrTx = Prisma.TransactionClient | PrismaClient;
const withClient = (client?: PrismaClientOrTx) => client ?? defaultPrisma;

export async function listAttributes(opts?: {
  optionId?: string;
  includeInactive?: boolean;
  client?: PrismaClientOrTx;
}): Promise<Attribute[]> {
  const client = withClient(opts?.client);
  return client.attribute.findMany({
    where: {
      ...(opts?.optionId ? { optionId: opts.optionId } : {}),
      ...(opts?.includeInactive ? {} : { isActive: true }),
    },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });
}

export async function getAttributeById(id: string, client?: PrismaClientOrTx) {
  return withClient(client).attribute.findUnique({ where: { id } });
}

export async function createAttribute(
  input: CreateAttributeInput,
  client?: PrismaClientOrTx,
): Promise<Attribute> {
  return withClient(client).attribute.create({
    data: {
      optionId: input.optionId,
      key: input.key,
      label: input.label,
      dataType: input.dataType,
      optionListId: input.optionListId ?? null,
      defaultExpression: input.defaultExpression ?? null,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateAttribute(
  id: string,
  input: UpdateAttributeInput,
  client?: PrismaClientOrTx,
): Promise<Attribute> {
  return withClient(client).attribute.update({
    where: { id },
    data: { ...input },
  });
}

export async function deactivateAttribute(
  id: string,
  client?: PrismaClientOrTx,
): Promise<Attribute> {
  return withClient(client).attribute.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function deleteAttribute(
  id: string,
  client?: PrismaClientOrTx,
) {
  return withClient(client).attribute.delete({ where: { id } });
}
