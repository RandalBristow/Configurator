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
import { Copy, Trash2, Settings } from "lucide-react";
import { PropertiesGrid } from "./PropertiesGrid";

type Props = {
  optionDetails?: OptionsDetailsPaneProps;
};

export function PropertiesPanel({ optionDetails }: Props) {
  const {
    selectedComponentId,
    components,
    updateComponent,
    removeComponent,
    duplicateComponent,
    clearSelection,
    moveComponent,
    resizeComponent,
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

  const selectedComponent = components.find(
    (c) => c.id === selectedComponentId
  );
  const componentDef = selectedComponent
    ? componentDefinitions.find((def) => def.type === selectedComponent.type)
    : null;

  const handlePropertyChange = (key, value) => {
    if (!selectedComponent) return;
    updateComponent(selectedComponent.id, {
      properties: {
        ...selectedComponent.properties,
        [key]: value,
      },
    });
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
    if (!selectedComponent) return;
    removeComponent(selectedComponent.id);
    clearSelection();
  };

  const handleDuplicate = () => {
    if (!selectedComponent) return;
    duplicateComponent(selectedComponent.id);
  };

  // Gather all properties (layout + groups) into a single array for a unified table
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
          // ...flatten all property groups...
          ...componentDef.properties.map((property) => ({
            ...property,
            value: selectedComponent.properties[property.key],
            onChange: (v) => handlePropertyChange(property.key, v),
            disabled: false,
          })),
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
          {isComponentTab && selectedComponent ? (
            <div className="properties-panel__actions">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDuplicate}
                className="properties-panel__action-btn"
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
        {isComponentTab && selectedComponent ? (
          <>
            <div className="properties-panel__meta">
              <Badge variant="secondary" className="properties-panel__badge">
                {selectedComponent.type}
              </Badge>
              <span className="properties-panel__meta-label">
                {selectedComponent.label}
              </span>
            </div>
            <div className="properties-panel__id">ID: {selectedComponent.id}</div>
          </>
        ) : null}
      </div>
      <div className="properties-panel__body">
        {isOptionTab && optionDetails ? (
          <div className="properties-panel__option">
            <OptionsDetailsPane {...optionDetails} />
          </div>
        ) : isComponentTab ? (
          !selectedComponent ? (
            <div className="properties-panel__empty">
              <Settings className="properties-panel__empty-icon" size={40} />
              <p className="properties-panel__empty-title">No component selected</p>
              <p className="properties-panel__empty-subtitle">
                Click on a component in the design surface to edit its properties
              </p>
            </div>
          ) : !componentDef ? (
            <div className="properties-panel__empty">
              <p className="properties-panel__empty-title">Unknown component type</p>
            </div>
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
