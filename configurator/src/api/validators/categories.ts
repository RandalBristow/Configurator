import { z } from "zod";

export const categoryIdParams = z.object({
  id: z.string().uuid(),
});

export const categoryQuery = z.object({
  includeInactive: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => (val === "true" || val === true ? true : val === "false" || val === false ? false : undefined)),
});

export const categoryCreate = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  order: z.number().int().optional(),
  isActive: z.boolean().optional().default(true),
});

export const categoryUpdate = categoryCreate.partial();
