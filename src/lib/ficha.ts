import "server-only";
import { geminiConfigurado, geminiJSON, geminiTexto } from "@/lib/gemini";
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

const N = { type: "NUMBER" }, T = { type: "STRING" }, L = { type: "ARRAY", items: { type: "STRING" } };
const SCHEMA_FICHA = {
  type: "OBJECT",
  properties: {
    nome: T, casa: T, ano: { type: "INTEGER" }, concentracao: T, perfumistas: L, familia: T, acorde: T, genero: T, pais: T, descricao: T,
    notas: { type: "OBJECT", properties: { saida: L, coracao: L, fundo: L }, required: ["saida", "coracao", "fundo"] },
    acordes: { type: "ARRAY", items: { type: "OBJECT", properties: { nome: T, valor: N }, required: ["nome", "valor"] } },
    fixacaoH: N, projecaoM: N,
    votos: {
      type: "OBJECT",
      properties: {
        total: { type: "INTEGER" }, fixacao: { type: "ARRAY", items: N }, projecao: { type: "ARRAY", items: N },
        estacoes: { type: "OBJECT", properties: { primavera: N, verao: N, outono: N, inverno: N }, required: ["primavera", "verao", "outono", "inverno"] },
        dia: N, noite: N, ocasioes: { type: "ARRAY", items: { type: "OBJECT", properties: { nome: T, v: N }, required: ["nome", "v"] } },
      },
      required: ["fixacao", "projecao", "estacoes", "dia", "noite", "ocasioes"],
    },
    forma: { type: "STRING", enum: ["alto", "ret", "redondo", "largo"] }, tampa: T, imagem: T,
    fontes: { type: "ARRAY", items: { type: "OBJECT", properties: { nome: T, url: T, oQue: T }, required: ["nome", "oQue"] } },
    revisar: L,
  },
  required: ["nome", "casa", "familia", "acorde", "notas", "acordes", "votos", "forma", "tampa", "fontes", "revisar"],
};

/** Último erro da IA ao montar a ficha (aparece na tela e no diagnóstico). */
export let ultimoErroFicha = "";

export async function gerarFicha(c: { nome: string; casa: string; concentracao?: string; link?: string }): Promise<FichaIA | null> {
  const { perfumes } = await carregarAcervo();
  const local = [...perfumes.values()].find((p) => normal(p.nome) === normal(c.nome) && normal(p.casa) === normal(c.casa));
  if (geminiConfigurado()) {
    ultimoErroFicha = "";
    const alvo = `"${c.nome}" da casa "${c.casa}"${c.concentracao ? ` (${c.concentracao})` : ""}`;
    // 1) pesquisa na internet, em texto livre
    let pesquisa = "";
    try {
      pesquisa = await geminiTexto([{ text: `Pesquise o perfume ${alvo}.${c.link ? ` Comece por este link: ${c.link}.` : ""} Use o Fragrantica, o Parfumo e o site oficial da marca.
Anote: ano, concentração, perfumistas, família olfativa, gênero, país da casa, notas de saída, coração e fundo, acordes principais com a força de cada um (0 a 100), votos da comunidade (fixação, projeção, estações, dia e noite, ocasiões), número de votos, formato e cor da tampa do frasco, URL da foto oficial e os sites consultados.` }], { pesquisar: true, temperatura: 0.2 });
    } catch (e) {
      ultimoErroFicha = `pesquisa: ${e instanceof Error ? e.message.slice(0, 160) : e}`;
      console.error("gerarFicha pesquisa", e);
    }
    // 2) organiza no formato da ficha (com ou sem a pesquisa)
    try {
      const f = await geminiJSON<FichaIA>([{ text: `Monte a ficha do perfume ${alvo} no formato pedido.
${pesquisa ? `Use estas anotações da pesquisa:\n${pesquisa}\n` : "Use o que você sabe sobre ele e marque em \"revisar\" o que tiver pouca certeza.\n"}
Regras:
- Tudo em português do Brasil, inclusive os nomes das notas ("Bergamota", "Almíscar", "Baunilha", "Âmbar cinzento").
- "acorde" é o principal, um de: ${ACORDE_PRINCIPAL}.
- Cada item de "acordes" usa um destes nomes: ${ACORDES_OK}. Valor de 0 a 100.
- fixacaoH em horas (ex.: 7.5) e projecaoM em metros (ex.: 1.4).
- votos.fixacao: 5 porcentagens (muito fraca, fraca, moderada, duradoura, muito longa). votos.projecao: 4 (íntima, moderada, forte, enorme). Estações, dia e noite de 0 a 100.
- ocasioes: Trabalho, Dia a dia, Encontro, Festa, Formal e Esporte, de 0 a 100.
- descricao: 1 ou 2 frases curtas, sem exagero. genero: Masculino, Feminino ou Unissex.
- forma do frasco: alto, ret, redondo ou largo. tampa: cor em hex (#RRGGBB).
- fontes: os sites usados e o que veio de cada um. revisar: campos com pouca certeza.` }], { schema: SCHEMA_FICHA, temperatura: 0.2 });
      return { ...f, perfumistas: f.perfumistas ?? [], revisar: f.revisar ?? [], fontes: f.fontes ?? [], forma: f.forma ?? "ret", tampa: /^#[0-9a-f]{6}$/i.test(f.tampa ?? "") ? f.tampa : "#141417", imagem: f.imagem || null };
    } catch (e) {
      ultimoErroFicha = `${ultimoErroFicha ? ultimoErroFicha + " · " : ""}ficha: ${e instanceof Error ? e.message.slice(0, 160) : e}`;
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
