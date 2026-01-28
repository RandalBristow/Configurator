export const getPaperStyles = (
  properties?: {
    elevation?: number | string;
    variant?: string;
    square?: boolean;
  }
) => {
  const elevationRaw =
    typeof properties?.elevation === "number"
      ? properties.elevation
      : Number(properties?.elevation);
  const elevation = Number.isFinite(elevationRaw)
    ? Math.min(Math.max(Math.round(elevationRaw), 1), 10)
    : 1;
  const variant = properties?.variant === "outlined" ? "outlined" : "elevation";
  const square = Boolean(properties?.square);
  const elevationFactor = (elevation - 1) / 9;
  const offsetY = Math.round(6 + elevationFactor * 16);
  const blur = Math.round(16 + elevationFactor * 34);
  const alpha = (0.06 + elevationFactor * 0.14).toFixed(2);
  const shadow =
    variant === "outlined"
      ? "none"
      : `0 1px 2px rgba(16, 24, 40, 0.08), 0 ${offsetY}px ${blur}px rgba(16, 24, 40, ${alpha})`;
  const border =
    variant === "outlined"
      ? "1px solid var(--card-border)"
      : "1px solid transparent";
  return {
    background: "var(--color-surface)",
    border,
    borderRadius: square ? "0px" : "12px",
    boxShadow: shadow,
  };
};
