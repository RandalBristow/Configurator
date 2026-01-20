import type { OptionType, Prisma, PrismaClient } from "@prisma/client";
import {
  createOption,
  deactivateOption,
  deleteOption,
  getOptionById,
  listOptions,
  updateOption,
} from "../repositories/options";

type Client = Prisma.TransactionClient | PrismaClient;

export const optionsService = {
  list: (opts?: {
    optionType?: OptionType;
    includeInactive?: boolean;
    client?: Client;
  }) => {
    const args: {
      optionType?: OptionType;
      includeInactive?: boolean;
      client?: Client;
    } = {};
    if (opts?.optionType) args.optionType = opts.optionType;
    if (opts?.includeInactive !== undefined) args.includeInactive = opts.includeInactive;
    if (opts?.client) args.client = opts.client;
    return listOptions(args);
  },

  get: (id: string, client?: Client) => getOptionById(id, client),

  create: (input: Parameters<typeof createOption>[0], client?: Client) =>
    createOption(input, client),

  update: (id: string, input: Parameters<typeof updateOption>[1], client?: Client) =>
    updateOption(id, input, client),

  deactivate: (id: string, client?: Client) => deactivateOption(id, client),

  // Deactivate an option and its variables.
  deactivateDeep: async (id: string, client?: PrismaClient) => {
    const prismaClient = client ?? (await import("../prisma/client")).prisma;
    return prismaClient.$transaction(async (tx) => {
      await tx.variable.updateMany({
        where: { optionId: id },
        data: { isActive: false },
      });

      return tx.option.update({
        where: { id },
        data: { isActive: false },
      });
    });
  },

  activate: async (id: string, client?: PrismaClient) => {
    const prismaClient = client ?? (await import("../prisma/client")).prisma;
    return prismaClient.$transaction(async (tx) => {
      await tx.variable.updateMany({
        where: { optionId: id },
        data: { isActive: true },
      });

      return tx.option.update({
        where: { id },
        data: { isActive: true },
      });
    });
  },
  delete: (id: string, client?: Client) => deleteOption(id, client),
};
