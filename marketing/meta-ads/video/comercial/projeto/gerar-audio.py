"""Design de som e trilha original do comercial ROTA INVISÍVEL — tudo sintetizado aqui (sem samples de terceiros).

Uso: python gerar-audio.py <timeline.json> <cues.json> <sfx.wav> <musica.wav> <ambiente.wav>

Trilha (96 BPM, lá menor → dó maior), seguindo a narrativa:
  A  gancho + dor ........ drone grave, piano abafado, pulso tenso
  B  quebra de crença .... silêncio estratégico (só um sub muito baixo; o riser faz a ponte)
  C  descoberta .......... pad quente abre, arpejo e bumbo suave (Am–F–C–G)
  D  produto ............. groove completo: bumbo, palmas, chimbal, baixo, arpejo
  E1 antes do clímax ..... respiro: só pad e filtro abrindo
  E2 clímax e chamada .... acordes largos, bateria cheia, arpejo uma oitava acima; acorde final soando
"""
import json, sys, wave
import numpy as np

SR = 48000
rng = np.random.default_rng(11)
tl_p, cues_p, sfx_p, mus_p, amb_p = sys.argv[1:6]
TL = json.load(open(tl_p))
CUES = json.load(open(cues_p))
L = {l["id"]: l for l in TL["linhas"]}
DUR = TL["duration"]
N = int(SR * DUR)
tag = {c["tag"]: c["t"] for c in CUES if "tag" in c}


# ------------------------------------------------------------------ ferramentas
def ta(d): return np.arange(int(SR * d)) / SR
def noise(d): return rng.standard_normal(int(SR * d))
def env(d, a=.005, dec=.3):
    t = ta(d); return np.clip(t / max(a, 1e-4), 0, 1) * np.exp(-t / dec)
def sweep(f0, f1, d):
    t = ta(d); f = f0 * (f1 / f0) ** (t / d); return np.sin(2 * np.pi * np.cumsum(f) / SR)


def filt(x, lo=None, hi=None, order=2):
    """Filtro no domínio da frequência (rápido para sinais longos). lo = passa-alta, hi = passa-baixa."""
    n = len(x); m = 1 << int(np.ceil(np.log2(max(n, 2))))
    X = np.fft.rfft(x, m); f = np.fft.rfftfreq(m, 1 / SR); g = np.ones_like(f)
    if hi: g /= np.sqrt(1 + (f / hi) ** (2 * order))
    if lo: g /= np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (2 * order))
    return np.fft.irfft(X * g, m)[:n]


def reverb(x, sec=2.2, wet=.3, seed=3):
    """Reverb por convolução com cauda de ruído decrescente (estéreo)."""
    r = np.random.default_rng(seed); n = int(SR * sec); t = np.arange(n) / SR
    dry = x if x.ndim == 2 else np.vstack([x, x]); ln = dry.shape[1]
    m = 1 << int(np.ceil(np.log2(ln + n))); out = []
    for ch in range(2):
        ir = r.standard_normal(n) * np.exp(-t * 6.9 / sec); ir = filt(ir, lo=200, hi=7000); ir /= np.sqrt(np.sum(ir ** 2))
        out.append(np.fft.irfft(np.fft.rfft(dry[ch], m) * np.fft.rfft(ir, m), m)[:ln])
    return dry * (1 - wet) + np.vstack(out) * wet


def saw(f, d, detune=(0,), phase_seed=0):
    t = ta(d); r = np.random.default_rng(phase_seed)
    return sum(2 * ((t * f * 2 ** (c / 1200) + r.random()) % 1) - 1 for c in detune) / len(detune)


def place(tr, sig, t, pan=0., gain=1.):
    i = int(SR * t)
    if i >= tr.shape[1] or i + len(sig) <= 0: return
    if i < 0: sig, i = sig[-i:], 0
    n = min(len(sig), tr.shape[1] - i)
    l, r = np.cos((pan + 1) * np.pi / 4) * 1.41, np.sin((pan + 1) * np.pi / 4) * 1.41
    tr[0, i:i + n] += sig[:n] * gain * l; tr[1, i:i + n] += sig[:n] * gain * r


def bell(f, d=.6, g=.5):
    t = ta(d); return g * np.clip(t / .002, 0, 1) * sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / (k * d)) for m, a, k in [(1, 1, .5), (2.76, .4, .25), (5.4, .2, .12)])


def hz(note):  # "A4" → 440
    names = {"C": -9, "D": -7, "E": -5, "F": -4, "G": -2, "A": 0, "B": 2}
    n = names[note[0]] + (1 if "#" in note else 0); o = int(note[-1])
    return 440 * 2 ** ((n + 12 * (o - 4)) / 12)


