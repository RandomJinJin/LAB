import { useState, useCallback } from "react";
import type { SectionId } from "../types/sign";

/**
 * 共享当前 focus 段落的 hook
 * 任意时刻只有一个 active section
 */
export function useActiveSection() {
  const [active, setActive] = useState<SectionId>("home");

  const setSection = useCallback((id: SectionId) => {
    setActive(id);
  }, []);

  const reset = useCallback(() => {
    setActive("home");
  }, []);

  return { active, setSection, reset };
}
