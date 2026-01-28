// @ts-nocheck
import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { IconPicker } from "@/components/ui/icon-picker";
import { SegmentedPill } from "@/components/ui/segmented-pill";

const VARIANT_OPTIONS = [
  { label: "Solid", value: "solid" },
  { label: "Outline", value: "outline" },
  { label: "Ghost", value: "ghost" },
  { label: "Link", value: "link" },
];

const COLOR_SCHEME_OPTIONS = [
  { label: "Gray", value: "gray" },
  { label: "Red", value: "red" },
  { label: "Orange", value: "orange" },
  { label: "Yellow", value: "yellow" },
  { label: "Green", value: "green" },
  { label: "Teal", value: "teal" },
  { label: "Blue", value: "blue" },
  { label: "Cyan", value: "cyan" },
  { label: "Purple", value: "purple" },
  { label: "Pink", value: "pink" },
  { label: "LinkedIn", value: "linkedin" },
  { label: "Facebook", value: "facebook" },
  { label: "Messenger", value: "messenger" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Twitter", value: "twitter" },
];

const SIZE_OPTIONS = [
  { label: "Small", value: "sm" },
  { label: "Medium", value: "md" },
  { label: "Large", value: "lg" },
];

const DEFAULT_SELECT_VALUE = "__default__";

const FONT_SIZE_OPTIONS = [
  { label: "Default", value: DEFAULT_SELECT_VALUE },
  { label: "XS", value: "xs" },
  { label: "SM", value: "sm" },
  { label: "MD", value: "md" },
  { label: "LG", value: "lg" },
  { label: "XL", value: "xl" },
  { label: "2XL", value: "2xl" },
];

const FONT_WEIGHT_OPTIONS = [
  { label: "Default", value: DEFAULT_SELECT_VALUE },
  { label: "Normal", value: "normal" },
  { label: "Medium", value: "medium" },
  { label: "Semibold", value: "semibold" },
  { label: "Bold", value: "bold" },
];

const TEXT_TRANSFORM_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Uppercase", value: "uppercase" },
  { label: "Lowercase", value: "lowercase" },
  { label: "Capitalize", value: "capitalize" },
];

const SPINNER_PLACEMENT_OPTIONS = [
  { label: "Start", value: "start" },
  { label: "End", value: "end" },
];

const ICON_POSITION_OPTIONS = [
  { label: "Left", value: "start" },
  { label: "Right", value: "end" },
];

const ICON_STROKE_OPTIONS = [
  { label: "1", value: "1" },
  { label: "1.5", value: "1.5" },
  { label: "2", value: "2" },
  { label: "2.5", value: "2.5" },
  { label: "3", value: "3" },
];

const BUTTON_TYPE_OPTIONS = [
  { label: "Button", value: "button" },
  { label: "Submit", value: "submit" },
  { label: "Reset", value: "reset" },
];

const COLOR_PRESETS = [
  { label: "Custom Color", value: "custom" },
  { label: "Accent", value: "var(--accent)" },
  { label: "Accent Strong", value: "var(--accent-strong)" },
  { label: "Text", value: "var(--text)" },
  { label: "Muted", value: "var(--muted)" },
  { label: "Surface", value: "var(--color-surface)" },
  { label: "Surface Muted", value: "var(--color-surface-muted)" },
  { label: "Border", value: "var(--card-border)" },
  { label: "Danger", value: "var(--danger)" },
];

