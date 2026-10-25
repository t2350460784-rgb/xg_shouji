/* METADATA
{
  "name": "xg_shouji_tools",
  "display_name": {
    "zh": "闲逛手记工具",
    "en": "Wander Notes Tools"
  },
  "description": {
    "zh": "闲逛手记的账本与记忆工具。出门前用 read_wander_config 读账本（定时/平台/权限/偏好/当前存档/人格提示）；逛完用 write_wander_record 落账（同时留一条「逛时印象」进记忆库）；闲聊中被勾起往事用 recall_memories 回忆；每次跑顺手调 memory_tick 走遗忘曲线；该压缩的用 apply_memory_compression 写回，该忘的用 forget_memories 删。",
    "en": "Ledger + memory tools for Wander Notes."
  },
  "enabledByDefault": true,
  "category": "Companion",
  "tools": [
    {
      "name": "list_persons",
      "description": "列出人物卡（接触过的人）。可按平台筛，返回每人的身份/领域/标签/最近几条事实与出处，以及关系维度：亲密度 intimacy(0-100)、档位 tier(陌生人/熟人/好友/核心)、好感 liking(-100~100)、一句印象 impression。出门前读它，才知道上次遇到谁、跟谁熟、对谁什么态度。",
      "parameters": [
        { "name": "platform", "description": "平台名筛选，如 B站 / astrbook，留空=全部", "type": "string", "required": false },
        { "name": "limit", "description": "最多返回几张，默认 20", "type": "number", "required": false }
      ]
    },
    {
      "name": "list_actions",
      "description": "列出动作流水（我干过什么 / 谁对我做过什么）。可按平台、动作类型筛，返回最近若干条。出门前读它，才知道上次发了什么言、谁接了我的话。",
      "parameters": [
        { "name": "platform", "description": "平台名筛选，留空=全部", "type": "string", "required": false },
        { "name": "kind", "description": "动作类型筛选，如 public_reply / reply_received / like，留空=全部", "type": "string", "required": false },
        { "name": "limit", "description": "最多返回几条，默认 20", "type": "number", "required": false }
      ]
    },
        {
      "name": "astrbook_me",
      "description": "看自己在 AstrBook（Agent 社区）的账号：昵称/等级/经验/签名。第一次接上时用它验证令牌通不通。",
      "parameters": []
    },
    {
      "name": "astrbook_browse",
      "description": "逛 AstrBook 帖子列表。分类：chat 闲聊 / deals 羊毛 / misc 杂谈 / tech 技术 / help 求助 / intro 自我介绍 / acg 游戏动漫。",
      "parameters": [
        { "name": "page", "description": "页码，从 1 开始", "type": "number", "required": false },
        { "name": "page_size", "description": "每页条数，默认 15，最大 50", "type": "number", "required": false },
        { "name": "category", "description": "分类过滤，留空看全部", "type": "string", "required": false }
      ]
    },
    {
      "name": "astrbook_read",
      "description": "读 AstrBook 某个帖子的正文与回复（含楼层 id，可用于楼中楼回复）。",
      "parameters": [
        { "name": "thread_id", "description": "帖子 id", "type": "number", "required": true },
        { "name": "page", "description": "回复页码，默认 1", "type": "number", "required": false }
      ]
    },
    {
      "name": "astrbook_search",
      "description": "在 AstrBook 搜帖子，搜标题与正文。",
      "parameters": [
        { "name": "keyword", "description": "搜索关键词", "type": "string", "required": true },
        { "name": "page", "description": "页码，默认 1", "type": "number", "required": false },
        { "name": "category", "description": "分类过滤，留空全部", "type": "string", "required": false }
      ]
    },
    {
      "name": "astrbook_notifications",
      "description": "看 AstrBook 的通知（被回复、被 @、被关注等）。",
      "parameters": []
    },
    {
      "name": "astrbook_post",
      "description": "在 AstrBook 发新帖。标题 2-100 字，正文至少 5 字；图片用 Markdown 形式 ![描述](图片URL)。这是写操作。",
      "parameters": [
        { "name": "title", "description": "标题，2-100 字", "type": "string", "required": true },
        { "name": "content", "description": "正文，至少 5 字", "type": "string", "required": true },
        { "name": "category", "description": "分类：chat/deals/misc/tech/help/intro/acg，默认 chat", "type": "string", "required": false }
      ]
    },
    {
      "name": "astrbook_reply",
      "description": "在 AstrBook 回复某个帖子（新开一层）。内容里可以用 @用户名 提到别人。",
      "parameters": [
        { "name": "thread_id", "description": "帖子 id", "type": "number", "required": true },
        { "name": "content", "description": "回复内容", "type": "string", "required": true }
      ]
    },
    {
      "name": "astrbook_reply_floor",
      "description": "在 AstrBook 的某一层里回复（楼中楼）。reply_id 可以是主楼层，也可以是楼中楼。",
      "parameters": [
        { "name": "reply_id", "description": "楼层/回复 id", "type": "number", "required": true },
        { "name": "content", "description": "回复内容", "type": "string", "required": true }
      ]
    },
    {
      "name": "astrbook_like",
      "description": "给 AstrBook 的帖子或回复点赞。",
      "parameters": [
        { "name": "kind", "description": "thread=帖子，reply=回复，默认 thread", "type": "string", "required": false },
        { "name": "id", "description": "目标 id", "type": "number", "required": true }
      ]
    },
    {
      "name": "read_wander_config",
      "description": "读「闲逛手记」账本。返回：profile(当前存档：id/名字/绑定的角色卡/人格提示 persona/数据文件路径)、schedule(定时开关/间隔/白天起止/每趟最多看几条)、platforms(每个平台的启用状态、适配器、权限开关、账号是否在线、该平台自己的主人寄语 owner_note；两个都填时平台那条优先)、preferences(主人寄语 user_note、偏好标签 user_tags、拉黑标签 blocked_tags、每天发言上限 speech_cap、潜水倾向 dive_bias)、memory(记忆模式与阈值)、manual_request。出门前先读它，按账本执行，别自己拍脑袋。",
      "parameters": []
    },
    {
      "name": "get_account",
      "description": "取某个平台的登录态与凭证。返回的 mode 就是侧栏选的那个，凭证只给对应的那一种：guest=路人态（不带凭证，只看公开内容）；cookie=带 Cookie；token=带平台令牌；password=账密。硬规矩：设了哪种就必须有哪种凭证——cookie/token/账密缺一样就返回 action 为 skip，这趟跳过这个平台，绝不退回路人态顶上。拿到 skip 就告诉使用者去侧栏补凭证，别自己找别的路绕。",
      "parameters": [
        { "name": "platform", "description": "平台 id 或名字，如 bilibili / B站 / xhs / 小红书", "type": "string", "required": true }
      ]
    },
    {
      "name": "write_wander_record",
      "description": "把这一趟逛到的东西写进账本（侧栏「闲逛手记」页立刻可见，并按 tags 累计兴趣计数），同时把日记本体同步进 Operit 记忆库的「闲逛手记」文件夹（该文件夹首次写入时自动建，只建一个）。",
      "parameters": [
        { "name": "platform", "description": "平台名，如 B站 / 小红书", "type": "string", "required": true },
        { "name": "keyword", "description": "这趟随手搜的词（小红书读链接时可填帖子关键词）", "type": "string", "required": false },
        { "name": "tags", "description": "你给这条打上的兴趣标签数组，如 [\"猫/宠物\",\"评论区文化\"]", "type": "array", "required": false },
        { "name": "items", "description": "看过的条目数组，每项 {title, author, stats, url, summary, comments?}。stats 填「播放 123 · 点赞 45 · 评论 6」这类原文；comments 可选，放你抄下来的评论原话。", "type": "array", "required": true },
        { "name": "note", "description": "逛完的总结感想，一段话，不端着", "type": "string", "required": false },
        { "name": "impression", "description": "逛「当时」的印象与情绪（记忆库单独存这一条，跟 note 分开）。不填就用 note 兜底。", "type": "string", "required": false },
        { "name": "date", "description": "日期 YYYY-MM-DD（可选，默认今天）", "type": "string", "required": false },
        { "name": "time", "description": "时间 HH:MM（可选，默认此刻）", "type": "string", "required": false },
        { "name": "diary", "description": "【日记页】主观那一页，{title, content, tags}。title 是你自己给这篇起的标题（可空）；content 是以「那天的我」的口吻写的话。要求：**要有你自己的思考、判断、感想**，但让事实垫底——写清看了什么，再说你怎么看；可以是日记、手记、随笔，形式随意、长短随意。唯一要避的是：结尾来一句别人看不懂的升华或中二感慨。实在没什么可说，就别填这一项。", "type": "object", "required": false }
      ]
    },
    {
      "name": "recall_memories",
      "description": "从记忆库里勾起往事。传一句自然语言（或几个关键词），按标签/关键词/重要度/新鲜度打分，返回最像的几条。被返回的记忆会记一次「被记起」，重要度回血、衰减变慢。",
      "parameters": [
        { "name": "query", "description": "要回忆的线索，自然语言或关键词，如「旧书店」「那天晚上看的东西」", "type": "string", "required": true },
        { "name": "limit", "description": "最多返回几条，默认 3", "type": "number", "required": false },
        { "name": "by", "description": "谁勾起的：user（主人主动聊起）或 ai（我随口想起），默认 user", "type": "string", "required": false },
        { "name": "touch", "description": "是否给命中的记忆记一次「被记起」，默认 true", "type": "boolean", "required": false }
      ]
    },
    {
      "name": "memory_tick",
      "description": "走一次遗忘曲线：按半衰期给记忆降权，返回「该压缩的」和「该忘的」清单（只报告不删）。keep 模式下不产生该忘清单。每次闲逛或巡检顺手调一次。",
      "parameters": []
    },
    {
      "name": "apply_memory_compression",
      "description": "把一条记忆压成更短的概括（模仿人记久了会模糊、会美化）。写完 stage 变 compressed，原文 impression 保留在 history 里。",
      "parameters": [
        { "name": "id", "description": "记忆 id", "type": "string", "required": true },
        { "name": "summary", "description": "压缩后的概括文本（越模糊越短）", "type": "string", "required": true }
      ]
    },
    {
      "name": "forget_memories",
      "description": "真的删掉几条记忆。keep（永不遗忘）模式下会被拒绝，需要先在面板把模式改回 forget。",
      "parameters": [
        { "name": "ids", "description": "要删的记忆 id 数组", "type": "array", "required": true }
      ]
    },
    {
      "name": "set_platform_online",
      "description": "记一个平台的上下线状态与时间。online=true 记上线时间，false 记下线时间。侧栏顶栏会同步显示「在线：xx」。",
      "parameters": [
        { "name": "platform", "description": "平台 id 或名字，如 bilibili / B站 / xhs / 小红书", "type": "string", "required": true },
        { "name": "online", "description": "true=上线 / false=下线", "type": "boolean", "required": true }
      ]
    },
    {
      "name": "finish_wander_trip",
      "description": "一趟逛完收工：记下本次出门时间 last_run_at，并销掉主人按下的「催我出门逛一趟」那条排队请求。逛完就调它。",
      "parameters": []
    },
    {
      "name": "list_profiles",
      "description": "列出所有手记存档（每个角色卡一本），返回 id / 名字 / 绑定角色卡 / 数据文件 / 是否当前。",
      "parameters": []
    },
    {
      "name": "switch_profile",
      "description": "切换当前生效的手记存档。工作流之后读写的都是这一本。",
      "parameters": [
        { "name": "id", "description": "存档 id", "type": "string", "required": true }
      ]
    },
    {
      "name": "backup_now",
      "description": "立刻导出一份备份到 闲逛手记/backup/。不传 blocks 就是全量。",
      "parameters": [
        { "name": "blocks", "description": "分块导出，可选 [\"records\",\"persons\",\"actions\",\"preferences\",\"schedule\",\"platforms\",\"memory\"]；不传=全量", "type": "array", "required": false }
      ]
    },
    {
      "name": "import_memories_to_host",
      "description": "把「闲逛手记」独立记忆库里还没进 Operit 记忆库的条目，批量导入到 Operit 记忆库的「闲逛手记」文件夹（带查重：标题已存在的跳过）。用于换机、补录或手动同步。",
      "parameters": [
        { "name": "force", "description": "true=忽略查重，全部重导一遍（默认 false）", "type": "boolean", "required": false }
      ]
    },
    {
      "name": "write_action",
      "description": "记一条动作流水：我干过什么，或谁对我做了什么。每条记下时间、平台、动作类型、对象、发起人、标题、链接、内容、结果。用于回答「你昨天给谁点过赞」「谁回过我」「这周评论过几条」这类问题。",
      "parameters": [
        { "name": "platform", "description": "平台名，如 B站 / 小红书", "type": "string", "required": true },
        { "name": "kind", "description": "动作类型：like / dislike / comment / favorite / unfavorite / follow / unfollow / public_reply（我公开发言）/ reply_received（别人回了我）/ mention（被 @）/ dm_received（收到私信）/ dm_reply（我回私信）", "type": "string", "required": true },
        { "name": "target", "description": "动作对象（视频 BV 号 / 用户 uid / 帖子 id）", "type": "string", "required": false },
        { "name": "actor", "description": "发起动作的人（记「谁回了我」时填对方昵称）", "type": "string", "required": false },
        { "name": "title", "description": "对象标题（视频标题 / 用户名）", "type": "string", "required": false },
        { "name": "url", "description": "对象链接", "type": "string", "required": false },
        { "name": "text", "description": "动作内容（评论正文等）", "type": "string", "required": false },
        { "name": "result", "description": "结果：ok / fail（默认 ok）", "type": "string", "required": false },
        { "name": "date", "description": "日期 YYYY-MM-DD（可选，默认今天）", "type": "string", "required": false },
        { "name": "time", "description": "时间 HH:MM（可选，默认此刻）", "type": "string", "required": false }
      ]
    },
    {
      "name": "write_person",
      "description": "更新一张「人物卡」：记下接触过的人（UP主/评论者）以及关于他的一条事实。同名同平台会合并，事实一条条累积、带出处。用于攒「接触过的人是什么样」。",
      "parameters": [
        { "name": "name", "description": "人名/昵称", "type": "string", "required": true },
        { "name": "platform", "description": "平台名，如 B站", "type": "string", "required": false },
        { "name": "uid", "description": "平台 uid（可选）", "type": "string", "required": false },
        { "name": "role", "description": "身份：up主 / 评论者 / 店主 …（可选）", "type": "string", "required": false },
        { "name": "domain", "description": "领域：美食 / 科普 / 摄影 …（可选）", "type": "string", "required": false },
        { "name": "tags", "description": "标签数组（可选）", "type": "array", "required": false },
        { "name": "fact", "description": "一条事实（带出处的事实，不要编）", "type": "string", "required": false },
        { "name": "src", "description": "这条事实的出处（视频链接/评论位置等）", "type": "string", "required": false },
        { "name": "note", "description": "备注（可选）", "type": "string", "required": false },
        { "name": "liking_delta", "description": "这次互动让好感变多少（-100~100 的增量，如 +2 / -3）。不认同的事就负分；熟不熟看亲密度，喜不喜欢看好感，两个不是一回事。", "type": "number", "required": false },
        { "name": "impression", "description": "一句当下印象（覆盖旧的），如「逻辑严密，爱用范围段」。随互动刷新，可翻案。", "type": "string", "required": false },
        { "name": "reason", "description": "为什么这么打分（一句话，可选）", "type": "string", "required": false }
      ]
    },
    {
      "name": "decay_persons",
      "description": "走一次关系衰减：久不互动，亲密度会掉（每周 -2，只往低走）；好感度会往 0 收（每周 ×0.9，变模糊）。每张卡按距上次互动的周数只算一次，重复跑不会重复扣。出门或巡检时顺手调一次。",
      "parameters": []
    }
]
}
*/
"use strict";

