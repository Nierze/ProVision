"""Parse the LawPhil 1987 Constitution page into structured JSON."""
import json
import re
import unicodedata
from html.parser import HTMLParser

SRC = "consti.html"
OUT = "constitution.json"

BLOCK_TAGS = {"p", "li"}


class Blocks(HTMLParser):
    """Emit one record per <p>/<li> in document order, with list nesting depth."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.blocks = []
        self.buf = None
        self.attrs = {}
        self.bold_depth = 0
        self.bold_chars = 0
        self.ol_depth = 0
        self.counters = []
        # LawPhil writes <li><p>text</p></li>; the marker belongs to the <li>
        # but the text arrives in the inner <p>, so carry it across.
        self.pending = ""

    def handle_starttag(self, tag, attrs):
        if tag == "ol":
            self.ol_depth += 1
            self.counters.append(0)
        elif tag == "br":
            if self.buf is not None:
                self.buf.append(" ")
        elif tag in BLOCK_TAGS:
            self.flush()
            self.buf = []
            self.attrs = dict(attrs)
            self.bold_chars = 0
            if tag == "li" and self.counters:
                self.counters[-1] += 1
                n = self.counters[-1]
                self.pending = f"({n})" if self.ol_depth <= 1 else f"({chr(96 + n)})"
            self.tag = tag
            self.index = self.counters[-1] if (tag == "li" and self.counters) else 0
            self.depth = self.ol_depth if tag == "li" else 0
        elif tag in ("b", "strong"):
            self.bold_depth += 1

    def handle_endtag(self, tag):
        if tag == "ol":
            self.ol_depth = max(0, self.ol_depth - 1)
            if self.counters:
                self.counters.pop()
        elif tag in BLOCK_TAGS:
            self.flush()
        elif tag in ("b", "strong"):
            self.bold_depth = max(0, self.bold_depth - 1)

    def handle_data(self, data):
        if self.buf is not None:
            self.buf.append(data)
            if self.bold_depth:
                self.bold_chars += len(data.strip())

    def flush(self):
        if self.buf is None:
            return
        text = normalise("".join(self.buf))
        if text:
            marker, self.pending = self.pending, ""
            self.blocks.append(
                {
                    "tag": self.tag,
                    "text": f"{marker} {text}" if marker else text,
                    "marked": bool(marker),
                    "align": self.attrs.get("align", ""),
                    "all_bold": self.bold_chars >= len(text.replace(" ", "")) * 0.9,
                    "index": self.index,
                    "depth": self.depth,
                }
            )
        self.buf = None


def normalise(s: str) -> str:
    s = unicodedata.normalize("NFKC", s)
    s = s.replace("’", "'").replace("‘", "'")
    s = s.replace("“", '"').replace("”", '"')
    s = s.replace("–", "-").replace("—", "-").replace("\xa0", " ")
    return re.sub(r"\s+", " ", s).strip()


ROMAN = "I II III IV V VI VII VIII IX X XI XII XIII XIV XV XVI XVII XVIII".split()

ARTICLE_RE = re.compile(r"^ARTICLE\s+([IVX]+)\s*(.*)$")
SECTION_RE = re.compile(r"^Section\s+(\d+)\s*\.\s*(.*)$", re.S)
SUBHEAD_RE = re.compile(r"^([A-D])\.\s+(.+)$")


def main():
    raw = open(SRC, encoding="utf-8", errors="replace").read()
    start = raw.index("1987 CONSTITUTION OF THE REPUBLIC")
    end = raw.index("ORDINANCE")
    parser = Blocks()
    parser.feed(raw[start:end])
    parser.close()

    articles = []
    article = None
    section = None
    subhead = ""

    def close_section():
        nonlocal section
        if section and section["paras"]:
            article["sections"].append(section)
        section = None

    for b in parser.blocks:
        text = b["text"]

        if text.startswith("1987 CONSTITUTION"):
            continue

        # --- headings -------------------------------------------------------
        m = ARTICLE_RE.match(text)
        if m and b["align"] == "center":
            close_section()
            numeral, title = m.group(1), m.group(2).strip()
            article = {
                "numeral": numeral,
                "title": title_case(title),
                "sections": [],
            }
            articles.append(article)
            subhead = ""
            continue

        if text == "PREAMBLE" and b["align"] == "center":
            close_section()
            article = {"numeral": "", "title": "Preamble", "sections": []}
            articles.append(article)
            subhead = ""
            continue

        # sub-headings inside an article (LABOR, EDUCATION, B. THE CIVIL SERVICE ...)
        if b["all_bold"] and not b["marked"] and not SECTION_RE.match(text) and len(text) < 90:
            m2 = SUBHEAD_RE.match(text)
            subhead = title_case(m2.group(2) if m2 else text)
            continue

        # --- body -----------------------------------------------------------
        if article is None:
            continue

        m = SECTION_RE.match(text)
        if m:
            close_section()
            section = {
                "n": m.group(1),
                "subhead": subhead,
                "paras": [m.group(2).strip()] if m.group(2).strip() else [],
            }
            continue

        if section is None:
            # Preamble / Article I bodies have no "Section" prefix
            section = {"n": "", "subhead": subhead, "paras": []}
        section["paras"].append(text)

    close_section()

    for a in articles:
        for s in a["sections"]:
            s["text"] = " ".join(s["paras"])
            del s["paras"]

    articles = postprocess(articles)
    json.dump(articles, open(OUT, "w", encoding="utf-8"), indent=1, ensure_ascii=False)

    total = sum(len(a["sections"]) for a in articles)
    words = sum(len(s["text"].split()) for a in articles for s in a["sections"])
    print(f"{len(articles)} articles, {total} sections, {words} words -> {OUT}")
    for a in articles:
        subs = sorted({s["subhead"] for s in a["sections"] if s["subhead"]})
        print(f"  {a['numeral'] or '—':>5}  {a['title'][:44]:<46} {len(a['sections']):>3} sec  {', '.join(subs)[:60]}")


def postprocess(articles):
    """Two fixes the source markup can't express on its own."""
    out = []
    for a in articles:
        # The signing/attestation block runs on from Art. XVIII §27 with no
        # markup of its own. It is not part of the Constitution's text.
        if a["numeral"] == "XVIII":
            last = a["sections"][-1]
            cut = last["text"].find("The foregoing proposed Constitution")
            if cut > 0:
                last["text"] = last["text"][:cut].strip()

        # Article II's "PRINCIPLES" sub-heading is glued into the article title.
        if a["numeral"] == "II":
            a["title"] = "Declaration of Principles and State Policies"
            for s in a["sections"]:
                if not s["subhead"]:
                    s["subhead"] = "Principles"

        # Article IX is really four articles; they are cited as IX-A ... IX-D
        # and each restarts its own section numbering.
        if a["numeral"] == "IX":
            groups = {}
            for s in a["sections"]:
                groups.setdefault(s["subhead"], []).append(s)
            for letter, (subhead, sections) in zip("ABCD", groups.items()):
                out.append(
                    {
                        "numeral": f"IX-{letter}",
                        "title": subhead.replace("The ", ""),
                        "sections": [dict(s, subhead="") for s in sections],
                    }
                )
            continue

        out.append(a)
    return out


def title_case(s: str) -> str:
    small = {"of", "and", "the", "or", "in", "to", "on", "a", "an", "for"}
    words = s.lower().split()
    out = []
    for i, w in enumerate(words):
        out.append(w if (i and w in small) else w.capitalize())
    return " ".join(out)


main()
