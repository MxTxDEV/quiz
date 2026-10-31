"""Sintetiza efeitos sonoros e trilha para o vídeo motion (sem samples externos).

Uso: python gerar-audio-motion.py <cues.json> <timeline.json> <sfx.wav> <musica.wav>
Requer numpy. Saída: WAV 48 kHz estéreo, 16 bits.
"""
import json
import sys
import wave

import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def t_axis(dur):
    return np.arange(int(SR * dur)) / SR


def env(dur, attack=0.005, decay=0.3):
    t = t_axis(dur)
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-t / decay)


def lowpass(x, cutoff):
    """Passa-baixa de 1 polo; cutoff pode ser escalar ou array (varrido no tempo)."""
    c = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    a = 1 - np.exp(-2 * np.pi * c / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def sweep(f0, f1, dur, shape="exp"):
    t = t_axis(dur)
    f = f0 * (f1 / f0) ** (t / dur) if shape == "exp" else f0 + (f1 - f0) * t / dur
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def noise(dur):
    return rng.standard_normal(int(SR * dur))


# ------------------------------------------------------------------ efeitos
def impact(soft=False):
    d = 1.1
    boom = sweep(130, 38, d) * env(d, 0.003, 0.35)
    crack = lowpass(noise(d), 1800) * env(d, 0.001, 0.05) * 2.5
    out = boom * 0.9 + crack * 0.5
    return out * (0.55 if soft else 1.0)


def whoosh():
    d = 0.5
    t = t_axis(d)
    cut = 300 + 5000 * np.sin(np.pi * t / d) ** 2
    x = lowpass(noise(d), cut) - lowpass(noise(d), 150)
    e = np.sin(np.pi * t / d) ** 2
    return x * e * 0.9


def pop():
    d = 0.14
    return (sweep(900, 320, d) * env(d, 0.001, 0.035) + lowpass(noise(d), 4000) * env(d, 0.0005, 0.006) * 0.6) * 0.7


def thud():
    d = 0.5
    return (sweep(95, 45, d) * env(d, 0.002, 0.16) + lowpass(noise(d), 400) * env(d, 0.001, 0.04) * 1.2) * 0.95


def riser(dur):
    t = t_axis(dur)
    x = lowpass(noise(dur), 800 + 7000 * (t / dur) ** 2) * 0.5 + sweep(180, 1400, dur) * 0.25
    return x * (t / dur) ** 2 * 0.9


def bell(f, d=0.6, gain=0.5):
    t = t_axis(d)
    tone = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / (dec * d)) for m, a, dec in [(1, 1, 0.5), (2.76, 0.45, 0.25), (5.4, 0.25, 0.12)])
    return tone * np.clip(t / 0.002, 0, 1) * gain


def coin():
    f = rng.uniform(2200, 3400)
    a, b = bell(f, 0.35, 0.22), bell(f * 1.5, 0.25, 0.08)
    a[: len(b)] += b
    return a


def tap():
    d = 0.08
    return lowpass(noise(d), 6000) * env(d, 0.0005, 0.008) * 0.8 + sweep(1500, 900, d) * env(d, 0.001, 0.02) * 0.25


def shine():
    d = 0.9
    out = np.zeros(int(SR * d))
    for k, f in enumerate([1800, 2400, 3000, 3600, 4400, 5200]):
        s = bell(f, 0.5, 0.06)
        i = int(SR * k * 0.07)
        out[i:i + len(s)] += s[: len(out) - i]
    return out


def rustle():
    """Farfalhar de nota de papel."""
    d = 0.22
    t = t_axis(d)
    x = lowpass(noise(d), 5000) - lowpass(noise(d), 1200)
    flutter = 0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(25, 40) * t)
    return x * flutter * env(d, 0.01, 0.08) * 0.5


def cash_register():
    """Caixa registradora: tilintar duplo + gaveta abrindo + moedas."""
    d = 1.2
    out = np.zeros(int(SR * d))
    for at, f in [(0.0, 2600), (0.09, 3300)]:
        b = bell(f, 0.9, 0.45)
        i = int(SR * at)
        out[i:i + len(b)] += b[: len(out) - i]
    clank = (lowpass(noise(0.3), 2500) * env(0.3, 0.001, 0.05) * 1.4 + sweep(160, 70, 0.3) * env(0.3, 0.002, 0.1) * 0.6)
    i = int(SR * 0.18)
    out[i:i + len(clank)] += clank[: len(out) - i]
    for k in range(6):
        cn = coin()
        i = int(SR * (0.3 + k * 0.06))
        out[i:i + len(cn)] += cn[: len(out) - i] * 0.8
    return out


# ------------------------------------------------------------------ montagem
def place(track, sig, at, pan=0.0, gain=1.0):
    i = int(SR * at)
    if i >= track.shape[1]:
        return
    n = min(len(sig), track.shape[1] - i)
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    track[0, i:i + n] += sig[:n] * gain * l * 1.41
    track[1, i:i + n] += sig[:n] * gain * r * 1.41