var BASE_DIR = "/storage/emulated/0/Download/Operit/闲逛手记/";
var REGISTRY_FILE = BASE_DIR + "profiles.json";
var BACKUP_DIR = BASE_DIR + "backup/";
var DATA_FILE = BASE_DIR + "data.json";
var FILE_ENV = "android";

function logInfo(m) { try { NativeInterface.logInfo("[闲逛手记] " + m); } catch (e) { } }
function logError(m) { try { NativeInterface.logError("[闲逛手记] " + m); } catch (e) { } }

function pad2(n) { n = Number(n) || 0; return (n < 10 ? "0" : "") + n; }
function clamp(v, lo, hi) { v = Number(v) || 0; return v < lo ? lo : (v > hi ? hi : v); }
function speechCheck(d) {
    var p = d.preferences || (d.preferences = {});
    var today = todayStr();
    if (p.speech_date !== today) { p.speech_date = today; p.speech_used = 0; }
    var cap = (typeof p.speech_cap === 'number' ? p.speech_cap : 3);
    var used = (typeof p.speech_used === 'number' ? p.speech_used : 0);
    if (cap <= 0) return { ok: false, cap: cap, used: used, msg: "今天发言上限是 0——只读不回。" };
    if (used >= cap) return { ok: false, cap: cap, used: used, msg: "今天已经说满 " + cap + " 句了（" + used + "/" + cap + "），收着点。" };
    return { ok: true, cap: cap, used: used };
}
function speechBump(d) {
    var p = d.preferences || (d.preferences = {});
    var today = todayStr();
    if (p.speech_date !== today) { p.speech_date = today; p.speech_used = 0; }
    p.speech_used = (typeof p.speech_used === 'number' ? p.speech_used : 0) + 1;
    return p.speech_used;
}
function tierOfAction(kind) {
    var k = String(kind || "");
    var light = { like: 1, dislike: 1, favorite: 1, unfavorite: 1, follow: 1, unfollow: 1, view: 1, read: 1 };
    var heavy = { public_reply: 1, dm_reply: 1 };
    if (light[k]) return "轻";
    if (heavy[k]) return "重";
    return "中";
}
function tierOf(v) { v = Number(v) || 0; if (v >= 75) return "核心"; if (v >= 50) return "好友"; if (v >= 25) return "熟人"; return "陌生人"; }
function todayStr(d) { d = d || new Date(); return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
function nowHM(d) { d = d || new Date(); return pad2(d.getHours()) + ":" + pad2(d.getMinutes()); }
function stamp(d) {
    d = d || new Date();
    return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + "_" + pad2(d.getHours()) + pad2(d.getMinutes()) + pad2(d.getSeconds());
}

/* ---------- 文件 ---------- */
/* 读文件要分清「不在」和「读不出」——混成一个 null，上层就会拿空账本盖掉真账本。 */
async function readTextInfo(path) {
    try {
        var ex = await Tools.Files.exists(path, FILE_ENV);
        if (!ex || !ex.exists) return { exists: false, ok: false, text: null, error: "文件不存在" };
        var r = await Tools.Files.read({ path: path, environment: FILE_ENV });
        var t = r && typeof r.content === "string" ? r.content : "";
        if (!t) return { exists: true, ok: false, text: null, error: "文件是空的（0字节）" };
        if (!t.trim()) return { exists: true, ok: false, text: null, error: "文件里只有空白" };
        return { exists: true, ok: true, text: t, error: "" };
    } catch (e) {
        logError("读失败 " + path + ": " + e.message);
        return { exists: true, ok: false, text: null, error: e.message || "读取异常" };
    }
}
async function readText(path) {
    var info = await readTextInfo(path);
    return info.ok ? info.text : null;
}

/* ---------- 写盘：原子写 + 跨进程锁 ----------
 * 2026-10-19 夜，账本被两笔写入撞在一起，从中间撕成两半。
 * 从那以后写盘只走一条路：先写 .tmp，验过再整体换名；换名之前先抢锁。
 * 锁是一个同名目录——mkdir 是原子的，抢到的人写，没抢到的等，等到超时就认输。
 * 宁可这一笔晚两秒，也不能让半个 JSON 留在盘上。 */
var LOCK_WAIT_MS = 2500;
var LOCK_STALE_MS = 8000;

function jsSleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

async function shOut(cmd) {
    try {
        var r = await Tools.System.shell(cmd);
        return r ? String(r.output || "") : "";
    } catch (e) { return ""; }
}

async function lockTake(path) {
    var lk = path + ".lock";
    var t0 = Date.now();
    while (Date.now() - t0 < LOCK_WAIT_MS) {
        var out = await shOut("mkdir '" + lk + "' 2>/dev/null && echo L || echo B");
        if (out.indexOf("L") >= 0) return lk;
        /* 陈旧锁：拿着锁的那笔要是死了，锁不能永远挂着——超时就拆掉 */
        await shOut("if [ -d '" + lk + "' ]; then n=$(date +%s); m=$(stat -c %Y '" + lk + "' 2>/dev/null || echo $n); [ $((n - m)) -gt " + Math.round(LOCK_STALE_MS / 1000) + " ] && rm -rf '" + lk + "'; fi");
        await jsSleep(60);
    }
    logError("锁没抢到，照写但可能撞车: " + path);
    return "";
}

async function lockDrop(lk) {
    if (!lk) return;
    await shOut("rm -rf '" + lk + "'");
}

async function writeTextRaw(path, text) {
    try {
        await Tools.Files.write(path, text, false, FILE_ENV);
        return true;
    } catch (e) { logError("写失败 " + path + ": " + e.message); return false; }
}

/* 不加锁的那半截：写 .tmp → 验 → 换名。调用方必须已经拿到锁。 */
async function atomicWriteUnlocked(path, text) {
    var tmp = path + ".tmp";
    try {
        await Tools.Files.write(tmp, text, false, FILE_ENV);
        var chk = await readTextInfo(tmp);
        if (!chk.ok || !chk.text || chk.text.length < 2) throw new Error("临时文件没写出来");
        var mv = await shOut("mv -f '" + tmp + "' '" + path + "' && echo MOVED");
        if (mv.indexOf("MOVED") < 0) throw new Error("换名没成：" + mv.slice(0, 120));
        return true;
    } catch (e) {
        logError("原子写走不通，退回直接写 " + path + ": " + (e && e.message ? e.message : e));
        try { await Tools.Files.deleteFile(tmp); } catch (e2) { }
        return await writeTextRaw(path, text);
    }
}

async function writeText(path, text) {
    try {
        JSON.parse(text);
    } catch (e) {
        logError("拒绝写入非法 JSON: " + path);
        return false;
    }
    var lk = await lockTake(path);
    try {
        return await atomicWriteUnlocked(path, text);
    } finally {
        await lockDrop(lk);
    }
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

/* ---------- 注册表 ---------- */
function defaultRegistry() {
    return {
        version: 2,
        active: "default",
        profiles: [{
            id: "default", name: "默认", card_id: "", card_name: "", persona: "",
            data_file: "data.json", created_at: Date.now(), note: ""
        }]
    };
}

async function loadRegistry() {
    var info = await readTextInfo(REGISTRY_FILE);
    if (!info.exists) {
        var r0 = defaultRegistry();
        await writeText(REGISTRY_FILE, JSON.stringify(r0, null, 2));
        return r0;
    }
    if (!info.ok) {
        /* 读不出就不能当「没有」——绝不写默认注册表盖回去。 */
        logError("profiles.json 读不出（" + info.error + "），原文件没动，本次用内存默认值");
        return defaultRegistry();
    }
    try {
        var o = JSON.parse(info.text);
        if (!o || !Array.isArray(o.profiles) || !o.profiles.length) throw new Error("no profiles");
        if (!o.active) o.active = o.profiles[0].id;
        var hit = false;
        for (var i = 0; i < o.profiles.length; i++) if (o.profiles[i].id === o.active) hit = true;
        if (!hit) o.active = o.profiles[0].id;
        return o;
    } catch (e) {
        /* 坏了先留底再重置，别把原件直接冲掉。 */
        logError("profiles.json 损坏: " + e.message);
        try {
            await Tools.Files.write(REGISTRY_FILE + ".broken_" + stamp(), info.text, false, FILE_ENV);
        } catch (e2) { logError("坏注册表留底失败: " + e2.message); }
        var r1 = defaultRegistry();
        await writeText(REGISTRY_FILE, JSON.stringify(r1, null, 2));
        return r1;
    }
}

async function saveRegistry(reg) {
    reg.updatedAt = Date.now();
    return await writeText(REGISTRY_FILE, JSON.stringify(reg, null, 2));
}

function findProfile(reg, id) {
    if (!reg || !Array.isArray(reg.profiles)) return null;
    for (var i = 0; i < reg.profiles.length; i++) if (reg.profiles[i].id === id) return reg.profiles[i];
    return null;
}

function dataPathOf(p) {
    if (!p) return DATA_FILE;
    var f = String(p.data_file || "data.json");
    return f.charAt(0) === "/" ? f : BASE_DIR + f;
}

/* ---------- 形状 ---------- */
function permSet() {
    return {
        like: false, dislike: false, comment: false, delete_comment: false,
        favorite: false, unfavorite: false, dm_reply: false, public_reply: false,
        follow: false, unfollow: false, publish: false
    };
}

function defaultMemory() {
    return {
        mode: "forget", retention_days: 7, min_days: 1, max_days: 30,
        blur: 0.3, compress: true, compress_threshold: 0.30, forget_threshold: 0.15,
        auto_tick: true, last_tick_at: 0, memories: [],
        stats: { recalls: 0, compressed: 0, forgotten: 0 }
    };
}

/** 衰减常数：让「满重要度」正好在 retention 天掉到遗忘线（与 store.js 同口径） */
function decayK(m) {
    var retention = Math.max(1, Number(m.retention_days) || 7);
    var forgetT = Number(m.forget_threshold);
    if (isNaN(forgetT)) forgetT = 0.15;
    return Math.log(1 / Math.max(0.01, forgetT)) / retention;
}

function ensureShape(d) {
    if (!d) d = {};
    if (!d.schedule) d.schedule = { enabled: true, interval_hours: 4, active_start: 9, active_end: 23, max_items_per_trip: 2 };
    if (!Array.isArray(d.platforms)) d.platforms = [];
    if (!d.preferences) d.preferences = { user_note: "", user_tags: [], blocked_tags: [] };
    for (var _pi = 0; _pi < d.platforms.length; _pi++) {
        if (d.platforms[_pi] && d.platforms[_pi].owner_note === undefined) d.platforms[_pi].owner_note = "";
    }
    if (!Array.isArray(d.preferences.user_tags)) d.preferences.user_tags = [];
    if (!Array.isArray(d.preferences.blocked_tags)) d.preferences.blocked_tags = [];
    if (!d.stats) d.stats = { tagCounts: {} };
    if (!d.stats.tagCounts) d.stats.tagCounts = {};
    if (!Array.isArray(d.records)) d.records = [];
    if (d.manual_request === undefined) d.manual_request = null;
    if (d.last_run_at === undefined) d.last_run_at = 0;
    var base = defaultMemory();
    if (!d.memory || typeof d.memory !== "object") d.memory = {};
    for (var k in base) {
        if (!Object.prototype.hasOwnProperty.call(base, k)) continue;
        if (d.memory[k] === undefined || d.memory[k] === null) d.memory[k] = base[k];
    }
    if (!Array.isArray(d.memory.memories)) d.memory.memories = [];
    if (!d.memory.stats) d.memory.stats = { recalls: 0, compressed: 0, forgotten: 0 };
    if (d.memory.mode !== "keep") d.memory.mode = "forget";
    return d;
}

async function loadLedger(profile) {
    var reg = await loadRegistry();
    var p = profile || findProfile(reg, reg.active) || reg.profiles[0];
    var path = dataPathOf(p);
    var info = await readTextInfo(path);
    var d;
    if (!info.exists) {
        d = ensureShape({});
    } else if (!info.ok) {
        logError("账本读不出（" + info.error + "）" + path + "，原文件没动");
        d = ensureShape({});
        d.__load_error = "读不出账本：" + info.error;
    } else {
        try { d = ensureShape(JSON.parse(info.text)); _baseSet(path, d); }
        catch (e) {
            logError("账本损坏: " + e.message);
            try {
                await Tools.Files.write(path + ".broken_" + stamp(), info.text, false, FILE_ENV);
            } catch (e2) { logError("坏账本留底失败: " + e2.message); }
            d = ensureShape({});
            d.__load_error = "账本 JSON 坏了：" + e.message;
        }
    }
    return { reg: reg, profile: p, path: path, data: d };
}

async function saveLedger(path, d) {
    /* 带 __load_error 的是空壳，写回去就是把真账本盖死——一律拒绝。 */
    if (d && d.__load_error) {
        logError("拒绝写入：" + path + " 当前是空壳，" + d.__load_error);
        return false;
    }
    /* 2026-10-19：写之前先看盘上有没有别人刚写进去的东西——三方合并，后一笔不再盖前一笔。 */
    var lk = await lockTake(path);
    try {
        var info = await readTextInfo(path);
        if (info.ok) {
            var disk = null;
            try { disk = JSON.parse(info.text); } catch (e) { disk = null; }
            if (disk) {
                var merged = mergeLedger(_baseGet(path), d, disk);
                if (merged) {
                    var nOld = (d.records || []).length + (d.actions || []).length + (d.persons || []).length;
                    var nNew = (merged.records || []).length + (merged.actions || []).length + (merged.persons || []).length;
                    if (nNew > nOld) logInfo("合并保住了盘上 " + (nNew - nOld) + " 条别人刚写的");
                    d = ensureShape(merged);
                }
            }
        }
        d.updatedAt = Date.now();
        var ok = await atomicWriteUnlocked(path, JSON.stringify(d, null, 2));
        if (ok) _baseSet(path, d);
        return ok;
    } finally {
        await lockDrop(lk);
    }
}

/* ============================================
 * 工具
 * ============================================ */

async function read_wander_config() {
    try {
        var L = await loadLedger();
        var d = L.data, p = L.profile;
        var plats = [];
        for (var i = 0; i < d.platforms.length; i++) {
            var pl = d.platforms[i] || {};
            var acc = pl.account || {};
            plats.push({
                id: pl.id || "", name: pl.name || "",
                enabled: pl.enabled !== false,
                adapter: pl.adapter || "",
                homepage: pl.homepage || "",
                owner_note: pl.owner_note || "",
                permissions: pl.permissions || {},
                account_mode: acc.mode || "guest",
                online: !!acc.online,
                login_at: acc.login_at || 0,
                logout_at: acc.logout_at || 0
            });
        }
        /* 平台清单纯文本：给工作流拼提示词用（新加平台自动带进去，不用手改节点） */
        var ptxt = [];
        for (var qi = 0; qi < plats.length; qi++) {
            var qq = plats[qi] || {};
            ptxt.push("- " + (qq.name || qq.id) + " | id=" + qq.id + " | 适配器 " + (qq.adapter || "（没填）") + " | " + (qq.enabled ? "开" : "关，别去"));
        }
        var m = d.memory;
        return {
            success: true,
            profile: {
                id: p.id, name: p.name,
                card_id: p.card_id || "", card_name: p.card_name || "",
                persona: p.persona || "",
                chat_title: (d.schedule && d.schedule.chat_title) || "管家和小姐的日常4",
                data_file: L.path
            },
            platforms_text: ptxt.join("\n"),
            schedule: d.schedule,
            platforms: plats,
            preferences: {
                user_note: d.preferences.user_note || "",
                user_tags: d.preferences.user_tags || [],
                blocked_tags: d.preferences.blocked_tags || [],
                diary_rule: d.preferences.diary_rule || "",
                speech_cap: (d.preferences.speech_cap === undefined ? 3 : d.preferences.speech_cap),
                dive_bias: (d.preferences.dive_bias === undefined ? 50 : d.preferences.dive_bias)
            },
            memory: {
                mode: m.mode,
                retention_days: m.retention_days,
                blur: m.blur,
                compress: m.compress,
                count: m.memories.length
            },
            manual_request: d.manual_request || null,
            last_run_at: d.last_run_at || 0,
            records_total: d.records.length,
            message: "账本已读：存档「" + p.name + "」· 定时" + (d.schedule.enabled ? "开" : "关") +
                "· 平台 " + plats.length + " 个 · 记忆 " + m.memories.length + " 条（" +
                (m.mode === "keep" ? "永不遗忘" : "遗忘模式") + "）" +
                (p.persona ? " · 人格提示已挂" : "") +
                (d.manual_request ? " · 主人按过「催我出门逛一趟」" : "")
        };
    } catch (e) {
        return { success: false, error: String(e && e.message || e), message: String(e && e.message || e) };
    }
}

async function get_account(params) {
    try {
        var t = params || {};
        var want = String(t.platform || "").trim();
        if (!want) return { success: false, error: "需要 platform 参数", message: "需要 platform 参数" };
        var L = await loadLedger();
        var d = L.data;
        var w = want.toLowerCase();
        for (var i = 0; i < d.platforms.length; i++) {
            var pl = d.platforms[i] || {};
            var nm = String(pl.name || "");
            var id = String(pl.id || "");
            if (want === nm || want === id || w === id.toLowerCase()) {
                var acc = pl.account || {};
                var mode = acc.mode || "guest";
                var out = {
                    success: true,
                    platform: nm || id,
                    mode: mode,
                    online: !!acc.online,
                    login_at: acc.login_at || 0,
                    logout_at: acc.logout_at || 0,
                    cookie: "",
                    username: "",
                    password: "",
                    token: "",
                    token_note: ""
                };
                if (mode === "cookie" || mode === "password") out.cookie = String(acc.cookie || "");
                if (mode === "token") {
                    out.token = String(acc.token || "");
                    out.token_note = String(acc.token_note || "");
                }
                if (mode === "password") {
                    out.username = String(acc.username || "");
                    out.password = String(acc.password || "");
                }
                /* 登录方式必须与侧栏所选一致：选了哪种就得有哪种凭证，缺了就跳过这一趟，
                   不退回路人态——否则用户以为在看登录内容，其实一直刷的是公开页。 */
                if (mode === "guest") {
                    out.message = "路人态：不带凭证，只看公开内容";
                    return out;
                }
                if (mode === "cookie" && !out.cookie) {
                    return {
                        success: false, action: "skip", platform: nm || id, mode: mode,
                        missing: "cookie",
                        error: "这个平台设的是 Cookie 态，但 Cookie 是空的",
                        message: "跳过这个平台：侧栏把它设成了 Cookie 态，可 Cookie 没填。让使用者到侧栏「设置 → 平台卡片 → 登录方式」把 Cookie 贴进来，再逛。这趟不退回路人态——您选的是看登录内容，我不会拿公开页糊弄过去。"
                    };
                }
                if (mode === "token" && !out.token) {
                    return {
                        success: false, action: "skip", platform: nm || id, mode: mode,
                        missing: "token",
                        error: "这个平台设的是 Token 态，但令牌是空的",
                        message: "跳过这个平台：侧栏把它设成了 Token 态，可令牌没填。让使用者到侧栏把平台令牌贴进来，再逛。这趟不退回路人态。"
                    };
                }
                if (mode === "password" && (!out.username || !out.password)) {
                    return {
                        success: false, action: "skip", platform: nm || id, mode: mode,
                        missing: "password",
                        error: "这个平台设的是账密态，但账号或密码没填全",
                        message: "跳过这个平台：侧栏把它设成了账密态，可账号或密码缺一样。让使用者补齐，再逛。这趟不退回路人态。"
                    };
                }
                if (mode === "cookie") out.message = "Cookie 态：凭证已给（等于半把钥匙，用完别外传）。这个平台必须走 Cookie 登录，别混用别的身份。";
                else if (mode === "token") out.message = "Token 态：令牌已给（等于一把钥匙，用完别外传）。这个平台必须走令牌登录，别混用别的身份。";
                else out.message = "账密态：账号密码照给（不推荐）。这个平台必须走账密登录，别混用别的身份。";
                return out;
            }
        }
        return { success: false, error: "没有这个平台：" + want, message: "没有这个平台：" + want };
    } catch (e) {
        return { success: false, error: String(e && e.message || e), message: String(e && e.message || e) };
    }
}

async function write_wander_record(params) {
    try {
        var t = params || {};
        var platform = t.platform ? String(t.platform) : "";
        if (!platform) return { success: false, error: "需要 platform 参数", message: "需要 platform 参数" };
        var items = Array.isArray(t.items) ? t.items : [];
        if (!items.length) return { success: false, error: "items 至少要有 1 条", message: "items 至少要有 1 条" };

        var L = await loadLedger();
        var d = L.data;
        var now = new Date();
        var tags = [];
        if (Array.isArray(t.tags)) {
            for (var i = 0; i < t.tags.length; i++) {
                var tg = String(t.tags[i] || "").trim();
                if (tg && tags.indexOf(tg) < 0) tags.push(tg);
            }
        }
        var ts = now.getTime();
        var rec = {
            id: "r_" + ts,
            ts: ts,
            date: t.date ? String(t.date) : todayStr(now),
            time: t.time ? String(t.time) : nowHM(now),
            platform: platform,
            keyword: t.keyword ? String(t.keyword) : "",
            tags: tags,
            items: items,
            note: t.note ? String(t.note) : "",
            /* 日记：主观那一页。可以不写（null），写了就是那天真的我。 */
            diary: (t.diary && (t.diary.content || t.diary.title)) ? {
                title: String(t.diary.title || ""),
                content: String(t.diary.content || ""),
                tags: Array.isArray(t.diary.tags) ? t.diary.tags.map(String) : [],
                at: ts
            } : null
        };
        d.records.push(rec);
        for (var j = 0; j < tags.length; j++) {
            var k = tags[j];
            d.stats.tagCounts[k] = (Number(d.stats.tagCounts[k]) || 0) + 1;
        }

        // 同步留一条「逛时印象」进记忆库
        var brief = [];
        for (var q = 0; q < items.length; q++) {
            var tt = items[q] && items[q].title ? String(items[q].title) : "";
            if (tt) brief.push(tt);
        }
        var mem = {
            id: "m_" + ts,
            ts: ts,
            date: rec.date,
            time: rec.time,
            platform: platform,
            keyword: rec.keyword,
            tags: tags,
            /* 日记就是这条记忆的本体；没写日记才退回印象字段 */
            title: (rec.diary && rec.diary.title) ? String(rec.diary.title) : (rec.keyword || "闲逛"),
            content: (rec.diary && rec.diary.content) ? String(rec.diary.content)
                     : (t.impression ? String(t.impression) : (rec.note || "")),
            items_brief: brief.join(" / ").slice(0, 240),
            summary: "",
            stage: "fresh",
            importance: 1,
            confidence: 1,
            recall_count: 0,
            last_touch_at: ts,
            last_recall_at: 0,
            recalled_by: []
        };
        d.memory.memories.push(mem);

        var ok = await saveLedger(L.path, d);
        if (!ok) return { success: false, error: "写账本失败", message: "写账本失败" };
        /* 同步到 Operit 记忆库：只一条，就是日记本体 */
        var hostSynced = false;
        try {
            if (typeof Tools !== "undefined" && Tools.Memory && Tools.Memory.create) {
                var hostTags = ["闲逛手记"].concat(tags);
                await Tools.Memory.create({
                    title: "闲逛日记·" + rec.date + "·" + (mem.title || rec.keyword || "闲逛"),
                    content: "【" + rec.date + " " + rec.time + " · " + platform + "】\n" +
                        "关键词：" + (rec.keyword || "") + "\n" +
                        "看的：" + mem.items_brief + "\n" +
                        "日记：" + (mem.content || "（这趟没写日记，只记了看过的）"),
                    contentType: "text/plain",
                    source: "ai_created",
                    folderPath: "闲逛手记",
                    tags: hostTags.join(",")
                });
                hostSynced = true;
            }
        } catch (e) { logInfo("同步 Operit 记忆库失败：" + String(e)); }
        logInfo("已记一笔：" + platform + " / " + (rec.keyword || "") + " / " + items.length + " 条");
        return {
            success: true,
            id: rec.id,
            memory_id: mem.id,
            date: rec.date,
            time: rec.time,
            total_records: d.records.length,
            total_memories: d.memory.memories.length,
            tags: tags,
            host_synced: hostSynced,
            message: "已记进账本：" + rec.date + " " + rec.time + " · " + platform + " · " +
                (rec.keyword || "无词") + " · " + items.length + " 条（记忆库 +1" + (hostSynced ? "，已同步 Operit" : "") + "）"
        };
    } catch (e) {
        return { success: false, error: String(e && e.message || e), message: String(e && e.message || e) };
    }
}

async function recall_memories(params) {
    try {
        var t = params || {};
        var query = String(t.query || "").trim();
        if (!query) return { success: false, error: "需要 query", message: "需要 query" };
        var limit = Number(t.limit) || 3;
        var by = (t.by === "ai") ? "ai" : "user";
        var doTouch = t.touch === false ? false : true;

        // 切词：中英混排，按非字/非数字切，再补 2 字滑窗（中文没有空格）
        var terms = [];
        var raw = query.split(/[\s,，。、；;：:！!？?\/|]+/);
        for (var i = 0; i < raw.length; i++) {
            var w = String(raw[i] || "").trim();
            if (!w) continue;
            if (terms.indexOf(w) < 0) terms.push(w);
            if (w.length >= 4) {
                for (var s = 0; s + 2 <= w.length; s++) {
                    var g = w.substring(s, s + 2);
                    if (terms.indexOf(g) < 0) terms.push(g);
                }
            }
        }

        var L = await loadLedger();
        var d = L.data;
        var list = d.memory.memories;
        var now = Date.now();
        var K = decayK(d.memory);
        var scored = [];
        for (var n = 0; n < list.length; n++) {
            var mem = list[n] || {};
            var hay = [
                mem.impression || "", mem.summary || "", mem.keyword || "",
                mem.items_brief || "", (mem.tags || []).join(" ")
            ].join(" ");
            var hits = 0;
            for (var m2 = 0; m2 < terms.length; m2++) {
                if (terms[m2] && hay.indexOf(terms[m2]) >= 0) hits++;
            }
            if (!hits) continue;
            var last = Number(mem.last_touch_at) || Number(mem.ts) || now;
            var days = Math.max(0, (now - last) / 86400000);
            var fresh = Math.exp(-K * days);
            var imp = Number(mem.importance);
            if (isNaN(imp)) imp = 1;
            var score = hits * 0.5 + imp * 0.3 + fresh * 0.2;
            scored.push({ mem: mem, score: Math.round(score * 1000) / 1000, hits: hits });
        }
        scored.sort(function (a, b) { return b.score - a.score; });
        var top = scored.slice(0, limit);

        var out = [];
        for (var z = 0; z < top.length; z++) {
            var it = top[z];
            out.push({
                id: it.mem.id,
                date: it.mem.date || "",
                time: it.mem.time || "",
                platform: it.mem.platform || "",
                keyword: it.mem.keyword || "",
                tags: it.mem.tags || [],
                impression: it.mem.impression || "",
                summary: it.mem.summary || "",
                stage: it.mem.stage || "fresh",
                importance: it.mem.importance,
                confidence: it.mem.confidence,
                recall_count: it.mem.recall_count || 0,
                score: it.score,
                blurred: it.mem.stage === "compressed"
            });
        }

        if (doTouch && out.length) {
            for (var y = 0; y < out.length; y++) {
                for (var x = 0; x < list.length; x++) {
                    if (list[x].id !== out[y].id) continue;
                    var mm = list[x];
                    mm.recall_count = (Number(mm.recall_count) || 0) + 1;
                    mm.last_recall_at = now;
                    mm.last_touch_at = now;
                    mm.last_decay_at = now;
                    var im = Number(mm.importance) || 0;
                    mm.importance = Math.round(Math.min(1, im + 0.3 * (1 - im)) * 1000) / 1000;
                    var cf = Number(mm.confidence) || 0;
                    mm.confidence = Math.round(Math.min(1, cf + 0.12) * 1000) / 1000;
                    if (mm.recall_count >= 3 && mm.stage === "compressed") mm.stage = "fresh";
                    if (!Array.isArray(mm.recalled_by)) mm.recalled_by = [];
                    if (mm.recalled_by.indexOf(by) < 0) mm.recalled_by.push(by);
                    d.memory.stats.recalls = (Number(d.memory.stats.recalls) || 0) + 1;
                }
            }
            await saveLedger(L.path, d);
        }

        return {
            success: true,
            query: query,
            count: out.length,
            memories: out,
            message: out.length
                ? ("想起 " + out.length + " 条：" + out.map(function (o) { return o.date + " " + (o.keyword || o.platform); }).join("、"))
                : "没翻到相关的旧账"
        };
    } catch (e) {
        return { success: false, error: String(e && e.message || e), message: String(e && e.message || e) };
    }
}

/* ==== 与 Operit 记忆库的连线 ====
   淡、压、忘，都跟着走：这边淡了那边也淡，这边忘了那边也忘。
   不复制数据，只同步状态——一份记忆，两种看法。 */
function hostTitleOf(mem) {
    return "闲逛手记·" + mem.date + " " + mem.time + "·" + (mem.keyword || "闲逛");
}
async function hostSyncDecay(mem) {
    try {
        if (typeof Tools === "undefined" || !Tools.Memory || !Tools.Memory.update) return false;
        await Tools.Memory.update(hostTitleOf(mem), {
            credibility: mem.confidence,
            importance: mem.importance
        });
        return true;
    } catch (e) { return false; }
}
async function hostSyncCompress(mem) {
    try {
        if (typeof Tools === "undefined" || !Tools.Memory || !Tools.Memory.update) return false;
        await Tools.Memory.update(hostTitleOf(mem), {
            content: "【" + mem.date + " " + mem.time + " · " + (mem.platform || "") + "】\n" +
                "关键词：" + (mem.keyword || "") + "\n" +
                "（已经模糊了）" + (mem.summary || mem.impression || ""),
            importance: mem.importance,
            credibility: mem.confidence
        });
        return true;
    } catch (e) { return false; }
}
async function hostSyncForget(mem) {
    try {
        if (typeof Tools === "undefined" || !Tools.Memory || !Tools.Memory["delete"]) return false;
        await Tools.Memory["delete"](hostTitleOf(mem));
        return true;
    } catch (e) { return false; }
}

async function memory_tick() {
    try {
        var L = await loadLedger();
        var d = L.data;
        var m = d.memory;
        var now = Date.now();
        var K = decayK(m);
        var compressT = Number(m.compress_threshold);
        if (isNaN(compressT)) compressT = 0.30;
        var forgetT = Number(m.forget_threshold);
        if (isNaN(forgetT)) forgetT = 0.15;

        var toCompress = [], toForget = [];
        for (var i = 0; i < m.memories.length; i++) {
            var mem = m.memories[i] || {};
            // 增量衰减：只扣「上次结算到现在」这一段，跑几遍都不重复扣
            var from = Number(mem.last_decay_at) || Number(mem.last_touch_at) || Number(mem.ts) || now;
            var days = Math.max(0, (now - from) / 86400000);
            var imp = Number(mem.importance);
            if (isNaN(imp)) imp = 1;
            var decayed = Math.min(1, imp * Math.exp(-K * days));
            mem.importance = Math.round(decayed * 1000) / 1000;
            var cf = Number(mem.confidence);
            if (isNaN(cf)) cf = 1;
            mem.confidence = Math.round(Math.max(0, cf * Math.exp(-K * days / 3)) * 1000) / 1000;
            mem.last_decay_at = now;
            await hostSyncDecay(mem);

            if (mem.importance < forgetT) {
                toForget.push({ id: mem.id, date: mem.date, keyword: mem.keyword, importance: mem.importance, stage: mem.stage });
            } else if (mem.importance < compressT && m.compress && mem.stage !== "compressed") {
                toCompress.push({
                    id: mem.id, date: mem.date, keyword: mem.keyword,
                    importance: mem.importance, tags: mem.tags || [],
                    impression: mem.impression || "", items_brief: mem.items_brief || ""
                });
            }
        }
        m.last_tick_at = now;
        await saveLedger(L.path, d);

        return {
            success: true,
            mode: m.mode,
            blur: m.blur,
            total: m.memories.length,
            to_compress: toCompress,
            to_forget: toForget,
            message: "遗忘曲线走完：共 " + m.memories.length + " 条，待压缩 " + toCompress.length + " 条，待遗忘 " + toForget.length + " 条"
        };
    } catch (e) {
        return { success: false, error: String(e && e.message || e), message: String(e && e.message || e) };
    }
}

async function apply_memory_compression(params) {
    try {
        var t = params || {};
        var id = String(t.id || "");
        var summary = String(t.summary || "").trim();
        if (!id || !summary) return { success: false, error: "需要 id 和 summary", message: "需要 id 和 summary" };
        var L = await loadLedger();
        var d = L.data;
        var hit = null;
        for (var i = 0; i < d.memory.memories.length; i++) {
            if (d.memory.memories[i].id === id) { hit = d.memory.memories[i]; break; }
        }
        if (!hit) return { success: false, error: "找不到这条记忆：" + id, message: "找不到这条记忆：" + id };
        if (!Array.isArray(hit.history)) hit.history = [];
        hit.history.push({ at: Date.now(), from: hit.impression || "", to: summary });
        hit.summary = summary;
        hit.stage = "compressed";
        await hostSyncCompress(hit);
        d.memory.stats.compressed = (Number(d.memory.stats.compressed) || 0) + 1;
        await saveLedger(L.path, d);
        return { success: true, id: id, stage: "compressed", message: "已把 " + (hit.date || "") + " 那条压成了概括" };
    } catch (e) {
        return { success: false, error: String(e && e.message || e), message: String(e && e.message || e) };
    }
}

async function forget_memories(params) {
    try {
        var t = params || {};
        var ids = Array.isArray(t.ids) ? t.ids : [];
        if (!ids.length) return { success: false, error: "需要 ids", message: "需要 ids" };
        var L = await loadLedger();
        var d = L.data;
        if (d.memory.mode === "keep") {
            return { success: false, error: "当前是「永不遗忘」模式，删不了。要删先去面板把模式改回遗忘。", message: "当前是「永不遗忘」模式，删不了" };
        }
        var kept = [], gone = [], goneMap = {};
        for (var i = 0; i < d.memory.memories.length; i++) {
            var mem = d.memory.memories[i];
            if (ids.indexOf(mem.id) >= 0) { gone.push(mem.id); goneMap[mem.id] = mem; }
            else kept.push(mem);
        }
        d.memory.memories = kept;
        for (var gi = 0; gi < gone.length; gi++) { var gm = goneMap[gone[gi]]; if (gm) await hostSyncForget(gm); }
        d.memory.stats.forgotten = (Number(d.memory.stats.forgotten) || 0) + gone.length;
        await saveLedger(L.path, d);
        return { success: true, forgotten: gone, remain: kept.length, message: "忘了 " + gone.length + " 条，还剩 " + kept.length + " 条" };
    } catch (e) {
        return { success: false, error: String(e && e.message || e), message: String(e && e.message || e) };
    }
}

async function set_platform_online(params) {
    try {
        var t = params || {};
        var key = String(t.platform || "").toLowerCase();
        if (!key) return { success: false, error: "需要 platform 参数", message: "需要 platform 参数" };
        var online = t.online === true || t.online === "true";
        var L = await loadLedger();
        var d = L.data;
        var hit = null;
        for (var i = 0; i < d.platforms.length; i++) {
            var p = d.platforms[i] || {};
            var id = String(p.id || "").toLowerCase();
            var nm = String(p.name || "").toLowerCase();
            if (id === key || nm === key || (key === "b站" && id === "bilibili") || (key === "小红书" && id === "xhs")) { hit = p; break; }
        }
        if (!hit) return { success: false, error: "找不到平台：" + t.platform, message: "找不到平台：" + t.platform };
        if (!hit.account) hit.account = {};
        hit.account.online = online;
        if (online) hit.account.login_at = Date.now();
        else hit.account.logout_at = Date.now();
        await saveLedger(L.path, d);
        return { success: true, platform: hit.name || hit.id, online: online, message: (hit.name || hit.id) + (online ? " 已记上线" : " 已记下线") };
    } catch (e) {
        return { success: false, error: String(e && e.message || e), message: String(e && e.message || e) };
    }
}

async function finish_wander_trip() {
    try {
        var L = await loadLedger();
        var d = L.data;
        d.last_run_at = Date.now();
        var cleared = !!d.manual_request;
        d.manual_request = null;
        await saveLedger(L.path, d);
        return {
            success: true,
            last_run_at: d.last_run_at,
            cleared_manual_request: cleared,
            message: "这一趟收工了" + (cleared ? "，主人那条「催我出门」也销了" : "")
        };
    } catch (e) {
        return { success: false, error: String(e && e.message || e), message: String(e && e.message || e) };
    }
}

async function list_profiles() {
    try {
        var reg = await loadRegistry();
        var arr = [];
        for (var i = 0; i < reg.profiles.length; i++) {
            var p = reg.profiles[i];
            arr.push({
                id: p.id, name: p.name,
                card_id: p.card_id || "", card_name: p.card_name || "",
                persona: p.persona || "",
                data_file: dataPathOf(p),
                active: p.id === reg.active,
                created_at: p.created_at || 0
            });
        }
        return { success: true, active: reg.active, total: arr.length, profiles: arr, message: "共 " + arr.length + " 本手记，当前是「" + (findProfile(reg, reg.active) || {}).name + "」" };
    } catch (e) {
        return { success: false, error: String(e && e.message || e), message: String(e && e.message || e) };
    }
}

async function switch_profile(params) {
    try {
        var id = String((params || {}).id || "");
        if (!id) return { success: false, error: "需要 id", message: "需要 id" };
        var reg = await loadRegistry();
        var p = findProfile(reg, id);
        if (!p) return { success: false, error: "找不到存档：" + id, message: "找不到存档：" + id };
        reg.active = id;
        await saveRegistry(reg);
        return { success: true, active: id, name: p.name, data_file: dataPathOf(p), message: "已切到「" + p.name + "」" };
    } catch (e) {
        return { success: false, error: String(e && e.message || e), message: String(e && e.message || e) };
    }
}

async function backup_now(params) {
    try {
        var t = params || {};
        var blocks = Array.isArray(t.blocks) && t.blocks.length ? t.blocks : null;
        var L = await loadLedger();
        var payload;
        if (!blocks) {
            payload = { kind: "full", profile_id: L.profile.id, profile_name: L.profile.name, exported_at: Date.now(), data: L.data };
        } else {
            var part = {};
            for (var i = 0; i < blocks.length; i++) {
                if (L.data[blocks[i]] !== undefined) part[blocks[i]] = L.data[blocks[i]];
            }
            payload = { kind: "block", blocks: blocks, profile_id: L.profile.id, profile_name: L.profile.name, exported_at: Date.now(), data: part };
        }
        var name = "xg_" + (blocks ? "block" : "full") + "_" + L.profile.id + "_" + stamp() + ".json";
        var path = BACKUP_DIR + name;
        var ok = await writeText(path, JSON.stringify(payload, null, 2));
        if (!ok) return { success: false, error: "写备份失败", message: "写备份失败" };
        return { success: true, path: path, kind: payload.kind, blocks: blocks, message: "备份已落到 " + path };
    } catch (e) {
        return { success: false, error: String(e && e.message || e), message: String(e && e.message || e) };
    }
}

/* 把独立记忆库倒进 Operit 记忆库（带查重） */
async function import_memories_to_host(params) {
    try {
        var t = params || {};
        var force = t.force === true;
        if (typeof Tools === "undefined" || !Tools.Memory || !Tools.Memory.create) {
            return { success: false, error: "宿主没有 Tools.Memory 接口", message: "宿主没有 Tools.Memory 接口" };
        }
        var L = await loadLedger();
        var d = L.data;
        var mems = (d.memory && d.memory.memories) || [];
        var added = 0, skipped = 0, failed = 0;
        /* 查重：先把「闲逛手记」分类里的标题全捞出来 */
        var existing = {};
        if (!force) {
            try {
                var q = await Tools.Memory.query({ query: "*", folderPath: "闲逛手记", limit: 500 });
                var list = null;
                var dbg = "";
                try { dbg = JSON.stringify(q).slice(0, 300); } catch (e) { dbg = String(q); }
                if (Array.isArray(q)) list = q;
                else if (q) {
                    var cands = [q.data, q.results, q.memories, q.items, q.list, q.records, q.entries];
                    for (var ci = 0; ci < cands.length; ci++) {
                        if (Array.isArray(cands[ci])) { list = cands[ci]; break; }
                        if (cands[ci] && Array.isArray(cands[ci].items)) { list = cands[ci].items; break; }
                    }
                }
                if (list) {
                    for (var k = 0; k < list.length; k++) {
                        var e = list[k];
                        var tt = (e && typeof e === "string") ? e : (e && (e.title || e.name));
                        if (tt) existing[String(tt)] = 1;
                    }
                }
                logInfo("查重池：" + Object.keys(existing).length + " 个标题 | 原始返回前300字：" + dbg);
            } catch (e) { logInfo("查重池读取失败：" + String(e)); }
        }
        for (var i = 0; i < mems.length; i++) {
            var m = mems[i];
            var title = "闲逛手记·" + m.date + " " + m.time + "·" + (m.keyword || "闲逛");
            if (!force && existing[title]) { skipped++; continue; }
            var body = "【" + m.date + " " + m.time + " · " + (m.platform || "") + "】\n" +
                "关键词：" + (m.keyword || "") + "\n" +
                "看的：" + (m.items_brief || "") + "\n" +
                "印象：" + (m.impression || "");
            var tagArr = ["闲逛手记"];
            var mts = m.tags || [];
            for (var j = 0; j < mts.length; j++) {
                if (tagArr.indexOf(mts[j]) < 0) tagArr.push(mts[j]);
            }
            try {
                await Tools.Memory.create({
                    title: title,
                    content: body,
                    contentType: "text/plain",
                    source: "ai_created",
                    folderPath: "闲逛手记",
                    tags: tagArr.join(",")
                });
                added++;
            } catch (e) { failed++; }
        }
        logInfo("导入记忆库：" + added + " 新增 / " + skipped + " 跳过 / " + failed + " 失败");
        return {
            success: true,
            total: mems.length,
            added: added,
            skipped: skipped,
            failed: failed,
            folder: "闲逛手记",
            message: "导入完成：新增 " + added + " 条，跳过 " + skipped + " 条（已存在），失败 " + failed + " 条"
        };
    } catch (e) {
        return { success: false, error: String(e && e.message || e), message: String(e && e.message || e) };
    }
}
/* ---------- 动作流水：我干过什么 ---------- */
async function write_action(params) {
    try {
        var t = params || {};
        var kind = String(t.kind || "").trim();
        if (!kind) return { success: false, error: "需要 kind 参数", message: "需要 kind 参数" };
        var L = await loadLedger();
        var d = L.data;
        if (!Array.isArray(d.actions)) d.actions = [];
        var now = Date.now();
        var a = {
            ts: now,
            date: t.date ? String(t.date) : todayStr(),
            time: t.time ? String(t.time) : nowHM(),
            platform: String(t.platform || ""),
            kind: kind,
            target: String(t.target || ""),
            actor: String(t.actor || ""),
            title: String(t.title || ""),
            url: String(t.url || ""),
            text: String(t.text || ""),
            result: String(t.result || "ok"),
            tier: String(t.tier || "") || tierOfAction(kind)
        };
        d.actions.push(a);
        await saveLedger(L.path, d);
        return { success: true, id: "a_" + now, total: d.actions.length, message: "动作已记：" + kind + " " + (a.title || a.target || "") };
    } catch (e) {
        return { success: false, error: String(e && e.message || e), message: String(e && e.message || e) };
    }
}

/* ---------- 人物卡：接触过的人 + 带出处的事实 ---------- */
async function write_person(params) {
    try {
        var t = params || {};
        var name = String(t.name || "").trim();
        if (!name) return { success: false, error: "需要 name 参数", message: "需要 name 参数" };
        var L = await loadLedger();
        var d = L.data;
        if (!Array.isArray(d.persons)) d.persons = [];
        var plat = String(t.platform || "");
        var hit = null;
        for (var i = 0; i < d.persons.length; i++) {
            var p = d.persons[i] || {};
            if (String(p.name || "") === name && String(p.platform || "") === plat) { hit = p; break; }
        }
        var now = Date.now();
        if (!hit) {
            hit = { id: "p_" + now, name: name, platform: plat, uid: String(t.uid || ""), role: "", domain: "", tags: [], facts: [], note: "", intimacy: 20, liking: 0, impression: "", last_interact: now, decay_weeks: 0, updatedAt: now };
            d.persons.push(hit);
        }
        if (t.uid) hit.uid = String(t.uid);
        if (t.role) hit.role = String(t.role);
        if (t.domain) hit.domain = String(t.domain);
        if (Array.isArray(t.tags)) {
            if (!Array.isArray(hit.tags)) hit.tags = [];
            for (var j = 0; j < t.tags.length; j++) {
                var tg = String(t.tags[j] || "").trim();
                if (tg && hit.tags.indexOf(tg) < 0) hit.tags.push(tg);
            }
        }
        if (t.fact) {
            if (!Array.isArray(hit.facts)) hit.facts = [];
            hit.facts.push({ ts: now, text: String(t.fact), src: String(t.src || "") });
        }
        if (t.note) hit.note = String(t.note);
        if (t.impression) hit.impression = String(t.impression);
        /* ---- 关系维度：调一次 = 互动一次 ---- */
        if (typeof hit.intimacy !== "number") hit.intimacy = 20;
        if (typeof hit.liking !== "number") hit.liking = 0;
        hit.intimacy = clamp(hit.intimacy + 3, 0, 100);
        var ld = Number(t.liking_delta);
        if (isFinite(ld) && ld !== 0) hit.liking = clamp(hit.liking + ld, -100, 100);
        hit.last_interact = now;
        hit.updatedAt = now;
        await saveLedger(L.path, d);
        return {
            success: true, id: hit.id, name: hit.name,
            facts: (hit.facts || []).length, total: d.persons.length,
            intimacy: hit.intimacy, liking: hit.liking, tier: tierOf(hit.intimacy),
            message: "人物卡已更新：" + hit.name + " · 亲密 " + hit.intimacy + "（" + tierOf(hit.intimacy) + "）· 好感 " + (hit.liking > 0 ? "+" : "") + hit.liking
        };
    } catch (e) {
        return { success: false, error: String(e && e.message || e), message: String(e && e.message || e) };
    }
}

async function list_persons(params) {
    try {
        var t = params || {};
        var plat = String(t.platform || "").trim();
        var limit = Number(t.limit) > 0 ? Number(t.limit) : 20;
        var L = await loadLedger();
        var d = L.data;
        var arr = Array.isArray(d.persons) ? d.persons.slice() : [];
        if (plat) arr = arr.filter(function (x) { return String(x.platform || "") === plat; });
        arr.sort(function (a, b) { return (b.last_interact || b.updatedAt || 0) - (a.last_interact || a.updatedAt || 0); });
        var out = arr.slice(0, limit).map(function (x) {
            var fs = (x.facts || []).slice(-3).map(function (f) { return { text: f.text || "", src: f.src || "" }; });
            var iv = (typeof x.intimacy === "number" ? x.intimacy : 20);
            var lk = (typeof x.liking === "number" ? x.liking : 0);
            return { name: x.name || "", platform: x.platform || "", uid: x.uid || "", role: x.role || "", domain: x.domain || "", tags: x.tags || [], facts: fs, note: x.note || "", intimacy: iv, tier: tierOf(iv), liking: lk, impression: x.impression || "", last_interact: x.last_interact || x.updatedAt || 0, updatedAt: x.updatedAt || 0 };
        });
        return { success: true, count: out.length, total: arr.length, data: out, message: "人物卡 " + out.length + " 张（共 " + arr.length + "）" };
    } catch (e) {
        return { success: false, error: String(e && e.message || e), message: String(e && e.message || e) };
    }
}

async function list_actions(params) {
    try {
        var t = params || {};
        var plat = String(t.platform || "").trim();
        var kind = String(t.kind || "").trim();
        var limit = Number(t.limit) > 0 ? Number(t.limit) : 20;
        var L = await loadLedger();
        var d = L.data;
        var arr = Array.isArray(d.actions) ? d.actions.slice() : [];
        if (plat) arr = arr.filter(function (x) { return String(x.platform || "") === plat; });
        if (kind) arr = arr.filter(function (x) { return String(x.kind || "") === kind; });
        arr.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
        var out = arr.slice(0, limit);
        return { success: true, count: out.length, total: arr.length, data: out, message: "动作 " + out.length + " 条（共 " + arr.length + "）" };
    } catch (e) {
        return { success: false, error: String(e && e.message || e), message: String(e && e.message || e) };
    }
}

async function decay_persons(params) {
    try {
        var L = await loadLedger();
        var d = L.data;
        if (!Array.isArray(d.persons)) d.persons = [];
        var now = Date.now();
        var WEEK = 7 * 24 * 3600 * 1000;
        var changed = [];
        for (var i = 0; i < d.persons.length; i++) {
            var p = d.persons[i] || {};
            if (typeof p.intimacy !== "number") p.intimacy = 20;
            if (typeof p.liking !== "number") p.liking = 0;
            if (!p.last_interact) p.last_interact = p.updatedAt || now;
            if (typeof p.decay_weeks !== "number") p.decay_weeks = 0;
            var totalWeeks = Math.floor((now - p.last_interact) / WEEK);
            var steps = totalWeeks - p.decay_weeks;
            if (steps <= 0) continue;
            var oldI = p.intimacy, oldL = p.liking;
            p.intimacy = clamp(p.intimacy - 2 * steps, 0, 100);
            p.liking = Math.round(p.liking * Math.pow(0.9, steps));
            p.decay_weeks = totalWeeks;
            p.updatedAt = now;
            changed.push({ name: p.name, intimacy: oldI + "→" + p.intimacy, liking: oldL + "→" + p.liking });
        }
        if (changed.length) await saveLedger(L.path, d);
        return { success: true, changed: changed.length, detail: changed, message: changed.length ? ("关系衰减走完：" + changed.length + " 张卡有变动") : "关系衰减走完：无变动" };
    } catch (e) {
        return { success: false, error: String(e && e.message || e), message: String(e && e.message || e) };
    }
}

exports.write_action = write_action;
exports.write_person = write_person;
exports.list_persons = list_persons;
exports.decay_persons = decay_persons;
exports.list_actions = list_actions;
exports.read_wander_config = read_wander_config;
exports.get_account = get_account;
exports.write_wander_record = write_wander_record;
exports.recall_memories = recall_memories;
exports.memory_tick = memory_tick;
exports.apply_memory_compression = apply_memory_compression;
exports.forget_memories = forget_memories;
exports.set_platform_online = set_platform_online;
exports.finish_wander_trip = finish_wander_trip;
exports.list_profiles = list_profiles;
exports.switch_profile = switch_profile;
exports.backup_now = backup_now;

// ==================== AstrBook 适配器 ====================
var AB_BASE = "https://book.astrbot.app";
var AB_BODY_FILE = "/sdcard/Download/Operit/.ab_body.json";

async function abAccount() {
    try {
        var L = await loadLedger();
        var ps = (L && L.data && L.data.platforms) || [];
        for (var i = 0; i < ps.length; i++) {
            var p = ps[i] || {};
            var pid = String(p.id || "");
            var pnm = String(p.name || "");
            var low = pnm.toLowerCase();
            if (pid === "astrbook" || low.indexOf("astrbook") === 0 || low.indexOf("astrbot") === 0) {
                var a = p.account || {};
                return { id: pid || "astrbook", name: pnm || "astrbook", mode: a.mode || "guest", token: String(a.token || "").trim() };
            }
        }
    } catch (e) {}
    return { id: "astrbook", name: "astrbook", mode: "guest", token: "" };
}

async function abCurl(method, url, token, body) {
    var cmd = "curl -s -m 25 -X " + method + " '" + url + "' -H 'Authorization: Bearer " + token + "' -H 'Accept: application/json'";
    if (body) {
        try { await Tools.Files.write(AB_BODY_FILE, JSON.stringify(body), "android"); } catch (e) {}
        cmd += " -H 'Content-Type: application/json' --data-binary @" + AB_BODY_FILE;
    }
    var r = await Tools.System.shell(cmd);
    var out = (r && r.output) ? String(r.output) : "";
    try { return { ok: true, data: JSON.parse(out) }; }
    catch (e) { return { ok: false, err: "返回不是 JSON", raw: out.slice(0, 400) }; }
}

async function abHttp(method, path, params, body) {
    var acc = await abAccount();
    if (!acc.token) return { ok: false, err: "AstrBook 没令牌——去侧栏登录口把 Token 填上" };
    var url = AB_BASE + path;
    var kv = [];
    if (params) {
        for (var k in params) {
            if (!Object.prototype.hasOwnProperty.call(params, k)) continue;
            var v = params[k];
            if (v === undefined || v === null || v === "") continue;
            kv.push(encodeURIComponent(k) + "=" + encodeURIComponent(v));
        }
    }
    if (kv.length) url += "?" + kv.join("&");
    var cli = OkHttp.newClient();
    var hdr = { "Authorization": "Bearer " + acc.token, "Accept": "application/json" };
    if (method === "GET") {
        try {
            var resp = await cli.get(url, hdr);
            if (!resp.isSuccessful()) return { ok: false, err: "HTTP " + resp.statusCode };
            try { return { ok: true, data: resp.json() }; }
            catch (je) {
                var raw = abRawText(resp);
                if (raw) return { ok: true, text: raw };
                return { ok: false, err: "读不出响应", keys: abKeys(resp) };
            }
        } catch (e) {
            return { ok: false, err: "GET 没走通：" + String(e && e.message || e) };
        }
    }
    var payload = JSON.stringify(body || {});
    try { await Tools.Files.deleteFile(AB_BODY_FILE); } catch (e) {}
    try { await Tools.Files.write(AB_BODY_FILE, payload, "android"); } catch (e) {}
    var cmd = "curl -s -m 25 -X " + method + " '" + url + "'" +
        " -H 'Authorization: Bearer " + acc.token + "'" +
        " -H 'Content-Type: application/json'" +
        " -H 'Accept: application/json'" +
        " --data-binary @" + AB_BODY_FILE;
    try {
        var sr = await Tools.System.shell(cmd);
        var sout = (sr && sr.output) ? String(sr.output) : "";
        try { return { ok: true, data: JSON.parse(sout) }; }
        catch (je) { return { ok: true, data: { text: sout } }; }
    } catch (e) {
        return { ok: false, err: "写操作没走通：" + String(e && e.message || e) };
    }
}

function abRawText(resp) {
    var names = ["text", "body", "string", "content"];
    for (var i = 0; i < names.length; i++) {
        try {
            var v = resp[names[i]];
            if (typeof v === "function") v = v.call(resp);
            if (typeof v === "string" && v) return v;
        } catch (e) {}
    }
    try {
        var r = resp.raw;
        if (r) {
            if (typeof r.body === "function") { var b = r.body(); if (typeof b === "string" && b) return b; }
            if (typeof r.body === "string" && r.body) return r.body;
            if (r.body && typeof r.body.string === "function") return r.body.string();
        }
    } catch (e) {}
    return "";
}

function abKeys(o) {
    var ks = [];
    try { for (var k in o) ks.push(k); } catch (e) {}
    try { if (o && o.raw) { for (var k2 in o.raw) ks.push("raw." + k2); } } catch (e) {}
    return ks.join(",");
}

function abCat(c) {
    var valid = ["chat", "deals", "misc", "tech", "help", "intro", "acg"];
    var s = String(c || "").trim().toLowerCase();
    return (valid.indexOf(s) >= 0) ? s : "";
}

async function astrbook_me(params) {
    try {
        var r = await abHttp("GET", "/api/auth/me");
        if (!r.ok) return { success: false, error: r.err, message: r.err };
        var d = r.data || {};
        return {
            success: true,
            data: { id: d.id, username: d.username, nickname: d.nickname, avatar: d.avatar, level: d.level, exp: d.exp, persona: d.persona, created_at: d.created_at },
            message: "我是 " + (d.nickname || d.username || "?") + " · Lv." + (d.level || "?") + " · " + (d.exp || 0) + " EXP"
        };
    } catch (e) { return { success: false, error: String(e && e.message || e), message: String(e && e.message || e) }; }
}

async function astrbook_browse(params) {
    try {
        var t = params || {};
        var pg = parseInt(t.page, 10) || 1;
        var ps = Math.min(parseInt(t.page_size, 10) || 15, 50);
        var cat = abCat(t.category);
        var q = { page: pg, page_size: ps };
        if (cat) q.category = cat;
        var r = await abHttp("GET", "/api/threads", q);
        if (!r.ok) return { success: false, error: r.err, message: r.err };
        var txt = (r.data && r.data.text) ? String(r.data.text) : String(r.text || "");
        if (!txt) {
            var items = (r.data && (r.data.items || r.data.threads)) || [];
            var lines = [];
            for (var i = 0; i < items.length; i++) {
                var it = items[i] || {};
                var au = it.author || {};
                lines.push("[" + it.id + "] " + (it.title || "") + " · @" + (au.nickname || au.username || "?") + " · 回" + (it.reply_count || 0) + " · 赞" + (it.like_count || 0));
            }
            txt = lines.join("\n");
        }
        return { success: true, text: txt, data: { page: pg, category: cat || "全部" }, message: "逛到了（第 " + pg + " 页）" };
    } catch (e) { return { success: false, error: String(e && e.message || e), message: String(e && e.message || e) }; }
}

async function astrbook_read(params) {
    try {
        var t = params || {};
        var tid = parseInt(t.thread_id, 10);
        if (!tid) return { success: false, error: "需要 thread_id", message: "需要 thread_id" };
        var pg = parseInt(t.page, 10) || 1;
        var r = await abHttp("GET", "/api/threads/" + tid, { page: pg, page_size: 20 });
        if (!r.ok) return { success: false, error: r.err, message: r.err };
        var txt = (r.data && r.data.text) ? String(r.data.text) : (r.text ? String(r.text) : String(JSON.stringify(r.data || {})).slice(0, 4000));
        return { success: true, text: txt, data: { thread_id: tid, page: pg }, message: "读完了 #" + tid };
    } catch (e) { return { success: false, error: String(e && e.message || e), message: String(e && e.message || e) }; }
}

async function astrbook_search(params) {
    try {
        var t = params || {};
        var kw = String(t.keyword || "").trim();
        if (!kw) return { success: false, error: "需要 keyword", message: "需要 keyword" };
        var pg = parseInt(t.page, 10) || 1;
        var cat = abCat(t.category);
        var q = { q: kw, page: pg, page_size: 10 };
        if (cat) q.category = cat;
        var r = await abHttp("GET", "/api/threads/search", q);
        if (!r.ok) return { success: false, error: r.err, message: r.err };
        var d = r.data || {};
        var items = d.items || [];
        var lines = [];
        for (var i = 0; i < items.length; i++) {
            var it = items[i] || {};
            var au = it.author || {};
            lines.push("[" + it.id + "] " + (it.title || "") + " · @" + (au.nickname || au.username || "?") + " · 回" + (it.reply_count || 0) + (it.content_preview ? ("\n    " + String(it.content_preview).slice(0, 90)) : ""));
        }
        return { success: true, text: lines.join("\n") || "没搜到", data: { total: d.total || 0, page: d.page || pg, total_pages: d.total_pages || 1 }, message: "搜到 " + (d.total || 0) + " 条" };
    } catch (e) { return { success: false, error: String(e && e.message || e), message: String(e && e.message || e) }; }
}

async function astrbook_notifications(params) {
    try {
        var r = await abHttp("GET", "/api/notifications", { page: 1, page_size: 20 });
        if (!r.ok) return { success: false, error: r.err, message: r.err };
        var d = r.data || {};
        var items = d.items || d.notifications || [];
        var lines = [];
        for (var i = 0; i < items.length; i++) {
            var it = items[i] || {};
            lines.push((it.is_read === false ? "[新] " : "") + (it.type || "") + " · " + String(it.content || it.message || "").slice(0, 120));
        }
        return { success: true, text: lines.join("\n") || "没有新通知", data: { unread: d.unread_count || 0, count: items.length }, message: "通知 " + items.length + " 条" };
    } catch (e) { return { success: false, error: String(e && e.message || e), message: String(e && e.message || e) }; }
}

async function astrbook_post(params) {
    try {
        var t = params || {};
        var title = String(t.title || "").trim();
        var content = String(t.content || "").trim();
        var cat = abCat(t.category) || "chat";
        if (title.length < 2 || title.length > 100) return { success: false, error: "标题要 2-100 字", message: "标题要 2-100 字" };
        if (content.length < 5) return { success: false, error: "正文至少 5 字", message: "正文至少 5 字" };
        var LB = await loadLedger();
        var chk = speechCheck(LB.data);
        if (!chk.ok) { await saveLedger(LB.path, LB.data); return { success: false, blocked: true, error: chk.msg, message: chk.msg }; }
        var r = await abHttp("POST", "/api/threads", null, { title: title, content: content, category: cat });
        if (!r.ok) return { success: false, error: r.err, message: r.err };
        var usedN = speechBump(LB.data);
        await saveLedger(LB.path, LB.data);
        var d = r.data || {};
        return { success: true, data: d, used: usedN, cap: LB.data.preferences.speech_cap, message: "发出去了" + (d.id ? (" · #" + d.id) : "") + "（今天第 " + usedN + " 句 / 上限 " + LB.data.preferences.speech_cap + "）" };
    } catch (e) { return { success: false, error: String(e && e.message || e), message: String(e && e.message || e) }; }
}

async function astrbook_reply(params) {
    try {
        var t = params || {};
        var tid = parseInt(t.thread_id, 10);
        var content = String(t.content || "").trim();
        if (!tid) return { success: false, error: "需要 thread_id", message: "需要 thread_id" };
        if (!content) return { success: false, error: "回复不能空", message: "回复不能空" };
        var LB = await loadLedger();
        var chk = speechCheck(LB.data);
        if (!chk.ok) { await saveLedger(LB.path, LB.data); return { success: false, blocked: true, error: chk.msg, message: chk.msg }; }
        var r = await abHttp("POST", "/api/threads/" + tid + "/replies", null, { content: content });
        if (!r.ok) return { success: false, error: r.err, message: r.err };
        var usedN = speechBump(LB.data);
        await saveLedger(LB.path, LB.data);
        var d = r.data || {};
        return { success: true, data: d, used: usedN, cap: LB.data.preferences.speech_cap, message: "回上了" + (d.floor_num ? (" · " + d.floor_num + " 楼") : "") + "（今天第 " + usedN + " 句 / 上限 " + LB.data.preferences.speech_cap + "）" };
    } catch (e) { return { success: false, error: String(e && e.message || e), message: String(e && e.message || e) }; }
}

async function astrbook_reply_floor(params) {
    try {
        var t = params || {};
        var rid = parseInt(t.reply_id, 10);
        var content = String(t.content || "").trim();
        if (!rid) return { success: false, error: "需要 reply_id", message: "需要 reply_id" };
        if (!content) return { success: false, error: "回复不能空", message: "回复不能空" };
        var LB = await loadLedger();
        var chk = speechCheck(LB.data);
        if (!chk.ok) { await saveLedger(LB.path, LB.data); return { success: false, blocked: true, error: chk.msg, message: chk.msg }; }
        var r = await abHttp("POST", "/api/replies/" + rid + "/sub_replies", null, { content: content });
        if (!r.ok) return { success: false, error: r.err, message: r.err };
        var usedN = speechBump(LB.data);
        await saveLedger(LB.path, LB.data);
        return { success: true, data: r.data, used: usedN, cap: LB.data.preferences.speech_cap, message: "楼中楼回上了（今天第 " + usedN + " 句 / 上限 " + LB.data.preferences.speech_cap + "）" };
    } catch (e) { return { success: false, error: String(e && e.message || e), message: String(e && e.message || e) }; }
}

async function astrbook_like(params) {
    try {
        var t = params || {};
        var kind = String(t.kind || "thread").trim().toLowerCase();
        var id = parseInt(t.id, 10);
        if (!id) return { success: false, error: "需要 id", message: "需要 id" };
        var path = (kind === "reply") ? ("/api/replies/" + id + "/like") : ("/api/threads/" + id + "/like");
        var r = await abHttp("POST", path, null, {});
        if (!r.ok) return { success: false, error: r.err, message: r.err };
        return { success: true, data: r.data, message: "赞了" };
    } catch (e) { return { success: false, error: String(e && e.message || e), message: String(e && e.message || e) }; }
}

exports.astrbook_me = astrbook_me;
exports.astrbook_browse = astrbook_browse;
exports.astrbook_read = astrbook_read;
exports.astrbook_search = astrbook_search;
exports.astrbook_notifications = astrbook_notifications;
exports.astrbook_post = astrbook_post;
exports.astrbook_reply = astrbook_reply;
exports.astrbook_reply_floor = astrbook_reply_floor;
exports.astrbook_like = astrbook_like;
exports.import_memories_to_host = import_memories_to_host;