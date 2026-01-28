// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useDesignerStore } from "@/stores/designerStore";
import { componentDefinitions } from "@/data/componentDefinitions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkspaceTabs } from "@/components/workspace/WorkspaceTabs";
import {
  OptionsDetailsPane,
  type OptionsDetailsPaneProps,
} from "@/components/options/OptionsDetailsPane";
import {
  AlignCenter,
  AlignCenterVertical,
  AlignEndVertical,
  AlignLeft,
  AlignRight,
  AlignStartVertical,
  Copy,
  Trash2,
  Settings,
} from "lucide-react";
import { PropertiesGrid } from "./PropertiesGrid";
import { findComponentLocation } from "@/stores/designerTree";
import { ButtonInspector } from "./ButtonInspector";

type Props = {
  optionDetails?: OptionsDetailsPaneProps;
};

export function PropertiesPanel({ optionDetails }: Props) {
  const {
    selectedComponentId,
    selectedComponentIds,
    updateComponent,
    removeComponent,
    removeComponents,
    duplicateComponent,
    clearSelection,
    moveComponent,
    resizeComponent,
    openCollectionEditor,
    getComponentById,
    components,
    alignSelectedComponents,
  } = useDesignerStore();

  const [selectedPropertyKey, setSelectedPropertyKey] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    if (selectedComponentId) return "component";
    return optionDetails ? "option" : "component";
  });

  const tabs = optionDetails
    ? [
        { id: "option", label: "Option" },
        { id: "component", label: "Component" },
      ]
    : [{ id: "component", label: "Component" }];

  useEffect(() => {
    if (!optionDetails && activeTab === "option") {
      setActiveTab("component");
    }
  }, [optionDetails, activeTab]);

  useEffect(() => {
    if (selectedComponentId) {
      setActiveTab("component");
    }
  }, [selectedComponentId]);

  const selectedComponent = selectedComponentId
    ? getComponentById(selectedComponentId)
    : null;
  const selectedCount = selectedComponentIds.length;
  const hasMultiSelection = selectedCount > 1;
  const componentDef = selectedComponent
    ? componentDefinitions.find((def) => def.type === selectedComponent.type)
    : null;
  const showButtonInspector =
    Boolean(selectedComponent) &&
    selectedComponent.type === "Button" &&
    !hasMultiSelection;

  const getNestedValue = (obj, path) => {
    if (!obj || !path) return undefined;
    const parts = path.split(".");
    let current = obj;
    for (const part of parts) {
      if (!current || typeof current !== "object") return undefined;
      current = current[part];
    }
    return current;
  };

  const getPropertyValue = (key, fallback) => {
    if (
      key.startsWith("columns.") &&
      selectedComponent?.properties &&
      typeof selectedComponent.properties.columns === "number"
    ) {
      return selectedComponent.properties.columns;
    }
    const value = getNestedValue(selectedComponent?.properties, key);
    return value ?? fallback;
  };

  const setNestedValue = (obj, path, value) => {
    if (!path.includes(".")) {
      return { ...obj, [path]: value };
    }
    const parts = path.split(".");
    const next = { ...obj };
    let current = next;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const part = parts[i];
      const nextLevel =
        current[part] && typeof current[part] === "object"
          ? { ...current[part] }
          : {};
      current[part] = nextLevel;
      current = nextLevel;
    }
    current[parts[parts.length - 1]] = value;
    return next;
  };

  const handlePropertyChange = (key, value) => {
    if (!selectedComponentId) return;
    // Grab the freshest component snapshot so multiple sequential updates (same tick)
    // don't stomp each other by reusing a stale `selectedComponent` closure value.
    const currentComponent = getComponentById(selectedComponentId);
    if (!currentComponent) return;

    const nextValue =
      key.startsWith("columns.") && typeof value === "number"
        ? clampGridValue(value)
        : value;
    const nextProperties = key.includes(".")
      ? setNestedValue(currentComponent.properties, key, nextValue)
      : { ...currentComponent.properties, [key]: nextValue };
    if (currentComponent.type === "Section" && key === "layout") {
      const nextChildren =
        value === "single-column" && Array.isArray(currentComponent.children)
          ? currentComponent.children.map((child) => ({
              ...child,
              column: 1,
            }))
          : currentComponent.children;
      updateComponent(currentComponent.id, {
        properties: nextProperties,
        children: nextChildren,
      });
      return;
    }
    updateComponent(currentComponent.id, { properties: nextProperties });
  };

  const clampGridValue = (value) => {
    if (!Number.isFinite(value)) return 1;
    return Math.min(Math.max(Math.round(value), 1), 12);
  };

  const handleGridLayoutChange = (section, breakpoint, value) => {
    if (!selectedComponent) return;
    const nextGrid = {
      ...(selectedComponent.grid ?? {}),
      [section]: {
        ...(selectedComponent.grid?.[section] ?? {}),
        [breakpoint]: clampGridValue(value),
      },
    };
    updateComponent(selectedComponent.id, { grid: nextGrid });
  };

  const handlePositionChange = (axis, value) => {
    if (!selectedComponent) return;
    const newPosition = {
      ...selectedComponent.position,
      [axis]: Math.max(0, value),
    };
    moveComponent(selectedComponent.id, newPosition);
  };

  const handleSizeChange = (dimension, value) => {
    if (!selectedComponent) return;
    const newSize = {
      ...selectedComponent.size,
      [dimension]: Math.max(10, value),
    };
    resizeComponent(selectedComponent.id, newSize);
  };

  const handleDelete = () => {
    if (selectedComponentIds.length > 1) {
      removeComponents(selectedComponentIds);
      clearSelection();
      return;
    }
    if (!selectedComponent) return;
    removeComponent(selectedComponent.id);
    clearSelection();
  };

  const handleDuplicate = () => {
    if (!selectedComponent) return;
    duplicateComponent(selectedComponent.id);
  };

  // Gather all properties (layout + groups) into a single array for a unified table
  const location = selectedComponentId
    ? findComponentLocation(components, selectedComponentId)
    : null;
  const parentComponent =
    location && location.parent.kind !== "root"
      ? getComponentById(location.parent.componentId)
      : null;
  const isGridChild = parentComponent?.type === "Grid";

  const gridLayoutProperties =
    selectedComponent && isGridChild
      ? [
          {
            label: "Grid Start (Base)",
            key: "grid.start.base",
            type: "number",
            value:
              selectedComponent.grid?.start?.base ??
              (Number.isFinite(selectedComponent.column)
                ? selectedComponent.column
                : 1),
            onChange: (v) => handleGridLayoutChange("start", "base", v),
            description: "Starting column at the base breakpoint.",
            disabled: false,
            group: "Layout",
          },
          {
            label: "Grid Start (SM)",
            key: "grid.start.sm",
            type: "number",
            value:
              selectedComponent.grid?.start?.sm ??
              (Number.isFinite(selectedComponent.column)
                ? selectedComponent.column
                : 1),
            onChange: (v) => handleGridLayoutChange("start", "sm", v),
            description: "Starting column at the small breakpoint.",
            disabled: false,
            group: "Layout",
          },
          {
            label: "Grid Start (MD)",
            key: "grid.start.md",
            type: "number",
            value:
              selectedComponent.grid?.start?.md ??
              (Number.isFinite(selectedComponent.column)
                ? selectedComponent.column
                : 1),
            onChange: (v) => handleGridLayoutChange("start", "md", v),
            description: "Starting column at the medium breakpoint.",
            disabled: false,
            group: "Layout",
          },
          {
            label: "Grid Start (LG)",
            key: "grid.start.lg",
            type: "number",
            value:
              selectedComponent.grid?.start?.lg ??
              (Number.isFinite(selectedComponent.column)
                ? selectedComponent.column
                : 1),
            onChange: (v) => handleGridLayoutChange("start", "lg", v),
            description: "Starting column at the large breakpoint.",
            disabled: false,
            group: "Layout",
          },
          {
            label: "Grid Start (XL)",
            key: "grid.start.xl",
            type: "number",
            value:
              selectedComponent.grid?.start?.xl ??
              (Number.isFinite(selectedComponent.column)
                ? selectedComponent.column
                : 1),
            onChange: (v) => handleGridLayoutChange("start", "xl", v),
            description: "Starting column at the extra large breakpoint.",
            disabled: false,
            group: "Layout",
          },
          {
            label: "Grid Span (Base)",
            key: "grid.span.base",
            type: "number",
            value: selectedComponent.grid?.span?.base ?? 1,
            onChange: (v) => handleGridLayoutChange("span", "base", v),
            description: "Column span at the base breakpoint.",
            disabled: false,
            group: "Layout",
          },
          {
            label: "Grid Span (SM)",
            key: "grid.span.sm",
            type: "number",
            value: selectedComponent.grid?.span?.sm ?? 1,
            onChange: (v) => handleGridLayoutChange("span", "sm", v),
            description: "Column span at the small breakpoint.",
            disabled: false,
            group: "Layout",
          },
          {
            label: "Grid Span (MD)",
            key: "grid.span.md",
            type: "number",
            value: selectedComponent.grid?.span?.md ?? 1,
            onChange: (v) => handleGridLayoutChange("span", "md", v),
            description: "Column span at the medium breakpoint.",
            disabled: false,
            group: "Layout",
          },
          {
            label: "Grid Span (LG)",
            key: "grid.span.lg",
            type: "number",
            value: selectedComponent.grid?.span?.lg ?? 1,
            onChange: (v) => handleGridLayoutChange("span", "lg", v),
            description: "Column span at the large breakpoint.",
            disabled: false,
            group: "Layout",
          },
          {
            label: "Grid Span (XL)",
            key: "grid.span.xl",
            type: "number",
            value: selectedComponent.grid?.span?.xl ?? 1,
            onChange: (v) => handleGridLayoutChange("span", "xl", v),
            description: "Column span at the extra large breakpoint.",
            disabled: false,
            group: "Layout",
          },
        ]
      : [];

  const allProperties =
    selectedComponent && componentDef
      ? [
          {
            label: "X",
            key: "position.x",
            type: "number",
            value: selectedComponent.position.x,
            onChange: (v) => handlePositionChange("x", v),
            description:
              "The horizontal position (in pixels) of the component within its parent container.",
            disabled: false,
          },
          {
            label: "Y",
            key: "position.y",
            type: "number",
            value: selectedComponent.position.y,
            onChange: (v) => handlePositionChange("y", v),
            description:
              "The vertical position (in pixels) of the component within its parent container.",
            disabled: false,
          },
          {
            label: "Width",
            key: "size.width",
            type: "number",
            value: selectedComponent.size.width,
            onChange: (v) => handleSizeChange("width", v),
            description: "The width (in pixels) of the component.",
            disabled: componentDef?.resizable?.horizontal === false,
          },
          {
            label: "Height",
            key: "size.height",
            type: "number",
            value: selectedComponent.size.height,
            onChange: (v) => handleSizeChange("height", v),
            description: "The height (in pixels) of the component.",
            disabled: componentDef?.resizable?.vertical === false,
          },
          ...gridLayoutProperties,
          // ...flatten all property groups...
          ...componentDef.properties.map((property) => {
            const value = getPropertyValue(property.key, property.defaultValue);
            if (property.type === "collection") {
              const onEdit = () => {
                if (!selectedComponent) return;
                // Collection editors.
                if (selectedComponent.type === "Page" && property.key === "tabs") {
                  openCollectionEditor({
                    kind: "tabPages",
                    componentId: selectedComponent.id,
                  });
                }
                if (
                  selectedComponent.type === "Accordion" &&
                  property.key === "panels"
                ) {
                  openCollectionEditor({
                    kind: "accordionPanels",
                    componentId: selectedComponent.id,
                  });
                }
                if (
                  selectedComponent.type === "MultiInstanceStepper" &&
                  property.key === "steps"
                ) {
                  openCollectionEditor({
                    kind: "stepperSteps",
                    componentId: selectedComponent.id,
                  });
                }
              };
              return {
                ...property,
                value,
                onChange: () => {},
                onEdit,
                disabled: false,
              };
            }
            return {
              ...property,
              value,
              onChange: (v) => handlePropertyChange(property.key, v),
              disabled: false,
            };
          }),
        ]
      : [];

  // Find the selected property object
  const selectedProperty = allProperties.find(
    (prop) => prop.key === selectedPropertyKey
  );

  const isOptionTab = optionDetails && activeTab === "option";
  const isComponentTab = !optionDetails || activeTab === "component";

  return (
    <div className="properties-panel">
      <div className="properties-panel__header">
          <div className="properties-panel__header-row">
          <h2 className="properties-panel__title">Properties</h2>
          {isComponentTab && selectedComponentIds.length > 0 ? (
            <div className="properties-panel__actions">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDuplicate}
                className="properties-panel__action-btn"
                disabled={selectedComponentIds.length > 1}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="properties-panel__action-btn properties-panel__action-btn--danger"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ) : null}
        </div>
        {optionDetails ? (
          <div className="properties-panel__tabs">
            <WorkspaceTabs items={tabs} activeId={activeTab} onChange={setActiveTab} />
          </div>
        ) : null}
        {isComponentTab && selectedCount > 0 ? (
          <>
            {hasMultiSelection ? (
              <div className="properties-panel__meta">
                <Badge variant="secondary" className="properties-panel__badge">
                  Multiple
                </Badge>
                <span className="properties-panel__meta-label">
                  {selectedCount} components selected
                </span>
              </div>
            ) : selectedComponent ? (
              <>
                <div className="properties-panel__meta">
                  <Badge variant="secondary" className="properties-panel__badge">
                    {componentDef?.label ?? selectedComponent.type}
                  </Badge>
                  <span className="properties-panel__meta-label">
                    {selectedComponent.label}
                  </span>
                </div>
                <div className="properties-panel__id">ID: {selectedComponent.id}</div>
              </>
            ) : null}
          </>
        ) : null}
      </div>
      <div className="properties-panel__body">
        {isOptionTab && optionDetails ? (
          <div className="properties-panel__option">
            <OptionsDetailsPane {...optionDetails} />
          </div>
        ) : isComponentTab ? (
          selectedCount === 0 ? (
            <div className="properties-panel__empty">
              <Settings className="properties-panel__empty-icon" size={40} />
              <p className="properties-panel__empty-title">No component selected</p>
              <p className="properties-panel__empty-subtitle">
                Click on a component in the design surface to edit its properties
              </p>
            </div>
          ) : hasMultiSelection ? (
            <div className="properties-panel__multi">
              <div className="properties-panel__multi-title">Arrange</div>
              <div className="properties-panel__align">
                <div className="properties-panel__align-row">
                  <span className="properties-panel__align-label">Horizontal</span>
                  <div className="properties-panel__align-buttons">
                    <button
                      type="button"
                      className="icon-btn properties-panel__align-btn"
                      onClick={() => alignSelectedComponents("left")}
                      title="Align left edges"
                    >
                      <AlignLeft size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn properties-panel__align-btn"
                      onClick={() => alignSelectedComponents("center")}
                      title="Align horizontal centers"
                    >
                      <AlignCenter size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn properties-panel__align-btn"
                      onClick={() => alignSelectedComponents("right")}
                      title="Align right edges"
                    >
                      <AlignRight size={16} />
                    </button>
                  </div>
                </div>
                <div className="properties-panel__align-row">
                  <span className="properties-panel__align-label">Vertical</span>
                  <div className="properties-panel__align-buttons">
                    <button
                      type="button"
                      className="icon-btn properties-panel__align-btn"
                      onClick={() => alignSelectedComponents("top")}
                      title="Align top edges"
                    >
                      <AlignStartVertical size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn properties-panel__align-btn"
                      onClick={() => alignSelectedComponents("middle")}
                      title="Align vertical centers"
                    >
                      <AlignCenterVertical size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn properties-panel__align-btn"
                      onClick={() => alignSelectedComponents("bottom")}
                      title="Align bottom edges"
                    >
                      <AlignEndVertical size={16} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="properties-panel__multi-hint">
                Alignments apply within each parent container.
              </div>
            </div>
          ) : !componentDef ? (
            <div className="properties-panel__empty">
              <p className="properties-panel__empty-title">Unknown component type</p>
            </div>
          ) : showButtonInspector ? (
            <ButtonInspector
              component={selectedComponent}
              componentDef={componentDef}
              onPropertyChange={handlePropertyChange}
              onPositionChange={handlePositionChange}
              onSizeChange={handleSizeChange}
            />
          ) : (
            <>
              <div className="properties-panel__grid">
                <PropertiesGrid
                  properties={allProperties}
                  selectedPropertyKey={selectedPropertyKey}
                  setSelectedPropertyKey={setSelectedPropertyKey}
                />
              </div>
              <div className="properties-panel__description">
                <div className="properties-panel__description-title">Description</div>
                {selectedProperty?.description ? (
                  <span>{selectedProperty.description}</span>
                ) : (
                  <span className="properties-panel__description-muted">
                    Select a property to see its description.
                  </span>
                )}
              </div>
            </>
          )
        ) : null}
      </div>
    </div>
  );
}
