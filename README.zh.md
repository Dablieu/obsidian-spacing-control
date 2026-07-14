<div align="center">

**Language / 语言:** [English](README.md) · [中文](README.zh.md)

</div>

# Spacing Control（间距控制）

在 Obsidian 中精细调整标题、段落、列表和表格的间距（边距），同时支持 **实时预览（Live Preview）** 与 **阅读模式（Reading View）**。

> **需要 Obsidian 0.15.0 或更高版本。**

> **国内用户：** 你也可以通过 Gitee 访问本项目源码：https://gitee.com/Dablieu/obsidian-spacing-control

## 功能

- **独立间距控制** —— 分别为标题、段落、列表、表格设置上 / 下边距。
- **消除表格上方空行（实时预览）** —— 隐藏实时预览中表格（`| ... |`）上方那条可点击的多余空行，且**源 Markdown 文本永远不会被修改**。
- **紧凑表格** —— 列宽按内容自适应（`table-layout: auto`），可通过笔记的 cssclasses `[紧凑表格]` / `[宽松表格]` 强制开关。
- **表格美化** —— 自定义边框颜色 / 粗细 / 圆角以及表头背景色。

## 安装

### 通过社区插件市场（审核通过后）
1. 设置 → 社区插件 → 浏览
2. 搜索 “Spacing Control”
3. 安装并启用

### 手动安装
将 `obsidian-spacing-control` 文件夹复制到你的仓库 `.obsidian/plugins/` 目录下，然后在 设置 → 社区插件 中启用。

## 工作原理

- **实时预览：** 通过 CodeMirror 6 `ViewPlugin` 为紧贴表格行上方的空行添加装饰类，再用 `EditorView.theme`（最高优先级）将其折叠为零高度；其余间距通过动态注入的 `<style>` 标签实现。
- **阅读模式：** 用 `MutationObserver` 扫描渲染出的表格与标题，再用内联样式跨多层 wrapper 清除 / 调整对应边距。

## 完全免费

本插件**完全免费**，基于 MIT 许可证开源。使用本插件**无需支付任何费用**，也不存在任何需付费才能使用的功能。

## 支持开发（自愿）

如果你觉得本插件好用，并愿意**自愿**支持其开发，可以通过微信扫码打赏。这完全出于自愿——插件对所有人始终免费。

> ⚠️ **自愿赞助（项目永久免费开源，不强制付费）**
>
> 您可以请开发者喝一杯咖啡，资金全部用于服务器、硬件设备与版本迭代维护。

<img src="./docs/wx.jpg" width="200" alt="微信打赏">

## 许可证

[MIT](./LICENSE)
