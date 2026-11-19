// Petit moteur autonome : remplace l'environnement du tableau de bord d'origine.
// Il charge les fichiers de data/, tient les filtres et relance les dessins.
(function () {
  // Fichiers de données, relatifs à index.html
  var SOURCES = {
    communes: {url: 'data/communes44.csv', format: 'text'},
    reperes: {url: 'data/reperes.json', format: 'json'},
    contexte: {url: 'data/contexte.json', format: 'json'},
  };
  // Valeurs de départ des filtres
  var params = {annee: 2025, indicateur: 'Destructions et dégradations volontaires', commune: ''};
  var defaults = Object.assign({}, params);

  var store = {}, loaders = {}, calcs = {}, draws = {}, watchers = [], version = 0, cache = {}, queued = false, started = false;

  function rows(id, answer) {
    if (loaders[id]) return loaders[id].fn({answer: answer, items: [answer], args: {}});
    if (answer && Array.isArray(answer.rows)) return answer.rows;
    return answer;
  }
  function load(id) {
    var s = SOURCES[id];
    store[id] = {status: 'loading', data: []};
    fetch(s.url).then(function (r) {
      if (!r.ok) throw new Error(r.status + ' ' + s.url);
      return s.format === 'json' ? r.json() : r.text();
    }).then(function (a) {
      store[id] = {status: 'ok', data: rows(id, a)};
    }).catch(function (e) {
      console.error(e);
      store[id] = {status: 'error', data: [], message: String(e)};
    }).then(function () { version++; schedule(); });
  }
  function data(id) {
    if (SOURCES[id]) { if (!store[id]) load(id); return store[id]; }
    var c = calcs[id];
    if (!c) return {status: 'missing', data: null};
    var hit = cache[id];
    if (hit && hit.version === version) return hit.value;
    var ins = c.inputs.map(data), value;
    if (ins.some(function (d) { return d.status === 'error'; })) value = {status: 'error', data: null};
    else if (ins.some(function (d) { return d.status !== 'ok'; })) value = {status: 'loading', data: null};
    else {
      try { value = {status: 'ok', data: c.fn.apply(null, ins.map(function (d) { return d.data; }))}; }
      catch (e) { console.error(e); value = {status: 'error', data: null, message: String(e)}; }
    }
    cache[id] = {version: version, value: value};
    return value;
  }
  function render() {
    queued = false;
    watchers.forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } });
    document.querySelectorAll('[data-draw]').forEach(function (el) {
      if (el.closest('[hidden]')) return;
      var fn = draws[el.getAttribute('data-draw')];
      if (!fn) return;
      try { fn(el); } catch (e) { console.error(e); }
    });
  }
  function schedule() {
    if (!started || queued) return;
    queued = true;
    requestAnimationFrame(render);
  }

  window.dash = {
    colors: ['var(--gt-c1)', 'var(--gt-c2)', 'var(--gt-c3)', 'var(--gt-c4)'],
    data: data,
    loader: function (id, o) { loaders[id] = o; },
    calc: function (id, o) { calcs[id] = o; },
    draw: function (name, fn) { if (fn) draws[name] = fn; else schedule(); },
    onData: function (fn) { watchers.push(fn); },
    params: function () { return Object.assign({}, params); },
    setParams: function (p) { Object.assign(params, p); version++; schedule(); },
    resetParams: function () { params = Object.assign({}, defaults); version++; schedule(); },
    setLink: function () {},
    refresh: function (id) { if (SOURCES[id]) load(id); },
    start: function () {
      started = true;
      Object.keys(SOURCES).forEach(function (id) { if (!store[id]) load(id); });
      var t;
      window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(schedule, 150); });
      schedule();
    },
  };
})();
