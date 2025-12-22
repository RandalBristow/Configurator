import type { Prisma, PrismaClient } from "@prisma/client";
import {
  createOptionListItem,
  deactivateOptionListItem,
  deleteOptionListItem,
  getOptionListItemById,
  listOptionListItems,
  updateOptionListItem,
} from "../repositories/optionListItems";

type Client = Prisma.TransactionClient | PrismaClient;

export const optionListItemsService = {
  list: (opts?: {
    selectListId?: string;
    includeInactive?: boolean;
    client?: Client;
  }) => {
    const args: {
      selectListId?: string;
      includeInactive?: boolean;
      client?: Client;
    } = {};
    if (opts?.selectListId) args.selectListId = opts.selectListId;
    if (opts?.includeInactive !== undefined) args.includeInactive = opts.includeInactive;
    if (opts?.client) args.client = opts.client;
    return listOptionListItems(args);
  },

  get: (id: string, client?: Client) => getOptionListItemById(id, client),

  create: (
    input: Parameters<typeof createOptionListItem>[0],
    client?: Client,
  ) => createOptionListItem(input, client),

  update: (
    id: string,
    input: Parameters<typeof updateOptionListItem>[1],
    client?: Client,
  ) => updateOptionListItem(id, input, client),

  deactivate: (id: string, client?: Client) =>
    deactivateOptionListItem(id, client),

  delete: (id: string, client?: Client) => deleteOptionListItem(id, client),
};
