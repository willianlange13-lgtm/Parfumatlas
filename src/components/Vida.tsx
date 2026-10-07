"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Camada de movimento do Atlas Vivo que funciona em todo navegador (inclusive Safari do iPhone):
 * revela os blocos ao rolar, conta os números grandes e, no computador, inclina os cartões e acende
 * uma luz que segue o cursor. Tudo desligado com "Reduzir movimento" (docs/DECISOES.md §31).
 */
const REVELA = [
  ".c-tela > :not(.c-topo):not(.c-rodape):not(.c-folha):not(.c-folha-fundo)", ".c-card", ".c-grade2 > *", ".c-rolar > *",
  ".vivo-corpo > *", ".vivo-diaseq", ".vivo-frasco-card", ".vivo-esquecido", ".vivo-numeros > div",
  ".dc-grupo", ".dc-cartao", ".dd > section", ".dd-nota", ".dd-lacuna", ".ds article", ".dl-cards article",
  ".so-computador article", ".so-computador section > article", ".cd-bloco", ".cdes-bloco", ".cc-cartao", ".ci-frasco", ".ci-esquecido", ".ci-diaseq",
].join(",");
const CONTA = [".vivo-numeros dd", ".ci-numeros b", ".dd-cifras b", ".cd-estacoes b", ".dd-estacoes-grade b", ".vivo-esquecido-n b", ".ds-numeros dd", ".vivo-diaseq-temp", ".dl-n", ".dl-card-pct"].join(",");
const INCLINA = [".dc-cartao-palco", ".vivo-dia", ".vivo-cur", ".vivo-esquecido", ".dd-lacuna", ".dl-cards article", ".dl-destaque", ".card", ".vivo-frasco-card > div:first-child", ".dd-duplo > .dd-bloco"].join(",");

function contar(el: HTMLElement) {
  if (el.dataset.contado) return;
  const txt = el.textContent ?? "";
  const m = txt.match(/^(\D*)(\d+)(\D*)$/);
  if (!m) return;
  el.dataset.contado = "1";
  const alvo = Number(m[2]);
  if (alvo < 2) return;
  const t0 = performance.now(), dur = Math.min(1600, 500 + alvo * 12);
  const passo = (t: number) => {
    const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
    el.textContent = `${m[1]}${Math.round(alvo * e)}${m[3]}`;
    if (p < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

export function Vida() {
  const caminho = usePathname();
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const raiz = document.documentElement;
    raiz.classList.add("vida");

    const visto = new IntersectionObserver((lista) => {
      lista.forEach((x) => {
        if (!x.isIntersecting) return;
        const el = x.target as HTMLElement;
        el.classList.add("visto");
        el.querySelectorAll<HTMLElement>(CONTA).forEach(contar);
        if (el.matches(CONTA)) contar(el);
        visto.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    const preparar = () => {
      const els = document.querySelectorAll<HTMLElement>(REVELA);
      let ordem = 0;
      els.forEach((el) => {
        if (el.classList.contains("visto") || el.closest(".c-folha")) return;
        if (!el.classList.contains("revela")) {
          el.classList.add("revela");
          // atraso em cascata só para quem já está na tela ao abrir
          const r = el.getBoundingClientRect();
          if (r.top < innerHeight) el.style.setProperty("--d", `${Math.min(ordem++, 10) * 55}ms`);
        }
        visto.observe(el); // observar de novo é inofensivo (e necessário depois de uma limpeza do efeito)
      });
      document.querySelectorAll<HTMLElement>(CONTA).forEach((el) => { if (!el.closest(".revela")) visto.observe(el); });
    };
    preparar();
    const mut = new MutationObserver(() => preparar());
    mut.observe(document.body, { childList: true, subtree: true });

    // inclinação e luz seguindo o cursor (só mouse)
    const fino = matchMedia("(hover: hover) and (pointer: fine)").matches;
    let atual: HTMLElement | null = null;
    const mover = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>(INCLINA);
      if (atual && atual !== el) { atual.style.removeProperty("--rx"); atual.style.removeProperty("--ry"); atual.classList.remove("inclinado"); }
      atual = el;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.classList.add("inclinado");
      el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
      el.style.setProperty("--rx", `${((0.5 - y) * 6).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${((x - 0.5) * 8).toFixed(2)}deg`);
    };
    if (fino) addEventListener("pointermove", mover, { passive: true });
    return () => { visto.disconnect(); mut.disconnect(); removeEventListener("pointermove", mover); };
  }, [caminho]);
  return null;
}
