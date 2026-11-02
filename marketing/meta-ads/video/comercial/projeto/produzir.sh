#!/usr/bin/env bash
# Produz o comercial completo.
#   ./projeto/produzir.sh                      → com a narração-guia sintética (Piper)
#   ./projeto/produzir.sh minha-voz.mp3        → com uma narração regravada (ElevenLabs, locutor, sua voz)
# Requer: node + playwright, ffmpeg, python3 + numpy (e piper, só para a voz-guia).
set -euo pipefail
cd "$(dirname "$0")/.."
PY=${PY:-python3}
if [ $# -ge 1 ]; then
  $PY projeto/sincronizar-voz.py projeto/narracao.json "$1" audio/narracao.wav projeto/timeline.json projeto/timeline-guia.json
  VOZ=audio/narracao.wav; OUT=rota-invisivel-comercial.mp4
else
  $PY projeto/gerar-voz.py projeto/narracao.json "${PIPER_VOICE:-/tmp/tts/voice/pt-br-edresson-low.onnx}" audio/narracao-guia.wav projeto/timeline.json
  cp projeto/timeline.json projeto/timeline-guia.json
  VOZ=audio/narracao-guia.wav; OUT=rota-invisivel-comercial-voz-guia.mp4
fi
node projeto/render.mjs cues projeto/timeline.json projeto/cues.json
$PY projeto/gerar-audio.py projeto/timeline.json projeto/cues.json audio/sfx.wav audio/trilha.wav audio/ambiente.wav
node projeto/render.mjs srt projeto/timeline.json legendas/rota-invisivel-comercial.srt
node projeto/render.mjs video projeto/timeline.json projeto/cues.json "$VOZ" audio/sfx.wav audio/trilha.wav audio/ambiente.wav "$OUT"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,sample_rate -show_entries format=duration -of compact "$OUT"
