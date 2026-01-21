// @ts-nocheck
import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useDesignerStore } from "@/stores/designerStore";
import { getDropZoneDataset, getDropZoneId } from "./containerUtils";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";

const DropZone = ({
  target,
  className,
  children,
  emptyLabel,
  empty,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: getDropZoneId(target),
    data: { target },
  });
  const dropClassName = [
    className,
    isOver ? "is-drop-target" : null,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      ref={setNodeRef}
      id={getDropZoneId(target)}
      className={dropClassName}
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
  const { updateComponent, flowDropIndicator } = useDesignerStore();
  const title =
    typeof component.properties.title === "string"
      ? component.properties.title
      : "Section";
  const description =
    typeof component.properties.description === "string"
      ? component.properties.description
      : "";
  const layout =
    component.properties.layout === "two-column" ? "two-column" : "single-column";
  const collapsed = Boolean(component.properties.collapsed);
  const hasChildren = columns.some((column) => column.hasChildren);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    updateComponent(component.id, {
      properties: {
        ...component.properties,
        collapsed: !collapsed,
      },
    });
  };

  return (
    <div
      className={`designer-section designer-section--${layout}${
        collapsed ? " is-collapsed" : ""
      }`}
    >
      <div className="designer-section__header">
        <div className="designer-section__drag component-drag-handle">
          <GripVertical size={14} />
        </div>
        <div className="designer-section__header-text">
          <div className="designer-section__title">{title}</div>
          {description ? (
            <div className="designer-section__subtitle">{description}</div>
          ) : null}
        </div>
        <button
          type="button"
          className="icon-btn designer-section__toggle"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleToggle}
          aria-label={collapsed ? "Expand section" : "Collapse section"}
        >
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>
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
  const title =
    typeof component.properties.title === "string"
      ? component.properties.title
      : "Subsection";
  const hasChildren = React.Children.count(children) > 0;
  return (
    <div className="designer-subsection">
      <div className="designer-subsection__header">
        <div className="designer-subsection__drag component-drag-handle">
          <GripVertical size={14} />
        </div>
        <div className="designer-subsection__title">{title}</div>
      </div>
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

export const GridContainer = ({ component, columns }) => {
  const title = "Grid";
  return (
    <div className="designer-grid">
      <div className="designer-grid__header">
        <div className="designer-grid__drag component-drag-handle">
          <GripVertical size={14} />
        </div>
        <div className="designer-grid__title">
          {title} - {columns.length} columns
        </div>
      </div>
      <div
        className="designer-grid__body"
        style={{
          gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
        }}
      >
        {columns.map((column) => (
          <DropZone
            key={column.index}
            target={column.target}
            className="designer-grid__column"
            empty={!column.hasChildren}
            emptyLabel="Drop here"
          >
            {column.children}
          </DropZone>
        ))}
      </div>
    </div>
  );
};

export const RepeaterContainer = ({ component, target, children }) => {
  const itemLabel =
    typeof component.properties.itemLabel === "string"
      ? component.properties.itemLabel
      : "Item";
  const hasChildren = React.Children.count(children) > 0;
  return (
    <div className="designer-repeater">
      <div className="designer-repeater__header">
        <div className="designer-repeater__drag component-drag-handle">
          <GripVertical size={14} />
        </div>
        <div className="designer-repeater__title">
          {itemLabel} (template)
        </div>
        <div className="designer-repeater__actions">
          <button type="button" className="icon-btn" disabled>
            + {itemLabel}
          </button>
          <button type="button" className="icon-btn" disabled>
            - {itemLabel}
          </button>
        </div>
      </div>
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

export const PageContainer = ({ component, target, children }) => {
  const title =
    typeof component.properties.title === "string"
      ? component.properties.title
      : "Page";
  const hasChildren = React.Children.count(children) > 0;
  return (
    <div className="designer-page">
      <div className="designer-page__header">
        <div className="designer-page__drag component-drag-handle">
          <GripVertical size={14} />
        </div>
        <div className="designer-page__title">{title}</div>
      </div>
      <DropZone
        target={target}
        className="designer-page__body"
        empty={!hasChildren}
        emptyLabel="Drop components onto the page"
      >
        {children}
      </DropZone>
    </div>
  );
};

export const StepContainer = ({ component, target, children, stepIndex, stepCount }) => {
  const title =
    typeof component.properties.title === "string"
      ? component.properties.title
      : "Step";
  const hasChildren = React.Children.count(children) > 0;
  const subtitle =
    typeof stepIndex === "number" && typeof stepCount === "number"
      ? `Step ${stepIndex + 1} of ${stepCount}`
      : null;
  return (
    <div className="designer-step">
      <div className="designer-step__header">
        <div className="designer-step__drag component-drag-handle">
          <GripVertical size={14} />
        </div>
        <div className="designer-step__title">
          {title}
          {subtitle ? (
            <span className="designer-step__subtitle">{subtitle}</span>
          ) : null}
        </div>
      </div>
      <DropZone
        target={target}
        className="designer-step__body"
        empty={!hasChildren}
        emptyLabel="Drop components into this step"
      >
        {children}
      </DropZone>
    </div>
  );
};

export const AccordionContainer = ({ component, panels }) => {
  const { updateComponent } = useDesignerStore();
  const [openPanelId, setOpenPanelId] = useState(
    panels[0]?.id ?? null
  );

  React.useEffect(() => {
    if (!panels.some((panel) => panel.id === openPanelId)) {
      setOpenPanelId(panels[0]?.id ?? null);
    }
  }, [panels, openPanelId]);

  const handleAddPanel = () => {
    const nextId = Math.random().toString(36).slice(2, 9);
    const nextPanels = [
      ...(component.properties.panels ?? []),
      { id: nextId, title: `Panel ${panels.length + 1}`, children: [] },
    ];
    updateComponent(component.id, {
      properties: { ...component.properties, panels: nextPanels },
    });
    setOpenPanelId(nextId);
  };

  const handleRemovePanel = (panelId) => {
    const nextPanels = (component.properties.panels ?? []).filter(
      (panel) => panel.id !== panelId
    );
    updateComponent(component.id, {
      properties: { ...component.properties, panels: nextPanels },
    });
    if (openPanelId === panelId) {
      setOpenPanelId(nextPanels[0]?.id ?? null);
    }
  };

  return (
    <div className="designer-accordion">
      <div className="designer-accordion__header">
        <div className="designer-accordion__drag component-drag-handle">
          <GripVertical size={14} />
        </div>
        <div className="designer-accordion__title">Accordion</div>
        <button
          type="button"
          className="icon-btn designer-accordion__add"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleAddPanel}
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="designer-accordion__panels">
        {panels.length === 0 ? (
          <div className="designer-accordion__empty">
            Add a panel to start building this accordion.
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
                    <div className="designer-accordion__panel-actions">
                      <button
                        type="button"
                        className="icon-btn"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => handleRemovePanel(panel.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
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

export const MultiInstanceStepperContainer = ({ component, steps }) => {
  const { updateComponent } = useDesignerStore();
  const [activeStepId, setActiveStepId] = useState(steps[0]?.id ?? null);
  const instanceLabel =
    typeof component.properties.instanceLabel === "string"
      ? component.properties.instanceLabel
      : "Item";
  const activeStepIndex = steps.findIndex((step) => step.id === activeStepId);

  React.useEffect(() => {
    if (!steps.some((step) => step.id === activeStepId)) {
      setActiveStepId(steps[0]?.id ?? null);
    }
  }, [steps, activeStepId]);

  const handleAddStep = () => {
    const nextId = Math.random().toString(36).slice(2, 9);
    const nextSteps = [
      ...(component.properties.steps ?? []),
      { id: nextId, title: `Step ${steps.length + 1}`, children: [] },
    ];
    updateComponent(component.id, {
      properties: { ...component.properties, steps: nextSteps },
    });
    setActiveStepId(nextId);
  };

  const handleRemoveStep = (stepId) => {
    const nextSteps = (component.properties.steps ?? []).filter(
      (step) => step.id !== stepId
    );
    updateComponent(component.id, {
      properties: { ...component.properties, steps: nextSteps },
    });
    if (activeStepId === stepId) {
      setActiveStepId(nextSteps[0]?.id ?? null);
    }
  };

  const activeStep = steps.find((step) => step.id === activeStepId) ?? steps[0];

  return (
    <div className="designer-stepper">
      <div className="designer-stepper__header">
        <div className="designer-stepper__drag component-drag-handle">
          <GripVertical size={14} />
        </div>
        <div className="designer-stepper__title">Multi-instance Stepper</div>
        <button
          type="button"
          className="icon-btn designer-stepper__add"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleAddStep}
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="designer-stepper__meta">
        <span className="designer-stepper__meta-item">
          {instanceLabel} 1 of 3
        </span>
        <span className="designer-stepper__meta-item">
          Step {activeStepIndex + 1 || 1} of {steps.length || 1}
        </span>
      </div>
      <div className="designer-stepper__steps">
        {steps.map((step) => (
          <button
            key={step.id}
            type="button"
            className={`designer-stepper__step${
              step.id === activeStepId ? " is-active" : ""
            }`}
            onClick={() => setActiveStepId(step.id)}
          >
            {step.title || "Step"}
          </button>
        ))}
      </div>
      {activeStep ? (
        <div className="designer-stepper__body">
          {activeStep.children}
          <div className="designer-stepper__panel-actions">
            <button
              type="button"
              className="icon-btn"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => handleRemoveStep(activeStep.id)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="designer-stepper__empty">
          Add steps to configure this stepper.
        </div>
      )}
    </div>
  );
};

export { DropZone };
