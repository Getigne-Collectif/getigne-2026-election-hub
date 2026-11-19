// Page : chargement, calculs et dessins. Identique au tableau de bord d'origine.
// Outils partagés
window.gtFr = (v, dec) => v == null || v === '' ? '—' : Number(v).toLocaleString('fr-FR', {minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0});
window.gtTrio = [['44063', 'Gétigné'], ['44064', 'Gorges'], ['44043', 'Clisson']];
window.gtColor = (territoire) => {
  const i = ['Gétigné', 'Clisson', 'Gorges'].indexOf(territoire);
  if (i >= 0) return dash.colors[i];
  if (territoire === 'Loire-Atlantique' || territoire === 'France') return 'var(--cds-chart-muted)';
  return dash.colors[3];
};
window.gtDash = (territoire) => territoire === 'Loire-Atlantique' ? '6 4' : territoire === 'France' ? '1 4' : null;
window.gtTous = 'Tous indicateurs confondus';

// « Tous indicateurs confondus » : somme des 14 indicateurs suivis dans toutes les communes,
// rapportée aux habitants.
// Même méthode que les totaux départementaux : chaque nombre non publié d'une commune est remplacé
// par la moyenne départementale des communes non publiées ; le total d'une commune est donc estimé.
dash.calc('reperes_tous', {
  title: 'Repères, avec le total tous indicateurs',
  inputs: ['reperes'],
  fn: (reperes) => {
    const inclus = new Set(reperes.filter((r) => r.territoire === 'France').map((r) => r.indicateur));
    const totaux = [];
    d3.group(reperes.filter((r) => inclus.has(r.indicateur)), (r) => r.territoire, (r) => r.annee).forEach((parAnnee, territoire) => parAnnee.forEach((lignes, annee) => {
      const nombre = d3.sum(lignes, (r) => r.nombre);
      const pop = d3.median(lignes.filter((r) => r.unite === 'habitants' && r.taux > 0), (r) => r.nombre / r.taux * 1000);
      totaux.push({territoire, famille: null, indicateur: gtTous, unite: 'habitants', annee, nombre, taux: pop ? nombre / pop * 1000 : null, moyenne_non_publiees: null, taux_non_publiees: null});
    }));
    return reperes.concat(totaux);
  },
});

dash.calc('communes_tous', {
  title: 'Communes, avec le total estimé tous indicateurs',
  inputs: ['communes', 'reperes'],
  fn: (communes, reperes) => {
    const inclus = new Set(reperes.filter((r) => r.territoire === 'France').map((r) => r.indicateur));
    const hab = new Set(reperes.filter((r) => r.unite === 'habitants').map((r) => r.indicateur));
    const moy = new Map(reperes.filter((r) => r.territoire === 'Loire-Atlantique').map((r) => [r.indicateur + '|' + r.annee, r.moyenne_non_publiees]));
    const totaux = [];
    d3.group(communes.filter((r) => inclus.has(r.indicateur)), (r) => r.code).forEach((lignes, code) => {
      // population de l'année, déduite des taux publiés ; à défaut, celle de l'année connue la plus proche
      const pops = d3.rollup(lignes.filter((r) => r.publie === 'oui' && hab.has(r.indicateur) && r.taux > 0), (v) => d3.median(v, (r) => r.nombre / r.taux * 1000), (r) => r.annee);
      d3.group(lignes, (r) => r.annee).forEach((an, annee) => {
        const np = an.filter((r) => r.publie !== 'oui');
        const publies = d3.sum(an, (r) => (r.publie === 'oui' ? r.nombre : 0));
        const estimes = d3.sum(np, (r) => moy.get(r.indicateur + '|' + annee) || 0);
        let pop = pops.get(annee);
        if (pop == null && pops.size) pop = pops.get(d3.least(Array.from(pops.keys()), (a) => Math.abs(a - annee)));
        const nombre = publies + estimes;
        totaux.push({code, commune: an[0].commune, indicateur: gtTous, annee, nombre, taux: pop ? nombre / pop * 1000 : null, publie: pop ? 'oui' : 'non', publies, estimes, n_non_publies: np.length});
      });
    });
    return communes.concat(totaux);
  },
});

