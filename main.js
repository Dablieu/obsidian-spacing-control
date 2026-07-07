const { Plugin } = require('obsidian');

module.exports = class RemoveHeadingGapPlugin extends Plugin {
    onload() {
        let EditorView, Decoration, ViewPlugin, RangeSetBuilder;

        try {
            EditorView = require('@codemirror/view').EditorView;
            Decoration = require('@codemirror/view').Decoration;
            ViewPlugin = require('@codemirror/view').ViewPlugin;
            RangeSetBuilder = require('@codemirror/state').RangeSetBuilder;
        } catch (e) {
            console.log('RHG: require failed:', e.message);
            return;
        }

        const gapDeco = Decoration.line({ class: 'rhg-gap-line' });

        const buildDecorations = (view) => {
            const builder = new RangeSetBuilder();
            const doc = view.state.doc;

            for (let i = 2; i <= doc.lines; i++) {
                const prev = doc.line(i - 1);
                const cur = doc.line(i);

                // Current line must be empty
                const isEmpty = cur.text.length === 0 || cur.text.trim() === '';
                if (!isEmpty) continue;

                const prevText = prev.text.trim();
                // Previous line is a heading (# ...)
                const prevIsHeading = /^#{1,6}\s/.test(prevText);

                // Next line is a table (starts with |)
                let nextIsTable = false;
                if (i + 1 <= doc.lines) {
                    nextIsTable = /^\s*\|/.test(doc.line(i + 1).text);
                }

                // Hide empty line only if it's between a heading and something,
                // or right before a table (the user's core need).
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
        console.log('RHG: loaded');
    }

    onunload() {}
};
