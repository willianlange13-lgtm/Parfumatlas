import "server-only";
import { registrarIA } from "@/lib/telemetria-ia";

/**
 * Política de custo do Atlas:
 * - Gemini é o provedor padrão sempre que GEMINI_API_KEY estiver configurada.
 * - OpenAI só é escolhida explicitamente com AI_PROVIDER=openai, ou como fallback
 *   de compatibilidade quando não existe uma chave Gemini.
 * - AI_PREMIUM_ENABLED continua reservado às pesquisas premium em background.
 */
export const usaOpenAI = () => Boolean(process.env.OPENAI_API_KEY) && (process.env.AI_PROVIDER === "openai" || !process.env.GEMINI_API_KEY);
export const geminiConfigurado = () => Boolean(process.env.GEMINI_API_KEY) || Boolean(process.env.OPENAI_API_KEY);
export const nomeIA = () => (usaOpenAI() ? "ChatGPT" : Boolean(process.env.GEMINI_API_KEY) ? "Gemini" : "IA não configurada");
/** "gemini-flash-latest" sempre aponta para o Flash mais novo, então não sai de linha. */
/** Se um modelo estiver fora de linha, sem cota ou sobrecarregado, tenta o seguinte. */
const MODELOS = (leve = false) => [...new Set([process.env.GEMINI_MODEL, ...(leve ? ["gemini-flash-lite-latest", "gemini-flash-latest"] : ["gemini-flash-latest", "gemini-flash-lite-latest"])].filter(Boolean) as string[])];
const espera = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

type Parte = { text: string } | { inlineData: { mimeType: string; data: string } };

/**
 * Chama o Gemini e devolve JSON. Com `pesquisar`, liga a busca do Google e a leitura de links
 * (nesse modo a API não aceita schema, então o JSON vem pedido no próprio texto).
 */
export async function geminiJSON<T>(partes: Parte[], opcoes: { schema?: object; pesquisar?: boolean; sistema?: string; temperatura?: number; leve?: boolean; esforco?: "low" | "medium"; tempo?: number; maxBuscas?: number; tarefa?: string } = {}): Promise<T> {
  const inicio = Date.now();
  const texto = await chamar(partes, opcoes, true);
  const lido = lerJSON<T>(texto);
  if (lido !== null) return lido;
  // só tenta de novo se ainda houver tempo antes do limite da Vercel
  if (Date.now() - inicio > 45000) throw new Error(`a IA não devolveu a ficha no formato certo (respondeu: "${texto.slice(0, 80)}…")`);
  // às vezes a IA responde com uma pergunta ("Posso fazer…?") em vez do JSON: pede de novo, sem conversa
  const denovo = await chamar([...partes, { text: `Sua resposta anterior foi: "${texto.slice(0, 300)}". Isso não serve. Ninguém vai responder perguntas. Faça a pesquisa agora e devolva SOMENTE o objeto JSON, começando com { e terminando com }.` }], { ...opcoes, tempo: Math.max(20000, 100000 - (Date.now() - inicio)) }, true);
  const lido2 = lerJSON<T>(denovo);
  if (lido2 !== null) return lido2;
  throw new Error(`a IA não devolveu a ficha no formato certo (respondeu: "${denovo.slice(0, 80)}…")`);
}

