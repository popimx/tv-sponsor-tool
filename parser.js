// ===============================
// ページ読み込み
// ===============================
async function loadPage(path) {
  const res = await fetch(path);

  if (!res.ok) {
    showEditor(path);
    return;
  }

  const text = await res.text();
  document.getElementById('content').innerHTML = parse(text);
  markMissingLinks();
}

// ===============================
// Wiki構文パーサ
// ===============================
function parse(text) {
  let html = text;

  // --- 見出し（順番重要） ---
  // *** 小見出し
  html = html.replace(/^\*\*\*\s*(.+)$/gm, '<h4>$1</h4>');

  // ** 見出し
  html = html.replace(/^\*\*\s*(.+)$/gm, '<h3>$1</h3>');

  // --- 装飾マクロ ---
  // &bold(){...}
  html = html.replace(/&bold\(\)\{(.+?)\}/g, '<strong>$1</strong>');

  // &br()
  html = html.replace(/&br\(\)/g, '<br>');

  // --- リンク ---
  // [[表示名>URL]]
  html = html.replace(
    /\[\[(.+?)>(https?:\/\/.+?)\]\]/g,
    (_, text, url) =>
      `<a href="${url}" target="_blank" rel="noopener">${text}</a>`
  );

  // [[https://...]]
  html = html.replace(
    /\[\[(https?:\/\/.+?)\]\]/g,
    (_, url) =>
      `<a href="${url}" target="_blank" rel="noopener">${url}</a>`
  );

  // [[ページ名]]（内部リンク）
  html = html.replace(
    /\[\[(.+?)\]\]/g,
    (_, p1) =>
      `<a href="?page=${encodeURIComponent(p1)}" data-page="${p1}">${p1}</a>`
  );

  // --- 箇条書き ---
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]+?<\/li>)/g, '<ul>$1</ul>');

  // --- 改行 ---
  html = html.replace(/\n/g, '<br>');

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
// 未作成ページ用エディタ
// ===============================
function showEditor(path) {
  const title = decodeURIComponent(
    path.replace('pages/', '').replace('.txt', '')
  );

  const draft = localStorage.getItem(`draft:${title}`) || '';

  document.getElementById('content').innerHTML = `
    <h2>${title}</h2>
    <p>この記事はまだ存在しません。</p>

    <textarea id="editor" rows="15" style="width:100%;">${draft}</textarea>

    <div style="margin-top:10px;">
      <button onclick="saveDraft('${title}')">下書き保存</button>
      <button onclick="copyForGitHub('${title}')">GitHub用にコピー</button>
    </div>
  `;
}

// ===============================
// 下書き保存
// ===============================
function saveDraft(title) {
  const text = document.getElementById('editor').value;
  localStorage.setItem(`draft:${title}`, text);
  alert('下書きを保存しました（ブラウザ内）');
}

// ===============================
// GitHub用コピー
// ===============================
function copyForGitHub(title) {
  const text = document.getElementById('editor').value;
  navigator.clipboard.writeText(text);
  alert(`pages/${title}.txt としてGitHubに保存してください`);
}