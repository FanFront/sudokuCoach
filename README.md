# 九格研习所

中文经典 9×9 数独教练，Web 与 Android 共用同一个离线逻辑引擎。

- **研习台**提供四档新题、手动笔记、自动候选、撤销和分层提示。棋局与已完成课程保存在当前设备。
- **技巧课程**收录 13 节课程，涵盖唯一数、区块排除、数对与数组、鱼形、强链接与翼形。共 52 个经过校验的局面，可从课程直接跳转到原题对应的推理步骤。
- **分步解题器**接受 81 位题面，空格可写作 0 或英文句点。导入时检查无解、多解和重复数字，逐步展示填数、删数及其依据。

## Web

GitHub Pages 由 `GitHub Pages` 工作流发布。在仓库 **Settings → Pages → Source** 选择 **GitHub Actions** 后，该工作流会发布 `dist/`。

使用 Node.js 22 或更新版本。运行 `npm test` 校验例题与引擎，`npm run build` 生成可直接托管的 `dist/`。本地可运行 `python3 -m http.server 8000 --directory dist`，在浏览器打开 `http://localhost:8000`。部署时需通过 HTTP(S) 提供 ES 模块和 Worker。

## Android APK

GitHub Actions 的 **Android APK** 工作流在应用代码更新后构建，产物名为 `jiuge-sudoku-coach-apk`。本地使用 JDK 21、Android SDK 36、Build Tools 35.0.0 和 Node.js 22+，运行 `bash scripts/android-build.sh`。脚本将静态资源装入 Capacitor 并校验 APK 内资源与 Web 构建逐字节一致。输出 `android/output/jiuge-sudoku-coach.apk` 为调试签名版，安装后首次打开即可离线使用。推荐更新 Android System WebView。

## 引擎

本地集成 sudoku-core 4.1.1，保留 [MIT 许可证](web/engine/SUDOKU-CORE-LICENSE.txt)。中文课程、棋盘交互与步骤解释由本项目提供。题面、笔记和学习进度均在本机处理。

技巧分类与规则参考 [Sudopedia · Solving technique](https://sudopedia.sudocue.net/index.php?title=Solving_technique)。
