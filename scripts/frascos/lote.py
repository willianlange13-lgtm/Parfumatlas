import numpy as np, sys, json, os
from PIL import Image
from rembg import new_session, remove
from scipy.ndimage import binary_dilation, label, gaussian_filter
import onnxruntime as ort
def op():
    o = ort.SessionOptions(); o.enable_cpu_mem_arena = False; o.enable_mem_pattern = False; o.intra_op_num_threads = 4; return o
fg_s = new_session("isnet-general-use", sess_opts=op()); sam = new_session("sam", sess_opts=op())
def med(m, x0, x1):
    sub = np.zeros_like(m); sub[:, x0:x1] = m[:, x0:x1]; ys, xs = np.nonzero(sub)
    return int(np.median(xs)), ys
def frasco(img, lado):
    a = np.array(remove(img, session=fg_s, only_mask=True)); m = a > 128
    if lado in "SK": return a
    xs = np.nonzero(m.any(0))[0]; X0, X1 = xs.min(), xs.max(); w = X1 - X0
    if lado == "L": f, negs = (X0, X0+int(w*.38)), [(X1-int(w*.2), X1)]
    elif lado == "R": f, negs = (X1-int(w*.38), X1+1), [(X0, X0+int(w*.2))]
    else: f, negs = (X0+int(w*.38), X0+int(w*.62)), [(X0, X0+int(w*.15)), (X1-int(w*.15), X1)]
    cx, _ = med(m, *f); col = np.nonzero(m[:, cx])[0]; t, b = col.min(), col.max()
    pr = [{"type":"point","data":[cx, int(t+(b-t)*k)],"label":1} for k in (.12,.5,.85)]
    for n in negs:
        nx, ys = med(m, *n); pr.append({"type":"point","data":[nx, int(np.median(ys))],"label":0})
    s = binary_dilation(np.array(sam.predict(img, sam_prompt=pr)[0].convert("L")) > 0, iterations=3)
    r = a * s; lab, n = label(r > 128)
    if n > 1:
        big = np.argmax(np.bincount(lab.ravel())[1:]) + 1; r = r * binary_dilation(lab == big, iterations=2)
    return r.astype(np.uint8)
d = json.load(open("catalogo.json")); k, n = int(sys.argv[1]), int(sys.argv[2])
for i, x in enumerate([x for x in d if x["img"]]):
    if i % n != k or os.path.exists(f"saida/{x['cod']}.webp"): continue
    img = Image.open(x["img"]).convert("RGB")
    try: al = frasco(img, x["lado"])
    except Exception as e: print("erro", x["cod"], e, flush=True); continue
    al = np.clip(gaussian_filter(al.astype(float), .6), 0, 255).astype(np.uint8)  # contorno macio
    r = img.copy(); r.putalpha(Image.fromarray(al))
    bb = r.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
    if bb: r = r.crop((max(0,bb[0]-4), max(0,bb[1]-4), min(r.width,bb[2]+4), min(r.height,bb[3]+4)))
    r.save(f"saida/{x['cod']}.webp", "WEBP", quality=88, method=6)
    print(i, x["cod"], flush=True)
