/* Descobrir no celular, Atlas Vivo (docs/DECISOES.md §28.10). */
import Link from "next/link";
import { LicaoFeita } from "@/components/cliente/LicaoFeita";
import type { montarDescobrir } from "@/montar/descobrir";
import "./cel-descobrir.css";

type V = Awaited<ReturnType<typeof montarDescobrir>>;

export function CelDescobrir({ v }: { v: V }) {
  const anos = [...v.tempo.pts].sort((a, b) => (a.ano ?? 0) - (b.ano ?? 0));
  return (
    <div className="c-tela cdes">
      <header className="cdes-topo">
        <span className="c-rot">Descobrir{v.demo ? " · ilustrativo" : ""}</span>
        <h1>Aprender com<br /><em>a própria coleção.</em></h1>
      </header>

      <section className="cdes-bloco">
        <div className="cdes-cab"><h2>Escola do nariz</h2><span>{v.licoesTxt}</span></div>
        <div className="cdes-progresso"><i style={{ width: v.licoesPct }} /></div>
        {v.licoesAviso ? <p className="cdes-aviso">{v.licoesAviso}</p> : null}
        <div className="c-rolar cdes-licoes">
          {v.licoes.map((l, k) => (
            <article key={k} className={l.feita ? "feita" : ""}>
              <div className="cdes-licao-cab"><span>{l.n}</span><span>{l.status}</span></div>
              <strong>{l.titulo}</strong>
              <p>{l.txt}</p>
              <small>{v.licoesIA ? "Frascos" : "Na sua coleção"}: <b>{l.ex}</b></small>
              {v.licoesIA && "semana" in l && l.semana ? <LicaoFeita semana={l.semana} feita={Boolean(l.feita)} cor="var(--acento)" corFeita="var(--musgo)" /> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="cdes-bloco cdes-nota">
        <div className="cdes-cab"><h2>Nota em foco</h2><span>{v.notasTxt}</span></div>
        <div className="cdes-nota-topo">
          {v.enc.foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={v.enc.foto} alt={v.enc.nome} />
          ) : <span className="cdes-nota-vazia" />}
          <div><strong>{v.enc.nome}</strong><span>{v.enc.tipo}</span></div>
        </div>
        <dl>
          <dt>Origem</dt><dd>{v.enc.origem}</dd>
          <dt>Como se obtém</dt><dd>{v.enc.como}</dd>
          <dt>Na coleção</dt><dd>{v.enc.naColecao}</dd>
          <dt>Para conhecer</dt><dd>{v.enc.conhecer}</dd>
        </dl>
        <div className="c-rolar cdes-outras">
          {v.notasMini.map((n) => <Link key={n.nome} href={n.href} className="c-pill" style={{ height: 34 }}>{n.nome}</Link>)}
        </div>
      </section>

      <section className="cdes-bloco">
        <h2>Linha do tempo</h2>
        <p className="cdes-aviso">{v.tempoTxt}</p>
        <ol className="cdes-tempo">
          {anos.map((p, k) => (
            <li key={k} className={p.tive ? "tive" : ""}><b>{p.ano}</b><i style={{ background: p.cor }} /><span>{p.nome}</span></li>
          ))}
        </ol>
      </section>

      <section className="cdes-bloco">
        <h2>De onde vêm</h2>
        <ul className="cdes-paises">
          {v.mapa.paises.map((p) => <li key={p.nome}><div><strong>{p.nome}</strong><span>{p.casas}</span></div><b>{p.n}</b></li>)}
        </ul>
      </section>
    </div>
  );
}
