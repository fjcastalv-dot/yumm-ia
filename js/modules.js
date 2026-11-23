/* =========================================================
   YUMM IA · Definición de los 29 módulos (Plan Maestro v1.0)
   Cada módulo declara: campos, validaciones heurísticas,
   salidas y lógica condicional según el enfoque.
   ========================================================= */
'use strict';

/* ---------- Utilidades ---------- */
const CY = new Date().getFullYear();
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const STOP = new Set(('para como entre sobre desde hasta donde cuando este esta estos estas esos esas ellos ellas cual cuales quien quienes porque pero sino tambien mismo misma mucho muchos poco pocos tiene tienen tener seran sera estar estan habia hacia cada todo toda todos todas otro otra otros otras segun mediante traves forma manera nivel niveles existe existen influye influyen relacion relaciona relacionan afecta afectan cual cuales dentro fuera durante ante bajo cuanto cuanta cual parte partir sido siendo puede pueden debe deben hace hacen donde aquel aquella aquellos aquellas nuestro nuestra nuestros nuestras usted ustedes entonces ademas solo tanto tanta tantos algun alguna algunos algunas ningun ninguna mayor menor mejor peor estudio investigacion analisis objetivo objetivos general especifico especificos tema problema').split(' '));
const words = s => [...new Set(norm(s).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length >= 4 && !STOP.has(w)))];
const stem = w => w.length > 6 ? w.slice(0, 6) : w;
const overlap = (a, b) => { const B = new Set(b.map(stem)); return a.filter(w => B.has(stem(w))); };
const firstWord = s => norm(s).trim().split(/\s+/)[0].replace(/[^a-z]/g, '');
const isInf = w => /^[a-z]{2,}(ar|er|ir)(se|lo|la|los|las)?$/.test(w);
const cap = s => { s = String(s || '').trim(); return s.charAt(0).toUpperCase() + s.slice(1); };
const trunc = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };
const filled = v => Array.isArray(v) ? v.length > 0 : (typeof v === 'boolean' ? v : String(v ?? '').trim() !== '');
const getD = (S, id) => (S.data['mod' + id] || {});
const isValid = (S, id) => !!getD(S, id).is_valid;
const enfoqueOf = S => isValid(S, '10') ? getD(S, '10').enfoque : null;
const E = (m, k) => ({ t: 'e', m, k });
const W = (m, k) => ({ t: 'w', m, k });
const especificos = S => (getD(S, '3').especificos || []).filter(x => String(x || '').trim());
const studyVarWords = S => {
  let w = words(getD(S, '1').variable);
  (getD(S, '18').variables || []).forEach(v => { w = w.concat(words(v.nombre)); });
  return [...new Set(w)];
};
const pd = (txt, fb = '[por definir]') => (String(txt || '').trim() ? esc(txt) : `<em style="opacity:.7">${fb}</em>`);

const ICON = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 7"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  skip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17h.01"/></svg>',
  err: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
  ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  quote: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.5 6C6.5 6 4 8.6 4 11.8V18h6v-6H7c0-1.9 1.2-3.2 2.5-3.2V6zm10 0c-3 0-5.5 2.6-5.5 5.8V18h6v-6h-3c0-1.9 1.2-3.2 2.5-3.2V6z"/></svg>',
  arrow: '<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M12 5v14M5 12h14"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/></svg>'
};
const alertBox = (type, html) => `<div class="alert alert-${type}">${ICON[{ error: 'err', success: 'ok', warning: 'warn', info: 'info' }[type]]}<div>${html}</div></div>`;

/* ---------- Catálogos ---------- */
const PHASES = [
  { n: 1, name: 'Fundamentos', desc: 'Delimita el tema, plantea el problema, define objetivos, justifica y mapea el estado del arte.', color: '#00806C' },
  { n: 2, name: 'Marco Referencial', desc: 'Antecedentes, teorías, conceptos clave e hipótesis que sostienen tu estudio.', color: '#2B5BA8' },
  { n: 3, name: 'Diseño Metodológico Macro', desc: 'Enfoque, paradigma, tipo, nivel, diseño, método, modalidad y muestra.', color: '#6A4BB8' },
  { n: 4, name: 'Operacionalización y Medición', desc: 'Variables, operacionalización, categorías, indicadores e instrumentos con ω.', color: '#C0531A' },
  { n: 5, name: 'Trabajo de Campo y Análisis', desc: 'Bitácora de recolección, plan de análisis, resultados y discusión.', color: '#1F7FA8' },
  { n: 6, name: 'Cierre y Formalización', desc: 'Conclusiones, referencias APA 7, documento final y simulacro de defensa.', color: '#1A2640' }
];

const BLOOM = [
  { n: 'Recordar', c: '#8790A5', v: 'recordar identificar reconocer listar enumerar nombrar definir localizar registrar buscar senalar recuperar memorizar'.split(' ') },
  { n: 'Comprender', c: '#2B5BA8', v: 'comprender describir interpretar clasificar resumir caracterizar ejemplificar inferir conocer explorar indagar explicar parafrasear categorizar diagnosticar'.split(' ') },
  { n: 'Aplicar', c: '#1F7FA8', v: 'aplicar implementar ejecutar utilizar usar demostrar emplear calcular medir operar resolver ilustrar'.split(' ') },
  { n: 'Analizar', c: '#00806C', v: 'analizar determinar relacionar establecer correlacionar diferenciar examinar contrastar comparar organizar estructurar atribuir integrar distinguir descomponer'.split(' ') },
  { n: 'Evaluar', c: '#C0531A', v: 'evaluar valorar verificar comprobar validar juzgar criticar probar justificar argumentar predecir estimar pronosticar proyectar contrastar'.split(' ') },
  { n: 'Crear', c: '#6A4BB8', v: 'crear disenar proponer elaborar desarrollar construir generar formular planificar producir plantear innovar programar idear modelar'.split(' ') }
];
const bloomOf = verb => BLOOM.findIndex(b => b.v.includes(verb));

const ENFOQUES = [
  { v: 'cuantitativo', l: 'Cuantitativo', d: 'Datos numéricos, análisis estadístico, prueba de hipótesis.' },
  { v: 'cualitativo', l: 'Cualitativo', d: 'Significados, experiencias, perspectivas de los participantes.' },
  { v: 'mixto', l: 'Mixto', d: 'Integra ambos métodos.' }
];
const PARADIGMAS = [
  { v: 'positivista', l: 'Positivista', d: 'La realidad es objetiva y medible; busca regularidades y leyes generales.' },
  { v: 'interpretativo', l: 'Interpretativo / Hermenéutico', d: 'Comprende los significados que los actores atribuyen a su realidad.' },
  { v: 'critico', l: 'Crítico', d: 'Busca la transformación social y la emancipación de los participantes.' },
  { v: 'constructivista', l: 'Constructivista', d: 'La realidad se construye socialmente a partir de la interacción.' }
];
const PARADIGMA_OK = {
  cuantitativo: ['positivista'],
  cualitativo: ['interpretativo', 'critico', 'constructivista'],
  mixto: ['positivista', 'interpretativo', 'critico', 'constructivista']
};
const ALCANCES = [
  { v: 'exploratoria', l: 'Exploratoria', d: 'Temas poco estudiados.' },
  { v: 'descriptiva', l: 'Descriptiva', d: 'Especifica propiedades y características.' },
  { v: 'correlacional', l: 'Correlacional', d: 'Grado de asociación entre variables.' },
  { v: 'explicativa', l: 'Explicativa', d: 'Causas de los fenómenos.' }
];
const DISENOS = [
  { v: 'experimental', l: 'Experimental', d: 'Manipulación deliberada y asignación aleatoria.' },
  { v: 'cuasiexperimental', l: 'Cuasiexperimental', d: 'Manipulación con grupos intactos.' },
  { v: 'no_experimental', l: 'No experimental', d: 'Observación sin manipular variables.' }
];
const DISENO_SUG = {
  exploratoria: ['no_experimental'],
  descriptiva: ['no_experimental'],
  correlacional: ['no_experimental'],
  explicativa: ['experimental', 'cuasiexperimental', 'no_experimental']
};
const NIVELES = [
  { v: 'explicativo', l: 'Explicativo', d: '¿Por qué ocurre? Causas y efectos.', a: 'explicativa' },
  { v: 'correlacional', l: 'Correlacional', d: '¿Cómo se relacionan las variables?', a: 'correlacional' },
  { v: 'descriptivo', l: 'Descriptivo', d: '¿Cómo es y cómo se manifiesta?', a: 'descriptiva' },
  { v: 'exploratorio', l: 'Exploratorio', d: '¿Qué hay? Primer acercamiento.', a: 'exploratoria' }
];
const DISENO_OBJ = {
  exploratorio: { l: 'Exploratorio', d: 'Primer acercamiento a un fenómeno poco estudiado.', est: ['Revisión documental', 'Estudio piloto', 'Consulta a informantes clave'], tec: ['Entrevista abierta', 'Observación no estructurada', 'Grupo focal'], an: ['Análisis de contenido', 'Frecuencias simples'], verbs: ['explorar', 'indagar', 'identificar', 'conocer', 'reconocer', 'detectar'], lv: [0, 1] },
  descriptivo: { l: 'Descriptivo', d: 'Especifica características y perfiles del fenómeno.', est: ['Encuesta', 'Estudio de caso', 'Observación sistemática'], tec: ['Cuestionario', 'Lista de cotejo', 'Escala de actitudes'], an: ['Estadística descriptiva (media, mediana, moda)', 'Frecuencias y porcentajes', 'Tablas de contingencia'], verbs: ['describir', 'caracterizar', 'identificar', 'determinar', 'diagnosticar', 'medir', 'conocer', 'registrar'], lv: [0, 1, 2] },
  explicativo: { l: 'Explicativo', d: 'Busca las causas y relaciones entre variables.', est: ['Estudio correlacional-causal', 'Diseño experimental o cuasiexperimental'], tec: ['Cuestionario estandarizado', 'Escalas', 'Pruebas'], an: ['Correlación y regresión', 'Pruebas de hipótesis (t, ANOVA, χ²)'], verbs: ['explicar', 'analizar', 'determinar', 'relacionar', 'establecer', 'comparar', 'correlacionar', 'demostrar'], lv: [3] },
  predictivo: { l: 'Predictivo', d: 'Anticipa el comportamiento futuro de una variable.', est: ['Modelos de pronóstico', 'Estudios longitudinales', 'Series de tiempo'], tec: ['Registros históricos', 'Cuestionarios longitudinales'], an: ['Regresión múltiple / logística', 'Series de tiempo', 'Modelos predictivos'], verbs: ['predecir', 'estimar', 'pronosticar', 'proyectar', 'anticipar', 'modelar'], lv: [4] },
  evaluativo: { l: 'Evaluativo', d: 'Valora la eficacia de un programa, proceso o intervención.', est: ['Evaluación de programas', 'Diseño antes-después', 'Comparación de grupos'], tec: ['Indicadores de desempeño', 'Rúbricas', 'Cuestionarios de satisfacción'], an: ['Comparación pre-post', 'Pruebas de diferencia', 'Análisis costo-beneficio'], verbs: ['evaluar', 'valorar', 'medir', 'verificar', 'comprobar', 'validar', 'comparar', 'juzgar'], lv: [4] }
};
const METODOS = [
  { v: 'inductivo', l: 'Inductivo', d: 'De lo particular a lo general.', x: (c) => `Partirás de la observación de casos particulares en ${c.pob} para llegar a conclusiones generales sobre ${c.vari}.` },
  { v: 'deductivo', l: 'Deductivo', d: 'De lo general a lo particular.', x: (c) => `Partirás de teorías generales para derivar proposiciones sobre ${c.vari} y contrastarlas en ${c.pob}.` },
  { v: 'analitico', l: 'Analítico', d: 'Descompone el todo en sus partes.', x: (c) => `Descompondrás ${c.vari} en sus dimensiones e indicadores para examinar cada elemento por separado.` },
  { v: 'sintetico', l: 'Sintético', d: 'Integra las partes en un todo.', x: (c) => `Integrarás los hallazgos parciales sobre ${c.vari} en una visión de conjunto que responda a tu pregunta.` },
  { v: 'estructuralista', l: 'Estructuralista', d: 'Estudia las relaciones dentro de una estructura.', x: (c) => `Analizarás ${c.vari} como parte de un sistema de relaciones en ${c.lug}.` },
  { v: 'historico', l: 'Histórico', d: 'Analiza la evolución en el tiempo.', x: (c) => `Reconstruirás la evolución de ${c.vari} a lo largo del tiempo para comprender su estado actual.` },
  { v: 'dialectico', l: 'Dialéctico', d: 'Analiza contradicciones y su superación.', x: (c) => `Examinarás las tensiones y contradicciones que rodean a ${c.vari} en ${c.pob}.` },
  { v: 'axiomatico', l: 'Axiomático', d: 'Parte de axiomas para construir teoría.', x: (c) => `Establecerás supuestos básicos sobre ${c.vari} y derivarás de ellos proposiciones verificables.` },
  { v: 'funcionalista', l: 'Funcionalista', d: 'Estudia la función de los elementos en el sistema.', x: (c) => `Analizarás qué función cumple ${c.vari} dentro de la organización o comunidad de ${c.lug}.` }
];
const MODALIDADES = [
  { v: 'campo', l: 'De campo', d: 'Los datos se recogen directamente de la realidad.', pob: 'Población' },
  { v: 'documental', l: 'Documental', d: 'Análisis de documentos, registros y bibliografía.', pob: 'Unidades de análisis documental' },
  { v: 'participativa', l: 'Participativa', d: 'Los participantes intervienen en el proceso.', pob: 'Participantes / comunidad' },
  { v: 'accion', l: 'Investigación-acción', d: 'Diagnóstico, intervención y reflexión cíclica.', pob: 'Participantes del grupo de acción' },
  { v: 'factible', l: 'Proyecto factible', d: 'Propuesta viable para resolver una necesidad.', pob: 'Población beneficiaria' }
];
const SUBMUESTREO = {
  probabilistico: ['Aleatorio simple', 'Sistemático', 'Estratificado', 'Por conglomerados'],
  no_probabilistico: ['Por conveniencia', 'Intencional / por juicio', 'Bola de nieve', 'Por cuotas'],
  censal: ['Censo (toda la población)']
};
const TECNICAS = {
  'Observación': ['Lista de cotejo', 'Guía de observación'],
  'Cuestionario': ['Cuestionario'],
  'Entrevista': ['Guía de entrevista'],
  'Focus Group': ['Guía de animación'],
  'Escala de actitudes': ['Escala de Likert'],
  'Recopilación documental': ['Fichaje']
};
const FORMATOS = { likert5: 'Likert 5 puntos', likert7: 'Likert 7 puntos', diferencial: 'Diferencial semántico', dicotomico: 'Dicotómico (Sí/No)', abierta: 'Abierta' };
const ANALISIS = {
  cuantitativo: ['Estadística descriptiva', 'Estadística inferencial paramétrica', 'Estadística inferencial no paramétrica', 'Análisis multivariado'],
  cualitativo: ['Análisis de contenido', 'Análisis del discurso', 'Análisis temático', 'Teoría fundamentada (codificación)', 'Análisis fenomenológico']
};
const SOFTWARE = ['SPSS', 'R / RStudio', 'JASP', 'Jamovi', 'Excel', 'Stata', 'Python', 'ATLAS.ti', 'NVivo', 'MAXQDA', 'QDA Miner Lite', 'Otro'];
const PASOS = ['Definición de objetivos', 'Selección del método', 'Desarrollo del instrumento', 'Prueba piloto', 'Recolección', 'Documentación', 'Validación', 'Análisis', 'Interpretación'];
const CHECK28 = ['Portada', 'Epígrafe', 'Dedicatorias', 'Índice', 'Resumen', 'Palabras clave', 'Introducción', 'Cuerpo capitular', 'Conclusiones', 'Referencias', 'Anexos'];
const AMBIGUOS = ['bueno', 'buena', 'malo', 'mala', 'adecuado', 'adecuada', 'suficiente', 'varios', 'varias', 'algunos', 'algunas', 'etc', 'mucho', 'mucha', 'poco', 'poca', 'normal', 'apropiado', 'apropiada', 'correcto', 'correcta', 'cosas', 'aspectos'];
const NEG = /\b(no|nunca|jamas|ningun|ninguna|ninguno|nadie|tampoco|nada|ni)\b/g;
const DOI_RE = /^10.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;

