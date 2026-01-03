import {
  createSelectListProperty,
  deleteSelectListProperty,
  listSelectListProperties,
  updateSelectListProperty,
} from "../repositories/selectListProperties";
import type { SelectListPropertyType } from "@prisma/client";
import { prisma } from "../prisma/client";
import {
  deleteSelectListItemPropertiesForListByKey,
  renameSelectListItemPropertyKeyForList,
} from "../repositories/selectListItemProperties";

export const selectListPropertiesService = {
  list: (selectListId: string) => listSelectListProperties(selectListId),
  create: (selectListId: string, data: { key: string; dataType: SelectListPropertyType }) =>
    createSelectListProperty(selectListId, data),
  update: async (
    selectListId: string,
    id: string,
    data: { key?: string; dataType?: SelectListPropertyType },
  ) => {
    const nextData: { key?: string; dataType?: SelectListPropertyType } = { ...data };
    if (typeof nextData.key === "string") nextData.key = nextData.key.trim();

    return prisma.$transaction(async (tx) => {
      const existing = await tx.selectListProperty.findUnique({ where: { id } });
      if (!existing || existing.selectListId !== selectListId) {
        throw new Error("Property not found");
      }
      const updated = await updateSelectListProperty(id, nextData, tx);
      if (nextData.key && nextData.key !== existing.key) {
        await renameSelectListItemPropertyKeyForList(selectListId, { from: existing.key, to: nextData.key }, tx);
      }
      return updated;
    });
  },
  delete: async (selectListId: string, id: string) => {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.selectListProperty.findUnique({ where: { id } });
      if (!existing || existing.selectListId !== selectListId) {
        throw new Error("Property not found");
      }
      await deleteSelectListItemPropertiesForListByKey(selectListId, existing.key, tx);
      await deleteSelectListProperty(id, tx);
    });
  },
};
