import { ViewTransition } from "react";

/** Cada navegação troca a página com uma passagem curta: a antiga sai rápido, a nova sobe com foco. */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="pagina-entra" exit="pagina-sai" default="none">
      {children}
    </ViewTransition>
  );
}
