import "server-only";
import { geminiConfigurado, geminiJSON, geminiTexto, usaOpenAI } from "@/lib/gemini";
import { carregarAcervo, perfumeDaLinha } from "@/lib/dados";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { lerPagina, linkDePerfume, type Pagina } from "@/lib/pagina";
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
      },
      required: ["fixacao", "projecao", "estacoes", "dia", "noite", "ocasioes"],
    },
    forma: { type: "STRING", enum: ["alto", "ret", "redondo", "largo"] }, tampa: T, imagem: T,
    fontes: { type: "ARRAY", items: { type: "OBJECT", properties: { nome: T, url: T, oQue: T }, required: ["nome", "oQue"] } },
    revisar: L,
    parecidos: { type: "ARRAY", items: { type: "OBJECT", properties: { nome: T, casa: T, tipo: { type: "STRING", enum: ["inspirou", "clone", "parecido"] }, pct: { type: "INTEGER" } }, required: ["nome", "casa", "tipo", "pct"] } },
  },
  required: ["nome", "casa", "familia", "acorde", "notas", "acordes", "votos", "forma", "tampa", "fontes", "revisar"],
};

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
    parecidos: (f.parecidos ?? []).filter((x) => x?.nome && x?.casa && x.nome.toLowerCase() !== (f.nome ?? "").toLowerCase()).slice(0, 10).map((x) => ({ ...x, pct: Math.max(40, Math.min(99, Math.round(Number(x.pct) || 70))) })),
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
 * Segunda pesquisa, pedida pela tela depois que a ficha já apareceu:
 * abre a página do Fragrantica para copiar os votos e completar os parecidos.
 */
