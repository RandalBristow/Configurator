import { api } from "./client";
import type {
  LookupTable,
  LookupTableColumn,
  LookupTableRow,
  Option,
  OptionType,
  SelectList,
  SelectListGroupSet,
  SelectListItem,
  SelectListItemProperty,
  SelectListMembership,
  SelectListProperty,
  Variable,
} from "../types/domain";

export const optionsApi = {
  list: (optionType?: OptionType, includeInactive?: boolean) =>
    api.get<Option[]>("/options", { optionType, includeInactive }),
  get: (id: string) => api.get<Option>(`/options/${id}`),
  create: (data: Partial<Option>) => api.post<Option>("/options", data),
  update: (id: string, data: Partial<Option>) =>
    api.put<Option>(`/options/${id}`, data),
  remove: (id: string) => api.del<Option>(`/options/${id}`),
  activate: (id: string) => api.post<Option>(`/options/${id}/activate`),
};

export const variablesApi = {
  list: (optionId?: string, includeInactive?: boolean) =>
    api.get<Variable[]>("/variables", { optionId, includeInactive }),
  create: (data: Partial<Variable>) => api.post<Variable>("/variables", data),
  update: (id: string, data: Partial<Variable>) =>
    api.put<Variable>(`/variables/${id}`, data),
  remove: (id: string) => api.del<Variable>(`/variables/${id}`),
  activate: (id: string) => api.post<Variable>(`/variables/${id}/activate`),
};

export const selectListsApi = {
  list: () => api.get<SelectList[]>("/select-lists"),
  create: (data: Partial<SelectList>) => api.post<SelectList>("/select-lists", data),
  update: (id: string, data: Partial<SelectList>) => api.put<SelectList>(`/select-lists/${id}`, data),
  remove: (id: string) => api.del<SelectList>(`/select-lists/${id}`),
};

export const selectListItemsApi = {
  list: (selectListId?: string, includeInactive?: boolean) =>
    api.get<SelectListItem[]>("/select-list-items", { selectListId, includeInactive }),
  create: (data: Partial<SelectListItem>) => api.post<SelectListItem>("/select-list-items", data),
  update: (id: string, data: Partial<SelectListItem>) => api.put<SelectListItem>(`/select-list-items/${id}`, data),
  remove: (id: string) => api.del<SelectListItem>(`/select-list-items/${id}`),
};

export const selectListGroupsApi = {
  listGroupSets: (selectListId: string) =>
    api.get<SelectListGroupSet[]>(`/select-list-groups/${selectListId}/group-sets`),
  listMemberships: (selectListId: string, groupId: string) =>
    api.get<SelectListMembership[]>(`/select-list-groups/${selectListId}/groups/${groupId}/memberships`),
  setMemberships: (selectListId: string, groupId: string, itemIds: string[]) =>
    api.post<void>(`/select-list-groups/${selectListId}/groups/${groupId}/memberships`, { itemIds }),
  listBoundMemberships: (selectListId: string, setId: string, boundItemId: string) =>
    api.get<SelectListMembership[]>(
      `/select-list-groups/${selectListId}/group-sets/${setId}/bound-items/${boundItemId}/memberships`,
    ),
  setBoundMemberships: (selectListId: string, setId: string, boundItemId: string, itemIds: string[]) =>
    api.post<void>(
      `/select-list-groups/${selectListId}/group-sets/${setId}/bound-items/${boundItemId}/memberships`,
      { itemIds },
    ),
  createGroupSet: (
    selectListId: string,
    data: { name: string; description?: string | null; boundSelectListId?: string | null },
  ) =>
    api.post<SelectListGroupSet>(`/select-list-groups/${selectListId}/group-sets`, data),
  createGroup: (selectListId: string, setId: string, data: { name: string }) =>
    api.post(`/select-list-groups/${selectListId}/group-sets/${setId}/groups`, data),
  updateGroup: (selectListId: string, setId: string, groupId: string, data: { name: string }) =>
    api.put(`/select-list-groups/${selectListId}/group-sets/${setId}/groups/${groupId}`, data),
  updateGroupSet: (
    selectListId: string,
    setId: string,
    data: { name?: string; description?: string | null; boundSelectListId?: string | null },
  ) =>
    api.put(`/select-list-groups/${selectListId}/group-sets/${setId}`, data),
  removeGroupSet: (selectListId: string, setId: string) =>
    api.del(`/select-list-groups/${selectListId}/group-sets/${setId}`),
  removeGroup: (selectListId: string, setId: string, groupId: string) =>
    api.del(`/select-list-groups/${selectListId}/group-sets/${setId}/groups/${groupId}`),
};

