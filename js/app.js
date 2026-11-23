/* =========================================================
   YUMM IA · Motor de la aplicación
   Estado (localStorage) · Navegación con bloqueo secuencial ·
   Render de formularios · Validaciones · Exportación
   ========================================================= */
'use strict';

const STORAGE_KEY = 'yumm_ia_state';
let STATE = loadState();
let CURRENT = null;      // contexto del módulo abierto
const openPhases = new Set();

/* ---------- Estado ---------- */
function freshState() { return { version: 1, current_module: '1', progress: 0, enfoque: null, data: {} }; }
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (s && s.data && typeof s.data === 'object') return Object.assign(freshState(), s);
  } catch (e) { console.error('Error al cargar estado:', e); }
  return freshState();
}
let saveTimer = null;
function saveState(now) {
  const ind = document.getElementById('autosave');
  if (ind) { ind.classList.add('saving'); ind.lastChild.textContent = ' Guardando…'; }
  clearTimeout(saveTimer);
  const run = () => {
    STATE.progress = progress().pct;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE));
      if (STATE.data.mod1) localStorage.setItem('yumm_mod1', JSON.stringify(STATE.data.mod1));
    } catch (e) { toast('No se pudo guardar en este navegador', 'warn'); }
    const i = document.getElementById('autosave');
    if (i) { i.classList.remove('saving'); i.lastChild.textContent = ' Guardado automáticamente'; }
  };
  now ? run() : (saveTimer = setTimeout(run, 450));
}

/* ---------- Reglas de navegación ---------- */
const applies = id => (MOD[id].applies ? MOD[id].applies(STATE) : true);
const prereqs = id => ORDER.slice(0, ORDER.indexOf(id)).filter(x => applies(x) && !(id === '10' && x === '9'));
const isUnlocked = id => prereqs(id).every(x => isValid(STATE, x));
const firstPending = () => ORDER.find(id => applies(id) && !isValid(STATE, id) && isUnlocked(id)) || '29';
function nextAfter(id) {
  if (id === '8' && !isValid(STATE, '10')) return '10';
  if (id === '10' && applies('9') && !isValid(STATE, '9')) return '9';
  const c = ORDER.slice(ORDER.indexOf(id) + 1).filter(applies);
  return c.find(x => !isValid(STATE, x)) || c[0] || null;
}
function prevOf(id) { const c = ORDER.slice(0, ORDER.indexOf(id)).filter(applies); return c[c.length - 1] || null; }
function progress() {
  const ap = ORDER.filter(applies); const done = ap.filter(x => isValid(STATE, x)).length;
  return { done, total: ap.length, pct: ap.length ? Math.round(done / ap.length * 100) : 0 };
}

/* ---------- Rutas de datos ---------- */
function getPath(o, p) { return String(p).split('.').reduce((a, k) => (a == null ? undefined : a[k]), o); }
function setPath(o, p, v) {
  const ks = String(p).split('.'); let cur = o;
  ks.slice(0, -1).forEach((k, i) => { if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = /^\d+$/.test(ks[i + 1]) ? [] : {}; cur = cur[k]; });
  cur[ks[ks.length - 1]] = v;
}
const fid = k => 'f_' + String(k).replace(/[^\w]/g, '_');

/* ---------- Render de campos ---------- */
const optList = (f, ctx) => (typeof f.opts === 'function' ? f.opts(ctx) : f.opts || []).map(o => (typeof o === 'string' ? { v: o, l: o } : o));
const reqMark = f => (f.req || f.minItems ? '<span class="req">*</span>' : '');
function counterHTML(f, val) {
  if (!f.min) return '';
  const n = String(val || '').length; const ok = n >= f.min;
  return `<span class="counter ${ok ? 'ok' : ''}">${n}/${f.min}</span>`;
}
function renderField(f, ctx) {
  if (f.type === 'row') return `<div class="grid-${f.cols || 2}">${f.fields.map(x => renderField(x, ctx)).join('')}</div>`;
  const id = f._id;
  const hidden = f.show && !f.show(ctx.d, ctx) ? ' hidden' : '';
  if (f.type === 'info') return `<div id="${id}" class="${hidden.trim()}">${alertBox(f.kind || 'info', f.html)}</div>`;
  if (f.type === 'html') return `<div id="${id}" class="${hidden.trim()}">${f.html(ctx)}</div>`;
  const k = f.k; const v = getPath(ctx.d, k);
  const lab = `<label for="in_${id}">${esc(f.label)}${reqMark(f)}${counterHTML(f, v)}</label>${f.hint ? `<div class="hint">${f.hint}</div>` : ''}`;
  const wrap = (inner, extra = '') => `<div class="field${hidden}" id="${id}" data-fk="${esc(k)}" ${f.min ? `data-min="${f.min}"` : ''} ${extra}>${inner}</div>`;
  const bar = f.min ? `<div class="cbar ${String(v || '').length >= f.min ? 'ok' : ''}"><i style="width:${Math.min(100, String(v || '').length / f.min * 100)}%"></i></div>` : '';
  switch (f.type) {
    case 'text': return wrap(lab + `<input id="in_${id}" type="text" data-path="${k}" value="${esc(v)}" placeholder="${esc(f.ph || '')}">` + bar);
    case 'number': return wrap(lab + `<input id="in_${id}" type="number" data-path="${k}" value="${esc(v)}" placeholder="${esc(f.ph || '')}" ${f.minV != null ? `min="${f.minV}"` : ''}>`);
    case 'date': return wrap(lab + `<input id="in_${id}" type="date" data-path="${k}" value="${esc(v)}">`);
    case 'textarea': return wrap(lab + `<textarea id="in_${id}" data-path="${k}" rows="${f.rows || 4}" placeholder="${esc(f.ph || '')}" ${f.mono ? 'class="mono"' : ''}>${esc(v)}</textarea>` + bar);
    case 'select': {
      const o = optList(f, ctx);
      return wrap(lab + `<select id="in_${id}" data-path="${k}"><option value="">— Selecciona —</option>${o.map(x => `<option value="${esc(x.v)}" ${String(v) === String(x.v) ? 'selected' : ''}>${esc(x.l)}</option>`).join('')}</select>`);
    }
    case 'radio': case 'checks': {
      const o = optList(f, ctx); const multi = f.type === 'checks'; const arr = Array.isArray(v) ? v : [];
      const cols = f.cols === 1 ? 'cols-1' : '';
      const style = f.cols && f.cols > 1 ? `style="grid-template-columns:repeat(${f.cols},minmax(0,1fr))"` : '';
      return wrap(`<div class="label">${esc(f.label)}${reqMark(f)}</div>${f.hint ? `<div class="hint">${f.hint}</div>` : ''}<div class="opts ${cols}" ${style} role="${multi ? 'group' : 'radiogroup'}">${o.map(x => `<label class="opt ${multi ? 'cb' : ''}"><input type="${multi ? 'checkbox' : 'radio'}" name="${id}" data-path="${k}" ${multi ? 'data-multi="1"' : ''} value="${esc(x.v)}" ${(multi ? arr.includes(x.v) : v === x.v) ? 'checked' : ''}><span class="box"></span><span class="ot"><b>${esc(x.l)}</b>${x.d ? `<span>${esc(x.d)}</span>` : ''}</span></label>`).join('')}</div>`);
    }
    case 'list': {
      const arr = Array.isArray(v) ? v : [];
      const full = f.maxItems && arr.length >= f.maxItems;
      return wrap(`<div class="label">${esc(f.label)}${reqMark(f)}</div>${f.hint ? `<div class="hint">${f.hint}</div>` : ''}
        <div class="list-items">${arr.map((x, i) => `<div class="list-row${ctx.fresh === `${k}.${i}` ? ' fresh' : ''}" data-list="${k}" data-i="${i}"><span class="idx">${i + 1}</span><input type="text" data-path="${k}.${i}" value="${esc(x)}" placeholder="${esc(f.ph || '')} ${i + 1}">${f.badge ? `<span class="badge-slot">${f.badge(x, ctx)}</span>` : ''}<button class="icon-btn" type="button" title="Eliminar" data-act="listDel" data-k="${k}" data-i="${i}">${ICON.x}</button></div>`).join('')}</div>
        ${full ? `<span class="badge o">Máximo ${f.maxItems}</span>` : `<button class="btn btn-sm btn-soft" type="button" data-act="listAdd" data-k="${k}">${ICON.plus} ${esc(f.add || 'Agregar')}</button>`}`);
    }
    case 'rep': {
      const arr = Array.isArray(v) ? v : [];
      const full = f.maxItems && arr.length >= f.maxItems;
      return wrap(`<div class="label">${esc(f.label)}${reqMark(f)}<span class="counter ${f.minItems && arr.length >= f.minItems ? 'ok' : ''}">${arr.length}${f.minItems ? ` / mín. ${f.minItems}` : ''}</span></div>${f.hint ? `<div class="hint">${f.hint}</div>` : ''}
        <div class="rep-items">${arr.map((it, i) => `<div class="rep-item${ctx.fresh === `${k}.${i}` ? ' fresh' : ''}" data-rep="${k}" data-i="${i}"><div class="rep-head"><b data-title>${f.title ? f.title(it, i, ctx) : `Elemento ${i + 1}`}</b><button class="icon-btn" type="button" title="Eliminar" data-act="repDel" data-k="${k}" data-i="${i}">${ICON.x}</button></div>
          <div class="grid-2">${f.fields.map(s => subField(s, `${k}.${i}.${s.k}`, it[s.k], ctx)).join('')}</div></div>`).join('') || '<div class="empty">Aún no hay elementos.</div>'}</div>
        ${full ? `<span class="badge o">Máximo ${f.maxItems}</span>` : `<button class="btn btn-sm btn-soft" type="button" data-act="repAdd" data-k="${k}">${ICON.plus} ${esc(f.add || 'Agregar')}</button>`}`);
    }
  }
  return '';
}
function subField(s, path, v, ctx) {
  const full = s.full || s.type === 'textarea' ? 'style="grid-column:1/-1"' : '';
  const lab = `<label>${esc(s.label)}${s.req ? ' *' : ''}</label>`;
  switch (s.type) {
    case 'textarea': return `<div class="sub" ${full}>${lab}<textarea rows="2" data-path="${path}" placeholder="${esc(s.ph || '')}">${esc(v)}</textarea></div>`;
    case 'number': return `<div class="sub" ${full}>${lab}<input type="number" data-path="${path}" value="${esc(v)}" placeholder="${esc(s.ph || '')}"></div>`;
    case 'select': return `<div class="sub" ${full}>${lab}<select data-path="${path}"><option value="">— Selecciona —</option>${optList(s, ctx).map(x => `<option value="${esc(x.v)}" ${String(v) === String(x.v) ? 'selected' : ''}>${esc(x.l)}</option>`).join('')}</select></div>`;
    case 'check': return `<div class="sub check" style="grid-column:1/-1"><label><input type="checkbox" data-path="${path}" ${v ? 'checked' : ''}> ${esc(s.label)}</label></div>`;
    default: return `<div class="sub" ${full}>${lab}<input type="text" data-path="${path}" value="${esc(v)}" placeholder="${esc(s.ph || '')}"></div>`;
  }
}
function flatFields(fields) { const out = []; fields.forEach(f => f.type === 'row' ? out.push(...flatFields(f.fields)) : out.push(f)); return out; }

