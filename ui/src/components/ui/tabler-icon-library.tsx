import React from "react";
import { cn } from "@/lib/utils";
import tablerFilledNodes from "../../../node_modules/@tabler/icons/tabler-nodes-filled.json";
import tablerOutlineNodes from "../../../node_modules/@tabler/icons/tabler-nodes-outline.json";

export type TablerIconVariant = "outlined" | "filled";

export const TABLER_ICON_VARIANTS: Array<{
  value: TablerIconVariant;
  label: string;
}> = [
  { value: "outlined", label: "Outlined" },
  { value: "filled", label: "Filled" },
];

type TablerIconNode = [string, Record<string, unknown>];

const OUTLINE_NAMES = Object.freeze(Object.keys(tablerOutlineNodes).sort());
const FILLED_NAMES = Object.freeze(Object.keys(tablerFilledNodes).sort());

export const getTablerIconNamesForVariant = (variant?: string | null) => {
  if (variant === "filled") return FILLED_NAMES as string[];
  return OUTLINE_NAMES as string[];
};

export const normalizeTablerIconName = (value?: string | null) => {
  if (!value) return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
};

const outlineAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const filledAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  stroke: "none",
};

type TablerIconProps = {
  name?: string | null;
  variant?: string | null;
  size?: number;
  stroke?: number;
  className?: string;
  title?: string;
};

export function TablerIcon({
  name,
  variant = "outlined",
  size = 24,
  stroke = 2,
  className,
  title,
}: TablerIconProps) {
  const safeName = normalizeTablerIconName(name);
  if (!safeName) return null;

  const isFilled = variant === "filled";
  const lookupName = safeName;
  const nodes = (isFilled ? tablerFilledNodes : tablerOutlineNodes) as unknown as Record<
    string,
    TablerIconNode[]
  >;
  const iconNode = nodes[lookupName];

  if (!iconNode) return null;

  return (
    <svg
      className={cn("tabler-icon", className)}
      width={size}
      height={size}
      aria-hidden={title ? undefined : "true"}
      role={title ? "img" : "presentation"}
      {...(isFilled
        ? { ...filledAttributes, fill: "currentColor" }
        : {
            ...outlineAttributes,
            stroke: "currentColor",
            strokeWidth: stroke,
          })}
    >
      {title ? <title>{title}</title> : null}
      {iconNode.map(([tag, attrs], index) =>
        React.createElement(tag, {
          ...(attrs as Record<string, unknown>),
          key:
            (attrs && typeof (attrs as any).key === "string"
              ? ((attrs as any).key as string)
              : `${lookupName}-${index}`),
        })
      )}
    </svg>
  );
}
