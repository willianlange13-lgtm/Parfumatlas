import { carregarAcervo } from "@/lib/dados";
import { obterClima, descricaoAr } from "@/lib/clima";
import { naColecao } from "@/lib/analise";
import { paraTela, type Resposta } from "@/lib/sommelier";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import base from "@/data/desenho/SommelierPreto.json";
import { t } from "@/desenho/h2";

const quando = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
  if (d <= 0) return "HOJE";
  if (d === 1) return "ONTEM";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Campo_Grande" }).format(new Date(iso)).replace(".", "").replace(" de ", " ").toUpperCase();
};

export async function montarSommelier(conversaId?: string) {
  const acervo = await carregarAcervo();
  const clima = await obterClima();
  const n = naColecao(acervo.colecao).length;

  let historico = base.historico.map((h, i) => ({ ...h, href: "/sommelier", bg: i === 0 ? t.chip2 : "transparent" }));
  let msgs: Record<string, unknown>[] = [];
  if (supabaseConfigurado() && !acervo.demo) {
    const supabase = await createClient();
    const { data: conv } = await supabase.from("conversas").select("id, titulo, criada_em").order("criada_em", { ascending: false }).limit(8);
    historico = (conv ?? []).map((c) => ({ titulo: c.titulo ?? "Conversa", quando: quando(c.criada_em), bg: c.id === conversaId ? t.chip2 : "transparent", href: `/sommelier?c=${c.id}` }));
    if (conversaId) {
      const { data: ms } = await supabase.from("mensagens").select("papel, conteudo").eq("conversa_id", conversaId).order("criada_em");
      msgs = (ms ?? []).map((m) => (m.papel === "eu" ? { eu: true, som: false, texto: m.conteudo.texto, foto: null, semFoto: Boolean(m.conteudo.foto), soTexto: !m.conteudo.foto } : paraTela(m.conteudo as Resposta, acervo.perfumes, t)));
    }
  } else if (acervo.demo) {
    msgs = [
      { demo: true, eu: true, som: false, soTexto: true, texto: "Vou a um jantar ao ar livre hoje. Uns 27 °C. Quero algo marcante, mas sem exagero." },
      { demo: true, som: true, eu: false, texto: "Para 27 °C ao ar livre, à noite, eu iria em algo com abertura fresca e fundo que segure até a sobremesa. Separei três da sua coleção, do mais seguro ao mais ousado:", sugestoes: base.sugestoes.map((x) => ({ ...x, href: `/colecao/${[...acervo.perfumes.values()].find((p) => p.nome === x.nome)?.id ?? ""}` })), look: null, layering: null },
      { demo: true, eu: true, som: false, foto: null, semFoto: true, soTexto: false, texto: "Vou com essa roupa. Qual deles combina mais?" },
      { demo: true, som: true, eu: false, texto: "Linho azul-marinho com calça bege pede algo limpo e amadeirado. O Bleu de Chanel conversa melhor com esse look do que o Layton, que puxaria para um clima mais pesado. Se quiser um toque a mais de presença, tente este layering:", sugestoes: null, look: base.look, layering: { base: "Bleu de Chanel", toque: "Oud Wood", porque: "O oud aprofunda o incenso do Bleu sem pesar. Borrife o Oud Wood só no peito, por baixo da camisa.", baseRot: "BASE · 3 BORRIFADAS", toqueRot: "TOQUE · 1 BORRIFADA" } },
    ];
  }

  const ar = descricaoAr(clima.agora.umidade);
  return {
    base: {
      ...base,
      t,
      historico,
      subtitulo: `Conhece seus ${n} perfumes, seu DNA e o clima de agora`,
      clima: { titulo: `AGORA EM ${clima.cidade.toUpperCase()}`, temp: `${clima.agora.temp} °C`, sub: [`umidade ${clima.agora.umidade}%`, clima.noite ? `${clima.noite.temp < clima.agora.temp ? "cai" : "vai"} para ${clima.noite.temp} °C às ${clima.noite.hora}` : ar].filter(Boolean).join(" · ") },
    },
    msgs,
  };
}
