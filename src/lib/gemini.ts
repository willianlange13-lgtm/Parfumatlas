import "server-only";

export const geminiConfigurado = () => Boolean(process.env.GEMINI_API_KEY);
/** "gemini-flash-latest" sempre aponta para o Flash mais novo, então não sai de linha. */
const MODELOS = () => [...new Set([process.env.GEMINI_MODEL, "gemini-flash-latest"].filter(Boolean) as string[])];
let modeloQueFunciona: string | null = null;

type Parte = { text: string } | { inlineData: { mimeType: string; data: string } };

/**
 * Chama o Gemini e devolve JSON. Com `pesquisar`, liga a busca do Google e a leitura de links
 * (nesse modo a API não aceita schema, então o JSON vem pedido no próprio texto).
 */
export async function geminiJSON<T>(partes: Parte[], opcoes: { schema?: object; pesquisar?: boolean; sistema?: string; temperatura?: number } = {}): Promise<T> {
  const texto = await chamar(partes, opcoes, true);
  const limpo = texto.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const ini = limpo.search(/[[{]/);
  const fim = Math.max(limpo.lastIndexOf("}"), limpo.lastIndexOf("]"));
  return JSON.parse(ini >= 0 && fim > ini ? limpo.slice(ini, fim + 1) : limpo) as T;
}

/** Chama o Gemini e devolve o texto livre (usado na pesquisa antes de montar o JSON). */
export async function geminiTexto(partes: Parte[], opcoes: { pesquisar?: boolean; sistema?: string; temperatura?: number } = {}): Promise<string> {
  return chamar(partes, opcoes, false);
}

async function chamar(partes: Parte[], opcoes: { schema?: object; pesquisar?: boolean; sistema?: string; temperatura?: number }, json: boolean): Promise<string> {
  const chave = process.env.GEMINI_API_KEY;
  if (!chave) throw new Error("GEMINI_API_KEY não configurada");
  const corpo: Record<string, unknown> = {
    contents: [{ role: "user", parts: partes }],
    generationConfig: { temperature: opcoes.temperatura ?? 0.4, ...(opcoes.pesquisar || !json ? {} : { responseMimeType: "application/json", ...(opcoes.schema ? { responseSchema: opcoes.schema } : {}) }) },
  };
  if (opcoes.sistema) corpo.systemInstruction = { parts: [{ text: opcoes.sistema }] };
  if (opcoes.pesquisar) corpo.tools = [{ google_search: {} }, { url_context: {} }];
  let r: Response | null = null;
  const lista = modeloQueFunciona ? [modeloQueFunciona] : MODELOS();
  for (const modelo of lista) {
    r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": chave },
      body: JSON.stringify(corpo),
    });
    if (r.status === 404) continue; // modelo fora de linha: tenta o próximo
    modeloQueFunciona = modelo;
    break;
  }
  if (!r) throw new Error("Gemini: nenhum modelo disponível");
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const j = await r.json();
  const texto: string = (j.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
  if (!texto) throw new Error(`Gemini respondeu vazio (${j.candidates?.[0]?.finishReason ?? j.promptFeedback?.blockReason ?? "sem motivo"})`);
  return texto;
}
