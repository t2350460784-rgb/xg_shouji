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

/* ---------- 文件 ---------- */
function readFile(path) {
    try {
        var File = Java.type("java.io.File");
        var FileReader = Java.type("java.io.FileReader");
        var BufferedReader = Java.type("java.io.BufferedReader");
        var f = new File(path);
        if (!f.exists()) return null;
        var r = new BufferedReader(new FileReader(f));
        var out = "";
        var line;
        while ((line = r.readLine()) !== null) out += line + "\n";
        r.close();
        return out;
    } catch (e) { logError("读取失败 " + path + ": " + e.message); return null; }
}

function writeFile(path, content) {
    try {
        var File = Java.type("java.io.File");
        var FileWriter = Java.type("java.io.FileWriter");
        var f = new File(path);
        var p = f.getParentFile();
        if (p && !p.exists()) p.mkdirs();
        var w = new FileWriter(f, false);
        w.write(content);
        w.flush();
        w.close();
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
            chat_title: "AI 和用户的日常"
        },
        platforms: [
            platform("bilibili", "B站", "bilibili_tools", "https://www.bilibili.com")
        ],
        preferences: {
            user_note: "（示例，按自己口味改）\n· 少写意义不明的人生感悟，多记事实：看了什么、谁说的、数据多少。\n· 看不懂的别硬编，直接写没看懂。\n· 评论区里的原话比概括有用，抄两句。\n· 这趟实在没东西可写，就不写。",
            user_tags: [],      // [{tag, weight}] 用户手动添加的偏好
            blocked_tags: []    // 用户屏蔽的标签
        },
        stats: { tagCounts: {} },
        memory: defaultMemory(),
        manual_request: null,
        last_run_at: 0,
        records: [],
        // 动作流水：执行过的动作（点赞/评论/收藏…）
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

/** saveData(d) 老签名兼容；新签名 saveData(file, d) */
function saveData(file, d) {
    if (d === undefined || (typeof file === "object" && file !== null)) {
        d = file;
        file = DATA_FILE;
    }
    try {
        d.updatedAt = Date.now();
        return writeFile(file, JSON.stringify(d, null, 2));
    } catch (e) { logError("保存失败: " + e.message); return false; }
}

function loadData(file) {
    if (!file || typeof file !== "string") file = DATA_FILE;
    var raw = readFile(file);
    if (!raw) {
        var d = defaultData();
        saveData(file, d);
        return d;
    }
    try {
        return ensureShape(JSON.parse(raw));
    } catch (e) {
        logError("账本损坏，已重置: " + e.message);
        var fresh = defaultData();
        saveData(file, fresh);
        return fresh;
    }
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