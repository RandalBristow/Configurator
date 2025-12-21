import type { Prisma, PrismaClient } from "@prisma/client";
import {
  createOptionList,
  deleteOptionList,
  getOptionListById,
  listOptionLists,
  updateOptionList,
} from "../repositories/optionLists";

type Client = Prisma.TransactionClient | PrismaClient;

export const optionListsService = {
  list: (client?: Client) => listOptionLists(client),

  get: (id: string, client?: Client) => getOptionListById(id, client),

  create: (input: Parameters<typeof createOptionList>[0], client?: Client) =>
    createOptionList(input, client),

  update: (
    id: string,
    input: Parameters<typeof updateOptionList>[1],
    client?: Client,
  ) => updateOptionList(id, input, client),

  delete: (id: string, client?: Client) => deleteOptionList(id, client),
};