function lerJSON<T>(texto: string): T | null {
  const limpo = texto.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const ini = limpo.search(/[[{]/);
  const fim = Math.max(limpo.lastIndexOf("}"), limpo.lastIndexOf("]"));
  if (ini < 0 || fim <= ini) return null;
  try {
    return JSON.parse(limpo.slice(ini, fim + 1)) as T;
  } catch {
    return null;
  }
}

const SEM_PERGUNTAS = "Você é um serviço automático, sem pessoa do outro lado. Nunca faça perguntas, nunca peça confirmação e nunca ofereça opções: pesquise e entregue o resultado completo na primeira resposta. Quando pedirem JSON, a resposta inteira é um único objeto JSON, sem texto antes ou depois.";

/** Chama o Gemini e devolve o texto livre (usado na pesquisa antes de montar o JSON). */
export async function geminiTexto(partes: Parte[], opcoes: { pesquisar?: boolean; sistema?: string; temperatura?: number } = {}): Promise<string> {
  return chamar(partes, opcoes, false);
}

type OpcoesChamada = { schema?: object; pesquisar?: boolean; sistema?: string; temperatura?: number; leve?: boolean; esforco?: "low" | "medium"; tempo?: number; maxBuscas?: number; tarefa?: string };

/** Registra as falhas também (o sucesso é registrado dentro de cada provedor, com tokens e buscas). */
async function chamar(partes: Parte[], opcoes: OpcoesChamada, json: boolean): Promise<string> {
  const inicio = Date.now();
  const openai = usaOpenAI();
  try {
    return await (openai ? chamarOpenAI(partes, opcoes, json) : chamarGemini(partes, opcoes, json));
  } catch (e) {
    registrarIA({
      tarefa: opcoes.tarefa ?? (opcoes.pesquisar ? "pesquisa" : "geracao"),
      provedor: openai ? "openai" : "gemini",
      modelo: "",
      pesquisaWeb: Boolean(opcoes.pesquisar),
      duracaoMs: Date.now() - inicio,
      sucesso: false,
      // só o começo da mensagem do provedor: nunca prompt, resposta ou chave
      erro: (e instanceof Error ? e.message : String(e)).replace(/sk-[\w-]+/g, "[chave]").slice(0, 120),
    });
    throw e;
  }
}

async function chamarGemini(partes: Parte[], opcoes: OpcoesChamada, json: boolean): Promise<string> {
  const chave = process.env.GEMINI_API_KEY;
  if (!chave) throw new Error("Nenhum provedor de IA configurado");
  const inicioChamada = Date.now();
  let modeloUsado = "";
  const corpo: Record<string, unknown> = {
    contents: [{ role: "user", parts: partes }],
    generationConfig: { temperature: opcoes.temperatura ?? 0.4, ...(opcoes.pesquisar || !json ? {} : { responseMimeType: "application/json", ...(opcoes.schema ? { responseSchema: opcoes.schema } : {}) }) },
  };
  if (opcoes.sistema) corpo.systemInstruction = { parts: [{ text: opcoes.sistema }] };
  if (opcoes.pesquisar) corpo.tools = [{ google_search: {} }, { url_context: {} }];
  let r: Response | null = null;
  let ultimo = "";
  externo: for (const modelo of MODELOS(opcoes.leve)) {
    modeloUsado = modelo;
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": chave },
        body: JSON.stringify(corpo),
        signal: AbortSignal.timeout(45000),
      });
      if (r.ok) break externo;
      ultimo = `Gemini ${r.status} (${modelo}): ${(await r.clone().text()).slice(0, 200)}`;
      if (r.status === 503 && tentativa === 0) { await espera(1500); continue; }
      if ([404, 429, 503].includes(r.status)) continue externo;
      break externo;
    }
  }
  if (!r) throw new Error("Gemini: nenhum modelo disponível");
  if (!r.ok) throw new Error(ultimo || `Gemini ${r.status}`);
  const j = await r.json();
  const uso = j.usageMetadata ?? {};
  const consultas = j.candidates?.[0]?.groundingMetadata?.webSearchQueries;
  registrarIA({
    tarefa: opcoes.tarefa ?? (opcoes.pesquisar ? "pesquisa" : "geracao"),
    provedor: "gemini",
    modelo: modeloUsado,
    pesquisaWeb: Boolean(opcoes.pesquisar),
    duracaoMs: Date.now() - inicioChamada,
    sucesso: true,
    status: r.status,
    buscasReais: Array.isArray(consultas) ? consultas.length : 0,
    inputTokens: Number(uso.promptTokenCount ?? 0) || null,
    outputTokens: Number(uso.candidatesTokenCount ?? 0) || null,
  });
  const texto: string = (j.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
  if (!texto) throw new Error(`Gemini respondeu vazio (${j.candidates?.[0]?.finishReason ?? j.promptFeedback?.blockReason ?? "sem motivo"})`);
  return texto;
}

// ---------------- ChatGPT (OpenAI, Responses API) ----------------

/** Modelos do mais barato ao mais capaz. OPENAI_MODEL na Vercel passa na frente. */
const MODELOS_OPENAI = (leve = false) =>
  [...new Set([process.env.OPENAI_MODEL, ...(leve ? ["gpt-5-nano", "gpt-4.1-nano", "gpt-4o-mini"] : ["gpt-5-mini", "gpt-4.1-mini", "gpt-4o-mini"])].filter(Boolean) as string[])];

/** Converte o schema no estilo do Gemini (OBJECT, STRING…) para JSON Schema comum, só para descrever o formato. */
function schemaComum(o: unknown): unknown {
  if (Array.isArray(o)) return o.map(schemaComum);
  if (o && typeof o === "object") {
    const r: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o)) r[k] = k === "type" && typeof v === "string" ? v.toLowerCase() : schemaComum(v);
    return r;
  }
  return o;
}

