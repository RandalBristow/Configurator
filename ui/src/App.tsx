import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shell } from "./layout/Shell";
import { Header } from "./layout/Header";
import { Footer } from "./layout/Footer";
import { NavButton } from "./components/NavButton";
import { categoriesApi, subcategoriesApi, optionsApi, attributesApi, optionListsApi, optionListItemsApi } from "./api/entities";
import { CategoriesSection } from "./features/catalog/CategoriesSection";
import { SubcategoriesSection } from "./features/catalog/SubcategoriesSection";
import { OptionsSection } from "./features/catalog/OptionsSection";
import { AttributesSection } from "./features/catalog/AttributesSection";
import { OptionListsSection } from "./features/lists/OptionListsSection";
import { OptionListItemsSection } from "./features/lists/OptionListItemsSection";

type Section =
  | "categories"
  | "subcategories"
  | "options"
  | "attributes"
  | "optionLists"
  | "optionListItems";

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
  const [selectedOptionList, setSelectedOptionList] = useState<string | undefined>();

  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

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
    queryKey: ["option-lists", showInactive],
    queryFn: () => optionListsApi.list(),
  });

  const optionListItems = useQuery({
    queryKey: ["option-list-items", selectedOptionList, showInactive],
    queryFn: () => optionListItemsApi.list(selectedOptionList, showInactive),
    enabled: !!selectedOptionList,
  });

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
            <div className="nav-label">Lists</div>
            <NavButton
              label="Option Lists"
              count={optionLists.data?.length}
              active={activeSection === "optionLists"}
              onClick={() => setActiveSection("optionLists")}
            />
            <NavButton
              label="List Items"
              count={optionListItems.data?.length}
              disabled={!selectedOptionList}
              active={activeSection === "optionListItems"}
              onClick={() => setActiveSection("optionListItems")}
            />
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

      {activeSection === "optionLists" && (
        <OptionListsSection
          showInactive={showInactive}
          selectedOptionList={selectedOptionList}
          onSelect={(id) => {
            setSelectedOptionList(id);
            setActiveSection("optionListItems");
          }}
        />
      )}

      {activeSection === "optionListItems" && (
        <OptionListItemsSection showInactive={showInactive} optionListId={selectedOptionList} />
      )}
    </Shell>
  );
}
