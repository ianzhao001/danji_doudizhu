#!/usr/bin/env python3
"""v1.6 T-CUE-AUDIO:redeal/reset/landlord 三音合成器(音频解禁,裁决 2026-07-12)。

沿存量配方(asset-previews/pink-cartoon-production-v1/PROMPTS.md:90-98):
Python 本地合成 sine/chirp/noise 包络,44.1kHz mono PCM Int16,峰值归一与存量一致
(存量 9 键实测峰值 23592 = 0.72 全幅)。甜美休闲、卡通不刺耳。

确定性:零 random 模块——噪声用定值种子 LCG;重跑逐字节一致。
自测门:时长/峰值/landlord RMS < win.wav RMS(响度压 win 之下),违者 exit 1。

运行:python3 coordination/scripts/v16-audio-synth.py   (仓根或任意 cwd 均可)
依赖:仅 Python 标准库(wave/struct/math/pathlib)。
"""
from __future__ import annotations

import math
import struct
import sys
import wave
from pathlib import Path

SR = 44100
PEAK = 23592  # 0.72 全幅,与存量 9 键逐一实测一致
ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / 'assets' / 'resources' / 'audio'


def lcg(seed: int):
    """确定性线性同余噪声源,返回 [-1,1)。"""
    state = seed & 0x7FFFFFFF
    while True:
        state = (state * 1103515245 + 12345) & 0x7FFFFFFF
        yield (state / 0x40000000) - 1.0


def hann_window(i: int, n: int) -> float:
    return 0.5 - 0.5 * math.cos(2.0 * math.pi * i / max(1, n - 1))


def adsr(i: int, n: int, attack_s: float, release_s: float) -> float:
    a = int(SR * attack_s)
    r = int(SR * release_s)
    if i < a:
        return i / max(1, a)
    if i >= n - r:
        return max(0.0, (n - i) / max(1, r))
    return 1.0


def normalize(samples: list[float], peak: int = PEAK) -> list[int]:
    top = max(abs(s) for s in samples)
    if top <= 0:
        raise SystemExit('empty signal')
    k = peak / top
    return [max(-32767, min(32767, round(s * k))) for s in samples]


def write_wav(name: str, ints: list[int]) -> Path:
    path = OUT_DIR / name
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(struct.pack('<' + str(len(ints)) + 'h', *ints))
    return path


def synth_reset() -> list[float]:
    """reset ≈0.22s:软下滑音(660→440Hz 滑音+弱八度泛音),每局开始的轻提示。"""
    n = int(SR * 0.22)
    out = []
    phase = 0.0
    phase2 = 0.0
    for i in range(n):
        t = i / n
        f = 660.0 - 220.0 * t  # 线性下滑
        phase += 2.0 * math.pi * f / SR
        phase2 += 2.0 * math.pi * (f * 2.0) / SR
        env = adsr(i, n, 0.012, 0.10) * (1.0 - 0.25 * t)
        out.append(env * (math.sin(phase) + 0.22 * math.sin(phase2)))
    return out


def synth_redeal() -> list[float]:
    """redeal ≈0.35s:洗牌沙沙(低通噪声双峰包络)+底衬上行扫频,语境=叫抢全过重发。"""
    n = int(SR * 0.35)
    noise = lcg(20260712)
    out = []
    lp = 0.0
    phase = 0.0
    for i in range(n):
        t = i / n
        # 一阶低通软化白噪(卡通"沙沙"而非嘶嘶)
        lp = lp + 0.18 * (next(noise) - lp)
        # 双峰包络:两把"搓牌"手感,峰位 28%/68%
        g1 = math.exp(-((t - 0.28) ** 2) / (2 * 0.11 ** 2))
        g2 = math.exp(-((t - 0.68) ** 2) / (2 * 0.13 ** 2))
        swish = lp * (0.72 * g1 + 1.0 * g2)
        # 底衬上行扫频(300→900Hz,弱),给"重来一次"上扬语气
        f = 300.0 + 600.0 * t
        phase += 2.0 * math.pi * f / SR
        sweep = 0.30 * math.sin(phase) * hann_window(i, n)
        out.append(adsr(i, n, 0.01, 0.06) * (swish + sweep))
    return out


def synth_landlord() -> list[float]:
    """landlord ≈0.55s:双音上行小号角 C5→E5(sine+2/3 次谐波软化),定地主时刻。"""
    n = int(SR * 0.55)
    out = [0.0] * n

    def note(freq: float, start_s: float, dur_s: float, gain: float) -> None:
        """绽放-衰减包络:峰在音头,延音指数衰减——号角感,且 RMS 天然压低。"""
        i0 = int(SR * start_s)
        m = int(SR * dur_s)
        a = int(SR * 0.014)
        phase = 0.0
        for j in range(m):
            i = i0 + j
            if i >= n:
                break
            phase += 2.0 * math.pi * freq / SR
            attack = j / a if j < a else 1.0
            bloom = math.exp(-2.6 * max(0, j - a) / m)
            tail = adsr(j, m, 0.0, 0.05)  # 末端 50ms 归零防爆音
            tone = math.sin(phase) + 0.35 * math.sin(2.0 * phase) + 0.12 * math.sin(3.0 * phase)
            out[i] += gain * attack * bloom * tail * tone

    note(523.25, 0.0, 0.26, 0.82)   # C5
    note(659.25, 0.22, 0.33, 1.0)   # E5,叠 40ms 上行衔接
    return out


def rms(ints: list[int]) -> float:
    return math.sqrt(sum(v * v for v in ints) / len(ints))


def read_wav_ints(path: Path) -> list[int]:
    with wave.open(str(path), 'rb') as w:
        assert w.getframerate() == SR and w.getnchannels() == 1 and w.getsampwidth() == 2
        return list(struct.unpack('<' + str(w.getnframes()) + 'h', w.readframes(w.getnframes())))


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    made = {
        'reset.wav': normalize(synth_reset()),
        'redeal.wav': normalize(synth_redeal()),
        'landlord.wav': normalize(synth_landlord()),
    }
    win = read_wav_ints(OUT_DIR / 'win.wav')
    win_rms = rms(win)
    ok = True
    for name, ints in made.items():
        path = write_wav(name, ints)
        dur = len(ints) / SR
        peak = max(abs(v) for v in ints)
        line = f'{name}: dur={dur:.3f}s peak={peak} rms={rms(ints):.1f}'
        expect = {'reset.wav': 0.22, 'redeal.wav': 0.35, 'landlord.wav': 0.55}[name]
        if abs(dur - expect) > 0.005 or peak != PEAK:
            ok = False
            line += '  <-- GATE FAIL(时长或峰值)'
        print(line, '->', path)
    lord_rms = rms(made['landlord.wav'])
    print(f'win.wav rms={win_rms:.1f}; landlord rms={lord_rms:.1f} (must be lower)')
    if lord_rms >= win_rms:
        ok = False
        print('GATE FAIL: landlord RMS >= win RMS')
    if not ok:
        sys.exit(1)
    print('V16 AUDIO SYNTH PASS')


if __name__ == '__main__':
    main()
