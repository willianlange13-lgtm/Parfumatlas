import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SESSAO_CURTA, semValidade } from "./sessao";

export { SESSAO_CURTA } from "./sessao";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(lista) {
          try {
            const curta = cookieStore.get(SESSAO_CURTA)?.value === "1";
            lista.forEach(({ name, value, options }) => cookieStore.set(name, value, curta ? semValidade(options) : options));
          } catch {
            // Chamado de um Server Component: o proxy renova a sessão.
          }
        },
      },
    },
  );
}

export const supabaseConfigurado = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
