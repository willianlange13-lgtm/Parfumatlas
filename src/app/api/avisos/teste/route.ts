import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { clienteServico } from "@/lib/supabase/servico";

/** "Enviar aviso de teste" em Ajustes: manda na hora para os aparelhos de quem está logado. */
export async function POST() {
  if (!supabaseConfigurado()) return NextResponse.json({ erro: "Banco não configurado." }, { status: 400 });
  const { data: u } = await (await createClient()).auth.getUser();
  if (!u.user) return NextResponse.json({ erro: "Entre no Atlas." }, { status: 401 });
  const sb = clienteServico();
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!sb || !pub || !priv) return NextResponse.json({ erro: "Faltam na Vercel as chaves VAPID ou a SUPABASE_SERVICE_ROLE_KEY." }, { status: 400 });
  webpush.setVapidDetails(`mailto:${process.env.AVISOS_EMAIL ?? "avisos@parfumatlas.app"}`, pub, priv);
  const { data: subs } = await sb.from("inscricoes_push").select("id, endpoint, chaves").eq("user_id", u.user.id);
  if (!subs?.length) return NextResponse.json({ erro: "Nenhum aparelho inscrito. Ligue um dos avisos acima neste celular e permita as notificações." }, { status: 400 });
  let enviados = 0, falha = "";
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: s.chaves }, JSON.stringify({ titulo: "Parfum Atlas", corpo: "Aviso de teste: se chegou, as notificações estão funcionando.", url: "/", tag: "teste" }));
      enviados++;
    } catch (e) {
      const st = (e as { statusCode?: number }).statusCode;
      falha = `${st ?? ""} ${(e as { body?: string }).body ?? (e instanceof Error ? e.message : "")}`.trim().slice(0, 160);
      if (st === 404 || st === 410) await sb.from("inscricoes_push").delete().eq("id", s.id);
    }
  }
  if (!enviados) return NextResponse.json({ erro: `O envio falhou: ${falha || "sem resposta"}. Toque de novo para reinscrever.` }, { status: 502 });
  return NextResponse.json({ ok: true, enviados, aparelhos: subs.length });
}
