"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// components.md > BottomBar. Três itens do cliente final: Início, Pedidos, Carrinho.
export function BottomBar({ storeSlug, cartCount }: { storeSlug: string; cartCount: number }) {
  const pathname = usePathname();
  const items = [
    { href: `/loja/${storeSlug}`, label: "Início", icon: "🏠" },
    { href: `/loja/${storeSlug}/pedidos`, label: "Pedidos", icon: "🧾" },
    { href: `/loja/${storeSlug}/carrinho`, label: "Carrinho", icon: "🛒", badge: cartCount },
  ];

  return (
    <nav
      aria-label="Navegação do cardápio"
      className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex pb-safe"
    >
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-16 text-xs font-semibold ${
              active ? "text-accent-text" : "text-muted"
            }`}
          >
            <span className="relative text-lg leading-none" aria-hidden="true">
              {item.icon}
              {item.badge ? (
                <span className="absolute -top-1 -right-2 bg-danger text-on-accent rounded-pill text-[10px] leading-none px-1 py-0.5">
                  {item.badge}
                </span>
              ) : null}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
