// @ts-nocheck
import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useDesignerStore } from "@/stores/designerStore";
import { getDropZoneDataset, getDropZoneId } from "./containerUtils";
import {
  clampGridPlacement,
  getActiveBreakpoint,
  getGridColumnsForWidth,
  getNextGridStart,
  getResponsiveValue,
} from "./gridUtils";
import { getPaperStyles } from "./paperStyles";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Settings,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { DesignerContextMenu } from "./DesignerContextMenu";

const CONTAINER_WIDTHS = {
  xs: 360,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};

const getContainerMaxWidth = (value) => {
  if (value === false || value === "false") return null;
  if (typeof value === "string" && CONTAINER_WIDTHS[value]) {
    return CONTAINER_WIDTHS[value];
  }
  return null;
};

const isSameTarget = (a, b) => {
  if (!a || !b) return false;
  if (a.kind !== b.kind) return false;
  if (a.kind === "root") return true;
  if (a.componentId !== b.componentId) return false;
  if (a.kind === "tabPanel") return a.tabId === b.tabId;
  if (a.kind === "accordionPanel") return a.panelId === b.panelId;
  if (a.kind === "multiInstanceStep") return a.stepId === b.stepId;
  if (a.kind === "gridColumn") return a.column === b.column;
  return true;
};

const FLEX_DIRECTIONS = ["row", "row-reverse", "column", "column-reverse"];
const FLEX_WRAP = ["nowrap", "wrap", "wrap-reverse"];
const FLEX_JUSTIFY = [
  "flex-start",
  "center",
  "flex-end",
  "space-between",
  "space-around",
  "space-evenly",
];
const FLEX_ALIGN_ITEMS = [
  "stretch",
  "flex-start",
  "center",
  "flex-end",
  "baseline",
];
const FLEX_ALIGN_CONTENT = [
  "stretch",
  "flex-start",
  "center",
  "flex-end",
  "space-between",
  "space-around",
];

const getFlexValue = (value, allowed, fallback) =>
  allowed.includes(value) ? value : fallback;

const TAB_VARIANTS = ["line", "enclosed", "soft-rounded", "solid-rounded"];
const TAB_ORIENTATIONS = ["horizontal", "vertical"];
const TAB_SIZES = ["sm", "md", "lg"];
const TAB_ALIGN = ["start", "center", "end"];
const TAB_SCHEMES = ["accent", "danger"];

const getTabValue = (value, allowed, fallback) =>
  allowed.includes(value) ? value : fallback;

const getDefaultTabId = (tabs, defaultTab) => {
  if (!Array.isArray(tabs) || tabs.length === 0) return null;
  const index = Number(defaultTab);
  if (Number.isFinite(index) && index > 0 && tabs[index - 1]) {
    return tabs[index - 1].id;
  }
  return tabs[0]?.id ?? null;
};

const getFlexGap = (value, fallback = 12) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const DropZone = ({
  target,
  className,
  children,
  emptyLabel,
  empty,
  innerRef,
  style,
  onDropActiveChange,
}) => {
  const activeDropTarget = useDesignerStore((state) => state.activeDropTarget);
  const { setNodeRef, isOver } = useDroppable({
    id: getDropZoneId(target),
    data: { target },
  });
  const setRefs = (node) => {
    setNodeRef(node);
    if (innerRef) {
      innerRef.current = node;
    }
  };
  const isActiveDropTarget =
    isOver || (activeDropTarget && isSameTarget(activeDropTarget, target));
  const dropClassName = [
    className,
    isActiveDropTarget ? "is-drop-target" : null,
  ]
    .filter(Boolean)
    .join(" ");
  React.useEffect(() => {
    if (onDropActiveChange) {
      onDropActiveChange(isActiveDropTarget);
    }
  }, [isActiveDropTarget, onDropActiveChange]);
  return (
    <div
      ref={setRefs}
      id={getDropZoneId(target)}
      className={dropClassName}
      style={style}
      {...getDropZoneDataset(target)}
    >
      {children}
      {empty ? (
        <div className="designer-drop-empty">
          {emptyLabel || "Drop components here"}
        </div>
      ) : null}
    </div>
  );
};

