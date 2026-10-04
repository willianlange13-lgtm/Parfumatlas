import "server-only";
import sharp from "sharp";

/**
 * Apaga o fundo branco da foto oficial e recorta no frasco (usado por /api/frasco, docs/DECISOES.md §17).
 *
 * 1. Fundo = branco quase puro (o do Fragrantica), espalhado a partir da borda (flood fill). Cinza claro
 *    não conta: é assim que a borda de um frasco branco ou transparente segura o apagamento.
 * 2. Miolo de volta: o que foi apagado ENTRE as partes do frasco, na mesma linha e na mesma coluna,
 *    volta a aparecer. Isso conserta frasco branco em que o apagamento escapou para dentro.
 * 3. Contorno suave e recorte no frasco.
 */
const fundoBranco = (r: number, g: number, b: number) => Math.min(r, g, b) >= 246 && Math.max(r, g, b) - Math.min(r, g, b) <= 10;

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
    if (!fundoBranco(data[o], data[o + 1], data[o + 2])) return;
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

  // 2. miolo de volta: dentro do vão do frasco na linha E na coluna, não é fundo
  const esq = new Int32Array(H).fill(-1), dir = new Int32Array(H).fill(-1), topo = new Int32Array(W).fill(-1), base = new Int32Array(W).fill(-1);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (fundo[y * W + x]) continue;
    if (esq[y] < 0) esq[y] = x;
    dir[y] = x;
    if (topo[x] < 0) topo[x] = y;
    base[x] = y;
  }
  for (let y = 0; y < H; y++) {
    if (esq[y] < 0) continue;
    for (let x = esq[y] + 1; x < dir[y]; x++) {
      const i = y * W + x;
      if (fundo[i] && topo[x] >= 0 && y > topo[x] && y < base[x]) fundo[i] = 0;
    }
  }

  // 3. transparência e contorno suave
  for (let i = 0; i < W * H; i++) {
    const o = i * 4;
    if (fundo[i]) { data[o + 3] = 0; continue; }
    const x = i % W, y = (i / W) | 0;
    const vizinhoFundo = (x > 0 && fundo[i - 1]) || (x < W - 1 && fundo[i + 1]) || (y > 0 && fundo[i - W]) || (y < H - 1 && fundo[i + W]);
    if (vizinhoFundo) {
      const m = Math.min(data[o], data[o + 1], data[o + 2]);
      data[o + 3] = Math.max(110, Math.min(255, Math.round((255 - m) * 6)));
    }
  }
  return sharp(data, { raw: { width: W, height: H, channels: 4 } }).trim({ threshold: 1 }).png({ compressionLevel: 9 }).toBuffer();
}
