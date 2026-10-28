/**
 * colors.ts — Wayfinding 页面统一配色
 *
 * 路牌页面的所有颜色都从这里读取，避免散落在各个组件里。
 * 按「部件」拆分，每个部件的颜色都可单独配置：
 * - pageBackground：页面背景
 * - pole / groundShadow：立柱与地面阴影
 * - sign：路牌牌面（含描边、文字）
 * - logo：顶部圆形（外盘、描边、内环）
 * - bubble：气泡（主体、描边、阴影、文字）
 * - nav / caption：导航与点缀灰
 * - accent：各 section 强调色
 *
 * 注意：three.js 的 THREE.Color 不解析 8 位十六进制（#rrggbbaa），
 * 遇到这类值会静默退化成白色导致配色失效。因此这里把 8 位 hex 中
 * 多余的 alpha 通道去掉，统一输出 6 位 hex 给 three.js 与 CSS 使用。
 */

const darkgray = "#3f3f3fff";
const white = readCssVar("--background", "#f5f5f5ff");

const palette = {
  /** 页面背景白色 */
  pageBackground: white,

  /** 立柱颜色 */
  pole: {
    color: darkgray,
  },

  /** 底部地面阴影 */
  groundShadow: {
    color: darkgray,
  },

  /** 路牌（牌面）配色 */
  sign: {
    /** 路牌白 — 牌面默认色（悬停前） */
    surface: white,
    /** 路牌黑 — 牌面激活/悬停色 */
    surfaceActive: darkgray,
    /** 牌面描边 */
    outline: darkgray,
    /** 标签默认文字色 */
    text: "#1A1A1A",
    /** 标签激活文字色 */
    textActive: darkgray,
  },

  /** 顶部圆形 logo 底座 */
  logo: {
    /** 外圆盘填充 */
    fill: white,
    /** 外圆盘 / 内环描边 */
    border: darkgray,
    /** 内环填充（黑色 donut） */
    ring: darkgray,
  },

  /** 气泡配色（梯形与圆形气泡共用） */
  bubble: {
    /** 气泡主体填充（白） */
    fill: white,
    /** 气泡描边 */
    stroke: darkgray,
    /** 气泡偏移阴影 */
    shadow: darkgray,
    /** 气泡文字 */
    text: darkgray,
  },

  /** 导航 & 点缀灰 */
  navMuted: "#c8c8c8",
  captionMuted: "#b5b5b5",

  /** 各 section 强调色（导航 hover/active 与牌面激活共用） */
  accent: {
    blog: "#E8C547", // Warm Yellow
    project: "#5B7A95", // Muted Blue
    dudu: "#8B7AA0", // Dusty Purple
    links: "#C97B4A", // Burnt Orange
    about: "#1A1A1A", // Pure Black
  },
} as const;

export type WayfindingColors = typeof palette;

/** 8 位十六进制（#rrggbbaa）去掉后两位 alpha 通道，其余原样返回 */
function stripAlpha(hex: string): string {
  return hex.length === 9 ? hex.slice(0, 7) : hex;
}

/** 读取全局 CSS 变量；SSR（document 不存在）或无值时回退到 fallback（统一转 6 位 hex） */
function readCssVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return stripAlpha(fallback);
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  if (!value || !value.startsWith("#")) return stripAlpha(fallback);
  return stripAlpha(value);
}

/** 递归归一化颜色值：把所有字符串颜色统一转为 6 位 hex */
function toRgb(value: unknown): unknown {
  if (typeof value === "string") return stripAlpha(value);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      out[key] = toRgb((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

/**
 * 导出的配色对象（已归一化为 6 位 hex）。
 * three.js 材质、场景背景以及 CSS 变量都从这里读取。
 */
export const wayfindingColors: WayfindingColors = toRgb(
  palette,
) as WayfindingColors;
