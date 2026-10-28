/**
 * Navigation — 垂直菜单
 * 纯 HTML/CSS，不与 3D 场景耦合
 * 通过 props 通知 active section 变化
 */
import { NAV_ITEMS } from "./data/navigation";
import { SIGNS } from "./data/signs";
import { wayfindingColors } from "./colors";
import type { SectionId } from "./types/sign";
import "./styles/home.css";

interface NavigationProps {
  active: SectionId;
  onChange: (id: SectionId) => void;
}

export function Navigation({ active, onChange }: NavigationProps) {
  return (
    <nav className="home-nav" aria-label="primary">
      <ul className="home-nav__list">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === active;
          // 给每个非 HOME 项绑上对应 accent 色
          const accent =
            item.id === "home"
              ? undefined
              : SIGNS.find((s) => s.section === item.id)?.color;

          return (
            <li key={item.id} className="home-nav__item">
              <button
                type="button"
                className={`home-nav__link ${isActive ? "is-active" : ""}`}
                onMouseEnter={() => onChange(item.id)}
                onFocus={() => onChange(item.id)}
                onClick={() => onChange(item.id)}
                style={
                  {
                    // CSS 变量驱动 hover/active 颜色
                    ["--nav-accent" as string]:
                      accent ?? wayfindingColors.sign.surfaceActive,
                  } as CSSProperties
                }
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
