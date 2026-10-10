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
  const typeNames = { film: '영화', animation: '애니메이션', children: '동화', special: '실험실' };
  const isSpecial = book => book.type === 'special' || String(book.book_id).endsWith('-16x9');
  const hasEmbeddedText = book => isSpecial(book);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const hrefFor = (book, page) => `./?book=${encodeURIComponent(book.book_id)}${page ? `&page=${page}` : ''}`;
  const dateLabel = value => new Intl.DateTimeFormat('ko-KR', {dateStyle:'long', timeZone:'Asia/Seoul'}).format(new Date(`${value}T00:00:00+09:00`));
  const card = (book, featuredCard = false) => `<article class="book-card ${featuredCard ? 'featured-card' : ''}" data-type="${esc(book.type)}"><a class="cover-link" href="${hrefFor(book)}" aria-label="${esc(book.title)} 읽기"><img src="${esc(book.cover)}" alt="${esc(book.title)} 표지" loading="lazy"><span class="cover-label">${esc(isSpecial(book) ? '실험실' : (typeNames[book.type] || '책'))}</span></a><div class="card-body"><p class="card-meta">${esc(dateLabel(book.date))} · ${esc(book.page_count)}쪽</p><h3 class="card-title"><a href="${hrefFor(book)}">${esc(book.title)}</a></h3><p class="card-summary">${esc(book.summary)}</p><a class="read-link" href="${hrefFor(book)}">이야기 펼치기 <span aria-hidden="true">↗</span></a></div></article>`;
  function renderLibrary() {
    const sorted = [...catalog].sort((a,b) => b.date.localeCompare(a.date) || a.book_id.localeCompare(b.book_id));
    const regular = sorted.filter(book => !isSpecial(book));
    const specials = sorted.filter(isSpecial);
    const labSection = document.querySelector('#lab-section');
    const labGrid = document.querySelector('#lab-grid');
    const labToggle = document.querySelector('#lab-toggle');
    if (specials.length && labSection && labGrid && labToggle) {
      labSection.hidden = false;
      labGrid.innerHTML = specials.map(book => card(book, false)).join('');
      const applyState = open => {
        labGrid.hidden = !open;
        labToggle.textContent = open ? '실험실 접기' : '실험실 펼쳐 보기';
        labToggle.setAttribute('aria-expanded', String(open));
        localStorage.setItem('sceneweaver:lab-open', open ? '1' : '0');
      };
      labToggle.addEventListener('click', () => applyState(labGrid.hidden));
      applyState(localStorage.getItem('sceneweaver:lab-open') === '1');
    }
    featured.innerHTML = regular.slice(0,3).map(book => card(book, true)).join('');
    const months = [...new Set(regular.map(book => book.date.slice(0,7)))].sort().reverse();
    month.innerHTML = '<option value="">모든 달</option>' + months.map(m => `<option value="${m}">${m.replace('-', '년 ')}월</option>`).join('');
    document.querySelector('#today-count').textContent = `${regular.length}권의 이야기가 모였어요`;
    renderArchive(newestForFilter());
  }
  const newestForFilter = () => [...catalog].filter(book => !isSpecial(book)).sort((a,b) => b.date.localeCompare(a.date) || a.book_id.localeCompare(b.book_id));
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
  // Narration settings are global (not per book) so a listener sets them once on any cover.
  const prefs = {
    get autoplay() { return localStorage.getItem('sceneweaver:autoplay') !== '0'; },
    set autoplay(on) { localStorage.setItem('sceneweaver:autoplay', on ? '1' : '0'); },
    get autoturn() { return localStorage.getItem('sceneweaver:autoturn') !== '0'; },
    set autoturn(on) { localStorage.setItem('sceneweaver:autoturn', on ? '1' : '0'); },
  };
  const narration = new Audio();
  narration.preload = 'auto';
  let turnTimer = null;
  const switchRow = (id, label, hint, on, disabled = false) => `<label class="nar-switch ${disabled ? 'is-disabled' : ''}" for="${id}"><span><strong>${label}</strong><small>${hint}</small></span><input type="checkbox" role="switch" id="${id}" ${on ? 'checked' : ''} ${disabled ? 'disabled' : ''}><i aria-hidden="true"></i></label>`;
  async function openReader(bookId, pageNumber) {
    const item = catalog.find(book => book.book_id === bookId);
    if (!item) { reader.innerHTML = `<div class="reader-error"><a href="./">← 서재로</a><h1>이 책을 찾을 수 없어요</h1><p>주소가 바뀌었거나 서재에 없는 책입니다.</p></div>`; app.hidden = true; reader.hidden = false; return; }
    let data;
    try { const response = await fetch(`./data/books/${encodeURIComponent(bookId)}.json`); if (!response.ok) throw new Error('book_fetch_failed'); data = await response.json(); }
    catch (_) { reader.innerHTML = `<div class="reader-error"><a href="./">← 서재로</a><h1>책을 불러오지 못했어요</h1><p>잠시 후 다시 시도해 주세요.</p></div>`; app.hidden = true; reader.hidden = false; return; }
    const total = data.pages.length;
    const hasAudio = data.pages.some(page => page.audio);
    const saved = Number.parseInt(localStorage.getItem(`sceneweaver:${bookId}:page`) || '0',10);
    let current = Math.min(total, Math.max(1, Number.parseInt(pageNumber,10) || 1));
    let unlocked = false;  // browsers allow sound only after a tap; the cover's start button provides it
    app.hidden = true; reader.hidden = false; reader.dataset.type = data.type;
    const stopAudio = () => { clearTimeout(turnTimer); narration.pause(); };
    const syncPlayButton = () => {
      const btn = reader.querySelector('.nar-play');
      if (!btn) return;
      const playing = !narration.paused && !narration.ended;
      btn.classList.toggle('is-playing', playing);
      btn.setAttribute('aria-label', playing ? '낭독 멈춤' : '낭독 듣기');
      btn.querySelector('span').textContent = playing ? '멈춤' : '듣기';
    };
    const playPage = () => {
      const page = data.pages[current-1];
      if (!page.audio) return;
      clearTimeout(turnTimer);
      if (!narration.src.endsWith(page.audio)) narration.src = page.audio;
      narration.currentTime = 0;
      narration.play().then(() => { unlocked = true; }).catch(() => {}).finally(syncPlayButton);
    };
    narration.onplay = narration.onpause = syncPlayButton;
    narration.onended = () => {
      syncPlayButton();
      if (prefs.autoplay && prefs.autoturn && current < total) turnTimer = setTimeout(() => move(current + 1), 1200);
    };
    const cover = () => {
      stopAudio();
      const resume = !pageNumber && saved > 1 && saved <= total;
      reader.innerHTML = `<nav class="reader-top"><a href="./" class="back-library">← 서재로</a><span>${esc(typeNames[data.type] || '이야기')} · ${esc(dateLabel(data.date))}</span></nav><div class="reader-wrap book-cover"><div class="cover-art"><img src="${esc(data.pages[0].image)}" alt="${esc(data.title)} 표지 그림"></div><div class="cover-info"><p class="cover-kicker">${esc(typeNames[data.type] || '이야기')} · ${esc(total)}쪽</p><h1>${esc(data.title)}</h1>${item.summary ? `<p class="cover-summary">${esc(item.summary)}</p>` : ''}${hasAudio ? `<fieldset class="nar-settings"><legend>낭독</legend>${switchRow('pref-autoplay', '음성 자동 재생', '페이지를 펼치면 바로 읽어 줍니다', prefs.autoplay)}${switchRow('pref-autoturn', '다 읽으면 다음 장으로', '낭독이 끝나면 책장을 넘깁니다', prefs.autoturn, !prefs.autoplay)}<p class="nar-note">설정은 이 기기의 모든 책에 적용됩니다.</p></fieldset>` : ''}<div class="cover-actions"><button type="button" class="cover-start" data-start="1">처음부터 읽기</button>${resume ? `<button type="button" class="cover-resume" data-start="${saved}">이어 읽기 · ${saved}쪽</button>` : ''}</div></div></div>`;
      const autoplay = reader.querySelector('#pref-autoplay');
      const autoturn = reader.querySelector('#pref-autoturn');
      if (autoplay) autoplay.addEventListener('change', () => { prefs.autoplay = autoplay.checked; autoturn.disabled = !autoplay.checked; autoturn.closest('label').classList.toggle('is-disabled', !autoplay.checked); });
      if (autoturn) autoturn.addEventListener('change', () => { prefs.autoturn = autoturn.checked; });
      reader.querySelectorAll('[data-start]').forEach(button => button.addEventListener('click', () => {
        current = Number(button.dataset.start);
        if (hasAudio && prefs.autoplay) unlocked = true;
        draw(); window.scrollTo(0,0);
      }));
      const url = new URL(location.href); url.searchParams.set('book',bookId); url.searchParams.delete('page'); history.replaceState({},'',url);
    };
    const draw = () => {
      const page = data.pages[current-1];
      const player = page.audio ? `<div class="nar-bar"><button type="button" class="nar-play" aria-label="낭독 듣기"><b aria-hidden="true"></b><span>듣기</span></button><label class="nar-auto"><input type="checkbox" id="bar-autoplay" ${prefs.autoplay ? 'checked' : ''}> 자동 재생</label></div>` : '';
      reader.innerHTML = `<nav class="reader-top"><a href="./" class="back-library">← 서재로</a><span>${esc(typeNames[data.type] || '이야기')} · ${esc(dateLabel(data.date))}</span></nav><div class="reader-wrap${hasAudio ? ' page-turn' : ''}"><header class="reader-title"><h1>${esc(data.title)}</h1><p>${String(current).padStart(2,'0')} <span>/</span> ${String(total).padStart(2,'0')}</p></header><div class="reader-image-frame"><img class="reader-image" src="${esc(page.image)}" alt="${esc(data.title)} ${current}쪽 그림" width="${esc(page.width)}" height="${esc(page.height)}"></div><p class="reader-paragraph" ${hasEmbeddedText(data) ? 'hidden' : ''}>${esc(page.paragraph)}</p>${player}<div class="reader-controls"><button type="button" data-step="-1" ${current===1?'disabled':''} aria-label="이전 페이지">← 이전</button><label class="sr-only" for="page-select">페이지 선택</label><select id="page-select">${data.pages.map((_,i)=>`<option value="${i+1}" ${i+1===current?'selected':''}>${i+1} / ${total}쪽</option>`).join('')}</select><button type="button" data-step="1" ${current===total?'disabled':''} aria-label="다음 페이지">다음 →</button></div><p class="reader-source">AI 생성 그림${hasAudio ? ' · AI 낭독' : ''} · 원본 비율로 감상합니다</p></div>`;
      localStorage.setItem(`sceneweaver:${bookId}:page`, String(current));
      const url = new URL(location.href); url.searchParams.set('book',bookId); url.searchParams.set('page',String(current)); history.replaceState({},'',url);
      reader.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => move(current + Number(button.dataset.step))));
      reader.querySelector('#page-select').addEventListener('change', event => move(Number(event.target.value)));
      reader.querySelector('.reader-image').addEventListener('error', event => { event.currentTarget.alt = '그림을 불러오지 못했습니다'; event.currentTarget.classList.add('is-error'); });
      const playBtn = reader.querySelector('.nar-play');
      if (playBtn) {
        playBtn.addEventListener('click', () => { if (!narration.paused) { stopAudio(); } else { unlocked = true; playPage(); } });
        reader.querySelector('#bar-autoplay').addEventListener('change', event => { prefs.autoplay = event.target.checked; if (!event.target.checked) clearTimeout(turnTimer); });
      }
      stopAudio();
      if (page.audio && prefs.autoplay && unlocked) playPage(); else syncPlayButton();
    };
    const move = page => { if (page >= 1 && page <= total) { current = page; draw(); window.scrollTo(0,0); } };
    window.onkeydown = event => {
      if (event.target.closest && event.target.closest('input,select')) return;
      if (event.key === 'ArrowRight') move(current+1);
      if (event.key === 'ArrowLeft') move(current-1);
      if (event.key === ' ' && reader.querySelector('.nar-play')) { event.preventDefault(); reader.querySelector('.nar-play').click(); }
    };
    // Narrated (lab) books open on a cover with narration settings; every other book keeps the original flow.
    if (!hasAudio) { if (!pageNumber && saved > 1 && saved <= total) current = saved; draw(); }
    else if (pageNumber) draw(); else cover();
  }
  document.querySelectorAll('.filter[data-filter]').forEach(button => button.addEventListener('click', () => { filterType = button.dataset.filter; document.querySelectorAll('.filter[data-filter]').forEach(b => { const active = b === button; b.classList.toggle('is-active',active); b.setAttribute('aria-pressed',String(active)); }); renderArchive(newestForFilter()); }));
  moreBooks.addEventListener('click', () => { archiveDays += 20; renderArchive([...catalog].sort((a,b)=>b.date.localeCompare(a.date)), false); });
  search.addEventListener('input', () => renderArchive(newestForFilter()));
  month.addEventListener('change', () => renderArchive(newestForFilter()));
  fetch('./data/catalog.json').then(response => { if (!response.ok) throw new Error('catalog_fetch_failed'); return response.json(); }).then(data => { catalog = Array.isArray(data.books) ? data.books : []; renderLibrary(); const params = new URLSearchParams(location.search); if (params.has('book')) openReader(params.get('book'), params.get('page')); }).catch(() => { document.querySelector('#today-count').textContent = '서재를 불러오지 못했어요'; empty.hidden = false; });
})();
