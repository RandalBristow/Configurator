// @ts-nocheck
import { useDesignerStore } from "@/stores/designerStore";
import { DesignCanvas } from "./DesignCanvas";
import { DroppedComponent } from "./DroppedComponent";
import {
  PreviewAccordionContainer,
  PreviewCardContainer,
  PreviewContainerContainer,
  PreviewFlexContainer,
  PreviewGridContainer,
  PreviewMultiInstanceStepperContainer,
  PreviewTabsContainer,
  PreviewPaperContainer,
  PreviewRepeaterContainer,
  PreviewSectionContainer,
  PreviewSubsectionContainer,
} from "./PreviewContainers";

export function FormDesignerPreview() {
  const components = useDesignerStore((state) => state.components);
  const canvasSize = useDesignerStore((state) => state.canvasSize);
  const rootTarget = { kind: "root" };
  const rootComponents = Array.isArray(components) ? components : [];

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
      children: renderComponentList(slot.items, slot.target),
    }));
  };

  const renderComponentContent = (component, parentTarget, index, siblings) => {
    if (component.type === "Section") {
      const layout =
        component.properties?.layout === "two-column" ? 2 : 1;
      const columns = buildColumnSlots(component, layout);
      return <PreviewSectionContainer component={component} columns={columns} />;
    }
    if (component.type === "Subsection") {
      const target = { kind: "children", componentId: component.id };
      return (
        <PreviewSubsectionContainer component={component}>
          {renderComponentList(component.children ?? [], target)}
        </PreviewSubsectionContainer>
      );
    }
    if (component.type === "Paper") {
      const target = { kind: "children", componentId: component.id };
      return (
        <PreviewPaperContainer component={component}>
          {renderComponentList(component.children ?? [], target)}
        </PreviewPaperContainer>
      );
    }
    if (component.type === "Card") {
      const target = { kind: "children", componentId: component.id };
      return (
        <PreviewCardContainer component={component}>
          {renderComponentList(component.children ?? [], target)}
        </PreviewCardContainer>
      );
    }
    if (component.type === "Container") {
      const target = { kind: "children", componentId: component.id };
      return (
        <PreviewContainerContainer component={component}>
          {renderComponentList(component.children ?? [], target)}
        </PreviewContainerContainer>
      );
    }
    if (component.type === "FlexContainer") {
      const target = { kind: "children", componentId: component.id };
      return (
        <PreviewFlexContainer component={component}>
          {renderComponentList(component.children ?? [], target)}
        </PreviewFlexContainer>
      );
    }
    if (component.type === "Grid") {
      const target = { kind: "children", componentId: component.id };
      return (
        <PreviewGridContainer component={component}>
          {renderComponentList(component.children ?? [], target)}
        </PreviewGridContainer>
      );
    }
    if (component.type === "Repeater") {
      const target = { kind: "children", componentId: component.id };
      return (
        <PreviewRepeaterContainer component={component}>
          {renderComponentList(component.children ?? [], target)}
        </PreviewRepeaterContainer>
      );
    }
    if (component.type === "Page") {
      const hasTabArray = Array.isArray(component.properties?.tabs);
      const tabs = hasTabArray ? component.properties.tabs : [];
      const legacyLabel =
        typeof component.properties?.title === "string" &&
        component.properties.title.trim()
          ? component.properties.title
          : "Tab 1";
      const tabList =
        tabs.length > 0
          ? tabs
          : hasTabArray
            ? []
            : [
                {
                  id: `${component.id}-tab-1`,
                  label: legacyLabel,
                  children: component.children ?? [],
                },
              ];
      const tabItems = tabList.map((tab) => {
        const target = {
          kind: "tabPanel",
          componentId: component.id,
          tabId: tab.id,
        };
        const children = Array.isArray(tab.children) ? tab.children : [];
        return {
          ...tab,
          children: renderComponentList(children, target),
        };
      });
      return <PreviewTabsContainer component={component} tabs={tabItems} />;
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
        return {
          ...panel,
          children: renderComponentList(children, target),
        };
      });
      return <PreviewAccordionContainer panels={panelItems} />;
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
        return {
          ...step,
          children: renderComponentList(children, target),
        };
      });
      return (
        <PreviewMultiInstanceStepperContainer
          component={component}
          steps={stepItems}
        />
      );
    }
    return null;
  };

  const renderComponentNode = (component, parentTarget, index, siblings) => (
    <DroppedComponent
      key={component.id}
      component={component}
      parentTarget={parentTarget}
      isPreview
    >
      {renderComponentContent(component, parentTarget, index, siblings)}
    </DroppedComponent>
  );

  return (
    <div className="form-designer-preview__surface">
      <div
        className="form-designer-canvas-shell"
        style={{ width: canvasSize.width, height: canvasSize.height }}
      >
        <DesignCanvas previewMode>
          {renderComponentList(rootComponents, rootTarget)}
        </DesignCanvas>
      </div>
    </div>
  );
}
