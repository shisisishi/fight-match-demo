# 约架 · 滑卡界面

面向格斗运动爱好者的 Tinder 风格滑卡界面原型，使用 React + TypeScript + Vite 开发。人物资料、头像与联系账号均为虚构示例，无真实用户注册或服务器后台。

## 在线预览

https://shisisishi.github.io/fight-match-demo/

（GitHub Pages 部署完成后生效，首次发布可能需要数分钟同步。）

## 本机开发

需 Node.js 20.19+ 或 22.12+：

```bash
npm ci
npm run dev
```

生产构建（输出到 `docs/`，供 GitHub Pages 使用）：

```bash
npm ci
npm run build
```

本地预览构建结果：

```bash
npm run preview
```

## 演示说明

- 支持手机与桌面布局；左右滑和按钮均可操作。
- 可切换经典版 / 暗黑版界面，偏好保存在当前浏览器。
- 资料、滑动与匹配记录保存在浏览器 localStorage；无真实后端。
- 示例人物照片为虚构形象，请勿当作真实用户展示。

## 构建与验证说明

发布前已在副本目录执行 `npm ci` 与 `npm run build`，构建产物位于 `docs/`。

## 开源依赖

- [React](https://github.com/facebook/react)（MIT）
- [Vite](https://github.com/vitejs/vite)（MIT）
