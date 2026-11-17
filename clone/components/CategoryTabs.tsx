"use client";

import type { Category } from "@/lib/types";

// components.md > CategoryTabs. Filtro no cliente (a loja de exemplo tem poucos produtos);
// numa loja grande, trocar para filtrar no servidor é só mudar esta chamada.
export function CategoryTabs({
  categories,
  activeId,
  onChange,
}: {
  categories: Category[];
  activeId: string | "all";
  onChange: (id: string | "all") => void;
}) {
  return (
    <nav aria-label="Categorias do cardápio" className="sticky top-0 z-10 bg-surface border-b border-border">
      <div className="flex gap-1 overflow-x-auto px-2 py-2 scrollbar-none">
        <TabButton active={activeId === "all"} onClick={() => onChange("all")}>
          Mais pedidos
        </TabButton>
        {categories.map((c) => (
          <TabButton key={c.id} active={activeId === c.id} onClick={() => onChange(c.id)}>
            {c.name}
          </TabButton>
        ))}
      </div>
    </nav>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-current={active ? "true" : undefined}
      onClick={onClick}
      className={`shrink-0 px-3 h-9 rounded-md text-sm font-semibold whitespace-nowrap ${
        active ? "text-accent-text border-b-2 border-accent" : "text-muted"
      }`}
    >
      {children}
    </button>
  );
}
