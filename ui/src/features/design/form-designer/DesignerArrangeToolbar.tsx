// @ts-nocheck
import {
  AlignCenter,
  AlignCenterVertical,
  AlignHorizontalDistributeCenter,
  AlignHorizontalSpaceBetween,
  AlignStartHorizontal,
  AlignEndHorizontal,
  AlignHorizontalJustifyCenter,
  AlignLeft,
  AlignRight,
  AlignStartVertical,
  AlignEndVertical,
  AlignVerticalDistributeCenter,
  AlignVerticalSpaceBetween,
  ArrowDown,
  ArrowUp,
  BringToFront,
  Eye,
  EyeOff,
  Grid3x3,
  Lock,
  Magnet,
  Maximize2,
  SendToBack,
  StretchHorizontal,
  StretchVertical,
  Unlock,
} from "lucide-react";
import { useDesignerStore } from "@/stores/designerStore";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DesignerArrangeToolbar({ className }:{ className?: string }) {
  const {
    selectedComponentIds,
    showGrid,
    snapToGrid,
    gridSize,
    setShowGrid,
    setSnapToGrid,
    setGridSize,
    alignSelectedComponents,
    matchSelectedSizes,
    distributeSelectedComponents,
    equalizeSelectedSpacing,
    reorderSelectedComponents,
    toggleLockSelected,
    toggleHiddenSelected,
    getComponentById,
  } = useDesignerStore();

  const selectedComponents = selectedComponentIds
    .map((id) => getComponentById(id))
    .filter(Boolean);
  const selectedCount = selectedComponentIds.length;
  const canMultiArrange = selectedCount >= 2;
  const canDistribute = selectedCount >= 3;
  const anyUnlocked = selectedComponents.some(
    (component) => component.properties?.locked !== true
  );
  const anyVisible = selectedComponents.some(
    (component) => component.properties?.hidden !== true
  );

  const iconSize = 18;

  return (
    <div
      className={cn("designer-surface-toolbar", className)}
      role="toolbar"
      aria-label="Design surface toolbar"
    >
      {/* Align */}
      <button
        type="button"
        className="icon-btn"
        disabled={!canMultiArrange}
        onClick={() => alignSelectedComponents("left")}
        title="Align Left"
      >
        <AlignStartVertical size={iconSize} />
      </button>
      <button
        type="button"
        className="icon-btn"
        disabled={!canMultiArrange}
        onClick={() => alignSelectedComponents("center")}
        title="Align Center"
      >
        <AlignCenterVertical size={iconSize} />
      </button>
      <button
        type="button"
        className="icon-btn"
        disabled={!canMultiArrange}
        onClick={() => alignSelectedComponents("right")}
        title="Align Right"
      >
        <AlignEndVertical size={iconSize} />
      </button>
      <button
        type="button"
        className="icon-btn"
        disabled={!canMultiArrange}
        onClick={() => alignSelectedComponents("top")}
        title="Align Top"
      >
        <AlignStartHorizontal size={iconSize} />
      </button>
      <button
        type="button"
        className="icon-btn"
        disabled={!canMultiArrange}
        onClick={() => alignSelectedComponents("middle")}
        title="Align Middle"
      >
        <AlignHorizontalJustifyCenter size={iconSize} />
      </button>
      <button
        type="button"
        className="icon-btn"
        disabled={!canMultiArrange}
        onClick={() => alignSelectedComponents("bottom")}
        title="Align Bottom"
      >
        <AlignEndHorizontal size={iconSize} />
      </button>

      <span className="toolbar-divider" aria-hidden="true" />

      {/* Match Size */}
      <button
        type="button"
        className="icon-btn"
        disabled={!canMultiArrange}
        onClick={() => matchSelectedSizes("width")}
        title="Same Width (use last selected)"
      >
        <StretchHorizontal size={iconSize} />
      </button>
      <button
        type="button"
        className="icon-btn"
        disabled={!canMultiArrange}
        onClick={() => matchSelectedSizes("height")}
        title="Same Height (use last selected)"
      >
        <StretchVertical size={iconSize} />
      </button>
      <button
        type="button"
        className="icon-btn"
        disabled={!canMultiArrange}
        onClick={() => matchSelectedSizes("size")}
        title="Same Size (use last selected)"
      >
        <Maximize2 size={iconSize} />
      </button>

      <span className="toolbar-divider" aria-hidden="true" />

      {/* Distribute */}
      <button
        type="button"
        className="icon-btn"
        disabled={!canDistribute}
        onClick={() => distributeSelectedComponents("horizontal")}
        title="Distribute Horizontally"
      >
        <AlignHorizontalDistributeCenter size={iconSize} />
      </button>
      <button
        type="button"
        className="icon-btn"
        disabled={!canDistribute}
        onClick={() => distributeSelectedComponents("vertical")}
        title="Distribute Vertically"
      >
        <AlignVerticalDistributeCenter size={iconSize} />
      </button>
      <button
        type="button"
        className="icon-btn"
        disabled={!canDistribute}
        onClick={() => equalizeSelectedSpacing("horizontal")}
        title="Make Horizontal Spacing Equal"
      >
        <AlignHorizontalSpaceBetween size={iconSize} />
      </button>
      <button
        type="button"
        className="icon-btn"
        disabled={!canDistribute}
        onClick={() => equalizeSelectedSpacing("vertical")}
        title="Make Vertical Spacing Equal"
      >
        <AlignVerticalSpaceBetween size={iconSize} />
      </button>

      <span className="toolbar-divider" aria-hidden="true" />

      {/* Z-order */}
      <button
        type="button"
        className="icon-btn"
        disabled={selectedCount === 0}
        onClick={() => reorderSelectedComponents("sendToBack")}
        title="Send to Back"
      >
        <SendToBack size={iconSize} />
      </button>
      <button
        type="button"
        className="icon-btn"
        disabled={selectedCount === 0}
        onClick={() => reorderSelectedComponents("sendBackward")}
        title="Send Backward"
      >
        <ArrowDown size={iconSize} />
      </button>
      <button
        type="button"
        className="icon-btn"
        disabled={selectedCount === 0}
        onClick={() => reorderSelectedComponents("bringForward")}
        title="Bring Forward"
      >
        <ArrowUp size={iconSize} />
      </button>
      <button
        type="button"
        className="icon-btn"
        disabled={selectedCount === 0}
        onClick={() => reorderSelectedComponents("bringToFront")}
        title="Bring to Front"
      >
        <BringToFront size={iconSize} />
      </button>

      <span className="toolbar-divider" aria-hidden="true" />

      {/* Lock / Hide */}
      <button
        type="button"
        className="icon-btn"
        disabled={selectedCount === 0}
        onClick={toggleLockSelected}
        title={anyUnlocked ? "Lock" : "Unlock"}
      >
        {anyUnlocked ? <Lock size={iconSize} /> : <Unlock size={iconSize} />}
      </button>
      <button
        type="button"
        className="icon-btn"
        disabled={selectedCount === 0}
        onClick={toggleHiddenSelected}
        title={anyVisible ? "Hide" : "Show"}
      >
        {anyVisible ? <EyeOff size={iconSize} /> : <Eye size={iconSize} />}
      </button>

      <span className="toolbar-divider" aria-hidden="true" />

      {/* View */}
      <button
        type="button"
        className={`icon-btn${showGrid ? " is-active" : ""}`}
        onClick={() => setShowGrid(!showGrid)}
        title={showGrid ? "Hide Grid" : "Show Grid"}
      >
        <Grid3x3 size={iconSize} />
      </button>
      <button
        type="button"
        className={`icon-btn${snapToGrid ? " is-active" : ""}`}
        onClick={() => setSnapToGrid(!snapToGrid)}
        title={snapToGrid ? "Disable Snap to Grid" : "Enable Snap to Grid"}
      >
        <Magnet size={iconSize} />
      </button>
      <Select
        value={String(gridSize)}
        onValueChange={(value) => setGridSize(Number(value))}
      >
        <SelectTrigger className="designer-toolbar__select" title="Grid size">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="designer-toolbar__select-content">
          {[4, 8, 10, 12, 16, 24, 32].map((size) => (
            <SelectItem
              key={size}
              value={String(size)}
              className="designer-toolbar__select-item"
            >
              {size}px
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
