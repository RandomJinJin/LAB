/**
 * 抽卡池：本人的属性碎片。
 * 通过抽卡逐条揭晓，拼凑出人物画像。
 */
export interface GachaFragment {
  id: string;
  /** 属性名 */
  label: string;
  /** 属性值 */
  value: string;
}

/** 10 条属性碎片：抽十次即可拼满画像 */
export const pool: GachaFragment[] = [
  { id: "mbti", label: "MBTI", value: "INFP" },
  { id: "pet", label: "宠物", value: "两只猫" },
  { id: "stamina", label: "体力值", value: "10" },
  { id: "curiosity", label: "好奇心", value: "200" },
  { id: "hobby", label: "爱好", value: "玩游戏 / 听音乐" },
  { id: "daily", label: "最近在玩的游戏", value: "漫威蜘蛛侠2+地平线5" },
  { id: "mood", label: "精神状态", value: "时常想摸鱼" },
  { id: "collect", label: "收藏", value: "旧照片与下雨天" },
  { id: "orbit", label: "坐标", value: "网络漫游者" },
  { id: "night", label: "深夜模式", value: "凌晨三点仍在思考" },
];
