import { Prisma, PrismaClient, type Option, type OptionType } from "@prisma/client";
import { prisma as defaultPrisma } from "../prisma/client";

export type CreateOptionInput = {
  name: string;
  description?: string | null;
  isActive?: boolean;
  optionType: OptionType;
  formDraft?: Prisma.InputJsonValue | null;
  formPublished?: Prisma.InputJsonValue | null;
};

export type UpdateOptionInput = {
  name?: string;
  description?: string | null;
  isActive?: boolean;
  optionType?: OptionType;
  formDraft?: Prisma.InputJsonValue | null;
  formPublished?: Prisma.InputJsonValue | null;
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

export async function listOptions(opts?: {
  optionType?: OptionType;
  includeInactive?: boolean;
  client?: PrismaClientOrTx;
}): Promise<Option[]> {
  const client = withClient(opts?.client);
  return client.option.findMany({
    where: {
      ...(opts?.optionType ? { optionType: opts.optionType } : {}),
      ...(opts?.includeInactive ? {} : { isActive: true }),
    },
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
  });
}

export async function getOptionById(id: string, client?: PrismaClientOrTx) {
  return withClient(client).option.findUnique({ where: { id } });
}

export async function createOption(
  input: CreateOptionInput,
  client?: PrismaClientOrTx,
): Promise<Option> {
  const formDraft = mapNullableJson(input.formDraft);
  const formPublished = mapNullableJson(input.formPublished);

  return withClient(client).option.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      isActive: input.isActive ?? true,
      optionType: input.optionType,
      ...(formDraft !== undefined ? { formDraft } : {}),
      ...(formPublished !== undefined ? { formPublished } : {}),
    },
  });
}

export async function updateOption(
  id: string,
  input: UpdateOptionInput,
  client?: PrismaClientOrTx,
): Promise<Option> {
  const formDraft = mapNullableJson(input.formDraft);
  const formPublished = mapNullableJson(input.formPublished);
  const data: Prisma.OptionUpdateInput = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.optionType !== undefined) data.optionType = input.optionType;
  if (formDraft !== undefined) data.formDraft = formDraft;
  if (formPublished !== undefined) data.formPublished = formPublished;

  return withClient(client).option.update({
    where: { id },
    data,
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
