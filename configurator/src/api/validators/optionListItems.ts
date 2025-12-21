import { z } from "zod";

export const optionListItemIdParams = z.object({
  id: z.string().uuid(),
});

export const optionListItemQuery = z.object({
  includeInactive: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => (val === "true" || val === true ? true : val === "false" || val === false ? false : undefined)),
  optionListId: z.string().uuid().optional(),
});

export const optionListItemCreate = z.object({
  optionListId: z.string().uuid(),
  value: z.string().min(1),
  label: z.string().min(1),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const optionListItemUpdate = optionListItemCreate.partial();
