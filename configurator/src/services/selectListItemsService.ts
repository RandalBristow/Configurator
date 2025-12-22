import type { Prisma, PrismaClient } from "@prisma/client";
import {
  createSelectListItem,
  deleteSelectListItem,
  getSelectListItemById,
  listSelectListItems,
  updateSelectListItem,
} from "../repositories/selectListItems";

type Client = Prisma.TransactionClient | PrismaClient;

export const selectListItemsService = {
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
    return listSelectListItems(args);
  },

  get: (id: string, client?: Client) => getSelectListItemById(id, client),

  create: (
    input: Parameters<typeof createSelectListItem>[0],
    client?: Client,
  ) => createSelectListItem(input, client),

  update: (
    id: string,
    input: Parameters<typeof updateSelectListItem>[1],
    client?: Client,
  ) => updateSelectListItem(id, input, client),

  delete: (id: string, client?: Client) => deleteSelectListItem(id, client),
};
