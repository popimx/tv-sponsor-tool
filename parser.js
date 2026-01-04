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

function parse(text) {
  let html = text;

  html = html.replace(/\[\[(.+?)\]\]/g, (_, p1) =>
    `<a href="?page=${encodeURIComponent(p1)}" data-page="${p1}">${p1}</a>`
  );

  html = html.replace(/^\*\*\s*(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]+?<\/li>)/g, '<ul>$1</ul>');
  html = html.replace(/\n/g, '<br>');

  return html;
}

async function markMissingLinks() {
  const links = document.querySelectorAll('a[data-page]');
  for (const link of links) {
    const page = link.dataset.page;
    const res = await fetch(`pages/${page}.txt`).catch(() => null);
    if (!res || !res.ok) {
      link.classList.add('missing');
      link.title = '未作成ページ';
    }
  }
}

function showEditor(path) {
  const title = decodeURIComponent(path.replace('pages/', '').replace('.txt', ''));
  const draft = localStorage.getItem(`draft:${title}`) || '';

  document.getElementById('content').innerHTML = `
    <h2>${title}</h2>
    <p>この記事はまだありません。</p>
    <textarea id="editor" rows="15" style="width:100%;">${draft}</textarea>
    <button onclick="saveDraft('${title}')">下書き保存</button>
    <button onclick="copyText()">GitHub用にコピー</button>
  `;
}

function saveDraft(title) {
  localStorage.setItem(`draft:${title}`, editor.value);
  alert('下書きを保存しました');
}

function copyText() {
  navigator.clipboard.writeText(editor.value);
  alert('コピーしました。GitHubに貼り付けてください');
}