import { SaveIcon } from "lucide-react";
import { ToolbarButton } from "../ui/ToolbarButton";

type Props = {
  saveDisabled: boolean;
  onSave: () => void;
};

export function VariablesObjectToolbar({ saveDisabled, onSave }: Props) {
  return (
    <ToolbarButton
      title="Save changes"
      onClick={onSave}
      disabled={saveDisabled}
      icon={<SaveIcon size={14} />}
      label="Save"
    />
  );
}
