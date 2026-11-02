"""Gera a narração-guia (Piper, pt-BR) frase por frase e monta voz.wav + timeline.json com as pausas do roteiro.

Uso: python gerar-voz.py <narracao.json> <modelo.onnx> <voz.wav> <timeline.json>
"""
import json, subprocess, sys, tempfile, wave, os
import numpy as np

SR = 48000
nar_p, model, out_wav, out_tl = sys.argv[1:5]
nar = json.load(open(nar_p))
PIPER = os.environ.get("PIPER", "/tmp/ttsenv/bin/piper")
LEAD, TAIL = 0.45, 2.2  # respiro antes da 1ª fala / final para a assinatura


def read(path):
    with wave.open(path) as w:
        sr, n = w.getframerate(), w.getnframes()
        x = np.frombuffer(w.readframes(n), dtype="<i2").astype(np.float64) / 32768
    # reamostra para 48 kHz (interpolação linear) e corta silêncio das pontas
    t = np.arange(int(len(x) * SR / sr)) / SR
    y = np.interp(t, np.arange(len(x)) / sr, x)
    nz = np.where(np.abs(y) > 0.01)[0]
    return y[max(0, nz[0] - 480): nz[-1] + 2400] if len(nz) else y


chunks, lines, t = [np.zeros(int(SR * LEAD))], [], LEAD
with tempfile.TemporaryDirectory() as d:
    for i, ln in enumerate(nar["linhas"]):
        f = os.path.join(d, f"{i}.wav")
        subprocess.run([PIPER, "-m", model, "-f", f, "--length-scale", str(ln.get("ritmo", 1.04)),
                        "--noise-scale", "0.7", "--noise-w-scale", "0.9"],
                       input=ln["fala"].encode(), check=True, capture_output=True)
        y = read(f)
        dur = len(y) / SR
        lines.append({**ln, "start": round(t, 3), "end": round(t + dur, 3)})
        chunks += [y, np.zeros(int(SR * ln["pausa"]))]
        t += dur + ln["pausa"]
chunks.append(np.zeros(int(SR * TAIL)))
x = np.concatenate(chunks)
x = x / max(1e-9, np.max(np.abs(x))) * 0.9
with wave.open(out_wav, "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x * 32767).astype("<i2").tobytes())
json.dump({"duration": round(len(x) / SR, 3), "linhas": lines}, open(out_tl, "w"), ensure_ascii=False, indent=1)
print("voz", round(len(x) / SR, 2), "s")
