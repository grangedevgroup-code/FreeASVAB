import math
import pathlib

from svgkit import Svg, f, gear_path, spring_points, resistor_points
from svgkit import INK, ACC, ACC_S, MUTED, LINE, SOFT, BLUE, BLUE_S, GREEN, GREEN_S, RED, RED_S, PURPLE, WOOD, METAL

FIGS = {}


def fig(fn):
    FIGS[fn.__name__.replace("_", "-")] = fn
    return fn


def pol(cx, cy, r, deg):
    a = math.radians(deg)
    return cx + r * math.cos(a), cy - r * math.sin(a)


def arc_d(cx, cy, r, a1, a2):
    x1, y1 = pol(cx, cy, r, a1)
    x2, y2 = pol(cx, cy, r, a2)
    large = 1 if abs(a2 - a1) > 180 else 0
    sweep = 1 if a2 < a1 else 0
    return f"M{f(x1)},{f(y1)} A{f(r)},{f(r)} 0 {large} {sweep} {f(x2)},{f(y2)}"


@fig
def cover_gauge():
    s = Svg(440, 250)
    cx, cy, r = 220, 220, 175
    bands = [(1, 9, "V"), (10, 15, "IVC"), (16, 20, "IVB"), (21, 30, "IVA"), (31, 49, "IIIB"), (50, 64, "IIIA"), (65, 92, "II"), (93, 99, "I")]
    for lo, hi, name in bands:
        a1 = 180 - (lo - 1) / 99 * 180 - 0.8
        a2 = 180 - hi / 99 * 180 + 0.8
        col = ACC if name == "II" else ("#f2a463" if name == "I" else "#4a515c")
        s.path(arc_d(cx, cy, r, a1, a2), stroke=col, w=34, cap="butt")
        mid = (a1 + a2) / 2
        tx, ty = pol(cx, cy, r, mid)
        if name in ("II", "IIIA", "IIIB", "I", "IVA"):
            s.text(tx, ty, name, size=12, fill="#ffffff" if name != "I" else "#1f2329", weight=800)
    for v in (1, 31, 50, 65, 93, 99):
        a = 180 - (v - 1) / 99 * 180 if v != 99 else 0
        x1, y1 = pol(cx, cy, r + 22, a)
        s.text(x1, y1, str(v), size=11.5, fill="#aab1bb", weight=700)
    a = 180 - (80 - 1) / 99 * 180
    nx, ny = pol(cx, cy, r - 30, a)
    s.line(cx, cy, nx, ny, stroke="#ffffff", w=5)
    s.circle(cx, cy, 11, fill="#ffffff", stroke="#ffffff", w=1)
    s.circle(cx, cy, 4.5, fill=ACC, stroke=ACC, w=1)
    s.text(cx - 62, cy - 60, "AFQT", size=13, fill="#aab1bb", weight=700)
    s.text(cx - 62, cy - 36, "TARGET 70&#8211;80+", size=17, fill="#ffffff", weight=800)
    return s.svg()


def box(s, x, y, w, h, lines, fill=SOFT, stroke=INK, size=12.5, color=INK, weight=600):
    s.rect(x, y, w, h, fill=fill, stroke=stroke, sw=1.8, rx=8)
    n = len(lines)
    for i, t in enumerate(lines):
        s.text(x + w / 2, y + h / 2 + (i - (n - 1) / 2) * (size * 1.25), t, size=size, fill=color, weight=weight)


@fig
def cat_flow():
    s = Svg(660, 250)
    box(s, 6, 95, 150, 66, ["Start: an average-", "difficulty question"])
    s.arrow(158, 128, 196, 128)
    box(s, 198, 98, 112, 60, ["You answer"], fill="#ffffff")
    s.arrow(312, 128, 346, 128)
    s.poly([(398, 84), (450, 128), (398, 172), (346, 128)], fill=ACC_S, stroke=ACC, w=2)
    s.text(398, 128, "Correct?", size=13, weight=700, fill="#7a3b06")
    s.arrow(430, 101, 478, 58, color=GREEN)
    s.text(452, 70, "yes", size=11.5, fill=GREEN, weight=700, anchor="end")
    s.arrow(430, 155, 478, 198, color=RED)
    s.text(452, 188, "no", size=11.5, fill=RED, weight=700, anchor="end")
    box(s, 480, 26, 174, 58, ["Next question is", "HARDER"], fill=GREEN_S, stroke=GREEN, color="#185a35")
    box(s, 480, 172, 174, 58, ["Next question is", "EASIER"], fill=RED_S, stroke=RED, color="#8a2424")
    s.polyline([(480, 40), (254, 40), (254, 90)], stroke=MUTED, w=2, dash="5 4")
    s.head(254, 97, math.pi / 2, MUTED, 9)
    s.polyline([(480, 216), (254, 216), (254, 166)], stroke=MUTED, w=2, dash="5 4")
    s.head(254, 159, -math.pi / 2, MUTED, 9)
    s.text(367, 30, "repeat until the subtest ends", size=11, fill=MUTED, weight=600)
    s.text(367, 246, "your score counts how hard the questions were, not just how many were right", size=11, fill=MUTED, weight=600)
    return s.svg()


@fig
def afqt_pie():
    s = Svg(560, 230)
    cx, cy, r, rin = 115, 115, 100, 58
    segs = [(90, -90, ACC, "VE x 2"), (-90, -180, BLUE, "AR"), (-180, -270, GREEN, "MK")]
    for a1, a2, col, lab in segs:
        x1, y1 = pol(cx, cy, r, a1)
        x2, y2 = pol(cx, cy, r, a2)
        x3, y3 = pol(cx, cy, rin, a2)
        x4, y4 = pol(cx, cy, rin, a1)
        large = 1 if abs(a2 - a1) > 180 else 0
        d = f"M{f(x1)},{f(y1)} A{r},{r} 0 {large} 1 {f(x2)},{f(y2)} L{f(x3)},{f(y3)} A{rin},{rin} 0 {large} 0 {f(x4)},{f(y4)} Z"
        s.path(d, fill=col, stroke="#ffffff", w=3)
    s.text(cx + 79, cy + 1, "50%", size=14, fill="#ffffff", weight=800)
    s.text(cx - 52, cy + 50, "25%", size=14, fill="#ffffff", weight=800)
    s.text(cx - 52, cy - 46, "25%", size=14, fill="#ffffff", weight=800)
    s.text(cx, cy - 6, "AFQT", size=15, weight=800)
    s.text(cx, cy + 14, "mix", size=11.5, fill=MUTED)
    rows = [(ACC, "Verbal (VE) counted twice", "Word Knowledge + Paragraph Comprehension"), (BLUE, "Arithmetic Reasoning (AR)", "word problems"), (GREEN, "Mathematics Knowledge (MK)", "algebra, geometry, number rules")]
    for i, (col, a, b) in enumerate(rows):
        y = 52 + i * 62
        s.rect(250, y - 11, 22, 22, fill=col, stroke=col, sw=1, rx=4)
        s.text(284, y - 4, a, size=14, anchor="start", weight=700)
        s.text(284, y + 15, b, size=12, anchor="start", fill=MUTED, weight=500)
    return s.svg()


def angle_arc(s, cx, cy, r, a1, a2, color=ACC, w=2):
    s.path(arc_d(cx, cy, r, a1, a2), stroke=color, w=w)


@fig
def mk_angles():
    s = Svg(680, 170)
    specs = [(40, "Acute", "less than 90°"), (90, "Right", "exactly 90°"), (135, "Obtuse", "between 90° and 180°"), (180, "Straight", "exactly 180°")]
    for i, (deg, name, desc) in enumerate(specs):
        cx = 30 + i * 170
        vx, vy = (cx + 20, 110) if deg != 180 else (cx + 75, 110)
        s.line(vx, vy, vx + 95, vy, w=2.4)
        ex, ey = pol(vx, vy, 95, deg)
        s.line(vx, vy, ex, ey, w=2.4)
        if deg == 90:
            s.polyline([(vx + 16, vy), (vx + 16, vy - 16), (vx, vy - 16)], stroke=ACC, w=2)
        else:
            angle_arc(s, vx, vy, 26, 0, deg)
        s.circle(vx, vy, 3.2, fill=INK, stroke=INK, w=1)
        s.text(cx + 70, 140, name, size=14, weight=800)
        s.text(cx + 70, 159, desc, size=11.5, fill=MUTED, weight=500)
    return s.svg()


@fig
def mk_parallel():
    s = Svg(440, 270)
    y1, y2 = 85, 185
    s.line(30, y1, 410, y1, w=2.4)
    s.line(30, y2, 410, y2, w=2.4)
    for y in (y1, y2):
        s.polyline([(372, y - 6), (380, y), (372, y + 6)], stroke=INK, w=2)
    ang = 60
    dx, dy = math.cos(math.radians(ang)), -math.sin(math.radians(ang))
    p1 = (250, y1)
    p2 = (250 - (y2 - y1) / math.tan(math.radians(ang)), y2)
    s.line(p2[0] - dx * 70, p2[1] - dy * 70, p1[0] + dx * 70, p1[1] + dy * 70, w=2.4, stroke=BLUE)
    labels = [(120, "1", ACC), (30, "2", BLUE), (210, "3", BLUE), (300, "4", ACC)]
    for (px, py), base in ((p1, 0), (p2, 4)):
        for a, n, col in labels:
            lx, ly = pol(px, py, 26, a)
            s.circle(lx, ly, 11, fill="#ffffff", stroke=col, w=1.8)
            s.text(lx, ly + 0.5, str(int(n) + base), size=12.5, fill=col, weight=800)
    s.text(36, y1 - 14, "parallel line", size=11.5, fill=MUTED, anchor="start", weight=600)
    s.text(36, y2 - 14, "parallel line", size=11.5, fill=MUTED, anchor="start", weight=600)
    s.text(p1[0] + dx * 74 + 8, p1[1] + dy * 74, "transversal", size=11.5, fill=BLUE, anchor="start", weight=700)
    return s.svg()


@fig
def mk_pythag():
    s = Svg(500, 230)
    A, B, C = (70, 200), (70, 50), (330, 200)
    s.poly([A, B, C], fill=BLUE_S, stroke=INK, w=2.4)
    s.polyline([(70, 184), (86, 184), (86, 200)], stroke=INK, w=1.8)
    s.text(52, 125, "a", size=17, weight=800, italic=True)
    s.text(200, 218, "b", size=17, weight=800, italic=True)
    s.text(212, 112, "c", size=17, weight=800, italic=True, fill=ACC)
    s.text(232, 132, "hypotenuse", size=12, fill=ACC, weight=700, anchor="start", rotate=30)
    s.text(410, 60, "a² + b² = c²", size=19, weight=800, fill=INK)
    s.text(410, 88, "legs: a and b", size=12.5, fill=MUTED, weight=600)
    s.text(410, 106, "c is always the longest side", size=12.5, fill=MUTED, weight=600)
    return s.svg()


@fig
def mk_special():
    s = Svg(560, 240)
    A, B, C = (50, 200), (50, 60), (190, 200)
    s.poly([A, B, C], fill=ACC_S, stroke=INK, w=2.4)
    s.polyline([(50, 186), (64, 186), (64, 200)], stroke=INK, w=1.8)
    s.text(36, 130, "x", size=16, weight=800, italic=True)
    s.text(120, 218, "x", size=16, weight=800, italic=True)
    s.text(140, 118, "x√2", size=16, weight=800, italic=True, fill=ACC)
    s.text(66, 92, "45°", size=12, weight=700, anchor="start")
    s.text(150, 192, "45°", size=12, weight=700)
    s.text(120, 234, "45°–45°–90°", size=13.5, weight=800)
    x = 80
    A2, B2, C2 = (300, 200), (300, 200 - x), (300 + x * math.sqrt(3), 200)
    s.poly([A2, B2, C2], fill=BLUE_S, stroke=INK, w=2.4)
    s.polyline([(300, 186), (314, 186), (314, 200)], stroke=INK, w=1.8)
    s.text(286, 160, "x", size=16, weight=800, italic=True)
    s.text(370, 218, "x√3", size=16, weight=800, italic=True)
    s.text(390, 146, "2x", size=16, weight=800, italic=True, fill=BLUE)
    s.text(316, 136, "60°", size=12, weight=700, anchor="start")
    s.text(C2[0] - 40, 192, "30°", size=12, weight=700)
    s.text(370, 234, "30°–60°–90°", size=13.5, weight=800)
    s.text(500, 120, "short side", size=11.5, fill=MUTED, weight=600)
    s.text(500, 136, "is opposite 30°", size=11.5, fill=MUTED, weight=600)
    return s.svg()


@fig
def mk_circle():
    s = Svg(440, 270)
    cx, cy, r = 170, 135, 100
    s.circle(cx, cy, r, fill="#f7f9fb", stroke=INK, w=2.4)
    s.line(cx - r, cy, cx + r, cy, stroke=BLUE, w=2.4)
    s.text(cx - 50, cy + 14, "diameter", size=12, fill=BLUE, weight=700)
    rx, ry = pol(cx, cy, r, 140)
    s.line(cx, cy, rx, ry, stroke=GREEN, w=2.4)
    s.text(cx - 52, cy - 46, "radius", size=12, fill=GREEN, weight=700, rotate=40)
    c1 = pol(cx, cy, r, 215)
    c2 = pol(cx, cy, r, 325)
    s.line(c1[0], c1[1], c2[0], c2[1], stroke=PURPLE, w=2.4)
    s.text(cx, c1[1] + 15, "chord", size=12, fill=PURPLE, weight=700)
    s.path(arc_d(cx, cy, r, 70, 110), stroke=ACC, w=6, cap="round")
    ax, ay = pol(cx, cy, r + 16, 90)
    s.text(ax, ay, "arc", size=12, fill=ACC, weight=700)
    tx, ty = pol(cx, cy, r, 25)
    ux, uy = math.cos(math.radians(25)), -math.sin(math.radians(25))
    px, py = -uy, ux
    s.line(tx - px * 80, ty - py * 80, tx + px * 70, ty + py * 70, stroke=RED, w=2.4)
    s.text(tx + px * 70 + 6, ty + py * 70 + 4, "tangent", size=12, fill=RED, weight=700, anchor="start")
    s.circle(tx, ty, 3.5, fill=RED, stroke=RED, w=1)
    s.circle(cx, cy, 4, fill=INK, stroke=INK, w=1)
    s.text(cx + 10, cy - 10, "center", size=11.5, fill=INK, weight=700, anchor="start")
    return s.svg()


