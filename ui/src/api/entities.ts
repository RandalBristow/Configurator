import { api } from "./client";
import type {
  Attribute,
  Category,
  Option,
  SelectList,
  SelectListGroupSet,
  SelectListItem,
  SelectListMembership,
  Subcategory,
} from "../types/domain";

export const categoriesApi = {
  list: (includeInactive?: boolean) =>
    api.get<Category[]>("/categories", { includeInactive }),
  create: (data: Partial<Category>) => api.post<Category>("/categories", data),
  update: (id: string, data: Partial<Category>) =>
    api.put<Category>(`/categories/${id}`, data),
  remove: (id: string) => api.del<Category>(`/categories/${id}`),
  deleteSummary: (id: string) =>
    api.get<{ subcategories: number; options: number; attributes: number }>(
      `/categories/${id}/delete-summary`,
    ),
  activate: (id: string) => api.post<Category>(`/categories/${id}/activate`),
};

export const subcategoriesApi = {
  list: (categoryId?: string, includeInactive?: boolean) =>
    api.get<Subcategory[]>("/subcategories", { categoryId, includeInactive }),
  create: (data: Partial<Subcategory>) =>
    api.post<Subcategory>("/subcategories", data),
  update: (id: string, data: Partial<Subcategory>) =>
    api.put<Subcategory>(`/subcategories/${id}`, data),
  remove: (id: string) => api.del<Subcategory>(`/subcategories/${id}`),
  deleteSummary: (id: string) =>
    api.get<{ options: number; attributes: number }>(`/subcategories/${id}/delete-summary`),
  activate: (id: string) => api.post<Subcategory>(`/subcategories/${id}/activate`),
};

export const optionsApi = {
  list: (subcategoryId?: string, includeInactive?: boolean) =>
    api.get<Option[]>("/options", { subcategoryId, includeInactive }),
  create: (data: Partial<Option>) => api.post<Option>("/options", data),
  update: (id: string, data: Partial<Option>) =>
    api.put<Option>(`/options/${id}`, data),
  remove: (id: string) => api.del<Option>(`/options/${id}`),
  activate: (id: string) => api.post<Option>(`/options/${id}/activate`),
};

export const attributesApi = {
  list: (optionId?: string, includeInactive?: boolean) =>
    api.get<Attribute[]>("/attributes", { optionId, includeInactive }),
  create: (data: Partial<Attribute>) => api.post<Attribute>("/attributes", data),
  update: (id: string, data: Partial<Attribute>) =>
    api.put<Attribute>(`/attributes/${id}`, data),
  remove: (id: string) => api.del<Attribute>(`/attributes/${id}`),
  activate: (id: string) => api.post<Attribute>(`/attributes/${id}/activate`),
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
  createGroupSet: (selectListId: string, data: { name: string; description?: string | null }) =>
    api.post<SelectListGroupSet>(`/select-list-groups/${selectListId}/group-sets`, data),
  createGroup: (selectListId: string, setId: string, data: { name: string }) =>
    api.post(`/select-list-groups/${selectListId}/group-sets/${setId}/groups`, data),
  updateGroup: (selectListId: string, setId: string, groupId: string, data: { name: string }) =>
    api.put(`/select-list-groups/${selectListId}/group-sets/${setId}/groups/${groupId}`, data),
};
