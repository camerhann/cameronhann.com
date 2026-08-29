#!/usr/bin/env python3
"""Render CEFA / Tiamat article figures. House style: dark zinc, teal/orange/blue."""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import FancyBboxPatch

ROOT = Path(__file__).resolve().parents[1]
CEFA = ROOT / "public/images/articles/the-flood-is-a-shape"
JOIN = ROOT / "public/images/articles/the-probabilistic-flood"
CEFA.mkdir(parents=True, exist_ok=True)
JOIN.mkdir(parents=True, exist_ok=True)

BG = "#14161c"
CARD = "#1c2028"
INK = "#e8eaef"
MUTED = "#9aa3b2"
FAINT = "#2a3140"
GRID = "#252b36"
TEAL = "#2dd4bf"
ORANGE = "#f59e5b"
BLUE = "#5eb0ff"
AMBER = "#f5c14a"
ROSE = "#fb7185"
VIOLET = "#c4b5fd"

plt.rcParams.update(
    {
        "font.family": "sans-serif",
        "font.sans-serif": ["Avenir Next", "Avenir", "Helvetica Neue", "Arial"],
        "axes.edgecolor": FAINT,
        "axes.labelcolor": MUTED,
        "xtick.color": MUTED,
        "ytick.color": MUTED,
        "text.color": INK,
        "figure.facecolor": BG,
        "axes.facecolor": CARD,
        "savefig.facecolor": BG,
        "savefig.edgecolor": BG,
    }
)


def hydro(t, tr, tf, k_days, mix=0.78):
    t = np.asarray(t, dtype=float)
    q = np.zeros_like(t)
    rise = t <= tr
    q[rise] = 0.5 * (1 - np.cos(np.pi * np.clip(t[rise] / max(tr, 1e-6), 0, 1)))
    fall = t > tr
    dt = t[fall] - tr
    tau_f = tf / np.log(2)
    rec = max(k_days * 24.0, tf * 1.8)
    fast = np.exp(-dt / tau_f)
    slow = np.exp(-dt / rec)
    q[fall] = mix * fast + (1 - mix) * slow
    return np.clip(q, 0, None)


def scale_volume(t, q, vol_hours):
    dt = float(t[1] - t[0])
    vol = float(np.trapezoid(q, dx=dt))
    if vol <= 0:
        return q
    factor = vol_hours / vol
    peak_i = int(np.argmax(q))
    q2 = q.copy()
    if factor > 1:
        extra = factor - 1
        tail = np.linspace(0, 1, len(q) - peak_i)
        q2[peak_i:] = q[peak_i:] * (1 + extra * tail)
        q2 = q2 / q2.max()
        return q2
    q2 = q * factor
    return q2 / q2.max()


def double_burst(t):
    a = hydro(t, 3.2, 4.0, 0.4, mix=0.85) * 0.72
    b = hydro(t - 11.0, 2.6, 3.5, 0.45, mix=0.85)
    b[t < 11] = 0
    q = np.maximum(a, 0) + np.maximum(b, 0)
    m = q.max()
    return q / m if m else q


rivers = {
    "Tame at Bescot — urban West Midlands": dict(
        tr=2.16, tf=3.70, k=0.55, vol=11.4, color=ORANGE, short="Tame · urban"
    ),
    "Kent above Kendal — steep, wet Cumbria": dict(
        tr=3.89, tf=4.60, k=0.49, vol=11.4, color=TEAL, short="Kent · Cumbria"
    ),
    "Lambourn at Shaw — chalk, Berkshire": dict(
        tr=6.72, tf=7.62, k=2.85, vol=30.8, color=BLUE, short="Lambourn · chalk"
    ),
}

history = [
    dict(
        name="Boscastle, Aug 2004",
        note="hours, not days",
        tr=1.4,
        tf=1.8,
        k=0.15,
        mix=0.9,
        color=ROSE,
        t_end=18,
    ),
    dict(
        name="Storm Desmond, Dec 2015",
        note="wet Cumbria, long rain",
        tr=9.0,
        tf=11.0,
        k=1.1,
        mix=0.8,
        color=TEAL,
        t_end=48,
    ),
    dict(
        name="Summer 2007, Severn country",
        note="slow, fat, days",
        tr=28.0,
        tf=36.0,
        k=3.5,
        mix=0.7,
        color=BLUE,
        t_end=120,
    ),
    dict(
        name="Double burst",
        note="two cells, one catchment",
        color=AMBER,
        t_end=36,
        double=True,
    ),
]


