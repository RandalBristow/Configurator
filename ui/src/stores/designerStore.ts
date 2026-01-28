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
  updateChildrenForTarget,
  type ContainerTarget,
} from "./designerTree";

type AlignMode = "left" | "center" | "right" | "top" | "middle" | "bottom";
type MatchSizeMode = "width" | "height" | "size";
type DistributeMode = "horizontal" | "vertical";
type SpacingMode = "horizontal" | "vertical";
type ZOrderMode = "bringToFront" | "sendToBack" | "bringForward" | "sendBackward";
type PanelLayout = { toolbox: number; canvas: number; properties: number };
type CollectionEditorState =
  | null
  | { kind: "tabPages"; componentId: string }
  | { kind: "accordionPanels"; componentId: string }
  | { kind: "stepperSteps"; componentId: string };

type DesignerStoreState = {
  components: DesignerComponent[];
  selectedComponentId: string | null;
  selectedComponentIds: string[];
  collectionEditor: CollectionEditorState;
  hoveredComponentId: string | null;
  flowDropIndicator: { target: ContainerTarget; index: number } | null;
  activeDropTarget: ContainerTarget | null;
  snapGuides: Array<unknown>;
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  panelLayout: PanelLayout;
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
  openCollectionEditor: (editor: NonNullable<CollectionEditorState>) => void;
  closeCollectionEditor: () => void;
  setSelectedComponents: (ids: string[], primaryId?: string | null) => void;
  setPrimarySelection: (id: string | null) => void;
  addComponentSelection: (id: string) => void;
  toggleComponentSelection: (id: string) => void;
  setHoveredComponent: (id: string | null) => void;
  setFlowDropIndicator: (
    indicator: { target: ContainerTarget; index: number } | null
  ) => void;
  setActiveDropTarget: (target: ContainerTarget | null) => void;
  setDraggedComponent: (component: DesignerComponent | null) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setShowGrid: (visible: boolean) => void;
  setGridSize: (size: number) => void;
  setPanelLayout: (layout: PanelLayout) => void;
  updateSnapGuides: (guides: Array<unknown>) => void;
  setCanvasSize: (size: { width: number; height: number }) => void;
  setZoom: (zoom: number) => void;
  clearSelection: () => void;
  duplicateComponent: (id: string) => void;
  alignSelectedComponents: (mode: AlignMode) => void;
  matchSelectedSizes: (mode: MatchSizeMode) => void;
  distributeSelectedComponents: (mode: DistributeMode) => void;
  equalizeSelectedSpacing: (mode: SpacingMode) => void;
  reorderSelectedComponents: (mode: ZOrderMode) => void;
  groupSelectedComponents: () => void;
  ungroupSelectedComponents: () => void;
  toggleLockSelected: () => void;
  toggleHiddenSelected: () => void;
  moveComponentToTarget: (
    id: string,
    target: ContainerTarget,
    index?: number
  ) => void;
  getComponentById: (id: string) => DesignerComponent | undefined;
  loadFormDefinition: (definition?: DesignerFormDefinition | null) => void;
  getFormDefinition: () => DesignerFormDefinition;
  removeComponents: (ids: string[]) => void;
};

const generateId = () => Math.random().toString(36).slice(2, 11);

const normalizeSelection = (ids: string[]) =>
  Array.from(new Set(ids.filter(Boolean)));

const buildTargetKey = (target: ContainerTarget) => {
  if (target.kind === "root") return "root";
  if (target.kind === "children") return `children:${target.componentId}`;
  if (target.kind === "accordionPanel") {
    return `accordion:${target.componentId}:${target.panelId}`;
  }
  if (target.kind === "multiInstanceStep") {
    return `step:${target.componentId}:${target.stepId}`;
  }
  if (target.kind === "tabPanel") {
    return `tab:${target.componentId}:${target.tabId}`;
  }
  if (target.kind === "gridColumn") {
    return `grid:${target.componentId}:${target.column}`;
  }
  return "root";
};

