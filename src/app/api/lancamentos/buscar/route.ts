import { NextResponse, type NextRequest } from "next/server";
import { clienteServico } from "@/lib/supabase/servico";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { buscarLancamentos } from "@/lib/lancamentos-busca";

/**
 * Busca de lançamentos (docs/DECISOES.md §19).
 * GET: o agendador da Vercel, uma vez por semana (vercel.json), com o CRON_SECRET.
 * POST: "Buscar lançamentos agora" em Ajustes (precisa estar logado).
 */
export const maxDuration = 300;

async function rodar() {
  const sb = clienteServico();
  if (!sb) return NextResponse.json({ erro: "Falta SUPABASE_SERVICE_ROLE_KEY." }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, ...(await buscarLancamentos(sb)) });
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : "falhou" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // o segredo é obrigatório: sem ele a rota ficaria aberta para qualquer pessoa (usa a chave de serviço)
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  return rodar();
}

export async function POST() {
  if (!supabaseConfigurado()) return NextResponse.json({ erro: "Banco não configurado." }, { status: 400 });
  const { data: u } = await (await createClient()).auth.getUser();
  if (!u.user) return NextResponse.json({ erro: "Entre no Atlas." }, { status: 401 });
  return rodar();
}