export const selectListPropertiesApi = {
  list: (selectListId: string) =>
    api.get<SelectListProperty[]>(`/select-list-properties/${selectListId}/properties`),
  create: (selectListId: string, data: { key: string; dataType: SelectListProperty["dataType"] }) =>
    api.post<SelectListProperty>(`/select-list-properties/${selectListId}/properties`, data),
  update: (
    selectListId: string,
    propertyId: string,
    data: Partial<Pick<SelectListProperty, "key" | "dataType">>,
  ) => api.put<SelectListProperty>(`/select-list-properties/${selectListId}/properties/${propertyId}`, data),
  remove: (selectListId: string, propertyId: string) =>
    api.del<void>(`/select-list-properties/${selectListId}/properties/${propertyId}`),
};

export const selectListItemPropertiesApi = {
  list: (selectListId: string) =>
    api.get<SelectListItemProperty[]>(`/select-list-item-properties/${selectListId}`),
  bulkSet: (
    selectListId: string,
    updates: Array<{
      itemId: string;
      key: string;
      dataType: SelectListProperty["dataType"];
      value: string | null;
    }>,
  ) => api.post<void>(`/select-list-item-properties/${selectListId}/bulk`, { updates }),
};

export const lookupTablesApi = {
  list: () => api.get<LookupTable[]>("/lookup-tables"),
  create: (data: Partial<LookupTable>) => api.post<LookupTable>("/lookup-tables", data),
  update: (tableId: string, data: Partial<LookupTable>) =>
    api.put<LookupTable>(`/lookup-tables/${tableId}`, data),
  remove: (tableId: string) => api.del<LookupTable>(`/lookup-tables/${tableId}`),

  listColumns: (tableId: string) => api.get<LookupTableColumn[]>(`/lookup-tables/${tableId}/columns`),
  createColumn: (tableId: string, data: Partial<LookupTableColumn>) =>
    api.post<LookupTableColumn>(`/lookup-tables/${tableId}/columns`, data),
  updateColumn: (tableId: string, columnId: string, data: Partial<LookupTableColumn>) =>
    api.put<LookupTableColumn>(`/lookup-tables/${tableId}/columns/${columnId}`, data),
  removeColumn: (tableId: string, columnId: string) =>
    api.del<void>(`/lookup-tables/${tableId}/columns/${columnId}`),

  listRows: (tableId: string) => api.get<LookupTableRow[]>(`/lookup-tables/${tableId}/rows`),
  createRow: (tableId: string, data: Partial<LookupTableRow>) =>
    api.post<LookupTableRow>(`/lookup-tables/${tableId}/rows`, data),
  createRowsBulk: (
    tableId: string,
    rows: Array<{ values: LookupTableRow["values"]; sortOrder?: number }>,
  ) =>
    api.post<{
      inserted: number;
      skippedBlank: number;
      skippedDuplicateInRequest: number;
      skippedExisting: number;
    }>(`/lookup-tables/${tableId}/rows/bulk`, { rows }),
  updateRow: (tableId: string, rowId: string, data: Partial<LookupTableRow>) =>
    api.put<LookupTableRow>(`/lookup-tables/${tableId}/rows/${rowId}`, data),
  removeRow: (tableId: string, rowId: string) => api.del<void>(`/lookup-tables/${tableId}/rows/${rowId}`),
};
