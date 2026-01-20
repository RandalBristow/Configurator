import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shell } from "./layout/Shell";
import { Header, type AppMode } from "./layout/Header";
import { MenuBar, type DataArea, type DesignArea } from "./layout/MenuBar";
import { Footer } from "./layout/Footer";
import { TabToolbarProvider, useTabToolbar } from "./layout/TabToolbarContext";
import { useResizableSidePanel } from "./hooks/useResizableSidePanel";
import { lookupTablesApi, optionsApi, selectListsApi } from "./api/entities";
import { LookupTablesSection } from "./features/lookup-tables/LookupTablesSection";
import { SelectListItemsSection } from "./features/lists/SelectListItemsSection";
import { SidePanelFilter } from "./components/nav/SidePanelFilter";
import { SidePanelCreatePopover } from "./components/nav/SidePanelCreatePopover";
import { SidePanelEditPopover } from "./components/nav/SidePanelEditPopover";
import { ConfirmDialog } from "./components/dialogs/ConfirmDialog";
import { OptionsSection } from "./features/options/OptionsSection";
import { OptionsSideNav } from "./components/options/OptionsSideNav";
import { RailNav, type RailItem } from "./components/nav/RailNav";
import { VariablesSection } from "./features/variables/VariablesSection";
import type { OptionType } from "./types/domain";
import {
  Braces,
  ChevronLeft,
  ChevronRight,
  Eye,
  ListChecks,
  Palette,
  Ruler,
  SlidersHorizontal,
  Table2,
} from "lucide-react";

export default function App() {
  return (
    <TabToolbarProvider>
      <AppInner />
    </TabToolbarProvider>
  );
}

