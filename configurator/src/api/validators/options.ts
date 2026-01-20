import { z } from "zod";

const optionTypeEnum = z.enum(["simple", "configured"]);

export const optionIdParams = z.object({
  id: z.string().uuid(),
});

export const optionQuery = z.object({
  includeInactive: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => (val === "true" || val === true ? true : val === "false" || val === false ? false : undefined)),
  optionType: optionTypeEnum.optional(),
});

export const optionCreate = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  optionType: optionTypeEnum,
  formDraft: z.unknown().nullable().optional(),
  formPublished: z.unknown().nullable().optional(),
});

export const optionUpdate = optionCreate.partial();
