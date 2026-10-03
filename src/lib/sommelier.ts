import "server-only";
import { carregarAcervo } from "@/lib/dados";
import { obterClima } from "@/lib/clima";
import { adequacao, diasDesde, dna, naColecao, hm } from "@/lib/analise";
import { geminiConfigurado, geminiJSON } from "@/lib/gemini";
import { corDoAcorde, hexA } from "@/lib/cores";
import type { Entrada, Perfume } from "@/lib/tipos";

export type Filtros = { ocasiao?: string; sentir?: string; origem?: string };
export type MsgEntrada = { papel: "eu" | "sommelier"; texto: string };
export type Sugestao = { rotulo: string; perfumeId: string; porque: string; dados: string[] };
export type Resposta = {
  texto: string;
  sugestoes?: Sugestao[];
  look?: { nome: string; cor: string }[];
  layering?: { base: string; baseBorrifadas: number; toque: string; toqueBorrifadas: number; porque: string };
  titulo?: string;
};

const OURO = "#D8B970";
const FORM: Record<string, [number, number, string]> = { alto: [22, 42, "5px"], ret: [30, 36, "6px"], redondo: [36, 32, "16px"], largo: [38, 30, "7px"] };

/** Converte a resposta no formato das telas (cards com frasco). */
export function paraTela(r: Resposta, perfumes: Map<string, Perfume>, t: Record<string, string>) {
  const sugestoes = (r.sugestoes ?? []).map((s, i, arr) => {
    const p = perfumes.get(s.perfumeId);
    if (!p) return null;
    const top = arr.length === 3 ? i === 1 : i === 0;
    const cor = top ? OURO : corDoAcorde(p.acorde);
    const F = FORM[p.forma] ?? FORM.ret;
    return {
      foto: p.imagem ?? null, rotulo: s.rotulo.toUpperCase(), nome: p.nome, marca: p.casa, porque: s.porque, dados: s.dados.slice(0, 2), href: `/colecao/${p.id}`,
      bw: F[0], bh: F[1], br: F[2], capW: Math.round(F[0] * 0.5), tampa: p.tampa,
      vidro: `linear-gradient(115deg, rgba(255,255,255,.35) 0%, ${hexA(cor, 0.32)} 45%, ${hexA(cor, 0.55)} 100%)`,
      palco: `radial-gradient(ellipse at 50% 85%, ${hexA(cor, 0.3)} 0%, rgba(0,0,0,0) 70%)`,
      bg: top ? t.tileFeature : t.chip, borda: top ? OURO : t.line, rotCor: top ? OURO : t.ink3,
    };
  }).filter(Boolean);
  const l = r.layering;
  return {
    som: true, eu: false, texto: r.texto,
    sugestoes: sugestoes.length ? sugestoes : null,
    look: r.look?.length ? r.look : null,
    layering: l ? { base: l.base, toque: l.toque, porque: l.porque, baseRot: `BASE · ${l.baseBorrifadas} BORRIFADA${l.baseBorrifadas > 1 ? "S" : ""}`, toqueRot: `TOQUE · ${l.toqueBorrifadas} BORRIFADA${l.toqueBorrifadas > 1 ? "S" : ""}` } : null,
  };
}

function resumoPerfume(e: Entrada) {
  const p = e.perfume;
  return `${p.id} | ${p.nome} (${p.casa}) | ${p.familia} | saída: ${p.notas.saida.join(", ")} | coração: ${p.notas.coracao.join(", ")} | fundo: ${p.notas.fundo.join(", ")} | fixação ${p.fixacaoH ?? "?"}h | projeção ${p.projecaoM ?? "?"} m | estações ${JSON.stringify(p.votos?.estacoes ?? {})} | parado há ${diasDesde(e.ultimoUso)} dias${e.anotacao ? ` | anotação: ${e.anotacao}` : ""}`;
}

const SCHEMA = {
  type: "OBJECT",
  properties: {
    titulo: { type: "STRING" },
    texto: { type: "STRING" },
    sugestoes: { type: "ARRAY", items: { type: "OBJECT", properties: { rotulo: { type: "STRING" }, perfumeId: { type: "STRING" }, porque: { type: "STRING" }, dados: { type: "ARRAY", items: { type: "STRING" } } }, required: ["rotulo", "perfumeId", "porque", "dados"] } },
    look: { type: "ARRAY", items: { type: "OBJECT", properties: { nome: { type: "STRING" }, cor: { type: "STRING" } }, required: ["nome", "cor"] } },
    layering: { type: "OBJECT", properties: { base: { type: "STRING" }, baseBorrifadas: { type: "INTEGER" }, toque: { type: "STRING" }, toqueBorrifadas: { type: "INTEGER" }, porque: { type: "STRING" } } },
  },
  required: ["texto"],
};

