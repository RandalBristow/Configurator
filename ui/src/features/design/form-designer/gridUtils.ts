export type GridBreakpointKey = "base" | "sm" | "md" | "lg" | "xl";

// Stored values may come from persisted JSON or free-form inputs, so accept strings too.
export type ResponsiveNumber = Partial<Record<GridBreakpointKey, number | string>>;

const GRID_BREAKPOINTS: Array<{ key: GridBreakpointKey; minWidth: number }> = [
  { key: "xl", minWidth: 1280 },
  { key: "lg", minWidth: 1024 },
  { key: "md", minWidth: 768 },
  { key: "sm", minWidth: 640 },
  { key: "base", minWidth: 0 },
];

const GRID_KEYS: GridBreakpointKey[] = ["base", "sm", "md", "lg", "xl"];

const clampColumns = (value: number) => Math.min(Math.max(value, 1), 12);

export const normalizeResponsiveNumber = (
  value: ResponsiveNumber | number | undefined,
  fallback: number
) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    const clamped = clampColumns(value);
    return GRID_KEYS.reduce<ResponsiveNumber>((acc, key) => {
      acc[key] = clamped;
      return acc;
    }, {});
  }
  const nextValue: ResponsiveNumber = {};
  GRID_KEYS.forEach((key) => {
    let candidate = undefined;
    if (typeof value === "object" && value) {
      const raw = value[key];
      const numeric =
        typeof raw === "number"
          ? raw
          : typeof raw === "string" && raw.trim() !== ""
            ? Number(raw)
            : NaN;
      if (Number.isFinite(numeric)) {
        candidate = numeric;
      }
    }
    nextValue[key] = clampColumns(candidate ?? fallback);
  });
  return nextValue;
};

export const getActiveBreakpoint = (width: number): GridBreakpointKey => {
  for (const breakpoint of GRID_BREAKPOINTS) {
    if (width >= breakpoint.minWidth) return breakpoint.key;
  }
  return "base";
};

export const getResponsiveValue = (
  values: ResponsiveNumber | undefined,
  active: GridBreakpointKey,
  fallback: number
) => {
  if (!values) return fallback;
  const startIndex = GRID_KEYS.indexOf(active);
  for (let i = startIndex; i >= 0; i -= 1) {
    const key = GRID_KEYS[i];
    const raw = values[key];
    const numeric =
      typeof raw === "number"
        ? raw
        : typeof raw === "string" && raw.trim() !== ""
          ? Number(raw)
          : NaN;
    if (Number.isFinite(numeric)) return Number(numeric);
  }
  return fallback;
};

export const getGridColumnsForWidth = (
  columns: ResponsiveNumber | number | undefined,
  width: number
) => {
  const normalized = normalizeResponsiveNumber(columns, 12);
  const active = getActiveBreakpoint(width);
  return clampColumns(getResponsiveValue(normalized, active, 12));
};

export const getGridColumnFromPoint = (
  rect: DOMRect | null,
  clientX: number,
  columns: number
) => {
  if (!rect || columns <= 0) return 1;
  const relativeX = Math.min(Math.max(clientX - rect.left, 0), rect.width);
  const columnWidth = rect.width / columns;
  const rawIndex = Math.floor(relativeX / columnWidth) + 1;
  return Math.min(Math.max(rawIndex, 1), columns);
};

export const buildGridLayoutForColumn = (
  column: number,
  span?: ResponsiveNumber
) => {
  const safeColumn = clampColumns(column);
  return {
    start: GRID_KEYS.reduce<ResponsiveNumber>((acc, key) => {
      acc[key] = safeColumn;
      return acc;
    }, {}),
    span: span ?? GRID_KEYS.reduce<ResponsiveNumber>((acc, key) => {
      acc[key] = 1;
      return acc;
    }, {}),
  };
};

export const clampGridPlacement = (
  start: number,
  span: number,
  columns: number
) => {
  const safeColumns = clampColumns(columns);
  const safeStart = Math.min(Math.max(start, 1), safeColumns);
  const safeSpan = Math.min(Math.max(span, 1), safeColumns);
  if (safeStart + safeSpan - 1 > safeColumns) {
    return { start: safeStart, span: Math.max(1, safeColumns - safeStart + 1) };
  }
  return { start: safeStart, span: safeSpan };
};

export const getNextGridStart = (
  items: Array<{ start: number; span: number }>,
  columns: number,
  span = 1
) => {
  const safeColumns = clampColumns(columns);
  const safeSpan = Math.min(Math.max(span, 1), safeColumns);
  if (!items.length) return 1;
  const rows: boolean[][] = [];
  const ensureRow = (index: number) => {
    while (rows.length <= index) {
      rows.push(Array(safeColumns).fill(false));
    }
  };
  const canPlace = (row: boolean[], start: number, length: number) => {
    if (start + length - 1 > safeColumns) return false;
    for (let col = start; col < start + length; col += 1) {
      if (row[col - 1]) return false;
    }
    return true;
  };
  const markRow = (row: boolean[], start: number, length: number) => {
    for (let col = start; col < start + length; col += 1) {
      row[col - 1] = true;
    }
  };

  let cursorRow = 0;
  let cursorCol = 1;

  items.forEach((item) => {
    const placement = clampGridPlacement(item.start, item.span, safeColumns);
    let rowIndex = cursorRow;
    while (true) {
      ensureRow(rowIndex);
      const rowCursorCol = rowIndex === cursorRow ? cursorCol : 1;
      if (placement.start < rowCursorCol) {
        rowIndex += 1;
        continue;
      }
      if (canPlace(rows[rowIndex], placement.start, placement.span)) {
        markRow(rows[rowIndex], placement.start, placement.span);
        cursorRow = rowIndex;
        cursorCol = placement.start + placement.span;
        if (cursorCol > safeColumns) {
          cursorRow += 1;
          cursorCol = 1;
        }
        break;
      }
      rowIndex += 1;
    }
  });

  if (cursorCol + safeSpan - 1 > safeColumns) return 1;
  return cursorCol;
};
