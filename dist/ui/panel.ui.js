"use strict";
/* ============================================
 * 闲逛手记 · 面板壳（WebView + 同步 JS 桥）
 *
 * 为什么换成 WebView：
 *   要画图（同心圆/条形/扇形/折线，SVG 随便画）、要搜索排序、
 *   链接要能点、样式要能改——Compose DSL 干这些太憋屈。
 *
 * 为什么桥是同步的：
 *   Android 的 addJavascriptInterface 返回不了 Promise（邻居插件实测过）。
 *   所以桥方法一律「同步执行 + 返回字符串」，前端自己 JSON.parse。
 *   写操作不需要回执，读操作同步拿，最稳。
 *
 * 页面在 /sdcard/Download/Operit/闲逛手记/_ui/panel.html，改它不用重打包。
 * ============================================ */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Screen;

var Store = require("../store.js");
var XgTools = require("../packages/tools.js");

var HTML_PATH = "/storage/emulated/0/Download/Operit/闲逛手记/_ui/panel.html";
var HOST = "XgHost";
var WF_ID = "e8797dfb-c527-42bb-8c0a-bc1298eb32ba";
var _wfPrompts = null;
var _wfName = "";
function refreshWf() {
    if (typeof Tools === "undefined" || !Tools.Workflow) return;
    try {
        Tools.Workflow.get(WF_ID).then(function (wf) {
            var d = wf && (wf.data || wf);
            var ns = (d && d.nodes) || [];
            var want = { exec_wake: "苏醒", exec_stroll: "去逛逛", exec_stroll_retry: "补喊一次", exec_stroll_retry2: "补喊二次" };
            var out = [];
            for (var i = 0; i < ns.length; i++) {
                var n = ns[i];
                if (!want[n.id]) continue;
                var msg = (n.actionConfig && n.actionConfig.message && n.actionConfig.message.value) || "";
                out.push({ id: n.id, name: want[n.id], message: msg });
            }
            _wfPrompts = out;
            _wfName = (d && d.name) || "";
        }).catch(function (e) { logInfo("读工作流失败：" + e); });
    } catch (e) { logInfo("读工作流异常：" + e); }
}
var _importState = { running: false, started: 0, result: null };
var VERSION = "0.4.57";

/* ============================================
 * 铁律一：桥方法最多只收一个参数。
 *
 * Operit 的 WebView 桥把 JS 调用转给 Java 侧时，第二个参数到不了。
 * 上一版 updateProfile(id, json) / backup(blocks, tag) / importBackup(path, blocks, mode)
 * 全栽在这上头：面板侧看着调用成功，实际只收到第一个参数，
 * 于是「改了名字存不上」「分块导出全失败」——根子是同一个。
 *
 * 铁律二（0.4.9 才查清）：桥会把参数整包成「数组」递进来。
 *   面板调 removeProfile('{"id":"p1","mode":"hard"}')，
 *   桥那头 a 拿到的是 ["{"id":"p1","mode":"hard"}"]，不是字符串。
 *   上一版的 oneArg 见 Array.isArray 就撒手，于是 id 变成了那个数组；
 *   而 String(["x"]) === "x" ——报错里看着跟没包一样，
 *   面板上就报「找不到这本手记：{"id":...}」，怎么查都查不出。
 *   这一版先摊平再取值，数组、JSON 串、裸串、对象，四种来法全认。
 * ============================================ */
function argList(a, b) {
    var out = [];
    function push(v) {
        if (v === undefined || v === null) return;
        if (Array.isArray(v)) { for (var i = 0; i < v.length; i++) push(v[i]); return; }
        out.push(v);
    }
    push(a);
    push(b);
    return out;
}

/* 双层编码也认：桥偶尔会把字符串再包一层引号 */
function unwrapStr(s) {
    s = String(s == null ? "" : s).trim();
    if (s.length > 1 && s.charAt(0) === '"' && s.charAt(s.length - 1) === '"') {
        try { var t = JSON.parse(s); if (typeof t === "string") return t.trim(); } catch (e) { }
    }
    return s;
}

/* 摊平后取第一个标量（字符串/数字），没有就回空串 */
function argStr(a, b) {
    var l = argList(a, b);
    for (var i = 0; i < l.length; i++) {
        var v = l[i];
        if (typeof v === "string") return unwrapStr(v);
        if (typeof v === "number") return String(v);
    }
    return "";
}

/* 摊平后找那个「对象」：JSON 串或真对象，谁先出现算谁 */
function argObj(a, b) {
    var l = argList(a, b);
    for (var i = 0; i < l.length; i++) {
        var v = l[i];
        if (typeof v === "string") {
            var s = unwrapStr(v);
            if (s.charAt(0) === "{") {
                try { var t = JSON.parse(s); if (t && typeof t === "object" && !Array.isArray(t)) return t; } catch (e) { }
            }
        } else if (v && typeof v === "object" && !Array.isArray(v)) {
            return v;
        }
    }
    return null;
}

/* 一次取齐：{ id, obj, list } —— 存档类方法都走这个 */
function argIdObj(a, b) {
    var l = argList(a, b);
    var o = null, id = "";
    for (var i = 0; i < l.length; i++) {
        var v = l[i];
        if (typeof v === "string") {
            var s = unwrapStr(v);
            if (s.charAt(0) === "{") {
                try {
                    var t = JSON.parse(s);
                    if (t && typeof t === "object" && !Array.isArray(t)) { o = t; continue; }
                } catch (e) { }
            }
            if (!id) id = s;
        } else if (v && typeof v === "object" && !Array.isArray(v)) {
            o = v;
        }
    }
    if (o) {
        if (o.id !== undefined) id = String(o.id);
        else if (o.pid !== undefined) id = String(o.pid);
    }
    return { id: id, obj: o, list: l };
}

