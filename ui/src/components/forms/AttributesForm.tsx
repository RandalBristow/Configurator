import { useState } from "react";
import type { Attribute, SelectList } from "../../types/domain";

export type CreateAttributeInput = Partial<Attribute>;

export function AttributesForm({
  optionId,
  onSubmit,
  loading,
  disabled,
  optionLists,
  dataTypes,
}: {
  optionId?: string;
  onSubmit: (data: CreateAttributeInput) => void;
  loading: boolean;
  disabled: boolean;
  optionLists: SelectList[];
  dataTypes: Attribute["dataType"][];
}) {
  const [label, setLabel] = useState("");
  const [key, setKey] = useState("");
  const [dataType, setDataType] = useState<Attribute["dataType"]>("string");
  const [selectListId, setSelectListId] = useState<string>("");
  const [sortOrder, setSortOrder] = useState(0);

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!optionId) return;
        onSubmit({
          optionId,
          label,
          key,
          dataType,
          selectListId: dataType === "enum" ? selectListId || null : null,
          sortOrder,
        });
        setLabel("");
        setKey("");
        setSelectListId("");
        setSortOrder(0);
      }}
    >
      <div className="grid-two">
        <input placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} required />
        <input placeholder="Key" value={key} onChange={(e) => setKey(e.target.value)} required />
      </div>
      <div className="grid-two">
        <select value={dataType} onChange={(e) => setDataType(e.target.value as Attribute["dataType"])}>
          {dataTypes.map((dt) => (
            <option key={dt} value={dt}>
              {dt}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Sort order"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
        />
      </div>
      {dataType === "enum" && (
        <select value={selectListId} onChange={(e) => setSelectListId(e.target.value)}>
          <option value="">Select select list</option>
          {optionLists.map((ol) => (
            <option key={ol.id} value={ol.id}>
              {ol.name}
            </option>
          ))}
        </select>
      )}
      <button className="btn" type="submit" disabled={disabled || loading || !label || !key}>
        Add Attribute
      </button>
    </form>
  );
}
