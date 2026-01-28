import {
  ChakraProvider,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Eye, SaveIcon, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { optionsApi } from "../../../api/entities";
import type { Option } from "../../../types/domain";
import type { DesignerFormDefinition } from "../../../types/designer";
import { useDesignerStore } from "../../../stores/designerStore";
import { ToolbarButton, ToolbarDivider } from "../../../components/ui/ToolbarButton";
import type { OptionsDetailsPaneProps } from "../../../components/options/OptionsDetailsPane";
import type { VariablesManager } from "../../variables/hooks/useVariablesManager";
import { FormDesigner } from "./FormDesigner";
import { FormDesignerPreview } from "./FormDesignerPreview";
import { DesignerArrangeToolbar } from "./DesignerArrangeToolbar";
import { DesignerCollectionEditorHost } from "./DesignerCollectionEditorHost";
import theme from "./chakraTheme";
import "./formDesigner.css";

type Props = {
  optionId?: string;
  onDirtyChange?: (dirty: boolean) => void;
  optionDetails?: OptionsDetailsPaneProps;
  optionVariables?: VariablesManager;
};

const DEFAULT_FORM_DEFINITION: DesignerFormDefinition = {
  version: 1,
  components: [],
  canvasSize: { width: 800, height: 600 },
  zoom: 1,
};

const normalizeDefinition = (
  definition?: Option["formDraft"] | null,
): DesignerFormDefinition | null => {
  if (!definition || typeof definition !== "object") return null;
  const typed = definition as NonNullable<Option["formDraft"]>;
  if (!Array.isArray(typed.components)) return null;
  return {
    version: 1,
    components: typed.components ?? [],
    canvasSize: typed.canvasSize ?? { width: 800, height: 600 },
    zoom: typeof typed.zoom === "number" ? typed.zoom : 1,
  };
};

const cloneDefinition = (definition: DesignerFormDefinition) => {
  const serialized = JSON.stringify(definition);
  return JSON.parse(serialized) as DesignerFormDefinition;
};

export function FormDesignerHost({
  optionId,
  onDirtyChange,
  optionDetails,
  optionVariables,
}: Props) {
  const qc = useQueryClient();
  const loadFormDefinition = useDesignerStore((state) => state.loadFormDefinition);
  const getFormDefinition = useDesignerStore((state) => state.getFormDefinition);
  const components = useDesignerStore((state) => state.components);
  const canvasSize = useDesignerStore((state) => state.canvasSize);
  const zoom = useDesignerStore((state) => state.zoom);
  const panelLayout = useDesignerStore((state) => state.panelLayout);
  const [baselineDefinition, setBaselineDefinition] = useState<DesignerFormDefinition | null>(
    null,
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const optionQuery = useQuery({
    queryKey: ["options", optionId],
    queryFn: () => optionsApi.get(optionId!),
    enabled: Boolean(optionId),
  });

  const option = optionId ? optionQuery.data : undefined;
  const canDesign = option?.optionType === "configured";

  const saveDraft = useMutation({
    mutationFn: (data: Option["formDraft"]) =>
      optionId ? optionsApi.update(optionId, { formDraft: data }) : Promise.reject(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["options"] });
      toast.success("Draft saved");
    },
    onError: (err) => {
      toast.error(`Draft save failed: ${err instanceof Error ? err.message : String(err)}`);
    },
  });

  const publish = useMutation({
    mutationFn: (data: Option["formPublished"]) =>
      optionId ? optionsApi.update(optionId, { formPublished: data }) : Promise.reject(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["options"] });
      toast.success("Published");
    },
    onError: (err) => {
      toast.error(`Publish failed: ${err instanceof Error ? err.message : String(err)}`);
    },
  });

  const handleSaveDraft = () => {
    if (!optionId || !canDesign) return;
    const definition = getFormDefinition();
    saveDraft.mutate(definition);
  };

  const handlePublish = () => {
    if (!optionId || !canDesign) return;
    const definition = getFormDefinition();
    publish.mutate(definition);
  };

  const handleOpenPreview = () => {
    if (!canDesign) return;
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
  };

  useEffect(() => {
    if (!optionId) {
      loadFormDefinition(null);
      setBaselineDefinition(null);
      return;
    }
    if (!option) {
      setBaselineDefinition(null);
      return;
    }
    const nextDefinition =
      normalizeDefinition(option.formDraft) ??
      normalizeDefinition(option.formPublished) ??
      DEFAULT_FORM_DEFINITION;
    loadFormDefinition(cloneDefinition(nextDefinition));
    setBaselineDefinition(cloneDefinition(nextDefinition));
  }, [optionId, option, loadFormDefinition]);

  const currentDefinition = useMemo<DesignerFormDefinition>(
    () => ({ version: 1, components, canvasSize, zoom }),
    [components, canvasSize, zoom],
  );

  const baselineJson = useMemo(
    () => (baselineDefinition ? JSON.stringify(baselineDefinition) : null),
    [baselineDefinition],
  );

  const currentJson = useMemo(() => JSON.stringify(currentDefinition), [currentDefinition]);

  useEffect(() => {
    if (!onDirtyChange) return;
    if (!optionId || !canDesign || !baselineJson) {
      onDirtyChange(false);
      return;
    }
    onDirtyChange(currentJson !== baselineJson);
  }, [onDirtyChange, optionId, canDesign, baselineJson, currentJson]);

  return (
    <ChakraProvider theme={theme}>
      <div className="form-designer-host form-designer-shell">
        <div
          className="form-designer-toolbar"
          style={
            {
              "--designer-toolbar-left": `${panelLayout.toolbox}%`,
              "--designer-toolbar-center": `${panelLayout.canvas}%`,
              "--designer-toolbar-right": `${panelLayout.properties}%`,
            } as CSSProperties
          }
        >
          <div className="form-designer-toolbar__left">
            <div className="form-designer-toolbar__title">
              Form Designer
              {option?.name && (
                <span className="form-designer-toolbar__option">{option.name}</span>
              )}
            </div>
          </div>

          {canDesign ? <DesignerArrangeToolbar /> : <div />}

          <div className="form-designer-toolbar__right">
            <div className="form-designer-toolbar__actions">
              <ToolbarButton
                title="Save draft"
                onClick={handleSaveDraft}
                disabled={!canDesign || saveDraft.isPending}
                icon={<SaveIcon size={14} />}
                label="Save Draft"
              />
              <ToolbarButton
                title="Preview form"
                onClick={handleOpenPreview}
                disabled={!canDesign}
                icon={<Eye size={14} />}
                label="Preview"
              />
              <ToolbarDivider />
              <ToolbarButton
                title="Publish current draft"
                onClick={handlePublish}
                disabled={!canDesign || publish.isPending}
                icon={<UploadCloud size={14} />}
                label="Publish"
              />
            </div>
          </div>
        </div>

        <div className="form-designer-body">
          {!optionId ? (
            <div className="card form-designer-placeholder">
              <h2>Select an option</h2>
              <div className="muted">Choose an option from the left panel or create a new one.</div>
            </div>
          ) : optionQuery.isLoading ? (
            <div className="card form-designer-placeholder">
              <h2>Loading option...</h2>
              <div className="muted">Preparing the form designer.</div>
            </div>
          ) : optionQuery.isError ? (
            <div className="card form-designer-placeholder">
              <h2>Unable to load option</h2>
              <div className="error">{String(optionQuery.error)}</div>
            </div>
          ) : !canDesign ? (
            <div className="card form-designer-placeholder">
              <h2>Simple option</h2>
              <div className="muted">Simple options do not use the form designer. Use the details panel instead.</div>
            </div>
          ) : (
            <FormDesigner optionDetails={optionDetails} optionVariables={optionVariables} />
          )}
        </div>
      </div>

      {canDesign ? <DesignerCollectionEditorHost /> : null}

      <Modal isOpen={isPreviewOpen} onClose={handleClosePreview} size="full">
        <ModalOverlay />
        <ModalContent className="form-designer-preview">
          <ModalHeader className="form-designer-preview__header">
            Form Preview
            {option?.name && (
              <span className="form-designer-preview__option">
                {option.name}
              </span>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody className="form-designer-preview__body">
            <FormDesignerPreview />
          </ModalBody>
        </ModalContent>
      </Modal>
    </ChakraProvider>
  );
}
