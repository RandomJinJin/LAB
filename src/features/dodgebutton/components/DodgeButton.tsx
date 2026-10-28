import { useRef, useEffect, useState, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
  AnimatePresence,
} from "motion/react";

/* MDI heart path */
const HEART_PATH =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

interface DodgeButtonProps {
  playgroundRadius?: number;
  avoidanceRadius?: number;
  buttonSize?: number;
  stiffness?: number;
  damping?: number;
}

interface CursorState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  t: number;
}

interface ConfettiParticle {
  id: number;
  angle: number;
  distance: number;
  delay: number;
}

/* 将坐标限制在圆形 playground 内 */
function clampToCircle(x: number, y: number, radius: number) {
  const dist = Math.sqrt(x * x + y * y);
  if (dist <= radius) return { x, y };
  const scale = radius / dist;
  return { x: x * scale, y: y * scale };
}

export function DodgeButton({
  playgroundRadius = 120,
  avoidanceRadius = 80,
  buttonSize = 56,
  stiffness = 120,
  damping = 18,
}: DodgeButtonProps) {
  const reduceMotion = useReducedMotion();

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  /* 目标位置(弹簧的 source) */
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);

  /* 弹簧驱动的实际位置 */
  const springX = useSpring(targetX, { stiffness, damping, mass: 0.8 });
  const springY = useSpring(targetY, { stiffness, damping, mass: 0.8 });

  /* 旋转 */
  const targetRotate = useMotionValue(0);
  const springRotate = useSpring(targetRotate, {
    stiffness: 80,
    damping: 12,
  });

  /* 光标状态 */
  const cursorRef = useRef<CursorState>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    t: 0,
  });

  /* 状态标记 */
  const isCelebratingRef = useRef(false);
  const hasEscapedRef = useRef(false);
  const isFocusedRef = useRef(false);

  const [isCelebrating, setIsCelebrating] = useState(false);
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);

  /* idle 浮动相位 */
  const idlePhaseRef = useRef(0);

  /* 更新目标位置 */
  const updateTarget = useCallback(
    (tx: number, ty: number, rot: number = 0) => {
      const clamped = clampToCircle(tx, ty, playgroundRadius);
      targetX.set(clamped.x);
      targetY.set(clamped.y);
      if (rot !== undefined) targetRotate.set(rot);
    },
    [targetX, targetY, targetRotate, playgroundRadius],
  );

  /* 光标追踪 */
  useEffect(() => {
    if (reduceMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      const prev = cursorRef.current;
      const dt = Math.max(now - prev.t, 1);

      const nx = e.clientX;
      const ny = e.clientY;

      const vx = ((nx - prev.x) / dt) * 16;
      const vy = ((ny - prev.y) / dt) * 16;

      cursorRef.current = { x: nx, y: ny, vx, vy, t: now };

      if (isFocusedRef.current || isCelebratingRef.current) return;

      const btn = buttonRef.current;
      const container = containerRef.current;
      if (!btn || !container) return;

      const containerRect = container.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();

      const btnCx = btnRect.left + btnRect.width / 2 - containerRect.left;
      const btnCy = btnRect.top + btnRect.height / 2 - containerRect.top;

      const cx = nx - containerRect.left;
      const cy = ny - containerRect.top;

      const dx = cx - btnCx;
      const dy = cy - btnCy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < avoidanceRadius) {
        hasEscapedRef.current = true;

        const escapeAngle = Math.atan2(-dy, -dx) + (Math.random() - 0.5) * 0.5;
        const cursorSpeed = Math.sqrt(vx * vx + vy * vy);
        const escapeDist =
          avoidanceRadius * 0.6 + cursorSpeed * 0.5 + Math.random() * 30;

        const predictedCx = cx + vx * 2;
        const predictedCy = cy + vy * 2;
        const pdx = predictedCx - btnCx;
        const pdy = predictedCy - btnCy;
        const predictedAngle = Math.atan2(-pdy, -pdx);

        const finalAngle =
          escapeAngle * 0.5 +
          predictedAngle * 0.5 +
          (Math.random() - 0.5) * 0.3;

        const newTx = springX.get() + Math.cos(finalAngle) * escapeDist;
        const newTy = springY.get() + Math.sin(finalAngle) * escapeDist;
        const rot = (Math.random() - 0.5) * 16;

        updateTarget(newTx, newTy, rot);
      } else {
        hasEscapedRef.current = false;

        idlePhaseRef.current += 0.01;
        const idleX = Math.sin(idlePhaseRef.current) * 8;
        const idleY = Math.cos(idlePhaseRef.current * 0.7) * 6;
        const idleRot = Math.sin(idlePhaseRef.current * 0.5) * 4;

        updateTarget(idleX, idleY, idleRot);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [
    reduceMotion,
    avoidanceRadius,
    playgroundRadius,
    springX,
    springY,
    updateTarget,
  ]);

  /* 切换庆祝状态 */
  const handleToggleCelebrate = useCallback(() => {
    if (isCelebratingRef.current) {
      // 取消庆祝状态
      isCelebratingRef.current = false;
      setIsCelebrating(false);
      setConfetti([]);
    } else {
      // 开始庆祝
      isCelebratingRef.current = true;
      setIsCelebrating(true);

      const particles: ConfettiParticle[] = Array.from(
        { length: 8 },
        (_, i) => ({
          id: Date.now() + i,
          angle: (i / 8) * Math.PI * 2 + Math.random() * 0.3,
          distance: 60 + Math.random() * 40,
          delay: Math.random() * 0.1,
        }),
      );
      setConfetti(particles);

      updateTarget(0, 0, 0);

      // 彩屑动画播放后清除，但保持庆祝状态
      setTimeout(() => {
        setConfetti([]);
      }, 2000);
    }
  }, [updateTarget]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleToggleCelebrate();
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center"
      style={{
        width: playgroundRadius * 2 + buttonSize,
        height: playgroundRadius * 2 + buttonSize,
      }}
    >
      <motion.button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-label="Like"
        className={`absolute top-1/2 left-1/2 flex cursor-pointer items-center justify-center rounded-full border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
          isCelebrating
            ? "border-primary bg-primary"
            : "border-border bg-card hover:border-primary/40 hover:bg-primary/10"
        }`}
        style={{
          width: buttonSize,
          height: buttonSize,
          marginLeft: -buttonSize / 2,
          marginTop: -buttonSize / 2,
          x: springX,
          y: springY,
          rotate: springRotate,
        }}
        whileTap={isCelebrating ? { scale: 0.9 } : undefined}
        animate={
          isCelebrating
            ? {
                scale: [1, 1.3, 0.9, 1.2, 1],
              }
            : { scale: 1 }
        }
        transition={
          isCelebrating
            ? {
                duration: 0.6,
                times: [0, 0.3, 0.5, 0.8, 1],
              }
            : { type: "spring", stiffness: 300, damping: 20 }
        }
      >
        <motion.svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill={isCelebrating ? "var(--primary-foreground)" : "none"}
          stroke={
            isCelebrating
              ? "var(--primary-foreground)"
              : "var(--muted-foreground)"
          }
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={
            !isCelebrating && !reduceMotion
              ? { scale: [1, 1.08, 1] }
              : { scale: 1 }
          }
          transition={
            !isCelebrating && !reduceMotion
              ? {
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : {}
          }
        >
          <path d={HEART_PATH} />
        </motion.svg>
      </motion.button>

      <AnimatePresence>
        {isCelebrating && (
          <>
            <motion.div
              className="pointer-events-none absolute top-1/2 left-1/2 font-mono text-sm font-bold text-primary"
              style={{
                x: springX,
                y: springY,
                marginLeft: -10,
                marginTop: -50,
              }}
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [0, 1, 1, 0], y: -40 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
            >
              +1
            </motion.div>

            {confetti.map((p) => {
              const px = Math.cos(p.angle) * p.distance;
              const py = Math.sin(p.angle) * p.distance;
              return (
                <motion.div
                  key={p.id}
                  className="pointer-events-none absolute top-1/2 left-1/2"
                  style={{
                    x: springX,
                    y: springY,
                    marginLeft: -6,
                    marginTop: -6,
                  }}
                  initial={{ opacity: 1, scale: 0 }}
                  animate={{
                    opacity: [1, 1, 0],
                    scale: [0, 1, 0.5],
                    x: px,
                    y: py,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 1.2,
                    delay: p.delay,
                    ease: "easeOut",
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3 w-3"
                    fill="var(--primary)"
                  >
                    <path d={HEART_PATH} />
                  </svg>
                </motion.div>
              );
            })}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
