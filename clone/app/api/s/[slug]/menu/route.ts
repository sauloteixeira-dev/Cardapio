import { NextResponse } from "next/server";
import { getStoreBySlug, listBestSellers, listCategories, listProducts } from "@/lib/data";

// GET /api/s/{slug}/menu — architecture.md. Só leitura; não exige identificação.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) return NextResponse.json({ error: "Loja não encontrada." }, { status: 404 });

  const [categories, products, bestSellers] = await Promise.all([
    listCategories(store.id),
    listProducts(store.id),
    listBestSellers(store.id),
  ]);

  return NextResponse.json({ store, categories, products, bestSellers });
}
