import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shell } from "./layout/Shell";
import { Header } from "./layout/Header";
import { Footer } from "./layout/Footer";
import { NavButton } from "./components/NavButton";
import { categoriesApi, subcategoriesApi, optionsApi, attributesApi, selectListsApi } from "./api/entities";
import { CategoriesSection } from "./features/catalog/CategoriesSection";
import { SubcategoriesSection } from "./features/catalog/SubcategoriesSection";
import { OptionsSection } from "./features/catalog/OptionsSection";
import { AttributesSection } from "./features/catalog/AttributesSection";
import { SelectListItemsSection } from "./features/lists/SelectListItemsSection";

type Section =
  | "categories"
  | "subcategories"
  | "options"
  | "attributes"
  | "selectListItems";

export default function App() {
  const SHOW_INACTIVE_KEY = "configurator.showInactive";
  const [showInactive, setShowInactive] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(SHOW_INACTIVE_KEY);
      if (stored === null) return true;
      return stored === "true";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SHOW_INACTIVE_KEY, String(showInactive));
    } catch {
      // ignore
    }
  }, [showInactive]);
  const [activeSection, setActiveSection] = useState<Section>("categories");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | undefined>();
  const [selectedOption, setSelectedOption] = useState<string | undefined>();
  const [selectedSelectList, setSelectedSelectList] = useState<string | undefined>();

  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";
  const [listsCollapsed, setListsCollapsed] = useState(false);
  const [creatingNewList, setCreatingNewList] = useState(false);

  // Lightweight queries to drive nav counts (shared cache with section queries)
  const categories = useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => categoriesApi.list(true),
  });

  const subcategories = useQuery({
    queryKey: ["subcategories", selectedCategory, "all"],
    queryFn: () => subcategoriesApi.list(selectedCategory, true),
    enabled: true,
  });

  const options = useQuery({
    queryKey: ["options", selectedSubcategory, showInactive],
    queryFn: () => optionsApi.list(selectedSubcategory, showInactive),
    enabled: !!selectedSubcategory,
  });

  const attributes = useQuery({
    queryKey: ["attributes", selectedOption, showInactive],
    queryFn: () => attributesApi.list(selectedOption, showInactive),
    enabled: !!selectedOption,
  });

  const optionLists = useQuery({
    queryKey: ["select-lists", showInactive],
    queryFn: () => selectListsApi.list(),
  });

  // Auto-select first list when available so the list items view is ready (unless we're in "new list" mode).
  useEffect(() => {
    console.debug("[App] selectedSelectList", selectedSelectList, "creatingNewList", creatingNewList);
    if (!creatingNewList && !selectedSelectList && (optionLists.data?.length ?? 0) > 0) {
      setSelectedSelectList(optionLists.data![0].id);
    }
  }, [optionLists.data, selectedSelectList, creatingNewList]);

  const resetTree = () => {
    setSelectedCategory(undefined);
    setSelectedSubcategory(undefined);
    setSelectedOption(undefined);
  };

  const resetSubAndBelow = () => {
    setSelectedSubcategory(undefined);
    setSelectedOption(undefined);
  };

  const resetOption = () => {
    setSelectedOption(undefined);
  };

  return (
    <Shell
      header={
        <Header showInactive={showInactive} onToggleInactive={setShowInactive} apiBase={apiBase} />
      }
      nav={
        <nav className="side-nav">
          <div className="nav-section">
            <div className="nav-label">Catalog</div>
            <NavButton
              label="Categories"
              count={categories.data?.length}
              active={activeSection === "categories"}
              onClick={() => setActiveSection("categories")}
            />
            <NavButton
              label="Subcategories"
              count={subcategories.data?.length}
              active={activeSection === "subcategories"}
              onClick={() => setActiveSection("subcategories")}
            />
            <NavButton
              label="Options"
              count={options.data?.length}
              disabled={!selectedSubcategory}
              active={activeSection === "options"}
              onClick={() => setActiveSection("options")}
            />
            <NavButton
              label="Attributes"
              count={attributes.data?.length}
              disabled={!selectedOption}
              active={activeSection === "attributes"}
              onClick={() => setActiveSection("attributes")}
            />
          </div>
          <div className="nav-section">
            <div className="nav-group">
              <div className="nav-parent-header">
                <button
                  className={`nav-link parent ${activeSection === "selectListItems" ? "active" : ""}`}
                  type="button"
                  onClick={() => setListsCollapsed((v) => !v)}
                >
                  <span className="nav-chevron" style={{ fontSize: 16 }}>
                    {listsCollapsed ? "▸" : "▾"}
                  </span>
                  <span>SELECT LISTS</span>
                </button>
                <button
                  className="nav-badge nav-add"
                  type="button"
                  title="Add select list"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCreatingNewList(true);
                    setSelectedSelectList(undefined);
                    setActiveSection("selectListItems");
                    setListsCollapsed(false);
                  }}
                >
                  +
                </button>
              </div>
              {!listsCollapsed && (
                <div className="nav-children">
                  {(optionLists.data ?? []).map((l) => (
                    <button
                      key={l.id}
                      className={`nav-link child ${selectedSelectList === l.id ? "active" : ""}`}
                      onClick={() => {
                        setCreatingNewList(false);
                        setSelectedSelectList(l.id);
                        setActiveSection("selectListItems");
                      }}
                    >
                      <span>{l.name}</span>
                    </button>
                  ))}
                  {!(optionLists.data ?? []).length && (
                    <button className="nav-link child" disabled>
                      <span>No lists yet</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </nav>
      }
      footer={<Footer />}
    >
      {activeSection === "categories" && (
        <CategoriesSection
          selectedCategory={selectedCategory}
          onSelect={(id) => {
            setSelectedCategory(id);
            resetSubAndBelow();
          }}
          onResetTree={resetTree}
        />
      )}

      {activeSection === "subcategories" && (
        <SubcategoriesSection
          categoryId={selectedCategory}
          selectedSubcategory={selectedSubcategory}
          onSelect={(id) => {
            setSelectedSubcategory(id);
            resetOption();
          }}
          onResetBelow={resetSubAndBelow}
        />
      )}

      {activeSection === "options" && (
        <OptionsSection
          showInactive={showInactive}
          subcategoryId={selectedSubcategory}
          selectedOption={selectedOption}
          onSelect={(id) => setSelectedOption(id)}
          onResetBelow={resetOption}
        />
      )}

      {activeSection === "attributes" && (
        <AttributesSection showInactive={showInactive} optionId={selectedOption} />
      )}

      {activeSection === "selectListItems" && (
        <SelectListItemsSection
          showInactive={showInactive}
          selectListId={selectedSelectList}
          onSelectList={(id) => {
            setCreatingNewList(!id);
            setSelectedSelectList(id);
          }}
        />
      )}
    </Shell>
  );
}