/* 老写法留着——别的地方还在用 */
function oneArg(a) {
    var o = argObj(a);
    if (o) return o;
    if (typeof a === "string") {
        var s = a.trim();
        if (s.charAt(0) === "{") { try { return JSON.parse(s); } catch (e) { } }
    } else if (a && typeof a === "object" && !Array.isArray(a)) {
        return a;
    }
    return null;
}

/* 注册表（profiles.json）不是手记——不许被任何一本指成 data_file，
 * 否则工作流会往注册表里写手记，把档全弄丢。 */
function isRegistryRef(f) {
    if (f === undefined || f === null) return false;
    var s = String(f).trim();
    if (!s) return false;
    if (s === "profiles.json") return true;
    var full = s.charAt(0) === "/" ? s : Store.BASE_DIR + s;
    return full === Store.REGISTRY_FILE;
}

/* 找一本手记：id / 数据文件名（相对、绝对、光写文件名）/ 名字——四种都认。
 * 上一版只认 id，于是「切换已有文件」那行递过来的文件名扑了空，
 * 面板上就报「找不到这本手记」。这里一次堵死。 */
function findProfileLoose(reg, key) {
    if (!reg || !Array.isArray(reg.profiles)) return null;
    var k = String(key == null ? "" : key).trim();
    if (!k) return null;
    var i, p;
    for (i = 0; i < reg.profiles.length; i++) {
        p = reg.profiles[i];
        if (p && String(p.id) === k) return p;
    }
    var base = Store.BASE_DIR;
    var kFull = k.charAt(0) === "/" ? k : base + k;
    for (i = 0; i < reg.profiles.length; i++) {
        p = reg.profiles[i];
        if (!p) continue;
        var f = String(p.data_file || "");
        if (!f) continue;
        var fFull = f.charAt(0) === "/" ? f : base + f;
        if (fFull === kFull || f === k) return p;
        if (fFull.replace(/^.*\//, "") === k) return p;
    }
    for (i = 0; i < reg.profiles.length; i++) {
        p = reg.profiles[i];
        if (p && String(p.name || "").trim() === k) return p;
    }
    return null;
}

function logInfo(m) { try { NativeInterface.logInfo("[闲逛手记/面板] " + m); } catch (e) { } }
function logError(m) { try { NativeInterface.logError("[闲逛手记/面板] " + m); } catch (e) { } }

function ok(o) {
    o = o || {};
    if (o.success === undefined) o.success = true;
    return JSON.stringify(o);
}
function fail(e) { return JSON.stringify({ success: false, error: String((e && e.message) || e) }); }

/* 分块参数：兼容「数组 / JSON 字符串 / 逗号串」三种来源。
 * 数组里的每一项再拆一次逗号——桥摊平后可能把数组元素混进来。 */
function parseBlocks(v) {
    if (!v) return null;
    var raw = [];
    if (Array.isArray(v)) {
        for (var q = 0; q < v.length; q++) {
            var e = String(v[q] == null ? "" : v[q]).trim();
            if (e) raw.push(e);
        }
    } else {
        var s = String(v).trim();
        if (!s) return null;
        if (s.charAt(0) === "[") { try { var p = JSON.parse(s); if (Array.isArray(p)) raw = p; } catch (e) { } }
        if (!raw.length) raw = s.split(",");
    }
    var out = [];
    for (var i = 0; i < raw.length; i++) {
        var parts = String(raw[i]).split(",");
        for (var j = 0; j < parts.length; j++) {
            var k = parts[j].trim();
            if (k && out.indexOf(k) < 0) out.push(k);
        }
    }
    return out.length ? out : null;
}

function Screen(ctx) {
    var UI = ctx.UI;

    var stReady = ctx.useState("xg_panel_ready", false);
    var stHtml = ctx.useState("xg_panel_html", "");
    var booted = ctx.useRef("xg_panel_booted", false);
    var controller = ctx.createWebViewController("xg_shouji_panel");
    var cards = [];

    function snapshot() {
        var reg = Store.loadRegistry();
        var p = Store.getActiveProfile(reg);
        var path = Store.profileDataPath(p);
        var data = Store.loadData(path);
        return { registry: reg, profile: p, dataFile: path, data: data };
    }

    function registerBridge() {
        try { controller.removeJavascriptInterface(HOST); } catch (e) { }

        controller.addJavascriptInterface(HOST, {
            /* ---------- 读：一次给全 ---------- */
            load: function () {
                try {
                    var s = snapshot();
                    return ok({
                        registry: s.registry,
                        profile: s.profile,
                        dataFile: s.dataFile,
                        data: s.data,
                        backups: Store.listBackups(),
                        cards: cards,
                        baseDir: Store.BASE_DIR,
                        backupDir: Store.BACKUP_DIR
                    });
                } catch (e) { return fail(e); }
            },

            /* ---------- 写：账本 ---------- */
            save: function (a) {
                try {
                    var d = JSON.parse(argStr(a) || "{}");
                    var s = snapshot();
                    var wrote = Store.saveData(s.dataFile, d);
                    return ok({ wrote: !!wrote });
                } catch (e) { return fail(e); }
            },
            saveRegistry: function (a) {
                try { Store.saveRegistry(JSON.parse(argStr(a) || "{}")); return ok({}); }
                catch (e) { return fail(e); }
            },

            /* ---------- 多存档 ---------- */
            switchProfile: function (a, b) {
                try {
                    var id = argIdObj(a, b).id || argStr(a, b);
                    var reg = Store.loadRegistry();
                    var p = findProfileLoose(reg, id);
                    if (!p) return ok({ success: false, error: "找不到这本手记：" + String(id || "") });
                    reg.active = p.id;
                    Store.saveRegistry(reg);
                    return ok({ active: p.id });
                } catch (e) { return fail(e); }
            },
            addProfile: function (a) {
                try {
                    var t = argObj(a) || JSON.parse(argStr(a) || "{}");
                    if (isRegistryRef(t.data_file)) return ok({ success: false, error: "profiles.json 是注册表本身，不能当手记的账本" });
                    var reg = Store.loadRegistry();
                    /* id 不许重：同一毫秒里连建两本（手快双击、脚本连跑）会撞 id，
                     * 撞了之后「删这本」就可能删到另一本——这不是理论问题，测试里真撞过。
                     * 撞上就往后排号：p_<毫秒> / p_<毫秒>_2 / _3…… */
                    var base = "p_" + Date.now();
                    var id = base, seq = 1;
                    while (reg.profiles.some(function (x) { return x && String(x.id) === id; })) {
                        seq++;
                        id = base + "_" + seq;
                        if (seq > 999) { id = base + "_" + Math.floor(Math.random() * 100000); break; }
                    }
                    var pf = {
                        id: id,
                        name: t.name || "新存档",
                        card_id: t.card_id || "",
                        card_name: t.card_name || "",
                        persona: t.persona || "",
                        data_file: t.data_file || ("data_" + id + ".json"),
                        created_at: Date.now(),
                        note: t.note || ""
                    };
                    reg.profiles.push(pf);
                    Store.saveRegistry(reg);
                    // 只有「新起一本」才铺一份空账；接手已有文件时一个字都不许动
                    var dp = Store.profileDataPath(pf);
                    if (!Store.existsPath(dp)) Store.saveData(dp, Store.defaultData());
                    return ok({ id: id, data_file: dp });
                } catch (e) { return fail(e); }
            },
            updateProfile: function (a, b) {
                try {
                    var r0 = argIdObj(a, b);
                    var id = r0.id, t = r0.obj;
                    if (!t) { try { t = JSON.parse(argStr(a, b) || "{}"); } catch (e0) { t = {}; } }
                    if (!t || typeof t !== "object") t = {};
                    var reg = Store.loadRegistry();
                    var p = findProfileLoose(reg, id);
                    if (!p) return ok({ success: false, error: "找不到这本手记：" + id });
                    if (t.data_file !== undefined && isRegistryRef(t.data_file)) {
                        return ok({ success: false, error: "profiles.json 是注册表本身，不能当手记的账本" });
                    }
                    var keys = ["name", "card_id", "card_name", "persona", "note", "data_file"];
                    for (var i = 0; i < keys.length; i++) {
                        if (t[keys[i]] !== undefined) p[keys[i]] = String(t[keys[i]]);
                    }
                    Store.saveRegistry(reg);
                    return ok({ profile: p });
                } catch (e) { return fail(e); }
            },
            /* ---------- 删一本手记（两种删法：留痕 / 直接） ----------
             * 只收一个参数：JSON 串 {id, mode}，旧的裸 id 也认。
             *   mode="keep"（默认）留痕删除：先把这本的账本整份抄进 backup/ 留底。
             *   mode="hard"         直接删除：不留底，删了就真没了。
             * 两种都从注册表摘掉这本，并把它名下的数据文件清掉。
             * 数据文件若还有别的本指着，就不动它（免得把人家弄失联）。
             * 只剩一本时不许删。
             */
            removeProfile: function (a, b) {
                try {
                    var r0 = argIdObj(a, b);
                    var id = r0.id, o = r0.obj;
                    var mode = (o && o.mode !== undefined) ? o.mode : "";
                    if (!mode && r0.list.length > 1 && typeof r0.list[1] === "string") mode = r0.list[1];
                    if (!mode && typeof b === "string") mode = b;
                    mode = (String(mode || "") === "hard") ? "hard" : "keep";

                    var reg = Store.loadRegistry();
                    if (reg.profiles.length <= 1) return ok({ success: false, error: "只剩一本了，删不得" });
                    var p = findProfileLoose(reg, id);
                    if (!p) return ok({ success: false, error: "找不到这本手记：" + id });

                    var path = Store.profileDataPath(p);
                    var kept = "";
                    if (mode !== "hard") {
                        // 留痕删除：先整本抄进 backup/ 留底
                        var raw = Store.readFile(path);
                        if (raw) {
                            var name = "xg_removed_" + p.id + "_" + Date.now() + ".json";
                            kept = Store.BACKUP_DIR + name;
                            Store.writeFile(kept, JSON.stringify({
                                kind: "removed_profile", profile: p,
                                exported_at: Date.now(), data: JSON.parse(raw)
                            }, null, 2));
                        }
                    }

                    // 从注册表摘掉这本
                    var left = [];
                    for (var i = 0; i < reg.profiles.length; i++) {
                        if (reg.profiles[i].id !== p.id) left.push(reg.profiles[i]);
                    }
                    reg.profiles = left;
                    if (reg.active === p.id) reg.active = reg.profiles[0].id;
                    Store.saveRegistry(reg);

                    // 数据文件一并清掉——但若还有别的本指着同一份，就不能动
                    var shared = false;
                    var base = Store.BASE_DIR;
                    for (var j = 0; j < reg.profiles.length; j++) {
                        var fp = String(reg.profiles[j].data_file || "");
                        var full = fp.charAt(0) === "/" ? fp : base + fp;
                        if (full === path) { shared = true; break; }
                    }
                    var gone = false;
                    if (!shared && path && path !== Store.REGISTRY_FILE) {
                        try {
                            var f = new (Java.type("java.io.File"))(path);
                            if (f.exists()) gone = f.delete();
                        } catch (e3) { }
                    }
                    return ok({ kept_backup: kept, removed_file: gone, shared: shared, mode: mode });
                } catch (e) { return fail(e); }
            },

            /* ---------- 备份 / 导入 ---------- */
            backup: function (a, b) {
                try {
                    var r0 = argIdObj(a, b);
                    var o = r0.obj;
                    var blocksArg, tag;
                    if (o) {
                        blocksArg = o.blocks;
                        tag = o.tag || "manual";
                    } else if (r0.list.length > 1) {
                        blocksArg = r0.list.slice(0, r0.list.length - 1);
                        tag = String(r0.list[r0.list.length - 1] || "manual");
                    } else {
                        blocksArg = r0.list.length ? r0.list[0] : null;
                        tag = "manual";
                    }
                    var blocks = parseBlocks(blocksArg);
                    var s = snapshot();
                    if (!blocks || blocks.indexOf("wfprompts") >= 0) {
                        try { refreshWf(); } catch (e0) { }
                        try { s.data.wfprompts = (_wfPrompts || []).map(function (x) { return { id: x.id, name: x.name, message: x.message }; }); } catch (e1) { }
                    }
                    var path = Store.exportBundle(s.profile, s.data, blocks, tag);
                    if (!path) return ok({ success: false, error: "写不进 backup 目录" });
                    return ok({ success: true, path: path, blocks: blocks || "all" });
                } catch (e) { return fail(e); }
            },
            listBackups: function () {
                try { return ok({ backups: Store.listBackups() }); } catch (e) { return fail(e); }
            },
            listJson: function (dir) {
                try {
                    var d = argStr(dir) || Store.BASE_DIR;
                    var arr = Store.listDir(d);
                    var out = [];
                    for (var i = 0; i < arr.length; i++) {
                        if (arr[i].isDir) continue;
                        if (!/\.json$/i.test(arr[i].name)) continue;
                        out.push(arr[i]);
                    }
                    return ok({ files: out, dir: d });
                } catch (e) { return fail(e); }
            },
            /* 这份文件在不在——「用这本」复活已删档之前的一道闸 */
            fileExists: function (a) {
                try {
                    var p = argStr(a);
                    if (!p) return ok({ exists: false });
                    var f = new (Java.type("java.io.File"))(String(p));
                    return ok({ exists: f.exists(), path: String(p) });
                } catch (e) { return fail(e); }
            },
            readBackup: function (path) {
                try { return ok({ content: Store.readFile(argStr(path)) || "" }); } catch (e) { return fail(e); }
            },
            deleteBackup: function (path) {
                try {
                    var f = new (Java.type("java.io.File"))(argStr(path));
                    if (f.exists()) f.delete();
                    return ok({});
                } catch (e) { return fail(e); }
            },

            /* ---------- 文件改名 / 删除（「切换已有文件」列表用） ----------
             * 只收一个参数：JSON 串 {path, name} / {path}。
             * 改名：只动文件名，里面的手记一个字不碰；注册表里指着它的那本一起改过来。
             * 删除：绝不真删——先整份抄进 backup/ 留底，再移走。正在用的那本不许删。
             */
            renameFile: function (a, b) {
                try {
                    var r0 = argIdObj(a, b);
                    var o = r0.obj;
                    var path = (o && o.path) ? o.path : (r0.list.length ? r0.list[0] : "");
                    var name = (o && o.name !== undefined) ? o.name : (r0.list.length > 1 ? r0.list[1] : "");
                    if (!path) return ok({ success: false, error: "没给路径" });
                    path = String(path);
                    // 只取文件名，任何路径成分一律剥掉——不许靠改名往别处挪
                    name = String(name || "").replace(/[\\\/]/g, "").trim();
                    name = name.replace(/^\.+/, "");          // 开头的点也剥掉，免得改出隐藏文件
                    if (!name) return ok({ success: false, error: "名字不能空" });
                    if (!/\.json$/i.test(name)) name += ".json";
                    var dir = path.replace(/[^\/]+$/, "");
                    var target = dir + name;
                    var File = Java.type("java.io.File");
                    var from = new File(path);
                    if (!from.exists()) return ok({ success: false, error: "原文件不在了" });
                    if (target === path) return ok({ rel: name, path: path, profiles: 0 });
                    if (new File(target).exists()) return ok({ success: false, error: "已经有个叫这个名字的文件了" });
                    if (!from.renameTo(new File(target))) return ok({ success: false, error: "改名没成功" });

                    // 注册表里指到这个文件的，一起改过来，免得那本手记失联
                    var reg = Store.loadRegistry();
                    var base = Store.BASE_DIR;
                    var touched = 0;
                    for (var i = 0; i < reg.profiles.length; i++) {
                        var p = reg.profiles[i];
                        var fp = String(p.data_file || "");
                        var full = fp.charAt(0) === "/" ? fp : base + fp;
                        if (full === path) {
                            p.data_file = (target.indexOf(base) === 0) ? target.slice(base.length) : target;
                            touched++;
                        }
                    }
                    if (touched) Store.saveRegistry(reg);
                    return ok({ rel: name, path: target, profiles: touched });
                } catch (e) { return fail(e); }
            },
            /* ---------- 文件删除（两种删法：留痕 / 直接） ----------
             * 只收一个参数：JSON 串 {path, mode}。
             *   mode="keep"（默认）留痕删除：先整份抄进 backup/ 再移走。
             *   mode="hard"         直接删除：不留底，删了就真没了。
             * 正在用的那本、注册表本身，都不许删。
             * 指着这份文件的档（非当前）一并摘掉，免得它们失联。
             */
            deleteFile: function (a, b) {
                try {
                    var r0 = argIdObj(a, b);
                    var o = r0.obj;
                    var path = (o && o.path) ? o.path : (r0.list.length ? r0.list[0] : "");
                    var mode = (o && o.mode) ? String(o.mode) : (r0.list.length > 1 ? String(r0.list[1]) : "keep");
                    if (mode !== "hard") mode = "keep";
                    if (!path) return ok({ success: false, error: "没给路径" });
                    path = String(path);
                    if (path === Store.REGISTRY_FILE) {
                        return ok({ success: false, error: "这是注册表，动不得" });
                    }
                    var reg = Store.loadRegistry();
                    var active = Store.getActiveProfile(reg);
                    if (path === Store.profileDataPath(active)) {
                        return ok({ success: false, error: "这本正在用，删不得——先切到别的本再动它" });
                    }
                    var f = new (Java.type("java.io.File"))(path);
                    if (!f.exists()) return ok({ success: false, error: "文件不在了" });

                    var kept = "";
                    if (mode !== "hard") {
                        // 留痕删除：先抄一份进 backup/ 再移走
                        var raw = Store.readFile(path);
                        if (raw !== null) {
                            var nm = path.replace(/^.*\//, "");
                            kept = Store.BACKUP_DIR + "xg_deleted_" + nm.replace(/\.json$/i, "") + "_" + Date.now() + ".json";
                            Store.writeFile(kept, raw);
                        }
                    }
                    var gone = f.delete();

                    // 指着这份文件的档（非当前）一并摘掉，免得它们失联
                    var base = Store.BASE_DIR;
                    var left = [], detached = 0;
                    for (var i = 0; i < reg.profiles.length; i++) {
                        var p = reg.profiles[i];
                        var fp = String(p.data_file || "");
                        var full = fp.charAt(0) === "/" ? fp : base + fp;
                        if (full === path) { detached++; continue; }
                        left.push(p);
                    }
                    if (detached) {
                        if (!left.length) {
                            left.push({
                                id: "default", name: "默认", card_id: "", card_name: "",
                                persona: "", data_file: "data.json", created_at: Date.now(), note: ""
                            });
                        }
                        reg.profiles = left;
                        if (!Store.findProfile(reg, reg.active)) reg.active = reg.profiles[0].id;
                        Store.saveRegistry(reg);
                    }
                    return ok({ removed: !!gone, backup: kept, mode: mode, detached: detached });
                } catch (e) { return fail(e); }
            },

            importBackup: function (a, b, c) {
                try {
                    var r0 = argIdObj(a, b);
                    var o = r0.obj;
                    var path = (o && o.path) ? o.path : (r0.list.length ? r0.list[0] : "");
                    var rest = r0.list.slice(1);
                    var mode = (o && o.mode) ? String(o.mode) : "replace";
                    if (!o && rest.length && (rest[rest.length - 1] === "replace" || rest[rest.length - 1] === "merge")) {
                        mode = String(rest.pop());
                    }
                    var blocksArg = (o && o.blocks !== undefined) ? o.blocks : (rest.length ? rest : null);
                    var raw = Store.readFile(path);
                    if (!raw) {
                        var why = (typeof Store.lastReadError === "function" && Store.lastReadError()) ? ("（" + Store.lastReadError() + "）") : "";
                        return ok({ success: false, error: "读不到这个文件" + why + "：" + path });
                    }
                    var payload;
                    try { payload = JSON.parse(raw); } catch (e2) { return ok({ success: false, error: "不是合法的 JSON：" + e2.message }); }
                    if (!payload) return ok({ success: false, error: "文件是空的" });
                    // 兼容：备份包 {kind,data} / 裸 data.json / 只带 data 字段 / data 被存成字符串
                    var src = payload.data ? payload.data : payload;
                    if (typeof src === "string") {
                        try { src = JSON.parse(src); } catch (e4) { return ok({ success: false, error: "文件里的 data 是字符串，解析不了：" + e4.message }); }
                    }
                    if (!src || (!src.records && !src.platforms && !src.memory && !src.preferences && !src.schedule)) {
                        return ok({ success: false, error: "这份文件里没有手记认得的内容" });
                    }
                    var s = snapshot();
                    // 覆盖前先自动留一份底——这条不许省
                    var safe = Store.exportBundle(s.profile, s.data, null, "before_import");
                    var blocks = parseBlocks(blocksArg);
                    var d = s.data;
                    var keys = (blocks && blocks.length) ? blocks
                        : ["records", "preferences", "schedule", "platforms", "memory", "persons", "actions"];
                    var wfIn = null;
                    for (var i = 0; i < keys.length; i++) {
                        var k = keys[i];
                        if (k === "wfprompts") { wfIn = src.wfprompts || null; continue; }
                        if (src[k] === undefined) continue;
                        if (mode === "merge" && k === "records") {
                            if (!Array.isArray(src.records)) continue;
                            var have = {};
                            for (var r = 0; r < d.records.length; r++) have[d.records[r].id] = 1;
                            for (var q = 0; q < src.records.length; q++) {
                                if (!have[src.records[q].id]) d.records.push(src.records[q]);
                            }
                        } else if (mode === "merge" && k === "memory") {
                            if (!d.memory) d.memory = { memories: [] };
                            if (!Array.isArray(d.memory.memories)) d.memory.memories = [];
                            var haveM = {};
                            for (var mm = 0; mm < d.memory.memories.length; mm++) haveM[d.memory.memories[mm].id] = 1;
                            var inc = (src.memory && src.memory.memories) ? src.memory.memories : [];
                            for (var nn = 0; nn < inc.length; nn++) {
                                if (!haveM[inc[nn].id]) d.memory.memories.push(inc[nn]);
                            }
                        } else {
                            d[k] = src[k];
                        }
                    }
                    if (!blocks && src.wfprompts) wfIn = src.wfprompts;
                    if (wfIn && wfIn.length) {
                        for (var w2 = 0; w2 < wfIn.length; w2++) {
                            var it = wfIn[w2];
                            if (it && it.id && typeof it.message === "string") {
                                try { this.saveWfPrompt([JSON.stringify({ id: it.id, message: it.message })]); } catch (e3) { }
                            }
                        }
                    }
                    Store.saveData(s.dataFile, d);
                    /* 写完读回来验一遍：写没落盘、或落成半截，都得当场说，不能报「导好了」。 */
                    var chk = Store.readFile(s.dataFile);
                    if (!chk) return ok({ success: false, error: "写完读不回来，文件没落盘：" + s.dataFile });
                    var back = null;
                    try { back = JSON.parse(chk); } catch (e5) { return ok({ success: false, error: "写完的文件不是合法 JSON，已留底，请重开侧栏再导：" + e5.message }); }
                    var want = Array.isArray(d.records) ? d.records.length : 0;
                    var got = (back && Array.isArray(back.records)) ? back.records.length : 0;
                    if (want !== got) return ok({ success: false, error: "写进去 " + want + " 条，读回来 " + got + " 条，对不上" });
                    return ok({ safety_backup: safe || "", wf: wfIn ? wfIn.length : 0, records: got });
                } catch (e) { return fail(e); }
            },

            /* ---------- 记忆 ---------- */
            importMemory: function (a) {
                try {
                    if (_importState.running) return ok({ success: false, error: "正在导入中，稍等一下" });
                    var force = false;
                    try { var o = argObj(a); if (o && o.force === true) force = true; } catch (e) { }
                    _importState = { running: true, started: Date.now(), result: null };
                    try {
                        if (typeof XgTools.import_memories_to_host !== "function") throw new Error("工具没导出：import_memories_to_host（需要重启 Operit 让包生效）");
                        XgTools.import_memories_to_host({ force: force }).then(function (r) {
                            _importState = { running: false, started: 0, result: r };
                        }).catch(function (e) {
                            _importState = { running: false, started: 0, result: { success: false, error: String(e && e.message || e) } };
                        });
                    } catch (e) {
                        _importState = { running: false, started: 0, result: { success: false, error: String(e && e.message || e) } };
                    }
                    return ok({ success: true, started: true });
                } catch (e) { return fail(e); }
            },
            importMemoryStatus: function () {
                try {
                    var st = _importState || { running: false, result: null };
                    return ok({ running: !!st.running, result: st.result });
                } catch (e) { return fail(e); }
            },
            memoryTick: function () {
                try {
                    var s = snapshot();
                    var r = Store.decayMemories(s.data);
                    Store.saveData(s.dataFile, s.data);
                    return ok({
                        mode: r.mode,
                        total: s.data.memory.memories.length,
                        to_compress: r.toCompress.length,
                        to_forget: r.toForget.length
                    });
                } catch (e) { return fail(e); }
            },
            deleteMemory: function (a) {
                try {
                    var id = argStr(a);
                    var s = snapshot();
                    if (s.data.memory.mode === "keep") return ok({ success: false, error: "永不遗忘模式下删不了" });
                    var left = [];
                    for (var i = 0; i < s.data.memory.memories.length; i++) {
                        if (s.data.memory.memories[i].id !== id) left.push(s.data.memory.memories[i]);
                    }
                    s.data.memory.memories = left;
                    Store.saveData(s.dataFile, s.data);
                    return ok({});
                } catch (e) { return fail(e); }
            },

            /* ---------- 外跳 / 复制 ---------- */
            openUrl: function (a) {
                try {
                    var u = argStr(a).trim();
                    if (!u) return ok({ success: false, error: "空链接" });
                    var c = Java.getContext();
                    var Intent = Java.type("android.content.Intent");
                    var Uri = Java.type("android.net.Uri");
                    var it = Java.newInstance("android.content.Intent", Intent.ACTION_VIEW, Uri.parse(u));
                    it.addFlags(268435456);
                    c.startActivity(it);
                    return ok({});
                } catch (e) { return fail(e); }
            },
            copyText: function (a) {
                try {
                    var c = Java.getContext();
                    var cm = c.getSystemService("clipboard");
                    var ClipData = Java.type("android.content.ClipData");
                    cm.setPrimaryClip(ClipData.newPlainText("闲逛手记", argStr(a)));
                    return ok({});
                } catch (e) { return fail(e); }
            },

            /* ---------- 角色卡 ---------- */
            listCards: function () {
                try { return ok({ cards: cards }); } catch (e) { return fail(e); }
            },
            ping: function () {
                return ok({ version: VERSION, baseDir: Store.BASE_DIR, backupDir: Store.BACKUP_DIR });
            },
            /* 参数形态自检：桥到底把参数递成什么样，这一眼看得见。
             * 面板启动时会拿一个 JSON 串探一次，结果显示在页面上。 */
            shape: function (a, b) {
                try {
                    return ok({
                        aType: (a === null ? "null" : typeof a),
                        aIsArr: Array.isArray(a),
                        aLen: Array.isArray(a) ? a.length : -1,
                        bType: (b === undefined ? "undefined" : (b === null ? "null" : typeof b)),
                        list: argList(a, b).length,
                        text: argStr(a, b).slice(0, 80),
                        obj: !!argObj(a, b)
                    });
                } catch (e) { return fail(e); }
            },
            log: function (a) {
                logInfo(argStr(a));
                return ok({});
            },
            /* ---------- 工作流提示词：读 /改 /跑（同步返回 +异步落盘） ---------- */
            getWfPrompts: function () {
                try {
                    if (typeof Tools === "undefined" || !Tools.Workflow) return ok({ success: false, error: "环境里没有 Tools.Workflow" });
                    refreshWf();
                    if (!_wfPrompts) return ok({ success: false, pending: true, error: "还没读到，稍后再点一次" });
                    return ok({ success: true, wfName: _wfName, prompts: _wfPrompts });
                } catch (e) { return fail(e); }
            },
            saveWfPrompt: function (a) {
                try {
                    var t = argObj(a) || JSON.parse(argStr(a) || "{}");
                    var id = String(t.id || "").trim();
                    var text = String(t.message == null ? "" : t.message);
                    if (!id) return ok({ success: false, error: "缺 id" });
                    if (typeof Tools === "undefined" || !Tools.Workflow) return ok({ success: false, error: "环境里没有 Tools.Workflow" });
                    Tools.Workflow.disable(WF_ID)
                      .then(function () { return Tools.Workflow.get(WF_ID); })
                      .then(function (wf) {
                        var d = wf && (wf.data || wf);
                        var ns = (d && d.nodes) || [];
                        var hit = null;
                        for (var i = 0; i < ns.length; i++) { if (ns[i].id === id) { hit = ns[i]; break; } }
                        if (!hit) { logInfo("工作流里没有这个节点：" + id); return; }
                        var node = JSON.parse(JSON.stringify(hit));
                        node.actionConfig = node.actionConfig || {};
                        node.actionConfig.message = { __type: "com.ai.assistance.operit.data.model.ParameterValue.StaticValue", value: text };
                        return Tools.Workflow.patch(WF_ID, { node_patches: [{ op: "update", id: id, node: node }] });
                      })
                      .then(function () { return Tools.Workflow.enable(WF_ID); })
                      .then(function () { logInfo("提示词已存：" + id); refreshWf(); })
                      .catch(function (e) { logInfo("存提示词失败：" + e); try { Tools.Workflow.enable(WF_ID); } catch (e2) { } });
                    return ok({ success: true, queued: true, id: id });
                } catch (e) { return fail(e); }
            },
            triggerWf: function () {
                try {
                    if (typeof Tools === "undefined" || !Tools.Workflow) return ok({ success: false, error: "环境里没有 Tools.Workflow" });
                    Tools.Workflow.trigger(WF_ID).then(function () { logInfo("已触发闲逛工作流"); })
                      .catch(function (e) { logInfo("触发失败：" + e); });
                    return ok({ success: true, queued: true });
                } catch (e) { return fail(e); }
            },
            /* 把账本里的 schedule 同步进工作流：开关 / 间隔 / 时间窗。
               设计原则：侧边栏改完必须实时生效，否则面板就是摆设。
               先 disable 再 patch 再按需 enable —— 避免改配置时顺带触发一趟。 */
            syncSchedule: function (a) {
                try {
                    var t = argObj(a) || JSON.parse(argStr(a) || "{}");
                    if (typeof Tools === "undefined" || !Tools.Workflow) return ok({ success: false, error: "环境里没有 Tools.Workflow" });
                    var enabled = t.enabled !== false;
                    var hours = parseInt(t.hours, 10); if (isNaN(hours) || hours < 1) hours = 6; if (hours > 48) hours = 48;
                    var startH = parseInt(t.start, 10); if (isNaN(startH)) startH = 9;
                    var endH = parseInt(t.end, 10); if (isNaN(endH)) endH = 23;
                    var ms = hours * 3600000;
                    /* 2026-10-19 改：时间窗不再用 exit 1 表示「跳过」——引擎会把节点失败当成整条失败。
                       改成输出 RUN/SKIP + exit 0，由后面的「在窗口吗」条件节点分流。 */
                    var cmd = "H=$(date +%H); if [ $H -ge " + startH + " ] && [ $H -lt " + endH + " ]; then echo RUN; else echo SKIP; fi; exit 0";
                    var SV = "com.ai.assistance.operit.data.model.ParameterValue.StaticValue";

                    Tools.Workflow.disable(WF_ID)
                      .then(function () { return Tools.Workflow.get(WF_ID); })
                      .then(function (wf) {
                        var d = wf && (wf.data || wf);
                        var ns = (d && d.nodes) || [];
                        var patches = [];
                        for (var i = 0; i < ns.length; i++) {
                          var n = ns[i];
                          if (n.id === "trigger_sched") {
                            var nd = JSON.parse(JSON.stringify(n));
                            nd.name = "定时触发(" + hours + "小时)";
                            nd.triggerConfig = nd.triggerConfig || {};
                            nd.triggerConfig.interval_ms = String(ms);
                            nd.triggerConfig.enabled = "true";
                            patches.push({ op: "update", id: "trigger_sched", node: nd });
                          } else if (n.id === "exec_time_check") {
                            var nd2 = JSON.parse(JSON.stringify(n));
                            nd2.actionConfig = nd2.actionConfig || {};
                            nd2.actionConfig.command = { __type: SV, value: cmd };
                            patches.push({ op: "update", id: "exec_time_check", node: nd2 });
                          }
                        }
                        if (!patches.length) { logInfo("没找到要同步的节点"); return null; }
                        return Tools.Workflow.patch(WF_ID, { node_patches: patches });
                      })
                      .then(function () {
                        if (enabled) return Tools.Workflow.enable(WF_ID);
                        logInfo("定时已关，工作流保持禁用");
                        return null;
                      })
                      .then(function () { logInfo("定时已同步：" + hours + "h · " + startH + "-" + endH + " · " + (enabled ? "开" : "关")); })
                      .catch(function (e) { logInfo("定时同步失败：" + e); });
                    return ok({ success: true, queued: true, hours: hours, start: startH, end: endH, enabled: enabled });
                } catch (e) { return fail(e); }
            },
            /* 对账：工作流里的间隔/时间窗跟账本对不上才回填，一致就什么都不做。
               侧栏打开时调一次，外部改了 data.json 也不会跟工作流脱钩。2026-10-19 */
            reconcileSchedule: function () {
                try {
                    if (typeof Tools === "undefined" || !Tools.Workflow) return ok({ success: false, error: "环境里没有 Tools.Workflow" });
                    var sn = snapshot();
                    var s = (sn.data && sn.data.schedule) || {};
                    var hours = parseInt(s.interval_hours, 10); if (isNaN(hours) || hours < 1) hours = 6; if (hours > 48) hours = 48;
                    var startH = parseInt(s.active_start, 10); if (isNaN(startH)) startH = 9;
                    var endH = parseInt(s.active_end, 10); if (isNaN(endH)) endH = 23;
                    var wantMs = String(hours * 3600000);
                    var SV = "com.ai.assistance.operit.data.model.ParameterValue.StaticValue";
                    var wantCmd = "H=$(date +%H); if [ $H -ge " + startH + " ] && [ $H -lt " + endH + " ]; then echo RUN; else echo SKIP; fi; exit 0";
                    var wantOn = s.enabled !== false;
                    Tools.Workflow.get(WF_ID).then(function (wf) {
                        var d = wf && (wf.data || wf);
                        var ns = (d && d.nodes) || [];
                        var need = false;
                        for (var i = 0; i < ns.length; i++) {
                            var n = ns[i];
                            if (n.id === "trigger_sched" && String(((n.triggerConfig || {}).interval_ms) || "") !== wantMs) need = true;
                            if (n.id === "exec_time_check" && String((((n.actionConfig || {}).command) || {}).value || "") !== wantCmd) need = true;
                        }
                        if (!need) { logInfo("定时对账：一致，不动"); return null; }
                        logInfo("定时对账：对不上，回填一次");
                        return Tools.Workflow.disable(WF_ID)
                          .then(function () { return Tools.Workflow.get(WF_ID); })
                          .then(function (wf2) {
                            var d2 = wf2 && (wf2.data || wf2);
                            var ns2 = (d2 && d2.nodes) || [];
                            var patches = [];
                            for (var j = 0; j < ns2.length; j++) {
                                var m = ns2[j];
                                if (m.id === "trigger_sched") {
                                    var a = JSON.parse(JSON.stringify(m));
                                    a.name = "定时触发(" + hours + "小时)";
                                    a.triggerConfig = a.triggerConfig || {};
                                    a.triggerConfig.interval_ms = wantMs;
                                    a.triggerConfig.enabled = "true";
                                    patches.push({ op: "update", id: "trigger_sched", node: a });
                                } else if (m.id === "exec_time_check") {
                                    var b = JSON.parse(JSON.stringify(m));
                                    b.actionConfig = b.actionConfig || {};
                                    b.actionConfig.command = { __type: SV, value: wantCmd };
                                    patches.push({ op: "update", id: "exec_time_check", node: b });
                                }
                            }
                            if (!patches.length) return null;
                            return Tools.Workflow.patch(WF_ID, { node_patches: patches });
                          })
                          .then(function () {
                            if (wantOn) return Tools.Workflow.enable(WF_ID);
                            logInfo("定时是关的，回填后保持禁用");
                            return null;
                          });
                    }).catch(function (e) { logInfo("定时对账失败：" + e); });
                    return ok({ success: true, queued: true, hours: hours, start: startH, end: endH, enabled: wantOn });
                } catch (e) { return fail(e); }
            },

                        saveSpeechPrefs: function (a) {
                try {
                    var t = argObj(a) || JSON.parse(argStr(a) || "{}");
                    var cap = parseInt(t.cap, 10); if (isNaN(cap) || cap < 0) cap = 3; if (cap > 50) cap = 50;
                    var bias = parseInt(t.bias, 10); if (isNaN(bias) || bias < 0) bias = 50; if (bias > 100) bias = 100;
                    var sn = snapshot();
                    var d = sn.data;
                    d.preferences = d.preferences || {};
                    d.preferences.speech_cap = cap;
                    d.preferences.dive_bias = bias;
                    var wrote = Store.saveData(sn.dataFile, d);
                    var back = Store.loadData(sn.dataFile).preferences || {};
                    logInfo("SP " + cap + "/" + bias + " wrote=" + wrote + " read=" + back.speech_cap + "/" + back.dive_bias);
                    if (back.speech_cap !== cap || back.dive_bias !== bias) {
                        return ok({ success: false, error: "write-fail read=" + back.speech_cap + "/" + back.dive_bias });
                    }
                    return ok({ success: true, cap: back.speech_cap, bias: back.dive_bias });
                } catch (e) { return fail(e); }
            }
            });
    }

        async function boot() {
        if (booted.current) return;
        booted.current = true;
        try {
            try {
                if (typeof Tools !== "undefined" && Tools.Chat && Tools.Chat.listCharacterCards) {
                    var r = await Tools.Chat.listCharacterCards();
                    var arr = (r && Array.isArray(r.cards)) ? r.cards : [];
                    cards = arr.map(function (c) {
                        return { id: String((c && c.id) || ""), name: String((c && c.name) || "") };
                    });
                }
            } catch (e) { logInfo("角色卡列表取不到，面板里手填也行：" + e); }

            registerBridge();

            var html = Store.readFile(HTML_PATH);
            if (!html || html.length < 50) {
                html = "<!doctype html><html><body style='font-family:sans-serif;padding:24px'>"
                    + "<h3>面板页面没找到</h3><p>缺文件：" + HTML_PATH + "</p></body></html>";
            }
            stHtml[1](html);
            stReady[1](true);
            logInfo("面板已就绪");
        } catch (e) {
            logError("面板启动失败：" + e);
            booted.current = false;
        }
    }

    return UI.Box({
        fillMaxSize: true,
        containerColor: "#FBF7F9",
        onLoad: boot
    }, stReady[0] ? [
        UI.WebView({
            key: "xg_panel_webview",
            html: stHtml[0],
            baseUrl: "about:blank",
            javaScriptEnabled: true,
            domStorageEnabled: true,
            useWideViewPort: true,
            loadWithOverviewMode: true,
            builtInZoomControls: false,
            displayZoomControls: false,
            backgroundColor: "#FBF7F9",
            cacheMode: "noCache",
            controller: controller
        })
    ] : []);
}