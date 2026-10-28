/**
 * Pole — 垂直支柱
 * 始终保持黑色，无任何动画
 * 位置由 baseY + height/2 决定，让底端严格对齐 baseY
 */
import { POLE_CONFIG } from "../data/signs";
import { wayfindingColors } from "../colors";

export function Pole() {
  return (
    <mesh position={[0, POLE_CONFIG.baseY + POLE_CONFIG.height / 2, 0]}>
      <cylinderGeometry
        args={[POLE_CONFIG.radius, POLE_CONFIG.radius, POLE_CONFIG.height, 12]}
      />
      <meshBasicMaterial
        color={wayfindingColors.pole.color}
        toneMapped={false}
      />
    </mesh>
  );
}
