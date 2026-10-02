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

/** Pede permissão, inscreve o aparelho e guarda a inscrição no banco. */
export async function ativarAvisos(): Promise<"sim" | "nao" | "sem"> {
  if (!suporta() || !CHAVE) return "sem";
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return "nao";
  const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes(CHAVE) }));
  const r = await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
  return r.ok ? "sim" : "nao";
}
