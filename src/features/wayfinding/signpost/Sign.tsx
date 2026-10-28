/**
 * Sign — 单块方向牌
 *
 * 形状由 data.shape 决定（arrow / rectangle / hexagon）
 * 三层结构：
 * 1. 表面（ExtrudeGeometry，flat）
 * 2. 描边（drei <Line>，Line2 真实加粗）
 * 3. 文字标签（drei <Text>，放在矩形或形状中心）
 *
 * 当 active 时：
 * - 表面颜色从白渐变到 section accent
 * - 标签淡入
 * - 触发细微的 rotation 修正
 *
 * 点击时：
 * - 触发 onClick 回调
 * - 摄像机动画由外部 CameraController 处理
 *
 * 与立柱的"贴柱"关系由 data.backOnPole 决定：
 * - true  : 牌整张"侧面"贴在立柱表面（牌中心沿 dir⊥(θ) 方向偏移 R+h/2）
 *           group 拆成 2 层：外层定位 / 内层 X·Z 姿态
 * - false : 牌中心就在 data.position（保留旧行为，单层 group）
 */
import { useMemo, useState } from "react";
import { useSpring, animated } from "@react-spring/three";
import { Text, Line } from "@react-three/drei";
import * as THREE from "three";
import type { SignConfig } from "../types/sign";
import { buildSignShape } from "./shapeBuilders";
import { POLE_CONFIG } from "../data/signs";
import { wayfindingColors } from "../colors";

interface SignProps {
  data: SignConfig;
  isActive: boolean;
  /** 交互开关：入场镜头落位前禁用 hover 与点击 */
  interactive?: boolean;
  onClick?: () => void;
  onHover?: (isHovered: boolean) => void;
}

