import { useMemo } from "react";
import type { SectionId } from "../types/sign";
import { SIGNS } from "../data/signs";

export interface SignAnimationState {
  /** 是否处于激活态（用于触发颜色填充、标签淡入） */
  isActive: boolean;
  /** 当前需要叠加的旋转修正 */
  focusRotation: [number, number, number];
}

/**
 * 根据当前 active section 决定每块 sign 的动画态
 * 任意时刻只有一块 sign 处于 active
 */
export function useSignAnimation(active: SectionId) {
  return useMemo(() => {
    return SIGNS.map((sign) => ({
      id: sign.section,
      label: sign.label,
      color: sign.color,
      isActive: sign.section === active,
      focusRotation: sign.section === active ? sign.focusRotation : [0, 0, 0],
    }));
  }, [active]);
}
