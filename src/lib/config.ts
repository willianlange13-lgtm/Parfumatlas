import "server-only";
import { cache } from "react";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";

export type Config = {
  nome: string; email: string; cidade: string; latitude: number; longitude: number; usarLocalizacao: boolean;
  alertaAfinidade: number; alertaTipos: string[];
  notifLancamentos: boolean; notifDia: boolean; notifDiaHora: string; notifEsquecidos: boolean;
  vozRespostas: boolean; alexaLigada: boolean;
  demo: boolean;
};

export const PADRAO: Config = {
  nome: "Willian Lange Gomes", email: "", cidade: "Campo Grande", latitude: -20.4697, longitude: -54.6201, usarLocalizacao: true,
  alertaAfinidade: 80, alertaTipos: ["casas", "nicho", "arabe"], notifLancamentos: true, notifDia: true, notifDiaHora: "07:30", notifEsquecidos: false, vozRespostas: true, alexaLigada: false, demo: true,
};

/** Configurações do usuário (ou o padrão, sem banco). */
export const obterConfig = cache(async (): Promise<Config> => {
  if (!supabaseConfigurado()) return PADRAO;
  try {
    const supabase = await createClient();
    const { data: cl } = await supabase.auth.getClaims();
    const email = (cl?.claims?.email as string) ?? "";
    const { data } = await supabase.from("configuracoes").select("*").maybeSingle();
    if (!data) return { ...PADRAO, email, demo: false };
    return {
      nome: data.nome ?? PADRAO.nome, email, cidade: data.cidade ?? PADRAO.cidade, latitude: Number(data.latitude ?? PADRAO.latitude), longitude: Number(data.longitude ?? PADRAO.longitude),
      usarLocalizacao: data.usar_localizacao ?? true, alertaAfinidade: data.alerta_afinidade ?? 80, alertaTipos: data.alerta_tipos ?? PADRAO.alertaTipos,
      notifLancamentos: data.notif_lancamentos ?? true, notifDia: data.notif_dia ?? true, notifDiaHora: String(data.notif_dia_hora ?? "07:30").slice(0, 5), notifEsquecidos: data.notif_esquecidos ?? false,
      vozRespostas: data.voz_respostas ?? true, alexaLigada: data.alexa_ligada ?? false,
      demo: false,
    };
  } catch {
    return PADRAO;
  }
});

export const iniciais = (nome: string) => nome.split(" ").filter(Boolean).map((p) => p[0]).filter((_, i, a) => i === 0 || i === a.length - 1).join("").toUpperCase();

/** Nomes das colunas no banco para cada campo editável. */
export const COLUNA: Record<string, string> = {
  nome: "nome", cidade: "cidade", latitude: "latitude", longitude: "longitude", usarLocalizacao: "usar_localizacao",
  alertaAfinidade: "alerta_afinidade", alertaTipos: "alerta_tipos", notifLancamentos: "notif_lancamentos", notifDia: "notif_dia",
  notifDiaHora: "notif_dia_hora", notifEsquecidos: "notif_esquecidos", vozRespostas: "voz_respostas", alexaLigada: "alexa_ligada",
};
