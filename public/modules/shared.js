// ============================================================
// KSR.shared — constants, global state, and small utilities
// used by every other module. Load this file FIRST.
// ============================================================
window.KSR = window.KSR || {};

KSR.const = {
  ARMOR_CATS: ['helmets','armors','gloves','pants','boots','capes','shields'],
  CAT_TH: {
    helmets:'หมวก', armors:'ชุด/เกราะ', gloves:'ถุงมือ', pants:'กางเกง',
    boots:'รองเท้า', capes:'เสื้อคลุม', shields:'โล่',
  },
  CLASS_ORDER: ['Knight','Sorcerer','Assassin','Micko','Necromancer','Cleric'],
  CLASS_TH: {
    Knight:'ไนท์', Sorcerer:'ซอร์เซอร์เรอร์', Assassin:'แอสแซสซิน',
    Micko:'มิคโค่', Necromancer:'เนโครแมนเซอร์', Cleric:'คลีริค',
  },
  CLASS_EN: {
    Knight:'Knight', Sorcerer:'Sorcerer', Assassin:'Assassin',
    Micko:'Micko', Necromancer:'Necromancer', Cleric:'Cleric',
  },
  WEAPON_ORDER: ['Sword','Axe','Mace','Spear','Wand','Bow','Dagger'],
  WEAPON_TH: {
    Sword:'ดาบ', Axe:'ขวาน', Mace:'กระบอง', Spear:'หอก',
    Wand:'ไม้เท้า', Bow:'ธนู', Dagger:'มีดสั้น',
  },
};

// Shared mutable app state — every module reads/writes this same object.
KSR.state = {
  DATA: null,   // full.json
  SKILLS: null, // skills.json
  MAPS: null,   // maps.json
  currentMode: 'armor',   // 'armor' | 'weapon' | 'skill' | 'map'
  currentGroup: 'Knight', // class name / weapon category
  currentCat: 'helmets',  // only used in armor mode
  currentMapSlug: null,   // only used in map mode
};

KSR.util = {
  $(sel, el = document) { return el.querySelector(sel); },
  $$(sel, el = document) { return Array.from(el.querySelectorAll(sel)); },
  escapeHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  },
  slugify(str) {
    return String(str).trim().toLowerCase()
      .replace(/[^\w\s()-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[()]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  },
};

// ---------------- Reusable overlay open/close ----------------
// Generic show/hide for any overlay+panel pair (used by item detail
// overlay and the separate monster popup overlay).
KSR.overlay = {
  show(overlayId, panelId, html) {
    const { $ } = KSR.util;
    $('#' + panelId).innerHTML = html;
    $('#' + overlayId).classList.add('is-open');
  },
  hide(overlayId, panelId) {
    const { $ } = KSR.util;
    $('#' + overlayId).classList.remove('is-open');
    $('#' + panelId).innerHTML = '';
  },
};

// ---------------- Bits shared by armor/weapon/skill detail panels ----------------
KSR.shared = {
  renderStatsTable(stats, isWeapon) {
    const { escapeHtml } = KSR.util;
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
  },

  // Monster tags are clickable buttons — clicking one opens the monster
  // popup (name/image/drops/map) regardless of where it's rendered from.
  renderMonsters(monsters) {
    const { escapeHtml } = KSR.util;
    if (!monsters || !monsters.length) return `<div class="monster-none">ไม่มีข้อมูลมอนสเตอร์ดรอป</div>`;
    return `<div class="monster-list">${monsters.map(m =>
      `<button type="button" class="monster-tag" data-monster="${escapeHtml(m)}">${escapeHtml(m)}</button>`
    ).join('')}</div>`;
  },

  // Delegated click handler — call once at init. Any element with
  // data-monster anywhere in the document opens the monster popup.
  bindMonsterTagClicks(root = document) {
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-monster]');
      if (!btn) return;
      KSR.mapmonster.openMonsterPopup(btn.dataset.monster);
    });
  },
};
