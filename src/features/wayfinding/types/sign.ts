/**
 * Signpost 类型定义
 * 描述路标雕塑中每块方向牌的配置数据
 */

import type { Vector3Tuple } from "three";

/** 导航段落 ID */
export type SectionId =
  | "home"
  | "blog"
  | "project"
  | "dudu"
  | "links"
  | "about";

/** 3D 坐标 */
export type Vec3 = Vector3Tuple;

/**
 * 路牌形状
 * - arrow       : 矩形 + 三角箭头
 *   - poleOffset  : 立柱在矩形上的位置（0 = 矩形最尾端，0.5 = 居中，1 = 矩形前端/三角起点）
 *   - arrowRatio  : 三角占总长的比例（默认 0.3）
 * - rectangle   : 纯矩形（无箭头），立柱居中
 * - hexagon     : 左右尖角六边形（pointed left/right），立柱居中
 */
export type SignShape =
  | { type: "arrow"; poleOffset: number; arrowRatio?: number }
  | { type: "rectangle" }
  | { type: "hexagon" };

/** 单块方向牌数据（数据驱动） */
export interface SignConfig {
  /** 所属 section */
  section: SectionId;
  /** 显示标签 */
  label: string;
  /** 强调色（accent） */
  color: string;
  /** 路牌形状（决定几何） */
  shape: SignShape;
  /** 沿支柱的位置 (y 轴高度) */
  position: Vec3;
  /** 初始旋转角度 (radians) */
  rotation: Vec3;
  /** 板块长度 (X 方向) */
  length: number;
  /** 板块宽度 (Y 方向) */
  width: number;
  /** 板块厚度 (Z 方向) */
  height: number;
  /** hover 时附加的细微旋转修正 (radians) */
  focusRotation: Vec3;
  /**
   * Camera Preset — 每块路牌预设的电影镜头
   *
   * 设计哲学：camera 永远框选"可阅读内容（Reading Surface）"，
   * 而非自动计算的 mesh 包围盒 / 几何中心 / 三角头尖端。
   *
   * 字段全部以"路牌局部坐标系"为参照 —— 由代码统一应用
   * sign.rotation[1]（Y 轴方位角）变换到世界坐标。
   *
   * 镜头位置公式：
   *   world_focus = sign.position + R_y(θ) · focusPoint  （backOnPole 时含 dir⊥ 偏移）
   *   world_view  = R_y(θ) · viewDirection
   *   camera_pos  = world_focus + world_view × cameraDistance + (0, cameraHeight, 0)
   *   lookAt      = world_focus
   */
  /** 镜头焦点（局部坐标）：阅读面板的几何中心
   *  - arrow   : 矩形部分中心，不含三角头
   *  - rectangle / hexagon : 整个面板中心
   */
  focusPoint: Vec3;
  /** 镜头朝向（局部坐标）：牌面法线方向
   *  - 默认 [0, 0, 1]（即牌子的 front face 方向）
   *  - 可调整以让 camera 从特定角度观察（如 3/4 视角）
   */
  viewDirection: Vec3;
  /** 镜头到 focusPoint 的距离 */
  cameraDistance: number;
  /** 放大阶段的镜头距离（更近，用于页面跳转前的 zoom 效果） */
  zoomCameraDistance?: number;
  /** 镜头在 Y 方向的额外偏移（平视 = 0；正数 = 略微俯视，负数 = 略微仰视） */
  cameraHeight: number;
  /** 镜头推拉缩放 (FOV 系数) */
  zoom: number;
  /** 过渡时长 (ms) */
  transitionDuration: number;
  /**
   * 是否走"反面贴立柱"模型：
   * - true  : 牌中心沿 rotation[1] + 90° 方向偏移 R + h/2，
   *           让牌的整张"背面"贴在立柱表面（像纸箱侧面贴柱子）
   * - false : 牌中心就在 position 处（现状，立柱可能贯穿牌中段）
   *
   * 默认 false — 不显式指定就保持旧行为
   */
  backOnPole?: boolean;
}

/** 导航项（菜单） */
export interface NavItem {
  id: SectionId;
  label: string;
  href?: string;
}
