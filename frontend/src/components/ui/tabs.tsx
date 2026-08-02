import { createContext, useContext, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs.* components must be used inside <Tabs>");
  return ctx;
}

export function Tabs({
  defaultValue,
  children,
  className,
}: {
  defaultValue: string;
  children: ReactNode;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children }: { children: ReactNode }) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-ink-100">
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children }: { value: string; children: ReactNode }) {
  const { value: active, setValue } = useTabsContext();
  const isActive = active === value;
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => setValue(value)}
      className={cn(
        "border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "border-emerald-600 text-emerald-700"
          : "border-transparent text-ink-400 hover:text-ink-900",
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children }: { value: string; children: ReactNode }) {
  const { value: active } = useTabsContext();
  if (active !== value) return null;
  return (
    <div role="tabpanel" className="py-6">
      {children}
    </div>
  );
}