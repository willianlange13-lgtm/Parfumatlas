import pymupdf as fitz, json, re, sys, os
pdf = fitz.open(sys.argv[1]); out=[]; os.makedirs("img", exist_ok=True)
for pn, pg in enumerate(pdf):
    blocks = pg.get_text("blocks"); txt = pg.get_text()
    marca = re.search(r"MARCA:\s*(.+)", txt).group(1).strip()
    imgs = [i for i in pg.get_image_info(xrefs=True) if i["xref"] and i["bbox"][1] > 80]
    for b in blocks:
        m = re.search(r"CÓD\.\s*(\d+)", b[4])
        if not m: continue
        cod = m.group(1); x0,y0,x1,y1 = b[:4]
        cx0, cx1 = x0 - 20, x0 + 190  # coluna do cartão
        nome = " ".join(w[4].replace("\n"," ").strip() for w in blocks if cx0 <= w[0] < cx1 and y0-45 < w[1] < y0-2 and "CÓD" not in w[4])
        cand = [i for i in imgs if cx0-10 <= (i["bbox"][0]+i["bbox"][2])/2 <= cx1 and y0-200 < i["bbox"][1] < y0-20]
        cand.sort(key=lambda i: -(i["bbox"][2]-i["bbox"][0])*(i["bbox"][3]-i["bbox"][1]))
        arq = None
        if cand and "SEM IMAGEM" not in " ".join(w[4] for w in blocks if cx0 <= w[0] < cx1 and y0-150 < w[1] < y0-40):
            px = fitz.Pixmap(pdf, cand[0]["xref"])
            if px.alpha: px = fitz.Pixmap(px, 0)
            if px.n > 3: px = fitz.Pixmap(fitz.csRGB, px)
            arq = f"img/{cod}.png"; px.save(arq)
        out.append({"cod":cod,"pagina":pn+1,"marca":marca,"nome":re.sub(r"\s+"," ",nome),"img":arq})
json.dump(out, open("catalogo.json","w"), ensure_ascii=False, indent=1)
print(len(out), sum(1 for o in out if o["img"]))