function AppInner() {
  const [mode, setMode] = useState<AppMode>("data");
  const [dataArea, setDataArea] = useState<DataArea>("selectLists");
  const [designArea, setDesignArea] = useState<DesignArea>("options");

  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";
  const { leftToolbar, rightToolbar } = useTabToolbar();
  const queryClient = useQueryClient();

  const navPanel = useResizableSidePanel({
    storageKeyBase: "app.sidenav",
    side: "left",
    defaultWidth: 300,
    minWidth: 240,
    maxWidth: 420,
    collapsedWidth: 0,
    splitterSize: 6,
  });

  const [creatingNewList, setCreatingNewList] = useState(false);
  const [selectedSelectList, setSelectedSelectList] = useState<string | undefined>();
  const [selectListFilter, setSelectListFilter] = useState("");

  const [creatingNewLookupTable, setCreatingNewLookupTable] = useState(false);
  const [selectedLookupTable, setSelectedLookupTable] = useState<string | undefined>();
  const [lookupTableFilter, setLookupTableFilter] = useState("");

  const [optionTypeTab, setOptionTypeTab] = useState<OptionType>("simple");
  const [optionsFilter, setOptionsFilter] = useState("");
  const [selectedOptionByType, setSelectedOptionByType] = useState<
    Record<OptionType, string | undefined>
  >({
    simple: undefined,
    configured: undefined,
  });
  const [creatingOptionType, setCreatingOptionType] = useState<OptionType | null>(null);
  const [selectListMetaDrafts, setSelectListMetaDrafts] = useState<
    Record<string, { name: string; description: string }>
  >({});
  const [lookupTableMetaDrafts, setLookupTableMetaDrafts] = useState<
    Record<string, { name: string; description: string }>
  >({});
  const [optionMetaDrafts, setOptionMetaDrafts] = useState<
    Record<string, { name: string; description: string }>
  >({});

  const [selectListDirty, setSelectListDirty] = useState(false);
  const [lookupTableDirty, setLookupTableDirty] = useState(false);
  const [variablesDirty, setVariablesDirty] = useState(false);
  const [optionsDirty, setOptionsDirty] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  } | null>(null);
  const confirmHandledRef = useRef(false);

  const optionLists = useQuery({
    queryKey: ["select-lists"],
    queryFn: () => selectListsApi.list(),
    enabled: mode === "data",
  });

  const lookupTables = useQuery({
    queryKey: ["lookup-tables"],
    queryFn: () => lookupTablesApi.list(),
    enabled: mode === "data",
  });

  const showOptionsNav = mode === "design" && designArea === "options";

  const optionsQuery = useQuery({
    queryKey: ["options", optionTypeTab],
    queryFn: () => optionsApi.list(optionTypeTab, true),
    enabled: showOptionsNav,
  });

  useEffect(() => {
    const lists = optionLists.data ?? [];
    if (!lists.length) return;
    setSelectListMetaDrafts((prev) => {
      let changed = false;
      const next = { ...prev };
      lists.forEach((list) => {
        if (!next[list.id]) {
          next[list.id] = {
            name: list.name ?? "",
            description: list.description ?? "",
          };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [optionLists.data]);

  useEffect(() => {
    const tables = lookupTables.data ?? [];
    if (!tables.length) return;
    setLookupTableMetaDrafts((prev) => {
      let changed = false;
      const next = { ...prev };
      tables.forEach((table) => {
        if (!next[table.id]) {
          next[table.id] = {
            name: table.name ?? "",
            description: table.description ?? "",
          };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [lookupTables.data]);

  useEffect(() => {
    const options = optionsQuery.data ?? [];
    if (!options.length) return;
    setOptionMetaDrafts((prev) => {
      let changed = false;
      const next = { ...prev };
      options.forEach((opt) => {
        if (!next[opt.id]) {
          next[opt.id] = {
            name: opt.name ?? "",
            description: opt.description ?? "",
          };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [optionsQuery.data]);

  useEffect(() => {
    if (mode !== "data") return;
    if (dataArea !== "selectLists") return;
    if (creatingNewList) return;
    if (selectedSelectList) return;
    if ((optionLists.data?.length ?? 0) > 0) setSelectedSelectList(optionLists.data![0].id);
  }, [mode, dataArea, creatingNewList, selectedSelectList, optionLists.data]);

  const promptUnsavedChanges = (onConfirm: () => void, onCancel?: () => void) => {
    confirmHandledRef.current = false;
    setConfirmDialog({
      open: true,
      title: "Unsaved changes",
      description: "You have unsaved changes. Leaving now will discard them.",
      onConfirm,
      onCancel,
    });
  };

  const guardUnsavedChanges = (
    isDirty: boolean,
    onConfirm: () => void,
    onDiscard?: () => void,
  ) => {
    if (!isDirty) {
      onConfirm();
      return;
    }
    promptUnsavedChanges(() => {
      onDiscard?.();
      onConfirm();
    });
  };

  const confirmDiscardIfDirty = (isDirty: boolean, onDiscard?: () => void) => {
    if (!isDirty) return Promise.resolve(true);
    return new Promise<boolean>((resolve) => {
      promptUnsavedChanges(
        () => {
          onDiscard?.();
          resolve(true);
        },
        () => resolve(false),
      );
    });
  };

  const updateSelectListMetaDraft = (id: string, payload: { name: string; description: string }) => {
    setSelectListMetaDrafts((prev) => ({
      ...prev,
      [id]: { name: payload.name, description: payload.description },
    }));
  };

  const updateLookupTableMetaDraft = (id: string, payload: { name: string; description: string }) => {
    setLookupTableMetaDrafts((prev) => ({
      ...prev,
      [id]: { name: payload.name, description: payload.description },
    }));
  };

  const updateOptionMetaDraft = (id: string, payload: { name: string; description: string }) => {
    setOptionMetaDrafts((prev) => ({
      ...prev,
      [id]: { name: payload.name, description: payload.description },
    }));
  };

  const resetSelectListDraft = (id?: string) => {
    if (!id) return;
    const source = optionLists.data?.find((list) => list.id === id);
    if (!source) return;
    updateSelectListMetaDraft(id, {
      name: source.name ?? "",
      description: source.description ?? "",
    });
  };

  const resetLookupTableDraft = (id?: string) => {
    if (!id) return;
    const source = lookupTables.data?.find((table) => table.id === id);
    if (!source) return;
    updateLookupTableMetaDraft(id, {
      name: source.name ?? "",
      description: source.description ?? "",
    });
  };

  const resetOptionDraft = (id?: string) => {
    if (!id) return;
    const source = optionsQuery.data?.find((opt) => opt.id === id);
    if (!source) return;
    updateOptionMetaDraft(id, {
      name: source.name ?? "",
      description: source.description ?? "",
    });
  };

  const handleCreateSelectList = async (payload: { name: string; description?: string }) => {
    const shouldProceed = await confirmDiscardIfDirty(selectListDirty, () =>
      resetSelectListDraft(selectedSelectList),
    );
    if (!shouldProceed) return;
    try {
      const created = await selectListsApi.create({
        name: payload.name,
        description: payload.description ?? null,
      });
      await queryClient.invalidateQueries({ queryKey: ["select-lists"] });
      if (created?.id) {
        setSelectedSelectList(created.id);
        setCreatingNewList(false);
        setSelectListFilter("");
      }
      toast.success("Select list created");
    } catch (err) {
      toast.error(`Create failed: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  };

  const handleCreateLookupTable = async (payload: { name: string; description?: string }) => {
    const shouldProceed = await confirmDiscardIfDirty(lookupTableDirty, () =>
      resetLookupTableDraft(selectedLookupTable),
    );
    if (!shouldProceed) return;
    try {
      const created = await lookupTablesApi.create({
        name: payload.name,
        description: payload.description ?? null,
      });
      await queryClient.invalidateQueries({ queryKey: ["lookup-tables"] });
      if (created?.id) {
        setSelectedLookupTable(created.id);
        setCreatingNewLookupTable(false);
        setLookupTableFilter("");
      }
      toast.success("Lookup table created");
    } catch (err) {
      toast.error(`Create failed: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  };

  const handleCreateOption = async (payload: { name: string; description?: string }) => {
    const shouldProceed = await confirmDiscardIfDirty(optionsDirty, () =>
      resetOptionDraft(selectedOptionByType[optionTypeTab]),
    );
    if (!shouldProceed) return;
    try {
      const created = await optionsApi.create({
        name: payload.name,
        description: payload.description ?? null,
        optionType: optionTypeTab,
        isActive: true,
      });
      await queryClient.invalidateQueries({ queryKey: ["options", optionTypeTab] });
      if (created?.id) {
        setSelectedOptionByType((prev) => ({ ...prev, [optionTypeTab]: created.id }));
        setCreatingOptionType(null);
        setOptionsFilter("");
      }
      toast.success("Option created");
    } catch (err) {
      toast.error(`Create failed: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  };

  const requestSelectList = (id: string) => {
    if (id === selectedSelectList) return;
    guardUnsavedChanges(
      selectListDirty,
      () => {
        setCreatingNewList(false);
        setSelectedSelectList(id);
      },
      () => resetSelectListDraft(selectedSelectList),
    );
  };

  const requestSelectLookupTable = (id: string) => {
    if (id === selectedLookupTable) return;
    guardUnsavedChanges(
      lookupTableDirty,
      () => {
        setCreatingNewLookupTable(false);
        setSelectedLookupTable(id);
      },
      () => resetLookupTableDraft(selectedLookupTable),
    );
  };

  const requestSelectListForEdit = async (id: string) => {
    if (id === selectedSelectList) return true;
    const shouldProceed = await confirmDiscardIfDirty(selectListDirty, () =>
      resetSelectListDraft(selectedSelectList),
    );
    if (!shouldProceed) return false;
    setCreatingNewList(false);
    setSelectedSelectList(id);
    return true;
  };

  const requestSelectLookupTableForEdit = async (id: string) => {
    if (id === selectedLookupTable) return true;
    const shouldProceed = await confirmDiscardIfDirty(lookupTableDirty, () =>
      resetLookupTableDraft(selectedLookupTable),
    );
    if (!shouldProceed) return false;
    setCreatingNewLookupTable(false);
    setSelectedLookupTable(id);
    return true;
  };

  useEffect(() => {
    if (mode !== "data") return;
    if (dataArea !== "lookupTables") return;
    if (creatingNewLookupTable) return;
    if (selectedLookupTable) return;
    if ((lookupTables.data?.length ?? 0) > 0) setSelectedLookupTable(lookupTables.data![0].id);
  }, [mode, dataArea, creatingNewLookupTable, selectedLookupTable, lookupTables.data]);

  const selectedOptionId = selectedOptionByType[optionTypeTab];
  const isCreatingOption = creatingOptionType === optionTypeTab;

  useEffect(() => {
    if (!showOptionsNav) return;
    if (isCreatingOption) return;
    if (selectedOptionId) return;
    if ((optionsQuery.data?.length ?? 0) > 0) {
      setSelectedOptionByType((prev) => ({
        ...prev,
        [optionTypeTab]: optionsQuery.data![0].id,
      }));
    }
  }, [showOptionsNav, isCreatingOption, selectedOptionId, optionsQuery.data, optionTypeTab]);

  const applySelectOption = (id?: string, type: OptionType = optionTypeTab) => {
    setSelectedOptionByType((prev) => ({ ...prev, [type]: id }));
    setCreatingOptionType(id ? null : type);
  };

  const applyOptionTypeChange = (type: OptionType) => {
    setOptionTypeTab(type);
    if (creatingOptionType && creatingOptionType !== type) {
      setCreatingOptionType(null);
    }
  };

  const requestSelectOption = (id?: string, type: OptionType = optionTypeTab) => {
    if (id === selectedOptionByType[type]) return;
    guardUnsavedChanges(
      optionsDirty,
      () => applySelectOption(id, type),
      () => resetOptionDraft(selectedOptionByType[type]),
    );
  };

  const requestOptionTypeChange = (type: OptionType) => {
    if (type === optionTypeTab) return;
    guardUnsavedChanges(
      optionsDirty,
      () => applyOptionTypeChange(type),
      () => resetOptionDraft(selectedOptionByType[optionTypeTab]),
    );
  };

  const requestSelectOptionForEdit = async (id: string) => {
    if (id === selectedOptionByType[optionTypeTab]) return true;
    const shouldProceed = await confirmDiscardIfDirty(optionsDirty, () =>
      resetOptionDraft(selectedOptionByType[optionTypeTab]),
    );
    if (!shouldProceed) return false;
    applySelectOption(id, optionTypeTab);
    return true;
  };

  const railTopItem: RailItem = {
    type: "item",
    id: "variables",
    label: "Variables",
    icon: <Braces size={18} />,
  };

  const railItems: RailItem[] = [
    { type: "item", id: "selectLists", label: "Select lists", icon: <ListChecks size={18} /> },
    { type: "item", id: "lookupTables", label: "Lookup tables", icon: <Table2 size={18} /> },
    { type: "item", id: "ranges", label: "Ranges", icon: <Ruler size={18} />, disabled: true },
    { type: "separator", id: "rail-sep-data" },
    { type: "item", id: "options", label: "Options", icon: <SlidersHorizontal size={18} /> },
    { type: "item", id: "theme", label: "Theme", icon: <Palette size={18} />, disabled: true },
    { type: "separator", id: "rail-sep-design" },
    { type: "item", id: "preview", label: "Preview", icon: <Eye size={18} /> },
  ];

  const activeRailId =
    mode === "data" ? dataArea : mode === "design" ? designArea : "preview";

  const handleRailSelect = (id: string) => {
    const targets: Record<
      string,
      { mode: AppMode; area?: DataArea | DesignArea }
    > = {
      variables: { mode: "data", area: "variables" },
      selectLists: { mode: "data", area: "selectLists" },
      lookupTables: { mode: "data", area: "lookupTables" },
      ranges: { mode: "data", area: "ranges" },
      options: { mode: "design", area: "options" },
      theme: { mode: "design", area: "theme" },
      preview: { mode: "preview" },
    };

    const target = targets[id];
    if (!target) return;

    const isSame =
      (target.mode === "data" && mode === "data" && dataArea === target.area) ||
      (target.mode === "design" && mode === "design" && designArea === target.area) ||
      (target.mode === "preview" && mode === "preview");

    if (isSame) {
      if (target.mode !== "preview") {
        navPanel.setPanelCollapsed(!navPanel.panelCollapsed);
      }
      return;
    }

    const currentDirty =
      (mode === "data" && dataArea === "variables" && variablesDirty) ||
      (mode === "data" && dataArea === "selectLists" && selectListDirty) ||
      (mode === "data" && dataArea === "lookupTables" && lookupTableDirty) ||
      (mode === "design" && designArea === "options" && optionsDirty);

    const applyTarget = () => {
      if (target.mode === "data") {
        setMode("data");
        setDataArea(target.area as DataArea);
        navPanel.setPanelCollapsed(false);
        return;
      }
      if (target.mode === "design") {
        setMode("design");
        setDesignArea(target.area as DesignArea);
        navPanel.setPanelCollapsed(false);
        return;
      }
      setMode("preview");
    };

    const resetCurrentDraft = () => {
      if (mode === "data" && dataArea === "variables") {
        return;
      }
      if (mode === "data" && dataArea === "selectLists") {
        resetSelectListDraft(selectedSelectList);
        return;
      }
      if (mode === "data" && dataArea === "lookupTables") {
        resetLookupTableDraft(selectedLookupTable);
        return;
      }
      if (mode === "design" && designArea === "options") {
        resetOptionDraft(selectedOptionByType[optionTypeTab]);
      }
    };

    guardUnsavedChanges(currentDirty, applyTarget, resetCurrentDraft);
  };

  const handleNavItemKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    onSelect: () => void,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelect();
  };

  const railToggle = (
    <button
      type="button"
      className="rail-toggle"
      aria-label={navPanel.panelCollapsed ? "Expand panel" : "Collapse panel"}
      title={navPanel.panelCollapsed ? "Expand panel" : "Collapse panel"}
      onClick={() => navPanel.setPanelCollapsed(!navPanel.panelCollapsed)}
    >
      {navPanel.panelCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
    </button>
  );

  return (
    <>
      <Shell
        header={<Header apiBase={apiBase} />}
        menubar={
          <MenuBar
            mode={mode}
            dataArea={dataArea}
            onChangeDataArea={(area) => {
              setDataArea(area);
            }}
            designArea={designArea}
            onChangeDesignArea={setDesignArea}
            railToggle={railToggle}
            leftToolbar={leftToolbar}
            rightToolbar={rightToolbar}
          />
        }
        rail={
          <RailNav
            topItem={railTopItem}
            items={railItems}
            activeId={activeRailId}
            onSelect={handleRailSelect}
          />
        }
        railWidth={64}
        navCollapsed={navPanel.panelCollapsed}
        navSize={navPanel.panelSize}
        navSplitterSize={navPanel.panelCollapsed ? 0 : navPanel.splitterSize}
        onNavSplitterMouseDown={navPanel.panelCollapsed ? undefined : navPanel.onSplitterMouseDown}
        nav={
          mode === "data" ? (
            <nav className="side-nav">
              {dataArea === "variables" && (
                <div className="nav-section">
                  <div className="nav-label">Variables</div>
                  <div className="nav-group">
                    <div className="nav-item active" aria-current="page">
                      <span className="nav-item__label">Global variables</span>
                    </div>
                    <div className="muted small" style={{ marginTop: 6 }}>
                      Global variables are available across all options.
                    </div>
                  </div>
                </div>
              )}

              {dataArea === "selectLists" && (
              <div className="nav-section">
                <div className="sidepanel-top">
                  <SidePanelFilter
                    value={selectListFilter}
                    onChange={setSelectListFilter}
                    placeholder="Filter select lists"
                    action={
                      <SidePanelCreatePopover
                        entityLabel="select list"
                        onCreate={handleCreateSelectList}
                      />
                    }
                  />
                  <div className="sidepanel-top__divider" role="separator" aria-orientation="horizontal" />
                </div>
                <div className="nav-group">
                  {(optionLists.data ?? [])
                    .filter((l) => {
                      const label = selectListMetaDrafts[l.id]?.name ?? l.name;
                      const filterTerm = selectListFilter.trim().toLowerCase();
                      return filterTerm ? label.toLowerCase().includes(filterTerm) : true;
                    })
                    .map((l) => {
                      const draft = selectListMetaDrafts[l.id];
                      const displayName = draft?.name ?? l.name;
                      const displayDescription = draft?.description ?? l.description ?? "";
                      return (
                      <div
                        key={l.id}
                        className={`nav-item ${selectedSelectList === l.id ? "active" : ""}`}
                        role="button"
                        tabIndex={0}
                        aria-current={selectedSelectList === l.id ? "page" : undefined}
                        title={displayName || l.name}
                        onClick={() => requestSelectList(l.id)}
                        onKeyDown={(event) =>
                          handleNavItemKeyDown(event, () => requestSelectList(l.id))
                        }
                      >
                        <span className="nav-item__label">{displayName}</span>
                        <div className="nav-item__actions">
                          <SidePanelEditPopover
                            entityLabel="select list"
                            name={displayName}
                            description={displayDescription}
                            onChange={(payload) => updateSelectListMetaDraft(l.id, payload)}
                            onRequestOpen={() => requestSelectListForEdit(l.id)}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {!(optionLists.data ?? []).length && (
                    <div className="nav-item nav-item--disabled" aria-disabled="true">
                      <span className="nav-item__label">No lists yet</span>
                    </div>
                  )}
                </div>
              </div>
            )}

              {dataArea === "lookupTables" && (
              <div className="nav-section">
                <div className="sidepanel-top">
                  <SidePanelFilter
                    value={lookupTableFilter}
                    onChange={setLookupTableFilter}
                    placeholder="Filter lookup tables"
                    action={
                      <SidePanelCreatePopover
                        entityLabel="lookup table"
                        onCreate={handleCreateLookupTable}
                      />
                    }
                  />
                  <div className="sidepanel-top__divider" role="separator" aria-orientation="horizontal" />
                </div>
                <div className="nav-group">
                  {(lookupTables.data ?? [])
                    .filter((t) => {
                      const label = lookupTableMetaDrafts[t.id]?.name ?? t.name;
                      const filterTerm = lookupTableFilter.trim().toLowerCase();
                      return filterTerm ? label.toLowerCase().includes(filterTerm) : true;
                    })
                    .map((t) => {
                      const draft = lookupTableMetaDrafts[t.id];
                      const displayName = draft?.name ?? t.name;
                      const displayDescription = draft?.description ?? t.description ?? "";
                      return (
                      <div
                        key={t.id}
                        className={`nav-item ${selectedLookupTable === t.id ? "active" : ""}`}
                        role="button"
                        tabIndex={0}
                        aria-current={selectedLookupTable === t.id ? "page" : undefined}
                        title={displayName || t.name}
                        onClick={() => requestSelectLookupTable(t.id)}
                        onKeyDown={(event) =>
                          handleNavItemKeyDown(event, () => requestSelectLookupTable(t.id))
                        }
                      >
                        <span className="nav-item__label">{displayName}</span>
                        <div className="nav-item__actions">
                          <SidePanelEditPopover
                            entityLabel="lookup table"
                            name={displayName}
                            description={displayDescription}
                            onChange={(payload) => updateLookupTableMetaDraft(t.id, payload)}
                            onRequestOpen={() => requestSelectLookupTableForEdit(t.id)}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {!(lookupTables.data ?? []).length && (
                    <div className="nav-item nav-item--disabled" aria-disabled="true">
                      <span className="nav-item__label">No tables yet</span>
                    </div>
                  )}
                </div>
              </div>
            )}

              {dataArea === "ranges" && (
              <div className="nav-section">
                <div className="nav-label">Ranges</div>
                <button className="nav-link" type="button" disabled>
                  <span>Coming soon</span>
                  <span className="nav-badge">Soon</span>
                </button>
              </div>
            )}
            </nav>
          ) : showOptionsNav ? (
            <nav className="side-nav">
              <OptionsSideNav
                optionType={optionTypeTab}
                onChangeOptionType={requestOptionTypeChange}
                options={optionsQuery.data ?? []}
                selectedOptionId={selectedOptionId}
                filter={optionsFilter}
                onFilterChange={setOptionsFilter}
                onSelectOption={(id) => requestSelectOption(id, optionTypeTab)}
                onCreateOption={handleCreateOption}
                optionMetaById={optionMetaDrafts}
                onOptionMetaChange={updateOptionMetaDraft}
                onRequestEditOption={requestSelectOptionForEdit}
              />
            </nav>
          ) : undefined
        }
        footer={<Footer />}
      >
        {mode === "design" && designArea === "options" && (
          <OptionsSection
            key={optionTypeTab}
            optionType={optionTypeTab}
            optionId={selectedOptionId}
            options={optionsQuery.data ?? []}
            onSelectOption={applySelectOption}
            metaDraft={selectedOptionId ? optionMetaDrafts[selectedOptionId] : undefined}
            onMetaDraftChange={(payload) => {
              if (!selectedOptionId) return;
              updateOptionMetaDraft(selectedOptionId, payload);
            }}
            onDirtyChange={setOptionsDirty}
          />
        )}

        {mode === "design" && designArea === "theme" && (
          <div className="card">
            <h2>Theme Editor</h2>
            <div className="muted">Theme editor is coming next.</div>
          </div>
        )}

        {mode === "preview" && (
          <div className="card">
            <h2>Preview</h2>
            <div className="muted">Interview preview is coming next.</div>
          </div>
        )}

        {mode === "data" && dataArea === "selectLists" && (
          <SelectListItemsSection
            selectListId={selectedSelectList}
            onSelectList={(id) => {
              setCreatingNewList(!id);
              setSelectedSelectList(id);
            }}
            metaDraft={selectedSelectList ? selectListMetaDrafts[selectedSelectList] : undefined}
            onMetaDraftChange={(payload) => {
              if (!selectedSelectList) return;
              updateSelectListMetaDraft(selectedSelectList, payload);
            }}
            onDirtyChange={setSelectListDirty}
          />
        )}

        {mode === "data" && dataArea === "variables" && (
          <VariablesSection onDirtyChange={setVariablesDirty} />
        )}

        {mode === "data" && dataArea === "lookupTables" && (
          <LookupTablesSection
            tableId={selectedLookupTable}
            onSelectTable={(id) => {
              setCreatingNewLookupTable(!id);
              setSelectedLookupTable(id);
            }}
            metaDraft={selectedLookupTable ? lookupTableMetaDrafts[selectedLookupTable] : undefined}
            onMetaDraftChange={(payload) => {
              if (!selectedLookupTable) return;
              updateLookupTableMetaDraft(selectedLookupTable, payload);
            }}
            onDirtyChange={setLookupTableDirty}
          />
        )}

        {mode === "data" && dataArea === "ranges" && (
          <div className="card">
            <h2>Ranges</h2>
            <div className="muted">Ranges are coming next.</div>
          </div>
        )}
      </Shell>
      {confirmDialog && (
        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmText="Discard changes"
          onOpenChange={(open) => {
            if (!open) {
              if (!confirmHandledRef.current) {
                confirmDialog.onCancel?.();
              }
              confirmHandledRef.current = false;
              setConfirmDialog(null);
            }
          }}
          onConfirm={() => {
            confirmHandledRef.current = true;
            const action = confirmDialog.onConfirm;
            setConfirmDialog(null);
            action();
          }}
        />
      )}
    </>
  );
}
