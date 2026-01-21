import type { DesignerComponent } from "../types/designer";

export type ContainerTarget =
  | { kind: "root" }
  | { kind: "children"; componentId: string }
  | { kind: "accordionPanel"; componentId: string; panelId: string }
  | { kind: "multiInstanceStep"; componentId: string; stepId: string }
  | { kind: "gridColumn"; componentId: string; column: number };

type AccordionPanel = {
  id: string;
  title?: string;
  children?: DesignerComponent[];
};

type StepDefinition = {
  id: string;
  title?: string;
  children?: DesignerComponent[];
};

const isAccordion = (component: DesignerComponent) =>
  component.type === "Accordion";

const isMultiInstanceStepper = (component: DesignerComponent) =>
  component.type === "MultiInstanceStepper";

const isGrid = (component: DesignerComponent) =>
  component.type === "Grid" || component.type === "Section";

const normalizeChildren = (
  children?: DesignerComponent[]
): DesignerComponent[] => (Array.isArray(children) ? children : []);

const getPanels = (component: DesignerComponent): AccordionPanel[] => {
  const panels = component.properties?.panels;
  if (!Array.isArray(panels)) return [];
  return panels.map((panel) => ({
    ...panel,
    children: normalizeChildren(panel.children),
  }));
};

const setPanels = (
  component: DesignerComponent,
  panels: AccordionPanel[]
) => ({
  ...component,
  properties: {
    ...component.properties,
    panels,
  },
});

const getSteps = (component: DesignerComponent): StepDefinition[] => {
  const steps = component.properties?.steps;
  if (!Array.isArray(steps)) return [];
  return steps.map((step) => ({
    ...step,
    children: normalizeChildren(step.children),
  }));
};

const setSteps = (
  component: DesignerComponent,
  steps: StepDefinition[]
) => ({
  ...component,
  properties: {
    ...component.properties,
    steps,
  },
});

const mapChildren = (
  children: DesignerComponent[],
  mapper: (component: DesignerComponent) => DesignerComponent
) => children.map(mapper);

export const updateComponentById = (
  components: DesignerComponent[],
  id: string,
  updater: (component: DesignerComponent) => DesignerComponent
): DesignerComponent[] => {
  const updateComponent = (component: DesignerComponent): DesignerComponent => {
    if (component.id === id) {
      return updater(component);
    }

    let nextComponent = component;

    if (component.children?.length) {
      const nextChildren = mapChildren(component.children, updateComponent);
      if (nextChildren !== component.children) {
        nextComponent = { ...nextComponent, children: nextChildren };
      }
    }

    if (isAccordion(component)) {
      const panels = getPanels(nextComponent);
      const nextPanels = panels.map((panel) => ({
        ...panel,
        children: mapChildren(panel.children ?? [], updateComponent),
      }));
      nextComponent = setPanels(nextComponent, nextPanels);
    }

    if (isMultiInstanceStepper(component)) {
      const steps = getSteps(nextComponent);
      const nextSteps = steps.map((step) => ({
        ...step,
        children: mapChildren(step.children ?? [], updateComponent),
      }));
      nextComponent = setSteps(nextComponent, nextSteps);
    }

    return nextComponent;
  };

  return components.map(updateComponent);
};

export const findComponentById = (
  components: DesignerComponent[],
  id: string
): DesignerComponent | undefined => {
  for (const component of components) {
    if (component.id === id) return component;
    const fromChildren = findComponentById(component.children ?? [], id);
    if (fromChildren) return fromChildren;
    if (isAccordion(component)) {
      for (const panel of getPanels(component)) {
        const fromPanels = findComponentById(panel.children ?? [], id);
        if (fromPanels) return fromPanels;
      }
    }
    if (isMultiInstanceStepper(component)) {
      for (const step of getSteps(component)) {
        const fromSteps = findComponentById(step.children ?? [], id);
        if (fromSteps) return fromSteps;
      }
    }
  }
  return undefined;
};

type ComponentLocation = {
  component: DesignerComponent;
  parent: ContainerTarget;
  index: number;
};

export const findComponentLocation = (
  components: DesignerComponent[],
  id: string,
  parent: ContainerTarget = { kind: "root" }
): ComponentLocation | null => {
  for (let index = 0; index < components.length; index += 1) {
    const component = components[index];
    if (component.id === id) {
      return { component, parent, index };
    }

    const childParent: ContainerTarget = isGrid(component)
      ? { kind: "gridColumn", componentId: component.id, column: 1 }
      : { kind: "children", componentId: component.id };

    const fromChildren = findComponentLocation(
      component.children ?? [],
      id,
      childParent
    );
    if (fromChildren) {
      if (fromChildren.parent.kind === "gridColumn") {
        const column = fromChildren.component.column ?? 1;
        return {
          ...fromChildren,
          parent: {
            kind: "gridColumn",
            componentId: component.id,
            column,
          },
        };
      }
      return fromChildren;
    }

    if (isAccordion(component)) {
      for (const panel of getPanels(component)) {
        const fromPanel = findComponentLocation(
          panel.children ?? [],
          id,
          { kind: "accordionPanel", componentId: component.id, panelId: panel.id }
        );
        if (fromPanel) return fromPanel;
      }
    }

    if (isMultiInstanceStepper(component)) {
      for (const step of getSteps(component)) {
        const fromStep = findComponentLocation(
          step.children ?? [],
          id,
          { kind: "multiInstanceStep", componentId: component.id, stepId: step.id }
        );
        if (fromStep) return fromStep;
      }
    }
  }
  return null;
};

type ExtractResult = {
  components: DesignerComponent[];
  removed?: DesignerComponent;
};

