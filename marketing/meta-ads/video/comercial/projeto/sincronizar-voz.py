"""Sincroniza uma narração regravada (ElevenLabs, sua voz, locutor) com o comercial.

Uso: python sincronizar-voz.py <narracao.json> <audio.mp3|wav> <voz.wav> <timeline.json> [timeline-guia.json]

Lê o áudio, encontra as pausas entre as 17 falas do roteiro (narracao.json) e gera uma timeline nova.
A escolha das pausas usa programação dinâmica: prefere silêncios longos que caiam perto de onde cada
fala deveria terminar, proporcionalmente ao tamanho do texto — então pausas internas ("Um celular. Uma
habilidade.") não confundem a divisão. Depois rode produzir.sh: imagem, efeitos e trilha se re-sincronizam.
"""
import json, subprocess, sys, wave
import numpy as np

SR = 48000
nar_p, src, out_wav, out_tl = sys.argv[1:5]
GUIDE = sys.argv[5] if len(sys.argv) > 5 else __file__.rsplit("/", 1)[0] + "/timeline-guia.json"
lines = json.load(open(nar_p))["linhas"]
LEAD, TAIL = 0.45, 2.2

raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", src, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype="<i2").astype(np.float64) / 32768

# energia em janelas de 10 ms
hop = SR // 100
rms = np.sqrt(np.convolve(x ** 2, np.ones(hop) / hop, "same")[::hop])
db = 20 * np.log10(rms + 1e-9)
thr = max(np.percentile(db, 95) - 32, np.percentile(db, 10) + 6)
voiced = db > thr
idx = np.where(voiced)[0]
v0, v1 = idx[0], idx[-1]

# silêncios candidatos (>= 120 ms) dentro da fala
gaps, i = [], v0
while i < v1:
    if not voiced[i]:
        j = i
        while j < v1 and not voiced[j]: j += 1
        if j - i >= 12: gaps.append((i, j))
        i = j
    else: i += 1
if len(gaps) < len(lines) - 1:
    sys.exit(f"Encontrei só {len(gaps)} pausas para {len(lines)} falas. Regrave com um respiro entre as frases.")

# fronteiras esperadas: o ritmo planejado da narração-guia (com as pausas do roteiro), esticado para a gravação
gt = json.load(open(GUIDE))["linhas"]
g0, g1 = gt[0]["start"], gt[-1]["end"]
exp = np.array([v0 + ((gt[k]["end"] + gt[k + 1]["start"]) / 2 - g0) / (g1 - g0) * (v1 - v0) for k in range(len(gt) - 1)])
G, K = len(gaps), len(lines) - 1
mid = np.array([(a + b) / 2 for a, b in gaps]); ln = np.array([b - a for a, b in gaps])
cost = lambda g, k: (abs(mid[g] - exp[k]) / (v1 - v0)) * 40 - np.log(ln[g])
INF = 1e18
dp = np.full((K, G), INF); bk = np.zeros((K, G), int)
for g in range(G): dp[0, g] = cost(g, 0)
for k in range(1, K):
    best, arg = INF, -1
    for g in range(G):
        if g > 0 and dp[k - 1, g - 1] < best: best, arg = dp[k - 1, g - 1], g - 1
        if arg >= 0: dp[k, g] = best + cost(g, k); bk[k, g] = arg
g = int(np.argmin(dp[K - 1])); pick = [g]
for k in range(K - 1, 0, -1): g = bk[k, g]; pick.append(g)
pick = pick[::-1]

bounds = [v0] + [x_ for g in pick for x_ in gaps[g]] + [v1]
off = LEAD - v0 / 100
out, prev_end = [], None
for n, l in enumerate(lines):
    s, e = bounds[2 * n] / 100 + off, bounds[2 * n + 1] / 100 + off
    out.append({**l, "start": round(s, 3), "end": round(e, 3)})
for n in range(len(out) - 1): out[n]["pausa"] = round(out[n + 1]["start"] - out[n]["end"], 3)
out[-1]["pausa"] = 0
dur = out[-1]["end"] + TAIL

y = np.zeros(int(SR * dur)); seg = x[max(0, int((v0 / 100 - .05) * SR)):int((v1 / 100 + .3) * SR)]
i0 = int((LEAD - .05) * SR); y[i0:i0 + len(seg)] = seg[:len(y) - i0]
with wave.open(out_wav, "wb") as f:
    f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR)
    f.writeframes((np.clip(y / max(1e-9, np.max(np.abs(y))) * .9, -1, 1) * 32767).astype("<i2").tobytes())
json.dump({"duration": round(dur, 3), "linhas": out}, open(out_tl, "w"), ensure_ascii=False, indent=1)
for l in out: print(f'{l["start"]:6.2f}–{l["end"]:6.2f}  {l["fala"]}')
print("duração:", round(dur, 2), "s")
