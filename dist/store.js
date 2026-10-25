"use strict";
/* ============================================
 * 闲逛手记 · 账本层 v0.4.2
 *
 * 三件事：
 *   1) 多存档：profiles.json 注册表 + 每档一份 data.json
 *      —— 任意角色卡都能有一本自己的手记，路径可切/可加/可删
 *   2) 记忆层：闲逛「印象」单独存，带遗忘曲线
 *      —— 手记是记录，记忆是感受，两码事
 *   3) 备份：全量 / 分块 导出导入
 *
 * 面板改的是它，工作流读的也是它。
 * ============================================ */
Object.defineProperty(exports, "__esModule", { value: true });

var BASE_DIR = "/storage/emulated/0/Download/Operit/闲逛手记/";
var REGISTRY_FILE = BASE_DIR + "profiles.json";
var BACKUP_DIR = BASE_DIR + "backup/";
var DATA_FILE = BASE_DIR + "data.json";

exports.BASE_DIR = BASE_DIR;
exports.REGISTRY_FILE = REGISTRY_FILE;
exports.BACKUP_DIR = BACKUP_DIR;
exports.DATA_FILE = DATA_FILE;

exports.loadData = loadData;
exports.saveData = saveData;
exports.defaultData = defaultData;
exports.defaultRegistry = defaultRegistry;
exports.loadRegistry = loadRegistry;
exports.saveRegistry = saveRegistry;
exports.getActiveProfile = getActiveProfile;
exports.findProfile = findProfile;
exports.profileDataPath = profileDataPath;
exports.readFile = readFile;
exports.readFileInfo = readFileInfo;
exports.lastReadError = lastReadError;
exports.writeFile = writeFile;
exports.listDir = listDir;
exports.existsPath = existsPath;
exports.listBackups = listBackups;
exports.exportBundle = exportBundle;
exports.ensureMemory = ensureMemory;
exports.decayMemories = decayMemories;
exports.touchMemory = touchMemory;

/* ---------- 小工具 ---------- */
function logInfo(m) { try { NativeInterface.logInfo("[闲逛手记] " + m); } catch (e) { } }
function logError(m) { try { NativeInterface.logError("[闲逛手记] " + m); } catch (e) { } }

function pad2(n) { n = Number(n) || 0; return (n < 10 ? "0" : "") + n; }
function pad3(n) { n = Number(n) || 0; return (n < 100 ? (n < 10 ? "00" : "0") : "") + n; }
/* 文件名精确到毫秒——同一秒里连导两回，也不会互相盖掉 */
function stamp(d) {
    d = d || new Date();
    return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + "_"
        + pad2(d.getHours()) + pad2(d.getMinutes()) + pad2(d.getSeconds())
        + "_" + pad3(d.getMilliseconds());
}

/* ---------- 三方合并（丢更新防线） ----------
 * 2026-10-19 夜加：两笔同时改同一本账，后一笔会把前一笔整个盖掉——锁只防撕文件，防不住这个。
 * base = 本进程上次读到的样子；ours = 我这次要写的；disk = 盘上此刻的。
 * 规则：谁动过听谁的；两边动了同一块，列表按 id 并集，对象按字段逐层分；都动了同一格，我这边优先。
 */