/** Responde como sommelier, com a coleção, o DNA e o clima como contexto. */
export async function responder(mensagens: MsgEntrada[], filtros: Filtros, foto?: { mime: string; base64: string }, perfumeId?: string): Promise<Resposta> {
  const acervo = await carregarAcervo();
  const clima = await obterClima();
  const itens = naColecao(acervo.colecao);
  const pergunta = mensagens.filter((m) => m.papel === "eu").slice(-1)[0]?.texto ?? "";

  if (geminiConfigurado()) {
    try {
      const d = dna(acervo.colecao);
      const foco = perfumeId ? acervo.perfumes.get(perfumeId) : undefined;
      const sistema = `Você é o sommelier do Parfum Atlas, a coleção pessoal de perfumes do Willian, em Campo Grande (MS). Fale em português do Brasil, direto, como um amigo que entende muito de perfume. Frases curtas, sem jargão, sem exagero.
Regras: sugira só perfumes da coleção (use o id exato da lista) a menos que ele peça "fora da coleção". Quando sugerir, dê de 1 a 3 opções; com 3, ordene do mais seguro ao mais ousado com os rótulos "Mais seguro", "O meu escolhido" e "Mais ousado". Em "dados" ponha até 2 fatos curtos (ex.: "8h30 na pele", "projeção moderada"). Se receber foto de roupa, preencha "look" com as peças e cores (hex) e, se fizer sentido, um "layering" entre dois perfumes da coleção. Não invente notas.`;
      const contexto = `Clima agora: ${clima.agora.temp} °C, umidade ${clima.agora.umidade}%${clima.noite ? `, ${clima.noite.temp} °C às ${clima.noite.hora}` : ""}.
DNA: ${d.titulo.join(" ")}. ${d.texto}
Filtros escolhidos: ${JSON.stringify(filtros)}.
${foco ? `A pergunta é sobre: ${foco.nome} (${foco.casa}), id ${foco.id}.` : ""}
Coleção (id | nome | família | notas | dados):
${itens.map(resumoPerfume).join("\n")}

Conversa:
${mensagens.map((m) => `${m.papel === "eu" ? "Willian" : "Sommelier"}: ${m.texto}`).join("\n")}`;
      const partes = [{ text: contexto }, ...(foto ? [{ inlineData: { mimeType: foto.mime, data: foto.base64 } }] : [])];
      const r = await geminiJSON<Resposta>(partes, { schema: SCHEMA, sistema, temperatura: 0.6, leve: !foto });
      r.sugestoes = (r.sugestoes ?? []).filter((s) => acervo.perfumes.has(s.perfumeId));
      return r;
    } catch (e) {
      console.error("sommelier gemini", e);
    }
  }
  return respostaLocal(pergunta, filtros, itens, clima.agora.temp, clima.agora.umidade, Boolean(foto));
}

/** Resposta sem IA: escolhe pelo clima, pela ocasião e pelo tempo parado. */
function respostaLocal(pergunta: string, filtros: Filtros, itens: Entrada[], temp: number, umid: number, comFoto: boolean): Resposta {
  const ocasiao = (filtros.ocasiao ?? "").toLowerCase();
  const ousado = (filtros.sentir ?? "").toLowerCase() === "marcante" || /marcante|ousad|festa/i.test(pergunta);
  const discreto = (filtros.sentir ?? "").toLowerCase() === "discreto" || /discret|trabalho|entrevista/i.test(pergunta + ocasiao);
  const ranking = itens.map((e) => {
    const p = e.perfume;
    let s = adequacao(p, temp, umid) * 0.6 + Math.min(1, diasDesde(e.ultimoUso) / 40) * 0.15;
    const oc = p.votos?.ocasioes.find((o) => o.nome.toLowerCase() === ocasiao)?.v ?? 50;
    s += (oc / 100) * 0.25;
    if (discreto) s -= ((p.projecaoM ?? 1.3) - 1.2) * 0.2;
    if (ousado) s += ((p.projecaoM ?? 1.3) - 1.2) * 0.15;
    return { e, s };
  }).sort((a, b) => b.s - a.s);
  const dados = (p: Perfume) => [p.fixacaoH ? `${hm(p.fixacaoH - (temp >= 28 ? 0.6 : 0))} na pele` : "", (p.projecaoM ?? 1.3) >= 1.7 ? "projeção forte" : (p.projecaoM ?? 1.3) >= 1.3 ? "marcante" : "projeção moderada"].filter(Boolean);
  const notas = (p: Perfume) => [p.notas.saida[0], p.notas.coracao[0], p.notas.fundo[0]].filter(Boolean).map((x) => x.toLowerCase()).join(", ").replace(/, ([^,]*)$/, " e $1");
  const [a, b, c] = ranking.map((r) => r.e.perfume);
  if (!a) return { texto: "Cadastre alguns frascos e eu passo a sugerir pelo clima e pela ocasião." };
  const ordem = [...[a, b, c].filter(Boolean)].sort((x, y) => (x.projecaoM ?? 1.3) - (y.projecaoM ?? 1.3));
  const rot = ["Mais seguro", "O meu escolhido", "Mais ousado"];
  if (comFoto) {
    return {
      texto: `Pela foto, o look pede algo limpo. O ${ordem[0].nome} conversa melhor com essa roupa. Se quiser mais presença, tente este layering:`,
      look: [{ nome: "Look da foto", cor: "#C9D1DE" }],
      layering: ordem[1] ? { base: ordem[0].nome, baseBorrifadas: 3, toque: ordem[ordem.length - 1].nome, toqueBorrifadas: 1, porque: `O ${ordem[ordem.length - 1].nome} aprofunda o fundo sem pesar. Borrife só no peito, por baixo da camisa.` } : undefined,
      titulo: "Look de hoje",
    };
  }
  return {
    titulo: pergunta.slice(0, 40) || "O que uso hoje?",
    texto: `Para ${temp} °C${ocasiao ? ` e ${ocasiao}` : ""}, separei ${ordem.length === 3 ? "três" : ordem.length} da sua coleção${ordem.length === 3 ? ", do mais seguro ao mais ousado" : ""}:`,
    sugestoes: ordem.map((p, i) => ({ rotulo: ordem.length === 3 ? rot[i] : i === 0 ? "O meu escolhido" : "Outra opção", perfumeId: p.id, porque: `${notas(p).charAt(0).toUpperCase() + notas(p).slice(1)}. ${temp >= 28 ? "Aguenta o calor" : temp >= 20 ? "Bom para hoje" : "Esquenta no frio"}${(p.projecaoM ?? 1.3) >= 1.7 ? ", mas chama atenção" : ""}.`, dados: dados(p) })),
  };
}
