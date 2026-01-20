// @ts-nocheck
import React, { useRef, useState, useEffect } from "react";
import { useDesignerStore } from "@/stores/designerStore";
import { ComponentRenderer } from "./ComponentRenderer";
import { componentDefinitions } from "@/data/componentDefinitions";
import "@/index.css";

export function DroppedComponent({ component, isPreview = false }) {
  const {
    selectedComponentId,
    selectComponent,
    moveComponent,
    resizeComponent,
  } = useDesignerStore();
  const isSelected = selectedComponentId === component.id;
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    posX: 0,
    posY: 0,
  });
  const [resizeCorner, setResizeCorner] = useState("");
  const componentRef = useRef(null);
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

  // Mouse down for move
  const handleMouseDown = (e) => {
    if (isPreview) return; // Disable drag in preview
    if (
      e.target !== e.currentTarget &&
      !e.target.classList.contains("component-drag-handle")
    )
      return;
    e.preventDefault();
    e.stopPropagation();
    const surface = document.getElementById("design-canvas");
    if (surface) {
      const rect = surface.getBoundingClientRect();
      setDragStart({
        x: e.clientX - rect.left - component.position.x,
        y: e.clientY - rect.top - component.position.y,
      });
    } else {
      setDragStart({
        x: e.clientX - component.position.x,
        y: e.clientY - component.position.y,
      });
    }
    setIsDragging(true);
    selectComponent(component.id);
    console.log("[DEBUG] handleMouseDown: selectComponent", component.id);
  };

  // Mouse down for resize
  const handleResizeMouseDown = (e, corner) => {
    if (isPreview) return; // Disable resize in preview
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
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: component.size.width,
      height: component.size.height,
      posX: component.position.x,
      posY: component.position.y,
    });
    selectComponent(component.id);
    console.log("[DEBUG] handleResizeMouseDown: selectComponent", component.id);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const surface = document.getElementById("design-canvas");
        if (surface) {
          const rect = surface.getBoundingClientRect();
          const newX = Math.max(0, e.clientX - rect.left - dragStart.x);
          const newY = Math.max(0, e.clientY - rect.top - dragStart.y);
          moveComponent(component.id, { x: newX, y: newY });
          selectComponent(component.id); // Keep selected after move
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
        let minWidth = 40;
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
          newHeight = Math.max(24, resizeStart.height + deltaY);
        } else if (resizeCorner === "nw") {
          newWidth = Math.max(minWidth, resizeStart.width - deltaX);
          newHeight = Math.max(24, resizeStart.height - deltaY);
          newX = resizeStart.posX + (resizeStart.width - newWidth);
          newY = resizeStart.posY + (resizeStart.height - newHeight);
        } else if (resizeCorner === "ne") {
          newWidth = Math.max(minWidth, resizeStart.width + deltaX);
          newHeight = Math.max(24, resizeStart.height - deltaY);
          newY = resizeStart.posY + (resizeStart.height - newHeight);
        } else if (resizeCorner === "sw") {
          newWidth = Math.max(minWidth, resizeStart.width - deltaX);
          newHeight = Math.max(24, resizeStart.height + deltaY);
          newX = resizeStart.posX + (resizeStart.width - newWidth);
        } else if (resizeCorner === "e") {
          newWidth = Math.max(minWidth, resizeStart.width + deltaX);
        } else if (resizeCorner === "w") {
          newWidth = Math.max(minWidth, resizeStart.width - deltaX);
          newX = resizeStart.posX + (resizeStart.width - newWidth);
        } else if (resizeCorner === "n") {
          newHeight = Math.max(24, resizeStart.height - deltaY);
          newY = resizeStart.posY + (resizeStart.height - newHeight);
        } else if (resizeCorner === "s") {
          newHeight = Math.max(24, resizeStart.height + deltaY);
        }
        console.log("Resizing", component.type, component.id, {
          corner: resizeCorner,
          newWidth,
          newHeight,
          newX,
          newY,
        });
        resizeComponent(component.id, { width: newWidth, height: newHeight });
        selectComponent(component.id); // Ensure selection after resize
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
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeCorner("");
      // Ensure the component remains selected after resizing or moving
      selectComponent(component.id);
      // Prevent canvas click from clearing selection after resize
      if (isResizing) {
        window._ignoreNextCanvasClick = true;
      }
      console.log("[DEBUG] handleMouseUp: selectComponent", component.id);
    };
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = isDragging ? "move" : "nw-resize";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
    };
  }, [isDragging, isResizing]); // Only depend on isDragging and isResizing

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
        className={`component-hover rounded${
          isSelected && !isPreview ? " component-selected" : ""
        }${
          isDragging && !isPreview
            ? " component-dragging cursor-move"
            : " cursor-pointer"
        }${component.type === "Switch" ? " switch-component" : ""}`}
        style={{
          position: "absolute",
          left: component.position.x,
          top: component.position.y,
          width:
            component.type === "Switch"
              ? measuredWidth // Use measured width for Switch
              : component.type === "Button"
                ? component.size.width
                : component.size.width,
          height:
            component.type === "Checkbox"
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
          zIndex: isSelected ? 10 : 1,
          overflow: "visible",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          ref={contentRef}
          style={{ flex: 1, minHeight: 0, position: "relative" }}
          onClick={(e) => {
            if (isPreview) return;
            e.stopPropagation();
            selectComponent(component.id);
          }}
        >
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
                component.type === "Switch"
                  ? measuredWidth // Use measured width for Switch
                  : component.size.width,
              height:
                component.type === "Checkbox" ||
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
        </div>
        {!isPreview && isSelected && (
          <>
            <div className="component-selection-box" />
            <div
              className="component-drag-handle absolute cursor-move"
              style={{ top: 8, left: 8, right: 20, bottom: 20, zIndex: 10 }}
            />
            {/* Render resize handles based on resizable directions */}
            {resizable.horizontal && resizable.vertical && (
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
            {resizable.horizontal && !resizable.vertical && (
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
            {!resizable.horizontal && resizable.vertical && (
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

