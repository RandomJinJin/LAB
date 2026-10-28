/**
 * useSculptureRotation — HOME 模式：力反馈拖动 + 阻尼弹簧回正
 *
 * 物理模型（按新设计）：
 *
 * 1) 拖动阶段（HOME 模式）
 *    - 鼠标不是直接映射到 rotation，而是给雕塑施加"力"
 *    - position 以一定 lag 跟随 lastTarget（重物感：位移滞后于意图）
 *    - cursor velocity 用 EMA 平滑后作为"释放时初速度"
 *    - 触墙（±60°）有 35% 速度损耗 → 软墙感
 *
 * 2) 释放后（HOME 模式）
 *    - 阻尼弹簧物理（K=20, C=6, M=1 → ζ≈0.67）
 *    - 约 5% 过冲 + 1.3s 收敛 = "自然落定"
 *    - 不依赖 GSAP，纯物理在 useFrame 里跑
 *
 * 3) 进入 focus 模式（hover nav）
 *    - 立即锁定拖动，position 冻结在当前值
 *    - 相机系统接管（保持现有 react-spring 不动）
 *
 * 4) 返回 HOME 模式
 *    - GSAP tween：position → 0，back.out(1.1) 软回正 + 极轻过冲
 *    - 持续 1.3s，期间雕塑由 tween 主导
 *    - 拖动时自动 kill tween
 */