@fig
def mk_solids():
    s = Svg(660, 200)
    fx, fy, w, h, ox, oy = 20, 75, 110, 80, 32, -26
    s.line(fx + ox, fy + h + oy, fx + ox, fy + oy, stroke=MUTED, w=1.5, dash="4 3")
    s.line(fx + ox, fy + h + oy, fx, fy + h, stroke=MUTED, w=1.5, dash="4 3")
    s.line(fx + ox, fy + h + oy, fx + w + ox, fy + h + oy, stroke=MUTED, w=1.5, dash="4 3")
    s.poly([(fx, fy), (fx + ox, fy + oy), (fx + w + ox, fy + oy), (fx + w, fy)], fill="#e3e8ef", stroke=INK, w=2)
    s.poly([(fx + w, fy), (fx + w + ox, fy + oy), (fx + w + ox, fy + h + oy), (fx + w, fy + h)], fill="#d3dae3", stroke=INK, w=2)
    s.rect(fx, fy, w, h, fill="#eef1f5", stroke=INK, sw=2)
    s.text(fx + w / 2, fy + h + 14, "l", size=14, weight=800, italic=True)
    s.text(fx - 9, fy + h / 2, "h", size=14, weight=800, italic=True)
    s.text(fx + w + ox / 2 + 9, fy + h + oy / 2 + 6, "w", size=14, weight=800, italic=True)
    s.text(fx + 70, 186, "Box", size=13.5, weight=800)
    cx, top, bot, rx, ry = 255, 52, 152, 46, 12
    s.path(f"M{cx - rx},{top} L{cx - rx},{bot} A{rx},{ry} 0 0 0 {cx + rx},{bot} L{cx + rx},{top}", fill="#eef1f5", stroke=INK, w=2)
    s.path(f"M{cx - rx},{bot} A{rx},{ry} 0 0 1 {cx + rx},{bot}", stroke=MUTED, w=1.5, dash="4 3")
    s.ellipse(cx, top, rx, ry, fill="#e3e8ef", stroke=INK, w=2)
    s.line(cx, top, cx + rx, top, stroke=ACC, w=2)
    s.text(cx + rx / 2, top - 8, "r", size=14, weight=800, italic=True, fill=ACC)
    s.line(cx + rx + 16, top, cx + rx + 16, bot, stroke=BLUE, w=1.6, dash="4 3")
    s.text(cx + rx + 26, (top + bot) / 2, "h", size=14, weight=800, italic=True, fill=BLUE)
    s.text(cx, 186, "Cylinder", size=13.5, weight=800)
    kx, apex, base = 420, 40, 152
    s.path(f"M{kx},{apex} L{kx - rx},{base} A{rx},{ry} 0 0 0 {kx + rx},{base} Z", fill="#eef1f5", stroke=INK, w=2)
    s.path(f"M{kx - rx},{base} A{rx},{ry} 0 0 1 {kx + rx},{base}", stroke=MUTED, w=1.5, dash="4 3")
    s.line(kx, apex, kx, base, stroke=BLUE, w=1.6, dash="4 3")
    s.text(kx - 9, (apex + base) / 2 + 10, "h", size=14, weight=800, italic=True, fill=BLUE)
    s.line(kx, base, kx + rx, base, stroke=ACC, w=2)
    s.text(kx + rx / 2, base - 8, "r", size=14, weight=800, italic=True, fill=ACC)
    s.text(kx, 186, "Cone", size=13.5, weight=800)
    sx, sy, sr = 575, 100, 56
    s.circle(sx, sy, sr, fill="#eef1f5", stroke=INK, w=2)
    s.path(f"M{sx - sr},{sy} A{sr},14 0 0 1 {sx + sr},{sy}", stroke=MUTED, w=1.5, dash="4 3")
    s.path(f"M{sx - sr},{sy} A{sr},14 0 0 0 {sx + sr},{sy}", stroke=INK, w=1.6)
    s.line(sx, sy, sx + sr, sy - 2, stroke=ACC, w=2)
    s.circle(sx, sy, 3, fill=INK, stroke=INK, w=1)
    s.text(sx + sr / 2, sy - 12, "r", size=14, weight=800, italic=True, fill=ACC)
    s.text(sx, 186, "Sphere", size=13.5, weight=800)
    return s.svg()


@fig
def mk_coord():
    s = Svg(340, 320)
    ox, oy, u = 170, 160, 22
    for k in range(-6, 7):
        s.line(ox + k * u, oy - 6.4 * u, ox + k * u, oy + 6.4 * u, stroke="#e3e7ec", w=1)
        s.line(ox - 6.4 * u, oy + k * u, ox + 6.4 * u, oy + k * u, stroke="#e3e7ec", w=1)
    s.arrow(ox - 6.6 * u, oy, ox + 6.9 * u, oy, color=INK, w=1.8, head=8, both=True)
    s.arrow(ox, oy + 6.6 * u, ox, oy - 6.9 * u, color=INK, w=1.8, head=8, both=True)
    s.text(ox + 6.9 * u + 4, oy - 10, "x", size=14, weight=800, italic=True)
    s.text(ox + 12, oy - 6.9 * u + 4, "y", size=14, weight=800, italic=True)
    for k in (-4, -2, 2, 4):
        s.text(ox + k * u, oy + 13, str(k).replace("-", "&#8722;"), size=10, fill=MUTED, weight=600)
        s.text(ox - 10, oy - k * u, str(k).replace("-", "&#8722;"), size=10, fill=MUTED, weight=600, anchor="end")
    qs = [("I", "(+, +)", 1, 1), ("II", "(&#8722;, +)", -1, 1), ("III", "(&#8722;, &#8722;)", -1, -1), ("IV", "(+, &#8722;)", 1, -1)]
    for name, sign, sxn, syn in qs:
        qx, qy = ox + sxn * 4.6 * u, oy - syn * 5.3 * u
        s.text(qx, qy, name, size=15, weight=800, fill=MUTED)
        s.text(qx, qy + 16, sign, size=11, weight=600, fill=MUTED)
    x1, x2 = -2.4, 3.4
    s.line(ox + x1 * u, oy - (2 * x1 - 1) * u, ox + x2 * u, oy - (2 * x2 - 1) * u, stroke=BLUE, w=2.6)
    s.polyline([(ox + 1 * u, oy - 1 * u), (ox + 2 * u, oy - 1 * u), (ox + 2 * u, oy - 3 * u)], stroke=ACC, w=2.2, dash="4 3")
    s.text(ox + 1.5 * u, oy - 1 * u + 12, "run 1", size=10.5, fill=ACC, weight=700)
    s.text(ox + 2 * u + 5, oy - 2 * u, "rise 2", size=10.5, fill=ACC, weight=700, anchor="start")
    s.text(ox + 3.5 * u + 4, oy - 5.4 * u, "y = 2x &#8722; 1", size=12.5, fill=BLUE, weight=800, anchor="start")
    px, py = ox - 4 * u, oy - 3 * u
    s.circle(px, py, 4.5, fill=RED, stroke=RED, w=1)
    s.text(px + 8, py - 10, "(&#8722;4, 3)", size=11.5, fill=RED, weight=700, anchor="start")
    s.circle(ox, oy + u, 4, fill=BLUE, stroke=BLUE, w=1)
    s.text(ox - 8, oy + u + 12, "y-intercept", size=10, fill=BLUE, weight=700, anchor="end")
    return s.svg()


def half_disc(s, cx, cy, r, fill, stroke="#ffffff", w=1.5):
    s.path(f"M{f(cx - r)},{f(cy)} A{f(r)},{f(r)} 0 0 1 {f(cx + r)},{f(cy)} Z", fill=fill, stroke=stroke, w=w)


@fig
def gs_earth_layers():
    s = Svg(600, 250)
    cx, cy = 200, 236
    layers = [(190, "#8a6a49", "Crust", "thin, rocky outer layer"), (178, "#e07b39", "Mantle", "thickest layer; slowly flowing rock"), (102, "#f3ad4e", "Outer core", "LIQUID iron and nickel"), (58, "#fde08a", "Inner core", "SOLID iron and nickel; hottest")]
    for r, col, *_ in layers:
        half_disc(s, cx, cy, r, col)
    s.line(cx - 200, cy, cx + 200, cy, stroke=INK, w=2)
    mids = [184, 140, 80, 30]
    ys = [40, 92, 144, 196]
    for (r, col, name, desc), rm, ty in zip(layers, mids, ys):
        px, py = pol(cx, cy, rm, 32 if rm > 40 else 60)
        s.polyline([(px, py), (px + 14, ty), (418, ty)], stroke=INK, w=1.3)
        s.circle(px, py, 3, fill=INK, stroke=INK, w=1)
        s.text(424, ty - 7, name, size=14, weight=800, anchor="start")
        s.text(424, ty + 10, desc, size=11, weight=500, fill=MUTED, anchor="start")
    return s.svg()


@fig
def gs_atmosphere():
    s = Svg(620, 250)
    bands = [
        ("Exosphere", "above ~600 km", "fades into space", "#1c2433", "#ffffff"),
        ("Thermosphere", "~85–600 km", "very thin, very hot air; auroras; the space station orbits here", "#28344a", "#ffffff"),
        ("Mesosphere", "~50–85 km", "meteors burn up; the coldest layer", "#3b5578", "#ffffff"),
        ("Stratosphere", "~12–50 km", "the ozone layer absorbs UV light", "#6f95c4", "#ffffff"),
        ("Troposphere", "0–12 km", "where we live; almost all weather happens here", "#bcd6ef", INK),
    ]
    h = 46
    for i, (name, alt, desc, col, tc) in enumerate(bands):
        y = 8 + i * h
        s.rect(10, y, 600, h, fill=col, stroke="#ffffff", sw=1.5)
        s.text(24, y + h / 2 - 7, name, size=14, weight=800, fill=tc, anchor="start")
        s.text(24, y + h / 2 + 11, alt, size=11, weight=600, fill=tc, anchor="start")
        s.text(190, y + h / 2, desc, size=12, weight=600, fill=tc, anchor="start")
    s.poly([(470, 238), (520, 200), (548, 222), (570, 196), (606, 238)], fill="#7d8a6a", stroke="#5b6648", w=1)
    return s.svg()


@fig
def gs_planets():
    s = Svg(680, 170)
    s.path("M0,10 A95,95 0 0 1 0,150", fill="#fbbf24", stroke="#f59e0b", w=2)
    s.text(18, 80, "Sun", size=13, weight=800, fill="#7a4a00", anchor="start")
    planets = [("Mercury", 5, "#9ca3af"), ("Venus", 9, "#e8c37a"), ("Earth", 9.5, "#3b82f6"), ("Mars", 6, "#c2552c"), ("Jupiter", 30, "#d6a77a"), ("Saturn", 25, "#e6c98a"), ("Uranus", 15, "#7dd3e0"), ("Neptune", 14.5, "#3b5bdb")]
    xs = [84, 126, 170, 212, 300, 410, 515, 610]
    for k, ((name, r, col), x) in enumerate(zip(planets, xs)):
        if name == "Saturn":
            s.ellipse(x, 72, r + 17, 7, fill="none", stroke="#b89a5a", w=3)
        s.circle(x, 72, r, fill=col, stroke=INK, w=1)
        if name == "Saturn":
            s.path(f"M{x - r - 17},72 A{r + 17},7 0 0 0 {x + r + 17},72", stroke="#b89a5a", w=3)
        ly = 118 if (k >= 4 or k % 2 == 0) else 134
        s.text(x, ly, name, size=11.5, weight=700)
    for k in range(14):
        ax = 240 + (k * 7) % 22
        ay = 50 + (k * 13) % 45
        s.circle(ax, ay, 1.3, fill=MUTED, stroke=MUTED, w=0.5)
    s.text(251, 34, "asteroid belt", size=10, fill=MUTED, weight=600)
    s.text(148, 160, "inner planets: small and rocky", size=10.5, fill=MUTED, weight=700)
    s.text(500, 160, "outer planets: gas and ice giants", size=10.5, fill=MUTED, weight=700)
    return s.svg()


@fig
def gs_eclipse():
    s = Svg(640, 260)
    def row(y, title, order):
        s.text(10, y - 46, title, size=13.5, weight=800, anchor="start")
        s.circle(60, y, 34, fill="#fbbf24", stroke="#f59e0b", w=2)
        s.text(60, y + 50, "Sun", size=11.5, weight=700)
        bodies = {"Moon": (9, "#cbd5e1"), "Earth": (20, "#3b82f6")}
        (n1, x1), (n2, x2) = order
        r1, c1 = bodies[n1]
        r2, c2 = bodies[n2]
        s.poly([(x1, y - r1), (x2 + 40, y - (r2 * 0.6 if n1 == "Moon" else r2 * 0.9)), (x2 + 40, y + (r2 * 0.6 if n1 == "Moon" else r2 * 0.9)), (x1, y + r1)], fill="#1f2937", stroke="none", w=0, opacity=0.25)
        s.circle(x1, y, r1, fill=c1, stroke=INK, w=1.2)
        s.circle(x2, y, r2, fill=c2, stroke=INK, w=1.2)
        s.text(x1, y + 50, n1, size=11.5, weight=700)
        s.text(x2, y + 50, n2, size=11.5, weight=700)
    row(70, "Solar eclipse: the Moon blocks the Sun (at new moon)", [("Moon", 330), ("Earth", 470)])
    row(196, "Lunar eclipse: Earth's shadow covers the Moon (at full moon)", [("Earth", 330), ("Moon", 470)])
    return s.svg()


