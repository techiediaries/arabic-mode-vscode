# Arabic Mode for VS Code

A lightweight VS Code extension that makes reading Arabic and RTL markdown files actually comfortable.

VS Code's Monaco editor doesn't support RTL text direction natively — this extension works around that with two features you can enable independently: an editor settings toggle and a dedicated RTL reader panel.

![Arabic Mode Reader](https://img.shields.io/badge/VS%20Code-Extension-blue?logo=visualstudiocode)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

### RTL Reader Panel — `Ctrl+Shift+R`

Opens a webview panel beside your file that renders it with:

- Full right-to-left text direction
- **Cairo** and **Amiri** Arabic fonts (loaded from Google Fonts)
- Sepia / dark / light background themes
- Font size buttons in the panel (أ / أ+ / أ++)
- Rendered tables, headings, bold, lists, code blocks
- **Print / Export to PDF** button built in
- Auto-refreshes when you switch to a different editor tab

This is the main reading experience. Use it whenever you need to scan or read Arabic content comfortably.

### Editor Settings Toggle — `Ctrl+Shift+A`

Switches your global editor settings to an Arabic-friendly profile:

- Arabic font family (Amiri, Noto Naskh Arabic, Traditional Arabic)
- Larger font size and line height
- Word wrap enabled
- Your configured color theme

Press again to restore your original settings exactly as they were. Nothing is permanently changed.

> **Note:** Monaco (the VS Code editor engine) does not support RTL text direction. The cursor and line flow stay left-to-right regardless. This is a VS Code engine limitation that no extension can fix. The RTL Reader panel is the workaround.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+R` / `Cmd+Shift+R` | Open RTL Reader panel |
| `Ctrl+Shift+A` / `Cmd+Shift+A` | Toggle editor Arabic settings |

---

## Installation

### Option 1 — Run from source (no packaging)

```bash
git clone https://github.com/techiediaries/arabic-mode-vscode.git
cd arabic-mode-vscode
```

Open the folder in VS Code, then press **F5**. A new Extension Development Host window opens with the extension active.

### Option 2 — Package as VSIX

```bash
npm install -g @vscode/vsce
vsce package
# produces arabic-mode-0.1.0.vsix
```

In VS Code: `Extensions` → `···` menu → `Install from VSIX...` → select the file.

---

## Configuration

All settings live under `arabicMode.*` in your `settings.json` or the Settings UI.

```json
{
  "arabicMode.font": "Amiri, 'Noto Naskh Arabic', 'Traditional Arabic', Arial",
  "arabicMode.fontSize": 16,
  "arabicMode.lineHeight": 2,
  "arabicMode.theme": "Default Dark Modern",

  "arabicMode.readerBackground": "sepia",
  "arabicMode.readerFontSize": 20,
  "arabicMode.readerLineHeight": 2.2,
  "arabicMode.readerMaxWidth": 820
}
```

| Setting | Type | Default | Description |
|---|---|---|---|
| `arabicMode.font` | string | `"Amiri, 'Noto Naskh Arabic'..."` | Font family for the editor toggle |
| `arabicMode.fontSize` | number | `16` | Font size (px) for the editor toggle |
| `arabicMode.lineHeight` | number | `2` | Line height for the editor toggle |
| `arabicMode.theme` | string | `"Default Dark Modern"` | VS Code theme applied by the toggle |
| `arabicMode.readerBackground` | `sepia` \| `dark` \| `light` | `"sepia"` | Reader panel background |
| `arabicMode.readerFontSize` | number | `20` | Font size (px) in the reader panel |
| `arabicMode.readerLineHeight` | number | `2.2` | Line height in the reader panel |
| `arabicMode.readerMaxWidth` | number | `820` | Max content width (px) in the reader panel |

---

## Reader Themes

| Theme | Background | Best for |
|---|---|---|
| `sepia` | Warm off-white `#f5efe6` | Long reading sessions, daylight |
| `dark` | Deep dark `#1e1e2e` | Night reading, dark room |
| `light` | Clean white `#ffffff` | High contrast, printing |

Change via `arabicMode.readerBackground` in settings.

---

## How the PDF export works

The reader panel has a **⎙ طباعة / PDF** button that calls `window.print()`. In VS Code's webview, this opens your system print dialog. Choose "Save as PDF" to export the rendered content as a clean Arabic PDF — fonts, RTL layout, and all.

---

## Markdown support in the reader

The reader parses the most common markdown constructs:

- Headings (`#` through `######`)
- Bold, italic, bold+italic
- Tables
- Unordered lists
- Inline code and fenced code blocks
- Blockquotes
- Horizontal rules
- Links
- YAML frontmatter (shown collapsed)

It's intentionally minimal — no external dependencies, no build step.

---

## Why this exists

VS Code is the most common editor for Arabic developers, but reading Arabic markdown in it is painful: wrong text direction, fonts that don't render Arabic properly, tight line spacing. Browser-based solutions exist but break the flow of working in the editor.

This extension stays inside VS Code, requires no configuration to start working, and gets out of the way when you don't need it.

---

## License

MIT — do whatever you want with it.

---

## Contributing

Issues and PRs welcome. The whole extension is a single `extension.js` file with no build step — it's easy to read and modify.

If you add a feature, keep the zero-dependency principle: no npm packages in the runtime, only the VS Code API.
