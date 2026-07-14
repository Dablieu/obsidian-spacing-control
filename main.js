const { Plugin, PluginSettingTab, Setting } = require('obsidian');

const DEFAULT_SETTINGS = {
    // 标题(h1/h2/h3) 间距
    headingMarginTop: 10,      // 标题上边距
    headingMarginBottom: 10,   // 标题下边距（到正文）
    // 段落(p/li) 间距
    paraMarginTop: 10,         // 段落上边距
    paraMarginBottom: 10,      // 段落下边距
    // 列表(ol/ul) 间距
    listMarginTop: 10,          // 列表上边距
    listMarginBottom: 10,       // 列表下边距
    // 表格间距
    tableMarginTop: 5,         // 表格上边距
    tableMarginBottom: 0,      // 表格下边距
    compactTable: true,        // 紧凑表格（列宽按内容自适应），全局开关
    livePreviewGap: true,      // 实时预览下隐藏标题后/表格前空行
    // 表格美化
    tableBeauty: true,          // 表格美化总开关
    beautyHeaderColor: '#6c6800', // 表头背景色（暗橄榄黄，与用户配置一致）
    beautyBorderColor: '#515151', // 边框颜色
    beautyBorderWidth: 2,       // 边框粗细(px)
    beautyBorderRadius: 6,      // 圆角半径(px)
};

class RHGSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Spacing Control 设置' });

        // ========== 顶部标签栏 ==========
        const nav = containerEl.createDiv({ cls: 'rhg-tab-nav' });
        const tabLp = nav.createEl('button', { cls: 'rhg-tab rhg-tab-active', text: '实时预览' });
        const tabRv = nav.createEl('button', { cls: 'rhg-tab', text: '阅读模式' });
        const tabBeauty = nav.createEl('button', { cls: 'rhg-tab', text: '表格美化' });

        // 内容容器
        const content = containerEl.createDiv({ cls: 'rhg-tab-content' });

        // ----- 实时预览面板 -----
        const lpPanel = content.createDiv({ cls: 'rhg-panel' });
        new Setting(lpPanel)
            .setName('隐藏标题后空行')
            .setDesc('自动隐藏标题(#)后、表格(|)前的空行')
            .addToggle(t => t
                .setValue(this.plugin.settings.livePreviewGap)
                .onChange(async (v) => {
                    this.plugin.settings.livePreviewGap = v;
                    await this.plugin.saveSettings();
                    // buildDecorations 会在下次 editor update 时自动读取新值
                }));
        lpPanel.createEl('p', {
            cls: 'rhg-note',
            text: '紧凑表格（列宽自适应）开关在「阅读模式」标签中，同时作用于实时预览。',
        });

        // ----- 阅读模式面板（默认隐藏）-----
        const rvPanel = content.createDiv({ cls: 'rhg-panel rhg-hidden' });

        // ---- 间距表格（功能 / 上边距 / 下边距）----
        const table = rvPanel.createEl('table', { cls: 'rhg-gap-table' });
        const thead = table.createEl('thead').createEl('tr');
        thead.createEl('th', { text: '功能' });
        thead.createEl('th', { text: '上边距 (px)' });
        thead.createEl('th', { text: '下边距 (px)' });

        const tbody = table.createEl('tbody');

        // 辅助：创建一行
        const makeRow = (label, topKey, bottomKey, onTopChange, onBottomChange) => {
            const tr = tbody.createEl('tr');
            tr.createEl('td', { text: label, cls: 'rhg-label' });
            const tdTop = tr.createEl('td');
            const inpTop = tdTop.createEl('input', {
                type: 'text',
                cls: 'rhg-input',
                value: String(this.plugin.settings[topKey]),
            });
            inpTop.oninput = async () => {
                const n = parseFloat(inpTop.value);
                this.plugin.settings[topKey] = isNaN(n) ? 0 : n;
                await this.plugin.saveSettings();
                onTopChange();
            };
            const tdBottom = tr.createEl('td');
            const inpBottom = tdBottom.createEl('input', {
                type: 'text',
                cls: 'rhg-input',
                value: String(this.plugin.settings[bottomKey]),
            });
            inpBottom.oninput = async () => {
                const n = parseFloat(inpBottom.value);
                this.plugin.settings[bottomKey] = isNaN(n) ? 0 : n;
                await this.plugin.saveSettings();
                onBottomChange();
            };
        };

        makeRow('标题 (h1-h3)', 'headingMarginTop', 'headingMarginBottom',
            () => this.plugin.applyCSS(), () => this.plugin.applyCSS());
        makeRow('段落 (p/li)',  'paraMarginTop',  'paraMarginBottom',
            () => this.plugin.applyCSS(), () => this.plugin.applyCSS());
        makeRow('列表 (ol/ul)',  'listMarginTop',   'listMarginBottom',
            () => this.plugin.applyCSS(), () => this.plugin.applyCSS());
        makeRow('表格',         'tableMarginTop','tableMarginBottom',
            () => this.plugin.scanReadingView(), () => this.plugin.scanReadingView());

        // ---- 紧凑表格开关 ----
        new Setting(rvPanel)
            .setName('紧凑表格（列宽自适应）')
            .setDesc('所有表格列宽按内容自适应（不平均分配）。笔记 YAML cssclasses：[紧凑表格]强制开，[宽松表格]强制关')
            .addToggle(t => t
                .setValue(this.plugin.settings.compactTable)
                .onChange(async (v) => {
                    this.plugin.settings.compactTable = v;
                    await this.plugin.saveSettings();
                    this.plugin.applyCompactCSS();
                }));

        // ---- 恢复默认按钮 ----
        const btnRow = rvPanel.createDiv({ cls: 'rhg-reset-row' });
        const resetBtn = btnRow.createEl('button', { cls: 'rhg-reset-btn', text: '恢复默认配置' });
        resetBtn.onclick = async () => {
            // 确认弹窗
            if (!confirm('确定要将所有间距和开关恢复为默认值吗？')) return;
            Object.assign(this.plugin.settings, DEFAULT_SETTINGS);
            await this.plugin.saveSettings();
            this.plugin.applyCSS();
            this.plugin.applyCompactCSS();
            this.plugin.applyTableBeautyCSS();
            this.plugin.scanReadingView();
            // 刷新设置面板显示新值
            this.display();
        };

        // ---------- 切换逻辑 ----------
        const switchTab = (activeTab, activePanel) => {
            nav.findAll('.rhg-tab').forEach(t => t.removeClass('rhg-tab-active'));
            content.findAll('.rhg-panel').forEach(p => p.addClass('rhg-hidden'));
            activeTab.addClass('rhg-tab-active');
            activePanel.removeClass('rhg-hidden');
        };
        tabLp.onclick = () => switchTab(tabLp, lpPanel);
        tabRv.onclick = () => switchTab(tabRv, rvPanel);

        // ----- 表格美化面板（默认隐藏）-----
        const beautyPanel = content.createDiv({ cls: 'rhg-panel rhg-hidden' });

        new Setting(beautyPanel)
            .setName('启用表格美化')
            .setDesc('黄色表头 + 边框线条 + 圆角等美化样式（同时作用于阅读模式与实时预览）')
            .addToggle(t => t
                .setValue(this.plugin.settings.tableBeauty)
                .onChange(async (v) => {
                    this.plugin.settings.tableBeauty = v;
                    await this.plugin.saveSettings();
                    this.plugin.applyTableBeautyCSS();
                }));

        new Setting(beautyPanel)
            .setName('表头背景色')
            .setDesc('表格第一行（表头）的背景颜色')
            .addColorPicker(c => c
                .setValue(this.plugin.settings.beautyHeaderColor)
                .onChange(async (v) => {
                    this.plugin.settings.beautyHeaderColor = v;
                    await this.plugin.saveSettings();
                    this.plugin.applyTableBeautyCSS();
                }));

        new Setting(beautyPanel)
            .setName('边框颜色')
            .setDesc('表格外框与单元格分隔线的颜色')
            .addColorPicker(c => c
                .setValue(this.plugin.settings.beautyBorderColor)
                .onChange(async (v) => {
                    this.plugin.settings.beautyBorderColor = v;
                    await this.plugin.saveSettings();
                    this.plugin.applyTableBeautyCSS();
                }));

        const widthText = new Setting(beautyPanel)
            .setName('边框粗细 (px)')
            .setDesc('表格线条的粗细')
            .addText(t => {
                t.inputEl.type = 'number';
                t.inputEl.min = '0';
                t.inputEl.value = String(this.plugin.settings.beautyBorderWidth);
                t.inputEl.oninput = async () => {
                    const n = parseFloat(t.inputEl.value);
                    this.plugin.settings.beautyBorderWidth = isNaN(n) ? 0 : n;
                    await this.plugin.saveSettings();
                    this.plugin.applyTableBeautyCSS();
                };
            });
        widthText.controlEl.querySelector('input').addClass('rhg-num-input');

        const radiusText = new Setting(beautyPanel)
            .setName('圆角半径 (px)')
            .setDesc('表格四角的圆角弧度，0 为直角')
            .addText(t => {
                t.inputEl.type = 'number';
                t.inputEl.min = '0';
                t.inputEl.value = String(this.plugin.settings.beautyBorderRadius);
                t.inputEl.oninput = async () => {
                    const n = parseFloat(t.inputEl.value);
                    this.plugin.settings.beautyBorderRadius = isNaN(n) ? 0 : n;
                    await this.plugin.saveSettings();
                    this.plugin.applyTableBeautyCSS();
                };
            });
        radiusText.controlEl.querySelector('input').addClass('rhg-num-input');

        // ---- 表格美化：恢复默认按钮 ----
        const beautyBtnRow = beautyPanel.createDiv({ cls: 'rhg-reset-row' });
        const beautyResetBtn = beautyBtnRow.createEl('button', { cls: 'rhg-reset-btn', text: '恢复表格美化默认' });
        beautyResetBtn.onclick = async () => {
            if (!confirm('确定要将表格美化（表头色/边框/圆角）恢复为默认值吗？')) return;
            // 仅重置表格美化相关字段
            this.plugin.settings.tableBeauty = DEFAULT_SETTINGS.tableBeauty;
            this.plugin.settings.beautyHeaderColor = DEFAULT_SETTINGS.beautyHeaderColor;
            this.plugin.settings.beautyBorderColor = DEFAULT_SETTINGS.beautyBorderColor;
            this.plugin.settings.beautyBorderWidth = DEFAULT_SETTINGS.beautyBorderWidth;
            this.plugin.settings.beautyBorderRadius = DEFAULT_SETTINGS.beautyBorderRadius;
            await this.plugin.saveSettings();
            this.plugin.applyTableBeautyCSS();
            this.display();
        };

        // 切换逻辑补充：表格美化标签
        tabBeauty.onclick = () => switchTab(tabBeauty, beautyPanel);
    }
}