def save(fig, path):
    fig.savefig(path, dpi=160)
    plt.close(fig)
    print("wrote", path)


# Cover
fig = plt.figure(figsize=(16, 7.2), dpi=160)
fig.patch.set_facecolor(BG)
ax = fig.add_axes([0.05, 0.14, 0.48, 0.72])
ax.set_facecolor(BG)
for sp in ax.spines.values():
    sp.set_visible(False)
ax.tick_params(left=False, bottom=False, labelleft=False, labelbottom=False)
t = np.linspace(0, 72, 1400)
for r in rivers.values():
    q = scale_volume(t, hydro(t, r["tr"], r["tf"], r["k"]), r["vol"])
    ax.plot(t, q, color=r["color"], lw=2.4, solid_capstyle="round")
    ax.fill_between(t, q, 0, color=r["color"], alpha=0.10)
ax.set_xlim(0, 54)
ax.set_ylim(-0.02, 1.18)
ax.text(4.6, 1.05, "Tame", color=ORANGE, fontsize=11, weight=600)
ax.text(12.5, 0.72, "Kent", color=TEAL, fontsize=11, weight=600)
ax.text(28.5, 0.38, "Lambourn", color=BLUE, fontsize=11, weight=600)
ax.axhline(0, color=FAINT, lw=0.8)
fig.text(
    0.58,
    0.62,
    "The flood is a shape",
    color=INK,
    fontsize=36,
    weight=500,
    fontfamily="serif",
)
fig.text(
    0.58,
    0.48,
    "Catchment-Event Frequency Analysis.\nWhy a design flood should look like\na river, not a triangle.",
    color=MUTED,
    fontsize=15,
    linespacing=1.45,
)
fig.text(0.58, 0.18, "CEFA  ·  hydrometric.io", color="#6b7380", fontsize=11)
save(fig, CEFA / "00-cover.jpg")

# Signatures
fig = plt.figure(figsize=(12.2, 7.4), dpi=160)
fig.patch.set_facecolor(BG)
ax = fig.add_axes([0.09, 0.16, 0.86, 0.68])
ax.set_facecolor(CARD)
for sp in ax.spines.values():
    sp.set_color(FAINT)
fig.text(
    0.09,
    0.90,
    "Three catchments, one peak, three signatures",
    color=INK,
    fontsize=16,
    weight=600,
)
fig.text(
    0.09,
    0.855,
    "CEFA characteristic hydrographs, peak-normalised. Same height. Completely different floods.",
    color=MUTED,
    fontsize=11,
)
t = np.linspace(0, 72, 1600)
for r in rivers.values():
    q = scale_volume(t, hydro(t, r["tr"], r["tf"], r["k"]), r["vol"])
    ax.plot(t, q, color=r["color"], lw=2.3, label=r["short"], solid_capstyle="round")
    ax.fill_between(t, q, 0, color=r["color"], alpha=0.08)
ax.axhline(1, color=FAINT, lw=0.6, ls="--")
ax.set_xlim(0, 60)
ax.set_ylim(0, 1.18)
ax.set_xlabel("Hours from the start of the rise")
ax.set_ylabel("Flow, as a fraction of the peak")
ax.legend(frameon=False, loc="upper right", fontsize=10.5, labelcolor=INK)
ax.grid(True, color=GRID, lw=0.6)
ax.tick_params(length=0)
fig.text(
    0.09,
    0.045,
    "Tame rises in about 2 hours. Kent in about 4. Lambourn is still draining three days later.",
    color=MUTED,
    fontsize=10.5,
)
save(fig, CEFA / "01-signatures.jpg")

# Volume
fig = plt.figure(figsize=(12.2, 7.4), dpi=160)
fig.patch.set_facecolor(BG)
ax = fig.add_axes([0.09, 0.16, 0.86, 0.68])
ax.set_facecolor(CARD)
for sp in ax.spines.values():
    sp.set_color(FAINT)
