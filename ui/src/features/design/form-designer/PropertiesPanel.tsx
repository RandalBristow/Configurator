// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useDesignerStore } from "@/stores/designerStore";
import { componentDefinitions } from "@/data/componentDefinitions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { WorkspaceTabs } from "@/components/workspace/WorkspaceTabs";
import {
  OptionsDetailsPane,
  type OptionsDetailsPaneProps,
} from "@/components/options/OptionsDetailsPane";
import { Copy, Trash2, Settings, Plus } from "lucide-react";
import { PropertiesGrid } from "./PropertiesGrid";

type Props = {
  optionDetails?: OptionsDetailsPaneProps;
};

const generateSlotId = () => Math.random().toString(36).slice(2, 9);

export function PropertiesPanel({ optionDetails }: Props) {
  const {
    selectedComponentId,
    updateComponent,
    removeComponent,
    duplicateComponent,
    clearSelection,
    moveComponent,
    resizeComponent,
    getComponentById,
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

  const selectedComponent = selectedComponentId
    ? getComponentById(selectedComponentId)
    : null;
  const componentDef = selectedComponent
    ? componentDefinitions.find((def) => def.type === selectedComponent.type)
    : null;

  const handlePropertyChange = (key, value) => {
    if (!selectedComponent) return;
    const nextProperties = {
      ...selectedComponent.properties,
      [key]: value,
    };
    if (selectedComponent.type === "Section" && key === "layout") {
      const nextChildren =
        value === "single-column" && Array.isArray(selectedComponent.children)
          ? selectedComponent.children.map((child) => ({
              ...child,
              column: 1,
            }))
          : selectedComponent.children;
      updateComponent(selectedComponent.id, {
        properties: nextProperties,
        children: nextChildren,
      });
      return;
    }
    updateComponent(selectedComponent.id, { properties: nextProperties });
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

  const accordionPanels =
    selectedComponent?.type === "Accordion" &&
    Array.isArray(selectedComponent.properties?.panels)
      ? selectedComponent.properties.panels
      : [];

  const stepperSteps =
    selectedComponent?.type === "MultiInstanceStepper" &&
    Array.isArray(selectedComponent.properties?.steps)
      ? selectedComponent.properties.steps
      : [];

  const handleAccordionPanelTitleChange = (panelId, title) => {
    if (!selectedComponent) return;
    const nextPanels = accordionPanels.map((panel) =>
      panel.id === panelId ? { ...panel, title } : panel
    );
    updateComponent(selectedComponent.id, {
      properties: { ...selectedComponent.properties, panels: nextPanels },
    });
  };

  const handleAddAccordionPanel = () => {
    if (!selectedComponent) return;
    const nextPanels = [
      ...accordionPanels,
      {
        id: generateSlotId(),
        title: `Panel ${accordionPanels.length + 1}`,
        children: [],
      },
    ];
    updateComponent(selectedComponent.id, {
      properties: { ...selectedComponent.properties, panels: nextPanels },
    });
  };

  const handleRemoveAccordionPanel = (panelId) => {
    if (!selectedComponent) return;
    const nextPanels = accordionPanels.filter((panel) => panel.id !== panelId);
    updateComponent(selectedComponent.id, {
      properties: { ...selectedComponent.properties, panels: nextPanels },
    });
  };

  const handleStepperTitleChange = (stepId, title) => {
    if (!selectedComponent) return;
    const nextSteps = stepperSteps.map((step) =>
      step.id === stepId ? { ...step, title } : step
    );
    updateComponent(selectedComponent.id, {
      properties: { ...selectedComponent.properties, steps: nextSteps },
    });
  };

  const handleAddStepperStep = () => {
    if (!selectedComponent) return;
    const nextSteps = [
      ...stepperSteps,
      {
        id: generateSlotId(),
        title: `Step ${stepperSteps.length + 1}`,
        children: [],
      },
    ];
    updateComponent(selectedComponent.id, {
      properties: { ...selectedComponent.properties, steps: nextSteps },
    });
  };

  const handleRemoveStepperStep = (stepId) => {
    if (!selectedComponent) return;
    const nextSteps = stepperSteps.filter((step) => step.id !== stepId);
    updateComponent(selectedComponent.id, {
      properties: { ...selectedComponent.properties, steps: nextSteps },
    });
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
              {selectedComponent.type === "Accordion" ? (
                <div className="properties-panel__slots">
                  <div className="properties-panel__slots-header">
                    <div className="properties-panel__slots-title">
                      Accordion Panels
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddAccordionPanel}
                      className="properties-panel__slots-add"
                    >
                      <Plus className="w-4 h-4" />
                      Add Panel
                    </Button>
                  </div>
                  {accordionPanels.length === 0 ? (
                    <div className="properties-panel__slots-empty">
                      No panels yet.
                    </div>
                  ) : (
                    accordionPanels.map((panel) => (
                      <div
                        key={panel.id}
                        className="properties-panel__slot-row"
                      >
                        <Input
                          className="properties-panel__slot-input"
                          value={panel.title || ""}
                          onChange={(e) =>
                            handleAccordionPanelTitleChange(
                              panel.id,
                              e.target.value
                            )
                          }
                          placeholder="Panel name"
                        />
                        <span className="properties-panel__slot-id">
                          {panel.id}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveAccordionPanel(panel.id)}
                          className="properties-panel__slot-remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              ) : null}
              {selectedComponent.type === "MultiInstanceStepper" ? (
                <div className="properties-panel__slots">
                  <div className="properties-panel__slots-header">
                    <div className="properties-panel__slots-title">
                      Stepper Steps
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddStepperStep}
                      className="properties-panel__slots-add"
                    >
                      <Plus className="w-4 h-4" />
                      Add Step
                    </Button>
                  </div>
                  {stepperSteps.length === 0 ? (
                    <div className="properties-panel__slots-empty">
                      No steps yet.
                    </div>
                  ) : (
                    stepperSteps.map((step) => (
                      <div key={step.id} className="properties-panel__slot-row">
                        <Input
                          className="properties-panel__slot-input"
                          value={step.title || ""}
                          onChange={(e) =>
                            handleStepperTitleChange(step.id, e.target.value)
                          }
                          placeholder="Step name"
                        />
                        <span className="properties-panel__slot-id">
                          {step.id}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveStepperStep(step.id)}
                          className="properties-panel__slot-remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              ) : null}
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