export async function completarFicha(f: FichaIA): Promise<FichaIA> {
  const semVotos = !temVotos(f.votos?.fixacao) || !temVotos(f.votos?.projecao);
  const poucos = (f.parecidos ?? []).length < 5;
  if (!geminiConfigurado() || (!semVotos && !poucos)) return { ...f, completar: false };
  const alvo = `"${f.nome}"${f.casa ? ` da casa "${f.casa}"` : ""}`;
  type Extra = { fixacao?: number[]; projecao?: number[]; total?: number; parecidos?: FichaIA["parecidos"] };
  const x = await geminiJSON<Extra>([{ text: `Abra a página do perfume ${alvo} no Fragrantica${f.fragrantica ? ` (${f.fragrantica})` : ""} e copie:
${semVotos ? `- "fixacao": as 5 contagens de votos de "Longevidade"/"Longevity" na ordem [muito fraco, fraco, moderado, longo, eterno];
- "projecao": as 4 contagens de "Rastro"/"Sillage" na ordem [íntimo, moderado, forte, enorme];
- "total": o número de votos da avaliação.
Exemplo do formato: {"fixacao": [42, 194, 855, 179, 23], "projecao": [120, 610, 240, 35], "total": 1971}. Números inteiros, como aparecem na página.` : ""}
${poucos ? `- "parecidos": de 5 a 10 perfumes parecidos (seção "Este perfume me lembra"/"This perfume reminds me of" e comparações em resenhas e lojas de contratipos), cada um com nome, casa, tipo ("inspirou" para o original que ele imita, "clone" para releituras dele, "parecido" nos outros casos) e pct de 0 a 100.` : ""}` }], { pesquisar: true, tempo: 75000 });
  const out: FichaIA = { ...f, completar: false };
  const novos = votosDe({ ...(f.votos ?? {}), fixacao: x.fixacao, projecao: x.projecao, total: x.total || f.votos?.total } as Partial<Votos>, f.votos?.ocasioes?.length ? f.votos.ocasioes : OCASIOES);
  if (semVotos && novos && temVotos(novos.fixacao)) {
    out.votos = { ...novos, projecao: temVotos(novos.projecao) ? novos.projecao : (f.votos?.projecao ?? novos.projecao), estacoes: f.votos?.estacoes ?? novos.estacoes, dia: f.votos?.dia ?? novos.dia, noite: f.votos?.noite ?? novos.noite };
    out.fixacaoH = horasDosVotos(out.votos.fixacao);
    if (temVotos(out.votos.projecao)) out.projecaoM = metrosDosVotos(out.votos.projecao);
    out.revisar = (f.revisar ?? []).filter((r) => r !== "votos");
  }
  if (poucos && x.parecidos?.length) {
    const ja = new Set((f.parecidos ?? []).map((p) => p.nome.toLowerCase()));
    out.parecidos = [...(f.parecidos ?? []), ...x.parecidos.filter((p) => p?.nome && p?.casa && !ja.has(p.nome.toLowerCase()) && p.nome.toLowerCase() !== f.nome.toLowerCase())]
      .slice(0, 10).map((p) => ({ ...p, pct: Math.max(40, Math.min(99, Math.round(Number(p.pct) || 70))) }));
  }
  return out;
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
    const f = await geminiJSON<FichaIA & { fragrantica?: string }>([{ text: `Pesquise na internet o perfume ${alvo}${c.link ? ` (página: ${c.link})` : ""}. A fonte principal é a página dele no Fragrantica Brasil (fragrantica.com.br). Outras fontes só completam o que o Fragrantica não tiver.
${pagina ? `Texto da página já baixada:\n${textoPagina}\n` : ""}
Copie do Fragrantica, sem inventar e sem misturar outras fontes:
- Pirâmide: EXATAMENTE as notas de topo, coração e base do Fragrantica, com os nomes em português como aparecem no Fragrantica Brasil (ex.: "Cidra", "Groselha Preta", "Cenoura"). Uma nota por item, sem parênteses, sem notas citadas em resenhas ou lojas.
- "acordes": os "Principais acordes" do Fragrantica, na mesma ordem e com os mesmos nomes em português (ex.: "cítrico", "verde", "aromático", "fresco especiado", "frutado", "âmbar"). "valor" é o tamanho da barra, de 0 a 100 (a primeira é 100).
- "familia": a família do Fragrantica em português (ex.: "Aromático Aquático").
- "votos" com as CONTAGENS de votos do Fragrantica (números, não porcentagens):
  · fixacao = [Muito fraco, Fraco, Moderada, Longa, Eterno] da "Longevidade";
  · projecao = [Íntimo, Moderada, Forte, Enorme] do "Rastro";
  · estacoes = inverno, primavera, verao, outono e dia, noite do "Quando usar";
  · total = número de votos da avaliação;
  · exemplo do formato: "fixacao": [42, 194, 855, 179, 23], "projecao": [120, 610, 240, 35]. Sempre listas de números inteiros, nunca porcentagens nem textos;
  · ocasioes: Trabalho, Dia a dia, Encontro, Festa, Formal, Esporte de 0 a 100 (estime pelo perfil).
- "concentracao": a que está escrita no frasco e no site da marca ou das lojas (ex.: "Eau de Parfum", "Eau de Toilette", "Extrait de Parfum"). O Fragrantica muitas vezes não mostra; nesse caso procure na marca e nas lojas. Nunca escreva "Colônia" sem o frasco dizer "Eau de Cologne".
- "pais": o país de origem da marca (ex.: Rayhaan, Lattafa, Armaf → "Emirados Árabes Unidos"; Dior, Chanel → "França"). Pesquise se não souber.
- Ano, perfumistas, gênero e uma descricao de 1 ou 2 frases curtas sobre o cheiro, em português.
- forma do frasco: alto, ret, redondo ou largo. tampa: cor da tampa em hex.
- "parecidos": de 5 a 10 perfumes semelhantes (no mínimo 5), da seção "Este perfume me lembra" do Fragrantica e das comparações da comunidade (resenhas, vídeos, lojas de contratipos). Para cada um: nome, casa, "tipo" ("inspirou" se é o original em que este se inspira, "clone" se é uma releitura inspirada neste, "parecido" nos outros casos) e "pct", a semelhança de 0 a 100. Inclua o original famoso que ele lembra e outros contratipos árabes do mesmo DNA.
- "fragrantica": endereço completo da página do perfume no Fragrantica.
- fontes: sites usados e o que veio de cada um. O que não encontrar fica vazio e entra em "revisar".` }], { schema: { ...SCHEMA_FICHA, properties: { ...SCHEMA_FICHA.properties, fragrantica: { type: "STRING" } } }, pesquisar: !paginaCompleta });
    const imagem = pagina?.imagem ?? fotoDoFragrantica(c.link) ?? fotoDoFragrantica(f.fragrantica);
    const { fragrantica: _fr, ...resto } = f;
    void _fr;
    const pronta = finalizar({ ...resto, perfumistas: f.perfumistas ?? [], revisar: f.revisar ?? [], fontes: f.fontes ?? [], forma: f.forma ?? "ret", tampa: /^#[0-9a-f]{6}$/i.test(f.tampa ?? "") ? f.tampa : "#141417", imagem });
    // votos ou parecidos faltando: a tela pede o complemento em segundo plano (outra chamada, sem travar o cadastro)
    const link = c.link ?? (f.fragrantica && /fragrantica\./i.test(f.fragrantica) ? f.fragrantica : undefined);
    return { ...pronta, completar: !temVotos(pronta.votos?.fixacao) || (pronta.parecidos ?? []).length < 5, fragrantica: link };
  } catch (e) {
    ultimoErroFicha = `ficha: ${e instanceof Error ? e.message.slice(0, 200) : e}`;
    console.error("fichaChatGPT", e);
    if (local) { const { id: _i, clima: _c, ...resto } = local; void _i; void _c; return { ...resto, revisar: [] }; }
    return null;
  }
}
