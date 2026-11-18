"""
Local text-to-speech for the reelkit pipeline (Kokoro and Piper, both offline and free).
Run with the Python of the venv created by `pnpm bootstrap --only tts`.

Reads one JSON request from stdin and writes a mono WAV:
  {"engine": "kokoro", "text": "...", "voice": "if_sara", "speed": 1.0,
   "model": "kokoro-v1.0.onnx", "voices": "voices-v1.0.bin", "out": "x.wav"}
  {"engine": "piper", "text": "...", "speed": 1.0, "model": "it_IT-paola-medium.onnx",
   "out": "x.wav"}
Prints one JSON line with the sample rate.
"""

import json
import sys
import wave


def kokoro(req: dict) -> int:
    import soundfile as sf
    from kokoro_onnx import Kokoro

    engine = Kokoro(req["model"], req["voices"])
    # Italian goes through espeak-ng ("it"), bundled by kokoro-onnx via espeakng-loader.
    samples, rate = engine.create(
        req["text"], voice=req["voice"], speed=float(req.get("speed", 1.0)), lang="it"
    )
    sf.write(req["out"], samples, rate)
    return int(rate)


def piper(req: dict) -> int:
    from piper import PiperVoice, SynthesisConfig

    voice = PiperVoice.load(req["model"])
    # length_scale > 1 is slower: invert the speed factor.
    config = SynthesisConfig(length_scale=1.0 / float(req.get("speed", 1.0)))
    with wave.open(req["out"], "wb") as out:
        voice.synthesize_wav(req["text"], out, syn_config=config)
    return int(voice.config.sample_rate)


def main() -> None:
    req = json.loads(sys.stdin.buffer.read().decode("utf-8"))
    engines = {"kokoro": kokoro, "piper": piper}
    if req.get("engine") not in engines:
        raise SystemExit(f"unknown engine {req.get('engine')!r}")
    rate = engines[req["engine"]](req)
    print(json.dumps({"sampleRate": rate}))


if __name__ == "__main__":
    main()
