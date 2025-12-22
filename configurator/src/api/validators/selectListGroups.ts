import { z } from "zod";

export const selectListIdParams = z.object({
  listId: z.string().uuid(),
});

export const groupSetIdParams = z.object({
  listId: z.string().uuid(),
  setId: z.string().uuid(),
});

export const groupIdParams = z.object({
  listId: z.string().uuid(),
  setId: z.string().uuid(),
  groupId: z.string().uuid(),
});

export const groupSetCreate = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
});

export const groupSetUpdate = groupSetCreate.partial();

export const groupCreate = z.object({
  name: z.string().min(1),
});

export const groupUpdate = groupCreate.partial();

export const membershipBatch = z.object({
  itemIds: z.array(z.string().uuid()).default([]),
});