@fig
def gs_atom():
    s = Svg(420, 240)
    cx, cy = 140, 120
    s.circle(cx, cy, 100, fill="none", stroke=LINE, w=1.6, dash="5 4")
    s.circle(cx, cy, 60, fill="none", stroke=LINE, w=1.6, dash="5 4")
    s.circle(cx, cy, 24, fill="#fff7ed", stroke=ACC, w=1.4)
    pts = [(-9, -8), (6, -10), (11, 4), (-2, 2), (-11, 7), (3, 13), (-4, -14), (12, -3), (-13, -2), (8, 12), (-6, 12), (0, -3)]
    for k, (dx, dy) in enumerate(pts):
        if k % 2 == 0:
            s.circle(cx + dx, cy + dy, 5.5, fill=ACC, stroke="#ffffff", w=1)
        else:
            s.circle(cx + dx, cy + dy, 5.5, fill="#9ca3af", stroke="#ffffff", w=1)
    for ang in (30, 210):
        ex, ey = pol(cx, cy, 60, ang)
        s.circle(ex, ey, 6, fill=BLUE, stroke="#ffffff", w=1)
    for ang in (100, 190, 280, 350):
        ex, ey = pol(cx, cy, 100, ang)
        s.circle(ex, ey, 6, fill=BLUE, stroke="#ffffff", w=1)
    s.circle(262, 52, 6, fill=ACC, stroke="#ffffff", w=1)
    s.text(274, 52, "proton (+)", size=12, weight=700, anchor="start")
    s.circle(262, 76, 6, fill="#9ca3af", stroke="#ffffff", w=1)
    s.text(274, 76, "neutron (no charge)", size=12, weight=700, anchor="start")
    s.circle(262, 100, 6, fill=BLUE, stroke="#ffffff", w=1)
    s.text(274, 100, "electron (−)", size=12, weight=700, anchor="start")
    s.text(256, 136, "Nucleus = protons + neutrons", size=11.5, weight=600, fill=MUTED, anchor="start")
    s.text(256, 154, "Dashed rings = energy levels", size=11.5, weight=600, fill=MUTED, anchor="start")
    s.text(256, 172, "(electron shells)", size=11.5, weight=600, fill=MUTED, anchor="start")
    s.text(256, 198, "This model: carbon, with", size=11.5, weight=600, fill=MUTED, anchor="start")
    s.text(256, 216, "6 protons and 6 electrons", size=11.5, weight=600, fill=MUTED, anchor="start")
    return s.svg()


@fig
def gs_ph():
    s = Svg(660, 175)
    stops = ["#d7263d", "#f05d23", "#f59e0b", "#facc15", "#d9e021", "#8bc34a", "#43a047", "#2e9e6b", "#26a69a", "#1e88e5", "#3949ab", "#5e35b1", "#7b1fa2", "#6a1b9a", "#4a148c"]
    x0, wbar = 30, 600
    seg = wbar / 15
    for i, c in enumerate(stops):
        s.rect(x0 + i * seg, 62, seg + 0.5, 30, fill=c, stroke=c, sw=0.5)
        s.text(x0 + i * seg + seg / 2, 77, str(i), size=12, weight=800, fill="#ffffff")
    s.rect(x0, 62, wbar, 30, fill="none", stroke=INK, sw=1.2)
    s.text(x0, 24, "ACIDIC", size=13, weight=800, fill=RED, anchor="start")
    s.text(x0 + 7.5 * seg, 24, "NEUTRAL", size=13, weight=800, fill=GREEN)
    s.text(x0 + wbar, 24, "BASIC (ALKALINE)", size=13, weight=800, fill=PURPLE, anchor="end")
    s.arrow(x0 + 6.5 * seg, 44, x0 + 20, 44, color=RED, w=2, head=8)
    s.arrow(x0 + 8.5 * seg, 44, x0 + wbar - 20, 44, color=PURPLE, w=2, head=8)
    ex = [(1, "stomach acid"), (2, "lemon juice"), (3, "vinegar"), (5, "coffee"), (7, "pure water"), (8.3, "baking soda"), (11, "ammonia"), (12.5, "bleach"), (14, "drain cleaner")]
    for k, (v, name) in enumerate(ex):
        x = x0 + v / 14 * (wbar - seg) + seg / 2
        y = 112 if k % 2 == 0 else 136
        s.line(x, 92, x, y - 8, stroke=MUTED, w=1)
        s.text(x, y, name, size=10.5, weight=600, fill=INK)
    return s.svg()


@fig
def gs_wave():
    s = Svg(640, 210)
    y0, A, L, x0 = 110, 55, 220, 112
    pts = [(x0 + t, y0 - A * math.sin(2 * math.pi * t / L)) for t in range(0, 501, 4)]
    s.line(60, y0, 630, y0, stroke=LINE, w=1.4, dash="5 4")
    s.polyline(pts, stroke=BLUE, w=3)
    c1 = x0 + L / 4
    c2 = c1 + L
    s.arrow(c1, 30, c2, 30, color=ACC, w=2, head=8, both=True)
    s.line(c1, 34, c1, y0 - A - 4, stroke=ACC, w=1, dash="3 3")
    s.line(c2, 34, c2, y0 - A - 4, stroke=ACC, w=1, dash="3 3")
    s.text((c1 + c2) / 2, 20, "wavelength", size=12.5, weight=800, fill=ACC)
    s.line(94, y0 - A, c1 - 6, y0 - A, stroke=GREEN, w=1, dash="3 3")
    s.arrow(94, y0, 94, y0 - A + 1, color=GREEN, w=2, head=8)
    s.text(86, y0 - A / 2, "amplitude", size=12, weight=800, fill=GREEN, anchor="end")
    c3 = c2 + L
    s.text(c3 - 2, y0 - A - 12, "crest", size=12, weight=800, fill=INK)
    t1 = x0 + 3 * L / 4
    s.text(t1, y0 + A + 18, "trough", size=12, weight=800, fill=INK)
    s.text(626, y0 + 14, "rest position", size=10.5, weight=600, fill=MUTED, anchor="end")
    return s.svg()


@fig
def gs_em():
    s = Svg(660, 150)
    names = [("Radio", "#64748b"), ("Microwave", "#6b7280"), ("Infrared", "#b91c1c"), ("Visible", None), ("Ultraviolet", "#6d28d9"), ("X-ray", "#4338ca"), ("Gamma", "#1e1b4b")]
    x, w = 20, 88
    for name, col in names:
        if col is None:
            rainbow = ["#e53935", "#fb8c00", "#fdd835", "#43a047", "#1e88e5", "#3949ab", "#8e24aa"]
            for k, c in enumerate(rainbow):
                s.rect(x + k * w / 7, 40, w / 7 + 0.4, 34, fill=c, stroke=c, sw=0.3)
            s.text(x + w / 2, 57, name, size=12.5, weight=800, fill=INK)
        else:
            s.rect(x, 40, w, 34, fill=col, stroke="#ffffff", sw=1.5)
            s.text(x + w / 2, 57, name, size=12, weight=800, fill="#ffffff")
        x += w + 2
    s.arrow(330, 98, 24, 98, color=INK, w=2, head=9)
    s.arrow(330, 98, 636, 98, color=INK, w=2, head=9)
    s.text(30, 118, "longer wavelength", size=11.5, weight=700, anchor="start")
    s.text(30, 134, "lower frequency and energy", size=11.5, weight=600, fill=MUTED, anchor="start")
    s.text(632, 118, "shorter wavelength", size=11.5, weight=700, anchor="end")
    s.text(632, 134, "higher frequency and energy", size=11.5, weight=600, fill=MUTED, anchor="end")
    s.text(20 + 3 * 90 + 44, 26, "red ← ROY G BIV → violet", size=11, weight=700, fill=MUTED)
    return s.svg()


WATER = "#9cc9f0"


@fig
def ei_water():
    s = Svg(640, 210)
    s.rect(24, 34, 86, 130, fill="#ffffff", stroke=INK, sw=2.4)
    s.rect(26, 62, 82, 100, fill=WATER, stroke="none", sw=0)
    s.text(67, 22, "VOLTAGE", size=13, weight=800, fill=ACC)
    s.text(52, 112, "pressure", size=11.5, weight=700, fill="#1e4f8a")
    s.arrow(94, 70, 94, 150, color="#1e4f8a", w=2, head=8)
    top, bot = 128, 156
    pts_top = [(110, top), (300, top), (318, 137), (378, 137), (396, top), (590, top)]
    pts_bot = [(590, bot), (396, bot), (378, 147), (318, 147), (300, bot), (110, bot)]
    s.poly(pts_top + pts_bot, fill=WATER, stroke=INK, w=2.4)
    for x in (160, 220, 450, 520):
        s.arrow(x, 142, x + 34, 142, color="#1e4f8a", w=2, head=8)
    s.text(118, 186, "CURRENT = how much flows", size=12.5, weight=800, fill=BLUE, anchor="start")
    s.text(348, 108, "RESISTANCE", size=12.5, weight=800, fill=RED)
    s.text(348, 203, "narrow pipe restricts flow", size=11, weight=600, fill=RED)
    s.arrow(348, 116, 348, 132, color=RED, w=1.6, head=7)
    for k in range(3):
        s.circle(606 + k * 8, 148 + k * 9, 3, fill=WATER, stroke="#1e4f8a", w=1)
    s.text(500, 108, "POWER = the work done", size=12, weight=800, fill=GREEN)
    return s.svg()


@fig
def ei_ohm_triangle():
    s = Svg(600, 200)
    def tri(x, top_label, l, r, col):
        s.poly([(x, 20), (x - 85, 170), (x + 85, 170)], fill="#ffffff", stroke=col, w=2.6)
        s.line(x - 57, 120, x + 57, 120, stroke=col, w=2)
        s.line(x, 120, x, 170, stroke=col, w=2)
        s.text(x, 84, top_label, size=30, weight=800, fill=col)
        s.text(x - 30, 148, l, size=26, weight=800, fill=col)
        s.text(x + 30, 148, r, size=26, weight=800, fill=col)
    tri(110, "E", "I", "R", ACC)
    tri(390, "P", "I", "E", BLUE)
    s.text(110, 192, "Ohm's law", size=12.5, weight=700, fill=MUTED)
    s.text(390, 192, "Power", size=12.5, weight=700, fill=MUTED)
    rows = [("E = I × R", ACC), ("I = E ÷ R", ACC), ("R = E ÷ I", ACC)]
    for k, (t, c) in enumerate(rows):
        s.text(212, 70 + k * 30, t, size=14, weight=800, fill=c, anchor="start")
    rows = [("P = I × E", BLUE), ("I = P ÷ E", BLUE), ("E = P ÷ I", BLUE)]
    for k, (t, c) in enumerate(rows):
        s.text(492, 70 + k * 30, t, size=14, weight=800, fill=c, anchor="start")
    return s.svg()


def zig(s, x1, y1, x2, y2, n=3, amp=7, col=INK, w=2.2):
    s.polyline(spring_points(x1, y1, x2, y2, coils=n, amp=amp), stroke=col, w=w)


def battery_v(s, x, ymid, col=INK):
    s.line(x - 15, ymid - 5, x + 15, ymid - 5, stroke=col, w=2.4)
    s.line(x - 8, ymid + 5, x + 8, ymid + 5, stroke=col, w=4)
    s.text(x + 22, ymid - 8, "+", size=13, weight=800, fill=col)


@fig
def ei_series_parallel():
    s = Svg(660, 230)
    L, T, R, B = 30, 50, 290, 180
    s.polyline([(L, 110), (L, T), (80, T)], w=2.2)
    zig(s, 80, T, 130, T)
    s.line(130, T, 160, T, w=2.2)
    zig(s, 160, T, 210, T)
    s.line(210, T, 240, T, w=2.2)
    zig(s, 240, T, R, T)
    s.polyline([(R, T), (R, B), (L, B), (L, 120)], w=2.2)
    battery_v(s, L, 115)
    for x, lab in ((105, "R1"), (185, "R2"), (265, "R3")):
        s.text(x, T - 18, lab, size=12, weight=700, fill=MUTED)
    s.arrow(120, B + 0.1, 200, B + 0.1, color=ACC, w=2.6, head=10)
    s.text(160, 205, "SERIES: one path for current", size=13, weight=800)
    ox = 360
    s.polyline([(ox, 110), (ox, T), (ox + 270, T)], w=2.2)
    s.polyline([(ox, 120), (ox, B), (ox + 270, B)], w=2.2)
    battery_v(s, ox, 115)
    for k, x in enumerate((ox + 90, ox + 180, ox + 270)):
        s.line(x, T, x, T + 35, w=2.2)
        zig(s, x, T + 35, x, B - 35)
        s.line(x, B - 35, x, B, w=2.2)
        s.text(x + 22, (T + B) / 2, f"R{k + 1}", size=12, weight=700, fill=MUTED, anchor="start")
        s.circle(x, T, 3.5, fill=INK, stroke=INK, w=1)
        s.circle(x, B, 3.5, fill=INK, stroke=INK, w=1)
    s.arrow(ox + 110, T - 12, ox + 160, T - 12, color=ACC, w=2.2, head=9)
    s.text(ox + 150, 205, "PARALLEL: separate branches", size=13, weight=800)
    return s.svg()


def sym_cell(s, cx, cy, label):
    s.text(cx, cy + 34, label, size=11.5, weight=700, fill=INK)


