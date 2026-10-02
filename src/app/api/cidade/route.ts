import { NextResponse, type NextRequest } from "next/server";

/** Procura cidades pelo nome (Open-Meteo, sem chave). */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ cidades: [] });
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=pt&format=json`, { signal: AbortSignal.timeout(5000) });
    const j = await r.json();
    const cidades = (j.results ?? []).map((c: { name: string; admin1?: string; country?: string; latitude: number; longitude: number }) => ({ nome: c.name, regiao: [c.admin1, c.country].filter(Boolean).join(", "), latitude: c.latitude, longitude: c.longitude }));
    return NextResponse.json({ cidades });
  } catch {
    return NextResponse.json({ cidades: [], erro: "Não consegui buscar cidades agora." });
  }
}
