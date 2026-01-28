// @ts-nocheck
import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { getGridColumnsForWidth } from "./gridUtils";
import { getDropZoneId, getDropZoneDataset } from "./containerUtils";
import { getPaperStyles } from "./paperStyles";

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

export const PreviewSectionContainer = ({ component, columns }) => {
  const layout =
    component.properties?.layout === "two-column" ? "two-column" : "single-column";

  return (
    <div className={`designer-section designer-section--${layout}`}>
      <div className="designer-section__body">
        <div
          className="designer-section__columns"
          style={{
            gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
          }}
        >
          {columns.map((column) => (
            <div key={column.index} className="designer-section__column">
              {column.children}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const PreviewSubsectionContainer = ({ component, children }) => {
  return (
    <div className="designer-subsection">
      <div className="designer-subsection__body">{children}</div>
    </div>
  );
};

export const PreviewPaperContainer = ({ component, children }) => {
  const styles = getPaperStyles(component.properties);
  return (
    <div className="designer-paper" style={styles}>
      <div className="designer-paper__body designer-paper__body--preview">
        {children}
      </div>
    </div>
  );
};

export const PreviewCardContainer = ({ component, children }) => {
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
  const styles = getPaperStyles(component.properties);
  return (
    <div className="designer-card" style={styles}>
      <div className="designer-card__body designer-card__body--preview">
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
        {children}
        {showFooter ? (
          <div
            className="designer-card__footer"
            style={{ textAlign: footerAlign }}
          >
            {footerText || "Footer"}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const PreviewContainerContainer = ({ component, children }) => {
  const maxWidth = getContainerMaxWidth(component.properties?.maxWidth);
  const fixed = Boolean(component.properties?.fixed);
  const disableGutters = Boolean(component.properties?.disableGutters);
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
    <div className="designer-layout-container">
      <div
        className="designer-layout-container__drop designer-layout-container__drop--preview"
        style={{
          maxWidth: maxWidth ? `${maxWidth}px` : undefined,
          width: fixed && maxWidth ? `${maxWidth}px` : "100%",
          margin: "0 auto",
          padding: `${paddingY}px ${paddingX}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const PreviewFlexContainer = ({ component, children }) => {
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
      <div
        className="designer-flex__body designer-flex__body--preview"
        style={{
          flexDirection: direction,
          flexWrap: wrap,
          justifyContent,
          alignItems,
          alignContent,
          gap: `${gap}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const PreviewGridContainer = ({ component, children }) => {
  const bodyRef = React.useRef(null);
  const [columnCount, setColumnCount] = useState(() =>
    getGridColumnsForWidth(component.properties?.columns, 0)
  );

  useEffect(() => {
    const node = bodyRef.current;
    if (!node) return;
    const updateColumns = () => {
      const width = node.getBoundingClientRect().width;
      setColumnCount(
        getGridColumnsForWidth(component.properties?.columns, width)
      );
    };
    updateColumns();
    const observer = new window.ResizeObserver(updateColumns);
    observer.observe(node);
    return () => observer.disconnect();
  }, [component.properties?.columns]);

  return (
    <div className="designer-grid">
      <div
        ref={bodyRef}
        id={getDropZoneId({ kind: "children", componentId: component.id })}
        {...getDropZoneDataset({ kind: "children", componentId: component.id })}
        className="designer-grid__body designer-grid__body--preview"
        style={{
          gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

const getRepeaterRowHeight = (template) => {
  if (!Array.isArray(template) || template.length === 0) return 0;
  return template.reduce((maxHeight, child) => {
    const posY =
      typeof child.position?.y === "number" ? child.position.y : 0;
    const height =
      typeof child.size?.height === "number" ? child.size.height : 0;
    return Math.max(maxHeight, posY + height);
  }, 0);
};

export const PreviewRepeaterContainer = ({ component, children }) => {
  const itemLabel =
    typeof component.properties?.itemLabel === "string"
      ? component.properties.itemLabel
      : "Item";
  const [rows, setRows] = useState(() => [
    `${component.id}-row-0`,
  ]);
  const rowHeight = getRepeaterRowHeight(component.children ?? []);
  const rowMinHeight = Math.max(rowHeight, 64);

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      `${component.id}-row-${prev.length}`,
    ]);
  };

  const handleRemoveRow = () => {
    setRows((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  };

  const templateItems = React.Children.toArray(children);
  return (
    <div className="designer-repeater">
      <div className="designer-repeater__header">
        <div className="designer-repeater__title">{itemLabel}</div>
        <div className="designer-repeater__actions">
          <button
            type="button"
            className="icon-btn"
            onClick={handleAddRow}
          >
            + {itemLabel}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={handleRemoveRow}
            disabled={rows.length === 0}
          >
            - {itemLabel}
          </button>
        </div>
      </div>
      <div className="designer-repeater__body designer-repeater__body--preview">
        {rows.length > 0 ? (
          <div className="designer-repeater__rows">
            {rows.map((rowId, rowIndex) => (
              <div
                key={rowId}
                className="designer-repeater__row"
                style={{ minHeight: `${rowMinHeight}px` }}
              >
                {templateItems.map((child, index) =>
                  React.isValidElement(child)
                    ? React.cloneElement(child, {
                        key: `${rowId}-${child.key ?? index}`,
                      })
                    : child
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="designer-repeater__empty">
            No {itemLabel.toLowerCase()}s yet. Click + {itemLabel} to add one.
          </div>
        )}
      </div>
    </div>
  );
};

export const PreviewTabsContainer = ({ component, tabs }) => {
  const safeTabs = Array.isArray(tabs) ? tabs : [];
  const visibleTabs = safeTabs.filter((tab) => tab.hidden !== true);
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
  const resolveNextActiveTabId = (candidateId) => {
    const candidate = safeTabs.find(
      (tab) =>
        tab.id === candidateId && tab.hidden !== true && tab.disabled !== true
    );
    if (candidate) return candidate.id;
    const firstEnabled = safeTabs.find(
      (tab) => tab.hidden !== true && tab.disabled !== true
    );
    if (firstEnabled) return firstEnabled.id;
    const firstVisible = safeTabs.find((tab) => tab.hidden !== true);
    return firstVisible?.id ?? null;
  };
  const [activeTabId, setActiveTabId] = useState(() =>
    resolveNextActiveTabId(
      getDefaultTabId(safeTabs, component.properties?.defaultTab)
    )
  );
  const defaultTabRef = React.useRef(component.properties?.defaultTab);

  useEffect(() => {
    if (visibleTabs.length === 0) {
      if (activeTabId !== null) {
        setActiveTabId(null);
      }
      return;
    }
    if (!visibleTabs.some((tab) => tab.id === activeTabId)) {
      setActiveTabId(
        resolveNextActiveTabId(
          getDefaultTabId(safeTabs, component.properties?.defaultTab)
        )
      );
    }
  }, [safeTabs, visibleTabs, activeTabId, component.properties?.defaultTab]);

  useEffect(() => {
    const currentDefault = component.properties?.defaultTab;
    if (defaultTabRef.current !== currentDefault) {
      defaultTabRef.current = currentDefault;
      setActiveTabId(resolveNextActiveTabId(getDefaultTabId(safeTabs, currentDefault)));
    }
  }, [safeTabs, component.properties?.defaultTab]);

  const activeTab =
    visibleTabs.find((tab) => tab.id === activeTabId) ?? visibleTabs[0];

  return (
    <div
      className="designer-tabs designer-tabs--preview"
      data-variant={variant}
      data-orientation={orientation}
      data-size={size}
      data-align={align}
      data-fitted={fitted ? "true" : "false"}
      data-scheme={scheme}
    >
      <div className="designer-tabs__list" role="tablist">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`designer-tabs__tab${
              tab.id === activeTabId ? " is-active" : ""
            }${tab.disabled ? " is-disabled" : ""}`}
            role="tab"
            aria-selected={tab.id === activeTabId}
            aria-disabled={tab.disabled === true}
            disabled={tab.disabled === true}
            onClick={() => {
              if (tab.disabled === true) return;
              setActiveTabId(tab.id);
            }}
          >
            {tab.label || "Tab"}
          </button>
        ))}
      </div>
      {activeTab ? (
        <div className="designer-tabs__panel">{activeTab.children}</div>
      ) : (
        <div className="designer-tabs__empty">No tabs to preview.</div>
      )}
    </div>
  );
};

export const PreviewAccordionContainer = ({ panels }) => {
  const [openPanelId, setOpenPanelId] = useState(panels[0]?.id ?? null);

  useEffect(() => {
    if (!panels.some((panel) => panel.id === openPanelId)) {
      setOpenPanelId(panels[0]?.id ?? null);
    }
  }, [panels, openPanelId]);

  return (
    <div className="designer-accordion">
      <div className="designer-accordion__panels">
        {panels.length === 0 ? (
          <div className="designer-accordion__empty">
            No panels to preview.
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
                  <div className="designer-accordion__body">
                    {panel.children}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export const PreviewMultiInstanceStepperContainer = ({ component, steps }) => {
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

  useEffect(() => {
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

  useEffect(() => {
    if (activeInstanceIndex >= instances.length) {
      setActiveInstanceIndex(Math.max(instances.length - 1, 0));
      setActiveStepIndex(0);
    }
  }, [activeInstanceIndex, instances.length]);

  useEffect(() => {
    if (steps.length === 0) {
      setActiveStepIndex(0);
      return;
    }
    if (activeStepIndex >= steps.length) {
      setActiveStepIndex(steps.length - 1);
    }
  }, [steps.length, activeStepIndex]);

  const canAddInstance =
    !isBound && allowAddRemove && instances.length < maxInstances;
  const canRemoveInstance =
    !isBound && allowAddRemove && instances.length > minInstances;
  const isLastStep = steps.length > 0 && activeStepIndex === steps.length - 1;
  const showAddButton = isLastStep && canAddInstance;

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

  const handleAddInstance = () => {
    if (!canAddInstance) return;
    setManualInstances((current) => [...current, createInstanceId()]);
    setActiveInstanceIndex(instances.length);
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

  const activeStep = steps[activeStepIndex] ?? steps[0] ?? null;

  return (
    <div className="designer-stepper designer-tabs" data-variant={tabVariant}>
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
            {showAddButton ? (
              <button
                type="button"
                className="designer-stepper__nav-btn designer-stepper__nav-btn--accent"
                onClick={handleAddInstance}
              >
                Add {safeInstanceLabel}
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="designer-stepper__empty">No steps to preview.</div>
      )}
    </div>
  );
};
