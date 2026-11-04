import math

INK = "#23272e"
ACC = "#df6d12"
ACC_S = "#fbe2cc"
MUTED = "#6b7280"
LINE = "#c3cad3"
SOFT = "#eef1f4"
BLUE = "#2f6cb3"
BLUE_S = "#dce9f8"
GREEN = "#2f8a57"
GREEN_S = "#dcf0e3"
RED = "#c93b3b"
RED_S = "#f8dede"
PURPLE = "#7a4fb6"
WOOD = "#d9b382"
METAL = "#aeb6c0"
FONT = "Segoe UI, Arial, sans-serif"


def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


class Svg:
    def __init__(self, w, h, scale=1.0):
        self.w = w
        self.h = h
        self.scale = scale
        self.parts = []

    def raw(self, s):
        self.parts.append(s)
        return self

    def line(self, x1, y1, x2, y2, stroke=INK, w=2, dash=None, cap="round", opacity=None):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        o = f' stroke-opacity="{opacity}"' if opacity else ""
        self.parts.append(f'<line x1="{f(x1)}" y1="{f(y1)}" x2="{f(x2)}" y2="{f(y2)}" stroke="{stroke}" stroke-width="{f(w)}" stroke-linecap="{cap}"{d}{o}/>')
        return self

    def polyline(self, pts, stroke=INK, w=2, fill="none", dash=None, join="round"):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        p = " ".join(f"{f(x)},{f(y)}" for x, y in pts)
        self.parts.append(f'<polyline points="{p}" fill="{fill}" stroke="{stroke}" stroke-width="{f(w)}" stroke-linejoin="{join}" stroke-linecap="round"{d}/>')
        return self

    def poly(self, pts, fill=SOFT, stroke=INK, w=2, opacity=None, dash=None):
        o = f' fill-opacity="{opacity}"' if opacity is not None else ""
        d = f' stroke-dasharray="{dash}"' if dash else ""
        p = " ".join(f"{f(x)},{f(y)}" for x, y in pts)
        self.parts.append(f'<polygon points="{p}" fill="{fill}" stroke="{stroke}" stroke-width="{f(w)}" stroke-linejoin="round"{o}{d}/>')
        return self

    def rect(self, x, y, w, h, fill=SOFT, stroke=INK, sw=2, rx=0, dash=None, opacity=None):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        o = f' fill-opacity="{opacity}"' if opacity is not None else ""
        self.parts.append(f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="{f(rx)}" fill="{fill}" stroke="{stroke}" stroke-width="{f(sw)}"{d}{o}/>')
        return self

    def circle(self, cx, cy, r, fill=SOFT, stroke=INK, w=2, dash=None):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        self.parts.append(f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" fill="{fill}" stroke="{stroke}" stroke-width="{f(w)}"{d}/>')
        return self

    def ellipse(self, cx, cy, rx, ry, fill=SOFT, stroke=INK, w=2):
        self.parts.append(f'<ellipse cx="{f(cx)}" cy="{f(cy)}" rx="{f(rx)}" ry="{f(ry)}" fill="{fill}" stroke="{stroke}" stroke-width="{f(w)}"/>')
        return self

    def path(self, d, fill="none", stroke=INK, w=2, dash=None, cap="round", join="round", opacity=None):
        ds = f' stroke-dasharray="{dash}"' if dash else ""
        o = f' fill-opacity="{opacity}"' if opacity is not None else ""
        self.parts.append(f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{f(w)}" stroke-linecap="{cap}" stroke-linejoin="{join}"{ds}{o}/>')
        return self

    def text(self, x, y, s, size=13, fill=INK, anchor="middle", weight=600, italic=False, baseline="middle", rotate=None, family=None):
        it = ' font-style="italic"' if italic else ""
        rot = f' transform="rotate({f(rotate)} {f(x)} {f(y)})"' if rotate is not None else ""
        fam = f' font-family="{family}"' if family else ""
        self.parts.append(
            f'<text x="{f(x)}" y="{f(y)}" font-size="{f(size)}" fill="{fill}" text-anchor="{anchor}" font-weight="{weight}" dominant-baseline="{baseline}"{it}{rot}{fam}>{s}</text>'
        )
        return self

    def arrow(self, x1, y1, x2, y2, color=INK, w=2.2, head=9, dash=None, both=False):
        ang = math.atan2(y2 - y1, x2 - x1)
        bx = x2 - head * 0.85 * math.cos(ang)
        by = y2 - head * 0.85 * math.sin(ang)
        sx, sy = x1, y1
        if both:
            sx = x1 + head * 0.85 * math.cos(ang)
            sy = y1 + head * 0.85 * math.sin(ang)
        self.line(sx, sy, bx, by, stroke=color, w=w, dash=dash, cap="butt")
        self.head(x2, y2, ang, color, head)
        if both:
            self.head(x1, y1, ang + math.pi, color, head)
        return self

    def head(self, x, y, ang, color, head):
        p1 = (x, y)
        p2 = (x - head * math.cos(ang) + head * 0.45 * math.sin(ang), y - head * math.sin(ang) - head * 0.45 * math.cos(ang))
        p3 = (x - head * math.cos(ang) - head * 0.45 * math.sin(ang), y - head * math.sin(ang) + head * 0.45 * math.cos(ang))
        self.poly([p1, p2, p3], fill=color, stroke=color, w=1)
        return self

    def arc_arrow(self, cx, cy, r, a1, a2, color=INK, w=2.2, head=9):
        r1 = math.radians(a1)
        r2 = math.radians(a2)
        x1, y1 = cx + r * math.cos(r1), cy - r * math.sin(r1)
        x2, y2 = cx + r * math.cos(r2), cy - r * math.sin(r2)
        large = 1 if abs(a2 - a1) > 180 else 0
        sweep = 0 if a2 > a1 else 1
        self.path(f"M{f(x1)},{f(y1)} A{f(r)},{f(r)} 0 {large} {sweep} {f(x2)},{f(y2)}", stroke=color, w=w)
        dx = -math.sin(r2) if a2 > a1 else math.sin(r2)
        dy = -math.cos(r2) if a2 > a1 else math.cos(r2)
        self.head(x2 + dx * 2, y2 + dy * 2, math.atan2(dy, dx), color, head)
        return self

    def group(self, inner, tx=0, ty=0, rot=0, sc=1):
        self.parts.append(f'<g transform="translate({f(tx)} {f(ty)}) rotate({f(rot)}) scale({f(sc)})">{inner}</g>')
        return self

    def svg(self):
        w = self.w * self.scale
        h = self.h * self.scale
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {f(self.w)} {f(self.h)}" width="{f(w)}" height="{f(h)}" font-family="{FONT}">'
            + "".join(self.parts)
            + "</svg>"
        )


def gear_path(cx, cy, r_out, r_in, teeth, phase=0.0):
    pts = []
    step = 2 * math.pi / teeth
    for i in range(teeth):
        a = i * step + phase
        for k, (frac, rad) in enumerate(((0.0, r_in), (0.12, r_out), (0.38, r_out), (0.5, r_in))):
            ang = a + frac * step
            pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
        pts.append((cx + r_in * math.cos(a + step), cy + r_in * math.sin(a + step)))
    d = "M" + " L".join(f"{f(x)},{f(y)}" for x, y in pts) + " Z"
    return d


def spring_points(x1, y1, x2, y2, coils=8, amp=8):
    L = math.hypot(x2 - x1, y2 - y1)
    ux, uy = (x2 - x1) / L, (y2 - y1) / L
    px, py = -uy, ux
    pts = [(x1, y1)]
    lead = L * 0.08
    pts.append((x1 + ux * lead, y1 + uy * lead))
    n = coils * 2
    for i in range(1, n + 1):
        t = lead + (L - 2 * lead) * (i - 0.5) / n
        s = amp if i % 2 else -amp
        pts.append((x1 + ux * t + px * s, y1 + uy * t + py * s))
    pts.append((x2 - ux * lead, y2 - uy * lead))
    pts.append((x2, y2))
    return pts


def resistor_points(x1, y, x2, zig=6, amp=7):
    L = x2 - x1
    pts = [(x1, y)]
    seg = L / (zig + 1)
    pts.append((x1 + seg / 2, y))
    for i in range(zig):
        pts.append((x1 + seg / 2 + seg * (i + 0.5), y + (amp if i % 2 == 0 else -amp)))
    pts.append((x2 - seg / 2, y))
    pts.append((x2, y))
    return pts