dash.loader('communes', {
  description: 'Lit le fichier CSV ligne à ligne et convertit l’année, le nombre et le taux en nombres ; une cellule vide (nombre non publié) reste vide.',
  fn: ({answer}) => {
    const num = (s) => (s === '' || s == null ? null : Number(s));
    if (Array.isArray(answer)) return answer.map((r) => ({code: String(r.code), commune: r.commune, indicateur: r.indicateur, annee: Number(r.annee), nombre: num(r.nombre), taux: num(r.taux), publie: r.publie}));
    const lines = String(answer).split(/\r?\n/).filter((l) => l.length);
    return lines.slice(1).map((l) => {
      const c = l.split(',');
      return {code: c[0], commune: c[1], indicateur: c[2], annee: Number(c[3]), nombre: num(c[4]), taux: num(c[5]), publie: c[6]};
    });
  },
});

dash.calc('synthese', {
  title: 'Gétigné : indicateurs publiés l’année affichée',
  description: 'Compte, pour l’année affichée, les indicateurs dont le nombre est publié à Gétigné et additionne leurs faits.',
  inputs: ['communes'],
  fn: (communes) => {
    const annee = Number(dash.params().annee);
    const lignes = communes.filter((r) => r.code === '44063' && r.annee === annee);
    const publies = lignes.filter((r) => r.publie === 'oui');
    return [{annee, indicateurs: lignes.length, publies: publies.length, non_publies: lignes.length - publies.length, faits: publies.reduce((s, r) => s + r.nombre, 0)}];
  },
});

dash.calc('tableau_getigne', {
  title: 'Gétigné, indicateur par indicateur',
  description: 'Pour l’année affichée : nombre et taux de Gétigné s’ils sont publiés, repère départemental sinon, taux de la Loire-Atlantique et de la France, nombre d’années publiées.',
  inputs: ['communes', 'reperes'],
  fn: (communes, reperes) => {
    const annee = Number(dash.params().annee);
    const ordre = ['Vols avec armes', 'Vols violents sans arme', 'Violences physiques hors cadre familial', 'Violences physiques intrafamiliales', 'Violences sexuelles', 'Cambriolages de logement', 'Vols de véhicule', 'Vols dans les véhicules', 'Vols d\'accessoires sur véhicules', 'Vols sans violence contre des personnes', 'Destructions et dégradations volontaires', 'Usage de stupéfiants', 'Trafic de stupéfiants', 'Escroqueries et fraudes aux moyens de paiement'];
    const arrondi = (v) => (v == null ? null : Math.round(v * 100) / 100);
    const getigne = communes.filter((r) => r.code === '44063');
    const france = reperes.filter((r) => r.territoire === 'France' && r.annee === annee);
    return reperes
      .filter((r) => r.territoire === 'Loire-Atlantique' && r.annee === annee)
      .map((dep) => {
        const serie = getigne.filter((r) => r.indicateur === dep.indicateur);
        const an = serie.find((r) => r.annee === annee) || {};
        const fr = france.find((r) => r.indicateur === dep.indicateur) || {};
        const publie = an.publie === 'oui';
        return {
          famille: dep.famille,
          indicateur: dep.indicateur,
          statut: publie ? 'publié' : 'non publié',
          nombre: publie ? an.nombre : null,
          repere_nombre: publie ? null : arrondi(dep.moyenne_non_publiees),
          taux: publie ? arrondi(an.taux) : null,
          taux_44: arrondi(dep.taux),
          taux_france: arrondi(fr.taux),
          annees_publiees: serie.filter((r) => r.publie === 'oui').length,
        };
      })
      .sort((a, b) => ordre.indexOf(a.indicateur) - ordre.indexOf(b.indicateur));
  },
});