/* ---------- Validación genérica ---------- */
function genericValidate(ctx) {
  const r = [];
  flatFields(ctx.fields).forEach(f => {
    if (!f.k || (f.show && !f.show(ctx.d, ctx))) return;
    const v = getPath(ctx.d, f.k); const L = `«${esc(f.label)}»`;
    switch (f.type) {
      case 'list': {
        const n = (v || []).filter(filled).length;
        if (f.minItems && n < f.minItems) r.push(E(`${L}: agrega al menos ${f.minItems} elemento(s) con contenido.`, f.k));
        if (f.maxItems && n > f.maxItems) r.push(E(`${L}: máximo ${f.maxItems} elementos.`, f.k));
        break;
      }
      case 'rep': {
        const arr = v || [];
        if (f.minItems && arr.length < f.minItems) r.push(E(`${L}: mínimo ${f.minItems} elementos (tienes ${arr.length}).`, f.k));
        if (f.maxItems && arr.length > f.maxItems) r.push(E(`${L}: máximo ${f.maxItems} elementos.`, f.k));
        arr.forEach((it, i) => { const miss = f.fields.filter(s => s.req && !filled(it[s.k])).map(s => s.label); if (miss.length) r.push(E(`${L} · elemento ${i + 1}: completa ${miss.map(m => `«${esc(m)}»`).join(', ')}.`, f.k)); });
        break;
      }
      case 'checks': {
        const n = (v || []).length;
        if (f.minItems && n < f.minItems) r.push(E(f.minItems === 1 ? `${L}: selecciona al menos una opción.` : `${L}: selecciona ${f.minItems} opciones (tienes ${n}).`, f.k));
        if (f.maxItems && n > f.maxItems) r.push(E(`${L}: máximo ${f.maxItems} opciones.`, f.k));
        break;
      }
      default:
        if (f.req && !filled(v)) r.push(E(`${L} es obligatorio.`, f.k));
        else if (f.min && String(v || '').trim().length < f.min) r.push(E(`${L} debe tener al menos ${f.min} caracteres (tiene ${String(v || '').trim().length}).`, f.k));
        else if (f.type === 'number' && f.minV != null && filled(v) && +v < f.minV) r.push(E(`${L} debe ser mayor o igual a ${f.minV}.`, f.k));
    }
  });
  return r;
}

/* ---------- Panel de módulo ---------- */
function makeCtx(mod) {
  const key = 'mod' + mod.id;
  STATE.data[key] = STATE.data[key] || {};
  const panel = document.getElementById('panel');
  const ctx = {
    mod, S: STATE, d: STATE.data[key], fields: [],
    $: s => panel.querySelector(s), $$: s => [...panel.querySelectorAll(s)],
    changed() {
      if (ctx.d.is_valid) { ctx.d._edited = true; setStatus(ctx); }
      saveState(); scheduleLive(ctx); updateReqPill(ctx);
    },
    rerender() { renderBody(ctx, true); }
  };
  return ctx;
}
let liveTimer = null;
function scheduleLive(ctx) {
  if (!ctx.mod.live) return;
  clearTimeout(liveTimer);
  const run = () => { try { ctx.mod.live(ctx); } catch (e) { console.error(e); } };
  ctx.mod.liveDebounce ? (liveTimer = setTimeout(run, ctx.mod.liveDebounce)) : requestAnimationFrame(run);
}
function statusHTML(ctx) {
  const d = ctx.d;
  if (!applies(ctx.mod.id)) return '<span class="status-badge">No aplica</span>';
  if (d.is_valid && d._edited) return '<span class="status-badge" style="background:var(--amber-soft);color:#7A5306">Cambios sin validar</span>';
  if (d.is_valid) return '<span class="status-badge ok">Validado</span>';
  return '<span class="status-badge">En progreso</span>';
}
function setStatus(ctx) { const el = document.getElementById('statusSlot'); if (el) el.innerHTML = statusHTML(ctx); }

function renderModule(id) {
  const mod = MOD[id]; const ctx = makeCtx(mod); CURRENT = ctx;
  STATE.current_module = id;
  const ph = PHASES[mod.phase - 1];
  const prev = prevOf(id), next = nextAfter(id);
  const panel = document.getElementById('panel');
  panel.style.setProperty('--pc', ph.color);
  panel.innerHTML = `
    <div class="panel-top">
      <div class="crumbs"><span class="pill">Fase ${ph.n}</span>${esc(ph.name)}${mod.conditional ? ` <span class="badge o">${esc(mod.conditional)}</span>` : ''}</div>
      <div id="statusSlot">${statusHTML(ctx)}</div>
      <h2>Módulo ${mod.num}: ${esc(mod.title)}</h2>
      <p class="purpose"><b>Propósito:</b> ${esc(mod.purpose)}</p>
      ${phaseStepsHTML(mod)}
      ${mod.quote ? `<div class="quote">${ICON.quote}<div>“${esc(mod.quote)}”${mod.ux ? `<div style="margin-top:6px;font-style:normal;font-weight:600;font-size:13.5px">${esc(mod.ux)}</div>` : ''}</div></div>` : ''}
    </div>
    <div class="panel-body" id="panelBody"></div>
    <div class="alerts-zone" id="alerts" style="padding:0 32px"></div>
    <div class="panel-foot">
      <div class="left">${prev ? `<a class="btn btn-ghost" href="#modulo/${prev}">${ICON.back} Anterior</a>` : ''}<span class="autosave" id="autosave"><i></i> Guardado automáticamente</span><span id="reqSlot"></span></div>
      <div class="right" id="footRight"></div>
    </div>`;
  renderBody(ctx, false);
  renderFoot(ctx, next);
  updateReqPill(ctx);
  document.getElementById('mobileMod').textContent = `Módulo ${mod.num} · ${mod.title}`;
}
function renderFoot(ctx, next) {
  const id = ctx.mod.id; const el = document.getElementById('footRight'); if (!el) return;
  const nx = next && isUnlocked(next) ? `<a class="btn btn-ghost" href="#modulo/${next}">Siguiente ${ICON.arrow}</a>` : '';
  if (!applies(id)) el.innerHTML = next ? `<a class="btn btn-primary" href="#modulo/${next}">Continuar ${ICON.arrow}</a>` : '';
  else el.innerHTML = `${nx}<button class="btn btn-primary" data-act="validate">${id === '29' ? 'Finalizar protocolo' : 'Validar y guardar'} ${ICON.check.replace('<svg', '<svg width="16" height="16"')}</button>`;
}
function renderBody(ctx, quiet) {
  const mod = ctx.mod; const body = document.getElementById('panelBody');
  if (!applies(mod.id)) {
    const enf = enfoqueOf(STATE);
    body.innerHTML = `<div class="na-box"><div class="na-ico">${ICON.skip}</div><h3>Este módulo se omite en tu ruta</h3><p>Seleccionaste un enfoque <b>${esc(enf)}</b> en el Módulo 10. El Módulo ${mod.num} (${esc(mod.title)}) aplica solo a enfoques ${esc(mod.conditional.toLowerCase())}.</p><a class="btn btn-ghost" href="#modulo/10">Revisar enfoque</a></div>`;
    return;
  }
  if (mod.init) mod.init(ctx.d, ctx);
  const gate = mod.gate && mod.gate(ctx);
  if (gate) { body.innerHTML = gate; ctx.fields = []; return; }
  ctx.fields = typeof mod.fields === 'function' ? mod.fields(ctx) : (mod.fields || []);
  let n = 0; flatFields(ctx.fields).forEach(f => { f._id = f.k ? fid(f.k) : 'fx_' + (n++); });
  body.classList.toggle('no-anim', !!quiet);
  body.innerHTML = ctx.fields.map(f => renderField(f, ctx)).join('');
  if (!quiet) [...body.children].forEach((c, i) => c.style.setProperty('--i', Math.min(i, 12)));
  ctx.fresh = null;
  if (mod.live) { try { mod.live(ctx); } catch (e) { console.error(e); } }
  if (mod.onRender) mod.onRender(ctx);
}
function refreshField(ctx, f) {
  const el = document.getElementById(f._id); if (!el) return;
  if (f.type === 'select' && filled(getPath(ctx.d, f.k)) && !optList(f, ctx).some(o => String(o.v) === String(getPath(ctx.d, f.k)))) setPath(ctx.d, f.k, '');
  const tmp = document.createElement('div'); tmp.innerHTML = renderField(f, ctx);
  const nw = tmp.firstElementChild; nw.classList.add('no-anim'); el.replaceWith(nw);
}

