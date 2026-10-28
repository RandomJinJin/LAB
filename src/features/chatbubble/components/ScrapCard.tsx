import type { Dudu } from "../data/scraps";

/* MDI outline icons — 与 receipt 保持一致，零新增依赖 */
const ICONS = {
  star: "M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z",
  repeat: "M17 17H7V14L3 18L7 22V19H19V13H17M7 7H17V10L21 6L17 2V5H5V11H7V7Z",
  bookmark: "M5 3V21L12 18L19 21V3H5M12 15.82L7 18.06V5H17V18.06L12 15.82Z",
  comment:
    "M21 15.5C21 16.33 20.33 17 19.5 17H15L12 20L9 17H4.5C3.67 17 3 16.33 3 15.5V4.5C3 3.67 3.67 3 4.5 3H19.5C20.33 3 21 3.67 21 4.5V15.5M19.5 4.5H4.5V15.5H9.83L12 17.67L14.17 15.5H19.5V4.5Z",
} as const;

export type ScrapVariant = "stack" | "modal";

/** 卡片宽度随文本内容长度自适应（保持宽大于高） */
export function adaptiveWidth(content: string): number {
  const raw = 260 + content.length * 0.9;
  return Math.min(Math.max(raw, 260), 440);
}

function Stat({ path, value }: { path: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={path} />
      </svg>
      <span className="font-mono text-[11px] tabular-nums">{value}</span>
    </span>
  );
}

interface ScrapCardProps {
  dudu: Dudu;
  variant?: ScrapVariant;
  /** 尖角方位（表示消息方向，仅堆叠气泡使用） */
  tail?: "left" | "right";
  /** 堆叠卡片 hover 时显示模糊内容 */
  isHovered?: boolean;
}

export function ScrapCard({
  dudu,
  variant = "stack",
  tail = "right",
  isHovered = false,
}: ScrapCardProps) {
  const isModal = variant === "modal";
  const width = isModal
    ? Math.min(Math.max(adaptiveWidth(dudu.content), 340), 520)
    : adaptiveWidth(dudu.content);

  /* 堆叠卡片：空白气泡，仅用文本撑开尺寸；hover 时显示模糊内容 */
  if (!isModal) {
    const tailClass = `scrap-card--tail-${tail}`;
    return (
      <div
        className={
          isHovered
            ? `scrap-card scrap-card-stack ${tailClass} scrap-card--revealed`
            : `scrap-card scrap-card-stack ${tailClass}`
        }
        style={{ width }}
      >
        <div className="scrap-card-body">
          <p className="scrap-content scrap-content-blank">{dudu.content}</p>
        </div>
      </div>
    );
  }

  /* 点击后：完整内容（含图片、点赞统计、日期；uuid 编号完全移除） */
  return (
    <div className="scrap-card scrap-card-modal" style={{ width }}>
      <div className="scrap-card-body">
        <header className="scrap-card-header">
          <span className="scrap-date">{dudu.date}</span>
        </header>

        <p className="scrap-content scrap-content-lg">{dudu.content}</p>

        {dudu.image && (
          <figure className="scrap-figure">
            <img
              src={dudu.image}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
              style={{ filter: "grayscale(1) contrast(1.08)" }}
            />
          </figure>
        )}

        <footer className="scrap-stats">
          <Stat path={ICONS.comment} value={dudu.comments} />
          <Stat path={ICONS.repeat} value={dudu.retweets} />
          <Stat path={ICONS.star} value={dudu.likes} />
          <Stat path={ICONS.bookmark} value={dudu.bookmarks} />
        </footer>
      </div>
    </div>
  );
}