/* ---------- Clasificaciones auxiliares ---------- */
function clasificaAntecedente(a, S) {
  const p = norm(a.pais).trim();
  if (!p) return '';
  if (['mexico', 'mx', 'estados unidos mexicanos'].includes(p)) {
    const c = norm(a.ciudad);
    const lug = words(getD(S, '1').lugar).concat(['quintana', 'cancun']);
    if (c && lug.some(w => c.includes(w))) return 'Local';
    return 'Nacional';
  }
  return 'Internacional';
}
const escalaGrupo = e => (e === 'intervalo' || e === 'razon') ? 'metrica' : e;
function pruebaSugerida(iv, dv) {
  const a = escalaGrupo(iv.escala), b = escalaGrupo(dv.escala);
  if (a === 'nominal' && b === 'metrica') return 't de Student (2 grupos) / ANOVA de un factor (3+ grupos). Alternativa no paramétrica: U de Mann-Whitney / Kruskal-Wallis';
  if (a === 'nominal' && b === 'nominal') return 'Chi-cuadrada de independencia (χ²)';
  if (a === 'nominal' && b === 'ordinal') return 'U de Mann-Whitney (2 grupos) / Kruskal-Wallis (3+ grupos)';
  if (a === 'metrica' && b === 'metrica') return 'Correlación de Pearson / Regresión lineal';
  if ((a === 'ordinal' && (b === 'ordinal' || b === 'metrica')) || (a === 'metrica' && b === 'ordinal')) return 'Correlación de Spearman (rho) / Regresión ordinal';
  if ((a === 'metrica' || a === 'ordinal') && b === 'nominal') return 'Regresión logística / Chi-cuadrada (agrupando la VI)';
  return 'Define las escalas de medición en el Módulo 18 para sugerir una prueba.';
}
function operacionalizacionErrores(S) {
  const vars = getD(S, '18').variables || [];
  const ops = getD(S, '18_5').ops || {};
  const errs = [];
  vars.forEach((v, vi) => {
    const dims = (ops[vi] && ops[vi].dims) || [];
    const vn = v.nombre || `Variable ${vi + 1}`;
    if (dims.filter(d => filled(d.nombre)).length < 2) errs.push(`«${vn}»: necesita al menos 2 dimensiones con nombre.`);
    dims.forEach((d, di) => {
      const inds = d.inds || [];
      const dn = d.nombre || `Dimensión ${di + 1}`;
      if (inds.filter(i => filled(i.nombre)).length < 2) errs.push(`«${vn} › ${dn}»: necesita al menos 2 indicadores.`);
      inds.forEach((ind, ii) => {
        const items = (ind.items || []).filter(it => filled(it.texto));
        const inn = ind.nombre || `Indicador ${ii + 1}`;
        if (items.length < 2) errs.push(`«${dn} › ${inn}»: cada indicador debe tener ≥ 2 ítems.`);
        items.forEach((it, k) => { const m = norm(it.texto).match(NEG); if (m && m.length >= 2) errs.push(`Ítem «${trunc(it.texto, 50)}» contiene doble negación.`); });
      });
    });
  });
  return errs;
}
function matrizRows(S) {
  const vars = getD(S, '18').variables || [];
  const ops = getD(S, '18_5').ops || {};
  const rows = [];
  vars.forEach((v, vi) => {
    ((ops[vi] && ops[vi].dims) || []).forEach(d => {
      (d.inds || []).forEach(ind => {
        const items = (ind.items || []).filter(i => filled(i.texto));
        if (!items.length) rows.push({ v: v.nombre, d: d.nombre, i: ind.nombre, it: '', e: '' });
        items.forEach(it => rows.push({ v: v.nombre, d: d.nombre, i: ind.nombre, it: it.texto, e: FORMATOS[it.formato] || it.formato }));
      });
    });
  });
  return rows;
}
function matrizTable(rows, empty = 'Agrega dimensiones, indicadores e ítems para generar la matriz.') {
  if (!rows.length) return `<div class="empty">${empty}</div>`;
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Variable</th><th>Dimensión</th><th>Indicador</th><th>Ítem</th><th>Escala</th></tr></thead><tbody>${rows.map((r, i) => `<tr style="animation-delay:${Math.min(i, 20) * 25}ms"><td>${esc(r.v)}</td><td>${esc(r.d)}</td><td>${esc(r.i)}</td><td>${r.it ? esc(r.it) : '<span style="color:var(--red)">⚠ Sin ítems (mínimo 2)</span>'}</td><td>${esc(r.e)}</td></tr>`).join('')}</tbody></table></div>`;
}
function indicadoresFuente(S) {
  const out = [];
  const enf = enfoqueOf(S);
  if (enf !== 'cualitativo' && isValid(S, '18_5')) {
    const vars = getD(S, '18').variables || [];
    const ops = getD(S, '18_5').ops || {};
    vars.forEach((v, vi) => ((ops[vi] && ops[vi].dims) || []).forEach((d, di) => (d.inds || []).forEach((ind, ii) => {
      if (filled(ind.nombre)) out.push({ src: `op:${vi}:${di}:${ii}`, origen: `18.5 · ${v.nombre} › ${d.nombre}`, nombre: ind.nombre, descripcion: ind.definicion || '' });
    })));
  }
  if (enf !== 'cuantitativo' && isValid(S, '19')) {
    (getD(S, '19').categorias || []).forEach((c, ci) => {
      if (filled(c.indicador)) out.push({ src: `cat:${ci}`, origen: `19 · ${c.nombre}`, nombre: c.indicador, descripcion: c.subcategoria || '' });
    });
  }
  return out;
}
function apaFormat(r, html = true) {
  const a = String(r.autor || '').trim(), t = String(r.titulo || '').trim();
  const f = String(r.fuente || '').trim(), v = String(r.volumen || '').trim();
  const doi = cleanDoi(r.doi);
  const e = html ? esc : (x => x);
  const it = x => html ? `<i>${esc(x)}</i>` : x;
  let s = `${e(a)}${/[.]$/.test(a) ? '' : '.'} (${e(r.anio || 's.f.')}). ${e(t)}${/[.?!]$/.test(t) ? '' : '.'}`;
  if (f) s += ` ${it(f)}${v ? `, ${e(v)}` : ''}.`;
  if (doi) s += ` https://doi.org/${e(doi)}`;
  return s;
}
const cleanDoi = d => String(d || '').trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '');

/* ---------- Árbol de problemas (SVG) ---------- */
function wrapText(t, max = 24, lines = 3) {
  const w = String(t || '').split(/\s+/); const out = []; let cur = '';
  w.forEach(x => { if ((cur + ' ' + x).trim().length > max) { if (cur) out.push(cur); cur = x; } else cur = (cur + ' ' + x).trim(); });
  if (cur) out.push(cur);
  if (out.length > lines) { out.length = lines; out[lines - 1] = trunc(out[lines - 1], max - 1) + '…'; }
  return out;
}
function arbolSVG(S, d) {
  const causas = (d.causas || []).filter(filled).slice(0, 6);
  const efectos = (d.efectos || []).filter(filled).slice(0, 6);
  const centro = getD(S, '1').variable ? cap(getD(S, '1').variable) : (d.pregunta || 'Problema central');
  const W = 760, H = 420, bw = 150, bh = 64;
  const row = (n, y) => Array.from({ length: n }, (_, i) => ({ x: (W / (n + 1)) * (i + 1), y }));
  const pe = row(efectos.length, 50), pc = row(causas.length, H - 50);
  const cx = W / 2, cy = H / 2;
  const box = (x, y, t, fill, stroke, color, delay, wM = bw, max = 22) => {
    const ls = wrapText(t, max, 3);
    return `<g class="node" style="animation-delay:${delay}ms"><rect x="${x - wM / 2}" y="${y - bh / 2}" width="${wM}" height="${bh}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>${ls.map((l, i) => `<text x="${x}" y="${y + (i - (ls.length - 1) / 2) * 15 + 4}" text-anchor="middle" font-size="11.5" font-weight="600" fill="${color}" font-family="Montserrat, sans-serif">${esc(l)}</text>`).join('')}</g>`;
  };
  const edge = (a, b, delay) => `<path class="edge" style="animation-delay:${delay}ms" d="M${a.x},${a.y} C${a.x},${(a.y + b.y) / 2} ${b.x},${(a.y + b.y) / 2} ${b.x},${b.y}"/>`;
  let s = `<svg class="tree-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Árbol de problemas">`;
  s += `<text x="12" y="16" font-size="10" font-weight="800" letter-spacing="1.5" fill="#C9701A" font-family="Montserrat, sans-serif">EFECTOS</text>`;
  s += `<text x="12" y="${H - 6}" font-size="10" font-weight="800" letter-spacing="1.5" fill="#00806C" font-family="Montserrat, sans-serif">CAUSAS</text>`;
  pe.forEach((p, i) => { s += edge({ x: cx, y: cy - bh / 2 }, { x: p.x, y: p.y + bh / 2 }, 150 + i * 80); });
  pc.forEach((p, i) => { s += edge({ x: cx, y: cy + bh / 2 }, { x: p.x, y: p.y - bh / 2 }, 150 + i * 80); });
  efectos.forEach((t, i) => { s += box(pe[i].x, pe[i].y, t, '#FFF3E6', '#F5C894', '#7A4A12', 400 + i * 90, Math.min(bw, W / (efectos.length + 1) - 10)); });
  causas.forEach((t, i) => { s += box(pc[i].x, pc[i].y, t, '#E6F6EF', '#A2E3C5', '#006B5A', 400 + i * 90, Math.min(bw, W / (causas.length + 1) - 10)); });
  s += box(cx, cy, centro, '#1A2640', '#1A2640', '#FFFFFF', 0, 260, 34);
  return s + '</svg>';
}

/* ---------- Omega de McDonald ---------- */
const OMEGA = {
  parseLines: t => String(t || '').split(/\n/).map(l => l.trim()).filter(Boolean),
  parseRow: l => l.split(/[,;\t ]+/).map(x => parseFloat(x.replace(',', '.'))).filter(n => !isNaN(n)),
  fromLoadings(l) {
    const sum = l.reduce((a, b) => a + b, 0);
    const sum2 = sum * sum;
    const err = l.reduce((a, x) => a + (1 - x * x), 0);
    const omega = sum2 / (sum2 + err);
    let rs = 0, c = 0;
    for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++) { rs += l[i] * l[j]; c++; }
    const rbar = c ? rs / c : 0; const k = l.length;
    const alpha = (k * rbar) / (1 + (k - 1) * rbar);
    return { omega, alpha, sum, sum2, err };
  },
  paf(R) { // análisis de ejes principales (1 factor)
    const k = R.length;
    let h = R.map((row, i) => Math.max(...row.map((v, j) => i === j ? 0 : Math.abs(v))));
    let l = new Array(k).fill(0);
    for (let it = 0; it < 80; it++) {
      const M = R.map((row, i) => row.map((v, j) => i === j ? h[i] : v));
      let v = new Array(k).fill(1 / Math.sqrt(k)), lam = 0;
      for (let p = 0; p < 200; p++) {
        const w = M.map(row => row.reduce((a, x, j) => a + x * v[j], 0));
        const nrm = Math.sqrt(w.reduce((a, x) => a + x * x, 0)) || 1;
        lam = w.reduce((a, x, j) => a + x * v[j], 0);
        v = w.map(x => x / nrm);
      }
      l = v.map(x => x * Math.sqrt(Math.max(lam, 0)));
      const nh = l.map(x => Math.min(x * x, 0.995));
      const diff = nh.reduce((a, x, i) => a + Math.abs(x - h[i]), 0);
      h = nh; if (diff < 1e-6) break;
    }
    if (l.reduce((a, b) => a + b, 0) < 0) l = l.map(x => -x);
    return l;
  },
  corr(X) {
    const n = X.length, k = X[0].length;
    const m = Array.from({ length: k }, (_, j) => X.reduce((a, r) => a + r[j], 0) / n);
    const sd = Array.from({ length: k }, (_, j) => Math.sqrt(X.reduce((a, r) => a + (r[j] - m[j]) ** 2, 0) / (n - 1)));
    const R = Array.from({ length: k }, () => new Array(k).fill(0));
    for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) {
      R[i][j] = i === j ? 1 : X.reduce((a, r) => a + (r[i] - m[i]) * (r[j] - m[j]), 0) / ((n - 1) * sd[i] * sd[j] || 1);
    }
    const varItems = sd.reduce((a, s) => a + s * s, 0);
    const tot = X.map(r => r.reduce((a, b) => a + b, 0)); const mt = tot.reduce((a, b) => a + b, 0) / n;
    const varTot = tot.reduce((a, t) => a + (t - mt) ** 2, 0) / (n - 1);
    const alphaRaw = (k / (k - 1)) * (1 - varItems / (varTot || 1));
    return { R, sd, alphaRaw };
  },
  interpret(w) {
    if (w >= 0.90) return { t: 'Excelente confiabilidad. Tu instrumento es altamente confiable.', c: '#39BEA3', i: 4 };
    if (w >= 0.80) return { t: 'Buena confiabilidad. Adecuado para la mayoría de propósitos de investigación.', c: '#4F8FE0', i: 3 };
    if (w >= 0.70) return { t: 'Confiabilidad aceptable. Usable, pero revisa ítems con bajas cargas.', c: '#F5B53D', i: 2 };
    if (w >= 0.60) return { t: 'Confiabilidad cuestionable. Revisa y elimina ítems con carga < 0.40.', c: '#F39A3D', i: 1 };
    return { t: 'Confiabilidad pobre. Necesita revisión significativa.', c: '#E25C5C', i: 0 };
  }
};

/* =========================================================
   MÓDULOS
   ========================================================= */
