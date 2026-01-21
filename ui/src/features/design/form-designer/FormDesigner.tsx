// @ts-nocheck
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ToolboxPanel from "./ToolboxPanel";
import { DesignSurface } from "./DesignSurface";
import { PropertiesPanel } from "./PropertiesPanel";
import { useDesignerStore } from "@/stores/designerStore";
import { componentDefinitions } from "@/data/componentDefinitions";
import { getDropZoneId } from "./containerUtils";
import { canDropComponentInTarget } from "./dropRules";
import { OptionVariablesPanel } from "@/components/options/OptionVariablesPanel";
import type { OptionsDetailsPaneProps } from "@/components/options/OptionsDetailsPane";
import type { VariablesManager } from "@/features/variables/hooks/useVariablesManager";
import type { PanelImperativeHandle, PanelSize } from "react-resizable-panels";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

type Props = {
  optionDetails?: OptionsDetailsPaneProps;
  optionVariables?: VariablesManager;
};

const generateId = () => Math.random().toString(36).slice(2, 9);

export function FormDesigner({ optionDetails, optionVariables }: Props) {
  const [draggedItem, setDraggedItem] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  // Store offset between mouse and top-left of drag preview
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const toolboxPanelRef = useRef<PanelImperativeHandle | null>(null);
  const [toolboxCollapsed, setToolboxCollapsed] = useState(false);
  const variablesPanelRef = useRef<PanelImperativeHandle | null>(null);
  const [variablesCollapsed, setVariablesCollapsed] = useState(false);
  const { addComponent, moveComponent, setDraggedComponent } = useDesignerStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleDragStart = (event) => {
    const data = event.active.data.current;
    setDraggedItem(data);
    // Calculate offset between mouse and top-left of drag preview
    if (data.isNewComponent && event.activatorEvent) {
      // Find the drag source element (toolbox item)
      const sourceRect = event.activatorEvent.target?.getBoundingClientRect?.();
      if (sourceRect) {
        setDragOffset({
          x: event.activatorEvent.clientX - sourceRect.left,
          y: event.activatorEvent.clientY - sourceRect.top,
        });
      } else {
        setDragOffset({ x: 0, y: 0 });
      }
    }
    if (!data.isNewComponent && data.componentId) {
      const component = useDesignerStore
        .getState()
        .getComponentById(data.componentId);
      setDraggedComponent(component);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over, delta } = event;
    if (!over) {
      setDraggedItem(null);
      setDraggedComponent(null);
      return;
    }
    const dragData = active.data.current;
    if (dragData.isNewComponent) {
      const componentDef = componentDefinitions.find(
        (def) => def.type === dragData.componentType
      );
      if (componentDef) {
        const state = useDesignerStore.getState();
        const target = over.data?.current?.target ?? { kind: "root" };
        if (
          !canDropComponentInTarget(
            componentDef.type,
            target,
            state.getComponentById
          )
        ) {
          setDraggedItem(null);
          setDraggedComponent(null);
          return;
        }
        const targetElement = document.getElementById(getDropZoneId(target));
        let x = 50;
        let y = 50;
        if (targetElement) {
          const targetRect = targetElement.getBoundingClientRect();
          x = Math.max(0, mousePosition.x - targetRect.left - dragOffset.x);
          y = Math.max(0, mousePosition.y - targetRect.top - dragOffset.y);
        }
        if (
          target.kind === "gridColumn" &&
          state.getComponentById(target.componentId)?.type === "Section"
        ) {
          x = 0;
          y = 0;
        }
        // Map MUI-style values to Chakra-style values for Chakra compatibility
        const normalizePropertyValue = (key, value) => {
          if (key === "variant") {
            if (value === "contained") return "solid";
            if (value === "outlined") return "outline";
            if (value === "text") return "ghost";
          }
          if (key === "size") {
            if (value === "medium") return "md";
            if (value === "small") return "sm";
            if (value === "large") return "lg";
          }
          if (key === "color") {
            if (value === "primary") return "blue";
            if (value === "secondary") return "gray";
            if (value === "success") return "green";
            if (value === "error") return "red";
            if (value === "warning") return "yellow";
            if (value === "info") return "cyan";
          }
          return value;
        };
        const baseProperties = componentDef.properties.reduce(
          (acc, prop) => ({
            ...acc,
            [prop.key]: normalizePropertyValue(prop.key, prop.defaultValue),
          }),
          {}
        );
        const properties = {
          ...baseProperties,
          ...(componentDef.type === "Accordion"
            ? {
                panels: [
                  { id: generateId(), title: "Panel 1", children: [] },
                ],
              }
            : {}),
          ...(componentDef.type === "MultiInstanceStepper"
            ? {
                steps: [{ id: generateId(), title: "Step 1", children: [] }],
              }
            : {}),
        };
        addComponent(
          {
          type: componentDef.type,
          label: componentDef.label,
          position: { x, y },
          size: componentDef.defaultSize,
          properties,
          },
          target
        );
      }
    }
    if (!dragData.isNewComponent && dragData.componentId && event.delta) {
      // Use the transform delta to update the position
      const component = useDesignerStore
        .getState()
        .getComponentById(dragData.componentId);
      if (component) {
        const newX = Math.max(0, component.position.x + event.delta.x);
        const newY = Math.max(0, component.position.y + event.delta.y);
        moveComponent(dragData.componentId, { x: newX, y: newY });
      }
    }
    setDraggedItem(null);
    setDraggedComponent(null);
  };

  const handleToolboxResize = (size: PanelSize) => {
    const collapsed = toolboxPanelRef.current?.isCollapsed() ?? size.inPixels <= 64;
    setToolboxCollapsed((prev) => (prev === collapsed ? prev : collapsed));
  };

  const handleToolboxToggle = () => {
    const panel = toolboxPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) {
      panel.expand();
      setToolboxCollapsed(false);
    } else {
      panel.collapse();
      setToolboxCollapsed(true);
    }
  };

  const handleVariablesResize = (size: PanelSize) => {
    const collapsed =
      variablesPanelRef.current?.isCollapsed() ?? size.inPixels <= 52;
    setVariablesCollapsed((prev) => (prev === collapsed ? prev : collapsed));
  };

  const handleVariablesToggle = () => {
    const panel = variablesPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) {
      panel.expand();
      setVariablesCollapsed(false);
    } else {
      panel.collapse();
      setVariablesCollapsed(true);
    }
  };

  const showVariablesPanel = Boolean(optionVariables);
  const variablesDisabled = optionDetails?.disabled ?? true;

  return (
    <div className="form-designer">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <ResizablePanelGroup
          direction="horizontal"
          className="form-designer-panels"
        >
          <ResizablePanel
            minSize="12%"
            maxSize="30%"
            defaultSize="18%"
            collapsible
            collapsedSize={56}
            panelRef={toolboxPanelRef}
            onResize={handleToolboxResize}
            className="form-designer-panel form-designer-panel--toolbox"
          >
            <ToolboxPanel collapsed={toolboxCollapsed} onToggleCollapse={handleToolboxToggle} />
          </ResizablePanel>
          <ResizableHandle withHandle className="form-designer-handle" />
          <ResizablePanel
            minSize="40%"
            defaultSize="64%"
            className="form-designer-panel form-designer-panel--canvas"
          >
            <ResizablePanelGroup direction="vertical" className="form-designer-canvas-stack">
              <ResizablePanel
                minSize="40%"
                defaultSize="70%"
                className="form-designer-panel form-designer-panel--canvas-surface"
              >
                <DesignSurface />
              </ResizablePanel>
              {showVariablesPanel ? (
                <>
                  <ResizableHandle withHandle className="form-designer-handle form-designer-handle--horizontal" />
                  <ResizablePanel
                    minSize="14%"
                    defaultSize="30%"
                    collapsible
                    collapsedSize={44}
                    panelRef={variablesPanelRef}
                    onResize={handleVariablesResize}
                    className="form-designer-panel form-designer-panel--variables"
                  >
                    <div
                      className={`form-designer-variables${variablesCollapsed ? " is-collapsed" : ""}`}
                    >
                      <OptionVariablesPanel
                        manager={optionVariables}
                        disabled={variablesDisabled}
                        showToolbar={false}
                        headerActions={
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={handleVariablesToggle}
                            title={
                              variablesCollapsed
                                ? "Expand variables panel"
                                : "Collapse variables panel"
                            }
                            aria-label={
                              variablesCollapsed
                                ? "Expand variables panel"
                                : "Collapse variables panel"
                            }
                            aria-expanded={!variablesCollapsed}
                          >
                            {variablesCollapsed ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </button>
                        }
                      />
                    </div>
                  </ResizablePanel>
                </>
              ) : null}
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle withHandle className="form-designer-handle" />
          <ResizablePanel
            minSize="12%"
            maxSize="30%"
            defaultSize="18%"
            className="form-designer-panel form-designer-panel--properties"
          >
            <PropertiesPanel optionDetails={optionDetails} />
          </ResizablePanel>
        </ResizablePanelGroup>
        <DragOverlay>
          {draggedItem && draggedItem.isNewComponent && (
            <div
              className="form-designer-drag-preview"
              style={{ pointerEvents: "none", width: 160, height: 28 }}
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <rect x="3" y="3" width="14" height="14" rx="3" />
              </svg>
              <span className="truncate">
                {draggedItem.componentType || "Component"}
              </span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

