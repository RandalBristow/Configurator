// @ts-nocheck
import React from "react";
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useDesignerStore } from "@/stores/designerStore";
import { Input } from "@/components/ui/input";

const generateId = () => Math.random().toString(36).slice(2, 9);

const normalizeTabs = (tabs) =>
  Array.isArray(tabs)
    ? tabs.map((tab) => ({
        id: String(tab.id ?? generateId()),
        label: typeof tab.label === "string" ? tab.label : "",
        hidden: tab.hidden === true,
        disabled: tab.disabled === true,
        children: Array.isArray(tab.children) ? tab.children : [],
      }))
    : [];

const normalizePanels = (panels) =>
  Array.isArray(panels)
    ? panels.map((panel) => ({
        ...panel,
        id: String(panel.id ?? generateId()),
        title: typeof panel.title === "string" ? panel.title : "",
        children: Array.isArray(panel.children) ? panel.children : [],
      }))
    : [];

const normalizeSteps = (steps) =>
  Array.isArray(steps)
    ? steps.map((step) => ({
        ...step,
        id: String(step.id ?? generateId()),
        title: typeof step.title === "string" ? step.title : "",
        children: Array.isArray(step.children) ? step.children : [],
      }))
    : [];

export function DesignerCollectionEditorHost() {
  const collectionEditor = useDesignerStore((state) => state.collectionEditor);
  const closeCollectionEditor = useDesignerStore(
    (state) => state.closeCollectionEditor
  );
  const updateComponent = useDesignerStore((state) => state.updateComponent);
  const getComponentById = useDesignerStore((state) => state.getComponentById);

  const isOpen = Boolean(collectionEditor);
  const editorKind = collectionEditor?.kind ?? null;
  const componentId = collectionEditor?.componentId ?? null;
  const component = componentId ? getComponentById(componentId) : null;

  const [draftTabs, setDraftTabs] = React.useState([]);
  const [selectedTabId, setSelectedTabId] = React.useState(null);
  const [draftPanels, setDraftPanels] = React.useState([]);
  const [selectedPanelId, setSelectedPanelId] = React.useState(null);
  const [draftSteps, setDraftSteps] = React.useState([]);
  const [selectedStepId, setSelectedStepId] = React.useState(null);

  React.useEffect(() => {
    if (!collectionEditor) return;
    const parent = getComponentById(collectionEditor.componentId);
    if (!parent) return;
    if (collectionEditor.kind === "tabPages") {
      const tabs = normalizeTabs(parent.properties?.tabs);
      setDraftTabs(tabs);
      setSelectedTabId(tabs[0]?.id ?? null);
    }
    if (collectionEditor.kind === "accordionPanels") {
      const panels = normalizePanels(parent.properties?.panels);
      setDraftPanels(panels);
      setSelectedPanelId(panels[0]?.id ?? null);
    }
    if (collectionEditor.kind === "stepperSteps") {
      const steps = normalizeSteps(parent.properties?.steps);
      setDraftSteps(steps);
      setSelectedStepId(steps[0]?.id ?? null);
    }
  }, [collectionEditor, getComponentById]);

  React.useEffect(() => {
    if (!collectionEditor) return;
    if (collectionEditor.kind !== "tabPages") return;
    if (draftTabs.length === 0) {
      setSelectedTabId(null);
      return;
    }
    if (!draftTabs.some((tab) => tab.id === selectedTabId)) {
      setSelectedTabId(draftTabs[0]?.id ?? null);
    }
  }, [collectionEditor, draftTabs, selectedTabId]);

  React.useEffect(() => {
    if (!collectionEditor) return;
    if (collectionEditor.kind !== "accordionPanels") return;
    if (draftPanels.length === 0) {
      setSelectedPanelId(null);
      return;
    }
    if (!draftPanels.some((panel) => panel.id === selectedPanelId)) {
      setSelectedPanelId(draftPanels[0]?.id ?? null);
    }
  }, [collectionEditor, draftPanels, selectedPanelId]);

  React.useEffect(() => {
    if (!collectionEditor) return;
    if (collectionEditor.kind !== "stepperSteps") return;
    if (draftSteps.length === 0) {
      setSelectedStepId(null);
      return;
    }
    if (!draftSteps.some((step) => step.id === selectedStepId)) {
      setSelectedStepId(draftSteps[0]?.id ?? null);
    }
  }, [collectionEditor, draftSteps, selectedStepId]);

  const selectedTab = draftTabs.find((tab) => tab.id === selectedTabId) ?? null;
  const selectedPanel =
    draftPanels.find((panel) => panel.id === selectedPanelId) ?? null;
  const selectedStep =
    draftSteps.find((step) => step.id === selectedStepId) ?? null;

  const updateSelectedTab = (updates) => {
    if (!selectedTab) return;
    setDraftTabs((current) =>
      current.map((tab) => (tab.id === selectedTab.id ? { ...tab, ...updates } : tab))
    );
  };

  const handleAddTab = () => {
    const nextId = generateId();
    const next = {
      id: nextId,
      label: `Tab ${draftTabs.length + 1}`,
      hidden: false,
      disabled: false,
      children: [],
    };
    setDraftTabs((current) => [...current, next]);
    setSelectedTabId(nextId);
  };

  const handleRemoveTab = () => {
    if (!selectedTab) return;
    setDraftTabs((current) => current.filter((tab) => tab.id !== selectedTab.id));
  };

  const moveSelectedTab = (direction) => {
    if (!selectedTab) return;
    setDraftTabs((current) => {
      const index = current.findIndex((tab) => tab.id === selectedTab.id);
      if (index < 0) return current;
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  };

  const updateSelectedPanel = (updates) => {
    if (!selectedPanel) return;
    setDraftPanels((current) =>
      current.map((panel) =>
        panel.id === selectedPanel.id ? { ...panel, ...updates } : panel
      )
    );
  };

  const handleAddPanel = () => {
    const nextId = generateId();
    const next = {
      id: nextId,
      title: `Panel ${draftPanels.length + 1}`,
      children: [],
    };
    setDraftPanels((current) => [...current, next]);
    setSelectedPanelId(nextId);
  };

  const handleRemovePanel = () => {
    if (!selectedPanel) return;
    setDraftPanels((current) =>
      current.filter((panel) => panel.id !== selectedPanel.id)
    );
  };

  const moveSelectedPanel = (direction) => {
    if (!selectedPanel) return;
    setDraftPanels((current) => {
      const index = current.findIndex((panel) => panel.id === selectedPanel.id);
      if (index < 0) return current;
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  };

  const updateSelectedStep = (updates) => {
    if (!selectedStep) return;
    setDraftSteps((current) =>
      current.map((step) =>
        step.id === selectedStep.id ? { ...step, ...updates } : step
      )
    );
  };

  const handleAddStep = () => {
    const nextId = generateId();
    const next = {
      id: nextId,
      title: `Step ${draftSteps.length + 1}`,
      children: [],
    };
    setDraftSteps((current) => [...current, next]);
    setSelectedStepId(nextId);
  };

  const handleRemoveStep = () => {
    if (!selectedStep) return;
    setDraftSteps((current) =>
      current.filter((step) => step.id !== selectedStep.id)
    );
  };

  const moveSelectedStep = (direction) => {
    if (!selectedStep) return;
    setDraftSteps((current) => {
      const index = current.findIndex((step) => step.id === selectedStep.id);
      if (index < 0) return current;
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  };

  const handleCancel = () => {
    closeCollectionEditor();
  };

  const handleOk = () => {
    if (!collectionEditor) return;
    const parent = getComponentById(collectionEditor.componentId);
    if (!parent) {
      closeCollectionEditor();
      return;
    }
    if (collectionEditor.kind === "tabPages") {
      // Commit the edited tab collection back onto the component.
      updateComponent(parent.id, {
        properties: { ...parent.properties, tabs: draftTabs },
      });
    }
    if (collectionEditor.kind === "accordionPanels") {
      updateComponent(parent.id, {
        properties: { ...parent.properties, panels: draftPanels },
      });
    }
    if (collectionEditor.kind === "stepperSteps") {
      updateComponent(parent.id, {
        properties: { ...parent.properties, steps: draftSteps },
      });
    }
    closeCollectionEditor();
  };

  if (!isOpen) return null;

  const title =
    editorKind === "tabPages"
      ? "Tab Page Collection Editor"
      : editorKind === "accordionPanels"
        ? "Accordion Panel Collection Editor"
        : editorKind === "stepperSteps"
          ? "Step Collection Editor"
      : "Collection Editor";
  const isTabsEditor = editorKind === "tabPages" && component?.type === "Page";
  const isAccordionEditor =
    editorKind === "accordionPanels" && component?.type === "Accordion";
  const isStepperEditor =
    editorKind === "stepperSteps" && component?.type === "MultiInstanceStepper";

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} size="4xl" isCentered>
      <ModalOverlay bg="rgba(15, 23, 42, 0.35)" backdropFilter="blur(2px)" />
      <ModalContent className="designer-collection-editor__modal" p={0}>
        <ModalHeader className="designer-collection-editor__header" p={0}>
          {title}
        </ModalHeader>
        <ModalCloseButton className="designer-collection-editor__close" />
        <ModalBody className="designer-collection-editor__body" p={0}>
          {isTabsEditor ? (
            <div className="designer-collection-editor">
              <div className="designer-collection-editor__columns">
                <div className="designer-collection-editor__members">
                  <div className="designer-collection-editor__members-header">
                    <div className="designer-collection-editor__members-title">
                      Members:
                    </div>
                    <div className="designer-collection-editor__members-move">
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => moveSelectedTab("up")}
                        disabled={
                          !selectedTab ||
                          draftTabs.findIndex((tab) => tab.id === selectedTab.id) === 0
                        }
                        title="Move up"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => moveSelectedTab("down")}
                        disabled={
                          !selectedTab ||
                          draftTabs.findIndex((tab) => tab.id === selectedTab.id) ===
                            draftTabs.length - 1
                        }
                        title="Move down"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="designer-collection-editor__list">
                    {draftTabs.length === 0 ? (
                      <div className="designer-collection-editor__empty">
                        No tabs yet.
                      </div>
                    ) : (
                      draftTabs.map((tab, index) => (
                        <button
                          key={tab.id}
                          type="button"
                          className={`designer-collection-editor__item${
                            tab.id === selectedTabId ? " is-selected" : ""
                          }`}
                          onClick={() => setSelectedTabId(tab.id)}
                          title={tab.id}
                        >
                          <span className="designer-collection-editor__index">
                            {index}
                          </span>
                          <span className="designer-collection-editor__name">
                            {tab.label?.trim() ? tab.label : tab.id}
                          </span>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="designer-collection-editor__members-actions">
                    <button
                      type="button"
                      onClick={handleAddTab}
                      className="designer-collection-editor__btn designer-collection-editor__btn--outline"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveTab}
                      disabled={!selectedTab}
                      className="designer-collection-editor__btn designer-collection-editor__btn--outline"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                </div>

                <div className="designer-collection-editor__properties">
                  <div className="designer-collection-editor__properties-title">
                    {selectedTab ? `${selectedTab.id} properties:` : "Tab properties"}
                  </div>

                  {selectedTab ? (
                    <div className="designer-collection-editor__properties-grid">
                      <div className="designer-collection-editor__row">
                        <div className="designer-collection-editor__label">
                          Label
                        </div>
                        <div className="designer-collection-editor__value">
                          <Input
                            value={selectedTab.label ?? ""}
                            onChange={(e) =>
                              updateSelectedTab({ label: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <label className="designer-collection-editor__checkbox">
                        <input
                          type="checkbox"
                          checked={selectedTab.hidden === true}
                          onChange={(e) =>
                            updateSelectedTab({ hidden: e.target.checked })
                          }
                        />
                        <span>Hidden</span>
                      </label>

                      <label className="designer-collection-editor__checkbox">
                        <input
                          type="checkbox"
                          checked={selectedTab.disabled === true}
                          onChange={(e) =>
                            updateSelectedTab({ disabled: e.target.checked })
                          }
                        />
                        <span>Disabled</span>
                      </label>
                    </div>
                  ) : (
                    <div className="designer-collection-editor__empty">
                      Select a tab to edit its properties.
                    </div>
                  )}
                </div>
              </div>

              <div className="designer-collection-editor__footer">
                <button
                  type="button"
                  onClick={handleOk}
                  className="designer-collection-editor__btn designer-collection-editor__btn--primary designer-collection-editor__footer-btn"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="designer-collection-editor__btn designer-collection-editor__btn--outline designer-collection-editor__footer-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : isAccordionEditor ? (
            <div className="designer-collection-editor">
              <div className="designer-collection-editor__columns">
                <div className="designer-collection-editor__members">
                  <div className="designer-collection-editor__members-header">
                    <div className="designer-collection-editor__members-title">
                      Members:
                    </div>
                    <div className="designer-collection-editor__members-move">
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => moveSelectedPanel("up")}
                        disabled={
                          !selectedPanel ||
                          draftPanels.findIndex(
                            (panel) => panel.id === selectedPanel.id
                          ) === 0
                        }
                        title="Move up"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => moveSelectedPanel("down")}
                        disabled={
                          !selectedPanel ||
                          draftPanels.findIndex(
                            (panel) => panel.id === selectedPanel.id
                          ) ===
                            draftPanels.length - 1
                        }
                        title="Move down"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="designer-collection-editor__list">
                    {draftPanels.length === 0 ? (
                      <div className="designer-collection-editor__empty">
                        No panels yet.
                      </div>
                    ) : (
                      draftPanels.map((panel, index) => (
                        <button
                          key={panel.id}
                          type="button"
                          className={`designer-collection-editor__item${
                            panel.id === selectedPanelId ? " is-selected" : ""
                          }`}
                          onClick={() => setSelectedPanelId(panel.id)}
                          title={panel.id}
                        >
                          <span className="designer-collection-editor__index">
                            {index}
                          </span>
                          <span className="designer-collection-editor__name">
                            {panel.title?.trim() ? panel.title : panel.id}
                          </span>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="designer-collection-editor__members-actions">
                    <button
                      type="button"
                      onClick={handleAddPanel}
                      className="designer-collection-editor__btn designer-collection-editor__btn--outline"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePanel}
                      disabled={!selectedPanel}
                      className="designer-collection-editor__btn designer-collection-editor__btn--outline"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                </div>

                <div className="designer-collection-editor__properties">
                  <div className="designer-collection-editor__properties-title">
                    {selectedPanel
                      ? `${selectedPanel.id} properties:`
                      : "Panel properties"}
                  </div>

                  {selectedPanel ? (
                    <div className="designer-collection-editor__properties-grid">
                      <div className="designer-collection-editor__row">
                        <div className="designer-collection-editor__label">
                          Title
                        </div>
                        <div className="designer-collection-editor__value">
                          <Input
                            value={selectedPanel.title ?? ""}
                            onChange={(e) =>
                              updateSelectedPanel({ title: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="designer-collection-editor__empty">
                      Select a panel to edit its properties.
                    </div>
                  )}
                </div>
              </div>

              <div className="designer-collection-editor__footer">
                <button
                  type="button"
                  onClick={handleOk}
                  className="designer-collection-editor__btn designer-collection-editor__btn--primary designer-collection-editor__footer-btn"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="designer-collection-editor__btn designer-collection-editor__btn--outline designer-collection-editor__footer-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : isStepperEditor ? (
            <div className="designer-collection-editor">
              <div className="designer-collection-editor__columns">
                <div className="designer-collection-editor__members">
                  <div className="designer-collection-editor__members-header">
                    <div className="designer-collection-editor__members-title">
                      Members:
                    </div>
                    <div className="designer-collection-editor__members-move">
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => moveSelectedStep("up")}
                        disabled={
                          !selectedStep ||
                          draftSteps.findIndex((step) => step.id === selectedStep.id) ===
                            0
                        }
                        title="Move up"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => moveSelectedStep("down")}
                        disabled={
                          !selectedStep ||
                          draftSteps.findIndex((step) => step.id === selectedStep.id) ===
                            draftSteps.length - 1
                        }
                        title="Move down"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="designer-collection-editor__list">
                    {draftSteps.length === 0 ? (
                      <div className="designer-collection-editor__empty">
                        No steps yet.
                      </div>
                    ) : (
                      draftSteps.map((step, index) => (
                        <button
                          key={step.id}
                          type="button"
                          className={`designer-collection-editor__item${
                            step.id === selectedStepId ? " is-selected" : ""
                          }`}
                          onClick={() => setSelectedStepId(step.id)}
                          title={step.id}
                        >
                          <span className="designer-collection-editor__index">
                            {index}
                          </span>
                          <span className="designer-collection-editor__name">
                            {step.title?.trim() ? step.title : step.id}
                          </span>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="designer-collection-editor__members-actions">
                    <button
                      type="button"
                      onClick={handleAddStep}
                      className="designer-collection-editor__btn designer-collection-editor__btn--outline"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveStep}
                      disabled={!selectedStep}
                      className="designer-collection-editor__btn designer-collection-editor__btn--outline"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                </div>

                <div className="designer-collection-editor__properties">
                  <div className="designer-collection-editor__properties-title">
                    {selectedStep
                      ? `${selectedStep.id} properties:`
                      : "Step properties"}
                  </div>

                  {selectedStep ? (
                    <div className="designer-collection-editor__properties-grid">
                      <div className="designer-collection-editor__row">
                        <div className="designer-collection-editor__label">
                          Title
                        </div>
                        <div className="designer-collection-editor__value">
                          <Input
                            value={selectedStep.title ?? ""}
                            onChange={(e) =>
                              updateSelectedStep({ title: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="designer-collection-editor__empty">
                      Select a step to edit its properties.
                    </div>
                  )}
                </div>
              </div>

              <div className="designer-collection-editor__footer">
                <button
                  type="button"
                  onClick={handleOk}
                  className="designer-collection-editor__btn designer-collection-editor__btn--primary designer-collection-editor__footer-btn"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="designer-collection-editor__btn designer-collection-editor__btn--outline designer-collection-editor__footer-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="designer-collection-editor__empty">
              No collection editor available.
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