/**
 * Schema "estrito" da OpenAI: todo campo é obrigatório e nada além dele.
 * Campo que era opcional passa a aceitar null. Assim o JSON sempre volta no formato certo.
 */
export function schemaEstrito(o: unknown, opcional = false): unknown {
  if (!o || typeof o !== "object") return o;
  const s = o as Record<string, unknown>;
  const tipo = String(s.type ?? "").toLowerCase();
  const nulo = (t: string) => (opcional ? [t, "null"] : t);
  if (tipo === "object") {
    const props = (s.properties ?? {}) as Record<string, unknown>;
    const req = new Set((s.required as string[] | undefined) ?? []);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(props)) out[k] = schemaEstrito(v, !req.has(k));
    return { type: nulo("object"), properties: out, required: Object.keys(props), additionalProperties: false };
  }
  if (tipo === "array") return { type: nulo("array"), items: schemaEstrito(s.items) };
  const base: Record<string, unknown> = { type: nulo(tipo === "integer" ? "integer" : tipo === "number" ? "number" : tipo === "boolean" ? "boolean" : "string") };
  if (Array.isArray(s.enum)) base.enum = opcional ? [...s.enum, null] : s.enum;
  return base;
}

async function chamarOpenAI(partes: Parte[], opcoes: { schema?: object; pesquisar?: boolean; sistema?: string; temperatura?: number; leve?: boolean; esforco?: "low" | "medium"; tempo?: number; maxBuscas?: number; tarefa?: string }, json: boolean): Promise<string> {
  const chave = process.env.OPENAI_API_KEY!;
  const inicioChamada = Date.now();
  const conteudo = partes.map((p) => ("text" in p ? { type: "input_text", text: p.text } : { type: "input_image", image_url: `data:${p.inlineData.mimeType};base64,${p.inlineData.data}` }));
  if (json) conteudo.push({ type: "input_text", text: `Responda só com um JSON válido${opcoes.schema ? ` neste formato (JSON Schema): ${JSON.stringify(schemaComum(opcoes.schema))}` : ""}.` });
  const corpo: Record<string, unknown> = {
    input: [{ role: "user", content: conteudo }],
    ...(opcoes.sistema || json ? { instructions: [json ? SEM_PERGUNTAS : "", opcoes.sistema ?? ""].filter(Boolean).join("\n\n") } : {}),
    ...(opcoes.pesquisar ? { tools: [{ type: "web_search" }] } : {}),
  };
  const formato = json ? (opcoes.schema ? { type: "json_schema", name: "resposta", strict: true, schema: schemaEstrito(opcoes.schema) } : opcoes.pesquisar ? null : { type: "json_object" }) : null;
  let ultimo = "";
  for (const modelo of MODELOS_OPENAI(opcoes.leve)) {
    let r: Response | null = null;
    const teto = opcoes.pesquisar ? (opcoes.maxBuscas ?? 3) : 0;
    const tentativas = [
      ...(formato && teto ? [{ fmt: true, teto: true }] : []),
      ...(formato ? [{ fmt: true, teto: false }] : []),
      ...(teto ? [{ fmt: false, teto: true }] : []),
      { fmt: false, teto: false },
    ];
    for (const { fmt: usarFormato, teto: usarTeto } of tentativas) {
      r = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${chave}` },
        body: JSON.stringify({ model: modelo, ...corpo, ...(usarTeto ? { max_tool_calls: teto } : {}), ...(usarFormato ? { text: { format: formato } } : {}), ...(modelo.startsWith("gpt-5") ? { reasoning: { effort: opcoes.esforco ?? "low" } } : {}) }),
        signal: AbortSignal.timeout(opcoes.tempo ?? 90000),
      });
      if (r.ok) break;
      ultimo = `ChatGPT ${r.status} (${modelo}): ${(await r.clone().text()).slice(0, 300)}`;
      console.error(ultimo);
      if (r.status !== 400) break;
    }
    if (!r || !r.ok) {
      if (r && (r.status === 404 || r.status === 400)) continue;
      throw new Error(ultimo);
    }
    const j = await r.json();
    const buscasReais = (j.output ?? []).filter((o: { type?: string }) => o.type === "web_search_call").length;
    registrarIA({
      tarefa: opcoes.tarefa ?? (opcoes.pesquisar ? "pesquisa" : "geracao"),
      provedor: "openai",
      modelo,
      pesquisaWeb: Boolean(opcoes.pesquisar),
      duracaoMs: Date.now() - inicioChamada,
      sucesso: true,
      status: r.status,
      buscasReais,
      inputTokens: Number(j.usage?.input_tokens ?? 0) || null,
      outputTokens: Number(j.usage?.output_tokens ?? 0) || null,
    });
    const texto: string = (j.output ?? [])
      .filter((o: { type: string }) => o.type === "message")
      .flatMap((o: { content?: { type: string; text?: string }[] }) => o.content ?? [])
      .filter((c: { type: string }) => c.type === "output_text")
      .map((c: { text?: string }) => c.text ?? "")
      .join("");
    if (!texto) throw new Error(`ChatGPT respondeu vazio (${j.status ?? "sem motivo"})`);
    return texto;
  }
  throw new Error(ultimo || "ChatGPT: nenhum modelo disponível");
}

// ---------------- Pesquisa longa em segundo plano (OpenAI) ----------------

/** Começa a pesquisa e devolve o código dela na OpenAI. */
export async function iniciarPesquisaFundo(texto: string, schema: object, esforco: "low" | "medium" | "high" = "low", maxBuscas = 8, modeloPadrao = "gpt-5-mini"): Promise<string> {
  const chave = process.env.OPENAI_API_KEY;
  if (!chave) throw new Error("OPENAI_API_KEY não configurada");
  const modelo = process.env.OPENAI_MODEL_PESQUISA || modeloPadrao;
  const base = {
    model: modelo,
    input: [{ role: "user", content: [{ type: "input_text", text: `${texto}\n\nResponda só com um JSON válido neste formato (JSON Schema): ${JSON.stringify(schemaComum(schema))}.` }] }],
    instructions: SEM_PERGUNTAS,
    tools: [{ type: "web_search" }],
    background: true,
    store: true,
    ...(modelo.startsWith("gpt-5") || modelo.startsWith("o") ? { reasoning: { effort: esforco } } : {}),
  };
  const formato = { text: { format: { type: "json_schema", name: "resposta", strict: true, schema: schemaEstrito(schema) } } };
  const tentativas = [{ ...formato, max_tool_calls: maxBuscas }, formato, {}];
  for (let i = 0; i < tentativas.length; i++) {
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${chave}` },
      body: JSON.stringify({ ...base, ...tentativas[i] }),
      signal: AbortSignal.timeout(30000),
    });
    if (r.ok) return ((await r.json()) as { id: string }).id;
    const erro = `ChatGPT ${r.status}: ${(await r.text()).slice(0, 300)}`;
    console.error(erro);
    if (r.status !== 400 || i === tentativas.length - 1) throw new Error(erro);
  }
  throw new Error("não consegui iniciar a pesquisa");
}

