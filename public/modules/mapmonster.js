// ============================================================
// KSR.mapmonster — "แผนที่ & มอนสเตอร์" mode + the monster popup
// that's also opened from armor/weapon/skill monster-tag clicks.
// ============================================================
KSR.mapmonster = (function(){
  const { $, escapeHtml } = KSR.util;
  const state = KSR.state;

  function mapList(){
    if (!state.MAPS) return [];
    return state.MAPS.order.map(slug => ({ slug, ...state.MAPS.maps[slug] }));
  }

  function getMap(slug){
    return state.MAPS && state.MAPS.maps[slug] ? { slug, ...state.MAPS.maps[slug] } : null;
  }

  // ---------------- Rail: quick-jump list of all maps ----------------
  function renderRail(rail){
    const label = document.createElement('div');
    label.className = 'rail-group-label';
    label.textContent = 'แผนที่ทั้งหมด';
    rail.appendChild(label);

    mapList().forEach(m => {
      rail.appendChild(KSR.app.railButton(
        m.name, m.slug === state.currentMapSlug, '--c-other',
        () => KSR.app.navigate(`#/map/${m.slug}`)
      ));
    });
  }

  function renderCatTabs(wrap, titleEl){
    if (state.currentMapSlug){
      const m = getMap(state.currentMapSlug);
      titleEl.textContent = m ? m.name : 'ไม่พบแผนที่';
      const back = document.createElement('button');
      back.className = 'cat-tab';
      back.textContent = '← แผนที่ทั้งหมด';
      back.addEventListener('click', () => KSR.app.navigate('#/map'));
      wrap.appendChild(back);
    } else {
      titleEl.textContent = 'แผนที่ & มอนสเตอร์';
    }
  }

  // ---------------- Main grid: list of maps OR monsters-in-map ----------------
  function renderGrid(grid, emptyNote){
    grid.innerHTML = '';
    grid.className = 'grid';

    if (!state.currentMapSlug){
      const maps = mapList();
      if (!maps.length){ emptyNote.hidden = false; return; }
      emptyNote.hidden = true;
      maps.forEach(m => grid.appendChild(mapCard(m)));
      return;
    }

    grid.classList.add('mm-monster-grid');
    const map = getMap(state.currentMapSlug);
    if (!map || !map.monsters.length){ emptyNote.hidden = false; return; }
    emptyNote.hidden = true;
    map.monsters.forEach(mon => grid.appendChild(monsterCard(mon)));
  }

  // Big map image, centered above the monster grid, only shown once a
  // specific map is selected. Hidden on the map-picker grid itself.
  function renderMapHero(hero){
    if (!state.currentMapSlug){
      hero.hidden = true;
      hero.innerHTML = '';
      return;
    }
    const map = getMap(state.currentMapSlug);
    if (!map){ hero.hidden = true; hero.innerHTML = ''; return; }

    hero.hidden = false;
    hero.innerHTML = `
      <div class="map-hero-frame">
        ${map.mapImage ? `<img src="${map.mapImage}" alt="${escapeHtml(map.name)}" loading="lazy">` : `<span class="mm-placeholder mm-placeholder--lg">${mmInitial(map.name)}</span>`}
      </div>
      <div class="map-hero-name">${escapeHtml(map.name)}</div>
    `;
  }

  function mapCard(m){
    const a = document.createElement('a');
    a.className = 'card';
    a.href = `#/map/${m.slug}`;
    a.innerHTML = `
      <div class="card-img mm-frame">${m.mapImage ? `<img src="${m.mapImage}" alt loading="lazy">` : mmPlaceholder(m.name)}</div>
      <div class="card-name">${escapeHtml(m.name)}</div>
      <div class="card-meta"><span>${m.monsters.length} มอนสเตอร์</span></div>
    `;
    return a;
  }

  function monsterCard(mon){
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card card-btn';
    btn.innerHTML = `
      <div class="card-img mm-frame">${mon.image ? `<img src="${mon.image}" alt loading="lazy">` : mmPlaceholder(mon.name)}</div>
      <div class="card-name">${escapeHtml(mon.name)}</div>
    `;
    btn.addEventListener('click', () => openMonsterPopup(mon.name));
    return btn;
  }

  function mmInitial(name){
    return escapeHtml(String(name).trim().charAt(0).toUpperCase() || '?');
  }

  function mmPlaceholder(name){
    return `<span class="mm-placeholder">${mmInitial(name)}</span>`;
  }

  // ---------------- Cross-referencing with item drop data ----------------
  function findDropsForMonster(name){
    const needle = name.trim().toLowerCase();
    const out = [];
    KSR.armor.allFlat().forEach(e => { if ((e.item.monsters||[]).some(m => m.trim().toLowerCase() === needle)) out.push(e); });
    KSR.weapon.allFlat().forEach(e => { if ((e.item.monsters||[]).some(m => m.trim().toLowerCase() === needle)) out.push(e); });
    KSR.skill.allFlat().forEach(e => { if ((e.item.monsters||[]).some(m => m.trim().toLowerCase() === needle)) out.push(e); });
    return out;
  }

  function findMapsForMonster(name){
    const needle = name.trim().toLowerCase();
    return mapList().filter(m => m.monsters.some(mo => mo.name.trim().toLowerCase() === needle));
  }

  function findMonsterEntry(name){
    const needle = name.trim().toLowerCase();
    for (const m of mapList()){
      const mon = m.monsters.find(mo => mo.name.trim().toLowerCase() === needle);
      if (mon) return { map: m, monster: mon };
    }
    return null;
  }

  // ---------------- The monster popup ----------------
  function openMonsterPopup(name){
    const entry = findMonsterEntry(name);
    const image = entry ? entry.monster.image : null;
    const maps = findMapsForMonster(name);
    const drops = findDropsForMonster(name);

    const modeLabel = { armor: 'ชุดอาชีพ', weapon: 'อาวุธ', skill: 'สกิล' };

    const html = `
      <div class="detail-head">
        <div class="detail-img mm-frame">${image ? `<img src="${image}" alt>` : mmPlaceholder(name)}</div>
        <div class="detail-titles">
          <h2>${escapeHtml(name)}</h2>
          ${maps.length ? `
            <div class="detail-badges">
              ${maps.map(m => `<button type="button" class="chip mm-map-link" data-map="${escapeHtml(m.slug)}" style="cursor:pointer;">🗺️ ${escapeHtml(m.name)}</button>`).join('')}
            </div>
          ` : `<div class="detail-badges"><span class="chip">ยังไม่ทราบแผนที่</span></div>`}
        </div>
        <div class="detail-popup-actions">
          <button class="detail-back" id="monsterBackBtn" aria-label="ย้อนกลับ">← ย้อนกลับ</button>
          <button class="detail-close" id="monsterCloseBtn" aria-label="ปิด">&times;</button>
        </div>
      </div>
      <div class="detail-body">
        <div class="drop-title">ไอเทมที่ดรอปจากมอนสเตอร์นี้</div>
        ${drops.length ? `
          <div class="mm-drop-grid">
            ${drops.map((d, i) => `
              <button type="button" class="mm-drop-item" data-drop-index="${i}">
                <div class="card-img">${d.item.image ? `<img src="${d.item.image}" alt loading="lazy">` : ''}</div>
                <div class="mm-drop-name">${escapeHtml(d.item.name)}</div>
                <div class="mm-drop-meta">${modeLabel[d.mode] || ''}</div>
              </button>
            `).join('')}
          </div>
        ` : `<div class="monster-none">ยังไม่มีข้อมูลไอเทมดรอปจากมอนสเตอร์นี้</div>`}
      </div>
    `;

    KSR.overlay.show('monsterOverlay', 'monsterPanel', html);
    $('#monsterCloseBtn').addEventListener('click', closeMonsterPopup);
    $('#monsterBackBtn').addEventListener('click', closeMonsterPopup);
    KSR.util.$$('.mm-map-link', $('#monsterPanel')).forEach(btn => {
      btn.addEventListener('click', () => {
        closeMonsterPopup();
        KSR.app.navigate(`#/map/${btn.dataset.map}`);
      });
    });
    KSR.util.$$('.mm-drop-item', $('#monsterPanel')).forEach(btn => {
      btn.addEventListener('click', () => {
        const d = drops[Number(btn.dataset.dropIndex)];
        if (!d) return;
        closeMonsterPopup();
        // "back" from the item popup re-opens this same monster popup —
        // clicking the item never navigates away to the full item list.
        KSR.app.openItemPopup(d.item, d.mode, d.group, d.cat, () => openMonsterPopup(name));
      });
    });
  }

  function closeMonsterPopup(){
    KSR.overlay.hide('monsterOverlay', 'monsterPanel');
  }

  return {
    mapList, getMap, renderRail, renderCatTabs, renderGrid, renderMapHero,
    openMonsterPopup, closeMonsterPopup,
    findDropsForMonster, findMapsForMonster,
  };
})();
