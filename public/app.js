// ============================================================
// KhanSpeedrun Item Database — static SPA (hash-routed, per-set links)
// ============================================================

const ARMOR_CATS = ['helmets','armors','gloves','pants','boots','capes','shields'];
const CAT_TH = {
  helmets:'หมวก', armors:'ชุด/เกราะ', gloves:'ถุงมือ', pants:'กางเกง',
  boots:'รองเท้า', capes:'เสื้อคลุม', shields:'โล่',
};
const CLASS_ORDER = ['Knight','Sorcerer','Assassin','Micko','Necromancer','Cleric'];
const CLASS_TH = {
  Knight:'ไนท์', Sorcerer:'ซอร์เซอร์เรอร์', Assassin:'แอสแซสซิน',
  Micko:'มิคโค่', Necromancer:'เนโครแมนเซอร์', Cleric:'คลีริค',
};
const CLASS_EN = {
  Knight:'Knight', Sorcerer:'Sorcerer', Assassin:'Assassin',
  Micko:'Micko', Necromancer:'Necromancer', Cleric:'Cleric',
};
const WEAPON_ORDER = ['Sword','Axe','Mace','Spear','Wand','Bow','Dagger'];
const WEAPON_TH = {
  Sword:'ดาบ', Axe:'ขวาน', Mace:'กระบอง', Spear:'หอก',
  Wand:'ไม้เท้า', Bow:'ธนู', Dagger:'มีดสั้น',
};

let DATA = null;
let SKILLS = null;
let currentMode = 'armor';   // 'armor' | 'weapon' | 'skill'
let currentGroup = 'Knight'; // class name or weapon category
let currentCat = 'helmets';  // only used in armor mode

const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));

async function init(){
  const [itemsRes, skillsRes] = await Promise.all([
    fetch('data/full.json'),
    fetch('data/skills.json'),
  ]);
  DATA = await itemsRes.json();
  SKILLS = await skillsRes.json();
  bindGlobalEvents();
  applyRoute();
  window.addEventListener('hashchange', applyRoute);
}

// ---------------- Routing ----------------
// #/armor/<Class>/<cat>[/<id>]
// #/weapon/<Cat>[/<id>]
// #/skill/<Class>[/<id>]
function applyRoute(){
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  closeDetail(false);

  if (parts[0] === 'weapon'){
    currentMode = 'weapon';
    currentGroup = decodeURIComponent(parts[1] || 'Sword');
    if (!WEAPON_ORDER.includes(currentGroup)) currentGroup = 'Sword';
    render();
    if (parts[2]) openDetailById(decodeURIComponent(parts[2]));
    return;
  }

  if (parts[0] === 'skill'){
    currentMode = 'skill';
    currentGroup = decodeURIComponent(parts[1] || 'Knight');
    if (!CLASS_ORDER.includes(currentGroup)) currentGroup = 'Knight';
    render();
    if (parts[2]) openDetailById(decodeURIComponent(parts[2]));
    return;
  }

  // default / armor
  currentMode = 'armor';
  currentGroup = decodeURIComponent(parts[1] || 'Knight');
  if (!CLASS_ORDER.includes(currentGroup)) currentGroup = 'Knight';
  currentCat = decodeURIComponent(parts[2] || 'helmets');
  if (!ARMOR_CATS.includes(currentCat)) currentCat = 'helmets';
  render();
  if (parts[3]) openDetailById(decodeURIComponent(parts[3]));
}

function navigate(hash){
  location.hash = hash;
}

function routeFor(item, mode, group, cat){
  if (mode === 'weapon') return `#/weapon/${group}/${item.id}`;
  if (mode === 'skill') return `#/skill/${group}/${item.id}`;
  return `#/armor/${group}/${cat}/${item.id}`;
}

// ---------------- Rendering: shell ----------------
function bindGlobalEvents(){
  $$('#modeToggle .mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (mode === 'weapon') navigate('#/weapon/Sword');
      else if (mode === 'skill') navigate('#/skill/Knight');
      else navigate('#/armor/Knight/helmets');
    });
  });

  $('#detailOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'detailOverlay') closeDetail(true);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDetail(true);
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

function render(){
  $$('#modeToggle .mode-btn').forEach(b => b.classList.toggle('is-active', b.dataset.mode === currentMode));
  renderRail();
  renderCatTabs();
  renderGrid();
}

function renderRail(){
  const rail = $('#rail');
  rail.innerHTML = '';

  if (currentMode === 'armor' || currentMode === 'skill'){
    const label = document.createElement('div');
    label.className = 'rail-group-label';
    label.textContent = 'อาชีพ';
    rail.appendChild(label);

    CLASS_ORDER.forEach(cls => {
      rail.appendChild(railButton(
        `${CLASS_TH[cls]} · ${CLASS_EN[cls]}`,
        cls === currentGroup,
        `--c-${cls.toLowerCase()}`,
        () => navigate(currentMode === 'skill' ? `#/skill/${cls}` : `#/armor/${cls}/${currentCat}`)
      ));
    });
  } else {
    const label = document.createElement('div');
    label.className = 'rail-group-label';
    label.textContent = 'ประเภทอาวุธ';
    rail.appendChild(label);

    WEAPON_ORDER.forEach(cat => {
      rail.appendChild(railButton(WEAPON_TH[cat], cat === currentGroup, '--c-other',
        () => navigate(`#/weapon/${cat}`)));
    });
  }
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

  if (currentMode === 'armor'){
    title.textContent = `${CLASS_TH[currentGroup]} (${CLASS_EN[currentGroup]})`;
    ARMOR_CATS.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'cat-tab' + (cat === currentCat ? ' is-active' : '');
      btn.textContent = CAT_TH[cat];
      btn.addEventListener('click', () => navigate(`#/armor/${currentGroup}/${cat}`));
      wrap.appendChild(btn);
    });
  } else if (currentMode === 'skill'){
    title.textContent = `สกิล: ${CLASS_TH[currentGroup]} (${CLASS_EN[currentGroup]})`;
  } else {
    title.textContent = `อาวุธ: ${WEAPON_TH[currentGroup]}`;
  }
}