# ------------------------------------------------------------------ efeitos sonoros
def s_whoosh(d=.55, hi=6000):
    t = ta(d); e = np.sin(np.pi * t / d) ** 2
    x = filt(noise(d), lo=250, hi=hi) * e
    return x / (np.max(np.abs(x)) + 1e-9) * .8
def s_impact(soft=False):
    d = 1.6; boom = sweep(110, 32, d) * env(d, .002, .45)
    crack = filt(noise(d), lo=300, hi=4000) * env(d, .001, .06) * 2
    x = boom + .55 * crack; x = np.tanh(x * 1.6) / 1.2
    return x * (.55 if soft else 1)
def s_bass():
    d = 1.4; x = sweep(70, 28, d) * env(d, .003, .5); return np.tanh(x * 2.5) * .9
def s_glitch(d=.35):
    n = int(SR * d); x = np.zeros(n); i = 0
    while i < n:
        L_ = int(SR * rng.uniform(.012, .05)); kind = rng.integers(3)
        if kind == 0: seg = np.sign(np.sin(2 * np.pi * rng.uniform(300, 2400) * ta(L_ / SR))) * .35
        elif kind == 1: seg = np.round(noise(L_ / SR) * 3) / 3 * .3
        else: seg = np.zeros(L_)
        seg = np.pad(seg, (0, max(0, L_ - len(seg))))[:L_]
        x[i:i + L_] += seg[:n - i]; i += L_
    return filt(x, lo=150) * np.linspace(1, .4, n)
def s_notif():
    d = 1.1; out = np.zeros(int(SR * d))
    for k in range(2):  # vibração
        b = (np.sin(2 * np.pi * 172 * ta(.22)) * (0.6 + .4 * np.sign(np.sin(2 * np.pi * 32 * ta(.22))))) * env(.22, .01, .3) * .55
        i = int(SR * k * .3); out[i:i + len(b)] += b
    for k, f in enumerate([1318, 988]):  # alerta de dois tons
        b = bell(f, .5, .25); i = int(SR * (.12 + k * .13)); out[i:i + len(b)] += b[:len(out) - i]
    return out
def s_countdown(d):
    out = np.zeros(int(SR * d)); t = 0.; k = 0
    while t < d:  # dígitos rolando, desacelerando
        c = filt(noise(.02), lo=2500) * env(.02, .0005, .004) * .5; i = int(SR * t)
        out[i:i + len(c)] += c[:len(out) - i]; k += 1; t += .025 + .11 * (t / d) ** 2
    return out
def s_tick(hi=True):
    d = .06; return (filt(noise(d), lo=3000) * env(d, .0005, .006) + np.sin(2 * np.pi * (2600 if hi else 2000) * ta(d)) * env(d, .0005, .01) * .3) * .5
def s_scribble(d=.09):
    t = ta(d); x = filt(noise(d), lo=1800, hi=7000) * (0.5 + .5 * np.sin(2 * np.pi * 45 * t)) * np.sin(np.pi * t / d); return x * .35
def s_slide():
    d = .45; t = ta(d); return filt(noise(d), lo=900, hi=6000) * np.sin(np.pi * t / d) ** 1.5 * .45
def s_stamp():
    d = .5; return np.tanh((sweep(140, 60, d) * env(d, .001, .07) * 1.2 + filt(noise(d), lo=200, hi=3500) * env(d, .0005, .03) * 1.5) * 1.5) * .9
def s_thud():
    d = .5; return (sweep(95, 45, d) * env(d, .002, .14) + filt(noise(d), lo=100, hi=1500) * env(d, .001, .03) * .9) * .9
def s_flip():
    d = .3; t = ta(d); return filt(noise(d), lo=700, hi=7000) * (0.4 + .6 * np.abs(np.sin(2 * np.pi * 18 * t))) * env(d, .01, .09) * .6
def s_scratch():
    d = .3; t = ta(d); return filt(noise(d), lo=2000, hi=8000) * np.sin(np.pi * t / d) * .4
def s_spin(d):
    out = np.zeros(int(SR * d)); t = 0.
    while t < d:  # catraca acelerando e frenando
        c = filt(noise(.015), lo=3500) * env(.015, .0003, .003) * .35; i = int(SR * t); out[i:i + len(c)] += c[:len(out) - i]
        p = t / d; t += .02 + .07 * (p ** 2)
    return out
def mixs(*sigs):
    n = max(len(x) for x in sigs); out = np.zeros(n)
    for x in sigs: out[:len(x)] += x
    return out
