import {
  createGroup,
  createGroupSet,
  deleteGroup,
  deleteGroupSet,
  getMembershipsByGroup,
  listGroupSets,
  setGroupMemberships,
  updateGroup,
  updateGroupSet,
} from "../repositories/selectListGroups";

export const selectListGroupsService = {
  listGroupSets: (listId: string) => listGroupSets(listId),
  createGroupSet: (listId: string, data: { name: string; description?: string | null }) =>
    createGroupSet(listId, data),
  updateGroupSet: (setId: string, data: { name?: string; description?: string | null }) =>
    updateGroupSet(setId, data),
  deleteGroupSet: (setId: string) => deleteGroupSet(setId),
  createGroup: (setId: string, data: { name: string }) => createGroup(setId, data),
  updateGroup: (groupId: string, data: { name?: string }) => updateGroup(groupId, data),
  deleteGroup: (groupId: string) => deleteGroup(groupId),
  listMemberships: (groupId: string) => getMembershipsByGroup(groupId),
  setMemberships: (groupId: string, itemIds: string[]) => setGroupMemberships(groupId, itemIds),
};
