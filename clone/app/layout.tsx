import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cardápio digital",
  description: "Peça pelo cardápio digital da loja.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="dark">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
