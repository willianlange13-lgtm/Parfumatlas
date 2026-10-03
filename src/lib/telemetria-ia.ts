import "server-only";

export type EventoIA = {
  tarefa: string;
  provedor: "openai" | "gemini";
  modelo: string;
  pesquisaWeb: boolean;
  duracaoMs: number;
  sucesso: boolean;
  status?: number | string | null;
  tentativas?: number;
  maxBuscas?: number | null;
  fallback?: boolean;
  erro?: string | null;
};

/**
 * Telemetria inicial de IA do Atlas.
 *
 * Por enquanto grava JSON estruturado nos logs da Vercel, sem criar tabela nem migration no Supabase.
 * Isso permite medir o padrão real de uso antes de decidir o esquema persistente.
 *
 * Nunca registrar prompt, resposta, chave de API ou dados pessoais aqui.
 */
export function registrarIA(evento: EventoIA) {
  console.info("[atlas:ia]", JSON.stringify({
    ts: new Date().toISOString(),
    ...evento,
    duracaoMs: Math.max(0, Math.round(evento.duracaoMs)),
  }));
}
