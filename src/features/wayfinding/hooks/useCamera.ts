import { useMemo } from "react";
import * as THREE from "three";
import { SIGNS, HOME_CAMERA, POLE_CONFIG } from "../data/signs";
import type { SectionId, SignConfig } from "../types/sign";

export interface CameraPreset {
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
  duration: number;
}

/** 动画阶段 */
export type AnimationPhase = "focus" | "zoom";

/**
 * 全局视口构图偏移 — 把所有路牌往左推
 *
 * 通过把 lookAt 目标点沿世界 +X 平移 FOCUS_OFFSET_X，
 * 同时把相机位置沿世界 +X 平移同等距离（保持视角方向不变），
 * 让路牌在视口里落在左 1/3 而不是正中央，遵循海报式构图。
 *
 * 量级说明（focus 视图 cameraDistance=5.5, FOV=18°）：
 * - 视宽 = 2·5.5·tan(9°) ≈ 1.74 单位 ≈ 100vw
 * - 0.45 单位 ≈ 26vw 偏移 — 约在左 1/3 区域
 */
const FOCUS_OFFSET_X = 0.45;

/**
 * 把 sign 局部坐标变换到世界坐标 —— 纯公式，无猜测
 *
 * 设计原则：camera 永远框选"可阅读内容（Reading Surface）"，
 * 不依赖 Three.js boundingBox / mesh.center() / 三角头尖端。
 * 每块路牌都在 SignConfig 中显式声明自己的电影镜头（Camera Preset）。
 *
 * 公式：
 *   world_focus = sign.position + R_y(θ) · focusPoint  （backOnPole 时含 dir⊥ 偏移）
 *   world_view  = R_y(θ) · viewDirection
 *   camera_pos  = world_focus + world_view × cameraDistance + (0, cameraHeight, 0)
 *   lookAt      = world_focus
 *
 * 最后整体沿 +X 平移 FOCUS_OFFSET_X，把视点中心右移，路牌在视口里靠左
 *
 * - θ = sign.rotation[1]（Y 轴方位角）
 * - focusPoint / viewDirection 是 sign 局部坐标系下的值
 * - cameraDistance 是相机到 focusPoint 的直线距离
 * - cameraHeight 是相机在 Y 方向的额外偏移（平视 = 0）
 */
function computeSignCamera(sign: SignConfig, distance?: number): CameraPreset {
  const theta = sign.rotation[1];
  const euler = new THREE.Euler(0, theta, 0, "XYZ");

  // 1) 牌中心 P（backOnPole 时沿 dir⊥ 偏移，让牌的背面贴在立柱表面）
  let px = sign.position[0];
  const py = sign.position[1];
  let pz = sign.position[2];

  if (sign.backOnPole) {
    const dir = new THREE.Vector3(1, 0, 0).applyEuler(euler);
    const perp = new THREE.Vector3()
      .crossVectors(dir, new THREE.Vector3(0, 1, 0))
      .normalize();
    const offset = POLE_CONFIG.radius + sign.height / 2;
    px += perp.x * offset;
    pz += perp.z * offset;
  }

  // 2) world_focus = P + R_y(θ) · focusPoint
  const worldFocus = new THREE.Vector3(...sign.focusPoint).applyEuler(euler);
  const focusX = px + worldFocus.x;
  const focusY = py + worldFocus.y;
  const focusZ = pz + worldFocus.z;

  // 3) world_view = R_y(θ) · viewDirection
  const worldView = new THREE.Vector3(...sign.viewDirection).applyEuler(euler);

  // 4) camera_pos = world_focus + world_view × cameraDistance + (0, cameraHeight, 0)
  // 使用传入的 distance 或 sign 的默认值
  const camDistance = distance ?? sign.cameraDistance;
  const camX = focusX + worldView.x * camDistance;
  const camY = focusY + worldView.y * camDistance + sign.cameraHeight;
  const camZ = focusZ + worldView.z * camDistance;

  // 5) 整体沿 +X 平移 FOCUS_OFFSET_X（camera 与 target 同移 → 视角方向不变，
  //    但视点中心右移 → 路牌在视口里更靠左）
  return {
    position: [camX + FOCUS_OFFSET_X, camY, camZ],
    target: [focusX + FOCUS_OFFSET_X, focusY, focusZ],
    zoom: sign.zoom,
    duration: sign.transitionDuration,
  };
}

/**
 * 根据当前 active section 和动画阶段返回相机预设
 * HOME 使用全局默认，其它使用对应 sign 的计算相机配置
 *
 * @param active 当前激活的 section
 * @param phase 动画阶段：focus（对焦）或 zoom（放大）
 */
export function useCamera(
  active: SectionId,
  phase: AnimationPhase = "focus",
): CameraPreset {
  return useMemo(() => {
    if (active === "home") {
      return {
        position: HOME_CAMERA.position,
        target: HOME_CAMERA.target,
        zoom: HOME_CAMERA.zoom,
        duration: 900,
      };
    }
    const sign = SIGNS.find((s) => s.section === active);
    if (!sign) {
      return {
        position: HOME_CAMERA.position,
        target: HOME_CAMERA.target,
        zoom: HOME_CAMERA.zoom,
        duration: 900,
      };
    }

    // zoom 阶段使用 zoomCameraDistance（如果定义），否则使用更近的距离
    if (phase === "zoom") {
      const zoomDistance = sign.zoomCameraDistance ?? 0.3;
      return computeSignCamera(sign, zoomDistance);
    }

    // focus 阶段使用默认的 cameraDistance
    return computeSignCamera(sign);
  }, [active, phase]);
}
