import { z } from "zod";

export const subcategoryIdParams = z.object({
  id: z.string().uuid(),
});

export const subcategoryQuery = z.object({
  includeInactive: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => (val === "true" || val === true ? true : val === "false" || val === false ? false : undefined)),
  categoryId: z.string().uuid().optional(),
});

export const subcategoryCreate = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const subcategoryUpdate = subcategoryCreate.partial();
