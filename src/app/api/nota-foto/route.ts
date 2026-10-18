import { NextResponse, type NextRequest } from "next/server";
import { geminiImagem } from "@/lib/gemini";

/** Descrição do que fotografar: notas abstratas ganham uma matéria concreta e bonita. */
const MATERIA: Record<string, string> = {
  "Almíscar": "textura aveludada e macia de almíscar, pó claro e sedoso",
  "Âmbar cinzento": "pedra de âmbar cinzento (ambergris), resina acinzentada com veios",
  "Âmbar": "resina de âmbar dourada e translúcida",
  "Ambroxan": "cristais translúcidos de ambroxan sobre pedra escura",
  "Ambrofix": "cristais translúcidos de ambroxan sobre pedra escura",
  "Notas marinhas": "respingo de água do mar cristalina sobre pedra molhada",
  "Cashmeran": "lã de cashmere macia dobrada",
  "Couro": "couro curtido marrom, textura nobre",
  "Tabaco": "folhas de tabaco curadas e enroladas",
  "Incenso": "resina de incenso com uma leve fumaça subindo",
  "Oud": "lasca de madeira de oud (agarwood) escura e resinosa",
};

const tema = (n: string) => MATERIA[n] ?? `${n}, a matéria-prima de perfumaria`;

/**
 * Gera a foto da nota com IA, num estilo único e premium (macro, fundo escuro, luz dourada).
 * O CDN da Vercel guarda por 30 dias (immutable). Se a geração falhar, devolve 404 e o app mostra o glifo.
 */
export async function GET(request: NextRequest) {
  const nome = (request.nextUrl.searchParams.get("n") ?? "").trim();
  const falhou = () => new NextResponse(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  if (!nome) return falhou();

  const prompt = `Fotografia macro de ${tema(nome)}. Um único assunto, centralizado, fundo preto quente quase liso, luz dourada suave de contorno, pouca profundidade de campo, still life de perfumaria de luxo, elegante e sóbrio. Sem texto, sem rótulo, sem marca d'água. Quadrado 1:1.`;

  try {
    const img = await geminiImagem(prompt);
    if (!img) return falhou();
    const bytes = Buffer.from(img.base64, "base64");
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": img.mime,
        // gerada uma vez; o CDN serve as próximas por 30 dias
        "Cache-Control": "public, max-age=2592000, s-maxage=2592000, immutable",
      },
    });
  } catch {
    return falhou();
  }
}
