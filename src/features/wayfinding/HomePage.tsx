/**
 * HomePage — 完整主页入口
 *
 * 布局：
 * - 左 35% : 3D 路标雕塑
 * - 中 65% : 留白
 *
 * 点击路牌后（两步动画）：
 * 1. 相机 focus 到路牌正面中心（phase="focus"）
 * 2. 相机继续放大推进（phase="zoom"）
 * 3. 渐变切换到对应页面
 *
 * 返回页面时：
 * 1. 渐变遮罩淡出
 * 2. 相机倒序回退到初始位置
 */
import {
  useState,
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
} from "react";
import { gsap } from "gsap";
import { HomeScene } from "./HomeScene";
import { wayfindingColors } from "./colors";
import type { SectionId } from "./types/sign";
import type { AnimationPhase } from "./hooks/useCamera";
import "./styles/home.css";

// 把配色通过 CSS 变量暴露给 home.css，让样式统一从这里读取
const COLOR_CSS_VARS = {
  ["--wayfinding-page-bg" as string]: wayfindingColors.pageBackground,
  ["--wayfinding-nav-muted" as string]: wayfindingColors.navMuted,
  ["--wayfinding-caption-muted" as string]: wayfindingColors.captionMuted,
  ["--wayfinding-nav-accent" as string]: wayfindingColors.sign.surfaceActive,
} as CSSProperties;

// 路由映射：LAB 站内用相对路径，本地 dev 与正式域名自动指向当前域名
const SECTION_ROUTES: Record<SectionId, string> = {
  home: "/",
  blog: "https://blog.randomjin.top/posts",
  project: "/",
  dudu: "https://blog.randomjin.top/dudu",
  links: "https://randomjin.top/friends",
  about: "https://randomjin.top/about",
};

export function HomePage() {
  const [active, setActive] = useState<SectionId>("home");
  const [phase, setPhase] = useState<AnimationPhase>("focus");
  const [isNavigating, setIsNavigating] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // 监听浏览器返回按钮，重置为初始位置并播放倒序动画
  useEffect(() => {
    const handlePageshow = (e: PageTransitionEvent) => {
      // 重置状态
      setActive("home");
      setPhase("focus");
      setIsNavigating(false);

      // 确保 overlay 存在
      if (!overlayRef.current) return;

      // 如果是从 bfcache 恢复（persisted = true），播放倒序动画
      if (e.persisted) {
        // 使用 GSAP timeline 倒序回退
        const tl = gsap.timeline({
          defaults: { ease: "power2.out" },
        });

        // 初始状态：白色遮罩完全覆盖
        gsap.set(overlayRef.current, { opacity: 1, pointerEvents: "auto" });

        // 动画：遮罩淡出
        tl.to(overlayRef.current, {
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
          onComplete: () => {
            if (overlayRef.current) {
              overlayRef.current.style.pointerEvents = "none";
            }
          },
        });
      } else {
        // 正常加载，确保遮罩隐藏
        gsap.set(overlayRef.current, { opacity: 0, pointerEvents: "none" });
      }
    };

    // pageshow 事件在页面从 bfcache 恢复时触发（包括返回按钮）
    window.addEventListener("pageshow", handlePageshow);

    // 初始化时确保遮罩隐藏
    if (overlayRef.current) {
      gsap.set(overlayRef.current, { opacity: 0, pointerEvents: "none" });
    }

    return () => {
      window.removeEventListener("pageshow", handlePageshow);
    };
  }, []);

  // 点击路牌处理 - 使用 GSAP timeline 控制两步动画
  const handleSignClick = useCallback(
    (section: SectionId) => {
      if (section === "home" || isNavigating) return;

      setIsNavigating(true);

      // Step 1: 相机移动到路牌正面中心（focus 阶段）
      setActive(section);
      setPhase("focus");

      // Step 2: 使用 GSAP timeline 控制过渡
      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
      });

      // 等待相机动画到路牌正面（focus 阶段）
      tl.to({}, { duration: 0.7 }) // 700ms focus 动画
        // Step 3: 切换到 zoom 阶段（相机继续推进）
        .call(() => {
          setPhase("zoom");
        })
        // 等待 zoom 动画完成
        .to({}, { duration: 0.5 }) // 500ms zoom 动画
        // Step 4: 渐变遮罩出现
        .to(overlayRef.current, {
          opacity: 1,
          duration: 0.4,
          ease: "power2.in",
          onStart: () => {
            if (overlayRef.current) {
              overlayRef.current.style.pointerEvents = "auto";
            }
          },
        })
        // Step 5: 导航到新页面
        .to(
          {},
          {
            duration: 0.1,
            onComplete: () => {
              const href = SECTION_ROUTES[section];
              window.location.href = href;
            },
          },
        );
    },
    [isNavigating],
  );

  return (
    <div className="home" style={COLOR_CSS_VARS}>
      {/* 左 35% — 3D 场景 */}
      <div className="home__scene">
        <HomeScene
          active={active}
          phase={phase}
          onSignClick={handleSignClick}
        />
      </div>

      {/* 渐变遮罩层 */}
      <div
        ref={overlayRef}
        className="home__overlay"
        style={{
          position: "fixed",
          inset: 0,
          background: wayfindingColors.pageBackground,
          opacity: 0,
          pointerEvents: "none",
          zIndex: 100,
        }}
      />
    </div>
  );
}

export default HomePage;
