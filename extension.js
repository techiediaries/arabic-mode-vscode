const vscode = require('vscode');

// Snapshot of editor settings before Arabic Mode was enabled
let previousSettings = null;
let readerPanel = null;

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('arabicMode.toggle', toggleArabicMode),
    vscode.commands.registerCommand('arabicMode.openReader', openRTLReader)
  );
}

// ─── Settings Toggle ──────────────────────────────────────────────────────────

async function toggleArabicMode() {
  const cfg = vscode.workspace.getConfiguration();
  const arabicCfg = vscode.workspace.getConfiguration('arabicMode');

  if (previousSettings) {
    // Restore saved settings
    await cfg.update('editor.fontFamily',   previousSettings.fontFamily,   true);
    await cfg.update('editor.fontSize',     previousSettings.fontSize,     true);
    await cfg.update('editor.lineHeight',   previousSettings.lineHeight,   true);
    await cfg.update('editor.wordWrap',     previousSettings.wordWrap,     true);
    await cfg.update('editor.letterSpacing',previousSettings.letterSpacing,true);
    await vscode.workspace.getConfiguration('workbench').update('colorTheme', previousSettings.theme, true);
    previousSettings = null;
    vscode.window.setStatusBarMessage('$(circle-outline) Arabic Mode OFF', 3000);
  } else {
    // Save current settings
    previousSettings = {
      fontFamily:    cfg.get('editor.fontFamily'),
      fontSize:      cfg.get('editor.fontSize'),
      lineHeight:    cfg.get('editor.lineHeight'),
      wordWrap:      cfg.get('editor.wordWrap'),
      letterSpacing: cfg.get('editor.letterSpacing'),
      theme:         vscode.workspace.getConfiguration('workbench').get('colorTheme'),
    };

    // Apply Arabic Mode settings
    await cfg.update('editor.fontFamily',    arabicCfg.get('font'),        true);
    await cfg.update('editor.fontSize',      arabicCfg.get('fontSize'),    true);
    await cfg.update('editor.lineHeight',    arabicCfg.get('lineHeight'),  true);
    await cfg.update('editor.wordWrap',      'on',                         true);
    await cfg.update('editor.letterSpacing', 0.5,                          true);
    await vscode.workspace.getConfiguration('workbench').update('colorTheme', arabicCfg.get('theme'), true);
    vscode.window.setStatusBarMessage('$(circle-filled) Arabic Mode ON — Ctrl+Shift+A to toggle off', 5000);
  }
}

// ─── RTL Reader Webview ───────────────────────────────────────────────────────

async function openRTLReader() {
  const editor = vscode.window.activeTextEditor;
  const arabicCfg = vscode.workspace.getConfiguration('arabicMode');

  let content = '';
  let title = 'Arabic Reader';

  if (editor) {
    content = editor.document.getText();
    title = editor.document.fileName.split('/').pop();
  }

  if (readerPanel) {
    readerPanel.reveal();
    readerPanel.webview.html = buildHTML(content, title, arabicCfg);
    return;
  }

  readerPanel = vscode.window.createWebviewPanel(
    'arabicReader',
    `📖 ${title}`,
    vscode.ViewColumn.Beside,
    { enableScripts: true, retainContextWhenHidden: true }
  );

  readerPanel.webview.html = buildHTML(content, title, arabicCfg);

  // Refresh when editor switches
  vscode.window.onDidChangeActiveTextEditor(ed => {
    if (readerPanel && ed) {
      readerPanel.webview.html = buildHTML(
        ed.document.getText(),
        ed.document.fileName.split('/').pop(),
        arabicCfg
      );
      readerPanel.title = `📖 ${ed.document.fileName.split('/').pop()}`;
    }
  });

  readerPanel.onDidDispose(() => { readerPanel = null; });
}

// ─── HTML Builder ─────────────────────────────────────────────────────────────

