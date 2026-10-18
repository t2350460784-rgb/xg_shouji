#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""打包 xg_shouji.toolpkg
用法：
  python3 build.py              本地版，源目录 dist/，面板页用 _src/panel.html
  python3 build.py --public     对外版，源目录 dist_public/，面板页用 _src/panel_public.html
默认读 manifest.json 的 version，输出 xg_shouji-<version>.toolpkg。
对外版在包内仍写作 dist/...，保证插件能正常加载。
面板页内嵌进 panel.ui.js，缺文件时自动释放，装包的人不会白屏。
"""
import json
import os
import sys
import zipfile

import embed_panel

ROOT = os.path.dirname(os.path.abspath(__file__))
# resources/ 随包走：manifest 里 resources + workflow_templates 指过去，
# 装完在「选择模板类型 → 插件模板」里就能直接建工作流
SKIP_DIRS = {'_src', '_test', '_bak', '__pycache__', '.git'}
SKIP_EXT = {'.toolpkg', '.bak', '.pyc'}
SKIP_FILES = {'build.py', 'export_public.py', 'embed_panel.py', 'wander-notes.workflow.public.json'}
SKIP_TOKENS = ('.bak', '.orig', '.tmp', '.log')
TMP_PANEL = os.path.join(ROOT, '.panel_embed.tmp.js')
TMP_WF = os.path.join(ROOT, '.workflow_embed.tmp.json')
WF_REL = 'resources/wander-notes.workflow.json'
WF_PUBLIC = os.path.join(ROOT, 'resources', 'wander-notes.workflow.public.json')


def _skip(name):
    if name in SKIP_FILES or os.path.splitext(name)[1] in SKIP_EXT:
        return True
    return any(t in name for t in SKIP_TOKENS)


def collect(src_name):
    entries = []
    skip_dirs = set(SKIP_DIRS)
    # 两条产物线互不污染：本地包不收 dist_public，对外包不收 dist
    skip_dirs.add('dist_public' if src_name == 'dist' else 'dist')
    for name in os.listdir(ROOT):
        if name in skip_dirs or _skip(name):
            continue
        full = os.path.join(ROOT, name)
        if os.path.isfile(full):
            entries.append((full, name))
        elif os.path.isdir(full):
            for dirpath, dirnames, filenames in os.walk(full):
                dirnames[:] = [d for d in dirnames if d not in skip_dirs]
                for fn in filenames:
                    if _skip(fn):
                        continue
                    p = os.path.join(dirpath, fn)
                    rel = os.path.relpath(p, ROOT)
                    parts = rel.split(os.sep)
                    # 源目录在包内统一还原成 dist/；实体路径仍指向真实文件
                    if parts[0] == src_name and src_name != 'dist':
                        rel = os.path.join('dist', *parts[1:])
                    entries.append((p, rel))
    return sorted(entries, key=lambda x: x[1])


def apply_panel(entries, src_name):
    """把面板页内嵌进 dist/ui/panel.ui.js（只在打包时生效，不动源文件）。"""
    public = (src_name == 'dist_public')
    html_src = os.path.join(ROOT, '_src', 'panel_public.html' if public else 'panel.html')
    if not os.path.isfile(html_src):
        print('panel skip: missing ' + html_src)
        return entries
    html = open(html_src, encoding='utf-8').read()
    target = embed_panel.PUBLIC_PATH if public else embed_panel.LOCAL_PATH
    out = []
    for real, rel in entries:
        if rel.replace(os.sep, '/').endswith('ui/panel.ui.js'):
            js = open(real, encoding='utf-8').read()
            open(TMP_PANEL, 'w', encoding='utf-8').write(embed_panel.embed(js, html, target))
            out.append((TMP_PANEL, rel))
        else:
            out.append((real, rel))
    print('panel embedded: %s (%d chars) -> %s' % (os.path.basename(html_src), len(html), target))
    return out


def apply_workflow(entries, src_name):
    """对外版把工作流换成中性措辞那份，包内路径不变。"""
    if src_name != 'dist_public':
        return entries
    if not os.path.isfile(WF_PUBLIC):
        print('workflow skip: missing ' + WF_PUBLIC)
        return entries
    data = open(WF_PUBLIC, encoding='utf-8').read()
    open(TMP_WF, 'w', encoding='utf-8').write(data)
    out = []
    hit = False
    for real, rel in entries:
        if rel.replace(os.sep, '/') == WF_REL:
            out.append((TMP_WF, rel))
            hit = True
        else:
            out.append((real, rel))
    if not hit:
        out.append((TMP_WF, WF_REL))
    print('workflow swapped: public (%d chars) -> %s' % (len(data), WF_REL))
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    public = '--public' in sys.argv
    src_name = 'dist_public' if public else 'dist'
    if not os.path.isdir(os.path.join(ROOT, src_name)):
        print('missing source dir: %s（对外版请先跑 python3 export_public.py）' % src_name)
        return 1
    manifest = json.load(open(os.path.join(ROOT, 'manifest.json'), encoding='utf-8'))
    version = manifest.get('version', '0.0.0')
    suffix = '-public' if public else ''
    out = args[0] if args else 'xg_shouji-%s%s.toolpkg' % (version, suffix)
    out_path = os.path.join(ROOT, out)
    if os.path.exists(out_path):
        os.remove(out_path)
    files = apply_workflow(apply_panel(collect(src_name), src_name), src_name)
    # 打包前硬校验：/* METADATA ... */ 必须能当 JSON 解析，
    # 否则 Operit 装包时报 Failed to parse toolpkg file（描述里裸双引号就会坏）
    import re as _re
    for _real, _rel in files:
        if not _rel.endswith('.js'):
            continue
        _txt = open(_real, encoding='utf-8').read()
        _m = _re.search(r'/\*\s*METADATA(.*?)\*/', _txt, _re.S)
        if not _m:
            continue
        try:
            json.loads(_m.group(1))
        except Exception as _e:
            print('METADATA JSON 不合法: %s -> %s' % (_rel, _e))
            return 1
    with zipfile.ZipFile(out_path, 'w', zipfile.ZIP_DEFLATED) as z:
        for real, rel in files:
            z.write(real, rel)
    for _t in (TMP_PANEL, TMP_WF):
        if os.path.exists(_t):
            os.remove(_t)
    print('built: %s (%d bytes, %d files)' % (out, os.path.getsize(out_path), len(files)))
    for _real, rel in files:
        print('  ', rel)
    return 0


if __name__ == '__main__':
    sys.exit(main())
