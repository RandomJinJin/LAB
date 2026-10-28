/**
 * 路牌几何构建器
 * 根据 shape 类型返回 Three.Shape 与标签位置
 */
import * as THREE from "three";
import type { SignShape } from "../types/sign";

export interface ShapeBuildResult {
  shape: THREE.Shape;
  /**
   * 标签文字所在的 X 位置（局部坐标）
   * - rectangle / hexagon : 整个面中心
   * - arrow               : 仅矩形部分中心（不含三角头），即 (backX + frontX) / 2
   *
   * 注意：这是几何上的"label 锚点"，并非 camera focus 点位。
   * camera focus 由 SignConfig.focusPoint 显式定义（参见 signs.ts）。
   */
  labelX: number;
}

/**
 * 构建箭头形
 *
 * 局部坐标（立柱位置 = 0）：
 *  - 矩形：从 -poleOffset*rectLength 到 (1-poleOffset)*rectLength
 *  - 三角：从 (1-poleOffset)*rectLength 到 tip
 *  - tip = (1-poleOffset)*rectLength + arrowLength
 *
 * 例如 poleOffset=1/6, rectLength=1.26, arrowLength=0.54：
 *  - 矩形在 x ∈ [-0.21, 1.05]
 *  - 三角从 x=1.05 到 x=1.59
 *  - 立柱 x=0 几乎贴着矩形的"尾端"
 */
function buildArrow(
  length: number,
  width: number,
  poleOffset: number,
  arrowRatio: number,
): ShapeBuildResult {
  const rectLength = length * (1 - arrowRatio);
  const arrowLength = length * arrowRatio;
  const halfWidth = width / 2;

  const backX = -poleOffset * rectLength;
  const frontX = (1 - poleOffset) * rectLength;
  const tipX = frontX + arrowLength;

  const shape = new THREE.Shape();
  // 顺时针：尾端下 → 矩形右下 → 尖 → 矩形右上 → 尾端上 → 闭合
  shape.moveTo(backX, -halfWidth);
  shape.lineTo(frontX, -halfWidth);
  shape.lineTo(tipX, 0);
  shape.lineTo(frontX, halfWidth);
  shape.lineTo(backX, halfWidth);
  shape.lineTo(backX, -halfWidth);

  // 标签在矩形部分的中心（不含三角头）
  const labelX = (backX + frontX) / 2;

  return { shape, labelX };
}

/**
 * 构建纯矩形
 * 立柱居中，矩形从 -L/2 到 L/2
 */
function buildRectangle(length: number, width: number): ShapeBuildResult {
  const halfLength = length / 2;
  const halfWidth = width / 2;

  const shape = new THREE.Shape();
  shape.moveTo(-halfLength, -halfWidth);
  shape.lineTo(halfLength, -halfWidth);
  shape.lineTo(halfLength, halfWidth);
  shape.lineTo(-halfLength, halfWidth);
  shape.lineTo(-halfLength, -halfWidth);

  return { shape, labelX: 0 };
}

/**
 * 构建左右尖角六边形
 * - 左右两端是尖点
 * - 上下两条边是平直的
 * - 中间两条斜边在 (length/2 * (1 - tipRatio)) 处转折
 */
function buildHexagon(length: number, width: number): ShapeBuildResult {
  const halfLength = length / 2;
  const halfWidth = width / 2;
  // 尖头占比：左右各 25% 的长度是斜边
  const tipRatio = 0.28;
  const indent = halfLength * tipRatio;

  const shape = new THREE.Shape();
  shape.moveTo(-halfLength, 0);
  shape.lineTo(-halfLength + indent, -halfWidth);
  shape.lineTo(halfLength - indent, -halfWidth);
  shape.lineTo(halfLength, 0);
  shape.lineTo(halfLength - indent, halfWidth);
  shape.lineTo(-halfLength + indent, halfWidth);
  shape.lineTo(-halfLength, 0);

  return { shape, labelX: 0 };
}

export function buildSignShape(
  signShape: SignShape,
  length: number,
  width: number,
): ShapeBuildResult {
  switch (signShape.type) {
    case "arrow": {
      const arrowRatio = signShape.arrowRatio ?? 0.3;
      return buildArrow(length, width, signShape.poleOffset, arrowRatio);
    }
    case "rectangle":
      return buildRectangle(length, width);
    case "hexagon":
      return buildHexagon(length, width);
  }
}
