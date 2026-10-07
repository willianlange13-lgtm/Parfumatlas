"use client";
import { useEffect, useRef, useState } from "react";
import { Card, Circ, MONO, Rot } from "./kit";

type Relatorio = {
  lidos: number; novos: number; atualizados: number; iguais: number; total: number;
  rejeitados: { linha: number; nome: string; motivo: string }[];
  semTraducao: string[]; semLink: string[]; semNivel: string[];
};

type Situacao = { total: number; semNotas: number; piramideIncompleta: number; semNivel: number; nivelEstimado: number; nivelReal: number; tentadosSemSucesso: number; migracao: boolean };
type Feito = { nome: string; casa: string; notas: boolean; nivel: boolean; erro?: string };

const LIMITE = 4 * 1024 * 1024; // a Vercel recusa corpo acima de ~4,5 MB

/** Importa o lote do ChatGPT (JSON Lines ou lista JSON) para o acervo global. Celular e computador. */
export function ImportarAcervo() {
  const [texto, setTexto] = useState("");
  const [total, setTotal] = useState<number | null>(null);
  const [falta, setFalta] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [rel, setRel] = useState<Relatorio | null>(null);

  const [sit, setSit] = useState<Situacao | null>(null);
  const [rodando, setRodando] = useState<{ meta: number; feitos: Feito[] } | null>(null);
  const [erroIA, setErroIA] = useState("");
  const parar = useRef(false);

  useEffect(() => { fetch("/api/acervo/importar").then((r) => r.json()).then((j) => { setTotal(j.total ?? 0); setFalta(j.falta ?? ""); }).catch(() => {}); }, []);
  useEffect(() => { fetch("/api/acervo/completar").then((r) => r.json()).then((j) => { if (j && typeof j.total === "number") setSit(j); }).catch(() => {}); }, []);

  /** Completa em lotes de 3 (uma chamada cada) até a meta ou até mandar parar. */
  async function completar(meta: number, alvo: "notas" | "niveis" | "tudo") {
    setErroIA(""); parar.current = false;
    const feitos: Feito[] = [];
    setRodando({ meta, feitos });
    while (feitos.length < meta && !parar.current) {
      try {
        const r = await fetch("/api/acervo/completar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantos: Math.min(3, meta - feitos.length), alvo }) });
        const j = await r.json();
        if (!r.ok) { setErroIA(j.erro ?? "Não consegui completar."); break; }
        if (j.situacao) setSit(j.situacao);
        if (!j.feitos?.length) { setErroIA("Não há mais perfumes nessa fila."); break; }
        feitos.push(...j.feitos);
        setRodando({ meta, feitos: [...feitos] });
      } catch {
        setErroIA("A conexão caiu no meio do lote. O que já foi feito ficou salvo; é só continuar.");
        break;
      }
    }
    setRodando((x) => (x ? { ...x, meta: x.feitos.length } : x));
  }
  const ocupadoIA = Boolean(rodando && rodando.feitos.length < rodando.meta);

  async function arquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setTexto(await f.text());
    e.target.value = "";
  }

  async function importar() {
    setErro(""); setRel(null);
    if (new Blob([texto]).size > LIMITE) { setErro("O lote passou de 4 MB. Divida em duas partes e importe uma de cada vez."); return; }
    setOcupado(true);
    try {
      const r = await fetch("/api/acervo/importar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ texto }) });
      const j = await r.json();
      if (!r.ok) setErro(j.erro ?? "Não consegui importar.");
      else { setRel(j); setTotal(j.total); setTexto(""); }
    } catch {
      setErro("Não consegui falar com o servidor.");
    }
    setOcupado(false);
  }

  const lista = (titulo: string, itens: string[], dica: string) => itens.length > 0 && (
    <Card pad={14} gap={8}>
      <Rot>{`${titulo} · ${itens.length}`}</Rot>
      <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{dica}</span>
      <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)" }}>{itens.slice(0, 80).join(" · ")}{itens.length > 80 ? " …" : ""}</span>
    </Card>
  );

  return (
    <div className="c-tela sem-barra" style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="c-topo"><Circ icone="voltar" href="/configuracoes" tamanho={36} rotulo="Voltar" /><span className="c-topo-tit">Acervo de perfumes</span><span style={{ width: 36 }} /></div>
      <span style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--ink-2)" }}>
        {total === null ? "…" : `${total.toLocaleString("pt-BR")} perfumes no acervo.`} Quem está aqui é achado e montado sem pesquisa paga.
      </span>
      {falta && <span style={{ color: "var(--erro)", fontSize: 13.5 }}>{falta}</span>}

      <Card pad={14} gap={10}>
        <Rot>Importar lote do ChatGPT</Rot>
        <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Cole o conteúdo do arquivo .jsonl ou envie o arquivo. Perfume repetido é juntado, sem apagar o que já estava bom.</span>
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={8} placeholder='{"n":"Nome","c":"Casa","u":"https://www.fragrantica.com.br/perfume/...","s":[...],"m":[...],"f":[...],"a":[...],"fx":"Moderada","pj":"Moderada"}'
          style={{ width: "100%", boxSizing: "border-box", borderRadius: 12, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--ink)", padding: 10, fontFamily: MONO, fontSize: 11.5, resize: "vertical" }} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <label className="c-btn sec" style={{ height: 42, borderRadius: "var(--r-ctl)", padding: "0 16px", display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
            Enviar arquivo<input type="file" accept=".jsonl,.json,.txt,application/json,text/plain" hidden onChange={arquivo} />
          </label>
          <button type="button" className="c-btn" style={{ height: 42, borderRadius: "var(--r-ctl)", padding: "0 20px", flexGrow: 1 }} disabled={ocupado || !texto.trim()} onClick={importar}>
            {ocupado ? "Importando…" : texto.trim() ? `Importar ${texto.trim().split(/\n/).length} linha(s)` : "Importar"}
          </button>
        </div>
        {erro && <span style={{ color: "var(--erro)", fontSize: 13.5 }}>{erro}</span>}
      </Card>

      {sit && (
        <Card pad={14} gap={10}>
          <Rot>Situação do acervo</Rot>
          {[
            ["Com pirâmide de notas", sit.total - sit.semNotas, sit.total],
            ["Fixação e projeção pelos votos", sit.nivelReal, sit.total],
          ].map(([rot, v, t]) => (
            <div key={rot as string} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span>{rot}</span><span style={{ fontFamily: MONO, color: "var(--ink-2)" }}>{(v as number).toLocaleString("pt-BR")} de {(t as number).toLocaleString("pt-BR")}</span></div>
              <div style={{ height: 6, borderRadius: 3, background: "var(--line)" }}><div style={{ height: 6, borderRadius: 3, width: `${t ? Math.round(((v as number) / (t as number)) * 100) : 0}%`, background: "var(--ouro)" }} /></div>
            </div>
          ))}
          <span style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-3)" }}>
            {sit.semNotas.toLocaleString("pt-BR")} sem nenhuma nota · {sit.piramideIncompleta.toLocaleString("pt-BR")} com camada vazia · {sit.nivelEstimado.toLocaleString("pt-BR")} com fixação e projeção estimadas · {sit.semNivel.toLocaleString("pt-BR")} sem nível
            {sit.tentadosSemSucesso ? ` · ${sit.tentadosSemSucesso.toLocaleString("pt-BR")} já pesquisados sem achar notas` : ""}
          </span>
          {!sit.migracao && <span style={{ color: "var(--erro)", fontSize: 13 }}>Rode o SQL supabase/migrations/0005_acervo_busca.sql no Supabase para liberar a busca rápida e o completar com IA.</span>}
        </Card>
      )}

      {sit?.migracao && (
        <Card pad={14} gap={10}>
          <Rot>Completar com IA</Rot>
          <span style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-3)" }}>
            A IA abre a página de cada perfume no Fragrantica (ou Parfumo) e preenche só o que está vazio: pirâmide, acordes e fixação e projeção pelos votos.
            Fixação e projeção estimadas são trocadas pelas reais quando a página tem votos. É pesquisa paga: cada perfume usa uma pesquisa com até 3 buscas.
            A fila começa por quem não tem nota nenhuma.
          </span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {([[6, "notas", "6 sem notas"], [30, "notas", "30 sem notas"], [30, "niveis", "30 com nível estimado"]] as const).map(([n, alvo, rot]) => (
              <button key={rot} type="button" className="c-btn sec" style={{ height: 40, borderRadius: "var(--r-ctl)", padding: "0 14px" }} disabled={ocupadoIA} onClick={() => completar(n, alvo)}>Completar {rot}</button>
            ))}
            {ocupadoIA && <button type="button" className="c-btn" style={{ height: 40, borderRadius: "var(--r-ctl)", padding: "0 16px" }} onClick={() => { parar.current = true; }}>Parar depois deste lote</button>}
          </div>
          {rodando && (
            <>
              <span style={{ fontSize: 13.5 }}>
                {ocupadoIA ? `Completando… ${rodando.feitos.length} de ${rodando.meta}` : `Pronto: ${rodando.feitos.length} pesquisados`} · {rodando.feitos.filter((f) => f.notas).length} ganharam notas · {rodando.feitos.filter((f) => f.nivel).length} ganharam fixação e projeção reais
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 260, overflowY: "auto" }}>
                {[...rodando.feitos].reverse().map((f, i) => (
                  <span key={i} style={{ fontSize: 12.5, color: f.notas || f.nivel ? "var(--ink-2)" : "var(--ink-3)" }}>
                    {f.notas || f.nivel ? "✓" : "–"} {f.nome} <span style={{ fontFamily: MONO, fontSize: 10.5, color: "var(--ink-3)" }}>{f.casa.toUpperCase()}</span>
                    {f.notas || f.nivel ? ` · ${[f.notas && "notas", f.nivel && "fixação e projeção"].filter(Boolean).join(" e ")}` : ` · ${f.erro ?? "nada novo"}`}
                  </span>
                ))}
              </div>
            </>
          )}
          {erroIA && <span style={{ color: "var(--erro)", fontSize: 13.5 }}>{erroIA}</span>}
        </Card>
      )}

      {rel && (
        <>
          <Card pad={14} gap={6}>
            <Rot>Resultado</Rot>
            <span style={{ fontSize: 14 }}>{rel.lidos} lidos · <b>{rel.novos} novos</b> · {rel.atualizados} atualizados · {rel.iguais} já estavam iguais · {rel.rejeitados.length} rejeitados</span>
          </Card>
          {lista("Rejeitados", rel.rejeitados.map((r) => `linha ${r.linha}${r.nome ? ` (${r.nome})` : ""}: ${r.motivo}`), "Não entraram. Corrija no ChatGPT e importe de novo só esses.")}
          {lista("Sem link do Fragrantica", rel.semLink, "Entraram, mas sem foto: o link faltou ou não tinha o nome do perfume.")}
          {lista("Sem fixação ou projeção", rel.semNivel, "Entraram sem o nível mais votado.")}
          {lista("Notas sem tradução", rel.semTraducao, "Ficaram como vieram. Na ficha, a tradução automática (barata) cuida delas.")}
        </>
      )}
    </div>
  );
}
