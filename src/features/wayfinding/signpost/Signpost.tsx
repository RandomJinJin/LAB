/**
 * Signpost — 路标雕塑
 * 数据驱动：遍历 SIGNS 配置，渲染每块 Sign
 * 不在代码中硬编码任何方向牌
 *
 * 顶端额外挂一个 LogoCircle（空心圆，留给 logo）
 * 底部挂一个 GroundShadow（表示水平地面）
 */
import { useEffect, useRef, useState } from "react";
import { SIGNS, LOGO_CONFIG, POLE_CONFIG } from "../data/signs";
import { Pole } from "./Pole";
import { Sign } from "./Sign";
import { LogoCircle } from "./LogoCircle";
import { GroundShadow } from "./GroundShadow";
import { SpeechBubble } from "./SpeechBubble";
import { RoundSpeechBubble } from "./RoundSpeechBubble";
import { gsap } from "gsap";
import type * as THREE from "three";
import type { SculptureRotationApi } from "../hooks/useSculptureRotation";
import type { SectionId } from "../types/sign";

interface SignpostProps {
  active: SectionId;
  rotation: SculptureRotationApi;
  onSignClick?: (section: SectionId) => void;
  /** 交互开关：入场镜头落位前禁用路牌/顶部圆形的 hover 与点击 */
  interactive?: boolean;
}