dash.calc('tableau_trois', {
  title: 'Faits dans les trois communes de la police pluricommunale',
  description: 'Pour l’année affichée : nombre publié à Gétigné, Gorges et Clisson, et somme des nombres publiés.',
  inputs: ['communes'],
  fn: (communes) => {
    const annee = Number(dash.params().annee);
    const ordre = ['Vols avec armes', 'Vols violents sans arme', 'Violences physiques hors cadre familial', 'Violences physiques intrafamiliales', 'Violences sexuelles', 'Cambriolages de logement', 'Vols de véhicule', 'Vols dans les véhicules', 'Vols d\'accessoires sur véhicules', 'Vols sans violence contre des personnes', 'Destructions et dégradations volontaires', 'Usage de stupéfiants', 'Trafic de stupéfiants', 'Escroqueries et fraudes aux moyens de paiement'];
    const lignes = communes.filter((r) => r.annee === annee && (r.code === '44063' || r.code === '44064' || r.code === '44043'));
    const valeur = (indicateur, code) => {
      const r = lignes.find((x) => x.indicateur === indicateur && x.code === code);
      return r && r.publie === 'oui' ? r.nombre : null;
    };
    return ordre.map((indicateur) => {
      const getigne = valeur(indicateur, '44063');
      const gorges = valeur(indicateur, '44064');
      const clisson = valeur(indicateur, '44043');
      const publies = [getigne, gorges, clisson].filter((v) => v != null);
      return {indicateur, getigne, gorges, clisson, total_publie: publies.length ? publies.reduce((s, v) => s + v, 0) : null};
    });
  },
});

dash.calc('comparaison', {
  title: 'Indicateur choisi : communes et repères, année affichée',
  description: 'Nombre et taux de l’indicateur choisi, l’année affichée, pour Gétigné, Gorges, Clisson, la commune ajoutée, la Loire-Atlantique et la France.',
  inputs: ['communes_tous', 'reperes_tous'],
  fn: (communes, reperes) => {
    const p = dash.params();
    const annee = Number(p.annee);
    const arrondi = (v) => (v == null ? null : Math.round(v * 100) / 100);
    const codes = ['44063', '44064', '44043'].concat(p.commune && ['44063', '44064', '44043'].indexOf(p.commune) < 0 ? [p.commune] : []);
    const lignes = communes.filter((r) => r.indicateur === p.indicateur && r.annee === annee);
    const sortie = [];
    codes.forEach((code) => {
      const r = lignes.find((x) => x.code === code);
      if (!r) return;
      const publie = r.publie === 'oui';
      sortie.push({territoire: r.commune, statut: publie ? 'publié' : 'non publié', nombre: publie ? r.nombre : null, taux: publie ? arrondi(r.taux) : null, estime: r.estimes > 0});
    });
    ['Loire-Atlantique', 'France'].forEach((territoire) => {
      const r = reperes.find((x) => x.territoire === territoire && x.indicateur === p.indicateur && x.annee === annee);
      if (r) sortie.push({territoire, statut: 'reconstitué', nombre: r.nombre, taux: arrondi(r.taux)});
    });
    return sortie;
  },
});

dash.calc('position', {
  title: 'Rang de Gétigné parmi les communes publiées de Loire-Atlantique',
  description: 'Pour l’indicateur choisi et l’année affichée : nombre de communes publiées, rang de Gétigné par taux croissant et médiane des taux publiés.',
  inputs: ['communes_tous'],
  fn: (communes) => {
    const p = dash.params();
    const annee = Number(p.annee);
    const tous = p.indicateur === gtTous;
    const lignes = communes.filter((r) => r.indicateur === p.indicateur && r.annee === annee);
    const publiees = lignes.filter((r) => r.publie === 'oui').sort((a, b) => a.taux - b.taux);
    const i = publiees.findIndex((r) => r.code === '44063');
    const n = publiees.length;
    const mediane = n ? (n % 2 ? publiees[(n - 1) / 2].taux : (publiees[n / 2 - 1].taux + publiees[n / 2].taux) / 2) : null;
    return [{indicateur: p.indicateur, annee, communes: lignes.length, publiees: n, statut: i < 0 ? 'non publié' : tous ? 'total' : 'publié', sans_population: lignes.length - n, rang: i < 0 ? null : publiees.filter((r) => r.taux < publiees[i].taux).length + 1, autres_non_publiees: i < 0 ? lignes.length - n - 1 : null, mediane: mediane == null ? null : Math.round(mediane * 100) / 100}];
  },
});

