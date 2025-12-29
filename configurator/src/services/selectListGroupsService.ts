import {
  createGroup,
  createGroupSet,
  deleteGroup,
  deleteGroupSet,
  getBoundMemberships,
  getMembershipsByGroup,
  listGroupSets,
  setBoundMemberships,
  setGroupMemberships,
  updateGroup,
  updateGroupSet,
} from "../repositories/selectListGroups";

export const selectListGroupsService = {
  listGroupSets: (listId: string) => listGroupSets(listId),
  createGroupSet: (
    listId: string,
    data: { name: string; description?: string | null; boundSelectListId?: string | null },
  ) => createGroupSet(listId, data),
  updateGroupSet: (
    setId: string,
    data: { name?: string; description?: string | null; boundSelectListId?: string | null },
  ) => updateGroupSet(setId, data),
  deleteGroupSet: (setId: string) => deleteGroupSet(setId),
  createGroup: (setId: string, data: { name: string }) => createGroup(setId, data),
  updateGroup: (groupId: string, data: { name?: string }) => updateGroup(groupId, data),
  deleteGroup: (groupId: string) => deleteGroup(groupId),
  listMemberships: (groupId: string) => getMembershipsByGroup(groupId),
  listBoundMemberships: (setId: string, boundItemId: string) =>
    getBoundMemberships(setId, boundItemId),
  setMemberships: (groupId: string, itemIds: string[]) => setGroupMemberships(groupId, itemIds),
  setBoundMemberships: (setId: string, boundItemId: string, itemIds: string[]) =>
    setBoundMemberships(setId, boundItemId, itemIds),
};
