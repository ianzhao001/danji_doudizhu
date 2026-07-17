#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
W-VISION S4R 几何三门(规划者预写 · 2026-07-15 · 门先自证再信门)。

  门G 元素重叠     —— 功能矩形集两两 rectGap ≥ 8(设计值;采证四舍五入容差 2 → 运行门槛 6)。
                     S4 事故(turnTimer 压 heroNameplate −44,六门全绿漏到实机)的运行时补门:
                     契约层管 zones 设计值,本门管**实机像素**。
  门H 九宫格完整性 —— 每个 SLICED 皮:meta 边距 L+R ≤ local 宽(box) 且 T+B ≤ local 高;
                     另断言 world/box 两轴缩放一致(≤2%)——压溃与非均匀拉歪都是「异形边框」,
                     门E 对 SLICED 豁免故此前无门可拦。压溃判据在 local 空间:scale-safe 皮
                     切片于源尺度、等比回缩不畸变(拿边距比屏上尺寸会假红)。
  门I 药丸内容居中 —— 同一皮实例上的 Label 并集盒中心 ≡ 皮盒中心
                     (|Δx| ≤ max(3, 3%皮宽), |Δy| ≤ max(2, 8%皮高))。
                     顶栏手写像素锚(70/178/width−265…)的「文字不居中」由此机检化。
  门J 角标不越牌缘   —— 手牌扇面里每张牌的角标**字形带**必须完整落在自己牌面内(容差 2)。
                     扇面左邻牌在下层,角标盒超出左缘就把字印到邻牌上(用户两轮点名的
                     「文字溢出」);门A 只查 SHRINK 属性、门B 豁免牌面字、门G 豁免 card 族,
                     三门都看不见这一类。字形带宽按字权估算(CJK/符号=1.0×字号,ASCII=0.6×)。

数据源: s4-evidence.mjs 导出的 labels/<scene>.json。
  新格式(S4R 采证器扩展): sprites 条目带 vpRect(视口矩形)/world(世界盒宽高)/occluded。
  旧格式兼容: sprite 缺 vpRect → 门G 退化为 label-only、门H 用 box(contentSize,scale=1 时等值);
  label 自带 rect/sprName/sprRect(皮实例视口矩形) → 门I 新旧格式通吃。

