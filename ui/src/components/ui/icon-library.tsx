import { cn } from "@/lib/utils";
import materialIconNames from "@/data/material-icons.json";

export type MaterialIconVariant =
  | "filled"
  | "outlined"
  | "rounded"
  | "sharp"
  | "two-tone";

export const MATERIAL_ICON_VARIANTS: Array<{
  value: MaterialIconVariant;
  label: string;
}> = [
  { value: "filled", label: "Filled" },
  { value: "outlined", label: "Outlined" },
  { value: "rounded", label: "Rounded" },
  { value: "sharp", label: "Sharp" },
  { value: "two-tone", label: "Two Tone" },
];

const variantClassMap: Record<MaterialIconVariant, string> = {
  filled: "material-icon--filled",
  outlined: "material-icon--outlined",
  rounded: "material-icon--rounded",
  sharp: "material-icon--sharp",
  "two-tone": "material-icon--two-tone",
};

export const getMaterialIconNames = () => materialIconNames as string[];

export const getMaterialIconNamesForVariant = (_variant?: string | null) =>
  // Material Icons variants largely share the same name list. If we later
  // switch to an index that includes per-variant availability, filter here.
  materialIconNames as string[];

export const normalizeIconName = (value?: string | null) => {
  if (!value) return "";
  return value.trim().replace(/\s+/g, "_").toLowerCase();
};

export const getVariantClassName = (variant?: string | null) => {
  if (!variant) return variantClassMap.outlined;
  if (variant in variantClassMap) {
    return variantClassMap[variant as MaterialIconVariant];
  }
  return variantClassMap.outlined;
};

export const renderMaterialIcon = (
  name?: string | null,
  variant?: string | null,
  size?: number,
  className?: string
) => {
  const safeName = normalizeIconName(name);
  if (!safeName) return null;
  return (
    <span
      className={cn("material-icon", getVariantClassName(variant), className)}
      style={size ? { fontSize: `${size}px` } : undefined}
      aria-hidden="true"
    >
      {safeName}
    </span>
  );
};
