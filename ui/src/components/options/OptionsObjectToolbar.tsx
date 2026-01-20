import { SaveIcon, Trash } from "lucide-react";
import { ToolbarButton, ToolbarDivider } from "../ui/ToolbarButton";

type Props = {
  controlsDisabled: boolean;
  saveDisabled: boolean;
  deleteDisabled: boolean;

  onSave: () => void;
  onDelete: () => void;
};

export function OptionsObjectToolbar({
  controlsDisabled,
  saveDisabled,
  deleteDisabled,
  onSave,
  onDelete,
}: Props) {
  return (
    <>
      <ToolbarButton
        title="Save changes"
        onClick={onSave}
        disabled={saveDisabled}
        icon={<SaveIcon size={14} />}
        label="Save"
      />

      <ToolbarDivider />

      <ToolbarButton
        title="Deactivate option"
        onClick={onDelete}
        disabled={deleteDisabled || controlsDisabled}
        icon={<Trash size={14} />}
        label="Deactivate"
      />
    </>
  );
}
