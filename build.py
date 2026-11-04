import html
import math
import pathlib
import re
import sys

import markdown
import pymupdf
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "src"
FIGS = ROOT / "figs"
BUILD = ROOT / "build"
OUT = ROOT / "ASVAB-Study-Guide.pdf"
TITLE = "The Plain-English ASVAB Study Guide"
EXT = ["tables", "attr_list", "sane_lists", "def_list", "nl2br"]
LETTERS = "ABCD"

problems = []
stash = {}
quizzes = []
quiz_by_group = {}
fig_counter = [0]


TABLE_CLASS = re.compile(r"<table>(.*?</table>)\s*<p>\{\.([\w -]+)\}</p>", re.S)


def md(text):
    h = markdown.markdown(text, extensions=EXT, output_format="html")
    return TABLE_CLASS.sub(lambda m: f'<table class="{m.group(2).strip()}">{m.group(1)}', h)


def md_inline(text):
    h = md(text).strip()
    m = re.fullmatch(r"<p>(.*?)</p>", h, flags=re.S)
    if m and "<p>" not in m.group(1):
        return m.group(1)
    return h


def put(kind, value):
    key = f"ZZ{kind}{len(stash)}ZZ"
    stash[key] = value
    return key


FRAC = re.compile(r"\[\[([^\[\]|/]+?)/([^\[\]|]+?)\]\]")


SUP_BRACE = re.compile(r"\^\{([^{}]*)\}")
SUP_PLAIN = re.compile(r"\^([−\-]?\d+(?:\.\d+)?|[a-zA-Z])")
SUB_BRACE = re.compile(r"~\{([^{}]*)\}")


def scripts(text):
    text = SUP_BRACE.sub(r"<sup>\1</sup>", text)
    text = SUP_PLAIN.sub(r"<sup>\1</sup>", text)
    return SUB_BRACE.sub(r"<sub>\1</sub>", text)


def fracs(text):
    text = FRAC.sub(
        lambda m: f'<span class="frac"><span class="fn">{m.group(1).strip()}</span><span class="fd">{m.group(2).strip()}</span></span>',
        text,
    )
    return scripts(text)


def fig_svg(name):
    p = FIGS / f"{name}.svg"
    if not p.exists():
        problems.append(f"missing figure: {name}")
        return f'<span class="missing">[missing figure {html.escape(name)}]</span>'
    s = p.read_text(encoding="utf-8")
    s = re.sub(r"<\?xml.*?\?>", "", s).strip()
    fig_counter[0] += 1
    k = f"g{fig_counter[0]}"
    for i in set(re.findall(r'\bid="([^"]+)"', s)):
        s = s.replace(f'id="{i}"', f'id="{k}{i}"').replace(f"url(#{i})", f"url(#{k}{i})").replace(f'href="#{i}"', f'href="#{k}{i}"')
    return s


FIG_BLOCK = re.compile(r"<p>\s*\{\{fig:([^}|]+)(?:\|([^}]*))?\}\}\s*</p>")
FIG_INLINE = re.compile(r"\{\{fig:([^}|]+)(?:\|([^}]*))?\}\}")


def figs(h):
    def block(m):
        cap = f"<figcaption>{m.group(2).strip()}</figcaption>" if m.group(2) else ""
        return f'<figure class="fig">{fig_svg(m.group(1).strip())}{cap}</figure>'

    def inline(m):
        return f'<span class="figi">{fig_svg(m.group(1).strip())}</span>'

    h = FIG_BLOCK.sub(block, h)
    return FIG_INLINE.sub(inline, h)


def number_of(text):
    t = re.sub(r'<span class="frac"><span class="fn">(.*?)</span><span class="fd">(.*?)</span></span>', r" \1/\2", fracs(text))
    t = re.sub(r"<[^>]+>", " ", t)
    t = t.replace("−", "-").replace(",", "")
    t = re.sub(r"-\s+(\d)", r"-", t)
    m = re.search(r"(-?)(\d+)\s+(\d+)\s*/\s*(\d+)", t)
    if m:
        v = int(m.group(2)) + int(m.group(3)) / int(m.group(4))
        return -v if m.group(1) else v
    m = re.search(r"(-?\d+(?:\.\d+)?)\s*/\s*(\d+(?:\.\d+)?)", t)
    if m:
        return float(m.group(1)) / float(m.group(2))
    m = re.search(r"-?\d*\.?\d+", t)
    if m:
        return float(m.group(0))
    return None


