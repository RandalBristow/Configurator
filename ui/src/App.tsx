import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shell } from "./layout/Shell";
import { Header, type AppMode } from "./layout/Header";
import { MenuBar, type DataArea } from "./layout/MenuBar";
import { Footer } from "./layout/Footer";
import { TabToolbarProvider, useTabToolbar } from "./layout/TabToolbarContext";
import { useResizableSidePanel } from "./hooks/useResizableSidePanel";
import { lookupTablesApi, selectListsApi } from "./api/entities";
import { LookupTablesSection } from "./features/lookup-tables/LookupTablesSection";
import { SelectListItemsSection } from "./features/lists/SelectListItemsSection";
import { SidePanelFilter } from "./components/nav/SidePanelFilter";

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

  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";
  const { leftToolbar, rightToolbar } = useTabToolbar();

  const navPanel = useResizableSidePanel({
    storageKeyBase: "app.sidenav",
    side: "left",
    defaultWidth: 280,
    minWidth: 240,
    maxWidth: 460,
    collapsedWidth: 220,
    splitterSize: 8,
  });

  const [creatingNewList, setCreatingNewList] = useState(false);
  const [selectedSelectList, setSelectedSelectList] = useState<string | undefined>();
  const [selectListFilter, setSelectListFilter] = useState("");

  const [creatingNewLookupTable, setCreatingNewLookupTable] = useState(false);
  const [selectedLookupTable, setSelectedLookupTable] = useState<string | undefined>();
  const [lookupTableFilter, setLookupTableFilter] = useState("");

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

  useEffect(() => {
    if (mode !== "data") return;
    if (dataArea !== "selectLists") return;
    if (creatingNewList) return;
    if (selectedSelectList) return;
    if ((optionLists.data?.length ?? 0) > 0) setSelectedSelectList(optionLists.data![0].id);
  }, [mode, dataArea, creatingNewList, selectedSelectList, optionLists.data]);

  useEffect(() => {
    if (mode !== "data") return;
    if (dataArea !== "lookupTables") return;
    if (creatingNewLookupTable) return;
    if (selectedLookupTable) return;
    if ((lookupTables.data?.length ?? 0) > 0) setSelectedLookupTable(lookupTables.data![0].id);
  }, [mode, dataArea, creatingNewLookupTable, selectedLookupTable, lookupTables.data]);

  return (
    <Shell
      header={<Header mode={mode} onChangeMode={setMode} apiBase={apiBase} />}
      menubar={
        <MenuBar
          mode={mode}
          dataArea={dataArea}
          onChangeDataArea={(area) => {
            setDataArea(area);
          }}
          leftToolbar={leftToolbar}
          rightToolbar={rightToolbar}
        />
      }
      navCollapsed={navPanel.panelCollapsed}
      navSize={navPanel.panelSize}
      navSplitterSize={navPanel.splitterSize}
      onNavSplitterMouseDown={navPanel.onSplitterMouseDown}
      nav={
        <nav className="side-nav">
          {mode !== "data" && (
            <div className="nav-section">
              <div className="nav-label">{mode === "design" ? "Design" : "Preview"}</div>
              <button className="nav-link active" type="button">
                <span>{mode === "design" ? "Form Designer" : "Interview Preview"}</span>
                <span className="nav-badge">Soon</span>
              </button>
              {mode === "design" && (
                <button className="nav-link" type="button" disabled>
                  <span>Theme Editor</span>
                  <span className="nav-badge">Soon</span>
                </button>
              )}
            </div>
          )}

          {mode === "data" && dataArea === "selectLists" && (
            <div className="nav-section">
              <div className="sidepanel-top">
                <SidePanelFilter
                  value={selectListFilter}
                  onChange={setSelectListFilter}
                  placeholder="Filter select lists"
                />
                <div className="sidepanel-top__divider" role="separator" aria-orientation="horizontal" />
              </div>
              <div className="nav-group">
                {(optionLists.data ?? [])
                  .filter((l) =>
                    selectListFilter.trim()
                      ? l.name.toLowerCase().includes(selectListFilter.trim().toLowerCase())
                      : true
                  )
                  .map((l) => (
                  <button
                    key={l.id}
                    className={`nav-item ${selectedSelectList === l.id ? "active" : ""}`}
                    title={l.name}
                    onClick={() => {
                      setCreatingNewList(false);
                      setSelectedSelectList(l.id);
                    }}
                  >
                    <span>{l.name}</span>
                  </button>
                ))}
                {!(optionLists.data ?? []).length && (
                  <button className="nav-item" disabled>
                    <span>No lists yet</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {mode === "data" && dataArea === "lookupTables" && (
            <div className="nav-section">
              <div className="sidepanel-top">
                <SidePanelFilter
                  value={lookupTableFilter}
                  onChange={setLookupTableFilter}
                  placeholder="Filter lookup tables"
                />
                <div className="sidepanel-top__divider" role="separator" aria-orientation="horizontal" />
              </div>
              <div className="nav-group">
                {(lookupTables.data ?? [])
                  .filter((t) =>
                    lookupTableFilter.trim()
                      ? t.name.toLowerCase().includes(lookupTableFilter.trim().toLowerCase())
                      : true
                  )
                  .map((t) => (
                  <button
                    key={t.id}
                    className={`nav-item ${selectedLookupTable === t.id ? "active" : ""}`}
                    title={t.name}
                    onClick={() => {
                      setCreatingNewLookupTable(false);
                      setSelectedLookupTable(t.id);
                    }}
                  >
                    <span>{t.name}</span>
                  </button>
                ))}
                {!(lookupTables.data ?? []).length && (
                  <button className="nav-item" disabled>
                    <span>No tables yet</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {mode === "data" && dataArea === "ranges" && (
            <div className="nav-section">
              <div className="nav-label">Ranges</div>
              <button className="nav-link" type="button" disabled>
                <span>Coming soon</span>
                <span className="nav-badge">Soon</span>
              </button>
            </div>
          )}

        </nav>
      }
      footer={<Footer />}
    >
      {mode !== "data" && (
        <div className="card">
          <h2>{mode === "design" ? "Design" : "Preview"}</h2>
          <div className="muted">
            {mode === "design"
              ? "Form designer and theme editor are coming next."
              : "Interview preview is coming next."}
          </div>
        </div>
      )}

      {mode === "data" && dataArea === "selectLists" && (
        <SelectListItemsSection
          selectListId={selectedSelectList}
          onSelectList={(id) => {
            setCreatingNewList(!id);
            setSelectedSelectList(id);
          }}
        />
      )}

      {mode === "data" && dataArea === "lookupTables" && (
        <LookupTablesSection
          tableId={selectedLookupTable}
          onSelectTable={(id) => {
            setCreatingNewLookupTable(!id);
            setSelectedLookupTable(id);
          }}
        />
      )}

      {mode === "data" && dataArea === "ranges" && (
        <div className="card">
          <h2>Ranges</h2>
          <div className="muted">Ranges are coming next.</div>
        </div>
      )}
    </Shell>
  );
}
