/**
 * OutlineMaterial — 描边材质（黑线）
 * 始终是黑色，不随 section accent 变化
 */
import * as THREE from "three";
import { wayfindingColors } from "../colors";

export function createOutlineMaterial() {
  return new THREE.LineBasicMaterial({
    color: new THREE.Color(wayfindingColors.sign.outline),
    toneMapped: false,
    linewidth: 1, // 大多数 WebGL 驱动会忽略，但保留语义
  });
}