@fig
def ei_symbols():
    s = Svg(660, 360)
    cols = [82, 246, 410, 574]
    rows = [40, 125, 210, 295]
    def lead(cx, cy, a, b):
        s.line(cx - 55, cy, cx + a, cy, w=2.2)
        s.line(cx + b, cy, cx + 55, cy, w=2.2)
    cx, cy = cols[0], rows[0]
    lead(cx, cy, -24, 24)
    zig(s, cx - 24, cy, cx + 24, cy)
    sym_cell(s, cx, cy, "Resistor")
    cx, cy = cols[1], rows[0]
    lead(cx, cy, -24, 24)
    zig(s, cx - 24, cy, cx + 24, cy)
    s.arrow(cx - 22, cy + 18, cx + 24, cy - 20, color=ACC, w=2, head=8)
    sym_cell(s, cx, cy, "Variable resistor")
    cx, cy = cols[2], rows[0]
    lead(cx, cy, -5, 5)
    s.line(cx - 5, cy - 15, cx - 5, cy + 15, w=2.6)
    s.line(cx + 5, cy - 15, cx + 5, cy + 15, w=2.6)
    sym_cell(s, cx, cy, "Capacitor")
    cx, cy = cols[3], rows[0]
    lead(cx, cy, -32, 32)
    d = f"M{cx - 32},{cy}"
    for k in range(4):
        d += f" a8,8 0 0 1 16,0"
    s.path(d, w=2.2)
    sym_cell(s, cx, cy, "Inductor (coil)")
    cx, cy = cols[0], rows[1]
    lead(cx, cy, -6, 6)
    s.line(cx - 6, cy - 16, cx - 6, cy + 16, w=2.4)
    s.line(cx + 6, cy - 8, cx + 6, cy + 8, w=4.5)
    s.text(cx - 16, cy - 14, "+", size=12, weight=800)
    sym_cell(s, cx, cy, "Battery / cell")
    cx, cy = cols[1], rows[1]
    s.line(cx, cy - 22, cx, cy + 2, w=2.2)
    s.line(cx - 18, cy + 2, cx + 18, cy + 2, w=2.4)
    s.line(cx - 12, cy + 9, cx + 12, cy + 9, w=2.4)
    s.line(cx - 6, cy + 16, cx + 6, cy + 16, w=2.4)
    s.text(cx, cy + 34, "Ground", size=11.5, weight=700)
    cx, cy = cols[2], rows[1]
    lead(cx, cy, -12, 12)
    s.poly([(cx - 12, cy - 12), (cx - 12, cy + 12), (cx + 12, cy)], fill=INK, stroke=INK, w=1.5)
    s.line(cx + 12, cy - 12, cx + 12, cy + 12, w=2.6)
    sym_cell(s, cx, cy, "Diode")
    cx, cy = cols[3], rows[1]
    lead(cx, cy, -12, 12)
    s.poly([(cx - 12, cy - 12), (cx - 12, cy + 12), (cx + 12, cy)], fill=INK, stroke=INK, w=1.5)
    s.line(cx + 12, cy - 12, cx + 12, cy + 12, w=2.6)
    s.arrow(cx + 2, cy - 14, cx + 16, cy - 28, color=ACC, w=1.6, head=6)
    s.arrow(cx + 10, cy - 10, cx + 24, cy - 24, color=ACC, w=1.6, head=6)
    sym_cell(s, cx, cy, "LED")
    cx, cy = cols[0], rows[2]
    lead(cx, cy, -20, 20)
    s.circle(cx - 20, cy, 3, fill=INK, stroke=INK, w=1)
    s.circle(cx + 20, cy, 3, fill="#ffffff", stroke=INK, w=1.6)
    s.line(cx - 20, cy, cx + 18, cy - 16, w=2.4)
    sym_cell(s, cx, cy, "Switch (open)")
    cx, cy = cols[1], rows[2]
    lead(cx, cy, -20, 20)
    s.rect(cx - 20, cy - 7, 40, 14, fill="#ffffff", stroke=INK, sw=2)
    s.line(cx - 20, cy, cx + 20, cy, w=1.6)
    sym_cell(s, cx, cy, "Fuse")
    cx, cy = cols[2], rows[2]
    lead(cx, cy, -14, 14)
    s.circle(cx, cy, 14, fill="#ffffff", stroke=INK, w=2.2)
    s.line(cx - 10, cy - 10, cx + 10, cy + 10, w=2)
    s.line(cx - 10, cy + 10, cx + 10, cy - 10, w=2)
    sym_cell(s, cx, cy, "Lamp")
    cx, cy = cols[3], rows[2]
    for side in (-1, 1):
        x0 = cx + side * 14
        d = f"M{x0},{cy - 20}"
        for k in range(4):
            d += f" a5,5 0 0 {1 if side > 0 else 0} 0,10"
        s.path(d, w=2.2)
        s.line(x0, cy - 20, cx + side * 40, cy - 20, w=2.2)
        s.line(x0, cy + 20, cx + side * 40, cy + 20, w=2.2)
    s.line(cx - 3, cy - 22, cx - 3, cy + 22, w=2)
    s.line(cx + 3, cy - 22, cx + 3, cy + 22, w=2)
    s.text(cx, cy + 36, "Transformer", size=11.5, weight=700)
    cx, cy = cols[0], rows[3]
    s.circle(cx, cy, 22, fill="#ffffff", stroke=INK, w=2)
    s.line(cx - 6, cy - 13, cx - 6, cy + 13, w=3)
    s.line(cx - 50, cy, cx - 6, cy, w=2.2)
    s.line(cx - 6, cy - 5, cx + 14, cy - 20, w=2.2)
    s.line(cx + 14, cy - 20, cx + 14, cy - 34, w=2.2)
    s.line(cx - 6, cy + 5, cx + 14, cy + 20, w=2.2)
    s.line(cx + 14, cy + 20, cx + 14, cy + 34, w=2.2)
    s.head(cx + 12, cy + 18.5, math.atan2(15, 20), INK, 8)
    s.text(cx - 44, cy - 8, "B", size=10, weight=800, fill=MUTED)
    s.text(cx + 24, cy - 28, "C", size=10, weight=800, fill=MUTED)
    s.text(cx + 24, cy + 30, "E", size=10, weight=800, fill=MUTED)
    s.text(cx, cy + 46, "Transistor (NPN)", size=11.5, weight=700)
    cx, cy = cols[1], rows[3]
    lead(cx, cy, -16, 16)
    s.circle(cx, cy, 16, fill="#ffffff", stroke=INK, w=2.2)
    s.path(f"M{cx - 10},{cy} q5,-12 10,0 t10,0", w=2)
    s.text(cx, cy + 34, "AC source", size=11.5, weight=700)
    cx, cy = cols[2], rows[3]
    lead(cx, cy, -16, 16)
    s.circle(cx, cy, 16, fill="#ffffff", stroke=INK, w=2.2)
    s.text(cx, cy + 1, "A", size=15, weight=800)
    s.text(cx, cy + 34, "Ammeter (current)", size=11.5, weight=700)
    cx, cy = cols[3], rows[3]
    lead(cx, cy, -16, 16)
    s.circle(cx, cy, 16, fill="#ffffff", stroke=INK, w=2.2)
    s.text(cx, cy + 1, "V", size=15, weight=800)
    s.text(cx, cy + 34, "Voltmeter (voltage)", size=11.5, weight=700)
    return s.svg()


@fig
def ei_resistor():
    s = Svg(600, 170)
    s.line(30, 100, 170, 100, stroke="#8a8f98", w=4)
    s.line(430, 100, 570, 100, stroke="#8a8f98", w=4)
    s.rect(170, 72, 260, 56, fill="#e8d3a9", stroke="#a8875a", sw=2, rx=26)
    bands = [(205, "#f2c94c", "4", "1st digit"), (260, "#7b3fa0", "7", "2nd digit"), (315, "#d93a3a", "× 100", "multiplier"), (392, "#c9a227", "± 5%", "tolerance")]
    for x, col, val, name in bands:
        s.rect(x - 9, 72, 18, 56, fill=col, stroke="#00000033", sw=0.8)
        s.line(x, 70, x, 44, stroke=MUTED, w=1)
        s.text(x, 34, val, size=14, weight=800)
        s.text(x, 18, name, size=10.5, weight=700, fill=MUTED)
    s.text(300, 152, "47 × 100 = 4,700 Ω  (4.7 kΩ), ±5%", size=14, weight=800, fill=ACC)
    return s.svg()


def valve(s, x, open_, side):
    y = 70 if open_ else 58
    s.line(x, 30, x, y, stroke=INK, w=3)
    s.poly([(x - 10, y), (x + 10, y), (x + 6, y - 5), (x - 6, y - 5)], fill="#9aa3ae", stroke=INK, w=1.4)


@fig
def ai_four_stroke():
    s = Svg(680, 330)
    stages = [
        ("1. Intake", "intake valve open;", "piston moves down", True, False, 150, "down", WATER, False),
        ("2. Compression", "both valves closed;", "piston moves up", False, False, 92, "up", "#6aa6dd", False),
        ("3. Power", "spark ignites the mixture;", "piston is forced down", False, False, 150, "down", "#f6a65a", True),
        ("4. Exhaust", "exhaust valve open;", "piston moves up", False, True, 92, "up", "#b8bec7", False),
    ]
    for i, (title, d1, d2, iv, ev, py, direc, gas, spark) in enumerate(stages):
        cx = 85 + i * 170
        L, R = cx - 40, cx + 40
        s.rect(L - 6, 40, 92, 18, fill="#cfd5dd", stroke=INK, sw=1.6)
        s.rect(L - 30, 22, 26, 14, fill="#e9edf2", stroke=INK, sw=1.4)
        s.rect(R + 4, 22, 26, 14, fill="#e9edf2", stroke=INK, sw=1.4)
        s.rect(L, 58, 80, py - 58, fill=gas, stroke="none", sw=0)
        s.line(L, 58, L, 200, stroke=INK, w=3)
        s.line(R, 58, R, 200, stroke=INK, w=3)
        valve(s, cx - 20, iv, "in")
        valve(s, cx + 20, ev, "ex")
        s.rect(cx - 4, 26, 8, 22, fill="#ffffff", stroke=INK, sw=1.4)
        if spark:
            for a in range(0, 360, 45):
                x2, y2 = pol(cx, 66, 12, a)
                s.line(cx, 66, x2, y2, stroke="#d97706", w=2)
        s.rect(L + 3, py, 74, 30, fill="#8b939e", stroke=INK, sw=1.8, rx=3)
        s.line(L + 3, py + 8, R - 3, py + 8, stroke=INK, w=1)
        crank_y = 245
        ang = 270 if direc == "down" else 90
        pinx, piny = pol(cx, crank_y, 16, ang + (20 if direc == "down" else -20))
        s.circle(cx, crank_y, 24, fill="#eef1f4", stroke=INK, w=1.8)
        s.line(cx, py + 26, pinx, piny, stroke=INK, w=5)
        s.circle(pinx, piny, 5, fill=INK, stroke=INK, w=1)
        s.circle(cx, crank_y, 4, fill=INK, stroke=INK, w=1)
        if direc == "down":
            s.arrow(R + 18, py - 10, R + 18, py + 30, color=ACC, w=2.6, head=9)
        else:
            s.arrow(R + 18, py + 40, R + 18, py, color=ACC, w=2.6, head=9)
        if iv:
            s.arrow(L - 26, 14, cx - 26, 52, color="#1e4f8a", w=2, head=7)
        if ev:
            s.arrow(cx + 26, 52, R + 26, 14, color="#4b5563", w=2, head=7)
        s.text(cx, 290, title, size=13.5, weight=800)
        s.text(cx, 307, d1, size=10.5, weight=600, fill=MUTED)
        s.text(cx, 321, d2, size=10.5, weight=600, fill=MUTED)
    return s.svg()


@fig
def ai_drivetrain():
    s = Svg(680, 110)
    boxes = ["Engine", "Clutch or torque converter", "Transmission", "Driveshaft (U-joints)", "Differential", "Axles and wheels"]
    w, gap = 96, 16
    for k, name in enumerate(boxes):
        x = 6 + k * (w + gap)
        words = name.split(" ")
        if len(name) > 13:
            mid = len(words) // 2 if len(words) > 2 else 1
            lines = [" ".join(words[:mid]), " ".join(words[mid:])]
        else:
            lines = [name]
        fill = ACC_S if k == 0 else (BLUE_S if k in (2, 4) else SOFT)
        box(s, x, 24, w, 58, lines, fill=fill, stroke=INK, size=11.5)
        if k < len(boxes) - 1:
            s.arrow(x + w + 1, 53, x + w + gap - 1, 53, color=ACC, w=2, head=7)
    return s.svg()


STEEL = "#b7bec8"
STEEL_D = "#5f6773"
GRIP = "#d9534f"


def t_claw_hammer(t):
    t.rect(72, 30, 14, 72, fill=WOOD, stroke="#8a6a3c", sw=1.5, rx=6)
    t.rect(30, 12, 8, 22, fill=STEEL, stroke=STEEL_D, sw=1.5, rx=2)
    t.rect(38, 15, 58, 16, fill=STEEL, stroke=STEEL_D, sw=1.5, rx=3)
    t.path("M96,15 Q122,13 134,44 L127,47 Q116,27 96,31 Z", fill=STEEL, stroke=STEEL_D, w=1.5)


def t_ballpeen(t):
    t.rect(72, 30, 14, 72, fill=WOOD, stroke="#8a6a3c", sw=1.5, rx=6)
    t.rect(30, 12, 8, 22, fill=STEEL, stroke=STEEL_D, sw=1.5, rx=2)
    t.rect(38, 15, 64, 16, fill=STEEL, stroke=STEEL_D, sw=1.5, rx=3)
    t.rect(100, 18, 10, 10, fill=STEEL, stroke=STEEL_D, sw=1.5)
    t.circle(118, 23, 11, fill=STEEL, stroke=STEEL_D, w=1.5)


