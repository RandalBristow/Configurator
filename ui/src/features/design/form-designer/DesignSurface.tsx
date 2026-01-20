// @ts-nocheck
import { useDroppable } from "@dnd-kit/core";
import { useDesignerStore } from "@/stores/designerStore";
import { DesignCanvas } from "./DesignCanvas";
import { DroppedComponent } from "./DroppedComponent";

export function DesignSurface() {
  const { components, showGrid, zoom, canvasSize, selectedComponentId } =
    useDesignerStore();
  const { setNodeRef, isOver, over } = useDroppable({ id: "design-canvas" });

  const shellClassName = [
    "form-designer-canvas-shell",
    selectedComponentId ? "is-selected" : null,
  ]
    .filter(Boolean)
    .join(" ");

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
            {components.map((component) => (
              <DroppedComponent
                key={component.id}
                component={component}
                zoom={zoom}
              />
            ))}
          </DesignCanvas>
        </div>
      </div>
    </div>
  );
}

