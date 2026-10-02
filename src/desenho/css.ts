import type { CSSProperties } from "react";

/** Converte "fill: #fff; stroke-width: 2" em objeto de estilo do React. */
export function css(s?: string | null): CSSProperties {
  const o: Record<string, string> = {};
  (s ?? "").split(";").forEach((d) => {
    const i = d.indexOf(":");
    if (i < 0) return;
    const k = d.slice(0, i).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    o[k] = d.slice(i + 1).trim();
  });
  return o as CSSProperties;
}