/* ---------- Eventos del panel ---------- */
function onFieldEvent(e) {
  const t = e.target; const path = t.dataset && t.dataset.path; const ctx = CURRENT;
  if (!path || !ctx) return;
  const isChoice = t.tagName === 'SELECT' || t.type === 'checkbox' || t.type === 'radio';
  if (e.type === 'input' && isChoice) return;
  if (e.type === 'change' && !isChoice) return;
  let val;
  if (t.type === 'checkbox') val = t.dataset.multi ? [...document.querySelectorAll(`#panel [data-path="${path}"]:checked`)].map(x => x.value) : t.checked;
  else if (t.type === 'radio') { if (!t.checked) return; val = t.value; }
  else val = t.value;
  setPath(ctx.d, path, val);

  const fw = t.closest('.field');
  if (fw) {
    fw.classList.remove('err');
    if (fw.dataset.min && fw.dataset.fk === path) {
      const min = +fw.dataset.min, len = String(val).length;
      const c = fw.querySelector('.counter'); if (c) { c.textContent = `${len}/${min}`; c.classList.toggle('ok', len >= min); }
      const b = fw.querySelector('.cbar'); if (b) { b.classList.toggle('ok', len >= min); b.firstElementChild.style.width = Math.min(100, len / min * 100) + '%'; }
    }
  }
  const flat = flatFields(ctx.fields);
  const item = t.closest('.rep-item[data-rep]');
  if (item) { const f = flat.find(x => x.k === item.dataset.rep); const i = +item.dataset.i; if (f && f.title) item.querySelector('[data-title]').innerHTML = f.title(getPath(ctx.d, f.k)[i], i, ctx); }
  const row = t.closest('.list-row[data-list]');
  if (row) { const f = flat.find(x => x.k === row.dataset.list); if (f && f.badge) row.querySelector('.badge-slot').innerHTML = f.badge(val, ctx); }
  if (isChoice) flat.filter(f => f.refresh && f.k !== path).forEach(f => refreshField(ctx, f));
  flat.filter(f => f.show).forEach(f => { const el = document.getElementById(f._id); if (el) { const show = f.show(ctx.d, ctx); if (el.classList.contains('hidden') === show) { el.classList.toggle('hidden', !show); if (show) { el.classList.remove('no-anim'); el.style.animation = 'rise .45s var(--ease) both'; } } } });
  ctx.changed();
}
const BUILTIN = {
  listAdd(ctx, b) { const k = b.dataset.k; const a = getPath(ctx.d, k) || []; a.push(''); setPath(ctx.d, k, a); ctx.fresh = `${k}.${a.length - 1}`; const f = flatFields(ctx.fields).find(x => x.k === k); refreshField(ctx, f); ctx.fresh = null; const ins = document.querySelectorAll(`#${f._id} .list-row input`); ins[ins.length - 1]?.focus(); ctx.changed(); },
  repAdd(ctx, b) { const k = b.dataset.k; const a = getPath(ctx.d, k) || []; a.push({}); setPath(ctx.d, k, a); ctx.fresh = `${k}.${a.length - 1}`; const f = flatFields(ctx.fields).find(x => x.k === k); refreshField(ctx, f); ctx.fresh = null; const items = document.querySelectorAll(`#${f._id} .rep-item`); const last = items[items.length - 1]; last?.querySelector('input,textarea,select')?.focus(); last?.scrollIntoView({ behavior: 'smooth', block: 'center' }); ctx.changed(); },
  listDel(ctx, b) { removeAnim(b.closest('.list-row'), () => { const k = b.dataset.k; getPath(ctx.d, k).splice(+b.dataset.i, 1); refreshField(ctx, flatFields(ctx.fields).find(x => x.k === k)); ctx.changed(); }); },
  repDel(ctx, b) { removeAnim(b.closest('.rep-item'), () => { const k = b.dataset.k; getPath(ctx.d, k).splice(+b.dataset.i, 1); refreshField(ctx, flatFields(ctx.fields).find(x => x.k === k)); ctx.changed(); }); },
  pathAdd(ctx, b) { const p = b.dataset.path; const a = getPath(ctx.d, p) || []; a.push(JSON.parse(b.dataset.tpl || '{}')); setPath(ctx.d, p, a); ctx.rerender(); const n = document.querySelector(`[data-node="${p}.${a.length - 1}"]`); if (n) { n.classList.add('fresh'); n.querySelector('input')?.focus(); } ctx.changed(); },
  pathDel(ctx, b) { const p = b.dataset.path; removeAnim(b.closest('.rep-item, .list-row'), () => { getPath(ctx.d, p).splice(+b.dataset.i, 1); ctx.rerender(); ctx.changed(); }); },
  validate(ctx, b) { runValidation(ctx, b); },
  showReqs(ctx, b) { runValidation(ctx, b, true); }
};
function removeAnim(el, done) { if (!el) return done(); el.classList.add('removing'); setTimeout(done, 280); }
function onPanelClick(e) {
  const b = e.target.closest('[data-act]'); if (!b || !CURRENT) return;
  const a = b.dataset.act; const ctx = CURRENT;
  if (BUILTIN[a]) { e.preventDefault(); BUILTIN[a](ctx, b); }
  else if (ctx.mod.actions && ctx.mod.actions[a]) { if (b.tagName !== 'INPUT') e.preventDefault(); ctx.mod.actions[a].call(ctx.mod, ctx, b); }
}

/* ---------- Orientación dentro del módulo ---------- */
function phaseStepsHTML(mod) {
  const mods = MODULES.filter(m => m.phase === mod.phase);
  const ap = mods.filter(m => applies(m.id)); const pos = ap.findIndex(m => m.id === mod.id) + 1;
  const nx = nextAfter(mod.id);
  return `<div class="phase-steps">${mods.map(m => `<a href="#modulo/${m.id}" title="Módulo ${m.num}: ${esc(m.title)}" class="${m.id === mod.id ? 'cur' : !applies(m.id) ? 'na' : isValid(STATE, m.id) ? 'done' : ''}"></a>`).join('')}<span>${pos ? `Paso ${pos} de ${ap.length} en esta fase` : 'Fuera de tu ruta'}${nx && mod.id !== '29' ? ` · Después: ${esc(MOD[nx].title)}` : ''}</span></div>`;
}
function collectChecks(ctx) {
  const mod = ctx.mod; const gated = mod.gate && mod.gate(ctx);
  let res = gated ? (mod.validate ? mod.validate(ctx.d, ctx) : []) : genericValidate(ctx);
  if (!gated && !res.some(x => x.t === 'e') && mod.validate) res = res.concat(mod.validate(ctx.d, ctx));
  return res;
}
let reqTimer = null;
function updateReqPill(ctx) {
  clearTimeout(reqTimer);
  reqTimer = setTimeout(() => {
    const slot = document.getElementById('reqSlot'); if (!slot || CURRENT !== ctx || !applies(ctx.mod.id)) { if (slot) slot.innerHTML = ''; return; }
    let n = 0; try { n = collectChecks(ctx).filter(x => x.t === 'e').length; } catch (e) { return; }
    slot.innerHTML = `<button class="req-pill ${n ? '' : 'ok'}" data-act="showReqs" title="Ver qué falta"><i></i>${n ? `Faltan ${n} requisito${n > 1 ? 's' : ''}` : 'Listo para validar'}</button>`;
  }, 350);
}

