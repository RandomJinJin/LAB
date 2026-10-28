import type { SignConfig } from "../types/sign";
import type { LogoCircleConfig } from "../signpost/LogoCircle";
import { wayfindingColors } from "../colors";

/**
 * 方向牌数据 — 5 块牌 + 顶端 logo，按规则分布：
 *
 *   第 1 层（最顶）   : 三角箭头，立柱在矩形端 1/6 处（偏置）
 *   第 2 层          : 长矩形，立柱居中
 *   第 3 层（同 Y）  : 两个三角箭头，立柱居中，分别指向不同方向
 *   第 4 层（最底）  : 不规则六边形（pointy left/right），立柱居中
 *   顶端（最顶之上）: 空心圆（留给 logo）
 *
 * 叠放规则（每个路牌的 3D 体积不重合）：
 * - 不同 Y 层的间距 = 下层路牌的 half-width + 上层路牌的 half-width + 缓冲
 *   - 当前间距：0.225 / 0.29 / 0.315（向上依次增大，留出朝向 logo 的渐变空间）
 * - 同 Y 层的路牌必须通过反向 Y 旋转使 XZ 平面分布在相反方向，
 *   体积只在 Y 方向重叠（仅共享立柱这根线）
 * - 顶端 logo 圆的下沿与第 1 层路牌的上沿留 ~0.1 缓冲
 * - 最底路牌的下沿与立柱底端留 ~0.675 缓冲
 *
 * 设计原则：
 * - 避免数学对称、避免等距排列
 * - 每块牌长度/宽度/厚度/角度/高度都不同
 * - 看起来像多年累积的手工拼贴
 *
 * 坐标系约定：
 * +X 指向右
 * +Y 指向上
 * +Z 指向屏幕外（朝向观察者）
 *
 * 板块沿 X 轴延伸，支柱位于原点
 * 每块牌通过 Y 轴旋转（rotation[1]）指向不同方向
 */

const DEG = Math.PI / 180;

// 调色板：克制、复古、不饱和（统一从 colors.ts 读取）
const COLORS = {
  blog: wayfindingColors.accent.blog,
  project: wayfindingColors.accent.project,
  dudu: wayfindingColors.accent.dudu,
  links: wayfindingColors.accent.links,
  about: wayfindingColors.accent.about,
} as const;

