"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, SESSAO_CURTA } from "@/lib/supabase/server";

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  (await cookies()).delete(SESSAO_CURTA);
  redirect("/entrar");
}
