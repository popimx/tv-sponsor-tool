 // ===============================
// ページ読み込み（タイトル下線付き）
// ===============================
async function loadPage(path) {
  const res = await fetch(path);

  if (!res.ok) {
    showEditor(path);
    return;
  }

  const text = await res.text();
  const bodyHtml = parse(text);

  const pageTitle = decodeURIComponent(
    path.replace('pages/', '').replace('.txt', '')
  );

  const titleHtml = `
    <div class="page-title">
      <h2>${pageTitle}</h2>
      <div class="page-underline">
        ${'━'.repeat(pageTitle.length)}
      </div>
    </div>
  `;

  document.getElementById('content').innerHTML =
    titleHtml + bodyHtml;

  markMissingLinks();
}

// ===============================
// Wiki構文パーサ
// ・内部リンクは絶対に太字にしない
// ・外部リンクは必ず青・クリック可
// ・&br() 改行対応
// ・空白行対応
// ===============================
function parse(text) {
  let html = text;

  // -------------------------------
  // 外部リンク（最優先）
  // -------------------------------
  html = html.replace(
    /\[\[(.+?)>(https?:\/\/.+?)\]\]/g,
    (_, label, url) =>
      `<a href="${url}" target="_blank" rel="noopener" class="external-link">${label}</a>`
  );

  html = html.replace(
    /\[\[(https?:\/\/.+?)\]\]/g,
    (_, url) =>
      `<a href="${url}" target="_blank" rel="noopener" class="external-link">${url}</a>`
  );

  // -------------------------------
  // 内部リンク退避
  // -------------------------------
  const internalLinks = [];
  html = html.replace(/\[\[(?:(.+?)>)?(.+?)\]\]/g, (_, label, page) => {
    const idx = internalLinks.length;
    internalLinks.push({
      label: label || page,
      page
    });
    return `%%INTERNAL_LINK_${idx}%%`;
  });

  // -------------------------------
  // マクロ
  // -------------------------------
  html = html.replace(/&bold\(\)\{(.+?)\}/g, '<strong>$1</strong>');
  html = html.replace(/&br\(\)/g, '<br>');

  // -------------------------------
  // 見出し
  // -------------------------------
  html = html.replace(/^\*\*\*\s*(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^\*\*\s*(.+)$/gm, '<h3>$1</h3>');

  // -------------------------------
  // 箇条書き
  // -------------------------------
  html = html.replace(/(?:^- .+\n?)+/gm, block => {
    const items = block
      .trim()
      .split('\n')
      .map(line => `<li>${line.replace(/^- /, '')}</li>`)
      .join('');
    return `<ul>${items}</ul>`;
  });

  // -------------------------------
  // 段落・空行処理
  // -------------------------------
  html = html
    .split(/\n{2,}/)
    .map(block => {
      block = block.trim();
      if (!block) return '<p class="blank">&nbsp;</p>';
      if (/^<h|^<ul|^<li|^<br>/.test(block)) return block;
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');

  // -------------------------------
  // 内部リンク復元（太字禁止）
  // -------------------------------
  internalLinks.forEach((link, i) => {
    html = html.replace(
      `%%INTERNAL_LINK_${i}%%`,
      `<a href="?page=${encodeURIComponent(link.page)}"
          data-page="${link.page}"
          class="internal-link">${link.label}</a>`
    );
  });

  return html;
}

// ===============================
// 未作成リンク検出（色はCSSで制御）
// ===============================
async function markMissingLinks() {
  const links = document.querySelectorAll('a[data-page]');

  for (const link of links) {
    const page = link.dataset.page;
    try {
      const res = await fetch(`pages/${page}.txt`);
      if (!res.ok) link.classList.add('missing');
    } catch {
      link.classList.add('missing');
    }
  }
}

// ===============================
// 未作成ページ表示
// ===============================
const IS_ADMIN = false; // ← 管理人だけ true

function showEditor(path) {
  const title = decodeURIComponent(
    path.replace('pages/', '').replace('.txt', '')
  );

  if (!IS_ADMIN) {
    document.getElementById('content').innerHTML = `
      <div class="page-title">
        <h2>${title}</h2>
        <div class="page-underline">${'━'.repeat(title.length)}</div>
      </div>
      <p>この記事はまだ存在しません。</p>
    `;
    return;
  }

  document.getElementById('content').innerHTML = `
    <div class="page-title">
      <h2>${title}</h2>
      <div class="page-underline">${'━'.repeat(title.length)}</div>
    </div>

    <textarea id="editor" rows="16"
      style="width:100%; box-sizing:border-box;"></textarea>

    <p style="margin-top:8px;font-size:0.9em;color:#666;">
      pages/${title}.txt として保存してください
    </p>
  `;
}