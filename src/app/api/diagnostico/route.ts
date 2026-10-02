import { NextResponse } from "next/server";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { geminiConfigurado, geminiJSON } from "@/lib/gemini";

export const maxDuration = 60;

/** Mostra o que está ligado (sem revelar chaves). Abra /api/diagnostico no navegador. */
export async function GET() {
  const r: Record<string, string> = {};
  r.supabase = supabaseConfigurado() ? "chaves ok" : "FALTA NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY";
  if (supabaseConfigurado()) {
    const sb = await createClient();
    const { data: u } = await sb.auth.getUser();
    r.login = u.user ? `logado como ${u.user.email}` : "não logado";
    const { error } = await sb.from("perfumes").select("id").limit(1);
    r.banco = error ? `ERRO: ${error.message} (rodou o SQL 0001_inicial.sql?)` : "tabelas ok";
    const { data: b, error: eb } = await sb.storage.from("frascos").list("", { limit: 1 });
    r.fotos = eb ? `ERRO: ${eb.message}` : `pasta de fotos ok${b ? "" : ""}`;
  }
  if (!geminiConfigurado()) r.gemini = "FALTA GEMINI_API_KEY";
  else {
    try {
      const t = await geminiJSON<{ ok: string }>([{ text: 'Responda {"ok":"sim"}' }], { schema: { type: "OBJECT", properties: { ok: { type: "STRING" } }, required: ["ok"] } });
      r.gemini = t.ok === "sim" ? "IA respondendo" : "IA respondeu algo estranho";
    } catch (e) {
      r.gemini = `ERRO: ${e instanceof Error ? e.message.slice(0, 200) : "desconhecido"}`;
    }
  }
  r.avisos = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY ? "chaves ok" : "desligado (faltam as chaves VAPID)";
  r.servico = process.env.SUPABASE_SERVICE_ROLE_KEY ? "chave ok" : "FALTA SUPABASE_SERVICE_ROLE_KEY (avisos e Alexa)";
  r.alexa = process.env.ALEXA_SKILL_ID && process.env.ATLAS_USER_ID ? "configurada" : "não configurada (opcional)";
  return NextResponse.json(r, { headers: { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" } });
}
