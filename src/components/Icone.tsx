const P: Record<string, string> = {
  inicio: "M4 11 L12 4 L20 11 V20 H14 V14 H10 V20 H4 Z",
  colecao: "M9 3h6v3H9z M8 8h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z M11 6v2 M13 6v2",
  descobrir: "M12 3a9 9 0 1 0 .01 0 M15.5 8.5 L13.5 13.5 L8.5 15.5 L10.5 10.5 Z",
  chat: "M4 5h16v11H10l-6 4z M9 10.5h.01 M12 10.5h.01 M15 10.5h.01",
  mais: "M12 5v14 M5 12h14",
  sino: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4z M10 20a2 2 0 0 0 4 0",
  busca: "M11 4a7 7 0 1 0 .01 0 M20 20 L16 16",
  mic: "M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z M5 11a7 7 0 0 0 14 0 M12 18v3",
  voltar: "M15 5 L8 12 L15 19",
  camera: "M4 8h4l2-3h4l2 3h4v11H4z M12 10a3.5 3.5 0 1 0 .01 0",
  link: "M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1 1 M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1-1",
  texto: "M5 7V5h14v2 M12 5v14 M9 19h6",
  filtro: "M4 6h16 M7 12h10 M10 18h4",
  sol: "M12 8a4 4 0 1 0 .01 0 M12 2v2 M12 20v2 M2 12h2 M20 12h2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4",
  check: "M5 12l5 5 9-10",
  seta: "M5 12h14 M13 6l6 6-6 6",
  dna: "M7 3c0 6 10 6 10 12s-10 6-10 6 M17 3c0 6-10 6-10 12 M8 7h8 M8 17h8",
  estrela: "M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.2 6.1 20.5l1.3-6.6L2.5 9.4l6.6-.8z",
  sair: "M15 4h4v16h-4 M10 8l-4 4 4 4 M6 12h10",
  email: "M3 6h18v12H3z M3 7l9 6 9-6",
};

export type NomeIcone = keyof typeof P;

export function Icone({ nome, tamanho = 20, className = "icone", traco }: { nome: string; tamanho?: number; className?: string; traco?: number }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={{ width: tamanho, height: tamanho, strokeWidth: traco }} aria-hidden="true">
      <path d={P[nome] ?? ""} />
    </svg>
  );
}
