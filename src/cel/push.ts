"use client";

const CHAVE = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function bytes(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const b = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...b].map((c) => c.charCodeAt(0)));
}

const suporta = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

/** "sim" se este aparelho já recebe avisos, "nao" se bloqueou ou ainda não ativou, "sem" se o navegador não aceita. */
export async function avisosAtivos(): Promise<"sim" | "nao" | "sem"> {
  if (!suporta() || !CHAVE) return "sem";
  if (Notification.permission !== "granted") return "nao";
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  const sub = await reg?.pushManager.getSubscription();
  return sub ? "sim" : "nao";
}

/** Motivo da última falha ao inscrever (mostrado em Ajustes). */
export let erroAvisos = "";

/**
 * Pede permissão, inscreve o aparelho e guarda a inscrição no banco.
 * Se a inscrição antiga foi feita com outra chave (ou sem chave), refaz.
 */
export async function ativarAvisos(): Promise<"sim" | "nao" | "sem"> {
  erroAvisos = "";
  if (!suporta()) { erroAvisos = "Este navegador não recebe avisos. No iPhone, instale o app na tela inicial primeiro."; return "sem"; }
  if (!CHAVE) { erroAvisos = "Falta a chave NEXT_PUBLIC_VAPID_PUBLIC_KEY na Vercel (depois de pôr, faça Redeploy)."; return "sem"; }
  const perm = await Notification.requestPermission();
  if (perm !== "granted") { erroAvisos = "As notificações estão bloqueadas. Libere nas configurações do celular."; return "nao"; }
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
    await navigator.serviceWorker.ready;
    const chave = bytes(CHAVE);
    let sub = await reg.pushManager.getSubscription();
    const atual = sub?.options.applicationServerKey;
    if (sub && (!atual || new Uint8Array(atual).join() !== chave.join())) { await sub.unsubscribe(); sub = null; }
    sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chave });
    const r = await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
    if (!r.ok) { erroAvisos = (await r.json().catch(() => ({}))).erro ?? "Não consegui guardar a inscrição."; return "nao"; }
    return "sim";
  } catch (e) {
    erroAvisos = `Não consegui inscrever este aparelho: ${e instanceof Error ? e.message : "erro"}`;
    return "nao";
  }
}
