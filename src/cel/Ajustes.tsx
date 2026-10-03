"use client";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Icone } from "@/components/Icone";
import type { Config } from "@/lib/config";
import { Card, Circ, MONO, OURO, Rot } from "./kit";
import { ativarAvisos, avisosAtivos } from "./push";

type Props = { cfg: Config; classe: string; total: number; pcts: number[]; podeSalvar: boolean; sair: () => void };

const TIPOS: [string, string][] = [["casas", "Casas da coleção"], ["nicho", "Nicho"], ["designer", "Designer"], ["arabe", "Árabe"]];

function Tog({ on, mudar, rotulo }: { on: boolean; mudar: (v: boolean) => void; rotulo: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={rotulo} className={`c-tog ${on ? "on" : ""}`} onClick={() => mudar(!on)} />;
}

function Item({ ic, titulo, sub, dir, href, onClick, borda = true }: { ic: string; titulo: string; sub?: string; dir?: ReactNode; href?: string; onClick?: () => void; borda?: boolean }) {
  const corpo = (
    <>
      <span style={{ width: 32, height: 32, borderRadius: 10, background: "var(--chip)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icone nome={ic} tamanho={16} /></span>
      <span style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 1, minWidth: 0, textAlign: "left" }}>
        <span style={{ fontSize: 14.5 }}>{titulo}</span>
        {sub ? <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{sub}</span> : null}
      </span>
      {dir}
    </>
  );
  const st: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderWidth: borda ? "1px 0 0" : 0, borderStyle: "solid", borderColor: "var(--line)", background: "none", color: "var(--ink)", width: "100%" };
  if (href) return <Link href={href} style={st}>{corpo}</Link>;
  if (onClick) return <button type="button" onClick={onClick} style={st}>{corpo}</button>;
  return <div style={st}>{corpo}</div>;
}

const Seta = ({ txt }: { txt?: string }) => <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-2)", whiteSpace: "nowrap" }}>{txt}<Icone nome="seta" tamanho={14} /></span>;

