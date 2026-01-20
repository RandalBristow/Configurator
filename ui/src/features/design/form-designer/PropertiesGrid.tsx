// @ts-nocheck
import React, { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

/**
 * PropertiesGrid
 * @param {Array} properties - [{ label, key, type, value, onChange, options, defaultValue }]
 * @param {string} className - Optional extra className
 */
export function PropertiesGrid({
  properties,
  className = "",
  selectedPropertyKey,
  setSelectedPropertyKey,
}) {
  // Group properties by 'group' property, default to 'General'
  const grouped = properties.reduce((acc, prop) => {
    const group = prop.group || "General";
    if (!acc[group]) acc[group] = [];
    acc[group].push(prop);
    return acc;
  }, {});
  const [colWidth, setColWidth] = useState(140); // px for property name column
  const [isDragging, setIsDragging] = useState(false);
  const dragging = useRef(false);
  const wrapperRef = useRef(null);
  const tableRef = useRef(null); // NEW: ref for the table
  const [openGroups, setOpenGroups] = useState(Object.keys(grouped));

  const handleMouseDown = (e) => {
    dragging.current = true;
    setIsDragging(true);
    document.body.style.cursor = "col-resize";
  };

  React.useEffect(() => {
    const handleMouseMove = (e) => {
      if (dragging.current && wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        const newWidth = Math.max(60, Math.min(e.clientX - rect.left, 300));
        setColWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      dragging.current = false;
      setIsDragging(false);
      document.body.style.cursor = "";
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`properties-grid ${className}`}
      style={{ userSelect: isDragging ? "none" : undefined }}
    >
      {/* Scrollable property grid area */}
      <div className="properties-grid__scroll">
        <table
          ref={tableRef}
          className="properties-grid__table"
          style={{ tableLayout: "fixed" }}
        >
          <colgroup>
            <col style={{ width: colWidth, minWidth: 60, maxWidth: 300 }} />
            <col />
          </colgroup>
          <thead>
            <tr className="properties-grid__header">
              <th className="properties-grid__header-cell">
                Property
              </th>
              <th className="properties-grid__header-cell">
                Value
              </th>
            </tr>
          </thead>
        </table>
        <Accordion
          type="multiple"
          value={openGroups}
          onValueChange={setOpenGroups}
          className="properties-grid__accordion"
        >
          {Object.entries(grouped).map(([group, groupProps]) => (
            <AccordionItem
              key={group}
              value={group}
              className="properties-grid__group"
            >
              <AccordionTrigger
                className="properties-grid__group-trigger"
              >
                {group}
              </AccordionTrigger>
              <AccordionContent className="properties-grid__group-content">
                <table
                  className="properties-grid__table"
                  style={{ tableLayout: "fixed" }}
                >
                  <colgroup>
                    <col
                      style={{ width: colWidth, minWidth: 60, maxWidth: 300 }}
                    />
                    <col />
                  </colgroup>
                  <tbody>
                    {groupProps.map((property) => (
                      <tr
                        key={property.key}
                        className={`properties-grid__row${
                          selectedPropertyKey === property.key
                            ? " is-selected"
                            : ""
                        }`}
                        onClick={() => setSelectedPropertyKey(property.key)}
                      >
                        <td
                          className="properties-grid__cell properties-grid__cell--label"
                        >
                          {property.label}
                        </td>
                        <td
                          className="properties-grid__cell properties-grid__cell--value"
                        >
                          {property.type === "number" ? (
                            <Input
                              type="number"
                              value={property.value}
                              onChange={(e) =>
                                property.onChange(Number(e.target.value))
                              }
                              className="properties-grid__input"
                              disabled={property.disabled}
                            />
                          ) : property.type === "boolean" ? (
                            <Select
                              value={
                                property.value === true
                                  ? "true"
                                  : property.value === false
                                    ? "false"
                                    : "false"
                              }
                              onValueChange={(v) =>
                                property.onChange(v === "true")
                              }
                            >
                              <SelectTrigger
                                className="properties-grid__select"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">True</SelectItem>
                                <SelectItem value="false">False</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : property.type === "select" ? (
                            <Select
                              value={property.value || property.defaultValue}
                              onValueChange={property.onChange}
                            >
                              <SelectTrigger
                                className="properties-grid__select"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {property.options?.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : property.type === "color" ? (
                            <Input
                              type="color"
                              value={property.value || property.defaultValue}
                              onChange={(e) =>
                                property.onChange(e.target.value)
                              }
                              className="properties-grid__color"
                            />
                          ) : (
                            <Input
                              value={property.value || ""}
                              onChange={(e) =>
                                property.onChange(e.target.value)
                              }
                              className="properties-grid__input"
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      {/* Resizer bar styled as a classic resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`properties-grid__resizer${isDragging ? " is-dragging" : ""}`}
        style={{
          left: colWidth - 3,
          top: tableRef.current ? tableRef.current.offsetTop : 0,
          height: tableRef.current
            ? tableRef.current.tHead?.rows[0]?.offsetHeight || 32
            : 32,
        }}
        title="Drag to resize property column"
      >
        {/* Dots for a classic handle look */}
        <div className="properties-grid__resizer-dots">
          <div className="properties-grid__resizer-dot" />
          <div className="properties-grid__resizer-dot" />
          <div className="properties-grid__resizer-dot" />
        </div>
      </div>
    </div>
  );
}