/* ---------- Validar y guardar ---------- */
function runValidation(ctx, btn, previewOnly) {
  const mod = ctx.mod; const zone = document.getElementById('alerts');
  document.querySelectorAll('#panel .field.err').forEach(x => x.classList.remove('err'));
  const res = collectChecks(ctx);
  const errs = res.filter(x => x.t === 'e'), warns = res.filter(x => x.t === 'w');
  const list = a => a.length === 1 ? a[0].m : `<ul>${a.map(x => `<li>${x.m}</li>`).join('')}</ul>`;
  if (previewOnly && !errs.length) { zone.innerHTML = alertBox('success', 'Todo listo: presiona <b>Validar y guardar</b> para avanzar.') + (warns.length ? alertBox('warning', list(warns)) : ''); zone.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); return; }
  if (errs.length) {
    zone.innerHTML = alertBox('error', `<b>Revisa ${errs.length === 1 ? 'lo siguiente' : `estos ${errs.length} puntos`} antes de avanzar:</b>${errs.length === 1 ? '<br>' : ''}${list(errs)}`) + (warns.length ? alertBox('warning', list(warns)) : '');
    errs.forEach(x => { if (x.k) { const el = document.getElementById(fid(x.k)); if (el) el.classList.add('err'); } });
    zone.classList.remove('shake'); void zone.offsetWidth; zone.classList.add('shake');
    const firstErr = document.querySelector('#panel .field.err') || zone;
    firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast('Aún hay validaciones pendientes', 'warn');
    return;
  }
  if (mod.beforeSave) mod.beforeSave(ctx.d, ctx);
  ctx.d.is_valid = true; ctx.d._edited = false; ctx.d.validated_at = new Date().toISOString();
  saveState(true);
  const next = nextAfter(mod.id);
  zone.innerHTML = alertBox('success', `✓ Módulo ${mod.num} guardado correctamente.${next && mod.id !== '29' ? ` Avanzando al Módulo ${MOD[next].num}…` : ''}`) + (warns.length ? alertBox('warning', list(warns)) : '');
  setStatus(ctx); renderSidebar(); updateProgress(); renderFoot(ctx, next); updateReqPill(ctx);
  burst(btn); toast(mod.id === '29' ? '¡Protocolo completo! Mucho éxito en tu defensa.' : `Módulo ${mod.num} validado`);
  zone.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  if (next && mod.id !== '29') setTimeout(() => { if (CURRENT === ctx) location.hash = '#modulo/' + next; }, 1400);
}

/* ---------- Sidebar y progreso ---------- */
function renderSidebar() {
  const sb = document.getElementById('sidebar');
  const cur = STATE.current_module;
  if (cur) openPhases.add(MOD[cur].phase);
  sb.innerHTML = `<div class="sidebar-head"><h3>Módulos</h3><span class="badge g">${progress().done}/${progress().total}</span></div>` +
    PHASES.map(ph => {
      const mods = MODULES.filter(m => m.phase === ph.n);
      const ap = mods.filter(m => applies(m.id)); const dn = ap.filter(m => isValid(STATE, m.id)).length;
      return `<div class="phase ${openPhases.has(ph.n) ? 'open' : ''}" style="--pc:${ph.color}">
        <button class="phase-toggle" data-phase="${ph.n}" aria-expanded="${openPhases.has(ph.n)}"><span class="pdot">${ph.n}</span><span class="ptxt"><b>${esc(ph.name)}</b><small>${dn} de ${ap.length} completados</small></span>${ICON.chev}</button>
        <div class="phase-body"><div><ul>${mods.map(m => {
          const ok = applies(m.id), v = isValid(STATE, m.id), un = isUnlocked(m.id);
          const cls = [!ok ? 'na' : '', ok && v ? 'done' : '', ok && !un ? 'locked' : '', m.id === cur ? 'active' : ''].join(' ');
          const st = !ok ? ICON.skip : v ? ICON.check : !un ? ICON.lock : '';
          return `<li><button class="mod-link ${cls}" data-mod="${m.id}" ${m.id === cur ? 'aria-current="page"' : ''}><span class="n">${m.num}</span><span class="t">${esc(m.title)}</span>${m.conditional && ok && !v ? `<span class="tag">${{ 'Crítico': 'Crítico', 'Transversal': 'Transv.' }[m.conditional] || 'Cond.'}</span>` : ''}<span class="st">${st}</span></button></li>`;
        }).join('')}</ul></div></div></div>`;
    }).join('') +
    `<div class="sidebar-tools">
      <button class="btn btn-sm btn-ghost" data-tool="coh">${ICON.ok} Validaciones cruzadas</button>
      <button class="btn btn-sm btn-ghost" data-tool="json">${ICON.dl} Exportar datos (JSON)</button>
      <button class="btn btn-sm btn-ghost" data-tool="import">${ICON.plus} Importar datos (JSON)</button>
      <button class="btn btn-sm btn-ghost" data-tool="reset" style="color:var(--red)">${ICON.x} Reiniciar protocolo</button>
    </div>`;
}
function onSidebarClick(e) {
  const pt = e.target.closest('[data-phase]');
  if (pt) { const n = +pt.dataset.phase; const ph = pt.parentElement; ph.classList.toggle('open'); openPhases[ph.classList.contains('open') ? 'add' : 'delete'](n); pt.setAttribute('aria-expanded', ph.classList.contains('open')); return; }
  const ml = e.target.closest('[data-mod]');
  if (ml) {
    const id = ml.dataset.mod;
    if (applies(id) && !isUnlocked(id)) { const need = prereqs(id).find(x => !isValid(STATE, x)); toast(`Completa primero el Módulo ${MOD[need].num}: ${MOD[need].title}`, 'warn'); ml.classList.add('shake'); setTimeout(() => ml.classList.remove('shake'), 500); return; }
    closeSidebar(); location.hash = '#modulo/' + id; return;
  }
  const tl = e.target.closest('[data-tool]');
  if (tl) {
    const t = tl.dataset.tool;
    if (t === 'coh') location.hash = '#coherencia';
    if (t === 'json') exportJSON();
    if (t === 'import') document.getElementById('importFile').click();
    if (t === 'reset') confirmModal('¿Reiniciar el protocolo?', 'Se borrarán todos los datos guardados en este navegador. Te recomendamos exportar un respaldo en JSON antes de continuar.', 'Sí, reiniciar').then(ok => { if (!ok) return; localStorage.removeItem(STORAGE_KEY); localStorage.removeItem('yumm_mod1'); STATE = freshState(); openPhases.clear(); toast('Protocolo reiniciado'); location.hash = '#modulo/1'; route(); });
  }
}
function updateProgress() {
  const p = progress();
  const ring = document.querySelector('#progressRing .fg'); ring.style.strokeDashoffset = 119.38 * (1 - p.pct / 100);
  document.getElementById('progressText').textContent = p.pct + '%';
  document.getElementById('progressLabel').textContent = `${p.done} de ${p.total} módulos`;
}

