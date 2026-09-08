// ============================================================
// KSR.skill — everything specific to skill mode
// ============================================================
KSR.skill = (function(){
  const { escapeHtml } = KSR.util;
  const { CLASS_ORDER, CLASS_TH, CLASS_EN } = KSR.const;
  const state = KSR.state;

  function getList(){
    return state.SKILLS[state.currentGroup.toUpperCase()] || [];
  }

  function renderRail(rail){
    const label = document.createElement('div');
    label.className = 'rail-group-label';
    label.textContent = 'อาชีพ';
    rail.appendChild(label);

    CLASS_ORDER.forEach(cls => {
      rail.appendChild(KSR.app.railButton(
        `${CLASS_TH[cls]} · ${CLASS_EN[cls]}`,
        cls === state.currentGroup,
        `--c-${cls.toLowerCase()}`,
        () => KSR.app.navigate(`#/skill/${cls}`)
      ));
    });
  }

  function renderCatTabs(wrap, titleEl){
    titleEl.textContent = `สกิล: ${CLASS_TH[state.currentGroup]} (${CLASS_EN[state.currentGroup]})`;
    // skill mode has no sub-category tabs — wrap stays empty
  }

  function itemCard(item){
    const a = document.createElement('a');
    a.className = 'card';
    a.href = `#/skill/${state.currentGroup}/${item.id}`;
    a.innerHTML = `
      <div class="card-img">${item.image ? `<img src="${item.image}" alt loading="lazy">` : ''}</div>
      <div class="card-name">${escapeHtml(item.name)}</div>
      <div class="card-meta">
        <span>${escapeHtml(item.detail || '')}</span>
      </div>
    `;
    return a;
  }

  function badge(group){
    return { text: `${CLASS_TH[group]} · ${CLASS_EN[group]}`, color: `--c-${group.toLowerCase()}` };
  }

  function reqTable(item){
    return `
      <div class="stat-table-wrap">
        <table class="stat-table">
          <thead><tr><th>STR</th><th>DEX</th><th>WIS</th><th>CHA</th></tr></thead>
          <tbody><tr><td>${escapeHtml(item.str)}</td><td>${escapeHtml(item.dex)}</td><td>${escapeHtml(item.wis)}</td><td>${escapeHtml(item.cha)}</td></tr></tbody>
        </table>
      </div>
    `;
  }

  function detailBody(item){
    return `
      <div class="drop-title">ค่าที่ต้องการ (Requirement)</div>
      ${reqTable(item)}
      ${item.detail ? `<div class="drop-title" style="margin-top:16px;">รายละเอียด</div><div class="monster-tag" style="display:inline-block; margin-bottom:20px; cursor:default;">${escapeHtml(item.detail)}</div>` : ''}
      <div class="drop-title">มอนสเตอร์ดรอป (ได้รับจาก)</div>
      ${KSR.shared.renderMonsters(item.monsters)}
    `;
  }

  function findById(id){
    for (const cls of CLASS_ORDER){
      const found = (state.SKILLS[cls.toUpperCase()] || []).find(i => i.id === id);
      if (found) return { item: found, group: cls, cat: null };
    }
    return null;
  }

  function allFlat(){
    const out = [];
    for (const cls of CLASS_ORDER){
      (state.SKILLS[cls.toUpperCase()] || []).forEach(it => out.push({item:it, mode:'skill', group:cls, cat:null}));
    }
    return out;
  }

  return { getList, renderRail, renderCatTabs, itemCard, badge, detailBody, findById, allFlat };
})();
