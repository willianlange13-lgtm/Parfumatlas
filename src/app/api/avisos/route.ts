import { NextResponse, type NextRequest } from "next/server";
import webpush from "web-push";
import { clienteServico } from "@/lib/supabase/servico";
import { lerAcervo } from "@/lib/dados";
import { obterClima } from "@/lib/clima";
import { afinidade, esquecidos, perfumeDoDia } from "@/lib/analise";
import { origemCasa } from "@/data/casas";

const NICHO = new Set(["Creed", "Ex Nihilo", "Xerjoff", "Parfums de Marly", "Maison Francis Kurkdjian", "Tom Ford", "Kilian", "Frédéric Malle"]);
// árabes: a mesma lista do resto do app (src/data/casas.ts)

/**
 * Envia os avisos do dia (perfume do dia, esquecidos e lançamentos acima do limite).
 * Chamado uma vez por dia pelo agendador da Vercel (vercel.json), com o CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  if (process.env.CRON_SECRET && request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  const sb = clienteServico();
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!sb || !pub || !priv) return NextResponse.json({ erro: "Faltam SUPABASE_SERVICE_ROLE_KEY ou as chaves VAPID." }, { status: 400 });
  webpush.setVapidDetails(`mailto:${process.env.AVISOS_EMAIL ?? "avisos@parfumatlas.app"}`, pub, priv);

  const { data: cfgs } = await sb.from("configuracoes").select("*");
  const enviados: Record<string, number> = {};
  for (const c of cfgs ?? []) {
    const { data: subs } = await sb.from("inscricoes_push").select("id, endpoint, chaves").eq("user_id", c.user_id);
    if (!subs?.length) continue;
    const acervo = await lerAcervo(sb, c.user_id);
    if (acervo.demo) continue;
    const avisos: { titulo: string; corpo: string; url: string; tag: string }[] = [];

    if (c.notif_dia) {
      const clima = await obterClima(Number(c.latitude), Number(c.longitude), c.cidade);
      const d = perfumeDoDia(acervo.colecao, clima.agora.temp, clima.agora.umidade);
      if (d) avisos.push({ titulo: "Perfume do dia", corpo: `${clima.agora.temp} °C em ${c.cidade}. Vai de ${d.entrada.perfume.nome}. ${d.porque.split(". ")[0]}.`, url: `/colecao/${d.entrada.perfumeId}`, tag: "dia" });
    }
    if (c.notif_esquecidos) {
      const e = esquecidos(acervo.colecao, 1)[0];
      if (e && e.dias >= 30) avisos.push({ titulo: "Esquecido", corpo: `O ${e.perfume.nome} está há ${e.dias} dias sem sair do armário.`, url: `/colecao/${e.perfumeId}`, tag: "esquecido" });
    }
    const ja = (c.avisos_enviados ?? {}) as Record<string, string>;
    if (c.notif_lancamentos) {
      const casas = new Set(acervo.colecao.map((x) => x.perfume.casa));
      const tipos: string[] = c.alerta_tipos ?? ["casas", "nicho", "arabe"];
      for (const l of acervo.lancamentos) {
        if (ja[l.perfume.id]) continue;
        const casa = l.perfume.casa;
        const tipoOk = (tipos.includes("casas") && casas.has(casa)) || (tipos.includes("nicho") && NICHO.has(casa)) || (tipos.includes("arabe") && origemCasa(casa) === "arabe") || (tipos.includes("designer") && !NICHO.has(casa) && origemCasa(casa) !== "arabe");
        const pct = afinidade(l.perfume, acervo.colecao);
        if (!tipoOk || pct < (c.alerta_afinidade ?? 80)) continue;
        avisos.push({ titulo: `Lançamento para você · ${pct}%`, corpo: `${l.perfume.nome} (${casa}). ${l.porque}`.slice(0, 180), url: `/novidades`, tag: `l-${l.perfume.id}` });
        ja[l.perfume.id] = new Date().toISOString().slice(0, 10);
      }
      await sb.from("configuracoes").update({ avisos_enviados: ja }).eq("user_id", c.user_id);
    }

    for (const s of subs) {
      for (const a of avisos) {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: s.chaves }, JSON.stringify(a));
          enviados[c.user_id] = (enviados[c.user_id] ?? 0) + 1;
        } catch (e) {
          const st = (e as { statusCode?: number }).statusCode;
          if (st === 404 || st === 410) await sb.from("inscricoes_push").delete().eq("id", s.id);
        }
      }
    }
  }
  return NextResponse.json({ ok: true, enviados });
}
