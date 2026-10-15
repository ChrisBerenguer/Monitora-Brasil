/* Monitora Brasil — aplicação do painel
 * Depende apenas de d3 v7 (assets/js/d3.v7.9.0.min.js) e dos arquivos em data/.
 * Sem build: basta servir a pasta site/ por HTTP.
 */
(() => {
  'use strict';

  // ---------------------------------------------------------------- config
  const DATA_DIR = 'data/';
  const ARQUIVOS = {
    indicadores: 'indicadores.json',
    series: 'series.json',
    coortes: 'coortes.json',
    periodos: 'periodos.json',
    escores: 'escores.json',
    escores_coortes: 'escores_coortes.json',
    percentis_br: 'percentis_brasil.json',
    ranking_br: 'ranking_brasil.json',
    histogramas: 'histogramas.json',
  };

  const TEMAS = [
    { id: 'geral', nome: 'Escore geral' },
    { id: 'macro', nome: 'Estabilidade macroeconômica' },
    { id: 'prod', nome: 'Estrutura produtiva e inovação' },
    { id: 'social', nome: 'Coesão social e distribuição' },
    { id: 'inst', nome: 'Estado, instituições e segurança' },
    { id: 'bem', nome: 'Bem-estar e sustentabilidade' },
  ];
  const TNOME = Object.fromEntries(TEMAS.map((t) => [t.id, t.nome]));
  const COORTES = [
    { id: 'latam', nome: 'América Latina', curto: 'Am. Latina', membros: ['arg', 'chl', 'col', 'mex', 'per', 'ury'] },
    { id: 'brics', nome: 'BRICS', curto: 'BRICS', membros: ['chn', 'ind', 'rus', 'zaf'] },
    { id: 'ocde', nome: 'OCDE (referência)', curto: 'OCDE', membros: ['usa', 'deu', 'fra', 'gbr', 'jpn', 'kor', 'can', 'esp', 'ita', 'aus', 'prt', 'pol'] },
    { id: 'umic', nome: 'Renda média-alta (Banco Mundial)', curto: 'Renda média-alta', membros: null },
    { id: 'mundo', nome: 'Mundo (todos os países)', curto: 'Mundo', membros: null },
  ];
  const CNOME = Object.fromEntries(COORTES.map((c) => [c.id, c.nome]));
  const PAIS = { bra: 'Brasil', arg: 'Argentina', chl: 'Chile', col: 'Colômbia', mex: 'México', per: 'Peru', ury: 'Uruguai', chn: 'China', ind: 'Índia', rus: 'Rússia', zaf: 'África do Sul', usa: 'Estados Unidos', deu: 'Alemanha', fra: 'França', gbr: 'Reino Unido', jpn: 'Japão', kor: 'Coreia do Sul', can: 'Canadá', esp: 'Espanha', ita: 'Itália', aus: 'Austrália', prt: 'Portugal', pol: 'Polônia' };
  const ORDEM_PAISES = Object.keys(PAIS);
  const PERIODOS = ['1995–1998', '1999–2002', '2003–2006', '2007–2010', '2011–2014', '2015–2018', '2019–2022', '2023–2026'];
  const MANDATO = { '1995–1998': 'FHC 1', '1999–2002': 'FHC 2', '2003–2006': 'Lula 1', '2007–2010': 'Lula 2', '2011–2014': 'Dilma 1', '2015–2018': 'Dilma 2 / Temer', '2019–2022': 'Bolsonaro', '2023–2026': 'Lula 3 (até 2025)' };
  const PAGINAS = ['visao', 'series', 'coortes', 'metodo'];
  // Mandatos usados na variação dos escores (Visão geral). Os escores começam em 2000,
  // então FHC 2 é medido de 2000 a 2002.
  const MANDATOS_ESC = PERIODOS.filter((p) => +p.slice(0, 4) + 3 >= 2000).map((p) => ({ id: p, ini: +p.slice(0, 4), fim: +p.slice(0, 4) + 3, nome: MANDATO[p] }));
  /** Anos comparados: o ano anterior à posse (ou 2000) contra o fim do mandato (ou o último ano com dado). */
  const anosMandato = (m, last) => ({ a: Math.max(2000, m.ini - 1), b: Math.min(m.fim, last) });
  const ANOS = d3.range(1995, 2026);

  // ---------------------------------------------------------------- estado
  const st = {
    page: 'visao', coorte: 'latam', mandato: '2023–2026', tema: 'geral', ind: 'ny_gdp_pcap_pp_kd', banda: 'latam',
    paises: ['bra', 'arg', 'chl', 'mex', 'chn', 'usa'], y0: 1995, y1: 2025, pa: '2019–2022', pb: '2023–2026',
    cano: null, canoInd: null, cy0: 2000, cy1: 2025, cstema: 'geral', sort: { key: 'geral', dir: -1 },
  };
  let D = null; // dados carregados e indexados

  // ---------------------------------------------------------------- utilidades
  const $ = (s) => document.querySelector(s);
  const el = (tag, attrs = {}, text) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (text != null) e.textContent = text;
    return e;
  };
  const nf = (d) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const f0 = nf(0).format, f1 = nf(1).format, f2 = nf(2).format;
  const fmtv = (v) => v == null || Number.isNaN(v) ? '—' : Math.abs(v) >= 1000 ? f0(v) : Math.abs(v) >= 100 ? f1(v) : f2(v);
  const sgn = (v, f) => v == null || Number.isNaN(v) ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + f(Math.abs(v));
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const cor = (i) => css(`--s${i % 8}`);
  const corPais = (p) => cor(ORDEM_PAISES.indexOf(p));
  const largura = (box) => Math.max(280, box.clientWidth);
  /** Formato dos rótulos de eixo pelo passo entre marcas (evita "0,00" ao lado de "80.000"). */
  const tickFmt = (ticks) => { const step = ticks.length > 1 ? Math.abs(ticks[1] - ticks[0]) : 1; return step >= 1 ? f0 : step >= 0.1 ? f1 : f2; };

  // ---------------------------------------------------------------- tema claro/escuro
  const temaBtn = $('#tema-btn');
  const lerTema = () => { try { return localStorage.getItem('mb-tema'); } catch { return null; } };
  const aplicarTema = (t) => { if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); };
  aplicarTema(lerTema());
  temaBtn.addEventListener('click', () => {
    const atual = document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const novo = atual === 'dark' ? 'light' : 'dark';
    aplicarTema(novo);
    try { localStorage.setItem('mb-tema', novo); } catch { /* sem armazenamento */ }
    render();
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => render());

  // ---------------------------------------------------------------- tooltip (posição fixa)
  const tipEl = $('#tip');
  const tip = {
    show(ev, title, lines) {
      tipEl.replaceChildren(el('div', { class: 't' }, title));
      for (const l of lines) {
        const row = el('div', { class: 'l' });
        const left = el('span');
        if (l.color) left.appendChild(el('span', { class: 'sw', style: `background:${l.color}` }));
        left.appendChild(document.createTextNode(l.name));
        row.append(left, el('b', {}, l.value));
        tipEl.appendChild(row);
      }
      tipEl.hidden = false;
      const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
      let x = ev.clientX + 14, y = ev.clientY - h - 10;
      if (x + w > innerWidth - 8) x = ev.clientX - w - 14;
      if (y < 8) y = ev.clientY + 16;
      tipEl.style.left = Math.max(8, x) + 'px';
      tipEl.style.top = y + 'px';
    },
    hide() { tipEl.hidden = true; },
  };
  addEventListener('scroll', () => tip.hide(), { passive: true });

  // ---------------------------------------------------------------- CSV
  function baixarCSV(nome, linhas, colunas) {
    const esc = (v) => v == null ? '' : /[;"\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v).replace('.', ',');
    const txt = [colunas.map((c) => c.titulo).join(';'), ...linhas.map((r) => colunas.map((c) => esc(c.valor(r))).join(';'))].join('\r\n');
    const blob = new Blob(['﻿' + txt], { type: 'text/csv;charset=utf-8' });
    const a = el('a', { href: URL.createObjectURL(blob), download: nome });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---------------------------------------------------------------- carga e índices
  async function carregar() {
    const entradas = await Promise.all(Object.entries(ARQUIVOS).map(async ([id, arq]) => {
      const r = await fetch(DATA_DIR + arq, { cache: 'no-cache' }); // sempre confere se há versão nova
      if (!r.ok) throw new Error(`Não foi possível carregar ${arq} (HTTP ${r.status}).`);
      return [id, await r.json()];
    }));
    const raw = Object.fromEntries(entradas);
    const ix = { raw };
    ix.indicadores = raw.indicadores;
    ix.ind = new Map(raw.indicadores.map((r) => [r.id, r]));
    ix.ser = d3.group(raw.series, (r) => r.ind, (r) => r.pais);
    ix.coo = d3.group(raw.coortes, (r) => r.ind, (r) => r.coorte);
    ix.esc = d3.group(raw.escores, (r) => r.pais, (r) => r.tema);
    ix.escLast = d3.max(raw.escores, (r) => +r.ano);
    ix.escC = d3.group(raw.escores_coortes, (r) => r.coorte, (r) => r.tema);
    ix.pct = d3.group(raw.percentis_br, (r) => r.ind);
    ix.rank = new Map(raw.ranking_br.map((r) => [+r.ano, r]));
    ix.hist = new Map(raw.histogramas.map((r) => [r.chave, r]));
    // cálculos derivados (mesmas fórmulas documentadas em docs/03)
    ix.vEsc = calcVariacaoMandatos(raw.escores, ix.escLast);
    ix.ranking = calcRankingUltimo(raw.escores, ix.escLast);
    ix.vPer = calcVariacaoPeriodos(raw.periodos);
    return ix;
  }

  /** Variação do escore dentro de cada mandato: fim do mandato menos o ano anterior à posse, por país e tema. */
  function calcVariacaoMandatos(escores, last) {
    const by = new Map(escores.map((r) => [`${r.pais}|${r.tema}|${r.ano}`, +r.escore]));
    const pares = new Set(escores.map((r) => `${r.pais}|${r.tema}`));
    const out = new Map();
    for (const pt of pares) for (const m of MANDATOS_ESC) {
      const { a, b } = anosMandato(m, last);
      const va = by.get(`${pt}|${a}`), vb = by.get(`${pt}|${b}`);
      if (va != null && vb != null) out.set(`${pt}|${m.id}`, { delta: Math.round((vb - va) * 10) / 10, a, b, va, vb });
    }
    return out;
  }
  /** Tabela larga: um objeto por país com os seis escores do último ano. */
  function calcRankingUltimo(escores, last) {
    const m = new Map();
    for (const r of escores) if (+r.ano === last) {
      if (!m.has(r.pais)) m.set(r.pais, { pais: r.pais });
      m.get(r.pais)[r.tema] = +r.escore;
    }
    return [...m.values()];
  }
  /** Para cada par de mandatos A < B, indicador e país: médias, variação e tendências. */
  function calcVariacaoPeriodos(periodos) {
    const g = d3.group(periodos, (r) => `${r.ind}|${r.pais}`);
    const out = new Map();
    for (const rs of g.values()) for (const a of rs) for (const b of rs) if (a.periodo < b.periodo) {
      out.set(`${a.ind}|${a.pais}|${a.periodo}|${b.periodo}`, {
        pais: a.pais, media_a: +a.media, media_b: +b.media,
        delta: Math.round((b.media - a.media) * 100) / 100,
        delta_pct: a.media ? Math.round((b.media - a.media) / Math.abs(a.media) * 1000) / 10 : null,
        mediana_b: +b.mediana, desvio_b: +b.desvio, tendencia_a: a.tendencia_ano, tendencia_b: b.tendencia_ano,
      });
    }
    return out;
  }

  // ---------------------------------------------------------------- componentes de gráfico
  function vazio(box, msg = 'Sem dados para essa seleção.') { box.replaceChildren(el('p', { class: 'vazio' }, msg)); }

  /** Linhas com faixa opcional, rótulos finais e régua com tooltip. */
  function lineChart(box, { series, band, yfmt, xdomain, height = 340, endLabels = true, destaque = null, ydomain = null, faixas = null, ref = null, legenda = false, tituloTip = null }) {
    box.replaceChildren();
    box.classList.remove('carregando');
    const W = largura(box), H = height;
    const allY = series.flatMap((s) => s.pts.map((p) => p.y)).concat(band ? band.pts.flatMap((p) => [p.lo, p.hi]) : []).filter((v) => v != null);
    if (!allY.length) return vazio(box);
    const ext = d3.extent(allY), pad = (ext[1] - ext[0]) * 0.06 || 1;
    const y = ydomain ? d3.scaleLinear(ydomain, [H - 24, 10]) : d3.scaleLinear([ext[0] - pad, ext[1] + pad], [H - 24, 10]).nice();
    const svg = d3.select(box).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img');
    const ticks = y.ticks(5);
    const tf = tickFmt(ticks);
    const probe = svg.append('text').text(ticks.map(tf).reduce((a, b) => (a.length > b.length ? a : b), ''));
    const ml = probe.node().getComputedTextLength() + 10; probe.remove();
    let mr = 16;
    if (endLabels) {
      const p2 = svg.append('text').attr('class', 'rotulo-fim');
      for (const s of series) { const last = [...s.pts].reverse().find((q) => q.y != null); if (last) { p2.text(`${s.name} ${yfmt(last.y)}`); mr = Math.max(mr, p2.node().getComputedTextLength() + 14); } }
      p2.remove(); mr = Math.min(mr, W * 0.36);
    }
    const x = d3.scaleLinear(xdomain, [ml, W - mr]);
    svg.append('g').selectAll('line').data(ticks).join('line').attr('x1', ml).attr('x2', W - mr).attr('y1', y).attr('y2', y).style('stroke', css('--grid'));
    svg.append('g').selectAll('text').data(ticks).join('text').attr('x', ml - 6).attr('y', y).attr('dy', '0.32em').attr('text-anchor', 'end').text(tf);
    const xt = x.ticks(Math.min(xdomain[1] - xdomain[0], Math.floor((W - ml - mr) / 56))).filter(Number.isInteger);
    svg.append('g').selectAll('text').data(xt).join('text').attr('x', x).attr('y', H - 6).attr('text-anchor', 'middle').text((d) => d);
    svg.append('line').attr('x1', ml).attr('x2', W - mr).attr('y1', H - 24).attr('y2', H - 24).style('stroke', css('--axis'));
    if (faixas) { // períodos alternados (ex.: mandatos), com rótulo curto quando cabe
      faixas.forEach((f, i) => {
        const a = Math.max(xdomain[0], f.de - 0.5), b = Math.min(xdomain[1], f.ate + 0.5);
        if (b <= a) return;
        const x0 = x(a), x1 = x(b);
        if (i % 2 === 0) svg.append('rect').attr('x', x0).attr('y', 10).attr('width', x1 - x0).attr('height', H - 34).style('fill', css('--chart-muted')).style('fill-opacity', 0.1);
        const t = svg.append('text').attr('x', (x0 + x1) / 2).attr('y', 22).attr('text-anchor', 'middle').style('font-size', '10px').style('fill', css('--muted')).text(f.rotulo);
        if (t.node().getComputedTextLength() > x1 - x0 - 4) t.remove();
      });
    }
    if (ref != null) {
      svg.append('line').attr('x1', ml).attr('x2', W - mr).attr('y1', y(ref)).attr('y2', y(ref)).style('stroke', css('--ref')).attr('stroke-dasharray', '4 4');
    }
    if (destaque) { // período em destaque (ex.: mandato escolhido)
      const x0 = x(Math.max(xdomain[0], destaque.de)), x1 = x(Math.min(xdomain[1], destaque.ate));
      svg.append('rect').attr('x', x0).attr('y', 10).attr('width', Math.max(2, x1 - x0)).attr('height', H - 34).attr('rx', 3)
        .style('fill', cor(0)).style('fill-opacity', 0.08);
      if (destaque.rotulo) svg.append('text').attr('x', (x0 + x1) / 2).attr('y', 22).attr('text-anchor', 'middle').style('fill', cor(0)).style('font-weight', 600).text(destaque.rotulo);
    }
    if (band && band.pts.some((p) => p.lo != null)) {
      const area = d3.area().defined((d) => d.lo != null && d.hi != null).x((d) => x(d.x)).y0((d) => y(d.lo)).y1((d) => y(d.hi));
      svg.append('path').attr('d', area(band.pts)).style('fill', band.color).style('fill-opacity', 0.16);
    }
    const line = d3.line().defined((d) => d.y != null).x((d) => x(d.x)).y((d) => y(d.y));
    for (const s of series) {
      svg.append('path').attr('d', line(s.pts)).style('fill', 'none').style('stroke', s.color).attr('stroke-width', s.width || 2)
        .attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round').attr('stroke-dasharray', s.dash || null);
      const iso = s.pts.filter((p, i, a) => p.y != null && a[i - 1]?.y == null && a[i + 1]?.y == null);
      svg.append('g').selectAll('circle').data(iso).join('circle').attr('cx', (d) => x(d.x)).attr('cy', (d) => y(d.y)).attr('r', 2.6).style('fill', s.color);
    }
    if (endLabels) {
      const labs = series.map((s) => { const p = [...s.pts].reverse().find((q) => q.y != null); return p && { s, p, yy: y(p.y) }; })
        .filter(Boolean).sort((a, b) => a.yy - b.yy);
      for (let i = 1; i < labs.length; i++) if (labs[i].yy - labs[i - 1].yy < 13) labs[i].yy = labs[i - 1].yy + 13;
      svg.append('g').selectAll('text').data(labs).join('text').attr('class', 'rotulo-fim').attr('x', (d) => x(d.p.x) + 6).attr('y', (d) => d.yy)
        .attr('dy', '0.32em').style('fill', (d) => d.s.color).text((d) => `${d.s.name} ${yfmt(d.p.y)}`);
    }
    const rule = svg.append('line').attr('y1', 10).attr('y2', H - 24).style('stroke', css('--ref')).attr('visibility', 'hidden');
    const dots = svg.append('g');
    svg.append('rect').attr('x', ml).attr('y', 0).attr('width', W - ml - mr).attr('height', H).style('fill', 'transparent')
      .on('pointermove', (ev) => {
        const [mx] = d3.pointer(ev);
        const xv = Math.max(xdomain[0], Math.min(xdomain[1], Math.round(x.invert(mx))));
        const hits = series.map((s) => ({ s, p: s.pts.find((p) => p.x === xv) })).filter((d) => d.p && d.p.y != null);
        rule.attr('x1', x(xv)).attr('x2', x(xv)).attr('visibility', 'visible');
        dots.selectAll('circle').data(hits).join('circle').attr('cx', x(xv)).attr('cy', (d) => y(d.p.y)).attr('r', 3.8).style('fill', (d) => d.s.color);
        const L = hits.sort((a, b) => b.p.y - a.p.y).map((d) => ({ color: d.s.color, name: d.s.name, value: yfmt(d.p.y) }));
        const bp = band?.pts.find((p) => p.x === xv);
        if (bp && bp.lo != null) L.push({ name: 'Faixa da coorte', value: `${yfmt(bp.lo)} a ${yfmt(bp.hi)}` });
        tip.show(ev, tituloTip ? tituloTip(xv) : String(xv), L.length ? L : [{ name: 'Sem dado neste ano', value: '' }]);
      })
      .on('pointerleave', () => { tip.hide(); rule.attr('visibility', 'hidden'); dots.selectAll('*').remove(); });
    if (legenda && !endLabels) { // sem rótulos no fim das linhas (tela estreita): legenda embaixo
      const lg = el('div', { class: 'legenda' });
      for (const s of series) {
        const last = [...s.pts].reverse().find((q) => q.y != null);
        const it = el('span', { class: 'legenda-item' });
        const sw = el('i'); sw.style.background = s.color;
        it.append(sw, `${s.name}${last ? ' ' + yfmt(last.y) : ''}`);
        lg.append(it);
      }
      box.append(lg);
    }
  }

  /** Minigráfico do cartão de tema. */
  function spark(box, a, b, faixa) {
    box.replaceChildren();
    const W = Math.max(140, box.clientWidth), H = 46;
    const all = a.concat(b).map((d) => d.y).filter((v) => v != null);
    if (!all.length) return;
    const x = d3.scaleLinear(d3.extent(a.concat(b), (d) => d.x), [3, W - 4]);
    const y = d3.scaleLinear(d3.extent(all), [H - 4, 4]);
    const svg = d3.select(box).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('aria-hidden', 'true');
    const line = d3.line().defined((d) => d.y != null).x((d) => x(d.x)).y((d) => y(d.y));
    if (faixa) svg.append('rect').attr('x', x(faixa.a)).attr('y', 0).attr('width', Math.max(2, x(faixa.b) - x(faixa.a))).attr('height', H).style('fill', cor(0)).style('fill-opacity', 0.1);
    svg.append('path').attr('d', line(b)).style('fill', 'none').style('stroke', css('--chart-muted')).attr('stroke-width', 1.5).attr('stroke-dasharray', '4 3');
    svg.append('path').attr('d', line(a)).style('fill', 'none').style('stroke', cor(0)).attr('stroke-width', 2).attr('stroke-linecap', 'round');
    const last = [...a].reverse().find((d) => d.y != null);
    if (last) svg.append('circle').attr('cx', x(last.x)).attr('cy', y(last.y)).attr('r', 3).style('fill', cor(0));
  }

  /** Box plots horizontais com média e Brasil. */
  function boxPlot(box, rows, fmt) {
    box.replaceChildren();
    box.classList.remove('carregando');
    rows = rows.filter((r) => r.median != null);
    if (!rows.length) return vazio(box);
    const W = largura(box), rowH = 42, H = rows.length * rowH + 28;
    if (W < 560) rows = rows.map((r) => ({ ...r, label: r.curto || r.label }));
    const svg = d3.select(box).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img');
    const probe = svg.append('text'); let ml = 0;
    for (const r of rows) { probe.text(r.label); ml = Math.max(ml, probe.node().getComputedTextLength()); }
    probe.remove(); ml = Math.min(ml + 12, W * 0.42);
    const vals = rows.flatMap((r) => [r.min, r.max, r.br]).filter((v) => v != null);
    const x = d3.scaleLinear(d3.extent(vals), [ml, W - 14]).nice();
    const xt = x.ticks(Math.max(2, Math.floor((W - ml) / 72)));
    const tf = tickFmt(xt);
    svg.append('g').selectAll('line').data(xt).join('line').attr('x1', x).attr('x2', x).attr('y1', 0).attr('y2', H - 22).style('stroke', css('--grid'));
    svg.append('g').selectAll('text').data(xt).join('text').attr('x', x).attr('y', H - 6).attr('text-anchor', 'middle').text(tf);
    rows.forEach((r, i) => {
      const cy = i * rowH + rowH / 2, g = svg.append('g');
      g.append('text').attr('x', ml - 10).attr('y', cy).attr('dy', '0.32em').attr('text-anchor', 'end').text(r.label);
      g.append('line').attr('x1', x(r.min)).attr('x2', x(r.max)).attr('y1', cy).attr('y2', cy).style('stroke', css('--axis'));
      for (const v of [r.min, r.max]) g.append('line').attr('x1', x(v)).attr('x2', x(v)).attr('y1', cy - 5).attr('y2', cy + 5).style('stroke', css('--axis'));
      g.append('rect').attr('x', x(r.p25)).attr('y', cy - 10).attr('width', Math.max(1, x(r.p75) - x(r.p25))).attr('height', 20).attr('rx', 4)
        .style('fill', css('--chart-muted')).style('fill-opacity', 0.3).style('stroke', css('--chart-muted'));
      g.append('line').attr('x1', x(r.median)).attr('x2', x(r.median)).attr('y1', cy - 10).attr('y2', cy + 10).style('stroke', css('--fg')).attr('stroke-width', 2);
      if (r.mean != null) g.append('path').attr('d', d3.symbol(d3.symbolDiamond, 42)()).attr('transform', `translate(${x(r.mean)},${cy})`).style('fill', css('--fg'));
      if (r.br != null) g.append('circle').attr('cx', x(r.br)).attr('cy', cy).attr('r', 6).style('fill', cor(0)).style('stroke', css('--panel')).attr('stroke-width', 1.5);
      g.append('rect').attr('x', 0).attr('y', cy - rowH / 2).attr('width', W).attr('height', rowH).style('fill', 'transparent')
        .on('pointermove', (ev) => tip.show(ev, r.label + (r.n ? ` · ${r.n} países` : ''), [
          { name: 'Máximo', value: fmt(r.max) }, { name: '3º quartil', value: fmt(r.p75) }, { name: 'Mediana', value: fmt(r.median) },
          { name: 'Média', value: fmt(r.mean) }, { name: '1º quartil', value: fmt(r.p25) }, { name: 'Mínimo', value: fmt(r.min) },
          ...(r.br != null ? [{ color: cor(0), name: 'Brasil', value: fmt(r.br) }] : []),
        ]))
        .on('pointerleave', () => tip.hide());
    });
  }

  // ---------------------------------------------------------------- controles
  function fillSelect(sel, opts, value) {
    const key = JSON.stringify(opts);
    if (sel.dataset.opts !== key) {
      sel.replaceChildren();
      for (const o of opts) {
        if (o.group) { const g = el('optgroup', { label: o.group }); for (const c of o.items) g.appendChild(new Option(c.label, c.value)); sel.appendChild(g); }
        else sel.appendChild(new Option(o.label, o.value));
      }
      sel.dataset.opts = key;
    }
    sel.value = String(value);
  }
  const indOptions = () => TEMAS.slice(1).map((t) => ({ group: t.nome, items: D.indicadores.filter((r) => r.tema === t.id).map((r) => ({ label: r.nome, value: r.id })) }));
  const cohortOpts = COORTES.map((c) => ({ label: c.nome, value: c.id }));

  // ---------------------------------------------------------------- resumo
  function drawResumo() {
    const last = D.escLast;
    const v = (t) => D.esc.get('bra')?.get(t)?.find((r) => +r.ano === last);
    const g = v('geral'), rk = D.rank.get(last);
    const th = TEMAS.slice(1).map((t) => ({ t, r: v(t.id) })).filter((d) => d.r).sort((a, b) => b.r.escore - a.r.escore);
    const hi = th[0], lo = th.at(-1);
    const p = $('#resumo');
    p.replaceChildren(
      `Em ${last}, o Brasil soma `, el('b', {}, f1(g.escore)), ' de 100 pontos no escore geral e ocupa a ',
      el('b', {}, `${rk.posicao}ª`), ' posição entre ', el('b', {}, String(rk.paises)), ' países. O tema mais forte é ',
      hi.t.nome.toLowerCase(), ' (', el('b', {}, f1(hi.r.escore)), ') e o mais fraco é ', lo.t.nome.toLowerCase(), ' (', el('b', {}, f1(lo.r.escore)), ').',
    );
    $('#atualizado').textContent = `Dados até ${last}`;
  }

  // ---------------------------------------------------------------- visão geral
  function drawCartoes() {
    const box = $('#cartoes'), last = D.escLast;
    box.replaceChildren();
    for (const t of TEMAS) {
      const card = el('button', { class: 'card tema', type: 'button', 'aria-pressed': String(st.tema === t.id) });
      card.appendChild(el('h3', {}, t.nome));
      const br = D.esc.get('bra')?.get(t.id) || [];
      const cur = br.find((r) => +r.ano === last);
      const linha = el('div', { class: 'linha' });
      linha.appendChild(el('span', { class: 'grande' }, cur ? f1(cur.escore) : '—'));
      const dv = D.vEsc.get(`bra|${t.id}|${st.mandato}`);
      if (dv) {
        const cls = dv.delta > 0.5 ? 'bom' : dv.delta < -0.5 ? 'ruim' : 'neutro';
        linha.appendChild(el('span', { class: 'delta ' + cls, title: `Escore em ${dv.a}: ${f1(dv.va)} · em ${dv.b}: ${f1(dv.vb)}` }, `${sgn(dv.delta, f1)} no mandato`));
      }
      card.appendChild(linha);
      const cr = D.escC.get(st.coorte)?.get(t.id) || [];
      const crLast = cr.find((r) => +r.ano === last);
      card.appendChild(el('p', { class: 'nota' }, `Mediana ${CNOME[st.coorte].split(' (')[0]}: ${crLast ? f1(crLast.mediana) : '—'}`));
      const sp = el('div', { class: 'mini' });
      card.appendChild(sp);
      box.appendChild(card);
      spark(sp, br.map((r) => ({ x: +r.ano, y: +r.escore })), cr.map((r) => ({ x: +r.ano, y: +r.mediana })), anosMandato(mandatoAtual(), last));
      card.addEventListener('click', () => { st.tema = t.id; render(); });
    }
  }

  function drawEvolucao() {
    $('#ev-titulo').textContent = `${TNOME[st.tema]} ao longo do tempo`;
    const br = (D.esc.get('bra')?.get(st.tema) || []).map((r) => ({ x: +r.ano, y: +r.escore }));
    const cr = D.escC.get(st.coorte)?.get(st.tema) || [];
    lineChart($('#ev-chart'), {
      series: [
        { name: 'Brasil', color: cor(0), pts: br, width: 2.6 },
        { name: 'Mediana ' + CNOME[st.coorte].split(' (')[0], color: css('--chart-muted'), pts: cr.map((r) => ({ x: +r.ano, y: +r.mediana })), dash: '5 4' },
      ],
      band: { color: css('--chart-muted'), pts: cr.map((r) => ({ x: +r.ano, lo: +r.p25, hi: +r.p75 })) },
      yfmt: (v) => f1(v), xdomain: [2000, D.escLast], endLabels: $('#ev-chart').clientWidth > 520,
      destaque: (() => { const m = mandatoAtual(), { a, b } = anosMandato(m, D.escLast); return { de: a, ate: b, rotulo: m.nome.replace(' (até 2025)', '') }; })(),
    });
  }

  function drawDecomp() {
    const box = $('#dc-chart');
    box.replaceChildren(); box.classList.remove('carregando');
    const temaDc = st.tema === 'geral' ? null : st.tema;
    const anosDc = anosMandato(mandatoAtual(), D.escLast);
    $('#dc-titulo').textContent = (temaDc ? `O que puxa o escore: ${TNOME[temaDc].toLowerCase()}` : 'O que puxa o escore: todos os indicadores') + ` em ${anosDc.b}`;
    const rows = D.indicadores.filter((r) => r.entra_no_escore && (!temaDc || r.tema === temaDc)).map((r) => {
      const ps = D.pct.get(r.id) || [];
      const { a, b } = anosMandato(mandatoAtual(), D.escLast);
      return { r, cur: ps.find((p) => +p.ano === b), base: ps.find((p) => +p.ano === a), a, b };
    }).filter((d) => d.cur).sort((a, b) => b.cur.percentil - a.cur.percentil);
    if (!rows.length) return vazio(box);
    const W = largura(box), rowH = 24, H = rows.length * rowH + 26;
    const svg = d3.select(box).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img');
    const probe = svg.append('text'); let ml = 0;
    for (const d of rows) { probe.text(d.r.nome); ml = Math.max(ml, probe.node().getComputedTextLength()); }
    probe.remove(); ml = Math.min(ml + 30, W * 0.55);
    const x = d3.scaleLinear([0, 100], [ml, W - 34]);
    const marks = [0, 25, 50, 75, 100];
    svg.append('g').selectAll('line').data(marks).join('line').attr('x1', x).attr('x2', x).attr('y1', 0).attr('y2', H - 20)
      .style('stroke', (d) => (d === 50 ? css('--ref') : css('--grid'))).attr('stroke-dasharray', (d) => (d === 50 ? '3 3' : null));
    svg.append('g').selectAll('text').data(marks).join('text').attr('x', x).attr('y', H - 5).attr('text-anchor', 'middle').text((d) => d);
    rows.forEach((d, i) => {
      const cy = i * rowH + rowH / 2, v = +d.cur.percentil;
      const c = v >= 60 ? css('--ok') : v < 40 ? css('--critical') : css('--chart-muted');
      svg.append('text').attr('x', ml - 28).attr('y', cy).attr('dy', '0.32em').attr('text-anchor', 'end').text(d.r.nome);
      const gi = svg.append('g').attr('class', 'info-svg').attr('transform', `translate(${ml - 16},${cy})`)
        .attr('tabindex', 0).attr('role', 'button').attr('aria-label', `O que é ${d.r.nome}? Explicação em linguagem simples`);
      gi.append('circle').attr('class', 'hit').attr('r', 10);
      gi.append('circle').attr('class', 'anel').attr('r', 6.6);
      gi.append('path').attr('class', 'haste').attr('d', 'M0 -0.7v3.9');
      gi.append('circle').attr('class', 'ponto').attr('cy', -3.05).attr('r', 0.95);
      ligarInfo(gi.node(), () => d.r.id);
      svg.append('rect').attr('x', x(0)).attr('y', cy - 7).attr('width', Math.max(2, x(v) - x(0))).attr('height', 14).attr('rx', 4).style('fill', c).style('fill-opacity', 0.85);
      if (d.base) svg.append('line').attr('x1', x(+d.base.percentil)).attr('x2', x(+d.base.percentil)).attr('y1', cy - 9).attr('y2', cy + 9).style('stroke', css('--fg')).attr('stroke-width', 2);
      svg.append('text').attr('x', x(v) + 5).attr('y', cy).attr('dy', '0.32em').text(f0(v));
      svg.append('rect').attr('x', ml).attr('y', cy - rowH / 2).attr('width', W - ml).attr('height', rowH).style('fill', 'transparent')
        .on('pointermove', (ev) => tip.show(ev, d.r.nome, [
          { name: `Percentil ${d.cur.ano}`, value: f1(v) },
          ...(d.base ? [{ name: `Percentil ${d.a} (antes do mandato)`, value: f1(+d.base.percentil) }] : []),
          { name: 'Sentido', value: d.r.direcao },
        ]))
        .on('pointerleave', () => tip.hide());
    });
  }

  const mandatoAtual = () => MANDATOS_ESC.find((m) => m.id === st.mandato) || MANDATOS_ESC.at(-1);

  const COLS_RANK = ['geral', 'macro', 'prod', 'social', 'inst', 'bem'];
  function rankingOrdenado() {
    const { key: k, dir } = st.sort;
    return [...D.ranking].sort((a, b) => (k === 'pais' ? dir * PAIS[a.pais].localeCompare(PAIS[b.pais], 'pt-BR') : dir * ((a[k] ?? -1) - (b[k] ?? -1))));
  }
  function drawRanking() {
    const tb = $('#rank-table tbody');
    tb.replaceChildren();
    for (const r of rankingOrdenado()) {
      const tr = el('tr'); if (r.pais === 'bra') tr.className = 'destaque';
      tr.appendChild(el('td', {}, PAIS[r.pais]));
      for (const t of COLS_RANK) {
        const v = r[t];
        const td = el('td', {}, v == null ? '—' : f1(v));
        if (v != null && (v >= 60 || v < 40)) td.style.background = `color-mix(in srgb, var(${v >= 60 ? '--ok' : '--bad'}) ${Math.round(Math.min(1, Math.abs(v - 50) / 30) * 26)}%, transparent)`;
        tr.appendChild(td);
      }
      tb.appendChild(tr);
    }
    document.querySelectorAll('#rank-table th').forEach((th) => th.setAttribute('aria-sort', th.dataset.sort === st.sort.key ? (st.sort.dir > 0 ? 'ascending' : 'descending') : 'none'));
  }
  $('#rank-table thead').addEventListener('click', (ev) => {
    const th = ev.target.closest('th[data-sort]'); if (!th) return;
    const key = th.dataset.sort;
    st.sort = { key, dir: st.sort.key === key ? -st.sort.dir : key === 'pais' ? 1 : -1 };
    drawRanking();
  });
  $('#csv-ranking').addEventListener('click', () => baixarCSV(`monitora-brasil-escores-${D.escLast}.csv`, rankingOrdenado(), [
    { titulo: 'pais', valor: (r) => PAIS[r.pais] }, ...COLS_RANK.map((t) => ({ titulo: t, valor: (r) => r[t] })),
  ]));

  // ---------------------------------------------------------------- explicação para leigos (botão "i", ao passar o mouse)
  const infoEl = $('#info-tip');
  let infoAncora = null, infoFixo = false, ultimoToque = 0;

  function textoUnidade(v, u) {
    if (/–| a /.test(u) && !u.startsWith('%')) return `${fmtv(v)} (escala ${u})`;
    return u.startsWith('%') ? `${fmtv(v)}${u}` : `${fmtv(v)} ${u}`;
  }
  /** Explicações dos cartões da aba Coortes (o que o gráfico mostra e como ler). */
  const CARD_INFO = {
    tempo: { titulo: 'Posição do Brasil ao longo do tempo', blocos: [
      ['O que mostra', 'Para cada grupo de países, a porcentagem que o Brasil supera neste indicador em cada ano, do ano "De" ao ano "Até". É a mesma conta da régua acima, repetida ano a ano.'],
      ['Como ler', 'O Brasil não aparece como uma linha própria: cada linha já é o Brasil, comparado com um grupo. "vs. Am. Latina 20%" quer dizer que o Brasil estava à frente de 20% dos países da América Latina naquele ano. Passe o mouse para ver também o valor do Brasil no ano. Linha subindo: o Brasil está ganhando posições dentro daquele grupo. Linha descendo: está perdendo. A linha tracejada é 50%: acima dela, o Brasil está à frente da maioria do grupo. As faixas cinzas e brancas marcam os mandatos presidenciais. Passe o mouse para ver os valores de um ano.'],
      ['Por que importa', 'Responde se o Brasil melhorou ou piorou em comparação com os outros, que é diferente de ver só se o número do Brasil subiu. Comparar as linhas também ajuda: o Brasil pode ganhar terreno no mundo e perder na América Latina ao mesmo tempo.'],
      ['Atenção', 'A posição é relativa: o Brasil pode melhorar no indicador e mesmo assim cair, se os outros melhoraram mais. Grupos pequenos oscilam muito: nos BRICS, um país a mais ou a menos muda a linha em 25 pontos. O número de países com dado também muda de ano para ano, e o último ano costuma estar incompleto. A coincidência com um mandato não prova que o governo causou a mudança.'],
    ] },
    regua: { titulo: 'Posição do Brasil em cada grupo', blocos: [
      ['O que mostra', 'Para cada grupo de países, quantos deles o Brasil supera neste indicador, no ano escolhido.'],
      ['Como ler', 'A barra vai de 0% (o Brasil fica atrás de todos) a 100% (o Brasil fica à frente de todos). O traço escuro marca a posição do Brasil. 50% quer dizer que metade do grupo está à frente e metade atrás. Verde a partir de 60%, vermelho abaixo de 40%.'],
      ['Por que importa', 'O mesmo número pode ser bom ou ruim conforme a comparação. O Brasil pode estar à frente da maioria do mundo e atrás de quase toda a OCDE no mesmo indicador.'],
      ['Atenção', '"Superar" leva em conta o sentido do indicador: em homicídios ou dívida, superar é ter menos. Empates contam como meio país. Nos indicadores só de contexto, como população, a frase diz apenas de quantos o Brasil está acima, sem julgar se é bom.'],
    ] },
    pontos: { titulo: 'Os países de cada grupo', blocos: [
      ['O que mostra', 'O valor de cada país da América Latina, dos BRICS e da OCDE neste indicador, no ano escolhido. Cada bolinha é um país, e o Brasil (em verde) aparece em todas as linhas para servir de régua.'],
      ['Como ler', 'Todos os grupos usam a mesma escala, de valores menores à esquerda a maiores à direita. Quanto mais longe uma bolinha está da do Brasil, maior a diferença. Passe o mouse ou toque numa bolinha para ver o valor exato.'],
      ['Por que importa', 'Aqui dá para ver com quem o Brasil se parece de fato, e se um grupo é homogêneo (bolinhas juntas) ou muito desigual (bolinhas espalhadas).'],
      ['Atenção', 'Direita não quer dizer melhor: depende do indicador. A linha abaixo do título do primeiro cartão diz se é melhor ter valor alto ou baixo. Se um país não tem dado no ano, ele não aparece.'],
    ] },
    'hist-mundo': { titulo: 'Onde o Brasil cai no mundo', blocos: [
      ['O que mostra', 'Um histograma: os valores de todos os países do mundo divididos em faixas, e a altura de cada barra é quantos países estão naquela faixa. A barra verde é a faixa onde o Brasil está.'],
      ['Como ler', 'Barras altas mostram onde a maioria dos países se concentra. Se a barra verde está perto do pico, o Brasil é um caso comum; se está numa ponta, é um caso fora do padrão. Passe o mouse numa barra para ver a faixa e quantos países tem nela.'],
      ['Por que importa', 'A média do mundo esconde a forma da distribuição. Em renda, por exemplo, muitos países são pobres e poucos são muito ricos, e o histograma deixa isso visível.'],
      ['Atenção', 'Para que um único caso extremo (uma hiperinflação, por exemplo) não esprema todos os outros países numa barra só, os poucos países muito acima ou muito abaixo do resto entram na primeira ou na última barra. Por isso elas dizem "até" e "ou mais".'],
    ] },
    'hist-umic': { titulo: 'Entre os países de renda média-alta', blocos: [
      ['O que mostra', 'O mesmo histograma, só com os países que o Banco Mundial classifica como de renda média-alta, a mesma faixa de renda do Brasil (cerca de 60 países, como México, China, Turquia, África do Sul e Tailândia).'],
      ['Como ler', 'Cada barra conta quantos desses países estão numa faixa de valor. A barra verde é a do Brasil.'],
      ['Por que importa', 'É a comparação mais justa: países com nível de renda parecido. Ficar atrás dos países ricos é esperado; ficar atrás dos países do mesmo nível de renda é um sinal mais forte.'],
      ['Atenção', 'Com menos países, cada barra tem poucas unidades, e uma diferença de um ou dois países muda bastante o desenho.'],
    ] },
    escore: { titulo: 'Escore por grupo', blocos: [
      ['O que mostra', 'A mesma comparação, mas usando o escore do tema escolhido (de 0 a 100) em vez de um indicador só. O escore resume vários indicadores do tema.'],
      ['Como ler', 'Escore 50 quer dizer que o país está no meio do mundo naquele tema. Acima de 50, melhor que a maioria; abaixo, pior. Aqui, maior é sempre melhor.'],
      ['Por que importa', 'Um indicador sozinho pode enganar. O escore junta vários e mostra a posição no tema como um todo.'],
      ['Atenção', 'O escore é relativo: mede a posição frente aos outros países, não o nível absoluto. Ele mostra sempre o último ano com dados, mesmo que outro ano esteja escolhido acima.'],
    ] },
    'regua-escore': { titulo: 'Posição do Brasil no escore', blocos: [
      ['O que mostra', 'Quantos países de cada grupo têm escore menor que o do Brasil no tema escolhido.'],
      ['Como ler', 'A barra vai de 0% (o Brasil atrás de todos do grupo) a 100% (à frente de todos). Verde a partir de 60%, vermelho abaixo de 40%.'],
      ['Atenção', 'Empates contam como meio país.'],
    ] },
    'pontos-escore': { titulo: 'O escore dos países de cada grupo', blocos: [
      ['O que mostra', 'O escore de cada país da América Latina, dos BRICS e da OCDE no tema escolhido. O Brasil está em verde em todas as linhas.'],
      ['Como ler', 'Mais à direita é melhor. Quanto mais longe a bolinha de um país está da do Brasil, maior a diferença no tema.'],
    ] },
    estatisticas: { titulo: 'Estatísticas de cada grupo', blocos: [
      ['O que mostra', 'Números que resumem cada grupo no indicador e ano escolhidos.'],
      ['Como ler', 'Média: a soma dividida pelo número de países. Mediana: o valor do país do meio, quando todos estão em fila; não é puxada por casos extremos. Desvio: o quanto os países se espalham em torno da média. 1º e 3º quartil: os valores que deixam 25% e 75% dos países abaixo, então a metade central do grupo fica entre eles. Mínimo e máximo: o menor e o maior valor.'],
      ['Z do Brasil', 'Quantos desvios o Brasil está acima (+) ou abaixo (−) da média do grupo. Entre −1 e +1 é perto da média; além de ±2 é bem fora do padrão do grupo.'],
      ['Box plot', 'O botão "Ver box plot" desenha esses números: a caixa vai do 1º ao 3º quartil, o traço dentro dela é a mediana, o losango é a média, as hastes vão do mínimo ao máximo e o ponto verde é o Brasil.'],
    ] },
  };
  function preencherInfoCard(k) {
    const c = CARD_INFO[k];
    const partes = [el('h4', {}, c.titulo)];
    for (const [t, txt] of c.blocos) {
      const d = el('div', { class: 'bloco' + (t === 'Atenção' ? ' atencao' : '') });
      d.append(el('b', {}, t), el('span', {}, txt));
      partes.push(d);
    }
    infoEl.replaceChildren(...partes);
  }
  function preencherInfo(id) {
    if (id.startsWith('card:')) return preencherInfoCard(id.slice(5));
    const meta = D.ind.get(id), ex = meta.explicacao || {};
    const partes = [el('h4', {}, meta.nome)];
    const bloco = (titulo, texto, cls = '') => {
      if (!texto) return;
      const d = el('div', { class: 'bloco ' + cls });
      d.append(el('b', {}, titulo), el('span', {}, texto));
      partes.push(d);
    };
    if (!ex.o_que_e) partes.push(el('p', {}, 'A explicação deste indicador não carregou. Recarregue a página para buscar a versão mais recente dos dados.'));
    bloco('O que é', ex.o_que_e);
    bloco('Como ler', ex.como_ler);
    bloco('Por que importa', ex.por_que_importa);
    bloco('Atenção', ex.atencao, 'atencao');
    const br = (D.ser.get(id)?.get('bra') || []).slice().sort((a, b) => a.ano - b.ano);
    const ult = br.at(-1), pri = br[0];
    if (ult) {
      const p = el('p', { class: 'dado' });
      p.append('Brasil: ', el('strong', {}, textoUnidade(ult.valor, meta.unidade)), ` em ${ult.ano}`);
      if (pri && pri.ano !== ult.ano) p.append(' (era ', el('strong', {}, fmtv(pri.valor)), ` em ${pri.ano})`);
      p.append('.');
      partes.push(p);
    }
    infoEl.replaceChildren(...partes);
  }
  function posicionarInfo(ancora) {
    const r = ancora.getBoundingClientRect(), w = infoEl.offsetWidth, h = infoEl.offsetHeight, m = 8;
    let x = r.right + 10, y = r.top - 8;                 // à direita do "i"
    if (x + w > innerWidth - m) x = r.left - w - 10;     // sem espaço: à esquerda
    if (x < m) { x = Math.max(m, Math.min(innerWidth - w - m, r.left + r.width / 2 - w / 2)); y = r.bottom + 8; } // celular: embaixo
    if (y + h > innerHeight - m) y = Math.max(m, innerHeight - h - m);
    if (y < m) y = m;
    infoEl.style.left = x + 'px';
    infoEl.style.top = y + 'px';
  }
  function mostrarInfo(ancora, id) {
    if (!D || !id) return;
    tip.hide();
    if (infoAncora && infoAncora !== ancora) infoAncora.setAttribute('aria-expanded', 'false');
    infoAncora = ancora;
    preencherInfo(id);
    infoEl.hidden = false;
    ancora.setAttribute('aria-expanded', 'true');
    ancora.setAttribute('aria-describedby', 'info-tip');
    posicionarInfo(ancora);
  }
  function esconderInfo() {
    infoEl.hidden = true; infoFixo = false;
    if (infoAncora) { infoAncora.setAttribute('aria-expanded', 'false'); infoAncora.removeAttribute('aria-describedby'); }
    infoAncora = null;
  }
  const ICONE_INFO = '<svg class="ico-info" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" stroke-width="1.25"/><path d="M8 7.3v3.9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="4.95" r=".95" fill="currentColor"/></svg>';
  /** Botão com o ícone de informação (marcação fixa, sem dados do usuário). */
  function botaoInfo(rotulo) {
    const b = el('button', { class: 'info-btn', type: 'button', 'aria-label': rotulo });
    b.innerHTML = ICONE_INFO;
    return b;
  }
  /** Liga um elemento "i" à explicação do indicador devolvido por getId(). */
  function ligarInfo(alvo, getId) {
    alvo.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') mostrarInfo(alvo, getId()); });
    alvo.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !infoFixo) esconderInfo(); });
    alvo.addEventListener('focus', () => mostrarInfo(alvo, getId()));
    alvo.addEventListener('blur', () => { if (!infoFixo) esconderInfo(); });
    const alternar = () => {
      if (infoAncora === alvo && infoFixo) esconderInfo();
      else { mostrarInfo(alvo, getId()); infoFixo = true; }
    };
    // Toque (celular): trata no pointerup e ignora o clique sintético que vem depois,
    // que em alguns navegadores chega ao <body> e fecharia a explicação na hora.
    alvo.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') { ultimoToque = performance.now(); alternar(); } });
    alvo.addEventListener('click', (e) => {   // clique do mouse fixa ou solta a explicação
      e.preventDefault(); e.stopPropagation();
      if (performance.now() - ultimoToque < 700) return;
      alternar();
    });
    alvo.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alvo.dispatchEvent(new MouseEvent('click')); } });
  }
  document.querySelectorAll('[data-info-sel]').forEach((b) => ligarInfo(b, () => st.ind));
  document.querySelectorAll('[data-info-card]').forEach((b) => ligarInfo(b, () => 'card:' + b.dataset.infoCard));
  infoEl.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') { ultimoToque = performance.now(); esconderInfo(); } }); // tocar na explicação fecha
  document.addEventListener('click', (e) => { if (performance.now() - ultimoToque < 700) return; if (!infoEl.hidden && !infoEl.contains(e.target)) esconderInfo(); });
  document.addEventListener('pointerup', (e) => {   // toque fora fecha
    if (e.pointerType !== 'mouse' && !infoEl.hidden && !infoEl.contains(e.target) && !(infoAncora && infoAncora.contains(e.target))) esconderInfo();
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !infoEl.hidden) { const a = infoAncora; esconderInfo(); a?.focus?.(); } });
  addEventListener('scroll', () => { if (!infoEl.hidden) (infoFixo && infoAncora ? posicionarInfo(infoAncora) : esconderInfo()); }, { passive: true });

  // ---------------------------------------------------------------- séries
  function drawSeries() {
    fillSelect($('#s-ind'), indOptions(), st.ind);
    fillSelect($('#s-banda'), [{ label: 'Nenhuma', value: '' }, ...cohortOpts], st.banda);
    fillSelect($('#s-y0'), ANOS.map((a) => ({ label: a, value: a })), st.y0);
    fillSelect($('#s-y1'), ANOS.map((a) => ({ label: a, value: a })), st.y1);
    const chips = $('#s-paises');
    if (!chips.children.length) for (const p of ORDEM_PAISES) {
      const b = el('button', { class: 'chip', type: 'button', 'data-pais': p });
      b.append(el('span', { class: 'sw' }), document.createTextNode(PAIS[p]));
      b.addEventListener('click', () => { st.paises = st.paises.includes(p) ? st.paises.filter((q) => q !== p) : [...st.paises, p]; render(); });
      chips.appendChild(b);
    }
    chips.querySelectorAll('.chip').forEach((b) => {
      b.setAttribute('aria-pressed', String(st.paises.includes(b.dataset.pais)));
      b.querySelector('.sw').style.background = corPais(b.dataset.pais);
    });
    const meta = D.ind.get(st.ind);
    $('#s-titulo').textContent = `${meta.nome} (${meta.unidade})`;
    $('#s-nota').textContent = `Sentido: ${meta.direcao}. Fonte: ${meta.fonte}. Último ano disponível: ${meta.ultimo_ano}.`;
    const y0 = Math.min(st.y0, st.y1), y1 = Math.max(st.y0, st.y1), yrs = d3.range(y0, y1 + 1);
    const g = D.ser.get(st.ind);
    const series = [...st.paises].sort((a, b) => (a === 'bra') - (b === 'bra')).map((p) => {
      const m = new Map((g?.get(p) || []).map((r) => [+r.ano, +r.valor]));
      return { name: PAIS[p], color: corPais(p), pts: yrs.map((a) => ({ x: a, y: m.has(a) ? m.get(a) : null })), width: p === 'bra' ? 3 : 2 };
    });
    let band = null;
    if (st.banda) {
      const cr = new Map((D.coo.get(st.ind)?.get(st.banda) || []).map((r) => [+r.ano, r]));
      band = { color: css('--chart-muted'), pts: yrs.map((a) => ({ x: a, lo: cr.get(a)?.p25 ?? null, hi: cr.get(a)?.p75 ?? null })) };
      series.unshift({ name: 'Mediana ' + CNOME[st.banda].split(' (')[0], color: css('--chart-muted'), dash: '5 4', pts: yrs.map((a) => ({ x: a, y: cr.get(a)?.median ?? null })) });
    }
    const box = $('#s-chart');
    if (y0 === y1) return vazio(box, 'Escolha um intervalo de pelo menos dois anos.');
    lineChart(box, { series, band, yfmt: fmtv, xdomain: [y0, y1], endLabels: box.clientWidth > 520 });
  }
  $('#csv-serie').addEventListener('click', () => {
    const g = D.ser.get(st.ind), meta = D.ind.get(st.ind);
    const y0 = Math.min(st.y0, st.y1), y1 = Math.max(st.y0, st.y1);
    const linhas = d3.range(y0, y1 + 1).map((a) => {
      const o = { ano: a };
      for (const p of st.paises) o[p] = (g?.get(p) || []).find((r) => +r.ano === a)?.valor ?? null;
      return o;
    });
    baixarCSV(`monitora-brasil-${st.ind}.csv`, linhas, [{ titulo: 'ano', valor: (r) => r.ano }, ...st.paises.map((p) => ({ titulo: `${PAIS[p]} (${meta.unidade})`, valor: (r) => r[p] }))]);
  });

  function drawPeriodos() {
    const opts = PERIODOS.map((p) => ({ label: `${p} · ${MANDATO[p]}`, value: p }));
    fillSelect($('#p-a'), opts, st.pa); fillSelect($('#p-b'), opts, st.pb);
    let a = st.pa, b = st.pb, inv = false;
    if (a > b) { [a, b] = [b, a]; inv = true; }
    const msg = $('#p-msg');
    msg.textContent = a === b ? 'Escolha dois mandatos diferentes.' : inv ? `Mostrando A = ${a} e B = ${b}, em ordem cronológica.` : '';
    msg.hidden = !msg.textContent;
    const tb = $('#per-table tbody'); tb.replaceChildren();
    if (a === b) return;
    const dir = D.ind.get(st.ind).direcao;
    const up = dir === 'maior é melhor', down = dir === 'menor é melhor';
    for (const p of ['bra', ...st.paises.filter((q) => q !== 'bra')]) {
      const r = D.vPer.get(`${st.ind}|${p}|${a}|${b}`);
      if (!r) continue;
      const tr = el('tr'); if (p === 'bra') tr.className = 'destaque';
      const cls = (up && r.delta > 0) || (down && r.delta < 0) ? 'bom' : (up && r.delta < 0) || (down && r.delta > 0) ? 'ruim' : '';
      const cells = [
        [PAIS[p]], [fmtv(r.media_a)], [fmtv(r.media_b)], [sgn(r.delta, fmtv), cls], [r.delta_pct == null ? '—' : sgn(r.delta_pct, f1) + '%', cls],
        [fmtv(r.mediana_b), 'some-p'], [fmtv(r.desvio_b), 'some-p'], [r.tendencia_a == null ? '—' : sgn(r.tendencia_a, fmtv), 'some-p'],
        [r.tendencia_b == null ? '—' : sgn(r.tendencia_b, fmtv)],
      ];
      for (const [txt, c] of cells) tr.appendChild(el('td', c ? { class: c } : {}, txt));
      tb.appendChild(tr);
    }
  }

  // ---------------------------------------------------------------- coortes
  function anoPadrao(ind) {
    const rows = D.coo.get(ind)?.get('mundo') || [];
    const maxn = d3.max(rows, (r) => r.n) || 0;
    return d3.max(rows.filter((r) => r.n >= maxn * 0.6), (r) => +r.ano) || 2023;
  }
  const PEQUENAS = COORTES.filter((c) => c.membros); // América Latina, BRICS, OCDE
  const corPct = (p) => (p >= 60 ? css('--ok') : p < 40 ? css('--critical') : css('--chart-muted'));

  /** Régua de posição: uma linha por grupo, com a parcela de países que o Brasil supera. */
  function regua(box, linhas, contexto) {
    box.replaceChildren();
    if (!linhas.length) return vazio(box);
    for (const l of linhas) {
      const row = el('div', { class: 'regua-linha' });
      row.append(el('span', { class: 'regua-nome' }, l.nome));
      const trilho = el('div', { class: 'regua-trilho', role: 'img', 'aria-label': `${l.nome}: ${l.pct == null ? 'sem dado' : f0(l.pct) + '%'}` });
      if (l.pct != null) {
        const cheio = el('div', { class: 'regua-cheio' }); cheio.style.width = `${l.pct}%`; cheio.style.background = corPct(contexto ? 50 : l.pct); cheio.style.opacity = '.75';
        const marca = el('div', { class: 'regua-marca' }); marca.style.left = `${l.pct}%`;
        trilho.append(cheio, marca);
      }
      row.append(trilho);
      const frase = el('span', { class: 'regua-frase' });
      if (l.pct == null || !l.n) frase.textContent = 'Sem dado do Brasil neste ano';
      else {
        const verbo = contexto ? 'Acima de ' : 'Supera ';
        frase.append(verbo, el('b', {}, `${f0(Math.round(l.sup))} de ${l.n}`), ` ${l.n === 1 ? 'país' : 'países'} (${f0(l.pct)}%)`);
      }
      row.append(frase);
      box.append(row);
    }
  }

  /** Pontos por país, um grupo por linha, na mesma escala; nomes acima dos pontos sem sobreposição. */
  function pontosPorGrupo(box, grupos, fmt, sentido) {
    box.replaceChildren(); box.classList.remove('carregando');
    const todos = grupos.flatMap((g) => g.pts.map((p) => p.v)).concat(grupos.map((g) => g.br)).filter((v) => v != null);
    if (!todos.length) return vazio(box);
    const W = largura(box), ml = Math.min(120, W * 0.28), mr = 18;
    const x = d3.scaleLinear(d3.extent(todos), [ml + 8, W - mr]).nice();
    const svg = d3.select(box).append('svg').attr('width', '100%').attr('role', 'img');
    const probe = svg.append('text').style('font-size', '11px');
    const larg = (t) => { probe.text(t); return probe.node().getComputedTextLength(); };
    let y = 8;
    const linhas = [];
    for (const g of grupos) {
      const pts = [...g.pts, ...(g.br != null ? [{ pais: 'bra', nome: 'Brasil', v: g.br, br: true }] : [])].filter((p) => p.v != null).sort((a, b) => x(a.v) - x(b.v));
      // camadas de rótulos: cada nome vai para a primeira camada onde não encosta no anterior
      const fim = [];
      for (const p of pts) {
        const w = larg(p.nome), cx = Math.min(W - 2 - w / 2, Math.max(ml + 8 + w / 2 - 10, x(p.v))), x0 = cx - w / 2;
        let k = 0; while (fim[k] != null && fim[k] > x0 - 6) k++;
        fim[k] = cx + w / 2; p.camada = k; p.lx = cx;
      }
      const camadas = Math.max(1, fim.length);
      const alturaRotulos = camadas * 13;
      linhas.push({ g, pts, y0: y, yLinha: y + alturaRotulos + 10 });
      y += alturaRotulos + 30;
    }
    probe.remove();
    const H = y + 18;
    svg.attr('viewBox', `0 0 ${W} ${H}`);
    const ticks = x.ticks(Math.max(3, Math.floor((W - ml) / 90)));
    const tf = tickFmt(ticks);
    svg.append('g').selectAll('line').data(ticks).join('line').attr('x1', x).attr('x2', x).attr('y1', 0).attr('y2', H - 18).style('stroke', css('--grid'));
    svg.append('g').selectAll('text').data(ticks).join('text').attr('x', x).attr('y', H - 4).attr('text-anchor', 'middle').text(tf);
    for (const L of linhas) {
      svg.append('text').attr('x', 0).attr('y', L.yLinha).attr('dy', '0.32em').style('font-weight', 600).style('fill', css('--fg')).text(L.g.nome);
      svg.append('line').attr('x1', ml + 8).attr('x2', W - mr).attr('y1', L.yLinha).attr('y2', L.yLinha).style('stroke', css('--line'));
      for (const p of L.pts) {
        const cx = x(p.v), ly = L.yLinha - 12 - p.camada * 13;
        if (p.camada > 0) svg.append('line').attr('x1', cx).attr('x2', cx).attr('y1', ly + 3).attr('y2', L.yLinha - 6).style('stroke', css('--line'));
        svg.append('text').attr('x', p.lx).attr('y', ly).attr('text-anchor', 'middle').style('font-size', '11px')
          .style('fill', p.br ? cor(0) : css('--muted')).style('font-weight', p.br ? 700 : 400).text(p.nome);
        svg.append('circle').attr('cx', cx).attr('cy', L.yLinha).attr('r', p.br ? 7 : 5)
          .style('fill', p.br ? cor(0) : css('--chart-muted')).style('stroke', css('--panel')).attr('stroke-width', 1.5)
          .on('pointermove', (ev) => tip.show(ev, p.nome, [{ name: L.g.nome, value: fmt(p.v) }]))
          .on('pointerleave', () => tip.hide());
      }
    }
  }

  /** Histograma de quantos países caem em cada faixa, com a faixa do Brasil em destaque. */
  function histograma(box, h, brv, fmt) {
    box.replaceChildren(); box.classList.remove('carregando');
    if (!h) return vazio(box, 'Sem dados suficientes para este ano.');
    const W = largura(box), H = 220, mt = 22, mb = 34, ml = 30, mr = 8;
    const bins = h.bins, nb = bins.length;
    const x = d3.scaleBand(d3.range(nb), [ml, W - mr]).padding(0.12);
    const y = d3.scaleLinear([0, d3.max(bins, (b) => b.n) || 1], [H - mb, mt]).nice();
    const svg = d3.select(box).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img');
    const yt = y.ticks(4).filter(Number.isInteger);
    svg.append('g').selectAll('line').data(yt).join('line').attr('x1', ml).attr('x2', W - mr).attr('y1', y).attr('y2', y).style('stroke', css('--grid'));
    svg.append('g').selectAll('text').data(yt).join('text').attr('x', ml - 6).attr('y', y).attr('dy', '0.32em').attr('text-anchor', 'end').text((d) => d);
    bins.forEach((b, i) => {
      const ehBr = i === h.bin_brasil;
      svg.append('rect').attr('x', x(i)).attr('y', y(b.n)).attr('width', x.bandwidth()).attr('height', Math.max(0, y(0) - y(b.n))).attr('rx', 3)
        .style('fill', ehBr ? cor(0) : css('--chart-muted')).style('fill-opacity', ehBr ? 0.95 : 0.45);
      const de = i === 0 && h.abre_esq ? `até ${fmt(b.ate)}` : i === nb - 1 && h.abre_dir ? `${fmt(b.de)} ou mais` : `${fmt(b.de)} a ${fmt(b.ate)}`;
      svg.append('rect').attr('x', x(i)).attr('y', mt).attr('width', x.bandwidth()).attr('height', H - mb - mt).style('fill', 'transparent')
        .on('pointermove', (ev) => tip.show(ev, de, [{ name: 'Países', value: String(b.n) }, ...(ehBr ? [{ color: cor(0), name: 'Brasil', value: fmt(brv) }] : [])]))
        .on('pointerleave', () => tip.hide());
    });
    if (h.bin_brasil != null) {
      const cx = x(h.bin_brasil) + x.bandwidth() / 2;
      svg.append('text').attr('x', cx).attr('y', y(bins[h.bin_brasil].n) - 6).attr('text-anchor', 'middle').style('fill', cor(0)).style('font-weight', 700).text('Brasil');
    }
    const marcas = [0, Math.floor(nb / 2), nb - 1];
    svg.append('g').selectAll('text').data(marcas).join('text').attr('x', (i) => (i === 0 ? x(i) : i === nb - 1 ? x(i) + x.bandwidth() : x(i) + x.bandwidth() / 2)).attr('y', H - mb + 16).attr('text-anchor', (i) => (i === 0 ? 'start' : i === nb - 1 ? 'end' : 'middle'))
      .text((i) => (i === 0 && h.abre_esq ? '≤ ' + fmt(bins[i].ate) : i === nb - 1 && h.abre_dir ? '≥ ' + fmt(bins[i].de) : fmt((bins[i].de + bins[i].ate) / 2)));
    svg.append('text').attr('x', ml).attr('y', 12).style('font-size', '10px').text('nº de países');
  }

  /** Linha por grupo: % de países que o Brasil supera, ano a ano, entre "De" e "Até". */
  function drawPosicaoTempo(meta, contexto) {
    fillSelect($('#ct-y0'), ANOS.map((a) => ({ label: a, value: a })), st.cy0);
    fillSelect($('#ct-y1'), ANOS.map((a) => ({ label: a, value: a })), st.cy1);
    const y0 = Math.min(st.cy0, st.cy1), y1 = Math.max(st.cy0, st.cy1), anos = d3.range(y0, y1 + 1);
    $('#ct-titulo').textContent = `Posição do Brasil ao longo do tempo: ${meta.nome}`;
    const series = COORTES.map((c, i) => {
      const por = new Map((D.coo.get(st.ind)?.get(c.id) || []).map((r) => [+r.ano, r.pct_supera]));
      return { name: `vs. ${c.curto}`, color: cor([1, 2, 3, 6, 5][i]), width: c.id === 'mundo' ? 2.6 : 2, pts: anos.map((a) => ({ x: a, y: por.get(a) ?? null })) };
    });
    const brPorAno = new Map((D.ser.get(st.ind)?.get('bra') || []).map((r) => [+r.ano, r.valor]));
    const faixas = PERIODOS.map((p) => ({ de: +p.slice(0, 4), ate: +p.slice(0, 4) + 3, rotulo: MANDATO[p].replace(' (até 2025)', '') }));
    const box = $('#ct-chart');
    if (y0 === y1) return vazio(box, 'Escolha anos diferentes em "De" e "Até" para ver a evolução.');
    lineChart(box, {
      series, yfmt: (v) => `${f0(v)}%`, xdomain: [y0, y1], ydomain: [0, 100], ref: 50, faixas,
      endLabels: box.clientWidth > 560, height: 320, legenda: true,
      tituloTip: (a) => { const v = brPorAno.get(a); return `${a} · Brasil: ${v == null ? 'sem dado' : textoUnidade(v, meta.unidade)}`; },
    });
  }

  function drawCoortes() {
    fillSelect($('#c-ind'), indOptions(), st.ind);
    fillSelect($('#cs-tema'), TEMAS.map((t) => ({ label: t.nome, value: t.id })), st.cstema);
    if (st.cano == null || st.canoInd !== st.ind) { st.cano = anoPadrao(st.ind); st.canoInd = st.ind; }
    fillSelect($('#c-ano'), ANOS.map((a) => ({ label: a, value: a })), st.cano);
    const meta = D.ind.get(st.ind), ano = st.cano, contexto = !meta.entra_no_escore;
    $('#c-titulo').textContent = `${meta.nome} em ${ano} (${meta.unidade})`;
    $('#c-sentido').textContent = contexto
      ? 'Este indicador é só de contexto: não há valor "melhor". A régua mostra de quantos países o Brasil está acima.'
      : `Neste indicador, ${meta.direcao}.`;
    { const v = (D.ser.get(st.ind)?.get('bra') || []).find((r) => +r.ano === ano)?.valor;
      $('#c-sentido').textContent += v == null ? ` O Brasil não tem dado em ${ano}.` : ` Brasil em ${ano}: ${textoUnidade(v, meta.unidade).replace(/\.$/, '')}.`; }

    const linhaCoorte = (c) => (D.coo.get(st.ind)?.get(c.id) || []).find((x) => +x.ano === ano);
    regua($('#c-regua'), COORTES.map((c) => { const r = linhaCoorte(c); return { nome: c.nome, pct: r?.pct_supera ?? null, sup: r?.n_supera, n: r?.n_comp }; }), contexto);

    drawPosicaoTempo(meta, contexto);

    const valor = (p) => (D.ser.get(st.ind)?.get(p) || []).find((r) => +r.ano === ano)?.valor ?? null;
    const brv = valor('bra');
    pontosPorGrupo($('#c-pontos'), PEQUENAS.map((c) => ({ nome: c.curto, br: brv, pts: c.membros.map((m) => ({ pais: m, nome: PAIS[m], v: valor(m) })) })), fmtv);

    histograma($('#c-hist-mundo'), D.hist.get(`${st.ind}|mundo|${ano}`), brv, fmtv);
    histograma($('#c-hist-umic'), D.hist.get(`${st.ind}|umic|${ano}`), brv, fmtv);

    // tabela e box plot (opcional)
    const rows = COORTES.map((c) => {
      const r = linhaCoorte(c);
      return r && { label: c.nome, curto: c.curto, n: r.n, min: r.min, p25: r.p25, median: r.median, p75: r.p75, max: r.max, mean: r.mean, br: r.brasil, raw: r, c };
    }).filter(Boolean);
    const boxAberto = $('#c-box-btn').getAttribute('aria-expanded') === 'true';
    $('#c-box-area').hidden = !boxAberto;
    if (boxAberto) boxPlot($('#c-box'), rows, fmtv);
    const tb = $('#c-table tbody'); tb.replaceChildren();
    for (const d of rows) {
      const tr = el('tr');
      tr.appendChild(el('td', {}, d.c.nome));
      for (const [f, cls] of [['n'], ['mean'], ['median'], ['sd'], ['p25', 'some-p'], ['p75', 'some-p'], ['min', 'some-p'], ['max', 'some-p'], ['brasil'], ['z_brasil']]) {
        const v = d.raw[f];
        tr.appendChild(el('td', cls ? { class: cls } : {}, v == null ? '—' : f === 'n' ? String(v) : f === 'z_brasil' ? sgn(v, f2) : fmtv(v)));
      }
      tb.appendChild(tr);
    }

    // escore por grupo
    const last = D.escLast;
    $('#cs-titulo').textContent = `${TNOME[st.cstema]}: escore por grupo em ${last}`;
    const esc = (p) => (D.esc.get(p)?.get(st.cstema) || []).find((r) => +r.ano === last)?.escore ?? null;
    regua($('#cs-regua'), COORTES.map((c) => {
      const r = (D.escC.get(c.id)?.get(st.cstema) || []).find((x) => +x.ano === last);
      return { nome: c.nome, pct: r?.pct_supera ?? null, sup: r?.n_supera, n: r?.n_comp };
    }), false);
    pontosPorGrupo($('#cs-pontos'), PEQUENAS.map((c) => ({ nome: c.curto, br: esc('bra'), pts: c.membros.map((m) => ({ pais: m, nome: PAIS[m], v: esc(m) })) })), (v) => (v == null ? '—' : f1(v)));
  }
  $('#c-box-btn').addEventListener('click', (e) => {
    const b = e.currentTarget, aberto = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', String(aberto));
    b.textContent = aberto ? 'Esconder box plot' : 'Ver box plot';
    render();
  });

  // ---------------------------------------------------------------- metodologia
  function drawMetodo() {
    const ul = $('#m-coortes');
    if (!ul.children.length) for (const c of COORTES) ul.appendChild(el('li', {}, `${c.nome}: ${c.membros ? c.membros.map((m) => PAIS[m]).join(', ') : c.id === 'umic' ? 'todos os países que o Banco Mundial classifica como renda média-alta, grupo do Brasil.' : 'todos os países com dado no ano.'}`));
    const tb = $('#m-table tbody');
    if (tb.children.length) return;
    for (const r of D.indicadores) {
      const tr = el('tr');
      const nome = el('td', { class: 'quebra' });
      const wrap = el('span', { class: 'nome-info' }, r.nome);
      const bi = botaoInfo(`O que é ${r.nome}? Explicação em linguagem simples`);
      ligarInfo(bi, () => r.id);
      wrap.append(bi); nome.append(wrap);
      tr.append(nome, el('td', {}, TNOME[r.tema]), el('td', {}, r.unidade), el('td', {}, r.direcao),
        el('td', { class: 'some-p' }, r.fonte), el('td', { class: 'some-p mono' }, r.codigo_oficial || '—'), el('td', {}, String(r.ultimo_ano)));
      const lk = el('td', { class: 'links' });
      if (r.url_fonte) lk.append(el('a', { href: r.url_fonte, target: '_blank', rel: 'noopener' }, 'Página'));
      if (r.url_api) { lk.append(' · '); lk.append(el('a', { href: r.url_api, target: '_blank', rel: 'noopener' }, 'API')); }
      tr.append(lk);
      tb.appendChild(tr);
    }
  }

  // ---------------------------------------------------------------- navegação e render
  function show(page, push = true) {
    if (!PAGINAS.includes(page)) page = 'visao';
    st.page = page;
    document.querySelectorAll('.aba').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.page === page)));
    document.querySelectorAll('.pagina').forEach((p) => { p.hidden = p.id !== page; });
    if (push) history.replaceState(null, '', page === 'visao' ? location.pathname : `#${page}`);
    render();
  }
  document.querySelectorAll('.aba').forEach((t) => t.addEventListener('click', () => show(t.dataset.page)));
  addEventListener('hashchange', () => show(location.hash.slice(1), false));

  const on = (sel, fn) => $(sel).addEventListener('change', (e) => { fn(e.target.value); render(); });
  on('#v-coorte', (v) => { st.coorte = v; });
  on('#v-mandato', (v) => { st.mandato = v; });
  on('#s-ind', (v) => { st.ind = v; });
  on('#c-ind', (v) => { st.ind = v; });
  on('#s-banda', (v) => { st.banda = v; });
  on('#s-y0', (v) => { st.y0 = +v; });
  on('#s-y1', (v) => { st.y1 = +v; });
  on('#p-a', (v) => { st.pa = v; });
  on('#p-b', (v) => { st.pb = v; });
  on('#c-ano', (v) => { st.cano = +v; st.canoInd = st.ind; });
  on('#cs-tema', (v) => { st.cstema = v; });
  on('#ct-y0', (v) => { st.cy0 = +v; });
  on('#ct-y1', (v) => { st.cy1 = +v; });

  function render() {
    if (!D) return;
    tip.hide();
    if (st.page === 'visao') {
      fillSelect($('#v-coorte'), cohortOpts, st.coorte);
      fillSelect($('#v-mandato'), [...MANDATOS_ESC].reverse().map((m) => ({ label: `${m.id} · ${m.nome}`, value: m.id })), st.mandato);
      drawCartoes(); drawEvolucao(); drawDecomp(); drawRanking();
    } else if (st.page === 'series') { drawSeries(); drawPeriodos(); }
    else if (st.page === 'coortes') drawCoortes();
    else drawMetodo();
  }

  let rz;
  new ResizeObserver(() => { clearTimeout(rz); rz = setTimeout(render, 120); }).observe($('main'));

  // ---------------------------------------------------------------- início
  document.querySelectorAll('.grafico').forEach((g) => g.classList.add('carregando'));
  show(location.hash.slice(1) || 'visao', false);
  carregar().then((ix) => {
    D = ix;
    drawResumo();
    render();
  }).catch((err) => {
    const e = $('#erro');
    e.hidden = false;
    e.textContent = location.protocol === 'file:'
      ? 'Os dados não carregam ao abrir o arquivo direto do disco. Sirva a pasta por HTTP (por exemplo: python -m http.server dentro de site/) ou publique numa hospedagem.'
      : `Não foi possível carregar os dados. ${err.message}`;
    document.querySelectorAll('.carregando').forEach((g) => g.classList.remove('carregando'));
  });
})();