def build_sfx(cues, duration):
    tr = np.zeros((2, int(SR * duration)))
    for c in cues:
        k, t = c["kind"], c["t"]
        if k == "impact":
            place(tr, impact(c.get("soft", False)), t)
        elif k == "whoosh":
            place(tr, whoosh(), t, pan=rng.uniform(-0.4, 0.4), gain=0.7)
        elif k == "pop":
            place(tr, pop(), t, pan=[-0.5, 0, 0.5][c.get("k", 0) % 3])
        elif k == "thud":
            place(tr, thud(), t)
        elif k == "riser":
            place(tr, riser(c["dur"]), t, gain=0.7)
        elif k == "coins":
            n, spread = c["n"], (0.45 if c["mode"] == "burst" else 2.2)
            for j in range(n):
                place(tr, coin(), t + rng.uniform(0, spread) ** 1.3, pan=rng.uniform(-0.8, 0.8), gain=0.9 if c["mode"] == "burst" else 0.55)
        elif k == "tap":
            place(tr, tap(), t, gain=0.9)
            place(tr, pop(), t + 0.05, gain=0.35)
        elif k == "ding":
            place(tr, bell(1320 * (1.122 ** c.get("k", 0)), 0.7, 0.35), t, pan=[-0.4, -0.15, 0.15, 0.4][c.get("k", 0) % 4])
        elif k == "shine":
            place(tr, shine(), t, gain=0.9)
        elif k == "bills":
            n, spread = c["n"], (0.5 if c["mode"] == "burst" else 2.4)
            for j in range(max(4, n // 3)):
                place(tr, rustle(), t + rng.uniform(0, spread), pan=rng.uniform(-0.7, 0.7), gain=0.8)
        elif k == "cashreg":
            place(tr, cash_register(), t, gain=1.0)
        elif k == "papers":
            for j in range(8):
                place(tr, rustle(), t + j * c["dur"] / 8 + rng.uniform(0, 0.2), pan=rng.uniform(-0.6, 0.6), gain=0.35)
    return tr


def build_music(timeline, duration):
    """Trilha: pad + batida leve a 100 BPM. Sombria na cena das objeções, aberta depois da virada."""
    S = {s["id"]: s for s in timeline["scenes"]}
    dark0, dark1 = S["objecao"]["start"] - 0.2, S["virada"]["start"]
    n = int(SR * duration)
    t = np.arange(n) / SR
    beat = 60 / 100
    chords = [[220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [130.81, 196.0, 261.63], [196.0, 246.94, 293.66]]  # Am F C G
    pad = np.zeros(n)
    bar = beat * 4
    for ci in range(int(duration / bar) + 1):
        notes = chords[ci % 4]
        i0, i1 = int(SR * ci * bar), min(n, int(SR * (ci + 1) * bar))
        tt = t[i0:i1] - ci * bar
        seg = sum(np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt + 0.3) for f in notes)
        fade = np.clip(tt / 0.4, 0, 1) * np.clip((bar - tt) / 0.3, 0, 1)
        pad[i0:i1] += seg * fade
    pad = lowpass(pad, 1400) * 0.06
    # batida
    drums = np.zeros(n)
    k = (sweep(110, 45, 0.25) * env(0.25, 0.002, 0.09)) * 0.5
    h = lowpass(noise(0.05), 9000) - lowpass(noise(0.05), 5000)
    h = h * env(0.05, 0.001, 0.012) * 0.12
    for b in range(int(duration / beat) + 1):
        tb = b * beat
        dark = dark0 <= tb < dark1
        if not dark:
            i = int(SR * tb)
            drums[i:i + len(k)] += k[: max(0, n - i)]
        ih = int(SR * (tb + beat / 2))
        if ih < n:
            drums[ih:ih + len(h)] += h[: max(0, n - ih)] * (0.4 if dark else 1)
    # humor: escurece (menos brilho) nas objeções
    mood = np.ones(n)
    mood[(t >= dark0) & (t < dark1)] = 0.45
    mood = lowpass(mood, 3)
    mix = (pad * mood + drums * mood) * np.clip(t / 1.0, 0, 1) * np.clip((duration - t) / 1.2, 0, 1)
    return np.vstack([mix, mix])


def write(path, x):
    x = x / max(1.0, np.max(np.abs(x)) / 0.95)
    data = (np.clip(x.T, -1, 1) * 32767).astype("<i2").tobytes()
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data)


if __name__ == "__main__":
    cues_p, tl_p, sfx_p, mus_p = sys.argv[1:5]
    cues = json.load(open(cues_p))
    tl = json.load(open(tl_p))
    dur = tl["duration"]
    write(sfx_p, build_sfx(cues, dur))
    write(mus_p, build_music(tl, dur))
    print("ok", sfx_p, mus_p)
