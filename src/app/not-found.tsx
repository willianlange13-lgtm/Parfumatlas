import Link from "next/link";
import "./nao-encontrado.css";

export const metadata = { title: "Página não encontrada" };

/** 404 do Atlas: um frasco que não está no mapa. */
export default function NaoEncontrado() {
  return (
    <div className="ne">
      <span className="ne-n" aria-hidden="true">404</span>
      <h1>Esta página não está<br /><em>no seu mapa.</em></h1>
      <p>O endereço pode ter mudado ou o perfume saiu da coleção.</p>
      <div className="ne-acoes">
        <Link href="/" className="btn">Voltar ao início</Link>
        <Link href="/colecao" className="btn ghost">Ver a coleção</Link>
      </div>
    </div>
  );
}
