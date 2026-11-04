import itertools
import math
import pathlib
import random

from svgkit import Svg, f, INK, ACC, MUTED, BLUE, RED

FILL = "#eef1f5"
LETTERS = "ABCD"


def reg(n, r=1.0, start=90.0):
    return [(r * math.cos(math.radians(start + 360.0 * k / n)), r * math.sin(math.radians(start + 360.0 * k / n))) for k in range(n)]


def mids(pts):
    return [((pts[i][0] + pts[(i + 1) % len(pts)][0]) / 2, (pts[i][1] + pts[(i + 1) % len(pts)][1]) / 2) for i in range(len(pts))]


def area(p):
    return 0.5 * sum(p[i][0] * p[(i + 1) % len(p)][1] - p[(i + 1) % len(p)][0] * p[i][1] for i in range(len(p)))


def centroid(p):
    a = area(p)
    cx = cy = 0.0
    for i in range(len(p)):
        x0, y0 = p[i]
        x1, y1 = p[(i + 1) % len(p)]
        cr = x0 * y1 - x1 * y0
        cx += (x0 + x1) * cr
        cy += (y0 + y1) * cr
    return (cx / (6 * a), cy / (6 * a))


def shift(p, dx, dy):
    return [(x + dx, y + dy) for x, y in p]


def rot(p, deg, about=(0.0, 0.0)):
    c, s = math.cos(math.radians(deg)), math.sin(math.radians(deg))
    ax, ay = about
    return [(ax + (x - ax) * c - (y - ay) * s, ay + (x - ax) * s + (y - ay) * c) for x, y in p]


def centered(p):
    cx, cy = centroid(p)
    return shift(p, -cx, -cy)


def ellipse(rx, ry, n=48):
    return [(rx * math.cos(2 * math.pi * k / n), ry * math.sin(2 * math.pi * k / n)) for k in range(n)]


