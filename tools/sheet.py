import sys
import pymupdf
from PIL import Image

pdf, start, end, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
dpi = int(sys.argv[5]) if len(sys.argv) > 5 else 60
cols = int(sys.argv[6]) if len(sys.argv) > 6 else 4
d = pymupdf.open(pdf)
imgs = []
for i in range(start - 1, min(end, d.page_count)):
    pix = d[i].get_pixmap(dpi=dpi)
    imgs.append(Image.frombytes("RGB", (pix.width, pix.height), pix.samples))
w, h = imgs[0].size
rows = (len(imgs) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w + (cols + 1) * 8, rows * h + (rows + 1) * 8), (120, 120, 120))
for k, im in enumerate(imgs):
    r, c = divmod(k, cols)
    sheet.paste(im, (8 + c * (w + 8), 8 + r * (h + 8)))
sheet.save(out)
print(out, sheet.size)
