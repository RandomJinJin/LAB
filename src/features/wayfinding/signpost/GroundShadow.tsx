/**
 * GroundShadow — 立柱底部的"地面阴影"
 *
 * 用一个黑色实心圆片表示水平地面：
 * - 位置：紧贴立柱底端（POLE_CONFIG.baseY），向下偏移一丢丢避免 z-fighting
 * - 用 CircleGeometry 生成扁平圆片
 * - 半径略大于立柱半径（约 0.18），产生"阴影感"
 * - 无需 Canvas 开启 shadows
 *
 * 视觉上让立柱不再"漂浮"在白底上，提示观看者这里有一块水平地面。
 */
import { useMemo } from "react";
import * as THREE from "three";
import { POLE_CONFIG } from "../data/signs";
import { wayfindingColors } from "../colors";

export function GroundShadow() {
  const geometry = useMemo(() => {
    return new THREE.CircleGeometry(0.18, 32);
  }, []);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, POLE_CONFIG.baseY - 0.001, 0]}
      geometry={geometry}
    >
      <meshBasicMaterial
        color={wayfindingColors.groundShadow.color}
        toneMapped={false}
      />
    </mesh>
  );
}
