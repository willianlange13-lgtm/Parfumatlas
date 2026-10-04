import Link from "next/link";
import { Icone } from "@/components/Icone";
import type { montarLancamentos } from "@/montar/lancamentos";
import { Anel, Btn, Card, Circ, Demo, FrascoMedidas, MONO, NotaChip, OURO, Pill, Rolar, Rot, TituloAba } from "./kit";

type V = Awaited<ReturnType<typeof montarLancamentos>>;

export function CelNovidades({ v, limite }: { v: V; limite: number }) {
  const d = v.dest;
  const dp = v.destaque;
  return (
    <div className="c-tela">
      <TituloAba titulo="Novidades">
        <Circ icone="filtro" href="/configuracoes#alerta" rotulo="Alerta de lançamentos" />
      </TituloAba>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
        <Rot>Lançamentos para você</Rot>
        <div style={{ fontSize: 25, fontFamily: "var(--marca)", fontWeight: 500, letterSpacing: "-.01em", lineHeight: 1.15 }}>{v.n} {v.n === 1 ? "novidade combina" : "novidades combinam"} com o seu DNA</div>
      </div>
      <Rolar gap={6}>
        {v.filtros.map((f) => <Pill key={f.nome} on={f.bg === v.t.btn} href={f.href}>{f.nome}</Pill>)}
      </Rolar>
      <Link href="/configuracoes#alerta" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px 10px 16px", borderRadius: 18, background: "var(--surface)", border: "1px solid var(--line)", fontSize: 13.5, color: "var(--ink-2)", flexShrink: 0 }}>
        <Icone nome="sino" tamanho={16} />
        <span style={{ flexGrow: 1 }}>Avisar quando lançar algo acima de</span>
        <span style={{ fontFamily: MONO, fontSize: 12, padding: "3px 9px", borderRadius: 10, background: "var(--chip-2)", color: "var(--ink)" }}>{limite}%</span>
      </Link>

      {d.id && (
        <Card fundo="destaque" pad={16}>
          <div style={{ display: "flex", gap: 14, alignItems: "stretch" }}>
            <Link href={`/colecao/${d.id}`} style={{ width: 120, height: 150, flexShrink: 0, borderRadius: 18, border: "1px solid var(--line)", background: "radial-gradient(ellipse at 50% 85%, rgba(201,209,222,.14) 0%, var(--surface) 75%)", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 14 }}>
              <FrascoMedidas bw={74} bh={84} br="34px" capW={34} tampa={d.tampa} vidro={d.vidro} rot={d.rot} nome={d.nome} k={0.85} foto={d.foto} />
            </Link>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
              <span style={{ alignSelf: "flex-start", padding: "3px 8px", borderRadius: 6, background: OURO, color: "#1A1407", fontSize: 10.5, fontWeight: 600 }}>MAIS AFINIDADE</span>
              <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".1em", color: "var(--ink-3)" }}>{d.linha}</span>
              <span style={{ fontSize: 22, fontFamily: "var(--marca)", fontWeight: 500, lineHeight: 1.1 }}>{d.nome}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Anel valor={d.pct / 100} txt={`${d.pct}%`} tam={48} sw={4} cor={OURO} />
                <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".08em", color: "var(--ink-3)" }}>AFINIDADE</span>
              </div>
            </div>
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-2)" }}>{d.porque}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{dp.notas.map((n) => <NotaChip key={n.nome} nome={n.nome} tam={24} fs={12.5} />)}</div>
          <div>
            {dp.porque.map((r) => (
              <div key={r.l} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "9px 0", borderTop: "1px solid var(--line)", fontSize: 13.5 }}>
                <span style={{ color: "var(--ink-3)" }}>{r.l}</span><span style={{ textAlign: "right" }}>{r.v}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn href={`/colecao/${d.id}`} altura={42} style={{ flexGrow: 1 }}>Ver ficha</Btn>
            <Btn sec href={d.comparar} altura={42}>Comparar</Btn>
          </div>
        </Card>
      )}

      {v.cards.map((c) => (
        <Card key={c.id} pad={12}>
          <div style={{ display: "flex", gap: 12 }}>
            <Link href={c.href} style={{ position: "relative", width: 104, minHeight: 150, flexShrink: 0, borderRadius: 16, background: c.palco, border: "1px solid var(--line)", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 12 }}>
              <span style={{ position: "absolute", left: 7, top: 7, padding: "2px 6px", borderRadius: 6, background: "var(--bg)", fontFamily: MONO, fontSize: 8.5, letterSpacing: ".06em" }}>{c.tipo}</span>
              <FrascoMedidas bw={c.bw} bh={c.bh} br={c.br} capW={c.capW} tampa={c.tampa} vidro={c.vidro} rot={c.rot} nome={c.nome} k={0.6} foto={c.foto} />
            </Link>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0, flexGrow: 1 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
                <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".1em", color: "var(--ink-3)", paddingTop: 4 }}>{c.casaUp}{c.ano ? ` · ${c.ano}` : ""}</span>
                <span style={{ fontSize: 20, color: c.pct >= 90 ? OURO : "var(--ink)", lineHeight: 1 }}>{c.pct}<span style={{ fontSize: 11 }}>%</span></span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.15 }}>{c.nome}</span>
              <span style={{ fontSize: 12.5, lineHeight: 1.4, color: "var(--ink-2)" }}>{c.porque}</span>
              <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{c.notas}</span>
              <form action="/api/situacao" method="post" style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <input type="hidden" name="perfume" value={c.id} />
                <button type="submit" name="situacao" value="quero" className={`c-btn ${c.btn.startsWith("✓") ? "sec" : ""}`} style={{ height: 34, borderRadius: 17, padding: "0 12px", fontSize: 12.5 }}>{c.btn.startsWith("✓") ? "✓ No seu Quero" : "+ Quero"}</button>
                <Link href={c.href} className="c-btn sec" style={{ height: 34, borderRadius: 17, padding: "0 12px", fontSize: 12.5 }}>Ver ficha</Link>
              </form>
            </div>
          </div>
        </Card>
      ))}

      {v.casas.length > 0 && (
        <Card pad={16} gap={0}>
          <Rot style={{ marginBottom: 10 }}>Das casas que você tem</Rot>
          {v.casas.map((c) => (
            <div key={c.casa} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: "1px solid var(--line)" }}>
              <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 2 }}><span style={{ fontSize: 15 }}>{c.casa}</span><span style={{ fontSize: 12, color: "var(--ink-3)" }}>{c.txt}</span></div>
              <span style={{ fontFamily: MONO, fontSize: 11 }}>{c.n}</span>
            </div>
          ))}
        </Card>
      )}
      {v.demo && <Demo>Lançamentos e afinidades ilustrativos</Demo>}
    </div>
  );
}
