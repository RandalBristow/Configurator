import type { ContainerTarget } from "@/stores/designerTree";

export const ROOT_DROP_ZONE_ID = "design-canvas";

export const getDropZoneId = (target: ContainerTarget) => {
  if (target.kind === "root") return ROOT_DROP_ZONE_ID;
  if (target.kind === "children") {
    return `form-designer-drop-children-${target.componentId}`;
  }
  if (target.kind === "tabPanel") {
    return `form-designer-drop-tab-${target.componentId}-${target.tabId}`;
  }
  if (target.kind === "accordionPanel") {
    return `form-designer-drop-accordion-${target.componentId}-${target.panelId}`;
  }
  if (target.kind === "multiInstanceStep") {
    return `form-designer-drop-step-${target.componentId}-${target.stepId}`;
  }
  if (target.kind === "gridColumn") {
    return `form-designer-drop-grid-${target.componentId}-col-${target.column}`;
  }
  return ROOT_DROP_ZONE_ID;
};

export const getDropZoneDataset = (target: ContainerTarget) => {
  const dataset: Record<string, string> = {
    "data-container-kind": target.kind,
  };
  if (target.kind !== "root") {
    dataset["data-container-id"] = target.componentId;
  }
  if (target.kind === "tabPanel") {
    dataset["data-tab-id"] = target.tabId;
  }
  if (target.kind === "accordionPanel") {
    dataset["data-panel-id"] = target.panelId;
  }
  if (target.kind === "multiInstanceStep") {
    dataset["data-step-id"] = target.stepId;
  }
  if (target.kind === "gridColumn") {
    dataset["data-column"] = String(target.column);
  }
  return dataset;
};

export const parseDropZoneDataset = (
  element: HTMLElement
): ContainerTarget | null => {
  const kind = element.dataset.containerKind;
  if (!kind) return null;
  if (kind === "root") return { kind: "root" };
  const componentId = element.dataset.containerId;
  if (!componentId) return null;
  if (kind === "children") {
    return { kind: "children", componentId };
  }
  if (kind === "tabPanel") {
    const tabId = element.dataset.tabId;
    if (!tabId) return null;
    return { kind: "tabPanel", componentId, tabId };
  }
  if (kind === "accordionPanel") {
    const panelId = element.dataset.panelId;
    if (!panelId) return null;
    return { kind: "accordionPanel", componentId, panelId };
  }
  if (kind === "multiInstanceStep") {
    const stepId = element.dataset.stepId;
    if (!stepId) return null;
    return { kind: "multiInstanceStep", componentId, stepId };
  }
  if (kind === "gridColumn") {
    const column = Number(element.dataset.column);
    if (!Number.isFinite(column)) return null;
    return { kind: "gridColumn", componentId, column };
  }
  return null;
};
