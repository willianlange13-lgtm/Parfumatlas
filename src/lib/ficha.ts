import "server-only";
import { geminiConfigurado, geminiJSON } from "@/lib/gemini";
import { carregarAcervo } from "@/lib/dados";
import type { Perfume } from "@/lib/tipos";

export type Candidato = { nome: string; casa: string; concentracao: string; por: string; pct: number; link?: string };
export type Identificacao = { lido: string[]; candidatos: Candidato[] };
export type FichaIA = Omit<Perfume, "id" | "clima"> & { revisar: string[] };

const ACORDES_OK = "Frutado, Cítrico, Fresco, Aromático, Lavanda, Aquático, Mineral, Floral, Verde, Amadeirado, Oud, Esfumaçado, Couro, Patchouli, Incenso, Âmbar, Especiado, Almíscar, Tabaco, Baunilha, Doce, Gourmand, Mel, Café";
const ACORDE_PRINCIPAL = "Frutado, Cítrico, Aromático, Aquático, Floral, Verde, Amadeirado, Couro, Âmbar, Especiado, Baunilha";

function normal(s: string) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim(); }

/** Busca no catálogo local (sem IA ou como reforço). */
async function buscaLocal(texto: string): Promise<Candidato[]> {
  const { perfumes } = await carregarAcervo();
  const q = normal(texto);
  const pal = q.split(" ").filter((x) => x.length > 1);
  return [...perfumes.values()]
    .map((p) => {
      const alvo = normal(`${p.nome} ${p.casa}`);
      const acertos = pal.filter((w) => alvo.includes(w)).length;
      const pct = pal.length ? Math.round((acertos / pal.length) * (normal(p.nome).startsWith(pal[0] ?? "") ? 96 : 80)) : 0;
      return { nome: p.nome, casa: p.casa, concentracao: (p.concentracao ?? "").toUpperCase(), por: "Encontrado no catálogo do Atlas", pct };
    })
    .filter((c) => c.pct >= 40)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);
}

/** Lê nome e casa do endereço (Fragrantica e Parfumo usam /Casa/Nome-123). */
function doLink(url: string): Candidato | null {
  try {
    const u = new URL(url);
    const partes = u.pathname.split("/").filter(Boolean);
    const i = partes.findIndex((p) => /^perfume(s)?$/i.test(p));
    const seg = i >= 0 ? partes.slice(i + 1) : partes.slice(-2);
    if (seg.length < 2) return null;
    const limpa = (s: string) => decodeURIComponent(s).replace(/\.html?$/, "").replace(/-\d+$/, "").replace(/[-_]+/g, " ").trim();
    return { casa: limpa(seg[0]), nome: limpa(seg[1]), concentracao: "", por: `Lido do link (${u.hostname.replace("www.", "")})`, pct: 90, link: url };
  } catch {
    return null;
  }
}

export async function identificar(modo: "foto" | "link" | "nome", texto?: string, foto?: { mime: string; base64: string }): Promise<Identificacao> {
  if (geminiConfigurado()) {
    try {
      if (modo === "foto" && foto) {
        return await geminiJSON<Identificacao>(
          [{ text: `Identifique o perfume da foto. Leia o que estiver escrito no frasco e descreva frasco e tampa. Dê até 3 candidatos, do mais provável ao menos, com a confiança em %. Em "por", explique em poucas palavras por que (ex.: "Rótulo e frasco batem com a foto", "Mesmo frasco da casa, rótulo diferente"). Concentração em maiúsculas (ex.: EAU DE PARFUM). Responda em português.` }, { inlineData: { mimeType: foto.mime, data: foto.base64 } }],
          { schema: { type: "OBJECT", properties: { lido: { type: "ARRAY", items: { type: "STRING" } }, candidatos: { type: "ARRAY", items: { type: "OBJECT", properties: { nome: { type: "STRING" }, casa: { type: "STRING" }, concentracao: { type: "STRING" }, por: { type: "STRING" }, pct: { type: "INTEGER" } }, required: ["nome", "casa", "concentracao", "por", "pct"] } } }, required: ["lido", "candidatos"] } },
        );
      }
      const pedido = modo === "link"
        ? `Abra este link e diga qual perfume é: ${texto}`
        : `O usuário digitou ou falou: "${texto}". Encontre os perfumes que ele pode querer dizer (pesquise se precisar).`;
      const r = await geminiJSON<Identificacao>([{ text: `${pedido}
Responda só com JSON: {"lido": [], "candidatos": [{"nome": "...", "casa": "...", "concentracao": "EAU DE PARFUM", "por": "motivo curto em português", "pct": 0-100}]}. Até 3 candidatos, do mais provável ao menos.` }], { pesquisar: true });
      if (modo === "link" && r.candidatos[0]) r.candidatos[0].link = texto;
      if (r.candidatos?.length) return r;
    } catch (e) {
      console.error("identificar", e);
    }
  }
  if (modo === "link" && texto) {
    const c = doLink(texto);
    const local = c ? await buscaLocal(`${c.nome} ${c.casa}`) : [];
    return { lido: [], candidatos: local.length ? local.map((x) => ({ ...x, link: texto })) : c ? [c] : [] };
  }
  return { lido: [], candidatos: texto ? await buscaLocal(texto) : [] };
}

