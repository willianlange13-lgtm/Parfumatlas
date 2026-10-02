import "server-only";
import { carregarAcervo } from "@/lib/dados";
import { afinidade, naColecao, similaridade, hm } from "@/lib/analise";
import { geminiConfigurado, geminiJSON } from "@/lib/gemini";
import { gerarFicha } from "@/lib/ficha";
import type { Perfume } from "@/lib/tipos";

const normal = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

/** Encontra o perfume pelo id ou pelo nome e casa (no acervo; se não houver, a IA monta a ficha). */
export async function acharPerfume(q: { id?: string; nome?: string; casa?: string; conc?: string; link?: string }): Promise<{ p: Perfume | null; novo: boolean }> {
  const acervo = await carregarAcervo();
  if (q.id && acervo.perfumes.has(q.id)) return { p: acervo.perfumes.get(q.id)!, novo: false };
  if (q.nome) {
    const achado = [...acervo.perfumes.values()].find((p) => normal(p.nome) === normal(q.nome!) && (!q.casa || normal(p.casa) === normal(q.casa)));
    if (achado) return { p: achado, novo: false };
    const f = await gerarFicha({ nome: q.nome, casa: q.casa ?? "", concentracao: q.conc, link: q.link });
    if (f) return { p: { ...f, id: "", forma: f.forma ?? "ret", tampa: f.tampa ?? "#141417" } as Perfume, novo: true };
  }
  return { p: null, novo: false };
}

const melhorEm = (p: Perfume) => {
  const e = p.votos?.estacoes;
  const noite = (p.votos?.noite ?? 50) > (p.votos?.dia ?? 50);
  const frio = e ? e.inverno + e.outono > e.verao + e.primavera : false;
  return `${noite ? "Noite" : "Dia"} e ${frio ? "frio" : "calor"}`;
};

export async function veredito(p: Perfume) {
  const acervo = await carregarAcervo();
  const meus = naColecao(acervo.colecao);
  const tem = meus.find((e) => e.perfumeId === p.id || (normal(e.perfume.nome) === normal(p.nome) && normal(e.perfume.casa) === normal(p.casa)));
  const quero = acervo.colecao.some((e) => e.situacao === "quero" && (e.perfumeId === p.id || normal(e.perfume.nome) === normal(p.nome)));
  const pct = afinidade(p, acervo.colecao);
  const parecido = meus.filter((e) => e.perfume.id !== p.id).map((e) => ({ e, s: similaridade(p, e.perfume) })).sort((a, b) => b.s - a.s)[0];
  const s = parecido?.e.perfume;

  const linhas = s
    ? [
        { l: "Fixação", a: p.fixacaoH ? hm(p.fixacaoH) : "—", b: s.fixacaoH ? hm(s.fixacaoH) : "—" },
        { l: "Projeção", a: p.projecaoM ? `${p.projecaoM.toFixed(1).replace(".", ",")} m` : "—", b: s.projecaoM ? `${s.projecaoM.toFixed(1).replace(".", ",")} m` : "—" },
        { l: "Família", a: p.familia, b: s.familia },
        { l: "Melhor em", a: melhorEm(p), b: melhorEm(s) },
      ]
    : [];

  let texto = "";
  if (tem) texto = `Você já tem o ${p.nome}. Se ele estiver acabando, vale repor; se não, gaste a verba em algo que a coleção ainda não tem.`;
  else if (s && parecido.s >= 82) {
    const maisFixo = (p.fixacaoH ?? 0) > (s.fixacaoH ?? 0) + 0.4;
    texto = `Você já tem o ${s.nome}, que fica bem perto. O ${p.nome} é ${p.familia.toLowerCase()}${maisFixo ? " e dura mais" : ""}. Vale se você quer uma versão para ${melhorEm(p).toLowerCase()}; para ${melhorEm(s).toLowerCase()}, o seu ${s.nome} já cobre.`;
  } else if (pct >= 80) texto = `Combina com o seu DNA (${pct}%) e não há nada muito parecido na coleção. É uma compra que acrescenta: ${p.familia.toLowerCase()} com ${p.notas.saida[0]?.toLowerCase() ?? "abertura própria"} na saída.`;
  else if (pct >= 65) texto = `Fica no meio do caminho: ${pct}% de afinidade. Teste na pele antes, de preferência num dia de ${melhorEm(p).toLowerCase().split(" e ")[1]}.`;
  else texto = `Fica longe do seu gosto (${pct}%). Só vale se a ideia for sair da zona de conforto de propósito.`;

  if (geminiConfigurado() && !tem) {
    try {
      const r = await geminiJSON<{ texto: string }>(
        [{ text: `O usuário está numa loja olhando o perfume ${p.nome} (${p.casa}, ${p.familia}). Afinidade com a coleção dele: ${pct}%. ${s ? `O mais parecido que ele tem é o ${s.nome} (${s.familia}), similaridade ${parecido.s}%.` : ""}
Coleção: ${meus.map((e) => e.perfume.nome).join(", ")}.
Diga em até 3 frases curtas, em português do Brasil, direto, se vale a pena comprar e por quê. Pode usar **negrito** em até duas expressões.` }],
        { schema: { type: "OBJECT", properties: { texto: { type: "STRING" } }, required: ["texto"] }, temperatura: 0.5 },
      );
      if (r.texto) texto = r.texto;
    } catch (e) {
      console.error("veredito", e);
    }
  }
  return { tem: Boolean(tem), quero, pct, parecido: s ? { nome: s.nome, sim: parecido.s } : null, linhas, texto };
}