function getCurrentList(){
  if (currentMode === 'armor'){
    const bucket = DATA.classes[currentGroup];
    return bucket ? (bucket[currentCat] || []) : [];
  }
  if (currentMode === 'skill'){
    return SKILLS[currentGroup.toUpperCase()] || [];
  }
  return (DATA.weapons[currentGroup] || []);
}

function renderGrid(){
  const grid = $('#grid');
  const emptyNote = $('#emptyNote');
  grid.innerHTML = '';
  let list = getCurrentList();
  if (currentMode !== 'skill'){
    list = list.slice().sort((a,b) => (a.set ?? 0) - (b.set ?? 0));
  }

  if (!list.length){
    emptyNote.hidden = false;
    return;
  }
  emptyNote.hidden = true;

  list.forEach(item => grid.appendChild(itemCard(item)));
}

function itemCard(item){
  const a = document.createElement('a');
  a.className = 'card';
  a.href = routeFor(item, currentMode, currentGroup, currentCat);
  if (currentMode === 'skill'){
    a.innerHTML = `
      <div class="card-img">${item.image ? `<img src="${item.image}" alt loading="lazy">` : ''}</div>
      <div class="card-name">${escapeHtml(item.name)}</div>
      <div class="card-meta">
        <span>${escapeHtml(item.detail || '')}</span>
      </div>
    `;
    return a;
  }
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

// ---------------- Detail overlay ----------------
function findItemById(id){
  for (const cls of CLASS_ORDER){
    for (const cat of ARMOR_CATS){
      const found = DATA.classes[cls][cat].find(i => i.id === id);
      if (found) return {item: found, mode:'armor', group: cls, cat};
    }
  }
  for (const cat of WEAPON_ORDER){
    const found = DATA.weapons[cat].find(i => i.id === id);
    if (found) return {item: found, mode:'weapon', group: cat, cat: null};
  }
  for (const cls of CLASS_ORDER){
    const found = (SKILLS[cls.toUpperCase()] || []).find(i => i.id === id);
    if (found) return {item: found, mode:'skill', group: cls, cat: null};
  }
  return null;
}

function openDetailById(id){
  const found = findItemById(id);
  if (!found) return;
  currentMode = found.mode;
  currentGroup = found.group;
  if (found.cat) currentCat = found.cat;
  render();
  openDetail(found.item, found.mode, found.group);
}

function openDetail(item, mode, group){
  const overlay = $('#detailOverlay');
  const panel = $('#detailPanel');
  const isWeapon = mode === 'weapon';
  const isSkill = mode === 'skill';

  const badgeText = isWeapon ? WEAPON_TH[group] : `${CLASS_TH[group]} · ${CLASS_EN[group]}`;
  const badgeColor = isWeapon ? '--c-other' : `--c-${group.toLowerCase()}`;

  const titleMeta = isSkill ? '' : `<span style="color:var(--text-faint); font-size:14px;">Set ${item.set ?? '-'}</span>`;

  const bodyHtml = isSkill ? `
      <div class="drop-title">ค่าที่ต้องการ (Requirement)</div>
      ${renderSkillReq(item)}
      ${item.detail ? `<div class="drop-title" style="margin-top:16px;">รายละเอียด</div><div class="monster-tag" style="display:inline-block; margin-bottom:20px;">${escapeHtml(item.detail)}</div>` : ''}
      <div class="drop-title">มอนสเตอร์ดรอป (ได้รับจาก)</div>
      ${renderMonsters(item.monsters)}
    ` : `
      <div class="drop-title">มอนสเตอร์ดรอป (ได้รับจาก)</div>
      ${renderMonsters(item.monsters)}
      <div class="drop-title">ค่าสเตตัสตามระดับอัพเกรด</div>
      ${renderStatsTable(item.stats, isWeapon)}
    `;

  panel.innerHTML = `
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
      <button class="detail-close" id="detailCloseBtn" aria-label="ปิด">&times;</button>
    </div>
    <div class="detail-body">
      ${bodyHtml}
    </div>
  `;

  overlay.classList.add('is-open');
  $('#detailCloseBtn').addEventListener('click', () => closeDetail(true));
  $('#copyLinkBtn').addEventListener('click', (e) => {
    const url = location.origin + location.pathname + routeFor(item, mode, group, currentCat);
    navigator.clipboard?.writeText(url).then(() => {
      e.target.textContent = 'คัดลอกแล้ว ✓';
      setTimeout(() => { e.target.textContent = `คัดลอกลิงก์${isSkill ? 'สกิล' : 'ไอเทม'}นี้`; }, 1600);
    }).catch(() => {
      prompt('คัดลอกลิงก์นี้:', url);
    });
  });
}

function renderSkillReq(item){
  return `
    <div class="stat-table-wrap">
      <table class="stat-table">
        <thead><tr><th>STR</th><th>DEX</th><th>WIS</th><th>CHA</th></tr></thead>
        <tbody><tr><td>${escapeHtml(item.str)}</td><td>${escapeHtml(item.dex)}</td><td>${escapeHtml(item.wis)}</td><td>${escapeHtml(item.cha)}</td></tr></tbody>
      </table>
    </div>
  `;
}

function renderMonsters(monsters){
  if (!monsters || !monsters.length) return `<div class="monster-none">ไม่มีข้อมูลมอนสเตอร์ดรอป</div>`;
  return `<div class="monster-list">${monsters.map(m => `<span class="monster-tag">${escapeHtml(m)}</span>`).join('')}</div>`;
}

function renderStatsTable(stats, isWeapon){
  if (!stats || !stats.length) return `<div class="monster-none">ไม่มีข้อมูลค่าสเตตัส</div>`;

  const headers = isWeapon
    ? ['+','โจมตีประชิด','โจมตีเวท','เลเวลที่ต้องการ','STR','DEX','WIS','CHA']
    : ['+','ป้องกัน','เลเวลที่ต้องการ','STR','DEX','WIS','CHA','ความคงทน'];

  const rows = stats.map(s => {
    if (isWeapon){
      return [s.plus, `${s.atkMin}-${s.atkMax}`, `${s.magicMin}-${s.magicMax}`, s.levelReq, s.str, s.dex, s.wis, s.cha];
    }
    return [s.plus, `${s.defMin}-${s.defMax}`, s.levelReq, s.str, s.dex, s.wis, s.cha, s.dur];
  });

  return `
    <div class="stat-table-wrap">
      <table class="stat-table">
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${escapeHtml(String(c))}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </div>
  `;
}

function closeDetail(updateHash){
  $('#detailOverlay').classList.remove('is-open');
  $('#detailPanel').innerHTML = '';
  if (updateHash){
    if (currentMode === 'weapon') navigate(`#/weapon/${currentGroup}`);
    else if (currentMode === 'skill') navigate(`#/skill/${currentGroup}`);
    else navigate(`#/armor/${currentGroup}/${currentCat}`);
  }
}

// ---------------- Search ----------------
function allItemsFlat(){
  const out = [];
  for (const cls of CLASS_ORDER){
    for (const cat of ARMOR_CATS){
      DATA.classes[cls][cat].forEach(it => out.push({item:it, mode:'armor', group:cls, cat}));
    }
  }
  for (const cat of WEAPON_ORDER){
    DATA.weapons[cat].forEach(it => out.push({item:it, mode:'weapon', group:cat, cat:null}));
  }
  for (const cls of CLASS_ORDER){
    (SKILLS[cls.toUpperCase()] || []).forEach(it => out.push({item:it, mode:'skill', group:cls, cat:null}));
  }
  return out;
}
let FLAT_CACHE = null;

function runSearch(q){
  if (!FLAT_CACHE) FLAT_CACHE = allItemsFlat();
  const ql = q.toLowerCase();

  const byName = FLAT_CACHE.filter(e => e.item.name.toLowerCase().includes(ql));
  const byMonster = FLAT_CACHE.filter(e =>
    !e.item.name.toLowerCase().includes(ql) &&
    e.item.monsters.some(m => m.toLowerCase().includes(ql))
  );

  const box = $('#searchResults');
  box.hidden = false;

  if (!byName.length && !byMonster.length){
    box.innerHTML = `<div class="sr-none">ไม่พบผลลัพธ์สำหรับ "${escapeHtml(q)}"</div>`;
    return;
  }

  box.innerHTML = `
    ${byName.length ? searchGroup('ไอเทม', byName) : ''}
    ${byMonster.length ? searchGroup(`ดรอปจากมอนสเตอร์ "${escapeHtml(q)}"`, byMonster) : ''}
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
}

function searchGroup(title, entries){
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

function hideSearch(){
  $('#searchResults').hidden = true;
}

function escapeHtml(str){
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

init();
