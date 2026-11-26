# Processes generated art (in SRC) into web-ready webp files in art/.
import numpy as np, os, sys
from PIL import Image
from scipy import ndimage
SRC = '/cursor/stores/user/grok-bot/agents/45d9a4ba-3af1-4e19-93e8-8610720459c7/assets/'
OUT = os.path.join(os.path.dirname(__file__), '..', 'art')
os.makedirs(OUT, exist_ok=True)
def f(prefix):
    return Image.open(SRC + [x for x in os.listdir(SRC) if x.startswith(prefix)][0]).convert('RGB')
def save(im, name, q=78):
    im.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=q, method=6)
import sys
ONLY_MON = 'mon' in sys.argv
if not ONLY_MON:
  pass
def quads(im):
    w, h = im.size
    return [im.crop((0,0,w//2,h//2)), im.crop((w//2,0,w,h//2)), im.crop((0,h//2,w//2,h)), im.crop((w//2,h//2,w,h))]
def statics():
    # maps
    save(f('f12960c1').resize((768, 1024), Image.LANCZOS), 'world_map', 80)
    save(f('4046a4fa').resize((768, 1024), Image.LANCZOS), 'town_map', 80)
    # portraits
    for p, n in [('be610d9b','human'),('c731f5d6','elf'),('0478bfbb','dwarf'),('c5205fc9','halfling'),('78bc7436','orc'),('df530e3e','beastkin')]:
        save(f(p).resize((300, 400), Image.LANCZOS), 'race_' + n)
    save(f('d84bface').resize((360, 360), Image.LANCZOS), 'shopkeeper')
    # backdrops
    for p, n in [('faa9dbf7','meadow'),('71b678f4','wood'),('28342eca','mines'),('06d2efe5','marsh'),('3135036a','ash'),('081d6443','frost'),('7cad7227','ruins'),('86136eca','spine')]:
        save(f(p).resize((960, 540), Image.LANCZOS), 'bg_' + n, 72)
    for p, names in [('543a2c7b',['aldric','brann','dorrin','kaia']),('a72a298c',['sela','ansel','vey','morwen']),('05a7380e',['pell','whisper','ysolde','moss'])]:
        for q, n in zip(quads(f(p)), names):
            save(q.resize((240, 240), Image.LANCZOS), 'm_' + n)

if not ONLY_MON: statics()
def cutout(im):
    import numpy as np
    from scipy import ndimage
    a = np.asarray(im).astype(np.float32)
    border = np.concatenate([a[0], a[-1], a[:,0], a[:,-1]])
    paper_col = np.median(border, axis=0)
    dist = np.linalg.norm(a - paper_col, axis=2)
    mn = a.min(axis=2); mx = a.max(axis=2); ch = mx-mn
    paper = np.clip((mn-200)/45, 0, 1) * np.clip(1 - ch/28, 0, 1)
    near_paper = (dist < 28) & (ch < 22)
    sure = (dist < 18) & (ch < 16) & (mn > 210)
    lab, n = ndimage.label(sure)
    border_ids = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:,0], lab[:,-1]]))) - {0}
    bg = np.isin(lab, list(border_ids))
    walk = near_paper | (paper > 0.34)
    grow = bg.copy()
    for _ in range(50):
        nxt = ndimage.binary_dilation(grow, iterations=2) & walk
        if np.array_equal(nxt, grow): break
        grow = nxt
    bg = grow
    # only punch enclosed paper when the ring around the hole is clearly dark (rock/cloak gaps), never pale fur or slime shine
    holes, nh = ndimage.label((dist < 24) & (ch < 18) & ~bg)
    if nh:
        for i in range(1, nh+1):
            mask = holes==i
            if mask.sum() < 8 or mask.sum() > 0.15 * mask.size: continue
            dil = ndimage.binary_dilation(mask, iterations=3) & ~mask & ~bg
            if dil.sum() < 12: continue
            surr = a[dil]
            # dark surrounds (rock, cloth gaps) vs pale fur / slime shine (~200)
            if surr[...,:3].mean() < 140 and np.linalg.norm(surr.mean(0)-paper_col) > 50:
                bg |= mask
    alpha = np.where(bg, 0, 255).astype(np.float32)
    near = ndimage.binary_dilation(bg, iterations=2) & ~bg
    fade = np.clip(1 - (dist[near]/36), 0, 1)
    alpha[near] = 255 * (1 - fade * 0.85)
    alpha = ndimage.gaussian_filter(alpha, 0.5)
    m = alpha > 40
    lab2, n2 = ndimage.label(m)
    if n2 > 1:
        sizes = ndimage.sum(m, lab2, range(1, n2+1))
        keep_id = 1 + int(np.argmax(sizes))
        ys, xs = np.where(lab2==keep_id)
        cy, cx = (ys.min()+ys.max())/2, (xs.min()+xs.max())/2
        keep = [keep_id]
        for i, sz in enumerate(sizes, 1):
            if i==keep_id: continue
            if sz < 0.12 * sizes.max(): continue
            yy, xx = np.where(lab2==i)
            if np.hypot(yy.mean()-cy, xx.mean()-cx) < 0.55 * max(a.shape):
                keep.append(i)
        drop = m & ~np.isin(lab2, keep)
        alpha[ndimage.binary_dilation(drop, iterations=2)] = 0
    rgba = np.dstack([a.astype(np.uint8), alpha.clip(0,255).astype(np.uint8)])
    out = Image.fromarray(rgba, "RGBA")
    bb = out.getchannel("A").point(lambda v: 255 if v>30 else 0).getbbox()
    if bb:
        pad=4
        out = out.crop((max(0,bb[0]-pad), max(0,bb[1]-pad), min(out.width,bb[2]+pad), min(out.height,bb[3]+pad)))
    out.thumbnail((300, 300), Image.LANCZOS)
    return out

sheets = [('3153103c',['slime','rabbit','mushling','bee']),('8c4f9f78',['wolf','sapling','imp','spider']),
  ('cc03b3ed',['bat','kobold','golem','skeleton']),('90351cb3',['frog','wisp','hag','croc']),
  ('bd852c5d',['salamander','hawk','wraith','lava_golem']),('63c5b2c4',['yeti','ice_wolf','frost_wisp','owl']),
  ('0b9103c0',['ghoul','vamp_bat','dark_knight','necro']),('cb713bfa',['drake','wyvern','cultist','ancient_golem']),
  ('cdd2c8cd',['king_slime','elder_treant','troll','hydra']),('e590513f',['salamander_lord','frost_giant','lich','elder_dragon'])]
for p, names in sheets:
    for q, n in zip(quads(f(p)), names):
        save(cutout(q), 'e_' + n, 80)
print('done', len(os.listdir(OUT)))
