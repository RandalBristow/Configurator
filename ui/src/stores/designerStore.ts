import { create } from "zustand";
import type { DesignerComponent, DesignerFormDefinition } from "../types/designer";

type DesignerStoreState = {
  components: DesignerComponent[];
  selectedComponentId: string | null;
  hoveredComponentId: string | null;
  snapGuides: Array<unknown>;
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  draggedComponent: DesignerComponent | null;
  canvasSize: { width: number; height: number };
  zoom: number;

  addComponent: (componentData: Omit<DesignerComponent, "id">) => void;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, updates: Partial<DesignerComponent>) => void;
  moveComponent: (id: string, position: { x: number; y: number }) => void;
  resizeComponent: (id: string, size: { width: number; height: number }) => void;
  selectComponent: (id: string | null) => void;
  setHoveredComponent: (id: string | null) => void;
  setDraggedComponent: (component: DesignerComponent | null) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setShowGrid: (visible: boolean) => void;
  setGridSize: (size: number) => void;
  updateSnapGuides: (guides: Array<unknown>) => void;
  setCanvasSize: (size: { width: number; height: number }) => void;
  setZoom: (zoom: number) => void;
  clearSelection: () => void;
  duplicateComponent: (id: string) => void;
  getComponentById: (id: string) => DesignerComponent | undefined;
  loadFormDefinition: (definition?: DesignerFormDefinition | null) => void;
  getFormDefinition: () => DesignerFormDefinition;
};

const generateId = () => Math.random().toString(36).slice(2, 11);

export const useDesignerStore = create<DesignerStoreState>((set, get) => ({
  // Initial state
  components: [],
  selectedComponentId: null,
  hoveredComponentId: null,
  snapGuides: [],
  gridSize: 10,
  snapToGrid: true,
  showGrid: true,
  draggedComponent: null,
  canvasSize: { width: 800, height: 600 },
  zoom: 1,

  // Actions
  addComponent: (componentData) => {
    const component = {
      ...componentData,
      id: generateId(),
    };
    set((state) => ({
      components: [...state.components, component],
      selectedComponentId: component.id,
    }));
  },

  removeComponent: (id) => {
    set((state) => ({
      components: state.components.filter((c) => c.id !== id),
      selectedComponentId:
        state.selectedComponentId === id ? null : state.selectedComponentId,
    }));
  },

  updateComponent: (id, updates) => {
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
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
      components: state.components.map((c) =>
        c.id === id ? { ...c, position: finalPosition } : c
      ),
    }));
  },

  resizeComponent: (id, size) => {
    // Always set the measured size, do not snap to grid for any component
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? { ...c, size } : c
      ),
    }));
  },

  selectComponent: (id) => {
    set({ selectedComponentId: id });
  },

  setHoveredComponent: (id) => {
    set({ hoveredComponentId: id });
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
    const component = get().getComponentById(id);
    if (component) {
      const duplicated = {
        ...component,
        position: {
          x: component.position.x + 20,
          y: component.position.y + 20,
        },
      };
      // Preserve the type, label, size, and properties; assign a new id in addComponent.
      get().addComponent({
        type: duplicated.type,
        label: duplicated.label,
        position: duplicated.position,
        size: duplicated.size,
        properties: duplicated.properties,
      });
    }
  },

  getComponentById: (id) => {
    return get().components.find((c) => c.id === id);
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
      components: resolved.components ?? [],
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