const MODULES = [
/* ---------------- FASE 1 ---------------- */
{
  id: '1', phase: 1, title: 'Delimitación del Tema',
  purpose: 'Acotar el fenómeno de estudio en coordenadas espaciotemporales y poblacionales.',
  quote: 'Bienvenido a YUMM IA. Aquí no vas a encontrar un libro de 400 páginas. Vas a encontrar un camino. Un paso a la vez. Empecemos por lo más difícil: ¿de qué vas a hablar?',
  ux: 'Definamos el territorio de tu investigación. Sin límites claros, el proyecto se dispersa.',
  fields: [
    { type: 'row', cols: 2, fields: [
      { k: 'campo_disciplinar', type: 'select', label: 'Campo disciplinar', req: true, opts: ['Mercadotecnia', 'Negocios', 'Administración', 'Educación', 'Tecnología', 'Salud', 'Medio ambiente', 'Social', 'Otros'] },
      { k: 'variable', type: 'text', label: 'Variable o fenómeno central', req: true, ph: 'Ej: hábitos de estudio' }
    ] },
    { k: 'problema_observado', type: 'textarea', label: '¿Qué problema observaste en tu entorno?', req: true, min: 50, ph: 'Describe el problema en al menos 50 caracteres...' },
    { type: 'row', cols: 3, fields: [
      { k: 'poblacion', type: 'text', label: '¿A quién afecta? (Población)', req: true, ph: 'Ej: estudiantes de noveno cuatrimestre' },
      { k: 'lugar', type: 'text', label: '¿Dónde? (Delimitación espacial)', req: true, ph: 'Ej: Universidad Tecnológica de Cancún' },
      { k: 'periodo', type: 'text', label: '¿Cuándo? (Delimitación temporal)', req: true, ph: 'Ej: cuatrimestre enero-abril 2027' }
    ] },
    { type: 'html', html: () => `<div class="out accent"><h4>${ICON.info.replace('<svg', '<svg width="16" height="16"')} Título sugerido</h4><div class="title-sug" id="live_titulo"></div></div>` }
  ],
  titulo: d => (d.variable && d.poblacion && d.lugar && d.periodo) ? `${cap(d.variable)} en ${d.poblacion.trim()} de ${d.lugar.trim()}, ${d.periodo.trim()}` : '',
  live(ctx) {
    const t = this.titulo(ctx.d); const el = ctx.$('#live_titulo');
    if (!el) return;
    el.classList.toggle('empty-t', !t);
    el.textContent = t || 'Completa variable, población, lugar y periodo para generar el título: "[Variable] en [Población] de [Lugar], [Periodo]".';
  },
  beforeSave(d) { d.titulo_sugerido = this.titulo(d); d.tema_delimitado = { campo: d.campo_disciplinar, variable: d.variable, poblacion: d.poblacion, lugar: d.lugar, periodo: d.periodo }; }
},
{
  id: '2', phase: 1, title: 'Planteamiento del Problema',
  purpose: 'Estructurar la brecha de conocimiento y formular la pregunta rectora.',
  quote: 'El problema no es lo que sabes, es lo que ignoras y necesitas descubrir.',
  fields: ctx => [
    { k: 'descripcion_contexto', type: 'textarea', label: 'Descripción del contexto', req: true, min: 100, ph: 'Describe el contexto donde ocurre el problema...' },
    { k: 'pregunta_principal', type: 'text', label: 'Pregunta principal de investigación', req: true, ph: '¿...?', hint: `Debe terminar en signo de interrogación y contener tu variable del Módulo 1${getD(ctx.S, '1').variable ? `: <b>${esc(getD(ctx.S, '1').variable)}</b>` : ''}.` },
    { type: 'row', cols: 2, fields: [
      { k: 'causas', type: 'list', label: 'Causas del problema', minItems: 1, ph: 'Causa', add: 'Agregar causa' },
      { k: 'efectos', type: 'list', label: 'Efectos observables', minItems: 1, ph: 'Efecto', add: 'Agregar efecto' }
    ] },
    { type: 'html', html: () => `<div class="out"><h4>Árbol de problemas</h4><div id="live_arbol"></div></div>` }
  ],
  init(d) { if (!d.causas) d.causas = ['']; if (!d.efectos) d.efectos = ['']; },
  live(ctx) { const el = ctx.$('#live_arbol'); if (el) el.innerHTML = arbolSVG(ctx.S, ctx.d); },
  liveDebounce: 500,
  validate(d, ctx) {
    const r = []; const q = String(d.pregunta_principal || '').trim();
    if (q && !q.endsWith('?')) r.push(E('La pregunta principal debe terminar en signo de interrogación (?).', 'pregunta_principal'));
    if (q && !q.startsWith('¿')) r.push(W('Recuerda abrir la pregunta con «¿».'));
    const vw = words(getD(ctx.S, '1').variable);
    if (q && vw.length && !overlap(vw, words(q)).length) r.push(E(`La pregunta debe contener al menos una variable identificada en el Módulo 1 («${esc(getD(ctx.S, '1').variable)}»).`, 'pregunta_principal'));
    return r;
  },
  beforeSave(d, ctx) { d.arbol_problemas_svg = arbolSVG(ctx.S, d); d.problema_planteado = { contexto: d.descripcion_contexto, pregunta: d.pregunta_principal, causas: d.causas, efectos: d.efectos }; }
},
{
  id: '3', phase: 1, title: 'Objetivos',
  purpose: 'Definir las metas de la investigación con verbos accionables.',
  quote: 'Un objetivo no es un deseo. Es una promesa de resultado medible.',
  fields: [
    { k: 'objetivo_general', type: 'textarea', label: 'Objetivo general', req: true, hint: 'Inicia con un verbo en infinitivo.', ph: 'Ej: Analizar el impacto de...', rows: 3 },
    { k: 'especificos', type: 'list', label: 'Objetivos específicos', minItems: 2, maxItems: 4, ph: 'Ej: Identificar...', add: 'Agregar objetivo específico', hint: 'Mínimo 2, máximo 4.',
      badge: v => { const w = firstWord(v); if (!w) return ''; if (!isInf(w)) return `<span class="badge r">No infinitivo</span>`; const b = bloomOf(w); return b >= 0 ? `<span class="badge" style="background:${BLOOM[b].c};color:#fff">${BLOOM[b].n}</span>` : `<span class="badge o">Verbo no catalogado</span>`; } },
    { type: 'html', html: () => `<div class="out"><h4>Taxonomía de Bloom digital · nivel del objetivo general</h4><div class="bloom" id="live_bloom">${BLOOM.map((b, i) => `<div data-b="${i}" style="--bc:${b.c}">${b.n}<small>Nivel ${i + 1}</small></div>`).join('')}</div><div id="live_bloom_msg" style="font-size:13px;color:var(--muted);margin-top:8px"></div></div>` }
  ],
  init(d) { if (!d.especificos) d.especificos = ['', '']; },
  live(ctx) {
    const w = firstWord(ctx.d.objetivo_general); const b = bloomOf(w);
    ctx.$$('#live_bloom [data-b]').forEach(el => el.classList.toggle('on', +el.dataset.b === b));
    const m = ctx.$('#live_bloom_msg'); if (!m) return;
    if (!w) m.textContent = 'Escribe tu objetivo general para identificar su nivel cognitivo.';
    else if (!isInf(w)) m.innerHTML = `<b style="color:var(--red)">«${esc(w)}»</b> no parece un verbo en infinitivo (-ar, -er, -ir).`;
    else if (b < 0) m.innerHTML = `El verbo <b>«${esc(w)}»</b> no está en el catálogo de Bloom; verifica que sea un verbo observable.`;
    else m.innerHTML = `Verbo <b>«${esc(w)}»</b> → nivel <b>${BLOOM[b].n}</b>. Los objetivos específicos deben ser de igual o menor complejidad.`;
  },
  validate(d) {
    const r = []; const g = firstWord(d.objetivo_general);
    if (g && !isInf(g)) r.push(E(`El objetivo general debe iniciar con un verbo en infinitivo (analizar, evaluar, determinar…). Tu objetivo inicia con: «${esc(g)}».`, 'objetivo_general'));
    const bg = bloomOf(g);
    if (g && isInf(g) && bg < 0) r.push(W(`El verbo «${esc(g)}» no está en la Taxonomía de Bloom digital del sistema.`));
    (d.especificos || []).forEach((o, i) => {
      if (!filled(o)) return;
      const w = firstWord(o);
      if (!isInf(w)) r.push(E(`El objetivo específico ${i + 1} debe iniciar con un verbo en infinitivo (inicia con «${esc(w)}»).`, 'especificos'));
      else if (bg >= 0 && bloomOf(w) > bg) r.push(E(`El objetivo específico ${i + 1} («${esc(w)}», nivel ${BLOOM[bloomOf(w)].n}) supera la complejidad del general (${BLOOM[bg].n}). El objetivo general debe englobar lógicamente a los específicos.`, 'especificos'));
    });
    return r;
  },
  beforeSave(d) { const b = bloomOf(firstWord(d.objetivo_general)); d.nivel_bloom_sugerido = b >= 0 ? BLOOM[b].n : ''; d.especificos = d.especificos.filter(filled); d.objetivos_validados = { general: d.objetivo_general, especificos: d.especificos }; }
},
{
  id: '4', phase: 1, title: 'Justificación',
  purpose: 'Argumentar la relevancia del estudio.',
  quote: 'Convierte el «me interesa» en «la comunidad académica lo necesita».',
  fields: [
    { k: 'tipo_justificacion', type: 'checks', label: 'Tipos de justificación', hint: 'Selecciona al menos uno.', minItems: 1, cols: 1, opts: [
      { v: 'teorica', l: 'Teórica', d: '¿Por qué aporta al conocimiento científico?' },
      { v: 'practica', l: 'Práctica', d: '¿Por qué es útil para la sociedad / empresas?' },
      { v: 'metodologica', l: 'Metodológica', d: '¿Por qué aporta algo nuevo al método?' }] },
    { k: 'argumento_teorico', type: 'textarea', label: 'Argumento teórico', min: 80, req: true, show: d => (d.tipo_justificacion || []).includes('teorica') },
    { k: 'argumento_practico', type: 'textarea', label: 'Argumento práctico', min: 80, req: true, show: d => (d.tipo_justificacion || []).includes('practica') },
    { k: 'argumento_metodologico', type: 'textarea', label: 'Argumento metodológico', min: 80, req: true, show: d => (d.tipo_justificacion || []).includes('metodologica') }
  ],
  beforeSave(d) { d.justificacion_completa = { tipos: d.tipo_justificacion, teorica: d.argumento_teorico, practica: d.argumento_practico, metodologica: d.argumento_metodologico }; }
},
{
  id: '5', phase: 1, title: 'Estado del Arte',
  purpose: 'Mapear la frontera actual del conocimiento sobre el tema.',
  quote: 'No reinventes la rueda. Descubre quién la está girando ahora mismo.',
  fields: [
    { type: 'info', kind: 'info', html: '<strong>Bases de datos recomendadas:</strong> Google Scholar, Scopus, Web of Science, SciELO, Redalyc, Dialnet, DOAJ, ERIC, Dimensions, PubMed, Springer Open, Academia.edu' },
    { k: 'terminos_busqueda', type: 'list', label: 'Términos de búsqueda', minItems: 1, ph: 'Ej: metodología de investigación', add: 'Agregar término' },
    { type: 'html', html: () => `<div class="out navy"><h4>Cadena de búsqueda generada</h4><div class="mono" id="live_prompt" style="word-break:break-word"></div><div style="margin-top:10px"><button class="btn btn-sm btn-soft" data-act="copyPrompt">${ICON.copy} Copiar</button></div></div>` },
    { k: 'fuentes_seleccionadas', type: 'rep', label: 'Fuentes encontradas', minItems: 3, add: 'Agregar fuente', hint: `Mínimo 3. Publicadas en ${CY - 5} o después (excepto clásicos).`,
      title: (it, i) => { const y = parseInt(it.anio, 10); const b = it.clasico ? '<span class="badge b">Clásico</span>' : (!y ? '' : (y >= CY - 5 ? '<span class="badge g">Reciente</span>' : '<span class="badge r">Antigua</span>')); return `Fuente ${i + 1} ${b}`; },
      fields: [
        { k: 'autor', type: 'text', label: 'Autor(es)', req: true, ph: 'Apellido, N.' },
        { k: 'anio', type: 'number', label: 'Año', req: true, ph: String(CY) },
        { k: 'hallazgo', type: 'textarea', label: 'Hallazgo principal', req: true },
        { k: 'relacion', type: 'textarea', label: 'Relación con tu estudio', req: true },
        { k: 'clasico', type: 'check', label: 'Es una obra clásica (exenta del criterio de antigüedad)' }
      ] },
    { type: 'html', html: () => `<div class="out"><h4>Fichas de lectura</h4><div id="live_fichas"></div></div>` }
  ],
  init(d) { if (!d.terminos_busqueda) d.terminos_busqueda = ['']; if (!d.fuentes_seleccionadas) d.fuentes_seleccionadas = [{}, {}, {}]; },
  prompt(d) { const t = (d.terminos_busqueda || []).filter(filled).map(x => `"${x.trim()}"`); return t.length ? `${t.join(' AND ')}  ·  Filtro: ${CY - 5}–${CY}` : ''; },
  live(ctx) {
    const p = this.prompt(ctx.d); const el = ctx.$('#live_prompt'); if (el) el.textContent = p || 'Agrega términos para generar tu cadena booleana de búsqueda.';
    const f = (ctx.d.fuentes_seleccionadas || []).filter(x => filled(x.autor));
    const fe = ctx.$('#live_fichas');
    if (fe) fe.innerHTML = f.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Ficha</th><th>Autor (año)</th><th>Hallazgo</th><th>Relación con el estudio</th></tr></thead><tbody>${f.map((x, i) => `<tr><td>#${i + 1}</td><td>${esc(x.autor)} (${esc(x.anio || 's.f.')})</td><td>${esc(x.hallazgo)}</td><td>${esc(x.relacion)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Tus fichas aparecerán aquí al registrar fuentes.</div>';
  },
  actions: { copyPrompt(ctx) { navigator.clipboard?.writeText(MODULES.find(m => m.id === '5').prompt(ctx.d)); toast('Cadena de búsqueda copiada'); } },
  validate(d) {
    const r = [];
    (d.fuentes_seleccionadas || []).forEach((f, i) => { const y = parseInt(f.anio, 10); if (y && !f.clasico && y < CY - 5) r.push(E(`La fuente ${i + 1} (${esc(f.autor || 's/a')}, ${y}) tiene más de 5 años. Usa fuentes de ${CY - 5} en adelante o márcala como clásico.`)); if (y > CY) r.push(E(`La fuente ${i + 1} tiene un año futuro (${y}).`)); });
    return r;
  },
  beforeSave(d) { d.prompt_busqueda_generado = this.prompt(d); d.fichas_estado_arte = d.fuentes_seleccionadas; }
},
/* ---------------- FASE 2 ---------------- */
{
  id: '6', phase: 2, title: 'Antecedentes',
  purpose: 'Documentar investigaciones empíricas previas directamente relacionadas.',
  fields: ctx => [
    { type: 'info', kind: 'info', html: `<strong>Tu pregunta de investigación:</strong> ${pd(getD(ctx.S, '2').pregunta_principal)}<br>El vacío detectado en cada antecedente debe vincularse con ella. La clasificación Local / Nacional / Internacional es automática.` },
    { k: 'antecedentes', type: 'rep', label: 'Antecedentes', minItems: 2, add: 'Agregar antecedente', hint: 'Mínimo 1 nacional y 1 internacional.',
      title: (it, i, c) => { const t = clasificaAntecedente(it, c.S); const col = { Local: 'o', Nacional: 'g', Internacional: 'b' }[t]; return `Antecedente ${i + 1} ${t ? `<span class="badge ${col}">${t}</span>` : ''}`; },
      fields: [
        { k: 'autor', type: 'text', label: 'Autor(es)', req: true },
        { k: 'anio', type: 'number', label: 'Año', req: true },
        { k: 'pais', type: 'text', label: 'País', req: true, ph: 'Ej: México' },
        { k: 'ciudad', type: 'text', label: 'Estado / ciudad (opcional)', ph: 'Ej: Quintana Roo' },
        { k: 'metodo', type: 'text', label: 'Método', req: true, full: true },
        { k: 'resultado', type: 'textarea', label: 'Resultado', req: true },
        { k: 'vacio_detectado', type: 'textarea', label: 'Vacío detectado', req: true }
      ] },
    { type: 'html', html: () => `<div class="out"><h4>Matriz de antecedentes</h4><div id="live_matriz"></div></div>` }
  ],
  init(d) { if (!d.antecedentes) d.antecedentes = [{ pais: 'México' }, {}]; },
  live(ctx) {
    const el = ctx.$('#live_matriz'); if (!el) return;
    const a = (ctx.d.antecedentes || []).filter(x => filled(x.autor));
    const cnt = { Local: 0, Nacional: 0, Internacional: 0 }; a.forEach(x => { const t = clasificaAntecedente(x, ctx.S); if (t) cnt[t]++; });
    el.innerHTML = `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"><span class="chip"><i>${cnt.Local}</i> Local</span><span class="chip"><i>${cnt.Nacional}</i> Nacional</span><span class="chip"><i>${cnt.Internacional}</i> Internacional</span></div>` +
      (a.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Ámbito</th><th>Autor (año)</th><th>País</th><th>Método</th><th>Resultado</th><th>Vacío</th></tr></thead><tbody>${a.map(x => `<tr><td>${clasificaAntecedente(x, ctx.S)}</td><td>${esc(x.autor)} (${esc(x.anio)})</td><td>${esc(x.pais)}</td><td>${esc(x.metodo)}</td><td>${esc(x.resultado)}</td><td>${esc(x.vacio_detectado)}</td></tr>`).join('')}</tbody></table></div>` : '');
  },
  validate(d, ctx) {
    const r = []; const a = d.antecedentes || [];
    const t = a.map(x => clasificaAntecedente(x, ctx.S));
    if (!t.some(x => x === 'Nacional' || x === 'Local')) r.push(E('Debes incluir al menos un antecedente nacional (México).'));
    if (!t.includes('Internacional')) r.push(E('Debes incluir al menos un antecedente internacional.'));
    const qw = words(getD(ctx.S, '2').pregunta_principal);
    a.forEach((x, i) => { if (filled(x.vacio_detectado) && qw.length && !overlap(words(x.vacio_detectado), qw).length) r.push(E(`El vacío del antecedente ${i + 1} no se vincula con tu pregunta de investigación. Usa términos como: ${qw.slice(0, 5).map(esc).join(', ')}.`)); });
    return r;
  },
  beforeSave(d, ctx) { d.matriz_antecedentes = d.antecedentes.map(x => ({ ...x, ambito: clasificaAntecedente(x, ctx.S) })); }
},
{
  id: '7', phase: 2, title: 'Marco Teórico',
  purpose: 'Sustentar el estudio en teorías, modelos o enfoques consolidados.',
  fields: ctx => [
    { type: 'info', kind: 'info', html: `<strong>Problema (Módulo 2):</strong> ${pd(getD(ctx.S, '2').pregunta_principal)}<br><strong>Variable (Módulo 1):</strong> ${pd(getD(ctx.S, '1').variable)}` },
    { k: 'teorias_principales', type: 'rep', label: 'Teorías principales', minItems: 2, add: 'Agregar teoría principal', hint: 'Mínimo 2.',
      title: (it, i) => `Teoría ${i + 1}${it.nombre ? ` · ${esc(trunc(it.nombre, 40))}` : ''}`,
      fields: [
        { k: 'nombre', type: 'text', label: 'Teoría / modelo', req: true },
        { k: 'autor', type: 'text', label: 'Autor(es) y año', req: true, ph: 'Ej: Bandura (1977)' },
        { k: 'variable_explica', type: 'text', label: '¿Qué variable o fenómeno explica?', req: true, full: true },
        { k: 'postulado', type: 'textarea', label: 'Postulado central', req: true }
      ] },
    { k: 'teorias_complementarias', type: 'list', label: 'Teorías complementarias', minItems: 1, add: 'Agregar teoría complementaria', ph: 'Teoría / autor' },
    { k: 'articulacion_teorica', type: 'textarea', label: 'Articulación teórica', req: true, min: 100, hint: 'Explica cómo las teorías se conectan entre sí y con el problema del Módulo 2 (menciónalo explícitamente).', rows: 5 }
  ],
  init(d) { if (!d.teorias_principales) d.teorias_principales = [{}, {}]; if (!d.teorias_complementarias) d.teorias_complementarias = ['']; },
  validate(d, ctx) {
    const r = []; const qw = words(getD(ctx.S, '2').pregunta_principal).concat(words(getD(ctx.S, '1').variable));
    const need = Math.min(2, qw.length);
    if (filled(d.articulacion_teorica) && need && overlap(words(d.articulacion_teorica), qw).length < need) r.push(E('La articulación teórica debe mencionar explícitamente el problema del Módulo 2 (incluye sus términos clave).', 'articulacion_teorica'));
    const vw = studyVarWords(ctx.S);
    if (vw.length && !(d.teorias_principales || []).some(t => overlap(words(t.variable_explica + ' ' + t.postulado), vw).length)) r.push(W('Ninguna teoría principal parece explicar las variables del Módulo 1. Verifica su pertinencia.'));
    return r;
  },
  beforeSave(d) { d.marco_teorico_estructurado = { principales: d.teorias_principales, complementarias: d.teorias_complementarias, articulacion: d.articulacion_teorica }; }
},
{
  id: '8', phase: 2, title: 'Marco Conceptual',
  purpose: 'Definir operativamente los términos clave del estudio.',
  fields: [
    { k: 'terminos', type: 'rep', label: 'Términos clave', minItems: 5, maxItems: 12, add: 'Agregar término', hint: 'Entre 5 y 12 términos. Deben incluir tus variables principales.',
      title: (it, i) => `Término ${i + 1}${it.termino ? ` · ${esc(it.termino)}` : ''} ${filled(it.termino) && !filled(it.autor) ? '<span class="badge o">Sin autor de respaldo</span>' : ''}`,
      fields: [
        { k: 'termino', type: 'text', label: 'Término', req: true },
        { k: 'autor', type: 'text', label: 'Autor de referencia', ph: 'Ej: Hernández-Sampieri (2018)' },
        { k: 'definicion_conceptual', type: 'textarea', label: 'Definición conceptual', req: true },
        { k: 'definicion_operativa', type: 'textarea', label: 'Definición operativa', req: true }
      ] },
    { type: 'html', html: () => `<div class="out"><h4>Glosario técnico del proyecto</h4><div id="live_glosario"></div></div>` }
  ],
  init(d, ctx) { if (!d.terminos) d.terminos = [{ termino: cap(getD(ctx.S, '1').variable || '') }, {}, {}, {}, {}]; },
  live(ctx) {
    const t = (ctx.d.terminos || []).filter(x => filled(x.termino)).sort((a, b) => norm(a.termino).localeCompare(norm(b.termino)));
    const el = ctx.$('#live_glosario'); if (el) el.innerHTML = t.length ? `<dl class="kv">${t.map(x => `<dt>${esc(x.termino)}</dt><dd>${esc(x.definicion_conceptual) || '—'} ${x.autor ? `<span style="color:var(--soft)">(${esc(x.autor)})</span>` : ''}</dd>`).join('')}</dl>` : '<div class="empty">Tu glosario se construye aquí.</div>';
  },
  validate(d, ctx) {
    const r = []; const t = d.terminos || [];
    const sin = t.filter(x => filled(x.termino) && !filled(x.autor));
    if (sin.length) r.push(W(`${sin.length} término(s) sin autor de respaldo: ${sin.map(x => esc(x.termino)).join(', ')}.`));
    const vw = words(getD(ctx.S, '1').variable);
    if (vw.length && !t.some(x => overlap(words(x.termino), vw).length)) r.push(E(`El marco conceptual debe incluir tu variable principal («${esc(getD(ctx.S, '1').variable)}»).`));
    return r;
  },
  beforeSave(d) { d.glosario = d.terminos; }
},
{
  id: '9', phase: 2, title: 'Hipótesis', conditional: 'Cuanti/Mixto',
  purpose: 'Establecer proposiciones tentativas sobre la relación entre variables.',
  applies: S => enfoqueOf(S) !== 'cualitativo',
  gate(ctx) {
    if (!isValid(ctx.S, '10')) return `<div class="na-box"><div class="na-ico">${ICON.skip}</div><h3>Primero define tu enfoque</h3><p>Este módulo es condicional: se habilita si el enfoque (Módulo 10) es cuantitativo o mixto, y se omite si es cualitativo.</p><a class="btn btn-primary" href="#modulo/10">Ir al Módulo 10: Enfoque ${ICON.arrow}</a></div>`;
    return null;
  },
  fields: ctx => [
    { type: 'info', kind: 'info', html: `Tienes <b>${especificos(ctx.S).length}</b> objetivos específicos: se sugiere una hipótesis específica por objetivo. Variables a incluir: <b>${esc(getD(ctx.S, '1').variable || '—')}</b>.` },
    { k: 'hipotesis_general', type: 'textarea', label: 'Hipótesis general (Hi)', req: true, rows: 3, ph: 'Ej: Los hábitos de estudio influyen significativamente en...' },
    { k: 'hipotesis_especificas', type: 'list', label: 'Hipótesis específicas', minItems: 1, add: 'Agregar hipótesis específica', ph: 'He: ...',
      badge: v => !filled(v) ? '' : (/[¿?]/.test(v) ? '<span class="badge r">Es pregunta</span>' : '<span class="badge g">Afirmación</span>') },
    { k: 'hipotesis_nula', type: 'textarea', label: 'Hipótesis nula (H₀) · opcional', rows: 2 }
  ],
  init(d, ctx) { if (!d.hipotesis_especificas) d.hipotesis_especificas = especificos(ctx.S).map(() => ''); if (!d.hipotesis_especificas.length) d.hipotesis_especificas = ['']; },
  validate(d, ctx) {
    const r = [];
    if (!isValid(ctx.S, '10')) r.push(E('Define primero el enfoque en el Módulo 10.'));
    const vw = studyVarWords(ctx.S);
    const REL = /(influ|relacion|asoci|increment|disminu|aument|reduc|mejor|afect|determin|incid|predic|explic|difer|impact|favorec|correl|depend|existe|genera|produc)/;
    const all = [['general', d.hipotesis_general], ...(d.hipotesis_especificas || []).map((h, i) => [`específica ${i + 1}`, h]), ...(filled(d.hipotesis_nula) ? [['nula', d.hipotesis_nula]] : [])];
    all.forEach(([n, h]) => {
      if (!filled(h)) return;
      if (/[¿?]/.test(h)) r.push(E(`La hipótesis ${n} debe ser una afirmación, no una pregunta.`));
      if (vw.length && !overlap(words(h), vw).length) r.push(E(`La hipótesis ${n} debe contener las variables del Módulo 1.`));
      if (!REL.test(norm(h))) r.push(W(`La hipótesis ${n} no expresa claramente una relación entre variables (influye, se relaciona, incrementa…).`));
    });
    const no = especificos(ctx.S).length, nh = (d.hipotesis_especificas || []).filter(filled).length;
    if (no && nh !== no) r.push(W(`Tienes ${no} objetivos específicos y ${nh} hipótesis específicas. Coherencia objetivo-hipótesis: se recomienda una por objetivo.`));
    return r;
  },
  beforeSave(d) { d.hipotesis_especificas = d.hipotesis_especificas.filter(filled); d.hipotesis_validadas = { general: d.hipotesis_general, especificas: d.hipotesis_especificas, nula: d.hipotesis_nula }; }
},
/* ---------------- FASE 3 ---------------- */
{
  id: '10', phase: 3, title: 'Enfoque de la Investigación',
  purpose: 'Definir la naturaleza de los datos y el razonamiento.',
  quote: 'Este módulo determina el camino de tu investigación. Elige sabiamente.',
  fields: [
    { k: 'enfoque', type: 'radio', label: 'Enfoque de la investigación', req: true, opts: ENFOQUES, cols: 3 },
    { type: 'html', html: () => '<div id="live_enfoque"></div>' },
    { k: 'justificacion_enfoque', type: 'textarea', label: 'Justificación del enfoque', req: true, min: 100, rows: 4 }
  ],
  live(ctx) {
    const e = ctx.d.enfoque; const el = ctx.$('#live_enfoque'); if (!el) return;
    const msg = {
      cualitativo: ['warning', 'Has seleccionado enfoque <strong>cualitativo</strong>. Se omitirán el Módulo 9 (Hipótesis), 18 (Variables) y 18.5 (Operacionalización), y se activará el Módulo 19 (Categorías).'],
      cuantitativo: ['info', 'Enfoque <strong>cuantitativo</strong> seleccionado. Se activarán los módulos de hipótesis (9), variables (18) y operacionalización (18.5); se omitirá el Módulo 19 (Categorías).'],
      mixto: ['info', 'Enfoque <strong>mixto</strong> seleccionado. Combinarás módulos cuantitativos (9, 18, 18.5) y cualitativos (19).']
    }[e];
    el.innerHTML = msg ? alertBox(msg[0], msg[1]) : '';
  },
  beforeSave(d, ctx) { d.enfoque_seleccionado = d.enfoque; ctx.S.enfoque = d.enfoque; }
},
{
  id: '11', phase: 3, title: 'Paradigma',
  purpose: 'Establecer la postura epistemológica.',
  fields: ctx => [
    { type: 'info', kind: 'info', html: `Enfoque seleccionado (Módulo 10): <b>${esc(cap(enfoqueOf(ctx.S) || '—'))}</b>` },
    { k: 'paradigma', type: 'radio', label: 'Paradigma', req: true, opts: PARADIGMAS, cols: 2 },
    { type: 'html', html: () => '<div id="live_parad"></div>' },
    { k: 'justificacion_extra', type: 'textarea', label: 'Justificación adicional de la combinación', req: true, min: 80, show: (d, c) => { const e = enfoqueOf(c.S); return !!(e && d.paradigma && !PARADIGMA_OK[e].includes(d.paradigma)); } }
  ],
  live(ctx) {
    const e = enfoqueOf(ctx.S), p = ctx.d.paradigma; const el = ctx.$('#live_parad'); if (!el) return;
    const tbl = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Enfoque \\ Paradigma</th>${PARADIGMAS.map(x => `<th>${x.l.split(' /')[0]}</th>`).join('')}</tr></thead><tbody>${ENFOQUES.map(en => `<tr class="${en.v === e ? 'hl' : ''}"><td>${en.l}</td>${PARADIGMAS.map(x => `<td style="text-align:center">${PARADIGMA_OK[en.v].includes(x.v) ? '<span class="badge g">Coherente</span>' : '<span class="badge o">Requiere justificar</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    let a = '';
    if (e && p) a = PARADIGMA_OK[e].includes(p) ? alertBox('success', `Paradigma <b>${esc(PARADIGMAS.find(x => x.v === p).l)}</b> coherente con el enfoque <b>${esc(e)}</b>.`) : alertBox('warning', `La combinación <b>${esc(PARADIGMAS.find(x => x.v === p).l)} + ${esc(cap(e))}</b> es poco habitual. No se bloquea, pero requiere una justificación adicional.`);
    el.innerHTML = a + tbl;
  },
  beforeSave(d) { d.paradigma_seleccionado = d.paradigma; }
},
{
  id: '12', phase: 3, title: 'Tipo de Investigación',
  purpose: 'Clasificar el estudio por finalidad, alcance, temporalidad y diseño.',
  fields: [
    { k: 'finalidad', type: 'radio', label: 'Finalidad', req: true, cols: 3, opts: [{ v: 'basica', l: 'Básica', d: 'Genera conocimiento teórico.' }, { v: 'aplicada', l: 'Aplicada', d: 'Resuelve problemas prácticos.' }, { v: 'desarrollo', l: 'Desarrollo tecnológico', d: 'Crea productos o procesos.' }] },
    { k: 'alcance', type: 'radio', label: 'Alcance', req: true, opts: ALCANCES },
    { k: 'temporalidad', type: 'radio', label: 'Temporalidad', req: true, cols: 2, opts: [{ v: 'transversal', l: 'Transversal', d: 'Un solo momento en el tiempo.' }, { v: 'longitudinal', l: 'Longitudinal', d: 'Varios momentos a lo largo del tiempo.' }] },
    { k: 'diseno_metodologico', type: 'radio', label: 'Diseño metodológico', req: true, cols: 3, opts: DISENOS },
    { type: 'html', html: () => '<div class="out"><h4>Tabla de coherencia alcance → diseño</h4><div id="live_coh12"></div></div>' }
  ],
  live(ctx) {
    const a = ctx.d.alcance, ds = ctx.d.diseno_metodologico; const el = ctx.$('#live_coh12'); if (!el) return;
    let al = '';
    if (a && ds) al = DISENO_SUG[a].includes(ds) ? alertBox('success', 'Combinación coherente.') : alertBox('warning', `Un alcance <b>${esc(a)}</b> sugiere un diseño <b>${DISENO_SUG[a].map(x => DISENOS.find(y => y.v === x).l).join(' o ')}</b>.`);
    el.innerHTML = al + `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Alcance</th><th>Diseño sugerido</th></tr></thead><tbody>${ALCANCES.map(x => `<tr class="${x.v === a ? 'hl' : ''}"><td>${x.l}</td><td>${DISENO_SUG[x.v].map(y => DISENOS.find(z => z.v === y).l).join(' / ')}</td></tr>`).join('')}</tbody></table></div>`;
  },
  validate(d) { return (d.alcance && d.diseno_metodologico && !DISENO_SUG[d.alcance].includes(d.diseno_metodologico)) ? [W(`El alcance ${esc(d.alcance)} no suele combinarse con un diseño ${esc(DISENOS.find(x => x.v === d.diseno_metodologico).l)}. Revisa la tabla de coherencia.`)] : []; },
  beforeSave(d) { d.clasificacion_tipo = { finalidad: d.finalidad, alcance: d.alcance, temporalidad: d.temporalidad, diseno: d.diseno_metodologico }; }
},
{
  id: '13', phase: 3, title: 'Nivel de Investigación',
  purpose: 'Determinar la profundidad del conocimiento a generar.',
  fields: ctx => [
    { type: 'info', kind: 'info', html: `Alcance definido en el Módulo 12: <b>${esc(cap(getD(ctx.S, '12').alcance || '—'))}</b>. El nivel debe ser coherente con él.` },
    { type: 'html', html: c => { const sug = (NIVELES.find(n => n.a === getD(c.S, '12').alcance) || {}).v; return `<div class="field" id="f_nivel" data-fk="nivel"><div class="label">Nivel de investigación<span class="req">*</span></div><div class="pyramid">${NIVELES.map((n, i) => `<label class="${n.v === sug ? 'sug' : ''}" style="width:${40 + i * 20}%"><input type="radio" name="nivel" data-path="nivel" value="${n.v}" ${c.d.nivel === n.v ? 'checked' : ''}>${n.l}<small>${n.d}</small></label>`).join('')}</div></div>`; } },
    { k: 'factible', type: 'checks', label: 'Factibilidad', minItems: 1, cols: 1, opts: [{ v: 'si', l: 'Confirmo que el nivel es alcanzable con el tiempo y los recursos disponibles' }] }
  ],
  validate(d, ctx) {
    const r = []; if (!d.nivel) r.push(E('Selecciona un nivel de investigación.', 'nivel'));
    const a = getD(ctx.S, '12').alcance; const n = NIVELES.find(x => x.v === d.nivel);
    if (n && a && n.a !== a) r.push(E(`Incoherencia: el nivel <b>${esc(n.l)}</b> no corresponde con el alcance <b>${esc(a)}</b> del Módulo 12. Ajusta uno de los dos.`, 'nivel'));
    return r;
  },
  beforeSave(d) { d.nivel_investigacion = d.nivel; }
},
{
  id: '14', phase: 3, title: 'Diseño según Objetivos',
  purpose: 'Alinear la estrategia con las metas planteadas.',
  fields: [
    { k: 'diseno_objetivo', type: 'radio', label: 'Diseño según objetivos', req: true, opts: Object.entries(DISENO_OBJ).map(([v, o]) => ({ v, l: o.l, d: o.d })) },
    { type: 'html', html: () => '<div id="live_d14"></div>' }
  ],
  verbs: S => [getD(S, '3').objetivo_general, ...especificos(S)].map(firstWord).filter(Boolean),
  match(v, o) { return o.verbs.includes(v) || o.lv.includes(bloomOf(v)); },
  live(ctx) {
    const o = DISENO_OBJ[ctx.d.diseno_objetivo]; const el = ctx.$('#live_d14'); if (!el) return;
    const vs = this.verbs(ctx.S);
    const chips = vs.map((v, i) => `<span class="badge ${o ? (this.match(v, o) ? 'g' : 'r') : ''}">${i === 0 ? 'OG' : 'OE' + i}: ${esc(v)}</span>`).join(' ');
    el.innerHTML = `<div class="out"><h4>Verbos de tus objetivos (Módulo 3)</h4><div style="display:flex;gap:6px;flex-wrap:wrap">${chips || '—'}</div></div>` + (o ? `<div class="out accent"><h4>Estrategia de diseño ${esc(o.l.toLowerCase())}</h4><div class="grid-3"><div><b style="font-size:13px">Estrategias</b><ul style="margin:6px 0 0 18px;font-size:13.5px">${o.est.map(x => `<li>${x}</li>`).join('')}</ul></div><div><b style="font-size:13px">Técnicas</b><ul style="margin:6px 0 0 18px;font-size:13.5px">${o.tec.map(x => `<li>${x}</li>`).join('')}</ul></div><div><b style="font-size:13px">Análisis</b><ul style="margin:6px 0 0 18px;font-size:13.5px">${o.an.map(x => `<li>${x}</li>`).join('')}</ul></div></div><p style="font-size:12.5px;color:var(--muted);margin-top:10px">Verbos afines: ${o.verbs.join(', ')}.</p></div>` : '');
  },
  validate(d, ctx) {
    const o = DISENO_OBJ[d.diseno_objetivo]; if (!o) return [];
    const vs = this.verbs(ctx.S);
    if (vs.length && !this.match(vs[0], o) && !vs.some(v => this.match(v, o))) return [E(`El diseño ${esc(o.l.toLowerCase())} no coincide con los verbos de tus objetivos (${vs.map(esc).join(', ')}). Elige otro diseño o ajusta tus objetivos.`)];
    if (vs.length && !this.match(vs[0], o)) return [W(`El verbo del objetivo general («${esc(vs[0])}») no es típico de un diseño ${esc(o.l.toLowerCase())}.`)];
    return [];
  },
  beforeSave(d) { const o = DISENO_OBJ[d.diseno_objetivo]; d.estrategia_diseno = { diseno: d.diseno_objetivo, estrategias: o.est, tecnicas: o.tec, analisis: o.an }; }
},
{
  id: '15', phase: 3, title: 'Método',
  purpose: 'Definir el camino lógico del razonamiento.',
  fields: [
    { k: 'metodo', type: 'checks', label: 'Método(s)', minItems: 1, maxItems: 2, hint: 'Mínimo 1, máximo 2.', opts: METODOS },
    { type: 'html', html: () => '<div id="live_m15"></div>' }
  ],
  live(ctx) {
    const m1 = getD(ctx.S, '1'); const c = { vari: `<b>${esc(m1.variable || 'tu variable')}</b>`, pob: `<b>${esc(m1.poblacion || 'tu población')}</b>`, lug: `<b>${esc(m1.lugar || 'tu contexto')}</b>` };
    const sel = (ctx.d.metodo || []).map(v => METODOS.find(x => x.v === v)).filter(Boolean);
    const el = ctx.$('#live_m15'); if (!el) return;
    el.innerHTML = sel.length ? `<div class="out accent"><h4>¿Cómo se aplicará?</h4>${sel.map(m => `<p style="margin-bottom:8px"><span class="badge n">${m.l}</span> ${m.x(c)}</p>`).join('')}</div>` : '';
    const max = (ctx.d.metodo || []).length >= 2;
    ctx.$$('[data-path="metodo"]').forEach(i => { i.disabled = max && !i.checked; });
  },
  beforeSave(d) { d.metodos_seleccionados = d.metodo; }
},
{
  id: '16', phase: 3, title: 'Modalidad',
  purpose: 'Especificar el entorno de recolección.',
  fields: [
    { k: 'modalidad', type: 'radio', label: 'Modalidad', req: true, opts: MODALIDADES },
    { type: 'html', html: () => '<div id="live_m16"></div>' }
  ],
  live(ctx) { const m = MODALIDADES.find(x => x.v === ctx.d.modalidad); const el = ctx.$('#live_m16'); if (el) el.innerHTML = m ? alertBox('info', `En el Módulo 17 se solicitará: <b>${m.pob}</b>.`) : ''; },
  beforeSave(d) { d.modalidad_estudio = d.modalidad; }
},
{
  id: '17', phase: 3, title: 'Población y Muestra',
  purpose: 'Definir el universo y la porción a estudiar.',
  fields: ctx => {
    const mod = MODALIDADES.find(x => x.v === getD(ctx.S, '16').modalidad) || MODALIDADES[0];
    return [
      { type: 'row', cols: 2, fields: [
        { k: 'poblacion_total', type: 'number', label: `${mod.pob} (total, N)`, req: true, minV: 1 },
        { k: 'unidad_analisis', type: 'text', label: 'Unidad de análisis', req: true, ph: mod.v === 'documental' ? 'Ej: artículos indexados' : 'Ej: estudiante inscrito' }
      ] },
      { k: 'tipo_muestreo', type: 'radio', label: 'Tipo de muestreo', req: true, cols: 3, opts: [{ v: 'probabilistico', l: 'Probabilístico', d: 'Todos tienen la misma probabilidad de ser elegidos.' }, { v: 'no_probabilistico', l: 'No probabilístico', d: 'Selección por criterios del investigador.' }, { v: 'censal', l: 'Censal', d: 'Se estudia a toda la población.' }] },
      { k: 'subtipo_muestreo', type: 'select', label: 'Subtipo de muestreo', req: true, refresh: true, show: d => !!d.tipo_muestreo, opts: c => SUBMUESTREO[c.d.tipo_muestreo] || [] },
      { type: 'html', show: d => d.tipo_muestreo === 'probabilistico', html: c => `<div class="out accent" id="calc17"><h4>Calculadora de tamaño de muestra (población finita)</h4><div class="grid-3">
        <div class="sub"><label>Nivel de confianza</label><select data-path="calc_z">${[['1.645', '90%'], ['1.96', '95%'], ['2.576', '99%']].map(([v, l]) => `<option value="${v}" ${String(c.d.calc_z || '1.96') === v ? 'selected' : ''}>${l} (Z = ${v})</option>`).join('')}</select></div>
        <div class="sub"><label>Margen de error (e)</label><select data-path="calc_e">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => `<option value="${v / 100}" ${String(c.d.calc_e || '0.05') === String(v / 100) ? 'selected' : ''}>${v}%</option>`).join('')}</select></div>
        <div class="sub"><label>Proporción esperada (p)</label><input type="number" step="0.05" min="0.05" max="0.95" data-path="calc_p" value="${esc(c.d.calc_p || '0.5')}"></div></div>
        <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap"><div class="mono" id="live_n">—</div><button class="btn btn-sm btn-primary" data-act="useN">Usar este tamaño</button></div></div>` },
      { k: 'tamano_muestra', type: 'number', label: 'Tamaño de muestra (n)', req: true, minV: 1 }
    ];
  },
  calcN(d) {
    const N = parseFloat(d.poblacion_total), Z = parseFloat(d.calc_z || 1.96), e = parseFloat(d.calc_e || 0.05), p = parseFloat(d.calc_p || 0.5);
    if (!(N > 0) || !(p > 0 && p < 1)) return null; const q = 1 - p;
    return Math.ceil((N * Z * Z * p * q) / (e * e * (N - 1) + Z * Z * p * q));
  },
  live(ctx) {
    const n = this.calcN(ctx.d); const el = ctx.$('#live_n');
    if (el) el.innerHTML = n ? `n = N·Z²·p·q / (e²(N−1) + Z²·p·q) = <b style="font-size:16px;color:var(--green-ink)">${n}</b>` : 'Ingresa la población total (N).';
    if (ctx.d.tipo_muestreo === 'censal' && ctx.d.poblacion_total && String(ctx.d.tamano_muestra) !== String(ctx.d.poblacion_total)) {
      ctx.d.tamano_muestra = ctx.d.poblacion_total; const i = ctx.$('[data-path="tamano_muestra"]'); if (i) i.value = ctx.d.poblacion_total;
    }
  },
  actions: { useN(ctx) { const n = MODULES.find(m => m.id === '17').calcN(ctx.d); if (!n) return; ctx.d.tamano_muestra = n; const i = ctx.$('[data-path="tamano_muestra"]'); if (i) { i.value = n; i.classList.add('shake'); setTimeout(() => i.classList.remove('shake'), 500); } ctx.changed(); } },
  validate(d) {
    const r = []; const N = +d.poblacion_total, n = +d.tamano_muestra;
    if (n && N && n > N) r.push(E('El tamaño de muestra no puede ser mayor que la población total.', 'tamano_muestra'));
    if (d.tipo_muestreo === 'censal' && n !== N) r.push(E('En un muestreo censal, n debe ser igual a N.', 'tamano_muestra'));
    return r;
  },
  beforeSave(d) { d.parametros_muestreo = { N: d.poblacion_total, unidad: d.unidad_analisis, tipo: d.tipo_muestreo, subtipo: d.subtipo_muestreo, n: d.tamano_muestra }; }
},
/* ---------------- FASE 4 ---------------- */
{
  id: '18', phase: 4, title: 'Variables', conditional: 'Cuanti/Mixto',
  purpose: 'Identificar y clasificar los elementos a medir.',
  quote: 'Las variables son los elementos que vas a medir, comparar o relacionar.',
  applies: S => enfoqueOf(S) !== 'cualitativo',
  fields: ctx => [
    { type: 'info', kind: 'info', show: () => ['correlacional', 'explicativo'].includes(getD(ctx.S, '13').nivel), html: `Tu nivel es <b>${esc(getD(ctx.S, '13').nivel || '')}</b>: necesitas al menos una variable <b>independiente</b> y una <b>dependiente</b>.` },
    { k: 'variables', type: 'rep', label: 'Variables de tu investigación', minItems: 2, add: 'Agregar variable', hint: 'Mínimo 2.',
      title: (it, i) => { const bad = (it.naturaleza === 'cualitativa' && ['intervalo', 'razon'].includes(it.escala)) || (it.naturaleza === 'cuantitativa' && it.escala === 'nominal'); return `Variable ${i + 1}${it.nombre ? ` · ${esc(it.nombre)}` : ''} ${it.escala && it.naturaleza ? (bad ? '<span class="badge r">Escala incoherente</span>' : '<span class="badge g">Escala coherente</span>') : ''}`; },
      fields: [
        { k: 'nombre', type: 'text', label: 'Nombre de la variable', req: true, full: true },
        { k: 'naturaleza', type: 'select', label: 'Naturaleza', req: true, opts: [{ v: 'cuantitativa', l: 'Cuantitativa' }, { v: 'cualitativa', l: 'Cualitativa' }] },
        { k: 'causal', type: 'select', label: 'Función causal', req: true, opts: [{ v: 'independiente', l: 'Independiente (causa)' }, { v: 'dependiente', l: 'Dependiente (efecto)' }, { v: 'interviniente', l: 'Interviniente' }, { v: 'extrana', l: 'Extraña' }] },
        { k: 'escala', type: 'select', label: 'Escala de medición', req: true, opts: [{ v: 'nominal', l: 'Nominal' }, { v: 'ordinal', l: 'Ordinal' }, { v: 'intervalo', l: 'Intervalo' }, { v: 'razon', l: 'Razón' }] }
      ] }
  ],
  init(d, ctx) { if (!d.variables) d.variables = [{ nombre: cap(getD(ctx.S, '1').variable || '') }, {}]; },
  validate(d, ctx) {
    const r = []; const v = d.variables || [];
    v.forEach((x, i) => {
      if (x.naturaleza === 'cualitativa' && ['intervalo', 'razon'].includes(x.escala)) r.push(E(`La variable «${esc(x.nombre)}» es cualitativa: su escala debe ser nominal u ordinal.`));
      if (x.naturaleza === 'cuantitativa' && x.escala === 'nominal') r.push(E(`La variable «${esc(x.nombre)}» es cuantitativa: su escala debe ser ordinal, de intervalo o de razón.`));
    });
    const nv = getD(ctx.S, '13').nivel;
    if (['correlacional', 'explicativo'].includes(nv)) {
      if (!v.some(x => x.causal === 'independiente')) r.push(E('Tu diseño es correlacional/explicativo: incluye al menos una variable independiente.'));
      if (!v.some(x => x.causal === 'dependiente')) r.push(E('Tu diseño es correlacional/explicativo: incluye al menos una variable dependiente.'));
    }
    return r;
  },
  beforeSave(d) { d.lista_variables = d.variables; }
},
{
  id: '18_5', num: '18.5', phase: 4, title: 'Operacionalización de Variables', conditional: 'Crítico',
  purpose: 'Descomponer variables abstractas en elementos medibles.',
  quote: 'Llegaste al punto donde muchos investigadores se pierden. Tienes tu variable definida, pero ¿cómo la mides? La operacionalización es el puente entre lo abstracto y lo medible.',
  applies: S => enfoqueOf(S) !== 'cualitativo',
  fields: ctx => {
    const vars = getD(ctx.S, '18').variables || [];
    const sel = Math.min(+ctx.d._sel || 0, Math.max(vars.length - 1, 0));
    const ops = (ctx.d.ops = ctx.d.ops || {});
    const op = (ops[sel] = ops[sel] || { dims: [] });
    const P = `ops.${sel}.dims`;
    const status = vi => { const o = ops[vi]; const dims = (o && o.dims) || []; const ok = dims.length >= 2 && dims.every(d => (d.inds || []).length >= 2 && d.inds.every(i => (i.items || []).filter(x => filled(x.texto)).length >= 2)); return ok; };
    const html = c => `
      <div class="field"><div class="label">Selecciona la variable a operacionalizar</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${vars.map((v, i) => `<button class="btn btn-sm ${i === sel ? 'btn-dark' : 'btn-ghost'}" data-act="selVar" data-arg="${i}">${status(i) ? ICON.check : ''} ${esc(v.nombre || 'Variable ' + (i + 1))}</button>`).join('') || '<span class="badge o">Completa el Módulo 18</span>'}</div></div>
      <h3 class="sec">Dimensiones <span class="badge g">mín. 2</span></h3>
      <div class="rep-items">${op.dims.map((d, di) => `
        <div class="rep-item" data-node="${P}.${di}">
          <div class="rep-head"><b>Dimensión ${di + 1}</b><button class="icon-btn" title="Eliminar dimensión" data-act="pathDel" data-path="${P}" data-i="${di}">${ICON.x}</button></div>
          <div class="grid-2">
            <div class="sub"><label>Nombre de la dimensión</label><input type="text" data-path="${P}.${di}.nombre" value="${esc(d.nombre)}"></div>
            <div class="sub"><label>Justificación: ¿por qué es parte de la variable?</label><input type="text" data-path="${P}.${di}.justificacion" value="${esc(d.justificacion)}"></div>
          </div>
          <div class="sub"><label>Definición conceptual</label><textarea rows="2" data-path="${P}.${di}.definicion">${esc(d.definicion)}</textarea></div>
          <div style="padding-left:14px;border-left:3px solid var(--mint);margin:6px 0 12px">
            ${(d.inds || []).map((ind, ii) => `
            <div class="rep-item" style="background:#fff;margin-bottom:10px" data-node="${P}.${di}.inds.${ii}">
              <div class="rep-head"><b style="color:var(--blue)">Indicador ${di + 1}.${ii + 1}</b><button class="icon-btn" data-act="pathDel" data-path="${P}.${di}.inds" data-i="${ii}">${ICON.x}</button></div>
              <div class="grid-3">
                <div class="sub"><label>Nombre del indicador</label><input type="text" data-path="${P}.${di}.inds.${ii}.nombre" value="${esc(ind.nombre)}"></div>
                <div class="sub"><label>Tipo</label><select data-path="${P}.${di}.inds.${ii}.tipo"><option value="">Tipo…</option><option value="cuantitativo" ${ind.tipo === 'cuantitativo' ? 'selected' : ''}>Cuantitativo</option><option value="cualitativo" ${ind.tipo === 'cualitativo' ? 'selected' : ''}>Cualitativo</option></select></div>
                <div class="sub"><label>Unidad de medida</label><input type="text" placeholder="Escala 1-5, minutos, %" data-path="${P}.${di}.inds.${ii}.unidad" value="${esc(ind.unidad)}"></div>
              </div>
              <div class="sub"><label>Definición operativa: ¿cómo se mide?</label><input type="text" data-path="${P}.${di}.inds.${ii}.definicion" value="${esc(ind.definicion)}"></div>
              <div class="sub"><label>Ítems (mín. 2, sin dobles negaciones)</label>
                <div class="list-items">${(ind.items || []).map((it, ti) => `<div class="list-row"><span class="idx">${ti + 1}</span><input type="text" placeholder="Texto del ítem" data-path="${P}.${di}.inds.${ii}.items.${ti}.texto" value="${esc(it.texto)}"><select style="max-width:190px" data-path="${P}.${di}.inds.${ii}.items.${ti}.formato">${Object.entries(FORMATOS).map(([k, l]) => `<option value="${k}" ${it.formato === k ? 'selected' : ''}>${l}</option>`).join('')}</select><button class="icon-btn" data-act="pathDel" data-path="${P}.${di}.inds.${ii}.items" data-i="${ti}">${ICON.x}</button></div>`).join('')}</div>
                <button class="btn btn-sm btn-soft" data-act="pathAdd" data-path="${P}.${di}.inds.${ii}.items" data-tpl='{"texto":"","formato":"likert5"}'>${ICON.plus} Agregar ítem</button>
              </div>
            </div>`).join('')}
            <button class="btn btn-sm btn-ghost" data-act="pathAdd" data-path="${P}.${di}.inds" data-tpl='{"nombre":"","tipo":"","definicion":"","unidad":"","items":[{"texto":"","formato":"likert5"},{"texto":"","formato":"likert5"}]}'>${ICON.plus} Agregar indicador a esta dimensión</button>
          </div>
        </div>`).join('') || '<div class="empty">Aún no hay dimensiones para esta variable.</div>'}</div>
      <button class="btn btn-soft" data-act="pathAdd" data-path="${P}" data-tpl='{"nombre":"","definicion":"","justificacion":"","inds":[]}'>${ICON.plus} Agregar dimensión</button>
      <div class="divider"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><h3 class="sec" style="margin:0">Matriz de operacionalización</h3>
      <div style="display:flex;gap:8px"><button class="btn btn-sm btn-ghost" data-act="xls">${ICON.dl} Excel</button><button class="btn btn-sm btn-ghost" data-act="doc">${ICON.dl} Word</button></div></div>
      <div id="live_matriz185" style="margin-top:12px"></div>`;
    return [{ type: 'html', html }];
  },
  liveDebounce: 400,
  live(ctx) { const el = ctx.$('#live_matriz185'); if (el) el.innerHTML = matrizTable(matrizRows(ctx.S)); },
  actions: {
    selVar(ctx, b) { ctx.d._sel = +b.dataset.arg; ctx.rerender(); },
    xls(ctx) { downloadFile('matriz_operacionalizacion.xls', `<html><head><meta charset="UTF-8"></head><body>${matrizTable(matrizRows(ctx.S))}</body></html>`, 'application/vnd.ms-excel'); },
    doc(ctx) { downloadFile('matriz_operacionalizacion.doc', wordWrap('Matriz de operacionalización', `<h1>Matriz de operacionalización</h1>${matrizTable(matrizRows(ctx.S))}`), 'application/msword'); }
  },
  validate(d, ctx) {
    if (!(getD(ctx.S, '18').variables || []).length) return [E('Completa primero el Módulo 18 (Variables).')];
    return operacionalizacionErrores(ctx.S).slice(0, 10).map(m => E(esc(m)));
  },
  beforeSave(d, ctx) { d.matriz_operacionalizacion = matrizRows(ctx.S); }
},
{
  id: '19', phase: 4, title: 'Categorías', conditional: 'Cuali/Mixto',
  purpose: 'Definir unidades de análisis no numéricas.',
  applies: S => enfoqueOf(S) !== 'cuantitativo',
  fields: [
    { k: 'categorias', type: 'rep', label: 'Categorías de análisis', minItems: 3, add: 'Agregar categoría', hint: 'Mínimo 3. Deben cubrir el fenómeno y ser mutuamente excluyentes.',
      title: (it, i) => `Categoría ${i + 1}${it.nombre ? ` · ${esc(it.nombre)}` : ''}`,
      fields: [
        { k: 'nombre', type: 'text', label: 'Nombre de la categoría', req: true },
        { k: 'dimension', type: 'text', label: 'Dimensión', req: true },
        { k: 'subcategoria', type: 'text', label: 'Subcategoría', req: true },
        { k: 'indicador', type: 'text', label: 'Indicador cualitativo', req: true }
      ] }
  ],
  init(d) { if (!d.categorias) d.categorias = [{}, {}, {}]; },
  validate(d) {
    const r = []; const seen = {};
    (d.categorias || []).forEach(c => { const n = norm(c.nombre).trim(); if (n) { if (seen[n]) r.push(E(`La categoría «${esc(c.nombre)}» está repetida: las categorías deben ser mutuamente excluyentes.`)); seen[n] = 1; } });
    return r;
  },
  beforeSave(d) { d.esquema_categorias = d.categorias; }
},
{
  id: '20', phase: 4, title: 'Indicadores', conditional: 'Transversal',
  purpose: 'Consolidar las señales de medición.',
  init(d, ctx) {
    const src = indicadoresFuente(ctx.S); const prev = {}; (d.indicadores || []).forEach(x => prev[x.src] = x);
    d.indicadores = src.map(s => ({ ...s, ...(prev[s.src] || {}), origen: s.origen }));
  },
  fields: ctx => {
    const list = ctx.d.indicadores || [];
    if (!list.length) return [{ type: 'info', kind: 'warning', html: 'No hay indicadores para consolidar. Completa el Módulo 18.5 (cuantitativo) o el Módulo 19 (cualitativo).' }];
    const sel = (p, k, opts, v) => `<select data-path="${p}.${k}"><option value="">Selecciona…</option>${opts.map(o => `<option ${v === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
    return [{ type: 'info', kind: 'info', html: `Revisa los <b>${list.length}</b> indicadores generados y asigna sus propiedades. Evita términos ambiguos (bueno, adecuado, varios…).` },
      { type: 'html', html: () => `<div class="rep-items">${list.map((x, i) => { const p = `indicadores.${i}`; return `<div class="rep-item"><div class="rep-head"><b>${i + 1}. <span class="badge b">${esc(x.origen)}</span></b></div>
      <div class="grid-2"><div class="sub"><label>Indicador</label><input type="text" data-path="${p}.nombre" value="${esc(x.nombre)}"></div><div class="sub"><label>Descripción</label><input type="text" data-path="${p}.descripcion" value="${esc(x.descripcion)}"></div></div>
      <div class="grid-3"><div class="sub"><label>Persistencia temporal</label>${sel(p, 'persistencia', ['Estable en el tiempo', 'Variable en el tiempo', 'Puntual / coyuntural'], x.persistencia)}</div>
      <div class="sub"><label>Relación causal</label>${sel(p, 'causalidad', ['Causa', 'Efecto', 'Mediadora', 'Sin relación causal directa'], x.causalidad)}</div>
      <div class="sub"><label>Capacidad de exposición</label>${sel(p, 'exposicion', ['Alta', 'Media', 'Baja'], x.exposicion)}</div></div>
      <div class="sub check"><label><input type="checkbox" data-path="${p}.observable" ${x.observable ? 'checked' : ''}> Es observable, medible y no ambiguo</label></div></div>`; }).join('')}</div>` }];
  },
  validate(d) {
    const r = []; const l = d.indicadores || [];
    if (!l.length) return [E('No hay indicadores. Completa el Módulo 18.5 o el 19.')];
    l.forEach((x, i) => {
      const n = `Indicador ${i + 1} («${esc(trunc(x.nombre, 40))}»)`;
      if (!filled(x.nombre)) r.push(E(`El indicador ${i + 1} no tiene nombre.`));
      if (!x.persistencia || !x.causalidad || !x.exposicion) r.push(E(`${n}: asigna persistencia, causalidad y capacidad de exposición.`));
      if (!x.observable) r.push(E(`${n}: confirma que es observable.`));
      const amb = words(x.nombre).concat(norm(x.nombre).split(/\W+/)).filter(w => AMBIGUOS.includes(w));
      if (amb.length) r.push(E(`${n} es ambiguo: evita «${[...new Set(amb)].join('», «')}».`));
    });
    return r.slice(0, 12);
  },
  beforeSave(d) { d.lista_maestra_indicadores = d.indicadores; }
},
{
  id: '21', phase: 4, title: 'Técnicas, Instrumentos y Confiabilidad',
  purpose: 'Seleccionar y validar la herramienta de recolección.',
  quote: 'Selecciona tu técnica, construye tu instrumento y valida su confiabilidad con el Omega de McDonald.',
  fields: [
    { type: 'row', cols: 2, fields: [
      { k: 'tecnica', type: 'select', label: 'Técnica de recolección', req: true, opts: Object.keys(TECNICAS) },
      { k: 'instrumento', type: 'select', label: 'Instrumento', req: true, refresh: true, opts: c => TECNICAS[c.d.tecnica] || Object.values(TECNICAS).flat() }
    ] },
    { k: 'validacion', type: 'checks', label: 'Opciones de validación', minItems: 1, opts: [{ v: 'expertos', l: 'Juicio de expertos', d: 'Validez de contenido por especialistas.' }, { v: 'piloto', l: 'Prueba piloto', d: 'Aplicación a una muestra pequeña.' }, { v: 'constructo', l: 'Validez de constructo', d: 'Análisis factorial (AFE / AFC).' }] },
    { k: 'num_expertos', type: 'number', label: 'Número de expertos', hint: 'Se recomiendan entre 3 y 10 jueces.', minV: 1, req: true, show: d => (d.validacion || []).includes('expertos') },
    { type: 'html', html: c => `<div class="divider"></div><h3 class="sec">📊 Calculadora Omega de McDonald (ω)</h3>
      ${alertBox('info', '<strong>¿Por qué Omega y no solo Alfa de Cronbach?</strong> El Omega de McDonald es más preciso cuando los ítems tienen diferentes cargas factoriales (Dunn et al., 2014; Hayes & Coutts, 2020). Es el estándar contemporáneo en investigación social.')}` },
    { k: 'omega_metodo', type: 'radio', label: 'Método de entrada de datos', cols: 1, opts: [
      { v: 'cargas', l: 'Opción C · Cargas factoriales (recomendado)', d: 'Ingresa directamente las cargas obtenidas en SPSS, R o JASP.' },
      { v: 'correlaciones', l: 'Opción A · Matriz de correlaciones', d: 'YUMM IA estima las cargas con análisis de ejes principales (1 factor).' },
      { v: 'brutos', l: 'Opción B · Datos brutos', d: 'Una fila por participante, un ítem por columna. Calcula α y ω.' }] },
    { k: 'omega_cargas', type: 'textarea', label: 'Cargas factoriales (una por línea, entre −1 y 1)', ph: '0.75\n0.68\n0.72\n0.80\n0.65', rows: 6, mono: true, show: d => (d.omega_metodo || 'cargas') === 'cargas', hint: 'Ejemplo: si tu ítem 1 tiene carga 0.75 y el ítem 2 tiene 0.68, ingrésalos uno por línea.' },
    { k: 'omega_corr', type: 'textarea', label: 'Matriz de correlaciones (valores separados por comas, una fila por línea)', ph: '1.00, 0.65, 0.58, 0.72\n0.65, 1.00, 0.61, 0.68\n0.58, 0.61, 1.00, 0.55\n0.72, 0.68, 0.55, 1.00', rows: 6, mono: true, show: d => d.omega_metodo === 'correlaciones' },
    { k: 'omega_brutos', type: 'textarea', label: 'Datos brutos (filas = participantes, columnas = ítems)', ph: '4, 5, 4, 3, 5\n3, 4, 4, 3, 4\n5, 5, 4, 4, 5\n2, 3, 2, 2, 3\n4, 4, 5, 4, 4', rows: 8, mono: true, show: d => d.omega_metodo === 'brutos' },
    { type: 'html', html: () => `<button class="btn btn-orange" data-act="omega">Calcular Omega de McDonald</button><div id="omega_res"></div>` }
  ],
  init(d) { if (!d.omega_metodo) d.omega_metodo = 'cargas'; },
  onRender(ctx) { if (ctx.d.omega) renderOmega(ctx, ctx.d.omega); },
  actions: {
    omega(ctx) {
      const d = ctx.d, m = d.omega_metodo || 'cargas'; const box = ctx.$('#omega_res');
      const fail = msg => { box.innerHTML = alertBox('error', msg); box.classList.add('shake'); setTimeout(() => box.classList.remove('shake'), 500); };
      let l, extra = {};
      if (m === 'cargas') {
        l = OMEGA.parseLines(d.omega_cargas).map(x => parseFloat(x.replace(',', '.'))).filter(n => !isNaN(n));
        if (l.length < 3) return fail('Necesitas al menos 3 cargas factoriales.');
        if (l.some(c => c < -1 || c > 1)) return fail('Las cargas factoriales deben estar entre −1 y 1.');
      } else if (m === 'correlaciones') {
        const R = OMEGA.parseLines(d.omega_corr).map(OMEGA.parseRow);
        const k = R.length;
        if (k < 3) return fail('Necesitas una matriz de al menos 3 × 3.');
        if (R.some(r => r.length !== k)) return fail('La matriz debe ser cuadrada (mismo número de filas y columnas).');
        if (R.some((r, i) => Math.abs(r[i] - 1) > 0.01)) return fail('La diagonal de la matriz de correlaciones debe ser 1.');
        if (R.some((r, i) => r.some((v, j) => Math.abs(v - R[j][i]) > 0.01 || v < -1 || v > 1))) return fail('La matriz debe ser simétrica con valores entre −1 y 1.');
        l = OMEGA.paf(R);
        let s = 0, c = 0; for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) { s += R[i][j]; c++; }
        const rb = s / c; extra.alpha = (k * rb) / (1 + (k - 1) * rb); extra.alphaLabel = 'α estandarizado';
      } else {
        const X = OMEGA.parseLines(d.omega_brutos).map(OMEGA.parseRow).filter(r => r.length);
        if (!X.length || X[0].length < 3) return fail('Necesitas al menos 3 ítems (columnas).');
        if (X.some(r => r.length !== X[0].length)) return fail('Todas las filas deben tener el mismo número de ítems.');
        if (X.length < 5) return fail('Ingresa datos de al menos 5 participantes.');
        const c = OMEGA.corr(X);
        if (c.sd.some(s => !s)) return fail('Hay ítems sin variabilidad (todas las respuestas iguales).');
        l = OMEGA.paf(c.R); extra.alpha = c.alphaRaw; extra.alphaLabel = 'α de Cronbach'; extra.n = X.length;
      }
      const r = OMEGA.fromLoadings(l);
      const it = OMEGA.interpret(r.omega);
      const om = { valor: r.omega, alfa: extra.alpha ?? r.alpha, alfa_label: extra.alphaLabel || 'α estimado (modelo)', cargas: l.map(x => +x.toFixed(3)), interpretacion: it.t, metodo: m, n_items: l.length, n: extra.n || null, sum: r.sum, sum2: r.sum2, err: r.err };
      const prob = l.map((c, i) => ({ i: i + 1, c })).filter(x => x.c < 0.40);
      om.recomendacion = prob.length ? `Ítems con carga baja (< 0.40): ${prob.map(p => `Ítem ${p.i} (λ = ${p.c.toFixed(2)})`).join(', ')}. Considera eliminarlos o reformularlos.` : (r.omega < 0.70 ? 'Revisa la redacción de los ítems y la unidimensionalidad del instrumento.' : 'Todos los ítems presentan cargas adecuadas (≥ 0.40).');
      d.omega = om; ctx.changed(); renderOmega(ctx, om, true);
    }
  },
  validate(d, ctx) {
    const r = []; const enf = enfoqueOf(ctx.S);
    const need = enf !== 'cualitativo' && !['Entrevista', 'Focus Group', 'Recopilación documental'].includes(d.tecnica);
    if (d.tecnica && d.instrumento && !(TECNICAS[d.tecnica] || []).includes(d.instrumento)) r.push(E(`El instrumento «${esc(d.instrumento)}» no corresponde a la técnica «${esc(d.tecnica)}».`, 'instrumento'));
    if (need && !d.omega) r.push(E('Calcula el Omega de McDonald antes de guardar (mínimo 3 ítems).'));
    if (d.omega && d.omega.valor < 0.70) r.push(W(`ω = ${d.omega.valor.toFixed(3)} (< 0.70): revisa los ítems de tu instrumento antes de aplicarlo.`));
    return r;
  },
  beforeSave(d) { d.validacion_instrumento = d.omega ? { omega: d.omega.valor, interpretacion: d.omega.interpretacion, recomendacion: d.omega.recomendacion } : null; }
},
/* ---------------- FASE 5 ---------------- */
{
  id: '22', phase: 5, title: 'Recolección de Datos',
  purpose: 'Documentar el proceso de campo en 9 pasos.',
  init(d) { if (!d.pasos) d.pasos = PASOS.map(() => ({ hecho: false, fecha: '', obs: '', evidencia: '' })); },
  fields: ctx => [
    { type: 'info', kind: 'info', html: 'Marca cada paso al completarlo. Los pasos <b>5 (Recolección)</b> y <b>7 (Validación)</b> requieren evidencia (texto o descripción del archivo).' },
    { type: 'html', html: c => c.d.pasos.map((p, i) => `<div class="step-card ${p.hecho ? 'done' : ''}" style="--i:${i}" data-step="${i}">
      <button class="sn" data-act="step" data-arg="${i}" title="Marcar paso" aria-pressed="${p.hecho}">${p.hecho ? ICON.check.replace('<svg', '<svg width="18" height="18"') : i + 1}</button>
      <div><div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:8px"><b>${PASOS[i]}</b>${[4, 6].includes(i) ? '<span class="crit">● Requiere evidencia</span>' : ''}</div>
      <div class="grid-2" style="grid-template-columns:180px 1fr"><div class="sub"><label>Fecha</label><input type="date" data-path="pasos.${i}.fecha" value="${esc(p.fecha)}"></div><div class="sub"><label>Observaciones</label><input type="text" data-path="pasos.${i}.obs" value="${esc(p.obs)}"></div></div>
      ${[4, 6].includes(i) ? `<div class="sub"><label>Evidencia</label><textarea rows="2" data-path="pasos.${i}.evidencia" placeholder="Describe la evidencia o el archivo (ej. 120 cuestionarios aplicados, base_datos.xlsx)">${esc(p.evidencia)}</textarea></div>` : ''}</div></div>`).join('') },
    { type: 'html', html: () => '<div class="out"><h4>Bitácora de campo cronológica</h4><div id="live_bitacora"></div></div>' }
  ],
  live(ctx) {
    const el = ctx.$('#live_bitacora'); if (!el) return;
    const l = ctx.d.pasos.map((p, i) => ({ ...p, i })).filter(p => p.hecho || p.fecha).sort((a, b) => (a.fecha || '9999').localeCompare(b.fecha || '9999'));
    el.innerHTML = l.length ? `<div class="timeline">${l.map((p, k) => `<div class="tl-item ${p.hecho ? '' : 'pending'}" style="--i:${k}"><b>${p.i + 1}. ${PASOS[p.i]}</b><small>${p.fecha ? new Date(p.fecha + 'T12:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : 'sin fecha'}</small>${p.obs ? `<p>${esc(p.obs)}</p>` : ''}</div>`).join('')}</div>` : '<div class="empty">La bitácora se genera al registrar fechas y completar pasos.</div>';
  },
  actions: { step(ctx, b) { const i = +b.dataset.arg; const p = ctx.d.pasos[i]; p.hecho = !p.hecho; if (p.hecho && !p.fecha) p.fecha = new Date().toISOString().slice(0, 10); const card = b.closest('.step-card'); card.classList.toggle('done', p.hecho); b.innerHTML = p.hecho ? ICON.check.replace('<svg', '<svg width="18" height="18"') : i + 1; const f = card.querySelector('input[type=date]'); if (f) f.value = p.fecha; ctx.changed(); } },
  validate(d) {
    const r = [];
    [4, 6].forEach(i => { if (String(d.pasos[i].evidencia || '').trim().length < 10) r.push(E(`El paso ${i + 1} (${PASOS[i]}) requiere evidencia (mín. 10 caracteres).`)); });
    const pend = d.pasos.map((p, i) => p.hecho ? null : i + 1).filter(Boolean);
    if (pend.length) r.push(W(`Pasos aún no marcados como completados: ${pend.join(', ')}.`));
    return r;
  },
  beforeSave(d) { d.bitacora_recoleccion = d.pasos.map((p, i) => ({ paso: PASOS[i], ...p })); }
},
{
  id: '23', phase: 5, title: 'Análisis de Datos',
  purpose: 'Definir la estrategia de procesamiento de la información.',
  fields: ctx => {
    const e = enfoqueOf(ctx.S) || 'mixto';
    const opts = e === 'mixto' ? [...ANALISIS.cuantitativo, ...ANALISIS.cualitativo, 'Triangulación / integración mixta'] : ANALISIS[e];
    return [
      { type: 'info', kind: 'info', html: `Enfoque: <b>${esc(cap(e))}</b>. Las opciones de análisis se filtran según tu enfoque.` },
      { type: 'row', cols: 2, fields: [
        { k: 'tipo_analisis', type: 'select', label: 'Tipo de análisis', req: true, opts },
        { k: 'software_utilizado', type: 'select', label: 'Software utilizado', req: true, opts: SOFTWARE }
      ] },
      { k: 'tipo_complementario', type: 'select', label: 'Análisis complementario (componente cualitativo/cuantitativo)', show: () => e === 'mixto', opts },
      { type: 'html', html: () => '<div id="live_tests"></div>' }
    ];
  },
  live(ctx) {
    const el = ctx.$('#live_tests'); if (!el) return;
    if (enfoqueOf(ctx.S) === 'cualitativo') { el.innerHTML = alertBox('info', 'Para el análisis cualitativo, define un libro de códigos a partir de tus categorías (Módulo 19) y documenta la saturación teórica.'); return; }
    const v = getD(ctx.S, '18').variables || [];
    const iv = v.filter(x => x.causal === 'independiente'), dv = v.filter(x => x.causal === 'dependiente');
    let rows = '';
    if (iv.length && dv.length) iv.forEach(a => dv.forEach(b => { rows += `<tr><td>${esc(a.nombre)} <span class="badge">${esc(a.escala)}</span></td><td>${esc(b.nombre)} <span class="badge">${esc(b.escala)}</span></td><td><b>${pruebaSugerida(a, b)}</b></td></tr>`; }));
    const desc = v.map(x => `<tr><td>${esc(x.nombre)}</td><td>${esc(x.escala)}</td><td>${{ nominal: 'Frecuencias, porcentajes, moda', ordinal: 'Mediana, rango intercuartil, frecuencias', intervalo: 'Media, desviación estándar', razon: 'Media, desviación estándar, coeficiente de variación' }[x.escala] || '—'}</td></tr>`).join('');
    el.innerHTML = `<div class="out accent"><h4>Pruebas estadísticas sugeridas (según escalas del Módulo 18)</h4>${rows ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Variable independiente</th><th>Variable dependiente</th><th>Prueba sugerida</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<p style="font-size:13px;color:var(--muted)">Define variables independientes y dependientes en el Módulo 18 para sugerir pruebas inferenciales.</p>'}
      ${desc ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Variable</th><th>Escala</th><th>Estadísticos descriptivos</th></tr></thead><tbody>${desc}</tbody></table></div>` : ''}
      <p style="font-size:12.5px;color:var(--muted)">Verifica la normalidad (Shapiro-Wilk / Kolmogorov-Smirnov) para decidir entre pruebas paramétricas y no paramétricas.</p></div>`;
  },
  validate(d, ctx) {
    const e = enfoqueOf(ctx.S);
    if (e === 'cuantitativo' && ANALISIS.cualitativo.includes(d.tipo_analisis)) return [E('Incoherencia: un enfoque cuantitativo requiere análisis estadístico.', 'tipo_analisis')];
    if (e === 'cualitativo' && ANALISIS.cuantitativo.includes(d.tipo_analisis)) return [E('Incoherencia: un enfoque cualitativo requiere análisis interpretativo (contenido, discurso, temático…).', 'tipo_analisis')];
    return [];
  },
  beforeSave(d) { d.plan_analisis = { tipo: d.tipo_analisis, complementario: d.tipo_complementario, software: d.software_utilizado }; }
},
{
  id: '24', phase: 5, title: 'Resultados',
  purpose: 'Estructurar la presentación de hallazgos.',
  fields: ctx => {
    const oe = especificos(ctx.S);
    return [
      { type: 'info', kind: 'info', html: `<strong>Pregunta de investigación:</strong> ${pd(getD(ctx.S, '2').pregunta_principal)}` },
      { type: 'html', html: () => '<div class="out"><h4>Cobertura de objetivos específicos</h4><div id="live_cov"></div></div>' },
      { k: 'hallazgos', type: 'rep', label: 'Hallazgos', minItems: 1, add: 'Agregar hallazgo',
        title: (it, i) => `Hallazgo ${i + 1} ${it.objetivo !== undefined && it.objetivo !== '' ? `<span class="badge g">OE${+it.objetivo + 1}</span>` : ''}`,
        fields: [
          { k: 'objetivo', type: 'select', label: 'Objetivo específico asociado', req: true, full: true, opts: oe.map((o, i) => ({ v: String(i), l: `OE${i + 1}: ${trunc(o, 90)}` })) },
          { k: 'descripcion', type: 'textarea', label: 'Descripción del resultado', req: true },
          { k: 'referencia', type: 'text', label: 'Tabla / figura de referencia', ph: 'Ej: Tabla 3, Figura 2', full: true }
        ] }
    ];
  },
  init(d, ctx) { if (!d.hallazgos) d.hallazgos = especificos(ctx.S).map((_, i) => ({ objetivo: String(i) })); },
  live(ctx) {
    const oe = especificos(ctx.S); const cov = new Set((ctx.d.hallazgos || []).filter(h => filled(h.descripcion) && h.objetivo !== '' && h.objetivo !== undefined).map(h => +h.objetivo));
    const pct = oe.length ? Math.round(cov.size / oe.length * 100) : 0; const el = ctx.$('#live_cov'); if (!el) return;
    el.innerHTML = `<div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700"><span>${cov.size} de ${oe.length} objetivos con hallazgo</span><span style="color:var(--green-ink)">${pct}%</span></div><div class="meter"><i style="width:${pct}%"></i></div><ul style="list-style:none;margin-top:10px;display:grid;gap:6px;font-size:13px">${oe.map((o, i) => `<li>${cov.has(i) ? '<span class="badge g">✓ Cubierto</span>' : '<span class="badge o">Pendiente</span>'} OE${i + 1}: ${esc(trunc(o, 110))}</li>`).join('')}</ul>`;
  },
  validate(d, ctx) {
    const oe = especificos(ctx.S); const cov = new Set((d.hallazgos || []).map(h => +h.objetivo));
    const miss = oe.map((_, i) => i).filter(i => !cov.has(i));
    return miss.length ? [E(`Cobertura incompleta: faltan hallazgos para ${miss.map(i => 'OE' + (i + 1)).join(', ')}. Se requiere el 100% de los objetivos específicos.`)] : [];
  },
  beforeSave(d) { d.estructura_resultados = d.hallazgos; }
},
{
  id: '25', phase: 5, title: 'Discusión',
  purpose: 'Interpretar los resultados a la luz de la teoría.',
  fields: ctx => {
    const oe = especificos(ctx.S);
    const teo = (getD(ctx.S, '7').teorias_principales || []).filter(t => filled(t.autor));
    const ant = (getD(ctx.S, '6').antecedentes || []).filter(a => filled(a.autor)).slice(0, 2);
    const prompts = [...teo.map(t => `¿Tus resultados confirman o refutan a ${esc(t.autor)} (${esc(t.nombre)})? ¿Por qué?`), ...ant.map(a => `¿Coinciden tus hallazgos con ${esc(a.autor)} (${esc(a.anio)}, ${esc(a.pais)})? ¿Qué explica las diferencias?`)];
    return [
      { type: 'html', html: () => prompts.length ? `<div class="field"><div class="label">Preguntas socráticas para guiar tu reflexión</div>${prompts.map(p => `<div class="socratic">${p}</div>`).join('')}</div>` : '' },
      ...oe.map((o, i) => ({ k: `discusion_por_objetivo.${i}`, type: 'textarea', label: `Discusión del OE${i + 1}`, hint: esc(trunc(o, 140)), req: true, min: 50, rows: 3 })),
      { k: 'confrontacion_teorica', type: 'textarea', label: 'Confrontación con el marco teórico (Módulo 7)', req: true, rows: 4 },
      { k: 'confrontacion_antecedentes', type: 'textarea', label: 'Confrontación con los antecedentes (Módulo 6)', req: true, rows: 4 },
      { type: 'html', html: () => '<div id="live_refs"></div>' }
    ];
  },
  refs(d, S) {
    const txt = [...(d.discusion_por_objetivo || []), d.confrontacion_teorica, d.confrontacion_antecedentes].join(' ');
    const n = norm(txt); const found = new Set();
    const autores = [...(getD(S, '7').teorias_principales || []).map(t => t.autor), ...(getD(S, '6').antecedentes || []).map(a => a.autor), ...(getD(S, '5').fuentes_seleccionadas || []).map(f => f.autor)];
    autores.forEach(a => { const ap = norm(a).split(/[\s,()]+/).find(w => w.length >= 3 && !/^\d+$/.test(w)); if (ap && n.includes(ap)) found.add(ap); });
    (txt.match(/\(([^()]*?[A-Za-zÁÉÍÓÚÑáéíóúñ][^()]*?\d{4}[a-z]?)\)/g) || []).forEach(m => found.add(norm(m)));
    return found.size;
  },
  live(ctx) { const n = this.refs(ctx.d, ctx.S); const el = ctx.$('#live_refs'); if (el) el.innerHTML = `<div class="out"><h4>Referencias detectadas en tu discusión</h4><div style="display:flex;align-items:center;gap:10px"><b style="font-size:28px;color:${n >= 2 ? 'var(--green-ink)' : 'var(--orange-ink)'}">${n}</b><span style="font-size:13px;color:var(--muted)">de 2 mínimas (autores de los Módulos 5–7 o citas en formato «(Autor, año)»).</span></div></div>`; },
  validate(d, ctx) { return this.refs(d, ctx.S) < 2 ? [E('La discusión debe incluir al menos 2 referencias a antecedentes o al marco teórico.')] : []; },
  beforeSave(d) { d.texto_discusion = { por_objetivo: d.discusion_por_objetivo, teorica: d.confrontacion_teorica, antecedentes: d.confrontacion_antecedentes }; }
},
/* ---------------- FASE 6 ---------------- */
{
  id: '26', phase: 6, title: 'Conclusiones',
  purpose: 'Sintetizar las respuestas a la pregunta de investigación.',
  fields: ctx => {
    const oe = especificos(ctx.S); const hip = enfoqueOf(ctx.S) !== 'cualitativo' && isValid(ctx.S, '9');
    return [
      { k: 'respuesta_pregunta_principal', type: 'textarea', label: 'Respuesta a la pregunta principal', hint: `Pregunta: ${pd(getD(ctx.S, '2').pregunta_principal)}`, req: true, min: 50, rows: 3 },
      ...oe.map((o, i) => ({ k: `conclusiones_por_objetivo.${i}`, type: 'textarea', label: `Conclusión del OE${i + 1}`, hint: esc(trunc(o, 140)), req: true, min: 30, rows: 2 })),
      ...(hip ? [{ k: 'verificacion_hipotesis', type: 'textarea', label: 'Verificación de hipótesis', hint: `Hi: ${esc(trunc(getD(ctx.S, '9').hipotesis_general, 160))}`, req: true, rows: 2 }] : []),
      { k: 'limitaciones', type: 'textarea', label: 'Limitaciones del estudio', req: true, rows: 3 },
      { k: 'recomendaciones', type: 'textarea', label: 'Recomendaciones para futuros estudios', req: true, rows: 3 }
    ];
  },
  validate(d, ctx) {
    const r = []; const hall = getD(ctx.S, '24').hallazgos || [];
    const resTxt = hall.map(h => h.descripcion).join(' ') + ' ' + JSON.stringify(getD(ctx.S, '21').omega || '') + ' ' + getD(ctx.S, '17').tamano_muestra;
    const nums = s => (String(s || '').match(/\d+(?:[.,]\d+)?/g) || []).map(x => x.replace(',', '.'));
    const resNums = new Set(nums(resTxt));
    const concl = [d.respuesta_pregunta_principal, ...(d.conclusiones_por_objetivo || [])].join(' ');
    const nuevos = nums(concl).filter(n => !resNums.has(n) && !/^(19|20)\d{2}$/.test(n));
    if (nuevos.length) r.push(E(`Posible información nueva: los datos ${[...new Set(nuevos)].slice(0, 6).join(', ')} no aparecen en tus resultados (Módulo 24). Las conclusiones no deben introducir información nueva.`));
    (d.conclusiones_por_objetivo || []).forEach((c, i) => {
      const hw = words(hall.filter(h => +h.objetivo === i).map(h => h.descripcion).join(' '));
      if (filled(c) && hw.length && !overlap(words(c), hw).length) r.push(W(`La conclusión del OE${i + 1} no parece derivar de sus hallazgos. Retoma los términos de tus resultados.`));
    });
    return r;
  },
  beforeSave(d) { d.conclusiones_finales = { respuesta: d.respuesta_pregunta_principal, por_objetivo: d.conclusiones_por_objetivo, hipotesis: d.verificacion_hipotesis, limitaciones: d.limitaciones, recomendaciones: d.recomendaciones }; }
},
{
  id: '27', phase: 6, title: 'Referencias',
  purpose: 'Gestionar la bibliografía en formato APA 7.',
  fields: [
    { type: 'html', html: () => `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px"><button class="btn btn-soft btn-sm" data-act="importRefs">${ICON.plus} Importar autores de los Módulos 5, 6 y 7</button></div>` },
    { k: 'referencias', type: 'rep', label: 'Referencias', minItems: 1, add: 'Agregar referencia',
      title: (it, i) => { const doi = cleanDoi(it.doi); return `Referencia ${i + 1} ${doi ? (DOI_RE.test(doi) ? '<span class="badge g">DOI válido</span>' : '<span class="badge r">DOI inválido</span>') : ''} ${it.arbitrada ? '<span class="badge b">Arbitrada</span>' : ''}`; },
      fields: [
        { k: 'autor', type: 'text', label: 'Autor(es)', req: true, ph: 'Apellido, N. N., & Apellido, N.' },
        { k: 'anio', type: 'text', label: 'Año', req: true, ph: String(CY) },
        { k: 'titulo', type: 'text', label: 'Título', req: true, full: true },
        { k: 'fuente', type: 'text', label: 'Fuente (revista, editorial)', req: true },
        { k: 'volumen', type: 'text', label: 'Volumen(número), páginas', ph: '12(3), 45–67' },
        { k: 'doi', type: 'text', label: 'DOI', ph: '10.1234/abcd.5678' },
        { k: 'arbitrada', type: 'check', label: 'Fuente arbitrada (revisión por pares)' }
      ] },
    { type: 'html', html: () => `<div class="out"><h4 style="justify-content:space-between">Lista bibliográfica · APA 7 <button class="btn btn-sm btn-ghost" data-act="copyRefs">${ICON.copy} Copiar</button></h4><div id="live_apa"></div></div>` }
  ],
  init(d) { if (!d.referencias) d.referencias = [{}]; },
  sorted: d => (d.referencias || []).filter(r => filled(r.autor)).slice().sort((a, b) => norm(a.autor).localeCompare(norm(b.autor))),
  live(ctx) {
    const s = this.sorted(ctx.d); const el = ctx.$('#live_apa'); if (!el) return;
    const n = s.length, arb = s.filter(r => r.arbitrada).length, pct = n ? Math.round((n - arb) / n * 100) : 0;
    el.innerHTML = (n ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px"><span class="chip"><i>${n}</i> referencias</span><span class="chip"><i>${arb}</i> arbitradas</span><span class="chip" style="${pct > 10 ? 'border-color:var(--orange);color:var(--orange-ink)' : ''}"><i>${pct}%</i> no arbitradas</span></div><ol class="apa-list">${s.map((r, i) => `<li style="--i:${i}">${apaFormat(r)}</li>`).join('')}</ol>` : '<div class="empty">Tu lista ordenada alfabéticamente aparecerá aquí.</div>');
  },
  actions: {
    importRefs(ctx) {
      const d = ctx.d; d.referencias = (d.referencias || []).filter(r => filled(r.autor) || filled(r.titulo));
      const has = new Set(d.referencias.map(r => norm(r.autor) + r.anio));
      const add = (autor, anio, titulo) => { if (!filled(autor)) return; const ym = String(autor).match(/\(?\b((?:19|20)\d{2})\)?/); if (ym && !anio) { anio = ym[1]; autor = String(autor).replace(ym[0], '').replace(/[\s,]+$/, '').trim(); } const k = norm(autor) + (anio || ''); if (has.has(k)) return; has.add(k); d.referencias.push({ autor, anio: anio ? String(anio) : '', titulo: titulo || '', fuente: '', arbitrada: false }); };
      (getD(ctx.S, '5').fuentes_seleccionadas || []).forEach(f => add(f.autor, f.anio));
      (getD(ctx.S, '6').antecedentes || []).forEach(a => add(a.autor, a.anio));
      (getD(ctx.S, '7').teorias_principales || []).forEach(t => add(t.autor, '', t.nombre));
      if (!d.referencias.length) d.referencias = [{}];
      ctx.rerender(); toast('Autores importados. Completa título, fuente y DOI.');
    },
    copyRefs(ctx) { const s = MODULES.find(m => m.id === '27').sorted(ctx.d).map(r => apaFormat(r, false)).join('\n\n'); navigator.clipboard?.writeText(s); toast('Referencias copiadas al portapapeles'); }
  },
  validate(d) {
    const r = []; const s = d.referencias || [];
    s.forEach((x, i) => { const doi = cleanDoi(x.doi); if (doi && !DOI_RE.test(doi)) r.push(E(`El DOI de la referencia ${i + 1} no tiene un formato válido (ej. 10.1234/abcd.5678).`)); });
    const n = s.length, no = s.filter(x => !x.arbitrada).length;
    if (n && no / n > 0.10) r.push(W(`El ${Math.round(no / n * 100)}% de tus fuentes no son arbitradas (máximo recomendado: 10%).`));
    return r;
  },
  beforeSave(d) { d.lista_formateada = this.sorted(d).map(r => apaFormat(r, false)); }
},
{
  id: '28', phase: 6, title: 'Estructura Final del Documento',
  purpose: 'Ensamblar el protocolo completo.',
  fields: [
    { type: 'row', cols: 3, fields: [
      { k: 'estudiante', type: 'text', label: 'Estudiante(s)', ph: 'Para la portada' },
      { k: 'carrera', type: 'text', label: 'Carrera', ph: 'Ej: Ing. en Gestión de Proyectos' },
      { k: 'asesor', type: 'text', label: 'Asesor(a)', ph: 'Nombre del asesor' }
    ] },
    { k: 'resumen', type: 'textarea', label: 'Resumen', rows: 4 },
    { k: 'palabras_clave', type: 'text', label: 'Palabras clave', ph: 'Separadas por comas' },
    { k: 'checklist', type: 'checks', label: 'Checklist de los 11 elementos estructurales', minItems: 11, opts: CHECK28.map(x => ({ v: x, l: x })) },
    { type: 'html', html: () => `<div class="out"><h4>Completitud</h4><div id="live_chk"></div></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin:0 0 16px" id="exp28">
        <button class="btn btn-primary" data-act="word">${ICON.dl} Exportar a Word</button>
        <button class="btn btn-dark" data-act="pdf">${ICON.dl} Exportar a PDF</button>
        <button class="btn btn-ghost" data-act="json">${ICON.dl} Datos (JSON)</button></div>
      <div class="doc-preview"><div class="doc-page" id="live_doc"></div></div>` }
  ],
  liveDebounce: 300,
  live(ctx) {
    const c = (ctx.d.checklist || []).length, pct = Math.round(c / 11 * 100);
    const el = ctx.$('#live_chk'); if (el) el.innerHTML = `<div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700"><span>${c} de 11 elementos</span><span style="color:var(--green-ink)">${pct}%</span></div><div class="meter"><i style="width:${pct}%"></i></div>${pct < 100 ? '<p style="font-size:12.5px;color:var(--muted)">Las exportaciones se habilitan al completar el 100% del checklist.</p>' : ''}`;
    ctx.$$('#exp28 .btn').forEach(b => { b.disabled = pct < 100; });
    const doc = ctx.$('#live_doc'); if (doc) doc.innerHTML = compileDoc(ctx.S, ctx.d);
  },
  actions: { word: () => exportWord(), pdf: () => exportPDF(compileDoc(STATE)), json: () => exportJSON() },
  beforeSave(d, ctx) { d.documento_unificado = true; }
},
{
  id: '29', phase: 6, title: 'Preparación para la Defensa',
  purpose: 'Simular el examen de grado.',
  quote: 'Simula tu examen de grado. La app generará preguntas personalizadas basadas en tu investigación.',
  fields: [
    { type: 'html', html: c => `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:22px">
      <button class="btn btn-orange btn-lg" data-act="gen">${c.d.preguntas ? 'Generar nuevo simulacro' : 'Generar preguntas de defensa'}</button>
      <button class="btn btn-ghost" data-act="pdfQ" ${c.d.preguntas ? '' : 'disabled'}>${ICON.dl} Cuestionario en PDF</button>
      <button class="btn btn-primary" data-act="word">${ICON.dl} Exportar protocolo a Word</button>
      <button class="btn btn-ghost" data-act="json">${ICON.dl} Exportar datos (JSON)</button></div><div id="defensa"></div>` }
  ],
  onRender(ctx) { renderDefensa(ctx); },
  actions: {
    gen(ctx, b) { ctx.d.preguntas = generarPreguntas(ctx.S); ctx.d.practicadas = []; b.textContent = 'Generar nuevo simulacro'; ctx.$('[data-act="pdfQ"]').disabled = false; renderDefensa(ctx); ctx.changed(); },
    pdfQ(ctx) { exportPDF(`<div class="cover"><h1>Simulacro de defensa</h1><p>${esc(getD(ctx.S, '1').titulo_sugerido || '')}</p><p>YUMM IA · Universidad Tecnológica de Cancún</p></div>${defensaHTML(ctx.d.preguntas, true)}`); },
    word: () => exportWord(), json: () => exportJSON(),
    practice(ctx, b) { const i = +b.dataset.arg; const p = new Set(ctx.d.practicadas || []); p.has(i) ? p.delete(i) : p.add(i); ctx.d.practicadas = [...p]; b.closest('.q-card').classList.toggle('practiced', p.has(i)); ctx.changed(); }
  },
  validate(d) { return d.preguntas ? [] : [E('Genera tu simulacro de preguntas de defensa.')]; },
  beforeSave(d) { d.cuestionario_simulacro = d.preguntas; }
}
];
MODULES.forEach(m => { m.num = m.num || m.id; });
const ORDER = MODULES.map(m => m.id);
const MOD = Object.fromEntries(MODULES.map(m => [m.id, m]));

/* ---------- Defensa: 18 preguntas en 6 secciones ---------- */
const SECCIONES = ['Introducción', 'Marco teórico', 'Metodología', 'Resultados', 'Limitaciones', 'Contribución'];
function generarPreguntas(S) {
  const g = id => getD(S, id);
  const f = (x, fb = '[por definir]') => (String(x ?? '').trim() ? String(x).trim() : fb);
  const m1 = g('1'), m2 = g('2'), m3 = g('3'), m7 = g('7'), m6 = g('6');
  const T = {
    v: f(m1.variable, 'tu variable'), pob: f(m1.poblacion, 'tu población'), lug: f(m1.lugar, 'tu contexto'), per: f(m1.periodo), campo: f(m1.campo_disciplinar, 'tu campo'),
    preg: f(m2.pregunta_principal), og: trunc(f(m3.objetivo_general), 90), oe1: trunc(f(especificos(S)[0]), 90),
    par: f((PARADIGMAS.find(p => p.v === g('11').paradigma) || {}).l), enf: f(g('10').enfoque), niv: f(g('13').nivel), dis: f((DISENOS.find(x => x.v === g('12').diseno_metodologico) || {}).l),
    met: f((g('15').metodo || []).map(v => (METODOS.find(m => m.v === v) || {}).l).join(' y ')), n: f(g('17').tamano_muestra), sub: f(g('17').subtipo_muestreo),
    ins: f(g('21').instrumento, 'instrumento'), om: g('21').omega ? ` (ω = ${g('21').omega.valor.toFixed(2)})` : '',
    teo: f((m7.teorias_principales || [])[0]?.nombre), teoA: f((m7.teorias_principales || [])[0]?.autor), comp: f((m7.teorias_complementarias || []).filter(filled)[0]),
    ant: f((m6.antecedentes || [])[0]?.autor), ter: f((g('8').terminos || [])[0]?.termino), tipos: f((g('4').tipo_justificacion || []).join(', ')),
    an: f(g('23').tipo_analisis), sw: f(g('23').software_utilizado)
  };
  const B = [
    [`¿Qué te motivó a investigar ${T.v} en ${T.pob}?`, `¿Por qué delimitaste tu estudio a ${T.lug} durante ${T.per}?`, `¿Por qué el problema que observaste es relevante para el campo de ${T.campo}?`, `¿Cómo surgió tu pregunta de investigación «${T.preg}»?`, `¿Qué justificación (${T.tipos}) consideras más sólida y por qué?`],
    [`¿Por qué elegiste la teoría «${T.teo}» para explicar ${T.v}?`, `¿Cómo se relaciona tu pregunta «${T.preg}» con la literatura existente?`, `¿Qué vacío del conocimiento detectaste en el antecedente de ${T.ant}?`, `¿Cuál es la diferencia entre la definición conceptual y la operativa de «${T.ter}»?`, `¿Qué aporta la teoría complementaria «${T.comp}» a tu marco teórico?`],
    [`Defiende por qué elegiste el paradigma ${T.par} para tu objetivo «${T.og}».`, `¿Por qué el enfoque ${T.enf} es el adecuado para responder tu pregunta?`, `¿Cómo justificas un nivel ${T.niv} con un diseño ${T.dis}?`, `¿Por qué seleccionaste el método ${T.met}?`, `¿Cómo determinaste el tamaño de muestra (n = ${T.n}) y el muestreo ${T.sub}?`, `¿Qué evidencias de validez y confiabilidad tiene tu ${T.ins}${T.om}?`],
    [`¿Qué hallazgo responde directamente al objetivo «${T.oe1}»?`, `¿Por qué elegiste ${T.an} con ${T.sw} para procesar tus datos?`, `¿Tus resultados confirman o refutan a ${T.teoA}? ¿Por qué?`, `¿Cómo se relacionan tus resultados con el paradigma ${T.par}?`, '¿Cuál fue el hallazgo más inesperado y cómo lo interpretas?'],
    ['¿Cuáles fueron las principales limitaciones de tu investigación y cómo afectan la interpretación?', `¿Hasta qué punto puedes generalizar tus resultados más allá de ${T.pob}?`, `¿Qué sesgos pudo introducir el muestreo ${T.sub}?`, `Si repitieras el estudio, ¿qué cambiarías de tu ${T.ins}?`, '¿Cómo controlaste las variables extrañas o intervinientes?'],
    ['¿Cuál es la contribución original de tu estudio y cómo podría replicarse?', `¿Qué recomendaciones haces a ${T.lug} a partir de tus conclusiones?`, `¿Qué líneas de investigación futuras abre tu trabajo sobre ${T.v}?`, `¿Cómo beneficia tu estudio a ${T.pob}?`, `¿Qué aporte metodológico deja tu trabajo a otros estudiantes de ${T.campo}?`]
  ];
  const out = [];
  B.forEach((qs, s) => { const pool = qs.slice(); for (let k = 0; k < 3; k++) { const i = Math.floor(Math.random() * pool.length); out.push({ sec: s, q: pool.splice(i, 1)[0] }); } });
  return out;
}
function defensaHTML(P, print = false) {
  if (!P) return '';
  return SECCIONES.map((s, si) => `<div class="q-section"><${print ? 'h2' : 'h4'}>${si + 1}. ${s}</${print ? 'h2' : 'h4'}>${P.map((p, i) => ({ ...p, i })).filter(p => p.sec === si).map(p => print ? `<p><b>${p.i + 1}.</b> ${esc(p.q)}</p>` : `<div class="q-card" style="--i:${p.i}"><span class="qn">${p.i + 1}</span><p>${esc(p.q)}</p><label><input type="checkbox" data-act="practice" data-arg="${p.i}"> Practicada</label></div>`).join('')}</div>`).join('');
}
function renderDefensa(ctx) {
  const el = ctx.$('#defensa'); if (!el) return;
  const P = ctx.d.preguntas;
  if (!P) { el.innerHTML = '<div class="empty">Genera 18 preguntas personalizadas (3 por sección) basadas en los datos de todos tus módulos.</div>'; return; }
  el.innerHTML = alertBox('info', '<strong>Simulación de defensa:</strong> prepárate para responder estas preguntas ante tu sínodo. Marca las que ya practicaste.') + defensaHTML(P);
  (ctx.d.practicadas || []).forEach(i => { const c = el.querySelector(`[data-arg="${i}"]`); if (c) { c.checked = true; c.closest('.q-card').classList.add('practiced'); } });
}

/* ---------- Omega: render ---------- */
function renderOmega(ctx, o, animate) {
  const el = ctx.$('#omega_res'); if (!el) return;
  const it = OMEGA.interpret(o.valor); const v = Math.max(0, Math.min(1, o.valor));
  const L = Math.PI * 100;
  el.innerHTML = `<div class="omega-box">
    <div class="gauge"><svg viewBox="0 0 240 140"><path class="track" d="M20 120 A100 100 0 0 1 220 120"/><path class="val" id="gv" d="M20 120 A100 100 0 0 1 220 120" stroke="${it.c}" stroke-dasharray="${L}" stroke-dashoffset="${L}"/>
      ${[0.6, 0.7, 0.8, 0.9].map(t => { const a = Math.PI * (1 - t); return `<line x1="${120 + 88 * Math.cos(a)}" y1="${120 - 88 * Math.sin(a)}" x2="${120 + 112 * Math.cos(a)}" y2="${120 - 112 * Math.sin(a)}" stroke="rgba(255,255,255,.35)" stroke-width="2"/>`; }).join('')}</svg>
      <div class="read"><b id="gnum">0.000</b><small>Omega de McDonald</small></div></div>
    <div class="omega-info"><h4 style="color:${it.c}">${it.t.split('.')[0]}.</h4><p>${esc(it.t.split('.').slice(1).join('.').trim())}</p>
      <div class="omega-scale">${['Pobre', 'Cuestionable', 'Aceptable', 'Buena', 'Excelente'].map((s, i) => `<span class="${i === it.i ? 'on' : ''}" style="${i === it.i ? `background:${it.c}` : ''}">${s}</span>`).join('')}</div>
      <div class="calc-detail">• Número de ítems: ${o.n_items}${o.n ? ` · participantes: ${o.n}` : ''}<br>• Σλᵢ = ${o.sum.toFixed(3)}<br>• (Σλᵢ)² = ${o.sum2.toFixed(3)}<br>• Σθᵢ = ${o.err.toFixed(3)}<br>• ω = ${o.sum2.toFixed(3)} / (${o.sum2.toFixed(3)} + ${o.err.toFixed(3)}) = <b>${o.valor.toFixed(3)}</b><br>• ${esc(o.alfa_label)} = ${isFinite(o.alfa) ? o.alfa.toFixed(3) : '—'}</div>
      <div class="load-bars">${o.cargas.map((c, i) => `<div><span>Ítem ${i + 1}</span><div class="lb"><i data-w="${Math.max(0, Math.min(1, Math.abs(c))) * 100}" style="background:${c < 0.4 ? '#E25C5C' : '#39BEA3'}"></i></div><span class="mono">${c.toFixed(2)}</span></div>`).join('')}</div>
      <p style="margin-top:12px;font-size:13px;background:rgba(255,255,255,.07);padding:10px 12px;border-radius:10px"><b>Recomendación:</b> ${esc(o.recomendacion)}</p>
      <p style="margin-top:10px;font-size:11px;opacity:.6">Referencias: Dunn et al. (2014), Hayes & Coutts (2020), McNeish (2018)</p></div></div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const gv = el.querySelector('#gv'); if (gv) gv.style.strokeDashoffset = L * (1 - v);
    el.querySelectorAll('.lb i').forEach(b => b.style.width = b.dataset.w + '%');
    countUp(el.querySelector('#gnum'), o.valor, animate ? 1400 : 600, 3);
  }));
  if (animate) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
