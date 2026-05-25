"use client";

import * as React from "react";
import { ScrollArea as RadixScrollArea } from "radix-ui";
import { cn } from "@/lib/utils";

function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof RadixScrollArea.Root>) {
  return (
    <RadixScrollArea.Root
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <RadixScrollArea.Viewport className="h-full w-full rounded-[inherit]">
        {children}
      </RadixScrollArea.Viewport>
      <ScrollBar />
      <RadixScrollArea.Corner />
    </RadixScrollArea.Root>
  );
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof RadixScrollArea.Scrollbar>) {
  return (
    <RadixScrollArea.Scrollbar
      orientation={orientation}
      className={cn(
        "flex touch-none select-none transition-colors",
        orientation === "vertical" &&
          "h-full w-2 border-l border-l-transparent p-[1px]",
        orientation === "horizontal" &&
          "h-2 flex-col border-t border-t-transparent p-[1px]",
        className
      )}
      {...props}
    >
      <RadixScrollArea.Thumb className="relative flex-1 rounded-full bg-border" />
    </RadixScrollArea.Scrollbar>
  );
}

export { ScrollArea, ScrollBar };
