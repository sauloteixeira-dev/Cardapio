import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nada de imagens ou scripts carregados de domínio de terceiro (regra do replica-recon):
  // toda imagem de produto, quando houver upload de verdade, vem do Supabase Storage próprio.
  images: { remotePatterns: [] },
};

export default nextConfig;
