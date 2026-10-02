"use client";
import { useState } from "react";
import { Icone } from "@/components/Icone";
import type { Config } from "@/lib/config";
import { Card, Circ, OURO, Rot } from "./kit";

const PEDIDOS: [string, string][] = [
  ["“Alexa, pergunta ao Parfum Atlas o que eu uso hoje.”", "Responde com o perfume do dia e o porquê."],
  ["“Alexa, diz ao Parfum Atlas que eu usei o Layton.”", "Marca o uso de hoje."],
  ["“Alexa, pergunta ao Parfum Atlas se tem lançamento novo.”", "Lê os lançamentos acima do seu limite."],
  ["“Alexa, pergunta ao Parfum Atlas quanto dura o Aventus no calor.”", "Responde com os dados da ficha e o clima de hoje."],
];

export function AlexaAjustes({ cfg, podeSalvar, pronta }: { cfg: Config; podeSalvar: boolean; pronta: boolean }) {
  const [c, setC] = useState(cfg);
  const [aviso, setAviso] = useState("");
  async function salvar(p: Partial<Config>) {
    setC((x) => ({ ...x, ...p }));
    if (!podeSalvar) { setAviso("Modo de demonstração: ligue o Supabase para guardar."); return; }
    const r = await fetch("/api/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) });
    if (!r.ok) setAviso((await r.json()).erro ?? "Não consegui salvar.");
  }
  const tog = (on: boolean, f: (v: boolean) => void, rot: string) => <button type="button" role="switch" aria-checked={on} aria-label={rot} className={`c-tog ${on ? "on" : ""}`} onClick={() => f(!on)} />;
  return (
    <div className="c-tela sem-barra" style={{ maxWidth: 620, margin: "0 auto" }}>
      <div className="c-topo"><Circ icone="voltar" href="/configuracoes" tamanho={36} rotulo="Voltar" /><span className="c-topo-tit">Alexa</span><span style={{ width: 36 }} /></div>
      <Card fundo="destaque" pad={14}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 40, height: 40, borderRadius: 20, border: `2px solid ${c.alexaLigada && pronta ? OURO : "var(--line-2)"}`, flexShrink: 0 }} />
          <span style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 16, fontWeight: 500 }}>{c.alexaLigada && pronta ? "Alexa conectada" : pronta ? "Alexa desligada" : "Alexa ainda não instalada"}</span>
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{pronta ? "skill pessoal “Parfum Atlas” na sua conta Amazon" : "falta criar a skill na conta Amazon (passo a passo no README)"}</span>
          </span>
          {tog(c.alexaLigada, (v) => salvar({ alexaLigada: v }), "Alexa ligada")}
        </div>
      </Card>
      {aviso && <div style={{ fontSize: 13, color: OURO }}>{aviso}</div>}
      <Rot>No celular</Rot>
      <Card pad="4px 14px" gap={0}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0" }}>
          <Icone nome="mic" tamanho={18} />
          <span style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}><span style={{ fontSize: 14.5 }}>Voz do app</span><span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>segurar o + ou tocar no microfone</span></span>
          <span style={{ fontSize: 13, color: "var(--ink-2)" }}>Português</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderTop: "1px solid var(--line)" }}>
          <Icone nome="chat" tamanho={18} />
          <span style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}><span style={{ fontSize: 14.5 }}>Respostas faladas</span><span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>o sommelier lê a resposta em voz alta</span></span>
          {tog(c.vozRespostas, (v) => salvar({ vozRespostas: v }), "Respostas faladas")}
        </div>
      </Card>
      <Rot>O que dá para pedir</Rot>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, flexShrink: 0 }}>
        {PEDIDOS.map(([p, r]) => (
          <div key={p} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontSize: 15, lineHeight: 1.4 }}>{p}</span>
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{r}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
