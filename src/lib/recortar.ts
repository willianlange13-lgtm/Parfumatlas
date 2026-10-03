import "server-only";
import sharp from "sharp";

/** Apaga o fundo branco ligado à borda da foto e recorta no frasco (usado por /api/frasco). */
/** Fundo = claro e quase sem cor (o JPEG do Fragrantica tem ruído perto do branco). */
const claro = (r: number, g: number, b: number) => Math.min(r, g, b) >= 228 && Math.max(r, g, b) - Math.min(r, g, b) <= 22;

export async function recortar(entrada: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(entrada).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const fundo = new Uint8Array(W * H);
  const fila = new Int32Array(W * H);
  let ini = 0, fim = 0;
  const semente = (x: number, y: number) => {
    const i = y * W + x;
    if (fundo[i]) return;
    const o = i * 4;
    if (!claro(data[o], data[o + 1], data[o + 2])) return;
    fundo[i] = 1; fila[fim++] = i;
  };
  for (let x = 0; x < W; x++) { semente(x, 0); semente(x, H - 1); }
  for (let y = 0; y < H; y++) { semente(0, y); semente(W - 1, y); }
  while (ini < fim) {
    const i = fila[ini++], x = i % W, y = (i / W) | 0;
    if (x > 0) semente(x - 1, y);
    if (x < W - 1) semente(x + 1, y);
    if (y > 0) semente(x, y - 1);
    if (y < H - 1) semente(x, y + 1);
  }
  for (let i = 0; i < W * H; i++) {
    const o = i * 4;
    if (fundo[i]) { data[o + 3] = 0; continue; }
    // borda do frasco: pixel claro encostado no fundo fica meio transparente (contorno suave, sem halo branco)
    const x = i % W, y = (i / W) | 0;
    const vizinhoFundo = (x > 0 && fundo[i - 1]) || (x < W - 1 && fundo[i + 1]) || (y > 0 && fundo[i - W]) || (y < H - 1 && fundo[i + W]);
    if (vizinhoFundo) {
      const m = Math.min(data[o], data[o + 1], data[o + 2]);
      data[o + 3] = Math.max(60, Math.min(255, Math.round((255 - m) * 3)));
    }
  }
  return sharp(data, { raw: { width: W, height: H, channels: 4 } }).trim({ threshold: 1 }).png({ compressionLevel: 9 }).toBuffer();
}

