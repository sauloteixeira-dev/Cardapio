"use client";

// Aplica a cor de destaque da loja (replica-brand troca o placeholder por marca própria;
// cada loja, no SaaS, pode ter a sua) sem tocar nos outros tokens.
export function StoreShell({
  accentColor,
  children,
}: {
  accentColor: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ "--color-accent": accentColor } as React.CSSProperties} className="min-h-dvh pb-20">
      {children}
    </div>
  );
}