module.exports = class RemoveHeadingGapPlugin extends Plugin {
    async onload() {
        // 加载设置
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

        // 旧设置迁移：headingBottom/paraVertical/tableGap → 新的独立上下边距参数
        if (this.settings.headingBottom !== undefined && this.settings.headingMarginBottom === DEFAULT_SETTINGS.headingMarginBottom) {
            this.settings.headingMarginBottom = this.settings.headingBottom;
        }
        if (this.settings.paraVertical !== undefined && this.settings.paraMarginTop === DEFAULT_SETTINGS.paraMarginTop) {
            this.settings.paraMarginTop = this.settings.paraVertical;
            this.settings.paraMarginBottom = this.settings.paraVertical;
        }
        if (this.settings.tableGap !== undefined && this.settings.tableMarginTop === DEFAULT_SETTINGS.tableMarginTop) {
            this.settings.tableMarginTop = this.settings.tableGap;
            this.settings.tableMarginBottom = this.settings.tableGap;
        }

        // 应用阅读模式的 CSS（标题/段落间距）
        this.applyCSS();
        // 应用紧凑表格（列宽自适应）样式
        this.applyCompactCSS();
        // 应用表格美化（表头色/边框/圆角）样式
        this.applyTableBeautyCSS();

        // ===================== Live Preview (CodeMirror) =====================
        let EditorView, Decoration, ViewPlugin, RangeSetBuilder;
        try {
            EditorView = require('@codemirror/view').EditorView;
            Decoration = require('@codemirror/view').Decoration;
            ViewPlugin = require('@codemirror/view').ViewPlugin;
            RangeSetBuilder = require('@codemirror/state').RangeSetBuilder;
        } catch (e) {
            console.log('RHG: CodeMirror require failed:', e.message);
        }

        if (EditorView) {
            const gapDeco = Decoration.line({ class: 'rhg-gap-line' });

            const buildDecorations = (view) => {
                // 开关关闭时不标记任何行
                if (!this.settings.livePreviewGap) return Decoration.none;
                const builder = new RangeSetBuilder();
                const doc = view.state.doc;

                for (let i = 2; i <= doc.lines; i++) {
                    const prev = doc.line(i - 1);
                    const cur = doc.line(i);

                    const isEmpty = cur.text.length === 0 || cur.text.trim() === '';
                    if (!isEmpty) continue;

                    const prevText = prev.text.trim();
                    const prevIsHeading = /^#{1,6}\s/.test(prevText);

                    let nextIsTable = false;
                    if (i + 1 <= doc.lines) {
                        nextIsTable = /^\s*\|/.test(doc.line(i + 1).text);
                    }

                    if (prevIsHeading || nextIsTable) {
                        builder.add(cur.from, cur.from, gapDeco);
                    }
                }
                return builder.finish();
            };

            const rhgPlugin = ViewPlugin.define((view) => ({
                decorations: buildDecorations(view),
                update(update) {
                    this.decorations = buildDecorations(update.view);
                },
            }), { decorations: v => v.decorations });

            // 不再依赖 body class，直接隐藏所有 rhg-gap-line 行
            const rhgTheme = EditorView.theme({
                '.cm-line.rhg-gap-line': {
                    display: 'none !important',
                    height: '0 !important',
                    minHeight: '0 !important',
                    lineHeight: '0 !important',
                    padding: '0 !important',
                    margin: '0 !important',
                    overflow: 'hidden !important',
                    fontSize: '0px !important',
                },
            }, { priority: 10000000 });

            this.registerEditorExtension([rhgTheme, rhgPlugin]);
            console.log('RHG: Live Preview loaded');
        }

        // ===================== Reading View (JS) =====================
        this.setupReadingView();

        // ===================== 设置面板 =====================
        this.addSettingTab(new RHGSettingTab(this.app, this));
    }

    // 动态注入阅读模式的 CSS（标题/段落/列表间距）
    applyCSS() {
        let style = document.getElementById('rhg-rv-style');
        if (!style) {
            style = document.createElement('style');
            style.id = 'rhg-rv-style';
            document.head.appendChild(style);
        }
        const { headingMarginTop, headingMarginBottom, paraMarginTop, paraMarginBottom, listMarginTop, listMarginBottom } = this.settings;
        style.textContent =
            `.markdown-preview-view :is(h1, h2, h3){ margin-top:${headingMarginTop}px; margin-bottom:${headingMarginBottom}px; }\n` +
            `.markdown-preview-view :is(p, li){ margin-top:${paraMarginTop}px; margin-bottom:${paraMarginBottom}px; }\n` +
            `.markdown-preview-view :is(ol, ul){ margin-top:${listMarginTop}px; margin-bottom:${listMarginBottom}px; }`;
        console.log('RHG: CSS applied (h:%s/%s, p:%s/%s, l:%s/%s)', headingMarginTop, headingMarginBottom, paraMarginTop, paraMarginBottom, listMarginTop, listMarginBottom);
    }

    // 紧凑表格（列宽按内容自适应，不平均分配）样式注入
    applyCompactCSS() {
        let style = document.getElementById('rhg-compact-style');
        if (!style) {
            style = document.createElement('style');
            style.id = 'rhg-compact-style';
            document.head.appendChild(style);
        }
        const on = this.settings.compactTable;

        // 局部：.紧凑表格 笔记强制紧凑（始终可用，独立于全局开关）
        let css = `
.紧凑表格 .markdown-rendered table,
.紧凑表格 .markdown-source-view.mod-cm6 .cm-table-widget table {
  width: 100% !important;
  table-layout: auto !important;
}
.紧凑表格 .markdown-rendered table th,
.紧凑表格 .markdown-source-view.mod-cm6 .cm-table-widget table th {
  white-space: nowrap !important;
}
.紧凑表格 .markdown-rendered table :is(th, td),
.紧凑表格 .markdown-source-view.mod-cm6 .cm-table-widget table :is(th, td) {
  min-width: 5em !important;
}
.紧凑表格 .markdown-source-view.mod-cm6 .cm-table-widget .table-wrapper {
  width: 100% !important;
}
`;

        // 全局开启：所有表格紧凑（.宽松表格 笔记会被下方规则覆盖）
        if (on) {
            css += `
.markdown-rendered table {
  width: 100% !important;
  table-layout: auto !important;
}
.markdown-rendered table th {
  white-space: nowrap !important;
}
.markdown-rendered table :is(th, td) {
  min-width: 5em !important;
}
.markdown-source-view.mod-cm6 .cm-table-widget table {
  width: 100% !important;
  table-layout: auto !important;
}
.markdown-source-view.mod-cm6 .cm-table-widget table th {
  white-space: nowrap !important;
}
.markdown-source-view.mod-cm6 .cm-table-widget table :is(th, td) {
  min-width: 5em !important;
}
.markdown-source-view.mod-cm6 .cm-table-widget .table-wrapper {
  width: 100% !important;
}
`;
        }

        // 局部：.宽松表格 笔记强制宽松（覆盖全局开启）
        css += `
.宽松表格 .markdown-rendered table,
.宽松表格 .markdown-source-view.mod-cm6 .cm-table-widget table {
  width: auto !important;
  table-layout: fixed !important;
}
.宽松表格 .markdown-rendered table th,
.宽松表格 .markdown-source-view.mod-cm6 .cm-table-widget table th {
  white-space: normal !important;
}
`;

        style.textContent = css;
        console.log('RHG: compact table CSS applied (global=%s)', on);
    }

    // 表格美化（表头背景色 / 边框颜色 / 边框粗细 / 圆角）样式注入
    applyTableBeautyCSS() {
        let style = document.getElementById('rhg-beauty-style');
        if (!style) {
            style = document.createElement('style');
            style.id = 'rhg-beauty-style';
            document.head.appendChild(style);
        }
        const s = this.settings;
        if (!s.tableBeauty) {
            style.textContent = '';
            console.log('RHG: table beauty disabled');
            return;
        }

        const header = s.beautyHeaderColor || 'transparent';
        const border = s.beautyBorderColor || '#515151';
        const width = (s.beautyBorderWidth || 0) + 'px';
        const radius = (s.beautyBorderRadius || 0) + 'px';

        // 选择器：阅读模式 table + 实时预览 cm-table-widget
        const viewSel = '.markdown-rendered table, .markdown-source-view.mod-cm6 .cm-table-widget .table-wrapper';
        const thSel = '.markdown-rendered table th, .markdown-source-view.mod-cm6 .cm-table-widget table th';

        style.textContent =
            // 表头背景色
            `${thSel}{ background-color:${header} !important; }\n` +
            // 边框颜色 + 粗细（Obsidian 通过 CSS 变量控制所有表格线）
            `${viewSel}{ --table-border-color:${border}; --table-border-width:${width}; }\n` +
            // 圆角：需要 border-collapse:initial 才能给四角设圆角
            `${viewSel}{ border-collapse:initial; border-spacing:0; }\n` +
            `${viewSel} th:first-child{ border-top-left-radius:${radius}; }\n` +
            `${viewSel} th:last-child{ border-top-right-radius:${radius}; }\n` +
            `${viewSel} tr:last-child td:first-child{ border-bottom-left-radius:${radius}; }\n` +
            `${viewSel} tr:last-child td:last-child{ border-bottom-right-radius:${radius}; }\n`;

        console.log('RHG: table beauty applied (header=%s, border=%s, w=%s, r=%s)', header, border, width, radius);
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    setupReadingView() {
        const DEBUG = false;

        const processTable = (table) => {
            const wrapper = table.closest('.el-table') || table.parentElement;
            if (wrapper.dataset.rhgProcessed) return;
            wrapper.dataset.rhgProcessed = '1';

            const mt = this.settings.tableMarginTop;
            const mb = this.settings.tableMarginBottom;

            // 表格自身 + wrapper 的 margin
            table.style.marginTop = mt + 'px';
            table.style.marginBottom = mb + 'px';
            wrapper.style.marginTop = mt + 'px';
            wrapper.style.marginBottom = mb + 'px';

            const prev = wrapper.previousElementSibling;
            if (prev) {
                prev.style.marginBottom = mt + 'px';
                const inner = prev.firstElementChild;
                if (inner) inner.style.marginBottom = mt + 'px';

                // 空段落仍隐藏
                const txt = (prev.textContent || '').trim();
                if (prev.tagName === 'P' && (txt === '' || prev.querySelector('br') && txt.length <= 1)) {
                    prev.style.display = 'none';
                }
            }
        };

        this.scanReadingView = () => {
            // 清除旧标记，强制用最新配置重扫
            document.querySelectorAll('[data-rhg-processed]')
                .forEach(el => delete el.dataset.rhgProcessed);
            document.querySelectorAll('.markdown-preview-view table')
                .forEach(processTable);
        };

        // 初始扫描 + MutationObserver 监听动态渲染
        this.scanReadingView();
        const observer = new MutationObserver(() => {
            clearTimeout(this._rvTimer);
            this._rvTimer = setTimeout(() => {
                document.querySelectorAll('.markdown-preview-view table')
                    .forEach(processTable);
            }, 60);
        });
        observer.observe(document.body, { childList: true, subtree: true });
        this.register(() => observer.disconnect());

        console.log('RHG: Reading View handler attached');
    }

    onunload() {}
};
