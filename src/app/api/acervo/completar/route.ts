import { NextResponse, type NextRequest } from "next/server";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { clienteServico } from "@/lib/supabase/servico";
import { completarAcervo, situacaoDoAcervo } from "@/lib/acervo-completar";

/** Completar o acervo com IA, um lote pequeno por chamada (docs/DECISOES.md §27). A tela chama de novo até acabar. */
export const maxDuration = 300;

const json = (x: unknown, status = 200) => NextResponse.json(x, { status, headers: { "Cache-Control": "no-store" } });

async function logado() {
  if (!supabaseConfigurado()) return false;
  const { data } = await (await createClient()).auth.getUser();
  return Boolean(data.user);
}

/** Situação: quantos estão sem notas, sem nível, com nível estimado. Sem IA. */
export async function GET() {
  if (!(await logado())) return json({ erro: "Entre no Atlas." }, 401);
  const sb = clienteServico();
  if (!sb) return json({ erro: "Falta SUPABASE_SERVICE_ROLE_KEY na Vercel." }, 400);
  return json(await situacaoDoAcervo(sb));
}

export async function POST(request: NextRequest) {
  if (!(await logado())) return json({ erro: "Entre no Atlas." }, 401);
  const b = (await request.json().catch(() => ({}))) as { quantos?: number; alvo?: "notas" | "niveis" | "tudo" };
  const r = await completarAcervo(Number(b.quantos) || 3, b.alvo === "notas" || b.alvo === "niveis" ? b.alvo : "tudo");
  return "erro" in r ? json(r, 400) : json(r);
}
