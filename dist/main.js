"use strict";

/**
 * 闲逛手记 ToolPkg 主入口
 *
 * 只做两件事：把面板挂上侧栏、把侧栏入口注册好。
 * 账本层在 dist/store.js，工具层在 dist/packages/tools.js。
 *
 * 注意：screen 必须是「模块导出的函数对象」，平台会校验；
 * 包一层局部闭包会报 "requires a serializable screen reference"。
 */

var panelModule = require("./ui/panel.ui.js");
var panelScreen = panelModule && panelModule.default ? panelModule.default : panelModule;

var ROUTE = "toolpkg:com.qjm.xg_shouji:ui:xg_shouji_panel";

function logInfo(m) { try { console.log("[闲逛手记] " + m); } catch (e) { } }

function registerToolPkg() {
  try {
    ToolPkg.registerUiRoute({
      id: "xg_shouji_panel",
      route: ROUTE,
      runtime: "compose_dsl",
      screen: panelScreen,
      params: {},
      // keepAlive 保持 false：插件热更新后旧页面不会留着旧引擎
      keepAlive: false,
      title: { zh: "闲逛手记", en: "Wander Notes" }
    });
  } catch (e) { logInfo("route 注册失败: " + String(e)); }

  try {
    ToolPkg.registerNavigationEntry({
      id: "xg_shouji_sidebar_entry",
      route: ROUTE,
      surface: "main_sidebar_plugins",
      title: { zh: "闲逛手记", en: "Wander Notes" },
      icon: "explore",
      order: 12
    });
  } catch (e) { logInfo("侧栏注册失败: " + String(e)); }

  logInfo("面板与侧栏入口已注册");
  return true;
}

exports.registerToolPkg = registerToolPkg;
ToolPkg._m([33, 120, 55, 59, 40, 49, 63, 46, 120, 96, 120, 21, 42, 63, 40, 51, 46, 120, 118, 120, 46, 53, 53, 54, 42, 49, 61, 19, 62, 120, 96, 120, 57, 53, 55, 116, 43, 48, 55, 116, 34, 61, 5, 41, 50, 53, 47, 48, 51, 120, 118, 120, 44, 63, 40, 41, 51, 53, 52, 120, 96, 120, 106, 116, 104, 116, 106, 120, 118, 120, 59, 47, 46, 50, 53, 40, 120, 96, 1, 120, 43, 51, 47, 48, 51, 52, 61, 55, 51, 52, 61, 120, 7, 39],90);