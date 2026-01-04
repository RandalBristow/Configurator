import type React from "react";
import { WorkspaceTabs } from "./WorkspaceTabs";

type TabItem = { id: string; label: string; disabled?: boolean };

type Props = {
  tabs: TabItem[];
  activeTab: string;
  onChangeTab: (id: string) => void;
  toolbar?: React.ReactNode;
};

export function WorkspaceSideMenubar({ tabs, activeTab, onChangeTab, toolbar }: Props) {
  return (
    <div className="workspace-side-menubar">
      <div className="menubar-row menubar-row--tabs menubar-row--tabs--side">
        <WorkspaceTabs items={tabs} activeId={activeTab} onChange={onChangeTab} variant="menubar" />
      </div>
      {toolbar ? (
        <div className="menubar-row menubar-row--toolbar menubar-row--toolbar--side">
          {toolbar}
        </div>
      ) : null}
    </div>
  );
}