def build_shapes():
    S = {}
    sq = reg(4, 1.0, 45)
    S["square"] = dict(name="square", pts=sq, groups={"corner": sq, "side": mids(sq), "center": [(0, 0)]},
                       desc={"corner": "a corner of the square", "side": "the middle of one side of the square", "center": "the center of the square"})
    tri = reg(3, 1.15, 90)
    S["triangle"] = dict(name="triangle", pts=tri, groups={"corner": tri, "side": mids(tri), "center": [(0, 0)]},
                         desc={"corner": "a corner of the triangle", "side": "the middle of one side of the triangle", "center": "the center of the triangle"})
    pen = reg(5, 1.05, 90)
    S["pentagon"] = dict(name="pentagon", pts=pen, groups={"corner": pen, "side": mids(pen), "center": [(0, 0)]},
                         desc={"corner": "a corner of the pentagon", "side": "the middle of one side of the pentagon", "center": "the center of the pentagon"})
    hx = reg(6, 1.05, 0)
    S["hexagon"] = dict(name="hexagon", pts=hx, groups={"corner": hx, "side": mids(hx), "center": [(0, 0)]},
                        desc={"corner": "a corner of the hexagon", "side": "the middle of one side of the hexagon", "center": "the center of the hexagon"})
    ci = ellipse(1.0, 1.0)
    S["circle"] = dict(name="circle", pts=ci, groups={"edge": [ci[0], ci[12], ci[24], ci[36], ci[6]], "center": [(0, 0)]},
                       desc={"edge": "a point on the edge of the circle", "center": "the center of the circle"})
    rc = [(-1.25, -0.62), (1.25, -0.62), (1.25, 0.62), (-1.25, 0.62)]
    S["rectangle"] = dict(name="rectangle", pts=rc, groups={"corner": rc, "long": [(0, -0.62), (0, 0.62)], "short": [(1.25, 0), (-1.25, 0)], "center": [(0, 0)]},
                          desc={"corner": "a corner of the rectangle", "long": "the middle of a long side of the rectangle", "short": "the middle of a short side of the rectangle", "center": "the center of the rectangle"})
    rt = centered([(-0.95, -0.8), (1.25, -0.8), (-0.95, 0.95)])
    S["right triangle"] = dict(name="right triangle", pts=rt, groups={"right": [rt[0]], "sharp": [rt[1], rt[2]], "long": [mids(rt)[1]], "center": [(0, 0)]},
                               desc={"right": "the square (90°) corner of the right triangle", "sharp": "one of the pointed corners of the right triangle", "long": "the middle of the right triangle's longest side", "center": "the center of the right triangle"})
    arc = [(1.2 * math.cos(math.radians(a)), 1.2 * math.sin(math.radians(a)) - 0.5) for a in range(0, 181, 9)]
    S["half circle"] = dict(name="half circle", pts=arc, groups={"top": [(0, 0.7)], "flat": [(0, -0.5)], "end": [(1.2, -0.5), (-1.2, -0.5)]},
                            desc={"top": "the top of the curved edge of the half circle", "flat": "the middle of the flat edge of the half circle", "end": "a corner where the flat edge meets the curve"})
    st = []
    for k in range(10):
        r = 1.15 if k % 2 == 0 else 0.48
        a = math.radians(90 + 36 * k)
        st.append((r * math.cos(a), r * math.sin(a)))
    S["star"] = dict(name="star", pts=st, groups={"tip": st[0::2], "notch": st[1::2], "center": [(0, 0)]},
                     desc={"tip": "the tip of one point of the star", "notch": "an inner corner of the star", "center": "the center of the star"})
    tz = [(-1.25, -0.62), (1.25, -0.62), (0.6, 0.62), (-0.6, 0.62)]
    S["trapezoid"] = dict(name="trapezoid", pts=tz, groups={"longcorner": [tz[0], tz[1]], "shortcorner": [tz[2], tz[3]], "longmid": [(0, -0.62)], "shortmid": [(0, 0.62)]},
                          desc={"longcorner": "a corner on the long side of the trapezoid", "shortcorner": "a corner on the short side of the trapezoid", "longmid": "the middle of the trapezoid's long side", "shortmid": "the middle of the trapezoid's short side"})
    w, L = 0.36, 1.1
    cr = [(-w, L), (w, L), (w, w), (L, w), (L, -w), (w, -w), (w, -L), (-w, -L), (-w, -w), (-L, -w), (-L, w), (-w, w)]
    S["cross"] = dict(name="cross", pts=cr, groups={"arm": [(0, L), (L, 0), (0, -L), (-L, 0)], "inner": [(w, w), (w, -w), (-w, -w), (-w, w)], "center": [(0, 0)]},
                      desc={"arm": "the end of one arm of the cross", "inner": "an inside corner of the cross", "center": "the center of the cross"})
    dm = [(0, 1.18), (0.7, 0), (0, -1.18), (-0.7, 0)]
    S["diamond"] = dict(name="diamond", pts=dm, groups={"sharp": [dm[0], dm[2]], "wide": [dm[1], dm[3]], "center": [(0, 0)]},
                        desc={"sharp": "a sharp (long) point of the diamond", "wide": "a wide (short) point of the diamond", "center": "the center of the diamond"})
    ov = ellipse(1.25, 0.72)
    S["oval"] = dict(name="oval", pts=ov, groups={"end": [ov[0], ov[24]], "side": [ov[12], ov[36]], "center": [(0, 0)]},
                     desc={"end": "one end of the oval", "side": "the middle of a long side of the oval", "center": "the center of the oval"})
    return S


SHAPES = build_shapes()


def to_svg_pts(p, cx, cy, sc):
    return [(cx + x * sc, cy - y * sc) for x, y in p]


def draw_poly(s, p, cx, cy, sc, fill=FILL, w=1.8):
    s.poly(to_svg_pts(p, cx, cy, sc), fill=fill, stroke=INK, w=w)


