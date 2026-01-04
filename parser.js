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

  // &br() を先に変換
  const replacedText = text.replace(/&br\(\)/g, '<br>');

  const bodyHtml = parse(replacedText);

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
// Wiki構文パーサ（AtWiki寄せ・改良版）
// ===============================
function parse(text) {
  let html = text;

  // -------------------------------
  // 見出し（順番厳守）
  // -------------------------------
  html = html.replace(/^\*\*\*\s*(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^\*\*\s*(.+)$/gm, '<h3>$1</h3>');

  // -------------------------------
  // 箇条書き（- タイトル + 説明）
  // -------------------------------
  html = html.replace(/(?:^- .+(?:\n(?!-).+)*)+/gm, block => {
    const lines = block.split('\n');
    const items = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^- /.test(line)) {
        const titleMatch = line.replace(/^- /, '').trim();
        let desc = '';

        // 次の行が説明文ならまとめる
        let j = i + 1;
        while (j < lines.length && !/^- /.test(lines[j])) {
          desc += lines[j] + '\n';
          j++;
        }
        i = j - 1;

        // 内部リンクだけ <a> に変換
        const titleHtml = titleMatch.replace(
          /\[\[(.+?)\]\]/g,
          (_, p1) =>
            `<a href="?page=${encodeURIComponent(p1)}" data-page="${p1}">${p1}</a>`
        );

        let liHtml = `<li><span class="term-title">${titleHtml}</span>`;
        if (desc.trim()) {
          liHtml += `<div class="term-desc">${desc.trim().replace(/\n/g, '<br>')}</div>`;
        }
        liHtml += '</li>';

        items.push(liHtml);
      }
    }

    return `<ul>${items.join('')}</ul>`;
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