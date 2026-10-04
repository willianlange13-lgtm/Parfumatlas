import "server-only";
import sharp from "sharp";

/**
 * Apaga o fundo branco da foto oficial e recorta no frasco (usado por /api/frasco, docs/DECISOES.md §17).
 *
 * 1. Fundo = branco quase puro, espalhado a partir da borda (flood fill), que para nas BORDAS do frasco
 *    (onde a imagem muda de tom). É isso que segura o apagamento em frasco branco ou de vidro claro.
 * 2. Miolo de volta: o que foi apagado entre as partes do frasco, na mesma linha e coluna, volta.
 * 3. Sobras soltas (ruído do JPEG, sombras pequenas) saem; fica o frasco.
 * 4. Contorno suavizado (sem serrilhado) e recorte no frasco.
 * Só se o resultado não fizer sentido (quase nada ou quase tudo) a foto vira cartão.
 */
export async function recortar(entrada: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(entrada).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const N = W * H;
  // cópia levemente desfocada só para decidir o que é fundo (tira o ruído do JPEG)
  const suave = await sharp(entrada).removeAlpha().blur(0.9).raw().toBuffer();
  const claro = new Uint8Array(N), cromo = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const r = suave[i * 3], g = suave[i * 3 + 1], b = suave[i * 3 + 2];
    const mn = Math.min(r, g, b);
    claro[i] = mn; cromo[i] = Math.max(r, g, b) - mn;
  }
  // borda: variação de tom (Sobel) na cópia suave
  const borda = new Uint8Array(N);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    const gx = claro[i - W + 1] + 2 * claro[i + 1] + claro[i + W + 1] - claro[i - W - 1] - 2 * claro[i - 1] - claro[i + W - 1];
    const gy = claro[i + W - 1] + 2 * claro[i + W] + claro[i + W + 1] - claro[i - W - 1] - 2 * claro[i - W] - claro[i - W + 1];
    borda[i] = Math.min(255, Math.round(Math.hypot(gx, gy) / 4));
  }
  const podeSerFundo = (i: number) => claro[i] >= 238 && cromo[i] <= 14 && borda[i] < 6;

  // 1. flood fill da borda da imagem
  const fundo = new Uint8Array(N);
  const fila = new Int32Array(N);
  let ini = 0, fim = 0;
  const semente = (i: number) => { if (!fundo[i] && podeSerFundo(i)) { fundo[i] = 1; fila[fim++] = i; } };
  for (let x = 0; x < W; x++) { semente(x); semente((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { semente(y * W); semente(y * W + W - 1); }
  while (ini < fim) {
    const i = fila[ini++], x = i % W;
    if (x > 0) semente(i - 1);
    if (x < W - 1) semente(i + 1);
    if (i >= W) semente(i - W);
    if (i < N - W) semente(i + W);
  }
  // fundo branco liso que encosta no que já é fundo também sai (a borda do Sobel engorda 1 px)
  for (let k = 0; k < 2; k++) {
    const add: number[] = [];
    for (let i = 0; i < N; i++) {
      if (fundo[i] || claro[i] < 246 || cromo[i] > 10) continue;
      const x = i % W;
      if ((x > 0 && fundo[i - 1]) || (x < W - 1 && fundo[i + 1]) || (i >= W && fundo[i - W]) || (i < N - W && fundo[i + W])) add.push(i);
    }
    add.forEach((i) => (fundo[i] = 1));
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

  // 3. sobras soltas: fica só o que é grande perto da maior peça (o frasco)
  const rot = new Int32Array(N).fill(-1);
  const tam: number[] = [];
  for (let s = 0; s < N; s++) {
    if (fundo[s] || rot[s] >= 0) continue;
    const id = tam.length;
    let n = 0; ini = 0; fim = 0; fila[fim++] = s; rot[s] = id;
    while (ini < fim) {
      const i = fila[ini++], x = i % W; n++;
      const viz = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i >= W ? i - W : -1, i < N - W ? i + W : -1];
      for (const j of viz) if (j >= 0 && !fundo[j] && rot[j] < 0) { rot[j] = id; fila[fim++] = j; }
    }
    tam.push(n);
  }
  const maior = Math.max(0, ...tam);
  let mantidos = 0;
  for (let i = 0; i < N; i++) {
    if (fundo[i]) continue;
    if (tam[rot[i]] < Math.max(60, maior * 0.04)) fundo[i] = 1; else mantidos++;
  }
  if (mantidos < N * 0.03 || mantidos > N * 0.92) return cartao(entrada);

  // 4. contorno suave: a máscara desfocada vira a transparência
  const mascara = Buffer.alloc(N);
  for (let i = 0; i < N; i++) mascara[i] = fundo[i] ? 0 : 255;
  const mSuave = await sharp(mascara, { raw: { width: W, height: H, channels: 1 } }).blur(1.1).extractChannel(0).raw().toBuffer();
  for (let i = 0; i < N; i++) {
    const v = mSuave[i];
    let a = v <= 60 ? 0 : v >= 200 ? 255 : Math.round(((v - 60) / 140) * 255);
    if (fundo[i]) a = Math.min(a, 90); // fora da máscara, só um fio de transição
    data[i * 4 + 3] = a;
  }
  // cor da beirada: o fio de transição (e a borda clareada pelo JPEG) pega a cor de dentro do frasco,
  // senão sobra um contorno branco em volta de frasco escuro
  const dentro = (i: number) => !fundo[i] && !beira(i);
  function beira(i: number) {
    const x = i % W;
    return (x > 0 && fundo[i - 1]) || (x < W - 1 && fundo[i + 1]) || (i >= W && fundo[i - W]) || (i < N - W && fundo[i + W]);
  }
  for (let i = 0; i < N; i++) {
    const a = data[i * 4 + 3];
    if (!a || (!fundo[i] && !beira(i))) continue;
    const x = i % W, y = (i / W) | 0;
    let r = 0, g = 0, b = 0, n = 0;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
      const j = yy * W + xx;
      if (!dentro(j)) continue;
      r += data[j * 4]; g += data[j * 4 + 1]; b += data[j * 4 + 2]; n++;
    }
    if (!n) continue;
    const o = i * 4, mr = r / n, mg = g / n, mb = b / n;
    // só puxa para a cor de dentro quando a beirada é mais clara que o frasco (halo); frasco claro fica como está
    if (Math.min(data[o], data[o + 1], data[o + 2]) > Math.min(mr, mg, mb) + 25) { data[o] = mr; data[o + 1] = mg; data[o + 2] = mb; }
  }
  // recorte no frasco (contado à mão: o trim do sharp se perde com a transparência)
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let i = 0; i < N; i++) if (data[i * 4 + 3] > 8) { const x = i % W, y = (i / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return cartao(entrada);
  return sharp(data, { raw: { width: W, height: H, channels: 4 } }).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }).png({ compressionLevel: 9 }).toBuffer();
}

/** Foto como cartão (último recurso): corta a sobra branca, deixa uma margem e arredonda os cantos. */
async function cartao(entrada: Buffer): Promise<Buffer> {
  const justo = await sharp(entrada).trim({ background: "#ffffff", threshold: 12 }).extend({ top: 16, bottom: 16, left: 16, right: 16, background: "#ffffff" }).png().toBuffer();
  const { width = 0, height = 0 } = await sharp(justo).metadata();
  const r = Math.round(Math.min(width, height) * 0.08);
  const mascara = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${r}" ry="${r}" fill="#fff"/></svg>`);
  return sharp(justo).ensureAlpha().composite([{ input: mascara, blend: "dest-in" }]).png({ compressionLevel: 9 }).toBuffer();
}
