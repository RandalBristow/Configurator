import { z } from "zod";

export const optionIdParams = z.object({
  id: z.string().uuid(),
});

export const optionQuery = z.object({
  includeInactive: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => (val === "true" || val === true ? true : val === "false" || val === false ? false : undefined)),
  subcategoryId: z.string().uuid().optional(),
});

export const optionCreate = z.object({
  subcategoryId: z.string().uuid(),
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const optionUpdate = optionCreate.partial();
