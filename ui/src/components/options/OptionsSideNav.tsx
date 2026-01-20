import type { KeyboardEvent } from "react";
import type { Option, OptionType } from "../../types/domain";
import { SidePanelCreatePopover } from "../nav/SidePanelCreatePopover";
import { SidePanelEditPopover } from "../nav/SidePanelEditPopover";
import { SidePanelFilter } from "../nav/SidePanelFilter";
import { WorkspaceTabs } from "../workspace/WorkspaceTabs";

type Props = {
  optionType: OptionType;
  onChangeOptionType: (type: OptionType) => void;
  options: Option[];
  selectedOptionId?: string;
  filter: string;
  onFilterChange: (value: string) => void;
  onSelectOption: (id: string) => void;
  onCreateOption: (payload: { name: string; description?: string }) => Promise<void>;
  optionMetaById?: Record<string, { name: string; description: string }>;
  onOptionMetaChange?: (id: string, payload: { name: string; description: string }) => void;
  onRequestEditOption?: (id: string) => Promise<boolean>;
};

export function OptionsSideNav({
  optionType,
  onChangeOptionType,
  options,
  selectedOptionId,
  filter,
  onFilterChange,
  onSelectOption,
  onCreateOption,
  optionMetaById,
  onOptionMetaChange,
  onRequestEditOption,
}: Props) {
  const normalizedFilter = filter.trim().toLowerCase();
  const filteredOptions = options.filter((opt) => {
    const label = optionMetaById?.[opt.id]?.name ?? opt.name;
    return normalizedFilter ? label.toLowerCase().includes(normalizedFilter) : true;
  });

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, id: string) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelectOption(id);
  };

  return (
    <div className="nav-section">
      <div className="sidepanel-tabs">
        <WorkspaceTabs
          items={[
            { id: "simple", label: "Simple" },
            { id: "configured", label: "Configured" },
          ]}
          activeId={optionType}
          onChange={(id) => onChangeOptionType(id as OptionType)}
          variant="menubar"
        />
      </div>

      <div className="sidepanel-top sidepanel-top--tabs">
        <SidePanelFilter
          value={filter}
          onChange={onFilterChange}
          placeholder="Filter options"
          action={
            <SidePanelCreatePopover
              entityLabel={optionType === "simple" ? "simple option" : "configured option"}
              onCreate={onCreateOption}
            />
          }
        />
        <div className="sidepanel-top__divider" role="separator" aria-orientation="horizontal" />
      </div>

      <div className="nav-group">
        {filteredOptions.map((opt) => {
          const draft = optionMetaById?.[opt.id];
          const displayName = draft?.name ?? opt.name;
          const displayDescription = draft?.description ?? opt.description ?? "";
          return (
            <div
              key={opt.id}
              className={`nav-item ${selectedOptionId === opt.id ? "active" : ""}`}
              role="button"
              tabIndex={0}
              aria-current={selectedOptionId === opt.id ? "page" : undefined}
              title={displayName || opt.name}
              onClick={() => onSelectOption(opt.id)}
              onKeyDown={(event) => handleKeyDown(event, opt.id)}
            >
              <span className="nav-item__label">{displayName}</span>
              <div className="nav-item__actions">
                {!opt.isActive && <span className="nav-badge">Inactive</span>}
                {onOptionMetaChange && (
                  <SidePanelEditPopover
                    entityLabel="option"
                    name={displayName}
                    description={displayDescription}
                    onChange={(payload) => onOptionMetaChange(opt.id, payload)}
                    onRequestOpen={
                      onRequestEditOption ? () => onRequestEditOption(opt.id) : undefined
                    }
                  />
                )}
              </div>
            </div>
          );
        })}
        {!filteredOptions.length && (
          <div className="nav-item nav-item--disabled" aria-disabled="true">
            <span className="nav-item__label">No options yet</span>
          </div>
        )}
      </div>
    </div>
  );
}