SAFE = {k: getattr(math, k) for k in ("sqrt", "pi", "floor", "ceil", "comb", "perm", "factorial", "log10", "exp")}
SAFE.update({"round": round, "abs": abs, "min": min, "max": max, "sum": sum, "gcd": math.gcd, "lcm": math.lcm})


class Question:
    def __init__(self):
        self.text = []
        self.choices = []
        self.correct = []
        self.expl = []
        self.check = None


class Quiz:
    def __init__(self, qid, title, group, opts):
        self.id = qid
        self.title = title
        self.group = group
        self.time = opts.get("time")
        self.instr = opts.get("instr")
        self.items = []

    def questions(self):
        return [q for k, q in self.items if k == "q"]


def parse_quiz(header, body):
    parts = [p.strip() for p in header.split("|")]
    qid = parts[0]
    title = parts[1] if len(parts) > 1 else qid
    opts = {}
    for p in parts[2:]:
        if "=" in p:
            k, v = p.split("=", 1)
            opts[k.strip()] = v.strip()
    group = opts.get("group", "now")
    z = Quiz(qid, title, group, opts)
    cur = None
    passage = None
    for raw in body.split("\n"):
        line = raw.rstrip()
        if passage is not None:
            if line.strip() == "[[/passage]]":
                z.items.append(("passage", "\n".join(passage)))
                passage = None
            else:
                passage.append(line)
            continue
        if line.strip().startswith("[[passage"):
            passage = []
            title_m = re.match(r"\s*\[\[passage\s*(.*?)\]\]", line)
            if title_m and title_m.group(1):
                passage.append(f"**{title_m.group(1)}**\n")
            cur = None
            continue
        if line.startswith("@instr:"):
            z.instr = line[7:].strip()
            continue
        if line.startswith("@time:"):
            z.time = line[6:].strip()
            continue
        if line.startswith("? "):
            cur = Question()
            cur.text.append(line[2:])
            z.items.append(("q", cur))
            continue
        if cur is None:
            if line.strip():
                problems.append(f"{qid}: stray line outside question: {line[:60]}")
            continue
        if line.startswith("- "):
            c = line[2:].rstrip()
            if c.endswith(" *"):
                cur.correct.append(len(cur.choices))
                c = c[:-2].rstrip()
            cur.choices.append(c)
            continue
        if line.startswith(">"):
            cur.expl.append(line[1:].strip())
            continue
        if line.startswith("= "):
            cur.check = line[2:].strip()
            continue
        if cur.choices:
            if line.strip():
                problems.append(f"{qid}: unexpected line after choices: {line[:60]}")
            continue
        cur.text.append(line)
    validate_quiz(z)
    return z


def validate_quiz(z):
    for n, q in enumerate(z.questions(), 1):
        where = f"{z.id} Q{n}"
        if len(q.choices) != 4:
            problems.append(f"{where}: {len(q.choices)} choices")
        if len(q.correct) != 1:
            problems.append(f"{where}: {len(q.correct)} correct answers marked")
            continue
        if len(set(c.strip().lower() for c in q.choices)) != len(q.choices):
            problems.append(f"{where}: duplicate choices")
        if not q.expl:
            problems.append(f"{where}: no explanation")
        if q.check:
            expr, tol = q.check, 1e-6
            if " ~ " in expr:
                expr, t = expr.split(" ~ ")
                tol = float(t)
            try:
                val = eval(expr, {"__builtins__": {}}, SAFE)
            except Exception as e:
                problems.append(f"{where}: check error {e}: {expr}")
                continue
            got = number_of(q.choices[q.correct[0]])
            if got is None or abs(float(val) - got) > tol * max(1.0, abs(float(val))):
                problems.append(f"{where}: CHECK FAILED expr={expr} -> {val} but marked choice is '{q.choices[q.correct[0]]}'")
            others = [number_of(c) for i, c in enumerate(q.choices) if i != q.correct[0]]
            for o in others:
                if o is not None and abs(float(val) - o) <= tol * max(1.0, abs(float(val))):
                    problems.append(f"{where}: a distractor also equals the checked value")


def plain_len(s):
    t = re.sub(r"<[^>]+>", "", fracs(s))
    t = re.sub(r"\[\[|\]\]", "", t)
    t = t.replace("**", "").replace("*", "")
    return len(t)


