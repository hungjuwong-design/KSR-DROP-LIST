// ============================================================
// KhanSpeedrun Item Database — static SPA (hash-routed, per-set links)
// Core: init, routing, shared detail-overlay, search.
// Domain rendering lives in modules/armor.js, weapon.js, skill.js,
// mapmonster.js — this file just links them together.
// ============================================================
KSR.app = (function(){
  const { $, $$, escapeHtml } = KSR.util;
  const state = KSR.state;
  const { CLASS_ORDER, WEAPON_ORDER } = KSR.const;

  async function init(){
    const [itemsRes, skillsRes, mapsRes] = await Promise.all([
      fetch('data/full.json'),
      fetch('data/skills.json'),
      fetch('data/maps.json'),
    ]);
    state.DATA = await itemsRes.json();
    state.SKILLS = await skillsRes.json();
    state.MAPS = await mapsRes.json();
    KSR.shared.bindMonsterTagClicks(document);
    bindGlobalEvents();
    applyRoute();
    window.addEventListener('hashchange', applyRoute);
  }

  // ---------------- Routing ----------------
  // #/armor/<Class>/<cat>[/<id>]
  // #/weapon/<Cat>[/<id>]
  // #/skill/<Class>[/<id>]
  // #/map[/<mapSlug>]
  function applyRoute(){
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    closeDetail(false);
    KSR.mapmonster.closeMonsterPopup();

    if (parts[0] === 'weapon'){
      state.currentMode = 'weapon';
      state.currentGroup = decodeURIComponent(parts[1] || 'Sword');
      if (!WEAPON_ORDER.includes(state.currentGroup)) state.currentGroup = 'Sword';
      render();
      if (parts[2]) openDetailById(decodeURIComponent(parts[2]));
      return;
    }

    if (parts[0] === 'skill'){
      state.currentMode = 'skill';
      state.currentGroup = decodeURIComponent(parts[1] || 'Knight');
      if (!CLASS_ORDER.includes(state.currentGroup)) state.currentGroup = 'Knight';
      render();
      if (parts[2]) openDetailById(decodeURIComponent(parts[2]));
      return;
    }

    if (parts[0] === 'map'){
      state.currentMode = 'map';
      state.currentMapSlug = parts[1] ? decodeURIComponent(parts[1]) : null;
      render();
      return;
    }

    // default / armor
    state.currentMode = 'armor';
    state.currentGroup = decodeURIComponent(parts[1] || 'Knight');
    if (!CLASS_ORDER.includes(state.currentGroup)) state.currentGroup = 'Knight';
    state.currentCat = decodeURIComponent(parts[2] || 'helmets');
    if (!KSR.const.ARMOR_CATS.includes(state.currentCat)) state.currentCat = 'helmets';
    render();
    if (parts[3]) openDetailById(decodeURIComponent(parts[3]));
  }

  let navCount = 0;
  function navigate(hash){ navCount++; location.hash = hash; }

  // True "back" — returns to whatever the browser history says was open
  // before (previous item, previous map, previous search result, etc).
  // Falls back to closing the popup if there's nothing safe to go back to
  // (e.g. the very first thing the user did was open a deep link).
  function goBack(){
    if (navCount > 0){
      navCount--;
      window.history.back();
    } else {
      closeDetail(true);
    }
  }

  function routeFor(item, mode, group, cat){
    if (mode === 'weapon') return `#/weapon/${group}/${item.id}`;
    if (mode === 'skill') return `#/skill/${group}/${item.id}`;
    return `#/armor/${group}/${cat}/${item.id}`;
  }

  // ---------------- Global events ----------------
  function bindGlobalEvents(){
    $$('#modeToggle .mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        if (mode === 'weapon') navigate('#/weapon/Sword');
        else if (mode === 'skill') navigate('#/skill/Knight');
        else if (mode === 'map') navigate('#/map');
        else navigate('#/armor/Knight/helmets');
      });
    });

    $('#detailOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'detailOverlay') closeDetail(true);
    });
    $('#monsterOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'monsterOverlay') KSR.mapmonster.closeMonsterPopup();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      KSR.mapmonster.closeMonsterPopup();
      closeDetail(true);
    });

    const input = $('#searchInput');
    const clearBtn = $('#searchClear');
    input.addEventListener('input', () => {
      const q = input.value.trim();
      clearBtn.hidden = !q;
      if (q.length >= 1) runSearch(q);
      else hideSearch();
    });
    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.hidden = true;
      hideSearch();
      input.focus();
    });
  }

  // ---------------- Rendering: shell ----------------
  function render(){
    $$('#modeToggle .mode-btn').forEach(b => b.classList.toggle('is-active', b.dataset.mode === state.currentMode));
    renderRail();
    renderCatTabs();
    renderMapHero();
    renderGrid();
  }

  function renderMapHero(){
    const hero = $('#mapHero');
    if (state.currentMode === 'map'){
      KSR.mapmonster.renderMapHero(hero);
    } else {
      hero.hidden = true;
      hero.innerHTML = '';
    }
  }

  function currentDomainModule(){
    return { armor: KSR.armor, weapon: KSR.weapon, skill: KSR.skill, map: KSR.mapmonster }[state.currentMode];
  }

  function renderRail(){
    const rail = $('#rail');
    rail.innerHTML = '';
    currentDomainModule().renderRail(rail);
  }

  function railButton(text, active, colorVar, onClick){
    const btn = document.createElement('button');
    btn.className = 'rail-btn' + (active ? ' is-active' : '');
    const dot = document.createElement('span');
    dot.className = 'rail-dot';
    dot.style.setProperty('--dot', `var(${colorVar})`);
    btn.appendChild(dot);
    const span = document.createElement('span');
    span.textContent = text;
    btn.appendChild(span);
    btn.addEventListener('click', onClick);
    return btn;
  }

  function renderCatTabs(){
    const wrap = $('#catTabs');
    wrap.innerHTML = '';
    const title = $('#contentTitle');
    currentDomainModule().renderCatTabs(wrap, title);
  }

  function renderGrid(){
    const grid = $('#grid');
    const emptyNote = $('#emptyNote');

    if (state.currentMode === 'map'){
      KSR.mapmonster.renderGrid(grid, emptyNote);
      return;
    }

    grid.innerHTML = '';
    grid.className = 'grid';
    const mod = currentDomainModule();
    let list = mod.getList();
    if (state.currentMode !== 'skill'){
      list = list.slice().sort((a,b) => (a.set ?? 0) - (b.set ?? 0));
    }

    if (!list.length){
      emptyNote.hidden = false;
      return;
    }
    emptyNote.hidden = true;
    list.forEach(item => grid.appendChild(mod.itemCard(item)));
  }

  // ---------------- Detail overlay (armor/weapon/skill items) ----------------
  function findItemById(id){
    const a = KSR.armor.findById(id);
    if (a) return { item: a.item, mode: 'armor', group: a.group, cat: a.cat };
    const w = KSR.weapon.findById(id);
    if (w) return { item: w.item, mode: 'weapon', group: w.group, cat: w.cat };
    const s = KSR.skill.findById(id);
    if (s) return { item: s.item, mode: 'skill', group: s.group, cat: s.cat };
    return null;
  }

  function openDetailById(id){
    const found = findItemById(id);
    if (!found) return;
    state.currentMode = found.mode;
    state.currentGroup = found.group;
    if (found.cat) state.currentCat = found.cat;
    render();
    openDetail(found.item, found.mode, found.group);
  }

  function detailHtml(item, mode, group){
    const mod = { armor: KSR.armor, weapon: KSR.weapon, skill: KSR.skill }[mode];
    const isSkill = mode === 'skill';
    const { text: badgeText, color: badgeColor } = mod.badge(group);
    const titleMeta = isSkill ? '' : `<span style="color:var(--text-faint); font-size:14px;">Set ${item.set ?? '-'}</span>`;

    return `
      <div class="detail-head">
        <div class="detail-img">${item.image ? `<img src="${item.image}" alt>` : ''}</div>
        <div class="detail-titles">
          <h2>${escapeHtml(item.name)} ${titleMeta}</h2>
          <div class="detail-badges">
            <span class="chip" style="background:color-mix(in srgb, var(${badgeColor}) 22%, transparent); border-color:var(${badgeColor}); color:var(${badgeColor})">${escapeHtml(badgeText)}</span>
          </div>
          <div class="detail-actions">
            <button class="btn-copy" id="copyLinkBtn">คัดลอกลิงก์${isSkill ? 'สกิล' : 'ไอเทม'}นี้</button>
          </div>
        </div>
        <div class="detail-popup-actions">
          <button class="detail-back" id="detailBackBtn" aria-label="ย้อนกลับ">← ย้อนกลับ</button>
          <button class="detail-close" id="detailCloseBtn" aria-label="ปิด">&times;</button>
        </div>
      </div>
      <div class="detail-body">
        ${mod.detailBody(item)}
      </div>
    `;
  }

  function wireDetailButtons(item, mode, group, cat, { onBack, onClose }){
    const isSkill = mode === 'skill';
    $('#detailCloseBtn').addEventListener('click', onClose);
    $('#detailBackBtn').addEventListener('click', onBack);
    $('#copyLinkBtn').addEventListener('click', (e) => {
      const url = location.origin + location.pathname + routeFor(item, mode, group, cat);
      navigator.clipboard?.writeText(url).then(() => {
        e.target.textContent = 'คัดลอกแล้ว ✓';
        setTimeout(() => { e.target.textContent = `คัดลอกลิงก์${isSkill ? 'สกิล' : 'ไอเทม'}นี้`; }, 1600);
      }).catch(() => {
        prompt('คัดลอกลิงก์นี้:', url);
      });
    });
  }

  // Routed detail view — reachable via #/armor|weapon|skill/.../<id>. Back
  // uses real navigation history; closing updates the hash back to the list.
  function openDetail(item, mode, group){
    KSR.overlay.show('detailOverlay', 'detailPanel', detailHtml(item, mode, group));
    wireDetailButtons(item, mode, group, state.currentCat, {
      onBack: () => goBack(),
      onClose: () => closeDetail(true),
    });
  }

  // Popup-only item preview — used when clicking a drop item inside the
  // monster popup. Shows just the item's stats/info without navigating
  // away from whatever map/monster the person was looking at; does NOT
  // touch the hash or app state. "Back" re-opens the monster popup that
  // was open before; "close" just dismisses it entirely.
  function openItemPopup(item, mode, group, cat, onBack){
    KSR.overlay.show('detailOverlay', 'detailPanel', detailHtml(item, mode, group));
    wireDetailButtons(item, mode, group, cat, {
      onBack: () => { KSR.overlay.hide('detailOverlay', 'detailPanel'); if (onBack) onBack(); },
      onClose: () => { KSR.overlay.hide('detailOverlay', 'detailPanel'); },
    });
  }

  function closeDetail(updateHash){
    KSR.overlay.hide('detailOverlay', 'detailPanel');
    if (updateHash){
      if (state.currentMode === 'weapon') navigate(`#/weapon/${state.currentGroup}`);
      else if (state.currentMode === 'skill') navigate(`#/skill/${state.currentGroup}`);
      else if (state.currentMode === 'map') navigate(state.currentMapSlug ? `#/map/${state.currentMapSlug}` : '#/map');
      else navigate(`#/armor/${state.currentGroup}/${state.currentCat}`);
    }
  }

  // ---------------- Search ----------------
  let FLAT_CACHE = null;
  function allItemsFlat(){
    return [...KSR.armor.allFlat(), ...KSR.weapon.allFlat(), ...KSR.skill.allFlat()];
  }

  // Searching a map name or a monster name should surface the map/monster
  // side of things too — not just items. byMapName = maps whose name
  // matches; byMonsterInMap = individual monsters (in maps not already
  // covered by byMapName) whose name matches.
  function mapSearchMatches(ql){
    if (!state.MAPS) return { byMapName: [], byMonsterInMap: [] };
    const maps = KSR.mapmonster.mapList();
    const byMapName = maps.filter(m => m.name.toLowerCase().includes(ql));
    const coveredSlugs = new Set(byMapName.map(m => m.slug));
    const byMonsterInMap = [];
    maps.forEach(m => {
      if (coveredSlugs.has(m.slug)) return;
      m.monsters.forEach(mo => {
        if (mo.name.toLowerCase().includes(ql)) byMonsterInMap.push({ map: m, monster: mo });
      });
    });
    return { byMapName, byMonsterInMap };
  }

  function runSearch(q){
    if (!FLAT_CACHE) FLAT_CACHE = allItemsFlat();
    const ql = q.toLowerCase();

    const byName = FLAT_CACHE.filter(e => e.item.name.toLowerCase().includes(ql));
    const byMonster = FLAT_CACHE.filter(e =>
      !e.item.name.toLowerCase().includes(ql) &&
      e.item.monsters.some(m => m.toLowerCase().includes(ql))
    );
    const { byMapName, byMonsterInMap } = mapSearchMatches(ql);

    const box = $('#searchResults');
    box.hidden = false;

    if (!byName.length && !byMonster.length && !byMapName.length && !byMonsterInMap.length){
      box.innerHTML = `<div class="sr-none">ไม่พบผลลัพธ์สำหรับ "${escapeHtml(q)}"</div>`;
      return;
    }

    box.innerHTML = `
      ${byName.length ? searchGroup('ไอเทม', byName) : ''}
      ${byMonster.length ? searchGroup(`ดรอปจากมอนสเตอร์ "${escapeHtml(q)}"`, byMonster) : ''}
      ${byMapName.length ? mapNameSearchGroup(byMapName) : ''}
      ${byMonsterInMap.length ? monsterInMapSearchGroup(byMonsterInMap) : ''}
    `;
    $$('.sr-item', box).forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        $('#searchInput').value = '';
        $('#searchClear').hidden = true;
        hideSearch();
        const found = findItemById(id);
        if (!found) return;
        navigate(routeFor(found.item, found.mode, found.group, found.cat));
      });
    });
    // Monster results (both groups) carry data-monster — clicking them
    // relies on KSR.shared's document-level delegated handler to actually
    // open the monster popup (image + drop items + which map(s)); here we
    // just tidy up the search box itself.
    $$('.sr-mon, .sr-mon-single', box).forEach(el => {
      el.addEventListener('click', () => {
        $('#searchInput').value = '';
        $('#searchClear').hidden = true;
        hideSearch();
      });
    });
  }

  // Search matched a map's name: show every monster that lives in that
  // map, each with its own picture, so the person can jump straight to
  // whichever one dropped what they're after.
  function mapNameSearchGroup(maps){
    return `
      <div class="sr-group">
        <div class="sr-group-title">แผนที่</div>
        ${maps.map(m => `
          <div class="sr-map-block">
            <div class="sr-map-title">🗺️ ${escapeHtml(m.name)} <span class="sr-map-count">(${m.monsters.length} มอนสเตอร์)</span></div>
            <div class="sr-monster-row">
              ${m.monsters.map(mo => `
                <button type="button" class="sr-mon" data-monster="${escapeHtml(mo.name)}">
                  ${mo.image ? `<img src="${mo.image}" alt loading="lazy">` : ''}
                  <span>${escapeHtml(mo.name)}</span>
                </button>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Search matched a monster's name directly: list each one with its
  // picture and which map it's found in.
  function monsterInMapSearchGroup(entries){
    return `
      <div class="sr-group">
        <div class="sr-group-title">มอนสเตอร์ในแผนที่</div>
        <div class="sr-list">
          ${entries.map(e => `
            <div class="sr-mon-single" data-monster="${escapeHtml(e.monster.name)}">
              ${e.monster.image ? `<img src="${e.monster.image}" alt loading="lazy">` : ''}
              <div>
                <div class="n">${escapeHtml(e.monster.name)}</div>
                <div class="m">🗺️ ${escapeHtml(e.map.name)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function searchGroup(title, entries){
    const { CLASS_TH, WEAPON_TH } = KSR.const;
    return `
      <div class="sr-group">
        <div class="sr-group-title">${title}</div>
        <div class="sr-list">
          ${entries.map(e => `
            <div class="sr-item" data-id="${e.item.id}">
              <img src="${e.item.image}" alt loading="lazy">
              <div>
                <div class="n">${escapeHtml(e.item.name)}</div>
                <div class="m">${e.mode === 'weapon' ? WEAPON_TH[e.group] : (e.mode === 'skill' ? 'สกิล ' + CLASS_TH[e.group] : CLASS_TH[e.group]) } · ${e.mode==='skill' ? '' : 'Set ' + (e.item.set ?? '-')}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function hideSearch(){ $('#searchResults').hidden = true; }

  return { init, navigate, routeFor, railButton, openItemPopup };
})();

KSR.app.init();
