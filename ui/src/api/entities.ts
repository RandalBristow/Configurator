import { api } from "./client";
import type {
  Attribute,
  Category,
  Option,
  OptionList,
  OptionListItem,
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

export const optionListsApi = {
  list: () => api.get<OptionList[]>("/option-lists"),
  create: (data: Partial<OptionList>) => api.post<OptionList>("/option-lists", data),
  update: (id: string, data: Partial<OptionList>) =>
    api.put<OptionList>(`/option-lists/${id}`, data),
  remove: (id: string) => api.del<OptionList>(`/option-lists/${id}`),
};

export const optionListItemsApi = {
  list: (optionListId?: string, includeInactive?: boolean) =>
    api.get<OptionListItem[]>("/option-list-items", { optionListId, includeInactive }),
  create: (data: Partial<OptionListItem>) =>
    api.post<OptionListItem>("/option-list-items", data),
  update: (id: string, data: Partial<OptionListItem>) =>
    api.put<OptionListItem>(`/option-list-items/${id}`, data),
  remove: (id: string) => api.del<OptionListItem>(`/option-list-items/${id}`),
};
