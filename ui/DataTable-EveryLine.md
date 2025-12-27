# 📘 DataTable.tsx Fully Annotated (Every Line)

> This is the “every single line gets a note” version. It’s long on purpose. 🙂

## Legend
- `L###` line number from the source file
- Code is shown exactly as-is
- Notes explain what the line does and why it exists

---

### L001
```tsx
import { useEffect, useMemo, useRef, useState } from "react";
```
✅ Imports React hooks used for state, memoization, refs, and effects.

### L002
```tsx
import { Filter, X } from "lucide-react";
```
✅ Imports icon components used in the header filter button and popover close button.

### L003
```tsx

```
✅ Blank line (spacing for readability).

### L004
```tsx
export type DataGridColumn<T> = {
```
✅ Declares and exports a TypeScript type so other files can reuse it.

### L005
```tsx
  key: keyof T;
```
✅ Uses `keyof T` to restrict keys to real properties on the row type `T` (TypeScript safety).

### L006
```tsx
  header: string;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L007
```tsx
  type: "string" | "number" | "boolean" | "datetime";
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L008
```tsx
  width?: number;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L009
```tsx
  align?: "left" | "center" | "right";
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L010
```tsx
  enableSort?: boolean;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L011
```tsx
  filterLabel?: (value: any, row?: T) => string;
```
✅ Chooses a friendly display label if provided; otherwise uses the raw string value.

### L012
```tsx
};
```
✅ Closes a block/scope (function, object, callback, or JSX expression).

### L013
```tsx

```
✅ Blank line (spacing for readability).

### L014
```tsx
type DataGridProps<T> = {
```
✅ Declares a TypeScript type used internally in this file.

### L015
```tsx
  columns: DataGridColumn<T>[];
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L016
```tsx
  rows: T[];
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L017
```tsx
  getRowId: (row: T) => string;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L018
```tsx
  selectedIds?: Set<string>;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L019
```tsx
  onToggleSelect?: (id: string) => void;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L020
```tsx
  onToggleSelectAll?: (ids: string[]) => void;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L021
```tsx
  onRowChange: (id: string, key: keyof T, value: any) => void;
```
✅ Uses `keyof T` to restrict keys to real properties on the row type `T` (TypeScript safety).

### L022
```tsx
  newRow: Partial<T>;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L023
```tsx
  onNewRowChange: (key: keyof T, value: any) => void;
```
✅ Uses `keyof T` to restrict keys to real properties on the row type `T` (TypeScript safety).

### L024
```tsx
  onFocusSelectAll?: (e: React.FocusEvent<HTMLInputElement>) => void;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L025
```tsx
  newRowRef?: React.RefObject<HTMLTableRowElement | null>;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L026
```tsx
  newRowFirstInputRef?: React.RefObject<HTMLInputElement | null>;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L027
```tsx
  onNewRowBlur?: (e: React.FocusEvent<HTMLTableRowElement>) => void;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L028
```tsx
  enableSelection?: boolean;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L029
```tsx
  enableFilters?: boolean;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L030
```tsx
  enableSorting?: boolean;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L031
```tsx
};
```
✅ Closes a block/scope (function, object, callback, or JSX expression).

### L032
```tsx

```
✅ Blank line (spacing for readability).

### L033
```tsx
type SortState<T> = { key: keyof T; dir: "asc" | "desc" } | null;
```
✅ Declares a TypeScript type used internally in this file.

### L034
```tsx