def connector_choice(shape1, a1, shape2, a2, rng, swap=False):
    s = Svg(150, 120)
    s.rect(1, 1, 148, 118, fill="#ffffff", stroke="#c3cad3", sw=1.2, rx=6)
    sc = 21
    r1 = rng.choice([0, 90, 180, 270]) if shape1["name"] != "circle" else rng.choice([0, 40, 130])
    r2 = rng.choice([0, 90, 180, 270]) if shape2["name"] != "circle" else rng.choice([0, 40, 130])
    p1 = rot(shape1["pts"], r1)
    p2 = rot(shape2["pts"], r2)
    q1 = rot([a1], r1)[0]
    q2 = rot([a2], r2)[0]
    c1 = (40, 60 + rng.choice([-14, -6, 0, 6, 14]))
    c2 = (110, 60 + rng.choice([-14, -6, 0, 6, 14]))
    if swap:
        c1, c2 = c2, c1
    draw_poly(s, p1, c1[0], c1[1], sc)
    draw_poly(s, p2, c2[0], c2[1], sc)
    e1 = (c1[0] + q1[0] * sc, c1[1] - q1[1] * sc)
    e2 = (c2[0] + q2[0] * sc, c2[1] - q2[1] * sc)
    s.line(e1[0], e1[1], e2[0], e2[1], stroke=INK, w=2)
    s.circle(e1[0], e1[1], 2.8, fill=INK, stroke=INK, w=1)
    s.circle(e2[0], e2[1], 2.8, fill=INK, stroke=INK, w=1)
    return s.svg()


def connector_stem(shape1, a1, shape2, a2, rng):
    s = Svg(300, 130)
    s.rect(1, 1, 298, 128, fill="#ffffff", stroke="#9aa3ae", sw=1.4, rx=6)
    sc = 30
    r1 = rng.choice([0, 90, 180, 270]) if shape1["name"] != "circle" else 0
    r2 = rng.choice([0, 90, 180, 270]) if shape2["name"] != "circle" else 0
    p1 = rot(shape1["pts"], r1)
    p2 = rot(shape2["pts"], r2)
    q1 = rot([a1], r1)[0]
    q2 = rot([a2], r2)[0]
    for (p, q, c, lab) in ((p1, q1, (80, 65), "A"), (p2, q2, (220, 65), "B")):
        draw_poly(s, p, c[0], c[1], sc)
        ex, ey = c[0] + q[0] * sc, c[1] - q[1] * sc
        s.circle(ex, ey, 4, fill=RED, stroke=RED, w=1)
        d = math.hypot(q[0], q[1])
        if d < 0.05:
            lx, ly = ex + 9, ey - 9
        else:
            lx, ly = ex + q[0] / d * 15, ey - q[1] / d * 15
        s.text(lx, ly, lab, size=14, weight=800, fill=RED)
    return s.svg()


def other_group(shape, g, rng):
    opts = [k for k in shape["groups"] if k != g]
    return rng.choice(opts)


def make_connector(rng, used_pairs, target):
    names = list(SHAPES)
    while True:
        n1, n2 = rng.sample(names, 2)
        if (n1, n2) not in used_pairs:
            break
    used_pairs.add((n1, n2))
    s1, s2 = SHAPES[n1], SHAPES[n2]
    g1 = rng.choice(list(s1["groups"]))
    g2 = rng.choice(list(s2["groups"]))
    a1 = rng.choice(s1["groups"][g1])
    a2 = rng.choice(s2["groups"][g2])
    stem = connector_stem(s1, a1, s2, a2, rng)
    combos = [(g1, g2)]
    w1 = other_group(s1, g1, rng)
    w2 = other_group(s2, g2, rng)
    combos.append((w1, g2))
    combos.append((g1, w2))
    w1b = other_group(s1, g1, rng)
    w2b = other_group(s2, g2, rng)
    combos.append((w1b, w2b))
    choices = []
    for k, (h1, h2) in enumerate(combos):
        b1 = a1 if h1 == g1 else rng.choice(s1["groups"][h1])
        b2 = a2 if h2 == g2 else rng.choice(s2["groups"][h2])
        choices.append(connector_choice(s1, b1, s2, b2, rng, swap=rng.random() < 0.3))
    order = place_order(rng, target)
    correct = order.index(0)
    expl = f"Point A is at {s1['desc'][g1]}, and point B is at {s2['desc'][g2]}. Only choice {LETTERS[correct]} connects exactly those two spots. In the other choices, the line touches a different spot on at least one shape."
    return stem, [choices[i] for i in order], correct, expl