const isFlowLayoutTarget = (
  parent: DesignerComponent | null | undefined,
  target: ContainerTarget
) => {
  if (!parent) return false;
  if (target.kind === "gridColumn" && parent.type === "Section") return true;
  if (target.kind === "children") {
    return (
      parent.type === "Subsection" ||
      parent.type === "Card" ||
      parent.type === "FlexContainer" ||
      parent.type === "Grid"
    );
  }
  return false;
};

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
  selectedComponentIds: [],
  collectionEditor: null,
  hoveredComponentId: null,
  flowDropIndicator: null,
  activeDropTarget: null,
  snapGuides: [],
  gridSize: 10,
  snapToGrid: true,
  showGrid: true,
  panelLayout: { toolbox: 18, canvas: 64, properties: 18 },
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
      selectedComponentIds: [component.id],
    }));
  },

  removeComponent: (id) => {
    set((state) => {
      const nextComponents = removeComponentById(state.components, id);
      const nextSelectedIds = state.selectedComponentIds.filter((selectedId) =>
        findComponentById(nextComponents, selectedId)
      );
      const selectedId = state.selectedComponentId;
      const stillSelected =
        selectedId && nextSelectedIds.includes(selectedId)
          ? selectedId
          : nextSelectedIds[0] ?? null;
      return {
        components: nextComponents,
        selectedComponentId: stillSelected,
        selectedComponentIds: nextSelectedIds,
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
    if (!id) {
      set({ selectedComponentId: null, selectedComponentIds: [] });
      return;
    }
    set({ selectedComponentId: id, selectedComponentIds: [id] });
  },

  openCollectionEditor: (editor) => {
    if (!editor) return;
    set({ collectionEditor: editor });
  },

  closeCollectionEditor: () => {
    set({ collectionEditor: null });
  },

  setSelectedComponents: (ids, primaryId) => {
    const normalized = normalizeSelection(ids);
    const primary =
      primaryId && normalized.includes(primaryId)
        ? primaryId
        : normalized[0] ?? null;
    set({ selectedComponentIds: normalized, selectedComponentId: primary });
  },

  setPrimarySelection: (id) => {
    if (!id) {
      set({ selectedComponentId: null, selectedComponentIds: [] });
      return;
    }
    set((state) => {
      const normalized = state.selectedComponentIds.includes(id)
        ? state.selectedComponentIds
        : normalizeSelection([...state.selectedComponentIds, id]);
      return { selectedComponentIds: normalized, selectedComponentId: id };
    });
  },

  addComponentSelection: (id) => {
    set((state) => {
      const normalized = normalizeSelection([
        ...state.selectedComponentIds,
        id,
      ]);
      return { selectedComponentIds: normalized, selectedComponentId: id };
    });
  },

  toggleComponentSelection: (id) => {
    set((state) => {
      const exists = state.selectedComponentIds.includes(id);
      const nextIds = exists
        ? state.selectedComponentIds.filter((selectedId) => selectedId !== id)
        : [...state.selectedComponentIds, id];
      const normalized = normalizeSelection(nextIds);
      const primary = (() => {
        if (!exists) return id;
        if (state.selectedComponentId === id) {
          return normalized[normalized.length - 1] ?? null;
        }
        return normalized.includes(state.selectedComponentId ?? "")
          ? state.selectedComponentId
          : normalized[normalized.length - 1] ?? null;
      })();
      return { selectedComponentIds: normalized, selectedComponentId: primary };
    });
  },

  setHoveredComponent: (id) => {
    set({ hoveredComponentId: id });
  },

  setFlowDropIndicator: (indicator) => {
    set({ flowDropIndicator: indicator });
  },

  setActiveDropTarget: (target) => {
    set({ activeDropTarget: target });
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

  setPanelLayout: (layout) => {
    const toNumber = (value: unknown, fallback: number) =>
      typeof value === "number" && Number.isFinite(value) ? value : fallback;
    const next = {
      toolbox: toNumber(layout?.toolbox, 18),
      canvas: toNumber(layout?.canvas, 64),
      properties: toNumber(layout?.properties, 18),
    };
    set({ panelLayout: next });
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
    set({ selectedComponentId: null, selectedComponentIds: [] });
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
      selectedComponentIds: [cloned.id],
    }));
  },

  alignSelectedComponents: (mode) => {
    set((state) => {
      if (state.selectedComponentIds.length < 2) return state;
      const updates = new Map<string, { x: number; y: number }>();
      const groups = new Map<
        string,
        { target: ContainerTarget; components: DesignerComponent[]; ids: string[] }
      >();
      const selectionOrder = state.selectedComponentIds;
      const primarySelectionId = state.selectedComponentId;
      const snapValue = (value: number) =>
        state.snapToGrid
          ? Math.round(value / state.gridSize) * state.gridSize
          : Math.round(value);

      const getMetric = (component: DesignerComponent) => {
        const width = component.size?.width ?? 0;
        const height = component.size?.height ?? 0;
        const x = component.position?.x ?? 0;
        const y = component.position?.y ?? 0;
        return {
          id: component.id,
          x,
          y,
          width,
          height,
          right: x + width,
          bottom: y + height,
          centerX: x + width / 2,
          centerY: y + height / 2,
        };
      };

      state.selectedComponentIds.forEach((id) => {
        const location = findComponentLocation(state.components, id);
        if (!location) return;
        const parent =
          location.parent.kind === "root"
            ? null
            : findComponentById(state.components, location.parent.componentId);
        if (isFlowLayoutTarget(parent, location.parent)) return;
        const key = buildTargetKey(location.parent);
        if (!groups.has(key)) {
          groups.set(key, { target: location.parent, components: [], ids: [] });
        }
        groups.get(key)?.components.push(location.component);
        groups.get(key)?.ids.push(location.component.id);
      });

      groups.forEach((group) => {
        if (group.components.length < 2) return;
        // Align relative to the "anchor" component (the most recently selected).
        const anchorId = (() => {
          if (primarySelectionId && group.ids.includes(primarySelectionId)) {
            return primarySelectionId;
          }
          for (let index = selectionOrder.length - 1; index >= 0; index -= 1) {
            const candidate = selectionOrder[index];
            if (group.ids.includes(candidate)) return candidate;
          }
          return group.ids[group.ids.length - 1] ?? null;
        })();
        if (!anchorId) return;
        const anchorComponent = group.components.find(
          (component) => component.id === anchorId
        );
        if (!anchorComponent) return;
        const anchor = getMetric(anchorComponent);

        group.components.forEach((component) => {
          if (component.id === anchorId) return;
          if (component.properties?.locked === true) return;
          const metric = getMetric(component);
          let nextX = metric.x;
          let nextY = metric.y;
          if (mode === "left") {
            nextX = anchor.x;
          } else if (mode === "center") {
            nextX = anchor.centerX - metric.width / 2;
          } else if (mode === "right") {
            nextX = anchor.right - metric.width;
          } else if (mode === "top") {
            nextY = anchor.y;
          } else if (mode === "middle") {
            nextY = anchor.centerY - metric.height / 2;
          } else if (mode === "bottom") {
            nextY = anchor.bottom - metric.height;
          }
          updates.set(metric.id, {
            x: snapValue(nextX),
            y: snapValue(nextY),
          });
        });
      });

      if (updates.size === 0) return state;
      let nextComponents = state.components;
      updates.forEach((position, id) => {
        nextComponents = updateComponentById(
          nextComponents,
          id,
          (component) => ({
            ...component,
            position: { ...component.position, ...position },
          })
        );
      });
      return { components: nextComponents };
    });
  },

  matchSelectedSizes: (mode) => {
    set((state) => {
      if (state.selectedComponentIds.length < 2) return state;
      const anchorId =
        state.selectedComponentId ??
        state.selectedComponentIds[state.selectedComponentIds.length - 1] ??
        null;
      if (!anchorId) return state;
      const anchor = findComponentById(state.components, anchorId);
      if (!anchor) return state;
      const anchorWidth = anchor.size?.width ?? 0;
      const anchorHeight = anchor.size?.height ?? 0;

      let nextComponents = state.components;
      state.selectedComponentIds.forEach((id) => {
        if (id === anchorId) return;
        const component = findComponentById(nextComponents, id);
        if (component?.properties?.locked === true) return;
        nextComponents = updateComponentById(nextComponents, id, (component) => {
          const current = component.size ?? { width: 0, height: 0 };
          if (mode === "width") {
            return { ...component, size: { ...current, width: anchorWidth } };
          }
          if (mode === "height") {
            return { ...component, size: { ...current, height: anchorHeight } };
          }
          return { ...component, size: { width: anchorWidth, height: anchorHeight } };
        });
      });
      if (nextComponents === state.components) return state;
      return { components: nextComponents };
    });
  },

  distributeSelectedComponents: (mode) => {
    set((state) => {
      if (state.selectedComponentIds.length < 3) return state;
      const updates = new Map<string, { x?: number; y?: number }>();
      const groups = new Map<string, { target: ContainerTarget; components: DesignerComponent[] }>();
      const snapValue = (value: number) =>
        state.snapToGrid
          ? Math.round(value / state.gridSize) * state.gridSize
          : Math.round(value);

      const getMetric = (component: DesignerComponent) => {
        const width = component.size?.width ?? 0;
        const height = component.size?.height ?? 0;
        const x = component.position?.x ?? 0;
        const y = component.position?.y ?? 0;
        return {
          id: component.id,
          x,
          y,
          width,
          height,
          centerX: x + width / 2,
          centerY: y + height / 2,
        };
      };

      state.selectedComponentIds.forEach((id) => {
        const location = findComponentLocation(state.components, id);
        if (!location) return;
        const parent =
          location.parent.kind === "root"
            ? null
            : findComponentById(state.components, location.parent.componentId);
        if (isFlowLayoutTarget(parent, location.parent)) return;
        if (location.component.properties?.locked === true) return;
        const key = buildTargetKey(location.parent);
        if (!groups.has(key)) {
          groups.set(key, { target: location.parent, components: [] });
        }
        groups.get(key)?.components.push(location.component);
      });

      groups.forEach((group) => {
        if (group.components.length < 3) return;
        const metrics = group.components.map(getMetric);
        const sorted = metrics
          .slice()
          .sort((a, b) =>
            mode === "horizontal" ? a.centerX - b.centerX : a.centerY - b.centerY
          );
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        if (!first || !last) return;
        const span =
          mode === "horizontal"
            ? last.centerX - first.centerX
            : last.centerY - first.centerY;
        if (!Number.isFinite(span) || span === 0) return;
        const step = span / (sorted.length - 1);

        sorted.forEach((metric, index) => {
          if (index === 0 || index === sorted.length - 1) return;
          if (mode === "horizontal") {
            const targetCenter = first.centerX + step * index;
            const nextX = targetCenter - metric.width / 2;
            updates.set(metric.id, { x: snapValue(nextX) });
          } else {
            const targetCenter = first.centerY + step * index;
            const nextY = targetCenter - metric.height / 2;
            updates.set(metric.id, { y: snapValue(nextY) });
          }
        });
      });

      if (updates.size === 0) return state;
      let nextComponents = state.components;
      updates.forEach((position, id) => {
        nextComponents = updateComponentById(nextComponents, id, (component) => ({
          ...component,
          position: { ...component.position, ...position },
        }));
      });
      return { components: nextComponents };
    });
  },

  equalizeSelectedSpacing: (mode) => {
    set((state) => {
      if (state.selectedComponentIds.length < 3) return state;
      const updates = new Map<string, { x?: number; y?: number }>();
      const groups = new Map<string, { target: ContainerTarget; components: DesignerComponent[] }>();
      const snapValue = (value: number) =>
        state.snapToGrid
          ? Math.round(value / state.gridSize) * state.gridSize
          : Math.round(value);

      const getMetric = (component: DesignerComponent) => {
        const width = component.size?.width ?? 0;
        const height = component.size?.height ?? 0;
        const x = component.position?.x ?? 0;
        const y = component.position?.y ?? 0;
        return {
          id: component.id,
          x,
          y,
          width,
          height,
          right: x + width,
          bottom: y + height,
        };
      };

      state.selectedComponentIds.forEach((id) => {
        const location = findComponentLocation(state.components, id);
        if (!location) return;
        const parent =
          location.parent.kind === "root"
            ? null
            : findComponentById(state.components, location.parent.componentId);
        if (isFlowLayoutTarget(parent, location.parent)) return;
        if (location.component.properties?.locked === true) return;
        const key = buildTargetKey(location.parent);
        if (!groups.has(key)) {
          groups.set(key, { target: location.parent, components: [] });
        }
        groups.get(key)?.components.push(location.component);
      });

      groups.forEach((group) => {
        if (group.components.length < 3) return;
        const metrics = group.components.map(getMetric);
        const sorted = metrics
          .slice()
          .sort((a, b) => (mode === "horizontal" ? a.x - b.x : a.y - b.y));
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        if (!first || !last) return;

        if (mode === "horizontal") {
          const left = first.x;
          const right = last.right;
          const totalWidth = sorted.reduce((sum, metric) => sum + metric.width, 0);
          const gap = (right - left - totalWidth) / (sorted.length - 1);
          let cursor = left;
          sorted.forEach((metric, index) => {
            if (index !== 0 && index !== sorted.length - 1) {
              updates.set(metric.id, { x: snapValue(cursor) });
            }
            cursor += metric.width + gap;
          });
        } else {
          const top = first.y;
          const bottom = last.bottom;
          const totalHeight = sorted.reduce((sum, metric) => sum + metric.height, 0);
          const gap = (bottom - top - totalHeight) / (sorted.length - 1);
          let cursor = top;
          sorted.forEach((metric, index) => {
            if (index !== 0 && index !== sorted.length - 1) {
              updates.set(metric.id, { y: snapValue(cursor) });
            }
            cursor += metric.height + gap;
          });
        }
      });

      if (updates.size === 0) return state;
      let nextComponents = state.components;
      updates.forEach((position, id) => {
        nextComponents = updateComponentById(nextComponents, id, (component) => ({
          ...component,
          position: { ...component.position, ...position },
        }));
      });
      return { components: nextComponents };
    });
  },

  reorderSelectedComponents: (mode) => {
    set((state) => {
      if (state.selectedComponentIds.length === 0) return state;
      const selected = new Set(state.selectedComponentIds);
      const groups = new Map<string, ContainerTarget>();

      state.selectedComponentIds.forEach((id) => {
        const location = findComponentLocation(state.components, id);
        if (!location) return;
        const key = buildTargetKey(location.parent);
        if (!groups.has(key)) {
          groups.set(key, location.parent);
        }
      });

      let nextComponents = state.components;
      groups.forEach((target) => {
        nextComponents = updateChildrenForTarget(nextComponents, target, (children) => {
          if (!Array.isArray(children) || children.length < 2) return children;
          const ids = children.map((child) => child.id);
          const selectedInOrder = ids.filter((id) => selected.has(id));
          if (selectedInOrder.length === 0) return children;

          let nextIds = ids.slice();
          if (mode === "bringToFront") {
            const unselected = ids.filter((id) => !selected.has(id));
            nextIds = [...unselected, ...selectedInOrder];
          } else if (mode === "sendToBack") {
            const unselected = ids.filter((id) => !selected.has(id));
            nextIds = [...selectedInOrder, ...unselected];
          } else if (mode === "bringForward") {
            for (let index = nextIds.length - 2; index >= 0; index -= 1) {
              const id = nextIds[index];
              if (!selected.has(id)) continue;
              const nextId = nextIds[index + 1];
              if (selected.has(nextId)) continue;
              nextIds[index] = nextId;
              nextIds[index + 1] = id;
            }
          } else if (mode === "sendBackward") {
            for (let index = 1; index < nextIds.length; index += 1) {
              const id = nextIds[index];
              if (!selected.has(id)) continue;
              const prevId = nextIds[index - 1];
              if (selected.has(prevId)) continue;
              nextIds[index] = prevId;
              nextIds[index - 1] = id;
            }
          }

          const byId = new Map(children.map((child) => [child.id, child]));
          const nextChildren = nextIds
            .map((id) => byId.get(id))
            .filter(Boolean) as DesignerComponent[];
          return nextChildren.length === children.length ? nextChildren : children;
        });
      });

      if (nextComponents === state.components) return state;
      return { components: nextComponents };
    });
  },

  groupSelectedComponents: () => {
    set((state) => {
      if (state.selectedComponentIds.length < 2) return state;
      const locations = state.selectedComponentIds
        .map((id) => findComponentLocation(state.components, id))
        .filter(Boolean) as Array<{
        component: DesignerComponent;
        parent: ContainerTarget;
        index: number;
      }>;
      if (locations.length < 2) return state;

      const parentKey = buildTargetKey(locations[0].parent);
      if (!locations.every((location) => buildTargetKey(location.parent) === parentKey)) {
        return state;
      }

      const parentComponent =
        locations[0].parent.kind === "root"
          ? null
          : findComponentById(state.components, locations[0].parent.componentId);
      if (isFlowLayoutTarget(parentComponent, locations[0].parent)) {
        return state;
      }

      const ordered = locations.slice().sort((a, b) => a.index - b.index);
      const metrics = ordered.map((location) => ({
        component: location.component,
        x: location.component.position?.x ?? 0,
        y: location.component.position?.y ?? 0,
        right:
          (location.component.position?.x ?? 0) +
          (location.component.size?.width ?? 0),
        bottom:
          (location.component.position?.y ?? 0) +
          (location.component.size?.height ?? 0),
      }));
      const minX = Math.min(...metrics.map((metric) => metric.x));
      const minY = Math.min(...metrics.map((metric) => metric.y));
      const maxRight = Math.max(...metrics.map((metric) => metric.right));
      const maxBottom = Math.max(...metrics.map((metric) => metric.bottom));
      const width = Math.max(40, Math.round(maxRight - minX));
      const height = Math.max(24, Math.round(maxBottom - minY));

      const groupId = generateId();
      const children = ordered.map((location) => ({
        ...location.component,
        position: {
          x: Math.round((location.component.position?.x ?? 0) - minX),
          y: Math.round((location.component.position?.y ?? 0) - minY),
        },
      }));

      const groupComponent: DesignerComponent = {
        id: groupId,
        type: "Container",
        position: { x: Math.round(minX), y: Math.round(minY) },
        size: { width, height },
        properties: {
          showHeader: false,
          disableGutters: true,
          paddingX: 0,
          paddingY: 0,
          fixed: false,
          maxWidth: false,
          isGroup: true,
        },
        children,
      };

      let nextComponents = state.components;
      state.selectedComponentIds.forEach((id) => {
        nextComponents = removeComponentById(nextComponents, id);
      });
      nextComponents = insertComponentAt(
        nextComponents,
        locations[0].parent,
        groupComponent,
        ordered[0].index
      );
      return {
        components: nextComponents,
        selectedComponentId: groupId,
        selectedComponentIds: [groupId],
      };
    });
  },

  ungroupSelectedComponents: () => {
    set((state) => {
      if (state.selectedComponentIds.length === 0) return state;

      const groupIds = state.selectedComponentIds.filter((id) => {
        const component = findComponentById(state.components, id);
        return component?.type === "Container" && component.properties?.isGroup === true;
      });
      if (groupIds.length === 0) return state;

      let nextComponents = state.components;
      const nextSelected: string[] = state.selectedComponentIds.filter(
        (id) => !groupIds.includes(id)
      );

      groupIds.forEach((groupId) => {
        const location = findComponentLocation(nextComponents, groupId);
        if (!location) return;
        const group = location.component;
        const offsetX = group.position?.x ?? 0;
        const offsetY = group.position?.y ?? 0;
        const children = Array.isArray(group.children) ? group.children : [];

        nextComponents = removeComponentById(nextComponents, groupId);
        let insertIndex = location.index;
        children.forEach((child) => {
          const nextChild: DesignerComponent = {
            ...child,
            position: {
              x: Math.round((child.position?.x ?? 0) + offsetX),
              y: Math.round((child.position?.y ?? 0) + offsetY),
            },
          };
          nextComponents = insertComponentAt(
            nextComponents,
            location.parent,
            nextChild,
            insertIndex
          );
          nextSelected.push(nextChild.id);
          insertIndex += 1;
        });
      });

      const normalized = normalizeSelection(nextSelected);
      const primary = normalized[normalized.length - 1] ?? null;
      return {
        components: nextComponents,
        selectedComponentIds: normalized,
        selectedComponentId: primary,
      };
    });
  },

  toggleLockSelected: () => {
    set((state) => {
      if (state.selectedComponentIds.length === 0) return state;
      const anyUnlocked = state.selectedComponentIds.some((id) => {
        const component = findComponentById(state.components, id);
        return component?.properties?.locked !== true;
      });
      const nextLocked = anyUnlocked;
      let nextComponents = state.components;
      state.selectedComponentIds.forEach((id) => {
        nextComponents = updateComponentById(nextComponents, id, (component) => ({
          ...component,
          properties: { ...component.properties, locked: nextLocked },
        }));
      });
      return { components: nextComponents };
    });
  },

  toggleHiddenSelected: () => {
    set((state) => {
      if (state.selectedComponentIds.length === 0) return state;
      const anyVisible = state.selectedComponentIds.some((id) => {
        const component = findComponentById(state.components, id);
        return component?.properties?.hidden !== true;
      });
      const nextHidden = anyVisible;
      let nextComponents = state.components;
      state.selectedComponentIds.forEach((id) => {
        nextComponents = updateComponentById(nextComponents, id, (component) => ({
          ...component,
          properties: { ...component.properties, hidden: nextHidden },
        }));
      });
      return { components: nextComponents };
    });
  },

  getComponentById: (id) => {
    return findComponentById(get().components, id);
  },

  moveComponentToTarget: (id, target, index) => {
    set((state) => ({
      components: moveComponentToTarget(state.components, id, target, index),
      selectedComponentId: id,
      selectedComponentIds: state.selectedComponentIds.includes(id)
        ? state.selectedComponentIds
        : [id],
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
      selectedComponentIds: [],
      hoveredComponentId: null,
      draggedComponent: null,
      activeDropTarget: null,
      snapGuides: [],
      canvasSize: resolved.canvasSize ?? fallback.canvasSize,
      zoom: typeof resolved.zoom === "number" ? resolved.zoom : fallback.zoom,
    });
  },

  getFormDefinition: () => {
    const { components, canvasSize, zoom } = get();
    return { version: 1, components, canvasSize, zoom };
  },

  removeComponents: (ids) => {
    set((state) => {
      if (!Array.isArray(ids) || ids.length === 0) return state;
      let nextComponents = state.components;
      ids.forEach((id) => {
        nextComponents = removeComponentById(nextComponents, id);
      });
      const nextSelectedIds = state.selectedComponentIds.filter((selectedId) =>
        findComponentById(nextComponents, selectedId)
      );
      const selectedId = state.selectedComponentId;
      const primary =
        selectedId && nextSelectedIds.includes(selectedId)
          ? selectedId
          : nextSelectedIds[0] ?? null;
      return {
        components: nextComponents,
        selectedComponentId: primary,
        selectedComponentIds: nextSelectedIds,
      };
    });
  },
}));
