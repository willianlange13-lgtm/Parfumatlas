import { NextResponse, type NextRequest } from "next/server";
import { responder, paraTela, type MsgEntrada, type Filtros } from "@/lib/sommelier";
import { carregarAcervo } from "@/lib/dados";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { t } from "@/desenho/h2";

export async function POST(request: NextRequest) {
  const corpo = (await request.json()) as { mensagens: MsgEntrada[]; filtros?: Filtros; foto?: { mime: string; base64: string }; perfumeId?: string; conversaId?: string };
  const r = await responder(corpo.mensagens ?? [], corpo.filtros ?? {}, corpo.foto, corpo.perfumeId);
  const acervo = await carregarAcervo();
  const msg = paraTela(r, acervo.perfumes, t);

  let conversaId = corpo.conversaId ?? null;
  if (supabaseConfigurado()) {
    try {
      const supabase = await createClient();
      if (!conversaId) {
        const { data } = await supabase.from("conversas").insert({ titulo: r.titulo ?? corpo.mensagens.at(-1)?.texto.slice(0, 60) }).select("id").single();
        conversaId = data?.id ?? null;
      }
      if (conversaId) {
        const ultima = corpo.mensagens.at(-1);
        await supabase.from("mensagens").insert([
          ...(ultima ? [{ conversa_id: conversaId, papel: "eu", conteudo: { texto: ultima.texto, foto: Boolean(corpo.foto) } }] : []),
          { conversa_id: conversaId, papel: "sommelier", conteudo: { ...r } },
        ]);
      }
    } catch (e) {
      console.error("salvar conversa", e);
    }
  }
  return NextResponse.json({ msg, texto: r.texto, conversaId });
}
