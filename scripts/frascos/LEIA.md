# Frascos recortados por IA (docs/DECISOES.md §32)

Roda fora da Vercel, uma vez por catálogo. Requer `pip install "rembg[cpu]" pymupdf scipy`.

1. `python3 extrair.py catalogo.pdf` → `img/<código>.png` e `catalogo.json` (marca, nome, foto de cada cartão).
2. `lados.txt`: para cada foto (na ordem de `catalogo.json`, só as que têm foto), onde está o frasco em relação à caixa:
   `L` esquerda, `R` direita, `C` entre duas caixas, `S` só o frasco (mantém tudo), `K` kit (fica de fora do casamento).
   Junte ao JSON (campo `lado`) antes do passo 3.
3. `python3 lote.py 0 1` → `saida/<código>.webp`: a IA (isnet) separa o primeiro plano do fundo e o SAM, guiado
   por três pontos no frasco e um ponto negativo na caixa, fica só com o frasco. Contorno suavizado e recorte justo.
4. Copie `saida/*.webp` para `public/frascos/` e regenere `src/data/frascos-catalogo.json`.
