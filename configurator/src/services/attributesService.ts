import type { Prisma, PrismaClient } from "@prisma/client";
import {
  createAttribute,
  deactivateAttribute,
  deleteAttribute,
  getAttributeById,
  listAttributes,
  updateAttribute,
} from "../repositories/attributes";

type Client = Prisma.TransactionClient | PrismaClient;

export const attributesService = {
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
    return listAttributes(args);
  },

  get: (id: string, client?: Client) => getAttributeById(id, client),

  create: (input: Parameters<typeof createAttribute>[0], client?: Client) =>
    createAttribute(input, client),

  update: (
    id: string,
    input: Parameters<typeof updateAttribute>[1],
    client?: Client,
  ) => updateAttribute(id, input, client),

  deactivate: (id: string, client?: Client) => deactivateAttribute(id, client),

  activate: async (id: string, client?: PrismaClient) => {
    const prismaClient = client ?? (await import("../prisma/client")).prisma;
    return prismaClient.attribute.update({
      where: { id },
      data: { isActive: true },
    });
  },

  delete: (id: string, client?: Client) => deleteAttribute(id, client),
};
