export type Category = {
  id: string;
  name: string;
  description: string;
  order: number;
  isActive: boolean;
};

export type Subcategory = {
  id: string;
  categoryId: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type Option = {
  id: string;
  subcategoryId: string;
  code: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type Attribute = {
  id: string;
  optionId: string;
  key: string;
  label: string;
  dataType: "string" | "number" | "boolean" | "enum" | "range" | "json";
  optionListId?: string | null;
  defaultExpression?: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type OptionList = {
  id: string;
  name: string;
  description?: string | null;
};

export type OptionListItem = {
  id: string;
  optionListId: string;
  value: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
};
