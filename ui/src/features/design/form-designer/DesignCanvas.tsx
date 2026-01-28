// @ts-nocheck
import React from "react";
import { useDesignerStore } from "@/stores/designerStore";
import { cn } from "@/lib/utils";

export const DesignCanvas = React.forwardRef(
  ({ children, isOver, previewMode = false }, ref) => {
    const {
      showGrid,
      gridSize,
      clearSelection,
      components,
      setSelectedComponents,
      getComponentById,
    } = useDesignerStore();
    const shouldShowGrid = !previewMode && showGrid;
    const lassoRef = React.useRef(null);
    const canvasRef = React.useRef(null);
    const [selectionBox, setSelectionBox] = React.useState(null);

    const normalizeEventTarget = (target) => {
      if (target instanceof Element) return target;
      if (target && typeof target === "object" && "parentElement" in target) {
        return target.parentElement;
      }
      return null;
    };

    const isInsideComponent = (target) => {
      const element = normalizeEventTarget(target);
      return Boolean(element && element.closest("[data-component-id]"));
    };

    const isLassoEligibleTarget = (target) => {
      const element = normalizeEventTarget(target);
      if (!element) return false;

      // Never start lasso from resize corners / explicit drag handles.
      if (element.closest(".resize-corner, .component-drag-handle")) {
        return false;
      }

      const componentEl = element.closest("[data-component-id]");
      if (!componentEl) return true; // empty canvas

      const componentId = componentEl.getAttribute("data-component-id");
      if (!componentId) return false;

      // Allow lasso on container components so you can box-select inside them.
      const component = getComponentById?.(componentId);
      const containerTypes = new Set([
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
      ]);
      return Boolean(component && containerTypes.has(component.type));
    };

    const handleCanvasClick = (e) => {
      if (previewMode) return;
      // Ignore the next click if flagged (prevents selection loss after resize)
      if (window._ignoreNextCanvasClick) {
        window._ignoreNextCanvasClick = false;
        return;
      }
      // Clear selection unless clicking on a component
      const isComponent = isInsideComponent(e.target);
      if (!isComponent) {
        clearSelection();
      }
    };

    React.useEffect(() => {
      if (previewMode) return;
      const handlePointerDown = (event) => {
        if (event.button !== 0) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (!(event.target instanceof Node)) return;
        if (!canvas.contains(event.target)) return;
        if (!isLassoEligibleTarget(event.target)) return;
        if (lassoRef.current) return;

        const canvasRect = canvas.getBoundingClientRect();
        const startX = event.clientX - canvasRect.left;
        const startY = event.clientY - canvasRect.top;
        const mode = event.shiftKey
          ? "add"
          : event.metaKey || event.ctrlKey
            ? "toggle"
            : "replace";

        lassoRef.current = {
          x: startX,
          y: startY,
          rect: canvasRect,
          mode,
          pointerId: event.pointerId ?? null,
          started: false,
        };
        setSelectionBox(null);
      };
      // Capture-phase so we still see the event even if something stops propagation later.
      window.addEventListener("pointerdown", handlePointerDown, true);
      return () => {
        window.removeEventListener("pointerdown", handlePointerDown, true);
      };
    }, [previewMode, clearSelection, getComponentById, setSelectedComponents]);

    React.useEffect(() => {
      const handlePointerMove = (e) => {
        const lasso = lassoRef.current;
        if (!lasso) return;
        if (lasso.pointerId !== null && e.pointerId !== lasso.pointerId) {
          return;
        }

        const currentX = e.clientX - lasso.rect.left;
        const currentY = e.clientY - lasso.rect.top;
        const width = Math.abs(currentX - lasso.x);
        const height = Math.abs(currentY - lasso.y);

        // Don't start drawing/selecting until the user actually drags.
        if (!lasso.started && Math.max(width, height) < 3) {
          return;
        }
        if (!lasso.started) {
          lasso.started = true;
          if (lasso.mode === "replace") {
            clearSelection();
          }
        }

        setSelectionBox({
          x: Math.min(lasso.x, currentX),
          y: Math.min(lasso.y, currentY),
          width: Math.max(1, width),
          height: Math.max(1, height),
        });
      };
      const handlePointerUp = (e) => {
        const lasso = lassoRef.current;
        if (!lasso) {
          setSelectionBox(null);
          return;
        }
        if (lasso.pointerId !== null && e.pointerId !== lasso.pointerId) {
          return;
        }
        lassoRef.current = null;

        if (!lasso.started) {
          setSelectionBox(null);
          return;
        }

        const currentX = e.clientX - lasso.rect.left;
        const currentY = e.clientY - lasso.rect.top;
        const width = Math.abs(currentX - lasso.x);
        const height = Math.abs(currentY - lasso.y);
        setSelectionBox(null);
        if (Math.max(width, height) < 4) {
          return;
        }
        const left = lasso.rect.left + Math.min(lasso.x, currentX);
        const top = lasso.rect.top + Math.min(lasso.y, currentY);
        const right = left + width;
        const bottom = top + height;
        const elements = Array.from(
          document.querySelectorAll("[data-component-id].component-hover")
        );
        const ids = [];
        const seen = new Set();
        elements.forEach((element) => {
          if (!(element instanceof HTMLElement)) return;
          const id = element.dataset.componentId;
          if (!id || seen.has(id)) return;
          seen.add(id);
          const rect = element.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) return;
          const intersects =
            rect.right >= left &&
            rect.left <= right &&
            rect.bottom >= top &&
            rect.top <= bottom;
          if (intersects) {
            ids.push(id);
          }
        });
        const currentSelection = useDesignerStore.getState()
          .selectedComponentIds;
        if (lasso.mode === "toggle") {
          const next = [...currentSelection];
          ids.forEach((id) => {
            const index = next.indexOf(id);
            if (index >= 0) {
              next.splice(index, 1);
            } else {
              next.push(id);
            }
          });
          setSelectedComponents(next, next[next.length - 1] ?? null);
        } else if (lasso.mode === "add") {
          const next = Array.from(new Set([...currentSelection, ...ids]));
          setSelectedComponents(next, ids[ids.length - 1] ?? null);
        } else {
          setSelectedComponents(ids, ids[ids.length - 1] ?? null);
        }
        window._ignoreNextCanvasClick = true;
      };
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);
      };
    }, [clearSelection, setSelectedComponents]);

    React.useEffect(() => {
      // Expose components for debug overlay
      window.__DEBUG_COMPONENTS__ = components;
    }, [components]);

    return (
      <div
        ref={(node) => {
          canvasRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={cn(
          "form-designer-canvas",
          !previewMode && isOver && "drop-zone-active"
        )}
        onContextMenu={(e) => {
          if (previewMode) return;
          // Keep the designer feeling like a native app; Shift+RightClick is an escape hatch.
          if (e.shiftKey) return;
          e.preventDefault();
        }}
        style={{
          backgroundColor: "var(--color-surface-muted)",
          ...(shouldShowGrid
            ? (() => {
                // Theme-consistent, visible grid (minor + major lines).
                const minor = "rgba(148, 163, 184, 0.18)";
                const major = "rgba(47, 111, 237, 0.16)";
                return {
                  backgroundImage: `
                    linear-gradient(to right, ${minor} 1px, transparent 1px),
                    linear-gradient(to bottom, ${minor} 1px, transparent 1px),
                    linear-gradient(to right, ${major} 1px, transparent 1px),
                    linear-gradient(to bottom, ${major} 1px, transparent 1px)
                  `,
                  backgroundSize: `
                    ${gridSize}px ${gridSize}px,
                    ${gridSize}px ${gridSize}px,
                    ${gridSize * 5}px ${gridSize * 5}px,
                    ${gridSize * 5}px ${gridSize * 5}px
                  `,
                };
              })()
            : null),
        }}
        onClickCapture={previewMode ? undefined : handleCanvasClick}
      >
        {/* Drop zone indicator */}
        {!previewMode && isOver && (
          <div className="form-designer-dropzone">
            <div className="form-designer-dropzone__label">
              Drop component here
            </div>
          </div>
        )}
        {/* Components */}
        <div className="relative w-full h-full">{children}</div>
        {!previewMode && selectionBox ? (
          <div
            className="designer-selection-rect"
            style={{
              left: selectionBox.x,
              top: selectionBox.y,
              width: selectionBox.width,
              height: selectionBox.height,
            }}
          />
        ) : null}
        {/* DEBUG: Show current components as JSON for troubleshooting */}
        {/* REMOVE THIS DEBUG OVERLAY WHEN NOT NEEDED */}
        {/* <div style={{position: 'absolute', bottom: 0, left: 0, background: 'rgba(255,255,255,0.8)', color: 'black', fontSize: 12, zIndex: 9999, pointerEvents: 'none', maxWidth: 400, maxHeight: 200, overflow: 'auto'}}>
          <pre>{JSON.stringify(window.__DEBUG_COMPONENTS__ || [], null, 2)}</pre>
        </div> */}
        {/* Rulers removed */}
      </div>
    );
  }
);

DesignCanvas.displayName = "DesignCanvas";