export const SectionContainer = ({ component, columns }) => {
  const { flowDropIndicator } = useDesignerStore();
  const layout =
    component.properties.layout === "two-column" ? "two-column" : "single-column";
  const collapsed = Boolean(component.properties.collapsed);
  const hasChildren = columns.some((column) => column.hasChildren);

  return (
    <div
      className={`designer-section designer-section--${layout}${
        collapsed ? " is-collapsed" : ""
      }`}
    >
      {!collapsed ? (
        <div className="designer-section__body">
          <div
            className="designer-section__columns"
            style={{
              gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
            }}
          >
            {columns.map((column) => (
              <DropZone
                key={column.index}
                target={column.target}
                className="designer-section__column"
                empty={!column.hasChildren && !hasChildren && column.index === 1}
                emptyLabel="Drop components here"
              >
                {(() => {
                  const children = React.Children.toArray(column.children);
                  const indicatorIndex =
                    flowDropIndicator &&
                    flowDropIndicator.target.kind === "gridColumn" &&
                    flowDropIndicator.target.componentId === component.id &&
                    flowDropIndicator.target.column === column.index
                      ? flowDropIndicator.index
                      : null;
                  if (indicatorIndex !== null) {
                    const safeIndex = Math.min(
                      Math.max(indicatorIndex, 0),
                      children.length
                    );
                    children.splice(
                      safeIndex,
                      0,
                      <div
                        key={`flow-drop-indicator-${column.index}`}
                        className="designer-flow-drop-indicator"
                      />
                    );
                  }
                  return children;
                })()}
              </DropZone>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export const SubsectionContainer = ({ component, target, children }) => {
  const { flowDropIndicator } = useDesignerStore();
  const hasChildren = React.Children.count(children) > 0;
  return (
    <div className="designer-subsection">
      <DropZone
        target={target}
        className="designer-subsection__body"
        empty={!hasChildren}
        emptyLabel="Drop components here"
      >
        {(() => {
          const items = React.Children.toArray(children);
          const indicatorIndex =
            flowDropIndicator &&
            flowDropIndicator.target.kind === "children" &&
            flowDropIndicator.target.componentId === component.id
              ? flowDropIndicator.index
              : null;
          if (indicatorIndex !== null) {
            const safeIndex = Math.min(
              Math.max(indicatorIndex, 0),
              items.length
            );
            items.splice(
              safeIndex,
              0,
              <div
                key={`flow-drop-indicator-${component.id}`}
                className="designer-flow-drop-indicator"
              />
            );
          }
          return items;
        })()}
      </DropZone>
    </div>
  );
};

export const PaperContainer = ({ component, target, children }) => {
  const title = "Paper";
  const hasChildren = React.Children.count(children) > 0;
  const styles = getPaperStyles(component.properties);
  return (
    <div className="designer-paper" style={styles}>
      <div className="designer-paper__header">
        <div className="designer-paper__title">{title}</div>
      </div>
      <DropZone
        target={target}
        className="designer-paper__body"
        empty={!hasChildren}
        emptyLabel="Drop components here"
      >
        {children}
      </DropZone>
    </div>
  );
};

export const CardContainer = ({ component, target, children }) => {
  const { flowDropIndicator } = useDesignerStore();
  const showHeader = component.properties?.showHeader !== false;
  const showFooter = Boolean(component.properties?.showFooter);
  const headerTitle =
    typeof component.properties?.headerTitle === "string"
      ? component.properties.headerTitle
      : "Card Title";
  const headerSubtitle =
    typeof component.properties?.headerSubtitle === "string"
      ? component.properties.headerSubtitle
      : "";
  const footerText =
    typeof component.properties?.footerText === "string"
      ? component.properties.footerText
      : "";
  const footerAlign =
    component.properties?.footerAlign === "center" ||
    component.properties?.footerAlign === "right"
      ? component.properties.footerAlign
      : "left";
  const hasChildren = React.Children.count(children) > 0;
  const styles = getPaperStyles(component.properties);
  return (
    <div className="designer-card" style={styles}>
      <DropZone
        target={target}
        className="designer-card__body"
        empty={!hasChildren}
        emptyLabel="Drop components here"
      >
        {showHeader ? (
          <div className="designer-card__content-header">
            <div className="designer-card__content-title">{headerTitle}</div>
            {headerSubtitle ? (
              <div className="designer-card__content-subtitle">
                {headerSubtitle}
              </div>
            ) : null}
          </div>
        ) : null}
        {(() => {
          const items = React.Children.toArray(children);
          const indicatorIndex =
            flowDropIndicator &&
            flowDropIndicator.target.kind === "children" &&
            flowDropIndicator.target.componentId === component.id
              ? flowDropIndicator.index
              : null;
          if (indicatorIndex !== null) {
            const safeIndex = Math.min(
              Math.max(indicatorIndex, 0),
              items.length
            );
            items.splice(
              safeIndex,
              0,
              <div
                key={`flow-drop-indicator-${component.id}`}
                className="designer-flow-drop-indicator"
              />
            );
          }
          return items;
        })()}
        {showFooter ? (
          <div
            className="designer-card__footer"
            style={{ textAlign: footerAlign }}
          >
            {footerText || "Footer"}
          </div>
        ) : null}
      </DropZone>
    </div>
  );
};

export const ContainerContainer = ({ component, target, children }) => {
  const maxWidth = getContainerMaxWidth(component.properties?.maxWidth);
  const fixed = Boolean(component.properties?.fixed);
  const disableGutters = Boolean(component.properties?.disableGutters);
  const isGroup = component.properties?.isGroup === true;
  const hasChildren = React.Children.count(children) > 0;
  const rawPaddingX =
    typeof component.properties?.paddingX === "number"
      ? component.properties.paddingX
      : Number(component.properties?.paddingX);
  const rawPaddingY =
    typeof component.properties?.paddingY === "number"
      ? component.properties.paddingY
      : Number(component.properties?.paddingY);
  const paddingX = Number.isFinite(rawPaddingX)
    ? rawPaddingX
    : disableGutters
      ? 0
      : 16;
  const paddingY = Number.isFinite(rawPaddingY) ? rawPaddingY : 10;
  return (
    <div
      className={`designer-layout-container${
        isGroup ? " is-group" : ""
      }`}
      data-group={isGroup ? "true" : "false"}
    >
      <DropZone
        target={target}
        className="designer-layout-container__drop"
        empty={!hasChildren}
        emptyLabel="Drop components here"
        style={{
          maxWidth: maxWidth ? `${maxWidth}px` : undefined,
          width: fixed && maxWidth ? `${maxWidth}px` : "100%",
          margin: "0 auto",
          padding: `${paddingY}px ${paddingX}px`,
        }}
      >
        {children}
      </DropZone>
    </div>
  );
};

export const FlexContainer = ({ component, target, children }) => {
  const { flowDropIndicator } = useDesignerStore();
  const hasChildren = React.Children.count(children) > 0;
  const direction = getFlexValue(
    component.properties?.direction,
    FLEX_DIRECTIONS,
    "row"
  );
  const wrap = getFlexValue(component.properties?.wrap, FLEX_WRAP, "wrap");
  const justifyContent = getFlexValue(
    component.properties?.justifyContent,
    FLEX_JUSTIFY,
    "flex-start"
  );
  const alignItems = getFlexValue(
    component.properties?.alignItems,
    FLEX_ALIGN_ITEMS,
    "stretch"
  );
  const alignContent = getFlexValue(
    component.properties?.alignContent,
    FLEX_ALIGN_CONTENT,
    "stretch"
  );
  const gap = getFlexGap(component.properties?.gap, 12);
  return (
    <div className="designer-flex">
      <DropZone
        target={target}
        className="designer-flex__body"
        empty={!hasChildren}
        emptyLabel="Drop components here"
        style={{
          flexDirection: direction,
          flexWrap: wrap,
          justifyContent,
          alignItems,
          alignContent,
          gap: `${gap}px`,
        }}
      >
        {(() => {
          const items = React.Children.toArray(children);
          const indicatorIndex =
            flowDropIndicator &&
            flowDropIndicator.target.kind === "children" &&
            flowDropIndicator.target.componentId === component.id
              ? flowDropIndicator.index
              : null;
          if (indicatorIndex !== null) {
            const safeIndex = Math.min(
              Math.max(indicatorIndex, 0),
              items.length
            );
            items.splice(
              safeIndex,
              0,
              <div
                key={`flow-drop-indicator-${component.id}`}
                className="designer-flow-drop-indicator"
              />
            );
          }
          return items;
        })()}
      </DropZone>
    </div>
  );
};

export const GridContainer = ({ component, target, children }) => {
  const bodyRef = React.useRef(null);
  const [columnCount, setColumnCount] = useState(() =>
    getGridColumnsForWidth(component.properties?.columns, 0)
  );
  const [bodyWidth, setBodyWidth] = useState(0);
  const [isDropActive, setIsDropActive] = useState(false);
  const [previewHeight, setPreviewHeight] = useState(null);
  const hasChildren = React.Children.count(children) > 0;
  const { flowDropIndicator, draggedComponent } = useDesignerStore();
  const collapsed = Boolean(component.properties?.collapsed);

  React.useEffect(() => {
    const node = bodyRef.current;
    if (!node) return;
    const updateColumns = () => {
      const width = node.getBoundingClientRect().width;
      setBodyWidth(width);
      setColumnCount(
        getGridColumnsForWidth(component.properties?.columns, width)
      );
    };
    updateColumns();
    const observer = new window.ResizeObserver(updateColumns);
    observer.observe(node);
    return () => observer.disconnect();
  }, [component.properties?.columns]);

  const isFlowTarget =
    flowDropIndicator &&
    flowDropIndicator.target.kind === "children" &&
    flowDropIndicator.target.componentId === component.id;
  const showPreview = isDropActive || isFlowTarget;
  const childList = Array.isArray(component.children) ? component.children : [];
  const previewPlacement = (() => {
    if (!showPreview) return null;
    const active = getActiveBreakpoint(bodyWidth);
    const draggedId = draggedComponent?.id;
    const placements = childList
      .filter((child) => child.id !== draggedId)
      .map((child) => {
        const legacyStart = child.column ?? 1;
        const startValue = child.grid?.start
          ? getResponsiveValue(child.grid?.start, active, legacyStart)
          : legacyStart;
        const spanValue = child.grid?.span
          ? getResponsiveValue(child.grid?.span, active, 1)
          : 1;
        return clampGridPlacement(startValue, spanValue, columnCount);
      });
    const previewSpan = draggedComponent?.grid?.span
      ? getResponsiveValue(draggedComponent.grid?.span, active, 1)
      : 1;
    const nextStart = getNextGridStart(placements, columnCount, previewSpan);
    return clampGridPlacement(nextStart, previewSpan, columnCount);
  })();

  React.useEffect(() => {
    if (!showPreview) {
      setPreviewHeight(null);
      return;
    }
    if (!draggedComponent?.id) {
      setPreviewHeight(null);
      return;
    }
    let frame = 0;
    frame = window.requestAnimationFrame(() => {
      const node = document.querySelector(
        `[data-component-id="${draggedComponent.id}"]`
      );
      if (node instanceof HTMLElement) {
        const measured = node.getBoundingClientRect().height;
        const fallback = draggedComponent.size?.height;
        const nextHeight =
          Number.isFinite(measured) && measured > 0
            ? measured
            : Number.isFinite(fallback)
              ? fallback
              : null;
        setPreviewHeight(nextHeight ?? null);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [showPreview, draggedComponent?.id, draggedComponent?.size?.height]);

  return (
    <div className={`designer-grid${collapsed ? " is-collapsed" : ""}`}>
      {!collapsed ? (
        <DropZone
          target={target}
          className="designer-grid__body"
          empty={!hasChildren && !showPreview}
          emptyLabel="Drop here"
          innerRef={bodyRef}
          onDropActiveChange={setIsDropActive}
          style={{
            gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
          }}
        >
          <div
            className="designer-grid__guides"
            style={{
              gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: columnCount }).map((_, index) => (
              <div key={index} className="designer-grid__guide" />
            ))}
          </div>
          {children}
          {previewPlacement ? (
            <div
              className="designer-grid__shadow"
              style={{
                gridColumn: `${previewPlacement.start} / span ${previewPlacement.span}`,
                height: previewHeight ? `${previewHeight}px` : undefined,
                minHeight: previewHeight ? `${previewHeight}px` : undefined,
              }}
            />
          ) : null}
        </DropZone>
      ) : null}
    </div>
  );
};

export const RepeaterContainer = ({ component, target, children }) => {
  const hasChildren = React.Children.count(children) > 0;

  return (
    <div className="designer-repeater">
      <DropZone
        target={target}
        className="designer-repeater__body"
        empty={!hasChildren}
        emptyLabel="Drop fields into the row template"
      >
        {children}
      </DropZone>
    </div>
  );
};

export const TabsContainer = ({ component, tabs }) => {
  const {
    updateComponent,
    openCollectionEditor,
  } = useDesignerStore();
  const [activeTabId, setActiveTabId] = useState(() =>
    getDefaultTabId(tabs, component.properties?.defaultTab)
  );
  const [contextMenu, setContextMenu] = useState(null);
  const didInitTabsRef = React.useRef(false);
  const defaultTabRef = React.useRef(component.properties?.defaultTab);
  const variant = getTabValue(
    component.properties?.variant,
    TAB_VARIANTS,
    "line"
  );
  const orientation = getTabValue(
    component.properties?.orientation,
    TAB_ORIENTATIONS,
    "horizontal"
  );
  const size = getTabValue(component.properties?.size, TAB_SIZES, "md");
  const align = getTabValue(component.properties?.align, TAB_ALIGN, "start");
  const fitted = Boolean(component.properties?.fitted);
  const scheme = getTabValue(
    component.properties?.colorScheme,
    TAB_SCHEMES,
    "accent"
  );

  React.useEffect(() => {
    didInitTabsRef.current = false;
  }, [component.id]);

  React.useEffect(() => {
    if (didInitTabsRef.current) return;
    const existingTabs = Array.isArray(component.properties?.tabs)
      ? component.properties.tabs
      : [];
    if (existingTabs.length === 0) {
      const legacyChildren = Array.isArray(component.children)
        ? component.children
        : [];
      const nextId = Math.random().toString(36).slice(2, 9);
      updateComponent(component.id, {
        properties: {
          ...component.properties,
          tabs: [
            {
              id: nextId,
              label: "Tab 1",
              children: legacyChildren,
            },
          ],
        },
        children: [],
      });
      setActiveTabId(nextId);
    }
    didInitTabsRef.current = true;
  }, [component, updateComponent]);

  React.useEffect(() => {
    if (!tabs.some((tab) => tab.id === activeTabId)) {
      setActiveTabId(
        getDefaultTabId(tabs, component.properties?.defaultTab)
      );
    }
  }, [tabs, activeTabId, component.properties?.defaultTab]);

  React.useEffect(() => {
    const currentDefault = component.properties?.defaultTab;
    if (defaultTabRef.current !== currentDefault) {
      defaultTabRef.current = currentDefault;
      setActiveTabId(getDefaultTabId(tabs, currentDefault));
    }
  }, [tabs, component.properties?.defaultTab]);

  const handleAddTab = () => {
    const nextId = Math.random().toString(36).slice(2, 9);
    const existingTabs = Array.isArray(component.properties?.tabs)
      ? component.properties.tabs
      : [];
    const nextTabs = [
      ...existingTabs,
      { id: nextId, label: `Tab ${tabs.length + 1}`, children: [] },
    ];
    updateComponent(component.id, {
      properties: { ...component.properties, tabs: nextTabs },
    });
    setActiveTabId(nextId);
  };

  const handleRemoveTab = (tabId) => {
    const existingTabs = Array.isArray(component.properties?.tabs)
      ? component.properties.tabs
      : [];
    const nextTabs = existingTabs.filter((tab) => tab.id !== tabId);
    updateComponent(component.id, {
      properties: { ...component.properties, tabs: nextTabs },
    });
    const nextActive =
      activeTabId === tabId
        ? nextTabs[0]?.id ?? null
        : nextTabs.some((tab) => tab.id === activeTabId)
          ? activeTabId
          : nextTabs[0]?.id ?? null;
    setActiveTabId(nextActive);
  };

  const moveTab = (tabId, delta) => {
    const existingTabs = Array.isArray(component.properties?.tabs)
      ? component.properties.tabs
      : [];
    const index = existingTabs.findIndex((tab) => tab.id === tabId);
    if (index < 0) return;
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= existingTabs.length) return;
    const nextTabs = [...existingTabs];
    const [moved] = nextTabs.splice(index, 1);
    nextTabs.splice(nextIndex, 0, moved);
    updateComponent(component.id, {
      properties: { ...component.properties, tabs: nextTabs },
    });
    setActiveTabId(tabId);
  };

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];

  const closeContextMenu = () => setContextMenu(null);

  const openTabMenuAt = (clientX, clientY, tabId) => {
    setContextMenu({ x: clientX, y: clientY, tabId: tabId ?? null });
  };

  const getMenuTabId = () => {
    if (contextMenu?.tabId) return contextMenu.tabId;
    return activeTabId ?? tabs[0]?.id ?? null;
  };

  const menuTabId = getMenuTabId();
  const menuTabIndex = menuTabId
    ? tabs.findIndex((tab) => tab.id === menuTabId)
    : -1;
  const hasTabs = tabs.length > 0;

  return (
    <div
      className="designer-tabs"
      data-variant={variant}
      data-orientation={orientation}
      data-size={size}
      data-align={align}
      data-fitted={fitted ? "true" : "false"}
      data-scheme={scheme}
      data-menu-open={contextMenu ? "true" : "false"}
    >
      <button
        type="button"
        className="designer-tabs__menu-btn"
        title="Tab pages"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const tabId = getMenuTabId();
          if (tabId) {
            setActiveTabId(tabId);
          }
          openTabMenuAt(rect.right, rect.bottom + 4, tabId);
        }}
      >
        <span className="designer-context-handle__dots" aria-hidden="true" />
      </button>

      <div className="designer-tabs__list">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`designer-tabs__tab${
              tab.id === activeTabId ? " is-active" : ""
            }${tab.disabled ? " is-disabled" : ""}${
              tab.hidden ? " is-hidden" : ""
            }`}
            onClick={() => setActiveTabId(tab.id)}
            data-tab-id={tab.id}
          >
            {tab.label || "Tab"}
          </button>
        ))}
      </div>
      {activeTab ? (
        <div className="designer-tabs__panel">{activeTab.children}</div>
      ) : (
        <div className="designer-tabs__empty">
          Add a tab to start building this section.
        </div>
      )}

      <DesignerContextMenu
        open={Boolean(contextMenu)}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        onClose={closeContextMenu}
        items={[
          {
            label: "Add Tab",
            icon: <Plus size={16} />,
            onSelect: handleAddTab,
          },
          {
            label: "Delete Tab",
            icon: <Trash2 size={16} />,
            disabled: !hasTabs || !menuTabId,
            onSelect: () => menuTabId && handleRemoveTab(menuTabId),
          },
          { kind: "separator" },
          {
            label: "Move Left",
            icon: <ChevronLeft size={16} />,
            disabled: !hasTabs || menuTabIndex <= 0,
            onSelect: () => menuTabId && moveTab(menuTabId, -1),
          },
          {
            label: "Move Right",
            icon: <ChevronRight size={16} />,
            disabled:
              !hasTabs || menuTabIndex < 0 || menuTabIndex >= tabs.length - 1,
            onSelect: () => menuTabId && moveTab(menuTabId, 1),
          },
          { kind: "separator" },
          {
            label: "Edit Tab Pages...",
            icon: <Settings size={16} />,
            onSelect: () =>
              openCollectionEditor({ kind: "tabPages", componentId: component.id }),
          },
        ]}
      />
    </div>
  );
};

export const AccordionContainer = ({ component, panels }) => {
  const { updateComponent, openCollectionEditor } = useDesignerStore();
  const [openPanelId, setOpenPanelId] = useState(panels[0]?.id ?? null);
  const [contextMenu, setContextMenu] = useState(null);

  React.useEffect(() => {
    if (!panels.some((panel) => panel.id === openPanelId)) {
      setOpenPanelId(panels[0]?.id ?? null);
    }
  }, [panels, openPanelId]);

  const handleAddPanel = () => {
    const nextId = Math.random().toString(36).slice(2, 9);
    const existingPanels = Array.isArray(component.properties?.panels)
      ? component.properties.panels
      : [];
    const nextPanels = [
      ...existingPanels,
      { id: nextId, title: `Panel ${existingPanels.length + 1}`, children: [] },
    ];
    updateComponent(component.id, {
      properties: { ...component.properties, panels: nextPanels },
    });
    setOpenPanelId(nextId);
  };

  const handleRemovePanel = (panelId) => {
    const existingPanels = Array.isArray(component.properties?.panels)
      ? component.properties.panels
      : [];
    const nextPanels = existingPanels.filter((panel) => panel.id !== panelId);
    updateComponent(component.id, {
      properties: { ...component.properties, panels: nextPanels },
    });
    if (openPanelId === panelId) {
      setOpenPanelId(nextPanels[0]?.id ?? null);
    }
  };

  const movePanel = (panelId, delta) => {
    const existingPanels = Array.isArray(component.properties?.panels)
      ? component.properties.panels
      : [];
    const index = existingPanels.findIndex((panel) => panel.id === panelId);
    if (index < 0) return;
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= existingPanels.length) return;
    const nextPanels = [...existingPanels];
    const [moved] = nextPanels.splice(index, 1);
    nextPanels.splice(nextIndex, 0, moved);
    updateComponent(component.id, {
      properties: { ...component.properties, panels: nextPanels },
    });
    setOpenPanelId(panelId);
  };

  const closeContextMenu = () => setContextMenu(null);

  const openPanelMenuAt = (clientX, clientY, panelId) => {
    setContextMenu({ x: clientX, y: clientY, panelId: panelId ?? null });
  };

  const getMenuPanelId = () => {
    if (contextMenu?.panelId) return contextMenu.panelId;
    return openPanelId ?? panels[0]?.id ?? null;
  };

  const menuPanelId = getMenuPanelId();
  const menuPanelIndex = menuPanelId
    ? panels.findIndex((panel) => panel.id === menuPanelId)
    : -1;
  const hasPanels = panels.length > 0;

  return (
    <div className="designer-accordion" data-menu-open={contextMenu ? "true" : "false"}>
      <button
        type="button"
        className="designer-accordion__menu-btn"
        title="Accordion panels"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const panelId = getMenuPanelId();
          if (panelId) {
            setOpenPanelId(panelId);
          }
          openPanelMenuAt(rect.right, rect.bottom + 4, panelId);
        }}
      >
        <span className="designer-context-handle__dots" aria-hidden="true" />
      </button>
      <div className="designer-accordion__panels">
        {panels.length === 0 ? (
          <div className="designer-accordion__empty">
            Use the menu to add panels to this accordion.
          </div>
        ) : (
          panels.map((panel) => {
            const isOpen = panel.id === openPanelId;
            return (
              <div
                key={panel.id}
                className={`designer-accordion__panel${
                  isOpen ? " is-open" : ""
                }`}
              >
                <button
                  type="button"
                  className="designer-accordion__trigger"
                  onClick={() =>
                    setOpenPanelId((prev) =>
                      prev === panel.id ? null : panel.id
                    )
                  }
                >
                  <span>{panel.title || "Panel"}</span>
                  {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {isOpen ? (
                  <div className="designer-accordion__body">{panel.children}</div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
      <DesignerContextMenu
        open={Boolean(contextMenu)}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        onClose={closeContextMenu}
        items={[
          {
            label: "Add Panel",
            icon: <Plus size={16} />,
            onSelect: handleAddPanel,
          },
          {
            label: "Delete Panel",
            icon: <Trash2 size={16} />,
            disabled: !hasPanels || !menuPanelId,
            onSelect: () => menuPanelId && handleRemovePanel(menuPanelId),
          },
          { kind: "separator" },
          {
            label: "Move Up",
            icon: <ChevronUp size={16} />,
            disabled: !hasPanels || menuPanelIndex <= 0,
            onSelect: () => menuPanelId && movePanel(menuPanelId, -1),
          },
          {
            label: "Move Down",
            icon: <ChevronDown size={16} />,
            disabled:
              !hasPanels ||
              menuPanelIndex < 0 ||
              menuPanelIndex >= panels.length - 1,
            onSelect: () => menuPanelId && movePanel(menuPanelId, 1),
          },
          { kind: "separator" },
          {
            label: "Edit Panels...",
            icon: <Settings size={16} />,
            onSelect: () =>
              openCollectionEditor({
                kind: "accordionPanels",
                componentId: component.id,
              }),
          },
        ]}
      />
    </div>
  );
};

export const MultiInstanceStepperContainer = ({ component, steps }) => {
  const { updateComponent, openCollectionEditor } = useDesignerStore();
  const [contextMenu, setContextMenu] = useState(null);
  const tabVariant = getTabValue(
    component.properties?.tabVariant,
    TAB_VARIANTS,
    "line"
  );
  const instanceLabel =
    typeof component.properties?.instanceLabel === "string"
      ? component.properties.instanceLabel
      : "Item";
  const safeInstanceLabel = instanceLabel.trim() ? instanceLabel.trim() : "Item";
  const instanceCountMode =
    component.properties?.instanceCountMode === "value" ? "value" : "manual";
  const rawInstanceCount =
    typeof component.properties?.instanceCount === "number"
      ? component.properties.instanceCount
      : Number(component.properties?.instanceCount);
  const minInstances =
    typeof component.properties?.minInstances === "number"
      ? component.properties.minInstances
      : 1;
  const maxInstances =
    typeof component.properties?.maxInstances === "number"
      ? component.properties.maxInstances
      : 50;
  const allowAddRemove = component.properties?.allowAddRemove !== false;
  const isBound = instanceCountMode === "value";

  const clampInstances = (value) => {
    if (!Number.isFinite(value)) return Math.max(minInstances, 1);
    const rounded = Math.max(1, Math.floor(value));
    return Math.min(Math.max(rounded, minInstances), maxInstances);
  };

  const boundCount = clampInstances(rawInstanceCount);
  const createInstanceId = () => Math.random().toString(36).slice(2, 9);
  const [manualInstances, setManualInstances] = useState(() =>
    Array.from({ length: clampInstances(minInstances) }, () => createInstanceId())
  );
  const instances = isBound
    ? Array.from({ length: boundCount }, (_, index) => `bound-${index + 1}`)
    : manualInstances;

  const [activeInstanceIndex, setActiveInstanceIndex] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  React.useEffect(() => {
    if (isBound) return;
    setManualInstances((current) => {
      const nextCount = clampInstances(current.length);
      if (nextCount === current.length) return current;
      if (nextCount > current.length) {
        return [
          ...current,
          ...Array.from({ length: nextCount - current.length }, () =>
            createInstanceId()
          ),
        ];
      }
      return current.slice(0, nextCount);
    });
  }, [isBound, minInstances, maxInstances]);

  React.useEffect(() => {
    if (activeInstanceIndex >= instances.length) {
      setActiveInstanceIndex(Math.max(instances.length - 1, 0));
      setActiveStepIndex(0);
    }
  }, [activeInstanceIndex, instances.length]);

  React.useEffect(() => {
    if (steps.length === 0) {
      setActiveStepIndex(0);
      return;
    }
    if (activeStepIndex >= steps.length) {
      setActiveStepIndex(steps.length - 1);
    }
  }, [steps.length, activeStepIndex]);

  const canRemoveInstance =
    !isBound && allowAddRemove && instances.length > minInstances;

  const handleSelectInstance = (index) => {
    setActiveInstanceIndex(index);
    setActiveStepIndex(0);
  };

  const handleRemoveInstance = (index) => {
    if (!canRemoveInstance) return;
    setManualInstances((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
    setActiveInstanceIndex((current) => {
      if (current > index) return current - 1;
      if (current === index) return Math.max(0, current - 1);
      return current;
    });
    setActiveStepIndex(0);
  };

  const handleBack = () => {
    setActiveStepIndex((current) => Math.max(0, current - 1));
  };

  const handleNext = () => {
    setActiveStepIndex((current) =>
      Math.min(steps.length - 1, current + 1)
    );
  };

  const getStoredSteps = () =>
    Array.isArray(component.properties?.steps)
      ? component.properties.steps
      : [];

  const handleAddStep = () => {
    const existingSteps = getStoredSteps();
    const nextId = Math.random().toString(36).slice(2, 9);
    const nextSteps = [
      ...existingSteps,
      { id: nextId, title: `Step ${existingSteps.length + 1}`, children: [] },
    ];
    updateComponent(component.id, {
      properties: { ...component.properties, steps: nextSteps },
    });
    setActiveStepIndex(nextSteps.length - 1);
  };

  const handleRemoveStep = (stepId) => {
    const existingSteps = getStoredSteps();
    const index = existingSteps.findIndex((step) => step.id === stepId);
    if (index < 0) return;
    const nextSteps = existingSteps.filter((step) => step.id !== stepId);
    updateComponent(component.id, {
      properties: { ...component.properties, steps: nextSteps },
    });
    setActiveStepIndex((current) => {
      if (nextSteps.length === 0) return 0;
      if (current > index) return current - 1;
      if (current === index) return Math.max(index - 1, 0);
      return current;
    });
  };

  const moveStep = (stepId, delta) => {
    const existingSteps = getStoredSteps();
    const index = existingSteps.findIndex((step) => step.id === stepId);
    if (index < 0) return;
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= existingSteps.length) return;
    const nextSteps = [...existingSteps];
    const [moved] = nextSteps.splice(index, 1);
    nextSteps.splice(nextIndex, 0, moved);
    updateComponent(component.id, {
      properties: { ...component.properties, steps: nextSteps },
    });
    setActiveStepIndex(nextIndex);
  };

  const closeContextMenu = () => setContextMenu(null);

  const openStepMenuAt = (clientX, clientY, stepId) => {
    setContextMenu({ x: clientX, y: clientY, stepId: stepId ?? null });
  };

  const getMenuStepId = () => {
    if (contextMenu?.stepId) return contextMenu.stepId;
    return steps[activeStepIndex]?.id ?? steps[0]?.id ?? null;
  };

  const menuStepId = getMenuStepId();
  const menuStepIndex = menuStepId
    ? steps.findIndex((step) => step.id === menuStepId)
    : -1;
  const hasSteps = steps.length > 0;

  const activeStep = steps[activeStepIndex] ?? steps[0] ?? null;

  return (
    <div
      className="designer-stepper designer-tabs"
      data-variant={tabVariant}
      data-menu-open={contextMenu ? "true" : "false"}
    >
      <button
        type="button"
        className="designer-tabs__menu-btn"
        title="Steps"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const stepId = getMenuStepId();
          if (stepId) {
            const stepIndex = steps.findIndex((step) => step.id === stepId);
            if (stepIndex >= 0) {
              setActiveStepIndex(stepIndex);
            }
          }
          openStepMenuAt(rect.right, rect.bottom + 4, stepId);
        }}
      >
        <span className="designer-context-handle__dots" aria-hidden="true" />
      </button>
      <div className="designer-stepper__tabs designer-tabs__list">
        {instances.map((instanceId, index) => (
          <button
            key={instanceId}
            type="button"
            className={`designer-stepper__tab designer-tabs__tab${
              index === activeInstanceIndex ? " is-active" : ""
            }`}
            onClick={() => handleSelectInstance(index)}
          >
            <span className="designer-stepper__tab-label">
              {safeInstanceLabel}
            </span>
            {canRemoveInstance ? (
              <span
                className="designer-stepper__tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveInstance(index);
                }}
                title={`Remove ${safeInstanceLabel}`}
              >
                <X size={12} />
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {activeStep ? (
        <div className="designer-stepper__body">
          {activeStep.children}
          <div className="designer-stepper__nav">
            <button
              type="button"
              className="designer-stepper__nav-btn"
              onClick={handleBack}
              disabled={activeStepIndex === 0}
            >
              Back
            </button>
            <button
              type="button"
              className="designer-stepper__nav-btn designer-stepper__nav-btn--primary"
              onClick={handleNext}
              disabled={activeStepIndex >= steps.length - 1}
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        <div className="designer-stepper__empty">
          Add steps to configure this repeating flow.
        </div>
      )}

      <DesignerContextMenu
        open={Boolean(contextMenu)}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        onClose={closeContextMenu}
        items={[
          {
            label: "Add Step",
            icon: <Plus size={16} />,
            onSelect: handleAddStep,
          },
          {
            label: "Delete Step",
            icon: <Trash2 size={16} />,
            disabled: !hasSteps || !menuStepId,
            onSelect: () => menuStepId && handleRemoveStep(menuStepId),
          },
          { kind: "separator" },
          {
            label: "Move Up",
            icon: <ChevronUp size={16} />,
            disabled: !hasSteps || menuStepIndex <= 0,
            onSelect: () => menuStepId && moveStep(menuStepId, -1),
          },
          {
            label: "Move Down",
            icon: <ChevronDown size={16} />,
            disabled:
              !hasSteps ||
              menuStepIndex < 0 ||
              menuStepIndex >= steps.length - 1,
            onSelect: () => menuStepId && moveStep(menuStepId, 1),
          },
          { kind: "separator" },
          {
            label: "Edit Steps...",
            icon: <Settings size={16} />,
            onSelect: () =>
              openCollectionEditor({
                kind: "stepperSteps",
                componentId: component.id,
              }),
          },
        ]}
      />
    </div>
  );
};

export { DropZone };
