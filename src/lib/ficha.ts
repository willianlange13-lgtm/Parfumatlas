import "server-only";
import { geminiConfigurado, geminiJSON, geminiTexto, usaOpenAI } from "@/lib/gemini";
import { carregarAcervo, perfumeDaLinha } from "@/lib/dados";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { lerPagina, linkDePerfume, type Pagina } from "@/lib/pagina";
import { verificarParecidos } from "@/lib/verificar";
import { fotoConferida } from "@/lib/fotos";
import type { Perfume, Votos } from "@/lib/tipos";
import { acordePT, acordePrincipal, horasDosVotos, metrosDosVotos, notasPT, votosDe, temVotos } from "@/lib/normalizar";

export type Candidato = { nome: string; casa: string; concentracao: string; por: string; pct: number; link?: string; imagem?: string | null };
export type Identificacao = { lido: string[]; candidatos: Candidato[] };
export type FichaIA = Omit<Perfume, "id" | "clima"> & { revisar: string[]; completar?: boolean; fragrantica?: string };

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

const SCHEMA_ID = { type: "OBJECT", properties: { lido: { type: "ARRAY", items: { type: "STRING" } }, candidatos: { type: "ARRAY", items: { type: "OBJECT", properties: { nome: { type: "STRING" }, casa: { type: "STRING" }, concentracao: { type: "STRING" }, por: { type: "STRING" }, pct: { type: "INTEGER" }, link: { type: "STRING" } }, required: ["nome", "casa", "concentracao", "por", "pct"] } } }, required: ["lido", "candidatos"] };

/**
 * Descobre qual é o perfume. Para economizar a cota da IA:
 * link → lido do próprio endereço, sem IA; nome → catálogo primeiro, IA sem pesquisa só se precisar; foto → IA lendo a imagem.
 */
export async function identificar(modo: "foto" | "link" | "nome", texto?: string, foto?: { mime: string; base64: string }, rapido = false): Promise<Identificacao> {
  if (modo === "link" && texto) {
    const c = doLink(texto);
    if (c) {
      const local = await buscaLocal(`${c.nome} ${c.casa}`);
      const igual = local.find((x) => normal(x.nome) === normal(c.nome));
      return { lido: [], candidatos: [igual ? { ...igual, pct: 97, link: texto } : { ...c, pct: 95 }] };
    }
  }
  if (modo === "nome" && texto) {
    const local = await buscaLocal(texto);
    // enquanto digita: só o catálogo, sem gastar IA
    if (rapido || !geminiConfigurado()) return { lido: [], candidatos: local };
  }
  if (geminiConfigurado()) {
    try {
      if (modo === "foto" && foto) {
        return await geminiJSON<Identificacao>(
          [{ text: `Identifique o perfume da foto. Leia o que estiver escrito no frasco e descreva frasco e tampa. Dê até 3 candidatos, do mais provável ao menos, com a confiança em %. Em "por", explique em poucas palavras por que (ex.: "Rótulo e frasco batem com a foto", "Mesmo frasco da casa, rótulo diferente"). Concentração em maiúsculas (ex.: EAU DE PARFUM). Responda em português.` }, { inlineData: { mimeType: foto.mime, data: foto.base64 } }],
          { schema: SCHEMA_ID },
        );
      }
      if (usaOpenAI() && texto) {
        // modelo leve com pesquisa: só a lista de opções, a ficha vem depois que a pessoa escolhe
        const r = await geminiJSON<Identificacao>([{ text: `O usuário procura o perfume: "${texto}". Pesquise no Fragrantica (fragrantica.com.br ou fragrantica.com) e liste de 1 a 5 perfumes que existem de verdade e que ele pode querer dizer, do mais provável ao menos. Inclua as versões parecidas da mesma linha (ex.: EDP, Intense, Elixir) quando existirem. Para cada um: nome sem a casa, casa, concentração (em maiúsculas), em "por" um motivo curto em português (ex.: "Nome e casa iguais", "Mesma linha, outra versão"), a confiança em "pct" (0 a 100) e em "link" o endereço da página dele no Fragrantica.` }], { schema: SCHEMA_ID, pesquisar: true, leve: true });
        const lista = (r.candidatos ?? []).filter((x) => x?.nome).slice(0, 5).map((x) => ({ ...x, link: x.link && /fragrantica\./i.test(x.link) ? x.link : undefined, imagem: fotoDoFragrantica(x.link) }));
        if (lista.length) return { lido: [], candidatos: lista };
      }
      const r = await geminiJSON<Identificacao>([{ text: `O usuário digitou ou falou: "${texto}". Liste até 3 perfumes que existem de verdade e que ele pode querer dizer, do mais provável ao menos, com nome, casa e concentração (em maiúsculas). Em "por", um motivo curto em português. Se não reconhecer, devolva a lista vazia.` }], { schema: SCHEMA_ID, leve: true });
      if (r.candidatos?.length) return r;
    } catch (e) {
      console.error("identificar", e);
    }
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
        origem: { type: "STRING", enum: ["fragrantica", "estimativa"] },
      },
      required: ["total", "fixacao", "projecao", "estacoes", "dia", "noite", "ocasioes", "origem"],
    },
    forma: { type: "STRING", enum: ["alto", "ret", "redondo", "largo"] }, tampa: T, imagem: T,
    fontes: { type: "ARRAY", items: { type: "OBJECT", properties: { nome: T, url: T, oQue: T }, required: ["nome", "oQue"] } },
    revisar: L,
    mesmaCasa: { type: "ARRAY", items: { type: "OBJECT", properties: { nome: T, link: T }, required: ["nome", "link"] } },
    parecidos: { type: "ARRAY", items: { type: "OBJECT", properties: { nome: T, casa: T, tipo: { type: "STRING", enum: ["inspirou", "clone", "parecido"] }, pct: { type: "INTEGER" }, fonte: T, trecho: T, link: T }, required: ["nome", "casa", "tipo", "pct", "fonte", "trecho", "link"] } },
  },
  required: ["nome", "casa", "familia", "acorde", "notas", "acordes", "votos", "forma", "tampa", "fontes", "revisar"],
};

