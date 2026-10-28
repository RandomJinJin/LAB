import type { NavItem } from "../types/sign";

/**
 * 导航菜单数据
 * 6 个段落：HOME / BLOG / PROJECT / DUDU / LINKS / ABOUT
 */
export const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "HOME" },
  { id: "blog", label: "BLOG", href: "https://blog.randomjin.top/posts" },
  { id: "project", label: "PROJECT", href: "/" },
  { id: "dudu", label: "DUDU", href: "https://blog.randomjin.top/dudu" },
  { id: "links", label: "LINKS", href: "https://randomjin.top/friends" },
  { id: "about", label: "ABOUT", href: "https://randomjin.top/about" },
];