import { useEffect, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import type { SectionId } from "../types/sign";

/** Y 轴旋转范围（±60°，总计 120°） */
const MAX_ROTATION = (60 * Math.PI) / 180;

/** 鼠标灵敏度（弧度/像素） */
const SENSITIVITY = 0.0045;

/** 拖动 lag 系数：每帧 position 朝 target 移动的比例（0=完全滞后，1=瞬时） */
const DRAG_LAG = 0.2;

/** 速度 EMA 平滑系数 */
const VELOCITY_SMOOTHING = 0.4;

/** 触墙速度损耗率 */
const WALL_VELOCITY_LOSS = 0.35;

/** 速度阈值（低于此值视为停止） */
const VELOCITY_EPSILON = 0.04;

/** 快速旋转阈值：拖动中单方向峰值角速度（rad/s）超过此值，且左右双向都达到才算"晃动" */
const FAST_VELOCITY_THRESHOLD = 2.5;

/** 来回次数阈值：方向改变次数需 > 此值（即至少 4 次来回）才视为"反复晃动" */
const DIRECTION_CHANGE_THRESHOLD = 3;

/** 稳定判定阈值：position 绝对值低于此值视为已回到默认位置 */
const SETTLE_POSITION_EPSILON = 0.005;

/**
 * 阻尼弹簧参数（欠阻尼一阶系统）
 * - 自然频率 ωn = √(K/M) = √20 ≈ 4.47 rad/s
 * - 阻尼比 ζ = C / (2√(K·M)) = 6 / 8.94 ≈ 0.67
 * - 过冲约 5%，收敛约 1.3s — "重物自然回正"的手感
 */
const SPRING_K = 20;
const SPRING_C = 6;
const SPRING_M = 1;

interface SculptureState {
  /** 当前 Y 旋转（rad） */
  position: number;
  /** 当前角速度（rad/s） */
  velocity: number;
  /** 是否正在拖动 */
  isDragging: boolean;
  /** 拖动起点 X 坐标（屏幕像素） */
  pointerStartX: number;
  /** 拖动起点 rotation */
  positionStart: number;
  /** 上一帧的目标 rotation（用于 force-based 跟随 + 速度估算） */
  lastTarget: number;
  /** 拖动中累计的右转峰值角速度（rad/s，>0） */
  peakRightVelocity: number;
  /** 拖动中累计的左转峰值 |角速度|（rad/s，>0） */
  peakLeftVelocity: number;
  /** 上一帧瞬时角速度的方向符号：-1 左转 / 0 未动 / 1 右转 */
  lastDirectionSign: number;
  /** 本轮拖动中左右方向切换的累计次数（> DIRECTION_CHANGE_THRESHOLD 才算反复晃动） */
  directionChangeCount: number;
  /** 本轮拖动中是否已触发过"晃动开始"回调（防止每帧重复触发） */
  wobbleStartFired: boolean;
  /** GSAP 回正 tween（从 focus 回到 HOME 时启动） */
  returnTween: gsap.core.Tween | null;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export interface SculptureRotationHandlers {
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}

export interface SculptureRotationApi {
  groupRef: React.RefObject<THREE.Group>;
  handlers: SculptureRotationHandlers;
  isInteractive: boolean;
  /** 注册"晃动开始"回调（左右来回超过阈值的第一帧触发一次，无论是否在拖动中）。传 null 取消注册。 */
  setOnWobbleStart: (cb: (() => void) | null) => void;
  /** 注册"快速旋转后稳定"回调（旋转停下并回到默认位置时触发一次）。传 null 取消注册。 */
  setOnFastSettle: (cb: (() => void) | null) => void;
}

export function useSculptureRotation(active: SectionId): SculptureRotationApi {
  const groupRef = useRef<THREE.Group>(null);
  const stateRef = useRef<SculptureState>({
    position: 0,
    velocity: 0,
    isDragging: false,
    pointerStartX: 0,
    positionStart: 0,
    lastTarget: 0,
    peakRightVelocity: 0,
    peakLeftVelocity: 0,
    lastDirectionSign: 0,
    directionChangeCount: 0,
    wobbleStartFired: false,
    returnTween: null,
  });
  // 外部注册的"晃动开始"回调，用 ref 避免重渲染
  const onWobbleStartRef = useRef<(() => void) | null>(null);
  // 外部注册的"快速旋转稳定"回调，用 ref 避免重渲染
  const onFastSettleRef = useRef<(() => void) | null>(null);

  // ---- 工具：杀掉回正 tween ----
  const killReturnTween = () => {
    const t = stateRef.current.returnTween;
    if (t) {
      t.kill();
      stateRef.current.returnTween = null;
    }
  };

  // ---- 启动 GSAP 回正 tween（focus → home 时） ----
  const startReturnTween = (fromPos: number) => {
    killReturnTween();
    const s = stateRef.current;
    s.velocity = 0;
    const obj = { y: fromPos };
    s.returnTween = gsap.to(obj, {
      y: 0,
      duration: 1.3,
      ease: "back.out(1.1)", // 轻微过冲
      onUpdate: () => {
        s.position = obj.y;
      },
      onComplete: () => {
        s.returnTween = null;
      },
    });
  };

  // ---- 拖动起点（HOME 模式） ----
  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (active !== "home") return;
    e.stopPropagation();
    const s = stateRef.current;
    killReturnTween();
    s.velocity = 0;
    s.isDragging = true;
    s.pointerStartX = e.clientX;
    s.positionStart = s.position;
    s.lastTarget = s.position;
    // 新一轮拖动开始，重置左右双向峰值 + 来回计数 + 晃动开始标志
    s.peakRightVelocity = 0;
    s.peakLeftVelocity = 0;
    s.lastDirectionSign = 0;
    s.directionChangeCount = 0;
    s.wobbleStartFired = false;
    try {
      (e.target as Element).setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    document.body.style.cursor = "grabbing";
  };

  // ---- 悬停光标（HOME 模式时显示 grab） ----
  const onPointerOver = () => {
    if (active !== "home") return;
    if (!stateRef.current.isDragging) {
      document.body.style.cursor = "grab";
    }
  };
  const onPointerOut = () => {
    if (stateRef.current.isDragging) return;
    document.body.style.cursor = "";
  };

  // ---- 响应 active 切换 ----
  useEffect(() => {
    if (active !== "home") {
      // 离开 HOME：立即停止拖动，冻结 position
      const s = stateRef.current;
      if (s.isDragging) {
        s.isDragging = false;
        document.body.style.cursor = "";
      }
      killReturnTween();
      return;
    }
    // 回到 HOME：GSAP 软回正
    const s = stateRef.current;
    if (Math.abs(s.position) > 0.002) {
      // 微小延迟：让相机先开始动，雕塑与相机同时落位
      const id = window.setTimeout(() => {
        // 用户可能已经又开始拖了，要再次确认
        if (active === "home" && !stateRef.current.isDragging) {
          startReturnTween(stateRef.current.position);
        }
      }, 80);
      return () => clearTimeout(id);
    }
  }, [active]);

  // ---- 全局 pointermove / pointerup（HOME 模式） ----
  useEffect(() => {
    if (active !== "home") return;

    const handleMove = (e: PointerEvent) => {
      const s = stateRef.current;
      if (!s.isDragging) return;
      const delta = (e.clientX - s.pointerStartX) * SENSITIVITY;
      const target = clamp(
        s.positionStart + delta,
        -MAX_ROTATION,
        MAX_ROTATION,
      );
      // 瞬时角速度（rad/s）= 目标位置每秒变化量
      const instantVel = (target - s.lastTarget) * 60;
      // EMA 平滑：估算释放时初速度
      s.velocity =
        s.velocity * (1 - VELOCITY_SMOOTHING) + instantVel * VELOCITY_SMOOTHING;
      // 分别累计左右双向峰值（用瞬时值而非平滑值，避免被均值稀释）
      if (instantVel > 0) {
        if (instantVel > s.peakRightVelocity) {
          s.peakRightVelocity = instantVel;
        }
      } else if (instantVel < 0) {
        const absNeg = -instantVel;
        if (absNeg > s.peakLeftVelocity) {
          s.peakLeftVelocity = absNeg;
        }
      }
      // 累计方向切换次数：瞬时方向与上一帧不同且都不为 0，记一次"来回"
      if (instantVel !== 0) {
        const sign = instantVel > 0 ? 1 : -1;
        if (s.lastDirectionSign !== 0 && sign !== s.lastDirectionSign) {
          s.directionChangeCount += 1;
        }
        s.lastDirectionSign = sign;
      }
      s.lastTarget = target;
      killReturnTween();
    };

    const handleUp = () => {
      const s = stateRef.current;
      if (!s.isDragging) return;
      s.isDragging = false;
      // 释放后光标：若指针仍在 mesh 上显示 grab，已离开则 onPointerOut 清空
      document.body.style.cursor = "grab";
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [active]);

  // ---- 每帧更新 ----
  useFrame((_, dt) => {
    const s = stateRef.current;
    const group = groupRef.current;
    if (!group) return;
    const delta = Math.min(dt, 0.05); // 防止 tab 切回时大跳

    // 0) 晃动开始判定：每轮拖动只触发一次
    //    放在最前面，确保拖动中、tween 中、focus 中都会运行（不受下面 early return 影响）
    const isWobbleActive =
      s.peakRightVelocity >= FAST_VELOCITY_THRESHOLD &&
      s.peakLeftVelocity >= FAST_VELOCITY_THRESHOLD &&
      s.directionChangeCount > DIRECTION_CHANGE_THRESHOLD;
    if (isWobbleActive && !s.wobbleStartFired) {
      s.wobbleStartFired = true;
      const startCb = onWobbleStartRef.current;
      if (startCb) startCb();
    }

    // 1) GSAP tween 主导时：tween 自己写 position，物理停摆
    if (s.returnTween) {
      group.rotation.y = s.position;
      return;
    }

    // 2) 拖动中：position 以 lag 跟随 lastTarget（力反馈）
    if (s.isDragging) {
      const target = clamp(s.lastTarget, -MAX_ROTATION, MAX_ROTATION);
      s.position = s.position + (target - s.position) * DRAG_LAG;
      group.rotation.y = s.position;
      return;
    }

    // 3) focus 模式：冻结 position
    if (active !== "home") {
      group.rotation.y = s.position;
      return;
    }

    // 4) HOME 模式：阻尼弹簧物理（settle）
    if (
      Math.abs(s.velocity) > VELOCITY_EPSILON ||
      Math.abs(s.position) > 0.001
    ) {
      // F = -K·x - C·v; a = F/M
      const accel = (-SPRING_K * s.position - SPRING_C * s.velocity) / SPRING_M;
      s.velocity += accel * delta;
      s.position += s.velocity * delta;

      // 软墙：触界时反向速度并损耗能量
      if (s.position > MAX_ROTATION) {
        s.position = MAX_ROTATION;
        if (s.velocity > 0) s.velocity = -s.velocity * WALL_VELOCITY_LOSS;
      } else if (s.position < -MAX_ROTATION) {
        s.position = -MAX_ROTATION;
        if (s.velocity < 0) s.velocity = -s.velocity * WALL_VELOCITY_LOSS;
      }
    }

    // 5) 稳定判定：position 回到默认位置附近、且速度足够小
    //    触发条件全部满足才触发"完全稳定"事件（用于气泡退出）：
    //      a) 左右双向瞬时角速度都曾超过阈值（不是单向快拖）
    //      b) 左右方向切换次数 > DIRECTION_CHANGE_THRESHOLD（不是单次来回）
    if (
      !s.isDragging &&
      Math.abs(s.position) < SETTLE_POSITION_EPSILON &&
      Math.abs(s.velocity) < VELOCITY_EPSILON
    ) {
      const isWobble =
        s.peakRightVelocity >= FAST_VELOCITY_THRESHOLD &&
        s.peakLeftVelocity >= FAST_VELOCITY_THRESHOLD &&
        s.directionChangeCount > DIRECTION_CHANGE_THRESHOLD;
      if (isWobble) {
        const cb = onFastSettleRef.current;
        s.peakRightVelocity = 0;
        s.peakLeftVelocity = 0;
        s.lastDirectionSign = 0;
        s.directionChangeCount = 0;
        s.wobbleStartFired = false;
        if (cb) cb();
      }
    }

    group.rotation.y = s.position;
  });

  return {
    groupRef,
    handlers: { onPointerDown, onPointerOver, onPointerOut },
    isInteractive: active === "home",
    setOnWobbleStart: (cb) => {
      onWobbleStartRef.current = cb;
    },
    setOnFastSettle: (cb) => {
      onFastSettleRef.current = cb;
    },
  };
}
