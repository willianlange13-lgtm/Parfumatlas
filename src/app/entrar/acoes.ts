"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, SESSAO_CURTA } from "@/lib/supabase/server";

export type Resultado = { erro?: string; ok?: string };

/** Entra com e-mail e senha. Sem "manter conectado", a sessão acaba quando o navegador fecha. */
export async function entrar(_: Resultado, form: FormData): Promise<Resultado> {
  const email = String(form.get("email") ?? "").trim();
  const senha = String(form.get("senha") ?? "");
  const manter = form.get("manter") === "on";
  const jar = await cookies();
  if (manter) jar.delete(SESSAO_CURTA);
  else jar.set(SESSAO_CURTA, "1", { path: "/", httpOnly: true, sameSite: "lax", secure: true });
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return { erro: error.message.includes("Invalid login") ? "E-mail ou senha não conferem." : error.message.includes("not confirmed") ? "Confirme o e-mail antes de entrar." : "Não consegui entrar agora. Tente de novo." };
  redirect("/");
}

/** Manda o e-mail para criar ou trocar a senha. */
export async function esqueci(_: Resultado, form: FormData): Promise<Resultado> {
  const email = String(form.get("email") ?? "").trim();
  if (!email) return { erro: "Digite o seu e-mail acima." };
  const origem = (await import("next/headers")).headers;
  const h = await origem();
  const base = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${base}/auth/callback?proximo=/entrar/senha` });
  if (error) return { erro: "Não consegui mandar o e-mail agora. Tente de novo em alguns minutos." };
  return { ok: `Mandei um link para ${email}. Abra e crie a nova senha.` };
}
