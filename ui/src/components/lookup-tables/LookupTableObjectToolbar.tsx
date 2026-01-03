import { ListPlus, SaveIcon, Trash, X } from "lucide-react";
import { ToolbarButton, ToolbarDivider } from "../ui/ToolbarButton";

type Props = {
  isCreatingNew: boolean;
  controlsDisabled: boolean;
  saveDisabled: boolean;
  deleteDisabled: boolean;

  onNew: () => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
};

export function LookupTableObjectToolbar({
  isCreatingNew,
  controlsDisabled,
  saveDisabled,
  deleteDisabled,
  onNew,
  onCancel,
  onSave,
  onDelete,
}: Props) {
  return (
    <>
      <ToolbarButton
        title={isCreatingNew ? "Cancel new lookup table" : "New lookup table"}
        onClick={isCreatingNew ? onCancel : onNew}
        disabled={controlsDisabled && !isCreatingNew}
        icon={isCreatingNew ? <X size={14} /> : <ListPlus size={14} />}
        label={isCreatingNew ? "Cancel" : "New"}
      />

      <ToolbarButton
        title="Save changes"
        onClick={onSave}
        disabled={saveDisabled}
        icon={<SaveIcon size={14} />}
        label="Save"
      />

      <ToolbarDivider />

      <ToolbarButton
        title="Delete current lookup table"
        onClick={onDelete}
        disabled={deleteDisabled || controlsDisabled}
        icon={<Trash size={14} />}
        label="Delete"
      />
    </>
  );
}
