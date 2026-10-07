/* eslint-disable @typescript-eslint/no-explicit-any */
/* Ficha do computador, Atlas Vivo (docs/DECISOES.md §28.3). Mantida à mão a partir da prancha. */
import "./ficha.css";
import React, { Fragment, type ReactNode } from "react";
import { css } from "./css";
import type { montarFicha } from "@/montar/ficha";

export default function DesFicha({ v, acoes }: { v: NonNullable<Awaited<ReturnType<typeof montarFicha>>>; acoes?: ReactNode }) {
  const {
    semAcordes,
    historico,
    terr,
    t,
    clima,
    ocasioes,
    glifo,
    eixos,
    topFam,
    marcas,
    fatos,
    piramide,
    gauges,
    espectro,
    roda,
    votos,
    colunas,
    perguntas,
    casa,
    cab,
    conv,
    demo,
  } = v;
  return (
    <>
      <div
        style={{
          width: "1440px",
          minHeight: "100vh",
          boxSizing: "border-box",
          background: t.bg,
          color: t.ink,
          fontFamily: "var(--sans)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "820px",
            top: "-120px",
            width: "820px",
            height: "820px",
            borderRadius: "410px",
            background: `radial-gradient(circle, ${terr.glow} 0%, rgba(0,0,0,0) 65%)`,
          }}
        ></div>
        <div
          style={{
            position: "absolute",
            left: "-260px",
            top: "-200px",
            width: "700px",
            height: "700px",
            borderRadius: "350px",
            background: `radial-gradient(circle, ${terr.glowB} 0%, rgba(0,0,0,0) 65%)`,
          }}
        ></div>
        <div
          aria-hidden="true"
          style={{ position: "absolute", right: "-300px", top: "1240px", width: "760px", height: "760px", opacity: ".07", pointerEvents: "none" }}
        >
          {(glifo ?? []).map((L, _i2) => (
            <Fragment key={_i2}>
              <svg viewBox="-12 -12 344 344" style={{ position: "absolute", inset: "0", width: "100%", height: "100%", overflow: "visible" }}>
                <path d={L.d} style={{ fill: _i2 === 2 ? terr.a : "none", fillOpacity: ".5", stroke: terr.a, strokeWidth: "1" }}></path>
              </svg>
            </Fragment>
          ))}
        </div>
        <main style={{ position: "relative", padding: "20px 64px 80px", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: "10px", fontFamily: "var(--mono)", fontSize: "12px", letterSpacing: ".06em", color: t.ink3 }}
          >
            <a href="/colecao" style={{ color: "inherit", textDecoration: "none" }}>
              COLEÇÃO
            </a>
            <span>/</span>
            <span>{cab.acordeUp}</span>
            <span>/</span>
            <span style={{ color: t.ink2 }}>{cab.nomeUp}</span>
            <div style={{ flexGrow: "1" }}></div>
            {demo ? (
              <>
                <span style={{ padding: "6px 12px", border: `1px dashed ${t.line2}`, borderRadius: "14px" }}>VOTOS E SEMELHANÇAS ILUSTRATIVOS</span>
              </>
            ) : null}
            {acoes}
          </div>
          <header className="df-titulo">
            <div className="df-casa">{cab.casaCidade}</div>
            <h1 className="palavras">{String(cab.nome).split(" ").map((w: string, k: number) => <span key={k} style={{ ["--i" as string]: k } as React.CSSProperties}>{w}&nbsp;</span>)}</h1>
            {cab.coord ? <div className="df-coord"><span style={{ background: terr.a }} />{cab.coord}</div> : null}
          </header>
          <section className="df-palco" style={{ ["--terr" as string]: terr.a } as React.CSSProperties}>
            <figure
              className="df-figura"
              style={{
                position: "relative",
                overflow: "hidden",
                margin: "0",
                height: "460px",
                borderRadius: "var(--r-ed)",
                background: t.tileFeature,
                border: "1px solid var(--ouro-linha)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                paddingBottom: "24px",
                boxSizing: "border-box",
                gap: "18px",
              }}
            >
              {cab.foto ? (
                <img
                  src={cab.foto}
                  alt={cab.nome}
                  style={{
                    position: "absolute",
                    inset: cab.fotoOficial ? "14px 14px 44px" : "0",
                    width: cab.fotoOficial ? "calc(100% - 28px)" : "100%",
                    height: cab.fotoOficial ? "calc(100% - 58px)" : "100%",
                    objectFit: cab.fotoOficial ? "contain" : "cover",
                    borderRadius: cab.fotoOficial ? "14px" : "24px",
                    background: "transparent",
                    filter: cab.fotoOficial ? "drop-shadow(0 12px 14px rgba(0,0,0,.5)) drop-shadow(0 2px 3px rgba(0,0,0,.35))" : "none",
                  }}
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: "58px", height: "46px", background: cab.tampa, borderRadius: "4px", border: `1px solid ${t.line2}` }}></div>
                  <div style={{ width: "26px", height: "12px", background: "#8FA399" }}></div>
                  <div
                    style={{
                      width: "132px",
                      height: "236px",
                      borderRadius: "10px",
                      background: cab.vidro,
                      border: `1px solid ${t.line2}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "104px",
                        height: "74px",
                        borderRadius: "50%",
                        background: "#F6F4EE",
                        color: "#0B110F",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "3px",
                      }}
                    >
                      <span style={{ fontSize: "8px", letterSpacing: ".3em" }}>{cab.rot}</span>
                      <span style={{ fontSize: "17px", fontWeight: "600", letterSpacing: ".02em", textAlign: "center", lineHeight: "1.05" }}>
                        {cab.rotNome}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <figcaption style={{ fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: ".08em", color: t.ink3 }}>
                {cab.foto ? (cab.fotoOficial ? "FOTO OFICIAL" : "FOTO DO SEU FRASCO") : "FRASCO ILUSTRATIVO"}
              </figcaption>
            </figure>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

              <div className="df-desc">{cab.desc}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {(topFam ?? []).map((f, _i5) => (
                  <Fragment key={_i5}>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 14px",
                        borderRadius: "18px",
                        background: f.bg,
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      <span style={{ width: "9px", height: "9px", borderRadius: "5px", background: f.cor }}></span>
                      {f.nome}
                    </span>
                  </Fragment>
                ))}
                {cab.relacao ? (
                  <>
                    <span style={{ padding: "8px 14px", borderRadius: "18px", border: `1px solid ${t.amber}`, color: t.amber, fontSize: "14px" }}>
                      {cab.relacao}
                    </span>
                  </>
                ) : null}
              </div>
              <div style={{ display: "flex", gap: "6px", padding: "5px", borderRadius: "var(--r-ed)", background: t.pill, alignSelf: "flex-start" }}>
                {(marcas ?? []).map((m, _i5) => (
                  <Fragment key={_i5}>
                    <form action="/api/situacao" method="post" style={{ display: "contents" }}>
                      <input type="hidden" name="perfume" defaultValue={cab.id} />
                      <input type="hidden" name="situacao" defaultValue={m.chave} />
                      <button
                        type="submit"
                        style={{
                          height: "40px",
                          padding: "0 18px",
                          border: "none",
                          borderRadius: "var(--r-ctl)",
                          background: m.bg,
                          color: m.cor,
                          fontFamily: "var(--sans)",
                          fontSize: "14px",
                          fontWeight: "500",
                          cursor: "pointer",
                        }}
                      >
                        {m.nome}
                      </button>
                    </form>
                  </Fragment>
                ))}
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <a
                  href={cab.som}
                  className="btn"
                  style={{
                    height: "52px",
                    padding: "0 28px",
                    border: "none",
                    borderRadius: "var(--r-ctl)",
                    background: t.btn,
                    color: t.onBtn,
                    fontFamily: "var(--sans)",
                    fontSize: "15px",
                    fontWeight: "600",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    textDecoration: "none",
                  }}
                >
                  Perguntar ao sommelier
                </a>
                <a
                  href={cab.comparar}
                  className="btn ghost"
                  style={{
                    height: "52px",
                    padding: "0 24px",
                    border: `1px solid ${t.line2}`,
                    borderRadius: "var(--r-ctl)",
                    background: "transparent",
                    color: t.ink,
                    fontFamily: "var(--sans)",
                    fontSize: "15px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    textDecoration: "none",
                  }}
                >
                  Comparar
                </a>
                <a
                  href={cab.blind}
                  className="btn ghost"
                  style={{
                    height: "52px",
                    padding: "0 24px",
                    border: `1px solid ${t.line2}`,
                    borderRadius: "var(--r-ctl)",
                    background: "transparent",
                    color: t.ink,
                    fontFamily: "var(--sans)",
                    fontSize: "15px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    textDecoration: "none",
                  }}
                >
                  Blind test
                </a>
              </div>
            </div>
            <div style={{ position: "relative", width: "500px", height: "500px" }}>
              <div
                style={{
                  position: "absolute",
                  left: "70px",
                  top: "70px",
                  width: "360px",
                  height: "360px",
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${terr.glow} 0%, rgba(0,0,0,0) 70%)`,
                }}
              ></div>
              <div
                style={{
                  position: "absolute",
                  right: "0",
                  top: "6px",
                  textAlign: "right",
                  fontFamily: "var(--mono)",
                  fontSize: "11px",
                  letterSpacing: ".14em",
                  color: t.ink3,
                  lineHeight: "1.7",
                }}
              >
                DNA OLFATIVO
                <br />
                <span style={{ color: terr.a }}>{terr.nome.toUpperCase()}</span>
              </div>
              {semAcordes ? (
                <a
                  href={`/editar/${encodeURIComponent(cab.id)}`}
                  style={{
                    position: "absolute",
                    left: "250px",
                    top: "250px",
                    transform: "translate(-50%, -50%)",
                    zIndex: 2,
                    padding: "12px 18px",
                    borderRadius: "var(--r-ctl)",
                    background: t.bg,
                    border: `1px solid ${t.line2}`,
                    color: t.ink,
                    fontSize: "14px",
                    textDecoration: "none",
                    textAlign: "center",
                    lineHeight: "1.4",
                  }}
                >
                  Sem acordes nesta ficha
                  <br />
                  <span style={{ color: t.amberTxt }}>Marcar em Editar →</span>
                </a>
              ) : null}
              {(glifo ?? []).map((L, _i4) => (
                <Fragment key={_i4}>
                  <svg
                    className="dna-respira"
                    viewBox="-12 -12 344 344"
                    style={{ position: "absolute", left: "50px", top: "50px", width: "400px", height: "400px", overflow: "visible" }}
                  >
                    <path d={L.d} style={css(L.st)}></path>
                  </svg>
                </Fragment>
              ))}
              {(eixos ?? []).map((e, _i4) => (
                <Fragment key={_i4}>
                  <div
                    style={{
                      position: "absolute",
                      left: `${e.x}px`,
                      top: `${e.y}px`,
                      transform: "translate(-50%, -50%)",
                      fontFamily: "var(--mono)",
                      fontSize: "11px",
                      letterSpacing: ".06em",
                      color: t.ink3,
                      textAlign: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {e.nome}
                    <br />
                    <span style={{ color: e.cor, fontSize: "13px" }}>{e.v}</span>
                  </div>
                </Fragment>
              ))}
            </div>
          </section>
          <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "16px" }}>
            {(fatos ?? []).map((s, _i3) => (
              <Fragment key={_i3}>
                <div
                  style={{
                    borderRadius: "var(--r-ed)",
                    background: t.surface,
                    border: `1px solid ${t.line}`,
                    padding: "20px 22px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: ".1em", color: t.ink3 }}>{s.l}</div>
                  <div style={{ fontSize: "22px", fontWeight: "500", letterSpacing: "-.01em", lineHeight: "1.15" }}>{s.v}</div>
                  <div style={{ fontSize: "13px", color: t.ink3 }}>{s.c}</div>
                </div>
              </Fragment>
            ))}
          </section>
          <section style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: "24px" }}>
            <article
              style={{
                gridColumn: "span 7",
                borderRadius: "var(--r-ed)",
                background: t.bg,
                border: `1px solid ${t.line2}`,
                padding: "30px 28px",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              <h2 style={{ margin: "0", fontFamily: "var(--mono)", fontSize: "12px", fontWeight: "400", letterSpacing: ".14em", color: t.amberTxt }}>
                ACORDES PRINCIPAIS
              </h2>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", height: "230px" }}>
                {(espectro ?? []).map((e, _i5) => (
                  <Fragment key={_i5}>
                    <div style={{ flexGrow: "1", flexBasis: "0", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "13px" }}>{e.v}</span>
                      <div style={{ width: "100%", height: `${e.h}px`, borderRadius: "10px", background: e.cor }}></div>
                    </div>
                  </Fragment>
                ))}
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "-8px" }}>
                {(espectro ?? []).map((e, _i5) => (
                  <Fragment key={_i5}>
                    <span style={{ flexGrow: "1", flexBasis: "0", textAlign: "center", fontSize: "11px", color: t.ink2 }}>{e.curto}</span>
                  </Fragment>
                ))}
              </div>
            </article>
            <article
              style={{
                gridColumn: "span 5",
                borderRadius: "var(--r-ed)",
                background: t.surface,
                border: `1px solid ${t.line}`,
                padding: "30px 28px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <h2 style={{ margin: "0", fontFamily: "var(--mono)", fontSize: "12px", fontWeight: "400", letterSpacing: ".14em", color: t.amberTxt }}>
                DESEMPENHO · COMUNIDADE
              </h2>
              {(gauges ?? []).map((g, _i4) => (
                <Fragment key={_i4}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                    <div style={{ position: "relative", width: "240px", height: "132px" }}>
                      <svg viewBox="0 0 240 132" style={{ position: "absolute", left: "0", top: "0", width: "240px", height: "132px" }}>
                        <path d={g.trilho} style={{ fill: "none", stroke: t.chip2, strokeWidth: "14", strokeLinecap: "round" }}></path>
                        <path d={g.valor} style={{ fill: "none", stroke: g.cor, strokeWidth: "14", strokeLinecap: "round" }}></path>
                        <path d={g.marca} style={{ fill: "none", stroke: t.ink, strokeWidth: "3", strokeLinecap: "round" }}></path>
                      </svg>
                      <div
                        style={{
                          position: "absolute",
                          left: "0",
                          right: "0",
                          top: "64px",
                          textAlign: "center",
                          fontSize: "30px",
                          fontWeight: "500",
                          letterSpacing: "-.02em",
                        }}
                      >
                        {g.txt}
                      </div>
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: "500" }}>{g.nome}</div>
                    <div style={{ fontSize: "13px", color: t.ink3, textAlign: "center" }}>{g.sub}</div>
                    <div style={{ fontSize: "12px", color: t.ink3, textAlign: "center" }}>{g.ref}</div>
                  </div>
                </Fragment>
              ))}
            </article>
            <article
              style={{
                gridColumn: "span 12",
                background: "transparent",
                borderTop: `1px solid ${terr.linha}`,
                borderRadius: "0",
                padding: "34px 4px 8px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <h2 style={{ margin: "0", fontFamily: "var(--mono)", fontSize: "12px", fontWeight: "400", letterSpacing: ".14em", color: t.amberTxt }}>
                PIRÂMIDE OLFATIVA
              </h2>
              <div style={{ display: "flex", alignItems: "baseline", gap: "14px", marginBottom: "8px" }}>
                <div style={{ fontSize: "24px", fontWeight: "500", letterSpacing: "-.02em", lineHeight: "1.2" }}>{cab.frase}</div>
              </div>
              {(piramide ?? []).map((c, _i4) => (
                <Fragment key={_i4}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "190px minmax(0, 1fr)",
                      gap: "20px",
                      alignItems: "center",
                      padding: "16px 0",
                      borderTop: `1px solid ${t.line}`,
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "22px", fontWeight: "500", color: terr.a }}>{c.nome}</span>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: ".06em", color: t.ink3 }}>{c.tempo}</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "22px" }}>
                      {(c.notas ?? []).map((n, _i7) => (
                        <Fragment key={_i7}>
                          <div style={{ width: "104px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                            <span
                              style={{
                                position: "relative",
                                width: "88px",
                                height: "88px",
                                borderRadius: "50%",
                                overflow: "hidden",
                                background: n.foto,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {n.img ? (
                                <>
                                  <img src={n.img} alt={n.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                </>
                              ) : null}
                              {n.semImg ? (
                                <>
                                  <svg
                                    viewBox="0 0 24 24"
                                    style={{
                                      width: "30px",
                                      height: "30px",
                                      fill: "none",
                                      stroke: "#FFFFFF",
                                      strokeOpacity: ".85",
                                      strokeWidth: "1.3",
                                      strokeLinecap: "round",
                                      strokeLinejoin: "round",
                                    }}
                                  >
                                    <path d={n.d}></path>
                                  </svg>
                                </>
                              ) : null}
                            </span>
                            <span style={{ fontSize: "13px", textAlign: "center", lineHeight: "1.25" }}>{n.nome}</span>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                </Fragment>
              ))}
            </article>
            <article
              style={{
                gridColumn: "span 6",
                borderRadius: "var(--r-ed)",
                background: t.tileWine,
                border: `1px solid ${t.line}`,
                padding: "30px 28px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <h2 style={{ margin: "0", fontFamily: "var(--mono)", fontSize: "12px", fontWeight: "400", letterSpacing: ".14em", color: t.wineTxt }}>
                QUANDO FUNCIONA{v.quandoEst ? " · ESTIMATIVA" : ""}
              </h2>
              <div style={{ position: "relative", width: "280px", height: "260px", alignSelf: "center" }}>
                <svg viewBox="0 0 280 260" style={{ position: "absolute", left: "0", top: "0", width: "280px", height: "260px" }}>
                  <path d={roda.guia} style={{ fill: "none", stroke: t.line2, strokeWidth: "1" }}></path>
                </svg>
                {(roda.seg ?? []).map((s, _i5) => (
                  <Fragment key={_i5}>
                    <svg viewBox="0 0 280 260" style={{ position: "absolute", left: "0", top: "0", width: "280px", height: "260px" }}>
                      <path d={s.d} style={{ fill: s.cor, stroke: t.bgWine, strokeWidth: "3" }}></path>
                    </svg>
                  </Fragment>
                ))}
                {(roda.seg ?? []).map((s, _i5) => (
                  <Fragment key={_i5}>
                    <div
                      style={{
                        position: "absolute",
                        left: `${s.lx}px`,
                        top: `${s.ly}px`,
                        transform: "translate(-50%, -50%)",
                        textAlign: "center",
                        fontSize: "12px",
                        color: t.ink2,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.nome}
                      <br />
                      <span style={{ fontFamily: "var(--mono)", fontSize: "13px", color: t.ink }}>{s.v}</span>
                    </div>
                  </Fragment>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px" }}>
                <div
                  style={{ borderRadius: "16px", background: t.chip, padding: "12px 14px", display: "flex", justifyContent: "space-between", fontSize: "14px" }}
                >
                  <span>Dia</span>
                  <span style={{ fontFamily: "var(--mono)" }}>{cab.dia}</span>
                </div>
                <div
                  style={{ borderRadius: "16px", background: t.chip, padding: "12px 14px", display: "flex", justifyContent: "space-between", fontSize: "14px" }}
                >
                  <span>Noite</span>
                  <span style={{ fontFamily: "var(--mono)" }}>{cab.noite}</span>
                </div>
              </div>
            </article>
            <article
              style={{
                gridColumn: "span 6",
                borderRadius: "var(--r-ed)",
                background: t.surface,
                border: `1px solid ${t.line}`,
                padding: "30px 26px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <h2 style={{ margin: "0", fontFamily: "var(--mono)", fontSize: "12px", fontWeight: "400", letterSpacing: ".14em", color: t.amberTxt }}>VOTOS</h2>
              {(votos ?? []).map((v, _i4) => (
                <Fragment key={_i4}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "500" }}>{v.nome}</span>
                    {(v.itens ?? []).map((i, _i6) => (
                      <Fragment key={_i6}>
                        <div style={{ display: "grid", gridTemplateColumns: "96px minmax(0, 1fr) 30px", gap: "8px", alignItems: "center", fontSize: "12px" }}>
                          <span style={{ color: i.txt }}>{i.nome}</span>
                          <div style={{ height: "6px", borderRadius: "3px", background: t.chip2 }}>
                            <div style={{ height: "6px", borderRadius: "3px", width: `${i.pct}%`, background: i.cor }}></div>
                          </div>
                          <span style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: "11px", color: t.ink2 }}>{i.pct}</span>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </Fragment>
              ))}
            </article>
            {historico ? (
              <article
                style={{
                  gridColumn: "span 12",
                  position: "relative",
                  borderRadius: "var(--r-ed)",
                  background: `linear-gradient(90deg, ${terr.glow} 0%, rgba(0,0,0,0) 40%), ${t.surface}`,
                  border: `1px solid ${t.line}`,
                  padding: "30px 34px 30px 76px",
                  display: "grid",
                  gridTemplateColumns: "220px minmax(0, 1fr) 260px",
                  gap: "40px",
                  alignItems: "center",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: "26px",
                    top: "50%",
                    transform: "translateY(-50%) rotate(180deg)",
                    writingMode: "vertical-rl",
                    fontFamily: "var(--mono)",
                    fontSize: "11px",
                    letterSpacing: ".24em",
                    color: t.amberTxt,
                  }}
                >
                  HISTÓRICO
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "72px", fontWeight: "500", letterSpacing: "-.04em", lineHeight: ".9", color: historico.cor }}>
                    {historico.vezes}
                  </span>
                  <span style={{ fontSize: "15px", color: t.ink2 }}>{historico.vezesTxt}</span>
                  <span style={{ fontSize: "13px", color: t.ink3 }}>{historico.ultimo}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontFamily: "var(--mono)",
                      fontSize: "10.5px",
                      letterSpacing: ".12em",
                      color: t.ink3,
                    }}
                  >
                    <span>HÁ 90 DIAS</span>
                    <span>HOJE</span>
                  </div>
                  <div style={{ position: "relative", height: "34px", borderBottom: `1px solid ${t.line2}` }}>
                    {[0, 25, 50, 75, 100].map((x: number) => (
                      <span key={x} style={{ position: "absolute", left: `${x}%`, bottom: "-1px", width: "1px", height: "8px", background: t.line2 }}></span>
                    ))}
                    {(historico.marcas ?? []).map((m, _i9) => (
                      <Fragment key={_i9}>
                        <span
                          style={{
                            position: "absolute",
                            left: m.x,
                            bottom: "6px",
                            width: "10px",
                            height: "10px",
                            marginLeft: "-5px",
                            borderRadius: "50%",
                            background: historico.cor,
                            boxShadow: `0 0 12px ${historico.cor}`,
                          }}
                        ></span>
                      </Fragment>
                    ))}
                    {!(historico.marcas ?? []).length ? (
                      <span style={{ position: "absolute", left: "0", bottom: "8px", fontSize: "13px", color: t.ink3 }}>
                        nenhum uso registrado nos últimos 90 dias · toque em "Usar hoje" no Início
                      </span>
                    ) : null}
                  </div>
                  <div style={{ display: "flex", gap: "16px", fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: ".12em", color: t.ink3 }}>
                    <span style={{ color: t.ink2 }}>{historico.entrada}</span>
                    <span>{historico.chegou.toUpperCase()}</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-start" }}>
                  <span style={{ padding: "6px 12px", borderRadius: "var(--r-ctl)", border: `1px solid ${t.line2}`, fontSize: "13px" }}>
                    {historico.situacao}
                  </span>
                  {historico.nota ? <span style={{ fontSize: "18px", letterSpacing: ".12em", color: t.amber }}>{historico.nota}</span> : null}
                  {historico.emVoce ? (
                    <span style={{ fontSize: "13px", color: t.ink2 }}>Em você: {historico.emVoce}</span>
                  ) : (
                    <span style={{ fontSize: "13px", color: t.ink3 }}>Ajuste como fica em você em Editar</span>
                  )}
                </div>
              </article>
            ) : null}
            <article
              style={{
                gridColumn: "span 12",
                borderRadius: "var(--r-ed)",
                background: t.tileFeature,
                border: "1px solid var(--ouro-linha)",
                padding: "30px 28px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <h2 style={{ margin: "0", fontFamily: "var(--mono)", fontSize: "12px", fontWeight: "400", letterSpacing: ".14em", color: t.amberTxt }}>
                  SOMMELIER
                </h2>
                <span style={{ fontSize: "13px", color: t.ink3 }}>{cab.pergunte}</span>
              </div>
              {conv ? (
                <>
                  <div
                    style={{
                      alignSelf: "flex-end",
                      maxWidth: "420px",
                      padding: "14px 18px",
                      borderRadius: "20px 20px 4px 20px",
                      background: t.chip2,
                      fontSize: "15px",
                      lineHeight: "1.5",
                    }}
                  >
                    {conv.p}
                  </div>
                  <div
                    style={{
                      maxWidth: "600px",
                      padding: "16px 20px",
                      borderRadius: "20px 20px 20px 4px",
                      background: t.surface,
                      fontSize: "16px",
                      lineHeight: "1.55",
                    }}
                  >
                    {conv.r}
                  </div>
                </>
              ) : null}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {(perguntas ?? []).map((q, _i5) => (
                  <Fragment key={_i5}>
                    <a
                      href={q.href}
                      style={{
                        height: "38px",
                        padding: "0 16px",
                        borderRadius: "var(--r-ctl)",
                        border: `1px solid ${t.line2}`,
                        background: "transparent",
                        color: t.ink,
                        fontFamily: "var(--sans)",
                        fontSize: "13px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        textDecoration: "none",
                      }}
                    >
                      {q.t}
                    </a>
                  </Fragment>
                ))}
              </div>
              <form
                action="/sommelier"
                method="get"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  height: "54px",
                  boxSizing: "border-box",
                  padding: "0 7px 0 20px",
                  borderRadius: "var(--r-ctl)",
                  background: t.bg,
                  border: `1px solid ${t.line2}`,
                }}
              >
                <input type="hidden" name="perfume" defaultValue={cab.id} />
                <input
                  type="text"
                  name="q"
                  placeholder="Escreva ou toque no microfone"
                  aria-label="Pergunta ao sommelier"
                  style={{
                    flexGrow: "1",
                    minWidth: "0",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: t.ink,
                    fontFamily: "var(--sans)",
                    fontSize: "15px",
                  }}
                />
                <a
                  href={cab.voz}
                  aria-label="Falar"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "20px",
                    border: "none",
                    background: t.btn,
                    color: t.onBtn,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <svg viewBox="0 0 24 24" style={{ width: "18px", height: "18px", fill: "none", stroke: "currentColor", strokeWidth: "1.6" }}>
                    <rect x="9" y="3" width="6" height="12" rx="3"></rect>
                    <path d="M5 11 a7 7 0 0 0 14 0 M12 18 V21"></path>
                  </svg>
                </a>
              </form>
            </article>
          </section>
        </main>
      </div>
    </>
  );
}
