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
  selectListId?: string | null;
  defaultExpression?: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type SelectList = {
  id: string;
  name: string;
  description?: string | null;
};

export type SelectListPropertyType = "string" | "number" | "boolean" | "datetime";

export type SelectListProperty = {
  id: string;
  selectListId: string;
  key: string;
  dataType: SelectListPropertyType;
};

export type SelectListItemProperty = {
  id: string;
  itemId: string;
  key: string;
  value: string;
  dataType: SelectListPropertyType;
  createdAt: string;
  updatedAt: string;
};

export type SelectListItem = {
  id: string;
  selectListId: string;
  value: string;
  displayValue: string;
  order: number;
  isActive: boolean;
  tooltip?: string | null;
  comments?: string | null;
};

export type SelectListGroup = {
  id: string;
  setId: string;
  name: string;
};

export type SelectListGroupSet = {
  id: string;
  selectListId: string;
  name: string;
  description?: string | null;
  boundSelectListId?: string | null;
  groups: SelectListGroup[];
};

export type SelectListMembership = {
  itemId: string;
  groupId?: string;
  boundItemId?: string;
  groupSetId?: string;
};

export type LookupTableDataType = "string" | "number" | "boolean" | "datetime";

export type LookupTable = {
  id: string;
  name: string;
  description?: string | null;
};

export type LookupTableColumn = {
  id: string;
  tableId: string;
  name: string;
  dataType: LookupTableDataType;
  sortOrder: number;
};

export type LookupTableRow = {
  id: string;
  tableId: string;
  sortOrder: number;
  values: Record<string, string | number | boolean | null>;
};
