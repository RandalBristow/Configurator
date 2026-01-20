// @ts-nocheck
import React from "react";
import { useDesignerStore } from "@/stores/designerStore";
import { cn } from "@/lib/utils";

export const DesignCanvas = React.forwardRef(({ children, isOver }, ref) => {
  const { showGrid, gridSize, clearSelection, components } = useDesignerStore();

  const handleCanvasClick = (e) => {
    // Ignore the next click if flagged (prevents selection loss after resize)
    if (window._ignoreNextCanvasClick) {
      window._ignoreNextCanvasClick = false;
      return;
    }
    // Clear selection unless clicking on a component
    const target = e.target;
    const isComponent = target.closest("[data-component-id]");
    if (!isComponent) {
      clearSelection();
    }
  };

  React.useEffect(() => {
    // Expose components for debug overlay
    window.__DEBUG_COMPONENTS__ = components;
  }, [components]);

  return (
    <div
      id="design-canvas"
      ref={ref}
      className={cn(
        "form-designer-canvas",
        showGrid && "designer-grid-major",
        isOver && "drop-zone-active"
      )}
      style={{
        backgroundColor: "var(--color-surface-muted)",
        backgroundSize: showGrid ? `${gridSize}px ${gridSize}px` : undefined,
      }}
      onClick={handleCanvasClick}
    >
      {/* Grid overlay for major lines */}
      {showGrid && (
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--color-border) 1px, transparent 1px),
              linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)
            `,
            backgroundSize: `${gridSize * 5}px ${gridSize * 5}px`,
          }}
        />
      )}
      {/* Drop zone indicator */}
      {isOver && (
        <div className="form-designer-dropzone">
          <div className="form-designer-dropzone__label">
            Drop component here
          </div>
        </div>
      )}
      {/* Components */}
      <div className="relative w-full h-full">{children}</div>
      {/* DEBUG: Show current components as JSON for troubleshooting */}
      {/* REMOVE THIS DEBUG OVERLAY WHEN NOT NEEDED */}
      {/* <div style={{position: 'absolute', bottom: 0, left: 0, background: 'rgba(255,255,255,0.8)', color: 'black', fontSize: 12, zIndex: 9999, pointerEvents: 'none', maxWidth: 400, maxHeight: 200, overflow: 'auto'}}>
        <pre>{JSON.stringify(window.__DEBUG_COMPONENTS__ || [], null, 2)}</pre>
      </div> */}
      {/* Rulers removed */}
    </div>
  );
});

DesignCanvas.displayName = "DesignCanvas";

