"use client";
import { useMemo, useState } from "react";
import DesColecao from "@/desenho/DesColecao";
import { CelColecao } from "@/cel/CelColecao";
import type { DadosColecao } from "@/montar/colecao";
import { territorio } from "@/lib/territorio";
import { corDoAcorde } from "@/lib/cores";

type Item = DadosColecao["itens"][number];

export function agrupar(itens: Item[], modo: string) {
  const chave: Record<string, (p: Item) => string> = { acorde: (p) => p.acorde, familia: (p) => p.fam.split(" ")[0], marca: (p) => p.marca, genero: (p) => p.genero, az: (p) => p.nome[0].toUpperCase() };
  const mapa = new Map<string, Item[]>();
  itens.forEach((p) => { const k = chave[modo](p); mapa.set(k, [...(mapa.get(k) ?? []), p]); });
  const ks = [...mapa.keys()];
  if (modo === "az" || modo === "marca") ks.sort(); else ks.sort((a, b) => mapa.get(b)!.length - mapa.get(a)!.length || a.localeCompare(b));
  return ks.map((k) => ({ nome: k, n: `${mapa.get(k)!.length} ${mapa.get(k)!.length === 1 ? "perfume" : "perfumes"}`, cor: modo === "acorde" ? corDoAcorde(k) : modo === "familia" ? territorio(k).a : "var(--acento)", itens: mapa.get(k)! }));
}

export function ColecaoCliente({ d }: { d: DadosColecao }) {
  const [modo, setModo] = useState("acorde");
  const [sit, setSit] = useState("tenho");
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState("recentes");
  const visiveis = useMemo(() => {
    const q = busca.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const l = d.itens.filter((i) => i.situacao.split(" ").includes(sit) && (!q || i.busca.normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q)));
    return [...l].sort((a, b) => (ordem === "recentes" ? b.numero - a.numero : ordem === "usados" ? a.dias - b.dias : b.dias - a.dias));
  }, [d.itens, sit, busca, ordem]);
  const secoes = useMemo(() => agrupar(visiveis, modo), [visiveis, modo]);
  const s = { modo, setModo, sit, setSit, busca, setBusca, ordem, setOrdem, secoes, total: visiveis.length };
  return (
    <>
      <div className="so-computador"><DesColecao d={d} s={s} /></div>
      <div className="so-celular"><CelColecao d={d} s={s} /></div>
    </>
  );
}
