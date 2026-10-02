import "server-only";
import { createServerClient } from "@supabase/ssr";

/** Cliente com a chave de serviço (ignora o RLS). Só para tarefas sem sessão: avisos agendados e Alexa. */
export function clienteServico() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) return null;
  return createServerClient(url, chave, { cookies: { getAll: () => [], setAll: () => {} } });
}