const COLOR_SWATCHES = [
  { label: "Accent", value: "var(--accent)" },
  { label: "Accent Strong", value: "var(--accent-strong)" },
  { label: "Text", value: "var(--text)" },
  { label: "Muted", value: "var(--muted)" },
  { label: "Surface", value: "var(--color-surface)" },
  { label: "Border", value: "var(--card-border)" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Green", value: "#22c55e" },
  { label: "Orange", value: "#f97316" },
  { label: "Red", value: "#ef4444" },
];

const COLOR_SCHEME_SWATCHES = [
  { label: "Blue", value: "blue", color: "#3b82f6" },
  { label: "Green", value: "green", color: "#22c55e" },
  { label: "Orange", value: "orange", color: "#f97316" },
  { label: "Red", value: "red", color: "#ef4444" },
  { label: "Teal", value: "teal", color: "#14b8a6" },
  { label: "Purple", value: "purple", color: "#8b5cf6" },
  { label: "Gray", value: "gray", color: "#94a3b8" },
];

function InspectorField({ label, htmlFor, children, hint }) {
  return (
    <div className="inspector-field">
      <Label className="inspector-field__label" htmlFor={htmlFor}>
        {label}
      </Label>
      <div className="inspector-field__control">{children}</div>
      {hint ? <div className="inspector-field__hint">{hint}</div> : null}
    </div>
  );
}

function SegmentedControl({ value, options, onChange }) {
  return (
    <div className="inspector-segment">
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            className={`inspector-segment__btn${isActive ? " is-active" : ""}`}
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function TogglePill({ id, label, checked, onChange }) {
  return (
    <button
      id={id}
      type="button"
      className={`inspector-pill${checked ? " is-active" : ""}`}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      {label}
    </button>
  );
}

function SwatchRow({ value, options, onChange }) {
  return (
    <div className="inspector-swatch-row">
      {options.map((option) => {
        const swatchValue = option.color || option.value;
        return (
          <button
            key={option.value}
            type="button"
            className={`inspector-swatch${
              value === option.value || value === swatchValue ? " is-active" : ""
            }`}
            style={{ background: swatchValue }}
            onClick={() => onChange(option.value)}
            aria-label={option.label}
            title={option.label}
          />
        );
      })}
    </div>
  );
}

function ColorField({ label, value, onChange, placeholder }) {
  const presetValues = useMemo(
    () => new Set(COLOR_PRESETS.map((option) => option.value)),
    []
  );
  const isPreset = value && presetValues.has(value);
  const presetValue = isPreset ? value : "custom";
  const handlePresetChange = (nextValue) => {
    if (nextValue === "custom") {
      if (isPreset) {
        onChange({ target: { value: "" } });
      }
      return;
    }
    onChange({ target: { value: nextValue } });
  };
  const handleSwatchChange = (nextValue) => {
    if (nextValue === "custom") return;
    onChange({ target: { value: nextValue } });
  };
  return (
    <div className="inspector-field inspector-color">
      <div className="inspector-field__head">
        <Label className="inspector-field__label">{label}</Label>
        <span className="inspector-field__meta">Color</span>
      </div>
      <Select value={presetValue} onValueChange={handlePresetChange}>
        <SelectTrigger className="inspector-select">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="inspector-select-content">
          {COLOR_PRESETS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="inspector-select-item"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <SwatchRow
        value={value}
        options={COLOR_SWATCHES}
        onChange={handleSwatchChange}
      />
      <div className="inspector-color-field">
        <div
          className="inspector-color-swatch"
          style={{ background: value || "transparent" }}
        />
        <Input
          className="inspector-input inspector-input--color"
          value={value || ""}
          onChange={onChange}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function MetricInput({ label, value, onChange, id }) {
  return (
    <div className="inspector-metric">
      <div className="inspector-metric__label">{label}</div>
      <Input
        id={id}
        type="number"
        className="inspector-input inspector-input--metric"
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

function SliderField({
  label,
  value,
  min = 0,
  max = 40,
  step = 1,
  onChange,
  onInput,
}) {
  const numericValue = Number.isFinite(Number(value)) ? Number(value) : min;
  return (
    <div className="inspector-slider">
      <div className="inspector-slider__row">
        <span className="inspector-slider__label">{label}</span>
        <Input
          type="number"
          className="inspector-input inspector-input--mini"
          value={value}
          onChange={onInput}
          placeholder="auto"
        />
      </div>
      <input
        type="range"
        className="inspector-range"
        min={min}
        max={max}
        step={step}
        value={numericValue}
        onChange={onChange}
      />
    </div>
  );
}

export function ButtonInspector({
  component,
  componentDef,
  onPropertyChange,
  onPositionChange,
  onSizeChange,
}) {
  const defaultMap = useMemo(() => {
    const map = {};
    if (componentDef?.properties) {
      componentDef.properties.forEach((prop) => {
        map[prop.key] = prop.defaultValue;
      });
    }
    return map;
  }, [componentDef]);

  const [openGroups, setOpenGroups] = useState([
    "layout",
    "content",
    "appearance",
    "spacing",
    "states",
    "style",
    "behavior",
  ]);

  const getProp = (key, fallback) => {
    const value = component?.properties?.[key];
    if (value !== undefined) return value;
    if (defaultMap[key] !== undefined) return defaultMap[key];
    return fallback;
  };

  const legacyLeftIcon = getProp("leftIcon", "");
  const legacyRightIcon = getProp("rightIcon", "");
  const iconName =
    component?.properties?.iconName ||
    legacyLeftIcon ||
    legacyRightIcon ||
    "";
  const iconPosition =
    component?.properties?.iconPosition ||
    (legacyRightIcon && !legacyLeftIcon ? "end" : "start");
  const iconVariant = getProp("iconVariant", "outlined");
  const iconStrokeRaw = getProp("iconStroke", 2);
  const iconStroke = iconStrokeRaw === "" ? "2" : String(iconStrokeRaw);
  const iconSizeRaw = getProp("iconSize", "");
  const iconSize = iconSizeRaw === "" ? "" : String(iconSizeRaw);

  const handleNumberChange = (key) => (e) => {
    const raw = e.target.value;
    if (raw === "") {
      onPropertyChange(key, "");
      return;
    }
    const next = Number(raw);
    if (Number.isFinite(next)) {
      onPropertyChange(key, next);
    }
  };

  const handleTextChange = (key) => (e) => {
    onPropertyChange(key, e.target.value);
  };

  const handleSelectChange = (key) => (value) => {
    if (value === DEFAULT_SELECT_VALUE) {
      onPropertyChange(key, "");
      return;
    }
    onPropertyChange(key, value);
  };

  const handleIconChange = (nextValue) => {
    onPropertyChange("iconName", nextValue);
    onPropertyChange("leftIcon", "");
    onPropertyChange("rightIcon", "");
  };

  const handleIconPositionChange = (nextValue) => {
    onPropertyChange("iconPosition", nextValue);
  };

  const handleIconVariantChange = (nextValue) => {
    onPropertyChange("iconVariant", nextValue);
  };

  const handleIconStrokeChange = (nextValue) => {
    const next = Number(nextValue);
    if (!Number.isFinite(next)) return;
    onPropertyChange("iconStroke", next);
  };

  const handlePositionInput = (axis) => (e) => {
    const next = Number(e.target.value);
    if (Number.isFinite(next)) {
      onPositionChange(axis, next);
    }
  };

  const handleSizeInput = (axis) => (e) => {
    const next = Number(e.target.value);
    if (Number.isFinite(next)) {
      onSizeChange(axis, next);
    }
  };

  return (
    <div className="properties-panel__inspector">
      <div className="properties-inspector">
        <Accordion
          type="multiple"
          value={openGroups}
          onValueChange={setOpenGroups}
          className="properties-inspector__accordion"
        >
          <AccordionItem value="layout" className="inspector-card">
            <AccordionTrigger className="inspector-card__trigger">
              Layout
            </AccordionTrigger>
            <AccordionContent className="inspector-card__content">
              <div className="inspector-metrics">
                <MetricInput
                  id="btn-x"
                  label="X"
                  value={component.position.x}
                  onChange={handlePositionInput("x")}
                />
                <MetricInput
                  id="btn-y"
                  label="Y"
                  value={component.position.y}
                  onChange={handlePositionInput("y")}
                />
                <MetricInput
                  id="btn-width"
                  label="W"
                  value={component.size.width}
                  onChange={handleSizeInput("width")}
                />
                <MetricInput
                  id="btn-height"
                  label="H"
                  value={component.size.height}
                  onChange={handleSizeInput("height")}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="content" className="inspector-card">
            <AccordionTrigger className="inspector-card__trigger">
              Content
            </AccordionTrigger>
            <AccordionContent className="inspector-card__content">
              <InspectorField label="Text" htmlFor="btn-text">
                <Input
                  id="btn-text"
                  className="inspector-input"
                  value={getProp("text", "Button")}
                  onChange={handleTextChange("text")}
                />
              </InspectorField>
              <div className="inspector-grid">
                <div style={{ gridColumn: "1 / -1" }}>
                  <InspectorField label="Icon">
                    <IconPicker
                      value={iconName}
                      onChange={handleIconChange}
                      variant={iconVariant}
                      onVariantChange={handleIconVariantChange}
                      stroke={Number(iconStroke)}
                      placeholder="No icon selected"
                      showVariants
                      popoverPlacement="left"
                    />
                  </InspectorField>
                </div>
                <InspectorField label="Icon Position">
                  <SegmentedPill
                    value={iconPosition}
                    options={ICON_POSITION_OPTIONS}
                    onChange={handleIconPositionChange}
                    disabled={!iconName}
                    showCheck={false}
                  />
                </InspectorField>
                <InspectorField label="Icon Size" hint="px (blank = auto)">
                  <Input
                    type="number"
                    inputMode="numeric"
                    className="inspector-input inspector-input--metric"
                    value={iconSize}
                    onChange={handleNumberChange("iconSize")}
                    placeholder="Auto"
                    disabled={!iconName}
                  />
                </InspectorField>
                <div style={{ gridColumn: "1 / -1" }}>
                  <InspectorField label="Stroke">
                    <SegmentedPill
                      value={iconStroke}
                      options={ICON_STROKE_OPTIONS}
                      onChange={handleIconStrokeChange}
                      disabled={!iconName || iconVariant === "filled"}
                      showCheck={false}
                    />
                  </InspectorField>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="appearance" className="inspector-card">
            <AccordionTrigger className="inspector-card__trigger">
              Appearance
            </AccordionTrigger>
            <AccordionContent className="inspector-card__content">
              <InspectorField label="Variant">
                <SegmentedPill
                  value={getProp("variant", "solid")}
                  options={VARIANT_OPTIONS}
                  onChange={handleSelectChange("variant")}
                  showCheck={false}
                />
              </InspectorField>
              <InspectorField label="Color Scheme">
                <div className="inspector-stack">
                  <SwatchRow
                    value={getProp("colorScheme", "blue")}
                    options={COLOR_SCHEME_SWATCHES}
                    onChange={handleSelectChange("colorScheme")}
                  />
                  <Select
                    value={getProp("colorScheme", "blue")}
                    onValueChange={handleSelectChange("colorScheme")}
                  >
                    <SelectTrigger className="inspector-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="inspector-select-content">
                      {COLOR_SCHEME_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="inspector-select-item"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </InspectorField>
              <InspectorField label="Size">
                <SegmentedPill
                  value={getProp("size", "md")}
                  options={SIZE_OPTIONS}
                  onChange={handleSelectChange("size")}
                  showCheck={false}
                />
              </InspectorField>
              <SliderField
                label="Radius"
                value={getProp("borderRadius", "")}
                min={0}
                max={32}
                step={1}
                onInput={handleNumberChange("borderRadius")}
                onChange={(event) =>
                  handleNumberChange("borderRadius")({
                    target: { value: event.target.value },
                  })
                }
              />
              <div className="inspector-grid">
                <InspectorField label="Font Size">
                  <Select
                    value={getProp("fontSize", "") || DEFAULT_SELECT_VALUE}
                    onValueChange={handleSelectChange("fontSize")}
                  >
                    <SelectTrigger className="inspector-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="inspector-select-content">
                      {FONT_SIZE_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="inspector-select-item"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </InspectorField>
                <InspectorField label="Font Weight">
                  <Select
                    value={getProp("fontWeight", "") || DEFAULT_SELECT_VALUE}
                    onValueChange={handleSelectChange("fontWeight")}
                  >
                    <SelectTrigger className="inspector-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="inspector-select-content">
                      {FONT_WEIGHT_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="inspector-select-item"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </InspectorField>
              </div>
              <InspectorField label="Text Transform">
                <SegmentedPill
                  value={getProp("textTransform", "none") || "none"}
                  options={TEXT_TRANSFORM_OPTIONS}
                  onChange={handleSelectChange("textTransform")}
                  showCheck={false}
                />
              </InspectorField>
              <SliderField
                label="Letter Spacing"
                value={getProp("letterSpacing", "")}
                min={0}
                max={10}
                step={0.5}
                onInput={handleNumberChange("letterSpacing")}
                onChange={(event) =>
                  handleNumberChange("letterSpacing")({
                    target: { value: event.target.value },
                  })
                }
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="spacing" className="inspector-card">
            <AccordionTrigger className="inspector-card__trigger">
              Spacing
            </AccordionTrigger>
            <AccordionContent className="inspector-card__content">
              <SliderField
                label="Padding X"
                value={getProp("paddingX", "")}
                min={0}
                max={40}
                step={1}
                onInput={handleNumberChange("paddingX")}
                onChange={(event) =>
                  handleNumberChange("paddingX")({
                    target: { value: event.target.value },
                  })
                }
              />
              <SliderField
                label="Padding Y"
                value={getProp("paddingY", "")}
                min={0}
                max={24}
                step={1}
                onInput={handleNumberChange("paddingY")}
                onChange={(event) =>
                  handleNumberChange("paddingY")({
                    target: { value: event.target.value },
                  })
                }
              />
              <div className="inspector-grid">
                <MetricInput
                  id="btn-min-width"
                  label="Min W"
                  value={getProp("minWidth", "")}
                  onChange={handleNumberChange("minWidth")}
                />
                <MetricInput
                  id="btn-icon-spacing"
                  label="Icon Gap"
                  value={getProp("iconSpacing", "")}
                  onChange={handleNumberChange("iconSpacing")}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="states" className="inspector-card">
            <AccordionTrigger className="inspector-card__trigger">
              States
            </AccordionTrigger>
            <AccordionContent className="inspector-card__content">
              <div className="inspector-pill-row">
                <TogglePill
                  id="btn-disabled"
                  label="Disabled"
                  checked={!!getProp("isDisabled", false)}
                  onChange={(value) => onPropertyChange("isDisabled", value)}
                />
                <TogglePill
                  id="btn-loading"
                  label="Loading"
                  checked={!!getProp("isLoading", false)}
                  onChange={(value) => onPropertyChange("isLoading", value)}
                />
                <TogglePill
                  id="btn-active"
                  label="Active"
                  checked={!!getProp("isActive", false)}
                  onChange={(value) => onPropertyChange("isActive", value)}
                />
              </div>
              <InspectorField label="Loading Text" htmlFor="btn-loading-text">
                <Input
                  id="btn-loading-text"
                  className="inspector-input"
                  value={getProp("loadingText", "")}
                  onChange={handleTextChange("loadingText")}
                  placeholder="Optional"
                />
              </InspectorField>
              <InspectorField label="Spinner Placement">
                <SegmentedControl
                  value={getProp("spinnerPlacement", "start")}
                  options={SPINNER_PLACEMENT_OPTIONS}
                  onChange={handleSelectChange("spinnerPlacement")}
                />
              </InspectorField>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="style" className="inspector-card">
            <AccordionTrigger className="inspector-card__trigger">
              Colors
            </AccordionTrigger>
            <AccordionContent className="inspector-card__content">
              <div className="inspector-grid">
                <ColorField
                  label="Background"
                  value={getProp("background", "")}
                  onChange={handleTextChange("background")}
                  placeholder="CSS value"
                />
                <ColorField
                  label="Text Color"
                  value={getProp("textColor", "")}
                  onChange={handleTextChange("textColor")}
                  placeholder="CSS value"
                />
              </div>
              <div className="inspector-grid">
                <InspectorField label="Border Width" htmlFor="btn-border-width">
                  <Input
                    id="btn-border-width"
                    type="number"
                    className="inspector-input"
                    value={getProp("borderWidth", "")}
                    onChange={handleNumberChange("borderWidth")}
                    placeholder="auto"
                  />
                </InspectorField>
                <ColorField
                  label="Border Color"
                  value={getProp("borderColor", "")}
                  onChange={handleTextChange("borderColor")}
                  placeholder="CSS value"
                />
              </div>
              <div className="inspector-grid">
                <ColorField
                  label="Hover Background"
                  value={getProp("hoverBackground", "")}
                  onChange={handleTextChange("hoverBackground")}
                  placeholder="CSS value"
                />
                <ColorField
                  label="Hover Text"
                  value={getProp("hoverColor", "")}
                  onChange={handleTextChange("hoverColor")}
                  placeholder="CSS value"
                />
              </div>
              <div className="inspector-grid">
                <ColorField
                  label="Active Background"
                  value={getProp("activeBackground", "")}
                  onChange={handleTextChange("activeBackground")}
                  placeholder="CSS value"
                />
                <ColorField
                  label="Active Text"
                  value={getProp("activeColor", "")}
                  onChange={handleTextChange("activeColor")}
                  placeholder="CSS value"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="behavior" className="inspector-card">
            <AccordionTrigger className="inspector-card__trigger">
              Behavior
            </AccordionTrigger>
            <AccordionContent className="inspector-card__content">
              <InspectorField label="Type">
                <SegmentedControl
                  value={getProp("type", "button")}
                  options={BUTTON_TYPE_OPTIONS}
                  onChange={handleSelectChange("type")}
                />
              </InspectorField>
              <InspectorField label="Link" htmlFor="btn-href">
                <Input
                  id="btn-href"
                  className="inspector-input"
                  value={getProp("href", "")}
                  onChange={handleTextChange("href")}
                  placeholder="https://"
                />
              </InspectorField>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