fig.text(0.09, 0.90, "Same peak. Almost three times the water.", color=INK, fontsize=16, weight=600)
fig.text(
    0.09,
    0.855,
    "Volume under the curve, peak-normalised. The chalk stream is the flood that stays.",
    color=MUTED,
    fontsize=11,
)
t = np.linspace(0, 96, 2000)
q_k = scale_volume(t, hydro(t, 3.89, 4.60, 0.49), 11.4)
q_l = scale_volume(t, hydro(t, 6.72, 7.62, 2.85), 30.8)
q_t = scale_volume(t, hydro(t, 2.16, 3.70, 0.55), 11.4)
ax.fill_between(t, q_l, 0, color=BLUE, alpha=0.18, label="Lambourn · ~31 peak-hours")
ax.fill_between(t, q_k, 0, color=TEAL, alpha=0.22, label="Kent · ~11 peak-hours")
ax.plot(t, q_l, color=BLUE, lw=2.2)
ax.plot(t, q_k, color=TEAL, lw=2.2)
ax.plot(t, q_t, color=ORANGE, lw=1.6, alpha=0.85, label="Tame · ~11 peak-hours")
ax.set_xlim(0, 72)
ax.set_ylim(0, 1.18)
ax.set_xlabel("Hours")
ax.set_ylabel("Flow, as a fraction of the peak")
ax.legend(frameon=False, loc="upper right", fontsize=10.5, labelcolor=INK)
ax.grid(True, color=GRID, lw=0.6)
ax.tick_params(length=0)
fig.text(
    0.09,
    0.045,
    "A peak-hour is one hour of flow at the peak rate. It is a simple way to say how much water the hydrograph carries.",
    color=MUTED,
    fontsize=10.5,
)
save(fig, CEFA / "02-volume.jpg")

# History
fig = plt.figure(figsize=(12.2, 8.2), dpi=160)
fig.patch.set_facecolor(BG)
fig.text(0.07, 0.935, "How British floods actually look", color=INK, fontsize=16, weight=600)
fig.text(
    0.07,
    0.90,
    "Schematic hydrographs of real event types. Not a particular gauge trace — the shapes history keeps handing us.",
    color=MUTED,
    fontsize=11,
)
panels = [
    (history[0], [0.07, 0.52, 0.40, 0.32]),
    (history[1], [0.55, 0.52, 0.40, 0.32]),
    (history[2], [0.07, 0.10, 0.40, 0.32]),
    (history[3], [0.55, 0.10, 0.40, 0.32]),
]
for h, rect in panels:
    ax = fig.add_axes(rect)
    ax.set_facecolor(CARD)
    for sp in ax.spines.values():
        sp.set_color(FAINT)
    t = np.linspace(0, h["t_end"], 800)
    if h.get("double"):
        q = double_burst(t)
    else:
        q = hydro(t, h["tr"], h["tf"], h["k"], mix=h["mix"])
        q = q / q.max()
    ax.fill_between(t, q, 0, color=h["color"], alpha=0.16)
    ax.plot(t, q, color=h["color"], lw=2.2, solid_capstyle="round")
    ax.set_xlim(0, h["t_end"])
    ax.set_ylim(0, 1.15)
    ax.set_yticks([])
    ax.tick_params(length=0, labelsize=8)
    ax.set_xlabel("Hours", fontsize=9, color=MUTED)
    ax.set_title(h["name"], loc="left", fontsize=12, color=INK, pad=8, weight=600)
    ax.text(0.02, 0.90, h["note"], transform=ax.transAxes, color=MUTED, fontsize=9.5)
    ax.grid(True, axis="x", color=GRID, lw=0.5)
save(fig, CEFA / "03-history.jpg")

# Triangle
fig = plt.figure(figsize=(12.2, 7.4), dpi=160)
fig.patch.set_facecolor(BG)
ax = fig.add_axes([0.09, 0.16, 0.86, 0.68])
ax.set_facecolor(CARD)
for sp in ax.spines.values():
    sp.set_color(FAINT)
