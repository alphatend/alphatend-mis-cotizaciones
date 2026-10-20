// La demo de «Mis cotizaciones» sobre el tablero real de alphatend. Pinta filas con el mismo marcado de
// components/LicitacionRow.astro y, en «Mis cotizaciones», el cuadro de ofertas con el de la ficha de un proceso
// (src/lib/pliego-vista.mjs: «Quién ofertó y a qué precio», «A quién se adjudicó»).

// ── Compras de ejemplo, con empresas inventadas ────────────────────────────────────────────────────────────
const HOY = new Date();
const enDias = (d, h = 10, m = 0) => { const x = new Date(HOY); x.setDate(x.getDate() + d); x.setHours(h, m, 0, 0); return x.toISOString(); };
const EJEMPLOS = [
  {
    id: 'ej-cotizacion', acto: 'EJEMPLO-CL-000101', tipo: 'Compra menor · cotización', titulo: 'Útiles de oficina y papel bond para el segundo semestre',
    ent: 'MINSA', entidad: 'Ministerio de Salud (ejemplo)', rubro: 'Papel de imprenta', prov: 'Coclé', estimado: 2950, cierre: enDias(0, 15), pub: enDias(-1, 9),
    habitual: 'Compra habitual: cada ~4 meses', items: 6, suelen: '4 oferentes', propuesta: 2750,
    rivales: [['Distribuidora Atlántico, S.A.', 2610.4], ['Comercial Las Cumbres', 2798], ['Papelería del Valle', 2905.1], ['Suministros Omega', 3120]],
  },
  {
    id: 'ej-licitacion', acto: 'EJEMPLO-LP-000045', tipo: 'Licitación pública', titulo: 'Mantenimiento preventivo y correctivo de aires acondicionados',
    ent: 'CSS', entidad: 'Caja de Seguro Social (ejemplo)', rubro: 'Aires acondicionados', prov: 'Panamá', estimado: 48500, cierre: enDias(8, 10), pub: enDias(-6, 14),
    habitual: 'Compra habitual: cada ~1 año', items: 1, suelen: '3 oferentes', propuesta: 43900, resolucion: 'Resolución N.º 045 (ejemplo)',
    rivales: [['Frío Total, S.A.', 41980], ['Climas del Pacífico', 44350], ['Refrigeración Chiriquí', 47200, 'descalificada']],
  },
  {
    id: 'ej-menor', acto: 'EJEMPLO-CM-000310', tipo: 'Compra menor hasta 10,000', titulo: '40 galones de pintura de tráfico amarilla',
    ent: 'MOP', entidad: 'Ministerio de Obras Públicas (ejemplo)', rubro: 'Pinturas', prov: 'Veraguas', estimado: 3400, cierre: enDias(1, 12), pub: enDias(0, 8),
    habitual: 'Compra habitual: cada ~6 meses', items: 1, suelen: '2 oferentes', propuesta: 3150, sinCuadro: true,
  },
];

// ── Estado: lo que se marca, recordado en este navegador si se puede ───────────────────────────────────────
const CLAVE = 'demo-mis-cotizaciones-v2';
let estado = { mias: [], fuera: [], interesa: [], vista: 'todas' };
try { const s = JSON.parse(localStorage.getItem(CLAVE) || 'null'); if (s && Array.isArray(s.mias)) estado = { ...estado, ...s }; } catch { /* sin almacenamiento */ }
const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch { /* sin almacenamiento */ } };