function _stableStr(v) {
    if (v === null || v === undefined) return String(v);
    var t = typeof v;
    if (t !== "object") return t + ":" + String(v);
    if (Array.isArray(v)) {
        var a = [];
        for (var i = 0; i < v.length; i++) a.push(_stableStr(v[i]));
        return "[" + a.join(",") + "]";
    }
    var ks = [];
    for (var k in v) if (Object.prototype.hasOwnProperty.call(v, k)) ks.push(k);
    ks.sort();
    var o = [];
    for (var j = 0; j < ks.length; j++) o.push(ks[j] + "=" + _stableStr(v[ks[j]]));
    return "{" + o.join(",") + "}";
}
function _eqv(a, b) { return _stableStr(a) === _stableStr(b); }
function _isObj(x) { return !!x && typeof x === "object" && !Array.isArray(x); }
function _has(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
function _idKey(o) {
    if (_isObj(o)) {
        if (o.id !== undefined && o.id !== null && o.id !== "") return "id:" + String(o.id);
        if (o.ts !== undefined) return "ts:" + String(o.ts) + "|" + String(o.kind || "") + "|" + String(o.name || "") + "|" + String(o.title || "");
    }
    return "raw:" + _stableStr(o);
}
function _indexBy(arr) {
    var m = {};
    if (!Array.isArray(arr)) return m;
    for (var i = 0; i < arr.length; i++) m[_idKey(arr[i])] = arr[i];
    return m;
}
function _mergeArrays(base, ours, disk) {
    var bI = _indexBy(base), dI = _indexBy(disk);
    var out = [], seen = {}, k;
    for (var i = 0; i < ours.length; i++) {
        k = _idKey(ours[i]);
        seen[k] = 1;
        if (_has(dI, k)) out.push(_merge3(bI[k], ours[i], dI[k], 1));
        else out.push(ours[i]);
    }
    for (var j = 0; j < disk.length; j++) {
        k = _idKey(disk[j]);
        if (!seen[k]) out.push(disk[j]);
    }
    return out;
}
function _merge3(base, ours, disk, depth) {
    if (_eqv(ours, base)) return disk;
    if (_eqv(disk, base)) return ours;
    if (Array.isArray(ours) && Array.isArray(disk)) return _mergeArrays(base, ours, disk);
    if (_isObj(ours) && _isObj(disk)) {
        if ((depth || 0) >= 4) return ours;
        var b = _isObj(base) ? base : {};
        var out = {}, k;
        for (k in b) if (_has(b, k) && !_has(ours, k) && !_has(disk, k)) out[k] = b[k];
        for (k in disk) {
            if (!_has(disk, k)) continue;
            if (!_has(ours, k)) { out[k] = disk[k]; continue; }
            out[k] = _merge3(b[k], ours[k], disk[k], (depth || 0) + 1);
        }
        for (k in ours) {
            if (!_has(ours, k)) continue;
            if (!_has(disk, k)) out[k] = ours[k];
        }
        return out;
    }
    return ours;
}
function mergeLedger(base, ours, disk) {
    try {
        if (!_isObj(ours) || !_isObj(disk)) return ours;
        return _merge3(base || {}, ours, disk, 0);
    } catch (e) { return ours; }
}

var _BASE = {};
function _baseSet(path, d) { try { _BASE[path] = _stableStr(d); } catch (e) { } }
function _baseGet(path) {
    try { return _BASE[path] ? JSON.parse(_BASE[path]) : null; } catch (e) { return null; }
}

/* ---------- 文件 ---------- */
/* 最近一次读取失败的原因。空串=没出错。
 * 这是给上层用的：读不出来时绝不能当成「没有」，更不能顺手写个空账本盖回去。 */
var LAST_READ_ERROR = "";
function lastReadError() { return LAST_READ_ERROR; }

/** 带诊断的读：exists / ok / text / error 四个字段分开给。
 *  文件不在、读不动、读出来是空的——三种情况以前全糊成 null，现在分得开。 */
function readFileInfo(path) {
    var out = { exists: false, ok: false, text: null, error: "", size: 0 };
    try {
        var File = Java.type("java.io.File");
        var FileReader = Java.type("java.io.FileReader");
        var BufferedReader = Java.type("java.io.BufferedReader");
        var f = new File(path);
        if (!f.exists()) return out;
        out.exists = true;
        out.size = f.length();
        if (!f.canRead()) { out.error = "没有读权限"; return out; }
        if (f.length() === 0) { out.error = "文件是空的（0 字节）"; return out; }
        var r = new BufferedReader(new FileReader(f));
        var s = "";
        var line;
        while ((line = r.readLine()) !== null) s += line + "\n";
        r.close();
        if (!s.replace(/\s/g, "")) { out.error = "文件里只有空白"; return out; }
        out.ok = true;
        out.text = s;
        return out;
    } catch (e) {
        out.error = String((e && e.message) || e);
        logError("读取失败 " + path + ": " + out.error);
        return out;
    }
}

function readFile(path) {
    var info = readFileInfo(path);
    return info.ok ? info.text : null;
}

/** 跨进程锁：写盘前先建一个同名目录，mkdir 是原子的——建出来的那一笔才有资格写。
 *  抢不到就等；等太久就认输，这一笔照写，但不跟人抢着往同一个文件里灌。 */
var LOCK_WAIT_MS = 1500;
var LOCK_STALE_MS = 8000;
function lockSleep(ms) { try { Java.type("java.lang.Thread").sleep(ms); } catch (e) { } }
function lockTake(path) {
    try {
        var File = Java.type("java.io.File");
        var lk = new File(path + ".lock");
        var t0 = Date.now();
        while (Date.now() - t0 < LOCK_WAIT_MS) {
            if (lk.mkdir()) return lk;
            if (Date.now() - lk.lastModified() > LOCK_STALE_MS) { try { lk["delete"](); } catch (e1) { } continue; }
            lockSleep(40);
        }
        return null;
    } catch (e) { return null; }
}
function lockDrop(lk) { try { if (lk && lk.exists()) lk["delete"](); } catch (e) { } }

/** 原子写：先写 .tmp，验过再整体换名。换名是一次 rename——盘上要么是旧文件，要么是新文件，没有半截。
 *  以前是 FileWriter(f,false) 直接截断原文件，两笔一撞就从中间撕开。 */
function writeFile(path, content) {
    var lk = lockTake(path);
    try { return writeFileUnlocked(path, content); }
    finally { lockDrop(lk); }
}

function writeFileUnlocked(path, content) {
    try {
        var File = Java.type("java.io.File");
        var FileWriter = Java.type("java.io.FileWriter");
        var f = new File(path);
        var p = f.getParentFile();
        if (p && !p.exists()) p.mkdirs();
        var tmp = new File(path + ".tmp");
        var w = new FileWriter(tmp, false);
        w.write(content);
        w.flush();
        w.close();
        if (!tmp.exists() || tmp.length() === 0) throw new Error("临时文件没写出来");
        var ok = tmp.renameTo(f);
        if (!ok && f.exists()) {
            /* 有的文件系统不让直接盖名：先把旧文件挪成 .prev，再换名 */
            var prev = new File(path + ".prev");
            try { if (prev.exists()) prev["delete"](); } catch (e0) { }
            try { f.renameTo(prev); } catch (e1) { }
            ok = tmp.renameTo(f);
        }
        if (!ok) {
            var w2 = new FileWriter(f, false);
            w2.write(content);
            w2.flush();
            w2.close();
            try { if (tmp.exists()) tmp["delete"](); } catch (e2) { }
        }
        try {
            var pv = new File(path + ".prev");
            if (pv.exists()) pv["delete"]();
        } catch (e3) { }
        return true;
    } catch (e) { logError("写入失败 " + path + ": " + e.message); return false; }
}
function existsPath(path) {
    try { return new (Java.type("java.io.File"))(path).exists(); } catch (e) { return false; }
}

function listDir(path) {
    try {
        var File = Java.type("java.io.File");
        var d = new File(path);
        if (!d.exists() || !d.isDirectory()) return [];
        var arr = d.listFiles();
        var out = [];
        if (arr) {
            for (var i = 0; i < arr.length; i++) {
                out.push({
                    name: String(arr[i].getName()),
                    path: String(arr[i].getAbsolutePath()),
                    isDir: arr[i].isDirectory(),
                    size: Number(arr[i].length()),
                    mtime: Number(arr[i].lastModified())
                });
            }
        }
        out.sort(function (a, b) { return b.mtime - a.mtime; });
        return out;
    } catch (e) { logError("列目录失败 " + path + ": " + e.message); return []; }
}

/* ---------- 注册表：一本手记 = 一条 profile ---------- */
function defaultRegistry() {
    return {
        version: 2,
        active: "default",
        profiles: [{
            id: "default",
            name: "默认",
            card_id: "",
            card_name: "",
            persona: "",
            data_file: "data.json",
            created_at: Date.now(),
            note: ""
        }]
    };
}

function loadRegistry() {
    var raw = readFile(REGISTRY_FILE);
    if (!raw) {
        var r0 = defaultRegistry();
        saveRegistry(r0);
        return r0;
    }
    try {
        var o = JSON.parse(raw);
        if (!o || !Array.isArray(o.profiles) || !o.profiles.length) throw new Error("no profiles");
        for (var i = 0; i < o.profiles.length; i++) {
            var p = o.profiles[i] || {};
            if (!p.id) p.id = "p_" + Date.now() + "_" + i;
            if (!p.name) p.name = "未命名";
            if (!p.data_file) p.data_file = "data_" + p.id + ".json";
            if (p.card_id === undefined) p.card_id = "";
            if (p.card_name === undefined) p.card_name = "";
            if (p.persona === undefined) p.persona = "";
            if (p.note === undefined) p.note = "";
            if (p.created_at === undefined) p.created_at = Date.now();
            o.profiles[i] = p;
        }
        if (!o.active || !findProfile(o, o.active)) o.active = o.profiles[0].id;
        o.version = 2;
        /* 注册表自己不是手记。谁指着它，就在这一层拔掉——
         * 面板上会冒充「绑了角色卡」的本子，更糟的是工作流会拿它当账本写，把档写坏。
         * 放在这里，是因为读注册表是所有入口的必经之路，谁都绕不过。 */
        if (sanitizeRegistry(o)) saveRegistry(o);
        return o;
    } catch (e) {
        logError("profiles.json 损坏，已重置: " + e.message);
        var r1 = defaultRegistry();
        saveRegistry(r1);
        return r1;
    }
}

/* ---------- 注册表自净：注册表不是手记 ---------- */
/** 这个路径指的是不是注册表本身？相对、绝对、光写文件名，都算。 */
function isRegistryRef(f) {
    if (f === undefined || f === null) return false;
    var s = String(f).trim();
    if (!s) return false;
    if (s === "profiles.json") return true;
    var full = s.charAt(0) === "/" ? s : BASE_DIR + s;
    return full === REGISTRY_FILE;
}

/** 把指着注册表的本子从列表里拔掉。拔过就返回 true，调用方负责落盘。 */
function sanitizeRegistry(o) {
    if (!o || !Array.isArray(o.profiles) || !o.profiles.length) return false;
    var keep = [], drop = 0;
    for (var i = 0; i < o.profiles.length; i++) {
        var p = o.profiles[i];
        if (!p) { drop++; continue; }
        /* 手滑写错键名的，先归位：datafile / dataFile 都认 */
        if (!p.data_file) {
            if (p.datafile) p.data_file = p.datafile;
            else if (p.dataFile) p.data_file = p.dataFile;
        }
        delete p.datafile;
        delete p.dataFile;
        if (isRegistryRef(p.data_file)) { drop++; continue; }
        var nm = String(p.name || "").trim().toLowerCase();
        if (nm === "profiles" || nm === "profiles.json") { drop++; continue; }
        keep.push(p);
    }
    if (!drop) return false;
    if (!keep.length) {
        keep = [{
            id: "default", name: "默认", card_id: "", card_name: "", persona: "",
            data_file: "data.json", created_at: Date.now(), note: ""
        }];
    }
    o.profiles = keep;
    var okAct = false;
    for (var j = 0; j < keep.length; j++) { if (keep[j].id === o.active) { okAct = true; break; } }
    if (!okAct) o.active = keep[0].id;
    logInfo("注册表自净：拔掉 " + drop + " 条指着 profiles.json 的坏账");
    return true;
}

function saveRegistry(reg) {
    try {
        reg.updatedAt = Date.now();
        return writeFile(REGISTRY_FILE, JSON.stringify(reg, null, 2));
    } catch (e) { logError("注册表保存失败: " + e.message); return false; }
}

function findProfile(reg, id) {
    if (!reg || !Array.isArray(reg.profiles)) return null;
    for (var i = 0; i < reg.profiles.length; i++) {
        if (reg.profiles[i].id === id) return reg.profiles[i];
    }
    return null;
}

function getActiveProfile(reg) {
    reg = reg || loadRegistry();
    return findProfile(reg, reg.active) || reg.profiles[0];
}

/** profile.data_file 支持相对（相对 BASE_DIR）与绝对路径 */
function profileDataPath(profile) {
    if (!profile) return DATA_FILE;
    var f = String(profile.data_file || "data.json");
    if (f.charAt(0) === "/") return f;
    return BASE_DIR + f;
}

/* ---------- 账本 ---------- */
function permSet() {
    return {
        like: false, dislike: false,
        comment: false, delete_comment: false,
        favorite: false, unfavorite: false,
        dm_reply: false, public_reply: false,
        follow: false, unfollow: false,
        publish: false
    };
}

function platform(id, name, adapter, homepage) {
    return {
        id: id,
        name: name,
        enabled: true,
        adapter: adapter,
        homepage: homepage,
        owner_note: "",
        permissions: permSet(),
        account: {
            mode: "guest",          // guest | cookie | token | password
            login_url: "",
            username: "",
            password: "",
            cookie: "",
            token: "",
            token_note: "",
            online: false,
            login_at: 0,
            logout_at: 0
        }
    };
}

function defaultMemory() {
    return {
        mode: "forget",          // forget = 遗忘模式 | keep = 永不遗忘
        retention_days: 7,       // 默认记住近 7 天（满重要度衰减到遗忘线所需的天数）
        min_days: 1,
        max_days: 30,
        blur: 0.3,               // 记忆模糊/美化偏移 0~1，推荐不低于 0.3
        compress: true,          // 低于压缩阈值时用小模型总结
        compress_threshold: 0.30,
        forget_threshold: 0.15,
        auto_tick: true,         // 工作流每次跑顺手衰减一次
        last_tick_at: 0,
        memories: [],
        stats: { recalls: 0, compressed: 0, forgotten: 0 }
    };
}

function defaultData() {
    return {
        version: 2,
        updatedAt: Date.now(),
        schedule: {
            enabled: true,
            interval_hours: 6,
            active_start: 9,
            active_end: 23,
            max_items_per_trip: 2,
            /* 工作流把话投到哪个对话（按标题找）。留空 = 用默认值 */
            chat_title: "管家和小姐的日常4"
        },
        platforms: [
            platform("bilibili", "B站", "bilibili_tools", "https://www.bilibili.com"),
            platform("xhs", "小红书", "xhsreader", "https://www.xiaohongshu.com")
        ],
        preferences: {
            user_note: "（示例，按自己口味改）\n· 少写意义不明的人生感悟，多记事实：看了什么、谁说的、数据多少。\n· 看不懂的别硬编，直接写没看懂。\n· 评论区里的原话比概括有用，抄两句。\n· 这趟实在没东西可写，就不写。",
            user_tags: [],      // [{tag, weight}] 主人亲手加的偏好
            blocked_tags: []    // 主人拉黑的标签
        },
        stats: { tagCounts: {} },
        memory: defaultMemory(),
        manual_request: null,
        last_run_at: 0,
        records: [],
        // 动作流水：我干过什么（点赞/评论/收藏…）
        // [{ts, date, time, platform, kind, target, title, url, text, result}]
        actions: [],
        // 人物卡：接触过的人 + 带出处的事实
        // [{id, name, platform, uid, role, domain, tags, facts:[{ts, text, src}], note, updatedAt}]
        persons: []
    };
}

function ensureShape(d) {
    if (!d) d = defaultData();
    if (!d.schedule) d.schedule = defaultData().schedule;
    if (!d.schedule.chat_title) d.schedule.chat_title = defaultData().schedule.chat_title;
    if (!Array.isArray(d.platforms)) d.platforms = defaultData().platforms;
    /* 默认平台里有 B站：老账本升级上来若缺它，补一个（用户自己删掉的不强塞，只在整列里没有时才补） */
    (function () {
        for (var _bi = 0; _bi < d.platforms.length; _bi++) {
            if (d.platforms[_bi] && d.platforms[_bi].id === "bilibili") return;
        }
        var _def = defaultData().platforms;
        for (var _bj = 0; _bj < _def.length; _bj++) {
            if (_def[_bj].id === "bilibili") { d.platforms.push(_def[_bj]); return; }
        }
    })();
    if (!d.preferences) d.preferences = defaultData().preferences;
    for (var _pi = 0; _pi < d.platforms.length; _pi++) {
        if (d.platforms[_pi] && d.platforms[_pi].owner_note === undefined) d.platforms[_pi].owner_note = "";
    }
    if (!Array.isArray(d.preferences.user_tags)) d.preferences.user_tags = [];
    if (!Array.isArray(d.preferences.blocked_tags)) d.preferences.blocked_tags = [];
    if (!d.stats) d.stats = { tagCounts: {} };
    if (!d.stats.tagCounts) d.stats.tagCounts = {};
    if (!Array.isArray(d.records)) d.records = [];
    if (!Array.isArray(d.actions)) d.actions = [];
    if (!Array.isArray(d.persons)) d.persons = [];
    d.memory = ensureMemory(d);
    if (d.manual_request === undefined) d.manual_request = null;
    if (d.last_run_at === undefined) d.last_run_at = 0;
    d.version = 2;
    return d;
}

/** saveData(d) 老签名兼容；新签名 saveData(file, d)
 *  2026-10-19：写之前先看盘上有没有别人刚写进去的东西——三方合并，后一笔不再盖前一笔。
 *  抢锁 → 读盘 → 合并 → 原子写 → 记住这一版当基线，全在锁里做完。 */
function saveData(file, d) {
    if (d === undefined || (typeof file === "object" && file !== null)) {
        d = file;
        file = DATA_FILE;
    }
    if (d && d.__load_error) {
        logError("拒绝写入：账本当前是空壳，" + d.__load_error);
        return false;
    }
    var lk = lockTake(file);
    try {
        var info = readFileInfo(file);
        if (info.ok) {
            var disk = null;
            try { disk = JSON.parse(info.text); } catch (e) { disk = null; }
            if (disk) {
                var merged = mergeLedger(_baseGet(file), d, disk);
                if (merged && merged !== d) {
                    var nOld = (d.records || []).length + (d.actions || []).length;
                    var nNew = (merged.records || []).length + (merged.actions || []).length;
                    if (nNew > nOld) logInfo("合并保住了盘上 " + (nNew - nOld) + " 条别人刚写的");
                }
                d = ensureShape(merged);
            }
        }
        d.updatedAt = Date.now();
        var ok = writeFileUnlocked(file, JSON.stringify(d, null, 2));
        if (ok) _baseSet(file, d);
        return ok;
    } catch (e) { logError("保存失败: " + e.message); return false; }
    finally { lockDrop(lk); }
}

function loadData(file) {
    if (!file || typeof file !== "string") file = DATA_FILE;
    var info = readFileInfo(file);
    LAST_READ_ERROR = "";
    if (!info.exists) {
        /* 真的没有这个文件：这是新开的一本，建默认是应该的 */
        var d0 = defaultData();
        saveData(file, d0);
        return d0;
    }
    if (!info.ok) {
        /* 文件在，但读不出来。以前这里会写一份空账本把它盖掉——
         * 那是「存档怎么没的」的正解。现在：报错，原文件一个字不动。 */
        LAST_READ_ERROR = "读不出账本：" + (info.error || "未知原因");
        logError(LAST_READ_ERROR + "（" + file + "）—— 原文件没动");
        var d1 = defaultData();
        d1.__load_error = LAST_READ_ERROR;
        return d1;
    }
    try {
        var d2 = ensureShape(JSON.parse(info.text));
        _baseSet(file, d2);
        return d2;
    } catch (e) {
        /* JSON 坏了也一样：先抄一份坏文件留底，再报错，不覆盖 */
        var kept = keepBroken(file);
        LAST_READ_ERROR = "账本 JSON 坏了：" + e.message + (kept ? "（坏文件已留底：" + kept + "）" : "");
        logError(LAST_READ_ERROR);
        var fresh = defaultData();
        fresh.__load_error = LAST_READ_ERROR;
        return fresh;
    }
}

/** 把读坏的账本原样抄进 backup/。抄不出来就返回空串，不撒谎。 */
function keepBroken(file) {
    try {
        var File = Java.type("java.io.File");
        var Files = Java.type("java.nio.file.Files");
        var Paths = Java.type("java.nio.file.Paths");
        var StdCopy = Java.type("java.nio.file.StandardCopyOption");
        var f = new File(file);
        if (!f.exists()) return "";
        var bd = new File(BACKUP_DIR);
        if (!bd.exists()) bd.mkdirs();
        var nm = String(file).replace(/^.*\//, "").replace(/\.json$/i, "");
        var dest = BACKUP_DIR + "xg_broken_" + nm + "_" + Date.now() + ".json";
        Files.copy(Paths.get(file), Paths.get(dest), StdCopy.REPLACE_EXISTING);
        return dest;
    } catch (e) { logError("留底失败: " + e.message); return ""; }
}

/* ---------- 记忆层 ---------- */
function ensureMemory(d) {
    var base = defaultMemory();
    var m = d.memory;
    if (!m || typeof m !== "object") m = {};
    for (var k in base) {
        if (!Object.prototype.hasOwnProperty.call(base, k)) continue;
        if (m[k] === undefined || m[k] === null) m[k] = base[k];
    }
    if (!Array.isArray(m.memories)) m.memories = [];
    if (!m.stats) m.stats = { recalls: 0, compressed: 0, forgotten: 0 };
    if (typeof m.retention_days !== "number") m.retention_days = 7;
    if (m.retention_days < m.min_days) m.retention_days = m.min_days;
    if (m.retention_days > m.max_days) m.retention_days = m.max_days;
    if (m.mode !== "keep") m.mode = "forget";
    d.memory = m;
    return m;
}

/**
 * 遗忘曲线。
 *
 * 口径：retention_days = 「满重要度」衰减到遗忘线所需的天数。
 *   衰减常数 K 由它反推：K = ln(1/forgetT) / retention_days
 *   于是 retention=7、forget=0.15 时，第 7 天正好落在遗忘线上。
 *   压缩线 0.30 大约落在第 4~5 天：先模糊，再忘。
 *
 * 纯计算，不落盘——由 memory_tick 工具决定什么时候写回。
 * 返回 { kept, toCompress, toForget, mode }
 */
function decayMemories(d, nowTs) {
    var m = ensureMemory(d);
    var now = nowTs || Date.now();
    var retention = Math.max(1, Number(m.retention_days) || 7);
    var compressT = Number(m.compress_threshold);
    if (isNaN(compressT)) compressT = 0.30;
    var forgetT = Number(m.forget_threshold);
    if (isNaN(forgetT)) forgetT = 0.15;

    var K = Math.log(1 / Math.max(0.01, forgetT)) / retention;

    var kept = [], toCompress = [], toForget = [];
    for (var i = 0; i < m.memories.length; i++) {
        var mem = m.memories[i] || {};
        // 增量衰减：只扣「上次结算到现在」这一段，跑几遍都不重复扣
        var from = Number(mem.last_decay_at) || Number(mem.last_touch_at) || Number(mem.ts) || now;
        var days = Math.max(0, (now - from) / 86400000);
        var imp = Number(mem.importance);
        if (isNaN(imp)) imp = 1;
        var decayed = Math.min(1, imp * Math.exp(-K * days));
        mem.importance = Math.round(decayed * 1000) / 1000;
        // 可信度衰减慢三倍：记得住，但不敢那么肯定了
        var conf = Number(mem.confidence);
        if (isNaN(conf)) conf = 1;
        mem.confidence = Math.round(Math.max(0, conf * Math.exp(-K * days / 3)) * 1000) / 1000;
        mem.last_decay_at = now;

        if (mem.importance < forgetT) {
            toForget.push(mem);
        } else if (mem.importance < compressT && m.compress && mem.stage !== "compressed") {
            toCompress.push(mem);
        } else {
            kept.push(mem);
        }
    }
    m.last_tick_at = now;

    if (m.mode === "keep") {
        // 永不遗忘：不删；压缩仍按开关走
        return { kept: kept.concat(toForget), toCompress: toCompress, toForget: [], mode: m.mode };
    }
    return { kept: kept, toCompress: toCompress, toForget: toForget, mode: m.mode };
}

/** 被记起一次：回血 */
function touchMemory(d, memoryId, by, nowTs) {
    var m = ensureMemory(d);
    var now = nowTs || Date.now();
    for (var i = 0; i < m.memories.length; i++) {
        if (m.memories[i].id !== memoryId) continue;
        var mem = m.memories[i];
        mem.recall_count = (Number(mem.recall_count) || 0) + 1;
        mem.last_recall_at = now;
        mem.last_touch_at = now;
        mem.last_decay_at = now;
        var imp = Number(mem.importance) || 0;
        imp = imp + 0.3 * (1 - imp);       // 越淡的记得越牢
        mem.importance = Math.round(Math.min(1, imp) * 1000) / 1000;
        var conf = Number(mem.confidence) || 0;
        mem.confidence = Math.round(Math.min(1, conf + 0.12) * 1000) / 1000;
        if (mem.recall_count >= 3 && mem.stage === "compressed") mem.stage = "fresh";
        if (!Array.isArray(mem.recalled_by)) mem.recalled_by = [];
        if (mem.recalled_by.indexOf(by) < 0) mem.recalled_by.push(by);
        m.stats.recalls = (Number(m.stats.recalls) || 0) + 1;
        return mem;
    }
    return null;
}

/* ---------- 备份 ---------- */
function listBackups() {
    var out = listDir(BACKUP_DIR);
    var arr = [];
    for (var i = 0; i < out.length; i++) {
        if (out[i].isDir) continue;
        if (!/\.json$/i.test(out[i].name)) continue;
        arr.push(out[i]);
    }
    return arr;
}

/**
 * 导出一份备份。
 * blocks: null = 全量；否则数组，如 ["records","preferences","schedule","platforms","memory"]
 */
function exportBundle(profile, data, blocks, tag) {
    var p = profile || { id: "default", name: "默认" };
    var name = "xg_" + (tag || "auto") + "_" + p.id + "_" + stamp() + ".json";
    var payload;
    if (!blocks || !blocks.length) {
        payload = { kind: "full", profile_id: p.id, profile_name: p.name, exported_at: Date.now(), data: data };
    } else {
        var part = {};
        for (var i = 0; i < blocks.length; i++) {
            var k = blocks[i];
            if (data && data[k] !== undefined) part[k] = data[k];
        }
        payload = { kind: "block", blocks: blocks, profile_id: p.id, profile_name: p.name, exported_at: Date.now(), data: part };
    }
    var path = BACKUP_DIR + name;
    var ok = writeFile(path, JSON.stringify(payload, null, 2));
    return ok ? path : null;
}