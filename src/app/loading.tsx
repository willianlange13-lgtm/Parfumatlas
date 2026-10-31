/**
 * Transição instantânea entre telas: sem este arquivo, o App Router segura a tela
 * atual até o servidor montar a próxima (sensação de "cliquei e travou"). Com ele,
 * a troca é imediata e aparece este loading enquanto a tela carrega.
 */
export default function Loading() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }} aria-busy="true">
      <svg width="36" height="36" viewBox="0 0 24 24" role="status" aria-label="Carregando">
        <circle cx="12" cy="12" r="9" fill="none" stroke="var(--line-2, rgba(255,255,255,.12))" strokeWidth="2.5" />
        <path d="M12 3 a9 9 0 0 1 9 9" fill="none" stroke="var(--acento, #d8b878)" strokeWidth="2.5" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
        </path>
      </svg>
    </div>
  );
}