/* ---------- Inicio ---------- */
function phaseState(n) {
  const ap = MODULES.filter(m => m.phase === n && applies(m.id));
  const dn = ap.filter(m => isValid(STATE, m.id)).length;
  const p = progress();
  const curPhase = p.pct < 100 ? MOD[firstPending()].phase : 0;
  return { total: ap.length, done: dn, st: dn === ap.length ? 'done' : (n === curPhase && p.done ? 'current' : (n === curPhase ? 'next' : 'pending')) };
}
function crPath(P) { // Catmull-Rom → Bézier
  let d = `M${P[0].x},${P[0].y}`;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
    d += ` C${p1.x + (p2.x - p0.x) / 6},${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6},${p2.y - (p3.y - p1.y) / 6} ${p2.x},${p2.y}`;
  }
  return d;
}
function renderHeroPath() {
  const S = [{ x: 92, y: 408, rx: 64, ry: 30 }, { x: 214, y: 340, rx: 55, ry: 26 }, { x: 300, y: 270, rx: 47, ry: 23 }, { x: 362, y: 202, rx: 40, ry: 20 }, { x: 408, y: 142, rx: 33, ry: 17 }, { x: 444, y: 90, rx: 27, ry: 14 }];
  const bulb = { x: 482, y: 34 };
  const d = crPath([...S, { x: bulb.x - 4, y: bulb.y + 30 }]);
  const p = progress();
  const glow = 0.35 + 0.65 * p.pct / 100;
  let s = `<svg viewBox="0 0 560 470" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Camino de 6 fases hacia la defensa de tesis">
    <defs>
      <radialGradient id="bg-glow"><stop offset="0" stop-color="#FFC27A" stop-opacity=".95"/><stop offset=".45" stop-color="#F39A3D" stop-opacity=".35"/><stop offset="1" stop-color="#F39A3D" stop-opacity="0"/></radialGradient>
      <linearGradient id="hl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    </defs>
    <path class="path-line" d="${d}"/>
    <path class="path-done" id="pathDone" d="${d}"/>`;
  S.forEach((o, i) => {
    const ph = PHASES[i]; const st = phaseState(ph.n);
    const fill = st.st === 'done' ? ph.color : (st.st === 'current' || st.st === 'next') ? '#F39A3D' : '#DCE1E8';
    const numFill = st.st === 'pending' ? '#8790A5' : '#fff';
    const left = i >= 3; const lx = left ? o.x - o.rx - 14 : o.x + o.rx + 14; const anchor = left ? 'end' : 'start';
    const status = st.st === 'done' ? '✓ Completada' : `${st.done}/${st.total} módulos`;
    s += `<g class="stone ${st.st === 'current' || st.st === 'next' ? 'current' : ''}" data-goto-phase="${ph.n}" tabindex="0" role="button" aria-label="Fase ${ph.n}: ${esc(ph.name)}, ${status}" style="animation-delay:${200 + i * 140}ms">
      <ellipse cx="${o.x}" cy="${o.y + o.ry * .55}" rx="${o.rx * .92}" ry="${o.ry * .5}" fill="rgba(26,38,64,.12)"/>
      ${st.st === 'current' || st.st === 'next' ? `<ellipse class="ring" cx="${o.x}" cy="${o.y}" rx="${o.rx}" ry="${o.ry}" fill="none" stroke="#F39A3D" stroke-width="3"/>` : ''}
      <ellipse class="body" cx="${o.x}" cy="${o.y}" rx="${o.rx}" ry="${o.ry}" fill="${fill}" ${st.st === 'pending' ? 'stroke="#C5CDD8" stroke-width="1.5"' : ''}/>
      <ellipse cx="${o.x - o.rx * .15}" cy="${o.y - o.ry * .35}" rx="${o.rx * .6}" ry="${o.ry * .38}" fill="url(#hl)" pointer-events="none"/>
      <text class="num" x="${o.x}" y="${o.y + 5}" text-anchor="middle" fill="${numFill}" style="fill:${numFill}">${st.st === 'done' ? '✓' : ph.n}</text>
      <text x="${lx}" y="${o.y - 8}" text-anchor="${anchor}"><tspan class="lbl-k" fill="${ph.color}" style="fill:${ph.color}">FASE ${ph.n}</tspan></text>
      <text class="lbl-t" x="${lx}" y="${o.y + 9}" text-anchor="${anchor}">${esc(ph.name)}</text>
      <text class="lbl-s" x="${lx}" y="${o.y + 24}" text-anchor="${anchor}">${status}</text>
    </g>`;
  });
  s += `<g class="stone" data-goto-phase="6" style="animation-delay:1100ms" aria-hidden="true">
      <circle class="bulb-glow" cx="${bulb.x}" cy="${bulb.y}" r="58" fill="url(#bg-glow)" style="opacity:${glow}"/>
      <path d="M${bulb.x} ${bulb.y - 24} a22 22 0 0 1 13 39.8 v6.2 h-26 v-6.2 A22 22 0 0 1 ${bulb.x} ${bulb.y - 24}z" fill="#1A2640"/>
      <path d="M${bulb.x - 6} ${bulb.y + 12} v-10 q6 -8 12 0 v10" fill="none" stroke="#FFC27A" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="${bulb.x - 11}" y="${bulb.y + 25}" width="22" height="4" rx="2" fill="#1A2640"/><rect x="${bulb.x - 8}" y="${bulb.y + 31}" width="16" height="4" rx="2" fill="#1A2640"/>
      <text class="lbl-s" x="${bulb.x - 34}" y="${bulb.y - 6}" text-anchor="end">Tu defensa</text>
    </g></svg>`;
  const host = document.getElementById('heroPath'); host.innerHTML = s;
  const pd = host.querySelector('#pathDone'); const L = pd.getTotalLength();
  pd.style.transition = 'none'; pd.style.strokeDasharray = L; pd.style.strokeDashoffset = L; void pd.getBoundingClientRect(); pd.style.transition = '';
  requestAnimationFrame(() => requestAnimationFrame(() => { pd.style.strokeDashoffset = L * (1 - p.pct / 100); }));
}
function renderResume() {
  const p = progress(); const card = document.getElementById('resumeCard'); const hs = document.getElementById('heroStart');
  if (!p.done) { card.classList.add('hidden'); hs.href = '#modulo/1'; hs.firstChild.textContent = 'Comenzar mi protocolo '; return; }
  const fp = MOD[firstPending()];
  card.classList.remove('hidden');
  document.getElementById('rcPct').textContent = p.pct + '%';
  requestAnimationFrame(() => requestAnimationFrame(() => { document.getElementById('rcBar').style.width = p.pct + '%'; }));
  document.getElementById('rcText').innerHTML = p.pct === 100 ? '¡Completaste todos los módulos! Repasa tu simulacro de defensa.' : `${p.done} de ${p.total} módulos validados · Sigue en el <b>Módulo ${fp.num}: ${esc(fp.title)}</b>`;
  hs.href = '#modulo/' + fp.id; hs.firstChild.textContent = 'Continuar mi protocolo ';
}

/* demo de validación */
let demoTyped = false, demoTimer = null;
function demoUpdate() {
  const v = document.getElementById('demoInput').value; const w = firstWord(v); const b = bloomOf(w);
  const dv = document.getElementById('dcVerb'), db = document.getElementById('dcBloom');
  dv.className = 'dc' + (!w ? '' : isInf(w) ? ' ok' : ' bad'); dv.querySelector('b').textContent = w ? (isInf(w) ? w : 'no es infinitivo') : '';
  db.className = 'dc' + (!w || !isInf(w) ? '' : b >= 0 ? ' ok' : ' bad'); db.querySelector('b').textContent = b >= 0 ? `${BLOOM[b].n} (${b + 1}/6)` : (w && isInf(w) ? 'no catalogado' : '');
  document.querySelectorAll('#demoBloom [data-b]').forEach(el => el.classList.toggle('on', +el.dataset.b === b));
}
function demoAutoType() {
  if (demoTyped) return; demoTyped = true;
  const inp = document.getElementById('demoInput'); const txt = 'Analizar la relación entre los hábitos de estudio y el rendimiento académico'; let i = 0;
  inp.value = '';
  clearInterval(demoTimer);
  demoTimer = setInterval(() => { if (document.activeElement === inp) return clearInterval(demoTimer); inp.value = txt.slice(0, ++i); demoUpdate(); if (i >= txt.length) clearInterval(demoTimer); }, 45);
}

/* ruta adaptable */
let routeSel = null;
const routeOff = (r, id) => (r === 'cualitativo' && ['9', '18', '18_5'].includes(id)) || (r === 'cuantitativo' && id === '19');
function renderRoute(r, animate) {
  const prev = routeSel; routeSel = r;
  const here = progress().pct < 100 ? firstPending() : null;
  const n = MODULES.filter(m => !routeOff(r, m.id)).length;
  const omit = MODULES.filter(m => routeOff(r, m.id)).map(m => `${m.title} (${m.num})`);
  document.getElementById('routeNote').innerHTML = `Ruta <b>${r}</b>: <b>${n} módulos</b>${omit.length ? ` · se omite${omit.length > 1 ? 'n' : ''} ${esc(omit.join(', '))}` : ' · incluye hipótesis, variables y categorías'}.`;
  const grid = document.getElementById('routeGrid');
  if (!grid.children.length || !animate) {
    grid.innerHTML = PHASES.map((ph, i) => `<div class="rcard reveal" style="--pc:${ph.color};--d:${i}"><header><span class="pdot">${ph.n}</span><b>${esc(ph.name)}</b></header><ul>${MODULES.filter(m => m.phase === ph.n).map(m => `<li data-rid="${m.id}" class="${routeOff(r, m.id) ? 'off' : ''} ${m.id === here ? 'here' : ''}"><a href="#modulo/${m.id}"><span class="n">${m.num}</span><span class="t">${esc(m.title)}</span><span class="st">${isValid(STATE, m.id) ? ICON.check : ''}</span></a></li>`).join('')}</ul></div>`).join('');
    observeReveal();
  } else {
    grid.querySelectorAll('[data-rid]').forEach(li => { const off = routeOff(r, li.dataset.rid); if (li.classList.contains('off') !== off) { li.classList.toggle('off', off); li.classList.remove('flip'); void li.offsetWidth; li.classList.add('flip'); } });
  }
  const tg = document.getElementById('routeToggle'); const btn = tg.querySelector(`[data-route="${r}"]`);
  tg.querySelectorAll('button').forEach(b => { b.classList.toggle('on', b === btn); b.setAttribute('aria-selected', b === btn); });
  const pill = tg.querySelector('.rt-pill'); pill.style.width = btn.offsetWidth + 'px'; pill.style.transform = `translateX(${btn.offsetLeft - 5}px)`;
  return prev;
}

let homeObs;
function renderLanding() {
  renderHeroPath(); renderResume();
  if (!document.querySelector('#demoBloom [data-b]')) document.getElementById('demoBloom').innerHTML = BLOOM.map((b, i) => `<div data-b="${i}" style="--bc:${b.c}">${b.n}<small>Nivel ${i + 1}</small></div>`).join('');
  renderRoute(enfoqueOf(STATE) || 'mixto', false);
  observeReveal();
  if (!homeObs) homeObs = new IntersectionObserver(es => es.forEach(x => {
    if (!x.isIntersecting) return;
    if (x.target.id === 'demoInput') demoAutoType();
    if (x.target.id === 'obNum') { document.getElementById('obArc').style.strokeDashoffset = 314.16 * (1 - 0.874); countUp(x.target, 0.874, 1600, 3); }
    homeObs.unobserve(x.target);
  }), { threshold: 0.6 });
  ['demoInput', 'obNum'].forEach(id => homeObs.observe(document.getElementById(id)));
}
function animateLanding() { /* las animaciones del inicio se disparan al renderizar y al hacer scroll */ }
function goPhase(n) {
  const target = MODULES.filter(m => m.phase === n && applies(m.id)).find(m => isUnlocked(m.id) && !isValid(STATE, m.id)) || MODULES.find(m => m.phase === n && applies(m.id) && isUnlocked(m.id));
  if (!target) { toast(`Completa las fases anteriores para desbloquear la Fase ${n}`, 'warn'); location.hash = '#modulo/' + firstPending(); return; }
  location.hash = '#modulo/' + target.id;
}
function onHomeClick(e) {
  const st = e.target.closest('[data-goto-phase]'); if (st) return goPhase(+st.dataset.gotoPhase);
  const rb = e.target.closest('[data-route]'); if (rb) return renderRoute(rb.dataset.route, true);
  const sc = e.target.closest('[data-scroll]'); if (sc) { e.preventDefault(); document.getElementById(sc.dataset.scroll).scrollIntoView({ behavior: 'smooth', block: 'start' }); }
}
let revealObs;
function observeReveal() {
  if (!revealObs) revealObs = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); revealObs.unobserve(x.target); } }), { threshold: 0.12 });
  document.querySelectorAll('.reveal:not(.in)').forEach(el => revealObs.observe(el));
}

