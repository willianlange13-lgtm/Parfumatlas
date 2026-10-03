import "server-only";

export type EventoIA = {
  tarefa: string;
  provedor: "openai" | "gemini";
  modelo: string;
  pesquisaWeb: boolean;
  duracaoMs: number;
  sucesso: boolean;
  status?: number | string | null;
  buscasReais?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  fallback?: boolean;
  erro?: string | null;
};

/**
 * Telemetria de IA do Atlas.
 * Nunca registrar prompt, resposta, chave de API, e-mail ou outro dado pessoal.
 */
export function registrarIA(evento: EventoIA) {
  console.info("[atlas:ia]", JSON.stringify({
    ts: new Date().toISOString(),
    ...evento,
    duracaoMs: Math.max(0, Math.round(evento.duracaoMs)),
  }));
}