export const extractComponentById = (
  components: DesignerComponent[],
  id: string
): ExtractResult => {
  let removed: DesignerComponent | undefined;

  const nextComponents = components
    .map((component) => {
      if (component.id === id) {
        removed = component;
        return null;
      }

      let nextComponent = component;

      if (component.children?.length) {
        const result = extractComponentById(component.children, id);
        if (result.removed) {
          removed = result.removed;
          nextComponent = { ...nextComponent, children: result.components };
        }
      }

      if (isAccordion(component)) {
        const panels = getPanels(nextComponent);
        const nextPanels = panels.map((panel) => {
          const result = extractComponentById(panel.children ?? [], id);
          if (result.removed) {
            removed = result.removed;
            return { ...panel, children: result.components };
          }
          return panel;
        });
        nextComponent = setPanels(nextComponent, nextPanels);
      }

      if (isMultiInstanceStepper(component)) {
        const steps = getSteps(nextComponent);
        const nextSteps = steps.map((step) => {
          const result = extractComponentById(step.children ?? [], id);
          if (result.removed) {
            removed = result.removed;
            return { ...step, children: result.components };
          }
          return step;
        });
        nextComponent = setSteps(nextComponent, nextSteps);
      }

      return nextComponent;
    })
    .filter(Boolean) as DesignerComponent[];

  return { components: nextComponents, removed };
};

export const removeComponentById = (
  components: DesignerComponent[],
  id: string
) => extractComponentById(components, id).components;

const insertIntoList = (
  list: DesignerComponent[],
  component: DesignerComponent,
  index?: number
) => {
  if (typeof index !== "number" || index < 0 || index > list.length) {
    return [...list, component];
  }
  return [...list.slice(0, index), component, ...list.slice(index)];
};

const insertIntoGrid = (
  list: DesignerComponent[],
  component: DesignerComponent,
  column: number,
  index?: number
) => {
  const nextComponent = { ...component, column };
  const targets = list.filter((child) => (child.column ?? 1) === column);
  const safeIndex =
    typeof index === "number" && index >= 0 ? index : targets.length;
  if (targets.length === 0) {
    return [...list, nextComponent];
  }
  let insertAt = list.length;
  let count = 0;
  for (let i = 0; i < list.length; i += 1) {
    if ((list[i].column ?? 1) === column) {
      if (count === safeIndex) {
        insertAt = i;
        break;
      }
      count += 1;
      insertAt = i + 1;
    }
  }
  return [...list.slice(0, insertAt), nextComponent, ...list.slice(insertAt)];
};

export const insertComponentAt = (
  components: DesignerComponent[],
  target: ContainerTarget,
  component: DesignerComponent,
  index?: number
): DesignerComponent[] => {
  if (target.kind === "root") {
    return insertIntoList(components, component, index);
  }

  const updateTarget = (item: DesignerComponent): DesignerComponent => {
    if (item.id !== target.componentId) {
      let nextItem = item;
      if (item.children?.length) {
        nextItem = {
          ...nextItem,
          children: item.children.map(updateTarget),
        };
      }
      if (isAccordion(item)) {
        const panels = getPanels(nextItem).map((panel) => ({
          ...panel,
          children: panel.children?.map(updateTarget),
        }));
        nextItem = setPanels(nextItem, panels);
      }
      if (isMultiInstanceStepper(item)) {
        const steps = getSteps(nextItem).map((step) => ({
          ...step,
          children: step.children?.map(updateTarget),
        }));
        nextItem = setSteps(nextItem, steps);
      }
      return nextItem;
    }

    if (target.kind === "children") {
      const children = normalizeChildren(item.children);
      return { ...item, children: insertIntoList(children, component, index) };
    }

    if (target.kind === "accordionPanel") {
      const panels = getPanels(item).map((panel) => {
        if (panel.id !== target.panelId) return panel;
        return {
          ...panel,
          children: insertIntoList(
            normalizeChildren(panel.children),
            component,
            index
          ),
        };
      });
      return setPanels(item, panels);
    }

    if (target.kind === "multiInstanceStep") {
      const steps = getSteps(item).map((step) => {
        if (step.id !== target.stepId) return step;
        return {
          ...step,
          children: insertIntoList(
            normalizeChildren(step.children),
            component,
            index
          ),
        };
      });
      return setSteps(item, steps);
    }

    if (target.kind === "gridColumn") {
      const children = normalizeChildren(item.children);
      return {
        ...item,
        children: insertIntoGrid(children, component, target.column, index),
      };
    }

    return item;
  };

  return components.map(updateTarget);
};

export const moveComponentToTarget = (
  components: DesignerComponent[],
  componentId: string,
  target: ContainerTarget,
  index?: number
) => {
  const extracted = extractComponentById(components, componentId);
  if (!extracted.removed) return components;
  return insertComponentAt(extracted.components, target, extracted.removed, index);
};

export const cloneComponentTree = (
  component: DesignerComponent,
  generateId: () => string
): DesignerComponent => {
  const nextId = generateId();
  const nextComponent: DesignerComponent = {
    ...component,
    id: nextId,
    children: component.children
      ? component.children.map((child) => cloneComponentTree(child, generateId))
      : undefined,
  };

  if (isAccordion(component)) {
    const panels = getPanels(component).map((panel) => ({
      ...panel,
      id: generateId(),
      children: panel.children
        ? panel.children.map((child) => cloneComponentTree(child, generateId))
        : [],
    }));
    nextComponent.properties = {
      ...nextComponent.properties,
      panels,
    };
  }

  if (isMultiInstanceStepper(component)) {
    const steps = getSteps(component).map((step) => ({
      ...step,
      id: generateId(),
      children: step.children
        ? step.children.map((child) => cloneComponentTree(child, generateId))
        : [],
    }));
    nextComponent.properties = {
      ...nextComponent.properties,
      steps,
    };
  }

  return nextComponent;
};
