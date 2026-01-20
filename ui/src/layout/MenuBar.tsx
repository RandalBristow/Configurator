import type { ReactNode } from "react";
import type { AppMode } from "./Header";

export type DataArea = "variables" | "selectLists" | "lookupTables" | "ranges";
export type DesignArea = "options" | "theme";

type Props = {
  mode: AppMode;
  dataArea: DataArea;
  onChangeDataArea: (area: DataArea) => void;

  designArea: DesignArea;
  onChangeDesignArea: (area: DesignArea) => void;

  railToggle?: ReactNode;
  leftToolbar?: ReactNode;
  rightToolbar?: ReactNode;
};

export function MenuBar(props: Props) {
  const { mode, railToggle, leftToolbar, rightToolbar } = props;
  if (mode === "preview") return <div className="app-menubar" />;

  return (
    <div className="app-menubar">
      <div className="menubar-row menubar-row--toolbar">
        <div className="menubar-toolbar-grid" role="toolbar" aria-label="Workspace tools">
          <div className="menubar-toolbar-grid__rail">{railToggle}</div>
          <div className="menubar-toolbar-grid__left">{leftToolbar}</div>
          <div className="menubar-toolbar-grid__splitter" aria-hidden="true" />
          <div className="menubar-toolbar-grid__right">
            <div className="menubar-toolbar-grid__right-left">{rightToolbar}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