function buildHTML(markdownText, title, cfg) {
  const bg       = cfg.get('readerBackground');
  const fontSize = cfg.get('readerFontSize');
  const lineH    = cfg.get('readerLineHeight');
  const maxW     = cfg.get('readerMaxWidth');

  const themes = {
    sepia: { bg: '#f5efe6', text: '#2c1a0e', border: '#d4b896', code: '#f0e6d3', heading: '#7a3b1e' },
    dark:  { bg: '#1e1e2e', text: '#cdd6f4', border: '#45475a', code: '#313244', heading: '#89b4fa' },
    light: { bg: '#ffffff', text: '#1a1a2e', border: '#e2e8f0', code: '#f1f5f9', heading: '#1e40af' },
  };
  const t = themes[bg] || themes.sepia;

  // Minimal markdown → HTML (covers what's in these posts)
  const html = markdownToHTML(markdownText);

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHTML(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&family=Amiri:wght@400;700&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: ${t.bg};
    color: ${t.text};
    font-family: 'Cairo', 'Amiri', 'Traditional Arabic', 'Arial Unicode MS', Arial, sans-serif;
    font-size: ${fontSize}px;
    line-height: ${lineH};
    direction: rtl;
    text-align: right;
    padding: 2rem 1rem;
  }

  .container {
    max-width: ${maxW}px;
    margin: 0 auto;
  }

  /* Toolbar */
  .toolbar {
    position: sticky;
    top: 0;
    background: ${t.bg};
    border-bottom: 1px solid ${t.border};
    padding: 0.5rem 0 0.75rem;
    margin-bottom: 2rem;
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
    z-index: 10;
  }
  .toolbar button {
    background: none;
    border: 1px solid ${t.border};
    color: ${t.text};
    padding: 4px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-family: inherit;
    font-size: 13px;
    transition: background 0.15s;
  }
  .toolbar button:hover { background: ${t.code}; }
  .toolbar .filename {
    font-size: 12px;
    opacity: 0.5;
    margin-right: auto;
    font-family: monospace;
    direction: ltr;
  }

  /* Typography */
  h1, h2, h3, h4 {
    font-family: 'Cairo', sans-serif;
    color: ${t.heading};
    margin: 1.8em 0 0.6em;
    line-height: 1.4;
    font-weight: 700;
  }
  h1 { font-size: 1.9em; border-bottom: 2px solid ${t.border}; padding-bottom: 0.4em; }
  h2 { font-size: 1.5em; border-bottom: 1px solid ${t.border}; padding-bottom: 0.3em; }
  h3 { font-size: 1.25em; }

  p { margin: 0.9em 0; }

  a { color: ${t.heading}; }

  strong { font-weight: 700; color: ${t.heading}; }
  em { font-style: italic; }

  /* Lists */
  ul, ol {
    padding-right: 1.8em;
    padding-left: 0;
    margin: 0.8em 0;
  }
  li { margin: 0.4em 0; }

  /* Code */
  code {
    background: ${t.code};
    border: 1px solid ${t.border};
    padding: 1px 6px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 0.88em;
    direction: ltr;
    display: inline-block;
  }
  pre {
    background: ${t.code};
    border: 1px solid ${t.border};
    border-radius: 6px;
    padding: 1em;
    overflow-x: auto;
    margin: 1em 0;
    direction: ltr;
    text-align: left;
  }
  pre code { background: none; border: none; padding: 0; }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.2em 0;
    font-size: 0.95em;
  }
  th {
    background: ${t.code};
    color: ${t.heading};
    font-weight: 700;
    padding: 0.6em 0.9em;
    border: 1px solid ${t.border};
    text-align: right;
  }
  td {
    padding: 0.55em 0.9em;
    border: 1px solid ${t.border};
    text-align: right;
  }
  tr:nth-child(even) td { background: ${t.code}; }

  /* HR and blockquote */
  hr { border: none; border-top: 1px solid ${t.border}; margin: 2em 0; }
  blockquote {
    border-right: 4px solid ${t.heading};
    border-left: none;
    padding: 0.5em 1em;
    margin: 1em 0;
    background: ${t.code};
    border-radius: 0 4px 4px 0;
    opacity: 0.85;
  }

  /* Frontmatter block */
  .frontmatter {
    background: ${t.code};
    border: 1px solid ${t.border};
    border-radius: 6px;
    padding: 0.8em 1em;
    margin-bottom: 1.5em;
    font-size: 0.82em;
    font-family: monospace;
    direction: ltr;
    text-align: left;
    opacity: 0.6;
  }

  /* Font size controls */
  body.size-sm { font-size: ${Math.round(fontSize * 0.85)}px; }
  body.size-lg { font-size: ${Math.round(fontSize * 1.2)}px; }
  body.size-xl { font-size: ${Math.round(fontSize * 1.4)}px; }
</style>
</head>
<body>
<div class="container">
  <div class="toolbar">
    <button onclick="setSize('')">أ</button>
    <button onclick="setSize('size-lg')">أ+</button>
    <button onclick="setSize('size-xl')">أ++</button>
    <button onclick="setSize('size-sm')">أ-</button>
    <button onclick="window.print()">⎙ طباعة / PDF</button>
    <span class="filename">${escapeHTML(title)}</span>
  </div>
  <div id="content">${html}</div>
</div>
<script>
  function setSize(cls) {
    document.body.className = cls;
  }
</script>
</body>
</html>`;
}

// ─── Minimal Markdown Parser ──────────────────────────────────────────────────

function markdownToHTML(md) {
  // Strip YAML frontmatter and show it collapsed
  let frontmatter = '';
  md = md.replace(/^---\n([\s\S]*?)\n---\n?/, (_, fm) => {
    frontmatter = `<div class="frontmatter">${escapeHTML(fm)}</div>\n`;
    return '';
  });

  let html = escapeHTML(md);

  // Headings
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm,  '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm,   '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm,    '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm,     '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm,      '<h1>$1</h1>');

  // HR
  html = html.replace(/^---+$/gm, '<hr>');

  // Bold / italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g,      '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g,          '<em>$1</em>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Code blocks
  html = html.replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Blockquote
  html = html.replace(/^&gt;\s?(.+)$/gm, '<blockquote>$1</blockquote>');

  // Tables
  html = html.replace(/((?:^\|.+\|\n)+)/gm, (table) => {
    const rows = table.trim().split('\n');
    let out = '<table>';
    rows.forEach((row, i) => {
      if (/^\|[-\s|:]+\|$/.test(row)) return; // separator row
      const cells = row.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const tag = i === 0 ? 'th' : 'td';
      out += '<tr>' + cells.map(c => `<${tag}>${c}</${tag}>`).join('') + '</tr>';
    });
    return out + '</table>';
  });

  // Unordered lists
  html = html.replace(/((?:^[-*+]\s.+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^[-*+]\s/, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Paragraphs — wrap bare text lines
  html = html.replace(/^(?!<[a-z]).+$/gm, (line) => {
    if (!line.trim()) return '';
    return `<p>${line}</p>`;
  });

  // Clean up blank lines
  html = html.replace(/\n{3,}/g, '\n\n');

  return frontmatter + html;
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function deactivate() {}

module.exports = { activate, deactivate };
