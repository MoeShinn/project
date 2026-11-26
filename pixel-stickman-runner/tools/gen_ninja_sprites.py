import math, os, sys
from PIL import Image

# ---------- bảng màu (lấy theo ảnh Gemini) ----------
OUT = (0, 0, 0)
BODY = (38, 38, 38)
BODY_FAR = (24, 24, 24)
BODY_HI = (62, 62, 62)
HEAD = (30, 30, 30)
RED = (205, 32, 26)
RED_D = (138, 20, 16)
PANT = (96, 66, 48)
PANT_HI = (128, 94, 68)
PANT_FAR = (66, 45, 34)
SHOE = (14, 14, 14)
AURA1 = (255, 70, 50)
AURA2 = (255, 130, 90)

S = lambda a: math.sin(math.radians(a))
C = lambda a: math.cos(math.radians(a))


class Spr:
    def __init__(self, w, h):
        self.w, self.h, self.px = w, h, {}

    def put(self, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[(x, y)] = c

    def disc(self, cx, cy, d, c):
        cx, cy = int(round(cx)), int(round(cy))
        r2 = (d / 2.0) ** 2
        R = int(d // 2 + 1)
        for x in range(cx - R, cx + R + 1):
            for y in range(cy - R, cy + R + 1):
                if (x - cx) ** 2 + (y - cy) ** 2 <= r2:
                    self.put(x, y, c)

    def line(self, a, b, d, c):
        n = int(max(abs(b[0] - a[0]), abs(b[1] - a[1])) * 2) + 1
        for i in range(n + 1):
            t = i / n
            self.disc(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, d, c)

    def poly(self, pts, c):
        ys = [p[1] for p in pts]
        for y in range(int(min(ys)), int(max(ys)) + 1):
            xs = []
            for i in range(len(pts)):
                (x1, y1), (x2, y2) = pts[i], pts[(i + 1) % len(pts)]
                if (y1 <= y < y2) or (y2 <= y < y1):
                    xs.append(x1 + (y - y1) * (x2 - x1) / (y2 - y1))
            xs.sort()
            for i in range(0, len(xs) - 1, 2):
                for x in range(int(round(xs[i])), int(round(xs[i + 1])) + 1):
                    self.put(x, y, c)

    def lowest(self):
        return max(y for _, y in self.px)

    def render(self, ground=None):
        if ground is not None:
            dy = ground - self.lowest_nonoutline()
            self.px = {(x, y + dy): c for (x, y), c in self.px.items()}
        im = Image.new("RGBA", (self.w, self.h), (0, 0, 0, 0))
        P = im.load()
        keys = set(self.px)
        for (x, y), c in self.px.items():
            if 0 <= x < self.w and 0 <= y < self.h:
                P[x, y] = c + (255,)
        for (x, y) in keys:  # viền đen ngoài
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                q = (x + dx, y + dy)
                if q not in keys and 0 <= q[0] < self.w and 0 <= q[1] < self.h:
                    P[q] = OUT + (255,)
        return im

    def lowest_nonoutline(self):
        return self.lowest()


# ---------- xương ----------
def limb(h, L1, L2, a1, a2):
    k = (h[0] + L1 * S(a1), h[1] + L1 * C(a1))
    f = (k[0] + L2 * S(a2), k[1] + L2 * C(a2))
    return k, f


def draw_head(sp, hx, hy, tail_phase, r=13, band=True, flare=0):
    sp.disc(hx, hy, r, HEAD)
    # băng đô
    for (x, y), c in list(sp.px.items()):
        pass
    rr = r / 2.0
    for y in (hy - 2, hy - 1, hy):
        for x in range(int(hx - rr - 1), int(hx + rr + 2)):
            if (x - hx) ** 2 + (y - hy) ** 2 <= rr * rr:
                sp.put(x, y, RED if y < hy else RED_D)
    bx, by = hx - rr + 1, hy - 1
    w1 = 2.2 * S(tail_phase)
    w2 = 2.2 * S(tail_phase + 100)
    m1, e1 = (bx - 5, by - 1 + w1), (bx - 11, by - 4 + w1 * 1.5)
    m2, e2 = (bx - 4, by + 1 + w2), (bx - 10, by + 4 + w2 * 1.5)
    for (m, e) in ((m1, e1), (m2, e2)):
        sp.line((bx, by), m, 3, RED)
        sp.line(m, e, 3, RED_D)
        sp.put(e[0] - 1, e[1], RED_D)


def draw_ninja(P, tail=0.0):
    """P: dict các điểm xương. Vẽ theo thứ tự xa -> gần."""
    sp = Spr(64, 64)
    # tay xa
    sp.line(P["sh"], P["elF"], 3, BODY_FAR)
    sp.line(P["elF"], P["haF"], 3, BODY_FAR)
    sp.disc(*P["haF"], 3, BODY_FAR)
    # chân xa (quần)
    sp.line(P["hip"], P["knF"], 5, PANT_FAR)
    sp.line(P["knF"], P["ftF"], 5, PANT_FAR)
    sp.line(P["ftF"], (P["ftF"][0] + 3, P["ftF"][1] + 0.5), 3, SHOE)
    # thân
    sp.line(P["neck"], P["hip"], 3, BODY)
    sp.line(P["neck"], ((P["neck"][0] * 2 + P["hip"][0]) / 3, (P["neck"][1] * 2 + P["hip"][1]) / 3), 5, BODY)
    # chân gần (quần)
    sp.line(P["hip"], P["knN"], 5, PANT)
    sp.line(P["knN"], P["ftN"], 5, PANT)
    sp.line((P["hip"][0], P["hip"][1] - 1), (P["hip"][0] + 0.5, P["hip"][1] + 4), 5, PANT)
    sp.line(P["knN"], (P["knN"][0] + 1, P["knN"][1] - 3), 3, PANT_HI)  # nếp đầu gối
    sp.line(P["ftN"], (P["ftN"][0] + 3, P["ftN"][1] + 0.5), 3, SHOE)
    # tay gần
    sp.line(P["sh"], P["elN"], 3, BODY)
    sp.line(P["elN"], P["haN"], 3, BODY)
    sp.disc(*P["haN"], 3, BODY)
    # đầu
    draw_head(sp, *P["head"], tail)
    return sp


def run_pose(p, lean=14, hipx=28, hipy=40):
    a = lambda ph: 45 * S(360 * ph)
    def flex(ph):
        return 12 + 72 * max(0, C(360 * ph)) + 25 * max(0, -S(360 * ph))
    hip = (hipx, hipy)
    pN, pF = p, p + 0.5
    a1N, a1F = a(pN), a(pF)
    knN, ftN = limb(hip, 13, 13, a1N, a1N - flex(pN))
    knF, ftF = limb(hip, 13, 13, a1F, a1F - flex(pF))
    neck = (hip[0] + 17 * S(lean), hip[1] - 17 * C(lean))
    sh = (neck[0], neck[1] + 2)
    bN = -50 * S(360 * pN)   # tay ngược chân
    bF = -50 * S(360 * pF)
    elN, haN = limb(sh, 9, 9, bN, bN + 75)
    elF, haF = limb(sh, 9, 9, bF, bF + 75)
    head = (neck[0] + 5 * S(lean + 20), neck[1] - 6.5 * C(lean + 20))
    return dict(hip=hip, neck=neck, sh=sh, knN=knN, ftN=ftN, knF=knF, ftF=ftF,
                elN=elN, haN=haN, elF=elF, haF=haF, head=head)


def finalize(sp, ground=61):
    return sp.render(ground=ground)


# ---------- các pose ----------
def frames_run(n=6):
    out = []
    for i in range(n):
        p = i / n + 0.07
        pose = run_pose(p)
        out.append(finalize(draw_ninja(pose, tail=i * 360 / n)))
    return out


def frames_jump():
    hip = (28, 38)
    lean = 8
    neck = (hip[0] + 17 * S(lean), hip[1] - 17 * C(lean))
    sh = (neck[0], neck[1] + 2)
    head = (neck[0] + 5 * S(lean + 20), neck[1] - 6.5 * C(lean + 20))
    # bay lên: co gối, tay giơ cao
    knN, ftN = limb(hip, 13, 13, 70, -10)
    knF, ftF = limb(hip, 13, 13, 35, -30)
    elN, haN = limb(sh, 9, 9, -60, -110)
    elF, haF = limb(sh, 9, 9, 120, 150)
    up = dict(hip=hip, neck=neck, sh=sh, knN=knN, ftN=ftN, knF=knF, ftF=ftF,
              elN=elN, haN=haN, elF=elF, haF=haF, head=head)
    # rơi xuống: duỗi chân, tay dang
    knN, ftN = limb(hip, 13, 13, 30, 20)
    knF, ftF = limb(hip, 13, 13, -25, -35)
    elN, haN = limb(sh, 9, 9, 100, 130)
    elF, haF = limb(sh, 9, 9, -100, -125)
    down = dict(up, knN=knN, ftN=ftN, knF=knF, ftF=ftF, elN=elN, haN=haN, elF=elF, haF=haF)
    return [finalize(draw_ninja(up, 20)), finalize(draw_ninja(down, 200))]


def frames_slide():
    hip = (31, 48)
    lean = 62
    neck = (hip[0] + 15 * S(lean), hip[1] - 15 * C(lean))
    sh = (neck[0] - 1, neck[1] + 2)
    head = (neck[0] + 5.5 * S(lean + 25), neck[1] - 6.5 * C(lean + 25))
    knN, ftN = limb(hip, 13, 13, 78, 8)     # chân trước gập
    knF, ftF = limb(hip, 13, 13, -82, -92)  # chân sau duỗi thẳng ra sau
    elN, haN = limb(sh, 9, 9, 60, 85)       # tay trước
    elF, haF = limb(sh, 9, 9, -40, -70)     # tay sau
    pose = dict(hip=hip, neck=neck, sh=sh, knN=knN, ftN=ftN, knF=knF, ftF=ftF,
                elN=elN, haN=haN, elF=elF, haF=haF, head=head)
    return [finalize(draw_ninja(pose, 40))]


def frames_throw():
    out = []
    # khung 1: lấy đà (tay gần kéo ra sau gần đầu), khung 2: phóng (tay duỗi thẳng ra trước)
    for i, (p, mode) in enumerate(((0.12, "wind"), (0.38, "release"))):
        pose = run_pose(p, lean=10)
        sh = pose["sh"]
        if mode == "wind":
            el = (sh[0] - 7, sh[1] - 4)
            ha = (sh[0] - 4, sh[1] - 12)
        else:
            el = (sh[0] + 8, sh[1] - 2)
            ha = (sh[0] + 17, sh[1] - 4)
        pose["elN"], pose["haN"] = el, ha
        sp = draw_ninja(pose, tail=i * 160)
        if mode == "release":  # phi tiêu nhỏ vừa rời tay
            cx, cy = ha[0] + 5, ha[1] - 1
            for dx, dy in ((0, -2), (0, 2), (-2, 0), (2, 0)):
                sp.put(cx + dx, cy + dy, (200, 200, 205))
            sp.put(cx, cy, (120, 120, 130))
        out.append(finalize(sp))
    return out


# ---------- Khổng Lồ Cuồng Nộ ----------
def draw_giant(p, flick):
    sp = Spr(96, 96)
    a = lambda ph: 38 * S(360 * ph)
    def flex(ph):
        return 14 + 60 * max(0, C(360 * ph)) + 22 * max(0, -S(360 * ph))
    hip = (46, 58)
    lean = 12
    L1, L2 = 20, 20
    pN, pF = p, p + 0.5
    knN, ftN = limb(hip, L1, L2, a(pN), a(pN) - flex(pN))
    knF, ftF = limb(hip, L1, L2, a(pF), a(pF) - flex(pF))
    neck = (hip[0] + 24 * S(lean), hip[1] - 24 * C(lean))
    sh = (neck[0], neck[1] + 4)
    bN, bF = -45 * S(360 * pN), -45 * S(360 * pF)
    elN, haN = limb(sh, 14, 13, bN, bN + 85)
    elF, haF = limb(sh, 14, 13, bF, bF + 85)
    # ---- vẽ ----
    sp.line(sh, elF, 7, BODY_FAR); sp.line(elF, haF, 6, BODY_FAR); sp.disc(*haF, 7, BODY_FAR)
    sp.line(hip, knF, 9, PANT_FAR); sp.line(knF, ftF, 8, PANT_FAR)
    sp.line(ftF, (ftF[0] + 5, ftF[1] + 1), 6, SHOE)
    # thân (hình thang vai rộng)
    t = lean
    sw, hw = 15, 8
    L = (neck[0] - sw * C(t) - 2, neck[1] + sw * S(t) + 2)
    R = (neck[0] + sw * C(t) + 1, neck[1] - sw * S(t) + 2)
    HL = (hip[0] - hw, hip[1] - 4)
    HR = (hip[0] + hw, hip[1] - 4)
    sp.poly([L, R, HR, HL], BODY)
    sp.line(L, R, 5, BODY)
    # cơ ngực / bụng
    cx = (neck[0] + hip[0]) / 2 + 1
    cy = (neck[1] + hip[1]) / 2 - 4
    sp.line((cx - 7, cy - 3), (cx - 1, cy - 2), 3, BODY_HI)
    sp.line((cx + 1, cy - 2), (cx + 8, cy - 4), 3, BODY_HI)
    for k in range(3):
        sp.put(cx - 2, cy + 3 + k * 4, BODY_HI); sp.put(cx - 1, cy + 3 + k * 4, BODY_HI)
        sp.put(cx + 2, cy + 3 + k * 4, BODY_HI); sp.put(cx + 3, cy + 3 + k * 4, BODY_HI)
    # quần + đai
    sp.poly([(hip[0] - hw - 1, hip[1] - 3), (hip[0] + hw + 1, hip[1] - 3), (hip[0] + hw, hip[1] + 6), (hip[0] - hw, hip[1] + 6)], PANT)
    sp.line((hip[0] - hw - 1, hip[1] - 3), (hip[0] + hw + 1, hip[1] - 3), 3, RED_D)
    # chân gần
    sp.line(hip, knN, 9, PANT); sp.line(knN, ftN, 8, PANT)
    sp.line(knN, (knN[0] + 1, knN[1] - 6), 3, PANT_HI)
    sp.line(ftN, (ftN[0] + 5, ftN[1] + 1), 6, SHOE)
    # tay gần
    sp.line(sh, elN, 7, BODY); sp.line(elN, haN, 6, BODY); sp.disc(*haN, 7, BODY)
    sp.line((sh[0], sh[1]), (elN[0], elN[1]), 3, BODY_HI)  # cơ tay
    # đầu + băng đô + hào quang
    head = (neck[0] + 5, neck[1] - 8)
    # hào quang đỏ nhấp nháy quanh đầu
    ring = []
    for k in range(11):
        ang = 180 + k * 18 + flick * 4
        rad = 10 + (2 if (k + flick) % 2 == 0 else 0)
        ring.append((head[0] + rad * C(ang), head[1] + rad * S(ang)))
    for i, (x, y) in enumerate(ring):
        sp.put(x, y, AURA1 if i % 2 == 0 else AURA2)
        sp.put(x + 1, y, AURA1)
    draw_head(sp, head[0], head[1], flick * 120, r=15)
    return sp


def frames_giant(n=6):
    out = []
    for i in range(n):
        sp = draw_giant(i / n, i)
        out.append(sp.render(ground=92))
    return out


# ---------- ghép + xuất ----------
def strip(frames):
    w, h = frames[0].size
    im = Image.new("RGBA", (w * len(frames), h), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        im.paste(f, (i * w, 0))
    return im


if __name__ == "__main__":
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    sets = {
        "ninja_run": frames_run(6),
        "ninja_jump": frames_jump(),
        "ninja_slide": frames_slide(),
        "ninja_throw": frames_throw(),
        "ninja_giant": frames_giant(6),
    }
    for k, fr in sets.items():
        strip(fr).save(os.path.join(out, k + ".png"))
    # preview phóng 5x trên nền xám sáng
    prev = []
    for k, fr in sets.items():
        s = strip(fr)
        s = s.resize((s.width * 4, s.height * 4), Image.NEAREST)
        bg = Image.new("RGBA", s.size, (150, 190, 215, 255))
        bg.alpha_composite(s)
        prev.append(bg)
    W = max(p.width for p in prev)
    H = sum(p.height for p in prev) + 8 * len(prev)
    sheet = Image.new("RGBA", (W, H), (60, 60, 70, 255))
    y = 0
    for p in prev:
        sheet.paste(p, (0, y)); y += p.height + 8
    sheet.save(os.path.join(out, "_preview.png"))
    print("ok", {k: len(v) for k, v in sets.items()})
