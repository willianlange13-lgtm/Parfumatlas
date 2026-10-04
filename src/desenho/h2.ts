/** Funções de desenho compartilhadas pelas pranchas (porte do h2.js do desenho). */
import base from "@/data/desenho/InicioPreto.json";

export const t = base.t as unknown as Record<string, string> & { sup: string[]; fam: string[]; saz: string[] };
export const OURO = "#D8B970";

export const P = (x: number) => (+x).toFixed(1);
export const hexA = (h: string, a: number) => `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
export const circ = (cx: number, cy: number, r: number) => `M ${P(cx - r)} ${P(cy)} a ${r} ${r} 0 1 0 ${P(2 * r)} 0 a ${r} ${r} 0 1 0 ${P(-2 * r)} 0 Z`;
export const st = (fill: string, fo: number, stroke: string, so: number, sw: number) => `fill: ${fill}; fill-opacity: ${fo}; stroke: ${stroke}; stroke-opacity: ${so}; stroke-width: ${sw}`;
export function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const x0 = cx + Math.cos(a0) * r, y0 = cy + Math.sin(a0) * r, x1 = cx + Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r;
  return `M ${P(x0)} ${P(y0)} A ${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${P(x1)} ${P(y1)}`;
}

export const EIXOS: [string, string][] = [["Cítrico", "#DCECFD"], ["Frutado", "#D8B970"], ["Aromático", "#B4BDCC"], ["Aquático", "#C9D1DE"], ["Oriental", "#9099AC"], ["Amadeirado", "#7F8AA0"], ["Âmbar", "#6E7A90"], ["Gourmand", "#A3ADBE"]];
export const EC = EIXOS.map((e) => e[1]);
export const FAMCOR: Record<string, string> = Object.fromEntries(EIXOS);

/** Glifo/radar: camadas de path com estilo. viewBox -12 -12 344 344, centro 160. */
export function glifo(v: number[], cores: string[], fino = false, cor: string = t.amber) {
  const c = 160, n = v.length, L: { d: string; st: string }[] = [], k = fino ? 2.2 : 1;
  const ang = (i: number) => (i * 2 * Math.PI) / n - Math.PI / 2;
  let g = "";
  [40, 80, 120, 150].forEach((r) => (g += circ(c, c, r) + " "));
  for (let i = 0; i < n; i++) { const a = ang(i); g += `M ${c} ${c} L ${P(c + Math.cos(a) * 150)} ${P(c + Math.sin(a) * 150)} `; }
  L.push({ d: g, st: st("none", 0, t.line2, 1, 0.8 * k) });
  if (!fino) {
    let tk = "";
    for (let j = 0; j < 72; j++) { const a2 = (j * 2 * Math.PI) / 72, r2 = j % 9 === 0 ? 138 : 145; tk += `M ${P(c + Math.cos(a2) * r2)} ${P(c + Math.sin(a2) * r2)} L ${P(c + Math.cos(a2) * 150)} ${P(c + Math.sin(a2) * 150)} `; }
    L.push({ d: tk, st: st("none", 0, t.amberTxt, 0.75, 0.9) });
  }
  const pts = v.map((x, i) => { const a = ang(i), r = 18 + (x / 100) * 128; return [c + Math.cos(a) * r, c + Math.sin(a) * r]; });
  L.push({ d: "M " + pts.map((p) => P(p[0]) + " " + P(p[1])).join(" L ") + " Z", st: st(cor, 0.2, cor, 1, 1.6 * k) });
  pts.forEach((p, i) => L.push({ d: circ(p[0], p[1], 6.5 * (fino ? 1.6 : 1)), st: st(cores[i], 1, t.bg, 1, 2 * k) }));
  return L;
}

/** Dimensões do frasco pequeno usadas nos cards (Início, listas). */
const FORM: Record<string, [number, number, string]> = { alto: [22, 42, "5px"], ret: [30, 36, "6px"], redondo: [36, 32, "16px"], largo: [38, 30, "7px"] };
export function frascoMini(nome: string, casa: string, acorde: string, forma: string, tampa: string, cor: string) {
  const f = FORM[forma] ?? FORM.ret;
  return {
    nome, marca: casa, marcaUp: casa.toUpperCase(), fam: acorde, cor,
    bw: f[0], bh: f[1], br: f[2], capW: Math.round(f[0] * 0.5), bw2: f[0] * 1.7, bh2: f[1] * 1.7, capW2: Math.round(f[0] * 0.85), lw: Math.round(f[0] * 1.7 - 10),
    tampa, rot: casa.split(" ")[0].toUpperCase().slice(0, 8),
    fundo: `linear-gradient(160deg, ${hexA(cor, 0.22)} 0%, ${hexA(cor, 0.04)} 100%)`,
    vidro: `linear-gradient(160deg, rgba(255,255,255,.3) 0%, ${hexA(cor, 0.28)} 50%, ${hexA(cor, 0.5)} 100%)`,
  };
}

export const ICONE_CLIMA: Record<string, string> = {
  sol: "M12 7a5 5 0 1 0 0.01 0 M12 2v2 M12 20v2 M2 12h2 M20 12h2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4",
  nuvem: "M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.4A4 4 0 0 1 17 18z",
  chuva: "M7 15a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.4A4 4 0 0 1 17 15z M8 18l-1 3 M12 18l-1 3 M16 18l-1 3",
  parcial: "M9 4v1.5 M4.5 8.5H3 M5.6 5.6l1 1 M13 9a4 4 0 1 0-6.6 3 M9 20a3.5 3.5 0 0 1 0-7 4.5 4.5 0 0 1 8.6-1.2A3.5 3.5 0 0 1 18 20z",
};

export const dataBR = (iso: string) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Campo_Grande" }).format(new Date(iso)).replace(/\//g, ".");
export const mesAno = (iso: string) => new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric", timeZone: "America/Campo_Grande" }).format(new Date(iso)).replace(".", "").replace(" de ", " ").toUpperCase();
export const n3 = (n: number) => String(n).padStart(3, "0");
