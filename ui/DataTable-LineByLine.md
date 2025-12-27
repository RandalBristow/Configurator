# 🧠 DataTable.tsx Line-by-Line Guide (Teaching Edition)

> Goal: explain the lines that usually feel like wizard spells. 🪄
> This matches your uploaded `DataTable.tsx`. 

- **Source file length:** 410 lines

---

## Table of contents
- [Imports](#imports) (lines 1–2)
- [Type: DataGridColumn<T>](#type-datagridcolumn<t>) (lines 4–13)
- [Props: DataGridProps<T>](#props-datagridprops<t>) (lines 15–33)
- [Sort state](#sort-state) (lines 35–35)
- [Component + internal UI state](#component-+-internal-ui-state) (lines 37–66)
- [Filtering + sorting pipeline (useMemo)](#filtering-+-sorting-pipeline-(usememo)) (lines 68–114)
- [Open/close filter menu and build unique values](#open/close-filter-menu-and-build-unique-values) (lines 116–161)
- [Apply/Clear filter](#apply/clear-filter) (lines 163–195)
- [Click-outside + Esc handlers (useEffect)](#click-outside-+-esc-handlers-(useeffect)) (lines 197–221)
- [Selection calculations](#selection-calculations) (lines 223–224)
- [Render inputs per type](#render-inputs-per-type) (lines 226–295)
- [Table header: sort cycle + filter button](#table-header-sort-cycle-+-filter-button) (lines 297–377)
- [Table body: existing rows](#table-body-existing-rows) (lines 379–410)
- [New-row editor row](#new-row-editor-row) (lines 419–410)
- [Filter popover UI](#filter-popover-ui) (lines 441–410)

---

## Imports
**Lines 1–2**

```tsx
1 | import { useEffect, useMemo, useRef, useState } from "react";
2 | import { Filter, X } from "lucide-react";
```

### What’s happening here (and why it matters)
- ✅ `useMemo` and `useEffect` are used for performance + event listeners (filter popover).
- ✅ `lucide-react` icons are purely UI: filter and close icons.

## Type: DataGridColumn<T>
**Lines 4–13**

```tsx
 4 | export type DataGridColumn<T> = {
 5 |   key: keyof T;
 6 |   header: string;
 7 |   type: "string" | "number" | "boolean" | "datetime";
 8 |   width?: number;
 9 |   align?: "left" | "center" | "right";
10 |   enableSort?: boolean;
11 |   filterLabel?: (value: any, row?: T) => string;
12 | };
13 | 
```

### What’s happening here (and why it matters)
- ✅ `key: keyof T` is the TypeScript safety net: column keys must exist on your row type.
- ✅ `type` drives both which input to render and how sorting compares values.
- ✅ `filterLabel` lets the filter UI show friendly labels while filtering on raw values.

## Props: DataGridProps<T>
**Lines 15–33**

```tsx
15 |   columns: DataGridColumn<T>[];
16 |   rows: T[];
17 |   getRowId: (row: T) => string;
18 |   selectedIds?: Set<string>;
19 |   onToggleSelect?: (id: string) => void;
20 |   onToggleSelectAll?: (ids: string[]) => void;
21 |   onRowChange: (id: string, key: keyof T, value: any) => void;
22 |   newRow: Partial<T>;
23 |   onNewRowChange: (key: keyof T, value: any) => void;
24 |   onFocusSelectAll?: (e: React.FocusEvent<HTMLInputElement>) => void;
25 |   newRowRef?: React.RefObject<HTMLTableRowElement | null>;
26 |   newRowFirstInputRef?: React.RefObject<HTMLInputElement | null>;
27 |   onNewRowBlur?: (e: React.FocusEvent<HTMLTableRowElement>) => void;
28 |   enableSelection?: boolean;
29 |   enableFilters?: boolean;
30 |   enableSorting?: boolean;
31 | };
32 | 
33 | type SortState<T> = { key: keyof T; dir: "asc" | "desc" } | null;
```

### What’s happening here (and why it matters)
- ✅ This grid is **controlled**: it reports changes upward via callbacks; the parent owns state.
- ✅ `selectedIds` is a `Set` for fast membership checks (O(1)).
- ✅ `newRow: Partial<T>` represents an incomplete draft row for the bottom editor.

## Sort state
**Lines 35–35**

```tsx
35 | export function DataGrid<T>({
```

### What’s happening here (and why it matters)
- ✅ Sorting is either `null` (no sort) or `{ key, dir }` (active sort).

## Component + internal UI state
**Lines 37–66**

```tsx
37 |   rows,
38 |   getRowId,
39 |   selectedIds,
40 |   onToggleSelect,
41 |   onToggleSelectAll,
42 |   onRowChange,
43 |   newRow,
44 |   onNewRowChange,
45 |   onFocusSelectAll,
46 |   newRowRef,
47 |   newRowFirstInputRef,
48 |   onNewRowBlur,
49 |   enableSelection = true,
50 |   enableFilters = true,
51 |   enableSorting = true,
52 | }: DataGridProps<T>) {
53 |   const [sort, setSort] = useState<SortState<T>>(null);
54 |   const [filters, setFilters] = useState<Record<string, { text: string; values: string[] }>>({});
55 |   const [filterMenu, setFilterMenu] = useState<{
56 |     colKey: string;
57 |     title: string;
58 |     position: { x: number; y: number };
59 |     values: { value: string; label: string }[];
60 |     draft: { text: string; values: Set<string> };
61 |   } | null>(null);
62 |   const filterPopoverRef = useRef<HTMLDivElement | null>(null);
63 | 
64 |   const sortedFilteredRows = useMemo(() => {
65 |     let data = rows;
66 |     if (enableFilters) {
```

### What’s happening here (and why it matters)
- ✅ `filters` stores per-column filter settings (text + selected values).
- ✅ `filterMenu` is temporary draft state for an open filter popover.
- ✅ `filterPopoverRef` supports click-outside detection.

## Filtering + sorting pipeline (useMemo)
**Lines 68–114**

```tsx
 68 |         return columns.every((col) => {
 69 |           const filterValue = filters[String(col.key)];
 70 |           if (!filterValue) return true;
 71 |           const text = filterValue.text.trim().toLowerCase();
 72 |           const values = filterValue.values ?? [];
 73 |           const cell = (row as any)[col.key];
 74 |           const value = cell === null || cell === undefined ? "" : String(cell);
 75 |           const target = value.toLowerCase();
 76 |           if (text && !target.includes(text)) return false;
 77 |           if (values.length && !values.some((v) => v.toLowerCase() === target)) return false;
 78 |           return true;
 79 |         });
 80 |       });
 81 |     }
 82 |     if (enableSorting && sort) {
 83 |       const { key, dir } = sort;
 84 |       const col = columns.find((c) => c.key === key);
 85 |       data = [...data].sort((a, b) => {
 86 |         const av = (a as any)[key];
 87 |         const bv = (b as any)[key];
 88 |         if (av === bv) return 0;
 89 |         if (av === undefined || av === null) return dir === "asc" ? -1 : 1;
 90 |         if (bv === undefined || bv === null) return dir === "asc" ? 1 : -1;
 91 |         if (col?.type === "number") return dir === "asc" ? av - bv : bv - av;
 92 |         if (col?.type === "boolean") return dir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
 93 |         if (col?.type === "datetime") {
 94 |           const ad = new Date(av).getTime();
 95 |           const bd = new Date(bv).getTime();
 96 |           if (!Number.isNaN(ad) && !Number.isNaN(bd)) return dir === "asc" ? ad - bd : bd - ad;
 97 |         }
 98 |         return dir === "asc"
 99 |           ? String(av).localeCompare(String(bv))
100 |           : String(bv).localeCompare(String(av));
101 |       });
102 |     }
103 |     return data;
104 |   }, [rows, columns, filters, sort, enableFilters, enableSorting]);
105 | 
106 |   const closeFilterMenu = () => setFilterMenu(null);
107 | 
108 |   const openFilterMenu = (colKey: string, title: string, eventTarget: HTMLElement) => {
109 |     const col = columns.find((c) => String(c.key) === colKey);
110 |     if (!col) return;
111 |     const current = filters[colKey] ?? { text: "", values: [] };
112 |     const rect = eventTarget.getBoundingClientRect();
113 |     const popWidth = 260;
114 |     const popHeight = 300;
```

### What’s happening here (and why it matters)
- ✅ `useMemo` avoids recalculating filtered/sorted rows on unrelated renders.
- ✅ Filtering uses `columns.every(...)` so all active column filters must pass (AND).
- ✅ `[...data].sort(...)` copies before sorting because `.sort()` mutates the array in place.
- ✅ Null/undefined checks keep ordering consistent and prevent comparison errors.
- ✅ Datetime sort converts to epoch milliseconds and guards against invalid dates (NaN).
- ✅ Fallback `localeCompare` gives predictable string sorting.

### 🧪 Deeper dive: why copying before sort matters
- JavaScript `sort()` **mutates** the array it sorts.
- `rows` is a prop from the parent. Mutating it breaks React’s “data flows down” assumption.
- Copying with `[...data]` keeps the parent’s `rows` untouched.

### 🧪 Deeper dive: AND vs OR in filtering
- `columns.every(...)` means: “row stays only if it passes **every** column filter.”
- If you ever wanted OR behavior, you’d use `some(...)` instead.


## Open/close filter menu and build unique values
**Lines 116–161**

```tsx
116 |     const top = Math.min(Math.max(8, rect.bottom + 4), window.innerHeight - popHeight);
117 | 
118 |     const uniques = new Map<string, string>();
119 |     rows.forEach((r) => {
120 |       const raw = (r as any)[colKey as keyof T];
121 |       const value = raw === null || raw === undefined ? "" : String(raw);
122 |       if (!value) return;
123 |       const label = col.filterLabel ? col.filterLabel(raw, r) : value;
124 |       if (!uniques.has(value)) uniques.set(value, label);
125 |     });
126 | 
127 |     const values = Array.from(uniques.entries())
128 |       .map(([value, label]) => ({ value, label }))
129 |       .sort((a, b) => a.label.localeCompare(b.label));
130 | 
131 |     setFilterMenu({
132 |       colKey,
133 |       title,
134 |       position: { x: left, y: top },
135 |       values,
136 |       draft: {
137 |         text: current.text ?? "",
138 |         values: new Set(current.values ?? []),
139 |       },
140 |     });
141 |   };
142 | 
143 |   const applyFilter = () => {
144 |     if (!filterMenu) return;
145 |     const text = filterMenu.draft.text.trim();
146 |     const values = Array.from(filterMenu.draft.values);
147 |     const hasFilter = text.length > 0 || values.length > 0;
148 |     setFilters((prev) => {
149 |       const next = { ...prev };
150 |       if (hasFilter) next[filterMenu.colKey] = { text, values };
151 |       else delete next[filterMenu.colKey];
152 |       return next;
153 |     });
154 |     closeFilterMenu();
155 |   };
156 | 
157 |   const clearFilter = () => {
158 |     if (!filterMenu) return;
159 |     setFilters((prev) => {
160 |       const next = { ...prev };
161 |       delete next[filterMenu.colKey];
```

### What’s happening here (and why it matters)
- ✅ Popover position uses `getBoundingClientRect()` and clamps to viewport.
- ✅ A `Map` collects unique raw values while keeping a display label.
- ✅ Empty string values are skipped, so blanks won’t appear in checkbox filters.
- ✅ Draft selected values use a `Set` for easy add/remove.

## Apply/Clear filter
**Lines 163–195**

```tsx
163 |     });
164 |     closeFilterMenu();
165 |   };
166 | 
167 |   useEffect(() => {
168 |     if (!filterMenu) return;
169 |     const handleClickOutside = (e: MouseEvent) => {
170 |       const node = filterPopoverRef.current;
171 |       if (node && !node.contains(e.target as Node)) {
172 |         closeFilterMenu();
173 |       }
174 |     };
175 |     const handleEscape = (e: KeyboardEvent) => {
176 |       if (e.key === "Escape") closeFilterMenu();
177 |     };
178 |     document.addEventListener("mousedown", handleClickOutside);
179 |     document.addEventListener("keydown", handleEscape);
180 |     return () => {
181 |       document.removeEventListener("mousedown", handleClickOutside);
182 |       document.removeEventListener("keydown", handleEscape);
183 |     };
184 |   }, [filterMenu]);
185 | 
186 |   const visibleIds = useMemo(() => sortedFilteredRows.map((row) => getRowId(row)), [sortedFilteredRows, getRowId]);
187 |   const allSelected = selectedIds ? visibleIds.every((id) => selectedIds.has(id)) : false;
188 | 
189 |   const renderCellInput = (
190 |     value: any,
191 |     col: DataGridColumn<T>,
192 |     onChange: (val: any) => void,
193 |     inputRef?: React.RefObject<HTMLInputElement | null>,
194 |   ) => {
195 |     if (col.type === "boolean") {
```

### What’s happening here (and why it matters)
- ✅ Functional `setFilters(prev => ...)` avoids stale state bugs.
- ✅ Empty filters are deleted to keep the state clean and UI checks simple.

## Click-outside + Esc handlers (useEffect)
**Lines 197–221**

```tsx
197 |         <input
198 |           type="checkbox"
199 |           className="table-checkbox"
200 |           checked={Boolean(value)}
201 |           onChange={(e) => onChange(e.target.checked)}
202 |         />
203 |       );
204 |     }
205 |     if (col.type === "number") {
206 |       return (
207 |         <input
208 |           ref={inputRef}
209 |           className={`table-input ${col.align === "center" ? "center" : ""}`}
210 |           type="number"
211 |           value={value ?? 0}
212 |           onChange={(e) => onChange(Number(e.target.value) || 0)}
213 |           onFocus={onFocusSelectAll}
214 |         />
215 |       );
216 |     }
217 |     if (col.type === "datetime") {
218 |       return (
219 |         <input
220 |           ref={inputRef}
221 |           className="table-input"
```

### What’s happening here (and why it matters)
- ✅ Listeners are attached only while the menu is open and removed on cleanup.
- ✅ `node.contains(e.target)` distinguishes inside vs outside clicks, using the ref.

## Selection calculations
**Lines 223–224**

```tsx
223 |           value={value ?? ""}
224 |           onChange={(e) => onChange(e.target.value)}
```

### What’s happening here (and why it matters)
- ✅ `visibleIds` is based on filtered/sorted rows so select-all targets what’s visible.
- ✅ `every()` checks if all visible rows are selected to drive the select-all toggle.

## Render inputs per type
**Lines 226–295**

```tsx
226 |         />
227 |       );
228 |     }
229 |     return (
230 |       <input
231 |         ref={inputRef}
232 |         className="table-input"
233 |         value={value ?? ""}
234 |         onChange={(e) => onChange(e.target.value)}
235 |         onFocus={onFocusSelectAll}
236 |       />
237 |     );
238 |   };
239 | 
240 |   return (
241 |     <>
242 |       <table className="data-table dense selectable">
243 |       <thead>
244 |         <tr>
245 |           {enableSelection && (
246 |             <th style={{ width: 34 }} className="center">
247 |               <button
248 |                 type="button"
249 |                 className={`row-select-handle ${allSelected ? "active" : ""}`}
250 |                 onClick={() => onToggleSelectAll?.(allSelected ? [] : visibleIds)}
251 |                 title="Select all"
252 |               >
253 |                 o
254 |               </button>
255 |             </th>
256 |           )}
257 |           {columns.map((col) => {
258 |             const isSorted = sort?.key === col.key;
259 |             const indicator = isSorted ? (sort?.dir === "asc" ? "\u25B2" : "\u25BC") : "";
260 |             const canSort = enableSorting && col.enableSort !== false;
261 |             const filterActive = Boolean(filters[String(col.key)]);
262 |             return (
263 |               <th
264 |                 key={String(col.key)}
265 |                 style={col.width ? { width: col.width } : undefined}
266 |                 className={col.align}
267 |                 onClick={
268 |                   canSort
269 |                     ? () =>
270 |                         setSort((prev) =>
271 |                           !prev || prev.key !== col.key
272 |                             ? { key: col.key, dir: "asc" }
273 |                             : prev.dir === "asc"
274 |                               ? { key: col.key, dir: "desc" }
275 |                               : null,
276 |                         )
277 |                     : undefined
278 |                 }
279 |                 title={canSort ? "Click to sort" : undefined}
280 |               >
281 |                 <div className="th-inner">
282 |                   <span className="th-label">
283 |                     {col.header}
284 |                     {indicator && <span className="th-sort">{indicator}</span>}
285 |                   </span>
286 |                   <span className="th-actions">
287 |                     {enableFilters && (
288 |                       <button
289 |                         className={`filter-btn ${filterActive ? "active" : ""}`}
290 |                         onClick={(e) => {
291 |                           e.stopPropagation();
292 |                           openFilterMenu(String(col.key), col.header, e.currentTarget);
293 |                         }}
294 |                         title="Filter"
295 |                         type="button"
```

### What’s happening here (and why it matters)
- ✅ Central helper ensures consistent editors for existing rows and the new-row draft.
- ✅ Number input coerces invalid/empty to `0` to avoid `NaN` entering state.
- ✅ Datetime uses `type='date'` (date-only). For time, use `datetime-local`.
- ✅ Optional `onFocusSelectAll` can select input text for quick editing.

## Table header: sort cycle + filter button
**Lines 297–377**

```tsx
297 |                         <Filter size={14} />
298 |                       </button>
299 |                     )}
300 |                   </span>
301 |                 </div>
302 |               </th>
303 |             );
304 |           })}
305 |         </tr>
306 |       </thead>
307 |       <tbody>
308 |         {sortedFilteredRows.map((row) => {
309 |           const id = getRowId(row);
310 |           const selected = selectedIds?.has(id);
311 |           return (
312 |             <tr key={id} className={selected ? "row-selected" : undefined}>
313 |               {enableSelection && (
314 |                 <td className="center">
315 |                   <button
316 |                     type="button"
317 |                     className={`row-select-handle ${selected ? "active" : ""}`}
318 |                     onClick={() => onToggleSelect?.(id)}
319 |                     title={selected ? "Deselect row" : "Select row"}
320 |                   >
321 |                     o
322 |                   </button>
323 |                 </td>
324 |               )}
325 |               {columns.map((col) => (
326 |                 <td key={`${id}-${String(col.key)}`} className={col.align}>
327 |                   {renderCellInput((row as any)[col.key], col, (val) => onRowChange(id, col.key, val))}
328 |                 </td>
329 |               ))}
330 |             </tr>
331 |           );
332 |         })}
333 |         <tr className="new-row" ref={newRowRef} onBlur={onNewRowBlur}>
334 |           {enableSelection && <td />}
335 |           {columns.map((col, idx) => (
336 |             <td key={`new-${String(col.key)}`} className={col.align}>
337 |               {renderCellInput(
338 |                 (newRow as any)[col.key],
339 |                 col,
340 |                 (val) => onNewRowChange(col.key, val),
341 |                 idx === 0 ? newRowFirstInputRef : undefined,
342 |               )}
343 |             </td>
344 |           ))}
345 |         </tr>
346 |       </tbody>
347 |       </table>
348 |       {filterMenu && (
349 |         <div
350 |           ref={filterPopoverRef}
351 |           className="filter-popover"
352 |           style={{ top: filterMenu.position.y, left: filterMenu.position.x }}
353 |         >
354 |           <div className="filter-popover-header">
355 |             <div className="filter-title">{filterMenu.title}</div>
356 |             <button className="btn secondary icon-btn" onClick={closeFilterMenu} title="Close" type="button">
357 |               <X size={14} />
358 |             </button>
359 |           </div>
360 |           <div className="filter-body">
361 |             <label className="filter-label">Contains</label>
362 |             <input
363 |               className="table-input filter-input"
364 |               value={filterMenu.draft.text}
365 |               onChange={(e) =>
366 |                 setFilterMenu((prev) =>
367 |                   prev ? { ...prev, draft: { ...prev.draft, text: e.target.value } } : prev,
368 |                 )
369 |               }
370 |               placeholder="Type to search"
371 |             />
372 |             <div className="filter-values">
373 |               <div className="filter-values-scroll">
374 |                 {filterMenu.values.map((val) => {
375 |                   const checked = filterMenu.draft.values.has(val.value);
376 |                   return (
377 |                     <label key={val.value} className="filter-checkbox">
```

### What’s happening here (and why it matters)
- ✅ Header click cycles sort: none → asc → desc → none via nested ternary.
- ✅ Filter button uses `stopPropagation()` so it doesn’t trigger header sorting.
- ✅ Active filters are highlighted by checking `filters[colKey]` existence.

### 🧪 Deeper dive: why `stopPropagation()` is required
- The `<th>` has an `onClick` to sort.
- The filter icon button lives inside the `<th>`.
- Events bubble upward, so clicking the icon would also sort unless we stop propagation.


## Table body: existing rows
**Lines 379–410**

```tsx
379 |                         type="checkbox"
380 |                         checked={checked}
381 |                         onChange={(e) => {
382 |                           setFilterMenu((prev) => {
383 |                             if (!prev) return prev;
384 |                             const next = new Set(prev.draft.values);
385 |                             if (e.target.checked) next.add(val.value);
386 |                             else next.delete(val.value);
387 |                             return { ...prev, draft: { ...prev.draft, values: next } };
388 |                           });
389 |                         }}
390 |                       />
391 |                       <span>{val.label}</span>
392 |                     </label>
393 |                   );
394 |                 })}
395 |               </div>
396 |             </div>
397 |           </div>
398 |           <div className="filter-footer">
399 |             <button className="btn secondary small-btn" onClick={clearFilter} type="button">
400 |               Clear
401 |             </button>
402 |             <button className="btn primary small-btn" onClick={applyFilter} type="button">
403 |               Apply
404 |             </button>
405 |           </div>
406 |         </div>
407 |       )}
408 |     </>
409 |   );
410 | }
```

### What’s happening here (and why it matters)
- ✅ Row selection uses a Set for quick lookup and toggles via callback.
- ✅ Cell edits call `onRowChange(id, key, value)`; parent updates the data.

## New-row editor row
**Lines 419–410**

```tsx
```

### What’s happening here (and why it matters)
- ✅ The bottom row edits `newRow` via `onNewRowChange` without immediately adding to `rows`.
- ✅ First input can receive a ref for auto-focus / fast data entry workflows.

## Filter popover UI
**Lines 441–410**

```tsx
```

### What’s happening here (and why it matters)
- ✅ Popover renders only when open (`filterMenu != null`).
- ✅ Checkbox toggles clone the Set to keep state updates immutable.
- ✅ Apply persists draft into `filters`; Clear deletes that column’s filter.

---

## Quick glossary
- **Controlled component**: parent owns state; this component emits callbacks.
- **Immutability**: create new arrays/objects instead of mutating existing ones so React detects changes.
- **Ref**: holds a pointer to a DOM node for behaviors like click-outside detection.

## Want it even more granular?
If you want **literally every line** annotated (including JSX braces and small helper lines), tell me and I’ll generate a second file that does that.