// a ficha principal não procura parecidos nem a mesma casa (isso vem na segunda etapa, em segundo plano)
const { parecidos: _p, mesmaCasa: _m, ...PROPS_PRINCIPAIS } = SCHEMA_FICHA.properties;
void _p; void _m;
const SCHEMA_PRINCIPAL = { ...SCHEMA_FICHA, properties: { ...PROPS_PRINCIPAIS, fragrantica: { type: "STRING" } } };

const REGRA_PARECIDOS = `COMO MONTAR OS PARECIDOS (faça as duas buscas):
A) Descubra se este perfume é inspirado num original famoso (ex.: Pacific Aura → Louis Vuitton Pacific Chill). Se for, o original entra com tipo "inspirou".
B) Pesquise os CLONES e alternativas desse original: busque "<original> clone", "<original> dupe", "<original> alternative", "contratipo <original>" no Fragrantica, Parfumo, Reddit, YouTube, blogs e lojas de contratipos árabes. Cada perfume apontado como clone/alternativa do original entra com tipo "clone" (ex.: para o Pacific Chill, perfumes como Rare Reef da Afnan, Elliur da Bidaya Parfums, Jean Lowe Vibe da Maison Alhambra).
C) Copie também a lista "Este Perfume me Lembra do" ("This perfume reminds me of") da página deste perfume no Fragrantica; os que ainda não estiverem na lista entram com tipo "parecido".
D) NUNCA use a lista "Quem gosta deste, também gosta de" ("People who like this also like"), e nunca inclua um perfume só por ser da mesma família ou também ser cítrico/fresco.
E) Junte tudo sem repetir, de 8 a 15 perfumes, do mais parecido ao menos. "pct": semelhança de 60 a 99 segundo as fontes (o original e os clones mais citados no topo).
F) "fonte": o endereço da página onde a relação aparece (lista de clones, resenha, vídeo, a página do Fragrantica); "trecho": a frase dessa página que cita o perfume (ex.: "Elliur is a great Pacific Chill clone"). Será conferido abrindo a página.
G) "link": o endereço da página DO PARECIDO no Fragrantica (ex.: https://www.fragrantica.com/perfume/Bidaya-Parfums/Elliur-12345.html), para mostrar a foto do frasco. Vazio se não achar.`;

