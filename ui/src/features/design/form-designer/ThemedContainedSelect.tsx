// @ts-nocheck
import * as React from "react";
import { Select } from "@chakra-ui/react";

export function ThemedContainedSelect({ label, options, value, onChange }) {
  return (
    <div style={{ width: "100%" }}>
      {label && (
        <label
          style={{
            display: "block",
            marginBottom: 4,
            fontWeight: 500,
            fontSize: 14,
          }}
        >
          {label}
        </label>
      )}
      <Select
        value={value}
        onChange={(e) => onChange(e, e.target.value)}
        size="md"
        borderRadius="md"
        bg="white"
        borderColor="gray.200"
        _focus={{ borderColor: "blue.400", boxShadow: "outline" }}
        width="100%"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    </div>
  );
}

