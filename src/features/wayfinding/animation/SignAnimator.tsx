/**
 * SignAnimator — Signpost 动画协调器
 *
 * 实际的 Sign 动画分布在每个 <Sign> 组件内部。
 * 这里保留一个集中入口，以便未来：
 * - 时间线编排（hover 开始 / 进行中 / 完成）
 * - 跨 sign 联动（前一 sign 退场与下一 sign 入场）
 */
import { useEffect } from "react";
import { useSignAnimation } from "../hooks/useSignAnimation";
import type { SectionId } from "../types/sign";

interface SignAnimatorProps {
  active: SectionId;
  onTimelineStart?: () => void;
  onTimelineComplete?: () => void;
}

export function SignAnimator({
  active,
  onTimelineStart,
  onTimelineComplete,
}: SignAnimatorProps) {
  const states = useSignAnimation(active);

  useEffect(() => {
    onTimelineStart?.();
    const t = setTimeout(() => onTimelineComplete?.(), 900);
    return () => clearTimeout(t);
  }, [active, onTimelineStart, onTimelineComplete]);

  // 不渲染任何 3D 对象 — 仅承载副作用
  return null;
}
