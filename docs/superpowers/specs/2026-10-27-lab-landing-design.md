# LAB 项目集合页设计

日期：2026-10-27
状态：已实现并部署到 lab.randomjin.top

## 目标

把个人项目以立体卡片形式集中展示，视觉与主站 blog.randomjin.top 保持统一，项目内容通过单一配置文件维护。

## 架构

- Astro 7 静态站点，`output: static`，Vercel 直接识别并构建。
- React 19 岛：`ProjectGrid` 以 `client:load` 挂载，卡片内容在构建期作为 props 注入，首屏为静态 HTML。
- Tailwind CSS v4（`@tailwindcss/vite`），主题令牌定义在 `src/styles/global.css`。
- 卡片组件移植自 `cardprompt.md` 的 iso-card，补齐其缺失的 `iso-card-utils/iso-depth` 实现。

```
src/
  data/projects.ts                      项目配置
  components/ProjectGrid.tsx            卡片网格 + 复制交互
  components/ui/iso-card.tsx            卡片组件
  components/ui/iso-card-utils/iso-depth.tsx
  pages/index.astro                     页面骨架与 SEO
  styles/global.css                     主题与立体层样式
public/logo.png                         主站 logo
```

## 配置

`src/data/projects.ts` 导出 `Project[]`：

```ts
type Project = {
  title: string;        // 卡片标题
  description: string;  // 简要描述
  url: string;          // 点击卡片跳转
  github?: string;      // 可选，GitHub 按钮
  prompt?: string;      // 可选，有值才显示复制 Prompt 按钮
};
```

首版包含今斤、LAB、Prompt 示例三条数据，后续直接增删数组项即可。

## 配色

取自主站渲染值，仅浅色主题：

| 用途 | 色值 |
| --- | --- |
| 页面背景 | `#f5f5f5` |
| 卡片面 | `#ffffff` |
| 主文字 | `#1a1a1a` |
| 次要文字 | `#6b6b6b` |
| 描边 | `#c6c6c6` |
| 深色按钮/强调 | `#1a1a1a` |

立体层由 6 层 1px 向右下偏移的浅灰面板构成（`#f4f4f4` → `#e8e8e8`，外缘 1px 描边）。卡片与按钮均为直角、无圆角；按钮采用 3px 偏移轮廓，提供白底描边与黑底实心两种样式。hover 时卡片面上浮、立体层同步加深位移，`prefers-reduced-motion` 下禁用动效。

## 交互

- 整卡跳转：卡片内绝对定位的透明链接覆盖层，新标签页打开 `url`。
- GitHub 按钮：打开仓库，新标签页。
- 复制 Prompt：Clipboard API + `execCommand` 降级，成功后按钮显示「已复制」2 秒。
- 按钮层级高于覆盖层，点击按钮不会误触卡片跳转。
- 卡片链接与按钮都有可见焦点态和 `aria-label`。

## 响应式

网格 1 列（<640px）/ 2 列（≥640px）/ 3 列（≥1024px）；页头标题用 `clamp()` 缩放；页脚在窄屏纵向排列。

## 部署

`npm run build` 输出 `dist/`；提交并推送 `main` 后由已关联的 Vercel 项目自动构建部署到 `lab.randomjin.top`。
