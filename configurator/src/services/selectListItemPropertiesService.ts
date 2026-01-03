import type { Prisma, PrismaClient, SelectListPropertyType } from "@prisma/client";
import { prisma } from "../prisma/client";
import {
  deleteSelectListItemProperty,
  listSelectListItemProperties,
  renameSelectListItemPropertyKeyForList,
  upsertSelectListItemProperty,
} from "../repositories/selectListItemProperties";

type Client = Prisma.TransactionClient | PrismaClient;

export type SelectListItemPropertyUpdate = {
  itemId: string;
  key: string;
  dataType: SelectListPropertyType;
  value: string | null;
};

export const selectListItemPropertiesService = {
  list: (selectListId: string, client?: Client) => listSelectListItemProperties(selectListId, client),

  bulkSet: async (selectListId: string, updates: SelectListItemPropertyUpdate[], client?: Client) => {
    const run = async (tx: Prisma.TransactionClient) => {
      for (const u of updates) {
        const key = u.key.trim();
        if (!key) continue;
        if (u.value === null || u.value === "") {
          await deleteSelectListItemProperty({ itemId: u.itemId, key }, tx).catch(() => undefined);
          continue;
        }
        await upsertSelectListItemProperty(
          { itemId: u.itemId, key, dataType: u.dataType, value: String(u.value) },
          tx,
        );
      }
    };

    if (client) {
      await run(client as Prisma.TransactionClient);
      return;
    }

    await prisma.$transaction(async (tx) => run(tx));
  },

  renameKeyForList: (selectListId: string, input: { from: string; to: string }, client?: Client) =>
    renameSelectListItemPropertyKeyForList(selectListId, input, client),
};