/** Situação da pesquisa: "pendente", "pronta" (com os dados) ou "falhou". */
export async function lerPesquisaFundo<T>(id: string): Promise<{ estado: "pendente" | "pronta" | "falhou"; dados?: T; erro?: string }> {
  const r = await fetch(`https://api.openai.com/v1/responses/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, cache: "no-store", signal: AbortSignal.timeout(20000) });
  if (!r.ok) return { estado: "falhou", erro: `ChatGPT ${r.status}` };
  const j = await r.json();
  if (j.status === "queued" || j.status === "in_progress") return { estado: "pendente" };
  registrarIA({
    tarefa: "pesquisa_fundo",
    provedor: "openai",
    modelo: String(j.model ?? ""),
    pesquisaWeb: true,
    duracaoMs: (Number(j.completed_at ?? 0) - Number(j.created_at ?? 0)) * 1000 || 0,
    sucesso: j.status === "completed",
    status: j.status,
    buscasReais: (j.output ?? []).filter((o: { type?: string }) => o.type === "web_search_call").length,
    inputTokens: Number(j.usage?.input_tokens ?? 0) || null,
    outputTokens: Number(j.usage?.output_tokens ?? 0) || null,
  });
  if (j.status !== "completed") return { estado: "falhou", erro: j.error?.message ?? j.incomplete_details?.reason ?? j.status };
  const texto: string = (j.output ?? []).filter((o: { type: string }) => o.type === "message").flatMap((o: { content?: { type: string; text?: string }[] }) => o.content ?? []).filter((c: { type: string }) => c.type === "output_text").map((c: { text?: string }) => c.text ?? "").join("");
  const dados = lerJSON<T>(texto);
  return dados ? { estado: "pronta", dados } : { estado: "falhou", erro: "a resposta não veio no formato certo" };
}