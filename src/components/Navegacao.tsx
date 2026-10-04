"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";
import { Icone } from "./Icone";
import { Marca } from "./Logo";

const MENU = [
  { href: "/", nome: "Início" },
  { href: "/colecao", nome: "Coleção" },
  { href: "/descobrir", nome: "Descobrir" },
  { href: "/dna", nome: "DNA olfativo" },
  { href: "/sommelier", nome: "Sommelier" },
  { href: "/novidades", nome: "Lançamentos" },
];

const ABAS = [
  { href: "/", nome: "Início", icone: "inicio" },
  { href: "/colecao", nome: "Coleção", icone: "colecao" },
  { href: "/adicionar", nome: "", icone: "mais" },
  { href: "/buscar", nome: "Buscar", icone: "busca" },
  { href: "/novidades", nome: "Novidades", icone: "sino" },
];

const SEM_NAVEGACAO = ["/entrar", "/auth"];
/** No celular, estas telas têm topo próprio e não mostram a barra de abas. */
const SEM_BARRA = ["/adicionar", "/sommelier", "/configuracoes", "/editar", "/comparar", "/blind", "/curiosidade", "/buscar/resultado"];

function ativo(caminho: string, href: string) {
  return href === "/" ? caminho === "/" : caminho.startsWith(href);
}

export function Navegacao({ iniciais = "WL" }: { iniciais?: string }) {
  const caminho = usePathname();
  const router = useRouter();
  const segurar = useRef<ReturnType<typeof setTimeout> | null>(null);
  const segurou = useRef(false);
  if (SEM_NAVEGACAO.some((p) => caminho.startsWith(p))) return null;
  return (
    <>
      <header className="topo">
        {/* voltar em todas as páginas menos o Início (computador; no celular cada tela tem o seu) */}
        {caminho !== "/" && (
          <button type="button" className="btn-redondo" aria-label="Voltar" title="Voltar" onClick={() => (history.length > 1 ? router.back() : router.push("/"))}>
            <Icone nome="voltar" />
          </button>
        )}
        <Marca />
        <nav className="menu" aria-label="Menu principal">
          {MENU.map((m) => (
            <Link key={m.href} href={m.href} className={ativo(caminho, m.href) ? "ativo" : ""}>
              {m.nome}
            </Link>
          ))}
        </nav>
        <div className="acoes">
          <Link href="/buscar" className="btn-redondo" aria-label="Buscar"><Icone nome="busca" /></Link>
          <Link href="/sommelier" className="btn-redondo" aria-label="Falar com o sommelier"><Icone nome="mic" /></Link>
          <Link href="/adicionar?modo=link" className="btn" style={{ height: 44, padding: "0 18px 0 14px" }}><Icone nome="mais" tamanho={18} traco={2.2} />Adicionar perfume</Link>
          <Link href="/configuracoes" className="btn-redondo" aria-label="Configurações" style={{ fontSize: 13, fontWeight: 600 }}>{iniciais}</Link>
        </div>
      </header>

      <header className={`topo-app ${caminho === "/" ? "" : "so-inicio-esconde"}`}>
        <Marca tamanho={38} />
        <span style={{ flex: 1, minWidth: 0 }} />
        <Link href="/sommelier" className="pill" style={{ paddingLeft: 5, border: "1px solid var(--line-2)", background: "var(--surface)", color: "var(--ink)" }}>
          <span className="btn-redondo claro" style={{ width: 28, height: 28 }}><Icone nome="mic" tamanho={14} /></span>
          Sommelier
        </Link>
        <Link href="/configuracoes" className="btn-redondo" style={{ width: 40, height: 40, fontSize: 13, fontWeight: 600, border: "1px solid var(--line-2)", background: "var(--tile)" }} aria-label="Configurações">{iniciais}</Link>
      </header>

      <nav className="barra-app" aria-label="Abas" style={SEM_BARRA.some((p) => caminho.startsWith(p)) ? { display: "none" } : undefined}>
        {ABAS.map((a) =>
          a.icone === "mais" ? (
            <button
              key={a.href}
              type="button"
              className="mais"
              aria-label="Adicionar perfume: toque para a câmera, segure para falar"
              onPointerDown={() => { segurou.current = false; segurar.current = setTimeout(() => { segurou.current = true; router.push("/adicionar?modo=voz"); }, 450); }}
              onPointerUp={() => { if (segurar.current) clearTimeout(segurar.current); if (!segurou.current) router.push("/adicionar?modo=foto"); }}
              onPointerLeave={() => { if (segurar.current) clearTimeout(segurar.current); }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <Icone nome="mais" tamanho={26} traco={2.2} />
            </button>
          ) : (
            <Link key={a.href} href={a.href} className={ativo(caminho, a.href) ? "ativo" : ""}>
              <Icone nome={a.icone} tamanho={22} />
              {a.nome}
            </Link>
          ),
        )}
      </nav>
    </>
  );
}
