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
// Wiki構文パーサ（外部リンク・内部リンク・空白行・&br()対応）
// ===============================
function parse(text) {
  let html = text;

  // -------------------------------
  // 外部リンク先に飛べるリンクを先に処理
  // [[表示名>URL]] → 表示名のみ、リンクはURL
  // [[URL]] → URLそのまま
  // -------------------------------
  html = html.replace(
    /\[\[(.+?)>(https?:\/\/.+?)\]\]/g,
    (_, text, url) => `<a href="${url}" target="_blank" rel="noopener" class="external-link">${text}</a>`
  );
  html = html.replace(
    /\[\[(https?:\/\/.+?)\]\]/g,
    (_, url) => `<a href="${url}" target="_blank" rel="noopener" class="external-link">${url}</a>`
  );

  // -------------------------------
  // 内部リンクプレースホルダ化（太字無効）
  // [[ページ名]] または [[表示名>ページ名]]
  // -------------------------------
  const internalLinks = [];
  html = html.replace(/\[\[(?:(.+?)>)?(.+?)\]\]/g, (_, display, page) => {
    const idx = internalLinks.length;
    internalLinks.push({ display: display || page, page });
    return `%%INTERNAL_LINK_${idx}%%`;
  });

  // -------------------------------
  // 装飾マクロ（太字）
  // 内部リンクプレースホルダは太字化されない
  // &br() で改行
  // -------------------------------
  html = html.replace(/&bold\(\)\{(.+?)\}/g, '<strong>$1</strong>');
  html = html.replace(/&br\(\)/g, '<br>');

  // -------------------------------
  // 見出し
  // -------------------------------
  html = html.replace(/^\*\*\*\s*(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^\*\*\s*(.+)$/gm, '<h3>$1</h3>');

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
  // 段落処理（空行ごとに <p>）
  // -------------------------------
  html = html
    .split(/\n{2,}/)
    .map(block => {
      block = block.trim();
      if (!block) return '<p class="blank">&nbsp;</p>'; // 空行
      if (/^<h|^<ul|^<li|^<br>/.test(block)) return block;
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');

  // -------------------------------
  // 内部リンク復元（太字禁止）
  // -------------------------------
  internalLinks.forEach((link, idx) => {
    html = html.replace(
      `%%INTERNAL_LINK_${idx}%%`,
      `<a href="?page=${encodeURIComponent(link.page)}" data-page="${link.page}" class="no-bold">${link.display}</a>`
    );
  });

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
// 未作成ページ用エディタ（簡易版）
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