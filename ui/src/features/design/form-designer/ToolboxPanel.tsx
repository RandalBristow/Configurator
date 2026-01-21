// @ts-nocheck
import React, { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { componentDefinitions } from "@/data/componentDefinitions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  LucideText,
  LucideSquare,
  LucideCheckSquare,
  LucideChevronDown,
  LucideToggleRight,
  LucideHeading1,
  LucideTag,
  LucideMinus,
  LucideRectangleHorizontal,
  LucideRectangleVertical,
  LucideChevronLeft,
  LucideChevronRight,
  LucideLayoutPanelTop,
  LucideLayoutPanelLeft,
  LucideLayoutGrid,
  LucideRepeat,
  LucideLayoutTemplate,
  LucideListOrdered,
  LucideListChecks,
  LucideLayoutList,
} from "lucide-react";
import { Input } from "@/components/ui/input";

const iconMap = {
  TextFields: LucideText,
  SmartButton: LucideSquare,
  CheckBox: LucideCheckSquare,
  ArrowDropDown: LucideChevronDown,
  ToggleOn: LucideToggleRight,
  Title: LucideHeading1,
  Label: LucideTag,
  HorizontalRule: LucideMinus,
  CropLandscape: LucideRectangleHorizontal,
  Rectangle: LucideRectangleVertical,
  ViewAgenda: LucideLayoutList,
  LayoutPanelTop: LucideLayoutPanelTop,
  LayoutPanelLeft: LucideLayoutPanelLeft,
  LayoutGrid: LucideLayoutGrid,
  Repeat: LucideRepeat,
  LayoutTemplate: LucideLayoutTemplate,
  ListOrdered: LucideListOrdered,
  ListChecks: LucideListChecks,
};

// Map raw categories to human-friendly group names
const CATEGORY_LABELS = {
  Input: "Input Controls",
  Display: "Display Elements",
  Layout: "Layout Containers",
  // Add more mappings as needed
};

function DraggableComponent({ type, label, icon, compact }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `component-${type}`,
      data: {
        componentType: type,
        isNewComponent: true,
      },
    });
  const IconComponent = iconMap[icon];
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  const className = [
    "toolbox-item",
    compact ? "toolbox-item--compact" : null,
    isDragging ? "is-dragging" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, marginLeft: compact ? 0 : 10 }}
      {...listeners}
      {...attributes}
      className={className}
      title={label}
    >
      <div className="toolbox-item__icon">
        {IconComponent && <IconComponent className="toolbox-item__icon-svg" />}
      </div>
      {!compact && <span className="toolbox-item__label">{label}</span>}
    </div>
  );
}

type ToolboxPanelProps = {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

export default function ToolboxPanel({ collapsed, onToggleCollapse }: ToolboxPanelProps) {
  const [search, setSearch] = useState("");
  const [openGroups, setOpenGroups] = useState([]);
  const isCollapsed = Boolean(collapsed);

  // Group components by category
  const componentsByCategory = componentDefinitions.reduce((acc, comp) => {
    const group = CATEGORY_LABELS[comp.category] || comp.category;
    if (!acc[group]) acc[group] = [];
    acc[group].push(comp);
    return acc;
  }, {});
  const categories = Object.keys(componentsByCategory);

  // Filter and group
  const filteredCategories = categories
    .map((category) => ({
      name: category,
      items: componentsByCategory[category].filter(
        (item) =>
          item.label.toLowerCase().includes(search.toLowerCase()) ||
          item.type.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((group) => group.items.length > 0);

  // Open all groups by default on first render
  React.useEffect(() => {
    setOpenGroups(categories);
    // eslint-disable-next-line
  }, []);

  const handleGroupToggle = (group) => {
    setOpenGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  const collapseIcon = isCollapsed ? <LucideChevronRight size={16} /> : <LucideChevronLeft size={16} />;

  return (
    <div
      className={`toolbox-panel${isCollapsed ? " toolbox-panel--collapsed" : ""}`}
    >
      <div className="toolbox-panel__header">
        {!isCollapsed && <div className="toolbox-panel__title">Toolbox</div>}
        <button
          type="button"
          className="toolbox-panel__collapse-btn"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Expand toolbox" : "Collapse toolbox"}
          title={isCollapsed ? "Expand toolbox" : "Collapse toolbox"}
        >
          {collapseIcon}
        </button>
      </div>

      {isCollapsed ? (
        <ScrollArea className="flex-1">
          <div className="toolbox-panel__compact-list">
            {componentDefinitions.map((item) => (
              <DraggableComponent
                key={item.type}
                type={item.type}
                label={item.label}
                icon={item.icon}
                compact
              />
            ))}
          </div>
        </ScrollArea>
      ) : (
        <>
          <div className="toolbox-panel__search">
            <Input
              className="table-input toolbox-panel__search-input"
              placeholder="Search Toolbox..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <ScrollArea className="flex-1">
            <Accordion type="multiple" defaultValue={categories} className="w-full">
              {filteredCategories.map((group) => (
                <AccordionItem key={group.name} value={group.name}>
                  <AccordionTrigger
                    className="toolbox-panel__group-trigger"
                    onClick={() => handleGroupToggle(group.name)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex-1 truncate">{group.name}</span>
                      <Badge
                        variant="secondary"
                        className="toolbox-panel__badge"
                      >
                        {group.items.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="toolbox-panel__group-list">
                      {group.items.map((item) => (
                        <DraggableComponent
                          key={item.type}
                          type={item.type}
                          label={item.label}
                          icon={item.icon}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </>
      )}
    </div>
  );
}

