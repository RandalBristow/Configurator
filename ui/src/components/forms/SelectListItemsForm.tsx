import { useState } from "react";
import type { SelectListItem } from "../../types/domain";

export type CreateSelectListItemInput = Partial<SelectListItem>;

export function SelectListItemsForm({
  selectListId,
  onSubmit,
  loading,
  disabled,
}: {
  selectListId?: string;
  onSubmit: (data: CreateSelectListItemInput) => void;
  loading: boolean;
  disabled: boolean;
}) {
  const [displayValue, setDisplayValue] = useState("");
  const [value, setValue] = useState("");
  const [order, setOrder] = useState(0);
  const [tooltip, setTooltip] = useState("");
  const [comments, setComments] = useState("");

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!selectListId) return;
        onSubmit({
          selectListId,
          displayValue,
          value,
          order,
          tooltip: tooltip || undefined,
          comments: comments || undefined,
        });
        setDisplayValue("");
        setValue("");
        setOrder(0);
        setTooltip("");
        setComments("");
      }}
    >
      <div className="grid-two">
        <input
          placeholder="Display Value"
          value={displayValue}
          onChange={(e) => setDisplayValue(e.target.value)}
          required
        />
        <input placeholder="Value" value={value} onChange={(e) => setValue(e.target.value)} required />
      </div>
      <input
        type="number"
        placeholder="Order"
        value={order}
        onChange={(e) => setOrder(Number(e.target.value))}
      />
      <div className="grid-two">
        <input placeholder="Tooltip" value={tooltip} onChange={(e) => setTooltip(e.target.value)} />
        <input placeholder="Comments" value={comments} onChange={(e) => setComments(e.target.value)} />
      </div>
      <button className="btn" type="submit" disabled={disabled || loading || !displayValue || !value}>
        Add Item
      </button>
    </form>
  );
}
