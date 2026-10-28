export type Project = {
  /** 卡片标题 */
  title: string;
  /** 一行简要描述 */
  description: string;
  /** 点击卡片打开的项目地址 */
  url: string;
  /** GitHub 仓库地址，留空则不显示 GitHub 按钮 */
  github?: string;
  /** Prompt 原文，有值才会显示「复制 Prompt」按钮 */
  prompt?: string;
};

export const projects: Project[] = [
  {
    title: "今斤",
    description: "主站入口：关于我、友链与全站导航。",
    url: "https://randomjin.top",
    github: "https://github.com/RandomJinJin/Jins-Cubby",
  },
  {
    title: "LAB",
    description: "你正在浏览的页面，项目与实验的集合。",
    url: "https://lab.randomjin.top",
    github: "https://github.com/RandomJinJin/LAB",
  },
  {
    title: "Wayfinding",
    description: "3D 路标主页：转动镜头，跟着牌子去到站内每一个页面。",
    url: "https://lab.randomjin.top/wayfinding",
    github: "https://github.com/RandomJinJin/LAB",
  },
  {
    title: "Gacha",
    description: "人物抽卡机：抽十次，用属性碎片拼出完整画像。",
    url: "https://lab.randomjin.top/gacha",
    github: "https://github.com/RandomJinJin/LAB",
  },
  {
    title: "DodgeButton",
    description: "一个会躲开鼠标的按钮，越靠近越难点到。",
    url: "https://lab.randomjin.top/dodgebutton",
    github: "https://github.com/RandomJinJin/LAB",
  },
  {
    title: "ChatBubble",
    description: "柔和纸色的聊天消息气泡，散落堆叠成一片。",
    url: "https://lab.randomjin.top/chatbubble",
    github: "https://github.com/RandomJinJin/LAB",
  },
  {
    title: "Prompt 示例",
    description: "示例条目：带复制按钮的 prompt 项目，替换为你的内容即可。",
    url: "https://lab.randomjin.top",
    github: "https://github.com/RandomJinJin/LAB",
    prompt: `你是一位擅长把复杂概念讲清楚的编辑。请把下面这段技术说明改写成面向非技术读者的版本：
1. 保留原意，不新增事实；
2. 先用一句话给出结论；
3. 每段不超过三句；
4. 结尾列出三个关键要点。`,
  },
];