def clean(p, eps=1e-7):
    out = []
    for q in p:
        if not out or math.hypot(q[0] - out[-1][0], q[1] - out[-1][1]) > eps:
            out.append(q)
    if len(out) > 1 and math.hypot(out[0][0] - out[-1][0], out[0][1] - out[-1][1]) <= eps:
        out.pop()
    changed = True
    while changed and len(out) > 3:
        changed = False
        for i in range(len(out)):
            a, b, c = out[i - 1], out[i], out[(i + 1) % len(out)]
            cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])
            if abs(cross) < 1e-9:
                out.pop(i)
                changed = True
                break
    return out


def clip(p, n, c):
    out = []
    for i in range(len(p)):
        a, b = p[i], p[(i + 1) % len(p)]
        da = n[0] * a[0] + n[1] * a[1] - c
        db = n[0] * b[0] + n[1] * b[1] - c
        if da >= -1e-12:
            out.append(a)
        if (da > 1e-12 and db < -1e-12) or (da < -1e-12 and db > 1e-12):
            t = da / (da - db)
            out.append((a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])))
    return clean(out)


def split(p, a, b):
    d = (b[0] - a[0], b[1] - a[1])
    n = (-d[1], d[0])
    c = n[0] * a[0] + n[1] * a[1]
    left = clip(p, n, c)
    right = clip(p, (-n[0], -n[1]), -c)
    if len(left) < 3 or len(right) < 3 or abs(area(left)) < 1e-6 or abs(area(right)) < 1e-6:
        return None
    return left, right


def candidates(p):
    pts = list(p)
    for i in range(len(p)):
        a, b = p[i], p[(i + 1) % len(p)]
        L = math.hypot(b[0] - a[0], b[1] - a[1])
        if L > 0.5:
            for t in (0.25, 0.5, 0.75):
                pts.append((a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])))
        elif L > 0.3:
            pts.append(((a[0] + b[0]) / 2, (a[1] + b[1]) / 2))
    return pts


def signature(p):
    n = len(p)
    lens, angs = [], []
    for i in range(n):
        a, b, c = p[i - 1], p[i], p[(i + 1) % n]
        lens.append(math.hypot(c[0] - b[0], c[1] - b[1]))
        v1 = (a[0] - b[0], a[1] - b[1])
        v2 = (c[0] - b[0], c[1] - b[1])
        ang = math.atan2(v1[0] * v2[1] - v1[1] * v2[0], v1[0] * v2[0] + v1[1] * v2[1])
        angs.append(abs(ang))
    return lens, angs


def piece_dist(p, q):
    if len(p) != len(q):
        return 9.0
    L1, A1 = signature(p)
    best = 9.0
    for cand in (q, list(reversed(q))):
        L2, A2 = signature(cand)
        n = len(L2)
        for s in range(n):
            m = 0.0
            for i in range(n):
                m = max(m, abs(L1[i] - L2[(i + s) % n]), 0.6 * abs(A1[i] - A2[(i + s) % n]))
                if m >= best:
                    break
            best = min(best, m)
    return best


def set_dist(ps, qs):
    if len(ps) != len(qs):
        return 9.0
    best = 9.0
    for perm in itertools.permutations(range(len(qs))):
        m = max(piece_dist(ps[i], qs[perm[i]]) for i in range(len(ps)))
        best = min(best, m)
    return best


def min_angle(p):
    _, angs = signature(p)
    return min(angs)


