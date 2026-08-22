"""Extract per-tooth silhouette polygons from the reference chart image.

Prints the CSS for each ISO 3950 tooth: absolute position (% of the chart box)
plus a clip-path polygon (% of the tooth's own box). Paste the rules between the
@generated-tooth-shapes markers in html/css/style.css.

Run from the repo root:  python3 scripts/extract-tooth-shapes.py
"""
import os

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
IMG = os.path.join(ROOT, "html/images/numerotation-des-dents-dentition-01-CDMM.jpg")
OVERLAY_OUT = os.path.join(HERE, "tooth-shapes-overlay.png")

im = Image.open(IMG).convert("RGB")
px = im.load()
W, H = im.size

# Bands measured from the image: tooth silhouettes sit above/below the number rows.
# Kept tight so stray specks between the crowns and the numbers are not picked up.
UPPER = (0, 264)
LOWER = (586, 804)


# Teeth 15, 27 and 36 carry a pale highlight straight across the crown that reads
# as background, splitting the body into two runs and notching the traced outline.
# Only these need the seam bridged, so it stays an opt-in per-tooth fix rather
# than a global rule that would shift the other 29 shapes.
SEAM_FIX = {15: 16, 27: 16, 36: 16}


def runs(x, y0, y1, max_seam=0):
    """Contiguous vertical runs of non-white pixels in column x.

    With max_seam > 0, runs separated by at most that many pixels are merged.
    """
    out, start = [], None
    for y in range(y0, y1):
        r, g, b = px[x, y]
        solid = not (r > 243 and g > 243 and b > 243)
        if solid and start is None:
            start = y
        elif not solid and start is not None:
            out.append((start, y - 1))
            start = None
    if start is not None:
        out.append((start, y1 - 1))

    if not max_seam:
        return out

    merged = []
    for r in out:
        if merged and r[0] - merged[-1][1] <= max_seam:
            merged[-1] = (merged[-1][0], r[1])
        else:
            merged.append(r)
    return merged


def longest_run(x, y0, y1):
    rs = runs(x, y0, y1)
    if not rs:
        return None
    return max(rs, key=lambda r: r[1] - r[0])


def thickness(x, y0, y1):
    r = longest_run(x, y0, y1)
    return 0 if r is None else r[1] - r[0]


def quadrant_bounds(xlo, xhi, y0, y1):
    """Left/right extent of the tooth blob inside a quadrant."""
    xs = [x for x in range(xlo, xhi) if thickness(x, y0, y1) > 10]
    return min(xs), max(xs)


