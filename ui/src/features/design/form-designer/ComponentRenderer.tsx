// @ts-nocheck
import "@/chakra-switch-lookalike.css";
import {
  Button,
  Input,
  Checkbox,
  Switch,
  Text,
  Badge,
  Card,
  Box,
  Select,
  useColorModeValue,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import React, { useState, useMemo } from "react";
import { ThemedContainedSelect } from "./ThemedContainedSelect";
import { Separator } from "@/components/ui/separator";
import { UISwitch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function ComponentRenderer({ component, previewMode, switchGroupRef }) {
  const { type, properties } = component;

  // Memoize options so they don't change on every render
  const options = useMemo(
    () =>
      properties.options
        ? properties.options.split(",").map((opt) => opt.trim())
        : [],
    [properties.options]
  );

  // Local state for interactive preview
  const [checked, setChecked] = useState(properties.checked || false);
  const [selectedValue, setSelectedValue] = useState(() =>
    previewMode && options.length > 0 ? options[0] : ""
  );

  React.useEffect(() => {
    if (
      previewMode &&
      options.length > 0 &&
      !options.includes(selectedValue) &&
      selectedValue !== options[0]
    ) {
      setSelectedValue(options[0]);
    }
  }, [previewMode, options]);

  // Generate unique id and name for accessibility/autofill
  const fieldId = `${type.toLowerCase()}-${component.id}`;

  const renderComponent = () => {
    switch (type) {
      // DO NOT ALTER: Begin TextField rendering
      case "TextField":
        return (
          <FormControl isRequired={!!properties.required} width="100%">
            {properties.label && (
              <FormLabel htmlFor={fieldId} height="auto" mb={1} display="block">
                {properties.label}
              </FormLabel>
            )}
            <Input
              id={fieldId}
              name={fieldId}
              placeholder={properties.placeholder}
              size={properties.size || "md"}
              isReadOnly={!!properties.readOnly}
              isDisabled={!!properties.disabled}
              defaultValue={
                typeof properties.value === "string" ? properties.value : ""
              }
              width="100%"
              bg="white"
              color="gray.900"
              _dark={{ bg: "gray.800", color: "gray.100" }}
              display="block"
            />
            {properties.helperText && (
              <Text
                fontSize="sm"
                color="gray.500"
                height="auto"
                mt={1}
                display="block"
              >
                {properties.helperText}
              </Text>
            )}
          </FormControl>
        );
      // DO NOT ALTER: End TextField rendering
      // DO NOT ALTER: Begin Button rendering
      case "Button": {
        const colorScheme = properties.colorScheme || "blue";
        const variant = properties.variant || "solid";
        return (
          <Button
            colorScheme={colorScheme}
            variant={variant}
            size={properties.size || "md"}
            width="100%"
            height="100%"
            display="block"
            style={{ minHeight: 36, minWidth: 0 }} // Allow wrapper to control minWidth
            isDisabled={!!properties.isDisabled}
            isLoading={!!properties.isLoading}
            leftIcon={properties.leftIcon}
            rightIcon={properties.rightIcon}
          >
            {properties.text || "Button"}
          </Button>
        );
      }
      // DO NOT ALTER: End Button rendering
      // DO NOT ALTER: Begin Checkbox rendering
      case "Checkbox":
        // Render Checkbox with no style prop; label width logic handled in DroppedComponent.jsx
        return (
          <Checkbox
            id={fieldId}
            name={fieldId}
            isChecked={!!properties.isChecked}
            colorScheme={properties.colorScheme || "blue"}
            size={properties.size || "md"}
            isDisabled={!!properties.isDisabled}
            isIndeterminate={!!properties.isIndeterminate}
          >
            {properties.label}
          </Checkbox>
        );
      // DO NOT ALTER: End Checkbox rendering
      // DO NOT ALTER: Begin Switch rendering
      case "Switch": {
        const switchId = fieldId;
        // Use Radix UISwitch instead of Chakra Switch
        return (
          <div
            ref={switchGroupRef}
            className="group flex items-center gap-2"
            style={{ minWidth: 0, maxWidth: "100%" }}
          >
            <Label
              htmlFor={switchId}
              className="switch-component-label"
              style={{
                minWidth: 0,
                maxWidth: "100%",
                whiteSpace: "normal",
                wordBreak: "normal",
                overflowWrap: "break-word",
                color: "#222",
                fontSize: "1rem",
                fontWeight: 500,
                lineHeight: 1.2,
              }}
            >
              {properties.label === undefined ? "Switch" : properties.label}
            </Label>
            <UISwitch
              id={switchId}
              checked={!!properties.isChecked}
              disabled={!!properties.isDisabled}
              className="switch-component"
            />
          </div>
        );
      }
      // DO NOT ALTER: End Switch rendering
      // DO NOT ALTER: Begin Select rendering
      case "Select": {
        const options = properties.options
          ? typeof properties.options === "string"
            ? properties.options.split(",").map((opt) => opt.trim())
            : Array.isArray(properties.options)
              ? properties.options
              : []
          : [];
        return (
          <FormControl width="100%">
            {properties.label && (
              <FormLabel htmlFor={fieldId} mb={1}>
                {properties.label}
              </FormLabel>
            )}
            <div role="group">
              <Select
                id={fieldId}
                name={fieldId}
                defaultValue={properties.value || options[0] || ""}
                size={properties.size || "md"}
                isDisabled={!!properties.disabled}
                width="100%"
                bg="white"
                color="gray.900"
                _dark={{ bg: "gray.800", color: "gray.100" }}
                style={{ display: "block" }}
              >
                {options.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>
          </FormControl>
        );
      }
      // DO NOT ALTER: End Select rendering
      case "Typography":
        return (
          <Text
            fontSize={properties.fontSize || "md"}
            color={
              properties.colorScheme ||
              useColorModeValue("gray.900", "gray.100")
            }
            textAlign={properties.align || "left"}
            width="100%"
          >
            {properties.text}
          </Text>
        );
      case "Chip":
        return (
          <Badge colorScheme={properties.colorScheme || "blue"}>
            {properties.label}
          </Badge>
        );
      case "Divider":
        return (
          <Separator orientation={properties.orientation || "horizontal"} />
        );
      case "Card":
        return (
          <Card width="100%" height="100%" p={4}>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              Card Content
            </Text>
          </Card>
        );
      case "Paper":
        return (
          <Box
            bg={useColorModeValue("gray.50", "gray.700")}
            borderRadius="md"
            boxShadow="md"
            width="100%"
            height="100%"
            p={4}
          >
            <Text fontSize="sm" color="gray.500" textAlign="center">
              Paper Content
            </Text>
          </Box>
        );
      default:
        return null;
    }
  };

  return renderComponent();
}

