import type { ReactNode } from "react";
import type { AppMode } from "./Header";

export type DataArea = "selectLists" | "lookupTables" | "ranges";

type Props = {
  mode: AppMode;
  dataArea: DataArea;
  onChangeDataArea: (area: DataArea) => void;

  leftToolbar?: ReactNode;
  rightToolbar?: ReactNode;
};

export function MenuBar({
  mode,
  dataArea,
  onChangeDataArea,
  leftToolbar,
  rightToolbar,
}: Props) {
  if (mode !== "data") return <div className="app-menubar" />;

  return (
    <div className="app-menubar">
      <div className="menubar-row menubar-row--tabs">
        <div className="menubar-left">
          <button
            type="button"
            className={`menubar-tab ${dataArea === "selectLists" ? "active" : ""}`}
            onClick={() => onChangeDataArea("selectLists")}
          >
            Select Lists
          </button>
          <button
            type="button"
            className={`menubar-tab ${dataArea === "lookupTables" ? "active" : ""}`}
            onClick={() => onChangeDataArea("lookupTables")}
          >
            Lookup Tables
          </button>
          <button
            type="button"
            className={`menubar-tab ${dataArea === "ranges" ? "active" : ""}`}
            onClick={() => onChangeDataArea("ranges")}
          >
            Ranges
          </button>
        </div>
        <div className="menubar-right" />
      </div>

      <div className="menubar-row menubar-row--toolbar">
        <div className="menubar-toolbar-grid" role="toolbar" aria-label="Data tools">
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