/* ---------- Validaciones cruzadas ---------- */
function coherencia() {
  const S = STATE, g = id => getD(S, id), enf = enfoqueOf(S);
  const out = [];
  const lab = (arr, v) => (arr.find(x => x.v === v) || {}).l || v;
  // 1
  { const p = g('11').paradigma; let st = 'pending', det = 'Completa los Módulos 10 y 11.';
    if (enf && p) { const ok = PARADIGMA_OK[enf].includes(p); st = ok ? 'ok' : 'warn'; det = ok ? 'El paradigma es coherente con la naturaleza de los datos.' : (filled(g('11').justificacion_extra) ? 'Combinación poco habitual, con justificación adicional registrada.' : 'Combinación poco habitual: requiere justificación adicional.'); }
    out.push({ t: 'Coherencia Enfoque–Paradigma', st, det, pair: [cap(enf || '—'), lab(PARADIGMAS, p) || '—'], go: '11' }); }
  // 2
  { const n = g('13').nivel, a = g('12').alcance; let st = 'pending', det = 'Completa los Módulos 12 y 13.';
    if (n && a) { const ok = (NIVELES.find(x => x.v === n) || {}).a === a; st = ok ? 'ok' : 'err'; det = ok ? 'El nivel de investigación corresponde con el alcance declarado.' : 'El nivel no corresponde con el alcance: ajusta uno de los dos.'; }
    out.push({ t: 'Coherencia Nivel–Alcance', st, det, pair: [`Alcance: ${lab(ALCANCES, a) || '—'}`, `Nivel: ${lab(NIVELES, n) || '—'}`], go: '13' }); }
  // 3
  { let st = 'pending', det = 'Completa el Módulo 18.', pair = [];
    if (enf === 'cualitativo') { st = 'na'; det = 'No aplica para enfoque cualitativo.'; }
    else { const v = (g('18').variables || []).filter(x => x.escala && x.naturaleza);
      if (v.length) { const bad = v.filter(x => (x.naturaleza === 'cualitativa' && ['intervalo', 'razon'].includes(x.escala)) || (x.naturaleza === 'cuantitativa' && x.escala === 'nominal'));
        st = bad.length ? 'err' : 'ok'; det = bad.length ? `Escala incoherente en: ${bad.map(x => x.nombre).join(', ')}.` : 'Todas las escalas son coherentes con la naturaleza de cada variable.'; pair = v.map(x => `${x.nombre}: ${x.escala}`); } }
    out.push({ t: 'Coherencia Variable–Escala', st, det, pair, go: '18' }); }
  // 4
  { let st = 'pending', det = 'Completa los Módulos 3 y 9.'; const no = especificos(S).length, nh = (g('9').hipotesis_especificas || []).filter(filled).length;
    if (enf === 'cualitativo') { st = 'na'; det = 'No aplica: el enfoque cualitativo omite hipótesis.'; }
    else if (no && nh) { st = no === nh ? 'ok' : 'warn'; det = no === nh ? 'Cada objetivo específico tiene su hipótesis.' : 'El número de hipótesis específicas no coincide con el de objetivos específicos.'; }
    out.push({ t: 'Coherencia Objetivo–Hipótesis', st, det, pair: [`${no} objetivos`, `${nh} hipótesis`], go: '9' }); }
  // 5
  { const ds = g('12').diseno_metodologico, dobj = g('14').diseno_objetivo, mets = g('15').metodo || []; let st = 'pending', det = 'Completa los Módulos 12, 14 y 15.';
    if (ds && dobj && mets.length) {
      const hard = ['experimental', 'cuasiexperimental'].includes(ds) || ['explicativo', 'predictivo'].includes(dobj);
      if (hard && !mets.some(m => ['deductivo', 'analitico', 'axiomatico'].includes(m))) { st = 'warn'; det = 'Un diseño explicativo/experimental suele apoyarse en el método deductivo o analítico.'; }
      else if (dobj === 'exploratorio' && !mets.some(m => ['inductivo', 'analitico', 'historico'].includes(m))) { st = 'warn'; det = 'Un diseño exploratorio suele apoyarse en el método inductivo.'; }
      else { st = 'ok'; det = 'El método elegido es consistente con el diseño.'; } }
    out.push({ t: 'Coherencia Diseño–Método', st, det, pair: [lab(DISENOS, ds) || '—', (DISENO_OBJ[dobj] || {}).l || '—', ...mets.map(m => lab(METODOS, m))], go: '15' }); }
  // 6
  { let st = 'pending', det = 'Completa los Módulos 18 y 18.5.';
    if (enf === 'cualitativo') { st = 'na'; det = 'No aplica para enfoque cualitativo.'; }
    else if ((g('18').variables || []).length && g('18_5').ops) { const e = operacionalizacionErrores(S); st = e.length ? 'err' : 'ok'; det = e.length ? `${e.length} observación(es): ${e[0]}` : 'Coherencia vertical Variable → Dimensión → Indicador → Ítem completa.'; }
    out.push({ t: 'Coherencia de la Operacionalización', st, det, pair: [`${matrizRows(S).length} filas en la matriz`], go: '18_5' }); }
  return out;
}
function renderCoherencia() {
  const M = { ok: ['g', 'Coherente', '#39BEA3'], warn: ['o', 'Advertencia', '#F39A3D'], err: ['r', 'Incoherencia', '#D64545'], pending: ['', 'Pendiente', '#DCE1E8'], na: ['b', 'No aplica', '#2B5BA8'] };
  document.getElementById('cohGrid').innerHTML = coherencia().map((c, i) => `<div class="coh-card reveal" style="--cc:${M[c.st][2]};--d:${i}"><div class="ch"><h3>${esc(c.t)}</h3><span class="badge ${M[c.st][0]}">${M[c.st][1]}</span></div>
    <div class="pair">${c.pair.map(p => `<span class="chip">${esc(p)}</span>`).join('')}</div><p>${esc(c.det)}</p>
    <a class="btn btn-sm btn-ghost" style="margin-top:12px" href="#modulo/${c.go}">Ir al Módulo ${MOD[c.go].num} ${ICON.arrow}</a></div>`).join('');
  observeReveal();
}

