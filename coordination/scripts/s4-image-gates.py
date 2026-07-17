#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
W-VISION-S4R 图像机检门(v1.7 视觉门重建)。纯 PIL,读 s4-evidence.mjs 的产物 + assets 里的皮肤 PNG/meta。

用户两次驳回都指向同一类问题(文字压线/看不清、异形、icon 变形),口头判据不可复现,故全部固化成门:

  门C 文字可读(AA 4.5:1;真实禁用态 3.0) —— 每个 Label 的「声明字色」即字芯,其视口矩形在真实截图上的
       「底色众数」即底色。此门专为捕获「v15 深底皮 → v18 浅底皮换肤后,浅奶油字只剩 1.22:1」这一类回归而设。
       W-VISION-COLOR-R2 规划裁决(2026-07-16):采证器显式标注 interactable===false 的 Label(真实禁用控件)
       用 DISABLED_AA=3.0——WCAG 1.4.3 对 inactive 组件整体豁免,本门保留强于标准的 3.0 下限,与
       ui-text-colors 规划种子的 disabled 契约(≥3.0)同口径;色值已获用户签收锁定,提对比只剩改字色一途,
       禁用态按 4.5 判红会强迫破坏色锁。字段缺失/true/null 一律 4.5(fail-safe,不许按名称/颜色豁免);
       全部豁免逐条列印并落 report['contrastExempt']。
  门D 底图规则(无异形) —— 皮肤 PNG 的 alpha 掩膜在中段必须行行满宽、列列满高(花瓣/扇贝/缺口即挂)。
  门E icon 不变形     —— meta 的 trim 后 rect 长宽比必须≈原图长宽比(trimType=auto 削掉透明边会改比例,
       SIMPLE 渲染进方框就会拉伸——这正是用户②所指)。
  门F 盖字底图简洁    —— 用户设计原则:会盖字的底图,中央净区的「线条像素占比」必须低(单一填充+至多一条细描边)。