def random_cut(outline, rng, n_cuts):
    total = abs(area(outline))
    for _ in range(400):
        pieces = [outline]
        ok = True
        for _ in range(n_cuts):
            idx = max(range(len(pieces)), key=lambda i: abs(area(pieces[i])) * (0.7 + 0.6 * rng.random()))
            pc = pieces[idx]
            cand = candidates(pc)
            done = False
            for _ in range(60):
                a, b = rng.sample(cand, 2)
                res = split(pc, a, b)
                if res:
                    pieces = pieces[:idx] + list(res) + pieces[idx + 1:]
                    done = True
                    break
            if not done:
                ok = False
                break
        if not ok:
            continue
        pieces = [clean(p) for p in pieces]
        if any(abs(area(p)) < 0.14 * total for p in pieces):
            continue
        if any(min_angle(p) < math.radians(24) for p in pieces):
            continue
        if any(len(p) > 4 and len(p) < 8 and min(signature(p)[0]) < 0.18 for p in pieces):
            continue
        return pieces
    return None


OUTLINES = {
    "square": reg(4, 1.25, 45),
    "rectangle": [(-1.5, -0.8), (1.5, -0.8), (1.5, 0.8), (-1.5, 0.8)],
    "triangle": reg(3, 1.45, 90),
    "right triangle": centered([(-1.1, -0.9), (1.5, -0.9), (-1.1, 1.2)]),
    "hexagon": reg(6, 1.3, 0),
    "pentagon": reg(5, 1.3, 90),
    "circle": ellipse(1.3, 1.3, 48),
    "parallelogram": [(-1.6, -0.75), (0.9, -0.75), (1.6, 0.75), (-0.9, 0.75)],
    "trapezoid": [(-1.6, -0.8), (1.6, -0.8), (0.8, 0.8), (-0.8, 0.8)],
    "half circle": [(1.6 * math.cos(math.radians(a)), 1.6 * math.sin(math.radians(a)) - 0.6) for a in range(0, 181, 9)],
    "house": [(-1.1, -1.0), (1.1, -1.0), (1.1, 0.35), (0.0, 1.25), (-1.1, 0.35)],
    "kite": [(0, 1.45), (0.95, 0.35), (0, -1.3), (-0.95, 0.35)],
}


def bbox(p):
    xs = [x for x, _ in p]
    ys = [y for _, y in p]
    return min(xs), min(ys), max(xs), max(ys)


def draw_assembly(pieces, rng, angle):
    s = Svg(150, 120)
    s.rect(1, 1, 148, 118, fill="#ffffff", stroke="#c3cad3", sw=1.2, rx=6)
    rp = [rot(p, angle) for p in pieces]
    x0, y0, x1, y1 = bbox([q for p in rp for q in p])
    sc = min(118 / (x1 - x0), 96 / (y1 - y0), 34)
    cx = 75 - (x0 + x1) / 2 * sc
    cy = 60 + (y0 + y1) / 2 * sc
    for p in rp:
        draw_poly(s, p, cx, cy, sc, fill=FILL, w=1.7)
    return s.svg(), sc


def draw_pieces(pieces, rng, sc):
    gap = 14
    rotated = []
    for p in pieces:
        c = centroid(p)
        q = rot(shift(p, -c[0], -c[1]), rng.choice([0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330]))
        rotated.append(q)
    widths = []
    for q in rotated:
        x0, y0, x1, y1 = bbox(q)
        widths.append(((x1 - x0) * sc, (y1 - y0) * sc, x0, y0, x1, y1))
    total = sum(w[0] for w in widths) + gap * (len(widths) - 1)
    W = max(300, total + 30)
    H = max(130, max(w[1] for w in widths) + 30)
    s = Svg(W, H)
    s.rect(1, 1, W - 2, H - 2, fill="#ffffff", stroke="#9aa3ae", sw=1.4, rx=6)
    x = (W - total) / 2
    for q, (w, h, x0, y0, x1, y1) in zip(rotated, widths):
        cx = x - x0 * sc
        cy = H / 2 + (y0 + y1) / 2 * sc
        draw_poly(s, q, cx, cy, sc, fill=FILL, w=1.7)
        x += w + gap
    return s.svg()


