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

  // ページ名をURLから取得
  const pageTitle = decodeURIComponent(
    path.replace('pages/', '').replace('.txt', '')
  );

  // タイトル＋文字数連動下線
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
// ・外部リンクは必ず有効
// ・内部リンクは絶対に太字にしない
// ・&br() は確実に改行
// ・空白行は可視化
// ===============================
function parse(text) {
  let html = text;

  // -------------------------------
  // 外部リンクを先に処理（壊さない）
  // -------------------------------
  html = html.replace(
    /\[\[(.+?)>(https?:\/\/[^\]]+)\]\]/g,
    (_, label, url) =>
      `<a href="${url}" target="_blank" rel="noopener" class="external-link">${label}</a>`
  );

  html = html.replace(
    /\[\[(https?:\/\/[^\]]+)\]\]/g,
    (_, url) =>
      `<a href="${url}" target="_blank" rel="noopener" class="external-link">${url}</a>`
  );

  // -------------------------------
  // 内部リンクをプレースホルダ化
  // [[]] は一切装飾させないため
  // -------------------------------
  const internalLinks = [];
  html = html.replace(/\[\[(?:(.+?)>)?([^\]]+)\]\]/g, (_, display, page) => {
    const i = internalLinks.length;
    internalLinks.push({
      display: display || page,
      page
    });
    return `%%INTERNAL_LINK_${i}%%`;
  });

  // -------------------------------
  // 装飾マクロ
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
  html = html.replace(/(?:^- .+(?:\n|$))+/gm, block => {
    const items = block
      .trim()
      .split('\n')
      .map(line => `<li>${line.replace(/^- /, '')}</li>`)
      .join('');
    return `<ul>${items}</ul>`;
  });

  // -------------------------------
  // 段落処理（空白行を維持）
  // -------------------------------
  html = html
    .split(/\n{2,}/)
    .map(block => {
      if (!block.trim()) {
        return '<div class="blank-line"></div>';
      }
      if (/^<h|^<ul|^<li|^<br>/.test(block.trim())) {
        return block;
      }
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');

  // -------------------------------
  // 内部リンク復元（太字完全禁止）
  // -------------------------------
  internalLinks.forEach((link, i) => {
    html = html.replace(
      `%%INTERNAL_LINK_${i}%%`,
      `<a href="?page=${encodeURIComponent(link.page)}" data-page="${link.page}" class="internal-link">${link.display}</a>`
    );
  });

  return html;
}

// ===============================
// 未作成リンク判定（見た目は青のまま）
// ===============================
async function markMissingLinks() {
  const links = document.querySelectorAll('a[data-page]');

  for (const link of links) {
    const page = link.dataset.page;

    try {
      const res = await fetch(`pages/${page}.txt`);
      if (!res.ok) {
        link.classList.add('missing');
        link.title = '未作成ページ';
      }
    } catch {
      link.classList.add('missing');
    }
  }
}

// ===============================
// 管理人判定（URL ?admin=1）
// ===============================
function isAdmin() {
  const params = new URLSearchParams(location.search);
  return params.get('admin') === '1';
}

// ===============================
// 未作成ページ表示
// ===============================
function showEditor(path) {
  const title = decodeURIComponent(
    path.replace('pages/', '').replace('.txt', '')
  );

  // 管理人以外
  if (!isAdmin()) {
    document.getElementById('content').innerHTML = `
      <div class="page-title">
        <h2>${title}</h2>
        <div class="page-underline">
          ${'━'.repeat(title.length)}
        </div>
      </div>
      <p>この記事はまだ存在しません。</p>
    `;
    return;
  }

  // 管理人用
  document.getElementById('content').innerHTML = `
    <div class="page-title">
      <h2>${title}</h2>
      <div class="page-underline">
        ${'━'.repeat(title.length)}
      </div>
    </div>

    <p>この記事はまだ存在しません。</p>

    <textarea
      id="editor"
      rows="16"
      style="width:100%; box-sizing:border-box;"
    ></textarea>

    <p style="margin-top:8px; font-size:0.9em; color:#666;">
      内容を入力後、GitHub上で
      <code>pages/${title}.txt</code>
      を作成してください。
    </p>
  `;
}