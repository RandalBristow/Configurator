// @ts-nocheck
import React, { useRef, useState, useEffect } from "react";
import { useDesignerStore } from "@/stores/designerStore";
import { ComponentRenderer } from "./ComponentRenderer";
import { componentDefinitions } from "@/data/componentDefinitions";
import { canDropComponentInTarget } from "./dropRules";
import { getDropZoneId, parseDropZoneDataset } from "./containerUtils";
import {
  buildGridLayoutForColumn,
  clampGridPlacement,
  getActiveBreakpoint,
  getGridColumnsForWidth,
  getNextGridStart,
  getResponsiveValue,
} from "./gridUtils";
import "@/index.css";

export function DroppedComponent({
  component,
  parentTarget,
  isPreview = false,
  children,
}) {
  const {
    selectedComponentId,
    selectedComponentIds,
    selectComponent,
    addComponentSelection,
    toggleComponentSelection,
    setPrimarySelection,
    moveComponent,
    resizeComponent,
    updateComponent,
    moveComponentToTarget,
    getComponentById,
    setFlowDropIndicator,
    setActiveDropTarget,
    setDraggedComponent,
    draggedComponent,
  } = useDesignerStore();
  const isSelected = selectedComponentIds.includes(component.id);
  const isLocked = Boolean(component.properties?.locked);
  const isHidden = Boolean(component.properties?.hidden);
  const [isDragging, setIsDragging] = useState(false);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [pointerDownStart, setPointerDownStart] = useState({ x: 0, y: 0 });
  const [dragSize, setDragSize] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragGhostPosition, setDragGhostPosition] = useState(null);
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    posX: 0,
    posY: 0,
    minWidth: 40,
    minHeight: 24,
  });
  const [resizeCorner, setResizeCorner] = useState("");
  const componentRef = useRef(null);
  const lastPointerYRef = useRef(null);
  const dragDirectionRef = useRef(null);
  const lastHoverTargetRef = useRef(null);
  const dragGhostOffsetRef = useRef({ x: 0, y: 0 });
  const selectionHandledRef = useRef(false);
  const [measuredHeight, setMeasuredHeight] = useState(component.size.height);
  const [measuredWidth, setMeasuredWidth] = useState(component.size.width);
  const contentRef = useRef(null);
  const switchGroupRef = useRef(null);
  const [hasMeasuredInitialSize, setHasMeasuredInitialSize] = useState(false);
  // Add state for Button's minimum content width
  const [buttonMinContentWidth, setButtonMinContentWidth] = useState(40);
  // Prevent infinite update loop: only auto-resize Switch if size is still default and only once
  const hasAutoResizedSwitch = useRef(false);
  useEffect(() => {
    // Reset the guard when the component id changes
    hasAutoResizedSwitch.current = false;
  }, [component.id]);

  // Get resizable directions from component definition
  const componentDef = componentDefinitions.find(
    (def) => def.type === component.type
  );
  const resizable = componentDef?.resizable || {
    horizontal: true,
    vertical: true,
  };

  const isContainer = [
    "FlexContainer",
    "Card",
    "Section",
    "Subsection",
    "Paper",
    "Container",
    "Grid",
    "Repeater",
    "Page",
    "Accordion",
    "MultiInstanceStepper",
  ].includes(component.type);
  const parentComponent =
    parentTarget && parentTarget.kind !== "root"
      ? getComponentById(parentTarget.componentId)
      : null;
  const isGridParent = parentComponent?.type === "Grid";
  const isFlexParent = parentComponent?.type === "FlexContainer";
  const isFlowParent =
    parentComponent?.type === "Subsection" ||
    parentComponent?.type === "Card" ||
    isFlexParent;
  const flowLayout =
    (parentTarget?.kind === "gridColumn" &&
      parentComponent?.type === "Section") ||
    (parentTarget?.kind === "children" &&
      (isFlowParent || isGridParent));
  const flowFullWidth = flowLayout && !isFlexParent;
  const isSectionCollapsed =
    component.type === "Section" && Boolean(component.properties?.collapsed);
  const isGridCollapsed =
    component.type === "Grid" && Boolean(component.properties?.collapsed);

  // --- DEBUG: Log selection changes ---
  useEffect(() => {
    if (isResizing) {
      console.log(
        "[DEBUG] Resizing: Forcing selection of",
        component.id,
        "Current selected:",
        selectedComponentId
      );
    }
    if (isDragging) {
      console.log(
        "[DEBUG] Dragging: Forcing selection of",
        component.id,
        "Current selected:",
        selectedComponentId
      );
    }
  }, [isResizing, isDragging, component.id, selectedComponentId]);

  const applySelection = (event, options = {}) => {
    if (isPreview) return;
    const forceSingle = Boolean(options.forceSingle);
    if (!forceSingle && event) {
      if (event.shiftKey) {
        addComponentSelection(component.id);
        return;
      }
      if (event.metaKey || event.ctrlKey) {
        toggleComponentSelection(component.id);
        return;
      }
    }
    if (selectedComponentIds.includes(component.id)) {
      setPrimarySelection(component.id);
    } else {
      selectComponent(component.id);
    }
  };

  useEffect(() => {
    if (isPreview) return;
    if (isDragging) {
      setDraggedComponent(component);
    } else if (draggedComponent?.id === component.id) {
      setDraggedComponent(null);
    }
  }, [
    isDragging,
    isPreview,
    component.id,
    draggedComponent?.id,
    setDraggedComponent,
  ]);

  const getTargetRect = (target) => {
    if (!target || target.kind === "root") {
      const surface = document.getElementById(getDropZoneId({ kind: "root" }));
      return surface ? surface.getBoundingClientRect() : null;
    }
    const element = document.getElementById(getDropZoneId(target));
    return element ? element.getBoundingClientRect() : null;
  };

  const getParentRect = () => getTargetRect(parentTarget);

  const getGridPlacement = () => {
    if (!isGridParent || !parentTarget || parentTarget.kind !== "children") {
      return null;
    }
    const dropZone = document.getElementById(getDropZoneId(parentTarget));
    const width = dropZone?.getBoundingClientRect().width ?? 0;
    const columns = getGridColumnsForWidth(
      parentComponent?.properties?.columns,
      width
    );
    const active = getActiveBreakpoint(width);
    const legacyStart = Number.isFinite(component.column)
      ? component.column
      : 1;
    const startValue = component.grid?.start
      ? getResponsiveValue(component.grid?.start, active, legacyStart)
      : legacyStart;
    const spanValue = component.grid?.span
      ? getResponsiveValue(component.grid?.span, active, 1)
      : 1;
    const placement = clampGridPlacement(startValue, spanValue, columns);
    return { ...placement, columns };
  };

  const parsePixelValue = (value) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getBoxMetrics = (element) => {
    if (!element || !window.getComputedStyle) {
      return { minWidth: 0, minHeight: 0, paddingX: 0, paddingY: 0 };
    }
    const style = window.getComputedStyle(element);
    const paddingX =
      parsePixelValue(style.paddingLeft) +
      parsePixelValue(style.paddingRight);
    const paddingY =
      parsePixelValue(style.paddingTop) +
      parsePixelValue(style.paddingBottom);
    return {
      minWidth: parsePixelValue(style.minWidth),
      minHeight: parsePixelValue(style.minHeight),
      paddingX,
      paddingY,
    };
  };

  const getContainerMinSize = () => {
    if (!componentRef.current) return null;
    const header = componentRef.current.querySelector(
      ".designer-section__header, .designer-subsection__header, .designer-card__header, .designer-flex__header, .designer-layout-container__header, .designer-grid__header, .designer-repeater__header, .designer-tabs__header, .designer-page__header, .designer-step__header, .designer-accordion__header, .designer-stepper__header"
    );
    const headerHeight = header
      ? header.getBoundingClientRect().height
      : 0;
    let bodyMinHeight = 0;
    let bodyMinWidth = 0;

    if (component.type === "Section") {
      if (!isSectionCollapsed) {
        const body = componentRef.current.querySelector(
          ".designer-section__body"
        );
        const columns = componentRef.current.querySelector(
          ".designer-section__columns"
        );
        const bodyMetrics = getBoxMetrics(body);
        const columnsMetrics = getBoxMetrics(columns);
        bodyMinHeight =
          bodyMetrics.paddingY +
          columnsMetrics.paddingY +
          columnsMetrics.minHeight;
        bodyMinWidth =
          bodyMetrics.paddingX +
          columnsMetrics.paddingX +
          columnsMetrics.minWidth;
      }
    } else {
      const body = componentRef.current.querySelector(
        ".designer-subsection__body, .designer-card__body, .designer-flex__body, .designer-paper__body, .designer-layout-container__drop, .designer-grid__body, .designer-repeater__body, .designer-tabs__panel, .designer-tabs__body, .designer-page__body, .designer-step__body, .designer-accordion__panels, .designer-stepper__body"
      );
      const bodyMetrics = getBoxMetrics(body);
      bodyMinHeight = bodyMetrics.minHeight + bodyMetrics.paddingY;
      bodyMinWidth = bodyMetrics.minWidth + bodyMetrics.paddingX;
    }

    return {
      minWidth: Math.ceil(bodyMinWidth),
      minHeight: Math.ceil(headerHeight + bodyMinHeight),
    };
  };

  const getDragCenterY = (fallbackY) => {
    if (componentRef.current) {
      const rect = componentRef.current.getBoundingClientRect();
      if (rect && Number.isFinite(rect.top) && Number.isFinite(rect.height)) {
        return rect.top + rect.height / 2;
      }
    }
    return fallbackY;
  };

  const getFlowDropIndex = (
    target,
    clientY,
    clientX,
    ignoreId,
    direction,
    sortByRect = false
  ) => {
    const dropZone = document.getElementById(getDropZoneId(target));
    if (!dropZone) return undefined;
    const items = Array.from(
      dropZone.querySelectorAll("[data-component-id]")
    )
      .filter((element) => {
        if (!(element instanceof HTMLElement)) return false;
        if (element.dataset.componentId === ignoreId) return false;
        return element.closest("[data-container-kind]") === dropZone;
      })
      .map((element) => ({
        element,
        rect: element.getBoundingClientRect(),
      }));
    if (items.length === 0) return 0;
    const ordered = sortByRect
      ? items
          .slice()
          .sort(
            (a, b) =>
              a.rect.top - b.rect.top || a.rect.left - b.rect.left
          )
      : items;
    const rects = ordered.map((entry) => entry.rect);
    if (sortByRect) {
      const pointerX = Number.isFinite(clientX) ? clientX : null;
      for (let index = 0; index < rects.length; index += 1) {
        const rect = rects[index];
        if (clientY < rect.top + rect.height * 0.5) {
          return index;
        }
        if (
          pointerX !== null &&
          clientY <= rect.bottom &&
          pointerX < rect.left + rect.width * 0.5
        ) {
          return index;
        }
      }
      return rects.length;
    }
    const threshold =
      direction === "down" ? 0.7 : direction === "up" ? 0.3 : 0.5;
    for (let index = 0; index < rects.length; index += 1) {
      if (clientY < rects[index].top + rects[index].height * threshold) {
        return index;
      }
    }
    return rects.length;
  };

  const getComponentBounds = () => {
    if (componentRef.current) {
      const rect = componentRef.current.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }
    return {
      width: component.size.width,
      height: component.size.height,
    };
  };

  const clampPosition = (x, y, target) => {
    if (!target || target.kind === "root") {
      return { x, y };
    }
    const rect = getTargetRect(target);
    if (!rect) return { x, y };
    const { width, height } = getComponentBounds();
    if (!width || !height) return { x, y };
    const maxX = Math.max(0, rect.width - width);
    const maxY = Math.max(0, rect.height - height);
    return {
      x: Math.min(Math.max(x, 0), maxX),
      y: Math.min(Math.max(y, 0), maxY),
    };
  };

  const isComponentInTree = (rootComponent, targetId) => {
    if (!rootComponent) return false;
    if (rootComponent.id === targetId) return true;
    const children = Array.isArray(rootComponent.children)
      ? rootComponent.children
      : [];
    for (const child of children) {
      if (isComponentInTree(child, targetId)) return true;
    }
    if (rootComponent.type === "Accordion") {
      const panels = Array.isArray(rootComponent.properties?.panels)
        ? rootComponent.properties.panels
        : [];
      for (const panel of panels) {
        const panelChildren = Array.isArray(panel.children) ? panel.children : [];
        for (const child of panelChildren) {
          if (isComponentInTree(child, targetId)) return true;
        }
      }
    }
    if (rootComponent.type === "MultiInstanceStepper") {
      const steps = Array.isArray(rootComponent.properties?.steps)
        ? rootComponent.properties.steps
        : [];
      for (const step of steps) {
        const stepChildren = Array.isArray(step.children) ? step.children : [];
        for (const child of stepChildren) {
          if (isComponentInTree(child, targetId)) return true;
        }
      }
    }
    if (rootComponent.type === "Page") {
      const tabs = Array.isArray(rootComponent.properties?.tabs)
        ? rootComponent.properties.tabs
        : [];
      for (const tab of tabs) {
        const tabChildren = Array.isArray(tab.children) ? tab.children : [];
        for (const child of tabChildren) {
          if (isComponentInTree(child, targetId)) return true;
        }
      }
    }
    return false;
  };

  const isDescendantTarget = (target, ancestorId) => {
    if (!target || target.kind === "root") return false;
    if (target.componentId === ancestorId) return true;
    const ancestor = getComponentById(ancestorId);
    return isComponentInTree(ancestor, target.componentId);
  };

  const resolveDropTarget = (clientX, clientY) => {
    if (!document.elementsFromPoint) return null;
    const elements = document.elementsFromPoint(clientX, clientY);
    const state = useDesignerStore.getState();
    const draggedRoot = componentRef.current;
    for (const element of elements) {
      if (!(element instanceof HTMLElement)) continue;
      if (draggedRoot && draggedRoot.contains(element)) continue;
      const containerElement = element.closest("[data-container-kind]");
      if (!containerElement) continue;
      const target = parseDropZoneDataset(containerElement);
      if (!target) continue;
      if (target.kind !== "root" && target.componentId === component.id) continue;
      if (isDescendantTarget(target, component.id)) continue;
      if (
        !canDropComponentInTarget(component.type, target, state.getComponentById)
      ) {
        continue;
      }
      return target;
    }
    const fallback = { kind: "root" };
    return canDropComponentInTarget(component.type, fallback, state.getComponentById)
      ? fallback
      : null;
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

  // Mouse down for move
  const handleMouseDown = (e) => {
    if (isPreview) return; // Disable drag in preview
    const target = e.target;
    if (
      target !== e.currentTarget &&
      !(target instanceof Element && target.closest(".component-drag-handle"))
    )
      return;
    e.preventDefault();
    e.stopPropagation();
    setFlowDropIndicator(null);
    applySelection(e);
    selectionHandledRef.current = true;
    if (isLocked) return;
    const parentRect = getParentRect();
    if (parentRect) {
      if (flowLayout && componentRef.current) {
        const rect = componentRef.current.getBoundingClientRect();
        const offsetX = rect.left - parentRect.left;
        const offsetY = rect.top - parentRect.top;
        updateComponent(component.id, {
          position: { x: offsetX, y: offsetY },
        });
        setDragStart({
          x: e.clientX - parentRect.left - offsetX,
          y: e.clientY - parentRect.top - offsetY,
        });
      } else {
        setDragStart({
          x: e.clientX - parentRect.left - component.position.x,
          y: e.clientY - parentRect.top - component.position.y,
        });
      }
    } else {
      setDragStart({
        x: e.clientX - component.position.x,
        y: e.clientY - component.position.y,
      });
    }
    setIsPointerDown(true);
    setPointerDownStart({ x: e.clientX, y: e.clientY });
    lastPointerYRef.current = getDragCenterY(e.clientY);
    dragDirectionRef.current = null;
    if (componentRef.current) {
      const rect = componentRef.current.getBoundingClientRect();
      setDragSize({ width: rect.width, height: rect.height });
      dragGhostOffsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    console.log("[DEBUG] handleMouseDown: selectComponent", component.id);
  };

  // Mouse down for resize
  const handleResizeMouseDown = (e, corner) => {
    if (isPreview) return; // Disable resize in preview
    if (isLocked) return;
    console.log(
      "Resize handle down:",
      corner,
      "for component",
      component.type,
      component.id
    );
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeCorner(corner);
    setIsPointerDown(false);
    setFlowDropIndicator(null);
    let minWidth = 40;
    let minHeight = 24;
    if (isContainer) {
      const containerMin = getContainerMinSize();
      if (containerMin) {
        minWidth = Math.max(minWidth, containerMin.minWidth);
        minHeight = Math.max(minHeight, containerMin.minHeight);
      }
    }
    let posX = component.position.x;
    let posY = component.position.y;
    const parentRect = getParentRect();
    if (flowLayout && componentRef.current && parentRect) {
      const rect = componentRef.current.getBoundingClientRect();
      posX = rect.left - parentRect.left;
      posY = rect.top - parentRect.top;
      updateComponent(component.id, {
        position: { x: posX, y: posY },
      });
    }
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: component.size.width,
      height: component.size.height,
      posX,
      posY,
      minWidth,
      minHeight,
    });
    applySelection(e, { forceSingle: true });
    console.log("[DEBUG] handleResizeMouseDown: selectComponent", component.id);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isPointerDown && !isDragging) {
        const deltaX = e.clientX - pointerDownStart.x;
        const deltaY = e.clientY - pointerDownStart.y;
        if (Math.hypot(deltaX, deltaY) >= 4) {
          setIsDragging(true);
          setIsPointerDown(false);
          setDragGhostPosition({
            x: e.clientX - dragGhostOffsetRef.current.x,
            y: e.clientY - dragGhostOffsetRef.current.y,
          });
        } else {
          return;
        }
      }
      if (isDragging) {
        setDragGhostPosition({
          x: e.clientX - dragGhostOffsetRef.current.x,
          y: e.clientY - dragGhostOffsetRef.current.y,
        });
        const dragSampleY = getDragCenterY(e.clientY);
        if (typeof lastPointerYRef.current === "number") {
          if (dragSampleY > lastPointerYRef.current) {
            dragDirectionRef.current = "down";
          } else if (dragSampleY < lastPointerYRef.current) {
            dragDirectionRef.current = "up";
          }
        }
        lastPointerYRef.current = dragSampleY;
        const hoverTarget = resolveDropTarget(e.clientX, e.clientY);
        if (!hoverTarget) {
          if (lastHoverTargetRef.current) {
            setActiveDropTarget(null);
            lastHoverTargetRef.current = null;
          }
        } else if (!isSameTarget(hoverTarget, lastHoverTargetRef.current)) {
          setActiveDropTarget(hoverTarget);
          lastHoverTargetRef.current = hoverTarget;
        }
        if (
          hoverTarget?.kind === "gridColumn" &&
          getComponentById(hoverTarget.componentId)?.type === "Section"
        ) {
          const insertIndex = getFlowDropIndex(
            hoverTarget,
            dragSampleY,
            e.clientX,
            component.id,
            dragDirectionRef.current
          );
          if (typeof insertIndex === "number") {
            setFlowDropIndicator({ target: hoverTarget, index: insertIndex });
          } else {
            setFlowDropIndicator(null);
          }
        } else if (
          hoverTarget?.kind === "children" &&
          (getComponentById(hoverTarget.componentId)?.type === "Subsection" ||
            getComponentById(hoverTarget.componentId)?.type === "Card" ||
            getComponentById(hoverTarget.componentId)?.type ===
              "FlexContainer")
        ) {
          const isFlexTarget =
            getComponentById(hoverTarget.componentId)?.type === "FlexContainer";
          const insertIndex = getFlowDropIndex(
            hoverTarget,
            dragSampleY,
            e.clientX,
            component.id,
            dragDirectionRef.current,
            isFlexTarget
          );
          if (typeof insertIndex === "number") {
            setFlowDropIndicator({ target: hoverTarget, index: insertIndex });
          } else {
            setFlowDropIndicator(null);
          }
        } else if (
          hoverTarget?.kind === "children" &&
          getComponentById(hoverTarget.componentId)?.type === "Grid"
        ) {
          setFlowDropIndicator({ target: hoverTarget, index: 0 });
        } else {
          setFlowDropIndicator(null);
        }
        const parentRect = getParentRect();
        if (parentRect) {
          let newX = Math.max(0, e.clientX - parentRect.left - dragStart.x);
          let newY = Math.max(0, e.clientY - parentRect.top - dragStart.y);
          if (flowLayout) {
            const height =
              dragSize?.height ?? getComponentBounds().height ?? 0;
            const maxY = Math.max(0, parentRect.height - height);
            const width =
              dragSize?.width ?? getComponentBounds().width ?? 0;
            const maxX = Math.max(0, parentRect.width - width);
            if (isGridParent) {
              newX = Math.min(Math.max(newX, 0), maxX);
            } else {
              newX = 0;
            }
            newY = Math.min(Math.max(newY, 0), maxY);
            updateComponent(component.id, { position: { x: newX, y: newY } });
          } else {
            const clamped = clampPosition(newX, newY, parentTarget);
            moveComponent(component.id, clamped);
          }
          setPrimarySelection(component.id); // Keep selected after move
          console.log(
            "[DEBUG] handleMouseMove (drag): selectComponent",
            component.id
          );
        }
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = resizeStart.posX;
        let newY = resizeStart.posY;
        let minWidth = resizeStart.minWidth ?? 40;
        let minHeight = resizeStart.minHeight ?? 24;
        if (
          component.type === "Button" &&
          contentRef.current &&
          componentRef.current
        ) {
          const buttonEl = contentRef.current.querySelector(
            "button.chakra-button"
          );
          const wrapperEl = componentRef.current;
          if (buttonEl && wrapperEl) {
            // Save previous styles
            const prevBtnWidth = buttonEl.style.width;
            const prevBtnMinWidth = buttonEl.style.minWidth;
            const prevBtnMaxWidth = buttonEl.style.maxWidth;
            const prevWrapWidth = wrapperEl.style.width;
            const prevWrapMinWidth = wrapperEl.style.minWidth;
            const prevWrapMaxWidth = wrapperEl.style.maxWidth;
            // Set both to auto for measurement
            buttonEl.style.width = "auto";
            buttonEl.style.minWidth = "0";
            buttonEl.style.maxWidth = "none";
            wrapperEl.style.width = "auto";
            wrapperEl.style.minWidth = "0";
            wrapperEl.style.maxWidth = "none";
            minWidth = Math.ceil(buttonEl.getBoundingClientRect().width) || 40;
            // Restore previous styles
            buttonEl.style.width = prevBtnWidth;
            buttonEl.style.minWidth = prevBtnMinWidth;
            buttonEl.style.maxWidth = prevBtnMaxWidth;
            wrapperEl.style.width = prevWrapWidth;
            wrapperEl.style.minWidth = prevWrapMinWidth;
            wrapperEl.style.maxWidth = prevWrapMaxWidth;
          }
        }
        if (resizeCorner === "se") {
          newWidth = Math.max(minWidth, resizeStart.width + deltaX);
          newHeight = Math.max(minHeight, resizeStart.height + deltaY);
        } else if (resizeCorner === "nw") {
          newWidth = Math.max(minWidth, resizeStart.width - deltaX);
          newHeight = Math.max(minHeight, resizeStart.height - deltaY);
          newX = resizeStart.posX + (resizeStart.width - newWidth);
          newY = resizeStart.posY + (resizeStart.height - newHeight);
        } else if (resizeCorner === "ne") {
          newWidth = Math.max(minWidth, resizeStart.width + deltaX);
          newHeight = Math.max(minHeight, resizeStart.height - deltaY);
          newY = resizeStart.posY + (resizeStart.height - newHeight);
        } else if (resizeCorner === "sw") {
          newWidth = Math.max(minWidth, resizeStart.width - deltaX);
          newHeight = Math.max(minHeight, resizeStart.height + deltaY);
          newX = resizeStart.posX + (resizeStart.width - newWidth);
        } else if (resizeCorner === "e") {
          newWidth = Math.max(minWidth, resizeStart.width + deltaX);
        } else if (resizeCorner === "w") {
          newWidth = Math.max(minWidth, resizeStart.width - deltaX);
          newX = resizeStart.posX + (resizeStart.width - newWidth);
        } else if (resizeCorner === "n") {
          newHeight = Math.max(minHeight, resizeStart.height - deltaY);
          newY = resizeStart.posY + (resizeStart.height - newHeight);
        } else if (resizeCorner === "s") {
          newHeight = Math.max(minHeight, resizeStart.height + deltaY);
        }
        console.log("Resizing", component.type, component.id, {
          corner: resizeCorner,
          newWidth,
          newHeight,
          newX,
          newY,
        });
        resizeComponent(component.id, { width: newWidth, height: newHeight });
        setPrimarySelection(component.id); // Ensure selection after resize
        console.log(
          "[DEBUG] handleMouseMove (resize): selectComponent",
          component.id
        );
        // Do NOT call selectComponent here; only call on mouse up
        if (newX !== resizeStart.posX || newY !== resizeStart.posY) {
          moveComponent(component.id, { x: newX, y: newY });
        }
      }
    };
    const handleMouseUp = (e) => {
      const wasDragging = isDragging;
      const wasResizing = isResizing;
      setIsDragging(false);
      setIsPointerDown(false);
      setIsResizing(false);
      setResizeCorner("");
      if (wasDragging) {
        setDragSize(null);
      }
      setFlowDropIndicator(null);
      // Ensure the component remains selected after resizing or moving
      if (wasDragging || wasResizing) {
        setPrimarySelection(component.id);
        selectionHandledRef.current = false;
      }
      // Prevent canvas click from clearing selection after resize
      if (wasResizing) {
        window._ignoreNextCanvasClick = true;
      }
      if (wasDragging && !isPreview && e) {
        const currentTarget = parentTarget ?? { kind: "root" };
        const nextTarget = resolveDropTarget(e.clientX, e.clientY);
        if (nextTarget) {
          const isSectionColumn =
            nextTarget.kind === "gridColumn" &&
            getComponentById(nextTarget.componentId)?.type === "Section";
          const isSubsectionChildren =
            nextTarget.kind === "children" &&
            getComponentById(nextTarget.componentId)?.type === "Subsection";
          const isCardChildren =
            nextTarget.kind === "children" &&
            getComponentById(nextTarget.componentId)?.type === "Card";
          const isFlexChildren =
            nextTarget.kind === "children" &&
            getComponentById(nextTarget.componentId)?.type === "FlexContainer";
          const isGridChildren =
            nextTarget.kind === "children" &&
            getComponentById(nextTarget.componentId)?.type === "Grid";
          if (
            isSectionColumn ||
            isSubsectionChildren ||
            isCardChildren ||
            isFlexChildren ||
            isGridChildren
          ) {
            const dragSampleY = getDragCenterY(e.clientY);
            const sortByRect = isFlexChildren;
            const insertIndex = isGridChildren
              ? undefined
              : getFlowDropIndex(
                  nextTarget,
                  dragSampleY,
                  e.clientX,
                  component.id,
                  dragDirectionRef.current,
                  sortByRect
                );
            moveComponentToTarget(component.id, nextTarget, insertIndex);
            moveComponent(component.id, { x: 0, y: 0 });
            if (isGridChildren) {
              const targetRect = getTargetRect(nextTarget);
              const gridComponent = getComponentById(nextTarget.componentId);
              const columns = getGridColumnsForWidth(
                gridComponent?.properties?.columns,
                targetRect?.width ?? 0
              );
              const active = getActiveBreakpoint(targetRect?.width ?? 0);
              const placements = (gridComponent?.children ?? [])
                .filter((child) => child.id !== component.id)
                .map((child) => {
                  const legacyStart = child.column ?? 1;
                  const startValue = child.grid?.start
                    ? getResponsiveValue(
                        child.grid?.start,
                        active,
                        legacyStart
                      )
                    : legacyStart;
                  const spanValue = child.grid?.span
                    ? getResponsiveValue(child.grid?.span, active, 1)
                    : 1;
                  return clampGridPlacement(startValue, spanValue, columns);
                });
              const desiredSpan = component.grid?.span
                ? getResponsiveValue(component.grid?.span, active, 1)
                : 1;
              const nextStart = getNextGridStart(
                placements,
                columns,
                desiredSpan
              );
              updateComponent(component.id, {
                grid: buildGridLayoutForColumn(nextStart, component.grid?.span),
              });
            }
          } else if (!isSameTarget(nextTarget, currentTarget)) {
            const targetRect = getTargetRect(nextTarget);
            if (targetRect) {
              let newX = Math.max(
                0,
                e.clientX - targetRect.left - dragStart.x
              );
              let newY = Math.max(
                0,
                e.clientY - targetRect.top - dragStart.y
              );
              const clamped = clampPosition(newX, newY, nextTarget);
              moveComponentToTarget(component.id, nextTarget);
              moveComponent(component.id, clamped);
            }
          }
        }
      }
      if (wasDragging) {
        lastPointerYRef.current = null;
        dragDirectionRef.current = null;
        lastHoverTargetRef.current = null;
        setActiveDropTarget(null);
        setDragGhostPosition(null);
      }
      console.log("[DEBUG] handleMouseUp: selectComponent", component.id);
    };
    if (isDragging || isResizing || isPointerDown) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = isResizing
        ? "nw-resize"
        : isDragging
          ? "move"
          : "default";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
    };
  }, [isDragging, isResizing, isPointerDown]); // Only depend on drag/resize state

  // Ensure all dropped components default to readOnly on first mount
  useEffect(() => {
    if (
      component &&
      component.properties &&
      component.properties.isReadOnly !== true
    ) {
      component.properties.isReadOnly = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Overlay height: measure after DOM paint for accuracy, using .chakra-form-control if present
  useEffect(() => {
    let observer;
    const measure = () => {
      if (contentRef.current) {
        try {
          if (component.type === "Checkbox") {
            // Try both Chakra v1 and v2 label selectors
            let checkboxLabel = contentRef.current.querySelector(
              "label.chakra-checkbox"
            );
            if (!checkboxLabel) {
              // Fallback: find label with input[type=checkbox] inside
              checkboxLabel = contentRef.current.querySelector(
                "label input[type=checkbox]"
              )?.parentElement;
            }
            if (checkboxLabel) {
              // Prevent wrapping on label
              checkboxLabel.style.whiteSpace = "nowrap";
              checkboxLabel.style.wordBreak = "normal";
              checkboxLabel.style.overflowWrap = "normal";
              setMeasuredHeight(checkboxLabel.offsetHeight);
              return;
            }
          } else if (component.type === "Switch") {
            // Measure the outer group div for Switch
            const switchGroup = contentRef.current.querySelector(
              ".group.flex.items-center"
            );
            if (switchGroup) {
              // Always prevent wrapping on group
              switchGroup.style.whiteSpace = "nowrap";
              // Also prevent wrapping on label
              const label = switchGroup.querySelector(
                ".switch-component-label, label"
              );
              if (label) {
                label.style.whiteSpace = "nowrap";
                label.style.wordBreak = "normal";
                label.style.overflowWrap = "normal";
              }
              const rect = switchGroup.getBoundingClientRect();
              setMeasuredWidth(rect.width);
              setMeasuredHeight(rect.height);
              return;
            }
          } else if (
            component.type === "TextField" ||
            component.type === "Select"
          ) {
            const groupDiv = contentRef.current.querySelector('[role="group"]');
            if (groupDiv) {
              const rect = groupDiv.getBoundingClientRect();
              setMeasuredWidth(rect.width);
              setMeasuredHeight(rect.height);
              return;
            }
          }
          // Try to find a Chakra select group first
          const selectGroup = contentRef.current.querySelector(
            ".chakra-select__group"
          );
          if (selectGroup) {
            setMeasuredWidth(selectGroup.offsetWidth);
            setMeasuredHeight(selectGroup.offsetHeight);
            return;
          }
          // Try to find a Chakra form group
          const group = contentRef.current.querySelector(
            ".chakra-form-control"
          );
          if (group) {
            setMeasuredWidth(group.offsetWidth);
            setMeasuredHeight(group.offsetHeight);
          } else {
            setMeasuredWidth(contentRef.current.offsetWidth);
            setMeasuredHeight(contentRef.current.offsetHeight);
          }
        } catch (err) {
          // Swallow errors silently
        }
      }
    };
    requestAnimationFrame(measure);

    // If Checkbox, observe label for text/content changes
    if (contentRef.current && component.type === "Checkbox") {
      let checkboxLabel = contentRef.current.querySelector(
        "label.chakra-checkbox"
      );
      if (!checkboxLabel) {
        checkboxLabel = contentRef.current.querySelector(
          "label input[type=checkbox]"
        )?.parentElement;
      }
      if (checkboxLabel) {
        observer = new window.MutationObserver(measure);
        observer.observe(checkboxLabel, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      }
    }
    return () => {
      if (observer) observer.disconnect();
    };
  }, [
    component,
    isSelected,
    isDragging,
    isResizing,
    component.size.width,
    JSON.stringify(component.properties),
  ]);

  // On initial mount, set Checkbox width to the natural width of the label (no wrapping, all text on one line)
  useEffect(() => {
    if (component.type === "Checkbox" && contentRef.current) {
      let attempts = 0;
      const maxAttempts = 10;
      const pollForLabel = () => {
        const checkboxLabel = contentRef.current.querySelector(
          "label.chakra-checkbox"
        );
        if (checkboxLabel) {
          // Temporarily remove width restriction to measure natural width
          const prevWidth = checkboxLabel.style.width;
          const prevMaxWidth = checkboxLabel.style.maxWidth;
          const prevWhiteSpace = checkboxLabel.style.whiteSpace;
          checkboxLabel.style.width = "auto";
          checkboxLabel.style.maxWidth = "none";
          checkboxLabel.style.whiteSpace = "nowrap";
          const naturalWidth = Math.ceil(
            checkboxLabel.getBoundingClientRect().width
          );
          // Restore previous styles
          checkboxLabel.style.width = prevWidth;
          checkboxLabel.style.maxWidth = prevMaxWidth;
          checkboxLabel.style.whiteSpace = prevWhiteSpace;
          if (naturalWidth > 0) {
            component.size.width = naturalWidth;
            setMeasuredWidth(naturalWidth);
          }
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(pollForLabel, 30);
        }
      };
      pollForLabel();
    }
    // Switch: only measure and set size if not already auto-resized and size is still default
    if (
      component.type === "Switch" &&
      contentRef.current &&
      !hasAutoResizedSwitch.current &&
      component.size.width === 120 &&
      component.size.height === 24
    ) {
      // Use the on-canvas DOM node for measurement
      const switchGroup = contentRef.current.querySelector(
        ".group.flex.items-center"
      );
      if (switchGroup) {
        // Set white-space: nowrap for measurement
        const prevWhiteSpace = switchGroup.style.whiteSpace;
        switchGroup.style.whiteSpace = "nowrap";
        requestAnimationFrame(() => {
          const rect = switchGroup.getBoundingClientRect();
          switchGroup.style.whiteSpace = prevWhiteSpace;
          if (
            rect.width > 0 &&
            rect.height > 0 &&
            (component.size.width !== rect.width ||
              component.size.height !== rect.height)
          ) {
            if (
              componentRef.current &&
              componentRef.current.classList.contains("switch-component")
            ) {
              componentRef.current.style.width = rect.width + "px";
              componentRef.current.style.height = rect.height + "px";
            }
            resizeComponent(component.id, {
              width: rect.width,
              height: rect.height,
            });
            hasAutoResizedSwitch.current = true;
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [component]);

  useEffect(() => {
    if (component.type === "Switch" && switchGroupRef.current) {
      const rect = switchGroupRef.current.getBoundingClientRect();
      setMeasuredWidth(rect.width);
      setMeasuredHeight(rect.height);
      if (
        !hasMeasuredInitialSize &&
        component.size.width === 58 &&
        component.size.height === 24
      ) {
        resizeComponent(component.id, {
          width: rect.width,
          height: rect.height,
        });
        setHasMeasuredInitialSize(true);
      }
    }
  }, [component, resizeComponent, hasMeasuredInitialSize]);

  // DEBUG: Log measured size for Switch
  useEffect(() => {
    if (component.type === "Switch" && switchGroupRef.current) {
      const rect =
        switchGroupRef.current.parentElement.parentElement.getBoundingClientRect();
      console.log(
        "[Switch] Measured group size:",
        rect.width,
        rect.height,
        switchGroupRef.current
      );
    }
  }, [measuredWidth, measuredHeight, component.type]);

  // Measure Button's natural width for minWidth (after every resize)
  useEffect(() => {
    if (component.type === "Button" && contentRef.current) {
      let attempts = 0;
      const maxAttempts = 10;
      const pollForButton = () => {
        const buttonEl = contentRef.current.querySelector(
          "button.chakra-button"
        );
        if (buttonEl) {
          const prevWidth = buttonEl.style.width;
          const prevMinWidth = buttonEl.style.minWidth;
          buttonEl.style.width = "auto";
          buttonEl.style.minWidth = "0";
          const naturalWidth = Math.ceil(
            buttonEl.getBoundingClientRect().width
          );
          buttonEl.style.width = prevWidth;
          buttonEl.style.minWidth = prevMinWidth;
          if (naturalWidth > 0 && naturalWidth !== buttonMinContentWidth) {
            setButtonMinContentWidth(naturalWidth);
          }
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(pollForButton, 30);
        }
      };
      pollForButton();
    }
    // Only re-measure when Button content changes
  }, [
    component.type,
    component.properties.text,
    component.properties.iconName,
    component.properties.iconPosition,
    component.properties.iconVariant,
    component.properties.iconStroke,
    component.properties.iconSize,
    component.properties.leftIcon,
    component.properties.rightIcon,
  ]);

  // Off-screen measurement state and ref
  const [offscreenSwitchMeasure, setOffscreenSwitchMeasure] = useState(null);
  const offscreenSwitchRef = useRef(null);

  // Effect to measure off-screen Switch after render
  useEffect(() => {
    if (
      component.type === "Switch" &&
      !hasAutoResizedSwitch.current &&
      offscreenSwitchRef.current
    ) {
      // Try to measure the largest bounding rect in the hierarchy
      let switchGroup = offscreenSwitchRef.current.querySelector(
        ".group.flex.items-center"
      );
      let candidates = [];
      // Add group and all ancestors up to offscreenSwitchRef.current
      let node = switchGroup;
      while (node && node !== offscreenSwitchRef.current.parentElement) {
        candidates.push(node);
        node = node.parentElement;
      }
      // Set white-space: nowrap on all candidates for measurement
      const prevWhiteSpaces = candidates.map((node) =>
        node ? node.style.whiteSpace : undefined
      );
      candidates.forEach((node) => {
        if (node) node.style.whiteSpace = "nowrap";
      });
      // Measure all candidates and pick the widest (but ignore anything > 300px)
      let maxRect = { width: 0, height: 0 };
      let maxNode = null;
      candidates.forEach((node, idx) => {
        if (!node) return;
        const rect = node.getBoundingClientRect();
        console.log(
          `[DEBUG][Switch][OffScreen] Candidate ${idx}: <${node.tagName.toLowerCase()}>.${node.className} width:`,
          rect.width,
          node.innerHTML
        );
        if (rect.width > maxRect.width && rect.width < 300) {
          maxRect = rect;
          maxNode = node;
        }
      });
      // Restore previous white-space
      candidates.forEach((node, idx) => {
        if (node) node.style.whiteSpace = prevWhiteSpaces[idx];
      });
      if (maxNode) {
        console.log(
          "[DEBUG][Switch][OffScreen] Using node:",
          maxNode,
          maxRect.width,
          maxRect.height
        );
        if (
          maxRect.width > 0 &&
          maxRect.height > 0 &&
          (component.size.width !== maxRect.width ||
            component.size.height !== maxRect.height)
        ) {
          resizeComponent(component.id, {
            width: maxRect.width,
            height: maxRect.height,
          });
          hasAutoResizedSwitch.current = true;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [component, offscreenSwitchMeasure]);

  // Helper to measure Switch size off-screen
  const measureSwitchOffScreen = (component) => {
    // Create a container div off-screen
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "-9999px";
    container.style.visibility = "hidden";
    container.style.pointerEvents = "none";
    container.style.zIndex = "-1";
    document.body.appendChild(container);

    // Render a Switch in the container
    const tempId = `temp-switch-${component.id}`;
    container.innerHTML = `<div id='${tempId}'></div>`;
    // Use React to render the Switch into the container
    import("react-dom").then((ReactDOM) => {
      ReactDOM.render(
        <ComponentRenderer component={component} />,
        document.getElementById(tempId)
      );
      setTimeout(() => {
        const switchGroup = container.querySelector(".group.flex.items-center");
        if (switchGroup) {
          const rect = switchGroup.getBoundingClientRect();
          console.log(
            "[DEBUG][Switch][OffScreen] Measured group rect:",
            rect.width,
            rect.height,
            rect
          );
          resizeComponent(component.id, {
            width: rect.width,
            height: rect.height,
          });
        }
        ReactDOM.unmountComponentAtNode(document.getElementById(tempId));
        document.body.removeChild(container);
      }, 30);
    });
  };

  // Add ResizeObserver for Switch to update measured size on label/content change
  useEffect(() => {
    if (component.type !== "Switch" || !switchGroupRef.current) return;
    const node = switchGroupRef.current;
    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      setMeasuredWidth(rect.width);
      setMeasuredHeight(rect.height);
    };
    updateSize();
    const observer = new window.ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, [component.type, switchGroupRef]);

  if (isPreview && isHidden) {
    return null;
  }

  return (
    <>
      {/* Off-screen Switch for measurement */}
      {component.type === "Switch" && !hasAutoResizedSwitch.current && (
        <div
          ref={offscreenSwitchRef}
          style={{
            position: "absolute",
            left: "-9999px",
            top: "-9999px",
            visibility: "hidden",
            pointerEvents: "none",
            zIndex: -1,
          }}
        >
          <ComponentRenderer component={component} />
        </div>
      )}
      {/* Main DroppedComponent content */}
      <div
        ref={componentRef}
        data-component-id={component.id}
        className={`component-hover rounded component-${component.type.toLowerCase()}${
          isSelected && !isPreview ? " component-selected" : ""
        }${
          isDragging && !isPreview
            ? " component-dragging cursor-move"
            : " cursor-pointer"
        }${isLocked && !isPreview ? " component-locked" : ""}${
          isHidden && !isPreview ? " component-hidden" : ""
        }${component.type === "Switch" ? " switch-component" : ""}${
          isContainer ? " component-is-container" : ""
        }`}
        style={{
          position:
            isDragging && dragGhostPosition
              ? "fixed"
              : flowLayout && !isDragging
                ? "relative"
                : "absolute",
          left:
            isDragging && dragGhostPosition
              ? dragGhostPosition.x
              : flowLayout && !isDragging
                ? "auto"
                : component.position.x,
          top:
            isDragging && dragGhostPosition
              ? dragGhostPosition.y
              : flowLayout && !isDragging
                ? "auto"
                : component.position.y,
          gridColumn: (() => {
            if (!isGridParent || isDragging) return undefined;
            const placement = getGridPlacement();
            if (!placement) return undefined;
            return `${placement.start} / span ${placement.span}`;
          })(),
          width:
            isDragging && dragSize
              ? dragSize.width
              : flowFullWidth
                ? "100%"
                : component.type === "Switch"
                  ? measuredWidth // Use measured width for Switch
                  : component.type === "Button"
                    ? component.size.width
                    : component.size.width,
          height:
            isDragging && dragSize
              ? dragSize.height
              : isSectionCollapsed || isGridCollapsed
                ? "auto"
                : component.type === "Checkbox"
                  ? undefined
                  : component.type === "TextField" || component.type === "Select"
                    ? measuredHeight
                    : component.type === "Switch"
                      ? measuredHeight // Use measured height for Switch
                      : component.size.height,
          minWidth:
            component.type === "Switch"
              ? 40
              : component.type === "Button"
                ? buttonMinContentWidth
                : undefined,
          minHeight:
            component.type === "Switch"
              ? measuredHeight
              : component.type === "Button"
                ? 36
                : undefined,
          userSelect: "none",
          opacity: isHidden && !isPreview ? 0.35 : undefined,
          filter: isHidden && !isPreview ? "grayscale(0.65)" : undefined,
          zIndex: isSelected ? 10 : 1,
          overflow: "visible",
          display: "flex",
          flexDirection: "column",
          pointerEvents: isDragging ? "none" : "auto",
        }}
      >
        <div
          ref={contentRef}
          style={{ flex: 1, minHeight: 0, position: "relative" }}
          onClick={(e) => {
            if (isPreview || isContainer) return;
            e.stopPropagation();
            if (selectionHandledRef.current) {
              selectionHandledRef.current = false;
              return;
            }
            if (e.shiftKey || e.metaKey || e.ctrlKey) return;
            setPrimarySelection(component.id);
          }}
        >
          {isContainer ? (
            <div
              className="designer-container"
              data-component-id={component.id}
              data-selected={isSelected ? "true" : "false"}
              onMouseDown={handleMouseDown}
              onClick={(e) => {
                if (isPreview) return;
                e.stopPropagation();
                if (selectionHandledRef.current) {
                  selectionHandledRef.current = false;
                  return;
                }
                applySelection(e);
              }}
            >
              {!isPreview && !isLocked ? (
                <div className="designer-floating-handle component-drag-handle" title="Drag">
                  <span
                    className="designer-floating-handle__dots"
                    aria-hidden="true"
                  />
                </div>
              ) : null}
              {children}
            </div>
          ) : (
            <>
              <ComponentRenderer
                component={component}
                switchGroupRef={
                  component.type === "Switch" ? switchGroupRef : undefined
                }
              />
              {/* Overlay for drag/select, always on top except for resize handles */}
              <div
                className="component-overlay"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width:
                    isDragging && dragSize
                      ? dragSize.width
                      : flowFullWidth
                        ? "100%"
                        : component.type === "Switch"
                          ? measuredWidth // Use measured width for Switch
                          : component.size.width,
                  height:
                    isDragging && dragSize
                      ? dragSize.height
                      : component.type === "Checkbox" ||
                        component.type === "TextField" ||
                        component.type === "Select"
                        ? measuredHeight
                        : component.type === "Switch"
                          ? measuredHeight // Use measured height for Switch
                          : component.size.height,
                  zIndex: 20,
                  background: "transparent",
                  cursor: isDragging && !isPreview ? "move" : "pointer",
                  pointerEvents: isPreview ? "none" : "auto",
                }}
                onMouseDown={handleMouseDown}
              />
            </>
          )}
        </div>
        {!isPreview && isSelected && (
          <>
            <div className="component-selection-box" />
            {!isContainer && !isLocked && (
              <div
                className="component-drag-handle absolute cursor-move"
                style={{ top: 8, left: 8, right: 20, bottom: 20, zIndex: 10 }}
              />
            )}
            {/* Render resize handles based on resizable directions */}
            {!isLocked && resizable.horizontal && resizable.vertical && (
              <>
                <div
                  className="resize-corner nw"
                  onMouseDown={(e) => handleResizeMouseDown(e, "nw")}
                  style={{ cursor: "nwse-resize" }}
                />
                <div
                  className="resize-corner ne"
                  onMouseDown={(e) => handleResizeMouseDown(e, "ne")}
                  style={{ cursor: "nesw-resize" }}
                />
                <div
                  className="resize-corner sw"
                  onMouseDown={(e) => handleResizeMouseDown(e, "sw")}
                  style={{ cursor: "nesw-resize" }}
                />
                <div
                  className="resize-corner se"
                  onMouseDown={(e) => handleResizeMouseDown(e, "se")}
                  style={{ cursor: "nwse-resize" }}
                />
              </>
            )}
            {!isLocked && resizable.horizontal && !resizable.vertical && (
              <>
                <div
                  className="resize-corner e"
                  onMouseDown={(e) => handleResizeMouseDown(e, "e")}
                />
                <div
                  className="resize-corner w"
                  onMouseDown={(e) => handleResizeMouseDown(e, "w")}
                />
              </>
            )}
            {!isLocked && !resizable.horizontal && resizable.vertical && (
              <>
                <div
                  className="resize-corner n"
                  onMouseDown={(e) => handleResizeMouseDown(e, "n")}
                />
                <div
                  className="resize-corner s"
                  onMouseDown={(e) => handleResizeMouseDown(e, "s")}
                />
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}