def render_question(n, q):
    has_fig = any("{{fig:" in c for c in q.choices)
    longest = max((plain_len(c) for c in q.choices), default=0)
    if has_fig or longest <= 13:
        cols = "c4"
    elif longest <= 36:
        cols = "c2"
    else:
        cols = "c1"
    ch = "".join(
        f'<div class="ch"><span class="cl">{LETTERS[i]}</span><span class="ct">{md_inline(fracs(c))}</span></div>'
        for i, c in enumerate(q.choices)
    )
    raw = re.sub(r"(\{\{fig:[^}]+\}\})[ \t]*\n(?!\n)", r"\1\n\n", "\n".join(q.text).strip())
    text = md(fracs(raw))
    return f'<div class="q"><div class="qn">{n}</div><div class="qb"><div class="qt">{text}</div><div class="choices {cols}">{ch}</div></div></div>'


def render_quiz(z):
    qs = z.questions()
    meta = [f"{len(qs)} questions"]
    if z.time:
        meta.append(f"Time: {z.time}")
    out = [f'<section class="quiz" id="{z.id}">']
    out.append(f'<div class="quiz-head"><div class="quiz-title">{md_inline(fracs(z.title))}</div><div class="quiz-meta">{" &middot; ".join(meta)}</div></div>')
    if z.instr:
        out.append(f'<div class="quiz-instr">{md_inline(fracs(z.instr))}</div>')
    n = 0
    for kind, item in z.items:
        if kind == "passage":
            out.append(f'<div class="passage">{md(fracs(item))}</div>')
        else:
            n += 1
            out.append(render_question(n, item))
    out.append(f'<div class="quiz-score">Score: ________ / {len(qs)}</div>')
    out.append("</section>")
    return "".join(out)


def render_key(z):
    rows = []
    for n, q in enumerate(z.questions(), 1):
        letter = LETTERS[q.correct[0]] if q.correct else "?"
        expl = md(fracs("\n".join(q.expl))) if q.expl else ""
        rows.append(f'<div class="ak"><div class="akh"><span class="akn">{n}.</span><span class="akl">{letter}</span></div><div class="ake">{expl}</div></div>')
    return f'<div class="akey"><div class="akey-title">{md_inline(fracs(z.title))}</div><div class="akey-list">{"".join(rows)}</div></div>'


QUIZ_RE = re.compile(r"^::: quiz (.+?)\n(.*?)^:::[ \t]*$", re.S | re.M)
BOX_RE = re.compile(r"^(:{3,})[ \t]*([\w-]+)[ \t]*(.*?)\n(.*?)^\1[ \t]*$", re.S | re.M)
BOX_LABEL = {
    "key": "Key Idea",
    "tip": "Tip",
    "trap": "Watch Out",
    "example": "Example",
    "memory": "Memory Trick",
    "formula": "Formulas",
    "note": "Note",
    "strategy": "Strategy",
    "check": "Quick Check",
}


def do_boxes(text):
    def rep(m):
        kind, title, body = m.group(2), m.group(3).strip(), m.group(4)
        inner = md(do_boxes(body))
        if kind == "div":
            return "\n\n" + put("BOX", f'<div class="{title}">{inner}</div>') + "\n\n"
        label = title or BOX_LABEL.get(kind, kind.title())
        h = f'<div class="box {kind}"><div class="box-title">{md_inline(label)}</div>{inner}</div>'
        return "\n\n" + put("BOX", h) + "\n\n"

    return BOX_RE.sub(rep, text)


def do_quizzes(text):
    def rep(m):
        z = parse_quiz(m.group(1), m.group(2))
        quizzes.append(z)
        quiz_by_group.setdefault(z.group, []).append(z)
        h = render_quiz(z)
        if z.group == "now":
            h += render_key(z)
        return "\n\n" + put("QUIZ", h) + "\n\n"

    return QUIZ_RE.sub(rep, text)


def do_parts(text):
    def rep(m):
        bits = [b.strip() for b in m.group(1).split("|")]
        num, title = bits[0], bits[1]
        sub = bits[2] if len(bits) > 2 else ""
        return "\n\n" + put("PART", (num, title, sub)) + "\n\n"

    return re.sub(r"^\{\{part:(.+?)\}\}[ \t]*$", rep, text, flags=re.M)


def include(text, base):
    def rep(m):
        p = base / m.group(1).strip()
        if not p.exists():
            problems.append(f"missing include {p}")
            return ""
        return include(p.read_text(encoding="utf-8"), p.parent)

    return re.sub(r"^\{\{include:(.+?)\}\}[ \t]*$", rep, text, flags=re.M)


