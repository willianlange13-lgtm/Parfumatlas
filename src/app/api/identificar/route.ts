import { NextResponse, type NextRequest } from "next/server";
import { identificar } from "@/lib/ficha";

export async function POST(request: NextRequest) {
  const b = (await request.json()) as { modo: "foto" | "link" | "nome"; texto?: string; foto?: { mime: string; base64: string } };
  return NextResponse.json(await identificar(b.modo, b.texto, b.foto));
}