def t_comb_wrench(t):
    t.rect(34, 45, 92, 14, fill=STEEL, stroke=STEEL_D, sw=1.5, rx=6)
    t.circle(28, 52, 17, fill=STEEL, stroke=STEEL_D, w=1.5)
    t.poly([(4, 43), (26, 46), (26, 58), (4, 61)], fill="#ffffff", stroke=STEEL_D, w=1.5)
    t.circle(134, 52, 17, fill=STEEL, stroke=STEEL_D, w=1.5)
    hexp = [pol(134, 52, 9, a) for a in range(0, 360, 60)]
    t.poly(hexp, fill="#ffffff", stroke=STEEL_D, w=1.5)
    t.text(80, 82, "open end · box end", size=9.5, fill=MUTED, weight=600)


def t_adj_wrench(t):
    t.rect(52, 46, 92, 15, fill=STEEL, stroke=STEEL_D, sw=1.5, rx=7)
    t.path("M58,40 L58,68 Q30,72 18,56 L6,56 L6,46 L22,46 Q30,36 58,40 Z", fill=STEEL, stroke=STEEL_D, w=1.5)
    t.rect(6, 28, 22, 12, fill=STEEL, stroke=STEEL_D, sw=1.5, rx=2)
    t.rect(30, 52, 16, 10, fill="#8f98a3", stroke=STEEL_D, sw=1)
    for x in range(32, 46, 3):
        t.line(x, 52, x, 62, stroke=STEEL_D, w=0.8)


def t_pipe_wrench(t):
    t.rect(40, 54, 104, 14, fill="#c0392b", stroke="#7d241b", sw=1.5, rx=5)
    t.rect(22, 24, 22, 44, fill="#c0392b", stroke="#7d241b", sw=1.5, rx=3)
    t.rect(8, 22, 14, 12, fill=STEEL, stroke=STEEL_D, sw=1.5)
    t.polyline([(8, 34), (11, 38), (14, 34), (17, 38), (20, 34)], stroke=STEEL_D, w=1.2)
    t.rect(8, 44, 14, 12, fill=STEEL, stroke=STEEL_D, sw=1.5)
    t.polyline([(8, 44), (11, 40), (14, 44), (17, 40), (20, 44)], stroke=STEEL_D, w=1.2)
    t.rect(24, 30, 18, 8, fill="#8f98a3", stroke=STEEL_D, sw=1)


def pliers(t, jaw_len, jaw_w, grip=GRIP, lock=False):
    jx = 64
    t.path(f"M{jx},48 Q100,40 146,26 L148,34 Q104,50 {jx},56 Z", fill=grip, stroke="#7d241b", w=1.3)
    t.path(f"M{jx},56 Q100,64 146,80 L144,88 Q100,72 {jx},62 Z", fill=grip, stroke="#7d241b", w=1.3)
    t.path(f"M{jx + 4},50 L{jx - jaw_len},{55 - jaw_w / 2} L{jx - jaw_len},55 L{jx + 4},58 Z", fill=STEEL, stroke=STEEL_D, w=1.3)
    t.path(f"M{jx + 4},54 L{jx - jaw_len},55 L{jx - jaw_len},{55 + jaw_w / 2} L{jx + 4},62 Z", fill=STEEL, stroke=STEEL_D, w=1.3)
    t.circle(jx, 55, 6, fill=STEEL, stroke=STEEL_D, w=1.5)
    if lock:
        t.rect(146, 22, 12, 16, fill=STEEL, stroke=STEEL_D, sw=1.3, rx=3)


def t_slip_pliers(t):
    pliers(t, 34, 18)


def t_needle_pliers(t):
    jx = 64
    t.path(f"M{jx},48 Q100,40 146,26 L148,34 Q104,50 {jx},56 Z", fill="#e3a21a", stroke="#8a5d00", w=1.3)
    t.path(f"M{jx},56 Q100,64 146,80 L144,88 Q100,72 {jx},62 Z", fill="#e3a21a", stroke="#8a5d00", w=1.3)
    t.poly([(jx + 4, 50), (6, 54), (jx + 4, 60)], fill=STEEL, stroke=STEEL_D, w=1.3)
    t.line(jx + 2, 55, 8, 54.5, stroke=STEEL_D, w=1)
    t.circle(jx, 55, 6, fill=STEEL, stroke=STEEL_D, w=1.5)


def t_locking_pliers(t):
    pliers(t, 30, 22, grip=STEEL, lock=True)
    t.line(98, 64, 128, 74, stroke=STEEL_D, w=3)


def t_hacksaw(t):
    t.path("M10,62 L10,26 L118,26 L118,62", fill="none", stroke=BLUE, w=5)
    t.line(10, 62, 118, 62, stroke=STEEL_D, w=2)
    for x in range(12, 118, 5):
        t.line(x, 62, x + 2.5, 66, stroke=STEEL_D, w=1)
    t.path("M118,40 L140,40 Q152,44 150,70 L136,72 Q134,52 118,52 Z", fill=BLUE, stroke="#1e4f8a", w=1.5)


def t_coping_saw(t):
    t.path("M18,70 L18,22 Q18,14 26,14 L104,14 Q112,14 112,22 L112,70", fill="none", stroke=STEEL_D, w=4)
    t.line(18, 70, 112, 70, stroke=STEEL_D, w=1.4)
    t.rect(112, 64, 40, 13, fill=WOOD, stroke="#8a6a3c", sw=1.5, rx=6)


def t_chisel(t):
    t.rect(92, 44, 56, 18, fill=WOOD, stroke="#8a6a3c", sw=1.5, rx=7)
    t.rect(84, 45, 10, 16, fill="#9aa3ae", stroke=STEEL_D, sw=1.3)
    t.poly([(84, 47), (20, 47), (8, 56), (20, 59), (84, 59)], fill=STEEL, stroke=STEEL_D, w=1.5)


def t_c_clamp(t):
    t.path("M30,20 L100,20 L100,30 L40,30 L40,80 L100,80 L100,90 L30,90 Z", fill="#3b5bdb", stroke="#1e3a8a", w=1.5)
    t.rect(96, 30, 8, 8, fill="#3b5bdb", stroke="#1e3a8a", sw=1)
    t.line(100, 38, 100, 66, stroke=STEEL_D, w=4)
    t.rect(92, 64, 16, 6, fill=STEEL, stroke=STEEL_D, sw=1)
    t.line(88, 34, 112, 34, stroke=STEEL_D, w=3)
    for k in range(6):
        t.line(97, 41 + k * 4, 103, 43 + k * 4, stroke="#ffffff", w=0.8)


@fig
def si_tools():
    items = [
        (t_claw_hammer, "Claw hammer"), (t_ballpeen, "Ball-peen hammer"), (t_comb_wrench, "Combination wrench"), (t_adj_wrench, "Adjustable wrench"),
        (t_pipe_wrench, "Pipe wrench"), (t_slip_pliers, "Slip-joint pliers"), (t_needle_pliers, "Needle-nose pliers"), (t_locking_pliers, "Locking pliers"),
        (t_hacksaw, "Hacksaw"), (t_coping_saw, "Coping saw"), (t_chisel, "Wood chisel"), (t_c_clamp, "C-clamp"),
    ]
    s = Svg(680, 400)
    for k, (fn, name) in enumerate(items):
        r, c = divmod(k, 4)
        x0, y0 = 8 + c * 168, 6 + r * 132
        s.rect(x0, y0, 160, 124, fill="#f7f8fa", stroke=LINE, sw=1, rx=6)
        t = Svg(160, 124)
        fn(t)
        s.group("".join(t.parts), tx=x0 + 2, ty=y0 + 4)
        s.text(x0 + 80, y0 + 112, name, size=12, weight=800)
    return s.svg()


@fig
def si_ruler():
    s = Svg(640, 150)
    x0, unit = 50, 520 / 16
    s.rect(30, 56, 580, 70, fill="#f3dfb6", stroke="#a8875a", sw=1.5, rx=3)
    names = {1: "1/16", 2: "1/8", 3: "3/16", 4: "1/4", 5: "5/16", 6: "3/8", 7: "7/16", 8: "1/2", 9: "9/16", 10: "5/8", 11: "11/16", 12: "3/4", 13: "13/16", 14: "7/8", 15: "15/16"}
    for k in range(17):
        x = x0 + k * unit
        if k in (0, 16):
            h = 56
        elif k == 8:
            h = 44
        elif k % 4 == 0:
            h = 34
        elif k % 2 == 0:
            h = 25
        else:
            h = 16
        s.line(x, 56, x, 56 + h, stroke=INK, w=2 if k % 4 == 0 else 1.4, cap="butt")
        if k in names:
            col = ACC if k % 4 == 0 else (BLUE if k % 2 == 0 else MUTED)
            s.text(x, 40 if k % 2 == 0 else 24, names[k], size=11 if k % 2 == 0 else 9.5, weight=800 if k % 2 == 0 else 600, fill=col)
    s.text(x0, 140, "0", size=12, weight=800)
    s.text(x0 + 16 * unit, 140, "1 inch", size=12, weight=800)
    return s.svg()


