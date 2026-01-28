import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type SegmentedPillOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type Props = {
  value: string;
  options: SegmentedPillOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  showCheck?: boolean;
};

export function SegmentedPill({
  value,
  options,
  onChange,
  disabled = false,
  className,
  showCheck = true,
}: Props) {
  return (
    <div
      className={cn("segmented-pill", className)}
      role="group"
      aria-disabled={disabled}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              "segmented-pill__btn",
              isActive && "is-active"
            )}
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            disabled={disabled || option.disabled}
          >
            {showCheck && isActive ? (
              <Check className="segmented-pill__check" />
            ) : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
