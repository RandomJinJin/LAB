/**
 * RoundSpeechBubble — 圆形漫画气泡（主体圆形 + 右下角尖角）
 *
 * 设计要点：
 * - 主体：基本完整的圆形，viewBox 200x200 中圆心 (100,100) 半径 80
 * - 尖角：右下角小三角（约 30°~60° 圆周范围外延到 (190,195)）
 * - 黑色偏移阴影 + 白色填充 + 黑色描边，漫画立体感
 *
 * 两种控制模式（互斥，通过传入的 prop 自动选择）：
 * - Trigger 模式（click 气泡用）：传 `trigger` 计数 prop
 *   → 计数变化时重放「进入 → 停留 → 退出」完整时间线
 * - Visible 模式（rotate 气泡用）：传 `visible` 布尔 prop
 *   → visible=true 进入并保持；visible=false 等待 visibleExitDelay 秒后退出
 *
 * 两种模式各自的进入/退出参数一致，复用同一份视觉与动画。
 */
import { useEffect, useRef } from "react";
import { Html } from "@react-three/drei";
import gsap from "gsap";
import { wayfindingColors } from "../colors";

interface RoundSpeechBubbleProps {
  /** 显示的文字内容 */
  text: string;
  /** Trigger 模式：触发计数器，变化时重新播放一次完整动画（click 气泡用） */
  trigger?: number;
  /** Html 锚点位置（3D 世界坐标） */
  position?: [number, number, number];
  /** 容器边长（px），圆形主体 */
  size?: number;
  /** Trigger 模式：停留时长（秒），不含进出动画 */
  holdDuration?: number;
  /** Visible 模式：受控显示状态（rotate 气泡用） */
  visible?: boolean;
  /** Visible 模式：visible 由 true→false 后，等待多少秒再开始退出动画 */
  visibleExitDelay?: number;
}

/** 气泡默认边长（px） */
const DEFAULT_SIZE = 130;

/** 气泡路径 — 圆形主体 + 右下角尖角（viewBox 0 0 200 200） */
const BUBBLE_PATH =
  "M 169.3 140 L 190 195 L 140 169.3 A 80 80 0 1 1 169.3 140 Z";

export function RoundSpeechBubble({
  text,
  trigger,
  position = [-1.1, 3.7, 0],
  size = DEFAULT_SIZE,
  holdDuration = 0.5,
  visible,
  visibleExitDelay = 0,
}: RoundSpeechBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  // Visible 模式专用：标记首次渲染，避免 mount 时播放一次退出动画
  const isFirstVisibleRender = useRef(true);

  // ---- Trigger 模式（click 气泡）：trigger 变化时重放完整时间线 ----
  // 保留原有行为不变：mount 时也播放一次（与原实现一致）
  useEffect(() => {
    if (visible !== undefined) return; // 当前是 Visible 模式，跳过
    const el = bubbleRef.current;
    if (!el) return;

    // 重新触发时杀掉旧动画，避免叠加
    gsap.killTweensOf(el);

    // GSAP Timeline：进入 → 停留 → 退出
    const tl = gsap.timeline();
    tl.fromTo(
      el,
      { opacity: 0, scale: 0.3, y: 20 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.4,
        ease: "back.out(1.7)",
      },
    )
      // 停留 holdDuration 秒（空 tween 只占时长）
      .to({}, { duration: holdDuration })
      // 退出
      .to(el, {
        opacity: 0,
        scale: 0.8,
        duration: 0.2,
        ease: "power2.in",
      });

    return () => {
      tl.kill();
    };
  }, [trigger, holdDuration, visible]);

  // ---- Visible 模式（rotate 气泡）：受控显示/隐藏 ----
  useEffect(() => {
    if (visible === undefined) return; // 当前是 Trigger 模式，跳过
    const el = bubbleRef.current;
    if (!el) return;

    // 首次渲染：根据初始 visible 直接 set 状态，不播动画
    if (isFirstVisibleRender.current) {
      isFirstVisibleRender.current = false;
      gsap.set(el, {
        opacity: visible ? 1 : 0,
        scale: visible ? 1 : 0.3,
        y: visible ? 0 : 20,
      });
      return;
    }

    gsap.killTweensOf(el);

    if (visible) {
      // 进入并保持（不自动退出）
      gsap.fromTo(
        el,
        { opacity: 0, scale: 0.3, y: 20 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.4,
          ease: "back.out(1.7)",
        },
      );
    } else {
      // 退出：可配置延迟（用于"回正后再等 0.5s"这类场景）
      const tl = gsap.timeline();
      if (visibleExitDelay > 0) {
        tl.to({}, { duration: visibleExitDelay });
      }
      tl.to(el, {
        opacity: 0,
        scale: 0.8,
        duration: 0.2,
        ease: "power2.in",
      });
    }
  }, [visible, visibleExitDelay]);

  return (
    <Html
      position={position}
      center
      style={{
        transition: "none",
      }}
    >
      <div
        ref={bubbleRef}
        className="pointer-events-none"
        style={{
          width: size,
          height: size,
          opacity: 0,
        }}
      >
        {/* 气泡整体 - 轻微倾斜，圆形主体 + 右下尖角 */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            transform: "rotate(-4deg)",
          }}
        >
          {/* SVG 绘制：阴影 + 主体 */}
          <svg
            viewBox="0 0 200 200"
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              display: "block",
              overflow: "visible",
            }}
          >
            {/* 黑色偏移阴影（漫画风立体感） */}
            <path
              d={BUBBLE_PATH}
              fill={wayfindingColors.bubble.shadow}
              transform="translate(4, 4)"
            />
            {/* 白色气泡主体 */}
            <path
              d={BUBBLE_PATH}
              fill={wayfindingColors.bubble.fill}
              stroke={wayfindingColors.bubble.stroke}
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>

          {/* 文字层 - 居中显示 */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12%",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                fontFamily: "'Comic Sans MS', 'Chalkboard', cursive",
                fontWeight: "bold",
                fontSize: "22px",
                letterSpacing: "0.5px",
                color: wayfindingColors.bubble.text,
                lineHeight: "1.1",
                margin: 0,
                padding: 0,
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              {text}
            </span>
          </div>
        </div>
      </div>
    </Html>
  );
}