fig.text(
    0.09,
    0.90,
    "The cartoon, and the family it is standing in for",
    color=INK,
    fontsize=16,
    weight=600,
)
fig.text(
    0.09,
    0.855,
    "A triangular design hydrograph against a handful of shapes rivers actually produce.",
    color=MUTED,
    fontsize=11,
)
t = np.linspace(0, 48, 1200)
tri = np.zeros_like(t)
tri[(t >= 0) & (t <= 12)] = t[(t >= 0) & (t <= 12)] / 12
tri[(t > 12) & (t <= 24)] = 1 - (t[(t > 12) & (t <= 24)] - 12) / 12
ax.plot(t, tri, color="#d4d4d8", lw=2.6, ls=(0, (5, 3)), label="Design triangle")
family = [
    (2.2, 3.7, 0.55, 11.4, ORANGE),
    (3.9, 4.6, 0.49, 11.4, TEAL),
    (6.7, 7.6, 2.85, 30.8, BLUE),
    (8.0, 14.0, 1.6, 22.0, VIOLET),
    (4.5, 6.0, 0.7, 14.0, AMBER),
]
for tr, tf, k, vol, c in family:
    q = scale_volume(t, hydro(t, tr, tf, k), vol)
    ax.plot(t, q, color=c, lw=1.7, alpha=0.9)
    ax.fill_between(t, q, 0, color=c, alpha=0.05)
ax.set_xlim(0, 40)
ax.set_ylim(0, 1.18)
ax.set_xlabel("Hours")
ax.set_ylabel("Flow, as a fraction of the peak")
ax.legend(frameon=False, loc="upper right", fontsize=10.5, labelcolor=INK)
ax.grid(True, color=GRID, lw=0.6)
ax.tick_params(length=0)
fig.text(
    0.09,
    0.045,
    "The triangle is tidy. The river is not. A model that only ships a peak still has to pick a shape. That pick is the flood.",
    color=MUTED,
    fontsize=10.5,
)
save(fig, CEFA / "04-triangle.jpg")

# Band
fig = plt.figure(figsize=(12.2, 7.4), dpi=160)
fig.patch.set_facecolor(BG)
ax = fig.add_axes([0.09, 0.16, 0.86, 0.68])
ax.set_facecolor(CARD)
for sp in ax.spines.values():
    sp.set_color(FAINT)
fig.text(0.09, 0.90, "Not a line. A band.", color=INK, fontsize=16, weight=600)
fig.text(
    0.09,
    0.855,
    "A CEFA design hydrograph for a Cumbrian river: typical shape, with a low-to-high range on the peak.",
    color=MUTED,
    fontsize=11,
)
t = np.linspace(0, 36, 1000)
shape = scale_volume(t, hydro(t, 3.89, 4.60, 0.49), 11.4)
p10, p50, p90 = 172, 259, 390
ax.fill_between(t, shape * p10, shape * p90, color=TEAL, alpha=0.18, label="P10–P90")
ax.plot(t, shape * p50, color=TEAL, lw=2.5, label="Typical (P50)")
ax.plot(t, shape * p10, color=TEAL, lw=1.1, alpha=0.7)
ax.plot(t, shape * p90, color=TEAL, lw=1.1, alpha=0.7)
ax.set_xlim(0, 30)
ax.set_ylim(0, 450)
ax.set_xlabel("Hours")
ax.set_ylabel("Flow (cubic metres per second)")
ax.legend(frameon=False, loc="upper right", fontsize=10.5, labelcolor=INK)
ax.grid(True, color=GRID, lw=0.6)
ax.tick_params(length=0)
fig.text(
    0.09,
    0.045,
    "P10 / P50 / P90 means: in 10, 50 and 90 cases out of 100, the peak stays below that line. The shape is the catchment’s characteristic hydrograph.",
    color=MUTED,
    fontsize=10,
)
save(fig, CEFA / "05-band.jpg")

# Handshake
fig = plt.figure(figsize=(12.4, 6.6), dpi=160)
fig.patch.set_facecolor(BG)
fig.text(0.07, 0.88, "Rain in. Probability out.", color=INK, fontsize=16, weight=600)
fig.text(
    0.07,
    0.83,
    "CEFA turns a storm into a hydrograph with a range. Tiamat spreads each hydrograph across the land.",
    color=MUTED,
    fontsize=11,
)


