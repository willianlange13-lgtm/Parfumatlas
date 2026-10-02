import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SESSAO_CURTA, semValidade } from "./sessao";

const PUBLICAS = ["/entrar", "/auth", "/api/avisos", "/api/alexa"];

export async function atualizarSessao(request: NextRequest) {
  let resposta = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) return resposta; // modo de demonstração, sem banco

  const supabase = createServerClient(url, chave, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(lista) {
        lista.forEach(({ name, value }) => request.cookies.set(name, value));
        resposta = NextResponse.next({ request });
        const curta = request.cookies.get(SESSAO_CURTA)?.value === "1";
        lista.forEach(({ name, value, options }) => resposta.cookies.set(name, value, curta ? semValidade(options) : options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const logado = Boolean(data?.claims);
  const caminho = request.nextUrl.pathname;
  if (!logado && !PUBLICAS.some((p) => caminho.startsWith(p))) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/entrar";
    return NextResponse.redirect(destino);
  }
  return resposta;
}
