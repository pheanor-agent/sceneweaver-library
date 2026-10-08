(() => {
  'use strict';
  const app = document.querySelector('#app');
  const reader = document.querySelector('#reader');
  const featured = document.querySelector('#featured-grid');
  const archive = document.querySelector('#archive-list');
  const empty = document.querySelector('#empty');
  const search = document.querySelector('#search');
  const month = document.querySelector('#month');
  let catalog = [];
  let filterType = 'all';
  let archiveDays = 20;
  const moreBooks = document.querySelector('#more-books');
  const typeNames = { film: '영화', animation: '애니메이션', children: '동화' };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const hrefFor = (book, page) => `./?book=${encodeURIComponent(book.book_id)}${page ? `&page=${page}` : ''}`;
  const dateLabel = value => new Intl.DateTimeFormat('ko-KR', {dateStyle:'long', timeZone:'Asia/Seoul'}).format(new Date(`${value}T00:00:00+09:00`));
  const card = (book, featuredCard = false) => `<article class="book-card ${featuredCard ? 'featured-card' : ''}" data-type="${esc(book.type)}"><a class="cover-link" href="${hrefFor(book)}" aria-label="${esc(book.title)} 읽기"><img src="${esc(book.cover)}" alt="${esc(book.title)} 표지" loading="lazy"><span class="cover-label">${esc(typeNames[book.type] || '책')}</span></a><div class="card-body"><p class="card-meta">${esc(dateLabel(book.date))} · ${esc(book.page_count)}쪽</p><h3 class="card-title"><a href="${hrefFor(book)}">${esc(book.title)}</a></h3><p class="card-summary">${esc(book.summary)}</p><a class="read-link" href="${hrefFor(book)}">이야기 펼치기 <span aria-hidden="true">↗</span></a></div></article>`;
  function renderLibrary() {
    const newest = [...catalog].sort((a,b) => b.date.localeCompare(a.date) || a.book_id.localeCompare(b.book_id));
    featured.innerHTML = newest.slice(0,3).map(book => card(book, true)).join('');
    const months = [...new Set(newest.map(book => book.date.slice(0,7)))].sort().reverse();
    month.innerHTML = '<option value="">모든 달</option>' + months.map(m => `<option value="${m}">${m.replace('-', '년 ')}월</option>`).join('');
    document.querySelector('#today-count').textContent = `${catalog.length}권의 이야기가 모였어요`;
    renderArchive(newest);
  }
  function renderArchive(books, reset = true) {
    if (reset) archiveDays = 20;
    const q = search.value.trim().toLocaleLowerCase('ko');
    const visible = books.filter(book => (filterType === 'all' || book.type === filterType) && (!month.value || book.date.startsWith(month.value)) && (!q || `${book.title} ${book.summary} ${book.genre}`.toLocaleLowerCase('ko').includes(q)));
    const groups = new Map();
    visible.forEach(book => { if (!groups.has(book.date)) groups.set(book.date, []); groups.get(book.date).push(book); });
    archive.innerHTML = [...groups].slice(0, archiveDays).map(([date, list]) => `<section class="archive-day"><h3 class="archive-date"><time datetime="${date}">${esc(dateLabel(date))}</time><span class="archive-count">${list.length}권</span></h3><div class="archive-books">${list.map(book => `<a class="archive-book book-card" href="${hrefFor(book)}"><img src="${esc(book.cover)}" alt="${esc(book.title)} 표지" loading="lazy"><span><strong>${esc(book.title)}</strong><small>${esc(typeNames[book.type])} · ${esc(book.page_count)}쪽</small></span></a>`).join('')}</div></section>`).join('');
    empty.hidden = visible.length > 0;
    moreBooks.hidden = groups.size <= archiveDays;
  }
  async function openReader(bookId, pageNumber) {
    const item = catalog.find(book => book.book_id === bookId);
    if (!item) { reader.innerHTML = `<div class="reader-error"><a href="./">← 서재로</a><h1>이 책을 찾을 수 없어요</h1><p>주소가 바뀌었거나 서재에 없는 책입니다.</p></div>`; app.hidden = true; reader.hidden = false; return; }
    let data;
    try { const response = await fetch(`./data/books/${encodeURIComponent(bookId)}.json`); if (!response.ok) throw new Error('book_fetch_failed'); data = await response.json(); }
    catch (_) { reader.innerHTML = `<div class="reader-error"><a href="./">← 서재로</a><h1>책을 불러오지 못했어요</h1><p>잠시 후 다시 시도해 주세요.</p></div>`; app.hidden = true; reader.hidden = false; return; }
    const total = data.pages.length;
    let current = Math.min(total, Math.max(1, Number.parseInt(pageNumber,10) || 1));
    const saved = Number.parseInt(localStorage.getItem(`sceneweaver:${bookId}:page`) || '0',10);
    if (!pageNumber && saved > 1 && saved <= total) current = saved;
    app.hidden = true; reader.hidden = false; reader.dataset.type = data.type;
    const draw = () => {
      const page = data.pages[current-1];
      reader.innerHTML = `<nav class="reader-top"><a href="./" class="back-library">← 서재로</a><span>${esc(typeNames[data.type] || '이야기')} · ${esc(dateLabel(data.date))}</span></nav><div class="reader-wrap"><header class="reader-title"><h1>${esc(data.title)}</h1><p>${String(current).padStart(2,'0')} <span>/</span> ${String(total).padStart(2,'0')}</p></header><div class="reader-image-frame"><img class="reader-image" src="${esc(page.image)}" alt="${esc(data.title)} ${current}쪽 그림" width="${esc(page.width)}" height="${esc(page.height)}"></div><p class="reader-paragraph">${esc(page.paragraph)}</p><div class="reader-controls"><button type="button" data-step="-1" ${current===1?'disabled':''} aria-label="이전 페이지">← 이전</button><label class="sr-only" for="page-select">페이지 선택</label><select id="page-select">${data.pages.map((_,i)=>`<option value="${i+1}" ${i+1===current?'selected':''}>${i+1} / ${total}쪽</option>`).join('')}</select><button type="button" data-step="1" ${current===total?'disabled':''} aria-label="다음 페이지">다음 →</button></div><p class="reader-source">AI 생성 그림 · 원본 비율로 감상합니다</p></div>`;
      localStorage.setItem(`sceneweaver:${bookId}:page`, String(current));
      const url = new URL(location.href); url.searchParams.set('book',bookId); url.searchParams.set('page',String(current)); history.replaceState({},'',url);
      reader.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => move(current + Number(button.dataset.step))));
      reader.querySelector('#page-select').addEventListener('change', event => move(Number(event.target.value)));
      reader.querySelector('.reader-image').addEventListener('error', event => { event.currentTarget.alt = '그림을 불러오지 못했습니다'; event.currentTarget.classList.add('is-error'); });
    };
    const move = page => { if (page >= 1 && page <= total) { current = page; draw(); window.scrollTo(0,0); } };
    window.onkeydown = event => { if (event.key === 'ArrowRight') move(current+1); if (event.key === 'ArrowLeft') move(current-1); };
    draw();
  }
  document.querySelectorAll('.filter[data-filter]').forEach(button => button.addEventListener('click', () => { filterType = button.dataset.filter; document.querySelectorAll('.filter[data-filter]').forEach(b => { const active = b === button; b.classList.toggle('is-active',active); b.setAttribute('aria-pressed',String(active)); }); renderArchive([...catalog].sort((a,b)=>b.date.localeCompare(a.date))); }));
  moreBooks.addEventListener('click', () => { archiveDays += 20; renderArchive([...catalog].sort((a,b)=>b.date.localeCompare(a.date)), false); });
  search.addEventListener('input', () => renderArchive([...catalog].sort((a,b)=>b.date.localeCompare(a.date))));
  month.addEventListener('change', () => renderArchive([...catalog].sort((a,b)=>b.date.localeCompare(a.date))));
  fetch('./data/catalog.json').then(response => { if (!response.ok) throw new Error('catalog_fetch_failed'); return response.json(); }).then(data => { catalog = Array.isArray(data.books) ? data.books : []; renderLibrary(); const params = new URLSearchParams(location.search); if (params.has('book')) openReader(params.get('book'), params.get('page')); }).catch(() => { document.querySelector('#today-count').textContent = '서재를 불러오지 못했어요'; empty.hidden = false; });
})();
