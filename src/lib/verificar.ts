import "server-only";

type Parecido = { nome: string; casa: string; tipo: "inspirou" | "clone" | "parecido"; pct: number; fonte?: string | null; trecho?: string | null };

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const normal = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
/** O nome aparece no texto? (ignora acentos, maiúsculas e pontuação) */
const cita = (texto: string, nome: string) => {
  const n = normal(nome);
  return n.length >= 3 && ` ${texto} `.includes(` ${n} `);
};

// sites que costumam bloquear robôs; se não abrirem, vale o trecho que a IA copiou
const CONFIAVEIS = /fragrantica\.|parfumo\.|basenotes\.|reddit\.com|youtube\.com|youtu\.be/i;

async function textoDaPagina(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8", Accept: "text/html" }, signal: AbortSignal.timeout(7000), redirect: "follow" });
    if (!r.ok) return null;
    const html = (await r.text()).slice(0, 1_500_000);
    if (html.length < 1500 || /cf-challenge|Just a moment|captcha/i.test(html.slice(0, 5000))) return null;
    return normal(html.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " "));
  } catch {
    return null;
  }
}

/**
 * Só mantém o parecido se a página indicada pela IA citar os dois perfumes:
 * o parecido e este perfume (ou o original que ele imita, no caso dos clones).
 * Corta relações inventadas, como um clone de outro original.
 */
export async function verificarParecidos<T extends Parecido>(nome: string, lista: T[] | null | undefined): Promise<T[]> {
  return (await conferirParecidos(nome, lista)).ok;
}

/** Igual a verificarParecidos, mas também diz quais foram descartados (para mostrar na tela). */
export async function conferirParecidos<T extends Parecido>(nome: string, lista: T[] | null | undefined): Promise<{ ok: T[]; descartados: string[] }> {
  const itens = (lista ?? []).filter((x) => x?.nome && x?.fonte && /^https?:\/\//.test(x.fonte));
  const original = itens.find((x) => x.tipo === "inspirou")?.nome;
  const conferidos = await Promise.all(
    itens.map(async (x) => {
      const pagina = await textoDaPagina(x.fonte!);
      // a fonte é a própria página deste perfume (lista "Este perfume me lembra do"): basta citar o parecido
      const paginaDele = cita(normal(decodeURIComponent(x.fonte!)), nome);
      // só confia na página baixada se ela trouxe de fato a lista (às vezes o site entrega outra coisa ou carrega a lista depois)
      const temLista = pagina && cita(pagina, nome) && /me lembra|reminds me/.test(pagina);
      if (paginaDele) return (temLista ? cita(pagina!, x.nome) : cita(normal(x.trecho ?? ""), x.nome) && CONFIAVEIS.test(x.fonte!)) ? x : null;
      const outros = [nome, ...(x.tipo === "clone" && original ? [original] : [])];
      if (pagina) return cita(pagina, x.nome) && outros.some((o) => cita(pagina, o)) ? x : null;
      // página não abriu: aceita só de site conhecido e com trecho citando os dois
      const t = normal(x.trecho ?? "");
      return CONFIAVEIS.test(x.fonte!) && cita(t, x.nome) && outros.some((o) => cita(t, o)) ? x : null;
    }),
  );
  const semFonte = (lista ?? []).filter((x) => x?.nome && !(x.fonte && /^https?:\/\//.test(x.fonte))).map((x) => x.nome);
  return { ok: conferidos.filter(Boolean) as T[], descartados: [...semFonte, ...itens.filter((_, i) => !conferidos[i]).map((x) => x.nome)] };
}
