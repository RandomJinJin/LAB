/**
 * CameraRig — 相机控制器
 * 唯一职责：根据 active section 和动画阶段计算相机预设，并交给 CameraController 平滑过渡
 */
import { useCamera, type AnimationPhase } from "./hooks/useCamera";
import { CameraController } from "./animation/CameraController";
import type { SectionId } from "./types/sign";

interface CameraRigProps {
  active: SectionId;
  phase?: AnimationPhase;
}

export function CameraRig({ active, phase = "focus" }: CameraRigProps) {
  const preset = useCamera(active, phase);
  return <CameraController preset={preset} />;
}