export function Signpost({
  active,
  rotation,
  onSignClick,
  interactive = true,
}: SignpostProps) {
  const { groupRef, handlers } = rotation;
  const [hoveredSign, setHoveredSign] = useState<SectionId | null>(null);

  // ---- 入场加载动画的部件引用 ----
  const shadowRef = useRef<THREE.Group>(null);
  const poleRef = useRef<THREE.Group>(null);
  const logoRef = useRef<THREE.Group>(null);
  // logo 缩放应围绕它自己的圆心（柱顶），而不是雕塑原点 → 单独一个缩放组定位在 LOGO_CONFIG.position
  const logoScaleRef = useRef<THREE.Group>(null);
  const signRefs = useRef<(THREE.Group | null)[]>([]);

  // ---- 整体加载动画（一次性）----
  useEffect(() => {
    const tl = gsap.timeline({
      // 每个部件的单段时长 — 想更快把这个数字调小，想更慢调大
      defaults: { duration: 0.4, ease: "back.out(1.7)" },
    });
    // 抛硬币用的独立时钟 tween（在 pole 峰值帧触发），便于在清理时一并 kill
    let logoShot: gsap.core.Tween | undefined;

    // 1) groundShadow：黑色圆片就地水平放大（scale x/z，y 保持 1）
    //    back.out(3.5) 更强的过冲 → 最大化尺寸冲击更猛、回弹更明显
    if (shadowRef.current) {
      tl.fromTo(
        shadowRef.current.scale,
        { x: 0, y: 1, z: 0 },
        { x: 1, y: 1, z: 1, ease: "back.out(3.5)" },
        0,
      );
    }

    // 2) pole + logo：pole 在 groundShadow 阻尼回弹阶段就开始加速展开（-=0.1），冲顶时抛出 logo
    if (logoRef.current && logoScaleRef.current && poleRef.current) {
      const logo = logoRef.current; // 控制抛掷位移（上抛回落）
      const logoScale = logoScaleRef.current; // 定位在柱顶 → 围绕圆心缩放/自转，原地出现
      const pole = poleRef.current;
      const arc = { t: 0, h: 0.42, spins: Math.PI * 6 };
      // 彻底隐藏：visible=false 而非 scale=0（drei <Line> 描边线宽按屏幕像素渲染，
      // 即使 scale=0 也会坍缩成圆心的一颗黑点）；抛出时再 visible=true 显形
      logoScale.scale.setScalar(0);
      logoScale.visible = false;
      logo.position.y = 0;
      logoScale.rotation.y = 0;
      // pole 是纯几何（无 <Line>），scale=0 时会被压扁，但为稳妥同样先隐藏，开动时再显形
      pole.visible = false;

      // 抛硬币：独立 tween（不在 timeline 上），便于在清理时单独 kill
      const startToss = () => {
        if (logoShot) return; // 只抛一次
        logoScale.visible = true; // 抛出时显形（描边黑点只在此时出现）
        logoShot = gsap.to(arc, {
          t: 1,
          duration: 0.8,
          ease: "none",
          overwrite: true,
          onUpdate: () => {
            const t = arc.t;
            // 真实抛物线 y = 4·h·t(1-t)：从最终位置(0)被抛起，经顶点 h 后落回最终位置(0)
            logo.position.y = 4 * arc.h * t * (1 - t);
            // 阻尼式水平自转：围绕 logoScale 圆心自转
            logoScale.rotation.y = arc.spins * (1 - (1 - t) * (1 - t));
            // 放大：围绕 logoScale 圆心缩放（原地浮现，不产生位移）
            const r = gsap.parseEase("back.out(1.6)")(
              gsap.utils.clamp(0, 1, t / 0.3),
            );
            logoScale.scale.setScalar(r);
          },
        });
      };

      // 2) pole：立柱从底端起单端向上生长，加速展开（power2.in：越近顶部越快）
      //    logo 在 pole 冲顶完成的那一瞬抛出（onComplete，与到达顶点同步）
      tl.fromTo(
        pole.scale,
        { y: 0 },
        {
          y: 1,
          ease: "power2.in",
          onStart: () => {
            pole.visible = true; // pole 开动时显形
          },
          onComplete: startToss,
        },
        "-=0.1", // 在 groundShadow 阻尼回弹阶段就开始，而非等它完全结束
      );
    }

    // 4) 从上到下依次长出每块路牌（SIGNS 本就按 top→bottom 排列）
    SIGNS.forEach((sign, i) => {
      const group = signRefs.current[i];
      if (!group) return;
      // 路牌带 drei <Line> 描边，scale=0 会坍缩成屏幕像素黑点 → 先整体隐藏，开动时再显形
      group.visible = false;
      tl.fromTo(
        group.scale,
        { x: 0, y: 0, z: 0 },
        {
          x: 1,
          y: 1,
          z: 1,
          onStart: () => {
            group.visible = true; // 该路牌开动时显形
          },
        },
        // 第一块（i===0）用 "+=0.6" 表示等多出 0.6s —— 等 logo 抛掷回落结束再长出（间距更大）
        // 后续路牌用 "-=0.25" 前一块还没完成就开动，形成连续接龙
        // ← 想 logo 与路牌间距更大就增大 0.6；更小就减小它
        i === 0 ? "+=0.5" : "-=0.25",
      );
    });

    return () => {
      tl.kill();
      logoShot?.kill();
    };
  }, []);

  // ---- click 气泡（Σ(ﾟдﾟ)）----
  // 复用 RoundSpeechBubble 的 trigger 模式：点击 +1，重放完整「进入→停留→退出」时间线
  // 该气泡的显示和消失完全由组件内部时间线控制，与 rotate 气泡互不干扰
  const [logoBubbleTrigger, setLogoBubbleTrigger] = useState(0);

  // ---- rotate 气泡（( ๑ × ﹏ × ๑ )）----
  // 复用 RoundSpeechBubble 的 visible 模式：受控显示
  // - onWobbleStart：左右来回>3次 + 双向峰值>阈值 的第一帧 → 立即显示
  // - onFastSettle：拖拽结束、路牌回正 → 0.5s 后隐藏
  const [rotateBubbleVisible, setRotateBubbleVisible] = useState(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 晃动条件一达到（拖动过程中）→ 立即显示
    rotation.setOnWobbleStart(() => {
      // 清除任何挂起的退出计时器，新一次晃动让气泡保持显示
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
      setRotateBubbleVisible(true);
    });

    // 拖拽结束、路牌回正 → 0.5s 后隐藏
    rotation.setOnFastSettle(() => {
      // 覆盖任何挂起的计时器（重新计时）
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }
      exitTimerRef.current = setTimeout(() => {
        setRotateBubbleVisible(false);
        exitTimerRef.current = null;
      }, 500);
    });

    return () => {
      rotation.setOnWobbleStart(null);
      rotation.setOnFastSettle(null);
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
  }, [rotation]);

  // 获取 hovered 路牌的标签
  const hoveredLabel = hoveredSign
    ? SIGNS.find((s) => s.section === hoveredSign)?.label
    : null;

  return (
    <>
      <group
        ref={groupRef}
        onPointerDown={handlers.onPointerDown}
        onPointerOver={handlers.onPointerOver}
        onPointerOut={handlers.onPointerOut}
      >
        {/* 立柱 — 锚点组落在立柱底端（与 groundShadow 同 Y）*/}
        {/* 缩放组 poleRef 位于锚点原点，内部偏移 +1.7 把立柱顶回原位：*/}
        {/* 立柱底端钉死在地面，仅从底端向上局部展开（单端生长） */}
        <group position={[0, POLE_CONFIG.baseY, 0]}>
          <group ref={poleRef}>
            <group position={[0, -POLE_CONFIG.baseY, 0]}>
              <Pole />
            </group>
          </group>
        </group>

        {/* 顶端 logo 底座（空心圆），入场包裹层缩放实现「从立柱顶端原地长出」 */}
        {/* logoRef：抛掷位移；内层 logoScaleRef 定位在柱顶圆心 → 缩放围绕圆心，原地浮现 */}
        <group ref={logoRef}>
          <group ref={logoScaleRef} position={LOGO_CONFIG.position}>
            <LogoCircle
              {...LOGO_CONFIG}
              position={[0, 0, 0]}
              interactive={interactive}
              onClick={() => setLogoBubbleTrigger((t) => t + 1)}
            />
          </group>
        </group>

        {/* 地面阴影 — 让立柱有"踩在地上"的感觉 */}
        <group ref={shadowRef}>
          <GroundShadow />
        </group>

        {/* 路牌们 — 每块包一层 ref，入场时从上到下依次长出 */}
        {SIGNS.map((sign, i) => (
          <group
            key={sign.section}
            ref={(el) => {
              signRefs.current[i] = el;
            }}
          >
            <Sign
              data={sign}
              isActive={sign.section === active}
              interactive={interactive}
              onClick={() => onSignClick?.(sign.section)}
              onHover={(isHovered) =>
                setHoveredSign(isHovered ? sign.section : null)
              }
            />
          </group>
        ))}
      </group>

      {/* hover 路牌气泡 */}
      <SpeechBubble
        text={hoveredLabel || ""}
        visible={Boolean(hoveredSign)}
        minWidth={90}
        maxWidth={240}
      />

      {/* 圆形 logo 点击气泡 - trigger 模式：自包含时间线，2s 后自动消失 */}
      <RoundSpeechBubble
        text="Σ(ﾟдﾟ)"
        trigger={logoBubbleTrigger}
        position={[-1.1, 3.7, 0]}
      />

      {/* 快速旋转气泡 - visible 受控模式：晃动中显示，回正 0.5s 后消失 */}
      <RoundSpeechBubble
        text="( ๑ × ﹏ × ๑ )"
        visible={rotateBubbleVisible}
        position={[-1.1, 3.7, 0]}
      />
    </>
  );
}