export function Ajustes({ cfg, classe, total, pcts, podeSalvar, sair }: Props) {
  const [c, setC] = useState(cfg);
  const [aviso, setAviso] = useState("");
  const [cidadeAberta, setCidadeAberta] = useState(false);
  const [busca, setBusca] = useState("");
  const [cidades, setCidades] = useState<{ nome: string; regiao: string; latitude: number; longitude: number }[]>([]);
  const [push, setPush] = useState<"" | "sim" | "nao" | "sem">("");
  const [instalado, setInstalado] = useState(false);

  useEffect(() => {
    avisosAtivos().then((x) => {
      setPush(x);
      setInstalado(window.matchMedia("(display-mode: standalone)").matches);
    });
  }, []);
  useEffect(() => {
    if (busca.trim().length < 2) return;
    const t = setTimeout(async () => { const r = await fetch(`/api/cidade?q=${encodeURIComponent(busca)}`); setCidades((await r.json()).cidades ?? []); }, 350);
    return () => clearTimeout(t);
  }, [busca]);

  async function salvar(parte: Partial<Config>) {
    setC((x) => ({ ...x, ...parte }));
    if (!podeSalvar) { setAviso("Modo de demonstração: ligue o Supabase para guardar as mudanças."); return; }
    const r = await fetch("/api/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parte) });
    setAviso(r.ok ? "" : (await r.json()).erro ?? "Não consegui salvar.");
  }
  async function notif(parte: Partial<Config>) {
    const liga = Object.values(parte).some((v) => v === true);
    if (liga && push !== "sim") {
      const ok = await ativarAvisos();
      setPush(ok);
      if (ok !== "sim") { setAviso(ok === "sem" ? "Este navegador não recebe avisos. No iPhone, instale o app na tela inicial primeiro." : "Os avisos foram bloqueados. Libere nas configurações do celular."); }
    }
    salvar(parte);
  }
  function localizar(v: boolean) {
    if (!v) { salvar({ usarLocalizacao: false }); return; }
    navigator.geolocation?.getCurrentPosition(
      (p) => salvar({ usarLocalizacao: true, latitude: Math.round(p.coords.latitude * 1e4) / 1e4, longitude: Math.round(p.coords.longitude * 1e4) / 1e4 }),
      () => setAviso("Não consegui a localização. Confira a permissão do navegador."),
    );
  }
  const alertas = pcts.filter((p) => p >= c.alertaAfinidade).length;

  return (
    <div className="c-tela sem-barra" style={{ maxWidth: 620, margin: "0 auto" }}>
      <div className="c-topo"><Circ icone="voltar" href="/" tamanho={36} rotulo="Voltar" /><span className="c-topo-tit">Configurações</span><span style={{ width: 36 }} /></div>
      <Card fundo="destaque" pad={14}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 52, height: 52, borderRadius: 26, background: "var(--btn)", color: "var(--on-btn)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 17, flexShrink: 0 }}>{c.nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase()}</span>
          <span style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 17, fontWeight: 500 }}>{c.nome}</span>
            <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{classe} · {total} frascos{c.email ? ` · ${c.email}` : ""}</span>
          </span>
        </div>
      </Card>
      {aviso && <div style={{ fontSize: 13, color: OURO, lineHeight: 1.45 }}>{aviso}</div>}

      <Rot>Clima</Rot>
      <Card pad="4px 14px" gap={0}>
        <Item ic="sol" titulo="Cidade" sub="usada no perfume do dia e na semana" borda={false} onClick={() => setCidadeAberta(!cidadeAberta)} dir={<Seta txt={c.usarLocalizacao && cfg.cidade === c.cidade ? c.cidade : c.cidade} />} />
        {cidadeAberta && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingBottom: 10 }}>
            <label className="c-campo" style={{ height: 42 }}><Icone nome="busca" tamanho={16} /><input autoFocus value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome da cidade" /></label>
            {cidades.map((x) => (
              <button key={`${x.latitude}${x.longitude}`} type="button" onClick={() => { salvar({ cidade: x.nome, latitude: x.latitude, longitude: x.longitude, usarLocalizacao: false }); setCidadeAberta(false); setBusca(""); setCidades([]); }} style={{ textAlign: "left", padding: "9px 4px", background: "none", border: "none", color: "var(--ink)", fontSize: 14 }}>
                {x.nome} <span style={{ color: "var(--ink-3)", fontSize: 12 }}>{x.regiao}</span>
              </button>
            ))}
          </div>
        )}
        <Item ic="descobrir" titulo="Usar a localização" sub="troca sozinho quando você viaja" dir={<Tog on={c.usarLocalizacao} mudar={localizar} rotulo="Usar a localização" />} />
      </Card>

      <Rot>Notificações</Rot>
      <Card pad="4px 14px" gap={0}>
        <Item ic="sino" titulo="Lançamentos" sub="quando a afinidade passar do limite" borda={false} dir={<Tog on={c.notifLancamentos} mudar={(v) => notif({ notifLancamentos: v })} rotulo="Avisar lançamentos" />} />
        <Item ic="estrela" titulo="Limite de afinidade" href="#alerta" dir={<Seta txt={`${c.alertaAfinidade}%`} />} />
        <Item ic="sol" titulo="Perfume do dia" sub={`todo dia às ${c.notifDiaHora.replace(":", "h")}`} dir={<Tog on={c.notifDia} mudar={(v) => notif({ notifDia: v })} rotulo="Perfume do dia" />} />
        <Item ic="colecao" titulo="Esquecidos" sub="quando passar de 30 dias parado" dir={<Tog on={c.notifEsquecidos} mudar={(v) => notif({ notifEsquecidos: v })} rotulo="Esquecidos" />} />
        {push === "nao" && typeof Notification !== "undefined" && Notification.permission === "denied" ? <div style={{ fontSize: 12, color: "var(--ink-3)", padding: "0 0 10px" }}>Avisos bloqueados neste aparelho.</div> : null}
      </Card>

      <Rot>Voz</Rot>
      <Card pad="4px 14px" gap={0}>
        <Item ic="mic" titulo="Alexa" sub={c.alexaLigada ? "conectada · “Alexa, abre o Parfum Atlas”" : "desligada"} borda={false} href="/configuracoes/alexa" dir={<Seta txt={c.alexaLigada ? "Ligada" : "Configurar"} />} />
      </Card>

      <div id="alerta" style={{ scrollMarginTop: 70 }}><Rot>Alerta de lançamentos</Rot></div>
      <Card pad={16} gap={10}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}><span style={{ fontSize: 15 }}>Avisar acima de</span><span style={{ fontSize: 22, color: OURO }}>{c.alertaAfinidade}%</span></div>
        <input type="range" min={50} max={95} step={5} value={c.alertaAfinidade} onChange={(e) => setC((x) => ({ ...x, alertaAfinidade: Number(e.target.value) }))} onPointerUp={() => salvar({ alertaAfinidade: c.alertaAfinidade })} onKeyUp={() => salvar({ alertaAfinidade: c.alertaAfinidade })} aria-label="Limite de afinidade" style={{ width: "100%", accentColor: OURO }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 9.5, color: "var(--ink-3)" }}><span>50%</span><span>75%</span><span>95%</span></div>
        <span style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.45 }}>Com {c.alertaAfinidade}%, {alertas === 0 ? "nenhum lançamento atual passaria do limite" : `${alertas} ${alertas === 1 ? "lançamento atual passaria" : "lançamentos atuais passariam"} do limite`}.</span>
      </Card>
      <Rot>Avisar sobre</Rot>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {TIPOS.map(([k, nome]) => {
          const on = c.alertaTipos.includes(k);
          return <button key={k} type="button" className={`c-pill ${on ? "on" : ""}`} style={{ height: 34, borderRadius: 17 }} onClick={() => salvar({ alertaTipos: on ? c.alertaTipos.filter((x) => x !== k) : [...c.alertaTipos, k] })}>{nome}</button>;
        })}
      </div>

      <Rot>Coleção</Rot>
      <Card pad="4px 14px" gap={0}>
        <Item ic="link" titulo="Fontes da ficha" sub="Fragrantica, Parfumo e site da marca" borda={false} dir={<Seta txt="3" />} />
        <Item ic="colecao" titulo="Acervo de perfumes" sub="importar o lote do ChatGPT" href="/configuracoes/acervo" dir={<Seta />} />
        <Item ic="seta" titulo="Exportar coleção" sub="planilha (abre no Excel)" href="/api/exportar" dir={<Seta />} />
        <Item ic="check" titulo="Cópia de segurança" sub={podeSalvar ? "o banco guarda cópias todo dia" : "liga junto com o banco"} dir={<span style={{ fontSize: 13, color: "var(--ink-2)" }}>Automática</span>} />
      </Card>

      <Rot>Conta</Rot>
      <Card pad="4px 14px" gap={0}>
        <Item ic="colecao" titulo="Instalar no celular" sub={instalado ? "já instalado na tela inicial" : "Safari: Compartilhar › Adicionar à Tela de Início"} borda={false} dir={instalado ? <Icone nome="check" tamanho={16} /> : undefined} />
        {podeSalvar && <Item ic="sair" titulo="Sair" onClick={sair} />}
      </Card>
    </div>
  );
}
