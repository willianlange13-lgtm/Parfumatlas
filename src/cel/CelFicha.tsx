import Link from "next/link";
import { Icone } from "@/components/Icone";
import type { montarFicha } from "@/montar/ficha";
import { Barra, Bloco, Btn, Camadas, Card, Demo, MONO, NotaChip, OURO, PalcoC, Rolar, Rot, Topo } from "./kit";
import { OpcoesPerfume } from "./OpcoesPerfume";
import { Semelhantes } from "./Semelhantes";
import type { Perfume } from "@/lib/tipos";

type V = NonNullable<Awaited<ReturnType<typeof montarFicha>>>;
export type ExtraFicha = { p: Perfume; entradaId: string | null; numero?: number; situacao: string | null; foto: string | null; hoje: { cidade: string; temp: number; horas: string } | null };

const SIT: [string, string][] = [["tenho", "Tenho"], ["tive", "Tive"], ["quero", "Quero"], ["assinatura", "★ Assinatura"]];

export function CelFicha({ v, x }: { v: V; x: ExtraFicha }) {
  const p = x.p;
  const cab = v.cab;
  const c = v.clima;
  const n = v.eixos.length;
  const temClima = c.pts.length > 0;
  return (
    <div className="c-tela">
      <Topo titulo={`Coleção / ${p.acorde}`} voltar direita={<OpcoesPerfume id={p.id} nome={p.nome} casa={p.casa} entradaId={x.entradaId} situacao={x.situacao} numero={x.numero} />} />

      {/* 01 · identidade */}
      <PalcoC nome={p.nome} casa={p.casa} acorde={p.acorde} forma={p.forma} tampa={p.tampa} foto={x.foto ?? p.imagem} oficial={!x.foto && Boolean(p.imagem)} altura={240} k={1.25} raio={24}>
        {x.situacao === "assinatura" ? <span style={{ position: "absolute", right: 14, top: 14 }}><svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: OURO, stroke: OURO }}><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.2 6.1 20.5l1.3-6.6L2.5 9.4l6.6-.8z" /></svg></span> : null}
        <span style={{ position: "absolute", left: 14, bottom: 12, fontFamily: MONO, fontSize: 9.5, letterSpacing: ".14em", color: "var(--ink-3)" }}>{x.foto ? "FOTO DO SEU FRASCO" : p.imagem ? "FOTO OFICIAL" : "FRASCO ILUSTRATIVO"}</span>
      </PalcoC>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
        <Rot style={{ color: "var(--ink-2)" }}>{cab.casaCidade}</Rot>
        <h1 style={{ margin: 0, fontSize: 40, fontWeight: 500, letterSpacing: "-.02em", lineHeight: 1.02 }}>{p.nome}</h1>
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, color: "var(--ink-2)" }}>{cab.desc}</p>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
        {v.topFam.map((f) => (
          <span key={f.nome} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 12, background: f.bg, fontSize: 13 }}><span style={{ width: 6, height: 6, borderRadius: 3, background: f.cor }} />{f.nome}</span>
        ))}
        {cab.relacao ? <span style={{ padding: "4px 10px", borderRadius: 12, border: "1px solid var(--line-2)", fontSize: 13 }}>{cab.relacao}</span> : null}
      </div>
      <form action="/api/situacao" method="post" className="c-seg">
        <input type="hidden" name="perfume" value={p.id} />
        {SIT.map(([k, nome]) => (
          <button key={k} type="submit" name="situacao" value={k} className={x.situacao === k ? "on" : ""} style={{ fontSize: 12.5, whiteSpace: "nowrap", padding: "0 6px" }}>
            {x.situacao === k && k !== "assinatura" ? "✓ " : ""}{nome}
          </button>
        ))}
      </form>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <Btn href={cab.voz} altura={44} style={{ flexGrow: 1, padding: "0 14px" }}><Icone nome="mic" tamanho={16} />Sommelier</Btn>
        <Btn sec href={cab.comparar} altura={44} style={{ padding: "0 12px" }}>Comparar</Btn>
        <Btn sec href={cab.blind} altura={44} style={{ padding: "0 12px" }}>Blind test</Btn>
      </div>

      {/* 02 · perfil e fatos */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0, marginTop: 8 }}>
        <Rot>Perfil de acordes</Rot>
        <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{v.demo ? "Votos e semelhanças ilustrativos" : "Votos da comunidade"}</span>
      </div>
      <div style={{ position: "relative", width: 330, height: 330, alignSelf: "center", flexShrink: 0 }}>
        <div style={{ position: "absolute", left: 50, top: 50 }}><Camadas camadas={v.glifo} tam={230} /></div>
        {v.eixos.map((e, i) => {
          const a = (i * 2 * Math.PI) / n - Math.PI / 2;
          return (
            <div key={i} style={{ position: "absolute", left: 165 + Math.cos(a) * 146, top: 165 + Math.sin(a) * 140, transform: "translate(-50%, -50%)", textAlign: "center", fontFamily: MONO, fontSize: 9.5, letterSpacing: ".08em", color: "var(--ink-3)", lineHeight: 1.3, whiteSpace: "nowrap" }}>
              {e.nome}<br /><span style={{ color: i === 0 ? OURO : "var(--ink-2)", fontSize: 10.5 }}>{e.v}</span>
            </div>
          );
        })}
      </div>
      <div className="c-grade2" style={{ gap: 10 }}>
        {v.fatos.map((f) => (
          <div key={f.l} style={{ borderRadius: 18, border: "1px solid var(--line)", background: "var(--surface)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
            <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".12em", color: "var(--ink-3)" }}>{f.l}</span>
            <span style={{ fontSize: 16, lineHeight: 1.2 }}>{f.v}</span>
            <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{f.c}</span>
          </div>
        ))}
      </div>

      {/* 03 · pirâmide */}
      <Card pad={16}>
        <Rot>Pirâmide olfativa</Rot>
        <div style={{ fontSize: 19, lineHeight: 1.3 }}>{cab.frase}</div>
        <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".1em", color: "var(--ink-3)" }}>FOTOS REAIS · ÍCONE ONDE AINDA FALTA FOTO</span>
        {v.piramide.map((nv, i) => (
          <div key={nv.nome} style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: i ? 14 : 4, borderTop: i ? "1px solid var(--line)" : "none" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}><span style={{ fontSize: 17 }}>{nv.nome}</span><span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".1em", color: "var(--ink-3)" }}>{nv.tempo}</span></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
              {nv.notas.map((nt) => (
                <div key={nt.nome} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center" }}>
                  <span style={{ width: 58, height: 58, borderRadius: "50%", padding: 2, border: `1px solid ${nt.borda}`, display: "flex" }}><NotaChip nome={nt.nome} tam={52} rotulo={false} /></span>
                  <span style={{ fontSize: 11.5, lineHeight: 1.2 }}>{nt.nome}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Card>

      {/* 04 · desempenho e acordes */}
      <Bloco titulo="Desempenho · comunidade">
        <div className="c-grade2" style={{ gap: 8 }}>
          {v.gauges.map((g) => (
            <div key={g.nome} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textAlign: "center", minWidth: 0 }}>
              <div style={{ position: "relative", width: "100%", maxWidth: 150 }}>
                <svg viewBox="0 0 240 132" style={{ width: "100%", display: "block" }}>
                  <path d={g.trilho} style={{ fill: "none", stroke: "var(--chip-2)", strokeWidth: 14, strokeLinecap: "round" }} />
                  <path d={g.valor} style={{ fill: "none", stroke: g.cor, strokeWidth: 14, strokeLinecap: "round" }} />
                  <path d={g.marca} style={{ fill: "none", stroke: "var(--ink)", strokeWidth: 3, strokeLinecap: "round" }} />
                </svg>
                <div style={{ position: "absolute", left: 0, right: 0, top: "46%", fontSize: 22, fontWeight: 500 }}>{g.txt}</div>
              </div>
              <span style={{ fontSize: 15 }}>{g.nome}</span>
              <span style={{ fontSize: 11, color: "var(--ink-3)", lineHeight: 1.3 }}>{g.sub}</span>
              <span style={{ fontSize: 11, color: "var(--ink-3)", lineHeight: 1.3 }}>{g.ref}</span>
            </div>
          ))}
        </div>
      </Bloco>
      <Bloco titulo="Acordes principais">
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 230, paddingTop: 10 }}>
          {v.espectro.map((a) => (
            <div key={a.curto} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 0, height: "100%", justifyContent: "flex-end" }}>
              <span style={{ fontFamily: MONO, fontSize: 10 }}>{a.v}</span>
              <span style={{ width: "100%", height: Math.round(a.h * 0.68), borderRadius: "6px 6px 2px 2px", background: a.cor === OURO ? "var(--pico)" : a.cor }} />
              <span style={{ height: 52, writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: 10.5, color: "var(--ink-2)", whiteSpace: "nowrap", overflow: "hidden" }}>{a.curto}</span>
            </div>
          ))}
        </div>
      </Bloco>

      {/* 05 · fixação × temperatura */}
      <Card pad={16} gap={12}>
        <Rot>Fixação × temperatura</Rot>
        {temClima ? (
          <>
            <div style={{ fontSize: 20, lineHeight: 1.3 }}>Abaixo de 25 °C dura <span style={{ color: v.t.sup[0] }}>{c.frio}</span>. Acima de 28 °C, cai para <span style={{ color: OURO }}>{c.quente}</span>.</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Base: {c.n} reviews com data e cidade, cruzadas com a temperatura daquele dia.</div>
            <div style={{ display: "flex", gap: 14, fontSize: 12.5, color: "var(--ink-2)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: v.t.seco }} />Dia seco</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: v.t.umido }} />Dia úmido</span>
            </div>
            <svg viewBox="0 0 699 262" style={{ width: "100%", display: "block" }}>
              <rect x={44} y={0} width={c.faixaF} height={236} rx={10} style={{ fill: v.t.zonaF }} />
              <rect x={c.qx} y={0} width={c.faixaQ} height={236} rx={10} style={{ fill: v.t.zonaQ }} />
              {c.gy.map((g) => (
                <g key={g.t}><line x1={44} x2={699} y1={g.y} y2={g.y} style={{ stroke: "var(--line)" }} /><text x={0} y={Number(g.y) + 8} style={{ fontFamily: MONO, fontSize: 22, fill: "var(--ink-3)" }}>{g.t}</text></g>
              ))}
              {c.gx.map((g) => <text key={g.t} x={g.x} y={262} textAnchor="middle" style={{ fontFamily: MONO, fontSize: 22, fill: "var(--ink-3)" }}>{g.t}</text>)}
              <path d={c.tend} style={{ fill: "none", stroke: "var(--ink-3)", strokeWidth: 2.5, strokeDasharray: "6 7" }} />
              {c.pts.map((pt, i) => <circle key={i} cx={pt.x} cy={pt.y} r={pt.r * 0.9} style={{ fill: pt.cor, stroke: "var(--surface)", strokeWidth: 3 }} />)}
            </svg>
            {x.hoje ? (
              <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 14px", borderRadius: 14, background: "var(--chip)", fontSize: 13 }}>
                <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "none", stroke: OURO, strokeWidth: 1.5, flexShrink: 0 }}><path d="M12 8a4 4 0 1 0 .01 0 M12 2v2 M12 20v2 M2 12h2 M20 12h2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4" /></svg>
                <span>Hoje em {x.hoje.cidade} faz <b>{x.hoje.temp} °C</b>: conte com umas <b>{x.hoje.horas}</b>.</span>
              </div>
            ) : null}
          </>
        ) : (
          <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--ink-2)" }}>Ainda não há reviews com data e cidade suficientes para cruzar com o clima. A IA completa esse gráfico quando encontrar dados.</div>
        )}
      </Card>

      {/* 06 · quando funciona e votos */}
      <Card fundo="vinho" pad={16}>
        <Rot>Quando funciona</Rot>
        <div style={{ position: "relative", width: 280, height: 260, alignSelf: "center" }}>
          <svg viewBox="0 0 280 260" style={{ position: "absolute", inset: 0, width: 280, height: 260 }}>
            <path d={v.roda.guia} style={{ fill: "none", stroke: "var(--line-2)" }} />
            {v.roda.seg.map((s) => <path key={s.nome} d={s.d} style={{ fill: s.cor, stroke: "var(--surface-2)", strokeWidth: 3 }} />)}
          </svg>
          {v.roda.seg.map((s) => (
            <div key={s.nome} style={{ position: "absolute", left: Number(s.lx), top: Number(s.ly), transform: "translate(-50%, -50%)", textAlign: "center", fontSize: 11.5, color: "var(--ink-2)", whiteSpace: "nowrap", lineHeight: 1.2 }}>
              {s.nome}<br /><span style={{ fontFamily: MONO, fontSize: 12.5, color: "var(--ink)" }}>{s.v}</span>
            </div>
          ))}
        </div>
        <div className="c-grade2" style={{ gap: 8 }}>
          {[["Dia", cab.dia], ["Noite", cab.noite]].map(([l, val]) => (
            <div key={l} style={{ borderRadius: 16, background: "var(--chip)", padding: "11px 14px", display: "flex", justifyContent: "space-between", fontSize: 14 }}><span>{l}</span><span style={{ fontFamily: MONO }}>{val}</span></div>
          ))}
        </div>
      </Card>
      <Card pad={16} gap={12}>
        <Rot>Votos</Rot>
        {v.votos.map((g) => (
          <div key={g.nome} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 15, marginBottom: 2 }}>{g.nome}</span>
            {g.itens.map((it) => (
              <div key={it.nome} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
                <span style={{ width: 86, color: it.txt }}>{it.nome}</span>
                <Barra v={it.pct} cor={it.cor} altura={4} />
                <span style={{ width: 22, textAlign: "right", fontFamily: MONO, fontSize: 10.5, color: "var(--ink-3)" }}>{it.pct}</span>
              </div>
            ))}
          </div>
        ))}
      </Card>

      {/* 07 · ocasiões e semelhantes */}
      <Card pad={16} gap={10}>
        <Rot>Ocasiões</Rot>
        <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>onde a comunidade mais usa</span>
        {v.ocasioes.map((o) => (
          <div key={o.nome} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
            <span style={{ width: 80 }}>{o.nome}</span>
            <Barra v={o.v} cor={o.cor} />
            <span style={{ width: 22, textAlign: "right", fontFamily: MONO, fontSize: 10.5, color: "var(--ink-3)" }}>{o.v}</span>
          </div>
        ))}
      </Card>
      <Semelhantes itens={v.semelhantes} perfumeId={p.id} buscando={v.buscandoSemelhantes} nome={p.nome} />
      {v.casa.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>
            <Rot>Da mesma casa</Rot>
            <Rolar gap={10}>
              {v.casa.map((m) => (
                <Link key={m.nome} href={m.href} style={{ width: 104, flexShrink: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ width: 104, height: 120, borderRadius: 14, background: m.imagem ? "#FFFFFF" : "var(--surface)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {m.imagem
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={m.imagem} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      : <span style={{ fontFamily: MONO, fontSize: 9, color: "var(--ink-3)", padding: 8, textAlign: "center" }}>{p.casa.toUpperCase()}</span>}
                  </span>
                  <span style={{ fontSize: 13, lineHeight: 1.25 }}>{m.nome}</span>
                </Link>
              ))}
            </Rolar>
          </div>
      )}


      {/* 08 · sommelier e anotações */}
      <Card pad={16} gap={12}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}><Rot>Sommelier</Rot><span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>pergunte sobre o {p.nome}</span></div>
        {v.conv ? (
          <>
            <div style={{ alignSelf: "flex-end", maxWidth: "88%", padding: "10px 14px", borderRadius: "18px 18px 4px 18px", background: "var(--chip-2)", fontSize: 13.5, lineHeight: 1.45 }}>{v.conv.p}</div>
            <div style={{ maxWidth: "92%", padding: "12px 14px", borderRadius: "18px 18px 18px 4px", background: "var(--bg)", border: "1px solid var(--line)", fontSize: 13.5, lineHeight: 1.5 }}>{v.conv.r}</div>
          </>
        ) : null}
        <div className="c-rolar" style={{ gap: 6 }}>
          {v.perguntas.map((q) => <Link key={q.t} href={q.href} className="c-pill" style={{ height: 34, borderRadius: 17, fontSize: 12.5, border: "1px solid var(--line-2)", background: "transparent" }}>{q.t}</Link>)}
        </div>
        <form action="/sommelier" method="get" className="c-campo" style={{ height: 48 }}>
          <input type="hidden" name="perfume" value={p.id} />
          <input name="q" placeholder="Escreva ou toque no microfone" aria-label="Pergunta para o sommelier" />
          <Link href={cab.voz} className="c-circ" style={{ width: 36, height: 36, background: "var(--btn)", color: "var(--on-btn)" }} aria-label="Falar"><Icone nome="mic" tamanho={16} /></Link>
        </form>
      </Card>
      <Card pad={16} gap={12}>
        <Rot>Minhas anotações</Rot>
        {cab.anotacao ? (
          <div style={{ borderLeft: `2px solid ${OURO}`, paddingLeft: 14, fontSize: 15, lineHeight: 1.5 }}>{cab.anotacao}</div>
        ) : (
          <Link href={`/editar/${p.id}`} style={{ fontSize: 14, color: "var(--ink-2)" }}>Nenhuma anotação ainda. <span style={{ borderBottom: "1px solid var(--prata)" }}>Escrever uma</span></Link>
        )}
      </Card>
      {v.demo && <Demo />}
    </div>
  );
}
