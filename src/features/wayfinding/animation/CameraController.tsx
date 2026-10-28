/**
 * CameraController — 让 R3F 默认相机沿位置 / lookAt 平滑过渡（GSAP 驱动）
 * - 挂载时立即把 camera 设到目标位姿（固定镜头，无 loading 位移）
 * - useFrame 持续同步 tween 当前值
 * - preset 变化时 kill 掉旧 tween 并启动新过渡
 */
import { useEffect, useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import type { CameraPreset } from "../hooks/useCamera";

interface CameraControllerProps {
  preset: CameraPreset;
}

export function CameraController({ preset }: CameraControllerProps) {
  const { camera } = useThree();

  // tween 驱动的相机状态（每帧写入相机）
  const poseRef = useRef({
    posX: preset.position[0],
    posY: preset.position[1],
    posZ: preset.position[2],
    targetX: preset.target[0],
    targetY: preset.target[1],
    targetZ: preset.target[2],
  });

  // preset 变化 → 平滑过渡
  useEffect(() => {
    gsap.killTweensOf(poseRef.current);
    gsap.to(poseRef.current, {
      posX: preset.position[0],
      posY: preset.position[1],
      posZ: preset.position[2],
      targetX: preset.target[0],
      targetY: preset.target[1],
      targetZ: preset.target[2],
      duration: (preset.duration ?? 900) / 1000,
      ease: "power2.inOut",
      overwrite: true,
    });
  }, [preset]);

  // 立即同步：首帧直接落到固定镜头，避免闪烁
  useLayoutEffect(() => {
    camera.position.set(
      preset.position[0],
      preset.position[1],
      preset.position[2],
    );
    camera.lookAt(preset.target[0], preset.target[1], preset.target[2]);
    camera.updateProjectionMatrix();
  }, [camera, preset]);

  // 每帧把 tween 当前值应用到相机
  useFrame(() => {
    const p = poseRef.current;
    camera.position.set(p.posX, p.posY, p.posZ);
    camera.lookAt(p.targetX, p.targetY, p.targetZ);
  });

  return null;
}