def s_lock():
    return mixs(bell(2200, .25, .25), sweep(120, 50, .4) * env(.4, .001, .1) * .8, filt(noise(.1), lo=2000) * env(.1, .0005, .01) * .5)
def s_riser(d):
    t = ta(d); p = t / d
    x = filt(noise(d), lo=400, hi=9000) * p ** 2.2 * .45 + sweep(150, 1800, d) * p ** 2 * .22 + sweep(75, 300, d) * p ** 1.5 * .25
    return x
def s_shimmer():
    d = 1.6; out = np.zeros(int(SR * d))
    for k, f in enumerate([hz("C6"), hz("E6"), hz("G6"), hz("C7"), hz("E7")]):
        b = bell(f, .9, .1); i = int(SR * k * .07); out[i:i + len(b)] += b[:len(out) - i]
    return out
def s_pop():
    d = .14; return (sweep(900, 320, d) * env(d, .001, .035) + filt(noise(d), lo=3000) * env(d, .0005, .006) * .6) * .7
def s_shine():
    d = 1.0; out = np.zeros(int(SR * d))
    for k, f in enumerate([1800, 2400, 3000, 3600, 4400, 5200]):
        b = bell(f, .5, .07); i = int(SR * k * .06); out[i:i + len(b)] += b[:len(out) - i]
    return out
def s_count(d):
    out = np.zeros(int(SR * d)); t = 0.
    while t < d:
        c = s_tick(); i = int(SR * t); out[i:i + len(c)] += c[:len(out) - i] * .7; t += .1 - .065 * (t / d)
    return out
def s_ping():
    return bell(1250, 1.0, .22)
def s_tap():
    d = .1; return filt(noise(d), lo=2500) * env(d, .0005, .008) * .7 + sweep(1500, 900, d) * env(d, .001, .02) * .25
def s_tail():
    d = 3.0; return sweep(80, 30, d) * env(d, .01, 1.0) * .7 + filt(noise(d), hi=900) * env(d, .05, .6) * .2


def build_sfx():
    tr = np.zeros((2, N))
    for c in CUES:
        k, t = c["kind"], c["t"]
        pan = rng.uniform(-.35, .35)
        if k == "notif": place(tr, s_notif(), t, .15, .9)
        elif k == "countdown": place(tr, s_countdown(c["dur"]), t, .1, .7)
        elif k == "bass": place(tr, s_bass(), t, 0, 1.0)
        elif k == "glitch": place(tr, s_glitch(c.get("dur", .3)), t, 0, .55)
        elif k == "whoosh": place(tr, s_whoosh(), t - .2, pan, .8)
        elif k == "swipe": place(tr, s_whoosh(.4, 8000), t - .1, .4, .55)
        elif k == "ticks":
            n = int(c["dur"] / .25)
            for j in range(n): place(tr, s_tick(j % 2 == 0), t + j * .25, -.2, .55)
            for j in range(30): place(tr, s_scribble(), t + .1 + j * (c["dur"] - .2) / 30, rng.uniform(-.3, .3), .5)
        elif k == "slide": place(tr, s_slide(), t, .5, .8)
        elif k == "stamp": place(tr, s_stamp(), t, 0, 1.0)
        elif k == "thud": place(tr, s_thud(), t, pan, .9)
        elif k == "flip": place(tr, s_flip(), t, pan, .8)
        elif k == "scratch": place(tr, s_scratch(), t, .2, .7)
        elif k == "spin": place(tr, s_spin(c["dur"]), t, 0, .7)
        elif k == "lock": place(tr, s_lock(), t, 0, .9)
        elif k == "riser": place(tr, s_riser(c["dur"]), t, 0, .65)
        elif k == "impact": place(tr, s_impact(c.get("soft", False)), t, 0, 1.0)
        elif k == "shimmer": place(tr, s_shimmer(), t, 0, .8)
        elif k == "pop": place(tr, s_pop(), t, [-.5, 0, .5][c.get("k", 0) % 3], .75)
        elif k == "ding": place(tr, bell(1320 * 1.122 ** (c.get("k", 0) % 5), .7, .3), t, [-.4, -.15, .15, .4][c.get("k", 0) % 4], .9)
        elif k == "shine": place(tr, s_shine(), t, 0, .9)
        elif k == "count": place(tr, s_count(c["dur"]), t, .2, .7)
        elif k == "ping": place(tr, s_ping(), t, rng.uniform(-.5, .5), .6)
        elif k == "tap": place(tr, s_tap(), t, 0, .9); place(tr, s_pop(), t + .05, 0, .4)
        elif k == "tail": place(tr, s_tail(), t, 0, .8)
    return reverb(tr, 1.3, .14, seed=5)


