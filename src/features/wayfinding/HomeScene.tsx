/**
 * HomeScene — 持有 Canvas 的根组件
 *
 * - 使用窄 FOV 透视相机（约 18°）以获得「插画感」
 * - 关闭阴影 / 抗锯齿过强
 * - 背景纯白
 * - 默认相机位置/朝向从 HOME_CAMERA 读，与数据保持一致
 */
import { Canvas } from "@react-three/fiber";
import { Scene } from "./Scene";
import { HOME_CAMERA } from "./data/signs";
import { wayfindingColors } from "./colors";
import type { SectionId } from "./types/sign";
import type { AnimationPhase } from "./hooks/useCamera";

interface HomeSceneProps {
  active: SectionId;
  phase?: AnimationPhase;
  onSignClick?: (section: SectionId) => void;
}

export function HomeScene({
  active,
  phase = "focus",
  onSignClick,
}: HomeSceneProps) {
  return (
    <Canvas
      className="home-canvas"
      camera={{
        fov: 18,
        near: 0.1,
        far: 100,
        position: HOME_CAMERA.position,
      }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
      style={{ background: wayfindingColors.pageBackground }}
      onCreated={({ camera, gl }) => {
        // Canvas 创建时立即设 lookAt，避免首帧错位
        camera.lookAt(...HOME_CAMERA.target);
        // 双重保险：也设置 WebGL clear color，防止背景显示为黑
        gl.setClearColor(wayfindingColors.pageBackground, 1);
      }}
    >
      <Scene active={active} phase={phase} onSignClick={onSignClick} />
    </Canvas>
  );
}
