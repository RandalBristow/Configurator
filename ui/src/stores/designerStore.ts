import { create } from "zustand";
import type { DesignerComponent, DesignerFormDefinition } from "../types/designer";
import {
  cloneComponentTree,
  findComponentById,
  findComponentLocation,
  insertComponentAt,
  moveComponentToTarget,
  removeComponentById,
  updateComponentById,
  type ContainerTarget,
} from "./designerTree";

type DesignerStoreState = {
  components: DesignerComponent[];
  selectedComponentId: string | null;
  hoveredComponentId: string | null;
  flowDropIndicator: { target: ContainerTarget; index: number } | null;
  snapGuides: Array<unknown>;
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  draggedComponent: DesignerComponent | null;
  canvasSize: { width: number; height: number };
  zoom: number;

  addComponent: (
    componentData: Omit<DesignerComponent, "id">,
    target?: ContainerTarget,
    index?: number
  ) => void;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, updates: Partial<DesignerComponent>) => void;
  moveComponent: (id: string, position: { x: number; y: number }) => void;
  resizeComponent: (id: string, size: { width: number; height: number }) => void;
  selectComponent: (id: string | null) => void;
  setHoveredComponent: (id: string | null) => void;
  setFlowDropIndicator: (
    indicator: { target: ContainerTarget; index: number } | null
  ) => void;
  setDraggedComponent: (component: DesignerComponent | null) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setShowGrid: (visible: boolean) => void;
  setGridSize: (size: number) => void;
  updateSnapGuides: (guides: Array<unknown>) => void;
  setCanvasSize: (size: { width: number; height: number }) => void;
  setZoom: (zoom: number) => void;
  clearSelection: () => void;
  duplicateComponent: (id: string) => void;
  moveComponentToTarget: (
    id: string,
    target: ContainerTarget,
    index?: number
  ) => void;
  getComponentById: (id: string) => DesignerComponent | undefined;
  loadFormDefinition: (definition?: DesignerFormDefinition | null) => void;
  getFormDefinition: () => DesignerFormDefinition;
};

const generateId = () => Math.random().toString(36).slice(2, 11);

const normalizeFlatComponents = (components: DesignerComponent[]) => {
  const hasParentIds = components.some(
    (component) => typeof (component as { parentId?: string }).parentId === "string"
  );
  if (!hasParentIds) return components;
  const byId = new Map<string, DesignerComponent>();
  components.forEach((component) => {
    const cleaned = { ...component };
    delete (cleaned as { parentId?: string }).parentId;
    byId.set(component.id, { ...cleaned, children: [] });
  });
  const roots: DesignerComponent[] = [];
  components.forEach((component) => {
    const parentId = (component as { parentId?: string }).parentId ?? null;
    const current = byId.get(component.id);
    if (!current) return;
    if (parentId && byId.has(parentId)) {
      const parent = byId.get(parentId);
      if (parent) {
        parent.children = [...(parent.children ?? []), current];
      }
    } else {
      roots.push(current);
    }
  });
  return roots;
};

export const useDesignerStore = create<DesignerStoreState>((set, get) => ({
  // Initial state
  components: [],
  selectedComponentId: null,
  hoveredComponentId: null,
  flowDropIndicator: null,
  snapGuides: [],
  gridSize: 10,
  snapToGrid: true,
  showGrid: true,
  draggedComponent: null,
  canvasSize: { width: 800, height: 600 },
  zoom: 1,

  // Actions
  addComponent: (componentData, target = { kind: "root" }, index) => {
    const component = {
      ...componentData,
      id: generateId(),
    };
    set((state) => ({
      components: insertComponentAt(state.components, target, component, index),
      selectedComponentId: component.id,
    }));
  },

  removeComponent: (id) => {
    set((state) => {
      const nextComponents = removeComponentById(state.components, id);
      const selectedId = state.selectedComponentId;
      const stillSelected = selectedId
        ? findComponentById(nextComponents, selectedId)
        : null;
      return {
        components: nextComponents,
        selectedComponentId: stillSelected ? selectedId : null,
      };
    });
  },

  updateComponent: (id, updates) => {
    set((state) => ({
      components: updateComponentById(state.components, id, (component) => ({
        ...component,
        ...updates,
      })),
    }));
  },

  moveComponent: (id, position) => {
    const { snapToGrid, gridSize } = get();
    let finalPosition = position;
    if (snapToGrid) {
      finalPosition = {
        x: Math.round(position.x / gridSize) * gridSize,
        y: Math.round(position.y / gridSize) * gridSize,
      };
    }
    set((state) => ({
      components: updateComponentById(state.components, id, (component) => ({
        ...component,
        position: finalPosition,
      })),
    }));
  },

  resizeComponent: (id, size) => {
    // Always set the measured size, do not snap to grid for any component
    set((state) => ({
      components: updateComponentById(state.components, id, (component) => ({
        ...component,
        size,
      })),
    }));
  },

  selectComponent: (id) => {
    set({ selectedComponentId: id });
  },

  setHoveredComponent: (id) => {
    set({ hoveredComponentId: id });
  },

  setFlowDropIndicator: (indicator) => {
    set({ flowDropIndicator: indicator });
  },

  setDraggedComponent: (component) => {
    set({ draggedComponent: component });
  },

  setSnapToGrid: (enabled) => {
    set({ snapToGrid: enabled });
  },

  setShowGrid: (visible) => {
    set({ showGrid: visible });
  },

  setGridSize: (size) => {
    set({ gridSize: size });
  },

  updateSnapGuides: (guides) => {
    set({ snapGuides: guides });
  },

  setCanvasSize: (size) => {
    set({ canvasSize: size });
  },

  setZoom: (zoom) => {
    set({ zoom: Math.max(0.1, Math.min(3, zoom)) });
  },

  clearSelection: () => {
    set({ selectedComponentId: null });
  },

  duplicateComponent: (id) => {
    const state = get();
    const location = findComponentLocation(state.components, id);
    if (!location) return;
    const cloned = cloneComponentTree(location.component, generateId);
    if (location.parent.kind === "root") {
      cloned.position = {
        x: location.component.position.x + 20,
        y: location.component.position.y + 20,
      };
    }
    set((state) => ({
      components: insertComponentAt(
        state.components,
        location.parent,
        cloned,
        location.index + 1
      ),
      selectedComponentId: cloned.id,
    }));
  },

  getComponentById: (id) => {
    return findComponentById(get().components, id);
  },

  moveComponentToTarget: (id, target, index) => {
    set((state) => ({
      components: moveComponentToTarget(state.components, id, target, index),
      selectedComponentId: id,
    }));
  },

  loadFormDefinition: (definition) => {
    const fallback: DesignerFormDefinition = {
      version: 1,
      components: [],
      canvasSize: { width: 800, height: 600 },
      zoom: 1,
    };
    const resolved = definition ?? fallback;
    set({
      components: normalizeFlatComponents(resolved.components ?? []),
      selectedComponentId: null,
      hoveredComponentId: null,
      draggedComponent: null,
      snapGuides: [],
      canvasSize: resolved.canvasSize ?? fallback.canvasSize,
      zoom: typeof resolved.zoom === "number" ? resolved.zoom : fallback.zoom,
    });
  },

  getFormDefinition: () => {
    const { components, canvasSize, zoom } = get();
    return { version: 1, components, canvasSize, zoom };
  },
}));