export function Sign({
  data,
  isActive,
  interactive = true,
  onClick,
  onHover,
}: SignProps) {
  // hover 状态
  const [isHovered, setIsHovered] = useState(false);
  // 几何 + 边点 + 标签 X — 由 shape 类型驱动
  const { geometry, edgePoints, labelX } = useMemo(() => {
    const { shape, labelX } = buildSignShape(
      data.shape,
      data.length,
      data.width,
    );

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: data.height,
      bevelEnabled: false,
    });
    // 居中：让 Z 范围为 [-height/2, +height/2]
    geometry.translate(0, 0, -data.height / 2);

    // 提取边点为 [x, y, z] 元组，配合 drei <Line segments> 使用
    const edgesGeom = new THREE.EdgesGeometry(geometry);
    const edgePoints: [number, number, number][] = [];
    const posAttr = edgesGeom.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      edgePoints.push([posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i)]);
    }

    return { geometry, edgePoints, labelX };
  }, [data.length, data.width, data.height, data.shape]);

  // ====== 牌中心位置 ======
  //
  // "侧面贴柱"（backOnPole=true）：
  //   立柱轴在原点 (0, y, 0)，立柱半径 = POLE_CONFIG.radius
  //   牌中心 P 沿 dir⊥(θ) 方向
  //   距离 = R + h/2   →   牌 length 方向的"侧边"（沿 -dir⊥ 端）刚好在立柱表面
  //
  //   几何示意（俯视，θ = rotation[1]）：
  //
  //          立柱 ○
  //           ╱
  //          ╱  (R + h/2 沿 dir⊥)
  //         ╱
  //        P ───────► dir(θ)   ← length 方向
  //        ┌──────────┐
  //        │    牌    │
  //        └──────────┘
  //        ↑
  //        -dir⊥    ← 牌这一侧贴近立柱
  //
  //   dir⊥ 用 crossVectors(dir, Y_world) 算 — 保证跟 Three.js group rotation 一致
  //
  // 旧行为（backOnPole=false）：
  //   牌中心就在 data.position（立柱轴线上）
  const finalPosition = useMemo<[number, number, number]>(() => {
    if (!data.backOnPole) {
      return [data.position[0], data.position[1], data.position[2]];
    }
    // 用 Three.js 自己的旋转算 dir，保证跟 group rotation 完全一致
    const euler = new THREE.Euler(0, data.rotation[1], 0, "XYZ");
    const dir = new THREE.Vector3(1, 0, 0).applyEuler(euler);
    // dir⊥ = dir × Y_world
    const perp = new THREE.Vector3()
      .crossVectors(dir, new THREE.Vector3(0, 1, 0))
      .normalize();
    const offset = POLE_CONFIG.radius + data.height / 2;
    return [
      data.position[0] + perp.x * offset,
      data.position[1],
      data.position[2] + perp.z * offset,
    ];
  }, [data.position, data.rotation, data.backOnPole, data.height]);

  // 表面颜色：默认路牌白，hover 或 active 时切换为路牌黑
  const { color } = useSpring({
    color:
      isHovered || isActive
        ? wayfindingColors.sign.surfaceActive
        : wayfindingColors.sign.surface,
    config: { tension: 120, friction: 26 },
  });

  // 标签透明度
  const labelSpring = useSpring({
    labelOpacity: isActive ? 1 : 0,
    config: { tension: 120, friction: 26 },
  });

  // 旋转 spring — 整体 Euler（hover 时叠加 focusRotation）
  const rotationSpring = useSpring({
    rotation: isActive
      ? [
          data.rotation[0] + data.focusRotation[0],
          data.rotation[1] + data.focusRotation[1],
          data.rotation[2] + data.focusRotation[2],
        ]
      : data.rotation,
    config: { tension: 110, friction: 24 },
  });

  // 牌姿态 spring — 只取 X/Z 两个轴（"贴柱"模型下 Y 旋转已经体现在 P 点位置里）
  const poseSpring = useSpring({
    rotation: isActive
      ? [
          data.rotation[0] + data.focusRotation[0],
          0,
          data.rotation[2] + data.focusRotation[2],
        ]
      : [data.rotation[0], 0, data.rotation[2]],
    config: { tension: 110, friction: 24 },
  });

  // 表面 mesh + 描边 + 标签 —— 公用内容
  const body = (
    <>
      {/* 表面 — 由 shape 决定的几何 */}
      <animated.mesh geometry={geometry}>
        <animated.meshBasicMaterial color={color} toneMapped={false} />
      </animated.mesh>

      {/* 描边 — 加粗（drei Line2 真实像素粗细） */}
      <Line
        points={edgePoints}
        color={wayfindingColors.sign.outline}
        lineWidth={2.8}
        segments
      />

      {/* 标签 — 放在几何中心（z 略前于正面） */}
      <animated.group position={[labelX, 0, data.height / 2 + 0.002]}>
        <Text
          fontSize={Math.min(data.width * 0.55, 0.18)}
          color={
            isActive
              ? wayfindingColors.sign.textActive
              : wayfindingColors.sign.text
          }
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.18}
          outlineWidth={0}
          // @ts-ignore drei Text 接受 fillOpacity prop
          fillOpacity={labelSpring.labelOpacity}
        >
          {data.label}
        </Text>
      </animated.group>
    </>
  );

  if (data.backOnPole) {
    // ====== "反面贴柱"模型：2 层 group ======
    // 外层：定位到 P（在立柱表面的 dir⊥(θ) 方向）
    // 内层：X/Z 姿态（牌自身倾斜，绕牌中心，不会戳到立柱）
    //
    // "绕立柱指方向"由 P 的位置（finalPosition）承担，
    // 不在 group 里再做 Y 旋转 —— 否则会让 P 绕 Y 轴画圆，离开立柱表面
    return (
      <group
        position={finalPosition}
        onPointerOver={(e) => {
          if (!interactive) return;
          e.stopPropagation();
          setIsHovered(true);
          onHover?.(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setIsHovered(false);
          onHover?.(false);
          document.body.style.cursor = "default";
        }}
        onClick={(e) => {
          if (!interactive) return;
          e.stopPropagation();
          onClick?.();
        }}
      >
        <animated.group
          rotation={poseSpring.rotation as unknown as THREE.Euler}
        >
          {body}
        </animated.group>
      </group>
    );
  }

  // ====== 旧行为：单层 group，原样 ======
  return (
    <animated.group
      position={finalPosition}
      rotation={rotationSpring.rotation as unknown as THREE.Euler}
      onPointerOver={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        setIsHovered(true);
        onHover?.(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setIsHovered(false);
        onHover?.(false);
        document.body.style.cursor = "default";
      }}
      onClick={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        onClick?.();
      }}
    >
      {body}
    </animated.group>
  );
}