def split_at_valleys(x0, x1, y0, y1, count):
    """Cut the quadrant into `count` teeth at the narrowest necks between crowns.

    Teeth touch, so boundaries show up as local minima in the column-thickness
    profile. Pick the `count - 1` deepest minima that are far enough apart
    instead of assuming the teeth are evenly spaced (they are not).
    """
    prof = [thickness(x, y0, y1) for x in range(x0, x1 + 1)]
    n = len(prof)
    span = (x1 - x0) / count
    min_gap = int(span * 0.45)

    # A column is a candidate neck if it is the local min of its window.
    win = max(6, int(span * 0.12))
    cands = []
    for i in range(min_gap // 2, n - min_gap // 2):
        lo, hi = max(0, i - win), min(n, i + win + 1)
        if prof[i] == min(prof[lo:hi]):
            # depth = how much thinner than the surrounding crowns
            around = max(prof[max(0, i - int(span)):min(n, i + int(span))])
            cands.append((around - prof[i], i))

    cands.sort(reverse=True)
    picked = []
    for depth, i in cands:
        if all(abs(i - j) >= min_gap for j in picked):
            picked.append(i)
        if len(picked) == count - 1:
            break
    picked.sort()
    return [x0] + [x0 + i for i in picked] + [x1]


def trace(xa, xb, y0, y1, step=10, max_seam=0):
    """Follow the tooth body between two cut columns, tracking run continuity."""
    cols = []
    prev = None
    for x in range(xa, xb + 1):
        rs = [r for r in runs(x, y0, y1, max_seam) if r[1] - r[0] > 8]
        if not rs:
            continue
        if prev is None:
            r = max(rs, key=lambda r: r[1] - r[0])
        else:
            # keep the run that best overlaps the previous column's run
            def overlap(r):
                return min(r[1], prev[1]) - max(r[0], prev[0])
            r = max(rs, key=overlap)
            if overlap(r) < 5:
                r = max(rs, key=lambda r: r[1] - r[0])
        cols.append((x, r[0], r[1]))
        prev = r
    if not cols:
        return None

    # Median-smooth the two contours so single-column specks don't spike the outline.
    def smooth(idx, k=5):
        vals = [c[idx] for c in cols]
        out = []
        for i in range(len(vals)):
            lo, hi = max(0, i - k), min(len(vals), i + k + 1)
            w = sorted(vals[lo:hi])
            out.append(w[len(w) // 2])
        return out

    tops, bots = smooth(1), smooth(2)
    cols = [(c[0], tops[i], bots[i]) for i, c in enumerate(cols)]

    xs = [c[0] for c in cols]
    sample = [c for i, c in enumerate(cols) if i % step == 0]
    if sample[-1] != cols[-1]:
        sample.append(cols[-1])

    bx0, bx1 = xs[0], xs[-1]
    by0 = min(c[1] for c in cols)
    by1 = max(c[2] for c in cols)
    bw, bh = max(bx1 - bx0, 1), max(by1 - by0, 1)

    pts = [((c[0] - bx0) / bw * 100, (c[1] - by0) / bh * 100) for c in sample]
    pts += [((c[0] - bx0) / bw * 100, (c[2] - by0) / bh * 100) for c in reversed(sample)]
    return dict(x0=bx0, y0=by0, x1=bx1, y1=by1, pts=pts,
                cols=cols)


# ISO 3950 quadrants, left-to-right as drawn in the chart.
QUADRANTS = [
    # (label list left->right, x search range, band)
    ([18, 17, 16, 15, 14, 13, 12, 11], (0, 1585), UPPER),
    ([21, 22, 23, 24, 25, 26, 27, 28], (1615, 3200), UPPER),
    ([48, 47, 46, 45, 44, 43, 42, 41], (0, 1585), LOWER),
    ([31, 32, 33, 34, 35, 36, 37, 38], (1615, 3200), LOWER),
]

teeth = {}
for labels, (sx0, sx1), (y0, y1) in QUADRANTS:
    qx0, qx1 = quadrant_bounds(sx0, sx1, y0, y1)
    cuts = split_at_valleys(qx0, qx1, y0, y1, len(labels))
    for i, num in enumerate(labels):
        t = trace(cuts[i], cuts[i + 1], y0, y1, max_seam=SEAM_FIX.get(num, 0))
        if t:
            teeth[num] = t

print("/* generated tooth shapes */")
order = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
         48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
for num in order:
    t = teeth.get(num)
    if not t:
        print("/* MISSING %d */" % num)
        continue
    left = t["x0"] / W * 100
    top = t["y0"] / H * 100
    wid = (t["x1"] - t["x0"]) / W * 100
    hei = (t["y1"] - t["y0"]) / H * 100
    poly = ", ".join("%.1f%% %.1f%%" % p for p in t["pts"])
    print('.td-tooth[data-tooth="%d"] { left: %.3f%%; top: %.3f%%; width: %.3f%%; height: %.3f%%;'
          ' clip-path: polygon(%s); }' % (num, left, top, wid, hei, poly))

# Debug overlay: the traced outlines drawn back onto the chart, for eyeballing.
dbg = im.copy()
d = ImageDraw.Draw(dbg)
for num, t in teeth.items():
    ring = [(c[0], c[1]) for c in t["cols"]] + [(c[0], c[2]) for c in reversed(t["cols"])]
    d.line(ring + [ring[0]], fill=(255, 0, 0), width=4)
dbg.save(OVERLAY_OUT)
print("/* teeth found: %d */" % len(teeth))