export const SIGNS: SignConfig[] = [
  // ====== 第 1 层：箭头，立柱在矩形 1/6 处（偏置）======
  // Y 范围 [1.725, 2.275]，距 logo 下沿 0.105，距第 2 层 0.315
  // 矩形部分 X ∈ [-0.204, 1.02]，labelX = 0.408（不含三角头）
  {
    section: "blog",
    label: "BLOG (´-ω-`).oO",
    color: COLORS.blog,
    shape: { type: "arrow", poleOffset: 1 / 6, arrowRatio: 0.32 },
    position: [0, 2.0, 0],
    rotation: [0, -50 * DEG, -3 * DEG],
    length: 1.8,
    width: 0.55,
    height: 0.06,
    focusRotation: [0, 0, 0],
    // ===== Camera Preset =====
    // 矩形内容面板中心（不含三角头），Z = front face
    focusPoint: [0.408, 0, 0.03],
    // 牌面法线（局部坐标） — 平视正对牌面
    viewDirection: [0, 0, 1],
    // 镜头距离（focus 阶段）- 更近以便衔接 zoom
    cameraDistance: 1.5,
    // 镜头距离（zoom 阶段，更近）
    zoomCameraDistance: 0.3,
    cameraHeight: 0,
    zoom: 1.0,
    transitionDuration: 900,
  },

  // ====== 第 2 层：长矩形，立柱居中 ======
  // Y 范围 [0.99, 1.41]，距第 1 层 0.315，距第 3 层 0.29
  // backOnPole: 牌的整张"背面"贴在立柱表面（像纸箱侧面贴柱子）
  {
    section: "project",
    label: "PROJECT ( ´◔ ‸◔`)",
    color: COLORS.project,
    shape: { type: "rectangle" },
    position: [0, 1.2, 0],
    rotation: [2 * DEG, -25 * DEG, 4 * DEG],
    length: 2.1,
    width: 0.42,
    height: 0.05,
    focusRotation: [0, 0, 0],
    // ===== Camera Preset =====
    // 矩形面板中心，Z = front face
    focusPoint: [0, 0, 0.025],
    // 牌面法线（局部坐标） — 平视正对牌面
    viewDirection: [0, 0, 1],
    // 镜头距离（focus 阶段）- 更近以便衔接 zoom
    cameraDistance: 1.5,
    // 镜头距离（zoom 阶段，更近）
    zoomCameraDistance: 0.3,
    cameraHeight: 0,
    zoom: 1.0,
    transitionDuration: 900,
    backOnPole: true,
  },

  // ====== 第 3 层：两个箭头，同一 Y，以立柱为一端，分别指不同方向 ======
  // poleOffset=0：箭头尾部贴在立柱上，三角头部分别指向不同方向
  // 两牌仅共享立柱起点，3D 体积不重叠
  // 同等大小（dudu: 1.5 × 0.55, links: 1.9 × 0.55），夹角 = 105° - (-15°) = 120°
  // 105° 在 +X-Z 方向（back-right），-15° 在 +X+Z 方向（front-right），
  // 两牌都偏向右侧但前后分开，home 相机正面可见
  //
  // 矩形部分 X ∈ [0, 1.33]，labelX = 0.665（不含三角头）
  {
    section: "dudu",
    label: "DUDU (○｀ε´○)",
    color: COLORS.dudu,
    shape: { type: "arrow", poleOffset: 0, arrowRatio: 0.3 },
    position: [0, 0.4, 0],
    rotation: [-2 * DEG, 130 * DEG, 2 * DEG],
    length: 1.5,
    width: 0.55,
    height: 0.06,
    focusRotation: [0, 0, 0],
    // ===== Camera Preset =====
    // 矩形内容面板中心（不含三角头），Z = front face
    focusPoint: [0.665, 0, 0.03],
    // 牌面法线（局部坐标） — 平视正对牌面
    viewDirection: [0, 0, 1],
    cameraDistance: 5.5,
    cameraHeight: 0,
    zoom: 1.0,
    transitionDuration: 900,
  },
  {
    section: "links",
    label: "FRIENDS (◍´꒳`◍)",
    color: COLORS.links,
    shape: { type: "arrow", poleOffset: 0, arrowRatio: 0.3 },
    position: [0, 0.4, 0],
    rotation: [3 * DEG, 15 * DEG, -2 * DEG],
    length: 1.7,
    width: 0.55,
    height: 0.06,
    focusRotation: [0, 0, 0],
    // ===== Camera Preset =====
    // 矩形内容面板中心（不含三角头），Z = front face
    focusPoint: [0.665, 0, 0.03],
    // 牌面法线（局部坐标） — 平视正对牌面
    viewDirection: [0, 0, 1],
    // 镜头距离（focus 阶段）- 更近以便衔接 zoom
    cameraDistance: 1.5,
    // 镜头距离（zoom 阶段，更近）
    zoomCameraDistance: 0.3,
    cameraHeight: 0,
    zoom: 1.0,
    transitionDuration: 900,
  },

  // ====== 第 4 层：六边形（pointy left/right），立柱居中 ======
  // Y 范围 [-0.675, -0.125]，距第 3 层 0.225，距立柱底端 0.675
  // backOnPole: 牌的整张"背面"贴在立柱表面（像纸箱侧面贴柱子）
  {
    section: "about",
    label: "ABOUT ME (´∇｀)ノ",
    color: COLORS.about,
    shape: { type: "hexagon" },
    position: [0, -0.4, 0],
    rotation: [-1 * DEG, 145 * DEG, 3 * DEG],
    length: 1.55,
    width: 0.55,
    height: 0.06,
    focusRotation: [0, 0, 0],
    // ===== Camera Preset =====
    // 六边形面板中心，Z = front face
    focusPoint: [0, 0, 0.03],
    // 牌面法线（局部坐标） — 平视正对牌面
    viewDirection: [0, 0, 1],
    cameraDistance: 5.5,
    cameraHeight: 0,
    zoom: 1.0,
    transitionDuration: 900,
    backOnPole: true,
  },
];

