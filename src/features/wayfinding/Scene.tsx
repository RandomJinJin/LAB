/**
 * Scene — Three.js 容器
 * 只负责装载 3D 世界：相机、灯光、雕塑
 */
import { CameraRig } from "./CameraRig";
import { Lighting } from "./lighting/Lighting";
import { Signpost } from "./signpost/Signpost";
import { SignAnimator } from "./animation/SignAnimator";
import { useSculptureRotation } from "./hooks/useSculptureRotation";
import { wayfindingColors } from "./colors";
import type { SectionId } from "./types/sign";
import type { AnimationPhase } from "./hooks/useCamera";

interface SceneProps {
  active: SectionId;
  phase?: AnimationPhase;
  onSignClick?: (section: SectionId) => void;
}

export function Scene({ active, phase = "focus", onSignClick }: SceneProps) {
  const sculptureRotation = useSculptureRotation(active);
  // 无入场加载镜头，固定镜头就位，交互全程可用
  const interactive = true;

  return (
    <>
      {/* 设置场景背景色 — 解决 WebGL clear color 默认黑的问题 */}
      <color attach="background" args={[wayfindingColors.pageBackground]} />

      <CameraRig active={active} phase={phase} />
      <Lighting />
      <Signpost
        active={active}
        rotation={sculptureRotation}
        onSignClick={onSignClick}
        interactive={interactive}
      />
      <SignAnimator active={active} />
    </>
  );
}