export async function gerarFicha(c: { nome: string; casa: string; concentracao?: string; link?: string }): Promise<FichaIA | null> {
  const { perfumes } = await carregarAcervo();
  const local = [...perfumes.values()].find((p) => normal(p.nome) === normal(c.nome) && normal(p.casa) === normal(c.casa));
  if (geminiConfigurado()) {
    try {
      const f = await geminiJSON<FichaIA>([{ text: `Monte a ficha completa do perfume "${c.nome}" da casa "${c.casa}"${c.concentracao ? ` (${c.concentracao})` : ""}.${c.link ? ` Comece por este link: ${c.link}.` : ""}
Pesquise no Fragrantica, no Parfumo e no site oficial da marca. Use os votos da comunidade para fixação, projeção, estações, dia/noite e ocasiões.
Escreva tudo em português do Brasil (nomes das notas também: "Bergamota", "Almíscar", "Baunilha", "Âmbar cinzento"...).
Responda só com JSON, neste formato:
{"nome":"","casa":"","ano":2020,"concentracao":"Eau de Parfum","perfumistas":[""],"familia":"ex.: Chipre frutado","acorde":"um de: ${ACORDE_PRINCIPAL}","genero":"Masculino|Feminino|Unissex","pais":"","descricao":"1 ou 2 frases curtas, sem exagero",
"notas":{"saida":[],"coracao":[],"fundo":[]},
"acordes":[{"nome":"um de: ${ACORDES_OK}","valor":0-100}],
"fixacaoH":7.5,"projecaoM":1.4,
"votos":{"total":0,"fixacao":[muito fraca, fraca, moderada, duradoura, muito longa em %],"projecao":[íntima, moderada, forte, enorme em %],"estacoes":{"primavera":0-100,"verao":0-100,"outono":0-100,"inverno":0-100},"dia":0-100,"noite":0-100,"ocasioes":[{"nome":"Trabalho","v":0-100},{"nome":"Dia a dia","v":0},{"nome":"Encontro","v":0},{"nome":"Festa","v":0},{"nome":"Formal","v":0},{"nome":"Esporte","v":0}]},
"forma":"alto|ret|redondo|largo (formato do frasco)","tampa":"#hex da cor da tampa","imagem":"url da foto oficial do frasco, se achar",
"fontes":[{"nome":"Fragrantica","url":"","oQue":"notas e votos"}],
"revisar":["campos com pouca certeza, ex.: ano, perfumistas"]}` }], { pesquisar: true, temperatura: 0.2 });
      return { ...f, perfumistas: f.perfumistas ?? [], revisar: f.revisar ?? [], fontes: f.fontes ?? [], forma: f.forma ?? "ret", tampa: f.tampa ?? "#141417" };
    } catch (e) {
      console.error("gerarFicha", e);
    }
  }
  if (local) {
    const { id: _id, clima: _c, ...resto } = local;
    void _id; void _c;
    return { ...resto, revisar: [] };
  }
  return null;
}
