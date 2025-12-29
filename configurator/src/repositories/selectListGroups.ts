import type {
  Prisma,
  PrismaClient,
  SelectListGroup,
  SelectListGroupSet,
  SelectListItemGroup,
  SelectListBoundMembership,
} from "@prisma/client";
import { prisma as defaultPrisma } from "../prisma/client";

type PrismaClientOrTx = Prisma.TransactionClient | PrismaClient;
const withClient = (client?: PrismaClientOrTx) => client ?? defaultPrisma;

export async function listGroupSets(selectListId: string, client?: PrismaClientOrTx) {
  return withClient(client).selectListGroupSet.findMany({
    where: { selectListId },
    include: { groups: true },
    orderBy: [{ name: "asc" }],
  });
}

export async function createGroupSet(
  selectListId: string,
  input: { name: string; description?: string | null; boundSelectListId?: string | null },
  client?: PrismaClientOrTx,
): Promise<SelectListGroupSet> {
  return withClient(client).selectListGroupSet.create({
    data: {
      selectListId,
      name: input.name,
      description: input.description ?? null,
      boundSelectListId: input.boundSelectListId ?? null,
    },
  });
}

export async function updateGroupSet(
  setId: string,
  input: { name?: string; description?: string | null; boundSelectListId?: string | null },
  client?: PrismaClientOrTx,
): Promise<SelectListGroupSet> {
  return withClient(client).selectListGroupSet.update({
    where: { id: setId },
    data: { ...input },
  });
}

export async function deleteGroupSet(setId: string, client?: PrismaClientOrTx) {
  return withClient(client).selectListGroupSet.delete({ where: { id: setId } });
}

export async function createGroup(
  setId: string,
  input: { name: string },
  client?: PrismaClientOrTx,
): Promise<SelectListGroup> {
  return withClient(client).selectListGroup.create({
    data: { setId, name: input.name },
  });
}

export async function updateGroup(
  groupId: string,
  input: { name?: string },
  client?: PrismaClientOrTx,
): Promise<SelectListGroup> {
  return withClient(client).selectListGroup.update({
    where: { id: groupId },
    data: { ...input },
  });
}

export async function deleteGroup(groupId: string, client?: PrismaClientOrTx) {
  return withClient(client).selectListGroup.delete({ where: { id: groupId } });
}

export async function getMembershipsByGroup(
  groupId: string,
  client?: PrismaClientOrTx,
): Promise<SelectListItemGroup[]> {
  return withClient(client).selectListItemGroup.findMany({
    where: { groupId },
    select: { itemId: true, groupId: true },
  });
}

export async function getBoundMemberships(
  setId: string,
  boundItemId: string,
  client?: PrismaClientOrTx,
): Promise<SelectListBoundMembership[]> {
  return withClient(client).selectListBoundMembership.findMany({
    where: { groupSetId: setId, boundItemId },
    select: { itemId: true, boundItemId: true, groupSetId: true },
  });
}

export async function setGroupMemberships(
  groupId: string,
  itemIds: string[],
  client?: PrismaClientOrTx,
) {
  return defaultPrisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.selectListItemGroup.deleteMany({ where: { groupId } });
    if (itemIds.length === 0) return;
    await tx.selectListItemGroup.createMany({
      data: itemIds.map((itemId) => ({ itemId, groupId })),
      skipDuplicates: true,
    });
  });
}

export async function setBoundMemberships(
  setId: string,
  boundItemId: string,
  itemIds: string[],
  client?: PrismaClientOrTx,
) {
  return defaultPrisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.selectListBoundMembership.deleteMany({
      where: { groupSetId: setId, boundItemId },
    });
    if (itemIds.length === 0) return;
    await tx.selectListBoundMembership.createMany({
      data: itemIds.map((itemId) => ({
        itemId,
        boundItemId,
        groupSetId: setId,
      })),
      skipDuplicates: true,
    });
  });
}