运行:cd coordination/scripts && python3 s4-image-gates.py
"""
import json
import os
import sys
from collections import Counter

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '../..'))
SHOTS = os.path.join(ROOT, 'coordination/reports/W-VISION-S4R-evidence/shots')
LABELS = os.path.join(ROOT, 'coordination/reports/W-VISION-S4R-evidence/labels')
ART = os.path.join(ROOT, 'assets/resources/art')
REPORT = os.path.join(ROOT, 'coordination/reports/W-VISION-S4R-evidence/image-gates.json')

AA = 4.5          # WCAG AA 正文对比度
DISABLED_AA = 3.0  # 真实禁用态(采证 interactable===false)下限;见文件头 R2 规划裁决
BOXY = 0.98       # 规则性:中段行/列必须达最大跨度的 98%
ASPECT_TOL = 0.05  # icon 比例偏差上限 5%
LINE_MAX = 0.030  # 盖字底图中央净区的线条像素占比上限 3%
EDGE = 24         # 线条判据:相邻像素通道最大差 > 24 即算「线」

fails = []
report = {}


def _lin(c):
    c /= 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def lum(rgb):
    r, g, b = (_lin(float(x)) for x in rgb[:3])
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def label_aa_threshold(interactable):
    """门C 阈值:仅显式 False(真实禁用控件)用 DISABLED_AA;缺失/True/None 一律 AA(fail-safe)。"""
    return DISABLED_AA if interactable is False else AA


# 门C 阈值自证(每次运行必跑,坏一条立即崩):enabled@3.2 必违规;disabled@3.2 必放行;disabled@2.9 必违规。
for _c, _i, _expect_bad in [(3.2, None, True), (4.6, None, False), (3.2, False, False),
                            (2.9, False, True), (3.2, True, True)]:
    assert (_c < label_aa_threshold(_i)) == _expect_bad, ('门C 阈值自证失败', _c, _i, _expect_bad)


def over(fg, bg):
    """fg 带 alpha 合成到 bg 上(字色带 alpha 时,真实字芯是合成后的颜色)。"""
    a = fg[3] / 255.0 if len(fg) > 3 else 1.0
    return tuple(round(fg[i] * a + bg[i] * (1 - a)) for i in range(3))


def backdrop_of(px, ink):
    """一个文字盒的底色。

    不能用「众数」:底图若是渐变/照片,每个背景像素 RGB 都略不同,唯一成片重复的反倒是纯色字本身,
    众数会取到字色(实测顶栏「叫地主」压粉色渐变时,众数=字色,算出荒谬的 1.00:1)。
    改取「离字色足够远的像素」的逐通道中位色——即这块底真正的典型颜色。
    """
    far = [p for p in px if max(abs(p[i] - ink[i]) for i in range(3)) > 60]
    if len(far) < max(8, len(px) // 20):
        far = px
    n = len(far)
    return tuple(sorted(p[i] for p in far)[n // 2] for i in range(3))


def gate(ok, msg):
    print(('PASS  ' if ok else 'FAIL  ') + msg)
    if not ok:
        fails.append(msg)


_skin_cache = {}


def skin_geometry(png_path):
    """一张皮的净区几何,全部在 **SpriteFrame 的 trim 后 rect 坐标系** 里量。

    坑(本仓栽过两次):Cocos 的 9-slice/拉伸一律以 trim 后 rect 为基准,不是原始 PNG 绝对坐标——
    被 trim 掉的透明安全边根本不参与显示。故先按 meta 的 trimX/trimY/width/height 裁出 rect 再量。

    返回 dict:
      rect:  (w, h)                 trim 后尺寸
      cap:   (l, r, t, b)           capInsets(9-slice 固定边带;SIMPLE 则全 0)
      margin:(l, r, t, b)           rect 四边到「净区」的距离(px)——从正中向外扩到撞上线条为止
    """
    if png_path in _skin_cache:
        return _skin_cache[png_path]
    meta = json.load(open(png_path + '.meta'))
    sf = next((v for v in (meta.get('subMetas') or {}).values()
               if v.get('importer') == 'sprite-frame'), None)
    ud = (sf or {}).get('userData') or {}
    im = Image.open(png_path).convert('RGBA')
    tx, ty = int(ud.get('trimX', 0)), int(ud.get('trimY', 0))
    tw, th = int(ud.get('width', im.width)), int(ud.get('height', im.height))
    im = im.crop((tx, ty, tx + tw, ty + th))
    w, h = im.size
    px = im.load()
    cx, cy = w // 2, h // 2

    def dirty(xx, yy):
        c0 = px[xx, yy]
        if c0[3] < 200:
            return True
        for dx, dy in ((1, 0), (0, 1)):
            nx, ny = xx + dx, yy + dy
            if nx >= w or ny >= h:
                continue
            c1 = px[nx, ny]
            if c1[3] < 200 or max(abs(c0[i] - c1[i]) for i in range(3)) > EDGE:
                return True
        return False

    band_y = range(max(0, cy - h // 10), max(1, min(h, cy + h // 10)))
    band_x = range(max(0, cx - w // 10), max(1, min(w, cx + w // 10)))
    left = cx
    while left > 0 and not any(dirty(left - 1, yy) for yy in band_y):
        left -= 1
    right = cx
    while right < w - 1 and not any(dirty(right + 1, yy) for yy in band_y):
        right += 1
    top = cy
    while top > 0 and not any(dirty(xx, top - 1) for xx in band_x):
        top -= 1
    bot = cy
    while bot < h - 1 and not any(dirty(xx, bot + 1) for xx in band_x):
        bot += 1
    g = {
        'rect': (w, h),
        'cap': (int(ud.get('borderLeft', 0)), int(ud.get('borderRight', 0)),
                int(ud.get('borderTop', 0)), int(ud.get('borderBottom', 0))),
        'margin': (left, w - 1 - right, top, h - 1 - bot),
    }
    _skin_cache[png_path] = g
    return g


def map_margin(raw_margin, cap, cap_other, raw_size, disp_size):
    """把 trim-rect 里的边距映射到显示空间(Cocos 9-slice 的真实映射)。

    - capInset 内的边带是**固定像素**、不随显示尺寸缩放;超出 capInset 的部分落在被拉伸的中段,按中段缩放比走。
      (「按百分比净区去卡九宫格皮」会误报——暂停面板标题就被误判压线,实机字形明明在奶油区正中。)
    - **短边情形**:当 cap + cap_other > 显示边长时,Cocos 把两条固定边带按 k=disp/(cap+cap_other) 等比压缩、
      中段压成 0。名牌 cap=120/120 却只显示 92 宽、按钮 cap=64/64 却只显示 30 高,全落这一支。
      (v17 按钮当年渲染成八边形,就是栽在没建模这一支。)
    - SIMPLE(cap=0)自然退化成等比缩放。
    """
    if cap + cap_other > disp_size and cap + cap_other > 0:
        k = disp_size / (cap + cap_other)
        return min(raw_margin, cap) * k        # 中段被压成 0:超出 cap 的部分不再产生额外位移
    if raw_margin <= cap:
        return float(raw_margin)
    sr, sd = raw_size - cap - cap_other, disp_size - cap - cap_other
    if sr <= 0 or sd <= 0:
        return float(raw_margin)
    return cap + (raw_margin - cap) * (sd / sr)


# art 下全部 PNG 的 basename → 路径(快照里的 spr 名 = 文件名)
ART_PNG = {}
for dp, _d, fs_ in os.walk(ART):
    for f in fs_:
        if f.endswith('.png'):
            ART_PNG.setdefault(f[:-4], os.path.join(dp, f))

# R2 起的硬约束:活跃四态按钮字色全部达到 AA；门 C 不保留禁用态豁免分支。
# 牌面文字不入门B:牌点/花色按扑克惯例贴角排,不是「居中盖在皮上」,中心十字探针不适用
# (且它们的底是卡牌本身、不是被误判到的底牌托盘)。可读性仍由门C 约束。
B_SKIP_PREFIX = ('card-rank-label', 'card-suit-label', 'mini-')

scenes = sorted(f[:-5] for f in os.listdir(LABELS)) if os.path.isdir(LABELS) else []
if not scenes:
    gate(False, '缺 labels 目录,先跑 node s4-evidence.mjs')

# ---------------------------------------------------------- 门B 文字压线 + 门C 文字可读
print('=== 门B 文字不压线(字形带 ⊂ 盖字皮净区) + 门C 文字可读(AA %.1f:1) ===' % AA)
worst = []
overrun = []
all_sprites = []
skins_seen = set()   # 运行时真正被文字盖住的皮 —— 门D/门F 的清单由此自动推导,不手维护
for scene in scenes:
    shot = os.path.join(SHOTS, scene + '.png')
    if not os.path.exists(shot):
        gate(False, '门B/C %s 缺同名截图' % scene)
        continue
    im = Image.open(shot).convert('RGB')
    W, H = im.size
    data = json.load(open(os.path.join(LABELS, scene + '.json')))
    all_sprites += [dict(s, scene=scene) for s in data['sprites']]
    for r in data['labels']:
        spr = r.get('sprName')
        # ---- 门C:字色=声明值(带 alpha 则合成到底上),底色=非字像素的中位色
        # 幕后(模态黑幕之下)的 Label 跳过:屏上字色已被黑幕压暗,声明字色不再代表实际字芯。
        x, y, w, h = r['rect']
        x0, y0 = max(0, x), max(0, y)
        x1, y1 = min(W, x + w), min(H, y + h)
        if not r.get('occluded') and x1 - x0 >= 4 and y1 - y0 >= 4:
            px = [im.getpixel((a, b)) for a in range(x0, x1) for b in range(y0, y1)]
            raw = tuple(r['ink'])
            bg = backdrop_of(px, raw[:3])
            ink = over(raw, bg)
            row = {
                'scene': scene, 'node': r['node'], 'text': r['text'],
                'ink': list(ink), 'bg': list(bg), 'contrast': round(contrast(ink, bg), 2), 'spr': spr,
                'interactable': r.get('interactable'),
            }
            worst.append(row)
        # ---- 门B:字形带必须落进盖字皮的净区(阈值从 PNG+meta 量,不拍脑袋)。
        # 位置包含判定,不只比尺寸:偏置的文字盒即便更小,也可能压到某一侧的描边。
        png = ART_PNG.get(spr) if spr else None
        if not png or r.get('sprFullBleed') or not r.get('sprRect') \
                or r['node'].startswith(B_SKIP_PREFIX) or r.get('graphicsBackdrop') \
                or not os.path.exists(png + '.meta'):
            continue
        skins_seen.add(os.path.relpath(png, ART)[:-4])
        g = skin_geometry(png)
        (rw, rh), (cl, cr, ct, cb), (ml, mr, mt, mb) = g['rect'], g['cap'], g['margin']
        sx, sy, sw, sh = r['sprRect']
        cx0 = sx + map_margin(ml, cl, cr, rw, sw)
        cx1 = sx + sw - map_margin(mr, cr, cl, rw, sw)
        cy0 = sy + map_margin(mt, ct, cb, rh, sh)
        cy1 = sy + sh - map_margin(mb, cb, ct, rh, sh)
        # 字形带:宽度上 SHRINK 会铺满盒宽(盒宽是硬约束);高度上垂直居中,只占 行高×行数。
        gh = min(h, (r.get('lineHeight') or r['fontSize']) * (r.get('lines') or 1))
        gy0 = y + (h - gh) / 2
        if not (x >= cx0 - 0.5 and gy0 >= cy0 - 0.5 and x + w <= cx1 + 0.5 and gy0 + gh <= cy1 + 0.5):
            overrun.append({
                'scene': scene, 'node': r['node'], 'spr': spr,
                'glyph': [x, round(gy0, 1), w, round(gh, 1)],
                'clean': [round(cx0, 1), round(cy0, 1), round(cx1 - cx0, 1), round(cy1 - cy0, 1)],
                'skin': [r['sprW'], r['sprH']], 'cap': [cl, cr, ct, cb], 'rawMargin': [ml, mr, mt, mb],
            })

report['skinGeometry'] = {
    k: {'rect': list(skin_geometry(os.path.join(ART, k + '.png'))['rect']),
        'cap': list(skin_geometry(os.path.join(ART, k + '.png'))['cap']),
        'margin': list(skin_geometry(os.path.join(ART, k + '.png'))['margin'])}
    for k in sorted(skins_seen)}
report['overrun'] = overrun
seen = set()
for d in overrun:
    k = (d['node'], d['spr'])
    if k in seen:
        continue
    seen.add(k)
    print('   ✗ %-22s 字形带 %s ⊄ 净区 %s (皮 %sx%s cap=%s) [%s@%s]' % (
        d['node'], d['glyph'], d['clean'], d['skin'][0], d['skin'][1], d['cap'], d['spr'], d['scene']))
gate(len(overrun) == 0, '门B 字形带全部落在盖字皮净区内(越界 %d 例)' % len(overrun))
print('   盖字皮几何(trim rect / capInsets / 到净区的边距 L,R,T,B):')
for k, v in report['skinGeometry'].items():
    print('      %-32s rect=%-9s cap=%-16s margin=%s' % (
        k, '%dx%d' % tuple(v['rect']), tuple(v['cap']), tuple(v['margin'])))

worst.sort(key=lambda d: d['contrast'])
report['contrast'] = worst
# R2 规划裁决:真实禁用态(interactable===false)按 DISABLED_AA 判;落带内(≥3.0 <4.5)的逐条豁免列印。
exempt = [d for d in worst if d.get('interactable') is False and DISABLED_AA <= d['contrast'] < AA]
report['contrastExempt'] = exempt
bad = [d for d in worst if d['contrast'] < label_aa_threshold(d.get('interactable'))]
seen = set()
for d in bad:
    k = (d['node'], d['spr'])
    if k in seen:
        continue
    seen.add(k)
    print('   ✗ %-22s %-14s 字%s 底%s = %.2f:1(阈 %.1f)  [%s@%s]' % (
        d['node'], '"%s"' % d['text'][:12], tuple(d['ink']), tuple(d['bg']),
        d['contrast'], label_aa_threshold(d.get('interactable')), d['spr'], d['scene']))
seen = set()
for d in exempt:
    k = (d['node'], d['spr'])
    if k in seen:
        continue
    seen.add(k)
    print('   ◦ 禁用豁免 %-18s %-12s %.2f:1 ∈ [%.1f, %.1f)  [%s@%s]' % (
        d['node'], '"%s"' % d['text'][:10], d['contrast'], DISABLED_AA, AA, d['spr'], d['scene']))
gate(len(bad) == 0, '门C 全场 %d 个 Label 达标(违规 %d 例,禁用豁免 %d 例,最低 %.2f:1)' % (
    len(worst), len(bad), len(exempt), worst[0]['contrast'] if worst else 0))
if worst:
    print('   最低 6 个(通过也列出,便于复审):')
    shown = set()
    for d in worst:
        if d['node'] in shown:
            continue
        shown.add(d['node'])
        print('      %-22s %-12s %.2f:1  [%s]' % (d['node'], '"%s"' % d['text'][:10], d['contrast'], d['spr']))
        if len(shown) >= 6:
            break
# ------------------------------------------------- 门D/门F 盖字底图:规则 + 简洁
# 清单不手维护:取「运行时真的被文字盖住的皮」(门B 同一集合)。退役的件自动出列,新接的件自动入列。
TEXT_BACKDROPS = sorted(skins_seen)

print('\n=== 门D 底图规则(无异形)——中段行行满宽 / 列列满高 ≥%.0f%% ===' % (BOXY * 100))
print('   受检清单 = 运行时实际盖字的皮 %d 件:%s' % (len(TEXT_BACKDROPS), ', '.join(os.path.basename(k) for k in TEXT_BACKDROPS)))
for key in TEXT_BACKDROPS:
    p = os.path.join(ART, key + '.png')
    if not os.path.exists(p):
        gate(False, '门D 缺件 %s' % key)
        continue
    a = Image.open(p).convert('RGBA').split()[3]
    w, h = a.size
    px = a.load()
    rows_span, cols_span = [], []
    for yy in range(int(h * 0.20), int(h * 0.80)):
        xs = [xx for xx in range(w) if px[xx, yy] > 128]
        rows_span.append((max(xs) - min(xs) + 1) if xs else 0)
    for xx in range(int(w * 0.20), int(w * 0.80)):
        ys = [yy for yy in range(h) if px[xx, yy] > 128]
        cols_span.append((max(ys) - min(ys) + 1) if ys else 0)
    rmax, cmax = max(rows_span), max(cols_span)
    rmin_ratio = min(rows_span) / rmax if rmax else 0
    cmin_ratio = min(cols_span) / cmax if cmax else 0
    ok = rmin_ratio >= BOXY and cmin_ratio >= BOXY
    report.setdefault('shape', {})[key] = {'rowMin': round(rmin_ratio, 4), 'colMin': round(cmin_ratio, 4)}
    gate(ok, '门D %-32s 中段行最窄 %.1f%% / 列最矮 %.1f%%' % (key, rmin_ratio * 100, cmin_ratio * 100))

print('\n=== 门F 盖字底图简洁——中央净区线条像素占比 ≤%.1f%% ===' % (LINE_MAX * 100))
for key in TEXT_BACKDROPS:
    p = os.path.join(ART, key + '.png')
    if not os.path.exists(p):
        continue
    im = Image.open(p).convert('RGBA')
    w, h = im.size
    px = im.load()
    # 中央净区:横 62%~ 纵 60%(文字实际落区)
    x0, x1 = int(w * 0.19), int(w * 0.81)
    y0, y1 = int(h * 0.20), int(h * 0.80)
    edges = total = 0
    for yy in range(y0, y1 - 1):
        for xx in range(x0, x1 - 1):
            c0, cx, cy = px[xx, yy], px[xx + 1, yy], px[xx, yy + 1]
            if c0[3] < 200:
                continue
            total += 1
            g = max(abs(c0[i] - cx[i]) for i in range(3)) + max(abs(c0[i] - cy[i]) for i in range(3))
            if g > 24:
                edges += 1
    ratio = edges / total if total else 1.0
    report.setdefault('lines', {})[key] = round(ratio, 5)
    gate(ratio <= LINE_MAX, '门F %-32s 净区线条像素 %.2f%%' % (key, ratio * 100))

# ---------------------------------------------------------------- 门E icon 不变形
# 正确判据是运行时的:SIMPLE 精灵的「SpriteFrame rect 长宽比」必须≈「真实显示框长宽比」,否则就被拉伸。
# 拿原图比例去卡所有 PNG 是错的——SLICED 九宫格按设计就是要拉伸的,立绘/卡牌也按等比框显示。
print('\n=== 门E icon 不变形——SIMPLE 精灵:rect 长宽比 ≈ 显示框长宽比(偏差 ≤%.0f%%) ===' % (ASPECT_TOL * 100))
skew = {}
checked = 0
for s in all_sprites:
    if s['type'] != 'SIMPLE':
        continue
    (bw, bh), (rw, rh) = s['box'], s['rect']
    if not (bw and bh and rw and rh):
        continue
    checked += 1
    dev = abs((rw / rh) / (bw / bh) - 1)
    if dev > ASPECT_TOL:
        k = (s['spr'], bw, bh)
        if k not in skew or dev > skew[k][0]:
            skew[k] = (dev, s['node'], rw, rh, s['scene'])
report['aspect_skew'] = [
    {'spr': k[0], 'box': [k[1], k[2]], 'rect': [v[2], v[3]], 'dev': round(v[0] * 100, 1), 'scene': v[4]}
    for k, v in sorted(skew.items(), key=lambda kv: -kv[1][0])
]
for d in report['aspect_skew']:
    print('   ✗ %-26s rect %-9s → 显示框 %-9s 比例偏 %.1f%%  (%s)' % (
        d['spr'], '%dx%d' % tuple(d['rect']), '%dx%d' % tuple(d['box']), d['dev'], d['scene']))
gate(len(skew) == 0, '门E %d 个 SIMPLE 精灵比例守恒(变形 %d 件)' % (checked, len(skew)))

# ---------------------------------------------------------------- 门M 禁用态可见性(R2-d)
# 用户整改(2026-07-16):禁用钮以 alpha=24(≈9.4%)压皮,皮/rim/底唇/投影近乎消失——不是「降权」是「视觉缺失」。
# 判据:禁用大按钮的皮必须「可见但降权」——运行时 Sprite color alpha ∈ [M_ALPHA_LO, M_ALPHA_HI];
#       可交互大按钮必须全强调(alpha == 255)。数据源 = 采证器 sprites[].interactable(运行时 Button 实况,
#       禁按名推断)+ sprites[].colorA(Sprite.color.a 实况)。字段缺失 = 采证器未升级,按门失败处理(fail-safe)。
print('\n=== 门M 禁用态可见性——禁用大按钮皮 alpha ∈ [%d, %d](可见但降权),可交互 == 255 ===' % (96, 160))
M_ALPHA_LO, M_ALPHA_HI = 96, 160
M_BIG_BUTTON_KEYS = {'btn-primary-c2', 'btn-secondary-c2', 'btn-neutral-c2'}


def m_verdict(interactable, color_a):
    """None=不适用;'' = 合格;非空字符串 = 违规原因。仅显式 True/False 参与判定。"""
    if interactable is None:
        return None
    if color_a is None:
        return 'colorA 字段缺失(采证器未升级)'
    if interactable is False:
        if color_a < M_ALPHA_LO:
            return '禁用皮近透明 alpha=%d < %d(视觉缺失)' % (color_a, M_ALPHA_LO)
        if color_a > M_ALPHA_HI:
            return '禁用皮 alpha=%d > %d(与可点态无降权差异)' % (color_a, M_ALPHA_HI)
        return ''
    return '' if color_a == 255 else '可交互皮 alpha=%d ≠ 255' % color_a


# 门M 自证(每次运行必跑):alpha=24 旧实现必红;120 带内必绿;200 越上限必红;可交互 255 绿/120 红;字段缺失必红。
for _i, _a, _expect in [(False, 24, True), (False, 120, False), (False, 200, True),
                        (True, 255, False), (True, 120, True), (False, None, True)]:
    _v = m_verdict(_i, _a)
    assert (bool(_v)) == _expect, ('门M 自证失败', _i, _a, _v)
assert m_verdict(None, 255) is None, '门M 自证失败:无 Button 祖先不适用'

m_bad = []
m_disabled_seen = 0
for s in all_sprites:
    base = (s.get('spr') or '').split('/')[-1]
    if base not in M_BIG_BUTTON_KEYS:
        continue
    verdict = m_verdict(s.get('interactable'), s.get('colorA'))
    if verdict is None:
        continue
    if s.get('interactable') is False:
        m_disabled_seen += 1
    if verdict:
        m_bad.append({'scene': s['scene'], 'node': s.get('owner') or s['node'], 'spr': base,
                      'interactable': s.get('interactable'), 'colorA': s.get('colorA'), 'why': verdict})
for d in m_bad:
    print('   ✗ %-22s %-18s interactable=%s colorA=%s  %s  [%s]' % (
        d['spr'], d['node'], d['interactable'], d['colorA'], d['why'], d['scene']))
report['disabledVisibility'] = {'violations': m_bad, 'disabledSeen': m_disabled_seen}
gate(len(m_bad) == 0, '门M 大按钮禁用态可见性(违规 %d,禁用实例覆盖 %d)' % (len(m_bad), m_disabled_seen))
gate(m_disabled_seen > 0, '门M 证据完备性:采证覆盖至少 1 个真实禁用大按钮(实测 %d)' % m_disabled_seen)

os.makedirs(os.path.dirname(REPORT), exist_ok=True)
json.dump(report, open(REPORT, 'w'), ensure_ascii=False, indent=1)
print('\n-> %s' % REPORT)
if fails:
    print('\nS4R IMAGE GATES FAIL (%d)' % len(fails))
    sys.exit(1)
print('\nS4R IMAGE GATES PASS')