/**
 * 顶端 logo 圆
 *
 * 位置规则：圆盘下边沿 = position.y - radius，必须刚好接触立柱顶端
 * - 立柱顶端 y = 2.55（baseY=-1.7 + height=4.25 = 2.55）
 * - 圆盘下边沿 = 3.05 - 0.5 = 2.55 ✓
 *
 * 视觉风格：模仿交通指示牌"圈中圈"
 * - 外圆盘：白色填充，黑色描边（厚度 0.08，前表面 Z=+0.04）
 * - 内环：黑色 donut（外半径 0.4，内半径 0.32），中央留白用于 logo
 * - 内环 Z 偏移 = 0.05，让其前表面 Z=+0.07 明显超过外圆盘前表面
 *   （外圆盘前 Z=+0.04），避免 z-fighting
 * - 中央 logo：圆形图片，半径 = innerRadius * 0.85 = 0.272
 */
export const LOGO_CONFIG: LogoCircleConfig = {
  position: [0, 3.05, 0],
  radius: 0.5,
  height: 0.08,
  fillColor: wayfindingColors.logo.fill,
  borderColor: wayfindingColors.logo.border,
  innerRing: {
    outerRadius: 0.4,
    innerRadius: 0.32,
    height: 0.05,
    zOffset: 0.05, // 沿 Z 方向前移到外圆盘前表面之外
    color: wayfindingColors.logo.ring,
  },
  // 不跟随全局统一 logo 图链，保持无图状态
  logoSrc: null,
};

/**
 * HOME 默认相机位置与目标（安静的世界）
 *
 * 框选规则（按页面 3×3 九宫格）：
 * - 立柱底 y=baseY=-1.7 必须落在视口底边
 * - 视口高 = 2·z·tan(9°)
 *   整柱高 4.75，要占视口 2/3：visible_h = 4.75/0.667 = 7.12 → z = 7.12/(2·tan9°)≈22.5
 * - 立柱底在视口底边：lookAt.y = baseY + visible_h/2 = -1.7 + 3.56 = 1.86
 * - 顶端 logo 上沿 y=3.02 落在上 1/3 线：(lookAt.y + visible_h/2 - 3.02)/visible_h = 0.333
 *   → (1.86 + 3.56 - 3.02)/7.12 = 33.7% from top ✓
 * - 路牌 Y 区间 [-0.675, 2.275]，中心约 0.8；lookAt.y=1.4 让路牌整体偏上，
 *   顶端 logo 与最底 about 都进入视口
 * - 横向：lookAt.x=0 让路牌居中显示
 */
export const HOME_CAMERA = {
  position: [0, 1.4, 22.5] as [number, number, number],
  target: [0, 1.4, 0] as [number, number, number],
  zoom: 1.0,
};

/**
 * 支柱参数
 *
 * 高度足以穿过所有路牌 + 顶端 logo：
 * - 底端在最底牌（about, y=-0.4）下方 → 底 y = -1.7
 * - 顶端交给 LogoCircle：圆心 y=3.05, 半径 0.5，下边沿 y=2.55
 *   → 立柱顶 y = 2.55
 * - 高度 = 2.55 - (-1.7) = 4.25
 * - 中心 y = -1.7 + 4.25/2 = 0.425
 */
export const POLE_CONFIG = {
  height: 4.25,
  radius: 0.055,
  baseY: -1.7,
};
