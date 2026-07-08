<div align="center">

**Language / 语言:** [English](README.md) · [中文](README.zh.md)

</div>

# Table Gap Remover

Hide the blank line above tables in Obsidian **Live Preview** mode.

> **Requires Obsidian 1.12.7 or higher.**

> **Domestic users (China):** the source code is also mirrored on Gitee: https://gitee.com/Dablieu/table-gap-remover

## Problem

In Live Preview, a table (`| ... |`) always renders with an extra blank line above it. That line is clickable and visually distracting.

Standard CSS snippets and inline-style hacks cannot remove it — Obsidian's CodeMirror 6 editor re-renders and overwrites any external style on every frame.

## Solution

This plugin uses the official **CodeMirror 6 Decoration + Theme** API to hide those blank lines as part of the editor's own rendering pipeline. The hidden line is removed from layout but the source markdown is never modified.

- Blank line **above a table** (`|`) → hidden
- Normal paragraph breaks (empty line between two text blocks) → **kept**

## Installation

### From Community Plugins (once approved)
1. Settings → Community plugins → Browse
2. Search "Table Gap Remover"
3. Install & enable

### Manual
Copy the `table-gap-remover` folder into your vault's `.obsidian/plugins/` directory, then enable it in Settings → Community plugins.

## How it works

The plugin registers a CodeMirror 6 `ViewPlugin` that adds a `rhg-gap-line` decoration class to empty lines directly above a table row. An `EditorView.theme` with maximum priority collapses those lines to zero height.

## Demo

Before (Table Gap Remover disabled — the blank line above the table is visible and clickable):

![before](.\docs\测试图片-未打开插件.png)

After enabling Table Gap Remover, the gap above the table disappears:

![after](.\docs\测试图片-打开插件.png)

## Free & Open Source

This plugin is **completely free** and released under the MIT license. There is **no payment required** to use it, and no features are locked behind a paywall.

## Support the Development (Optional)

If you find this plugin helpful and would like to **voluntarily** support its development, you may send a tip via WeChat. This is entirely optional — the plugin remains free for everyone.

> ⚠️ **Voluntary donation** — this project is permanently free & open-source; no forced payment required. You may buy me a coffee to help cover servers, hardware, and ongoing development maintenance costs.

<img src=".\docs\wx.jpg" width="200" alt="WeChat tip">

## License

[MIT](./LICENSE)
