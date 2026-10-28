import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { pool } from "../data/pool";
import { useGacha } from "../hooks/useGacha";
import "../styles/gacha.css";

const COUNT = pool.length;

/** 卡片轻微倾斜，像素贴纸感 */
const TILT = [0, 3, -3, 2, -4, 3, -2, 4, -3, 2];

interface FloatCard {
  key: string;
  poolIndex: number;
}

export function GachaGame() {
  const { drawWithReplacement } = useGacha();
  const [flipped, setFlipped] = useState<Set<number>>(() => new Set());
  const [cards, setCards] = useState<FloatCard[]>([]);
  const [rolling, setRolling] = useState(false);

  const portraitRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const entryRefs = useRef<(HTMLDivElement | null)[]>([]);
  const flippedRef = useRef<Set<number>>(flipped);
  const lastFlipRef = useRef<number[]>([]);
  const lastShakeRef = useRef<number[]>([]);

  const done = flipped.size >= COUNT;
  const isSingle = cards.length === 1;
  const floatClass = isSingle ? "gacha-float is-single" : "gacha-float";
  const cardClass = isSingle ? "gacha-card gacha-card-single" : "gacha-card";
  const markClass = rolling ? "portrait-mark is-rolling" : "portrait-mark";

  useEffect(() => {
    flippedRef.current = flipped;
  }, [flipped]);

  /* 抽中的卡片飞入模糊浮层 */
  useEffect(() => {
    if (cards.length === 0 || !floatRef.current) return;
    const els = floatRef.current.querySelectorAll(".gacha-card");
    gsap.fromTo(
      floatRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.2 },
    );
    gsap.fromTo(
      els,
      { scale: 0.3, opacity: 0, y: 90, rotation: 12 },
      {
        scale: 1,
        opacity: 1,
        y: 0,
        rotation: (i: number) => TILT[i % TILT.length],
        duration: 0.5,
        stagger: 0.06,
        ease: "back.out(1.5)",
      },
    );
  }, [cards]);

  /* 新解锁条目上下翻转 / 重复条目抖动 */
  useEffect(() => {
    const flipEls = lastFlipRef.current
      .map((i) => entryRefs.current[i])
      .filter((el): el is HTMLDivElement => Boolean(el));
    const shakeEls = lastShakeRef.current
      .map((i) => entryRefs.current[i])
      .filter((el): el is HTMLDivElement => Boolean(el));
    lastFlipRef.current = [];
    lastShakeRef.current = [];
    if (flipEls.length === 0 && shakeEls.length === 0) return;
    flipEls.forEach((el) =>
      gsap.fromTo(
        el,
        { rotationX: -90 },
        { rotationX: 0, duration: 0.4, ease: "power2.out" },
      ),
    );
    shakeEls.forEach((el) =>
      gsap.fromTo(
        el,
        { x: -7 },
        {
          x: 7,
          duration: 0.06,
          repeat: 5,
          yoyo: true,
          ease: "none",
          clearProps: "x",
        },
      ),
    );
  }, [flipped]);

  /* 点击浮层返回：卡片淡出并卸载 */
  const dismissCards = () => {
    const els = floatRef.current?.querySelectorAll(".gacha-card");
    if (els && els.length > 0) {
      gsap.to(els, {
        opacity: 0,
        scale: 0.85,
        y: -28,
        duration: 0.35,
        ease: "power2.in",
        onComplete: () => setCards([]),
      });
    } else {
      setCards([]);
    }
  };

  const reveal = (indices: number[]) => {
    const flippedNow = flippedRef.current;
    const newOnes = indices.filter((i) => !flippedNow.has(i));
    const dups = indices.filter((i) => flippedNow.has(i));
    gsap.killTweensOf(floatRef.current?.querySelectorAll(".gacha-card"));
    setCards(
      indices.map((poolIndex, k) => ({
        key: `${poolIndex}-${Date.now()}-${k}`,
        poolIndex,
      })),
    );
    lastFlipRef.current = newOnes;
    lastShakeRef.current = dups;
    setFlipped((prev) => {
      const next = new Set(prev);
      newOnes.forEach((i) => next.add(i));
      return next;
    });
  };

  const runDraw = (count: number) => {
    if (rolling) return;
    setRolling(true);
    window.setTimeout(() => {
      const indices = drawWithReplacement(COUNT, count);
      reveal(indices);
      setRolling(false);
    }, 420);
  };

  const reset = () => {
    if (rolling) return;
    gsap.killTweensOf(floatRef.current?.querySelectorAll(".gacha-card"));
    gsap.killTweensOf(entryRefs.current);
    gsap.killTweensOf(portraitRef.current);
    setCards([]);
    setFlipped(new Set());
  };

  return (
    <section className="gacha-page">
      <header className="gacha-top">
        <a
          className="gacha-home"
          href="/"
          aria-label="回到主页"
          title="回到主页"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M12 2 L1 9 H3 V22 H10 V15 H14 V22 H21 V9 H23 Z" />
          </svg>
        </a>
        <h1 className="gacha-title"> // DEMO (ง •̀_•́)ง</h1>
      </header>

      <div className="gacha-main">
        {/* 左侧：人物属性条目面板（初始为 10 个空占位槽） */}
        <aside className="gacha-side">
          <h2 className="side-title">人物属性</h2>
          <ul className="entry-list">
            {pool.map((frag, i) => (
              <li key={frag.id} className="entry">
                <div
                  className="entry-face"
                  ref={(el) => {
                    entryRefs.current[i] = el;
                  }}
                >
                  {flipped.has(i) ? (
                    <span className="entry-content">
                      <span className="entry-label">{frag.label}</span>
                      <span className="entry-value">{frag.value}</span>
                    </span>
                  ) : (
                    <span className="entry-blank" aria-hidden="true" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </aside>

        {/* 右侧：角色立绘，暂时占位；抽卡结果覆盖在立绘区域居中 */}
        <div className="gacha-portrait" ref={portraitRef}>
          <span className={markClass}>?</span>
          <span className="portrait-caption">立绘占位</span>

          {/* 浮层：抽中的卡片以立绘区域中心点为基准居中，点击任意处返回 */}
          {cards.length > 0 && (
            <div className={floatClass} ref={floatRef} onClick={dismissCards}>
              {cards.map((card) => {
                const frag = pool[card.poolIndex];
                return (
                  <div className={cardClass} key={card.key}>
                    <span className="card-label">{frag.label}</span>
                    <span className="card-value">{frag.value}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <footer className="gacha-bottom">
        <div className="gacha-actions">
          <button
            type="button"
            className="pixel-btn pixel-btn-ghost"
            onClick={() => runDraw(1)}
            disabled={rolling}
          >
            抽一张
          </button>
          <button
            type="button"
            className="pixel-btn"
            onClick={() => runDraw(10)}
            disabled={rolling}
          >
            抽10张
          </button>
          <button
            type="button"
            className="pixel-btn pixel-btn-ghost"
            onClick={reset}
            disabled={rolling}
          >
            重置
          </button>
        </div>
        {done && <p className="gacha-status">画像拼凑完成，这就是我。</p>}
      </footer>
    </section>
  );
}
