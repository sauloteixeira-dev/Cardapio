import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Fecha o gap de segurança apontado em replica/build-log.md ("A02 ... sem login, qualquer
// um que acesse a URL vê e mexe nos pedidos"): a partir desta etapa, /admin/* e /api/admin/*
// exigem sessão. Também renova o cookie de sessão a cada requisição — padrão do @supabase/ssr.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/admin/entrar";
  const isAdminPage = pathname.startsWith("/admin") && !isLoginPage;
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!user && (isAdminPage || isAdminApi)) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Faça login para acessar o painel." }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/admin/entrar";
    url.searchParams.set("redirecionar", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
