import type { Prisma, PrismaClient } from "@prisma/client";
import {
  createVariable,
  deactivateVariable,
  deleteVariable,
  getVariableById,
  listVariables,
  updateVariable,
  variableOwnerKeys,
} from "../repositories/variables";

type Client = Prisma.TransactionClient | PrismaClient;

type VariableInput = Parameters<typeof createVariable>[0];
type VariableUpdateInput = Parameters<typeof updateVariable>[1];

const normalizeName = (value: string) => value.trim();

const findGlobalByName = async (
  name: string,
  client?: Client,
  excludeId?: string,
) => {
  const prismaClient = client ?? (await import("../prisma/client")).prisma;
  return prismaClient.variable.findFirst({
    where: {
      optionId: null,
      ownerKey: variableOwnerKeys.GLOBAL,
      name: { equals: name, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
};

const findOptionByName = async (
  name: string,
  optionId?: string,
  client?: Client,
  excludeId?: string,
) => {
  const prismaClient = client ?? (await import("../prisma/client")).prisma;
  return prismaClient.variable.findFirst({
    where: {
      ...(optionId ? { optionId } : { optionId: { not: null } }),
      name: { equals: name, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
};

const enforceUniqueness = async (
  name: string,
  optionId: string | undefined,
  client?: Client,
  excludeId?: string,
) => {
  const trimmed = normalizeName(name);
  if (!trimmed) throw new Error("Name is required");

  if (optionId) {
    const existingOption = await findOptionByName(trimmed, optionId, client, excludeId);
    if (existingOption) {
      throw new Error("Variable name must be unique for this option.");
    }
    const globalConflict = await findGlobalByName(trimmed, client, excludeId);
    if (globalConflict) {
      throw new Error("Variable name conflicts with a global variable.");
    }
  } else {
    const existingGlobal = await findGlobalByName(trimmed, client, excludeId);
    if (existingGlobal) {
      throw new Error("Global variable name must be unique.");
    }
    const optionConflict = await findOptionByName(trimmed, undefined, client);
    if (optionConflict) {
      throw new Error("Global variable name conflicts with an option variable.");
    }
  }
};

export const variablesService = {
  list: (opts?: {
    optionId?: string;
    includeInactive?: boolean;
    client?: Client;
  }) => {
    const args: {
      optionId?: string;
      includeInactive?: boolean;
      client?: Client;
    } = {};
    if (opts?.optionId) args.optionId = opts.optionId;
    if (opts?.includeInactive !== undefined) args.includeInactive = opts.includeInactive;
    if (opts?.client) args.client = opts.client;
    return listVariables(args);
  },

  get: (id: string, client?: Client) => getVariableById(id, client),

  create: async (input: VariableInput, client?: Client) => {
    const trimmed = normalizeName(input.name);
    await enforceUniqueness(trimmed, input.optionId ?? undefined, client);
    return createVariable(
      {
        ...input,
        name: trimmed,
      },
      client,
    );
  },

  update: async (id: string, input: VariableUpdateInput, client?: Client) => {
    const prismaClient = client ?? (await import("../prisma/client")).prisma;
    const existing = await prismaClient.variable.findUnique({ where: { id } });
    if (!existing) throw new Error("Variable not found");

    if (input.name !== undefined) {
      const trimmed = normalizeName(input.name);
      await enforceUniqueness(trimmed, existing.optionId ?? undefined, client, id);
      input = { ...input, name: trimmed };
    }

    return updateVariable(id, input, client);
  },

  deactivate: (id: string, client?: Client) => deactivateVariable(id, client),

  activate: async (id: string, client?: PrismaClient) => {
    const prismaClient = client ?? (await import("../prisma/client")).prisma;
    return prismaClient.variable.update({
      where: { id },
      data: { isActive: true },
    });
  },

  delete: (id: string, client?: Client) => deleteVariable(id, client),
};
