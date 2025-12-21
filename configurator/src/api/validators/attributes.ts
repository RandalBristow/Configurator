import { z } from "zod";

export const attributeIdParams = z.object({
  id: z.string().uuid(),
});

export const attributeQuery = z.object({
  includeInactive: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => (val === "true" || val === true ? true : val === "false" || val === false ? false : undefined)),
  optionId: z.string().uuid().optional(),
});

export const attributeCreate = z.object({
  optionId: z.string().uuid(),
  key: z.string().min(1),
  label: z.string().min(1),
  dataType: z.enum(["string", "number", "boolean", "enum", "range", "json"]),
  optionListId: z.string().uuid().nullable().optional(),
  defaultExpression: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const attributeUpdate = attributeCreate.partial();
