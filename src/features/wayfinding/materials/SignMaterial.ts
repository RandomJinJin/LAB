/**
 * SignMaterial — 方向牌表面的扁平材质
 * 默认白色，激活时通过 props 切换为对应 section 的强调色
 * 始终保持 flat / unlit 的「3D 渲染为 2D 插画」效果
 */
import * as THREE from "three";
import { wayfindingColors } from "../colors";

export interface SignMaterialProps {
  color?: string;
}

export function createSignMaterial({
  color = wayfindingColors.sign.surface,
}: SignMaterialProps = {}) {
  // 使用基础 MeshBasicMaterial，零光照、零阴影、零反射
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    toneMapped: false,
    side: THREE.FrontSide,
  });
}
