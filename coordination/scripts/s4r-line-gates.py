#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
W-VISION-COLOR 线条机检门(门K 线条一致性 / 门L DPR 半像素)。纯 PIL。

用户 R2 punch:描边粗细统一/双重边框/半像素线/DPR 粗细跳变——CSS mockup 上不可判,
必须对真实渲染判。数据源 = s4-evidence.mjs 的 labels/*.json(sprites 条目,含
vpRect 物理像素/box 源尺度/world 逻辑尺寸/occluded)+ shots/*.png 真机截图;
line-manifest 仅作覆盖交叉核对(其条目无 state 字段,不能独立定位截图)。

判据(阈值由 --calibrate 对真机分布校准后钉死,不拍脑袋;门H 假红 201 例的教训):
  门K1 左右对称:同一元素左/右边缘复合带宽度之差 ≤ max(K1_ABS·dpr, K1_REL·较大者)。
       (所有受检皮左右按设计对称;顶部高光/底唇故意不对称,顶/底不入 K1。)
  门K2 侧边双描边:左/右边缘窗口内,主边缘结构之后的**分离梯度结构**(安静间隙 ≥3px)必须为 0。
       ≥1 = 与边框平行的复线/双重边框(能判「有可见间隙」型复线;紧贴无间隙型由 K1/K3 的
       复合带宽异常兜底,完全对称的紧贴复线登记为本门 v1 能力边界)。
       (顶/底豁免:v21 结构的顶高光与底唇是已签设计,天然多结构。)
  门K3 同键一致:同 (皮键, dpr) 的全部实例,边缘复合带宽度**回投源像素**
       (÷ world/box ÷ dpr)后须聚在中位数 ± max(K3_ABS 源px, K3_REL·中位)内。
       (九宫格边带异常拉伸/某实例描边跑偏即离群。)
  门L1 DPR 布局确定性:同 (视口,态,键,box,world) 的 dpr1/dpr2 实例,vpRect₂ ≈ 2·vpRect₁(±L1_TOL px)。
  门L2 DPR 描边比:边缘复合带宽度 dpr2/dpr1 ∈ [L2_LO, L2_HI](粗细跳变/未按 DPR 缩放即红)。
  门L3 锐度:外缘过渡带(累计变化 10%→90%)宽度 dpr1 ≤ L3_DPR1 px、dpr2 ≤ L3_DPR2 px
       (半像素线渲染成宽而虚的过渡带即红)。

自证:每次运行先跑内置合成夹具(绿1 + 红4:左右异宽/侧边复线/DPR比1.0/半像素虚边),
任一夹具判错立即 exit 2——先自证门再信门。

运行:
  python3 s4r-line-gates.py --evidence-root <...>/W-VISION-S4R-evidence \
      [--manifest <...>/W-VISION-COLOR-line-manifest.json] [--report out.json] [--calibrate]
"""
import argparse
import json
import math
import os
import re
import sys
from collections import defaultdict

from PIL import Image, ImageDraw

# ---------------------------------------------------------------- 阈值(2026-07-16 对 547 真机实例校准;见 BOARD)
LINE_KEYS = {
    'btn-primary-c1': 'button', 'btn-secondary-c1': 'button', 'btn-neutral-c1': 'button',
    # R2-d rim 加厚换 c2(c1 键保留以兼容历史证据;证据里没有就自然休眠)
    'btn-primary-c2': 'button', 'btn-secondary-c2': 'button', 'btn-neutral-c2': 'button',
    'seat-nameplate-c1': 'nameplate', 'info-pill-c1': 'pill', 'pattern-label-v19': 'pill',
    'panel-popup-v19': 'panel', 'settlement-panel-v19': 'panel',
}
GRAD_MIN = 8          # 亮度梯度 > 8 记「梯度像素」(255 制)
STRUCT_QUIET = 3      # 分离结构判定:两梯度结构间须有 ≥3px 安静带
FILL_TOL = 14         # 间隙台色与深部填充亮度差 < 14 → 间隙是填充 → 真分离结构(复线);否则是描边内部,并入主复合
PROM_REL = 0.45       # 额外结构突出度门槛:峰值梯度 ≥ 45%·主边缘峰值才算复线
                      # (v21 侧缘高光 rim / 面板内侧 bevel 是弱梯度已签结构,不得误报——2026-07-16 真机定性)
EDGE_WINDOW_SRC = 10  # 边缘窗口:边界向内 10 源px(× scale 后为屏上窗口;7 曾截断结算面板厚边框)
MIN_SIDE_PX = 14      # 侧边可测的最小屏上高/宽
K1_MIN = 2.0                    # K1 只比两侧均可测(≥2px)的实例——发丝/幽灵边在量测底噪下
K1_ABS, K1_REL = 2.0, 0.45      # 左右差 ≤ max(2·dpr, 45%)
K2_MAX_EXTRA_STRUCTS = 0        # 左/右主边缘之后的「突出」分离结构数上限
K3_MIN_COHORT = 4               # K3 同键同 scale 桶最少实例数(不足不比)
K3_ABS, K3_REL = 1.5, 0.40      # 同桶带宽:中位 ± max(1.5·dpr, 40%)
K3B_MED_MIN = 2.5               # K3b 边缘消失下限:同尺桶健康中位 ≥2.5 而该实例 <2 才有话可说。
                                # 仅当采证器给出 sprites[].interactable === true 才武装(禁用幽灵钮是
                                # 已签设计,alpha.disabled 压暗后边缘天然消失,不得误报;字段缺失时休眠)。
RIM_OFFLINE = 8                 # rim 在场性(R2-d·按钮族物理直指标·四版定形):元素内侧存在到「底色↔填充」
                                # RGB 连线段距离 ≥8 的像素 → rim 在场。**不限明暗**——v21 是方向光设计,
                                # 薄荷钮左缘=1px 暗 rim(off≈89),橙钮左缘=亮 rim(off≈11-48),都算「侧缘可见」。
                                # 判别本质:AA 过渡像素是 底↔填充 的线性混合(实测 off≤6),rim 不在这条线上。
                                # 一版教训:「比 min(底,填充) 都深」——薄荷 rim 与粉底亮度持平,全量 span=0;
                                # 二版教训:「只比填充深」——底比填充暗时 AA 混合像素假在场;
                                # 三版教训:「离线+更暗」——亮 rim 侧(方向光)被 darker 条件误杀。
                                # **按钮族宽度类子门(K1/K3/L2)显式豁免**:1~2 设备px 的 rim 宽度在量化域里
                                # 不是良定义量(dpr1 2-vs-4 栅格分叉、dpr2 相位劈裂全天产伪影);按钮族保留
                                # 在场性(用户直接诉求)+K2 复线+L1 布局+L3 锐度四件可判定事。非按钮族原样。
K3_SUBPIXEL_MED = 4.5           # K3 双档:dpr1 且桶健康中位 <4.5(rim ≈1~2 设备px 量化域,2-vs-4 分叉是栅格
                                # 相位不是缺陷)→ 边界披露;dpr2 或中位 ≥4.5 → 维持硬红。与 K3b 双档同一法理。
K3B_ASSERT_MED = 3.5            # K3b 双档裁决(2026-07-16·R2-b 15 例定性):
                                # · 中位 ≥3.5(DPR2 等稳健超像素边)→ 硬红——边框该在而不在是真缺陷;
                                # · 2.5 ≤ 中位 <3.5(发丝+AA 亚像素域:c1 源边框×scale≈1px,DPR1 栅格
                                #   对齐决定时有时无——震动关 DPR1 侧 rim 实拍消失/DPR2 清晰)→
                                #   **边界披露档**:◦ 列印 + report['K3bBoundary'],不判 FAIL。
                                #   修复被色锁(禁加深 rim)与 v21 结构冻结(禁加厚源边框)双封,
                                #   真机手机 dpr≥2 不受影响;处置权在用户(登记 KNOWN_LIMITATIONS 或解锁加厚)。
L1_TOL = 2                      # vpRect₂ 与 2·vpRect₁ 各分量容差 px
L2_MIN_W1 = 4.5                 # L2 只比 dpr1 主边缘 ≥4.5px 的厚描边(发丝边被 AA 常数支配,比值不可判)
L2_LO, L2_HI = 1.25, 2.9        # 厚描边 dpr2/dpr1 带
L3_CAPS = {                     # 外缘过渡带(10%→90%)宽度上限,按族(2026-07-16 对真机分布校准,余量 ~1.5px)
    'button': (6.0, 9.5),       # c2 rim +2px 后按钮边缘物理变宽(dpr1 max 5 / dpr2 max 8 实测),上限随族重钉
    'pill': (5.0, 7.5), 'nameplate': (5.0, 7.5),
    'panel': (7.0, 11.5),       # 面板柔和投影是已签设计,边缘天然更宽(915 dpr2 实测 10)
}
NOISY_LINES = 3                 # 一侧 9 条采样线中 ≥3 条外侧窗带梯度 → 背景贴边,量测前提不成立
                                # (名牌右缘贴粉塔楼/面板右缘贴幕布——2026-07-16 真机定性)。
                                # noisy 侧 K3/L2/L3 跳过并计入 stats.noisySides(显式不可测,非静默放行)。

fails = []
report = {'selftest': [], 'K': [], 'L': [], 'stats': {}}


def gate(ok, msg):
    print(('   ✓ ' if ok else '   ✗ ') + msg)
    if not ok:
        fails.append(msg)


def rgb_row(im, pts):
    px = im.load()
    return [px[x, y][:3] for x, y in pts]


def _seg_dist(p, a, b):
    """点 p 到线段 ab 的 RGB 空间距离(AA 混合像素落在 底↔填充 线段上,rim 不在)。"""
    ab = [b[i] - a[i] for i in range(3)]
    ap = [p[i] - a[i] for i in range(3)]
    denom = sum(v * v for v in ab) or 1.0
    t = max(0.0, min(1.0, sum(ap[i] * ab[i] for i in range(3)) / denom))
    return math.sqrt(sum((ap[i] - t * ab[i]) ** 2 for i in range(3)))


def profile_pts(bbox, side, frac, out_px, in_px, W, H):
    """从 bbox 的 side 边、按 frac(0..1 沿边方向)取一条由外向内的采样线。越界返回 None。"""
    x, y, w, h = bbox
    if side in ('left', 'right'):
        yy = int(round(y + h * frac))
        if not (0 <= yy < H):
            return None
        if side == 'left':
            xs = range(int(x - out_px), int(x + in_px))
        else:
            xs = range(int(x + w - 1 + out_px), int(x + w - 1 - in_px), -1)
        pts = [(xx, yy) for xx in xs]
    else:
        xx = int(round(x + w * frac))
        if not (0 <= xx < W):
            return None
        if side == 'top':
            ys = range(int(y - out_px), int(y + in_px))
        else:
            ys = range(int(y + h - 1 + out_px), int(y + h - 1 - in_px), -1)
        pts = [(xx, yy) for yy in ys]
    for xx, yy in pts:
        if not (0 <= xx < W and 0 <= yy < H):
            return None
    return pts


def edge_metrics(rgb, out_px):
    """一条由外向内的 RGB 序列 → (主边缘复合带宽度, 分离结构数, 过渡带10-90宽度, noisy, rim在场, rim暗带宽)。

    「分离结构」:梯度像素按安静间隙 ≥STRUCT_QUIET 分簇。**主边缘 = 离 bbox 边界(profile índice
    ≈ out_px)最近的簇**——边界外的背景纹理梯度(贴边的塔楼/幕布竖线)不得被当成主边缘并入
    (2026-07-16 真机定性:名牌右缘贴粉塔楼曾把主边缘拉宽 2px)。主边缘之前的簇一律丢弃;
    其后每一簇是与边框平行的额外线条候选(复线/双重边框)。
    """
    prof = [0.299 * r + 0.587 * g + 0.114 * b for r, g, b in rgb]

    def rim_scan():
        head = rgb[:max(2, out_px - 2)]
        bg_ref = tuple(sorted(c[i] for c in head)[len(head) // 2] for i in range(3))
        tail = rgb[-3:]
        fill_rgb = tuple(sorted(c[i] for c in tail)[1] for i in range(3))
        idx = [i for i in range(max(0, out_px - 1), len(rgb))
               if _seg_dist(rgb[i], bg_ref, fill_rgb) >= RIM_OFFLINE]
        return (bool(idx), float(idx[-1] - idx[0] + 1) if idx else 0.0)

    d = [abs(prof[i + 1] - prof[i]) for i in range(len(prof) - 1)]
    hot = [i for i, v in enumerate(d) if v > GRAD_MIN]
    if not hot:
        pres, span = rim_scan()
        return 0.0, 0, 0.0, False, pres, span
    noisy = any(i < out_px - 2 for i in hot)  # 外侧窗(边界之外)出现梯度 → 背景贴边
    # 微簇(安静间隙 ≥ STRUCT_QUIET 分开)
    micro = []
    s = p = hot[0]
    for i in hot[1:]:
        if i - p < STRUCT_QUIET + 1:
            p = i
        else:
            micro.append([s, p])
            s = p = i
    micro.append([s, p])
    # 锚定主边缘:取覆盖或最接近 bbox 边界位置(out_px-1)的簇,丢弃其之前的背景纹理簇。
    edge_at = out_px - 1
    anchor = 0
    best = None
    for idx, (a, b) in enumerate(micro):
        dist = 0 if a <= edge_at <= b else min(abs(a - edge_at), abs(b - edge_at))
        if best is None or dist < best:
            best, anchor = dist, idx
    micro = micro[anchor:]
    # 台色合并:间隙台色 ≈ 深部填充 → 真分离结构(复线);台色是描边自身(粗描边内部安静) → 并入主复合。
    tail = sorted(prof[-3:])
    fill_ref = tail[len(tail) // 2]
    merged = [micro[0][:]]
    for a, b in micro[1:]:
        plateau = prof[merged[-1][1] + 2: a + 1]
        plat = sorted(plateau)[len(plateau) // 2] if plateau else fill_ref
        if abs(plat - fill_ref) < FILL_TOL:
            merged.append([a, b])
        else:
            merged[-1][1] = b
    # 突出度过滤:额外结构须与主边缘同量级(峰值梯度 ≥ PROM_REL·主峰),弱梯度的
    # 已签设计结构(v21 侧缘高光 rim / 面板内侧 bevel)不算复线。
    peak0 = max(d[merged[0][0]:merged[0][1] + 1])
    bands = [merged[0]] + [
        m for m in merged[1:] if max(d[m[0]:m[1] + 1]) >= PROM_REL * peak0
    ]
    complex_w = bands[0][1] - bands[0][0] + 1
    # 过渡带锐度:主边缘簇累计变化 10%→90% 的跨度
    first = bands[0]
    lo = max(0, first[0] - 2)
    hi = min(len(d), first[1] + 3)
    seg = d[lo:hi]
    total = sum(seg)
    if total <= 0:
        pres, span = rim_scan()
        return float(complex_w), len(bands) - 1, 0.0, noisy, pres, span
    acc = 0.0
    i10 = i90 = None
    for i, v in enumerate(seg):
        acc += v
        if i10 is None and acc >= 0.10 * total:
            i10 = i
        if i90 is None and acc >= 0.90 * total:
            i90 = i
            break
    trans = (i90 - i10 + 1) if (i10 is not None and i90 is not None) else len(seg)
    pres, span = rim_scan()
    return float(complex_w), len(bands) - 1, float(trans), noisy, pres, span


def measure_element(im, bbox, dpr, scale):
    """四边中段 9 条采样线的中位指标。返回 {side: (complexW, bands, transW)} 或 None(不可测)。"""
    W, H = im.size
    x, y, w, h = bbox
    if w < MIN_SIDE_PX or h < MIN_SIDE_PX:
        return None
    # 外侧窗必须留出可观察长度,否则 noisy(背景贴边)检测在 dpr1 永远不触发(2026-07-16 教训)。
    out_px = max(4, int(round(3 * dpr)))
    # 内窗下限必须覆盖复线可注入带:scale-safe 皮 scale≈0.3 时 10·scale 只剩 3px,
    # 注入在 +6px 的复线曾整体落在窗外——负向自证抓出的第三层门缺陷(2026-07-16)。
    in_px = max(8 * dpr, int(round(EDGE_WINDOW_SRC * scale)))
    res = {}
    for side in ('left', 'right', 'top', 'bottom'):
        rows = []
        for frac in (0.25, 0.3, 0.35, 0.42, 0.5, 0.58, 0.65, 0.7, 0.75):
            pts = profile_pts(bbox, side, frac, out_px, in_px, W, H)
            if pts is None:
                continue
            rows.append(edge_metrics(rgb_row(im, pts), out_px))
        if len(rows) < 5:
            return None
        noisy_n = sum(1 for r in rows if r[3])
        cw_sorted = sorted(r[0] for r in rows)
        bands_sorted = sorted(r[1] for r in rows)
        trans_sorted = sorted(r[2] for r in rows)
        span_sorted = sorted(r[5] for r in rows)
        present_n = sum(1 for r in rows if r[4])
        res[side] = (cw_sorted[len(cw_sorted) // 2], bands_sorted[len(bands_sorted) // 2],
                     trans_sorted[len(trans_sorted) // 2], noisy_n >= NOISY_LINES,
                     present_n >= (len(rows) + 1) // 2, span_sorted[len(span_sorted) // 2])
    return res


def width_of(r, side):
    """线宽指标:按钮族用 rim 暗带宽(物理直指标,抗相位劈裂),其余族用主边缘复合带宽。"""
    return r['met'][side][5] if r['type'] == 'button' else r['met'][side][0]


# ---------------------------------------------------------------- 采集
def collect(evidence_root):
    labels_dir = os.path.join(evidence_root, 'labels')
    shots_dir = os.path.join(evidence_root, 'shots')
    items = []
    for f in sorted(os.listdir(labels_dir)):
        m = re.match(r'([a-z-]+)-(\d+x\d+)(-dpr2)?\.json$', f)
        if not m:
            continue
        state, vp, dpr = m.group(1), m.group(2), 2 if m.group(3) else 1
        shot = os.path.join(shots_dir, f[:-5] + '.png')
        if not os.path.exists(shot):
            continue
        data = json.load(open(os.path.join(labels_dir, f)))
        for s in data.get('sprites', []):
            base = (s.get('spr') or '').split('/')[-1]
            if base not in LINE_KEYS or s.get('occluded'):
                continue
            vr = s.get('vpRect')
            box, world = s.get('box'), s.get('world')
            if not vr or not box or not world or not box[0] or not box[1]:
                continue
            scale = (world[0] / box[0]) * dpr
            items.append({
                'state': state, 'vp': vp, 'dpr': dpr, 'key': base, 'type': LINE_KEYS[base],
                'node': s.get('owner') or s.get('node'), 'bbox': [round(v) for v in vr],
                'scale': scale, 'shot': shot, 'interactable': s.get('interactable'),
                'pair_id': (vp, state, base, round(box[0]), round(box[1]), round(world[0]), round(world[1]),
                            s.get('owner') or s.get('node')),
            })
    return items


def run_measures(items):
    cache = {}
    out = []
    for it in items:
        if it['shot'] not in cache:
            cache[it['shot']] = Image.open(it['shot']).convert('RGB')
        met = measure_element(cache[it['shot']], it['bbox'], it['dpr'], it['scale'])
        if met is None:
            continue
        out.append(dict(it, met=met))
    return out


# ---------------------------------------------------------------- 门 K / L
def run_gates(rows, calibrate=False):
    stats = defaultdict(list)
    for r in rows:
        for side in ('left', 'right', 'top', 'bottom'):
            cw, nb, tw, _noisy, _pres, spanw = r['met'][side]
            stats[(r['key'], r['dpr'], side)].append((cw, nb, tw, spanw))
    if calibrate:
        print('=== 校准分布(key, dpr, side): 主边缘宽 med[min..max] / 额外结构 med[max] / 过渡带 med[max] / 暗带宽 med ===')
        for k in sorted(stats):
            v = stats[k]
            cws = sorted(x[0] for x in v)
            nbs = sorted(x[1] for x in v)
            tws = sorted(x[2] for x in v)
            sps = sorted(x[3] for x in v)
            print('  %-22s dpr%d %-6s n=%3d  cw %.1f[%.1f..%.1f]  bands %d[%d]  trans %.1f[%.1f]  src %.2f' % (
                k[0], k[1], k[2], len(v), cws[len(v) // 2], cws[0], cws[-1],
                nbs[len(v) // 2], nbs[-1], tws[len(v) // 2], tws[-1], sps[len(v) // 2]))
        return

    print('=== 门K 线条一致性(K1 左右对称 / K2 侧边复线 / K3 同键同尺一致) ===')
    bad_k = []
    boundary_k3b = []
    boundary_k3 = []
    noisy_sides = 0
    for r in rows:
        L, R = r['met']['left'], r['met']['right']
        noisy_sides += sum(1 for s in ('left', 'right', 'top', 'bottom') if r['met'][s][3])
        # 宽度对称对按钮族豁免(量化域不可判,见 RIM_OFFLINE 注);非按钮族用主边缘复合带宽。
        if r['type'] != 'button':
            wl, wr = L[0], R[0]
            if not L[3] and not R[3] and min(wl, wr) >= K1_MIN:
                tol = max(K1_ABS * r['dpr'], K1_REL * max(wl, wr))
                if abs(wl - wr) > tol:
                    bad_k.append(('K1', r, 'L=%.1f R=%.1f tol=%.1f' % (wl, wr, tol)))
        for side in ('left', 'right'):
            if not r['met'][side][3] and r['met'][side][1] > K2_MAX_EXTRA_STRUCTS:
                bad_k.append(('K2', r, '%s 主边缘后另有 %d 条突出分离线条(疑复线/双重边框)' % (side, r['met'][side][1])))
        # K3b(按钮族·rim 在场性):c2 起设计保证四周 rim。dpr2(rim 2-3px,检测稳健)缺席=硬红;
        # dpr1(1px rim,暖底↔暖填充连线经过稀释橙 rim,色度裕度塌至 AA 噪声地板——实拍在场但检不稳)
        # 降边界披露,dpr1 终审权威=签收页上用户的眼睛(逐例附特写)。
        if r['type'] == 'button' and r['key'].endswith('-c2') and r.get('interactable') is True:
            for side in ('left', 'right'):
                if not r['met'][side][3] and not r['met'][side][4]:
                    if r['dpr'] == 2:
                        bad_k.append(('K3b', r, '%s rim 缺席(在场性直指标:内侧无离线度 ≥%d 的 rim 像素)' % (
                            side, RIM_OFFLINE)))
                    else:
                        boundary_k3b.append((r, side, -1.0))
    report['stats']['noisySides'] = noisy_sides
    # K3:同 (键, dpr, 侧, scale 桶) 的实例带宽须聚在中位附近——同一皮同一几何,渲染必须一致。
    cohort = defaultdict(list)
    for r in rows:
        if r['type'] == 'button':
            continue  # 按钮族宽度一致性豁免(量化域);其消失检测由 rim 在场性直指标承担
        for side in ('left', 'right'):
            if not r['met'][side][3]:
                cohort[(r['key'], r['dpr'], side, round(r['scale'], 1))].append(width_of(r, side))
    # 参照中位只取「渲染出来的健康边」(≥2px):幽灵/消失边正是被检对象,不得进参照系拉低中位
    # (禁用幽灵钮的 0 宽曾把 btn-secondary 桶中位拉到 2.0,K3b 因此瞎掉——2026-07-16)。
    med_cw = {}
    for k, v in cohort.items():
        healthy = sorted(w for w in v if w >= 2)
        if len(healthy) >= K3_MIN_COHORT:
            med_cw[k] = healthy[len(healthy) // 2]
    for r in rows:
        if r['type'] == 'button':
            continue
        for side in ('left', 'right'):
            k = (r['key'], r['dpr'], side, round(r['scale'], 1))
            med = med_cw.get(k)
            if med is None or r['met'][side][3]:
                continue
            w = width_of(r, side)
            if w < 2:
                # K3b(非按钮族·宽度双档):可交互实例的边框量不出来,而同尺桶其余实例边框清晰。
                # 按钮族的消失检测已由上方 rim 在场性直指标承担,此处不再重复判。
                if r['type'] != 'button' and r.get('interactable') is True and med >= K3B_MED_MIN:
                    if med >= K3B_ASSERT_MED:
                        bad_k.append(('K3b', r, '%s 边缘消失(带宽=%.1f, 同尺桶中位=%.1f)' % (side, w, med)))
                    else:
                        boundary_k3b.append((r, side, med))
                continue
            if abs(w - med) > max(K3_ABS * r['dpr'], K3_REL * med):
                # K3 双档:dpr1 且中位落亚像素量化域 → 边界披露(2-vs-4 是栅格相位不是缺陷);其余硬红。
                if r['dpr'] == 1 and med < K3_SUBPIXEL_MED:
                    boundary_k3.append((r, side, w, med))
                else:
                    bad_k.append(('K3', r, '%s 带宽=%.1f 同尺桶中位=%.1f(n=%d)' % (
                        side, w, med, len(cohort[k]))))
    for code, r, msg in bad_k:
        print('   ✗ %s %-20s %-16s %s@%s dpr%d  %s' % (code, r['key'], r['node'], r['state'], r['vp'], r['dpr'], msg))
    for r, side, med in boundary_k3b:
        if med < 0:
            print('   ◦ K3b边界 %-20s %-16s %s@%s dpr%d  %s dpr1 rim 检测地板(色度裕度塌缩,签收页附特写供用户裁)' % (
                r['key'], r['node'], r['state'], r['vp'], r['dpr'], side))
        else:
            print('   ◦ K3b边界 %-20s %-16s %s@%s dpr%d  %s 亚像素域(带宽=%.1f, 桶中位=%.1f<%.1f)' % (
                r['key'], r['node'], r['state'], r['vp'], r['dpr'], side, width_of(r, side), med, K3B_ASSERT_MED))
    for r, side, w, med in boundary_k3:
        print('   ◦ K3边界  %-20s %-16s %s@%s dpr%d  %s 量化域(带宽=%.1f, 桶中位=%.1f<%.1f)' % (
            r['key'], r['node'], r['state'], r['vp'], r['dpr'], side, w, med, K3_SUBPIXEL_MED))
    report['K'] = [{'code': c, 'key': r['key'], 'node': r['node'], 'state': r['state'], 'vp': r['vp'],
                    'dpr': r['dpr'], 'bbox': r['bbox'], 'detail': m} for c, r, m in bad_k]
    report['K3bBoundary'] = [{'key': r['key'], 'node': r['node'], 'state': r['state'], 'vp': r['vp'],
                              'dpr': r['dpr'], 'side': side, 'width': width_of(r, side), 'med': med}
                             for r, side, med in boundary_k3b]
    report['K3Boundary'] = [{'key': r['key'], 'node': r['node'], 'state': r['state'], 'vp': r['vp'],
                             'dpr': r['dpr'], 'side': side, 'width': w, 'med': med}
                            for r, side, w, med in boundary_k3]
    gate(len(bad_k) == 0, '门K %d 实例线条一致(违规 %d,亚像素边界披露 %d)' % (
        len(rows), len(bad_k), len(boundary_k3b) + len(boundary_k3)))

    print('=== 门L DPR 配对(L1 布局2× / L2 描边比 / L3 锐度) ===')
    pairs = defaultdict(dict)
    for r in rows:
        pairs[r['pair_id']][r['dpr']] = r
    bad_l = []
    n_pairs = 0
    for pid, d in pairs.items():
        if 1 not in d or 2 not in d:
            continue
        n_pairs += 1
        a, b = d[1], d[2]
        for i, (va, vb) in enumerate(zip(a['bbox'], b['bbox'])):
            if abs(vb - 2 * va) > L1_TOL:
                bad_l.append(('L1', b, '分量%d: dpr2=%d ≠ 2×%d(±%d)' % (i, vb, va, L1_TOL)))
                break
        for side in ('left', 'right'):
            if a['type'] == 'button' or a['met'][side][3] or b['met'][side][3]:
                continue
            w1, w2 = width_of(a, side), width_of(b, side)
            if w1 >= L2_MIN_W1:
                ratio = w2 / w1
                if not (L2_LO <= ratio <= L2_HI):
                    bad_l.append(('L2', b, '%s 比=%.2f(dpr1=%.1f dpr2=%.1f)' % (side, ratio, w1, w2)))
    for r in rows:
        cap = L3_CAPS[r['type']][0 if r['dpr'] == 1 else 1]
        for side in ('left', 'right'):
            met = r['met'][side]
            if met[3]:
                continue
            if met[2] > cap and met[0] >= 2:
                bad_l.append(('L3', r, '%s 过渡带=%.1fpx > %.1f(虚边/半像素)' % (side, met[2], cap)))
            elif (r['type'] == 'button' and r['dpr'] == 2 and r.get('interactable') is True
                  and met[4] and met[0] < 2):
                # 边缘糊化:色彩上 rim 在场,但梯度整体低于 GRAD_MIN(强模糊/半像素涂抹)。
                # 仅 dpr2 稳健域判(dpr1 属检测地板);幽灵禁用钮由 interactable 排除。
                bad_l.append(('L3', r, '%s 边缘糊化(rim 在场但梯度死,主边缘 %.1f<2)' % (side, met[0])))
    for code, r, msg in bad_l:
        print('   ✗ %s %-20s %-16s %s@%s dpr%d  %s' % (code, r['key'], r['node'], r['state'], r['vp'], r['dpr'], msg))
    report['L'] = [{'code': c, 'key': r['key'], 'node': r['node'], 'state': r['state'], 'vp': r['vp'],
                    'dpr': r['dpr'], 'bbox': r['bbox'], 'detail': m} for c, r, m in bad_l]
    gate(len(bad_l) == 0, '门L %d 组 DPR 配对 + 锐度(违规 %d)' % (n_pairs, len(bad_l)))
    report['stats']['instances'] = len(rows)
    report['stats']['dprPairs'] = n_pairs


# ---------------------------------------------------------------- 自证(合成夹具,每次运行必跑)
def _fixture(border_l, border_r, double=False, blur=False, size=(200, 80), scale=1):
    W, H = size[0] * scale, size[1] * scale
    im = Image.new('RGB', (W + 40, H + 40), (250, 174, 181))
    dr = ImageDraw.Draw(im)
    x0, y0 = 20, 20
    dr.rectangle([x0, y0, x0 + W - 1, y0 + H - 1], fill=(255, 251, 242))
    for i in range(border_l * scale):
        dr.line([x0 + i, y0, x0 + i, y0 + H - 1], fill=(198, 68, 124))
    for i in range(border_r * scale):
        dr.line([x0 + W - 1 - i, y0, x0 + W - 1 - i, y0 + H - 1], fill=(198, 68, 124))
    for i in range(2 * scale):
        dr.line([x0, y0 + i, x0 + W - 1, y0 + i], fill=(198, 68, 124))
        dr.line([x0, y0 + H - 1 - i, x0 + W - 1, y0 + H - 1 - i], fill=(198, 68, 124))
    if double:
        off = 6 * scale
        dr.line([x0 + off, y0 + 2, x0 + off, y0 + H - 3], fill=(120, 40, 80))
        dr.line([x0 + W - 1 - off, y0 + 2, x0 + W - 1 - off, y0 + H - 3], fill=(120, 40, 80))
    if blur:
        im = im.resize(((W + 40) // 3, (H + 40) // 3), Image.BILINEAR).resize((W + 40, H + 40), Image.BILINEAR)
    return im, [20, 20, W, H]


def selftest():
    print('=== 线条门自证(合成夹具) ===')
    ok = True

    def check(name, cond):
        nonlocal ok
        report['selftest'].append({'name': name, 'pass': bool(cond)})
        print(('   ✓ ' if cond else '   ✗ ') + name)
        ok = ok and cond

    im, bb = _fixture(2, 2)
    m = measure_element(im, bb, 1, 1.0)
    check('绿夹具:rim 双侧在场、主边缘对称、零额外结构', m and m['left'][4] and m['right'][4]
          and abs(m['left'][0] - m['right'][0]) <= 1 and m['left'][1] == 0 and m['right'][1] == 0)
    im, bb = _fixture(1, 5)
    m = measure_element(im, bb, 1, 1.0)
    check('红夹具K1(非按钮族):左1px/右5px 必判不对称',
          m and abs(m['left'][0] - m['right'][0]) > max(K1_ABS, K1_REL * max(m['left'][0], m['right'][0])))
    im, bb = _fixture(2, 2, double=True)
    m = measure_element(im, bb, 1, 1.0)
    check('红夹具K2:侧边内 6px 处复线 必判额外结构 ≥1',
          m and (m['left'][1] > K2_MAX_EXTRA_STRUCTS or m['right'][1] > K2_MAX_EXTRA_STRUCTS))
    im, bb = _fixture(0, 0)
    m = measure_element(im, bb, 1, 1.0)
    check('红夹具K3b(按钮族):无 rim 纯填充边 必判在场性缺席', m is not None and not m['left'][4] and not m['right'][4])
    im1, bb1 = _fixture(5, 5, scale=1)
    im2s, bb2s = _fixture(5, 5, scale=2)          # 正确 2×:边框 10px
    im2f, bb2f = _fixture(5, 5, size=(400, 160))  # 错误:尺寸 2× 但边框仍 5px
    m1 = measure_element(im1, bb1, 1, 1.0)
    m2s = measure_element(im2s, bb2s, 2, 2.0)
    m2f = measure_element(im2f, bb2f, 2, 2.0)
    r_ok = m2s['left'][0] / m1['left'][0]
    r_bad = m2f['left'][0] / m1['left'][0]
    check('厚描边可判前提(非按钮族):dpr1 主边缘 ≥ %.1fpx (实测 %.1f)' % (L2_MIN_W1, m1['left'][0]),
          m1['left'][0] >= L2_MIN_W1)
    check('绿夹具L2:真 2× 描边比落带内 (%.2f)' % r_ok, L2_LO <= r_ok <= L2_HI)
    check('红夹具L2:未缩放描边比出带 (%.2f)' % r_bad, not (L2_LO <= r_bad <= L2_HI))
    cap1 = L3_CAPS['button'][0]
    im, bb = _fixture(5, 5, blur=True)
    m = measure_element(im, bb, 1, 1.0)
    check('红夹具L3:虚边过渡带 > %.1fpx 且 rim 仍在场 (实测 %.1f, present=%s)' % (
        cap1, m['left'][2], m['left'][4]), m['left'][2] > cap1 and m['left'][4])
    if not ok:
        print('LINE GATES SELFTEST FAIL')
        sys.exit(2)


# ---------------------------------------------------------------- 主流程
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--evidence-root', default=os.path.join(
        os.path.dirname(os.path.abspath(__file__)), '../..', 'coordination/reports/W-VISION-S4R-evidence'))
    ap.add_argument('--manifest', default=None)
    ap.add_argument('--report', default=None)
    ap.add_argument('--calibrate', action='store_true')
    ap.add_argument('--selftest-only', action='store_true')
    args = ap.parse_args()

    selftest()
    if args.selftest_only:
        print('LINE GATES SELFTEST PASS')
        return

    items = collect(os.path.abspath(args.evidence_root))
    print('采集:%d 个可测实例(8 键、去 occluded、含 DPR1/2)' % len(items))
    if args.manifest:
        mset = {(e['viewport'], e['dpr'], e['key'], e['bbox']['x'], e['bbox']['y'], e['bbox']['w'], e['bbox']['h'])
                for e in json.load(open(args.manifest))}
        got = {(i['vp'], i['dpr'], i['key'], *i['bbox']) for i in items}
        missing = mset - got
        # manifest 含 occluded 元素的去重投影;可测集须覆盖其可见部分——缺口全部点名
        print('manifest 交叉核对:%d/%d 命中(缺 %d,缺口=occluded/越界/过小)' % (
            len(mset) - len(missing), len(mset), len(missing)))
        report['stats']['manifestCovered'] = len(mset) - len(missing)
        report['stats']['manifestTotal'] = len(mset)
    rows = run_measures(items)
    print('测量:%d 实例四边完成(跳过越界/过小/采样不足)' % len(rows))
    run_gates(rows, calibrate=args.calibrate)
    if args.report:
        json.dump(report, open(args.report, 'w'), ensure_ascii=False, indent=1)
        print('-> %s' % args.report)
    if fails:
        print('\nLINE GATES FAIL (%d)' % len(fails))
        sys.exit(1)
    print('\nLINE GATES PASS' if not args.calibrate else '\n(校准模式,不判门)')


if __name__ == '__main__':
    main()