```
✅ Blank line (spacing for readability).

### L035
```tsx
export function DataGrid<T>({
```
✅ Defines the generic `DataGrid<T>` React component.

### L036
```tsx
  columns,
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L037
```tsx
  rows,
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L038
```tsx
  getRowId,
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L039
```tsx
  selectedIds,
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L040
```tsx
  onToggleSelect,
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L041
```tsx
  onToggleSelectAll,
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L042
```tsx
  onRowChange,
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L043
```tsx
  newRow,
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L044
```tsx
  onNewRowChange,
```
✅ Wires the new-row draft input to the parent’s `onNewRowChange` handler.

### L045
```tsx
  onFocusSelectAll,
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L046
```tsx
  newRowRef,
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L047
```tsx
  newRowFirstInputRef,
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L048
```tsx
  onNewRowBlur,
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L049
```tsx
  enableSelection = true,
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L050
```tsx
  enableFilters = true,
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L051
```tsx
  enableSorting = true,
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L052
```tsx
}: DataGridProps<T>) {
```
✅ Ends a destructured parameter list and applies the TypeScript type annotation.

### L053
```tsx
  const [sort, setSort] = useState<SortState<T>>(null);
```
✅ Creates local state for the current sort (column + direction), initially none.

### L054
```tsx
  const [filters, setFilters] = useState<Record<string, { text: string; values: string[] }>>({});
```
✅ Creates local state for per-column filters (text + selected values).

### L055
```tsx
  const [filterMenu, setFilterMenu] = useState<{
```
✅ Creates local state for the currently open filter popover (draft UI state).

### L056
```tsx
    colKey: string;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L057
```tsx
    title: string;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L058
```tsx
    position: { x: number; y: number };
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L059
```tsx
    values: { value: string; label: string }[];
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L060
```tsx
    draft: { text: string; values: Set<string> };
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L061
```tsx
  } | null>(null);
```
✅ Closes the current JSX/TS block.

### L062
```tsx
  const filterPopoverRef = useRef<HTMLDivElement | null>(null);
```
✅ Creates a ref to hold a DOM node so we can detect clicks outside the popover.

### L063
```tsx

```
✅ Blank line (spacing for readability).

### L064
```tsx
  const sortedFilteredRows = useMemo(() => {
```
✅ Starts a memoized computation so filtering/sorting only recalculates when dependencies change.

### L065
```tsx
    let data = rows;
```
✅ Starts with the raw `rows` array; filtering/sorting will produce a derived view.

### L066
```tsx
    if (enableFilters) {
```
✅ Only apply filtering if the feature flag is enabled.

### L067
```tsx
      data = data.filter((row) => {
```
✅ Filters rows down to those that match the active column filters.

### L068
```tsx
        return columns.every((col) => {
```
✅ Enforces AND logic: the row must satisfy every column’s filter to stay visible.

### L069
```tsx
          const filterValue = filters[String(col.key)];
```
✅ Looks up the saved filter state for this column (keyed by the column key).

### L070
```tsx
          if (!filterValue) return true;
```
✅ No filter for this column, so this column does not block the row.

### L071
```tsx
          const text = filterValue.text.trim().toLowerCase();
```
✅ Normalizes the typed filter text for case-insensitive matching.

### L072
```tsx
          const values = filterValue.values ?? [];
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L073
```tsx
          const cell = (row as any)[col.key];
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L074
```tsx
          const value = cell === null || cell === undefined ? "" : String(cell);
```
✅ Converts null/undefined cell values into an empty string so string operations are safe.

### L075
```tsx
          const target = value.toLowerCase();
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L076
```tsx
          if (text && !target.includes(text)) return false;
```
✅ Implements the “contains” text filter check.

### L077
```tsx
          if (values.length && !values.some((v) => v.toLowerCase() === target)) return false;
```
✅ Implements the multi-select filter: cell must equal one of the selected values.

### L078
```tsx
          return true;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L079
```tsx
        });
```
✅ Closes a block/scope (function, object, callback, or JSX expression).

### L080
```tsx
      });
```
✅ Closes a block/scope (function, object, callback, or JSX expression).

### L081
```tsx
    }
```
✅ Closes a block/scope (function, object, callback, or JSX expression).

### L082
```tsx
    if (enableSorting && sort) {
```
✅ Only apply sorting if enabled and a sort state is currently set.

### L083
```tsx
      const { key, dir } = sort;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L084
```tsx
      const col = columns.find((c) => c.key === key);
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L085
```tsx
      data = [...data].sort((a, b) => {
```
✅ Copies the array before sorting because `sort()` mutates; avoids mutating props.

### L086
```tsx
        const av = (a as any)[key];
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L087
```tsx
        const bv = (b as any)[key];
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L088
```tsx
        if (av === bv) return 0;
```
✅ If the two values are equal, keep their relative order (comparator returns 0).

### L089
```tsx
        if (av === undefined || av === null) return dir === "asc" ? -1 : 1;
```
✅ Special-cases null/undefined so empty cells sort consistently.

### L090
```tsx
        if (bv === undefined || bv === null) return dir === "asc" ? 1 : -1;
```
✅ Special-cases null/undefined so empty cells sort consistently.

### L091
```tsx
        if (col?.type === "number") return dir === "asc" ? av - bv : bv - av;
```
✅ Numeric sort: subtract values so numbers sort numerically (not lexicographically).

### L092
```tsx
        if (col?.type === "boolean") return dir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
```
✅ Boolean sort: converts to 0/1 so false comes before true (or reversed).

### L093
```tsx
        if (col?.type === "datetime") {
```
✅ Datetime sort branch: compares dates by epoch milliseconds.

### L094
```tsx
          const ad = new Date(av).getTime();
```
✅ Converts date-like values into milliseconds since epoch for sortable numeric comparison.

### L095
```tsx
          const bd = new Date(bv).getTime();
```
✅ Converts date-like values into milliseconds since epoch for sortable numeric comparison.

### L096
```tsx
          if (!Number.isNaN(ad) && !Number.isNaN(bd)) return dir === "asc" ? ad - bd : bd - ad;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L097
```tsx
        }
```
✅ Closes a block/scope (function, object, callback, or JSX expression).

### L098
```tsx
        return dir === "asc"
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L099
```tsx
          ? String(av).localeCompare(String(bv))
```
✅ Fallback string sort using locale-aware comparison for predictable ordering.

### L100
```tsx
          : String(bv).localeCompare(String(av));
```
✅ Fallback string sort using locale-aware comparison for predictable ordering.

### L101
```tsx
      });
```
✅ Closes a block/scope (function, object, callback, or JSX expression).

### L102
```tsx
    }
```
✅ Closes a block/scope (function, object, callback, or JSX expression).

### L103
```tsx
    return data;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L104
```tsx
  }, [rows, columns, filters, sort, enableFilters, enableSorting]);
```
✅ Dependency list: recompute memo/effect when any listed value changes.

### L105
```tsx

```
✅ Blank line (spacing for readability).

### L106
```tsx
  const closeFilterMenu = () => setFilterMenu(null);
```
✅ Helper to close the filter popover by clearing `filterMenu` state.

### L107
```tsx

```
✅ Blank line (spacing for readability).

### L108
```tsx
  const openFilterMenu = (colKey: string, title: string, eventTarget: HTMLElement) => {
```
✅ Opens the filter popover for a specific column and builds its UI data (unique values, position).

### L109
```tsx
    const col = columns.find((c) => String(c.key) === colKey);
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L110
```tsx
    if (!col) return;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L111
```tsx
    const current = filters[colKey] ?? { text: "", values: [] };
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L112
```tsx
    const rect = eventTarget.getBoundingClientRect();
```
✅ Reads the clicked button’s screen coordinates to position the popover nearby.

### L113
```tsx
    const popWidth = 260;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L114
```tsx
    const popHeight = 300;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L115
```tsx
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - popWidth - 8);
```
✅ Clamps the popover position to stay within the viewport (prevents off-screen popover).

### L116
```tsx
    const top = Math.min(Math.max(8, rect.bottom + 4), window.innerHeight - popHeight);
```
✅ Clamps the popover position to stay within the viewport (prevents off-screen popover).

### L117
```tsx

```
✅ Blank line (spacing for readability).

### L118
```tsx
    const uniques = new Map<string, string>();
```
✅ Uses a Map to collect unique values for the checkbox list (prevents duplicates).

### L119
```tsx
    rows.forEach((r) => {
```
✅ Scans all rows to build the set of distinct values for this column’s checkbox filter.

### L120
```tsx
      const raw = (r as any)[colKey as keyof T];
```
✅ Uses `keyof T` to restrict keys to real properties on the row type `T` (TypeScript safety).

### L121
```tsx
      const value = raw === null || raw === undefined ? "" : String(raw);
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L122
```tsx
      if (!value) return;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L123
```tsx
      const label = col.filterLabel ? col.filterLabel(raw, r) : value;
```
✅ Chooses a friendly display label if provided; otherwise uses the raw string value.

### L124
```tsx
      if (!uniques.has(value)) uniques.set(value, label);
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L125
```tsx
    });
```
✅ Closes a block/scope (function, object, callback, or JSX expression).

### L126
```tsx

```
✅ Blank line (spacing for readability).

### L127
```tsx
    const values = Array.from(uniques.entries())
```
✅ Converts the Map of unique values into an array of {value,label} objects for rendering.

### L128
```tsx
      .map(([value, label]) => ({ value, label }))
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L129
```tsx
      .sort((a, b) => a.label.localeCompare(b.label));
```
✅ Fallback string sort using locale-aware comparison for predictable ordering.

### L130
```tsx

```
✅ Blank line (spacing for readability).

### L131
```tsx
    setFilterMenu({
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L132
```tsx
      colKey,
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L133
```tsx
      title,
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L134
```tsx
      position: { x: left, y: top },
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L135
```tsx
      values,
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L136
```tsx
      draft: {
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L137
```tsx
        text: current.text ?? "",
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L138
```tsx
        values: new Set(current.values ?? []),
```
✅ Stores selected checkbox values as a Set for fast add/remove and membership checks.

### L139
```tsx
      },
```
✅ Closes a block/scope (function, object, callback, or JSX expression).

### L140
```tsx
    });
```
✅ Closes a block/scope (function, object, callback, or JSX expression).

### L141
```tsx
  };
```
✅ Closes a block/scope (function, object, callback, or JSX expression).

### L142
```tsx

```
✅ Blank line (spacing for readability).

### L143
```tsx
  const applyFilter = () => {
```
✅ Commits the popover’s draft filter settings into the persistent `filters` state.

### L144
```tsx
    if (!filterMenu) return;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L145
```tsx
    const text = filterMenu.draft.text.trim();
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L146
```tsx
    const values = Array.from(filterMenu.draft.values);
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L147
```tsx
    const hasFilter = text.length > 0 || values.length > 0;
```
✅ Determines whether the user actually set any filter (text or selected values).

### L148
```tsx
    setFilters((prev) => {
```
✅ Functional state update to safely compute the next filters from the previous filters.

### L149
```tsx
      const next = { ...prev };
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L150
```tsx
      if (hasFilter) next[filterMenu.colKey] = { text, values };
```
✅ Determines whether the user actually set any filter (text or selected values).

### L151
```tsx
      else delete next[filterMenu.colKey];
```
✅ Removes the filter entry entirely when it’s empty so the column is treated as unfiltered.

### L152
```tsx
      return next;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L153
```tsx
    });
```
✅ Closes a block/scope (function, object, callback, or JSX expression).

### L154
```tsx
    closeFilterMenu();
```
✅ Helper to close the filter popover by clearing `filterMenu` state.

### L155
```tsx
  };
```
✅ Closes a block/scope (function, object, callback, or JSX expression).

### L156
```tsx

```
✅ Blank line (spacing for readability).

### L157
```tsx
  const clearFilter = () => {
```
✅ Clears the filter for the currently open column and closes the popover.

### L158
```tsx
    if (!filterMenu) return;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L159
```tsx
    setFilters((prev) => {
```
✅ Functional state update to safely compute the next filters from the previous filters.

### L160
```tsx
      const next = { ...prev };
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L161
```tsx
      delete next[filterMenu.colKey];
```
✅ Removes the filter entry entirely when it’s empty so the column is treated as unfiltered.

### L162
```tsx
      return next;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L163
```tsx
    });
```
✅ Closes a block/scope (function, object, callback, or JSX expression).

### L164
```tsx
    closeFilterMenu();
```
✅ Helper to close the filter popover by clearing `filterMenu` state.

### L165
```tsx
  };
```
✅ Closes a block/scope (function, object, callback, or JSX expression).

### L166
```tsx

```
✅ Blank line (spacing for readability).

### L167
```tsx
  useEffect(() => {
```
✅ Starts an effect for attaching/removing global event listeners (outside click, Escape).

### L168
```tsx
    if (!filterMenu) return;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L169
```tsx
    const handleClickOutside = (e: MouseEvent) => {
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L170
```tsx
      const node = filterPopoverRef.current;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L171
```tsx
      if (node && !node.contains(e.target as Node)) {
```
✅ Checks whether the click happened inside the popover; if not, it closes.

### L172
```tsx
        closeFilterMenu();
```
✅ Helper to close the filter popover by clearing `filterMenu` state.

### L173
```tsx
      }
```
✅ Closes a block/scope (function, object, callback, or JSX expression).

### L174
```tsx
    };
```
✅ Closes a block/scope (function, object, callback, or JSX expression).

### L175
```tsx
    const handleEscape = (e: KeyboardEvent) => {
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L176
```tsx
      if (e.key === "Escape") closeFilterMenu();
```
✅ Helper to close the filter popover by clearing `filterMenu` state.

### L177
```tsx
    };
```
✅ Closes a block/scope (function, object, callback, or JSX expression).

### L178
```tsx
    document.addEventListener("mousedown", handleClickOutside);
```
✅ Registers a global event listener while the popover is open.

### L179
```tsx
    document.addEventListener("keydown", handleEscape);
```
✅ Registers a global event listener while the popover is open.

### L180
```tsx
    return () => {
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L181
```tsx
      document.removeEventListener("mousedown", handleClickOutside);
```
✅ Cleans up the global listener to avoid memory leaks and accidental behavior.

### L182
```tsx
      document.removeEventListener("keydown", handleEscape);
```
✅ Cleans up the global listener to avoid memory leaks and accidental behavior.

### L183
```tsx
    };
```
✅ Closes a block/scope (function, object, callback, or JSX expression).

### L184
```tsx
  }, [filterMenu]);
```
✅ Dependency list: recompute memo/effect when any listed value changes.

### L185
```tsx

```
✅ Blank line (spacing for readability).

### L186
```tsx
  const visibleIds = useMemo(() => sortedFilteredRows.map((row) => getRowId(row)), [sortedFilteredRows, getRowId]);
```
✅ Computes IDs of visible rows (after filtering/sorting) for select-all behavior.

### L187
```tsx
  const allSelected = selectedIds ? visibleIds.every((id) => selectedIds.has(id)) : false;
```
✅ Checks whether every visible row is currently selected to drive the select-all toggle.

### L188
```tsx

```
✅ Blank line (spacing for readability).

### L189
```tsx
  const renderCellInput = (
```
✅ Helper that renders the correct input control for a cell based on the column’s type.

### L190
```tsx
    value: any,
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L191
```tsx
    col: DataGridColumn<T>,
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L192
```tsx
    onChange: (val: any) => void,
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L193
```tsx
    inputRef?: React.RefObject<HTMLInputElement | null>,
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L194
```tsx
  ) => {
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L195
```tsx
    if (col.type === "boolean") {
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L196
```tsx
      return (
```
✅ Starts the JSX return: what this component renders.

### L197
```tsx
        <input
```
✅ Starts a JSX element (UI markup).

### L198
```tsx
          type="checkbox"
```
✅ Renders a checkbox for boolean cells; `checked` is controlled by the cell value.

### L199
```tsx
          className="table-checkbox"
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L200
```tsx
          checked={Boolean(value)}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L201
```tsx
          onChange={(e) => onChange(e.target.checked)}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L202
```tsx
        />
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L203
```tsx
      );
```
✅ Ends the return/statement.

### L204
```tsx
    }
```
✅ Closes a block/scope (function, object, callback, or JSX expression).

### L205
```tsx
    if (col.type === "number") {
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L206
```tsx
      return (
```
✅ Starts the JSX return: what this component renders.

### L207
```tsx
        <input
```
✅ Starts a JSX element (UI markup).

### L208
```tsx
          ref={inputRef}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L209
```tsx
          className={`table-input ${col.align === "center" ? "center" : ""}`}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L210
```tsx
          type="number"
```
✅ Renders a numeric input for number cells; converts typed text to a Number.

### L211
```tsx
          value={value ?? 0}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L212
```tsx
          onChange={(e) => onChange(Number(e.target.value) || 0)}
```
✅ Converts the input’s string into a number; `|| 0` prevents NaN from entering state.

### L213
```tsx
          onFocus={onFocusSelectAll}
```
✅ Optional UX hook: parent may select all text on focus for faster editing.

### L214
```tsx
        />
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L215
```tsx
      );
```
✅ Ends the return/statement.

### L216
```tsx
    }
```
✅ Closes a block/scope (function, object, callback, or JSX expression).

### L217
```tsx
    if (col.type === "datetime") {
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L218
```tsx
      return (
```
✅ Starts the JSX return: what this component renders.

### L219
```tsx
        <input
```
✅ Starts a JSX element (UI markup).

### L220
```tsx
          ref={inputRef}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L221
```tsx
          className="table-input"
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L222
```tsx
          type="date"
```
✅ Renders a date picker input for datetime columns (date-only).

### L223
```tsx
          value={value ?? ""}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L224
```tsx
          onChange={(e) => onChange(e.target.value)}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L225
```tsx
          onFocus={onFocusSelectAll}
```
✅ Optional UX hook: parent may select all text on focus for faster editing.

### L226
```tsx
        />
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L227
```tsx
      );
```
✅ Ends the return/statement.

### L228
```tsx
    }
```
✅ Closes a block/scope (function, object, callback, or JSX expression).

### L229
```tsx
    return (
```
✅ Starts the JSX return: what this component renders.

### L230
```tsx
      <input
```
✅ Starts a JSX element (UI markup).

### L231
```tsx
        ref={inputRef}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L232
```tsx
        className="table-input"
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L233
```tsx
        value={value ?? ""}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L234
```tsx
        onChange={(e) => onChange(e.target.value)}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L235
```tsx
        onFocus={onFocusSelectAll}
```
✅ Optional UX hook: parent may select all text on focus for faster editing.

### L236
```tsx
      />
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L237
```tsx
    );
```
✅ Ends the return/statement.

### L238
```tsx
  };
```
✅ Closes a block/scope (function, object, callback, or JSX expression).

### L239
```tsx

```
✅ Blank line (spacing for readability).

### L240
```tsx
  return (
```
✅ Starts the JSX return: what this component renders.

### L241
```tsx
    <>
```
✅ React fragment: groups sibling elements without adding an extra DOM node.

### L242
```tsx
      <table className="data-table dense selectable">
```
✅ Begins the table element; CSS classes control styling (dense/selectable).

### L243
```tsx
      <thead>
```
✅ Table header section (column names, sort toggles, filter buttons).

### L244
```tsx
        <tr>
```
✅ Starts a JSX element (UI markup).

### L245
```tsx
          {enableSelection && (
```
✅ Conditionally renders selection UI based on the feature flag.

### L246
```tsx
            <th style={{ width: 34 }} className="center">
```
✅ Starts a JSX element (UI markup).

### L247
```tsx
              <button
```
✅ Starts a JSX element (UI markup).

### L248
```tsx
                type="button"
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L249
```tsx
                className={`row-select-handle ${allSelected ? "active" : ""}`}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L250
```tsx
                onClick={() => onToggleSelectAll?.(allSelected ? [] : visibleIds)}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L251
```tsx
                title="Select all"
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L252
```tsx
              >
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L253
```tsx
                o
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L254
```tsx
              </button>
```
✅ Structural/closing line for JSX or a code block.

### L255
```tsx
            </th>
```
✅ Structural/closing line for JSX or a code block.

### L256
```tsx
          )}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L257
```tsx
          {columns.map((col) => {
```
✅ Iterates through the column definitions to render headers/cells consistently.

### L258
```tsx
            const isSorted = sort?.key === col.key;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L259
```tsx
            const indicator = isSorted ? (sort?.dir === "asc" ? "\u25B2" : "\u25BC") : "";
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L260
```tsx
            const canSort = enableSorting && col.enableSort !== false;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L261
```tsx
            const filterActive = Boolean(filters[String(col.key)]);
```
✅ Looks up the saved filter state for this column (keyed by the column key).

### L262
```tsx
            return (
```
✅ Starts the JSX return: what this component renders.

### L263
```tsx
              <th
```
✅ Starts a JSX element (UI markup).

### L264
```tsx
                key={String(col.key)}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L265
```tsx
                style={col.width ? { width: col.width } : undefined}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L266
```tsx
                className={col.align}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L267
```tsx
                onClick={
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L268
```tsx
                  canSort
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L269
```tsx
                    ? () =>
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L270
```tsx
                        setSort((prev) =>
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L271
```tsx
                          !prev || prev.key !== col.key
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L272
```tsx
                            ? { key: col.key, dir: "asc" }
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L273
```tsx
                            : prev.dir === "asc"
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L274
```tsx
                              ? { key: col.key, dir: "desc" }
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L275
```tsx
                              : null,
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L276
```tsx
                        )
```
✅ Closes a JSX/TS expression.

### L277
```tsx
                    : undefined
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L278
```tsx
                }
```
✅ Closes a block/scope (function, object, callback, or JSX expression).

### L279
```tsx
                title={canSort ? "Click to sort" : undefined}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L280
```tsx
              >
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L281
```tsx
                <div className="th-inner">
```
✅ Starts a JSX element (UI markup).

### L282
```tsx
                  <span className="th-label">
```
✅ Starts a JSX element (UI markup).

### L283
```tsx
                    {col.header}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L284
```tsx
                    {indicator && <span className="th-sort">{indicator}</span>}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L285
```tsx
                  </span>
```
✅ Structural/closing line for JSX or a code block.

### L286
```tsx
                  <span className="th-actions">
```
✅ Starts a JSX element (UI markup).

### L287
```tsx
                    {enableFilters && (
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L288
```tsx
                      <button
```
✅ Starts a JSX element (UI markup).

### L289
```tsx
                        className={`filter-btn ${filterActive ? "active" : ""}`}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L290
```tsx
                        onClick={(e) => {
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L291
```tsx
                          e.stopPropagation();
```
✅ Prevents the click on the filter icon from also triggering the header’s sort click.

### L292
```tsx
                          openFilterMenu(String(col.key), col.header, e.currentTarget);
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L293
```tsx
                        }}
```
✅ Closes the current JSX/TS block.

### L294
```tsx
                        title="Filter"
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L295
```tsx
                        type="button"
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L296
```tsx
                      >
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L297
```tsx
                        <Filter size={14} />
```
✅ Renders the filter icon inside the header filter button.

### L298
```tsx
                      </button>
```
✅ Structural/closing line for JSX or a code block.

### L299
```tsx
                    )}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L300
```tsx
                  </span>
```
✅ Structural/closing line for JSX or a code block.

### L301
```tsx
                </div>
```
✅ Structural/closing line for JSX or a code block.

### L302
```tsx
              </th>
```
✅ Structural/closing line for JSX or a code block.

### L303
```tsx
            );
```
✅ Ends the return/statement.

### L304
```tsx
          })}
```
✅ Closes the current JSX/TS block.

### L305
```tsx
        </tr>
```
✅ Structural/closing line for JSX or a code block.

### L306
```tsx
      </thead>
```
✅ Structural/closing line for JSX or a code block.

### L307
```tsx
      <tbody>
```
✅ Table body section (existing rows + new row editor).

### L308
```tsx
        {sortedFilteredRows.map((row) => {
```
✅ Iterates through derived rows (filtered/sorted) to render each table row.

### L309
```tsx
          const id = getRowId(row);
```
✅ Computes a stable row ID used for React keys and selection.

### L310
```tsx
          const selected = selectedIds?.has(id);
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L311
```tsx
          return (
```
✅ Starts the JSX return: what this component renders.

### L312
```tsx
            <tr key={id} className={selected ? "row-selected" : undefined}>
```
✅ Starts a JSX element (UI markup).

### L313
```tsx
              {enableSelection && (
```
✅ Conditionally renders selection UI based on the feature flag.

### L314
```tsx
                <td className="center">
```
✅ Starts a JSX element (UI markup).

### L315
```tsx
                  <button
```
✅ Starts a JSX element (UI markup).

### L316
```tsx
                    type="button"
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L317
```tsx
                    className={`row-select-handle ${selected ? "active" : ""}`}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L318
```tsx
                    onClick={() => onToggleSelect?.(id)}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L319
```tsx
                    title={selected ? "Deselect row" : "Select row"}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L320
```tsx
                  >
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L321
```tsx
                    o
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L322
```tsx
                  </button>
```
✅ Structural/closing line for JSX or a code block.

### L323
```tsx
                </td>
```
✅ Structural/closing line for JSX or a code block.

### L324
```tsx
              )}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L325
```tsx
              {columns.map((col) => (
```
✅ Iterates through the column definitions to render headers/cells consistently.

### L326
```tsx
                <td key={`${id}-${String(col.key)}`} className={col.align}>
```
✅ Starts a JSX element (UI markup).

### L327
```tsx
                  {renderCellInput((row as any)[col.key], col, (val) => onRowChange(id, col.key, val))}
```
✅ Renders an editable cell and wires its updates to `onRowChange` in the parent.

### L328
```tsx
                </td>
```
✅ Structural/closing line for JSX or a code block.

### L329
```tsx
              ))}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L330
```tsx
            </tr>
```
✅ Structural/closing line for JSX or a code block.

### L331
```tsx
          );
```
✅ Ends the return/statement.

### L332
```tsx
        })}
```
✅ Closes the current JSX/TS block.

### L333
```tsx
        <tr className="new-row" ref={newRowRef} onBlur={onNewRowBlur}>
```
✅ Starts a JSX element (UI markup).

### L334
```tsx
          {enableSelection && <td />}
```
✅ Conditionally renders selection UI based on the feature flag.

### L335
```tsx
          {columns.map((col, idx) => (
```
✅ Iterates through the column definitions to render headers/cells consistently.

### L336
```tsx
            <td key={`new-${String(col.key)}`} className={col.align}>
```
✅ Starts a JSX element (UI markup).

### L337
```tsx
              {renderCellInput(
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L338
```tsx
                (newRow as any)[col.key],
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L339
```tsx
                col,
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L340
```tsx
                (val) => onNewRowChange(col.key, val),
```
✅ Wires the new-row draft input to the parent’s `onNewRowChange` handler.

### L341
```tsx
                idx === 0 ? newRowFirstInputRef : undefined,
```
✅ Assigns a ref to the first new-row input so the parent can auto-focus it.

### L342
```tsx
              )}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L343
```tsx
            </td>
```
✅ Structural/closing line for JSX or a code block.

### L344
```tsx
          ))}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L345
```tsx
        </tr>
```
✅ Structural/closing line for JSX or a code block.

### L346
```tsx
      </tbody>
```
✅ Structural/closing line for JSX or a code block.

### L347
```tsx
      </table>
```
✅ Structural/closing line for JSX or a code block.

### L348
```tsx
      {filterMenu && (
```
✅ Conditionally renders the filter popover only when it’s open.

### L349
```tsx
        <div
```
✅ Starts a JSX element (UI markup).

### L350
```tsx
          ref={filterPopoverRef}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L351
```tsx
          className="filter-popover"
```
✅ Popover container; positioned using inline style top/left coordinates.

### L352
```tsx
          style={{ top: filterMenu.position.y, left: filterMenu.position.x }}
```
✅ Absolutely positions the popover using the computed screen coordinates.

### L353
```tsx
        >
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L354
```tsx
          <div className="filter-popover-header">
```
✅ Starts a JSX element (UI markup).

### L355
```tsx
            <div className="filter-title">{filterMenu.title}</div>
```
✅ Starts a JSX element (UI markup).

### L356
```tsx
            <button className="btn secondary icon-btn" onClick={closeFilterMenu} title="Close" type="button">
```
✅ Helper to close the filter popover by clearing `filterMenu` state.

### L357
```tsx
              <X size={14} />
```
✅ Renders the close (X) icon in the popover header.

### L358
```tsx
            </button>
```
✅ Structural/closing line for JSX or a code block.

### L359
```tsx
          </div>
```
✅ Structural/closing line for JSX or a code block.

### L360
```tsx
          <div className="filter-body">
```
✅ Starts a JSX element (UI markup).

### L361
```tsx
            <label className="filter-label">Contains</label>
```
✅ Starts a JSX element (UI markup).

### L362
```tsx
            <input
```
✅ Starts a JSX element (UI markup).

### L363
```tsx
              className="table-input filter-input"
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L364
```tsx
              value={filterMenu.draft.text}
```
✅ Controlled input for draft filter text; edits are stored in `filterMenu.draft.text`.

### L365
```tsx
              onChange={(e) =>
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L366
```tsx
                setFilterMenu((prev) =>
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L367
```tsx
                  prev ? { ...prev, draft: { ...prev.draft, text: e.target.value } } : prev,
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L368
```tsx
                )
```
✅ Closes a JSX/TS expression.

### L369
```tsx
              }
```
✅ Closes a block/scope (function, object, callback, or JSX expression).

### L370
```tsx
              placeholder="Type to search"
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L371
```tsx
            />
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L372
```tsx
            <div className="filter-values">
```
✅ Starts a JSX element (UI markup).

### L373
```tsx
              <div className="filter-values-scroll">
```
✅ Starts a JSX element (UI markup).

### L374
```tsx
                {filterMenu.values.map((val) => {
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L375
```tsx
                  const checked = filterMenu.draft.values.has(val.value);
```
✅ Checks whether a checkbox value is selected in the draft Set.

### L376
```tsx
                  return (
```
✅ Starts the JSX return: what this component renders.

### L377
```tsx
                    <label key={val.value} className="filter-checkbox">
```
✅ Starts a JSX element (UI markup).

### L378
```tsx
                      <input
```
✅ Starts a JSX element (UI markup).

### L379
```tsx
                        type="checkbox"
```
✅ Renders a checkbox for boolean cells; `checked` is controlled by the cell value.

### L380
```tsx
                        checked={checked}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L381
```tsx
                        onChange={(e) => {
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L382
```tsx
                          setFilterMenu((prev) => {
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L383
```tsx
                            if (!prev) return prev;
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L384
```tsx
                            const next = new Set(prev.draft.values);
```
✅ Stores selected checkbox values as a Set for fast add/remove and membership checks.

### L385
```tsx
                            if (e.target.checked) next.add(val.value);
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L386
```tsx
                            else next.delete(val.value);
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L387
```tsx
                            return { ...prev, draft: { ...prev.draft, values: next } };
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L388
```tsx
                          });
```
✅ Closes a block/scope (function, object, callback, or JSX expression).

### L389
```tsx
                        }}
```
✅ Closes the current JSX/TS block.

### L390
```tsx
                      />
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L391
```tsx
                      <span>{val.label}</span>
```
✅ Starts a JSX element (UI markup).

### L392
```tsx
                    </label>
```
✅ Structural/closing line for JSX or a code block.

### L393
```tsx
                  );
```
✅ Ends the return/statement.

### L394
```tsx
                })}
```
✅ Closes the current JSX/TS block.

### L395
```tsx
              </div>
```
✅ Structural/closing line for JSX or a code block.

### L396
```tsx
            </div>
```
✅ Structural/closing line for JSX or a code block.

### L397
```tsx
          </div>
```
✅ Structural/closing line for JSX or a code block.

### L398
```tsx
          <div className="filter-footer">
```
✅ Starts a JSX element (UI markup).

### L399
```tsx
            <button className="btn secondary small-btn" onClick={clearFilter} type="button">
```
✅ Starts a JSX element (UI markup).

### L400
```tsx
              Clear
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L401
```tsx
            </button>
```
✅ Structural/closing line for JSX or a code block.

### L402
```tsx
            <button className="btn primary small-btn" onClick={applyFilter} type="button">
```
✅ Starts a JSX element (UI markup).

### L403
```tsx
              Apply
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L404
```tsx
            </button>
```
✅ Structural/closing line for JSX or a code block.

### L405
```tsx
          </div>
```
✅ Structural/closing line for JSX or a code block.

### L406
```tsx
        </div>
```
✅ Structural/closing line for JSX or a code block.

### L407
```tsx
      )}
```
✅ Continuation of the surrounding block; this line supports the logic/UI being built.

### L408
```tsx
    </>
```
✅ Structural/closing line for JSX or a code block.

### L409
```tsx
  );
```
✅ Ends the return/statement.

### L410
```tsx
}
```
✅ Closes a block/scope (function, object, callback, or JSX expression).
