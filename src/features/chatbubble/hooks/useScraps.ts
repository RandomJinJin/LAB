import type { Dudu } from "../data/scraps";
import { getScraps } from "../data/scraps";

/** 最新消息最多显示条数 */
export const SCRAPS_BATCH_SIZE = 20;

export type ScrapsStatus = "loading" | "ready" | "error";

/** 取最近的最新消息，最多 SCRAPS_BATCH_SIZE 条；不够则有几条显示几条 */
function getLatestScraps(): Dudu[] {
  return getScraps().slice(0, SCRAPS_BATCH_SIZE);
}

/** 本地示例数据，无需请求接口，直接返回就绪状态 */
export function useScraps() {
  return {
    scraps: getLatestScraps(),
    status: "ready" as ScrapsStatus,
    retry: () => {},
  };
}
