/* Início do celular, Atlas Vivo (docs/DECISOES.md §28). */
import Link from "next/link";
import type { CSSProperties } from "react";
import { Icone } from "@/components/Icone";
import { ICONE_CLIMA } from "@/desenho/h2";
import { corDoAcorde } from "@/lib/cores";
import { Demo, NotaChip, PalcoC } from "./kit";
import type { montarInicio } from "@/montar/inicio";
import "./cel-inicio.css";

type D = Awaited<ReturnType<typeof montarInicio>>;
const n3 = (n: number) => String(n).padStart(3, "0");

export function CelInicio({ v, usado }: { v: D; usado?: string }) {
  const c = v.cel;
  const d = c.dia;
  const p = d?.e.perfume;
  const terr = p ? corDoAcorde(p.acorde) : "var(--acento)";
  return (
    <div className="c-tela ci">
      <header className="ci-ola">
        <span>{[c.data, c.cidade].filter(Boolean).join(" · ")}</span>
        <h1>{c.saudacao},<br /><em>{c.nome}.</em></h1>
      </header>

      {d && p ? (
        <section className="ci-dia" style={{ ["--terr" as string]: terr } as CSSProperties}>
          <div className="ci-dia-topo">
            <span className="c-rot">Perfume do dia</span>
            <span className="ci-clima">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d={ICONE_CLIMA.sol} /></svg>
              {d.temp}° · {d.ar.replace("ar ", "")}
            </span>
          </div>
          <Link href={`/colecao/${d.e.perfumeId}`} className="ci-dia-palco">
            <PalcoC nome={p.nome} casa={p.casa} acorde={p.acorde} forma={p.forma} tampa={p.tampa} foto={d.e.foto ?? p.imagem} oficial={!d.e.foto && Boolean(p.imagem)} altura={280} k={1.3} raio={24} transparente semBorda />
          </Link>
          <h2>{p.nome}</h2>
          <div className="ci-casa">{`${p.casa} · ${p.familia}`.toUpperCase()}</div>
          <p>{d.curto}</p>
          <div className="ci-notas">{d.notas.map((n) => <NotaChip key={n} nome={n} tam={24} fs={12.5} />)}</div>
          <form action="/api/usar" method="post" className="ci-acoes">
            <input type="hidden" name="id" value={d.e.id} />
            <button type="submit" className="c-btn" style={{ height: 52, flexGrow: 1 }}>{usado === d.e.id ? "✓ Usado hoje" : "Usar hoje"}</button>
            <Link href={v.dia.outra} className="c-btn sec" style={{ height: 52 }}>Outra</Link>
          </form>
        </section>
      ) : (
        <section className="ci-dia">
          <span className="c-rot">Perfume do dia</span>
          <h2>Seu primeiro frasco</h2>
          <p>Cadastre o primeiro perfume e o Atlas passa a sugerir um por dia, pelo clima.</p>
          <Link href="/adicionar?modo=foto" className="c-btn" style={{ height: 52 }}>Adicionar perfume</Link>
        </section>
      )}

      <Link href={`/curiosidade?nota=${encodeURIComponent(c.cur.nota)}`} className="ci-cur">
        {v.cur.foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.cur.foto} alt={c.cur.nota} />
        ) : null}
        <div>
          <span className="c-rot">Curiosidade do dia</span>
          <h3>{c.cur.titulo}</h3>
          <span className="ci-cur-onde">{c.cur.onde} <Icone nome="seta" tamanho={14} /></span>
        </div>
      </Link>

      <section className="ci-bloco">
        <h2 className="ci-h2">A semana pelo clima</h2>
        <div className="c-rolar ci-semana">
          {c.semana.map((s, i) => (
            <Link key={i} href={s.e ? `/colecao/${s.e.perfumeId}` : "/colecao"} className={`ci-diaseq ${i === 0 ? "hoje" : ""}`}>
              <span className="ci-diaseq-dia">{i === 0 ? "HOJE" : s.dia}</span>
              <span className="ci-diaseq-temp">{s.temp}°</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d={ICONE_CLIMA[s.icone]} /></svg>
              <span className="ci-diaseq-nome">{s.e?.perfume.nome ?? "—"}</span>
              {s.esquecido ? <span className="ci-tag">Esquecido</span> : null}
            </Link>
          ))}
        </div>
      </section>

      <section className="ci-numeros">
        {v.numeros.map((n, i) => (
          <div key={i}>
            <b>{n.v}</b>
            <span>{n.c}</span>
          </div>
        ))}
      </section>

      {c.ultimas.length > 0 && (
        <section className="ci-bloco">
          <div className="ci-cab">
            <h2 className="ci-h2">Últimas entradas</h2>
            <Link href="/colecao" className="ci-link">Ver todas <Icone nome="seta" tamanho={14} /></Link>
          </div>
          <div className="c-rolar ci-prateleira">
            {c.ultimas.map((e) => (
              <Link key={e.id} href={`/colecao/${e.perfumeId}`} className="ci-frasco">
                <PalcoC nome={e.perfume.nome} casa={e.perfume.casa} acorde={e.perfume.acorde} forma={e.perfume.forma} tampa={e.perfume.tampa} foto={e.foto ?? e.perfume.imagem} oficial={!e.foto && Boolean(e.perfume.imagem)} altura={190} k={0.95} raio={22}>
                  <span className="ci-num">Nº {n3(e.numero)}</span>
                </PalcoC>
                <strong>{e.perfume.nome}</strong>
                <span className="ci-acorde"><i style={{ background: corDoAcorde(e.perfume.acorde) }} />{e.perfume.acorde}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {c.esquecidos.length > 0 && (
        <section className="ci-bloco">
          <h2 className="ci-h2">Há mais tempo no armário</h2>
          <div className="c-rolar ci-esquecidos">
            {c.esquecidos.map((e) => (
              <Link key={e.id} href={`/colecao/${e.perfumeId}`} className="ci-esquecido">
                <b>{e.dias}<small>dias</small></b>
                <strong>{e.perfume.nome}</strong>
                <span>{e.perfume.casa}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {v.demo && <Demo>Clima, datas e sugestões ilustrativos</Demo>}
    </div>
  );
}
