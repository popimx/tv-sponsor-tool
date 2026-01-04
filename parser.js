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
// Wiki構文パーサ（AtWiki寄せ）
// ===============================
function parse(text) {
  let html = text;

  // -------------------------------
  // 見出し（順番厳守）
  // -------------------------------
  html = html.replace(/^\*\*\*\s*(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^\*\*\s*(.+)$/gm, '<h3>$1</h3>');

  // -------------------------------
  // 装飾マクロ
  // -------------------------------
  html = html.replace(/&bold\(\)\{(.+?)\}/g, '<strong>$1</strong>');
  html = html.replace(/&br\(\)/g, '<br>');

  // -------------------------------
  // 外部リンク
  // -------------------------------
  html = html.replace(
    /\[\[(.+?)>(https?:\/\/.+?)\]\]/g,
    (_, text, url) =>
      `<a href="${url}" target="_blank" rel="noopener">${text}</a>`
  );

  html = html.replace(
    /\[\[(https?:\/\/.+?)\]\]/g,
    (_, url) =>
      `<a href="${url}" target="_blank" rel="noopener">${url}</a>`
  );

  // -------------------------------
  // 内部リンク
  // -------------------------------
  html = html.replace(
    /\[\[(.+?)\]\]/g,
    (_, p1) =>
      `<a href="?page=${encodeURIComponent(p1)}" data-page="${p1}">${p1}</a>`
  );

  // -------------------------------
  // 箇条書き（連続 li を1つの ul にまとめる）
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
  // 段落処理（空行区切り）
  // -------------------------------
  html = html
    .split(/\n{2,}/)
    .map(block => {
      if (/^<h|^<ul|^<li|^<br>/.test(block)) return block;
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    })
    .join('');

  return html;
}

// ===============================
// 未作成リンクを赤くする
// ===============================
async function markMissingLinks() {
  const links = document.querySelectorAll('a[data-page]');

  for (const link of links) {
    const page = link.dataset.page;
    const path = `pages/${page}.txt`;

    try {
      const res = await fetch(path);
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
// 未作成ページ用エディタ（簡潔版）
// ===============================
function showEditor(path) {
  const title = decodeURIComponent(
    path.replace('pages/', '').replace('.txt', '')
  );

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