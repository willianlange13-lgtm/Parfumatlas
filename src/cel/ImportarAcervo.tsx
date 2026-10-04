"use client";
import { useEffect, useState } from "react";
import { Card, Circ, MONO, Rot } from "./kit";

type Relatorio = {
  lidos: number; novos: number; atualizados: number; iguais: number; total: number;
  rejeitados: { linha: number; nome: string; motivo: string }[];
  semTraducao: string[]; semLink: string[]; semNivel: string[];
};

const LIMITE = 4 * 1024 * 1024; // a Vercel recusa corpo acima de ~4,5 MB

/** Importa o lote do ChatGPT (JSON Lines ou lista JSON) para o acervo global. Celular e computador. */
export function ImportarAcervo() {
  const [texto, setTexto] = useState("");
  const [total, setTotal] = useState<number | null>(null);
  const [falta, setFalta] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [rel, setRel] = useState<Relatorio | null>(null);

  useEffect(() => { fetch("/api/acervo/importar").then((r) => r.json()).then((j) => { setTotal(j.total ?? 0); setFalta(j.falta ?? ""); }).catch(() => {}); }, []);

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
