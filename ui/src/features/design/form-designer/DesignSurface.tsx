// @ts-nocheck
import { useDroppable } from "@dnd-kit/core";
import { useEffect, useRef, useState } from "react";
import { useDesignerStore } from "@/stores/designerStore";
import { DesignCanvas } from "./DesignCanvas";
import { DroppedComponent } from "./DroppedComponent";
import {
  AccordionContainer,
  CardContainer,
  ContainerContainer,
  DropZone,
  FlexContainer,
  GridContainer,
  MultiInstanceStepperContainer,
  TabsContainer,
  PaperContainer,
  RepeaterContainer,
  SectionContainer,
  SubsectionContainer,
} from "./DesignerContainers";
import { getDropZoneId } from "./containerUtils";

export function DesignSurface() {
  const {
    components,
    canvasSize,
    selectedComponentIds,
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
    if (component.type === "Paper") {
      const target = { kind: "children", componentId: component.id };
      return (
        <PaperContainer component={component} target={target}>
          {renderComponentList(component.children ?? [], target)}
        </PaperContainer>
      );
    }
    if (component.type === "Card") {
      const target = { kind: "children", componentId: component.id };
      return (
        <CardContainer component={component} target={target}>
          {renderComponentList(component.children ?? [], target)}
        </CardContainer>
      );
    }
    if (component.type === "Container") {
      const target = { kind: "children", componentId: component.id };
      return (
        <ContainerContainer component={component} target={target}>
          {renderComponentList(component.children ?? [], target)}
        </ContainerContainer>
      );
    }
    if (component.type === "FlexContainer") {
      const target = { kind: "children", componentId: component.id };
      return (
        <FlexContainer component={component} target={target}>
          {renderComponentList(component.children ?? [], target)}
        </FlexContainer>
      );
    }
    if (component.type === "Grid") {
      const target = { kind: "children", componentId: component.id };
      return (
        <GridContainer component={component} target={target}>
          {renderComponentList(component.children ?? [], target)}
        </GridContainer>
      );
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
      const tabs = Array.isArray(component.properties?.tabs)
        ? component.properties.tabs
        : [];
      const tabItems = tabs.map((tab) => {
        const target = {
          kind: "tabPanel",
          componentId: component.id,
          tabId: tab.id,
        };
        const children = Array.isArray(tab.children) ? tab.children : [];
        const renderedChildren = renderComponentList(children, target);
        const hasChildren = children.length > 0;
        return {
          ...tab,
          children: (
            <DropZone
              target={target}
              className="designer-tabs__body"
              empty={!hasChildren}
              emptyLabel="Drop components into this tab"
            >
              {renderedChildren}
            </DropZone>
          ),
        };
      });
      return <TabsContainer component={component} tabs={tabItems} />;
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
    selectedComponentIds.length > 0 ? "is-selected" : null,
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