/** O link do Fragrantica é mesmo deste perfume? (o nome precisa estar no endereço) */
const linkBate = (url: string | null | undefined, nome: string) => Boolean(url && normal(decodeURIComponent(url).replace(/[-_/]+/g, " ")).includes(normal(nome)));

const fotoDoFragrantica = (url?: string | null) => {
  const id = url?.match(/fragrantica\.com(?:\.br)?\/perfume\/[^?#]*-(\d+)\.html/i)?.[1];
  return id ? `https://fimgs.net/mdimg/perfume/375x500.${id}.jpg` : null;
};

const OCASIOES = [{ nome: "Trabalho", v: 50 }, { nome: "Dia a dia", v: 50 }, { nome: "Encontro", v: 50 }, { nome: "Festa", v: 50 }, { nome: "Formal", v: 50 }, { nome: "Esporte", v: 50 }];
const FAMILIA: Record<string, string> = { aromatic: "Aromático", aquatic: "Aquático", woody: "Amadeirado", floral: "Floral", fruity: "Frutado", chypre: "Chipre", oriental: "Oriental", amber: "Âmbar", citrus: "Cítrico", fougere: "Fougère", "fougère": "Fougère", leather: "Couro", gourmand: "Gourmand", spicy: "Especiado", green: "Verde", musky: "Almiscarado", vanilla: "Baunilha" };

/** "EDP", "eau de parfum" → "Eau de Parfum". */
function concentracaoPT(c?: string) {
  const t = (c ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
  if (/extrait|^parfum$|pure perfume/.test(t)) return "Extrait de Parfum";
  if (/eau de parfum|^edp$|edp intense/.test(t)) return /intense/.test(t) ? "Eau de Parfum Intense" : "Eau de Parfum";
  if (/eau de toilette|^edt$/.test(t)) return "Eau de Toilette";
  if (/eau de cologne|^edc$|cologne|^colonia$|agua de colonia/.test(t)) return "Eau de Cologne";
  if (/^perfume$|^parfum$/.test(t)) return "Extrait de Parfum";
  return c ?? "";
}

/** Deixa a ficha no padrão do Fragrantica Brasil e corrige números inconsistentes. */
function finalizar(f: FichaIA): FichaIA {
  const revisar = new Set(f.revisar ?? []);
  const notas = { saida: notasPT(f.notas?.saida), coracao: notasPT(f.notas?.coracao), fundo: notasPT(f.notas?.fundo) };
  const num = (x: unknown) => parseFloat(String(x ?? "").replace(",", ".").replace("%", "")) || 0;
  const brutos = (f.acordes ?? []).map((a) => { const o = a as unknown as Record<string, unknown>; return { nome: acordePT(String(o.nome ?? o.name ?? "")), valor: num(o.valor ?? o.value ?? o.forca ?? o.width) }; });
  const escala = Math.max(...brutos.map((a) => a.valor), 0) <= 1 ? 100 : 1; // veio de 0 a 1
  let acordes = brutos.map((a) => ({ nome: a.nome, valor: Math.max(0, Math.min(100, Math.round(a.valor * escala))) })).filter((a, i, l) => a.nome && l.findIndex((x) => x.nome === a.nome) === i);
  if (acordes.length && acordes.every((a) => !a.valor)) acordes = acordes.map((a, i) => ({ ...a, valor: Math.max(30, 100 - i * 12) }));
  const familia = (f.familia ?? "").split(/\s+/).map((w) => FAMILIA[w.toLowerCase()] ?? w).join(" ");
  const votos = votosDe(f.votos as Partial<Votos>, f.votos?.ocasioes?.length ? f.votos.ocasioes : OCASIOES);
  if (!votos || !temVotos(votos.fixacao) || !temVotos(votos.projecao)) revisar.add("votos");
  return {
    ...f,
    notas, acordes, familia,
    pais: /desconhecid|unknown|n\/a|^-$/i.test(f.pais ?? "") ? "" : f.pais,
    concentracao: concentracaoPT(f.concentracao),
    acorde: acordes[0] ? acordePrincipal(acordes[0].nome) : f.acorde,
    votos: votos ?? f.votos,
    fixacaoH: votos && temVotos(votos.fixacao) ? horasDosVotos(votos.fixacao) : f.fixacaoH,
    projecaoM: votos && temVotos(votos.projecao) ? metrosDosVotos(votos.projecao) : f.projecaoM,
    revisar: [...revisar],
    mesmaCasa: (f.mesmaCasa ?? []).filter((x, i, l) => x?.nome && normal(x.nome) !== normal(f.nome ?? "") && l.findIndex((y) => normal(y.nome) === normal(x.nome)) === i).slice(0, 8)
      .map((x) => ({ nome: x.nome, link: x.link && /fragrantica\./i.test(x.link) ? x.link : null, imagem: fotoDoFragrantica(x.link) })),
    parecidos: (f.parecidos ?? []).filter((x) => x?.nome && x?.casa && x.nome.toLowerCase() !== (f.nome ?? "").toLowerCase() && (Number(x.pct) || 70) >= 60).slice(0, 15).map((x) => ({ ...x, pct: Math.max(40, Math.min(99, Math.round(Number(x.pct) || 70))) })),
  };
}

/** Último erro da IA ao montar a ficha (aparece na tela e no diagnóstico). */
export let ultimoErroFicha = "";

export async function gerarFicha(c: { nome: string; casa: string; concentracao?: string; link?: string }): Promise<FichaIA | null> {
  const { perfumes } = await carregarAcervo();
  const local = [...perfumes.values()].find((p) => normal(p.nome) === normal(c.nome) && normal(p.casa) === normal(c.casa));
  const salva = await fichaSalva(c.nome, c.casa);
  if (salva) return salva;
  if (geminiConfigurado()) {
    ultimoErroFicha = "";
    const alvo = `"${c.nome}"${c.casa ? ` da casa "${c.casa}"` : ""}${c.concentracao ? ` (${c.concentracao})` : ""}`;
    if (usaOpenAI()) return fichaChatGPT(c, alvo, local);
    // 1) a página do link, lida direto (dados reais e a foto oficial)
    let pagina: Pagina | null = c.link ? await lerPagina(c.link) : null;
    // 2) pesquisa na internet, se não houver página ou para completar
    let pesquisa = "";
    if (!pagina) try {
      pesquisa = await geminiTexto([{ text: `Pesquise o perfume ${alvo}.${c.link ? ` A página dele: ${c.link}.` : ""} Use o Fragrantica, o Parfumo e o site oficial da marca.
Anote só o que encontrar nas fontes: ano, concentração, perfumistas, família olfativa, gênero, país da casa, notas de saída, coração e fundo, acordes principais com a força de cada um (0 a 100), votos da comunidade (fixação, projeção, estações, dia e noite, ocasiões), número de votos, formato e cor da tampa do frasco.
No fim, escreva o endereço completo da página do perfume no Fragrantica (linha "FRAGRANTICA: https://...").` }], { pesquisar: true, temperatura: 0.1 });
    } catch (e) {
      ultimoErroFicha = `pesquisa: ${e instanceof Error ? e.message.slice(0, 160) : e}`;
      console.error("gerarFicha pesquisa", e);
    }
    if (!pagina && pesquisa) {
      const link = linkDePerfume(pesquisa);
      if (link) pagina = await lerPagina(link);
    }
    // sem fonte nenhuma, não inventa: avisa
    if (!pagina && !pesquisa) {
      ultimoErroFicha = ultimoErroFicha || "sem fonte para consultar";
      if (local) { const { id: _i, clima: _c, ...resto } = local; void _i; void _c; return { ...resto, revisar: [] }; }
      return null;
    }
    // 3) organiza no formato da ficha, só com o que veio das fontes
    try {
      const f = await geminiJSON<FichaIA>([{ text: `Monte a ficha do perfume ${alvo} usando SOMENTE as fontes abaixo. Não invente: o que não estiver nas fontes fica vazio (ou 0) e entra em "revisar".
${pagina ? `\n=== PÁGINA ${pagina.url} ===\n${pagina.texto}\n` : ""}${pesquisa ? `\n=== PESQUISA ===\n${pesquisa}\n` : ""}
Regras:
- Tudo em português do Brasil, inclusive os nomes das notas ("Bergamota", "Almíscar", "Baunilha", "Âmbar cinzento").
- "acorde" é o principal, um de: ${ACORDE_PRINCIPAL}.
- Cada item de "acordes" usa um destes nomes: ${ACORDES_OK}. Valor de 0 a 100 (no Fragrantica, a largura da barra).
- fixacaoH em horas (ex.: 7.5) e projecaoM em metros (ex.: 1.4).
- votos.fixacao: 5 porcentagens (muito fraca, fraca, moderada, duradoura, muito longa). votos.projecao: 4 (íntima, moderada, forte, enorme). Estações, dia e noite de 0 a 100.
- ocasioes: Trabalho, Dia a dia, Encontro, Festa, Formal e Esporte, de 0 a 100.
- descricao: 1 ou 2 frases curtas, sem exagero. genero: Masculino, Feminino ou Unissex.
- forma do frasco: alto, ret, redondo ou largo. tampa: cor em hex (#RRGGBB).
- fontes: os sites usados e o que veio de cada um.` }], { schema: SCHEMA_FICHA, temperatura: 0.1, leve: Boolean(pagina) });
      const imagem = pagina?.imagem ?? (f.imagem && /^https:\/\/fimgs\.net\//.test(f.imagem) ? f.imagem : null);
      const fontes = f.fontes?.length ? f.fontes : pagina ? [{ nome: new URL(pagina.url).hostname.replace("www.", ""), url: pagina.url, oQue: "notas, acordes e votos" }] : [];
      return finalizar({ ...f, perfumistas: f.perfumistas ?? [], revisar: f.revisar ?? [], fontes, forma: f.forma ?? "ret", tampa: /^#[0-9a-f]{6}$/i.test(f.tampa ?? "") ? f.tampa : "#141417", imagem });
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

/** Ficha que já existe no banco (cadastrada antes): reaproveita sem gastar IA. */
async function fichaSalva(nome: string, casa: string): Promise<FichaIA | null> {
  if (!supabaseConfigurado() || !nome) return null;
  try {
    const sb = await createClient();
    let q = sb.from("perfumes").select("*").ilike("nome", nome.trim());
    if (casa) q = q.ilike("casa", casa.trim());
    const { data } = await q.limit(1).maybeSingle();
    if (!data || !(data.notas_saida as string[] | null)?.length) return null;
    // só reaproveita ficha completa (acordes com força e votos); senão, pesquisa de novo
    const ac = (data.acordes as { valor: number }[] | null) ?? [];
    const fx = (data.votos as { fixacao?: number[] } | null)?.fixacao ?? [];
    // [0,0,100,0,0] era o valor de reserva antigo (votos não encontrados): pesquisa de novo
    if (!ac.some((a) => a.valor > 0) || !fx.some((x) => x > 0) || fx.join() === "0,0,100,0,0") return null;
    const { id: _i, clima: _c, ...p } = perfumeDaLinha(data);
    void _i; void _c;
    return { ...p, revisar: p.revisar ?? [] };
  } catch {
    return null;
  }
}

/**
 * Segunda etapa, pedida pela tela depois que a ficha já apareceu (o cadastro não espera por ela):
 * perfumes da mesma casa sempre; votos só se faltaram. As duas pesquisas rodam ao mesmo tempo.
 */
export async function completarFicha(f: FichaIA): Promise<FichaIA> {
  if (!geminiConfigurado()) return { ...f, completar: false };
  const semVotos = !temVotos(f.votos?.fixacao) || !temVotos(f.votos?.projecao);
  const alvo = `"${f.nome}"${f.casa ? ` da casa "${f.casa}"` : ""}`;
  type Extra = { fixacao?: number[] | null; projecao?: number[] | null; total?: number | null; origem?: "fragrantica" | "estimativa" | null };
  const SCHEMA_EXTRA = { type: "OBJECT", properties: { fixacao: { type: "ARRAY", items: N }, projecao: { type: "ARRAY", items: N }, total: { type: "INTEGER" }, origem: { type: "STRING", enum: ["fragrantica", "estimativa"] } }, required: [] };
  const [x, viz] = await Promise.all([
    semVotos
      ? geminiJSON<Extra>([{ text: `Abra a página do perfume ${alvo} no Fragrantica${f.fragrantica ? ` (${f.fragrantica})` : ""} e copie:
- "fixacao": as 5 contagens de votos de "Longevidade"/"Longevity" na ordem [muito fraco, fraco, moderado, longo, eterno];
- "projecao": as 4 contagens de "Rastro"/"Sillage" na ordem [íntimo, moderado, forte, enorme];
- "total": o número de votos da avaliação.
Exemplo: {"fixacao": [42, 194, 855, 179, 23], "projecao": [120, 610, 240, 35], "total": 1971, "origem": "fragrantica"}.
Se o Fragrantica não mostrar os números, use o Parfumo, resenhas e lojas, transforme em porcentagens que somam 100 e use "origem": "estimativa". Nunca devolva zerado.` }], { schema: SCHEMA_EXTRA, pesquisar: true, leve: true, tempo: 80000 }).catch(() => ({}) as Extra)
      : Promise.resolve({} as Extra),
    buscarMesmaCasa(f.nome, f.casa, f.fragrantica).catch(() => []),
  ]);
  const out: FichaIA = { ...f, completar: false };
  if (semVotos) {
    const novos = votosDe({ ...(f.votos ?? {}), fixacao: x.fixacao ?? undefined, projecao: x.projecao ?? undefined, total: x.total || f.votos?.total, origem: x.origem ?? "estimativa" } as Partial<Votos>, f.votos?.ocasioes?.length ? f.votos.ocasioes : OCASIOES);
    if (novos && temVotos(novos.fixacao)) {
      out.votos = { ...novos, projecao: temVotos(novos.projecao) ? novos.projecao : (f.votos?.projecao ?? novos.projecao), estacoes: f.votos?.estacoes ?? novos.estacoes, dia: f.votos?.dia ?? novos.dia, noite: f.votos?.noite ?? novos.noite };
      out.fixacaoH = horasDosVotos(out.votos.fixacao);
      if (temVotos(out.votos.projecao)) out.projecaoM = metrosDosVotos(out.votos.projecao);
      out.revisar = (f.revisar ?? []).filter((r) => r !== "votos");
    }
  }
  if (viz.length) out.mesmaCasa = viz;
  return out;
}

/** Outros perfumes da mesma marca (seção "Designer" do Fragrantica), com foto. Pesquisa leve. */
async function buscarMesmaCasa(nome: string, casa: string, link?: string): Promise<NonNullable<FichaIA["mesmaCasa"]>> {
  const SCHEMA_M = { type: "OBJECT", properties: { mesmaCasa: SCHEMA_FICHA.properties.mesmaCasa }, required: ["mesmaCasa"] };
  const r = await geminiJSON<{ mesmaCasa: FichaIA["mesmaCasa"] }>([{ text: `Abra a página do perfume "${nome}"${casa ? ` da casa "${casa}"` : ""} no Fragrantica${link ? ` (${link})` : ""} e devolva "mesmaCasa": até 8 outros perfumes da mesma marca, da seção "Designer ${casa || "da marca"}" da página, cada um com o nome (sem a marca) e "link", o endereço da página dele no Fragrantica copiado exatamente como apareceu na busca (o número no fim identifica a foto). Se não viu a página, deixe "link" vazio; nunca monte um endereço.` }], { schema: SCHEMA_M, pesquisar: true, tempo: 80000 });
  return (r.mesmaCasa ?? []).filter((x, i, l) => x?.nome && normal(x.nome) !== normal(nome) && l.findIndex((y) => normal(y.nome) === normal(x.nome)) === i).slice(0, 8)
    .map((x) => ({ nome: x.nome, link: x.link && /fragrantica\./i.test(x.link) ? x.link : null }))
    .map(async (x) => ({ ...x, imagem: await fotoConferida(x.link, x.nome) }))
    .reduce(async (acc, x) => [...(await acc), await x], Promise.resolve([] as NonNullable<FichaIA["mesmaCasa"]>));
}

/** Refaz a busca de parecidos (e da mesma casa) de um perfume já salvo (botão na ficha). */
export async function buscarParecidos(nome: string, casa: string): Promise<NonNullable<FichaIA["parecidos"]>> {
  const SCHEMA_P = { type: "OBJECT", properties: { parecidos: SCHEMA_FICHA.properties.parecidos }, required: ["parecidos"] };
  const r = await geminiJSON<{ parecidos: FichaIA["parecidos"] }>([{ text: `Pesquise perfumes semelhantes a "${nome}"${casa ? ` da casa "${casa}"` : ""} e devolva "parecidos": a lista completa, cada um com nome, casa, tipo, pct, fonte, trecho e link, seguindo as regras abaixo.
${REGRA_PARECIDOS}` }], { schema: SCHEMA_P, pesquisar: true, tempo: 80000 });
  // sem conferência automática: a pessoa tira os errados na própria ficha
  return (r.parecidos ?? []).filter((x, i, l) => x?.nome && x?.casa && normal(x.nome) !== normal(nome) && l.findIndex((y) => normal(y.nome) === normal(x.nome)) === i).slice(0, 15)
    .map((x) => ({ ...x, pct: Math.max(60, Math.min(99, Math.round(Number(x.pct) || 70))), imagem: linkBate(x.link, x.nome) ? fotoDoFragrantica(x.link) : null }));
}

/** Semelhante colado pela pessoa: nome, casa e foto lidos do próprio link do Fragrantica. */
export function parecidoDoLink(url: string): NonNullable<FichaIA["parecidos"]>[number] | null {
  const c = doLink(url);
  if (!c || !/fragrantica\./i.test(url)) return null;
  return { nome: c.nome, casa: c.casa, tipo: "parecido", pct: 85, fonte: url, trecho: "adicionado por você", link: url, imagem: fotoDoFragrantica(url) };
}

/** ChatGPT: uma única chamada com pesquisa na internet monta a ficha inteira (como no chat). */
async function fichaChatGPT(c: { nome: string; casa: string; concentracao?: string; link?: string }, alvo: string, local?: Perfume): Promise<FichaIA | null> {
  const pagina = c.link ? await lerPagina(c.link) : null;
  // se a página abriu com pirâmide e votos, não precisa pesquisar (a pesquisa é a parte cara)
  const paginaCompleta = Boolean(pagina && /notas de topo|top notes/i.test(pagina.texto) && /longevidade|longevity/i.test(pagina.texto) && /me lembra|reminds me/i.test(pagina.texto));
  // a seção "Este perfume me lembra" costuma ficar no fim da página: junta ao recorte
  const iLembra = pagina ? pagina.texto.search(/me lembra|reminds me/i) : -1;
  const textoPagina = pagina ? pagina.texto.slice(0, paginaCompleta ? 18000 : 12000) + (iLembra > 12000 ? `\n...\n${pagina.texto.slice(iLembra, iLembra + 2500)}` : "") : "";
  try {
    const f = await geminiJSON<FichaIA & { fragrantica?: string }>([{ text: `Pesquise na internet o perfume ${alvo}${c.link ? ` (página: ${c.link})` : ""}. Use as fontes nesta ordem e passe para a seguinte sempre que a anterior não mostrar o dado:
1) Fragrantica (fragrantica.com.br e fragrantica.com);
2) Parfumo (parfumo.com), que mostra nota de fixação e de rastro com número de votos;
3) site da marca e lojas (concentração, ano, frasco);
4) resenhas, fóruns e vídeos (desempenho e perfumes parecidos).
${pagina ? `Texto da página já baixada:\n${textoPagina}\n` : ""}
Pirâmide, acordes e família vêm do Fragrantica, sem misturar. Os outros campos podem vir das outras fontes:
- Pirâmide: EXATAMENTE as notas de topo, coração e base do Fragrantica, com os nomes em português como aparecem no Fragrantica Brasil (ex.: "Cidra", "Groselha Preta", "Cenoura"). Uma nota por item, sem parênteses, sem notas citadas em resenhas ou lojas.
- "acordes": os "Principais acordes" do Fragrantica, na mesma ordem e com os mesmos nomes em português (ex.: "cítrico", "verde", "aromático", "fresco especiado", "frutado", "âmbar"). "valor" é o tamanho da barra, de 0 a 100 (a primeira é 100).
- "familia": a família do Fragrantica em português (ex.: "Aromático Aquático").
- "votos": as CONTAGENS de votos do Fragrantica (números inteiros, não porcentagens):
  · fixacao = 5 números [Muito fraco, Fraco, Moderada, Longa, Eterno] da seção "Longevidade";
  · projecao = 4 números [Íntimo, Moderada, Forte, Enorme] da seção "Rastro";
  · estacoes (inverno, primavera, verao, outono), dia e noite = votos da seção "Quando usar";
  · total = número de votos da avaliação; origem = "fragrantica".
  · exemplo: "fixacao": [42, 194, 855, 179, 23], "projecao": [120, 610, 240, 35], "estacoes": {"inverno": 60, "primavera": 410, "verao": 520, "outono": 170}, "dia": 600, "noite": 150.
  · Se o Fragrantica não mostrar esses números, NÃO deixe zerado: use a fixação e o rastro do Parfumo, as resenhas e as lojas e transforme em porcentagens que somam 100 (ex.: fixação moderada com 5 a 7 h → [5, 15, 55, 20, 5]; estações e dia/noite de 0 a 100) e use origem = "estimativa".
  · ocasioes: Trabalho, Dia a dia, Encontro, Festa, Formal, Esporte de 0 a 100 (estime pelo perfil).
- "concentracao": a que está escrita no frasco e no site da marca ou das lojas (ex.: "Eau de Parfum", "Eau de Toilette", "Extrait de Parfum"). O Fragrantica muitas vezes não mostra; nesse caso procure na marca e nas lojas. Nunca escreva "Colônia" sem o frasco dizer "Eau de Cologne".
- "pais": o país de origem da marca (ex.: Rayhaan, Lattafa, Armaf → "Emirados Árabes Unidos"; Dior, Chanel → "França"). Pesquise se não souber.
- Ano, perfumistas, gênero e uma descricao de 1 ou 2 frases curtas sobre o cheiro, em português.
- forma do frasco: alto, ret, redondo ou largo. tampa: cor da tampa em hex.
- "fragrantica": endereço completo da página do perfume no Fragrantica.
- fontes: sites usados e o que veio de cada um. O que não encontrar fica vazio e entra em "revisar".` }], { schema: SCHEMA_PRINCIPAL, pesquisar: !paginaCompleta });
    const imagem = pagina?.imagem ?? fotoDoFragrantica(c.link) ?? fotoDoFragrantica(f.fragrantica);
    f.parecidos = await verificarParecidos(f.nome || c.nome, f.parecidos);
    const { fragrantica: _fr, ...resto } = f;
    void _fr;
    const pronta = finalizar({ ...resto, perfumistas: f.perfumistas ?? [], revisar: f.revisar ?? [], fontes: f.fontes ?? [], forma: f.forma ?? "ret", tampa: /^#[0-9a-f]{6}$/i.test(f.tampa ?? "") ? f.tampa : "#141417", imagem });
    // votos ou parecidos faltando: a tela pede o complemento em segundo plano (outra chamada, sem travar o cadastro)
    const link = c.link ?? (f.fragrantica && /fragrantica\./i.test(f.fragrantica) ? f.fragrantica : undefined);
    return { ...pronta, completar: true, fragrantica: link };
  } catch (e) {
    ultimoErroFicha = `ficha: ${e instanceof Error ? e.message.slice(0, 200) : e}`;
    console.error("fichaChatGPT", e);
    if (local) { const { id: _i, clima: _c, ...resto } = local; void _i; void _c; return { ...resto, revisar: [] }; }
    return null;
  }
}
