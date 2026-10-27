import * as React from "react";

type IsoDepthStyle = React.CSSProperties & { "--iso-depth": string };

const FROM: [number, number, number] = [232, 232, 232];
const TO: [number, number, number] = [176, 176, 176];

/** 按层号在浅灰到深灰之间取色，形成硬边立体感。 */
function layerColor(step: number, depth: number) {
  const t = depth <= 1 ? 1 : (step - 1) / (depth - 1);
  const channels = FROM.map((from, i) => Math.round(from + (TO[i] - from) * t));
  return `rgb(${channels.join(", ")})`;
}

/** 把深度写入卡片的自定义属性，同时保留调用方传入的样式。 */
export function isoDepth(depth = 8, style?: React.CSSProperties): IsoDepthStyle {
  return { "--iso-depth": `${depth}px`, ...style };
}

export const isoFace = "iso-face";

type IsoDepthProps = {
  /** 实际绘制的立体层数，默认 8 */
  depth?: number;
  /** 需要挖空、不绘制的层序号（从 1 开始） */
  sink?: number[];
};

/** 卡片背后的立体层，沿 45° 向右下逐层偏移。 */
export function IsoDepth({ depth = 8, sink = [] }: IsoDepthProps) {
  const layers = Array.from({ length: depth }, (_, index) => index + 1).filter(
    (step) => !sink.includes(step),
  );

  return (
    <div className="iso-depth" aria-hidden="true">
      {layers.map((step) => (
        <span
          key={step}
          className="iso-depth__layer"
          style={{
            backgroundColor: layerColor(step, depth),
            transform: `translate(${step}px, ${step}px)`,
          }}
        />
      ))}
    </div>
  );
}
