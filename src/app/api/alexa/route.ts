import { NextResponse, type NextRequest } from "next/server";
import { clienteServico } from "@/lib/supabase/servico";
import { lerAcervo } from "@/lib/dados";
import { obterClima } from "@/lib/clima";
import { afinidade, graficoClima, naColecao, perfumeDoDia } from "@/lib/analise";

type Pedido = { session?: { application?: { applicationId?: string } }; context?: { System?: { application?: { applicationId?: string } } }; request: { type: string; timestamp?: string; intent?: { name: string; slots?: Record<string, { value?: string }> } } };

const fala = (texto: string, fim = true) => NextResponse.json({ version: "1.0", response: { outputSpeech: { type: "PlainText", text: texto }, shouldEndSession: fim } });
const normal = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

/** Skill da Alexa (pt-BR). Uso pessoal: responde pela coleção do ATLAS_USER_ID. */
export async function POST(request: NextRequest) {
  const b = (await request.json()) as Pedido;
  const app = b.context?.System?.application?.applicationId ?? b.session?.application?.applicationId;
  if (!process.env.ALEXA_SKILL_ID || app !== process.env.ALEXA_SKILL_ID) return NextResponse.json({ erro: "skill desconhecida" }, { status: 401 });
  if (b.request.timestamp && Math.abs(Date.now() - new Date(b.request.timestamp).getTime()) > 150_000) return NextResponse.json({ erro: "pedido antigo" }, { status: 400 });

  const sb = clienteServico();
  const dono = process.env.ATLAS_USER_ID;
  if (!sb || !dono) return fala("O Parfum Atlas ainda não está ligado ao banco. Configure a chave de serviço e o seu usuário.");
  const { data: cfg } = await sb.from("configuracoes").select("*").eq("user_id", dono).maybeSingle();
  if (cfg && cfg.alexa_ligada === false) return fala("A Alexa está desligada nas configurações do Parfum Atlas.");
  const acervo = await lerAcervo(sb, dono);
  const clima = await obterClima(Number(cfg?.latitude ?? -20.4697), Number(cfg?.longitude ?? -54.6201), cfg?.cidade ?? "Campo Grande");
  const itens = naColecao(acervo.colecao);
  const achar = (nome?: string) => (nome ? itens.find((e) => normal(e.perfume.nome).includes(normal(nome)) || normal(nome).includes(normal(e.perfume.nome))) : undefined);

  const r = b.request;
  if (r.type === "LaunchRequest") return fala("Oi! Pergunte o que usar hoje, diga qual perfume você usou, ou pergunte quanto um perfume dura no calor.", false);
  if (r.type !== "IntentRequest" || !r.intent) return fala("Até mais.");
  const slot = r.intent.slots?.perfume?.value;

  switch (r.intent.name) {
    case "PerfumeDoDiaIntent": {
      const d = perfumeDoDia(acervo.colecao, clima.agora.temp, clima.agora.umidade);
      if (!d) return fala("Sua coleção ainda está vazia. Cadastre o primeiro frasco pelo app.");
      return fala(`Agora faz ${clima.agora.temp} graus em ${clima.cidade}. Eu iria de ${d.entrada.perfume.nome}. ${d.porque}`);
    }
    case "UsouIntent": {
      const e = achar(slot);
      if (!e) return fala(`Não achei ${slot ?? "esse perfume"} na sua coleção.`);
      await sb.from("usos").upsert({ colecao_id: e.id, user_id: dono }, { onConflict: "colecao_id,dia" });
      return fala(`Anotado: você usou o ${e.perfume.nome} hoje.`);
    }
    case "DuracaoIntent": {
      const e = achar(slot);
      const p = e?.perfume ?? [...acervo.perfumes.values()].find((x) => slot && normal(x.nome).includes(normal(slot)));
      if (!p) return fala(`Não achei ${slot ?? "esse perfume"}.`);
      const g = graficoClima(p);
      const h = g.pts.length ? g.estimar(clima.agora.temp) : p.fixacaoH;
      return fala(h ? `Com ${clima.agora.temp} graus, o ${p.nome} dura cerca de ${Math.round(h)} horas.` : `Ainda não tenho dados de fixação do ${p.nome}.`);
    }
    case "LancamentosIntent": {
      const lim = cfg?.alerta_afinidade ?? 80;
      const bons = acervo.lancamentos.map((l) => ({ l, pct: afinidade(l.perfume, acervo.colecao) })).filter((x) => x.pct >= lim).sort((a, b) => b.pct - a.pct);
      if (!bons.length) return fala(`Nenhum lançamento novo passa de ${lim} por cento de afinidade.`);
      return fala(`Tem ${bons.length} lançamento${bons.length > 1 ? "s" : ""} acima de ${lim} por cento. O melhor é o ${bons[0].l.perfume.nome}, da ${bons[0].l.perfume.casa}, com ${bons[0].pct} por cento.`);
    }
    case "AMAZON.HelpIntent":
      return fala("Você pode dizer: o que eu uso hoje, eu usei o Layton, quanto dura o Aventus no calor, ou tem lançamento novo.", false);
    default:
      return fala("Até mais.");
  }
}
