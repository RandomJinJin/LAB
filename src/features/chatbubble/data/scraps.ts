/**
 * Chatbubble 示例数据。
 *
 * 该 feature 现在是 LAB 的独立项目，不再请求 Blog 的 /api/mastodon，
 * 以保证静态站点下也能独立运行。
 */
export interface Dudu {
  id: string;
  date: string;
  content: string;
  likes: number;
  retweets: number;
  bookmarks: number;
  comments: number;
  isWelcome?: boolean;
  image?: string;
}

const scraps: Dudu[] = [
  {
    id: "001",
    date: "2026.07.08",
    content: "今天天气不错。",
    likes: 5,
    retweets: 1,
    bookmarks: 2,
    comments: 3,
  },
  {
    id: "002",
    date: "2026.07.08",
    content: "新到的键盘手感不错，HHKB 永远的神。静电容的触感确实不一样。",
    likes: 18,
    retweets: 3,
    bookmarks: 7,
    comments: 5,
  },
  {
    id: "003",
    date: "2026.07.07",
    content:
      "今天在咖啡馆坐了一下午，看了《人类简史》。书里提到认知革命的部分很有意思，人类之所以能统治地球，靠的是虚构故事的能力。想想我们现在的生活，有多少是建立在共同的想象之上的？货币、国家、公司，本质上都是故事。",
    likes: 24,
    retweets: 5,
    bookmarks: 12,
    comments: 8,
  },
  {
    id: "004",
    date: "2026.07.07",
    content: "今天的日落很美。",
    likes: 45,
    retweets: 12,
    bookmarks: 23,
    comments: 6,
    image: "https://picsum.photos/seed/sunset/320/200?grayscale",
  },
  {
    id: "005",
    date: "2026.07.06",
    content: "早起一杯咖啡。",
    likes: 15,
    retweets: 2,
    bookmarks: 5,
    comments: 3,
  },
  {
    id: "006",
    date: "2026.07.05",
    content: "夜晚的城市很安静，适合写代码。",
    likes: 32,
    retweets: 8,
    bookmarks: 15,
    comments: 12,
    image: "https://picsum.photos/seed/city/320/180?grayscale",
  },
  {
    id: "007",
    date: "2026.07.05",
    content: "今天学到一个新词：小确幸。微小而确定的幸福，村上春树提出的概念。",
    likes: 28,
    retweets: 6,
    bookmarks: 11,
    comments: 7,
  },
  {
    id: "008",
    date: "2026.07.04",
    content:
      "周末去了趟书店，买了几本一直没空看的书。《百年孤独》《挪威的森林》《局外人》。这次一定要看完，不能再像上次那样买回来就放在书架上积灰了。书真的是越买越多，读完的却越来越少。",
    likes: 19,
    retweets: 4,
    bookmarks: 9,
    comments: 4,
  },
  {
    id: "009",
    date: "2026.07.04",
    content: "一杯手冲，一个下午。",
    likes: 22,
    retweets: 5,
    bookmarks: 8,
    comments: 6,
    image: "https://picsum.photos/seed/coffee/320/200?grayscale",
  },
  {
    id: "010",
    date: "2026.07.03",
    content: "Push 了三个 commit。",
    likes: 38,
    retweets: 9,
    bookmarks: 16,
    comments: 11,
  },
  {
    id: "011",
    date: "2026.07.02",
    content: "读书使人进步。",
    likes: 67,
    retweets: 18,
    bookmarks: 34,
    comments: 14,
    image: "https://picsum.photos/seed/book/320/180?grayscale",
  },
  {
    id: "012",
    date: "2026.07.01",
    content:
      "思考人生，结论是意义是自己赋予的。每个人都走在自己的路上，不必羡慕别人。",
    likes: 41,
    retweets: 11,
    bookmarks: 19,
    comments: 9,
  },
  {
    id: "013",
    date: "2026.06.30",
    content:
      "中午吃了一碗很好吃的面，下次还要去。简单的食物最治愈，不需要什么花里胡哨的摆盘，只要味道对了就行。有时候觉得，生活就应该这样，简单一点，真诚一点。不用刻意追求什么，该来的总会来。",
    likes: 22,
    retweets: 5,
    bookmarks: 8,
    comments: 6,
  },
  {
    id: "014",
    date: "2026.06.29",
    content: "窗外下着雨。",
    likes: 33,
    retweets: 7,
    bookmarks: 14,
    comments: 8,
    image: "https://picsum.photos/seed/rain/320/200?grayscale",
  },
  {
    id: "015",
    date: "2026.06.28",
    content: "和朋友们聊了很久。",
    likes: 38,
    retweets: 9,
    bookmarks: 16,
    comments: 11,
  },
];

export function getScraps(): Dudu[] {
  return scraps;
}