// ── Utilidades ────────────────────────────────────────────────────────────────────────────────────────────
const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const dinero = (n) => (n == null ? '—' : 'B/. ' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const hora = (d) => { const h = d.getHours(); return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'p. m.' : 'a. m.'}`; };
const fechaLarga = (iso) => { if (!iso) return '—'; const d = new Date(iso); return `${d.getDate()} ${MES[d.getMonth()]} ${d.getFullYear()} · ${hora(d)}`; };
const fechaCorta = (iso) => { if (!iso) return ''; const d = new Date(iso); return d.toDateString() === new Date().toDateString() ? `hoy, ${hora(d)}` : `el ${d.getDate()} ${MES[d.getMonth()]}, ${hora(d)}`; };
const falta = (iso) => { const ms = new Date(iso) - Date.now(); if (ms <= 0) return 'cerró'; const m = Math.round(ms / 6e4); if (m < 60) return `${m}m`; const h = Math.round(m / 60); return h < 48 ? `${h}h` : `${Math.round(h / 24)}d`; };
const ordinal = (n) => `${n}.ª`;
const numero = (s) => { const n = Number(String(s || '').replace(/B\/\.\s*/i, '').replace(/[^\d.]/g, '')); return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null; };
const pct = (a, ref) => { if (!ref) return ''; const d = ((a - ref) / ref) * 100; return `${d > 0 ? '+' : ''}${d.toLocaleString('es-PA', { maximumFractionDigits: 1 })} %`; };
const toast = (t) => { const x = $('#demo-toast'); x.textContent = t; x.classList.add('ver'); clearTimeout(toast.t); toast.t = setTimeout(() => x.classList.remove('ver'), 3800); };
const datoDl = (pares) => { const dl = el('dl', 'lic-row__datos'); for (const [k, v] of pares) { if (v == null || v === '') continue; const d = el('div', 'lic-row__dato'); d.append(el('dt', '', k), el('dd', 'tabular', v)); dl.append(d); } return dl; };
const textoBoton = (cls, txt, fn) => { const b = el('button', cls, txt); b.type = 'button'; b.addEventListener('click', (ev) => { ev.preventDefault(); fn(ev); }); return b; };
const datosDe = (m) => (m.real ? m : { ...EJEMPLOS.find((x) => x.id === m.id), ...m });

// ── Una fila, con el marcado del tablero ──────────────────────────────────────────────────────────────────
function fila(e, { mia = null } = {}) {
  const d = el('details', 'lic-row');
  d.dataset.acto = e.acto;
  const sum = el('summary', 'lic-row__head');
  const l1 = el('div', 'lic-row__l1');
  const h3 = el('h3', 'lic-row__obj'); const a = el('a', 'lic-row__ir', e.titulo); a.href = '#'; a.addEventListener('click', (ev) => ev.preventDefault()); h3.append(a);
  l1.append(h3, Object.assign(el('span', 'leader'), { ariaHidden: 'true' }), el('span', `tabular lic-row__monto${e.estimado ? '' : ' lic-row__monto--na'}`, e.estimado ? dinero(e.estimado) : 'sin precio de referencia'));
  const l2 = el('div', 'lic-row__l2 tabular');
  l2.append(el('span', 'lic-row__ent', e.ent || e.entidad || ''));
  for (const v of [e.rubro, e.prov]) if (v) l2.append(Object.assign(el('span', 'lic-row__sep', '·'), { ariaHidden: 'true' }), el('span', v === e.rubro ? 'lic-row__rubro' : 'lic-row__prov', v));
  const t = el('span', 'lic-row__t');
  if (mia) t.append(estadoCorto(mia));
  else { const cd = el('span', 'lic-row__cd', falta(e.cierre)); if (new Date(e.cierre) - Date.now() < 864e5) cd.classList.add('is-urgent'); t.append(cd); }
  l2.append(t, Object.assign(el('span', 'lic-row__caret'), { ariaHidden: 'true' }));
  const marcas = el('div', 'lic-row__marcas');
  marcas.append(el('span', 'lic-row__habitual', mia?.real ? 'Leída en vivo de PanamaCompra' : e.habitual || ''));
  marcas.append(el('span', 'demo-chip', mia?.real ? 'En vivo' : 'Ejemplo'));
  sum.append(l1, l2, marcas);

  const det = el('div', 'lic-row__det');
  det.append(datoDl([
    ['Cierre', fechaLarga(e.cierre)], ['Acto', e.acto], ['Tipo', e.tipo], ['Entidad', e.entidad],
    ...(mia ? [['Tu oferta', mia.monto != null ? dinero(mia.monto) : 'no la escribiste']] : [['Publicado', fechaLarga(e.pub)], ['Ítems', e.items ? String(e.items) : null], ['Suelen presentarse', e.suelen]]),
  ]));
  if (mia) det.append(resultado(mia));
  const acc = el('div', 'lic-row__acciones');
  const ver = el('a', 'lic-row__ver', 'Ver análisis completo'); ver.href = '#'; ver.addEventListener('click', (ev) => { ev.preventDefault(); toast('En la demo no hay análisis completo: es la ficha de siempre de cada oportunidad.'); });
  acc.append(ver);
  if (!mia) {
    const ext = el('a', 'lic-row__ext', 'Ofertar en PanamaCompra ↗'); ext.href = '#'; ext.addEventListener('click', (ev) => { ev.preventDefault(); toast('En el tablero real, esto abre la compra en PanamaCompra.'); });
    acc.append(ext);
    const on = estado.interesa.includes(e.id);
    const int = textoBoton('lic-row__interesa', on ? '★ Me interesa' : '☆ Me interesa', () => { estado.interesa = on ? estado.interesa.filter((x) => x !== e.id) : [...estado.interesa, e.id]; guardar(); pintar(); });
    int.setAttribute('aria-pressed', String(on));
    acc.append(int, textoBoton('lic-row__completar', '✓ Ya coticé', () => yaCotice(e)), textoBoton('lic-row__descartar', estado.fuera.includes(e.id) ? 'Volver a mostrar' : 'No me interesa', () => { estado.fuera = estado.fuera.includes(e.id) ? estado.fuera.filter((x) => x !== e.id) : [...estado.fuera, e.id]; guardar(); pintar(); if (estado.fuera.includes(e.id)) toast('Listo: no te la volvemos a enseñar. Está en «Ver descartadas».'); }));
  } else {
    if (!mia.real && mia.fase === 'espera' && !e.sinCuadro) acc.append(textoBoton('demo-simular', '⏩ Simular: ya cerró', () => avanzar(mia, 'cerro')));
    if (!mia.real && mia.fase === 'cerro' && e.resolucion) acc.append(textoBoton('demo-simular', '⏩ Simular: salió la resolución', () => avanzar(mia, 'adjudicada')));
    if (mia.fase !== 'espera' && !e.sinCuadro) acc.append(textoBoton('lic-row__interesa', '✉ Ver el correo que te llega', (ev) => { const ya = d.querySelector('.demo-correo'); if (ya) ya.remove(); else det.insertBefore(correo(mia), acc); }));
    acc.append(textoBoton('lic-row__descartar', 'Quitar de mis cotizaciones', () => { estado.mias = estado.mias.filter((x) => x !== mia); guardar(); pintar(); }));
  }
  det.append(acc);
  d.append(sum, det);
  if (mia?.abrir) { d.open = true; delete mia.abrir; guardar(); }
  return d;
}

// ── El resultado de una cotización marcada ────────────────────────────────────────────────────────────────
// Ofertas: { empresa, monto, recomendada, descalificada, tuya, hipotetica }
function ofertasDe(m) {
  if (m.real) return (m.ofertas || []).map((o) => ({ ...o }));
  const e = EJEMPLOS.find((x) => x.id === m.id);
  if (!e?.rivales) return [];
  const todas = [...e.rivales.map(([empresa, monto, marca]) => ({ empresa, monto, descalificada: marca === 'descalificada' })), { empresa: 'Tu empresa', monto: m.monto ?? e.propuesta, tuya: true }];
  todas.sort((a, b) => a.monto - b.monto);
  const rec = todas.find((o) => !o.descalificada); if (rec) rec.recomendada = true; // en el ejemplo, la comisión recomienda la más barata que cumple
  return todas;
}
function cuenta(m) {
  const ofertas = ofertasDe(m);
  let lista = ofertas, i = ofertas.findIndex((o) => o.tuya), hipotetica = false;
  if (i < 0 && m.nombre) { const n = m.nombre.toLowerCase().trim(); i = ofertas.findIndex((o) => (o.empresa || '').toLowerCase().includes(n)); }
  if (i < 0 && m.monto != null) i = ofertas.findIndex((o) => Math.abs(o.monto - m.monto) < 0.01);
  if (i < 0 && m.monto != null && ofertas.length) { // su oferta no aparece: su monto, como referencia, «no está en el cuadro»
    lista = [...ofertas, { empresa: 'Tu monto', monto: m.monto, hipotetica: true }].sort((a, b) => a.monto - b.monto);
    i = lista.findIndex((o) => o.hipotetica); hipotetica = true;
  }
  if (i >= 0) lista[i].tuya = true;
  return { ofertas, lista, i, hipotetica, tuya: i >= 0 ? lista[i] : null, rec: ofertas.find((o) => o.recomendada) };
}
function estadoCorto(m) {
  const e = datosDe(m);
  if (e.sinCuadro) return el('span', 'demo-estado demo-estado--menor', 'sin cuadro');
  if (m.fase === 'espera') return el('span', 'demo-estado demo-estado--espera', `cierra ${fechaCorta(e.cierre)}`);
  const c = cuenta(m);
  if (m.fase === 'adjudicada') return el('span', 'demo-estado demo-estado--adj', c.rec?.tuya ? 'adjudicada a ti' : 'adjudicada');
  if (c.tuya?.recomendada) return el('span', 'demo-estado demo-estado--rec', 'la tuya, recomendada');
  return el('span', 'demo-estado demo-estado--cerro', c.tuya ? `${c.hipotetica ? 'quedabas ' : 'quedaste '}${ordinal(c.i + 1)} de ${c.lista.length}` : `${c.ofertas.length} ofertas`);
}
const bloque = (titulo, ...hijos) => { const s = el('div', 'pliego-vivo__bloque'); s.append(el('h3', 'pliego-vivo__h3', titulo), ...hijos); return s; };
function resultado(m) {
  const e = datosDe(m);
  const r = el('div', 'demo-resultado');
  if (e.sinCuadro) {
    r.append(bloque('Quién ofertó y a qué precio', el('p', 'pliego-vivo__nota', 'PanamaCompra no publica el cuadro de ofertas de las compras menores. Si el ganador llega en los datos que PanamaCompra publica cada día, te lo decimos aquí y por correo.')));
    return r;
  }
  if (m.fase === 'espera') {
    r.append(bloque('Quién ofertó y a qué precio', el('p', 'pliego-vivo__nota', `Las ofertas son cerradas hasta la apertura (${fechaLarga(e.cierre)}). Apenas PanamaCompra las abra, verás aquí quién ofertó y a cuánto, y te llega un correo.`)));
    return r;
  }
  const c = cuenta(m);
  const res = el('p', 'demo-resumen');
  if (c.tuya?.recomendada) res.append(el('b', '', 'La tuya es la recomendada. '), m.fase === 'adjudicada' ? 'Y la resolución te la adjudicó.' : 'Falta la orden de compra o la resolución para que sea definitiva.');
  else if (c.hipotetica && c.rec) res.append('No encontramos tu oferta en el cuadro. Con tu monto, ', el('b', '', dinero(c.tuya.monto)), ', habrías quedado ', el('b', '', `${ordinal(c.i + 1)} de ${c.lista.length}`), `. La recomendada fue ${c.rec.empresa}, con ${dinero(c.rec.monto)}.`);
  else if (c.tuya && c.rec) res.append('Quedaste ', el('b', '', `${ordinal(c.i + 1)} de ${c.lista.length}`), '. La recomendada fue ', el('b', '', c.rec.empresa), `, con ${dinero(c.rec.monto)}: ${dinero(c.tuya.monto - c.rec.monto)} menos que la tuya.`);
  else if (c.rec) res.append(`La recomendada fue ${c.rec.empresa}, con ${dinero(c.rec.monto)}. Escribe tu monto o el nombre con que ofertaste para saber en qué lugar quedaste.`);
  r.append(res);
  if (m.fase === 'adjudicada' && c.rec) {
    const ul = el('ul', 'pliego-vivo__ganadores'); const li = el('li');
    li.append(el('span', 'pliego-vivo__ganador', c.rec.tuya ? 'Tu empresa' : c.rec.empresa), el('span', 'pliego-vivo__num', dinero(c.rec.monto))); ul.append(li);
    r.append(bloque('A quién se adjudicó', ul, el('p', 'pliego-vivo__nota', `${e.resolucion || 'Según la resolución de adjudicación'}. Montos según la resolución.`)));
  }
  const ref = e.estimado;
  const tabla = el('table', 'pliego-vivo__tabla');
  const thead = el('thead'); const trh = el('tr');
  for (const h of ['Empresa', 'Propuesta', ref ? 'Frente a la referencia' : null, 'Estado'].filter(Boolean)) trh.append(el('th', '', h));
  thead.append(trh);
  const tbody = el('tbody');
  for (const o of c.lista) {
    const tr = el('tr', o.tuya ? 'demo-tuya' : '');
    tr.append(el('td', '', o.empresa), el('td', 'pliego-vivo__num', dinero(o.monto)));
    if (ref) tr.append(el('td', 'pliego-vivo__num', pct(o.monto, ref)));
    const est = el('td');
    const etq = o.hipotetica ? ['tuya', 'Tu monto (no está en el cuadro)'] : m.fase === 'adjudicada' && o.recomendada ? ['rec', 'Adjudicada'] : o.recomendada ? ['rec', 'Recomendada'] : o.descalificada ? ['desc', 'Descalificada'] : o.tuya ? ['tuya', 'La tuya'] : null;
    if (etq) est.append(el('span', `demo-etq demo-etq--${etq[0]}`, etq[1]));
    tr.append(est); tbody.append(tr);
  }
  tabla.append(thead, tbody);
  const env = el('div', 'pliego-vivo__tabla-env'); env.append(tabla);
  const cola = m.fase === 'adjudicada' ? '«Adjudicada» es lo que dice la resolución de arriba.' : '«Recomendada» es lo que propone la comisión evaluadora; la adjudicación es la resolución de la entidad.';
  r.append(bloque('Quién ofertó y a qué precio', env, el('p', 'pliego-vivo__nota', `${c.ofertas.length} propuestas, de menor a mayor precio. ${cola}${m.real ? ` Leído en vivo de PanamaCompra ${fechaCorta(m.leido)}.` : ''}`)));
  return r;
}
function correo(m) {
  const e = datosDe(m); const c = cuenta(m);
  const asunto = m.fase === 'adjudicada' ? `Se adjudicó «${e.titulo}»` : c.tuya && !c.hipotetica ? `Salió el cuadro de tu cotización: quedaste ${ordinal(c.i + 1)} de ${c.lista.length}` : `Salió el cuadro de tu cotización: ${c.ofertas.length} ofertas`;
  const box = el('div', 'demo-correo');
  const cab = el('div', 'demo-correo__cab');
  const de = el('div'); de.append(el('b', '', 'De: '), 'alphatend <alertas@alphatend.com>');
  const as = el('div'); as.append(el('b', '', 'Asunto: '), asunto);
  cab.append(de, as);
  const cu = el('div', 'demo-correo__cuerpo');
  cu.append(el('p', '', `${e.titulo} · ${e.entidad} · ${e.acto}`));
  if (m.fase === 'adjudicada' && c.rec) cu.append(el('p', '', `Se adjudicó a ${c.rec.tuya ? 'tu empresa' : c.rec.empresa} por ${dinero(c.rec.monto)}. ${e.resolucion || ''}`));
  else if (c.tuya?.recomendada) cu.append(el('p', '', `La tuya es la recomendada, con ${dinero(c.tuya.monto)}. Te avisamos cuando salga la orden de compra o la resolución.`));
  else if (c.hipotetica && c.rec) cu.append(el('p', '', `No encontramos tu oferta en el cuadro. Con tu monto, ${dinero(c.tuya.monto)}, habrías quedado ${ordinal(c.i + 1)} de ${c.lista.length}. La recomendada fue ${c.rec.empresa}, con ${dinero(c.rec.monto)}.`));
  else if (c.tuya && c.rec) cu.append(el('p', '', `Quedaste ${ordinal(c.i + 1)} de ${c.lista.length}. La recomendada fue ${c.rec.empresa}, con ${dinero(c.rec.monto)}: ${dinero(c.tuya.monto - c.rec.monto)} menos que la tuya.`));
  else if (c.rec) cu.append(el('p', '', `La recomendada fue ${c.rec.empresa}, con ${dinero(c.rec.monto)}.`));
  const ver = el('p'); const a = el('a', '', 'Ver el cuadro completo en alphatend →'); a.href = '#'; a.addEventListener('click', (ev) => ev.preventDefault()); ver.append(a); cu.append(ver);
  box.append(cab, cu);
  return box;
}
function avanzar(m, fase) { m.fase = fase; m.abrir = true; guardar(); pintar(); toast(fase === 'cerro' ? 'PanamaCompra abrió las ofertas: así queda la fila, y te llega el correo.' : 'Salió la resolución: la fila dice a quién se adjudicó.'); }

// ── «Ya coticé» ───────────────────────────────────────────────────────────────────────────────────────────
// La compra que se está marcando. Se guarda al enviar el formulario del diálogo (síncrono), no en su «close».
let pendiente = null;
function yaCotice(e) {
  pendiente = e;
  $('#demo-dlg-que').textContent = e.titulo;
  $('#demo-dlg-monto').value = e.propuesta.toLocaleString('en-US', { minimumFractionDigits: 2 });
  $('#demo-dlg').showModal(); setTimeout(() => $('#demo-dlg-monto').select(), 30);
}
$('#demo-dlg form').addEventListener('submit', (ev) => {
  const e = pendiente; pendiente = null;
  if (ev.submitter?.value !== 'guardar' || !e || estado.mias.some((x) => x.id === e.id)) return;
  estado.mias.unshift({ id: e.id, monto: numero($('#demo-dlg-monto').value), fase: 'espera', marcada: new Date().toISOString() });
  guardar(); setTimeout(pintar, 0);
  toast('Guardada en «Mis cotizaciones». Te avisamos cuando PanamaCompra abra las ofertas.');
});

// ── La lista y los tres botones de la barra ───────────────────────────────────────────────────────────────
function pintar() {
  const lista = $('#demo-lista'); lista.replaceChildren();
  const ver = estado.vista;
  const abiertas = EJEMPLOS.filter((e) => !estado.mias.some((m) => m.id === e.id));
  let filas = [], cuentaTxt = '';
  if (ver === 'mias') {
    filas = estado.mias.map((m) => fila(datosDe(m), { mia: m }));
    cuentaTxt = `${estado.mias.length} en mis cotizaciones`;
    if (!estado.mias.length) { const v = el('div', 'demo-vacio', 'Todavía no has marcado ninguna. Abre una compra y toca «✓ Ya coticé».'); filas = [v]; }
  } else if (ver === 'interesa') {
    filas = abiertas.filter((e) => estado.interesa.includes(e.id)).map((e) => fila(e));
    cuentaTxt = `${filas.length} que te interesan`;
  } else if (ver === 'descartadas') {
    filas = abiertas.filter((e) => estado.fuera.includes(e.id)).map((e) => fila(e));
    cuentaTxt = `${filas.length} descartadas`;
  } else {
    filas = abiertas.filter((e) => !estado.fuera.includes(e.id)).map((e) => fila(e));
    cuentaTxt = `${filas.length} oportunidades`;
    if (!filas.length) { const v = el('div', 'demo-vacio'); v.append('Ya no quedan compras de ejemplo en el tablero. ', textoBoton('demo-simular', 'Volver a empezar la demo', reiniciar)); filas = [v]; }
  }
  lista.append(...filas);
  const cnt = $('#f-count'); if (cnt) cnt.textContent = cuentaTxt;
  const n = $('[data-mias-n]'); if (n) n.textContent = estado.mias.length ? `(${estado.mias.length})` : '';
  const dc = $('[data-descartes-cuenta]'); if (dc) dc.textContent = estado.fuera.length ? `${estado.fuera.length} descartada${estado.fuera.length > 1 ? 's' : ''} ·` : '';
  for (const [sel, v] of [['[data-mias-ver]', 'mias'], ['[data-interesados-ver]', 'interesa'], ['[data-descartes-ver]', 'descartadas']]) { const b = $(sel); if (b) b.setAttribute('aria-pressed', String(ver === v)); }
}
const cambiar = (v) => { estado.vista = estado.vista === v ? 'todas' : v; guardar(); pintar(); };
$('[data-mias-ver]')?.addEventListener('click', () => cambiar('mias'));
$('[data-interesados-ver]')?.addEventListener('click', () => cambiar('interesa'));
$('[data-descartes-ver]')?.addEventListener('click', () => cambiar('descartadas'));
function reiniciar() { estado = { mias: estado.mias.filter((m) => m.real), fuera: [], interesa: [], vista: 'todas' }; guardar(); pintar(); }
// Los enlaces del resto de la página (barra, filtros) no salen de la demo
document.addEventListener('click', (ev) => { const a = ev.target.closest('a[href="#"]'); if (a && !a.closest('#demo-lista') && !a.closest('.demo-correo')) { ev.preventDefault(); toast('En la demo solo funciona el tablero.'); } });

// ── Pruébalo en vivo: el enlace de PanamaCompra → pliego y cuadro, de su API pública ──────────────────────
const API = 'https://apisv3.panamacompra.gob.pa';
function delEnlace(url) {
  const trozos = String(url).trim().split(/[/#?]/).filter((x) => x.length > 20).reverse();
  for (const t of trozos) for (const cand of [t, [...t].reverse().join('')]) {
    try {
      const b = cand.replace(/-/g, '+').replace(/_/g, '/');
      const j = JSON.parse(atob(b + '='.repeat((4 - (b.length % 4)) % 4)));
      if (Number.isInteger(j.i) && Number.isInteger(j.tp)) return { flujos: j.i, tipo: j.tp };
    } catch { /* el siguiente */ }
  }
  return null;
}
const limpio = (v) => (v == null ? null : String(v).replace(/\s+/g, ' ').trim() || null);
const num = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : null; };
// Del pliego solo lo que hace falta; los datos de contacto (nombres, teléfonos, correos) ni se guardan.
function camposPliego(j) {
  const m = new Map();
  const ver = (x) => { if (Array.isArray(x)) return x.forEach(ver); if (x && typeof x === 'object') { if ('nombre' in x && 'value' in x && typeof x.value !== 'object') { const k = String(x.nombre).trim().toLowerCase(); if (!m.has(k)) m.set(k, limpio(x.value)); } Object.values(x).forEach(ver); } };
  ver(j);
  const v = (...ks) => { for (const k of ks) if (m.get(k)) return m.get(k); return null; };
  return { acto: v('número de proceso'), tipo: v('tipo de proceso'), titulo: v('título', 'descripción') || 'Compra sin título', entidad: v('entidad'),
    cierreTexto: v('fecha y hora presentación de cotizaciones', 'fecha y hora presentación de propuestas'), ref: numero(v('precio de referencia', 'precio estimado')), prov: v('provincia de entrega') };
}
function cierreIso(t) { // «16-10-2026 - 08:00 AM a 12:00 PM» → la hora de la derecha
  if (!t) return null;
  const f = t.match(/(\d{2})-(\d{2})-(\d{4})/); if (!f) return null;
  const hs = [...t.matchAll(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi)]; const h = hs[hs.length - 1];
  const hh = h ? (Number(h[1]) % 12) + (/pm/i.test(h[3]) ? 12 : 0) : 23;
  return `${f[3]}-${f[2]}-${f[1]}T${String(hh).padStart(2, '0')}:${h ? h[2] : '59'}:00-05:00`;
}
function leerCuadro(r) {
  if (!r || (!Array.isArray(r.ofertasGlobal) && !Array.isArray(r.ofertasRenglon))) return null;
  const por = new Map();
  for (const g of r.ofertasGlobal || []) {
    const items = g.procesosOfertasItems || [];
    por.set(g.idProponente ?? g.id, { empresa: limpio(g.empresa?.nombreComercial), monto: num(g.precioTotal) || num(items.reduce((a, it) => a + (num(it.precioTotal) || 0), 0)),
      descalificada: g.evaluado === 1 && (g.cumple === 0 || items.some((it) => it.cumple === 0)), recomendada: g.esAdjudicado === 1 || items.some((it) => it.esAdjudicado === 1) });
  }
  for (const ren of r.ofertasRenglon || []) for (const it of ren?.procesosOfertasItems || []) {
    const k = it.idProponente ?? it.idOferta ?? it.id; if (k == null || (por.has(k) && !por.get(k).porRenglon)) continue;
    const o = por.get(k) || { empresa: limpio(it.empresa?.nombreComercial), monto: 0, descalificada: false, recomendada: false, porRenglon: true };
    o.monto += num(it.precioTotal) || 0; if (it.esAdjudicado === 1) o.recomendada = true; por.set(k, o);
  }
  return [...por.values()].map(({ porRenglon, ...o }) => ({ ...o, monto: o.monto ? Math.round(o.monto * 100) / 100 : null })).filter((o) => o.empresa).sort((a, b) => (a.monto ?? Infinity) - (b.monto ?? Infinity));
}
const traer = async (u) => { const r = await fetch(u, { credentials: 'omit' }); if (!r.ok) throw new Error(`PanamaCompra respondió ${r.status}`); return r.json(); };
async function seguirReal(enlace, monto, nombre) {
  const err = $('#demo-error'); err.hidden = true;
  const p = delEnlace(enlace);
  if (!p) { err.textContent = 'No reconozco ese enlace. Copia el del pliego o el del cuadro de cotizaciones de PanamaCompra.'; err.hidden = false; return; }
  const b = $('#demo-seguir'); b.disabled = true; b.textContent = 'Leyendo PanamaCompra…';
  try {
    const pl = camposPliego(await traer(`${API}/procesos-configuracion/pagina-componentes-publico/${p.tipo}/procesoVistaPliego/${p.flujos}`));
    let ofertas = null;
    try { ofertas = leerCuadro((await traer(`${API}/documentos-actos-publico/cuadroPropuesta/${p.tipo}/procesoVistaCuadroPropuesta/${p.flujos}`))?.result); } catch { ofertas = null; }
    const cierre = cierreIso(pl.cierreTexto);
    const listo = cierre && new Date(cierre) <= new Date() && ofertas?.length && ofertas.every((o) => o.monto);
    const m = { id: `real-${p.tipo}-${p.flujos}`, real: true, acto: pl.acto || `${p.tipo}-${p.flujos}`, tipo: pl.tipo || '', titulo: pl.titulo, ent: pl.entidad || '', entidad: pl.entidad || '',
      rubro: pl.tipo || '', prov: pl.prov || '', estimado: pl.ref, cierre, monto, nombre, marcada: new Date().toISOString(), leido: new Date().toISOString(),
      sinCuadro: /compra menor/i.test(pl.tipo || '') && !ofertas?.length, ofertas: listo ? ofertas : [], fase: listo ? 'cerro' : 'espera', abrir: true };
    estado.mias = [m, ...estado.mias.filter((x) => x.id !== m.id)]; estado.vista = 'mias'; guardar(); pintar();
    $('.feed__list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast(m.fase === 'cerro' ? `Leída en vivo de PanamaCompra: ${m.ofertas.length} ofertas.` : 'Leída en vivo: todavía no se pueden ver las ofertas.');
  } catch (e) {
    err.textContent = `No pude leer esa compra en PanamaCompra (${e.message}). Prueba otra vez en un momento.`; err.hidden = false;
  } finally { b.disabled = false; b.textContent = 'Seguir esta compra'; }
}
$('#demo-form')?.addEventListener('submit', (ev) => { ev.preventDefault(); seguirReal($('#demo-enlace').value, numero($('#demo-monto').value), limpio($('#demo-nombre').value)); });
$('#demo-ejemplo')?.addEventListener('click', () => {
  // La cotización en línea 2026-3-90-01-08-CL-000655, que cerró el 16-oct-2026: el enlace es el del cuadro de cotizaciones.
  $('#demo-enlace').value = 'https://www.panamacompra.gob.pa/Inicio/portal-interno/#/proceso/cotizacion-en-linea/cuadro/9JjOiAHdiwCOxQDN4ATM6ISaiwiIhR3clVHcvJHUvJHZhV3QhR3cpZ1bzV2YvJHciojIwJye';
  $('#demo-monto').value = '2,750.00'; $('#demo-nombre').value = '';
  seguirReal($('#demo-enlace').value, 2750, null);
});

// Los filtros: abiertos en la computadora, plegados bajo «Filtros» en el teléfono (como en el tablero).
const filtros = document.querySelector('details.filtros');
if (filtros) filtros.open = !matchMedia('(max-width: 900px)').matches;

pintar();
