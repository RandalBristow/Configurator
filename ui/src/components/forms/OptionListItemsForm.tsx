import { useState } from "react";
import type { OptionListItem } from "../../types/domain";

export type CreateOptionListItemInput = Partial<OptionListItem>;

export function OptionListItemsForm({
  optionListId,
  onSubmit,
  loading,
  disabled,
}: {
  optionListId?: string;
  onSubmit: (data: CreateOptionListItemInput) => void;
  loading: boolean;
  disabled: boolean;
}) {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!optionListId) return;
        onSubmit({ optionListId, label, value, sortOrder });
        setLabel("");
        setValue("");
        setSortOrder(0);
      }}
    >
      <div className="grid-two">
        <input placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} required />
        <input placeholder="Value" value={value} onChange={(e) => setValue(e.target.value)} required />
      </div>
      <input
        type="number"
        placeholder="Sort order"
        value={sortOrder}
        onChange={(e) => setSortOrder(Number(e.target.value))}
      />
      <button className="btn" type="submit" disabled={disabled || loading || !label || !value}>
        Add Item
      </button>
    </form>
  );
}
