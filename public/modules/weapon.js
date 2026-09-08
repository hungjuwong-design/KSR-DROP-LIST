// ============================================================
// KSR.weapon — everything specific to weapon mode
// ============================================================
KSR.weapon = (function(){
  const { escapeHtml } = KSR.util;
  const { WEAPON_ORDER, WEAPON_TH } = KSR.const;
  const state = KSR.state;

  function getList(){
    return state.DATA.weapons[state.currentGroup] || [];
  }

  function renderRail(rail){
    const label = document.createElement('div');
    label.className = 'rail-group-label';
    label.textContent = 'ประเภทอาวุธ';
    rail.appendChild(label);

    WEAPON_ORDER.forEach(cat => {
      rail.appendChild(KSR.app.railButton(WEAPON_TH[cat], cat === state.currentGroup, '--c-other',
        () => KSR.app.navigate(`#/weapon/${cat}`)));
    });
  }

  function renderCatTabs(wrap, titleEl){
    titleEl.textContent = `อาวุธ: ${WEAPON_TH[state.currentGroup]}`;
    // weapon mode has no sub-category tabs — wrap stays empty
  }

  function itemCard(item){
    const a = document.createElement('a');
    a.className = 'card';
    a.href = `#/weapon/${state.currentGroup}/${item.id}`;
    a.innerHTML = `
      <div class="card-img">${item.image ? `<img src="${item.image}" alt loading="lazy">` : ''}</div>
      <div class="card-name">${escapeHtml(item.name)}</div>
      <div class="card-meta">
        <span>Set ${item.set ?? '-'}</span>
        ${item.stats?.length ? `<span class="chip">+0~+${item.stats.length-1}</span>` : ''}
      </div>
    `;
    return a;
  }

  function badge(group){
    return { text: WEAPON_TH[group], color: '--c-other' };
  }

  function detailBody(item){
    return `
      <div class="drop-title">มอนสเตอร์ดรอป (ได้รับจาก)</div>
      ${KSR.shared.renderMonsters(item.monsters)}
      <div class="drop-title">ค่าสเตตัสตามระดับอัพเกรด</div>
      ${KSR.shared.renderStatsTable(item.stats, true)}
    `;
  }

  function findById(id){
    for (const cat of WEAPON_ORDER){
      const found = state.DATA.weapons[cat].find(i => i.id === id);
      if (found) return { item: found, group: cat, cat: null };
    }
    return null;
  }

  function allFlat(){
    const out = [];
    for (const cat of WEAPON_ORDER){
      state.DATA.weapons[cat].forEach(it => out.push({item:it, mode:'weapon', group:cat, cat:null}));
    }
    return out;
  }

  return { getList, renderRail, renderCatTabs, itemCard, badge, detailBody, findById, allFlat };
})();
