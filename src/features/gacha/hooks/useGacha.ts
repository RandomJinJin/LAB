/**
 * 抽卡逻辑：从 0..total-1 中可重复地随机抽取 count 个下标。
 * 允许抽到重复属性，用于触发对应条目的抖动反馈。
 */
export function drawWithReplacement(total: number, count: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * total));
}

export function useGacha() {
  return { drawWithReplacement };
}
