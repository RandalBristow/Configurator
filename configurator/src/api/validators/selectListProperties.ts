import { z } from "zod";

export const selectListIdParams = z.object({
  listId: z.string().uuid(),
});

export const propertyIdParams = z.object({
  listId: z.string().uuid(),
  propertyId: z.string().uuid(),
});

export const selectListPropertyType = z.enum(["string", "number", "boolean", "datetime"]);

export const propertyCreate = z.object({
  key: z.string().trim().min(1),
  dataType: selectListPropertyType,
});

export const propertyUpdate = z.object({
  key: z.string().trim().min(1).optional(),
  dataType: selectListPropertyType.optional(),
});

