import { NextResponse } from "next/server";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { geminiConfigurado, geminiJSON, nomeIA } from "@/lib/gemini";
import { gerarFicha, ultimoErroFicha } from "@/lib/ficha";
import { lerPagina } from "@/lib/pagina";
import type { NextRequest } from "next/server";

export const maxDuration = 120;

/** Mostra o que está ligado (sem revelar chaves). Abra /api/diagnostico no navegador. */
export async function GET(request: NextRequest) {
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
  r.ia = geminiConfigurado() ? nomeIA() : "nenhuma";
  if (!geminiConfigurado()) r.gemini = "FALTA OPENAI_API_KEY (ou GEMINI_API_KEY)";
  else if (request.nextUrl.searchParams.get("pagina")) r.gemini = "chave ok (não testada)";
  else {
    try {
      const t = await geminiJSON<{ ok: string }>([{ text: 'Responda {"ok":"sim"}' }], { schema: { type: "OBJECT", properties: { ok: { type: "STRING" } }, required: ["ok"] } });
      r.gemini = t.ok === "sim" ? `${nomeIA()} respondendo` : "IA respondeu algo estranho";
    } catch (e) {
      r.gemini = `ERRO: ${e instanceof Error ? e.message.slice(0, 200) : "desconhecido"}`;
    }
  }
  // teste da leitura de página (não gasta a cota da IA): /api/diagnostico?pagina=https://...
  const url = request.nextUrl.searchParams.get("pagina");
  if (url) {
    const pg = await lerPagina(url);
    r.pagina = pg ? `lida: ${pg.texto.length} letras, foto ${pg.imagem ? "achada" : "não achada"}, início: ${pg.texto.slice(0, 120).replace(/\s+/g, " ")}` : "o site bloqueou a leitura";
    return NextResponse.json(r, { headers: { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" } });
  }
  // teste da ficha: /api/diagnostico?ficha=Pacific Aura|Rayhaan
  const teste = request.nextUrl.searchParams.get("ficha");
  if (teste && geminiConfigurado()) {
    const [nome, casa = ""] = teste.split("|");
    const f = await gerarFicha({ nome, casa });
    r.ficha = f ? `ok: ${f.nome} (${f.casa}), ${f.notas.saida.length + f.notas.coracao.length + f.notas.fundo.length} notas, ${f.acordes.length} acordes` : `ERRO: ${ultimoErroFicha || "sem detalhe"}`;
  }
  r.avisos = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY ? "chaves ok" : "desligado (faltam as chaves VAPID)";
  r.servico = process.env.SUPABASE_SERVICE_ROLE_KEY ? "chave ok" : "FALTA SUPABASE_SERVICE_ROLE_KEY (avisos e Alexa)";
  r.alexa = process.env.ALEXA_SKILL_ID && process.env.ATLAS_USER_ID ? "configurada" : "não configurada (opcional)";
  return NextResponse.json(r, { headers: { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" } });
}