/* ---------- Documento unificado ---------- */
function compileDoc(S, d28, opt = {}) {
  const g = id => getD(S, id); const P = d28 || g('28'); const svg = opt.svg !== false;
  const sec = (t, body, lvl = 2) => (body && body.replace(/<[^>]+>/g, '').trim() ? `<h${lvl}>${t}</h${lvl}>${body}` : '');
  const p = (l, v) => (filled(v) ? `<p><b>${l}:</b> ${esc(Array.isArray(v) ? v.join(', ') : v)}</p>` : '');
  const ul = a => ((a || []).filter(filled).length ? `<ul>${a.filter(filled).map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '');
  const tbl = (h, rows) => (rows.length ? `<table><thead><tr>${h.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : '');
  const lab = (arr, v) => (arr.find(x => x.v === v) || {}).l || v || '';
  const m1 = g('1'), m2 = g('2'), m3 = g('3'), m4 = g('4'), enf = enfoqueOf(S);
  const titulo = m1.titulo_sugerido || MOD['1'].titulo(m1) || 'Protocolo de investigación';
  const fecha = new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  let h = `<div class="cover"><p style="font-weight:bold;letter-spacing:1px">UNIVERSIDAD TECNOLÓGICA DE CANCÚN</p>${filled(P.carrera) ? `<p>${esc(P.carrera)}</p>` : ''}<br><p>PROTOCOLO DE INVESTIGACIÓN</p><h1>${esc(titulo)}</h1><br>${filled(P.estudiante) ? `<p><b>Presenta:</b> ${esc(P.estudiante)}</p>` : ''}${filled(P.asesor) ? `<p><b>Asesor(a):</b> ${esc(P.asesor)}</p>` : ''}<p>Cancún, Quintana Roo · ${fecha}</p><p style="font-size:11px;color:#666">Generado con YUMM IA · Asistente de Investigación Metodológica</p></div>`;
  h += sec('Resumen', (filled(P.resumen) ? `<p>${esc(P.resumen)}</p>` : '') + p('Palabras clave', P.palabras_clave));
  h += `<h2>Índice</h2><ol><li>Introducción</li><li>Capítulo I. Planteamiento del problema</li><li>Capítulo II. Marco referencial</li><li>Capítulo III. Diseño metodológico</li><li>Capítulo IV. Resultados</li><li>Capítulo V. Discusión</li><li>Conclusiones</li><li>Referencias</li><li>Anexos</li></ol>`;
  h += sec('Introducción', filled(m1.problema_observado) ? `<p>La presente investigación, del campo de ${esc(m1.campo_disciplinar || '—')}, aborda ${esc(m1.variable || 'el fenómeno de estudio')} en ${esc(m1.poblacion || '—')} de ${esc(m1.lugar || '—')}, durante ${esc(m1.periodo || '—')}. ${esc(m1.problema_observado)}</p>${filled(m2.pregunta_principal) ? `<p>La pregunta que guía el estudio es: <i>${esc(m2.pregunta_principal)}</i></p>` : ''}${filled(m3.objetivo_general) ? `<p>El objetivo general es ${esc(m3.objetivo_general.charAt(0).toLowerCase() + m3.objetivo_general.slice(1))}${enf ? `, desde un enfoque ${esc(enf)}` : ''}.</p>` : ''}` : '');
  // Capítulo I
  let c1 = '';
  c1 += sec('1.1 Delimitación del tema', p('Campo disciplinar', m1.campo_disciplinar) + p('Variable / fenómeno', m1.variable) + p('Problema observado', m1.problema_observado) + p('Población', m1.poblacion) + p('Lugar', m1.lugar) + p('Periodo', m1.periodo), 3);
  c1 += sec('1.2 Planteamiento del problema', p('Contexto', m2.descripcion_contexto) + p('Pregunta principal', m2.pregunta_principal) + ((m2.causas || []).filter(filled).length ? `<p><b>Causas:</b></p>${ul(m2.causas)}` : '') + ((m2.efectos || []).filter(filled).length ? `<p><b>Efectos:</b></p>${ul(m2.efectos)}` : ''), 3);
  c1 += sec('1.3 Objetivos', p('Objetivo general', m3.objetivo_general) + (especificos(S).length ? `<p><b>Objetivos específicos:</b></p><ol>${especificos(S).map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : '') + p('Nivel de Bloom', m3.nivel_bloom_sugerido), 3);
  c1 += sec('1.4 Justificación', p('Teórica', (m4.tipo_justificacion || []).includes('teorica') && m4.argumento_teorico) + p('Práctica', (m4.tipo_justificacion || []).includes('practica') && m4.argumento_practico) + p('Metodológica', (m4.tipo_justificacion || []).includes('metodologica') && m4.argumento_metodologico), 3);
  h += sec('Capítulo I. Planteamiento del problema', c1);
  // Capítulo II
  const m5 = g('5'), m6 = g('6'), m7 = g('7'), m8 = g('8'), m9 = g('9');
  let c2 = '';
  c2 += sec('2.1 Estado del arte', p('Términos de búsqueda', (m5.terminos_busqueda || []).filter(filled)) + tbl(['Autor', 'Año', 'Hallazgo', 'Relación'], (m5.fuentes_seleccionadas || []).filter(f => filled(f.autor)).map(f => [f.autor, f.anio, f.hallazgo, f.relacion])), 3);
  c2 += sec('2.2 Antecedentes', tbl(['Ámbito', 'Autor (año)', 'País', 'Método', 'Resultado', 'Vacío'], (m6.antecedentes || []).filter(a => filled(a.autor)).map(a => [clasificaAntecedente(a, S), `${a.autor} (${a.anio || ''})`, a.pais, a.metodo, a.resultado, a.vacio_detectado])), 3);
  c2 += sec('2.3 Marco teórico', (m7.teorias_principales || []).filter(t => filled(t.nombre)).map(t => `<p><b>${esc(t.nombre)}</b> (${esc(t.autor)}). ${esc(t.postulado)}</p>`).join('') + ((m7.teorias_complementarias || []).filter(filled).length ? `<p><b>Teorías complementarias:</b></p>${ul(m7.teorias_complementarias)}` : '') + p('Articulación teórica', m7.articulacion_teorica), 3);
  c2 += sec('2.4 Marco conceptual', tbl(['Término', 'Definición conceptual', 'Definición operativa', 'Autor'], (m8.terminos || []).filter(t => filled(t.termino)).map(t => [t.termino, t.definicion_conceptual, t.definicion_operativa, t.autor || ''])), 3);
  if (enf !== 'cualitativo') c2 += sec('2.5 Hipótesis', p('Hipótesis general (Hi)', m9.hipotesis_general) + ((m9.hipotesis_especificas || []).filter(filled).length ? `<p><b>Hipótesis específicas:</b></p>${ul(m9.hipotesis_especificas)}` : '') + p('Hipótesis nula (H₀)', m9.hipotesis_nula), 3);
  h += sec('Capítulo II. Marco referencial', c2);
  // Capítulo III
  const m10 = g('10'), m11 = g('11'), m12 = g('12'), m13 = g('13'), m14 = g('14'), m15 = g('15'), m16 = g('16'), m17 = g('17'), m18 = g('18'), m19 = g('19'), m20 = g('20'), m21 = g('21'), m22 = g('22'), m23 = g('23');
  let c3 = '';
  c3 += sec('3.1 Enfoque', p('Enfoque', cap(m10.enfoque || '')) + p('Justificación', m10.justificacion_enfoque), 3);
  c3 += sec('3.2 Paradigma', p('Paradigma', lab(PARADIGMAS, m11.paradigma)) + p('Justificación adicional', m11.justificacion_extra), 3);
  c3 += sec('3.3 Tipo de investigación', p('Finalidad', m12.finalidad) + p('Alcance', lab(ALCANCES, m12.alcance)) + p('Temporalidad', m12.temporalidad) + p('Diseño', lab(DISENOS, m12.diseno_metodologico)), 3);
  c3 += sec('3.4 Nivel de investigación', p('Nivel', lab(NIVELES, m13.nivel)), 3);
  c3 += sec('3.5 Diseño según objetivos', m14.diseno_objetivo ? p('Diseño', DISENO_OBJ[m14.diseno_objetivo].l) + p('Estrategias', DISENO_OBJ[m14.diseno_objetivo].est) + p('Técnicas', DISENO_OBJ[m14.diseno_objetivo].tec) + p('Análisis', DISENO_OBJ[m14.diseno_objetivo].an) : '', 3);
  c3 += sec('3.6 Método', p('Método(s)', (m15.metodo || []).map(v => lab(METODOS, v))), 3);
  c3 += sec('3.7 Modalidad', p('Modalidad', lab(MODALIDADES, m16.modalidad)), 3);
  c3 += sec('3.8 Población y muestra', p('Población total (N)', m17.poblacion_total) + p('Unidad de análisis', m17.unidad_analisis) + p('Tipo de muestreo', (m17.tipo_muestreo || '').replace('_', ' ')) + p('Subtipo', m17.subtipo_muestreo) + p('Tamaño de muestra (n)', m17.tamano_muestra), 3);
  if (enf !== 'cualitativo') {
    c3 += sec('3.9 Variables', tbl(['Variable', 'Naturaleza', 'Función', 'Escala'], (m18.variables || []).filter(v => filled(v.nombre)).map(v => [v.nombre, v.naturaleza, v.causal, v.escala])), 3);
    const mr = matrizRows(S); c3 += sec('3.10 Operacionalización de variables', mr.length ? tbl(['Variable', 'Dimensión', 'Indicador', 'Ítem', 'Escala'], mr.map(r => [r.v, r.d, r.i, r.it, r.e])) : '', 3);
  }
  if (enf !== 'cuantitativo') c3 += sec('3.11 Categorías de análisis', tbl(['Categoría', 'Dimensión', 'Subcategoría', 'Indicador cualitativo'], (m19.categorias || []).filter(c => filled(c.nombre)).map(c => [c.nombre, c.dimension, c.subcategoria, c.indicador])), 3);
  c3 += sec('3.12 Indicadores', tbl(['Indicador', 'Persistencia', 'Causalidad', 'Exposición'], (m20.indicadores || []).map(i => [i.nombre, i.persistencia || '', i.causalidad || '', i.exposicion || ''])), 3);
  c3 += sec('3.13 Técnicas e instrumentos', p('Técnica', m21.tecnica) + p('Instrumento', m21.instrumento) + p('Validación', (m21.validacion || []).map(v => ({ expertos: `Juicio de expertos${m21.num_expertos ? ` (${m21.num_expertos})` : ''}`, piloto: 'Prueba piloto', constructo: 'Validez de constructo' }[v]))) + (m21.omega ? `<p><b>Confiabilidad:</b> Omega de McDonald ω = ${m21.omega.valor.toFixed(3)} (${m21.omega.n_items} ítems). ${esc(m21.omega.interpretacion)} ${esc(m21.omega.recomendacion)}</p>` : ''), 3);
  c3 += sec('3.14 Procedimiento de recolección', m22.pasos ? tbl(['Paso', 'Fecha', 'Estado', 'Observaciones / evidencia'], m22.pasos.map((x, i) => [`${i + 1}. ${PASOS[i]}`, x.fecha || '', x.hecho ? 'Completado' : 'Pendiente', [x.obs, x.evidencia].filter(filled).join(' · ')])) : '', 3);
  c3 += sec('3.15 Plan de análisis', p('Tipo de análisis', m23.tipo_analisis) + p('Análisis complementario', m23.tipo_complementario) + p('Software', m23.software_utilizado), 3);
  h += sec('Capítulo III. Diseño metodológico', c3);
  // IV, V
  const oe = especificos(S), m24 = g('24'), m25 = g('25'), m26 = g('26'), m27 = g('27');
  h += sec('Capítulo IV. Resultados', oe.map((o, i) => { const hs = (m24.hallazgos || []).filter(x => +x.objetivo === i && filled(x.descripcion)); return hs.length ? `<h3>OE${i + 1}: ${esc(o)}</h3>${hs.map(x => `<p>${esc(x.descripcion)}${filled(x.referencia) ? ` <i>(${esc(x.referencia)})</i>` : ''}</p>`).join('')}` : ''; }).join(''));
  h += sec('Capítulo V. Discusión', oe.map((o, i) => filled((m25.discusion_por_objetivo || [])[i]) ? `<h3>OE${i + 1}</h3><p>${esc(m25.discusion_por_objetivo[i])}</p>` : '').join('') + p('Confrontación teórica', m25.confrontacion_teorica) + p('Confrontación con antecedentes', m25.confrontacion_antecedentes));
  h += sec('Conclusiones', p('Respuesta a la pregunta de investigación', m26.respuesta_pregunta_principal) + oe.map((o, i) => p(`Conclusión OE${i + 1}`, (m26.conclusiones_por_objetivo || [])[i])).join('') + p('Verificación de hipótesis', m26.verificacion_hipotesis) + p('Limitaciones', m26.limitaciones) + p('Recomendaciones', m26.recomendaciones));
  const refs = MOD['27'].sorted(m27);
  h += sec('Referencias', refs.map(r => `<p class="ref">${apaFormat(r)}</p>`).join(''));
  h += sec('Anexos', (svg && (m2.causas || m2.efectos) ? `<h3>Anexo A. Árbol de problemas</h3>${arbolSVG(S, m2)}` : '') + (g('29').preguntas ? `<h3>Anexo B. Simulacro de preguntas de defensa</h3>${defensaHTML(g('29').preguntas, true).replace(/<h2>/g, '<h4>').replace(/<\/h2>/g, '</h4>')}` : ''));
  return h;
}

/* ---------- Exportación ---------- */
function downloadFile(name, content, mime) {
  const blob = new Blob([content], { type: mime }); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function wordWrap(title, body) {
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><title>${esc(title)}</title><style>body{font-family:'Times New Roman',serif;font-size:12pt;line-height:1.5}h1{font-size:16pt;text-align:center}h2{font-size:14pt;margin-top:18pt}h3{font-size:12pt}table{border-collapse:collapse;width:100%;font-size:10pt}th,td{border:1px solid #888;padding:4px;text-align:left;vertical-align:top}th{background:#E9EDF4}.cover{text-align:center;page-break-after:always}.cover p{text-align:center}.ref{margin-left:.5in;text-indent:-.5in}</style></head><body>${body}</body></html>`;
}
function exportWord() { downloadFile('protocolo_yumm_ia.doc', '﻿' + wordWrap('Protocolo YUMM IA', compileDoc(STATE, null, { svg: false })), 'application/msword'); toast('Protocolo exportado a Word'); }
function exportJSON() { downloadFile('yumm_ia_datos.json', JSON.stringify(STATE, null, 2), 'application/json'); toast('Datos exportados (JSON)'); }
function exportPDF(html) {
  const area = document.createElement('div'); area.id = 'printArea'; area.innerHTML = `<div class="doc-page">${html}</div>`;
  document.body.appendChild(area); document.body.classList.add('printing');
  const done = () => { area.remove(); document.body.classList.remove('printing'); window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  setTimeout(() => { window.print(); setTimeout(done, 500); }, 60);
}
document.getElementById('importFile').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const s = JSON.parse(r.result); if (!s || typeof s.data !== 'object') throw new Error('Formato no válido');
      confirmModal('¿Importar estos datos?', 'Reemplazarán el protocolo guardado actualmente en este navegador.', 'Importar').then(ok => { if (!ok) return; STATE = Object.assign(freshState(), s); saveState(true); toast('Datos importados'); location.hash = '#modulo/' + firstPending(); route(); });
    } catch (err) { toast('El archivo no es un respaldo válido de YUMM IA', 'warn'); }
    e.target.value = '';
  };
  r.readAsText(f);
});

