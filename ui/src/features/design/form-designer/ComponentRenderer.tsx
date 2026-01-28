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
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  RadioGroup,
  Radio,
  CheckboxGroup,
  Stack,
  HStack,
  ButtonGroup,
  Progress,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Image as ChakraImage,
  useColorModeValue,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import React, { useState, useMemo } from "react";
import { ThemedContainedSelect } from "./ThemedContainedSelect";
import { Separator } from "@/components/ui/separator";
import { UISwitch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TablerIcon } from "@/components/ui/tabler-icon-library";

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

  const parseOptions = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map((opt) => `${opt}`.trim()).filter(Boolean);
    }
    if (typeof value === "string") {
      return value
        .split(",")
        .map((opt) => opt.trim())
        .filter(Boolean);
    }
    return [];
  };

  const toNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const toOptionalString = (value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

  const toOptionalNumber = (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    if (typeof value === "string" && value.trim() === "") return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const toOptionalPx = (value) => {
    const parsed = toOptionalNumber(value);
    return Number.isFinite(parsed) ? `${parsed}px` : undefined;
  };

  const resolveToneColor = (tone) => {
    if (tone === "accent") return "var(--accent)";
    if (tone === "muted") return "var(--muted)";
    if (tone === "text") return "var(--text)";
    return "var(--text)";
  };

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
        const paddingX = toOptionalPx(properties.paddingX);
        const paddingY = toOptionalPx(properties.paddingY);
        const minWidth = toOptionalPx(properties.minWidth);
        const borderRadius = toOptionalPx(properties.borderRadius);
        const borderWidth = toOptionalPx(properties.borderWidth);
        const iconSpacing = toOptionalPx(properties.iconSpacing);
        const letterSpacing = toOptionalPx(properties.letterSpacing);
        const fontSize = toOptionalString(properties.fontSize);
        const fontWeight = toOptionalString(properties.fontWeight);
        const textTransform = toOptionalString(properties.textTransform);
        const background = toOptionalString(properties.background);
        const textColor = toOptionalString(properties.textColor);
        const borderColor = toOptionalString(properties.borderColor);
        const hoverBackground = toOptionalString(properties.hoverBackground);
        const hoverColor = toOptionalString(properties.hoverColor);
        const activeBackground = toOptionalString(properties.activeBackground);
        const activeColor = toOptionalString(properties.activeColor);
        const loadingText = toOptionalString(properties.loadingText);
        const spinnerPlacement = properties.spinnerPlacement || "start";
        const linkHref = toOptionalString(properties.href);
        const iconName =
          toOptionalString(properties.iconName) ||
          toOptionalString(properties.leftIcon) ||
          toOptionalString(properties.rightIcon);
        const iconPosition =
          properties.iconPosition ||
          (properties.rightIcon && !properties.leftIcon ? "end" : "start");
        const iconVariant = properties.iconVariant === "filled" ? "filled" : "outlined";
        const iconStroke = toNumber(properties.iconStroke, 2);
        const iconSizeOverride = toOptionalNumber(properties.iconSize);
        const iconSize =
          typeof iconSizeOverride === "number"
            ? iconSizeOverride
            : properties.size === "sm"
              ? 14
              : properties.size === "lg"
                ? 18
                : 16;
        const iconElement = iconName ? (
          <TablerIcon
            name={iconName}
            variant={iconVariant}
            size={iconSize}
            stroke={iconStroke}
          />
        ) : null;
        const hoverStyles = {};
        const activeStyles = {};
        if (hoverBackground) hoverStyles.bg = hoverBackground;
        if (hoverColor) hoverStyles.color = hoverColor;
        if (activeBackground) activeStyles.bg = activeBackground;
        if (activeColor) activeStyles.color = activeColor;
        return (
          <Button
            colorScheme={colorScheme}
            variant={variant}
            size={properties.size || "md"}
            width="100%"
            height="100%"
            minH="36px"
            isDisabled={!!properties.isDisabled}
            isLoading={!!properties.isLoading}
            isActive={!!properties.isActive}
            loadingText={loadingText}
            spinnerPlacement={spinnerPlacement}
            leftIcon={iconPosition === "start" ? iconElement : undefined}
            rightIcon={iconPosition === "end" ? iconElement : undefined}
            iconSpacing={iconSpacing}
            px={paddingX}
            py={paddingY}
            minW={minWidth ?? 0}
            borderRadius={borderRadius}
            borderWidth={borderWidth}
            borderColor={borderColor}
            bg={background}
            color={textColor}
            fontSize={fontSize}
            fontWeight={fontWeight}
            textTransform={textTransform}
            letterSpacing={letterSpacing}
            _hover={Object.keys(hoverStyles).length ? hoverStyles : undefined}
            _active={Object.keys(activeStyles).length ? activeStyles : undefined}
            {...(linkHref ? { as: "a", href: linkHref } : {})}
            type={!linkHref ? properties.type || "button" : undefined}
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
      case "TextArea":
        return (
          <FormControl isRequired={!!properties.isRequired} width="100%">
            {properties.label && (
              <FormLabel htmlFor={fieldId} mb={1}>
                {properties.label}
              </FormLabel>
            )}
            <Textarea
              id={fieldId}
              name={fieldId}
              placeholder={properties.placeholder}
              size={properties.size || "md"}
              rows={toNumber(properties.rows, 4)}
              isReadOnly={!!properties.isReadOnly}
              isDisabled={!!properties.isDisabled}
              width="100%"
              resize="none"
              bg="white"
              color="gray.900"
              _dark={{ bg: "gray.800", color: "gray.100" }}
            />
            {properties.helperText && (
              <Text fontSize="sm" color="gray.500" mt={1}>
                {properties.helperText}
              </Text>
            )}
          </FormControl>
        );
      case "NumberInput": {
        const min = toNumber(properties.min, undefined);
        const max = toNumber(properties.max, undefined);
        const step = toNumber(properties.step, 1);
        const defaultValue = toNumber(properties.value, toNumber(min, 0));
        return (
          <FormControl isRequired={!!properties.isRequired} width="100%">
            {properties.label && (
              <FormLabel htmlFor={fieldId} mb={1}>
                {properties.label}
              </FormLabel>
            )}
            <NumberInput
              id={fieldId}
              name={fieldId}
              size={properties.size || "md"}
              min={Number.isFinite(min) ? min : undefined}
              max={Number.isFinite(max) ? max : undefined}
              step={step}
              defaultValue={defaultValue}
              isReadOnly={!!properties.isReadOnly}
              isDisabled={!!properties.isDisabled}
              clampValueOnBlur
              width="100%"
            >
              <NumberInputField bg="white" color="gray.900" _dark={{ bg: "gray.800", color: "gray.100" }} />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        );
      }
      case "PasswordInput":
        return (
          <FormControl isRequired={!!properties.isRequired} width="100%">
            {properties.label && (
              <FormLabel htmlFor={fieldId} mb={1}>
                {properties.label}
              </FormLabel>
            )}
            <Input
              id={fieldId}
              name={fieldId}
              type="password"
              placeholder={properties.placeholder}
              size={properties.size || "md"}
              isReadOnly={!!properties.isReadOnly}
              isDisabled={!!properties.isDisabled}
              width="100%"
              bg="white"
              color="gray.900"
              _dark={{ bg: "gray.800", color: "gray.100" }}
            />
            {properties.helperText && (
              <Text fontSize="sm" color="gray.500" mt={1}>
                {properties.helperText}
              </Text>
            )}
          </FormControl>
        );
      case "EmailInput":
        return (
          <FormControl isRequired={!!properties.isRequired} width="100%">
            {properties.label && (
              <FormLabel htmlFor={fieldId} mb={1}>
                {properties.label}
              </FormLabel>
            )}
            <Input
              id={fieldId}
              name={fieldId}
              type="email"
              placeholder={properties.placeholder}
              size={properties.size || "md"}
              isReadOnly={!!properties.isReadOnly}
              isDisabled={!!properties.isDisabled}
              width="100%"
              bg="white"
              color="gray.900"
              _dark={{ bg: "gray.800", color: "gray.100" }}
            />
            {properties.helperText && (
              <Text fontSize="sm" color="gray.500" mt={1}>
                {properties.helperText}
              </Text>
            )}
          </FormControl>
        );
      case "UrlInput":
        return (
          <FormControl isRequired={!!properties.isRequired} width="100%">
            {properties.label && (
              <FormLabel htmlFor={fieldId} mb={1}>
                {properties.label}
              </FormLabel>
            )}
            <Input
              id={fieldId}
              name={fieldId}
              type="url"
              placeholder={properties.placeholder}
              size={properties.size || "md"}
              isReadOnly={!!properties.isReadOnly}
              isDisabled={!!properties.isDisabled}
              width="100%"
              bg="white"
              color="gray.900"
              _dark={{ bg: "gray.800", color: "gray.100" }}
            />
            {properties.helperText && (
              <Text fontSize="sm" color="gray.500" mt={1}>
                {properties.helperText}
              </Text>
            )}
          </FormControl>
        );
      case "RadioGroup": {
        const optionList = parseOptions(properties.options);
        const direction = properties.direction === "row" ? "row" : "column";
        return (
          <FormControl width="100%">
            {properties.label && (
              <FormLabel mb={1}>{properties.label}</FormLabel>
            )}
            <RadioGroup
              defaultValue={optionList[0] || ""}
              isDisabled={!!properties.isDisabled}
            >
              <Stack direction={direction} spacing={2}>
                {optionList.map((option, index) => (
                  <Radio
                    key={`${option}-${index}`}
                    value={option}
                    size={properties.size || "md"}
                    isDisabled={!!properties.isDisabled}
                  >
                    {option}
                  </Radio>
                ))}
              </Stack>
            </RadioGroup>
          </FormControl>
        );
      }
      case "CheckboxGroup": {
        const optionList = parseOptions(properties.options);
        return (
          <FormControl width="100%">
            {properties.label && (
              <FormLabel mb={1}>{properties.label}</FormLabel>
            )}
            <CheckboxGroup
              defaultValue={optionList.slice(0, 1)}
              isDisabled={!!properties.isDisabled}
            >
              <Stack
                direction={properties.direction === "row" ? "row" : "column"}
                spacing={2}
              >
                {optionList.map((option, index) => (
                  <Checkbox
                    key={`${option}-${index}`}
                    value={option}
                    size={properties.size || "md"}
                    isDisabled={!!properties.isDisabled}
                  >
                    {option}
                  </Checkbox>
                ))}
              </Stack>
            </CheckboxGroup>
          </FormControl>
        );
      }
      case "MultiSelect": {
        const optionList = parseOptions(properties.options);
        const listSize = Math.min(Math.max(optionList.length, 2), 6);
        return (
          <FormControl width="100%">
            {properties.label && (
              <FormLabel htmlFor={fieldId} mb={1}>
                {properties.label}
              </FormLabel>
            )}
            <Select
              id={fieldId}
              name={fieldId}
              size={properties.size || "md"}
              multiple
              isDisabled={!!properties.isDisabled}
              width="100%"
              height="auto"
              bg="white"
              color="gray.900"
              _dark={{ bg: "gray.800", color: "gray.100" }}
              style={{ minHeight: listSize * 20 }}
            >
              {optionList.map((option, index) => (
                <option key={`${option}-${index}`} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </FormControl>
        );
      }
      case "ComboBox": {
        const optionList = parseOptions(properties.options);
        const listId = `${fieldId}-list`;
        return (
          <FormControl width="100%">
            {properties.label && (
              <FormLabel htmlFor={fieldId} mb={1}>
                {properties.label}
              </FormLabel>
            )}
            <Input
              id={fieldId}
              name={fieldId}
              list={listId}
              placeholder={properties.placeholder}
              size={properties.size || "md"}
              isReadOnly={!!properties.isReadOnly}
              isDisabled={!!properties.isDisabled}
              width="100%"
              bg="white"
              color="gray.900"
              _dark={{ bg: "gray.800", color: "gray.100" }}
            />
            <datalist id={listId}>
              {optionList.map((option, index) => (
                <option key={`${option}-${index}`} value={option} />
              ))}
            </datalist>
          </FormControl>
        );
      }
      case "DatePicker":
        return (
          <FormControl isRequired={!!properties.isRequired} width="100%">
            {properties.label && (
              <FormLabel htmlFor={fieldId} mb={1}>
                {properties.label}
              </FormLabel>
            )}
            <Input
              id={fieldId}
              name={fieldId}
              type="date"
              size={properties.size || "md"}
              isReadOnly={!!properties.isReadOnly}
              isDisabled={!!properties.isDisabled}
              width="100%"
              bg="white"
              color="gray.900"
              _dark={{ bg: "gray.800", color: "gray.100" }}
            />
          </FormControl>
        );
      case "TimePicker":
        return (
          <FormControl isRequired={!!properties.isRequired} width="100%">
            {properties.label && (
              <FormLabel htmlFor={fieldId} mb={1}>
                {properties.label}
              </FormLabel>
            )}
            <Input
              id={fieldId}
              name={fieldId}
              type="time"
              size={properties.size || "md"}
              isReadOnly={!!properties.isReadOnly}
              isDisabled={!!properties.isDisabled}
              width="100%"
              bg="white"
              color="gray.900"
              _dark={{ bg: "gray.800", color: "gray.100" }}
            />
          </FormControl>
        );
      case "DateRange":
        return (
          <FormControl isRequired={!!properties.isRequired} width="100%">
            {properties.label && (
              <FormLabel mb={1}>{properties.label}</FormLabel>
            )}
            <HStack spacing={2}>
              <Input
                type="date"
                size={properties.size || "md"}
                isReadOnly={!!properties.isReadOnly}
                isDisabled={!!properties.isDisabled}
                bg="white"
                color="gray.900"
                _dark={{ bg: "gray.800", color: "gray.100" }}
              />
              <Input
                type="date"
                size={properties.size || "md"}
                isReadOnly={!!properties.isReadOnly}
                isDisabled={!!properties.isDisabled}
                bg="white"
                color="gray.900"
                _dark={{ bg: "gray.800", color: "gray.100" }}
              />
            </HStack>
          </FormControl>
        );
      case "FileUpload":
        return (
          <FormControl width="100%">
            {properties.label && (
              <FormLabel htmlFor={fieldId} mb={1}>
                {properties.label}
              </FormLabel>
            )}
            <Input
              id={fieldId}
              name={fieldId}
              type="file"
              accept={properties.accept || undefined}
              multiple={!!properties.multiple}
              size={properties.size || "md"}
              isDisabled={!!properties.isDisabled}
              width="100%"
              bg="white"
              color="gray.900"
              _dark={{ bg: "gray.800", color: "gray.100" }}
            />
            {properties.helperText && (
              <Text fontSize="sm" color="gray.500" mt={1}>
                {properties.helperText}
              </Text>
            )}
          </FormControl>
        );
      case "Slider":
        return (
          <FormControl width="100%">
            {properties.label && (
              <FormLabel mb={2}>{properties.label}</FormLabel>
            )}
            <Slider
              min={toNumber(properties.min, 0)}
              max={toNumber(properties.max, 100)}
              step={toNumber(properties.step, 1)}
              defaultValue={toNumber(properties.value, 50)}
              isDisabled={!!properties.isDisabled}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </FormControl>
        );
      case "Rating": {
        const max = Math.min(Math.max(toNumber(properties.max, 5), 1), 10);
        const value = Math.min(
          Math.max(toNumber(properties.value, 0), 0),
          max
        );
        return (
          <FormControl width="100%">
            {properties.label && (
              <FormLabel mb={2}>{properties.label}</FormLabel>
            )}
            <HStack spacing={1}>
              {Array.from({ length: max }).map((_, index) => (
                <Box
                  key={`rating-${index}`}
                  width="14px"
                  height="14px"
                  borderRadius="3px"
                  border="1px solid"
                  borderColor="var(--card-border)"
                  bg={index < value ? "var(--accent)" : "transparent"}
                />
              ))}
            </HStack>
          </FormControl>
        );
      }
      case "ButtonGroup": {
        const buttons = parseOptions(properties.buttons);
        return (
          <Box width="100%" height="100%" display="flex" alignItems="center">
            <ButtonGroup
              size={properties.size || "md"}
              variant={properties.variant || "solid"}
              colorScheme={properties.colorScheme || "blue"}
              isDisabled={!!properties.isDisabled}
              flexWrap="wrap"
            >
              {buttons.length > 0
                ? buttons.map((label, index) => (
                    <Button key={`${label}-${index}`}>{label}</Button>
                  ))
                : [<Button key="default">Button</Button>]}
            </ButtonGroup>
          </Box>
        );
      }
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
      case "LabelText": {
        const color =
          properties.color === "accent"
            ? "var(--accent)"
            : properties.color === "muted"
              ? "var(--muted)"
              : "var(--text)";
        return (
          <Text
            fontSize={properties.size || "sm"}
            color={color}
            fontWeight="600"
          >
            {properties.text}
          </Text>
        );
      }
      case "HelperText":
        return (
          <Text fontSize={properties.size || "sm"} color="var(--muted)">
            {properties.text}
          </Text>
        );
      case "Image": {
        const src = properties.src;
        const radius = toNumber(properties.radius, 8);
        if (src) {
          return (
            <ChakraImage
              src={src}
              alt={properties.alt || "Image"}
              objectFit={properties.fit || "cover"}
              borderRadius={`${radius}px`}
              width="100%"
              height="100%"
            />
          );
        }
        return (
          <Box
            width="100%"
            height="100%"
            border="1px dashed var(--card-border)"
            borderRadius={`${radius}px`}
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="var(--color-surface-muted)"
          >
            <Text fontSize="sm" color="var(--muted)">
              Image
            </Text>
          </Box>
        );
      }
      case "Icon": {
        const iconSize = Math.max(12, toNumber(properties.size, 24));
        const tone = resolveToneColor(properties.color);
        const iconName = toOptionalString(properties.name);
        const label = iconName || "Icon";
        const iconVariant = properties.iconVariant === "filled" ? "filled" : "outlined";
        const iconStroke = toNumber(properties.iconStroke, 2);
        const iconElement = iconName ? (
          <TablerIcon
            name={iconName}
            variant={iconVariant}
            size={iconSize}
            stroke={iconStroke}
          />
        ) : null;
        return (
          <Box
            width="100%"
            height="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color={tone}
          >
            <Box
              width={`${iconSize}px`}
              height={`${iconSize}px`}
              borderRadius="6px"
              border="1px solid"
              borderColor="var(--card-border)"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {iconElement ? (
                iconElement
              ) : (
                <Text
                  fontSize={`${Math.max(8, iconSize * 0.45)}px`}
                  fontWeight="700"
                >
                  {label.slice(0, 2)}
                </Text>
              )}
            </Box>
          </Box>
        );
      }
      case "Alert":
        return (
          <Alert status={properties.status || "info"} variant="subtle">
            <AlertIcon />
            <Box>
              <AlertTitle>{properties.title}</AlertTitle>
              {properties.description && (
                <AlertDescription>{properties.description}</AlertDescription>
              )}
            </Box>
          </Alert>
        );
      case "Progress":
        return (
          <Box width="100%">
            <Progress
              value={toNumber(properties.value, 0)}
              max={toNumber(properties.max, 100)}
              size={properties.size || "md"}
              colorScheme={properties.colorScheme || "blue"}
              borderRadius="md"
            />
          </Box>
        );
      case "Spinner":
        return (
          <Box
            width="100%"
            height="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Spinner
              size={properties.size || "md"}
              color={resolveToneColor(properties.color)}
            />
          </Box>
        );
      case "RichText":
        return (
          <Box
            width="100%"
            height="100%"
            border="1px solid var(--card-border)"
            borderRadius="8px"
            p={3}
            bg="white"
          >
            <Text fontSize="sm" color="var(--text)">
              {properties.content}
            </Text>
          </Box>
        );
      case "StepIndicator": {
        const steps = parseOptions(properties.steps);
        const safeSteps = steps.length > 0 ? steps : ["Step 1", "Step 2"];
        const currentIndex = Math.min(
          Math.max(toNumber(properties.current, 1) - 1, 0),
          safeSteps.length - 1
        );
        return (
          <Box width="100%">
            <HStack spacing={2} align="center">
              {safeSteps.map((_, index) => (
                <React.Fragment key={`step-${index}`}>
                  <Box
                    width="24px"
                    height="24px"
                    borderRadius="999px"
                    border="1px solid"
                    borderColor={
                      index <= currentIndex ? "var(--accent)" : "var(--card-border)"
                    }
                    bg={index <= currentIndex ? "var(--accent)" : "transparent"}
                    color={index <= currentIndex ? "#fff" : "var(--text)"}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="12px"
                    fontWeight="600"
                  >
                    {index + 1}
                  </Box>
                  {index < safeSteps.length - 1 && (
                    <Box
                      flex="1"
                      height="2px"
                      bg={
                        index < currentIndex
                          ? "var(--accent)"
                          : "var(--card-border)"
                      }
                    />
                  )}
                </React.Fragment>
              ))}
            </HStack>
          </Box>
        );
      }
      case "DataTable": {
        const columns = parseOptions(properties.columns);
        const safeColumns =
          columns.length > 0 ? columns : ["Column 1", "Column 2", "Column 3"];
        const rowCount = Math.max(1, toNumber(properties.rows, 3));
        const rows = Array.from({ length: Math.min(rowCount, 20) }, (_, idx) =>
          safeColumns.map((col) => `${col} ${idx + 1}`)
        );
        return (
          <Box
            width="100%"
            height="100%"
            border="1px solid var(--card-border)"
            borderRadius="8px"
            p={2}
            bg="white"
            overflow="auto"
          >
            <Table
              size={properties.size || "sm"}
              variant={properties.variant || "simple"}
            >
              <Thead>
                <Tr>
                  {safeColumns.map((col, index) => (
                    <Th key={`${col}-${index}`}>{col}</Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {rows.map((row, rowIndex) => (
                  <Tr key={`row-${rowIndex}`}>
                    {row.map((cell, cellIndex) => (
                      <Td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</Td>
                    ))}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        );
      }
      case "Lookup": {
        const showButton = properties.showButton !== false;
        return (
          <FormControl isRequired={!!properties.isRequired} width="100%">
            {properties.label && (
              <FormLabel htmlFor={fieldId} mb={1}>
                {properties.label}
              </FormLabel>
            )}
            <HStack spacing={2} align="center">
              <Input
                id={fieldId}
                name={fieldId}
                placeholder={properties.placeholder}
                size={properties.size || "md"}
                isReadOnly={!!properties.isReadOnly}
                isDisabled={!!properties.isDisabled}
                width="100%"
                bg="white"
                color="gray.900"
                _dark={{ bg: "gray.800", color: "gray.100" }}
              />
              {showButton && (
                <Button
                  size={properties.size || "md"}
                  variant="outline"
                  isDisabled={!!properties.isDisabled}
                >
                  {properties.buttonLabel || "Search"}
                </Button>
              )}
            </HStack>
            {properties.helperText && (
              <Text fontSize="sm" color="gray.500" mt={1}>
                {properties.helperText}
              </Text>
            )}
          </FormControl>
        );
      }
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

