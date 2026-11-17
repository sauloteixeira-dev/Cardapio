import Link from "next/link";

// Não existe home de verdade na primeira versão: cada loja só é acessada pelo próprio
// link (/loja/<slug>), como no original. Esta página é só um atalho de desenvolvimento.
export default function RootPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6 text-center">
      <div>
        <p className="text-muted mb-3">Ambiente de desenvolvimento.</p>
        <Link href="/loja/burgueria-exemplo" className="text-accent-text font-bold">
          Abrir a loja de exemplo →
        </Link>
      </div>
    </main>
  );
}
