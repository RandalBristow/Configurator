import React from "react";
import { createPortal } from "react-dom";
import { Search, Slash, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TABLER_ICON_VARIANTS,
  TablerIcon,
  getTablerIconNamesForVariant,
  normalizeTablerIconName,
} from "./tabler-icon-library";
import { SegmentedPill } from "./segmented-pill";
import { Input } from "@/components/ui/input";

const GRID_COLUMNS = 5;
const GRID_ROW_HEIGHT = 64; // 56px item + 8px gap
const GRID_OVERSCAN_ROWS = 2;

type Props = {
  value?: string;
  onChange: (value: string) => void;
  variant?: string;
  onVariantChange?: (value: string) => void;
  stroke?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showVariants?: boolean;
  popoverPlacement?: "bottom" | "left";
};

export function IconPicker({
  value,
  onChange,
  variant,
  onVariantChange,
  stroke = 2,
  placeholder = "No icon selected",
  disabled = false,
  className,
  showVariants = false,
  popoverPlacement = "bottom",
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [internalVariant, setInternalVariant] = React.useState(
    variant || "outlined"
  );
  const hasQuery = query.trim().length > 0;
  const [gridScrollTop, setGridScrollTop] = React.useState(0);
  const [gridViewportHeight, setGridViewportHeight] = React.useState(0);
  const [floatingStyle, setFloatingStyle] = React.useState<
    React.CSSProperties | undefined
  >(undefined);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const popoverRef = React.useRef<HTMLDivElement | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const gridRef = React.useRef<HTMLDivElement | null>(null);
  const effectiveVariant = variant || internalVariant;
  const iconNames = React.useMemo(
    () => getTablerIconNamesForVariant(effectiveVariant),
    [effectiveVariant]
  );
  const safeValue = value ?? "";
  const normalizedValue = normalizeTablerIconName(safeValue);

  const filtered = React.useMemo(() => {
    const normalizedQuery = normalizeTablerIconName(query);
    if (!normalizedQuery) return iconNames;
    const compact = normalizedQuery.replace(/-/g, "");
    return iconNames.filter((name) => {
      const normalizedName = normalizeTablerIconName(name);
      if (normalizedName.includes(normalizedQuery)) return true;
      return normalizedName.replace(/-/g, "").includes(compact);
    });
  }, [iconNames, query, effectiveVariant]);

  const allItems = React.useMemo(
    () => ["__none__", ...filtered],
    [filtered]
  );

  const totalRows = Math.ceil(allItems.length / GRID_COLUMNS);
  const startRow = Math.max(
    0,
    Math.floor(gridScrollTop / GRID_ROW_HEIGHT) - GRID_OVERSCAN_ROWS
  );
  const endRow = Math.min(
    totalRows,
    Math.ceil((gridScrollTop + gridViewportHeight) / GRID_ROW_HEIGHT) +
      GRID_OVERSCAN_ROWS
  );
  const startIndex = startRow * GRID_COLUMNS;
  const endIndex = Math.min(allItems.length, endRow * GRID_COLUMNS);
  const visibleItems = allItems.slice(startIndex, endIndex);
  const gridPaddingTop = startRow * GRID_ROW_HEIGHT;
  const gridPaddingBottom = Math.max(0, totalRows - endRow) * GRID_ROW_HEIGHT;

  React.useEffect(() => {
    if (!variant) return;
    setInternalVariant(variant);
  }, [variant]);

  React.useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (
        event.target instanceof Node &&
        (rootRef.current.contains(event.target) ||
          popoverRef.current?.contains(event.target))
      ) {
        return;
      }
      setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  React.useLayoutEffect(() => {
    if (!open) return;
    const el = gridRef.current;
    if (!el) return;
    setGridViewportHeight(el.clientHeight);
    setGridScrollTop(el.scrollTop);
  }, [open, popoverPlacement]);

  React.useEffect(() => {
    if (!open) return;
    const el = gridRef.current;
    if (!el) return;
    let raf = 0;
    const handleScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setGridScrollTop(el.scrollTop);
      });
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", handleScroll);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    // When the result set changes, start the user at the top.
    if (!gridRef.current) return;
    gridRef.current.scrollTop = 0;
    setGridScrollTop(0);
  }, [open, query, effectiveVariant]);

  const updateFloatingPosition = React.useCallback(() => {
    if (!rootRef.current) return;
    if (popoverPlacement !== "left") return;
    const anchor = buttonRef.current || rootRef.current;
    const anchorRect = anchor.getBoundingClientRect();
    const popoverRect = popoverRef.current?.getBoundingClientRect();
    const popoverWidth = popoverRect?.width ?? 420;
    const popoverHeight = popoverRect?.height ?? 320;
    const gutter = 12;
    const viewportPadding = 8;
    let left = anchorRect.left - popoverWidth - gutter;
    let top = anchorRect.top;
    left = Math.max(
      viewportPadding,
      Math.min(left, window.innerWidth - popoverWidth - viewportPadding)
    );
    top = Math.max(
      viewportPadding,
      Math.min(top, window.innerHeight - popoverHeight - viewportPadding)
    );
    setFloatingStyle({
      position: "fixed",
      left,
      top,
      width: popoverWidth,
      zIndex: 60,
    });
  }, [popoverPlacement]);

  React.useLayoutEffect(() => {
    if (!open || popoverPlacement !== "left") return;
    updateFloatingPosition();
  }, [open, popoverPlacement, query, updateFloatingPosition]);

  React.useEffect(() => {
    if (!open || popoverPlacement !== "left") return;
    const scrollParent = rootRef.current?.closest(".properties-panel__inspector");
    const handleScroll = () => updateFloatingPosition();
    window.addEventListener("resize", handleScroll);
    scrollParent?.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", handleScroll);
      scrollParent?.removeEventListener("scroll", handleScroll);
    };
  }, [open, popoverPlacement, updateFloatingPosition]);

  const handleToggle = () => {
    if (disabled) return;
    setOpen((prev) => !prev);
  };

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
    setQuery("");
  };

  const handleVariantChange = (nextValue: string) => {
    if (onVariantChange) {
      onVariantChange(nextValue);
      requestAnimationFrame(() => {
        gridRef.current?.scrollTo?.({ top: 0 });
        gridRef.current && (gridRef.current.scrollTop = 0);
        setGridScrollTop(0);
        inputRef.current?.focus();
      });
      return;
    }
    setInternalVariant(nextValue);
    requestAnimationFrame(() => {
      gridRef.current?.scrollTo?.({ top: 0 });
      gridRef.current && (gridRef.current.scrollTop = 0);
      setGridScrollTop(0);
      inputRef.current?.focus();
    });
  };

  const handleClear = (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    handleSelect("");
  };

  const handleClearQuery = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setQuery("");
    inputRef.current?.focus();
  };

  const hasSelection = Boolean(safeValue.trim());
  const labelValue = hasSelection ? normalizedValue.replace(/-/g, " ") : "";

  return (
    <div
      ref={rootRef}
      className={cn(
        "icon-picker",
        open && "is-open",
        popoverPlacement === "left" && "icon-picker--left",
        className
      )}
      data-disabled={disabled ? "true" : "false"}
      data-has-selection={hasSelection ? "true" : "false"}
    >
      <div className="icon-picker__field">
        <button
          type="button"
          className="icon-picker__button"
          onClick={handleToggle}
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={disabled}
          title={hasSelection ? safeValue : "Select icon"}
          ref={buttonRef}
        >
          <TablerIcon
            name={safeValue}
            variant={effectiveVariant}
            size={18}
            stroke={stroke}
            className="icon-picker__button-icon"
          />
          {!hasSelection ? (
            <span className="icon-picker__button-placeholder">No icon</span>
          ) : null}
        </button>
        <input
          className="icon-picker__input"
          type="text"
          readOnly
          value={labelValue}
          placeholder={placeholder}
          onClick={handleToggle}
          aria-readonly="true"
        />
        {hasSelection ? (
          <button
            type="button"
            className="icon-picker__clear"
            onClick={handleClear}
            title="Clear icon"
            aria-label="Clear icon"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {open
        ? (popoverPlacement === "left"
            ? createPortal(
                <div
                  ref={popoverRef}
                  className="icon-picker__popover icon-picker__popover--floating"
                  role="listbox"
                  style={floatingStyle}
                >
                  <div className="icon-picker__search">
                    <Search className="icon-picker__search-icon" />
                    <Input
                      ref={inputRef}
                      className="icon-picker__search-input inspector-input"
                      type="text"
                      placeholder="Search icons"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                    <button
                      type="button"
                      className="icon-picker__search-clear"
                      onClick={handleClearQuery}
                      aria-label="Clear search"
                      title="Clear search"
                      disabled={!hasQuery}
                    >
                      <X size={12} />
                    </button>
                  </div>
                  {showVariants ? (
                    <SegmentedPill
                      value={effectiveVariant}
                      options={TABLER_ICON_VARIANTS}
                      onChange={handleVariantChange}
                      className="icon-picker__variants"
                      disabled={disabled}
                      showCheck={false}
                    />
                  ) : null}
                  <div className="icon-picker__grid" ref={gridRef}>
                    <div
                      className="icon-picker__grid-inner"
                      style={{
                        paddingTop: gridPaddingTop,
                        paddingBottom: gridPaddingBottom,
                      }}
                    >
                      {filtered.length === 0 ? (
                        <div className="icon-picker__empty">No icons found</div>
                      ) : null}
                      {visibleItems.map((name) => {
                        const isNone = name === "__none__";
                        const isActive = isNone
                          ? !hasSelection
                          : normalizeTablerIconName(name) === normalizedValue;
                        const title = isNone ? "No icon" : name;
                        return (
                          <button
                            key={`${name}-${effectiveVariant}`}
                            type="button"
                            className={cn(
                              "icon-picker__item",
                              isActive && "is-active"
                            )}
                            onClick={() => handleSelect(isNone ? "" : name)}
                            title={title}
                            aria-label={title}
                          >
                            {isNone ? (
                              <Slash className="icon-picker__item-icon" size={24} />
                            ) : (
                              <TablerIcon
                                name={name}
                                variant={effectiveVariant}
                                size={26}
                                stroke={2}
                                className="icon-picker__item-icon"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>,
                document.body
              )
            : (
              <div ref={popoverRef} className="icon-picker__popover" role="listbox">
                <div className="icon-picker__search">
                  <Search className="icon-picker__search-icon" />
                  <Input
                    ref={inputRef}
                    className="icon-picker__search-input inspector-input"
                    type="text"
                    placeholder="Search icons"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <button
                    type="button"
                    className="icon-picker__search-clear"
                    onClick={handleClearQuery}
                    aria-label="Clear search"
                    title="Clear search"
                    disabled={!hasQuery}
                  >
                    <X size={12} />
                  </button>
                </div>
                {showVariants ? (
                  <SegmentedPill
                    value={effectiveVariant}
                    options={TABLER_ICON_VARIANTS}
                    onChange={handleVariantChange}
                    className="icon-picker__variants"
                    disabled={disabled}
                    showCheck={false}
                  />
                ) : null}
                <div className="icon-picker__grid" ref={gridRef}>
                  <div
                    className="icon-picker__grid-inner"
                    style={{
                      paddingTop: gridPaddingTop,
                      paddingBottom: gridPaddingBottom,
                    }}
                  >
                    {filtered.length === 0 ? (
                      <div className="icon-picker__empty">No icons found</div>
                    ) : null}
                    {visibleItems.map((name) => {
                      const isNone = name === "__none__";
                      const isActive = isNone
                        ? !hasSelection
                        : normalizeTablerIconName(name) === normalizedValue;
                      const title = isNone ? "No icon" : name;
                      return (
                        <button
                          key={`${name}-${effectiveVariant}`}
                          type="button"
                          className={cn(
                            "icon-picker__item",
                            isActive && "is-active"
                          )}
                          onClick={() => handleSelect(isNone ? "" : name)}
                          title={title}
                          aria-label={title}
                        >
                          {isNone ? (
                            <Slash className="icon-picker__item-icon" size={24} />
                          ) : (
                            <TablerIcon
                              name={name}
                              variant={effectiveVariant}
                              size={26}
                              stroke={2}
                              className="icon-picker__item-icon"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
        : null}
    </div>
  );
}