用法:
  python3 s4r-geometry-gates.py [labelsDir] [--meta-root DIR]
      默认 labelsDir = coordination/reports/W-VISION-S4R-evidence/labels
      默认 meta-root = assets/resources/art (门H 边距查找根)
  python3 s4r-geometry-gates.py --selftest
      门自证: fixtures/s4r-gates/*.json 按「期望红/绿」逐一验证,门本身失灵即退出非 0。
"""
import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))

MIN_GAP_DESIGN = 8
ROUND_TOL = 2                      # 采证 worldToScreen 两端各 ±1px 四舍五入
MIN_GAP_RUNTIME = MIN_GAP_DESIGN - ROUND_TOL
PILL_FAMILY = re.compile(r'^(info-pill|seat-nameplate|pattern-label|btn-)')
# 门G 豁免:牌面/立绘/特效/背景/满屏件——设计上允许层叠或非功能矩形。
G_EXEMPT = re.compile(r'(card-|suit-|joker|body|avatar|fx-|background|table-bg|scrim|dim-overlay)')  # card- 全族:扇面牌与牌上字互叠是设计
# 门G 额外收编的 SIMPLE 皮(非 SLICED 但属功能矩形)。
G_EXTRA_NODES = re.compile(r'^(bottom-cards-dock-skin)$')
# 容器皮:设计上允许内嵌子控件(面板/托盘/底牌坞)。原子皮(药丸/名牌/按钮)内只许有自己的字/图标,
# 皮吃皮=重叠违例——自证曾抓到「timer 药丸被名牌矩形整包」被包含豁免误放行的门缺陷。
G_CONTAINER = re.compile(r'(panel-popup|settlement-panel|play-tray|bottom-cards-dock)')

bad = 0
def gate(ok, msg):
    global bad
    print(('PASS  ' if ok else 'FAIL  ') + msg)
    if not ok:
        bad += 1

def rect_gap(a, b):
    return max(a[0] - (b[0] + b[2]), b[0] - (a[0] + a[2]), a[1] - (b[1] + b[3]), b[1] - (a[1] + a[3]))

def contains(outer, inner, tol=2):
    return (outer[0] - tol <= inner[0] and outer[1] - tol <= inner[1]
            and outer[0] + outer[2] + tol >= inner[0] + inner[2]
            and outer[1] + outer[3] + tol >= inner[1] + inner[3])

# ---------------------------------------------------------------- 门H 边距查找
def load_borders(meta_root):
    borders = {}
    for meta in glob.glob(os.path.join(meta_root, '**', '*.png.meta'), recursive=True):
        name = os.path.basename(meta)[:-len('.png.meta')]
        try:
            data = json.load(open(meta))
        except Exception:
            continue
        for sub in data.get('subMetas', {}).values():
            ud = sub.get('userData', {})
            if 'borderLeft' in ud:
                borders[name] = (ud.get('borderLeft', 0), ud.get('borderRight', 0),
                                 ud.get('borderTop', 0), ud.get('borderBottom', 0))
    return borders

# ---------------------------------------------------------------- 单场景三门
def run_scene(scene, data, borders, stats):
    labels = data.get('labels', [])
    sprites = data.get('sprites', [])

    # —— 门H:SLICED 皮逐实例(按 spr+屏上尺寸去重) ——
    seen_h = set()
    for s in sprites:
        if s.get('type') != 'SLICED':
            continue
        # 压溃是 local 空间现象:Cocos 切片用 contentSize(box)对 capInsets,均在源尺度;
        # scale-safe 的等比回缩只整体缩小切好的结果,不产生畸变——故主判基= box。
        # (S4R 实测:拿源尺度边距比屏上 world 会对全部 scale-safe 皮假红 201 例。)
        dims = s.get('box') or s.get('world')
        if not dims:
            continue
        key = (s.get('spr'), tuple(dims))
        if key in seen_h:
            continue
        seen_h.add(key)
        b = s.get('metaBorder') or borders.get(s.get('spr'))
        if b is None:
            gate(False, '门H %s: SLICED 皮 %s 找不到 meta 边距(检查 meta-root)' % (scene, s.get('spr')))
            continue
        l, r, t, bo = b
        okw = l + r <= dims[0]
        okh = t + bo <= dims[1]
        # 均匀缩放断言(S4R 复审修订):压溃判据在 local 空间(box),但 world/box 两轴比例
        # 必须一致——非均匀缩放的 SLICED 同样把圆角拉歪,且 box/world 单用都拦不住。
        world = s.get('world')
        box = s.get('box')
        uniform = True
        if world and box and box[0] and box[1]:
            rx, ry = world[0] / box[0], world[1] / box[1]
            uniform = abs(rx - ry) <= 0.02 * max(rx, ry)
        stats['h'] += 0 if (okw and okh and uniform) else 1
        gate(okw and okh and uniform, '门H %s: %s local %dx%d vs 边距 L+R=%d T+B=%d%s%s' % (
            scene, s.get('spr'), dims[0], dims[1], l + r, t + bo,
            '' if (okw and okh) else ' —— 九宫格压溃(异形边框)',
            '' if uniform else ' —— 非均匀缩放(圆角畸变)'))

    # —— 门G:功能矩形集两两间距 ——
    # 三路取数,包含关系自动去重:
    #   a) 新格式 sprites 的 vpRect(SLICED 皮 + 收编的 SIMPLE 功能皮);
    #   b) labels 的 sprRect(皮实例视口矩形,旧格式也有——每个载字皮按实例去重);
    #   c) 裸 label(无皮无 Graphics 底板的独立文字,如 status/bidding-prompt)。
    items = []
    for s in sprites:
        vp = s.get('vpRect')
        if not vp or s.get('occluded'):
            continue
        node = s.get('node') or ''
        spr = s.get('spr') or ''
        if G_EXEMPT.search(node) or G_EXEMPT.search(spr):
            continue
        if s.get('type') == 'SLICED' or G_EXTRA_NODES.match(node):
            items.append(('%s(%s)' % (node, spr), vp, 'skin', spr or node))
    skin_instances = {}
    for l in labels:
        spr = l.get('sprName')
        srect = l.get('sprRect')
        if not spr or not srect or l.get('occluded') or l.get('sprFullBleed'):
            continue
        if G_EXEMPT.search(spr):
            continue
        skin_instances[(spr, tuple(srect))] = ('skin:%s' % spr, list(srect), 'skin', spr)
    items.extend(skin_instances.values())
    for l in labels:
        if l.get('occluded'):
            continue
        if l.get('sprName') is None and not l.get('graphicsBackdrop'):
            node = l.get('node') or ''
            if G_EXEMPT.search(node):
                continue
            items.append(('%s"%s"' % (node, (l.get('text') or '')[:8]), l['rect'], 'bare', node))
    def same_rect(a, b):
        return all(abs(a[k] - b[k]) <= ROUND_TOL for k in range(4))
    def containment_ok(outer_kind, outer_name, inner_kind):
        if inner_kind == 'bare':
            return True                      # 字落在自己的皮/底上
        return bool(G_CONTAINER.search(outer_name))  # 只有容器皮许内嵌其他皮
    overlap = []
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            (na, ra, ka, fa), (nb, rb, kb, fb) = items[i], items[j]
            if same_rect(ra, rb):
                continue  # 双路取数的同一实例
            if contains(ra, rb) and containment_ok(ka, fa, kb):
                continue
            if contains(rb, ra) and containment_ok(kb, fb, ka):
                continue
            g = rect_gap(ra, rb)
            if g < MIN_GAP_RUNTIME:
                overlap.append('%s ↔ %s gap=%d' % (na, nb, g))
    stats['g'] += len(overlap)
    gate(len(overlap) == 0, '门G %s: 功能矩形集 %d 项两两间距 ≥%d(违例 %d%s)' % (
        scene, len(items), MIN_GAP_RUNTIME, len(overlap),
        '' if not overlap else ' —— ' + '; '.join(overlap[:6])))

    # —— 门I:药丸内容居中(label 自带 sprRect,新旧格式通吃) ——
    skins = {}
    for l in labels:
        spr = l.get('sprName')
        srect = l.get('sprRect')
        if not spr or not srect or l.get('occluded') or not PILL_FAMILY.match(spr):
            continue
        skins.setdefault((spr, tuple(srect)), []).append(l['rect'])
    for s in sprites:  # 新格式:皮内 SIMPLE 图标一并计入内容并集
        vp = s.get('vpRect')
        if not vp or s.get('type') != 'SIMPLE' or s.get('occluded'):
            continue
        for (spr, srect), content in skins.items():
            if contains(list(srect), vp):
                content.append(vp)
    for (spr, srect), content in sorted(skins.items()):
        x0 = min(c[0] for c in content); y0 = min(c[1] for c in content)
        x1 = max(c[0] + c[2] for c in content); y1 = max(c[1] + c[3] for c in content)
        dx = abs((x0 + x1) / 2 - (srect[0] + srect[2] / 2))
        dy = abs((y0 + y1) / 2 - (srect[1] + srect[3] / 2))
        tol_x = max(3, srect[2] * 0.03)
        tol_y = max(2, srect[3] * 0.08)
        ok = dx <= tol_x and dy <= tol_y
        stats['i'] += 0 if ok else 1
        gate(ok, '门I %s: %s@%s 内容中心偏 (%.1f, %.1f) tol=(%.1f, %.1f)%s' % (
            scene, spr, list(srect), dx, dy, tol_x, tol_y,
            '' if ok else ' —— 文字未居中'))

def _glyph_w(text, font):
    w = 0.0
    for ch in text:
        w += (0.6 if ord(ch) < 128 else 1.0) * font
    return w

def run_scene_gate_j(scene, data, stats):
    # 视口高从场景名尾解析(如 playing-844x390);解析不到则跳过(兼容旧命名)。
    # 取数走 sprites 数组的牌面 vpRect(新格式)——不能依赖 label.sprRect:
    # 角标一旦越缘,皮包含检测即失败(sprName=null),泄漏本身会破坏那条取数路径。
    m = re.search(r'(\d+)x(\d+)', scene)
    if not m:
        return
    H = int(m.group(2))
    faces = []
    for sp in data.get('sprites', []):
        vp = sp.get('vpRect')
        spr = sp.get('spr') or ''
        if not vp or not re.search(r'(card-template|joker)', spr):
            continue
        if vp[1] + vp[3] < H * 0.7:   # 只查手牌扇面(贴底);桌面墩牌不互叠不需查
            continue
        faces.append(vp)
    checked = 0
    bleed = []
    for l in data.get('labels', []):
        if l.get('node') != 'card-rank-label' or l.get('occluded'):
            continue
        rect = l['rect']
        ly = rect[1] + rect[3] / 2.0
        # 归属:纵向带命中且横向重叠最大的牌面
        best, best_ov = None, 0.0
        for vp in faces:
            if not (vp[1] <= ly <= vp[1] + vp[3]):
                continue
            ov = min(rect[0] + rect[2], vp[0] + vp[2]) - max(rect[0], vp[0])
            if ov > best_ov:
                best, best_ov = vp, ov
        if best is None:
            continue
        checked += 1
        font = l.get('fontSize') or 13
        gw = min(rect[2], _glyph_w(l.get('text') or '', font))
        cx = rect[0] + rect[2] / 2.0
        g0, g1 = cx - gw / 2.0, cx + gw / 2.0
        if g0 < best[0] - 2 or g1 > best[0] + best[2] + 2:
            bleed.append('%s glyph[%.0f..%.0f] vs card[%d..%d]' % (
                (l.get('text') or '')[:6], g0, g1, best[0], best[0] + best[2]))
    stats['j'] += len(bleed)
    gate(len(bleed) == 0, '门J %s: 手牌角标 %d 张全部落在自己牌面内(越缘 %d%s)' % (
        scene, checked, len(bleed),
        '' if not bleed else ' —— ' + '; '.join(bleed[:5])))

def run(labels_dir, meta_root):
    files = sorted(glob.glob(os.path.join(labels_dir, '*.json')))
    if not files:
        gate(False, '缺 labels 目录(%s),先跑 node s4-evidence.mjs' % labels_dir)
        return
    borders = load_borders(meta_root)
    stats = {'g': 0, 'h': 0, 'i': 0, 'j': 0}
    for f in files:
        scene = os.path.basename(f)[:-5]
        data = json.load(open(f))
        run_scene(scene, data, borders, stats)
        run_scene_gate_j(scene, data, stats)
    print('—— 汇总: 门G 违例 %(g)d · 门H 压溃 %(h)d · 门I 偏心 %(i)d · 门J 越缘 %(j)d' % stats)

# ---------------------------------------------------------------- 门自证
def selftest():
    fixtures = os.path.join(HERE, 'fixtures', 's4r-gates')
    cases = json.load(open(os.path.join(fixtures, 'expectations.json')))
    failures = []
    for case in cases:
        global bad
        bad = 0
        data = json.load(open(os.path.join(fixtures, case['file'])))
        stats = {'g': 0, 'h': 0, 'i': 0, 'j': 0}
        print('· 自证 %s (期望 %s)' % (case['file'], case['expect']))
        run_scene(case['file'][:-5], data, {}, stats)
        run_scene_gate_j(case['file'][:-5], data, stats)
        actual = {k: v for k, v in stats.items() if v > 0}
        expect = case['expect']
        ok = all(stats[k] >= v for k, v in expect.items() if v > 0) and \
             all(stats[k] == 0 for k in stats if k not in expect or expect.get(k, 0) == 0)
        if not ok:
            failures.append('%s: 期望 %s 实际 %s' % (case['file'], expect, actual))
    print()
    if failures:
        print('门自证失败(门本身失灵,不得用于验收):')
        for f in failures:
            print('  ✗ ' + f)
        sys.exit(1)
    print('门自证通过:红得准、绿得稳,可用于验收。')
    sys.exit(0)

if __name__ == '__main__':
    args = [a for a in sys.argv[1:]]
    if '--selftest' in args:
        selftest()
    meta_root = os.path.join(ROOT, 'assets', 'resources', 'art')
    if '--meta-root' in args:
        meta_root = args[args.index('--meta-root') + 1]
        args = [a for a in args if a != '--meta-root' and a != meta_root]
    labels_dir = args[0] if args else os.path.join(ROOT, 'coordination/reports/W-VISION-S4R-evidence/labels')
    run(labels_dir, meta_root)
    sys.exit(1 if bad else 0)