// Phrases alternatives : laquelle montrer
dash.onData(() => {
  const d = dash.data('position');
  const statut = d.status === 'ok' && d.data && d.data[0] ? d.data[0].statut : null;
  document.querySelectorAll('[data-gt-si]').forEach((e) => { e.hidden = e.dataset.gtSi !== statut; });
  const tous = dash.params().indicateur === gtTous;
  document.querySelectorAll('[data-gt-mode]').forEach((e) => { e.hidden = (e.dataset.gtMode === 'tous') !== tous; });
});

// Valeur seule : lit la cellule nommée par ses attributs
dash.draw('val', (el) => {
  const d = dash.data(el.dataset.source);
  if (d.status !== 'ok' || !Array.isArray(d.data)) { el.textContent = '—'; return; }
  let row;
  if (el.dataset.where) {
    const k = el.dataset.where.split('=');
    row = d.data.find((r) => String(r[k[0]]) === decodeURIComponent(k[1]));
  } else row = d.data[Number(el.dataset.row) || 0];
  const v = row ? row[el.dataset.field] : null;
  el.textContent = v == null ? '—' : el.dataset.raw ? String(v) : gtFr(v, Number(el.dataset.dec) || 0);
});

// Choix
dash.draw('choix-annee', (sel) => {
  const d = dash.data('reperes');
  const annees = d.status === 'ok' ? Array.from(new Set(d.data.map((r) => r.annee))).sort((a, b) => b - a) : [];
  sel.replaceChildren(...annees.map((a) => new Option(String(a), String(a))));
  sel.value = String(dash.params().annee);
  sel.onchange = () => dash.setParams({annee: Number(sel.value)});
});
dash.draw('choix-indicateur', (sel) => {
  const d = dash.data('reperes');
  const noms = d.status === 'ok' ? Array.from(new Set(d.data.filter((r) => r.territoire === 'France').map((r) => r.indicateur))).sort((a, b) => a.localeCompare(b, 'fr')) : [];
  sel.replaceChildren(new Option(gtTous, gtTous), ...noms.map((n) => new Option(n, n)));
  sel.value = dash.params().indicateur;
  sel.onchange = () => dash.setParams({indicateur: sel.value});
});
dash.draw('choix-commune', (sel) => {
  const d = dash.data('communes');
  const vues = new Map();
  if (d.status === 'ok') d.data.forEach((r) => { if (!vues.has(r.code)) vues.set(r.code, r.commune); });
  const trio = gtTrio.map((t) => t[0]);
  const liste = Array.from(vues).filter((c) => trio.indexOf(c[0]) < 0).sort((a, b) => a[1].localeCompare(b[1], 'fr'));
  sel.replaceChildren(new Option('Aucune', ''), ...liste.map((c) => new Option(c[1], c[0])));
  sel.value = dash.params().commune || '';
  sel.onchange = () => dash.setParams({commune: sel.value || ''});
});