def preprocess(text, base):
    text = include(text, base)
    text = re.sub(r"^(\|.*\|)[ \t]*\n(\{\.[\w -]+\})[ \t]*$", r"\1\n\n\2", text, flags=re.M)
    text = fracs(text)
    text = re.sub(r"\{\{blank\}\}", '<span class="blank"></span>', text)
    text = do_quizzes(text)
    text = do_parts(text)
    text = do_boxes(text)
    text = re.sub(r"^\{\{pagebreak\}\}[ \t]*$", "\n\n" + '<div class="pb"></div>' + "\n\n", text, flags=re.M)
    text = re.sub(r"^\{\{answerkeys:(.+?)\}\}[ \t]*$", lambda m: "\n\n" + f"ZZAK{m.group(1).strip()}ZZ" + "\n\n", text, flags=re.M)
    return text


toc = []
counters = {"chapter": 0, "head": 0}


def text_of(h):
    return html.unescape(re.sub(r"<[^>]+>", "", h)).strip()


def attr(attrs, name):
    m = re.search(rf'{name}="([^"]*)"', attrs)
    return m.group(1) if m else None


def post(h):
    h = re.sub(r"<p>(ZZ(?:BOX|QUIZ)\d+ZZ)</p>", r"\1", h)

    def unstash_simple(m):
        return stash[m.group(0)]

    for _ in range(4):
        h = re.sub(r"ZZ(?:BOX|QUIZ)\d+ZZ", unstash_simple, h)

    pattern = re.compile(r"<p>(ZZPART\d+ZZ)</p>|<h([1-3])([^>]*)>(.*?)</h\2>", re.S)

    def rep(m):
        if m.group(1):
            num, title, sub = stash[m.group(1)]
            counters["head"] += 1
            hid = f"s{counters['head']}"
            toc.append({"level": 0, "label": num, "text": title, "id": hid})
            sub_html = f'<p class="part-sub">{md_inline(sub)}</p>' if sub else ""
            return f'<section class="part-page"><div class="part-inner"><div class="part-num">{num}</div><h1 class="part-title" id="{hid}">{md_inline(title)}</h1>{sub_html}</div></section>'
        level = int(m.group(2))
        attrs = m.group(3) or ""
        inner = m.group(4)
        counters["head"] += 1
        hid = attr(attrs, "id") or f"s{counters['head']}"
        cls = attr(attrs, "class") or ""
        if level == 1:
            label = attr(attrs, "data-label")
            if not label and "nonum" not in cls:
                counters["chapter"] += 1
                label = f"Chapter {counters['chapter']}"
            sub = attr(attrs, "data-sub")
            toc_label = str(counters["chapter"]) if label and label.startswith("Chapter") else (attr(attrs, "data-short") or "")
            toc.append({"level": 1, "label": toc_label, "text": text_of(inner), "id": hid})
            lab = f'<div class="chap-label">{label}</div>' if label else ""
            sub_html = f'<div class="chap-sub">{md_inline(html.unescape(sub))}</div>' if sub else ""
            return f'<header class="chap {cls}">{lab}<h1 id="{hid}">{inner}</h1>{sub_html}</header>'
        if level == 2 and "notoc" not in cls and text_of(inner) != "Chapter Summary":
            toc.append({"level": 2, "label": "", "text": text_of(inner), "id": hid})
        return f'<h{level} id="{hid}" class="{cls}">{inner}</h{level}>'

    h = pattern.sub(rep, h)
    return h


def answer_keys(h):
    def rep(m):
        g = m.group(1)
        zs = quiz_by_group.get(g, [])
        if not zs:
            problems.append(f"answer key group '{g}' is empty")
        return "".join(render_key(z) for z in zs)

    h = re.sub(r"<p>ZZAK(.+?)ZZ</p>", rep, h)
    return h


def render_toc(pages):
    rows = []
    for i, e in enumerate(toc):
        pg = pages.get(e["id"], "000") if pages else "000"
        link = f'href="#{e["id"]}"'
        if e["level"] == 0:
            rows.append(f'<a class="toc-part" {link}><span class="tp-num">{e["label"]}</span><span class="tp-t">{html.escape(e["text"])}</span><span class="pg">{pg}</span></a>')
        elif e["level"] == 1:
            lab = f'<span class="tc-num">{e["label"]}</span>' if e["label"] else '<span class="tc-num"></span>'
            rows.append(f'<a class="toc-row toc-ch" {link}>{lab}<span class="t">{html.escape(e["text"])}</span><span class="dots"></span><span class="pg">{pg}</span></a>')
        else:
            rows.append(f'<a class="toc-row toc-sec" {link}><span class="t">{html.escape(e["text"])}</span><span class="dots"></span><span class="pg">{pg}</span></a>')
    return f'<section class="toc"><div class="toc-title" id="contents">Contents</div>{"".join(rows)}</section>'


