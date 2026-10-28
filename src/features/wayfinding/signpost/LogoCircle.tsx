/**
 * LogoCircle — 最顶端的圆形 logo 底座
 *
 * 三层结构（模仿交通指示牌的"圈中圈"风格）：
 * 1. 外圆盘（白色填充 + 黑色描边）
 * 2. 内部黑色环（donut 形状，有洞）
 * 3. 中央留白（露出下方白色，预备放 logo）
 *
 * 与 Sign 不同：没有 label、没有 active 状态、没有 spring 动画
 * 它就是雕塑的"冠"，永远静态地待在最顶端
 *
 * 位置约定：
 * - 整个组件的 position 是圆心
 * - 圆盘的「下边沿」= position.y - radius
 * - 调用方负责让下边沿刚好接触立柱顶端
 */
import { useMemo } from "react";
import { Line, useTexture } from "@react-three/drei";
import * as THREE from "three";

export interface LogoCircleConfig {
  /** 中心位置 */
  position: [number, number, number];
  /** 外圆半径 */
  radius: number;
  /** 外圆厚度 */
  height: number;
  /** 外圆填充色 */
  fillColor: string;
  /** 描边色 */
  borderColor: string;
  /** 可选：内圈黑色环（无则只渲染外圆盘） */
  innerRing?: {
    /** 黑色环外半径 */
    outerRadius: number;
    /** 黑色环内半径（中央留白半径） */
    innerRadius: number;
    /** 厚度 */
    height: number;
    /** 沿 Z 方向前移的偏移，避免与外圆盘 z-fighting */
    zOffset: number;
    /** 填充色 */
    color: string;
  };
  /** 可选：logo 图片路径，null 或 undefined 时不显示 */
  logoSrc?: string | null;
  /** 交互开关：入场镜头落位前禁用点击与 hover 指针 */
  interactive?: boolean;
  /** 点击圆形区域时的回调（不传则圆形不可点击） */
  onClick?: () => void;
}

export function LogoCircle({
  position,
  radius,
  height,
  fillColor,
  borderColor,
  innerRing,
  logoSrc,
  interactive = true,
  onClick,
}: LogoCircleConfig) {
  // 只有在 logoSrc 存在时才加载纹理
  const texture = logoSrc ? useTexture(logoSrc) : null;
  // 外圆盘几何
  const outerGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
      curveSegments: 64,
    });
    geometry.translate(0, 0, -height / 2);
    return geometry;
  }, [radius, height]);

  // 外圆盘边点
  const outerEdgePoints = useMemo(() => {
    const edgesGeom = new THREE.EdgesGeometry(outerGeometry);
    const posAttr = edgesGeom.attributes.position;
    const pts: [number, number, number][] = [];
    for (let i = 0; i < posAttr.count; i++) {
      pts.push([posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i)]);
    }
    return pts;
  }, [outerGeometry]);

  // 黑色内环（donut）几何
  const ringGeometry = useMemo(() => {
    if (!innerRing) return null;
    const { outerRadius, innerRadius, height: rh, zOffset } = innerRing;

    // 外轮廓
    const shape = new THREE.Shape();
    shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
    // 内轮廓（洞，方向相反）
    const hole = new THREE.Path();
    hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
    shape.holes.push(hole);

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: rh,
      bevelEnabled: false,
      curveSegments: 64,
    });
    // 居中后，沿 Z 方向前移 zOffset，避免与外圆盘 z-fighting
    geometry.translate(0, 0, -rh / 2 + zOffset);
    return geometry;
  }, [innerRing]);

  // 黑色内环边点（外圈 + 内圈两套边）
  const ringEdgePoints = useMemo(() => {
    if (!ringGeometry) return [];
    const edgesGeom = new THREE.EdgesGeometry(ringGeometry);
    const posAttr = edgesGeom.attributes.position;
    const pts: [number, number, number][] = [];
    for (let i = 0; i < posAttr.count; i++) {
      pts.push([posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i)]);
    }
    return pts;
  }, [ringGeometry]);

  return (
    <group position={position}>
      {/* 第 1 层：外圆盘 */}
      <mesh
        geometry={outerGeometry}
        onClick={(e) => {
          if (!interactive || !onClick) return;
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          if (!interactive || !onClick) return;
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          if (!onClick) return;
          e.stopPropagation();
          document.body.style.cursor = "";
        }}
      >
        <meshBasicMaterial color={fillColor} toneMapped={false} />
      </mesh>
      <Line
        points={outerEdgePoints}
        color={borderColor}
        lineWidth={2.8}
        segments
      />

      {/* 第 2 层：内部黑色环（带洞） */}
      {ringGeometry && (
        <>
          <mesh geometry={ringGeometry}>
            <meshBasicMaterial color={innerRing!.color} toneMapped={false} />
          </mesh>
          <Line
            points={ringEdgePoints}
            color={borderColor}
            lineWidth={2.8}
            segments
          />
        </>
      )}

      {/* 第 3 层：中央 logo 图片 */}
      {innerRing && texture && (
        <mesh position={[0, 0, innerRing.zOffset + 0.01]}>
          <circleGeometry args={[innerRing.innerRadius * 0.85, 64]} />
          <meshBasicMaterial map={texture} transparent toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
