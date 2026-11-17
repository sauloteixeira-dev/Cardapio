"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function generatePassword(): string {
  // só precisa ser forte o bastante pra entregar ao dono da loja uma vez — ele troca depois
  // (reset de senha ainda não existe nesta fatia, ver replica/backend.md "Não feito").
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6).toUpperCase();
}

export default function NovaLojaPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState(generatePassword());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ slug: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/platform/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, ownerEmail, ownerPassword }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erro ao criar a loja.");
      return;
    }
    setCreated({ slug: data.store.slug });
  }

  if (created) {
    return (
      <div className="max-w-md mx-auto p-4">
        <h1 className="text-lg font-bold mb-2">Loja criada! 🎉</h1>
        <p className="text-sm mb-4">
          Cardápio em <code>/loja/{created.slug}</code>. Repasse ao dono o login abaixo — ele troca a senha depois.
        </p>
        <div className="p-3 rounded-md border border-input mb-4 text-sm">
          <p>
            <strong>Login do painel:</strong> /admin/entrar
          </p>
          <p>
            <strong>E-mail:</strong> {ownerEmail}
          </p>
          <p>
            <strong>Senha provisória:</strong> {ownerPassword}
          </p>
        </div>
        <Button onClick={() => router.push("/admin/plataforma")}>Voltar para a lista de lojas</Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-lg font-bold mb-4">Nova loja</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="text-sm">
          Nome da loja
          <input
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugEdited) setSlug(slugify(e.target.value));
            }}
            className="w-full mt-1 p-3 rounded-md border border-input bg-transparent"
          />
        </label>
        <label className="text-sm">
          Endereço do cardápio (slug)
          <div className="flex items-center mt-1 border border-input rounded-md overflow-hidden">
            <span className="px-3 text-muted text-sm">/loja/</span>
            <input
              required
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(slugify(e.target.value));
              }}
              className="flex-1 p-3 bg-transparent"
            />
          </div>
        </label>
        <label className="text-sm">
          E-mail do dono da loja
          <input
            type="email"
            required
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            className="w-full mt-1 p-3 rounded-md border border-input bg-transparent"
          />
        </label>
        <label className="text-sm">
          Senha provisória
          <div className="flex gap-2 mt-1">
            <input
              required
              minLength={8}
              value={ownerPassword}
              onChange={(e) => setOwnerPassword(e.target.value)}
              className="flex-1 p-3 rounded-md border border-input bg-transparent"
            />
            <button
              type="button"
              onClick={() => setOwnerPassword(generatePassword())}
              className="text-sm underline"
            >
              Gerar outra
            </button>
          </div>
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" disabled={loading}>
          {loading ? "Criando…" : "Criar loja"}
        </Button>
      </form>
    </div>
  );
}
