// ============================================================
// KSR.armor — everything specific to armor-set mode
// ============================================================
KSR.armor = (function(){
  const { $, escapeHtml } = KSR.util;
  const { ARMOR_CATS, CAT_TH, CLASS_ORDER, CLASS_TH, CLASS_EN } = KSR.const;
  const state = KSR.state;

  function getList(){
    const bucket = state.DATA.classes[state.currentGroup];
    return bucket ? (bucket[state.currentCat] || []) : [];
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
        () => KSR.app.navigate(`#/armor/${cls}/${state.currentCat}`)
      ));
    });
  }

  function renderCatTabs(wrap, titleEl){
    titleEl.textContent = `${CLASS_TH[state.currentGroup]} (${CLASS_EN[state.currentGroup]})`;
    ARMOR_CATS.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'cat-tab' + (cat === state.currentCat ? ' is-active' : '');
      btn.textContent = CAT_TH[cat];
      btn.addEventListener('click', () => KSR.app.navigate(`#/armor/${state.currentGroup}/${cat}`));
      wrap.appendChild(btn);
    });
  }

  function itemCard(item){
    const a = document.createElement('a');
    a.className = 'card';
    a.href = `#/armor/${state.currentGroup}/${state.currentCat}/${item.id}`;
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
    return { text: `${CLASS_TH[group]} · ${CLASS_EN[group]}`, color: `--c-${group.toLowerCase()}` };
  }

  function detailBody(item){
    return `
      <div class="drop-title">มอนสเตอร์ดรอป (ได้รับจาก)</div>
      ${KSR.shared.renderMonsters(item.monsters)}
      <div class="drop-title">ค่าสเตตัสตามระดับอัพเกรด</div>
      ${KSR.shared.renderStatsTable(item.stats, false)}
    `;
  }

  function findById(id){
    for (const cls of CLASS_ORDER){
      for (const cat of ARMOR_CATS){
        const found = state.DATA.classes[cls][cat].find(i => i.id === id);
        if (found) return { item: found, group: cls, cat };
      }
    }
    return null;
  }

  function allFlat(){
    const out = [];
    for (const cls of CLASS_ORDER){
      for (const cat of ARMOR_CATS){
        state.DATA.classes[cls][cat].forEach(it => out.push({item:it, mode:'armor', group:cls, cat}));
      }
    }
    return out;
  }

  return { getList, renderRail, renderCatTabs, itemCard, badge, detailBody, findById, allFlat };
})();
