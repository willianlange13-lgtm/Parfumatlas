import { Icone } from "./Icone";

export function EmConstrucao({ rotulo, titulo, etapa, itens }: { rotulo: string; titulo: string; etapa: number; itens: string[] }) {
  return (
    <div className="pagina">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <p className="rotulo">{rotulo}</p>
        <h1 className="titulo-1">{titulo}</h1>
      </div>
      <section className="card destaque" style={{ maxWidth: 720 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p className="rotulo">Em construção</p>
          <span className="selo ouro">Etapa {etapa}</span>
        </div>
        <p className="texto-2" style={{ margin: 0 }}>Esta tela entra na etapa {etapa}. O que vai ter aqui:</p>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
          {itens.map((i) => (
            <li key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ color: "var(--ouro)" }}><Icone nome="check" tamanho={16} traco={2} /></span>
              {i}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
