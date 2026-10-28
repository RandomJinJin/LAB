/**
 * SpeechBubble - 漫画风格消息气泡
 *
 * 功能：
 * - 黑白漫画风格梯形气泡（左侧短、右侧宽）
 * - 尖角指向说话者
 * - GSAP 进入/退出动画
 * - 气泡宽度根据文字长度动态计算
 */
import { useEffect, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import gsap from "gsap";
import { wayfindingColors } from "../colors";

interface SpeechBubbleProps {
  /** 显示的文字内容 */
  text: string;
  /** 是否显示 */
  visible: boolean;
  /** 最小宽度（px） */
  minWidth?: number;
  /** 最大宽度（px） */
  maxWidth?: number;
  /** 文字左右内边距（px） */
  horizontalPadding?: number;
  /** Html 锚点位置（3D 世界坐标） */
  position?: [number, number, number];
}

/** 气泡固定高度（高度不随文字变化） */
const BUBBLE_HEIGHT = 84;

/**
 * 根据文字内容计算气泡宽度
 * - 中文字符按 1.0em 估算
 * - ASCII 字符按 0.6em 估算
 * - 颜文字/Emoji 按 1.2em 估算（略宽）
 * - 加上左右内边距得到最终宽度
 */
function calculateBubbleWidth(
  text: string,
  horizontalPadding: number,
  minWidth: number,
  maxWidth: number,
): number {
  if (!text) return minWidth;

  let units = 0;
  for (const char of text) {
    const code = char.codePointAt(0) || 0;

    // Emoji 范围（包括颜文字）
    if (
      (code >= 0x1f300 && code <= 0x1faff) || // 符号 & 表情
      (code >= 0x2600 && code <= 0x27bf) || // 杂项符号
      (code >= 0x2e80 && code <= 0x9fff)
    ) {
      // CJK 范围
      units += 1.0;
    } else if (code >= 0x4e00 && code <= 0x9fff) {
      // CJK 统一表意文字（中文）
      units += 1.0;
    } else {
      // ASCII / 半角
      units += 0.6;
    }
  }

  // 经验值：每个单位约 14px
  const computed = units * 14 + horizontalPadding * 2;
  return Math.max(minWidth, Math.min(maxWidth, computed));
}

export function SpeechBubble({
  text,
  visible,
  minWidth = 80,
  maxWidth = 240,
  horizontalPadding = 20,
  position = [1.1, 3.7, 0],
}: SpeechBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // 文字 + 颜文字等会改变宽度，因此用 state 重新计算
  const [bubbleWidth, setBubbleWidth] = useState(() =>
    calculateBubbleWidth(text, horizontalPadding, minWidth, maxWidth),
  );

  // 当文字变化时，重新计算气泡宽度
  useEffect(() => {
    setBubbleWidth(
      calculateBubbleWidth(text, horizontalPadding, minWidth, maxWidth),
    );
  }, [text, horizontalPadding, minWidth, maxWidth]);

  useEffect(() => {
    if (!bubbleRef.current) return;

    // 清理之前的动画
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    if (visible) {
      // 进入动画
      timelineRef.current = gsap.timeline();
      timelineRef.current.fromTo(
        bubbleRef.current,
        {
          opacity: 0,
          scale: 0.3,
          y: 20,
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.4,
          ease: "back.out(1.7)",
        },
      );
    } else {
      // 退出动画
      timelineRef.current = gsap.timeline();
      timelineRef.current.to(bubbleRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 0.2,
        ease: "power2.in",
      });
    }

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, [visible]);

  // 使用文字的实际渲染宽度（useLayoutEffect 替代可获得更精确值）
  const textRef = useRef<HTMLSpanElement>(null);
  const [actualWidth, setActualWidth] = useState(0);

  useEffect(() => {
    if (textRef.current) {
      // 给浏览器一帧时间完成渲染，再读取真实宽度
      const measure = () => {
        if (textRef.current) {
          setActualWidth(textRef.current.scrollWidth);
        }
      };
      measure();
      // 字体加载完成后再测一次
      const id = window.setTimeout(measure, 50);
      return () => window.clearTimeout(id);
    }
  }, [text, bubbleWidth]);

  // 最终宽度 = max(文字宽度 + 内边距, 最小宽度, 上限)
  const finalWidth = Math.max(
    minWidth,
    Math.min(maxWidth, (actualWidth || 0) + horizontalPadding * 2),
    bubbleWidth,
  );

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
          opacity: visible ? 1 : 0,
        }}
      >
        {/* 气泡整体 - 轻微倾斜，高度固定，宽度随文字变化 */}
        <div
          style={{
            position: "relative",
            width: finalWidth,
            height: BUBBLE_HEIGHT, // 固定高度
            transform: "rotate(-2deg)",
            transition: "width 0.2s ease-out",
          }}
        >
          {/* 使用 SVG 绘制梯形气泡 + 尖角，高度固定 84px */}
          <svg
            viewBox="0 0 200 105"
            preserveAspectRatio="none"
            style={{
              width: "100%",
              height: BUBBLE_HEIGHT, // 高度写死，不随宽度变化
              display: "block",
              overflow: "visible",
            }}
          >
            {/* 黑色偏移阴影（漫画风立体感） */}
            <path
              d="M 15 10 L 198 3 L 193 88 L 35 90 L 18 100 L 22 88 L 10 80 Z"
              fill={wayfindingColors.bubble.shadow}
              transform="translate(3, 3)"
            />
            {/* 白色气泡主体（梯形 + 左下尖角） */}
            <path
              d="M 15 10 L 198 3 L 193 88 L 35 90 L 18 100 L 22 88 L 10 80 Z"
              fill={wayfindingColors.bubble.fill}
              stroke={wayfindingColors.bubble.stroke}
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </svg>

          {/* 文字层 - 绝对定位覆盖在气泡上，居中显示 */}
          <div
            style={{
              position: "absolute",
              // 气泡可见区域在 viewBox(0 0 200 105) 中约 y:3~90，
              // 换算到 84px 容器后约为 top:5px, height:66px
              top: 5,
              left: 0,
              right: 0,
              height: 66, // 与气泡可见区域高度一致，保证文字居中对齐气泡中部
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: `0 ${horizontalPadding}px`,
              pointerEvents: "none",
            }}
          >
            <span
              ref={textRef}
              style={{
                fontFamily: "'Comic Sans MS', 'Chalkboard', cursive",
                fontWeight: "bold",
                fontSize: "16px",
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