def rounded_box(ax, x, y, w, h, color, title, lines):
    box = FancyBboxPatch(
        (x, y),
        w,
        h,
        boxstyle="round,pad=0.02,rounding_size=0.08",
        facecolor=CARD,
        edgecolor=color,
        linewidth=1.6,
    )
    ax.add_patch(box)
    ax.text(
        x + w / 2,
        y + h - 0.13,
        title,
        ha="center",
        va="top",
        color=color,
        fontsize=13,
        weight=600,
    )
    ax.text(
        x + w / 2,
        y + h / 2 - 0.04,
        lines,
        ha="center",
        va="center",
        color=INK,
        fontsize=11,
        linespacing=1.45,
    )


ax = fig.add_axes([0.04, 0.10, 0.92, 0.68])
ax.set_xlim(0, 10)
ax.set_ylim(0, 4)
ax.axis("off")
ax.set_facecolor(BG)
rounded_box(ax, 0.2, 1.15, 2.2, 1.9, AMBER, "Storm", "Forecast rain\nand how wet\nthe ground is")
rounded_box(ax, 3.05, 1.15, 2.35, 1.9, TEAL, "CEFA", "Hydrograph\nwith a band\nP10 · P50 · P90")
rounded_box(ax, 6.05, 1.15, 2.35, 1.9, BLUE, "Tiamat", "2D physics\non the terrain\ndepth · extent")
rounded_box(ax, 8.55, 1.15, 1.25, 1.9, ROSE, "P(wet)", "Chance this\nbuilding\nfloods")
for x0, x1 in [(2.42, 3.00), (5.45, 6.00), (8.45, 8.52)]:
    ax.annotate(
        "",
        xy=(x1, 2.1),
        xytext=(x0, 2.1),
        arrowprops=dict(arrowstyle="-|>", color=MUTED, lw=1.4),
    )
fig.text(
    0.07,
    0.06,
    "Today the public site ships the CEFA flow outlook. Tiamat maps of the same storms come next.",
    color=MUTED,
    fontsize=10.5,
)
save(fig, JOIN / "01-handshake.jpg")

# Ensemble schematic
fig = plt.figure(figsize=(12.2, 6.8), dpi=160)
fig.patch.set_facecolor(BG)
fig.text(0.07, 0.90, "One storm. Many maps. A chance.", color=INK, fontsize=16, weight=600)
fig.text(
    0.07,
    0.855,
    "Each hydrograph in the CEFA band is a Tiamat run. The stack is the probability a cell is wet.",
    color=MUTED,
    fontsize=11,
)
ax = fig.add_axes([0.07, 0.12, 0.86, 0.68])
ax.set_facecolor(BG)
ax.axis("off")
rng = np.random.default_rng(11)


def fake_map(ax, x, y, s, wetness, title, color):
    ax.add_patch(
        FancyBboxPatch(
            (x, y),
            s,
            s * 1.15,
            boxstyle="round,pad=0.01,rounding_size=0.04",
            facecolor=CARD,
            edgecolor=FAINT,
            lw=1,
        )
    )
    ax.text(
        x + s / 2,
        y + s * 1.15 - 0.04,
        title,
        ha="center",
        va="top",
        color=MUTED,
        fontsize=9,
    )
    yy = np.linspace(y + 0.08, y + s * 0.95, 80)
    xx = x + s * 0.48 + 0.04 * np.sin(np.linspace(0, 7, 80))
    ax.plot(xx, yy, color=color, lw=2.0, alpha=0.9)
    n = int(40 * wetness)
    xs = rng.normal(x + s * 0.48, 0.10 + 0.08 * wetness, n)
    ys = rng.uniform(y + 0.1, y + s * 0.95, n)
    ax.scatter(xs, ys, s=12, c=color, alpha=0.35, linewidths=0)
    ax.scatter(xs, ys, s=4, c=color, alpha=0.7, linewidths=0)


fake_map(ax, 0.05, 0.08, 0.28, 0.35, "P10 hydrograph", BLUE)
fake_map(ax, 0.36, 0.08, 0.28, 0.70, "P50 hydrograph", TEAL)
fake_map(ax, 0.67, 0.08, 0.28, 1.05, "P90 hydrograph", ORANGE)
ax.set_xlim(0, 1)
ax.set_ylim(0, 0.5)
save(fig, JOIN / "02-ensemble.jpg")
