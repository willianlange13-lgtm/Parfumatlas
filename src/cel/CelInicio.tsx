import Link from "next/link";
import { ICONE_CLIMA } from "@/desenho/h2";
import { corDoAcorde } from "@/lib/cores";
import { Btn, Card, Demo, Linha, Mini, MONO, NomeSub, NotaChip, OURO, PalcoC, Rolar, Rot, Secao } from "./kit";
import type { montarInicio } from "@/montar/inicio";

type D = Awaited<ReturnType<typeof montarInicio>>;
const n3 = (n: number) => String(n).padStart(3, "0");

export function CelInicio({ v, usado }: { v: D; usado?: string }) {
  const c = v.cel;
  const d = c.dia;
  const p = d?.e.perfume;
  return (
    <div className="c-tela">
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0, marginTop: 6 }}>
        <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-.02em", lineHeight: 1.1 }}>{c.saudacao}, Willian</div>
        <div style={{ fontSize: 14, color: "var(--ink-3)" }}>{[c.data, c.cidade].filter(Boolean).join(" · ")}</div>
      </div>

      {d && p ? (
        <Card fundo="destaque">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Rot>Perfume do dia</Rot>
            <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 12, background: "var(--chip)", fontSize: 12 }}>
              <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: "none", stroke: OURO, strokeWidth: 1.6 }}><path d={ICONE_CLIMA.sol} /></svg>
              {d.temp}° · {d.ar.replace("ar ", "")}
            </span>
          </div>
          <Link href={`/colecao/${d.e.perfumeId}`} style={{ display: "flex", gap: 14, alignItems: "stretch" }}>
            <div style={{ width: 128, flexShrink: 0 }}>
              <PalcoC nome={p.nome} casa={p.casa} acorde={p.acorde} forma={p.forma} tampa={p.tampa} foto={d.e.foto} altura={170} k={0.9} raio={18} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0, paddingTop: 4 }}>
              <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-.02em", lineHeight: 1 }}>{p.nome}</div>
              <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".1em", color: "var(--ink-3)" }}>{`${p.casa} · ${p.familia}`.toUpperCase()}</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--ink-2)" }}>{d.curto}</div>
            </div>
          </Link>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {d.notas.map((n) => <NotaChip key={n} nome={n} tam={24} fs={12.5} />)}
          </div>
          <form action="/api/usar" method="post" style={{ display: "flex", gap: 8 }}>
            <input type="hidden" name="id" value={d.e.id} />
            <Btn type="submit" altura={44} style={{ flexGrow: 1 }}>{usado === d.e.id ? "✓ Usado hoje" : "Usar hoje"}</Btn>
            <Btn sec altura={44} href={v.dia.outra}>Outra</Btn>
          </form>
        </Card>
      ) : (
        <Card fundo="destaque">
          <Rot>Perfume do dia</Rot>
          <div style={{ fontSize: 15, color: "var(--ink-2)" }}>Cadastre o primeiro frasco e o Atlas passa a sugerir um perfume por dia, pelo clima.</div>
          <Btn href="/adicionar?modo=foto">Adicionar perfume</Btn>
        </Card>
      )}

      <Link href={`/curiosidade?nota=${encodeURIComponent(c.cur.nota)}`}>
        <Card fundo="vinho" pad="14px 16px">
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <NotaChip nome={c.cur.nota} tam={58} rotulo={false} />
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <Rot>Curiosidade do dia</Rot>
              <div style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.25 }}>{c.cur.titulo}</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{c.cur.onde}</div>
            </div>
          </div>
        </Card>
      </Link>

      <Secao
        titulo="A semana pelo clima"
        dir={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 6, height: 6, borderRadius: 3, background: OURO }} />esquecido</span>}
      />
      <Rolar>
        {c.semana.map((s, i) => (
          <Link key={i} href={s.e ? `/colecao/${s.e.perfumeId}` : "/colecao"} style={{ width: 70, flexShrink: 0, borderRadius: 18, padding: "12px 6px", background: i === 0 ? "var(--chip-2)" : "transparent", border: `1px solid ${i === 0 ? "var(--line-2)" : "var(--line)"}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 7, textAlign: "center" }}>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".1em", color: "var(--ink-3)" }}>{s.dia}</span>
            <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: "none", stroke: s.icone === "sol" ? OURO : "var(--prata)", strokeWidth: 1.5 }}><path d={ICONE_CLIMA[s.icone]} /></svg>
            <span style={{ fontSize: 17, fontWeight: 500 }}>{s.temp}°</span>
            <span style={{ fontSize: 11, lineHeight: 1.25, color: "var(--ink-2)", minHeight: 28 }}>{s.e?.perfume.nome.replace("Acqua di Giò Profondo", "Acqua di Giò") ?? "—"}</span>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: s.esquecido ? OURO : "transparent" }} />
          </Link>
        ))}
      </Rolar>

      {c.esquecidos.length > 0 && (
        <Card pad={16} gap={4}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
            <Rot>Esquecidos</Rot>
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>há mais tempo sem sair do armário</span>
          </div>
          {c.esquecidos.map((e, i) => (
            <Linha key={e.id} borda={i > 0} href={`/colecao/${e.perfumeId}`} esq={<Mini nome={e.perfume.nome} casa={e.perfume.casa} acorde={e.perfume.acorde} forma={e.perfume.forma} tampa={e.perfume.tampa} foto={e.foto} />}
              dir={<div style={{ textAlign: "right", lineHeight: 1 }}><div style={{ fontSize: 22, color: OURO }}>{e.dias}</div><div style={{ fontFamily: MONO, fontSize: 9, color: "var(--ink-3)", marginTop: 3 }}>DIAS</div></div>}>
              <NomeSub nome={e.perfume.nome} sub={`${e.perfume.casa} · ${e.perfume.acorde}`} />
            </Linha>
          ))}
        </Card>
      )}

      {c.ultimas.length > 0 && (
        <>
          <Secao titulo="Últimas entradas" dir={<Link href="/colecao">Ver todas →</Link>} />
          <Rolar gap={10}>
            {c.ultimas.map((e) => (
              <Link key={e.id} href={`/colecao/${e.perfumeId}`} style={{ width: 132, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                <PalcoC nome={e.perfume.nome} casa={e.perfume.casa} acorde={e.perfume.acorde} forma={e.perfume.forma} tampa={e.perfume.tampa} foto={e.foto} altura={118} k={0.6} raio={16}>
                  <span style={{ position: "absolute", left: 9, top: 8, fontFamily: MONO, fontSize: 9.5, color: "var(--ink-3)" }}>Nº {n3(e.numero)}</span>
                </PalcoC>
                <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "0 2px" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.perfume.nome}</span>
                  <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".08em", color: "var(--ink-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.perfume.casa.toUpperCase()}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--ink-2)" }}><span style={{ width: 6, height: 6, borderRadius: 3, background: corDoAcorde(e.perfume.acorde) }} />{e.perfume.acorde}</span>
                </div>
              </Link>
            ))}
          </Rolar>
        </>
      )}

      {v.demo && <Demo>Clima, datas e sugestões ilustrativos</Demo>}
    </div>
  );
}
