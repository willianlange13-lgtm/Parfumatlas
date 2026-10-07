import "server-only";
import { X509Certificate, verify } from "node:crypto";
import { rootCertificates } from "node:tls";

/**
 * Confere se o pedido veio mesmo da Alexa (exigência da Amazon para skills hospedadas fora da AWS):
 * a URL da cadeia de certificados é da Amazon, o certificado é válido, assinado por uma raiz confiável
 * e cobre echo-api.amazon.com, e a assinatura bate com o corpo exato do pedido.
 */
const cache = new Map<string, { certs: X509Certificate[]; ate: number }>();
const RAIZES = rootCertificates.map((pem) => new X509Certificate(pem));

function urlValida(u: string) {
  try {
    const x = new URL(u);
    return x.protocol === "https:" && x.hostname.toLowerCase() === "s3.amazonaws.com" && (x.port === "" || x.port === "443") && x.pathname.startsWith("/echo.api/") && !x.pathname.includes("/../");
  } catch {
    return false;
  }
}

async function cadeia(url: string) {
  const c = cache.get(url);
  if (c && c.ate > Date.now()) return c.certs;
  const r = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(4000) });
  if (!r.ok) throw new Error("cadeia indisponível");
  const pem = await r.text();
  const certs = (pem.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) ?? []).map((p) => new X509Certificate(p));
  if (!certs.length) throw new Error("cadeia vazia");
  cache.set(url, { certs, ate: Date.now() + 60 * 60 * 1000 });
  return certs;
}

function cadeiaConfiavel(certs: X509Certificate[]) {
  const agora = Date.now();
  const folha = certs[0];
  if (agora < Date.parse(folha.validFrom) || agora > Date.parse(folha.validTo)) return false;
  if (!(certs[0].subjectAltName ?? "").split(",").some((s) => s.trim() === "DNS:echo-api.amazon.com")) return false;
  // segue a cadeia elo por elo até chegar num certificado assinado por uma raiz confiável
  // (a Amazon manda também uma assinatura cruzada antiga, que já não está entre as raízes)
  const naRaiz = (c: X509Certificate) => RAIZES.some((r) => r.fingerprint256 === c.fingerprint256 || (c.checkIssued(r) && c.verify(r.publicKey)));
  for (let i = 0; i < certs.length; i++) {
    if (naRaiz(certs[i])) return true;
    if (i === certs.length - 1 || !certs[i].checkIssued(certs[i + 1]) || !certs[i].verify(certs[i + 1].publicKey)) return false;
  }
  return false;
}

export async function pedidoDaAlexa(corpo: string, cabecalhos: Headers) {
  const url = cabecalhos.get("signaturecertchainurl");
  const sig256 = cabecalhos.get("signature-256");
  const sig1 = cabecalhos.get("signature");
  if (!url || !urlValida(url) || (!sig256 && !sig1)) return false;
  try {
    const certs = await cadeia(url);
    if (!cadeiaConfiavel(certs)) return false;
    const chave = certs[0].publicKey;
    return sig256 ? verify("sha256", Buffer.from(corpo), chave, Buffer.from(sig256, "base64")) : verify("sha1", Buffer.from(corpo), chave, Buffer.from(sig1!, "base64"));
  } catch {
    return false;
  }
}
