"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast:
              "bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-xl",
            description: "text-zinc-400",
            actionButton: "bg-emerald-500 text-white",
            cancelButton: "bg-zinc-800 text-zinc-300",
            error: "!bg-red-950 !border-red-800 !text-red-100",
            success: "!bg-emerald-950 !border-emerald-800 !text-emerald-100",
          },
        }}
      />
    </ThemeProvider>
  );
}
