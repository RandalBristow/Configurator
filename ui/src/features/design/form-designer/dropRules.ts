import type { ContainerTarget } from "@/stores/designerTree";
import type { DesignerComponent } from "@/types/designer";

type ComponentLookup = (id: string) => DesignerComponent | undefined;

export const canDropComponentInTarget = (
  componentType: string,
  target: ContainerTarget | null,
  getComponentById: ComponentLookup
) => {
  if (!target) return false;
  if (componentType === "Subsection") {
    if (target.kind === "root") return false;
    const parentType = getComponentById(target.componentId)?.type;
    return parentType === "Section";
  }
  return true;
};