@fig
def si_drives():
    s = Svg(640, 140)
    names = ["Slotted (flat)", "Phillips", "Torx (star)", "Square (Robertson)", "Hex (Allen)"]
    for k, name in enumerate(names):
        cx, cy = 66 + k * 127, 56
        s.circle(cx, cy, 38, fill=STEEL, stroke=STEEL_D, w=2)
        if k == 0:
            s.rect(cx - 28, cy - 5, 56, 10, fill="#2d333b", stroke="#2d333b", sw=1)
        elif k == 1:
            s.poly([(cx - 5, cy - 24), (cx + 5, cy - 24), (cx + 4, cy - 5), (cx + 24, cy - 5), (cx + 24, cy + 5), (cx + 4, cy + 5), (cx + 5, cy + 24), (cx - 5, cy + 24), (cx - 4, cy + 5), (cx - 24, cy + 5), (cx - 24, cy - 5), (cx - 4, cy - 5)], fill="#2d333b", stroke="#2d333b", w=1)
        elif k == 2:
            pts = []
            for a in range(0, 360, 30):
                r = 18 if (a // 30) % 2 == 0 else 10
                pts.append(pol(cx, cy, r, a + 90))
            s.poly(pts, fill="#2d333b", stroke="#2d333b", w=1)
        elif k == 3:
            s.rect(cx - 11, cy - 11, 22, 22, fill="#2d333b", stroke="#2d333b", sw=1)
        else:
            s.poly([pol(cx, cy, 15, a) for a in range(0, 360, 60)], fill="#2d333b", stroke="#2d333b", w=1)
        s.text(cx, 118, name, size=12, weight=800)
    return s.svg()


def thread_shank(s, x, y1, y2, w, pitch=6, taper=False, point=False):
    pts_l, pts_r = [], []
    y = y1
    k = 0
    while y <= y2:
        frac = (y - y1) / max(1, (y2 - y1))
        ww = w * (1 - 0.55 * frac) if taper else w
        off = 2.5 if k % 2 == 0 else -1
        pts_l.append((x - ww / 2 - off, y))
        pts_r.append((x + ww / 2 + off, y + pitch / 2))
        y += pitch / 2
        k += 1
    tip = (x, y2 + (12 if point else 0))
    s.poly([(x - w / 2, y1)] + pts_l + [tip] + list(reversed(pts_r)) + [(x + w / 2, y1)], fill=STEEL, stroke=STEEL_D, w=1.2)


@fig
def si_fasteners():
    s = Svg(680, 330)
    def label(x, y, t):
        s.text(x, y, t, size=11, weight=800)
    y0 = 18
    x = 40
    s.rect(x - 9, y0, 18, 4, fill=STEEL, stroke=STEEL_D, sw=1)
    s.poly([(x - 3, y0 + 4), (x + 3, y0 + 4), (x + 3, y0 + 92), (x, y0 + 102), (x - 3, y0 + 92)], fill=STEEL, stroke=STEEL_D, w=1.2)
    label(x, 140, "Common nail")
    x = 130
    s.rect(x - 4.5, y0 + 2, 9, 5, fill=STEEL, stroke=STEEL_D, sw=1, rx=2)
    s.poly([(x - 2, y0 + 7), (x + 2, y0 + 7), (x + 2, y0 + 92), (x, y0 + 100), (x - 2, y0 + 92)], fill=STEEL, stroke=STEEL_D, w=1.2)
    label(x, 140, "Finishing nail")
    x = 220
    s.rect(x - 15, y0 + 40, 30, 4, fill=STEEL, stroke=STEEL_D, sw=1)
    s.poly([(x - 2.5, y0 + 44), (x + 2.5, y0 + 44), (x + 2.5, y0 + 92), (x, y0 + 100), (x - 2.5, y0 + 92)], fill=STEEL, stroke=STEEL_D, w=1.2)
    label(x, 140, "Roofing nail")
    x = 310
    s.rect(x - 9, y0, 18, 4, fill=STEEL, stroke=STEEL_D, sw=1)
    s.rect(x - 9, y0 + 14, 18, 4, fill=STEEL, stroke=STEEL_D, sw=1)
    s.poly([(x - 3, y0 + 4), (x + 3, y0 + 4), (x + 3, y0 + 92), (x, y0 + 102), (x - 3, y0 + 92)], fill=STEEL, stroke=STEEL_D, w=1.2)
    label(x, 140, "Duplex nail")
    x = 400
    s.poly([(x - 13, y0), (x + 13, y0), (x + 5, y0 + 9), (x - 5, y0 + 9)], fill=STEEL, stroke=STEEL_D, w=1.2)
    s.line(x - 6, y0 + 1, x + 6, y0 + 1, stroke="#2d333b", w=2)
    s.rect(x - 4, y0 + 9, 8, 20, fill=STEEL, stroke=STEEL_D, sw=1)
    thread_shank(s, x, y0 + 29, y0 + 88, 9, pitch=7, taper=True, point=True)
    label(x, 140, "Wood screw")
    x = 490
    s.path(f"M{x - 12},{y0 + 10} Q{x},{y0 - 4} {x + 12},{y0 + 10} Z", fill=STEEL, stroke=STEEL_D, w=1.2)
    thread_shank(s, x, y0 + 10, y0 + 88, 8, pitch=6, point=True)
    label(x, 140, "Sheet-metal screw")
    x = 590
    s.path(f"M{x - 12},{y0 + 12} Q{x},{y0} {x + 12},{y0 + 12} Z", fill=STEEL, stroke=STEEL_D, w=1.2)
    thread_shank(s, x, y0 + 12, y0 + 90, 8, pitch=4)
    label(x, 140, "Machine screw")
    y1 = 168
    x = 50
    s.rect(x - 11, y1, 22, 13, fill=STEEL, stroke=STEEL_D, sw=1.2)
    s.line(x - 4, y1, x - 4, y1 + 13, stroke=STEEL_D, w=1)
    s.line(x + 4, y1, x + 4, y1 + 13, stroke=STEEL_D, w=1)
    thread_shank(s, x, y1 + 13, y1 + 98, 12, pitch=9, taper=False, point=True)
    label(x, 310, "Lag screw")
    x = 150
    s.path(f"M{x - 16},{y1 + 12} Q{x},{y1 - 4} {x + 16},{y1 + 12} Z", fill=STEEL, stroke=STEEL_D, w=1.2)
    s.rect(x - 6, y1 + 12, 12, 10, fill="#9aa3ae", stroke=STEEL_D, sw=1.2)
    s.rect(x - 5, y1 + 22, 10, 30, fill=STEEL, stroke=STEEL_D, sw=1)
    thread_shank(s, x, y1 + 52, y1 + 104, 10, pitch=5)
    label(x, 310, "Carriage bolt")
    x = 250
    s.rect(x - 12, y1, 24, 12, fill=STEEL, stroke=STEEL_D, sw=1.2)
    s.line(x - 4, y1, x - 4, y1 + 12, stroke=STEEL_D, w=1)
    s.line(x + 4, y1, x + 4, y1 + 12, stroke=STEEL_D, w=1)
    s.rect(x - 5, y1 + 12, 10, 40, fill=STEEL, stroke=STEEL_D, sw=1)
    thread_shank(s, x, y1 + 52, y1 + 104, 10, pitch=5)
    label(x, 310, "Hex bolt")
    cx, cy = 350, y1 + 50
    s.poly([pol(cx, cy, 26, a + 30) for a in range(0, 360, 60)], fill=STEEL, stroke=STEEL_D, w=1.5)
    s.circle(cx, cy, 11, fill="#ffffff", stroke=STEEL_D, w=1.5)
    label(cx, 310, "Hex nut")
    cx = 450
    s.path(f"M{cx - 12},{cy - 6} L{cx - 40},{cy - 30} Q{cx - 48},{cy - 10} {cx - 12},{cy + 8} Z", fill=STEEL, stroke=STEEL_D, w=1.4)
    s.path(f"M{cx + 12},{cy - 6} L{cx + 40},{cy - 30} Q{cx + 48},{cy - 10} {cx + 12},{cy + 8} Z", fill=STEEL, stroke=STEEL_D, w=1.4)
    s.circle(cx, cy, 15, fill=STEEL, stroke=STEEL_D, w=1.4)
    s.circle(cx, cy, 7, fill="#ffffff", stroke=STEEL_D, w=1.4)
    label(cx, 310, "Wing nut")
    cx = 540
    s.circle(cx, cy, 24, fill=STEEL, stroke=STEEL_D, w=1.5)
    s.circle(cx, cy, 10, fill="#ffffff", stroke=STEEL_D, w=1.5)
    label(cx, 310, "Flat washer")
    cx = 625
    s.path(f"M{cx + 4},{cy - 20} A20,20 0 1 1 {cx - 4},{cy - 20}", stroke=STEEL_D, w=9, cap="butt")
    s.path(f"M{cx + 4},{cy - 20} A20,20 0 1 1 {cx - 4},{cy - 20}", stroke=STEEL, w=6, cap="butt")
    label(cx, 310, "Lock washer")
    return s.svg()


def fulcrum(s, x, y, size=18):
    s.poly([(x, y), (x - size * 0.8, y + size * 1.2), (x + size * 0.8, y + size * 1.2)], fill="#9aa3ae", stroke=INK, w=1.6)


def load_box(s, x, ybottom, label, w=40, h=30, fill=ACC_S, stroke=ACC):
    s.rect(x - w / 2, ybottom - h, w, h, fill=fill, stroke=stroke, sw=1.8, rx=3)
    s.text(x, ybottom - h / 2, label, size=11.5, weight=800, fill="#7a3b06")


def beam(s, x1, x2, y, t=8):
    s.rect(x1, y - t / 2, x2 - x1, t, fill=WOOD, stroke="#8a6a3c", sw=1.5, rx=2)


@fig
def mc_levers():
    s = Svg(690, 190)
    titles = [("Class 1", "fulcrum in the middle", "seesaw, crowbar, pliers"), ("Class 2", "load in the middle", "wheelbarrow, nutcracker"), ("Class 3", "effort in the middle", "tweezers, broom, forearm")]
    for k, (t1, t2, t3) in enumerate(titles):
        x0 = 10 + k * 228
        y = 82
        beam(s, x0 + 12, x0 + 208, y)
        if k == 0:
            load_box(s, x0 + 32, y - 4, "Load")
            fulcrum(s, x0 + 92, y + 4)
            s.arrow(x0 + 196, y - 50, x0 + 196, y - 6, color=BLUE, w=2.6, head=10)
            s.text(x0 + 196, y - 58, "Effort", size=11, weight=800, fill=BLUE)
            s.text(x0 + 92, y + 40, "Fulcrum", size=10.5, weight=700, fill=MUTED)
        elif k == 1:
            fulcrum(s, x0 + 22, y + 4)
            load_box(s, x0 + 100, y - 4, "Load")
            s.arrow(x0 + 196, y + 46, x0 + 196, y + 6, color=BLUE, w=2.6, head=10)
            s.text(x0 + 196, y + 56, "Effort", size=11, weight=800, fill=BLUE)
            s.text(x0 + 22, y + 40, "Fulcrum", size=10.5, weight=700, fill=MUTED)
        else:
            fulcrum(s, x0 + 22, y + 4)
            s.arrow(x0 + 100, y + 46, x0 + 100, y + 6, color=BLUE, w=2.6, head=10)
            s.text(x0 + 100, y + 56, "Effort", size=11, weight=800, fill=BLUE)
            load_box(s, x0 + 186, y - 4, "Load")
            s.text(x0 + 22, y + 40, "Fulcrum", size=10.5, weight=700, fill=MUTED)
        s.text(x0 + 110, 150, f"{t1}: {t2}", size=12.5, weight=800)
        s.text(x0 + 110, 168, t3, size=11, weight=600, fill=MUTED)
    return s.svg()


def ceiling(s, x1, x2, y):
    s.line(x1, y, x2, y, stroke=INK, w=2.2)
    for x in range(int(x1), int(x2), 9):
        s.line(x, y, x + 7, y - 7, stroke=MUTED, w=1)


def sheave(s, cx, cy, r):
    s.circle(cx, cy, r, fill="#dfe4ea", stroke=INK, w=2)
    s.circle(cx, cy, 3, fill=INK, stroke=INK, w=1)


def block_tackle(s, cx, load_label, effort_label, top=24):
    ceiling(s, cx - 70, cx + 60, top)
    yU, yL, r = top + 34, top + 128, 10
    s.line(cx + 10, top, cx + 10, yU - 16, w=2)
    s.rect(cx - 46, yU - 18, 86, 6, fill="#9aa3ae", stroke=INK, sw=1.2)
    rope = RED
    s.line(cx - 40, yU - 12, cx - 40, yL, stroke=rope, w=2.2)
    s.path(f"M{cx - 40},{yL} A10,10 0 0 0 {cx - 20},{yL}", stroke=rope, w=2.2)
    s.line(cx - 20, yL, cx - 20, yU, stroke=rope, w=2.2)
    s.path(f"M{cx - 20},{yU} A10,10 0 0 1 {cx},{yU}", stroke=rope, w=2.2)
    s.line(cx, yU, cx, yL, stroke=rope, w=2.2)
    s.path(f"M{cx},{yL} A10,10 0 0 0 {cx + 20},{yL}", stroke=rope, w=2.2)
    s.line(cx + 20, yL, cx + 20, yU, stroke=rope, w=2.2)
    s.path(f"M{cx + 20},{yU} A10,10 0 0 1 {cx + 40},{yU}", stroke=rope, w=2.2)
    s.line(cx + 40, yU, cx + 40, yL + 30, stroke=rope, w=2.2)
    s.arrow(cx + 40, yL + 28, cx + 40, yL + 56, color=BLUE, w=2.6, head=10)
    s.text(cx + 46, yL + 46, effort_label, size=11.5, weight=800, fill=BLUE, anchor="start")
    sheave(s, cx - 10, yU, r)
    sheave(s, cx + 30, yU, r)
    sheave(s, cx - 30, yL, r)
    sheave(s, cx + 10, yL, r)
    s.line(cx - 30, yL, cx + 10, yL, w=3)
    s.line(cx - 10, yL, cx - 10, yL + 20, w=2)
    load_box(s, cx - 10, yL + 52, load_label, w=50, h=32)
    for k, x in enumerate((cx - 40, cx - 20, cx, cx + 20)):
        yy = (yU + yL) / 2 + (k % 2) * 14 - 7
        s.circle(x, yy, 7, fill="#ffffff", stroke=rope, w=1.4)
        s.text(x, yy + 0.5, str(k + 1), size=9, weight=800, fill=rope)


@fig
def mc_pulleys():
    s = Svg(690, 270)
    cx = 110
    ceiling(s, cx - 60, cx + 60, 24)
    s.line(cx, 24, cx, 60, w=2)
    s.line(cx - 22, 70, cx - 22, 190, stroke=RED, w=2.2)
    s.line(cx + 22, 70, cx + 22, 170, stroke=RED, w=2.2)
    s.path(f"M{cx - 22},70 A22,22 0 0 1 {cx + 22},70", stroke=RED, w=2.2)
    sheave(s, cx, 70, 20)
    load_box(s, cx - 22, 222, "Load")
    s.arrow(cx + 22, 168, cx + 22, 206, color=BLUE, w=2.6, head=10)
    s.text(cx + 30, 196, "Effort", size=11, weight=800, fill=BLUE, anchor="start")
    s.text(cx, 245, "Fixed pulley: MA = 1", size=12.5, weight=800)
    s.text(cx, 262, "changes direction only", size=11, weight=600, fill=MUTED)
    cx = 330
    ceiling(s, cx - 60, cx + 60, 24)
    s.line(cx - 22, 24, cx - 22, 150, stroke=RED, w=2.2)
    s.path(f"M{cx - 22},150 A22,22 0 0 0 {cx + 22},150", stroke=RED, w=2.2)
    s.line(cx + 22, 150, cx + 22, 60, stroke=RED, w=2.2)
    s.arrow(cx + 22, 70, cx + 22, 32, color=BLUE, w=2.6, head=10)
    s.text(cx + 30, 50, "Effort", size=11, weight=800, fill=BLUE, anchor="start")
    sheave(s, cx, 150, 20)
    s.line(cx, 150, cx, 182, w=2)
    load_box(s, cx, 214, "Load")
    s.text(cx, 245, "Movable pulley: MA = 2", size=12.5, weight=800)
    s.text(cx, 262, "2 strands hold the load", size=11, weight=600, fill=MUTED)
    block_tackle(s, 565, "Load", "Effort")
    s.text(560, 245, "Block and tackle: MA = 4", size=12.5, weight=800)
    s.text(560, 262, "4 strands hold the moving block", size=11, weight=600, fill=MUTED)
    return s.svg()


@fig
def mcq_pulley4():
    s = Svg(260, 230)
    block_tackle(s, 120, "200 lb", "Effort = ?")
    return s.svg()


@fig
def mc_wheel_axle():
    s = Svg(420, 240)
    cx, cy, R, r = 150, 100, 70, 22
    s.circle(cx, cy, R, fill="#eef1f4", stroke=INK, w=2.4)
    s.circle(cx, cy, r, fill="#cfd5dd", stroke=INK, w=2)
    s.circle(cx, cy, 4, fill=INK, stroke=INK, w=1)
    s.line(cx + R, cy, cx + R, cy + 100, stroke=RED, w=2.2)
    s.arrow(cx + R, cy + 96, cx + R, cy + 128, color=BLUE, w=2.6, head=10)
    s.text(cx + R + 8, cy + 116, "Effort", size=11.5, weight=800, fill=BLUE, anchor="start")
    s.line(cx - r, cy, cx - r, cy + 92, stroke=RED, w=2.2)
    load_box(s, cx - r, cy + 126, "Load")
    s.line(cx, cy, cx + R * 0.71, cy - R * 0.71, stroke=ACC, w=2)
    s.text(cx + 40, cy - 52, "R", size=15, weight=800, fill=ACC, italic=True)
    s.line(cx, cy, cx - r * 0.71, cy - r * 0.71, stroke=GREEN, w=2)
    s.text(cx - 20, cy - 24, "r", size=14, weight=800, fill=GREEN, italic=True)
    s.text(330, 70, "MA = R ÷ r", size=17, weight=800)
    s.text(330, 96, "R = wheel radius", size=12, weight=600, fill=ACC)
    s.text(330, 114, "r = axle radius", size=12, weight=600, fill=GREEN)
    return s.svg()


@fig
def mc_incline():
    s = Svg(500, 210)
    A, B, C = (40, 170), (380, 170), (380, 80)
    s.poly([A, B, C], fill="#efe3cc", stroke=INK, w=2.2)
    ang = math.degrees(math.atan2(90, 340))
    bx, by = 200, 170 - (200 - 40) * 90 / 340
    s.group(f'<rect x="-22" y="-34" width="44" height="34" rx="3" fill="{ACC_S}" stroke="{ACC}" stroke-width="1.8"/><text x="0" y="-15" font-size="11" font-weight="800" text-anchor="middle" dominant-baseline="middle" fill="#7a3b06">Load</text>', tx=bx, ty=by, rot=-ang)
    ux, uy = math.cos(math.radians(ang)), -math.sin(math.radians(ang))
    sx, sy = bx + 30 * ux + 18 * uy, by + 30 * uy - 18 * ux
    s.arrow(sx, sy, sx + 70 * ux, sy + 70 * uy, color=BLUE, w=2.6, head=10)
    s.text(sx + 80 * ux + 4, sy + 80 * uy - 6, "Effort", size=11.5, weight=800, fill=BLUE, anchor="start")
    s.text(392, 125, "height", size=12, weight=800, fill=GREEN, anchor="start")
    s.line(386, 80, 386, 170, stroke=GREEN, w=1.5, dash="4 3")
    s.text(150, 196, "length of the slope", size=12, weight=800, fill=ACC)
    s.text(440, 40, "MA = length ÷ height", size=13.5, weight=800, anchor="end")
    return s.svg()


def gear(s, cx, cy, r, teeth, phase=0.0, fill="#cfd5dd"):
    s.path(gear_path(cx, cy, r + 5, r - 5, teeth, phase), fill=fill, stroke=INK, w=1.6)
    s.circle(cx, cy, max(6, r * 0.18), fill="#ffffff", stroke=INK, w=1.6)


def mesh_phase(teeth, at_angle, tooth=True):
    step = 2 * math.pi / teeth
    center = 0.25 if tooth else 0.75
    return at_angle - center * step


def rot_arrow(s, cx, cy, r, cw, color=ACC):
    if cw:
        s.arc_arrow(cx, cy, r, 140, 40, color=color, w=2.4, head=9)
    else:
        s.arc_arrow(cx, cy, r, 40, 140, color=color, w=2.4, head=9)


@fig
def mc_gears():
    s = Svg(690, 250)
    r1, r2 = 36, 72
    c1 = (110, 130)
    c2 = (110 + r1 + r2, 130)
    gear(s, c1[0], c1[1], r1, 12, mesh_phase(12, 0, True), fill="#f3c08a")
    gear(s, c2[0], c2[1], r2, 24, mesh_phase(24, math.pi, False))
    rot_arrow(s, c1[0], c1[1], r1 + 16, True)
    rot_arrow(s, c2[0], c2[1], r2 + 16, False, color=BLUE)
    s.text(c1[0] - 34, 226, "Driver: 12 teeth", size=11.5, weight=800)
    s.text(c1[0] - 34, 242, "60 rpm, clockwise", size=11, weight=600, fill=MUTED)
    s.text(c2[0] + 30, 226, "Driven: 24 teeth", size=11.5, weight=800)
    s.text(c2[0] + 30, 242, "30 rpm, counterclockwise", size=11, weight=600, fill=MUTED)
    r = 34
    xs = [440, 440 + 2 * r, 440 + 4 * r]
    names = ["A", "B (idler)", "C"]
    for k, x in enumerate(xs):
        ph = mesh_phase(12, 0, True) if k % 2 == 0 else mesh_phase(12, math.pi, False)
        gear(s, x, 130, r, 12, ph, fill="#f3c08a" if k == 0 else "#cfd5dd")
        rot_arrow(s, x, 130, r + 15, k % 2 == 0, color=ACC if k % 2 == 0 else BLUE)
        s.text(x, 196, names[k], size=12, weight=800)
    s.text(xs[1], 228, "A and C turn the same way;", size=11.5, weight=700, fill=MUTED)
    s.text(xs[1], 244, "the idler only reverses direction", size=11.5, weight=700, fill=MUTED)
    return s.svg()


@fig
def mcq_gears3():
    s = Svg(340, 150)
    r = 36
    xs = [70, 70 + 2 * r, 70 + 4 * r]
    for k, x in enumerate(xs):
        ph = mesh_phase(12, 0, True) if k % 2 == 0 else mesh_phase(12, math.pi, False)
        gear(s, x, 78, r, 12, ph)
        s.text(x, 140, "ABC"[k], size=15, weight=800)
    rot_arrow(s, xs[0], 78, r + 15, True)
    return s.svg()


def belt_pair(s, c1, r1, c2, r2, crossed):
    x1, y = c1
    x2, _ = c2
    d = x2 - x1
    if not crossed:
        a = math.asin((r1 - r2) / d)
        for sign in (1, -1):
            phi = math.pi / 2 + a
            p1 = (x1 + r1 * math.cos(phi), y - sign * r1 * math.sin(phi))
            p2 = (x2 + r2 * math.cos(phi), y - sign * r2 * math.sin(phi))
            s.line(p1[0], p1[1], p2[0], p2[1], stroke="#3a3f47", w=3)
    else:
        b = math.asin((r1 + r2) / d)
        for sign in (1, -1):
            nx, ny = math.sin(b), -sign * math.cos(b)
            p1 = (x1 + r1 * nx, y + r1 * ny)
            p2 = (x2 - r2 * nx, y - r2 * ny)
            s.line(p1[0], p1[1], p2[0], p2[1], stroke="#3a3f47", w=3)
    for (cx, cy), r in ((c1, r1), (c2, r2)):
        s.circle(cx, cy, r, fill="#dfe4ea", stroke="#3a3f47", w=3)
        s.circle(cx, cy, 4, fill=INK, stroke=INK, w=1)


@fig
def mc_belts():
    s = Svg(690, 180)
    belt_pair(s, (80, 80), 40, (250, 80), 26, False)
    rot_arrow(s, 80, 80, 54, True)
    rot_arrow(s, 250, 80, 40, True)
    s.text(165, 160, "Open belt: same direction", size=12.5, weight=800)
    belt_pair(s, (430, 80), 34, (600, 80), 34, True)
    rot_arrow(s, 430, 80, 48, True)
    rot_arrow(s, 600, 80, 48, False, color=BLUE)
    s.text(515, 160, "Crossed belt: opposite directions", size=12.5, weight=800)
    return s.svg()


@fig
def mcq_crossbelt():
    s = Svg(330, 160)
    belt_pair(s, (70, 76), 34, (250, 76), 34, True)
    rot_arrow(s, 70, 76, 48, True)
    s.text(70, 150, "A", size=15, weight=800)
    s.text(250, 150, "B", size=15, weight=800)
    s.text(250, 80, "?", size=18, weight=800, fill=BLUE)
    return s.svg()


def hydraulic(s, f1, a1, f2, a2):
    fluid = "#a9cdf2"
    s.rect(60, 70, 40, 110, fill=fluid, stroke="none", sw=0)
    s.rect(230, 100, 140, 80, fill=fluid, stroke="none", sw=0)
    s.rect(60, 160, 310, 30, fill=fluid, stroke="none", sw=0)
    s.polyline([(60, 40), (60, 190), (370, 190), (370, 60)], stroke=INK, w=2.6)
    s.polyline([(100, 40), (100, 160), (230, 160), (230, 60)], stroke=INK, w=2.6)
    s.rect(62, 58, 36, 12, fill="#8b939e", stroke=INK, sw=1.6)
    s.rect(232, 88, 136, 12, fill="#8b939e", stroke=INK, sw=1.6)
    s.arrow(80, 10, 80, 54, color=BLUE, w=2.8, head=10)
    s.text(110, 22, f1, size=12.5, weight=800, fill=BLUE, anchor="start")
    s.text(110, 40, a1, size=11, weight=600, fill=MUTED, anchor="start")
    s.arrow(300, 84, 300, 30, color=ACC, w=3.2, head=12)
    s.text(316, 30, f2, size=12.5, weight=800, fill=ACC, anchor="start")
    s.text(316, 48, a2, size=11, weight=600, fill=MUTED, anchor="start")


@fig
def mc_hydraulic():
    s = Svg(480, 205)
    hydraulic(s, "50 lb", "small piston: 2 sq in", "1,000 lb", "large piston: 40 sq in")
    s.text(215, 202, "same pressure everywhere: 25 psi", size=11.5, weight=700, fill="#1e4f8a")
    return s.svg()


@fig
def mcq_hydraulic():
    s = Svg(480, 200)
    hydraulic(s, "50 lb", "area: 2 sq in", "? lb", "area: 40 sq in")
    return s.svg()


def beam_supports(s, x1, x2, y, wx, wlabel, left_lab, right_lab, d1, d2, la="", lb=""):
    beam(s, x1 - 10, x2 + 10, y, t=10)
    fulcrum(s, x1, y + 5, 14)
    fulcrum(s, x2, y + 5, 14)
    load_box(s, wx, y - 5, wlabel, w=56, h=32)
    yd = y + 38
    s.arrow(x1, yd, wx, yd, color=MUTED, w=1.2, head=6, both=True)
    s.arrow(wx, yd, x2, yd, color=MUTED, w=1.2, head=6, both=True)
    s.text((x1 + wx) / 2, yd + 12, d1, size=11.5, weight=800, fill=INK)
    s.text((wx + x2) / 2, yd + 12, d2, size=11.5, weight=800, fill=INK)
    if la:
        s.text(x1, y + 74, la, size=11.5, weight=800, fill=BLUE)
    if lb:
        s.text(x2, y + 74, lb, size=11.5, weight=800, fill=BLUE)
    if left_lab:
        s.text(x1, y - 22, left_lab, size=12, weight=800)
    if right_lab:
        s.text(x2, y - 22, right_lab, size=12, weight=800)


@fig
def mc_beam():
    s = Svg(640, 170)
    beam_supports(s, 60, 560, 70, 160, "120 lb", "", "", "2 ft", "8 ft", "carries 96 lb", "carries 24 lb")
    return s.svg()


@fig
def mcq_beam():
    s = Svg(560, 160)
    beam_supports(s, 50, 500, 70, 50 + 450 * 3 / 12, "180 lb", "A", "B", "3 ft", "9 ft")
    return s.svg()


@fig
def mcq_lever():
    s = Svg(520, 150)
    x0, u, y = 50, 52, 70
    beam(s, x0 - 12, x0 + 8 * u + 12, y)
    fulcrum(s, x0 + 2 * u, y + 4)
    load_box(s, x0, y - 4, "120 lb", w=52, h=32)
    s.arrow(x0 + 8 * u, y - 48, x0 + 8 * u, y - 6, color=BLUE, w=2.6, head=10)
    s.text(x0 + 8 * u - 10, y - 46, "Effort = ?", size=12, weight=800, fill=BLUE, anchor="end")
    yd = y + 46
    s.arrow(x0, yd, x0 + 2 * u, yd, color=MUTED, w=1.2, head=6, both=True)
    s.arrow(x0 + 2 * u, yd, x0 + 8 * u, yd, color=MUTED, w=1.2, head=6, both=True)
    s.text(x0 + u, yd + 13, "2 ft", size=11.5, weight=800)
    s.text(x0 + 5 * u, yd + 13, "6 ft", size=11.5, weight=800)
    return s.svg()


@fig
def mcq_seesaw():
    s = Svg(560, 150)
    x0, u, y = 40, 40, 70
    c = x0 + 6 * u
    beam(s, x0 - 14, x0 + 12 * u + 14, y)
    fulcrum(s, c, y + 4)
    load_box(s, x0, y - 4, "80 lb", w=46, h=30)
    load_box(s, c + 4 * u, y - 4, "120 lb", w=50, h=36, fill=BLUE_S, stroke=BLUE)
    yd = y + 46
    s.arrow(x0, yd, c, yd, color=MUTED, w=1.2, head=6, both=True)
    s.arrow(c, yd, c + 4 * u, yd, color=MUTED, w=1.2, head=6, both=True)
    s.text((x0 + c) / 2, yd + 13, "6 ft", size=11.5, weight=800)
    s.text(c + 2 * u, yd + 13, "? ft", size=11.5, weight=800, fill=BLUE)
    return s.svg()


@fig
def mcq_cam():
    s = Svg(300, 220)
    cx, cy = 120, 150
    pts = []
    for k in range(0, 360, 6):
        a = math.radians(k)
        r = 34 + 22 * abs(math.cos(a))
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    s.poly(pts, fill="#cfd5dd", stroke=INK, w=2)
    s.circle(cx, cy, 6, fill=INK, stroke=INK, w=1)
    s.rect(cx - 6, 20, 12, 74, fill="#8b939e", stroke=INK, sw=1.6)
    s.circle(cx, 100, 8, fill="#ffffff", stroke=INK, w=1.8)
    s.rect(cx - 16, 44, 4, 26, fill="#5f6773", stroke="none", sw=0)
    s.rect(cx + 12, 44, 4, 26, fill="#5f6773", stroke="none", sw=0)
    s.text(cx + 26, 40, "follower", size=11.5, weight=700, fill=MUTED, anchor="start")
    s.arc_arrow(cx, cy, 70, 300, 240, color=ACC, w=2.2, head=9)
    s.text(cx + 66, cy + 62, "cam turns", size=11.5, weight=700, fill=ACC, anchor="start")
    return s.svg()


@fig
def mcq_tanks():
    s = Svg(520, 200)
    water = "#a9cdf2"
    level = 70
    base = 170
    s.rect(60, level, 50, base - level, fill=water, stroke="none", sw=0)
    s.polyline([(60, 40), (60, base), (110, base), (110, 40)], stroke=INK, w=2.4)
    s.rect(180, level, 150, base - level, fill=water, stroke="none", sw=0)
    s.polyline([(180, 40), (180, base), (330, base), (330, 40)], stroke=INK, w=2.4)
    s.poly([(395, level), (495, level), (465, base), (425, base)], fill=water, stroke="none", w=0)
    s.polyline([(386, 40), (425, base), (465, base), (504, 40)], stroke=INK, w=2.4)
    s.line(30, level, 510, level, stroke=BLUE, w=1.4, dash="6 4")
    s.text(85, 192, "A", size=15, weight=800)
    s.text(255, 192, "B", size=15, weight=800)
    s.text(445, 192, "C", size=15, weight=800)
    s.text(360, level - 9, "same depth", size=11, weight=700, fill=BLUE)
    return s.svg()


@fig
def mcq_bimetal():
    s = Svg(440, 150)
    s.rect(20, 30, 30, 80, fill="#9aa3ae", stroke=INK, sw=1.6)
    for y in range(36, 110, 10):
        s.line(20, y, 50, y + 8, stroke="#6b7280", w=1)
    s.rect(50, 58, 330, 12, fill="#e0b84a", stroke="#9a7a1c", sw=1.4)
    s.rect(50, 70, 330, 12, fill="#aeb6c0", stroke="#5f6773", sw=1.4)
    s.text(215, 64, "brass", size=11, weight=800, fill="#5c4a0a")
    s.text(215, 76, "steel", size=11, weight=800, fill="#2d333b")
    for x in (150, 215, 280):
        s.arrow(x, 128, x, 92, color=RED, w=2, head=8)
    s.text(330, 128, "heat", size=12, weight=800, fill=RED, anchor="start")
    return s.svg()


@fig
def mcq_wheel_points():
    s = Svg(280, 250)
    cx, cy, R = 130, 125, 104
    s.circle(cx, cy, R, fill="#eef1f4", stroke=INK, w=2.4)
    s.circle(cx, cy, 10, fill="#cfd5dd", stroke=INK, w=1.6)
    for k in range(6):
        x2, y2 = pol(cx, cy, R, k * 60 + 30)
        s.line(cx, cy, x2, y2, stroke=LINE, w=2)
    for k, (name, d) in enumerate((("A", 26), ("B", 52), ("C", 78), ("D", 104))):
        px, py = cx + d, cy
        s.circle(px, py, 5.5, fill=RED, stroke="#ffffff", w=1.4)
        s.text(px, py - 14 if k % 2 == 0 else py + 17, name, size=13.5, weight=800, fill=RED)
    s.arc_arrow(cx, cy, R + 14, 125, 55, color=ACC, w=2.2, head=9)
    return s.svg()


@fig
def mcq_stability():
    s = Svg(560, 190)
    ground = 165
    s.line(10, ground, 550, ground, stroke=INK, w=2.4)
    shapes = [
        ("A", (60, 30, 40, ground - 30)),
        ("B", (170, 70, 60, ground - 70)),
        ("C", (290, 95, 70, ground - 95)),
        ("D", (410, 125, 130, ground - 125)),
    ]
    for name, (x, y, w, h) in shapes:
        if name == "B":
            s.rect(x, y, w, h, fill="#dbe6f3", stroke=INK, sw=2, rx=8)
        else:
            s.rect(x, y, w, h, fill="#dbe6f3", stroke=INK, sw=2)
        s.circle(x + w / 2, y + h / 2, 5, fill=RED, stroke="#ffffff", w=1.4)
        s.text(x + w / 2, ground + 18, name, size=15, weight=800)
    s.text(520, 26, "red dot = center of gravity", size=11, weight=700, fill=RED, anchor="end")
    return s.svg()


def embed(svg_str, x, y, w, h):
    import re as _re
    vb = _re.search(r'viewBox="([^"]+)"', svg_str).group(1)
    inner = svg_str[svg_str.index(">") + 1: svg_str.rindex("</svg>")]
    return f'<svg x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" viewBox="{vb}">{inner}</svg>'


def ao_example(stem, choices, correct):
    s = Svg(680, 300)
    s.raw(embed(stem, 190, 4, 300, 130))
    s.text(340, 150, "question box", size=11, weight=700, fill=MUTED)
    for k, ch in enumerate(choices):
        x = 8 + k * 168
        s.raw(embed(ch, x, 166, 160, 128))
        col = GREEN if k == correct else MUTED
        s.circle(x + 14, 180, 10, fill="#ffffff" if k != correct else GREEN, stroke=col, w=1.6)
        s.text(x + 14, 180.5, "ABCD"[k], size=11, weight=800, fill="#ffffff" if k == correct else MUTED)
    return s.svg()


@fig
def ao_example_connect():
    import random as _random
    import ao
    rng = _random.Random(5)
    tri = ao.SHAPES["triangle"]
    cir = ao.SHAPES["circle"]
    corner = tri["groups"]["corner"][0]
    side = tri["groups"]["side"][1]
    center_t = (0, 0)
    stem = ao.connector_stem(tri, corner, cir, (0, 0), rng)
    ch = [
        ao.connector_choice(tri, side, cir, (0, 0), rng),
        ao.connector_choice(tri, corner, cir, cir["groups"]["edge"][2], rng),
        ao.connector_choice(tri, corner, cir, (0, 0), rng),
        ao.connector_choice(tri, center_t, cir, cir["groups"]["edge"][0], rng),
    ]
    return ao_example(stem, ch, 2)


@fig
def ao_example_puzzle():
    import random as _random
    import ao
    rng = _random.Random(9)
    sq = ao.OUTLINES["square"]
    tl, bl, br, tr = sq[1], sq[2], sq[3], sq[0]
    bot_mid = ((bl[0] + br[0]) / 2, (bl[1] + br[1]) / 2)
    good = list(ao.split(sq, tl, bot_mid))
    diag = list(ao.split(sq, tl, br))
    q34 = (bl[0] + 0.78 * (br[0] - bl[0]), bl[1])
    moved = list(ao.split(sq, tl, q34))
    top_mid = ((tl[0] + tr[0]) / 2, (tl[1] + tr[1]) / 2)
    halves = list(ao.split(sq, top_mid, bot_mid))
    three = [halves[1]] + list(ao.split(halves[0], top_mid, br))
    stem = ao.draw_pieces(good, rng, 34)
    ch = [ao.draw_assembly(diag, rng, 0)[0], ao.draw_assembly(good, rng, 90)[0], ao.draw_assembly(three, rng, 0)[0], ao.draw_assembly(moved, rng, 180)[0]]
    return ao_example(stem, ch, 1)


def lever_q(load, dl, de, u=40, load_left=True, effort_label="Effort = ?"):
    s = Svg(80 + (dl + de) * u + 40, 150)
    x0, y = 50, 70
    xf = x0 + dl * u
    xe = xf + de * u
    beam(s, x0 - 12, xe + 12, y)
    fulcrum(s, xf, y + 4)
    load_box(s, x0, y - 4, load, w=52, h=32)
    s.arrow(xe, y - 48, xe, y - 6, color=BLUE, w=2.6, head=10)
    s.text(xe - 10, y - 46, effort_label, size=12, weight=800, fill=BLUE, anchor="end")
    yd = y + 46
    s.arrow(x0, yd, xf, yd, color=MUTED, w=1.2, head=6, both=True)
    s.arrow(xf, yd, xe, yd, color=MUTED, w=1.2, head=6, both=True)
    s.text((x0 + xf) / 2, yd + 13, f"{dl} ft", size=11.5, weight=800)
    s.text((xf + xe) / 2, yd + 13, f"{de} ft", size=11.5, weight=800)
    return s.svg()


def belt_q(crossed):
    s = Svg(330, 160)
    belt_pair(s, (70, 76), 36 if not crossed else 34, (250, 76), 28 if not crossed else 34, crossed)
    rot_arrow(s, 70, 76, 50, True)
    s.text(70, 150, "A", size=15, weight=800)
    s.text(250, 150, "B", size=15, weight=800)
    s.text(250, 80, "?", size=18, weight=800, fill=BLUE)
    return s.svg()


def gears_row_q(n, r=30, labels=None):
    s = Svg(40 + 2 * r * n + 30, 150)
    xs = [50 + 2 * r * k for k in range(n)]
    for k, x in enumerate(xs):
        ph = mesh_phase(12, 0, True) if k % 2 == 0 else mesh_phase(12, math.pi, False)
        gear(s, x, 76, r, 12, ph)
        s.text(x, 140, (labels or [str(i + 1) for i in range(n)])[k], size=15, weight=800)
    rot_arrow(s, xs[0], 76, r + 14, True)
    return s.svg()


def beam_q(total, load, d_a, la="A", lb="B"):
    s = Svg(560, 160)
    x1, x2 = 50, 500
    wx = x1 + (x2 - x1) * d_a / total
    beam_supports(s, x1, x2, 70, wx, load, la, lb, f"{d_a} ft", f"{total - d_a} ft")
    return s.svg()


def depth_q():
    s = Svg(360, 220)
    s.rect(40, 30, 280, 170, fill="#ffffff", stroke=INK, sw=2.4)
    s.rect(42, 50, 276, 148, fill="#a9cdf2", stroke="none", sw=0)
    s.line(42, 50, 318, 50, stroke="#1e4f8a", w=1.6)
    pts = [("A", 90, 72), ("B", 250, 110), ("C", 150, 140), ("D", 270, 182)]
    for name, x, y in pts:
        s.circle(x, y, 5.5, fill=RED, stroke="#ffffff", w=1.4)
        s.text(x + 14, y, name, size=14, weight=800, fill=RED)
    s.text(180, 22, "water tank", size=11.5, weight=700, fill=MUTED)
    return s.svg()


def class2_q(load, d_load, d_effort, u=80):
    s = Svg(80 + d_effort * u + 60, 190)
    x0, y = 50, 80
    beam(s, x0 - 12, x0 + d_effort * u + 14, y)
    s.circle(x0, y + 22, 16, fill="#cfd5dd", stroke=INK, w=2)
    s.circle(x0, y + 22, 4, fill=INK, stroke=INK, w=1)
    s.line(x0, y + 4, x0, y + 18, w=2)
    s.text(x0, y + 52, "wheel (fulcrum)", size=10.5, weight=700, fill=MUTED)
    xl = x0 + d_load * u
    load_box(s, xl, y - 4, load, w=56, h=34)
    xe = x0 + d_effort * u
    s.arrow(xe, y + 50, xe, y + 6, color=BLUE, w=2.6, head=10)
    s.text(xe + 8, y + 40, "lift = ?", size=12, weight=800, fill=BLUE, anchor="start")
    s.arrow(x0, y - 52, xl, y - 52, color=MUTED, w=1.2, head=6, both=True)
    s.text((x0 + xl) / 2, y - 62, f"{d_load} ft", size=11.5, weight=800)
    s.arrow(x0, y + 72, xe, y + 72, color=MUTED, w=1.2, head=6, both=True)
    s.text((x0 + xe) / 2, y + 86, f"{d_effort} ft", size=11.5, weight=800)
    return s.svg()


def seesaw_q(left, dl, right, dr, u=40):
    s = Svg(90 + (dl + dr) * u + 30, 150)
    x0, y = 50, 70
    c = x0 + dl * u
    xr = c + dr * u
    beam(s, x0 - 14, xr + 14, y)
    fulcrum(s, c, y + 4)
    load_box(s, x0, y - 4, left, w=50, h=32)
    load_box(s, xr, y - 4, right, w=50, h=32, fill=BLUE_S, stroke=BLUE)
    yd = y + 46
    s.arrow(x0, yd, c, yd, color=MUTED, w=1.2, head=6, both=True)
    s.arrow(c, yd, xr, yd, color=MUTED, w=1.2, head=6, both=True)
    s.text((x0 + c) / 2, yd + 13, f"{dl} ft", size=11.5, weight=800)
    s.text((c + xr) / 2, yd + 13, f"{dr} ft", size=11.5, weight=800)
    return s.svg()


def cam_q(lobes):
    s = Svg(300, 230)
    cx, cy = 120, 155
    pts = []
    for k in range(0, 360, 4):
        a = math.radians(k)
        r = 40 + 16 * math.cos(lobes * (a + math.pi / 2))
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    top = min(p[1] for p in pts)
    s.poly(pts, fill="#cfd5dd", stroke=INK, w=2)
    s.circle(cx, cy, 6, fill=INK, stroke=INK, w=1)
    s.rect(cx - 6, 20, 12, top - 34, fill="#8b939e", stroke=INK, sw=1.6)
    s.circle(cx, top - 8, 8, fill="#ffffff", stroke=INK, w=1.8)
    s.rect(cx - 16, 40, 4, 26, fill="#5f6773", stroke="none", sw=0)
    s.rect(cx + 12, 40, 4, 26, fill="#5f6773", stroke="none", sw=0)
    s.text(cx + 26, 36, "follower", size=11.5, weight=700, fill=MUTED, anchor="start")
    s.arc_arrow(cx, cy, 72, 300, 240, color=ACC, w=2.2, head=9)
    s.text(cx + 68, cy + 64, "cam turns", size=11.5, weight=700, fill=ACC, anchor="start")
    return s.svg()


FIGS["pt2-wheelbarrow"] = lambda: class2_q("180 lb", 1.5, 4.5)
FIGS["pt2-seesaw"] = lambda: seesaw_q("150 lb", 4, "?", 6)
FIGS["pt2-beam"] = lambda: beam_q(8, "160 lb", 2)
FIGS["pt2-cam"] = lambda: cam_q(3)
FIGS["pt1-lever"] = lambda: lever_q("90 lb", 3, 9, 38)
FIGS["pt1-openbelt"] = lambda: belt_q(False)
FIGS["pt1-gears4"] = lambda: gears_row_q(4)
FIGS["pt1-beam"] = lambda: beam_q(10, "200 lb", 4)
FIGS["pt1-depth"] = depth_q


def generate(root):
    out = pathlib.Path(root) / "figs"
    out.mkdir(exist_ok=True)
    for name, fn in FIGS.items():
        (out / f"{name}.svg").write_text(fn(), encoding="utf-8")
