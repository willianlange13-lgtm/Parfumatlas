"use client";
import type { Votos } from "@/lib/tipos";
import { ACORDES, acordePrincipal, mesmoAcorde } from "@/lib/normalizar";
import { MONO, OURO } from "./kit";

/**
 * Editores da ficha usados no cadastro e no Editar (docs/DECISOES.md §24): acordes com força, quando usar
 * e a sua nota. No cadastro vêm preenchidos com o que a IA achou; o que faltar, você marca ali mesmo.
 */
type Ac = { nome: string; valor: number };
const FORCA = ["Leve", "Presente", "Marcante", "Forte", "Dominante"];
const QUANTO = ["Pouco", "Às vezes", "Bem", "Muito bem", "Ideal"];
export const NOTAS = ["★ 1 de 5", "★ 2 de 5", "★ 3 de 5", "★ 4 de 5", "★ 5 de 5"];
const VAZIO: Votos = { total: 0, fixacao: [0, 0, 0, 0, 0], projecao: [0, 0, 0, 0], estacoes: { primavera: 0, verao: 0, outono: 0, inverno: 0 }, dia: 0, noite: 0, ocasioes: [] };
const nivel = (v?: number) => (v ? Math.max(1, Math.min(5, Math.round(v / 20))) : null);

const caixa: React.CSSProperties = { borderRadius: "var(--r-ed, 18px)", border: "1px solid var(--line)", background: "var(--surface)", padding: 14, display: "flex", flexDirection: "column", gap: 12, minWidth: 0 };
const rot = (t: string) => <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".14em", color: OURO, textTransform: "uppercase" }}>{t}</span>;
const sub = (t: string) => <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".1em", color: "var(--ink-3)" }}>{t}</span>;

/** Barra de 5 níveis; toque no mesmo nível de novo para desmarcar. */
export function Segs({ total = 5, val, set, nomes, vazio = "toque para marcar" }: { total?: number; val: number | null; set: (v: number | null) => void; nomes: string[]; vazio?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", gap: 4 }}>
        {Array.from({ length: total }, (_, i) => (
          <button key={i} type="button" onClick={() => set(val === i + 1 ? null : i + 1)} aria-label={nomes[i]}
            style={{ flex: 1, height: 10, borderRadius: 3, border: "none", padding: 0, cursor: "pointer", background: val && i < val ? OURO : "var(--chip-2)" }} />
        ))}
      </div>
      <span style={{ fontSize: 12.5, textAlign: "right", color: "var(--ink-2)" }}>{val ? nomes[val - 1] : vazio}</span>
    </div>
  );
}

/** Acordes: incluir, tirar e dar força. O mais forte vira o acorde principal. */
export function EditorAcordes({ acordes, set, aviso }: { acordes: Ac[]; set: (l: Ac[], principal?: string) => void; aviso?: string }) {
  const muda = (l: Ac[]) => { const o = [...l].sort((a, b) => b.valor - a.valor); set(o, o[0] ? acordePrincipal(o[0].nome) : undefined); };
  const faltam = ACORDES.filter((a) => !acordes.some((x) => mesmoAcorde(x.nome, a)));
  return (
    <div style={caixa}>
      {rot("Acordes")}
      <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{aviso ?? "Desenham o DNA olfativo. Toque na barra para dar a força."}</span>
      {acordes.map((a) => (
        <div key={a.nome} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, flexGrow: 1 }}>{a.nome}</span>
            <button type="button" onClick={() => muda(acordes.filter((x) => x.nome !== a.nome))} style={{ background: "none", border: "none", color: "var(--ink-3)", fontSize: 13, cursor: "pointer" }} aria-label={`Tirar ${a.nome}`}>tirar ×</button>
          </div>
          <Segs val={nivel(a.valor)} set={(v) => v && muda(acordes.map((x) => (x.nome === a.nome ? { ...x, valor: v * 20 } : x)))} nomes={FORCA} />
        </div>
      ))}
      {faltam.length > 0 && (
        <select value="" onChange={(x) => { const nome = x.target.value; if (nome) muda([...acordes, { nome, valor: 60 }]); }}
          style={{ height: 38, borderRadius: "var(--r-ctl, 12px)", border: "1px dashed var(--line-2)", background: "transparent", color: "var(--ink-2)", fontSize: 13.5, padding: "0 10px", fontFamily: "inherit" }}>
          <option value="" style={{ color: "#000" }}>+ acorde</option>
          {faltam.map((a) => <option key={a} value={a} style={{ color: "#000" }}>{a}</option>)}
        </select>
      )}
    </div>
  );
}

/** Quando usar: estações, dia e noite em 5 níveis. */
export function EditorQuando({ votos, set, estimado }: { votos?: Votos; set: (v: Votos) => void; estimado?: boolean }) {
  const v = votos ?? VAZIO;
  const muda = (k: "primavera" | "verao" | "outono" | "inverno" | "dia" | "noite", n: number | null) => {
    const x = (n ?? 0) * 20;
    set(k === "dia" || k === "noite" ? { ...v, [k]: x, quandoEstimado: false } : { ...v, estacoes: { ...v.estacoes, [k]: x }, quandoEstimado: false });
  };
  return (
    <div style={caixa}>
      {rot(estimado ? "Quando usar · estimativa" : "Quando usar")}
      <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Estação e período em que ele funciona. Vale para a sugestão do dia pelo clima.</span>
      {([["PRIMAVERA", "primavera"], ["VERÃO", "verao"], ["OUTONO", "outono"], ["INVERNO", "inverno"], ["DIA", "dia"], ["NOITE", "noite"]] as const).map(([nome, k]) => (
        <div key={k} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sub(nome)}
          <Segs val={nivel(k === "dia" || k === "noite" ? v[k] : v.estacoes[k])} set={(n) => muda(k, n)} nomes={QUANTO} />
        </div>
      ))}
    </div>
  );
}

/** A sua nota para o perfume (1 a 5). */
export function EditorNota({ val, set }: { val: number | null; set: (v: number | null) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {sub("SUA NOTA")}
      <Segs val={val} set={set} nomes={NOTAS} />
    </div>
  );
}