# ------------------------------------------------------------------ ambiente (quarto à noite, chuva fina)
def build_ambience():
    tr = np.zeros((2, N))
    c = next(x for x in CUES if x["kind"] == "ambience"); d = c["dur"] + .6
    n = int(SR * d); t = np.arange(n) / SR
    for ch in range(2):
        rain = filt(rng.standard_normal(n), lo=900, hi=7000) * .25
        drops = np.zeros(n); idx = rng.integers(0, n, int(d * 70)); drops[idx] = rng.uniform(.2, 1, len(idx)) * rng.choice([-1, 1], len(idx))
        drops = filt(drops, lo=1500, hi=9000) * .9
        room = filt(rng.standard_normal(n), hi=250) * .5 + np.sin(2 * np.pi * 60 * t) * .015
        tr[ch, :n] = rain + drops + room
    e = np.clip(t / .6, 0, 1) * np.clip((d - t) / .6, 0, 1)
    tr[:, :n] *= e
    return tr


# ------------------------------------------------------------------ trilha
BPM = 96; BEAT = 60 / BPM; BAR = 4 * BEAT
t_cut = next(x["t"] for x in CUES if x["kind"] == "cut")
t_rev, t_climax = tag["reveal"], tag["climax"]
t_s4, t_s5 = L["r1"]["start"] - .3, L["c1"]["start"] - .3
t_tail = next(x["t"] for x in CUES if x["kind"] == "tail")
PROG = [["A2", "C3", "E3", "A3"], ["F2", "A2", "C3", "F3"], ["C3", "E3", "G3", "C4"], ["G2", "B2", "D3", "G3"]]
ROOT = ["A1", "F1", "C2", "G1"]


def section_env(a, b, fi=.4, fo=.4):
    t = np.arange(N) / SR
    return np.clip((t - a) / fi, 0, 1) * np.clip((b - t) / fo, 0, 1)


def pad_layer(a, b, notes_fn, cutoff, gain, det=(-14, -5, 5, 14)):
    out = np.zeros(N); t0 = a
    k = 0
    while t0 < b:
        notes = notes_fn(k); d = min(BAR, b - t0) + .6
        s = sum(saw(hz(n), d, det, phase_seed=k * 7 + j) for j, n in enumerate(notes)) / len(notes)
        s *= np.clip(ta(d) / .35, 0, 1) * np.clip((d - ta(d)) / .5, 0, 1)
        i = int(SR * t0); m = min(len(s), N - i); out[i:i + m] += s[:m]
        t0 += BAR; k += 1
    return filt(out, lo=60, hi=cutoff) * gain


def kick():
    d = .45; return np.tanh(sweep(150, 42, d) * env(d, .001, .16) * 2.2) * .9
def clap():
    d = .3; x = np.zeros(int(SR * d))
    for o in (0, .011, .023): b = filt(noise(.2), lo=900, hi=6000) * env(.2, .001, .05); i = int(SR * o); x[i:i + len(b)] += b[:len(x) - i]
    return x * .45
def hat():
    d = .07; return filt(noise(d), lo=7000) * env(d, .0005, .015) * .22
def pluck(f, d=.35):
    t = ta(d); s = saw(f, d, (0, 7)) ; return filt(s, hi=3500) * np.exp(-t / .12) * .5
def piano(f, d=2.4):
    t = ta(d); x = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / dd) for m, a, dd in [(1, 1, .9), (2, .35, .5), (3, .12, .3)])
    return filt(x * np.clip(t / .006, 0, 1), hi=2200) * .45


