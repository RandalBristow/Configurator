// @ts-nocheck
import { useDroppable } from "@dnd-kit/core";
import { useEffect, useRef, useState } from "react";
import { useDesignerStore } from "@/stores/designerStore";
import { DesignCanvas } from "./DesignCanvas";
import { DroppedComponent } from "./DroppedComponent";
import {
  AccordionContainer,
  DropZone,
  GridContainer,
  MultiInstanceStepperContainer,
  PageContainer,
  RepeaterContainer,
  SectionContainer,
  StepContainer,
  SubsectionContainer,
} from "./DesignerContainers";
import { getDropZoneId } from "./containerUtils";

const resolveColumnCount = (value, fallback) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return fallback;
};

export function DesignSurface() {
  const {
    components,
    canvasSize,
    selectedComponentId,
    setCanvasSize,
  } = useDesignerStore();
  const [isResizingCanvas, setIsResizingCanvas] = useState(false);
  const canvasResizeStart = useRef({
    x: 0,
    y: 0,
    width: canvasSize.width,
    height: canvasSize.height,
  });
  const rootTarget = { kind: "root" };
  const { setNodeRef, isOver } = useDroppable({
    id: getDropZoneId(rootTarget),
    data: { target: rootTarget },
  });

  const renderComponentList = (list, parentTarget) => {
    if (!Array.isArray(list)) return null;
    return list.map((component, index) =>
      renderComponentNode(component, parentTarget, index, list)
    );
  };

  const buildColumnSlots = (component, columnCount) => {
    const children = Array.isArray(component.children)
      ? component.children
      : [];
    const slots = Array.from({ length: columnCount }, (_, index) => ({
      index: index + 1,
      target: {
        kind: "gridColumn",
        componentId: component.id,
        column: index + 1,
      },
      items: [],
    }));
    children.forEach((child) => {
      const column =
        typeof child.column === "number" && child.column > 0
          ? child.column
          : 1;
      const safeColumn = Math.min(Math.max(column, 1), columnCount);
      slots[safeColumn - 1].items.push(child);
    });
    return slots.map((slot) => ({
      index: slot.index,
      target: slot.target,
      hasChildren: slot.items.length > 0,
      children: renderComponentList(slot.items, slot.target),
    }));
  };

  const renderComponentContent = (component, parentTarget, index, siblings) => {
    if (component.type === "Section") {
      const layout =
        component.properties.layout === "two-column" ? 2 : 1;
      const columns = buildColumnSlots(component, layout);
      return <SectionContainer component={component} columns={columns} />;
    }
    if (component.type === "Subsection") {
      const target = { kind: "children", componentId: component.id };
      return (
        <SubsectionContainer component={component} target={target}>
          {renderComponentList(component.children ?? [], target)}
        </SubsectionContainer>
      );
    }
    if (component.type === "Grid") {
      const columnCount = Math.min(
        Math.max(resolveColumnCount(component.properties.columns, 2), 2),
        4
      );
      const columns = buildColumnSlots(component, columnCount);
      return <GridContainer component={component} columns={columns} />;
    }
    if (component.type === "Repeater") {
      const target = { kind: "children", componentId: component.id };
      return (
        <RepeaterContainer component={component} target={target}>
          {renderComponentList(component.children ?? [], target)}
        </RepeaterContainer>
      );
    }
    if (component.type === "Page") {
      const target = { kind: "children", componentId: component.id };
      return (
        <PageContainer component={component} target={target}>
          {renderComponentList(component.children ?? [], target)}
        </PageContainer>
      );
    }
    if (component.type === "Accordion") {
      const panels = Array.isArray(component.properties?.panels)
        ? component.properties.panels
        : [];
      const panelItems = panels.map((panel) => {
        const target = {
          kind: "accordionPanel",
          componentId: component.id,
          panelId: panel.id,
        };
        const children = Array.isArray(panel.children) ? panel.children : [];
        const renderedChildren = renderComponentList(children, target);
        const hasChildren = children.length > 0;
        return {
          ...panel,
          children: (
            <DropZone
              target={target}
              className="designer-accordion__drop"
              empty={!hasChildren}
              emptyLabel="Drop components here"
            >
              {renderedChildren}
            </DropZone>
          ),
        };
      });
      return <AccordionContainer component={component} panels={panelItems} />;
    }
    if (component.type === "Step") {
      const target = { kind: "children", componentId: component.id };
      const stepSiblings = Array.isArray(siblings)
        ? siblings.filter((item) => item.type === "Step")
        : [];
      const stepIndex = Math.max(
        0,
        stepSiblings.findIndex((item) => item.id === component.id)
      );
      return (
        <StepContainer
          component={component}
          target={target}
          stepIndex={stepIndex}
          stepCount={stepSiblings.length}
        >
          {renderComponentList(component.children ?? [], target)}
        </StepContainer>
      );
    }
    if (component.type === "MultiInstanceStepper") {
      const steps = Array.isArray(component.properties?.steps)
        ? component.properties.steps
        : [];
      const stepItems = steps.map((step) => {
        const target = {
          kind: "multiInstanceStep",
          componentId: component.id,
          stepId: step.id,
        };
        const children = Array.isArray(step.children) ? step.children : [];
        const renderedChildren = renderComponentList(children, target);
        const hasChildren = children.length > 0;
        return {
          ...step,
          children: (
            <DropZone
              target={target}
              className="designer-stepper__drop"
              empty={!hasChildren}
              emptyLabel="Drop components here"
            >
              {renderedChildren}
            </DropZone>
          ),
        };
      });
      return (
        <MultiInstanceStepperContainer component={component} steps={stepItems} />
      );
    }
    return null;
  };

  const renderComponentNode = (component, parentTarget, index, siblings) => (
    <DroppedComponent
      key={component.id}
      component={component}
      parentTarget={parentTarget}
    >
      {renderComponentContent(component, parentTarget, index, siblings)}
    </DroppedComponent>
  );

  const shellClassName = [
    "form-designer-canvas-shell",
    selectedComponentId ? "is-selected" : null,
    isResizingCanvas ? "is-resizing" : null,
  ]
    .filter(Boolean)
    .join(" ");

  const handleCanvasResizeStart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    canvasResizeStart.current = {
      x: event.clientX,
      y: event.clientY,
      width: canvasSize.width,
      height: canvasSize.height,
    };
    setIsResizingCanvas(true);
  };

  useEffect(() => {
    if (!isResizingCanvas) return;
    const handleMouseMove = (event) => {
      const start = canvasResizeStart.current;
      const nextWidth = Math.max(320, start.width + event.clientX - start.x);
      const nextHeight = Math.max(240, start.height + event.clientY - start.y);
      setCanvasSize({
        width: Math.round(nextWidth),
        height: Math.round(nextHeight),
      });
    };
    const handleMouseUp = () => {
      setIsResizingCanvas(false);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "nwse-resize";
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
    };
  }, [isResizingCanvas, setCanvasSize]);

  return (
    <div className="form-designer-surface">
      <div className="form-designer-surface__body">
        <div
          className={shellClassName}
          style={{ width: canvasSize.width, height: canvasSize.height }}
          ref={setNodeRef}
          id="design-canvas"
        >
          <DesignCanvas isOver={isOver}>
            {renderComponentList(components, rootTarget)}
          </DesignCanvas>
          <button
            type="button"
            className="form-designer-canvas-resize"
            onMouseDown={handleCanvasResizeStart}
            aria-label="Resize form canvas"
          />
        </div>
      </div>
    </div>
  );
}
