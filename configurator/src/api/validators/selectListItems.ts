import { z } from "zod";

export const selectListItemIdParams = z.object({
  id: z.string().uuid(),
});

export const selectListItemQuery = z.object({
  includeInactive: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => (val === "true" || val === true ? true : val === "false" || val === false ? false : undefined)),
  selectListId: z.string().uuid().optional(),
});

export const selectListItemCreate = z.object({
  selectListId: z.string().uuid(),
  value: z.string().min(1),
  displayValue: z.string().min(1),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
  tooltip: z.string().nullable().optional(),
  comments: z.string().nullable().optional(),
});

export const selectListItemUpdate = selectListItemCreate.partial();
