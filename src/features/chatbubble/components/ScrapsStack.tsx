import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import type { Dudu } from "../data/scraps";
import { useScraps } from "../hooks/useScraps";
import { ScrapCard, adaptiveWidth } from "./ScrapCard";
import "../styles/scraps.css";

const HOVER_Z = 60;

interface CardLayout {
  left: number;
  top: number;
  zIndex: number;
  area: string;
}

/** 估算某一高度：宽度下按文本行数推算（约 27px/行 + 上下留白） */
function estimateHeight(w: number, content: string): number {
  const charsPerLine = Math.max(Math.floor(w / 16), 4);
  const lines = Math.ceil(content.length / charsPerLine);
  return Math.round(40 + lines * 27);
}

interface PlacedBox {
  left: number;
  top: number;
  w: number;
  h: number;
}

/** 两个盒子的重叠面积 */
function overlapArea(a: PlacedBox, b: PlacedBox): number {
  const w = Math.min(a.left + a.w, b.left + b.w) - Math.max(a.left, b.left);
  const h = Math.min(a.top + a.h, b.top + b.h) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
}

/**
 * 碰撞感知的散落布局：
 * - 大卡片先放，小卡片后放填缝
 * - 整区域均匀分布，不集中在中央
 * - 拒绝大幅覆盖（重叠占比 > 25% 的候选点），避免大泡完全盖住小泡
 */
function buildLayouts(
  dudus: Dudu[],
  width: number,
  height: number,
): Record<string, CardLayout> {
  const result: Record<string, CardLayout> = {};
  const placed: PlacedBox[] = [];
  const margin = 8;

  /* 屏幕中央留出的空位：气泡环绕它加载 */
  const holeW = Math.min(width * 0.32, height * 0.45);
  const holeH = holeW;
  const hole: PlacedBox = {
    left: (width - holeW) / 2,
    top: (height - holeH) / 2,
    w: holeW,
    h: holeH,
  };

  const items = dudus.map((dudu) => ({
    dudu,
    w: adaptiveWidth(dudu.content),
  }));

  // 大的优先放置
  items.sort((a, b) => b.w - a.w);

  for (const { dudu, w } of items) {
    const h = estimateHeight(w, dudu.content);
    const maxX = Math.max(margin, width - w - margin);
    const maxY = Math.max(margin, height - h - margin);

    let best: PlacedBox | null = null;
    let bestScore = Infinity;

    for (let attempt = 0; attempt < 80; attempt++) {
      const box: PlacedBox = {
        left: margin + Math.random() * (maxX - margin),
        top: margin + Math.random() * (maxY - margin),
        w,
        h,
      };

      let worst = 0;
      // 不得落入中央空位（重叠占比 > 40% 标为高分惩罚）
      const holeOverlap = overlapArea(box, hole) / (box.w * box.h);
      if (holeOverlap > 0.4) worst = 1 + holeOverlap;

      if (worst <= 1) {
        for (const p of placed) {
          const area = overlapArea(box, p);
          if (area <= 0) continue;
          const ratio = area / Math.min(box.w * box.h, p.w * p.h);
          if (ratio > worst) worst = ratio;
        }
      }

      if (worst <= 0.25) {
        best = box;
        break;
      }
      if (worst < bestScore) {
        bestScore = worst;
        best = box;
      }
    }

    if (best) {
      placed.push(best);
      result[dudu.id] = {
        left: Math.round(best.left),
        top: Math.round(best.top),
        zIndex: 10 + Math.floor(Math.random() * 40),
        area: `${width}x${height}`,
      };
    }
  }

  return result;
}

function StackError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <div className="scrap-card" style={{ width: 320 }}>
        <div className="scrap-card-body">
          <p className="scrap-content text-center" style={{ textIndent: 0 }}>
            纸堆被风吹跑了
          </p>
          <button
            type="button"
            className="scrap-btn mx-auto mt-5 block"
            onClick={onRetry}
          >
            再试一次
          </button>
        </div>
      </div>
    </div>
  );
}

