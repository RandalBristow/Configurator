import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Option, OptionType } from "../../types/domain";
import { optionsApi } from "../../api/entities";
import { useResizableSidePanel } from "../../hooks/useResizableSidePanel";
import { useTabToolbar } from "../../layout/TabToolbarContext";
import { ConfirmDialog } from "../../components/dialogs/ConfirmDialog";
import { OptionsObjectToolbar } from "../../components/options/OptionsObjectToolbar";
import { OptionsDetailsPane } from "../../components/options/OptionsDetailsPane";
import { OptionVariablesPanel } from "../../components/options/OptionVariablesPanel";
import { WorkspaceShell } from "../../components/workspace/WorkspaceShell";
import { FormDesignerHost } from "../design/form-designer/FormDesignerHost";
import { useVariablesManager } from "../variables/hooks/useVariablesManager";

type Props = {
  optionType: OptionType;
  optionId?: string;
  options: Option[];
  onSelectOption: (id?: string, optionType?: OptionType) => void;
  metaDraft?: { name: string; description: string };
  onMetaDraftChange?: (draft: { name: string; description: string }) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

export function OptionsSection({
  optionType,
  optionId,
  options,
  onSelectOption,
  metaDraft,
  onMetaDraftChange,
  onDirtyChange,
}: Props) {
  const qc = useQueryClient();
  const { setLeftToolbar } = useTabToolbar();
  const [currentOptionId, setCurrentOptionId] = useState<string | undefined>(optionId);

  const [internalName, setInternalName] = useState("");
  const [internalDescription, setInternalDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [designerDirty, setDesignerDirty] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description?: string;
    onConfirm: () => void;
  } | null>(null);

  const confirm = (options: { title: string; description?: string; onConfirm: () => void }) =>
    setConfirmDialog({ open: true, ...options });

  const {
    panelSize,
    splitterSize,
    onSplitterMouseDown,
  } = useResizableSidePanel({ storageKeyBase: "options", enableCollapse: false });

  const variablesManager = useVariablesManager({
    optionId: currentOptionId,
    enabled: Boolean(currentOptionId),
    toastOnSave: false,
    toastOnError: false,
    onScopeChangedKey: currentOptionId ?? "none",
  });

  useEffect(() => {
    setCurrentOptionId(optionId);
  }, [optionId]);

  const currentOption = useMemo(
    () => options.find((opt) => opt.id === currentOptionId),
    [options, currentOptionId],
  );

  useEffect(() => {
    if (currentOption) {
      if (metaDraft && onMetaDraftChange) return;
      setInternalName(currentOption.name ?? "");
      setInternalDescription(currentOption.description ?? "");
      setIsActive(currentOption.isActive ?? true);
      return;
    }
    if (!metaDraft || !onMetaDraftChange) {
      setInternalName("");
      setInternalDescription("");
    }
    setIsActive(true);
  }, [currentOption, metaDraft, onMetaDraftChange]);

  useEffect(() => {
    if (!currentOption || !onMetaDraftChange || metaDraft) return;
    onMetaDraftChange({
      name: currentOption.name ?? "",
      description: currentOption.description ?? "",
    });
  }, [currentOption, metaDraft, onMetaDraftChange]);

  const name = metaDraft?.name ?? internalName;
  const description = metaDraft?.description ?? internalDescription;

  const handleNameChange = (value: string) => {
    if (onMetaDraftChange) {
      onMetaDraftChange({ name: value, description });
      return;
    }
    setInternalName(value);
  };

  const handleDescriptionChange = (value: string) => {
    if (onMetaDraftChange) {
      onMetaDraftChange({ name, description: value });
      return;
    }
    setInternalDescription(value);
  };

  const metaDirty = currentOption
    ? currentOption.name !== name ||
      (currentOption.description ?? "") !== description ||
      currentOption.isActive !== isActive
    : Boolean(name.trim() || description.trim());
  const variablesDirty = variablesManager.hasChanges;

  useEffect(() => {
    const hasUnsaved = metaDirty || designerDirty || variablesDirty;
    onDirtyChange?.(hasUnsaved);
    return () => onDirtyChange?.(false);
  }, [metaDirty, designerDirty, variablesDirty, onDirtyChange]);

  const showDesigner = optionType === "configured";

  useEffect(() => {
    if (!showDesigner) setDesignerDirty(false);
  }, [showDesigner]);

  const updateOption = useMutation({
    mutationFn: (data: { id: string; payload: Partial<Option> }) =>
      optionsApi.update(data.id, data.payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["options"] }),
  });

  const deleteOption = useMutation({
    mutationFn: (id: string) => optionsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["options"] }),
  });
  const isSaving = updateOption.isPending || variablesManager.isSaving;

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      if (!currentOptionId) {
        toast.error("Select an option first.");
        return;
      }
      if (metaDirty) {
        const payload: Partial<Option> = {
          name: name.trim(),
          description: description.trim() ? description.trim() : null,
          isActive,
          optionType,
        };
        await updateOption.mutateAsync({ id: currentOptionId, payload });
      }
      if (variablesManager.hasChanges) {
        await variablesManager.persist();
      }
      if (!metaDirty && !variablesManager.hasChanges) return;
      toast.success("Changes saved");
    } catch (err) {
      toast.error(`Save failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDelete = () => {
    if (!currentOptionId) return;
    const title = currentOption?.name?.trim() ? `Deactivate "${currentOption.name}"?` : "Deactivate option?";
    confirm({
      title,
      description: "You can reactivate it later.",
      onConfirm: async () => {
        try {
          await deleteOption.mutateAsync(currentOptionId);
          setCurrentOptionId(undefined);
          onSelectOption(undefined, optionType);
          toast.success("Option deactivated");
        } catch (err) {
          toast.error(`Deactivate failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    });
  };

  const handleFocusSelectAll = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();
  const optionDetails = {
    name,
    description,
    isActive,
    optionType,
    disabled: !currentOptionId,
    onChangeName: handleNameChange,
    onChangeDescription: handleDescriptionChange,
    onChangeIsActive: (value: boolean) => setIsActive(value),
    onFocusSelectAll: handleFocusSelectAll,
  };

  const leftActionsRef = useRef({
    onSave: handleSave,
    onDelete: handleDelete,
  });

  leftActionsRef.current = {
    onSave: handleSave,
    onDelete: handleDelete,
  };

  const onSave = useCallback(() => leftActionsRef.current.onSave(), []);
  const onDelete = useCallback(() => leftActionsRef.current.onDelete(), []);

  const leftToolbarNode = useMemo(
    () => (
      <OptionsObjectToolbar
        controlsDisabled={isSaving}
        saveDisabled={!name.trim() || isSaving}
        deleteDisabled={!currentOptionId}
        onSave={onSave}
        onDelete={onDelete}
      />
    ),
    [name, currentOptionId, isSaving, onSave, onDelete],
  );

  useEffect(() => {
    setLeftToolbar(leftToolbarNode);
    return () => setLeftToolbar(null);
  }, [setLeftToolbar, leftToolbarNode]);

  return (
    <WorkspaceShell
      panelSize={panelSize}
      splitterSize={splitterSize}
      onSplitterMouseDown={onSplitterMouseDown}
      main={
        showDesigner ? (
          <div className="options-workspace">
            <FormDesignerHost
              optionId={currentOptionId}
              onDirtyChange={setDesignerDirty}
              optionDetails={optionDetails}
              optionVariables={variablesManager}
            />
          </div>
        ) : (
          <div className="options-workspace">
            <div className="card options-details-card full-height">
              <div className="options-details-card__title">Option Details</div>
              {currentOptionId ? (
                <>
                  <OptionsDetailsPane {...optionDetails} />
                  <OptionVariablesPanel manager={variablesManager} disabled={!currentOptionId} />
                </>
              ) : (
                <div className="muted small">Select an option to edit its metadata.</div>
              )}
            </div>
          </div>
        )
      }
    >
      {confirmDialog && (
        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.title}
          description={confirmDialog.description}
          onOpenChange={(open) => {
            if (!open) setConfirmDialog(null);
          }}
          onConfirm={() => {
            const action = confirmDialog.onConfirm;
            setConfirmDialog(null);
            action();
          }}
        />
      )}
    </WorkspaceShell>
  );
}