def build_music():
    t = np.arange(N) / SR
    L_ = np.zeros(N); R_ = np.zeros(N)
    def add(sig, at_, pan=0., g=1.):
        i = int(SR * at_)
        if i >= N or i < 0: return
        n = min(len(sig), N - i); l, r = np.cos((pan + 1) * np.pi / 4) * 1.41, np.sin((pan + 1) * np.pi / 4) * 1.41
        L_[i:i + n] += sig[:n] * g * l; R_[i:i + n] += sig[:n] * g * r

    # A — drone e piano abafado (gancho e dor)
    drone = (saw(hz("A1"), t_cut + 1, (-8, 0, 8)) + .6 * saw(hz("E2"), t_cut + 1, (-6, 6))) / 1.6
    drone = filt(np.pad(drone, (0, N))[:N], lo=30, hi=420) * .55
    sub_env = np.clip(t / 1.5, 0, 1) * np.clip((t_cut - t) / .08, 0, 1)
    for x in (L_, R_): x += drone * sub_env
    motif = ["E5", "C5", "A4", "B4", "C5", "A4", "E4", "G4"]
    k = 0; tt = .8
    while tt < t_cut - .5:
        add(piano(hz(motif[k % len(motif)])), tt, .25 * (-1) ** k, .6); k += 1; tt += BEAT * 2
    # pulso tenso na dor (colcheias de baixo abafado)
    tt = L["p1"]["start"] - .3
    while tt < t_cut - .1:
        add(filt(saw(hz("A1"), .2, (0, 6)), hi=300) * env(.2, .003, .08) * .7, tt, 0, .55); tt += BEAT / 2
    # B — silêncio: só um sub baixinho segurando a tensão
    hum = np.sin(2 * np.pi * hz("A1") * t) * .05 * section_env(t_cut + .3, t_rev, 1.0, .05)
    L_ += hum; R_ += hum

    # C, D, E — progressão na grade de compassos a partir da revelação
    bars = lambda k: PROG[k % 4]
    padC = pad_layer(t_rev, t_s4 + .3, bars, 1800, .5)
    padD = pad_layer(t_s4, t_s5 + .2, lambda k: PROG[(k + int((t_s4 - t_rev) / BAR)) % 4], 3200, .45)
    padE1 = pad_layer(t_s5, t_climax, lambda k: PROG[k % 4], 1200, .45)
    big = pad_layer(t_climax, DUR, lambda k: [n[:-1] + str(int(n[-1]) + 1) for n in PROG[k % 4]] + PROG[k % 4], 5500, .55, det=(-22, -11, -4, 4, 11, 22))
    for p_, pan in ((padC, .0), (padD, .0), (padE1, .0)):
        L_ += p_; R_ += p_
    # acordes largos: estéreo com detune diferente em cada lado
    L_ += big * 1.0; R_ += np.roll(big, 240) * 1.0

    def grid(a, b, step):
        n0 = int(np.ceil((a - t_rev) / step)); x = t_rev + n0 * step
        while x < b: yield x, int(round((x - t_rev) / step)); x += step

    # arpejo (C suave, D cheio, E2 uma oitava acima)
    for a, b, oct_, g in ((t_rev + BAR / 2, t_s4, 1, .35), (t_s4, t_s5, 1, .5), (t_climax, t_tail, 2, .5)):
        for x, i in grid(a, b, BEAT / 2):
            ch = PROG[int((x - t_rev) // BAR) % 4]; n = ch[[0, 1, 2, 3, 2, 1][i % 6]]
            add(pluck(hz(n[:-1] + str(int(n[-1]) + oct_))), x, .45 * np.sin(i * 1.3), g)
    # bateria e baixo
    for x, i in grid(t_rev + BAR, t_s4, BEAT * 2): add(kick(), x, 0, .55)
    for a, b, full in ((t_s4, t_s5, False), (t_climax, t_tail, True)):
        for x, i in grid(a, b, BEAT):
            add(kick(), x, 0, .9)
            if i % 2 == 1: add(clap(), x, 0, .8 if full else .6)
        for x, i in grid(a, b, BEAT / (4 if full else 2)): add(hat(), x, .3 * (-1) ** i, .9 if i % 2 else .55)
        for x, i in grid(a, b, BEAT / 2):
            r = ROOT[int((x - t_rev) // BAR) % 4]; s = filt(saw(hz(r), .3, (0, 5)), hi=500) * env(.3, .004, .14)
            add(np.tanh(s * 2) * .6, x, 0, .9 if full else .75)
    # acorde final soando depois da última batida
    fin = sum(saw(hz(n), 4.0, (-12, 0, 12)) for n in ["A2", "E3", "A3", "C4", "E4"]) / 5
    fin = filt(fin * np.exp(-ta(4.0) / 1.6), hi=3000) * .6
    add(fin, t_tail, 0, 1.0)
    mix = np.vstack([L_, R_])
    # fades gerais
    mix *= np.clip(t / .8, 0, 1) * np.clip((DUR - t) / 1.2, 0, 1)
    return reverb(mix, 2.6, .28, seed=9)


def write(path, x):
    x = x / max(1e-9, np.max(np.abs(x)) / .95)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x.T, -1, 1) * 32767).astype("<i2").tobytes())


write(sfx_p, build_sfx()); print("sfx ok")
write(amb_p, build_ambience()); print("ambiente ok")
write(mus_p, build_music()); print("trilha ok")
