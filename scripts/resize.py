# Делает 480/800/1200 WebP из оригиналов public/assets/img/<id>.webp, пишет data/photos.json
import glob, json, os
from PIL import Image
src = 'public/assets/img'
out = {}
for f in sorted(glob.glob(f'{src}/*.webp')):
    name = os.path.basename(f)[:-5]
    if '-' in name or name in ('dbeb02c6c07214b3', 'eaac6c70', 'eaac6c70fb'):
        continue
    im = Image.open(f).convert('RGB')
    w, h = im.size
    sizes = []
    for t in (480, 800, 1200):
        if w < t and t != 480:
            continue
        tw = min(t, w)
        th = round(h * tw / w)
        im.resize((tw, th), Image.LANCZOS).save(f'{src}/{name}-{t}.webp', quality=80, method=6)
        sizes.append(t if w >= t else w)
    out[name] = {'w': w, 'h': h, 'sizes': sorted(set(sizes))}
json.dump(out, open('data/photos.json', 'w'), indent=1)
print(len(out))
