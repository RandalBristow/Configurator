import type React from "react";
import { GripVertical } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";

import { cn } from "@/lib/utils";

type ResizablePanelGroupProps = Omit<
  React.ComponentPropsWithoutRef<typeof Group>,
  "orientation"
> & {
  direction: "horizontal" | "vertical";
};

export function ResizablePanelGroup({
  direction,
  className,
  ...props
}: ResizablePanelGroupProps) {
  return (
    <Group
      orientation={direction}
      className={cn(
        "flex h-full w-full",
        direction === "vertical" ? "flex-col" : "",
        className
      )}
      {...props}
    />
  );
}

export const ResizablePanel = Panel;

type ResizableHandleProps = React.ComponentPropsWithoutRef<
  typeof Separator
> & {
  withHandle?: boolean;
};

export function ResizableHandle({ withHandle, className, ...props }: ResizableHandleProps) {
  return (
    <Separator
      className={cn(
        "relative flex w-px items-center justify-center bg-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
          <GripVertical className="h-2.5 w-2.5" />
        </div>
      )}
    </Separator>
  );
}