// Tableau principal
dash.draw('t-getigne', (tb) => {
  const T = dash.data('tableau_getigne'), C = dash.data('communes');
  if (T.status !== 'ok' || C.status !== 'ok' || !Array.isArray(T.data)) { tb.replaceChildren(); return; }
  const choisi = dash.params().indicateur;
  const getigne = d3.group(C.data.filter((r) => r.code === '44063'), (r) => r.indicateur);
  const cell = (txt, cls) => { const td = document.createElement('td'); td.textContent = txt; if (cls) td.className = cls; return td; };
  const rows = [];
  let famille = null;
  T.data.forEach((r) => {
    if (r.famille !== famille) {
      famille = r.famille;
      const tr = document.createElement('tr'); tr.className = 'gt-fam';
      const th = document.createElement('th'); th.colSpan = 8; th.textContent = famille; tr.append(th); rows.push(tr);
    }
    const tr = document.createElement('tr');
    const cliquable = r.taux_44 != null;
    if (cliquable) { tr.className = 'gt-click' + (r.indicateur === choisi ? ' gt-sel' : ''); tr.onclick = () => dash.setParams({indicateur: r.indicateur}); }
    tr.append(
      cell(r.indicateur),
      r.nombre == null ? cell('non publié', 'gt-np') : cell(gtFr(r.nombre)),
      cell(r.repere_nombre == null ? '' : gtFr(r.repere_nombre, 2), 'gt-np'),
      cell(r.taux == null ? '—' : gtFr(r.taux, 2)),
      cell(r.taux_44 == null ? '—' : gtFr(r.taux_44, 2)),
      cell(r.taux_france == null ? '—' : gtFr(r.taux_france, 2)),
      cell(gtFr(r.annees_publiees)),
    );
    // profil des dix années
    const serie = (getigne.get(r.indicateur) || []).slice().sort((a, b) => a.annee - b.annee);
    const w = 112, h = 26, n = serie.length || 1, bw = w / n;
    const max = d3.max(serie, (s) => (s.publie === 'oui' ? s.nombre : 0)) || 1;
    const svg = d3.create('svg').attr('width', w).attr('height', h).attr('viewBox', `0 0 ${w} ${h}`).attr('role', 'img')
      .attr('aria-label', `${r.indicateur} à Gétigné, 2016 à 2025 : ` + serie.map((s) => `${s.annee} ${s.publie === 'oui' ? s.nombre : 'non publié'}`).join(', '));
    serie.forEach((s, i) => {
      const x = i * bw + 1.5;
      if (s.publie === 'oui' && s.nombre > 0) {
        const bh = Math.max(2, (s.nombre / max) * (h - 4));
        svg.append('rect').attr('x', x).attr('y', h - 1 - bh).attr('width', bw - 3).attr('height', bh).style('fill', dash.colors[0]);
      } else if (s.publie === 'oui') {
        svg.append('rect').attr('x', x).attr('y', h - 2.5).attr('width', bw - 3).attr('height', 1.5).style('fill', dash.colors[0]);
      } else {
        svg.append('circle').attr('cx', x + (bw - 3) / 2).attr('cy', h - 5).attr('r', 2.2).style('fill', 'none').style('stroke', 'var(--cds-chart-muted)').style('stroke-width', 1.2);
      }
    });
    const td = document.createElement('td'); td.dataset.source = 'communes'; td.append(svg.node()); tr.append(td);
    rows.push(tr);
  });
  tb.replaceChildren(...rows);
});

dash.draw('t-trois', (tb) => {
  const T = dash.data('tableau_trois');
  if (T.status !== 'ok' || !Array.isArray(T.data)) { tb.replaceChildren(); return; }
  const cell = (v, first) => { const td = document.createElement('td'); if (first) td.textContent = v; else if (v == null) { td.textContent = 'n. p.'; td.className = 'gt-np'; } else td.textContent = gtFr(v); return td; };
  tb.replaceChildren(...T.data.map((r) => {
    const tr = document.createElement('tr');
    tr.append(cell(r.indicateur, true), cell(r.getigne), cell(r.gorges), cell(r.clisson), cell(r.total_publie));
    return tr;
  }));
});

dash.draw('t-comparaison', (tb) => {
  const T = dash.data('comparaison');
  if (T.status !== 'ok' || !Array.isArray(T.data)) { tb.replaceChildren(); return; }
  tb.replaceChildren(...T.data.map((r) => {
    const tr = document.createElement('tr');
    const t = document.createElement('td');
    const sw = document.createElement('span'); sw.className = 'gt-swatch'; sw.style.borderTopColor = gtColor(r.territoire);
    const ds = gtDash(r.territoire); if (ds) sw.style.borderTopStyle = ds === '6 4' ? 'dashed' : 'dotted';
    t.append(sw, document.createTextNode(r.territoire));
    const n = document.createElement('td'); const x = document.createElement('td');
    if (r.nombre == null) { n.textContent = 'non publié'; n.className = 'gt-np'; } else n.textContent = (r.estime ? '≈ ' : '') + gtFr(r.nombre);
    x.textContent = r.taux == null ? '—' : gtFr(r.taux, 2);
    tr.append(t, n, x);
    return tr;
  }));
});

