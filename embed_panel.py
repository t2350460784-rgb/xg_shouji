#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把面板页内嵌进面板壳 panel.ui.js。

本地版用 _src/panel.html，对外版用 _src/panel_public.html。
壳里发现 HTML_PATH 缺文件时，会把内嵌页写回去，装包的人不会看到白屏。
"""
import json

LOCAL_PATH = '/storage/emulated/0/Download/Operit/闲逛手记/_ui/panel.html'
PUBLIC_PATH = '/storage/emulated/0/Download/Operit/闲逛手记/_ui/panel_public.html'

READ_OLD = ('            var html = Store.readFile(HTML_PATH);\n'
            '            if (!html || html.length < 50) {\n')

READ_NEW = ('            var html = Store.readFile(HTML_PATH);\n'
            '            if (!html || html.length < 50) {\n'
            '                try { Store.writeFile(HTML_PATH, EMBED_HTML); html = EMBED_HTML; }\n'
            '                catch (e1) { logError("内嵌面板释放失败：" + e1); }\n'
            '            }\n'
            '            if (!html || html.length < 50) {\n')


def embed(js, html, target_path):
    """返回注入了内嵌面板页的 panel.ui.js 文本。"""
    lit = json.dumps(html, ensure_ascii=False)
    lit = lit.replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    if target_path and target_path != LOCAL_PATH:
        js = js.replace('var HTML_PATH = "%s";' % LOCAL_PATH,
                        'var HTML_PATH = "%s";' % target_path)
    marker = 'function logInfo(m)'
    if 'EMBED_HTML' not in js and marker in js:
        inject = ('// 面板页内嵌在本文件里，缺文件时自动释放\n'
                  'var EMBED_HTML = ' + lit + ';\n')
        js = js.replace(marker, inject + marker, 1)
    if READ_OLD in js:
        js = js.replace(READ_OLD, READ_NEW, 1)
    return js
