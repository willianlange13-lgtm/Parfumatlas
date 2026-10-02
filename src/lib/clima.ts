import "server-only";
import { obterConfig } from "@/lib/config";

export type Dia = { data: string; rotulo: string; temp: number; min: number; umidade: number; chuva: number; codigo: number; icone: "sol" | "nuvem" | "chuva" | "parcial" };
export type Clima = { cidade: string; agora: { temp: number; umidade: number; codigo: number }; dias: Dia[]; demo: boolean; noite?: { temp: number; hora: string } };

const SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

function icone(codigo: number, chuva: number): Dia["icone"] {
  if (chuva >= 50 || codigo >= 51) return "chuva";
  if (codigo >= 3) return "nuvem";
  if (codigo >= 1) return "parcial";
  return "sol";
}

function demo(cidade: string): Clima {
  const temps = [31, 32, 29, 24, 22, 26, 30];
  const cods = [0, 0, 2, 61, 61, 2, 3];
  const hoje = new Date();
  return {
    cidade, demo: true,
    agora: { temp: 31, umidade: 30, codigo: 0 },
    noite: { temp: 22, hora: "23h" },
    dias: temps.map((t, i) => {
      const d = new Date(hoje.getTime() + i * 864e5);
      return { data: d.toISOString().slice(0, 10), rotulo: i === 0 ? "HOJE" : SEMANA[d.getDay()], temp: t, min: t - 9, umidade: [30, 32, 45, 80, 85, 60, 50][i], chuva: [0, 0, 10, 70, 80, 20, 10][i], codigo: cods[i], icone: icone(cods[i], [0, 0, 10, 70, 80, 20, 10][i]) };
    }),
  };
}

/** Clima de agora e dos próximos 7 dias (Open-Meteo, sem chave). Guarda por 1 hora. */
export async function obterClima(lat?: number, lon?: number, cidade?: string): Promise<Clima> {
  if (lat === undefined || lon === undefined) {
    const c = await obterConfig();
    return obterClimaEm(c.latitude, c.longitude, cidade ?? c.cidade);
  }
  return obterClimaEm(lat, lon, cidade ?? "");
}

async function obterClimaEm(lat: number, lon: number, cidade: string): Promise<Clima> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&hourly=temperature_2m&daily=temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,precipitation_probability_max,weather_code&timezone=America%2FCampo_Grande&forecast_days=7`;
  try {
    const r = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(4000) });
    if (!r.ok) return demo(cidade);
    const j = await r.json();
    const d = j.daily;
    const noiteIdx = (j.hourly?.time as string[] | undefined)?.findIndex((t: string) => t.endsWith("T23:00")) ?? -1;
    return {
      cidade, demo: false,
      agora: { temp: Math.round(j.current.temperature_2m), umidade: Math.round(j.current.relative_humidity_2m), codigo: j.current.weather_code },
      noite: noiteIdx >= 0 ? { temp: Math.round(j.hourly.temperature_2m[noiteIdx]), hora: "23h" } : undefined,
      dias: (d.time as string[]).map((t, i) => ({
        data: t,
        rotulo: i === 0 ? "HOJE" : SEMANA[new Date(t + "T12:00:00").getDay()],
        temp: Math.round(d.temperature_2m_max[i]), min: Math.round(d.temperature_2m_min[i]),
        umidade: Math.round(d.relative_humidity_2m_mean?.[i] ?? 50), chuva: d.precipitation_probability_max?.[i] ?? 0,
        codigo: d.weather_code[i], icone: icone(d.weather_code[i], d.precipitation_probability_max?.[i] ?? 0),
      })),
    };
  } catch {
    return demo(cidade);
  }
}

export const descricaoAr = (umidade: number) => (umidade < 40 ? "ar seco" : umidade > 75 ? "ar úmido" : "");
