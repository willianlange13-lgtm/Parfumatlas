import { connection } from "next/server";
import { supabaseConfigurado } from "@/lib/supabase/server";
import { obterConfig } from "@/lib/config";
import { AlexaAjustes } from "@/cel/AlexaAjustes";

export const metadata = { title: "Alexa" };

export default async function Alexa() {
  await connection();
  const cfg = await obterConfig();
  return <AlexaAjustes cfg={cfg} podeSalvar={supabaseConfigurado()} pronta={Boolean(process.env.ALEXA_SKILL_ID && process.env.ATLAS_USER_ID && process.env.SUPABASE_SERVICE_ROLE_KEY)} />;
}