def make_puzzle(rng, outline_name, n_cuts, target):
    outline = OUTLINES[outline_name]
    correct = random_cut(outline, rng, n_cuts)
    if correct is None:
        return None
    distractors = []
    tries = 0
    while len(distractors) < 3 and tries < 600:
        tries += 1
        k = n_cuts if (len(distractors) < 2 or rng.random() < 0.6) else rng.choice([max(1, n_cuts - 1), n_cuts + 1])
        cand = random_cut(outline, rng, k)
        if cand is None:
            continue
        if set_dist(cand, correct) < 0.3:
            continue
        if any(set_dist(cand, d) < 0.25 for d in distractors):
            continue
        distractors.append(cand)
    if len(distractors) < 3:
        return None
    angle = rng.choice([0, 0, 90, 180, 270])
    svgs = []
    scs = []
    for assembly in [correct] + distractors:
        svg, sc = draw_assembly(assembly, rng, rng.choice([0, 90, 180, 270]))
        svgs.append(svg)
        scs.append(sc)
    stem = draw_pieces(correct, rng, scs[0] * 0.92)
    order = place_order(rng, target)
    correct_idx = order.index(0)
    n = len(correct)
    expl = f"The left box shows {n} pieces. Choice {LETTERS[correct_idx]} is the only figure built from exactly these {n} pieces, turned but not flipped. Each of the other choices contains at least one piece with a different shape or size, or a different number of pieces."
    return stem, [svgs[i] for i in order], correct_idx, expl


def place_order(rng, target):
    rest = [1, 2, 3]
    rng.shuffle(rest)
    return rest[:target] + [0] + rest[target:]


def write_set(root, tag, n_conn, n_puz, seed):
    rng = random.Random(seed)
    figdir = pathlib.Path(root) / "figs" / "ao"
    figdir.mkdir(parents=True, exist_ok=True)
    gendir = pathlib.Path(root) / "src" / "_gen"
    gendir.mkdir(parents=True, exist_ok=True)
    items = []
    used = set()
    slots = [i % 4 for i in range(n_conn + n_puz)]
    rng.shuffle(slots)
    for k in range(n_conn):
        items.append(("conn",) + make_connector(rng, used, slots[k]))
    outlines = list(OUTLINES)
    rng.shuffle(outlines)
    k = 0
    made = 0
    while made < n_puz:
        name = outlines[k % len(outlines)]
        k += 1
        cuts = rng.choice([1, 2, 2, 3]) if name not in ("half circle", "kite") else rng.choice([1, 2])
        res = make_puzzle(rng, name, cuts, slots[n_conn + made])
        if res is None:
            continue
        items.append(("puz",) + res)
        made += 1
    mix = items[:]
    rng.shuffle(mix)
    lines = []
    for i, (kind, stem, choices, correct, expl) in enumerate(mix, 1):
        base = f"{tag}-{i:02d}"
        (figdir / f"{base}-q.svg").write_text(stem, encoding="utf-8")
        for j, ch in enumerate(choices):
            (figdir / f"{base}-{'abcd'[j]}.svg").write_text(ch, encoding="utf-8")
        if kind == "conn":
            lines.append(f"? {{{{fig:ao/{base}-q}}}}\n\nWhich figure shows the two shapes correctly connected at points A and B?")
        else:
            lines.append(f"? {{{{fig:ao/{base}-q}}}}\n\nWhich figure shows how the pieces fit together?")
        for j in range(4):
            star = " *" if j == correct else ""
            lines.append(f"- {{{{fig:ao/{base}-{'abcd'[j]}}}}}{star}")
        lines.append(f"> {expl}")
        lines.append("")
    (gendir / f"ao-{tag}.md").write_text("\n".join(lines), encoding="utf-8")


def generate(root):
    write_set(root, "ch", 5, 5, 11)
    write_set(root, "pt1", 8, 7, 23)
    write_set(root, "pt2", 7, 8, 37)
