import type { DesignerFormDefinition } from "./designer";

export type OptionType = "simple" | "configured";

export type Option = {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  optionType: OptionType;
  formDraft?: DesignerFormDefinition | null;
  formPublished?: DesignerFormDefinition | null;
};

export type VariableDataType =
  | "string"
  | "number"
  | "boolean"
  | "datetime"
  | "stringArray"
  | "numberArray"
  | "booleanArray"
  | "datetimeArray"
  | "collection";

export type Variable = {
  id: string;
  optionId?: string | null;
  ownerKey: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  dataType: VariableDataType;
  defaultValue?: unknown | null;
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
