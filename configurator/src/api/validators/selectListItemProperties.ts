import { z } from "zod";

export const selectListIdParams = z.object({
  selectListId: z.string().uuid(),
});

export const selectListPropertyType = z.enum(["string", "number", "boolean", "datetime"]);

export const bulkSetBody = z.object({
  updates: z.array(
    z.object({
      itemId: z.string().uuid(),
      key: z.string().trim().min(1),
      dataType: selectListPropertyType,
      value: z.string().nullable(),
    }),
  ),
});