/* ---------- Micro-interacciones ---------- */
function toast(msg, type = 'ok') {
  const t = document.createElement('div'); t.className = `toast ${type}`;
  t.innerHTML = `${type === 'ok' ? ICON.ok : ICON.warn}<span>${esc(msg)}</span>`;
  document.getElementById('toasts').appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, 3200);
}
function burst(el) {
  if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = el.getBoundingClientRect(); const b = document.createElement('div'); b.className = 'burst';
  b.style.left = r.left + r.width / 2 + 'px'; b.style.top = r.top + r.height / 2 + 'px';
  const colors = ['#39BEA3', '#A2E3C5', '#F39A3D', '#1A2640', '#00806C'];
  for (let i = 0; i < 22; i++) { const p = document.createElement('i'); const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 90; p.style.cssText = `background:${colors[i % 5]};--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d - 30}px;--r:${Math.random() * 540}deg;animation-delay:${Math.random() * 80}ms`; b.appendChild(p); }
  document.body.appendChild(b); setTimeout(() => b.remove(), 1100);
}
function countUp(el, to, dur = 1000, dec = 0) {
  if (!el) return; const t0 = performance.now();
  const step = t => { const k = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - k, 3); el.textContent = (to * e).toFixed(dec); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function confirmModal(title, text, ok) {
  return new Promise(res => {
    const m = document.createElement('div'); m.className = 'modal-bg';
    m.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><h3>${esc(title)}</h3><p>${esc(text)}</p><div class="acts"><button class="btn btn-ghost" data-r="0">Cancelar</button><button class="btn btn-primary" data-r="1">${esc(ok)}</button></div></div>`;
    document.body.appendChild(m);
    m.addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (b || e.target === m) { m.remove(); res(!!(b && b.dataset.r === '1')); } });
    m.querySelector('[data-r="1"]').focus();
  });
}
document.addEventListener('pointerdown', e => {
  const b = e.target.closest('.btn'); if (!b || b.disabled) return;
  const r = b.getBoundingClientRect(); const s = document.createElement('span'); const d = Math.max(r.width, r.height);
  s.className = 'ripple'; s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
  b.appendChild(s); setTimeout(() => s.remove(), 650);
});
function openSidebar() { document.getElementById('sidebar').classList.add('open'); document.getElementById('scrim').classList.add('show'); }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('scrim').classList.remove('show'); }

/* ---------- Router ---------- */
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + name));
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === name));
}
function route() {
  const h = location.hash.replace(/^#\/?/, '') || 'inicio';
  const [view, arg] = h.split('/');
  updateProgress();
  if (view === 'modulo') {
    let id = arg && MOD[arg] ? arg : firstPending();
    if (applies(id) && !isUnlocked(id)) { const need = prereqs(id).find(x => !isValid(STATE, x)); toast(`El Módulo ${MOD[id].num} está bloqueado. Completa primero el Módulo ${MOD[need].num}.`, 'warn'); id = firstPending(); history.replaceState(null, '', '#modulo/' + id); }
    const was = document.getElementById('view-modulo').classList.contains('active');
    showView('modulo'); renderModule(id); renderSidebar();
    const top = document.getElementById('panel').getBoundingClientRect().top + scrollY - 140;
    if (was) { const pn = document.getElementById('panel'); pn.style.animation = 'none'; void pn.offsetWidth; pn.style.animation = 'viewIn .5s var(--ease) both'; }
    if (scrollY > top) window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    saveState();
    return;
  }
  CURRENT = null;
  if (view === 'coherencia') { showView('coherencia'); renderCoherencia(); }
  else if (view === 'acerca') { showView('acerca'); observeReveal(); }
  else { showView('inicio'); renderLanding(); animateLanding(); }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- Inicio ---------- */
(function init() {
  const panel = document.getElementById('panel');
  panel.addEventListener('input', onFieldEvent);
  panel.addEventListener('change', onFieldEvent);
  panel.addEventListener('click', onPanelClick);
  document.getElementById('sidebar').addEventListener('click', onSidebarClick);
  document.getElementById('view-inicio').addEventListener('click', onHomeClick);
  document.getElementById('view-inicio').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('[data-goto-phase]')) { e.preventDefault(); goPhase(+e.target.closest('[data-goto-phase]').dataset.gotoPhase); } });
  document.getElementById('demoInput').addEventListener('input', () => { clearInterval(demoTimer); demoUpdate(); });
  document.getElementById('demoInput').addEventListener('focus', () => clearInterval(demoTimer));
  addEventListener('resize', () => { if (routeSel && document.getElementById('view-inicio').classList.contains('active')) renderRoute(routeSel, true); });
  document.getElementById('openSidebar').addEventListener('click', openSidebar);
  document.getElementById('scrim').addEventListener('click', closeSidebar);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSidebar(); });
  const hdr = document.getElementById('siteHeader');
  addEventListener('scroll', () => hdr.classList.toggle('scrolled', scrollY > 8), { passive: true });
  addEventListener('hashchange', route);
  route();
})();
