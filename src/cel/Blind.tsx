"use client";
import { useState } from "react";
import { Btn, Card, MONO, OURO, Rot, Topo } from "./kit";

type P = { id: string; nome: string; casa: string };

function embaralhar<T>(l: T[]) {
  const a = [...l];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Blind test: alguém borrifa em fitas numeradas, você adivinha qual é qual. */
export function Blind({ lista, inicial }: { lista: P[]; inicial: string[] }) {
  const [sel, setSel] = useState<string[]>(inicial);
  const [ordem, setOrdem] = useState<P[]>([]);
  const [etapa, setEtapa] = useState<"escolher" | "borrifar" | "palpite" | "fim">("escolher");
  const [mostrar, setMostrar] = useState(false);
  const [palpite, setPalpite] = useState<Record<number, string>>({});
  const escolhidos = sel.map((id) => lista.find((p) => p.id === id)!).filter(Boolean);
  const acertos = ordem.filter((p, i) => palpite[i] === p.id).length;

  return (
    <div className="c-tela sem-barra" style={{ maxWidth: 620, margin: "0 auto" }}>
      <Topo titulo="Blind test" voltar />
      {etapa === "escolher" && (
        <>
          <Card fundo="destaque" pad={16}>
            <Rot>Como funciona</Rot>
            <span style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)" }}>Escolha de 2 a 4 perfumes. Alguém borrifa cada um numa fita numerada, seguindo uma ordem secreta. Você cheira e diz qual é qual.</span>
          </Card>
          <Rot>Perfumes ({sel.length})</Rot>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {lista.map((p) => {
              const on = sel.includes(p.id);
              return <button key={p.id} type="button" className={`c-pill ${on ? "on" : ""}`} style={{ height: 34, borderRadius: "var(--r-ctl)", fontSize: 13 }} onClick={() => setSel(on ? sel.filter((x) => x !== p.id) : sel.length < 4 ? [...sel, p.id] : sel)}>{p.nome}</button>;
            })}
          </div>
          <Btn onClick={() => { setOrdem(embaralhar(escolhidos)); setPalpite({}); setMostrar(false); setEtapa("borrifar"); }} disabled={sel.length < 2}>Sortear a ordem</Btn>
        </>
      )}
      {etapa === "borrifar" && (
        <>
          <Card pad={16}>
            <Rot>Para quem vai borrifar</Rot>
            <span style={{ fontSize: 14, color: "var(--ink-2)" }}>Entregue o celular. Só essa pessoa olha a ordem.</span>
            {mostrar ? (
              ordem.map((p, i) => <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 16, padding: "8px 0", borderTop: "1px solid var(--line)" }}><span style={{ fontFamily: MONO, color: OURO }}>Fita {i + 1}</span>{p.nome}</div>)
            ) : (
              <Btn sec onClick={() => setMostrar(true)}>Mostrar a ordem secreta</Btn>
            )}
          </Card>
          <Btn onClick={() => { setMostrar(false); setEtapa("palpite"); }}>Pronto, borrifei</Btn>
        </>
      )}
      {etapa === "palpite" && (
        <>
          {ordem.map((_, i) => (
            <Card key={i} pad={14} gap={10}>
              <Rot>Fita {i + 1}</Rot>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {escolhidos.map((p) => <button key={p.id} type="button" className={`c-pill ${palpite[i] === p.id ? "on" : ""}`} style={{ height: 34, borderRadius: "var(--r-ctl)", fontSize: 13 }} onClick={() => setPalpite({ ...palpite, [i]: p.id })}>{p.nome}</button>)}
              </div>
            </Card>
          ))}
          <Btn onClick={() => setEtapa("fim")} disabled={Object.keys(palpite).length < ordem.length}>Revelar</Btn>
        </>
      )}
      {etapa === "fim" && (
        <>
          <Card fundo="destaque" pad={18}>
            <Rot>Resultado</Rot>
            <span style={{ fontSize: 32, color: OURO }}>{acertos} de {ordem.length}</span>
            <span style={{ fontSize: 14, color: "var(--ink-2)" }}>{acertos === ordem.length ? "Nariz afiado. Acertou todas." : acertos === 0 ? "Esses se parecem mais do que parece. Tente de novo outro dia." : "Quase. Os que você trocou são os mais parecidos entre si."}</span>
          </Card>
          <Card pad={14} gap={0}>
            {ordem.map((p, i) => {
              const ok = palpite[i] === p.id;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: i ? "1px solid var(--line)" : "none", fontSize: 14 }}>
                  <span style={{ fontFamily: MONO, color: "var(--ink-3)" }}>{i + 1}</span>
                  <span style={{ flexGrow: 1 }}>{p.nome}{!ok && <span style={{ color: "var(--ink-3)" }}> · você disse {lista.find((x) => x.id === palpite[i])?.nome}</span>}</span>
                  <span style={{ color: ok ? OURO : "var(--erro)" }}>{ok ? "✓" : "×"}</span>
                </div>
              );
            })}
          </Card>
          <Btn onClick={() => setEtapa("escolher")}>Jogar de novo</Btn>
        </>
      )}
    </div>
  );
}