// Courbes
dash.draw('evolution', (el) => {
  const C = dash.data('communes_tous'), R = dash.data('reperes_tous');
  if (C.status !== 'ok' || R.status !== 'ok') { el.textContent = C.status === 'error' || R.status === 'error' ? 'Échec du chargement' : '—'; return; }
  const p = dash.params(), ind = p.indicateur, annee = Number(p.annee);
  const years = Array.from(new Set(R.data.map((r) => r.annee))).sort((a, b) => a - b);
  const parCode = d3.group(C.data.filter((r) => r.indicateur === ind), (r) => r.code);
  const codes = gtTrio.map((t) => t[0]).concat(p.commune && parCode.has(p.commune) && gtTrio.every((t) => t[0] !== p.commune) ? [p.commune] : []);
  const series = codes.map((code) => {
    const lignes = parCode.get(code) || [];
    const m = new Map(lignes.map((r) => [r.annee, r]));
    const nom = lignes[0] ? lignes[0].commune : code;
    return {nom, color: gtColor(nom), w: code === '44063' ? 2.8 : 1.8, pts: years.map((y) => { const r = m.get(y); return {annee: y, v: r && r.publie === 'oui' ? r.taux : null, n: r && r.publie === 'oui' ? r.nombre : null, e: r ? r.estimes : null}; })};
  });
  const dep = new Map(R.data.filter((r) => r.territoire === 'Loire-Atlantique' && r.indicateur === ind).map((r) => [r.annee, r]));
  ['Loire-Atlantique', 'France'].forEach((t) => {
    const m = new Map(R.data.filter((r) => r.territoire === t && r.indicateur === ind).map((r) => [r.annee, r]));
    series.push({nom: t, color: gtColor(t), dash: gtDash(t), w: 1.8, pts: years.map((y) => { const r = m.get(y); return {annee: y, v: r ? r.taux : null, n: r ? r.nombre : null}; })});
  });
  const creux = series[0].pts.filter((d) => d.v == null && dep.get(d.annee) && dep.get(d.annee).taux_non_publiees != null).map((d) => ({annee: d.annee, v: dep.get(d.annee).taux_non_publiees}));
  const max = d3.max(series.flatMap((s) => s.pts.map((d) => d.v)).concat(creux.map((d) => d.v))) || 1;

  const W = el.clientWidth || 640, H = 300, mt = 12, mr = 16, mb = 28;
  const y = d3.scaleLinear().domain([0, max]).nice(5).range([H - mb, mt]);
  const dec = max < 2 ? 2 : max < 20 ? 1 : 0;
  const svg = d3.create('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('height', H).attr('role', 'img')
    .attr('aria-label', `${ind} : taux pour 1 000 de 2016 à 2025 à Gétigné, Gorges, Clisson, en Loire-Atlantique et en France`);
  el.replaceChildren(svg.node());
  // marge gauche mesurée sur les graduations
  const probe = svg.append('g').attr('class', 'gt-axis');
  let ml = 0;
  y.ticks(5).forEach((t) => { const tx = probe.append('text').text(gtFr(t, dec)); ml = Math.max(ml, tx.node().getComputedTextLength()); });
  probe.remove();
  ml = Math.ceil(ml) + 12;
  const x = d3.scalePoint().domain(years).range([ml + 8, W - mr - 8]);
  const pas = W < 460 ? 3 : W < 640 ? 2 : 1;
  const gx = svg.append('g').attr('class', 'gt-axis').attr('transform', `translate(0,${H - mb})`).call(d3.axisBottom(x).tickValues(years.filter((_, i) => (years.length - 1 - i) % pas === 0)).tickSize(0).tickPadding(8));
  gx.select('.domain').style('stroke', 'var(--cds-chart-axis)');
  const gy = svg.append('g').attr('class', 'gt-axis').attr('transform', `translate(${ml},0)`).call(d3.axisLeft(y).ticks(5).tickSize(-(W - ml - mr)).tickPadding(6).tickFormat((t) => gtFr(t, dec)));
  gy.select('.domain').remove();
  gy.selectAll('line').style('stroke', 'var(--cds-chart-grid)');
  // année affichée
  if (x(annee) != null) svg.append('line').attr('x1', x(annee)).attr('x2', x(annee)).attr('y1', mt).attr('y2', H - mb).style('stroke', 'var(--cds-chart-reference)').style('stroke-dasharray', '2 3');
  const line = d3.line().defined((d) => d.v != null).x((d) => x(d.annee)).y((d) => y(d.v));
  series.slice().reverse().forEach((s) => {
    svg.append('path').attr('d', line(s.pts)).style('fill', 'none').style('stroke', s.color).style('stroke-width', s.w).style('stroke-dasharray', s.dash || null).style('stroke-linecap', 'round');
    if (!s.dash) svg.append('g').selectAll('circle').data(s.pts.filter((d) => d.v != null)).join('circle').attr('cx', (d) => x(d.annee)).attr('cy', (d) => y(d.v)).attr('r', s.w + 0.6).style('fill', s.color);
  });
  svg.append('g').selectAll('circle').data(creux).join('circle').attr('cx', (d) => x(d.annee)).attr('cy', (d) => y(d.v)).attr('r', 3.6).style('fill', 'var(--color-bg)').style('stroke', series[0].color).style('stroke-width', 1.6);

  // info-bulle
  const tip = document.createElement('div'); tip.className = 'gt-tip'; tip.hidden = true; el.append(tip);
  const regle = svg.append('line').attr('y1', mt).attr('y2', H - mb).style('stroke', 'var(--cds-chart-axis)').style('display', 'none');
  const montrer = (ev) => {
    const mx = d3.pointer(ev, svg.node())[0];
    const an = years.reduce((a, b) => (Math.abs(x(b) - mx) < Math.abs(x(a) - mx) ? b : a));
    regle.attr('x1', x(an)).attr('x2', x(an)).style('display', null);
    const titre = document.createElement('b'); titre.textContent = `${ind}, ${an}`;
    const lignes = series.map((s) => {
      const d = s.pts.find((q) => q.annee === an); const div = document.createElement('div');
      const lab = document.createElement('span'); lab.textContent = s.nom + ' : ';
      let txt;
      if (d.v != null) txt = `${gtFr(d.v, 2)} pour 1 000 (${d.e ? '≈ ' : ''}${gtFr(d.n)} faits)`;
      else if (s.nom === 'Gétigné' && dep.get(an) && dep.get(an).taux_non_publiees != null) txt = `non publié (repère ${gtFr(dep.get(an).taux_non_publiees, 2)})`;
      else txt = 'non publié';
      div.append(lab, document.createTextNode(txt)); return div;
    });
    tip.replaceChildren(titre, ...lignes); tip.hidden = false;
    const tw = tip.offsetWidth, px = x(an);
    tip.style.left = Math.max(4, Math.min(W - tw - 4, px + 12 + tw > W ? px - tw - 12 : px + 12)) + 'px';
    tip.style.top = mt + 'px';
  };
  svg.on('pointermove', montrer).on('pointerdown', montrer).on('pointerleave', () => { tip.hidden = true; regle.style('display', 'none'); });
});

// Répartition des communes publiées
dash.draw('repartition', (el) => {
  const C = dash.data('communes_tous');
  if (C.status !== 'ok') { el.textContent = C.status === 'error' ? 'Échec du chargement' : '—'; return; }
  const p = dash.params(), ind = p.indicateur, annee = Number(p.annee);
  const rows = C.data.filter((r) => r.indicateur === ind && r.annee === annee && r.publie === 'oui');
  if (!rows.length) { el.textContent = 'Aucune commune publiée pour cet indicateur cette année-là.'; return; }
  const W = el.clientWidth || 640, r0 = 3.4, pasY = 2 * r0 + 1, ml = 12, mr = 18;
  const max = d3.max(rows, (r) => r.taux) || 1;
  const x = d3.scaleSqrt().domain([0, max]).range([ml, W - mr]);
  const pts = rows.map((r) => ({r, x: x(r.taux)})).sort((a, b) => a.x - b.x);
  const places = [];
  pts.forEach((q) => {
    let k = 0, yy = 0;
    for (;;) {
      yy = (k % 2 ? -1 : 1) * Math.ceil(k / 2) * pasY;
      if (!places.some((o) => o.y === yy && Math.abs(o.x - q.x) < pasY)) break;
      k++;
    }
    q.y = yy; places.push(q);
  });
  const ext = d3.max(pts, (q) => Math.abs(q.y)) || 0;
  const mid = ext + r0 + 10, H = 2 * mid + 26;
  const dec = max < 2 ? 2 : max < 20 ? 1 : 0;
  const svg = d3.create('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('height', H).attr('role', 'img')
    .attr('aria-label', `${ind}, ${annee} : répartition des taux pour 1 000 des communes publiées de Loire-Atlantique`);
  el.replaceChildren(svg.node());
  const gx = svg.append('g').attr('class', 'gt-axis').attr('transform', `translate(0,${2 * mid})`).call(d3.axisBottom(x).ticks(W < 460 ? 4 : 7).tickSize(4).tickPadding(4).tickFormat((t) => gtFr(t, dec)));
  gx.select('.domain').style('stroke', 'var(--cds-chart-axis)'); gx.selectAll('line').style('stroke', 'var(--cds-chart-axis)');
  const special = (code) => { const t = gtTrio.find((s) => s[0] === code); return t ? gtColor(t[1]) : code === p.commune ? dash.colors[3] : null; };
  svg.append('g').selectAll('circle').data(pts.filter((q) => !special(q.r.code))).join('circle').attr('cx', (q) => q.x).attr('cy', (q) => mid + q.y).attr('r', r0).style('fill', 'var(--cds-chart-muted)').style('opacity', 0.55);
  svg.append('g').selectAll('circle').data(pts.filter((q) => special(q.r.code))).join('circle').attr('cx', (q) => q.x).attr('cy', (q) => mid + q.y).attr('r', r0 + 2.2).style('fill', (q) => special(q.r.code)).style('stroke', 'var(--color-bg)').style('stroke-width', 1.5);
  const tip = document.createElement('div'); tip.className = 'gt-tip'; tip.hidden = true; el.append(tip);
  const halo = svg.append('circle').attr('r', r0 + 3.5).style('fill', 'none').style('stroke', 'var(--color-fg)').style('stroke-width', 1.2).style('display', 'none');
  const montrer = (ev) => {
    const pt = d3.pointer(ev, svg.node()); const mx = pt[0], my = pt[1];
    const q = pts.reduce((a, b) => (Math.hypot(b.x - mx, mid + b.y - my) < Math.hypot(a.x - mx, mid + a.y - my) ? b : a));
    halo.attr('cx', q.x).attr('cy', mid + q.y).style('display', null);
    const t = document.createElement('b'); t.textContent = q.r.commune;
    const d = document.createElement('div'); d.textContent = `${gtFr(q.r.taux, 2)} pour 1 000 · ${q.r.estimes ? '≈ ' : ''}${gtFr(q.r.nombre)} faits en ${annee}`;
    tip.replaceChildren(t, d); tip.hidden = false;
    const tw = tip.offsetWidth;
    tip.style.left = Math.max(4, Math.min(W - tw - 4, q.x + 12 + tw > W ? q.x - tw - 12 : q.x + 12)) + 'px';
    tip.style.top = Math.max(0, mid + q.y - 44) + 'px';
  };
  svg.on('pointermove', montrer).on('pointerdown', montrer).on('pointerleave', () => { tip.hidden = true; halo.style('display', 'none'); });
});