export function ScrapsStack() {
  const { scraps, status, retry } = useScraps();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  /* 堆叠区域尺寸（略小于整个页面） */
  const deskRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = deskRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setSize({ width: rect.width, height: rect.height });
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  /* 卡片位置只生成一次，区域尺寸变化时重新生成 */
  const [layouts, setLayouts] = useState<Record<string, CardLayout>>({});

  useEffect(() => {
    const { width, height } = size;
    if (!width || !height) return;

    setLayouts(buildLayouts(scraps, width, height));
  }, [scraps, size]);

  /* 入场动画 — 消息气泡从下方弹出（GSAP timeline，back.out 回弹） */
  useLayoutEffect(() => {
    if (status !== "ready" || !deskRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".scrap-bubble",
        { opacity: 0, scale: 0.4, y: 64, transformOrigin: "50% 100%" },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.55,
          ease: "back.out(1.7)",
          stagger: 0.05,
        },
      );
    }, deskRef);

    return () => ctx.revert();
  }, [status, layouts]);

  const selected = useMemo(
    () => scraps.find((d) => d.id === selectedId) ?? null,
    [scraps, selectedId],
  );

  /* 尖角方位：左右各半、洗牌后均匀混合（避免按位置偏置到某一侧） */
  const tails = useMemo(() => {
    const dirs = scraps.map((_, i) =>
      i % 2 === 0 ? ("right" as const) : ("left" as const),
    );
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }
    const map: Record<string, "left" | "right"> = {};
    scraps.forEach((d, i) => {
      map[d.id] = dirs[i];
    });
    return map;
  }, [scraps]);

  /* Esc 关闭 + 锁定滚动 */
  useEffect(() => {
    if (!selectedId) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedId]);

  return (
    <div className="flex w-full flex-col items-center px-4 py-12 md:px-8">
      {/* 堆叠区域 — 透明背景，与页面同色 */}
      <div
        ref={deskRef}
        className="relative w-full"
        style={{ width: "100%", height: "min(76dvh, 760px)" }}
      >
        {status === "error" && <StackError onRetry={retry} />}

        {status === "ready" &&
          scraps.map((dudu, i) => {
            const layout = layouts[dudu.id];
            if (!layout) return null;

            const isSelected = selectedId === dudu.id;
            const isHovered = hoveredId === dudu.id;

            return (
              <div
                key={dudu.id}
                className="scrap-bubble"
                style={{
                  left: layout.left,
                  top: layout.top,
                  zIndex: isHovered ? HOVER_Z : layout.zIndex,
                }}
              >
                <motion.div
                  layoutId={dudu.id}
                  initial={false}
                  animate={{ opacity: isSelected ? 0 : 1 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ y: -9, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onHoverStart={() => setHoveredId(dudu.id)}
                  onHoverEnd={() => setHoveredId(null)}
                  onClick={() => setSelectedId(dudu.id)}
                  aria-hidden={isSelected || undefined}
                >
                  <ScrapCard
                    dudu={dudu}
                    variant="stack"
                    tail={tails[dudu.id] ?? "right"}
                    isHovered={isHovered}
                  />
                </motion.div>
              </div>
            );
          })}
      </div>

      {/* 点击后：卡片摊开到屏幕中央 */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="scraps-viewer"
            className="fixed inset-0 z-[300] flex items-center justify-center p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setSelectedId(null)}
            role="dialog"
            aria-modal="true"
            aria-label="卡片详情"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

            <motion.div
              layoutId={selected.id}
              className="relative"
              transition={{ type: "spring", stiffness: 230, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ScrapCard dudu={selected} variant="modal" />
            </motion.div>

            <button
              type="button"
              className="scrap-close"
              style={{ zIndex: 20 }}
              onClick={() => setSelectedId(null)}
              aria-label="关闭"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
