/* Início do computador, Atlas Vivo (docs/DECISOES.md §28). Escrito à mão: não é mais gerado da prancha. */
import Link from "next/link";
import type { CSSProperties } from "react";
import { Icone } from "@/components/Icone";
import { Camadas, PalcoC } from "@/cel/kit";
import { corDoAcorde } from "@/lib/cores";
import type { montarInicio } from "@/montar/inicio";
import "./inicio.css";

type V = Awaited<ReturnType<typeof montarInicio>>;
const n3 = (n: number) => String(n).padStart(3, "0");
const i = (n: number) => ({ ["--i" as string]: n }) as CSSProperties;

/** Título que chega palavra por palavra. */
function Palavras({ texto, de = 0 }: { texto: string; de?: number }) {
  return <>{texto.split(" ").map((w, k) => <span key={k} style={i(de + k)}>{w}&nbsp;</span>)}</>;
}

export default function DesInicio({ v }: { v: V }) {
  const h = v.vitrine[0];
  const c = v.cel;
  const d = c.dia;
  const p = d?.e.perfume;
  const temps = c.semana.map((s) => s.temp);
  const tMin = Math.min(...temps) - 2, tMax = Math.max(...temps) + 2;
  const yT = (t: number) => 70 - ((t - tMin) / Math.max(1, tMax - tMin)) * 56;
  const curva = c.semana.map((s, k) => `${k === 0 ? "M" : "L"} ${k * 100 + 50} ${yT(s.temp).toFixed(1)}`).join(" ");

  return (
    <div className="vivo" style={{ ["--luz" as string]: h.terrA } as CSSProperties}>
      {/* ---------- palco: o perfume em destaque ocupa a tela ---------- */}
      <section className="vivo-palco">
        <div className="vivo-palco-luz" aria-hidden="true" />
        <div className="vivo-anel" aria-hidden="true"><Camadas camadas={v.anel} tam={760} op={0.12} /></div>
        <div className="vivo-letreiro" aria-hidden="true">
          <div>{Array.from({ length: 4 }, (_, k) => <span key={k}>{h.nome}&nbsp;·&nbsp;</span>)}</div>
        </div>

        <div className="vivo-palco-txt">
          <div className="vivo-saudacao">{c.saudacao}, Willian <span>·</span> {c.data}</div>
          {h.selo ? <span className="vivo-selo">{h.selo}</span> : null}
          {h.casaUp ? <div className="vivo-casa">{h.casaUp}{h.conc ? ` · ${h.conc}` : ""}</div> : null}
          <h1 className="vivo-h1 palavras"><Palavras texto={h.nome} /></h1>
          {h.notas ? <p className="vivo-notas">{h.notas}</p> : null}
          <div className="vivo-chips">
            {h.familia ? <span className="chip-vivo"><i style={{ background: h.terrA }} />{h.familia}</span> : null}
            {h.dura ? <span className="chip-vivo">{h.dura}</span> : null}
          </div>
          <div className="vivo-acoes">
            {h.href ? <Link href={h.href} className="btn vivo-btn">Ver ficha <Icone nome="seta" tamanho={18} /></Link> : null}
            <Link href="/sommelier" className="btn ghost vivo-btn"><Icone nome="mic" tamanho={18} />Falar com o sommelier</Link>
          </div>
        </div>

        <div className="vivo-frasco">
          <div className="vivo-chao" aria-hidden="true" />
          {h.foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="flutua" src={h.foto} alt={h.nome} />
          ) : (
            <div className="flutua vivo-frasco-vazio"><Icone nome="colecao" tamanho={120} traco={0.8} /></div>
          )}
        </div>

        <div className="vivo-rodape-palco">
          <span>{h.entrada}</span>
          <span>{h.coord}</span>
        </div>
      </section>

      <main className="vivo-corpo">
        {/* ---------- frase do dia ---------- */}
        <p className="vivo-frase">
          Hoje faz <em>{d?.temp ?? "—"} °C</em> em {c.cidade || "sua cidade"}{d ? <>, {d.ar}.</> : "."} {p ? <>O Atlas sugere <em>{p.nome}</em>.</> : <>Cadastre um frasco para receber sugestões.</>}
        </p>

        {/* ---------- hoje: perfume do dia + curiosidade (bento) ---------- */}
        <section className="vivo-hoje">
          <article className="vivo-dia" style={{ ["--terr" as string]: p ? corDoAcorde(p.acorde) : "var(--acento)" } as CSSProperties}>
            {d && p ? (
              <>
                <Link href={`/colecao/${d.e.perfumeId}`} className="vivo-dia-palco">
                  <PalcoC nome={p.nome} casa={p.casa} acorde={p.acorde} forma={p.forma} tampa={p.tampa} foto={d.e.foto ?? p.imagem} oficial={!d.e.foto && Boolean(p.imagem)} altura={380} k={1.7} raio={24} semBorda />
                </Link>
                <div className="vivo-dia-txt">
                  <span className="rotulo">Perfume do dia</span>
                  <h2>{p.nome}</h2>
                  <div className="vivo-casa">{`${p.casa} · ${p.familia}`.toUpperCase()}</div>
                  <p>{"porque" in v.dia ? v.dia.porque : d.curto}</p>
                  <form action="/api/usar" method="post" className="vivo-acoes">
                    <input type="hidden" name="id" defaultValue={d.e.id} />
                    <button type="submit" className="btn">Usar hoje</button>
                    <Link href={v.dia.outra} className="btn ghost">Outra sugestão</Link>
                  </form>
                </div>
              </>
            ) : (
              <div className="vivo-dia-txt">
                <span className="rotulo">Perfume do dia</span>
                <h2>Seu primeiro frasco</h2>
                <p>Cadastre o primeiro perfume e o Atlas passa a sugerir um por dia, pelo clima.</p>
                <div className="vivo-acoes"><Link href="/adicionar" className="btn">Adicionar perfume</Link></div>
              </div>
            )}
          </article>

          <Link href={v.cur.href} className="vivo-cur">
            {v.cur.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.cur.foto} alt={v.cur.nota} />
            ) : null}
            <div className="vivo-cur-txt">
              <span className="rotulo">Curiosidade do dia</span>
              <h3>{v.cur.titulo}</h3>
              <p>{v.cur.texto}</p>
              <span className="vivo-link">{v.cur.link} <Icone nome="seta" tamanho={16} /></span>
            </div>
          </Link>
        </section>

        {/* ---------- a semana pelo clima: curva de temperatura + um frasco por dia ---------- */}
        <section className="vivo-semana">
          <header>
            <h2 className="vivo-h2">A semana pelo clima</h2>
            <span>{v.previsao}{v.resgata ? <> · <b>{v.resgata}</b></> : null}</span>
          </header>
          <div className="vivo-semana-grade">
            <svg className="vivo-curva" viewBox="0 0 700 80" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="curva" x1="0" x2="1">
                  <stop offset="0" stopColor="var(--acento)" />
                  <stop offset="1" stopColor="var(--musgo)" />
                </linearGradient>
              </defs>
              <path className="desenha" d={curva} pathLength={1} style={{ ["--comp" as string]: 1 } as CSSProperties} fill="none" stroke="url(#curva)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
            {c.semana.map((s, k) => (
              <Link key={k} href={s.e ? `/colecao/${s.e.perfumeId}` : "/colecao"} className={`vivo-diaseq ${k === 0 ? "hoje" : ""}`}>
                <span className="vivo-diaseq-dia">{k === 0 ? "HOJE" : s.dia}</span>
                <span className="vivo-diaseq-temp">{s.temp}°</span>
                <div className="vivo-diaseq-frasco">
                  {s.e ? <PalcoC nome={s.e.perfume.nome} casa={s.e.perfume.casa} acorde={s.e.perfume.acorde} forma={s.e.perfume.forma} tampa={s.e.perfume.tampa} foto={s.e.foto ?? s.e.perfume.imagem} oficial={!s.e.foto && Boolean(s.e.perfume.imagem)} altura={130} k={0.62} raio={20} transparente semBorda /> : <div className="vivo-diaseq-vazio" />}
                </div>
                <span className="vivo-diaseq-nome">{s.e?.perfume.nome ?? "—"}</span>
                {s.esquecido ? <span className="vivo-tag">Esquecido</span> : null}
              </Link>
            ))}
          </div>
        </section>

        {/* ---------- índice da coleção: algarismos grandes, sem cartões ---------- */}
        <section className="vivo-indice">
          <div className="vivo-indice-txt">
            <h2 className="vivo-h2 grande">Cada frasco tem uma história.</h2>
            <p>Mais do que perfumes, guardo experiências, momentos e emoções que eles me proporcionam. Bem-vindo ao meu atlas pessoal.</p>
            <div className="vivo-assinatura">Willian Lange Gomes</div>
            <Link href="/colecao" className="btn ghost">Explorar a coleção <Icone nome="seta" tamanho={18} /></Link>
          </div>
          <dl className="vivo-numeros">
            {v.numeros.map((n, k) => (
              <div key={k} style={i(k)}>
                <dt>{n.l}</dt>
                <dd>{n.v}</dd>
                <span>{n.c}</span>
              </div>
            ))}
          </dl>
        </section>

        {/* ---------- prateleira: últimas entradas ---------- */}
        {c.ultimas.length > 0 && (
          <section className="vivo-prateleira">
            <header>
              <h2 className="vivo-h2">Últimas entradas</h2>
              <Link href="/colecao" className="vivo-link">Ver todas <Icone nome="seta" tamanho={16} /></Link>
            </header>
            <div className="vivo-prateleira-trilho">
              {c.ultimas.map((e) => (
                <Link key={e.id} href={`/colecao/${e.perfumeId}`} className="vivo-frasco-card">
                  <PalcoC nome={e.perfume.nome} casa={e.perfume.casa} acorde={e.perfume.acorde} forma={e.perfume.forma} tampa={e.perfume.tampa} foto={e.foto ?? e.perfume.imagem} oficial={!e.foto && Boolean(e.perfume.imagem)} altura={260} k={1.2} raio={24}>
                    <span className="vivo-num">Nº {n3(e.numero)}</span>
                  </PalcoC>
                  <strong>{e.perfume.nome}</strong>
                  <span className="vivo-casa">{e.perfume.casa.toUpperCase()}</span>
                  <span className="vivo-acorde"><i style={{ background: corDoAcorde(e.perfume.acorde) }} />{e.perfume.acorde}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ---------- esquecidos: contadores grandes ---------- */}
        {c.esquecidos.length > 0 && (
          <section className="vivo-esquecidos">
            <h2 className="vivo-h2">Há mais tempo no armário</h2>
            <div className="vivo-esquecidos-grade">
              {c.esquecidos.map((e) => (
                <Link key={e.id} href={`/colecao/${e.perfumeId}`} className="vivo-esquecido">
                  <div className="vivo-esquecido-n"><b>{e.dias}</b><span>dias</span></div>
                  <div className="vivo-esquecido-frasco">
                    <PalcoC nome={e.perfume.nome} casa={e.perfume.casa} acorde={e.perfume.acorde} forma={e.perfume.forma} tampa={e.perfume.tampa} foto={e.foto ?? e.perfume.imagem} oficial={!e.foto && Boolean(e.perfume.imagem)} altura={120} k={0.6} raio={20} transparente semBorda />
                  </div>
                  <div className="vivo-esquecido-txt"><strong>{e.perfume.nome}</strong><span>{e.perfume.casa} · {e.perfume.acorde}</span></div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {v.demo ? <span className="tracejado" style={{ alignSelf: "flex-end" }}>CLIMA, DATAS E SUGESTÕES ILUSTRATIVOS</span> : null}
      </main>

      <footer className="vivo-pilares">
        {v.pilares.map((pl, k) => (
          <div key={k}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={pl.d} /></svg>
            <strong>{pl.t}</strong>
            <span>{pl.x}</span>
          </div>
        ))}
      </footer>
    </div>
  );
}
