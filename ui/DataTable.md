# 🧱 DataGrid Component Deep Dive

> **File:** `DataTable.tsx`  
> **Purpose:** A reusable, generic React + TypeScript data grid with  
> selection, sorting, filtering, and inline editing.

---

## ✨ What This Component Does

This `DataGrid<T>` component renders a fully interactive table that supports:

- ☑ Row selection (single + select-all)
- 🔃 Column sorting (asc → desc → none)
- 🔍 Column filtering  
  - Text “contains” filter  
  - Multi-select value filter
- ✏️ Inline editing of existing rows
- ➕ A dedicated “new row” editor at the bottom
- 🧠 Fully controlled state via parent callbacks

It is **generic**, meaning it works with *any* row shape (`T`) as long as
you describe the columns.

---

## 🧩 Core Types

### `DataGridColumn<T>`

Defines how a column behaves and renders.

```ts
export type DataGridColumn<T> = {
  key: keyof T;
  header: string;
  type: "string" | "number" | "boolean" | "datetime";
  width?: number;
  align?: "left" | "center" | "right";
  enableSort?: boolean;
  filterLabel?: (value: any, row?: T) => string;
};
```

**Key ideas:**
- `key` maps directly to a property on your row object.
- `type` controls:
  - input control
  - sorting logic
- `filterLabel` lets you display friendly names in filters
  (for example mapping IDs → names).

---

### `DataGridProps<T>`

The full contract required by the component.

```ts
type DataGridProps<T> = {
  columns: DataGridColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: (ids: string[]) => void;
  onRowChange: (id: string, key: keyof T, value: any) => void;
  newRow: Partial<T>;
  onNewRowChange: (key: keyof T, value: any) => void;
  ...
};
```

📌 **Important design choice:**  
All data mutations flow *upward*.  
This component never mutates rows directly.

---

## 🧠 Internal State

```ts
const [sort, setSort] = useState<SortState<T>>(null);
const [filters, setFilters] = useState<Record<string, FilterState>>({});
const [filterMenu, setFilterMenu] = useState<FilterMenuState | null>(null);
```

| State | Purpose |
|-----|--------|
| `sort` | Active column sort (or none) |
| `filters` | Persisted filters per column |
| `filterMenu` | Temporary popover draft state |

---

## 🔄 Row Processing Pipeline

All displayed rows pass through **two stages**:

```
rows
  ↓
filtering
  ↓
sorting
  ↓
sortedFilteredRows
```

Implemented with `useMemo` to avoid unnecessary recalculations.

---

## 🔍 Filtering Logic

For each row:
- Every column filter must pass
- Filters combine using **AND logic**

### Text filter
```ts
target.includes(text)
```

### Value filter
```ts
values.some(v => v === target)
```

💡 If *both* text and value filters are set, **both must match**.

---

## 🔃 Sorting Logic

Sorting cycles when clicking a column header:

```
none → ascending → descending → none
```

Type-aware comparisons:
- 🔢 `number`
- ☑ `boolean`
- 📅 `datetime`
- 🔤 fallback string compare

Null/undefined values are handled gracefully and sorted consistently.

---

## 🪟 Filter Popover System

Each column can open a floating filter menu:

- Positioned near the clicked header
- Auto-clamped to viewport
- Draft-based editing until “Apply” is pressed

### Draft vs Applied Filters

| Draft | Applied |
|-----|--------|
| Lives in `filterMenu` | Lives in `filters` |
| Editable freely | Used by table |
| Discarded on close | Persistent |

---

## 🧷 Click-Outside & Escape Handling

```ts
document.addEventListener("mousedown", ...)
document.addEventListener("keydown", ...)
```

- Clicking outside the popover closes it
- Pressing `Esc` closes it
- Listeners are attached **only while open**

---

## ☑ Row Selection Model

Selection is **controlled externally**:

- This component only:
  - computes visibility
  - triggers callbacks
- Parent owns the actual selection state

```ts
const allSelected = visibleIds.every(id => selectedIds.has(id));
```

✔ “Select all” only applies to **visible rows** (after filter/sort).

---

## ✏️ Inline Editing

Each cell renders an input based on column type:

| Type | Control |
|----|-------|
| string | text input |
| number | number input |
| boolean | checkbox |
| datetime | date input |

All edits call back to the parent:

```ts
onRowChange(id, columnKey, newValue)
```

---

## ➕ New Row Editor

A special row at the bottom of the table:

- Uses the same inputs as normal rows
- Writes to `newRow: Partial<T>`
- First cell can be auto-focused
- `onBlur` allows parent-driven save logic

---

## 🧠 Mental Model

```
Parent owns data
    ↑
callbacks
    ↑
DataGrid
    ↓
renders UI
```

This keeps the component:
- predictable
- testable
- reusable across domains

---

## ⚠️ Subtle Gotchas

- `datetime` uses `<input type="date">` (no time component)
- Blank cell values are excluded from filter checkbox lists
- Filters combine with AND, not OR
- Sets are copied before mutation (important for React state)

---

## ✅ Summary

This `DataGrid` is a:
- flexible
- strongly typed
- controlled
- feature-rich table foundation

It’s designed to be **extended by configuration**, not rewritten.

---

*Last documented with ❤️ and TypeScript.*