def render_cover(nq):
    tpl = (SRC / "cover.html").read_text(encoding="utf-8")
    return tpl.replace("{{QCOUNT}}", f"{nq:,}")


def build_body():
    files = sorted(p for p in SRC.glob("*.md") if not p.name.startswith("_"))
    out = []
    for f in files:
        text = f.read_text(encoding="utf-8")
        text = preprocess(text, f.parent)
        h = md(text)
        h = post(h)
        out.append(f"<!-- {f.name} -->\n" + h)
    body = "\n".join(out)
    body = answer_keys(body)
    body = figs(body)
    return body


def page_html(body, pages, nq):
    css = (ROOT / "style.css").read_text(encoding="utf-8")
    return (
        "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">"
        f"<title>{TITLE}</title><style>{css}</style></head><body>"
        f"{figs(render_cover(nq))}{render_toc(pages)}{body}</body></html>"
    )


def print_pdf(html_path, pdf_path):
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page()
        pg.goto(html_path.as_uri(), wait_until="load")
        pg.wait_for_timeout(300)
        pg.pdf(path=str(pdf_path), format="Letter", print_background=True, prefer_css_page_size=True, outline=True, tagged=True)
        b.close()


def find_pages(pdf_path):
    doc = pymupdf.open(str(pdf_path))
    result = {}
    try:
        names = doc.resolve_names()
    except Exception as e:
        names = {}
        problems.append(f"resolve_names failed: {e}")
    for e in toc:
        d = names.get(e["id"])
        if d and d.get("page", -1) >= 0:
            result[e["id"]] = d["page"] + 1
    if len(result) < len(toc):
        print(f"named destinations matched {len(result)} of {len(toc)}; using TOC link order")
        links = []
        for i, page in enumerate(doc):
            if i > 12:
                break
            for l in page.get_links():
                if l.get("kind") in (pymupdf.LINK_GOTO, pymupdf.LINK_NAMED) and l.get("page", -1) >= 0:
                    links.append(l["page"] + 1)
        if len(links) >= len(toc):
            for e, pg in zip(toc, links):
                result.setdefault(e["id"], pg)
    doc.close()
    return result


def main():
    BUILD.mkdir(exist_ok=True)
    sys.path.insert(0, str(ROOT / "tools"))
    for mod in ("figs", "ao"):
        p = ROOT / "tools" / f"{mod}.py"
        if p.exists():
            __import__(mod).generate(ROOT)
    body = build_body()
    nq = sum(len(z.questions()) for z in quizzes)
    dist = {}
    for z in quizzes:
        for q in z.questions():
            if q.correct:
                dist[LETTERS[q.correct[0]]] = dist.get(LETTERS[q.correct[0]], 0) + 1
    print(f"quizzes: {len(quizzes)}  questions: {nq}  answer letters: {dict(sorted(dist.items()))}")
    for z in quizzes:
        c = {}
        for q in z.questions():
            if q.correct:
                c[LETTERS[q.correct[0]]] = c.get(LETTERS[q.correct[0]], 0) + 1
        print(f"  {z.id:<14} {len(z.questions()):>3}  {dict(sorted(c.items()))}")
    h1 = BUILD / "book.html"
    h1.write_text(page_html(body, None, nq), encoding="utf-8")
    tmp = BUILD / "pass1.pdf"
    print_pdf(h1, tmp)
    pages = find_pages(tmp)
    missing = [e["text"] for e in toc if e["id"] not in pages]
    if missing:
        problems.append(f"TOC entries without page numbers: {missing[:5]}")
    h1.write_text(page_html(body, pages, nq), encoding="utf-8")
    final = BUILD / "pass2.pdf"
    print_pdf(h1, final)
    doc = pymupdf.open(str(final))
    doc.set_metadata({"title": TITLE, "author": "ASVAB Study Guide", "subject": "ASVAB and AFQT test preparation", "keywords": "ASVAB, AFQT, CAT-ASVAB, PiCAT, study guide"})
    doc.save(str(OUT), garbage=3, deflate=True)
    n = doc.page_count
    doc.close()
    print(f"pages: {n}  ->  {OUT}")
    if problems:
        print(f"\n{len(problems)} PROBLEMS:")
        for p in problems:
            print("  -", p)


if __name__ == "__main__":
    main()
