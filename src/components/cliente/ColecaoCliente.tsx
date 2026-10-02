"use client";
import { useMemo, useState } from "react";
import DesColecao from "@/desenho/DesColecao";
import { CelColecao } from "@/cel/CelColecao";
import type { DadosColecao } from "@/montar/colecao";

const ACOR: Record<string, string> = { Frutado: "#D8B970", Amadeirado: "#7F8AA0", Baunilha: "#A3ADBE", Especiado: "#6E7A90", Âmbar: "#9099AC", Aquático: "#C9D1DE", Cítrico: "#DCECFD" };
const FCOR: Record<string, string> = { Chipre: "#D8B970", Âmbar: "#9099AC", Amadeirado: "#7F8AA0", Oriental: "#A3ADBE", Aromático: "#B4BDCC", Aquático: "#C9D1DE", Cítrico: "#DCECFD" };
const GN: [string, string][] = [["acorde", "Acorde"], ["familia", "Família"], ["marca", "Marca"], ["genero", "Gênero"], ["az", "A–Z"]];
const SIT: [string, string][] = [["tenho", "Tenho"], ["tive", "Tive"], ["quero", "Quero"], ["assinatura", "Assinatura"]];
type Item = DadosColecao["itens"][number];

export function agrupar(itens: Item[], modo: string) {
  const chave: Record<string, (p: Item) => string> = { acorde: (p) => p.acorde, familia: (p) => p.fam.split(" ")[0], marca: (p) => p.marca, genero: (p) => p.genero, az: (p) => p.nome[0].toUpperCase() };
  const mapa = new Map<string, Item[]>();
  itens.forEach((p) => { const k = chave[modo](p); mapa.set(k, [...(mapa.get(k) ?? []), p]); });
  const ks = [...mapa.keys()];
  if (modo === "az" || modo === "marca") ks.sort(); else ks.sort((a, b) => mapa.get(b)!.length - mapa.get(a)!.length || a.localeCompare(b));
  return ks.map((k) => ({ nome: k, n: `${mapa.get(k)!.length} ${mapa.get(k)!.length === 1 ? "perfume" : "perfumes"}`, cor: modo === "acorde" ? ACOR[k] ?? "#9099AC" : modo === "familia" ? FCOR[k] ?? "#C9D1DE" : "#C9D1DE", itens: mapa.get(k)! }));
}

export function ColecaoCliente({ d }: { d: DadosColecao }) {
  const [modo, setModo] = useState("acorde");
  const [sit, setSit] = useState("tenho");
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState("recentes");
  const t = d.t;
  const visiveis = useMemo(() => {
    const q = busca.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const l = d.itens.filter((i) => i.situacao.split(" ").includes(sit) && (!q || i.busca.normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q)));
    return [...l].sort((a, b) => (ordem === "recentes" ? b.numero - a.numero : ordem === "usados" ? a.dias - b.dias : b.dias - a.dias));
  }, [d.itens, sit, busca, ordem]);
  const v = {
    ...d,
    secoes: agrupar(visiveis, modo),
    grupos: GN.map(([k, nome]) => ({ nome, bg: k === modo ? t.btn : "transparent", cor: k === modo ? t.onBtn : t.ink2, pick: () => setModo(k) })),
    marcas: SIT.map(([k, nome]) => ({ nome, n: d.contagem[k as keyof typeof d.contagem], bg: k === sit ? t.btn : "transparent", cor: k === sit ? t.onBtn : t.ink2, pick: () => setSit(k) })),
    buscar: (e: React.ChangeEvent<HTMLInputElement>) => setBusca(e.target.value),
  };
  return (
    <>
      <div className="so-computador"><DesColecao v={v} /></div>
      <div className="so-celular"><CelColecao d={d} s={{ modo, setModo, sit, setSit, busca, setBusca, ordem, setOrdem, secoes: v.secoes, total: visiveis.length }} /></div>
    </>
  );
}
