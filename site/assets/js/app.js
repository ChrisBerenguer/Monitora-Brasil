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
    consumo: 'consumo.json',
    economias: 'economias.json',
    estatais: 'estatais.json',
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
  const PAGINAS = ['visao', 'series', 'coortes', 'metodo', 'vida', 'estatais', 'votar'];
  const APELIDOS = { consumo: 'vida' }; // endereços antigos continuam funcionando
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
    ga: '2019–2022', gb: '2023–2026', cbItem: 'cesta', cbY0: 2001, cbReal: true, cbMa: '2019–2022', cbMb: '2023–2026', cano: null, canoInd: null, cy0: 2000, cy1: 2025, cstema: 'geral', sort: { key: 'geral', dir: -1 },
    estFiltro: 'todas', estSort: { key: null, dir: -1 },
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
    ix.perBr = new Map(raw.periodos.filter((r) => r.pais === 'bra').map((r) => [`${r.ind}|${r.periodo}`, r.media == null ? null : +r.media]));
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
  function lineChart(box, { series, band, yfmt, xdomain, height = 340, endLabels = true, destaque = null, ydomain = null, faixas = null, ref = null, legenda = false, tituloTip = null, mensal = false }) {
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
    // garante o último ano no eixo: sem isso a régua pode parar em 2024 e dar a impressão de que a série acabou ali
    if (xt.length > 1 && xt.at(-1) !== xdomain[1]) {
      const passo = xt[1] - xt[0];
      if (xdomain[1] - xt.at(-1) >= passo) xt.push(xdomain[1]); else xt[xt.length - 1] = xdomain[1];
    }
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
        const bruto = Math.max(xdomain[0], Math.min(xdomain[1], x.invert(mx)));
        // séries anuais casam com o ano inteiro; mensais pegam o ponto mais próximo do cursor
        const perto = (s) => s.pts.filter((p) => p.y != null).reduce((a, p) => (a == null || Math.abs(p.x - bruto) < Math.abs(a.x - bruto) ? p : a), null);
        const xv = mensal ? bruto : Math.round(bruto);
        const hits = series.map((s) => ({ s, p: mensal ? perto(s) : s.pts.find((p) => p.x === xv) })).filter((d) => d.p && d.p.y != null);
        const xl = mensal && hits.length ? hits[0].p.x : xv;
        rule.attr('x1', x(xl)).attr('x2', x(xl)).attr('visibility', 'visible');
        dots.selectAll('circle').data(hits).join('circle').attr('cx', (d) => x(d.p.x)).attr('cy', (d) => y(d.p.y)).attr('r', 3.8).style('fill', (d) => d.s.color);
        const L = hits.sort((a, b) => b.p.y - a.p.y).map((d) => ({ color: d.s.color, name: d.s.name, value: yfmt(d.p.y) }));
        const bp = band?.pts.find((p) => p.x === xv);
        if (bp && bp.lo != null) L.push({ name: 'Faixa da coorte', value: `${yfmt(bp.lo)} a ${yfmt(bp.hi)}` });
        tip.show(ev, tituloTip ? tituloTip(mensal && hits.length ? hits[0].p : xv) : String(xv), L.length ? L : [{ name: 'Sem dado neste ano', value: '' }]);
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
  // ---------------------------------------------------------------- posição do Brasil no mundo
  const ordinalF = (n) => `${f0(n)}ª`;  // economia: "a 11ª maior do mundo"
  function drawPosicao() {
    // posição por tamanho da economia: PIB nominal (FMI, série NGDPD), 1ª = maior economia do mundo
    const ec = new Map();
    for (const r of D.raw.economias?.anos || []) {
      ec.set(+r.ano, { pos: +r.posicao, n: +r.paises, pib: r.pib_usd, proj: !!r.projecao });
    }
    const serEc = [...ec.entries()].sort((x, y) => x[0] - y[0])
      .filter(([a]) => a >= ANOS[0])
      .map(([a, v]) => ({ x: a, y: v.pos, n: v.n, pib: v.pib, proj: v.proj }));
    if (!serEc.length) return;
    const obs = serEc.filter((p) => !p.proj), proj = serEc.filter((p) => p.proj);
    const ePri = serEc[0], eObs = obs.at(-1), eProj = proj.at(-1);
    const tri = (v) => `US$ ${f2(v / 1e12)} tri`;
    const anoHoje = new Date().getFullYear();
    const eHoje = serEc.find((p) => p.x === anoHoje);
    $('#pos-nota').textContent = `Posição do Brasil entre as maiores economias do mundo, pelo PIB nominal em dólares: 1ª é a maior. Em ${ePri.x} o Brasil era a ${ordinalF(ePri.y)} e em ${eObs.x}, o último ano fechado, a ${ordinalF(eObs.y)}, com ${tri(eObs.pib)}.` +
      (eHoje && eHoje.proj ? ` Para ${anoHoje} o FMI projeta a ${ordinalF(eHoje.y)} posição, com ${tri(eHoje.pib)}` : '') +
      (eProj && eProj.x > anoHoje ? `, e a ${ordinalF(eProj.y)} em ${eProj.x}.` : eHoje && eHoje.proj ? '.' : '') +
      ' A quantidade de países muda de um ano para outro, e o valor em dólares depende do câmbio.';
    const boxE = $('#pos-chart-econ');
    lineChart(boxE, {
      series: [
        { name: 'Posição do Brasil', color: css('--s4'), width: 2.6, pts: obs },
        // a projeção do FMI entra tracejada e emendada no último ano observado
        ...(proj.length ? [{ name: 'Projeção do FMI', color: css('--s4'), width: 2, dash: '5 4', pts: eObs ? [eObs, ...proj] : proj }] : []),
      ],
      legenda: proj.length > 0,
      // eixo invertido: a melhor posição (1ª) fica em cima
      ydomain: [d3.max(serEc, (p) => p.y) + 2, 1], yfmt: ordinalF,
      xdomain: [ePri.x, d3.max(serEc, (p) => p.x)],
      faixas: FAIXAS_MANDATO(), endLabels: boxE.clientWidth > 560, height: 240,
      tituloTip: (a) => {
        const p = serEc.find((x) => x.x === a);
        return p ? `${a}${p.proj ? ' (projeção)' : ''} · ${tri(p.pib)} · entre ${f0(p.n)} países` : String(a);
      },
    });
    const tb = $('#pos-table tbody'); tb.replaceChildren();
    for (const p of MANDATOS_ESC) {
      const { a, b } = anosMandato(p, D.escLast);
      const pa = ec.get(a), pb = ec.get(b);
      if (!pa || !pb) continue;
      const d = pa.pos - pb.pos; // ganhar posições quer dizer subir no ranking, ou seja, o número cair
      const nome = el('td');
      nome.append(p.nome.replace(' (até 2025)', ''), el('span', { class: 'cod' }, ` · ${a} a ${b}`));
      const tr = el('tr');
      tr.append(nome,
        el('td', {}, `${ordinalF(pa.pos)} → ${ordinalF(pb.pos)}`),
        el('td', { class: d > 0 ? 'bom' : d < 0 ? 'ruim' : '' }, d === 0 ? 'manteve' : sgn(d, f0)),
        el('td', {}, `${tri(pa.pib)} → ${tri(pb.pib)}`),
        el('td', { class: 'some-p' }, `${f0(pa.n)} → ${f0(pb.n)}`));
      tb.append(tr);
    }
  }

  // ---------------------------------------------------------------- placar entre mandatos
  /** Diferenças menores que esta fração do desvio-padrão entre os países do mundo contam como empate. */
  const EMPATE_SD = 0.03;
  const COR_A = () => css('--s3'), COR_B = () => css('--s5'), COR_I = () => css('--chart-muted');
  const nomeMandato = (p) => MANDATO[p].replace(' (até 2025)', '');
  const anosTexto = (p) => { const i = +p.slice(0, 4), f = Math.min(i + 3, ANOS.at(-1)); return `${i} a ${f}`; };
  /** Classifica cada indicador: 'A' ou 'B' (média melhor), 'I' (praticamente igual), 'S' (sem dado), 'C' (contexto). */
  function calcPlacar(a, b) {
    const ia = +a.slice(0, 4), fb = Math.min(+b.slice(0, 4) + 3, ANOS.at(-1));
    return D.indicadores.map((m) => {
      const va = D.perBr.get(`${m.id}|${a}`), vb = D.perBr.get(`${m.id}|${b}`);
      if (!m.entra_no_escore) return { m, va, vb, k: 'C' };
      if (va == null || vb == null || Number.isNaN(va) || Number.isNaN(vb)) return { m, va, vb, k: 'S' };
      const alvo = /mais perto de ([\d.,]+)/.exec(m.direcao);
      const bom = (v) => (alvo ? -Math.abs(v - +alvo[1].replace(',', '.')) : m.direcao.startsWith('maior') ? v : -v);
      const dif = bom(vb) - bom(va);
      const sds = (D.coo.get(m.id)?.get('mundo') || []).filter((r) => +r.ano >= ia && +r.ano <= fb && r.sd != null).map((r) => +r.sd);
      const sd = sds.length ? d3.median(sds) : null;
      const k = sd != null && Math.abs(dif) < EMPATE_SD * sd ? 'I' : dif > 0 ? 'B' : dif < 0 ? 'A' : 'I';
      return { m, va, vb, k, estrito: dif > 0 ? 'B' : dif < 0 ? 'A' : 'I' };
    });
  }
  function drawPlacar() {
    const opts = PERIODOS.map((p) => ({ label: `${p} · ${MANDATO[p]}`, value: p }));
    fillSelect($('#pl-a'), opts, st.ga); fillSelect($('#pl-b'), opts, st.gb);
    let a = st.ga, b = st.gb; if (a > b) [a, b] = [b, a];
    const msg = $('#pl-msg');
    msg.textContent = a === b ? 'Escolha dois mandatos diferentes.' : st.ga > st.gb ? `Mostrando A = ${a} e B = ${b}, em ordem cronológica.` : '';
    msg.hidden = !msg.textContent;
    const num = $('#pl-num'), waf = $('#pl-waffle'), leg = $('#pl-leg'), rod = $('#pl-rodape');
    if (a === b) { num.replaceChildren(); waf.replaceChildren(); leg.replaceChildren(); rod.textContent = ''; return; }
    const rows = calcPlacar(a, b);
    const n = (k) => rows.filter((r) => r.k === k).length;
    $('#pl-titulo').textContent = `${nomeMandato(a)} e ${nomeMandato(b)}: placar dos ${rows.length} indicadores`;
    $('#pl-sub').textContent = `Em quantos dos ${rows.length} indicadores cada mandato teve média melhor, levando em conta se é melhor ter valor alto ou baixo.`;
    const cartao = (p, k, cor) => {
      const d = el('div'); d.style.background = cor;
      d.append(el('small', {}, nomeMandato(p)), el('strong', {}, String(n(k))), el('span', {}, `${anosTexto(p)} · média melhor`));
      return d;
    };
    num.replaceChildren(cartao(a, 'A', COR_A()), cartao(b, 'B', COR_B()));
    const ordem = { A: 0, B: 1, I: 2, S: 3, C: 4 };
    const rotulo = { A: `${nomeMandato(a)} melhor`, B: `${nomeMandato(b)} melhor`, I: 'Praticamente iguais', S: 'Sem dado em um dos mandatos', C: 'Só de contexto' };
    const corK = { A: COR_A(), B: COR_B(), I: COR_I() };
    waf.replaceChildren();
    for (const r of [...rows].sort((x, y) => ordem[x.k] - ordem[y.k] || x.m.nome.localeCompare(y.m.nome, 'pt'))) {
      const q = el('i', { role: 'listitem', 'aria-label': `${r.m.nome}: ${rotulo[r.k]}` });
      if (corK[r.k]) { q.style.background = corK[r.k]; if (r.k === 'I') q.style.opacity = '.55'; } else q.className = r.k === 'S' ? 'sd' : 'ct';
      q.addEventListener('pointermove', (ev) => tip.show(ev, r.m.nome, [
        { color: COR_A(), name: `${nomeMandato(a)} (média)`, value: r.va == null || Number.isNaN(r.va) ? 'sem dado' : fmtv(r.va) },
        { color: COR_B(), name: `${nomeMandato(b)} (média)`, value: r.vb == null || Number.isNaN(r.vb) ? 'sem dado' : fmtv(r.vb) },
        { name: 'Resultado', value: r.k === 'C' ? 'só de contexto' : rotulo[r.k] },
        { name: 'Sentido', value: r.m.direcao },
      ]));
      q.addEventListener('pointerleave', () => tip.hide());
      waf.append(q);
    }
    leg.replaceChildren();
    for (const k of ['A', 'B', 'I', 'S', 'C']) {
      if (!n(k)) continue;
      const s = el('span'), i = el('i');
      if (corK[k]) { i.style.background = corK[k]; if (k === 'I') i.style.opacity = '.55'; } else i.className = k === 'S' ? 'sd' : 'ct';
      s.append(i, `${rotulo[k]}: ${n(k)}`); leg.append(s);
    }
    const ea = rows.filter((r) => r.estrito === 'A').length, eb = rows.filter((r) => r.estrito === 'B').length;
    rod.replaceChildren(`Contando qualquer diferença, por menor que seja: ${nomeMandato(a)} ${ea}, ${nomeMandato(b)} ${eb}.`, el('span', { class: 'so-tela' }, ' Passe o mouse sobre um quadrado para ver o indicador e as duas médias.'));
  }

  function drawCartoes() {
    const box = $('#cartoes'), last = D.escLast;
    box.replaceChildren();
    for (const t of TEMAS) {
      const card = el('div', { class: 'card tema', role: 'button', tabindex: '0', 'aria-pressed': String(st.tema === t.id) });
      const topo = el('div', { class: 'tema-topo' });
      const bf = botaoFonte('tema:' + t.id);
      ligarInfo(bf, () => 'fonte:tema:' + t.id);
      const bi = botaoInfo(`Como ler o cartão ${t.nome}`);
      ligarInfo(bi, () => 'card:cartao:' + t.id);
      const icones = el('span', { class: 'tema-icones' }); icones.append(bi, bf);
      topo.append(el('h3', {}, t.nome), icones);
      card.appendChild(topo);
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
      card.addEventListener('keydown', (e) => { if (e.target === card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); st.tema = t.id; render(); } });
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
  /** Contexto da tabela de mandatos para os exemplos das explicações: indicador, mandatos e linha do Brasil. */
  function ctxPeriodos() {
    let a = st.pa, b = st.pb; if (a > b) [a, b] = [b, a];
    const meta = D.ind.get(st.ind), r = D.vPer.get(`${st.ind}|bra|${a}|${b}`);
    const pct = meta.unidade.trim().startsWith('%');
    return { a, b, meta, r, pct, u: (v) => textoUnidade(v, meta.unidade).replace(/\.$/, '') };
  }
  const exemploBr = (f) => {
    const c = ctxPeriodos();
    if (!c.r || c.a === c.b) return [];
    return [['No Brasil, agora', f(c).replace(/\.\.$/, '.')]];
  };
  const CARD_INFO = {
    'est-total': { titulo: 'Lucro líquido das estatais federais', blocos: [
      ['O que mostra', 'A soma do lucro líquido (ou prejuízo) de todas as estatais federais em cada ano: o que sobra depois de pagar custos, juros e impostos. As barras têm a cor do mandato presidencial em que o ano caiu. A tabela abaixo soma os anos de cada mandato e mostra a média por ano, que permite comparar mandatos com número diferente de anos.'],
      ['Como se conta', 'Grupos como Petrobras, Banco do Brasil, BNDES e Caixa entram uma vez só, pelo balanço consolidado do grupo, com as subsidiárias dentro. As demais estatais entram uma a uma. Os valores estão em reais de cada ano, sem correção pela inflação.'],
      ['Atenção', 'Lucro de estatal depende muito do preço do petróleo, dos juros e de vendas de ativos (privatizações e venda de participações), que inflam o resultado de um ano só. A Petrobras sozinha costuma responder por mais da metade da soma. Lucro alto não quer dizer, por si só, empresa bem gerida, nem prejuízo quer dizer o contrário: hospitais, empresas de pesquisa e de trens urbanos existem para prestar serviço e vivem de recursos do Tesouro.'],
    ] },
    'est-tabela': { titulo: 'Resultado de cada estatal', blocos: [
      ['O que mostra', 'O lucro líquido de cada estatal federal (ou grupo) em cada ano, em milhões de reais, e a soma nos dois últimos mandatos. Prejuízo aparece em vermelho. O traço quer dizer que a empresa não existia, não era estatal ou ainda não entregou o balanço daquele ano.'],
      ['Grupos e dependentes', 'Grupo é a empresa-mãe com as subsidiárias, num balanço só. "Dependentes do Tesouro" são as estatais que recebem dinheiro do Orçamento para pagar salários ou custeio, como Embrapa, Ebserh e Codevasf. As demais se sustentam com o que vendem.'],
      ['Atenção', 'A Eletrobras deixou de ser estatal em junho de 2022, quando foi privatizada; a partir de então Eletronuclear e INB passam ao grupo ENBPar. Mudanças de grupo e fusões explicam linhas que começam ou terminam no meio da tabela.'],
    ] },
    posicao: { titulo: 'Posição do Brasil entre as economias do mundo', blocos: [
      ['O que mostra', 'Em que lugar o Brasil fica quando os países do mundo são postos em fila pelo tamanho da economia: o PIB nominal em dólares, da maior economia (1ª) para a menor. É o ranking que aparece nas manchetes. O Brasil está entre as dez ou doze maiores economias do mundo há décadas.'],
      ['Como ler', 'O eixo está invertido: a melhor posição (1ª) fica em cima. Linha subindo quer dizer que o Brasil ganhou posições; descendo, perdeu. Na tabela, um número positivo é ganho de posições.'],
      ['Por mandato', 'A tabela compara a posição e o PIB no ano anterior à posse com os do fim do mandato. Como o painel começa em 2000, o mandato de FHC 2 é medido de 2000 a 2002.'],
      ['De onde vem o PIB', 'Da série NGDPD do World Economic Outlook do FMI: PIB a preços correntes, convertido em dólares pelo câmbio de mercado (PIB nominal). Como o valor depende do câmbio, uma desvalorização do real derruba a posição do Brasil mesmo sem a economia encolher em reais. O ano mais recente é projeção do FMI, e não dado fechado.'],
      ['Atenção', 'O número de países com dado muda de ano para ano, o que também mexe na posição. Tamanho da economia não diz nada sobre a vida das pessoas: para isso, veja o PIB per capita e os demais indicadores do painel.'],
    ] },    'cb-ganho': { titulo: 'Salário mínimo acima da inflação', blocos: [
      ['O que mostra', 'Em cada mandato, quanto o salário mínimo aumentou, quanto a inflação subiu no mesmo período e o que sobrou disso: o ganho real. É a medida mais direta do poder de compra de quem vive do piso salarial.'],
      ['Como é calculado', 'Compara o salário mínimo de dezembro anterior à posse com o do fim do mandato, e a inflação (IPCA) entre os mesmos dois meses. Ganho real é o aumento do salário descontada a inflação: se o salário subiu 30% e a inflação foi 20%, o ganho real é de cerca de 8%, e não de 10 pontos, porque o cálculo é uma divisão e não uma subtração.'],
      ['Como ler', 'Barra verde quer dizer que o salário mínimo subiu mais que a inflação naquele mandato, e o trabalhador passou a comprar mais com ele. Vermelha quer dizer que a inflação comeu o aumento. A última coluna da tabela é o poder de compra acumulado desde o início da série, com 100 no primeiro mandato mostrado.'],
      ['Atenção', 'O salário mínimo é reajustado uma vez por ano, quase sempre em janeiro, então entre um reajuste e outro a inflação corrói o valor; o gráfico de linha acima mostra esse movimento de serra. O mandato em curso é comparado até o último mês com dado, e por isso ainda pode mudar.'],
    ] },
    'cb-mandatos': { titulo: 'Médias por mandato presidencial', blocos: [
      ['O que mostra', 'O preço médio de cada item em todos os meses de dois mandatos, para comparar períodos em vez de um mês solto. É a mesma ideia da tabela "Comparar dois mandatos" da aba Séries temporais.'],
      ['Preços corrigidos', 'Todas as médias estão em preços de hoje, corrigidas pela inflação. Sem isso, qualquer mandato mais recente pareceria sempre o mais caro, só porque a moeda perde valor com o tempo.'],
      ['Como ler as cores', 'As cores ficam nas duas últimas colunas, que mostram quanto um salário mínimo comprava em média em cada mandato. Verde marca o mandato em que o salário comprava mais daquele item, e vermelho o outro. Essa comparação junta preço e renda, então é a que mais se aproxima do que a pessoa sente no bolso: um item pode ficar mais caro e ainda assim caber melhor no orçamento, se o salário subiu mais que ele. Quando os dois mandatos aparecem com o mesmo número, nenhum fica colorido.'],
      ['Série parcial', 'A marca "série parcial" avisa que a fonte não cobre o mandato inteiro: a cesta básica começa em 2001 e os combustíveis em julho de 2001, então mandatos anteriores ficam de fora ou aparecem incompletos. O mandato atual também é parcial, porque ainda não acabou.'],
      ['Atenção', 'Preço de combustível depende muito do petróleo e do câmbio, e a cesta básica depende de safra e clima. Coincidir com um mandato não prova que o governo causou o resultado.'],
    ] },
    'cb-hoje': { titulo: 'Quanto custa hoje', blocos: [
      ['O que mostra', 'O preço médio mais recente de cada item no Brasil, a variação em 12 meses já descontada a inflação, e quanto um salário mínimo compra daquele item em um mês.'],
      ['Como ler a variação', 'Verde quer dizer que ficou mais barato em relação ao resto dos preços; vermelho, mais caro. Como o valor é corrigido pela inflação, um item que subiu menos que a inflação aparece em verde, mesmo tendo subido em reais.'],
      ['Atenção', 'São médias nacionais: o preço na sua cidade pode ser bem diferente. A cesta básica é a média das capitais pesquisadas pelo DIEESE no mês, e cada capital tem a sua própria lista de preços.'],
    ] },
    'cb-serie': { titulo: 'Preço ao longo do tempo', blocos: [
      ['O que mostra', 'O preço médio do item escolhido, mês a mês. As faixas marcam os mandatos presidenciais.'],
      ['Corrigir pela inflação', 'Com a opção marcada, todos os meses aparecem em preços de hoje: é o que aquele valor valeria agora. Assim dá para comparar 2005 com 2026. Sem a correção, o gráfico mostra o preço que estava na bomba ou na prateleira na época, e quase tudo parece sempre subir, porque a moeda perde valor.'],
      ['Por que isso importa', 'Em reais correntes, o gás de cozinha e a gasolina batem recordes quase todo ano. Corrigido pela inflação, o desenho muda e mostra os períodos em que esses itens de fato pesaram mais no bolso.'],
      ['Atenção', 'A cesta básica começa antes dos combustíveis: a série da ANP é mensal desde julho de 2001. O último mês pode ser revisado pela fonte.'],
    ] },
    'cb-poder': { titulo: 'Quanto um salário mínimo compra', blocos: [
      ['O que mostra', 'Quantas unidades do item um salário mínimo compraria naquele mês: cestas básicas, litros de combustível ou botijões de gás.'],
      ['Como ler', 'A linha subindo quer dizer que o salário mínimo passou a comprar mais, por ter aumentado mais que o preço. Descendo, o preço subiu mais que o salário. Essa é a medida mais direta de poder de compra, porque junta preço e renda num número só.'],
      ['Atenção', 'O salário mínimo é só uma referência: a maioria das pessoas ganha mais ou menos que isso, e uma família costuma ter mais de uma renda. O cálculo usa o salário mínimo vigente no mês, sem descontos.'],
    ] },
    'cb-renda': { titulo: 'Renda e salário mínimo', blocos: [
      ['O que mostra', 'As barras são o rendimento médio mensal domiciliar per capita: a soma de tudo o que entra numa casa dividida pelo número de moradores, em média. Vem da PNAD Contínua do IBGE e já está em valores reais.'],
      ['Como ler', 'Per capita quer dizer por morador: numa família de quatro pessoas com renda de R$ 8.000, a renda per capita é R$ 2.000. É uma média, então convive com muita gente ganhando bem menos e pouca gente ganhando muito.'],
      ['Salário mínimo real', 'O gráfico de baixo mostra o salário mínimo de cada mês corrigido para preços de hoje. Os degraus são os reajustes anuais, e a queda entre um reajuste e outro é a inflação corroendo o valor.'],
      ['Atenção', 'Não há dado de 2020: a pandemia interrompeu a coleta presencial da PNAD Contínua anual. A série começa em 2016.'],
    ] },
    placar: { titulo: 'Placar entre mandatos', blocos: [
      ['O que mostra', 'Para cada indicador, compara a média do Brasil nos dois mandatos escolhidos e conta em quantos cada um teve a média melhor. Cada quadrado é um indicador: passe o mouse para ver qual é e as duas médias.'],
      ['Como se decide', '"Melhor" leva em conta o sentido de cada indicador: em desemprego e pobreza, menor é melhor; em PIB e expectativa de vida, maior é melhor; em inflação e juros reais, o melhor é ficar perto da meta (3% e 2%). Os indicadores só de contexto, como receita tributária, não entram na disputa.'],
      ['Praticamente iguais', 'Quando a diferença entre as médias é menor que 3% da distância típica entre os países do mundo naquele indicador (o desvio-padrão), o indicador conta como empate. Assim, uma diferença de 99,75% para 99,80% em acesso à eletricidade não decide nada. O rodapé mostra o placar sem essa regra.'],
      ['Atenção', 'Cada indicador vale um ponto, então o placar diz em quantos indicadores cada mandato foi melhor, e não quanto melhor. O mandato atual tem dados só até 2025, e vários indicadores saem com atraso. Crises de fora, como a pandemia de 2020 e 2021, e tendências herdadas do governo anterior pesam nas médias. Coincidir com um mandato não prova que o governo causou o resultado.'],
    ] },
    cartao: { titulo: (t) => `Cartão: ${TNOME[t]}`, blocos: (t) => {
      const inds = D.indicadores.filter((r) => r.tema === t && r.entra_no_escore);
      return [
        ['O que mostra', t === 'geral'
          ? `O escore geral do Brasil em ${D.escLast}, de 0 a 100: a média dos cinco temas.`
          : `O escore do Brasil neste tema em ${D.escLast}, de 0 a 100. Ele junta ${inds.length} indicadores: ${inds.map((r) => r.nome).join(', ')}.`],
        ['Como ler o número', '50 é o meio do mundo. Acima de 50, o Brasil está melhor que a maioria dos países no tema; abaixo, pior.'],
        ['Variação no mandato', 'Quanto o escore mudou no mandato escolhido no seletor acima: do ano anterior à posse até o fim do mandato (ou o último ano com dado). Verde se subiu mais de 0,5 ponto, vermelho se caiu mais de 0,5. Passe o mouse sobre ela para ver os dois valores.'],
        ['Mediana e minigráfico', 'A mediana é o escore do país do meio do grupo escolhido em "Comparar com". No minigráfico, a linha verde é o Brasil de 2000 até hoje, a tracejada é a mediana do grupo e a faixa sombreada é o mandato escolhido.'],
        ['Atenção', 'O escore é relativo: mede a posição frente aos outros países, não o nível absoluto. Clique no cartão para ver o tema nos dois gráficos abaixo.'],
      ];
    } },
    evolucao: { titulo: 'Escore ao longo do tempo', blocos: [
      ['O que mostra', 'O escore do Brasil no tema escolhido, ano a ano, de 2000 até o último ano com dado (linha verde), comparado com o grupo escolhido em "Comparar com".'],
      ['Como ler', 'A linha tracejada é a mediana do grupo: o país do meio. A faixa cinza vai do 1º ao 3º quartil, onde está a metade central dos países do grupo. Acima da faixa, o Brasil está melhor que três quartos do grupo; abaixo, pior. A faixa verde marca o mandato escolhido. Passe o mouse para ver os valores de cada ano.'],
      ['Atenção', 'Uma queda na linha não quer dizer que o Brasil piorou no valor dos indicadores: pode ser que outros países tenham melhorado mais. O escore mede posição.'],
    ] },
    decomp: { titulo: 'O que puxa o escore', blocos: [
      ['O que mostra', 'Cada indicador do tema escolhido, com o percentil do Brasil no fim do mandato escolhido. O percentil é a posição do Brasil entre todos os países com dado: 0 é o pior do mundo, 100 o melhor. O escore do tema é a média dessas barras.'],
      ['Como ler', 'Barras longas puxam o escore para cima; curtas puxam para baixo. Verde a partir de 60, vermelho abaixo de 40. O traço vertical em cada barra é o percentil no ano anterior à posse: se a barra passa do traço, o Brasil subiu de posição naquele indicador durante o mandato.'],
      ['Atenção', 'O percentil é posição, não valor. Cada indicador tem o próprio "i" com a explicação do que mede.'],
    ] },
    ranking: { titulo: 'Países comparados no último ano', blocos: [
      ['O que mostra', `Os ${Object.keys(PAIS).length} países do painel com o escore geral e o de cada tema em ${'{ano}'}, de 0 a 100.`],
      ['Como ler', 'Clique no nome de uma coluna para ordenar por ela, e de novo para inverter. Verde acima de 60, vermelho abaixo de 40. O botão "Baixar CSV" baixa a tabela para abrir no Excel.'],
      ['Atenção', 'A tabela mostra só os países acompanhados de perto pelo painel, mas o escore de cada um é calculado contra todos os países do mundo. Por isso a posição nesta tabela não é a posição no ranking mundial, que aparece no topo da página.'],
    ] },
    'p-pais': { titulo: 'País', blocos: [
      ['O que é', 'Os países comparados. O Brasil fica sempre na primeira linha, em destaque. Os outros são os países marcados nos botões acima do gráfico: marque ou desmarque para mudar a tabela.'],
      ['Atenção', 'Para todos os países, os períodos seguem o calendário dos mandatos brasileiros, para comparar as mesmas janelas de tempo. Para os outros países, esses anos não coincidem com os governos deles.'],
    ] },
    'p-media': { titulo: 'Média A e Média B', blocos: () => [
      ['O que é', 'A média dos valores anuais do indicador dentro de cada mandato: soma os valores dos anos do mandato e divide pelo número de anos. A é o mandato mais antigo; B, o mais recente.'],
      ['Por que média', 'Um mandato tem quatro anos, e o valor de um ano só pode ser um ponto fora da curva (uma crise, uma pandemia). A média resume o período inteiro.'],
      ['Atenção', 'Só entram os anos com dado. O mandato atual (2023–2026) usa os anos disponíveis até 2025, e alguns indicadores não são publicados todo ano. A média não mostra se o indicador subiu ou caiu dentro do mandato: para isso, veja a Tendência.'],
      ...exemploBr((c) => `média de ${c.u(c.r.media_a)} em ${c.a} (A) e de ${c.u(c.r.media_b)} em ${c.b} (B).`),
    ] },
    'p-var': { titulo: 'Variação', blocos: () => {
      const c = ctxPeriodos();
      return [
        ['O que é', 'A diferença entre as duas médias: Média B menos Média A. Fica na mesma unidade do indicador.'],
        ...(c.pct ? [['Pontos percentuais', 'Como este indicador já é uma porcentagem, a variação é em pontos percentuais (p.p.). Se o desemprego vai de 12% para 7%, a variação é −5 p.p.: caiu 5 pontos. Não confunda com a Variação %, que neste exemplo seria −42%.']] : []),
        ['Como ler', 'Positivo: a média subiu de A para B. Negativo: caiu. A cor diz se a mudança é boa ou ruim no sentido do indicador: verde é melhora, vermelho é piora. Nos indicadores em que o melhor é ficar perto de um alvo (inflação) ou que são só de contexto, não há cor.'],
        ...exemploBr((x) => `${x.u(x.r.media_b)} − ${x.u(x.r.media_a)} = ${sgn(x.r.delta, fmtv)}${x.pct ? ' p.p.' : ''}.`),
      ];
    } },
    'p-varpct': { titulo: 'Variação %', blocos: () => [
      ['O que é', 'A variação dividida pela Média A, em porcentagem. Diz quanto o indicador mudou em relação ao ponto de partida.'],
      ['Quando usar', 'Para comparar mudanças entre países ou indicadores de tamanhos muito diferentes. Um aumento de US$ 1.500 na renda é muito para um país pobre e pouco para um rico, e a Variação % mostra essa diferença.'],
      ['Atenção', 'Quando a Média A é pequena, a Variação % fica enorme e engana: se a inflação vai de 1% para 3%, ela "subiu 200%", mas foram só 2 pontos. Se a Média A é zero, a conta não existe e aparece "—".'],
      ...exemploBr((c) => c.r.delta_pct == null ? 'não dá para calcular, porque a Média A é zero.' : `${sgn(c.r.delta, fmtv)} ÷ ${fmtv(Math.abs(c.r.media_a))} = ${sgn(c.r.delta_pct, f1)}%.`),
    ] },
    'p-mediana': { titulo: 'Mediana B', blocos: [
      ['O que é', 'O valor do meio quando os anos do mandato B são postos em ordem. Com quatro anos, é a média dos dois do meio.'],
      ['Por que importa', 'Ao contrário da média, a mediana não é puxada por um ano atípico. Se a média e a mediana são bem diferentes, houve um ano fora do padrão no mandato (por exemplo, 2020, ano da pandemia).'],
    ] },
    'p-desvio': { titulo: 'Desvio B', blocos: [
      ['O que é', 'O desvio-padrão dos valores anuais no mandato B: quanto eles oscilaram em torno da média do mandato.'],
      ['Como ler', 'Desvio pequeno: o indicador ficou estável nos quatro anos. Desvio grande: houve altos e baixos. Fica na mesma unidade do indicador.'],
    ] },
    'p-tend': { titulo: 'Tendência A e Tendência B', blocos: () => [
      ['O que é', 'Quanto o indicador mudou por ano, em média, dentro de cada mandato. É a inclinação da reta que melhor se ajusta aos valores anuais do mandato (regressão linear).'],
      ['Como ler', 'Positivo: o indicador estava subindo ao longo do mandato. Negativo: estava caindo. Perto de zero: ficou estável. A unidade é a do indicador por ano.'],
      ['Diferença para a Variação', 'A Variação compara um mandato com o outro. A Tendência mostra a direção dentro de cada mandato. Um mandato pode ter média maior que o anterior e mesmo assim tendência negativa: começou alto e foi caindo.'],
      ['Atenção', 'Só é calculada com pelo menos 3 anos de dado no mandato; com menos, aparece "—". Com tão poucos pontos, um único ano atípico muda bastante a reta.'],
      ...exemploBr((c) => c.r.tendencia_b == null ? `sem anos suficientes para calcular a tendência em ${c.b}.` : `${sgn(c.r.tendencia_b, fmtv)} por ano em ${c.b}${c.r.tendencia_a == null ? '' : `, contra ${sgn(c.r.tendencia_a, fmtv)} por ano em ${c.a}`}.`),
    ] },
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
    const [chave, arg] = k.split(':');
    const c = CARD_INFO[chave];
    const partes = [el('h4', {}, typeof c.titulo === 'function' ? c.titulo(arg) : c.titulo)];
    const blocos = typeof c.blocos === 'function' ? c.blocos(arg) : c.blocos;
    for (const [t, txt0] of blocos) {
      const txt = txt0.replace('{ano}', String(D.escLast));
      const d = el('div', { class: 'bloco' + (t === 'Atenção' ? ' atencao' : '') });
      d.append(el('b', {}, t), el('span', {}, txt));
      partes.push(d);
    }
    infoEl.replaceChildren(...partes);
  }
  const BASES = [
    ['World Development Indicators (Banco Mundial)', 'https://databank.worldbank.org/source/world-development-indicators', '33 indicadores'],
    ['Worldwide Governance Indicators (Banco Mundial)', 'https://www.worldbank.org/en/publication/worldwide-governance-indicators', '6 indicadores de governança'],
    ['Relatório de Desenvolvimento Humano (PNUD)', 'https://hdr.undp.org/data-center/documentation-and-downloads', 'IDH'],
  ];
  const linkExt = (txt, url) => el('a', { href: url, target: '_blank', rel: 'noopener' }, txt);
  /** Conteúdo do botão de fonte: um indicador, os indicadores de um tema ou as bases de dados. */
  function preencherFonte(spec) {
    if (spec.startsWith('fonte:')) { // fontes da aba Consumo básico
      const F = FONTES_EXTRA[spec.slice(6)];
      const partes = [el('h4', {}, 'Fonte original dos dados'), el('p', {}, F.t)];
      const ul = el('ul', { class: 'fontes-lista' });
      for (const [n, u] of F.l) { const li = el('li'); li.append(linkExt(n, u)); ul.append(li); }
      partes.push(ul);
      partes.push(el('p', { class: 'dado' }, `Dados coletados em ${fmtData(F.data ? F.data() : D.raw.consumo?.coletado_em)}.`));
      infoEl.replaceChildren(...partes);
      return;
    }
    const alvo = spec === 'ind' ? st.ind : spec === 'tema' ? st.tema : spec === 'cstema' ? st.cstema : spec.startsWith('tema:') ? spec.slice(5) : spec;
    const partes = [el('h4', {}, 'Fonte original dos dados')];
    const meta = D.ind.get(alvo);
    if (meta) {
      const p = el('p', {}); p.append(el('b', {}, meta.nome), `: ${meta.fonte}.`); partes.push(p);
      const ul = el('ul', { class: 'fontes-lista' });
      if (meta.url_fonte) { const li = el('li'); li.append(linkExt('Página do indicador', meta.url_fonte)); ul.append(li); }
      if (meta.url_api) { const li = el('li'); li.append(linkExt('Dados do Brasil pela API', meta.url_api)); ul.append(li); }
      partes.push(ul);
      if (meta.codigo_oficial) partes.push(el('p', { class: 'cod' }, `Código oficial: ${meta.codigo_oficial}`));
    } else if (alvo && alvo !== 'geral' && alvo !== 'bases' && TNOME[alvo]) {
      const inds = D.indicadores.filter((r) => r.tema === alvo && r.entra_no_escore);
      partes.push(el('p', {}, `O escore de ${TNOME[alvo].toLowerCase()} junta ${inds.length} indicadores. Fonte original de cada um:`));
      const ul = el('ul', { class: 'fontes-lista' });
      for (const r of inds) { const li = el('li'); li.append(r.url_fonte ? linkExt(r.nome, r.url_fonte) : r.nome, el('span', { class: 'cod' }, ` · ${r.fonte}`)); ul.append(li); }
      partes.push(ul);
    } else {
      partes.push(el('p', {}, `Os escores juntam ${D.indicadores.filter((r) => r.entra_no_escore).length} indicadores de três bases oficiais:`));
      const ul = el('ul', { class: 'fontes-lista' });
      for (const [n, u, q] of BASES) { const li = el('li'); li.append(linkExt(n, u), el('span', { class: 'cod' }, ` · ${q}`)); ul.append(li); }
      partes.push(ul);
    }
    const nota = el('p', { class: 'dado' });
    nota.append('Links de todos os indicadores e APIs na aba ', el('a', { href: '#metodo' }, 'Metodologia'), '.');
    partes.push(nota);
    infoEl.replaceChildren(...partes);
  }
  const FONTES_EXTRA = {
    estatais: { t: 'Balanços das estatais federais, publicados pelo governo:', l: [
      ['SEST/Ministério da Gestão: dados abertos das empresas estatais (Dados Financeiros e Identificação)', 'https://www.gov.br/gestao/pt-br/assuntos/estatais/transparencia/dados-abertos'],
      ['Relatórios agregados e boletins das estatais federais', 'https://www.gov.br/gestao/pt-br/assuntos/estatais'],
    ], data: () => D.raw.estatais?.coletado_em },
    precos: { t: 'Preços de consumo básico, de duas fontes oficiais:', l: [
      ['DIEESE: Pesquisa Nacional da Cesta Básica de Alimentos', 'https://www.dieese.org.br/analisecestabasica/analiseCestaBasica.html'],
      ['ANP: Levantamento de Preços de Combustíveis', 'https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/precos-revenda-e-de-distribuicao-combustiveis'],
      ['Ipeadata (séries da cesta básica, do salário mínimo e do IPCA)', 'http://www.ipeadata.gov.br/'],
    ] },
    economias: { t: 'Ranking das maiores economias e escore geral do painel:', l: [
      ['FMI, World Economic Outlook: PIB nominal em dólares (série NGDPD)', 'https://www.imf.org/external/datamapper/NGDPD@WEO'],
      ['Banco Mundial, World Development Indicators (base do escore geral)', 'https://databank.worldbank.org/source/world-development-indicators'],
    ] },
    renda: { t: 'Renda e salário mínimo:', l: [
      ['IBGE, PNAD Contínua anual, tabela 7395 do SIDRA', 'https://sidra.ibge.gov.br/tabela/7395'],
      ['Ipeadata: salário mínimo e IPCA', 'http://www.ipeadata.gov.br/'],
    ] },
  };
  function preencherInfo(id) {
    if (id.startsWith('card:')) return preencherInfoCard(id.slice(5));
    if (id.startsWith('fonte:')) return preencherFonte(id.slice(6));
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
    infoEl.setAttribute('role', id.startsWith('fonte:') ? 'dialog' : 'tooltip');
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
  const ICONE_LINK = '<svg class="ico-link" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1 1 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4 4 0 0 1-.128-1.287z"/><path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243z"/></svg>';
  /** Botão de fonte (ícone de link) para cartões montados no JavaScript. */
  function botaoFonte(spec) {
    const b = el('button', { class: 'info-btn fonte-btn', type: 'button', 'aria-label': 'Fonte original dos dados', 'data-fonte': spec });
    b.innerHTML = ICONE_LINK;
    return b;
  }
  /** Botão com o ícone de informação (marcação fixa, sem dados do usuário). */
  function botaoInfo(rotulo) {
    const b = el('button', { class: 'info-btn', type: 'button', 'aria-label': rotulo });
    b.innerHTML = ICONE_INFO;
    return b;
  }
  /** Liga um elemento "i" à explicação do indicador devolvido por getId(). */
  // Ao sair do botão, espera um instante: dá tempo de levar o mouse até a caixa (para clicar nos links).
  let timerFechar = null;
  function agendarFechar() { clearTimeout(timerFechar); timerFechar = setTimeout(() => { if (!infoFixo) esconderInfo(); }, 220); }
  infoEl.addEventListener('pointerenter', () => clearTimeout(timerFechar));
  infoEl.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !infoFixo) agendarFechar(); });
  function ligarInfo(alvo, getId) {
    alvo.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { clearTimeout(timerFechar); mostrarInfo(alvo, getId()); } });
    alvo.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !infoFixo) agendarFechar(); });
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
  document.querySelectorAll('[data-fonte]').forEach((b) => ligarInfo(b, () => 'fonte:' + b.dataset.fonte));
  addEventListener('hashchange', () => esconderInfo()); // o link "Metodologia" da caixa troca de aba

  // ---------------------------------------------------------------- compartilhar (imagem gerada no navegador, sem servidor)
  const ICONE_SHARE = '<svg class="ico-share" xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5m-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3"/></svg>';
  const LOGO = '<svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true"><rect x="2" y="18" width="6" height="12" rx="1.5"/><rect x="13" y="10" width="6" height="20" rx="1.5"/><rect x="24" y="3" width="6" height="27" rx="1.5"/></svg>';
  const enderecoSite = () => (location.host ? location.host + location.pathname.replace(/index\.html$/, '') : 'github.com/ChrisBerenguer/Monitora-Brasil').replace(/\/$/, '');
  /** Texto da fonte de um cartão, a partir do botão de fonte dele. */
  function fonteDoCartao(card) {
    const spec = card.querySelector('[data-fonte]')?.dataset.fonte || 'bases';
    if (spec === 'fonte:precos') return 'DIEESE (cesta básica) e ANP (combustíveis)';
    if (spec === 'fonte:renda') return 'IBGE (PNAD Contínua) e Ipeadata';
    if (spec === 'fonte:estatais') return 'SEST/Ministério da Gestão (balanços das estatais federais)';
    const alvo = spec === 'ind' ? st.ind : spec === 'tema' ? st.tema : spec === 'cstema' ? st.cstema : spec.startsWith('tema:') ? spec.slice(5) : spec;
    const meta = D.ind.get(alvo);
    if (meta) return meta.fonte;
    if (alvo && TNOME[alvo] && alvo !== 'geral') {
      const fs = new Set(D.indicadores.filter((r) => r.tema === alvo && r.entra_no_escore).map((r) => (r.fonte.startsWith('PNUD') ? 'PNUD' : 'Banco Mundial')));
      return [...fs].join(' e ');
    }
    return 'Banco Mundial (WDI e WGI) e PNUD';
  }
  /** Linha com as escolhas que definem o gráfico (indicador, anos, mandatos, grupo...). */
  function contextoDoCartao(card) {
    const pag = card.closest('.pagina');
    const modo = card.dataset.ctx; // 'proprio': só os controles do cartão; 'nenhum': sem linha de escolhas
    if (modo === 'nenhum') return '';
    const sels = [...(modo === 'proprio' ? [] : pag?.querySelectorAll(':scope > .controles select') || []), ...card.querySelectorAll('select')];
    return sels.filter((s) => s.selectedIndex >= 0).map((s) => {
      const rot = (s.closest('label')?.firstChild?.textContent || s.closest('.ctl')?.querySelector('label')?.textContent || '').trim();
      return `${rot ? rot + ': ' : ''}${s.options[s.selectedIndex].text}`;
    }).join(' · ');
  }
  /** Monta fora da tela um quadro com marca, título, escolhas, o cartão e o rodapé, e gera o PNG. */
  async function gerarImagem(card) {
    const titulo = card.querySelector('h2')?.textContent.trim() || 'Monitora Brasil';
    const largura = Math.max(360, Math.min(1200, card.clientWidth));
    const frame = el('div', { class: 'share-frame' });
    frame.style.width = `${largura + 56}px`;
    const topo = el('div', { class: 'sf-topo' }), marca = el('span', { class: 'sf-marca' });
    marca.innerHTML = LOGO; marca.append('Monitora Brasil');
    topo.append(marca, el('span', {}, new Date().toLocaleDateString('pt-BR')));
    const ctx = contextoDoCartao(card);
    const corpo = card.cloneNode(true);
    corpo.removeAttribute('id'); corpo.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    corpo.querySelector('.titulo-info, h2')?.remove();
    corpo.querySelectorAll('.info-btn, .botao, .controles, select, [hidden]').forEach((n) => n.remove());
    corpo.className = 'sf-card';
    corpo.style.width = `${largura}px`;
    const rod = el('div', { class: 'sf-rodape' });
    const f = el('span'); f.append('Fonte: ', el('b', {}, fonteDoCartao(card)), '. Cálculos: Monitora Brasil.');
    const u = el('span'); u.append('Confira os dados em ', el('b', {}, enderecoSite()));
    rod.append(f, u);
    frame.append(topo, el('h2', { class: 'sf-titulo' }, titulo), ...(ctx ? [el('div', { class: 'sf-ctx' }, ctx)] : []), corpo, rod);
    document.body.append(frame);
    try {
      const opts = { pixelRatio: 2, backgroundColor: css('--bg'), cacheBust: false, style: { position: 'static', left: '0', top: '0', margin: '0' } };
      try { return { blob: await htmlToImage.toBlob(frame, opts), titulo }; }
      catch { return { blob: await htmlToImage.toBlob(frame, { ...opts, skipFonts: true }), titulo }; } // fontes externas bloqueadas: usa as do sistema
    } finally { frame.remove(); }
  }
  const nomeArquivo = (t) => `monitora-brasil-${t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)}.png`;
  async function abrirCompartilhar(btn, card) {
    tip.hide();
    if (infoAncora && infoAncora !== btn) infoAncora.setAttribute('aria-expanded', 'false');
    infoAncora = btn; infoFixo = true;
    infoEl.setAttribute('role', 'dialog');
    infoEl.replaceChildren(el('h4', {}, 'Compartilhar'), el('p', { class: 'dado' }, 'Gerando a imagem…'));
    infoEl.hidden = false; btn.setAttribute('aria-expanded', 'true'); posicionarInfo(btn);
    let res;
    try { res = await gerarImagem(card); } catch (e) {
      infoEl.replaceChildren(el('h4', {}, 'Compartilhar'), el('p', {}, 'Não foi possível gerar a imagem neste navegador.'));
      return;
    }
    if (infoAncora !== btn) return; // a pessoa fechou ou abriu outra caixa
    const { blob, titulo } = res, nome = nomeArquivo(titulo);
    // data: em vez de blob:, porque a política de segurança só libera imagens 'self' e data:
    const url = await new Promise((ok, erro) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = erro; r.readAsDataURL(blob); });
    if (infoAncora !== btn) return;
    const link = location.href, arquivo = new File([blob], nome, { type: 'image/png' });
    const status = el('p', { class: 'dado' }, 'A imagem leva o título, as escolhas da tela, a fonte e o endereço do painel.');
    const acoes = el('div', { class: 'share-acoes' });
    const botao = (txt, fn, principal) => { const b = el('button', { class: 'botao' + (principal ? ' principal' : ''), type: 'button' }, txt); b.addEventListener('click', (e) => { e.stopPropagation(); fn(); }); return b; };
    if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
      acoes.append(botao('Compartilhar…', async () => {
        try { await navigator.share({ files: [arquivo], title: titulo, text: `${titulo} · Monitora Brasil · ${link}` }); } catch { /* cancelado */ }
      }, true));
    }
    acoes.append(botao('Baixar imagem', () => { const a = el('a', { href: url, download: nome }); document.body.append(a); a.click(); a.remove(); status.textContent = 'Imagem baixada. Agora é só postar.'; }, !acoes.childElementCount));
    if (navigator.clipboard && window.ClipboardItem) {
      acoes.append(botao('Copiar imagem', async () => {
        try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); status.textContent = 'Imagem copiada. Cole no post ou na conversa.'; }
        catch { status.textContent = 'O navegador não deixou copiar a imagem. Use "Baixar imagem".'; }
      }));
    }
    if (navigator.clipboard) {
      acoes.append(botao('Copiar link', async () => {
        try { await navigator.clipboard.writeText(link); status.textContent = 'Link copiado.'; } catch { status.textContent = link; }
      }));
    }
    const prev = el('img', { class: 'share-prev', alt: `Prévia da imagem: ${titulo}` });
    prev.addEventListener('load', () => { if (infoAncora === btn) posicionarInfo(btn); }); // a caixa cresce quando a prévia carrega
    prev.src = url;
    infoEl.replaceChildren(el('h4', {}, 'Compartilhar'), prev, acoes, status);
    posicionarInfo(btn);
  }
  /** Coloca o botão de compartilhar ao lado do título de cada cartão com gráfico ou tabela. */
  document.querySelectorAll('#visao article.card, #series article.card, #coortes article.card, #vida article.card, #estatais article.card').forEach((card) => {
    const alvo = card.querySelector('.titulo-info');
    if (!alvo) return;
    const b = el('button', { class: 'info-btn share-btn', type: 'button', 'aria-label': 'Compartilhar este gráfico como imagem', 'aria-haspopup': 'dialog' });
    b.innerHTML = ICONE_SHARE;
    b.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (infoAncora === b && infoFixo) return esconderInfo();
      abrirCompartilhar(b, card);
    });
    alvo.append(b);
  });
  infoEl.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse' && !e.target.closest('a, button')) { ultimoToque = performance.now(); esconderInfo(); } }); // tocar na explicação fecha
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
    $('#p-h-var').textContent = D.ind.get(st.ind).unidade.trim().startsWith('%') ? 'Variação (p.p.)' : 'Variação';
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
  /** Aviso de data na aba Onde votar: só aparece até o dia do 2º turno de 2026. */
  function drawVotar() {
    const hoje = new Date(), turno2 = new Date(2026, 9, 25, 23, 59);
    const av = $('#votar-aviso');
    av.hidden = hoje > turno2;
    if (!av.hidden) av.textContent = 'Eleições 2026: o 2º turno é no domingo, 25 de outubro, nos lugares onde houver segundo turno.';
  }
  // ---------------------------------------------------------------- consumo básico
  const CB_ORDEM = ['cesta', 'gasolina', 'etanol', 'diesel', 'gas'];
  const CB_UNIDADE = { cesta: 'cestas', gasolina: 'litros', etanol: 'litros', diesel: 'litros', gas: 'botijões' };
  /** Unidades da fonte em texto corrido ("R$/13kg" vira "R$ pelo botijão de 13 kg"). */
  const unTexto = (u) => ({ 'R$/l': 'R$ por litro', 'R$/13kg': 'R$ pelo botijão de 13 kg', 'R$ por mês': 'R$ por mês' }[u] || u);
  const mesTexto = (m) => { const [a, b] = String(m).split('-'); return `${['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][+b - 1]}/${a}`; };
  const fmtData = (s) => (s ? new Date(s + 'T12:00').toLocaleDateString('pt-BR') : '—');
  const brl = (v) => (v == null ? '—' : `R$ ${v >= 100 ? f0(v) : f2(v)}`);
  /** Barras verticais simples, com o valor em cima e tooltip. */
  function barras(box, rows, { fmt = f1, cor: corB = cor(0), height = 240, tipLinhas = null, negativos = false } = {}) {
    box.replaceChildren(); box.classList.remove('carregando');
    if (!rows.length) return vazio(box);
    const W = largura(box), H = height, mt = 22, mb = 40, ml = 8, mr = 8;
    const x = d3.scaleBand(rows.map((r) => r.label), [ml, W - mr]).padding(0.22);
    const y = d3.scaleLinear([negativos ? Math.min(0, d3.min(rows, (r) => r.v)) : 0, d3.max(rows, (r) => r.v) || 1], [H - mb, mt]).nice();
    const svg = d3.select(box).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img');
    svg.append('line').attr('x1', ml).attr('x2', W - mr).attr('y1', y(0)).attr('y2', y(0)).style('stroke', css('--axis'));
    for (const r of rows) {
      const topo = negativos ? y(Math.max(0, r.v)) : y(r.v), alt = negativos ? Math.abs(y(r.v) - y(0)) : Math.max(0, y(0) - y(r.v));
      svg.append('rect').attr('x', x(r.label)).attr('y', topo).attr('width', x.bandwidth()).attr('height', alt).attr('rx', 3)
        .style('fill', typeof corB === 'function' ? corB(r) : corB).style('fill-opacity', r.fraco ? 0.4 : 0.9)
        .on('pointermove', (ev) => tip.show(ev, r.titulo || r.label, tipLinhas ? tipLinhas(r) : [{ name: 'Valor', value: fmt(r.v) }]))
        .on('pointerleave', () => tip.hide());
      if (x.bandwidth() >= 34) // em tela estreita o rótulo não cabe; o valor fica no toque
        svg.append('text').attr('x', x(r.label) + x.bandwidth() / 2).attr('y', negativos && r.v < 0 ? y(r.v) + 13 : y(r.v) - 5).attr('text-anchor', 'middle')
          .style('font-size', '11px').style('fill', css('--fg')).text(fmt(r.v));
    }
    const passo = Math.ceil(rows.length / Math.max(1, Math.floor((W - ml - mr) / 56)));
    svg.append('g').selectAll('text').data(rows.filter((r, i) => i % passo === 0)).join('text')
      .attr('x', (r) => x(r.label) + x.bandwidth() / 2).attr('y', H - mb + 16).attr('text-anchor', 'middle').style('font-size', '11px').text((r) => r.label);
  }
  const FAIXAS_MANDATO = () => PERIODOS.map((p) => ({ de: +p.slice(0, 4), ate: +p.slice(0, 4) + 3, rotulo: MANDATO[p].replace(' (até 2025)', '') }));
  /** Converte 'AAAA-MM' no ano fracionário usado no eixo x dos gráficos de linha. */
  const mesX = (m) => +m.slice(0, 4) + (+m.slice(5, 7) - 0.5) / 12;

  /** Média do preço corrigido e do poder de compra de um item dentro de um mandato. */
  function mediaMandato(it, periodo) {
    const i = +periodo.slice(0, 4), f = i + 3;
    const ps = it.pontos.filter((p) => { const a = +p.mes.slice(0, 4); return a >= i && a <= f && p.real != null; });
    if (!ps.length) return null;
    const meses = 1 + (f - i) * 12 + 11; // meses do mandato inteiro, para avisar quando a série cobre só parte
    return { preco: d3.mean(ps, (p) => p.real), sm: d3.mean(ps.filter((p) => p.sm != null), (p) => p.sm), n: ps.length, parcial: ps.length < meses * 0.9 };
  }
  function desenharMandatos(C) {
    const itens = C.itens;
    // só mandatos com pelo menos um item medido
    const comDados = PERIODOS.filter((p) => CB_ORDEM.some((k) => itens[k] && mediaMandato(itens[k], p)));
    const opts = comDados.map((p) => ({ label: `${p} · ${MANDATO[p]}`, value: p }));
    if (!comDados.includes(st.cbMa)) st.cbMa = comDados.at(-2) || comDados[0];
    if (!comDados.includes(st.cbMb)) st.cbMb = comDados.at(-1);
    fillSelect($('#cb-ma'), opts, st.cbMa); fillSelect($('#cb-mb'), opts, st.cbMb);
    let a = st.cbMa, b = st.cbMb, inv = false;
    if (a > b) { [a, b] = [b, a]; inv = true; }
    const msg = $('#cb-mand-msg');
    msg.textContent = a === b ? 'Escolha dois mandatos diferentes.' : inv ? `Mostrando A = ${a} e B = ${b}, em ordem cronológica.` : '';
    msg.hidden = !msg.textContent;
    const nomeA = MANDATO[a].replace(' (até 2025)', ''), nomeB = MANDATO[b].replace(' (até 2025)', '');
    const emCurso = +b.slice(0, 4) + 3 >= +C.base_ipca.slice(0, 4);
    $('#cb-mand-nota').textContent = `Preço médio de cada item em todos os meses do mandato, corrigido para preços de ${mesTexto(C.base_ipca)}. Assim a comparação não é afetada pela inflação. O verde marca o mandato em que um salário mínimo comprava mais.`
      + (emCurso ? ` O mandato ${nomeB} ainda não acabou: a média vai até ${mesTexto(C.base_ipca)}.` : '');
    $('#cb-th-a').textContent = `Média ${nomeA}`; $('#cb-th-b').textContent = `Média ${nomeB}`;
    $('#cb-th-sa').textContent = `1 salário mínimo em ${nomeA}`; $('#cb-th-sb').textContent = `1 salário mínimo em ${nomeB}`;
    const tb = $('#cb-mand-table tbody'); tb.replaceChildren();
    if (a === b) return;
    for (const k of CB_ORDEM) {
      const it = itens[k]; if (!it) continue;
      const ma = mediaMandato(it, a), mb = mediaMandato(it, b);
      const tr = el('tr');
      const nome = el('td');
      nome.append(it.titulo);
      if (ma?.parcial || mb?.parcial) nome.append(el('span', { class: 'cod' }, ' · série parcial'));
      tr.append(nome);
      if (!ma || !mb) {
        tr.append(el('td', {}, ma ? brl(ma.preco) : '—'), el('td', {}, mb ? brl(mb.preco) : '—'),
                  el('td', { class: 'some-p' }, '—'), el('td', {}, '—'), el('td', {}, '—'), el('td', {}, '—'));
        tb.append(tr); continue;
      }
      const d = mb.preco - ma.preco, dp = 100 * d / ma.preco;
      // a cor fica no poder de compra: quem comprava mais com um salário mínimo aparece em verde.
      // A comparação usa o número já arredondado, para a cor nunca contradizer o que está escrito.
      const sa = f1(ma.sm), sb = f1(mb.sm), igual = sa === sb;
      const clsA = igual ? '' : ma.sm > mb.sm ? 'bom' : 'ruim';
      const clsB = igual ? '' : mb.sm > ma.sm ? 'bom' : 'ruim';
      tr.append(el('td', {}, brl(ma.preco)), el('td', {}, brl(mb.preco)),
                el('td', { class: 'some-p' }, sgn(d, (v) => (v >= 100 ? f0(v) : f2(v)))),
                el('td', {}, `${sgn(dp, f1)}%`),
                el('td', { class: clsA }, `${sa} ${CB_UNIDADE[k]}`),
                el('td', { class: clsB }, `${sb} ${CB_UNIDADE[k]}`));
      tb.append(tr);
    }
  }

  /** Salário mínimo no mês anterior à posse e no fim do mandato (ou no último mês com dado). */
  function ganhoMandato(sm, ipca, periodo, ultimo) {
    const ini = +periodo.slice(0, 4);
    const mesIni = `${ini - 1}-12`, fimMandato = `${ini + 3}-12`;
    const mesFim = fimMandato <= ultimo ? fimMandato : ultimo; // mandato em curso: vai até o último mês com dado
    const a = sm.get(mesIni), b = sm.get(mesFim), ia = ipca.get(mesIni), ib = ipca.get(mesFim);
    if (a == null || b == null || ia == null || ib == null) return null;
    const nominal = 100 * (b / a - 1), inflacao = 100 * (ib / ia - 1);
    return { mesIni, mesFim, a, b, nominal, inflacao, real: 100 * ((b / a) / (ib / ia) - 1), emCurso: mesFim !== fimMandato };
  }
  function desenharGanho(C) {
    const sm = new Map((C.salario_minimo || []).map((p) => [p.mes, p.v]));
    for (const p of C.salario_minimo || []) sm.set(p.mes, p.v);
    const ipca = new Map((C.ipca || []).map((p) => [p.mes, p.indice]));
    const ultimo = C.base_ipca;
    if (!ipca.size) { vazio($('#cb-ganho'), 'Índice de inflação indisponível nesta versão dos dados.'); $('#cb-ganho-table tbody').replaceChildren(); return; }
    const linhas = PERIODOS.map((p) => ({ p, g: ganhoMandato(sm, ipca, p, ultimo) })).filter((x) => x.g);
    $('#cb-ganho-nota').textContent = `Quanto o salário mínimo subiu em cada mandato e quanto subiu a inflação no mesmo período. O ganho real é o que sobra: o quanto o salário passou a comprar a mais. Compara o salário de dezembro anterior à posse com o do fim do mandato${linhas.at(-1)?.g.emCurso ? `, e o mandato atual vai até ${mesTexto(ultimo)}` : ''}.`;
    barras($('#cb-ganho'), linhas.map(({ p, g }) => ({
      label: MANDATO[p].replace(' (até 2025)', ''), v: g.real, g,
      titulo: `${MANDATO[p]} · ${mesTexto(g.mesIni)} a ${mesTexto(g.mesFim)}`,
    })), {
      fmt: (v) => `${sgn(v, f1)}%`, height: 240,
      cor: (r) => (r.v > 0 ? css('--ok') : css('--critical')),
      tipLinhas: (r) => [
        { name: 'Aumento do salário', value: `${sgn(r.g.nominal, f1)}%` },
        { name: 'Inflação no período', value: `${sgn(r.g.inflacao, f1)}%` },
        { name: 'Ganho real', value: `${sgn(r.g.real, f1)}%` },
        { name: 'Salário', value: `${brl(r.g.a)} → ${brl(r.g.b)}` },
      ],
    });
    const tb = $('#cb-ganho-table tbody'); tb.replaceChildren();
    const base = linhas[0];
    for (const { p, g } of linhas) {
      const tr = el('tr');
      const nome = el('td');
      nome.append(MANDATO[p].replace(' (até 2025)', ''));
      if (g.emCurso) nome.append(el('span', { class: 'cod' }, ' · em curso'));
      const cls = g.real > 0.5 ? 'bom' : g.real < -0.5 ? 'ruim' : '';
      const poder = base ? 100 * (g.b / ipca.get(g.mesFim)) / (base.g.a / ipca.get(base.g.mesIni)) : null;
      tr.append(nome, el('td', { class: 'some-p' }, brl(g.a)), el('td', { class: 'some-p' }, brl(g.b)),
                el('td', {}, `${sgn(g.nominal, f1)}%`), el('td', {}, `${sgn(g.inflacao, f1)}%`),
                el('td', { class: cls }, `${sgn(g.real, f1)}%`),
                el('td', { class: 'some-p' }, poder == null ? '—' : f0(poder)));
      tb.append(tr);
    }
  }

  function drawVida() {
    const C = D.raw.consumo;
    if (!C) return vazio($('#cb-tiles'), 'Dados de consumo indisponíveis.');
    const itens = C.itens;
    // --- cartão 1: quanto custa hoje
    $('#cb-hoje-nota').textContent = `Preços médios no Brasil. Variação em 12 meses já descontada a inflação. Dados até ${mesTexto(C.base_ipca)}, coletados em ${fmtData(C.coletado_em)}.`;
    const box = $('#cb-tiles'); box.replaceChildren();
    for (const k of CB_ORDEM) {
      const it = itens[k]; if (!it || !it.pontos.length) continue;
      const u = it.pontos.at(-1), ant = it.pontos.at(-13);
      const t = el('div', { class: 'cb-tile' });
      t.append(el('span', { class: 'nome' }, it.titulo), el('span', { class: 'valor' }, brl(u.v)), el('span', { class: 'un' }, unTexto(it.unidade)));
      if (ant && ant.real && u.real) {
        const d = 100 * (u.real - ant.real) / ant.real;
        t.append(el('span', { class: 'var ' + (d < -0.5 ? 'bom' : d > 0.5 ? 'ruim' : '') }, `${sgn(d, f1)}% em 12 meses, já com a inflação descontada`));
      }
      if (u.sm) t.append(el('span', { class: 'sm' }, `Um salário mínimo compra ${f1(u.sm)} ${CB_UNIDADE[k]}`));
      box.append(t);
    }
    // --- médias por mandato, dentro do cartão 1
    desenharMandatos(C);
    // --- cartão 2: preço ao longo do tempo
    fillSelect($('#cb-item'), CB_ORDEM.filter((k) => itens[k]).map((k) => ({ label: itens[k].titulo, value: k })), st.cbItem);
    const it = itens[st.cbItem] || itens.cesta;
    const anoIni = +it.pontos[0].mes.slice(0, 4), anoFim = +C.base_ipca.slice(0, 4);
    fillSelect($('#cb-y0'), d3.range(anoIni, anoFim).map((a) => ({ label: a, value: a })), Math.max(st.cbY0, anoIni));
    $('#cb-real').checked = st.cbReal;
    const y0 = Math.max(st.cbY0, anoIni);
    const pts = it.pontos.filter((p) => +p.mes.slice(0, 4) >= y0);
    $('#cb-serie-titulo').textContent = `${it.titulo}: preço ao longo do tempo`;
    const un = unTexto(it.unidade).replace('R$', 'reais');
    $('#cb-serie-nota').textContent = st.cbReal
      ? `Preço médio no Brasil, em ${un}, corrigido para preços de ${mesTexto(C.base_ipca)}.`
      : `Preço médio no Brasil, em ${un}, nos reais de cada época, sem corrigir pela inflação.`;
    lineChart($('#cb-chart'), {
      series: [{ name: it.titulo, color: cor(0), width: 2.4, pts: pts.map((p) => ({ x: mesX(p.mes), y: st.cbReal ? p.real : p.v, mes: p.mes })) }],
      yfmt: brl, xdomain: [y0, anoFim + 1], faixas: FAIXAS_MANDATO(), endLabels: false, height: 320,
      mensal: true, tituloTip: (p) => mesTexto(p.mes),
    });
    // --- cartão 3: quanto um salário mínimo compra
    const comSm = pts.filter((p) => p.sm != null);
    $('#cb-poder-titulo').textContent = `Quanto um salário mínimo compra de ${it.titulo.toLowerCase()}`;
    const u = comSm.at(-1), ini = comSm[0];
    $('#cb-poder-nota').textContent = u && ini
      ? `Em ${mesTexto(ini.mes)}, um salário mínimo comprava ${f1(ini.sm)} ${CB_UNIDADE[st.cbItem]}. Em ${mesTexto(u.mes)}, ${f1(u.sm)}.`
      : 'Sem dados para esta seleção.';
    lineChart($('#cb-poder'), {
      series: [{ name: CB_UNIDADE[st.cbItem], color: cor(5), width: 2.4, pts: comSm.map((p) => ({ x: mesX(p.mes), y: p.sm, mes: p.mes })) }],
      yfmt: (v) => `${f1(v)} ${CB_UNIDADE[st.cbItem]}`, xdomain: [y0, anoFim + 1], faixas: FAIXAS_MANDATO(), endLabels: false, height: 280,
      mensal: true, tituloTip: (p) => mesTexto(p.mes),
    });
    // --- cartão 4: renda e salário mínimo
    const r = C.renda_per_capita || [];
    $('#cb-renda-nota').textContent = `Rendimento médio mensal domiciliar per capita, em valores reais, da PNAD Contínua do IBGE. Não há dado de 2020, porque a pandemia interrompeu a coleta.`;
    barras($('#cb-renda'), r.map((x) => ({ label: String(x.ano), v: x.valor })), {
      fmt: (v) => brl(v), height: 240,
      tipLinhas: (x) => [{ name: 'Renda per capita', value: brl(x.v) }, { name: 'Por mês, por morador', value: 'média de todas as casas' }],
    });
    desenharGanho(C);
    const sm = (C.salario_minimo || []).filter((p) => +p.mes.slice(0, 4) >= y0 && p.real != null);
    lineChart($('#cb-sm'), {
      series: [{ name: 'Salário mínimo', color: cor(2), width: 2.4, pts: sm.map((p) => ({ x: mesX(p.mes), y: p.real, mes: p.mes })) }],
      yfmt: brl, xdomain: [y0, anoFim + 1], faixas: FAIXAS_MANDATO(), endLabels: false, height: 260,
      mensal: true, tituloTip: (p) => mesTexto(p.mes),
    });
  }
  $('#cb-real').addEventListener('change', (e) => { st.cbReal = e.target.checked; render(); });


  // ---------------------------------------------------------------- estatais
  /** Mandato em que cai um ano (para colorir as barras e somar por mandato). */
  const periodoDoAno = (a) => PERIODOS.find((p) => a >= +p.slice(0, 4) && a <= +p.slice(0, 4) + 3);
  const COR_MANDATO = { '2015–2018': 3, '2019–2022': 1, '2023–2026': 0 };
  const corDoAno = (a) => cor(COR_MANDATO[periodoDoAno(a)] ?? 5);
  const bi = (mi) => (mi == null ? '—' : `R$ ${mi < 0 ? '−' : ''}${f1(Math.abs(mi) / 1000)} bi`);
  const ESTF = {
    todas: () => true,
    grupo: (e) => e.tipo === 'grupo',
    empresa: (e) => e.tipo === 'empresa' && !e.dependente,
    dependente: (e) => e.dependente,
  };
  /** Soma dos valores de uma estatal entre dois anos (null se não há nenhum ano com dado). */
  function somaAnos(e, a, b) {
    let s = 0, n = 0;
    for (let y = a; y <= b; y++) { const v = e.valores[y]; if (v != null) { s += v; n++; } }
    return n ? s : null;
  }
  function estatisOrdenadas(E, anos) {
    const { key, dir } = st.estSort;
    const k = key || String(anos.at(-1));
    const val = (e) => (k === 'estatal' ? e.estatal : k === 'b' ? somaAnos(e, 2019, 2022) : k === 'l' ? somaAnos(e, 2023, 2026) : e.valores[k]);
    return E.estatais.filter(ESTF[st.estFiltro] || ESTF.todas).sort((x, y) => {
      if (k === 'estatal') return dir * x.estatal.localeCompare(y.estatal, 'pt-BR');
      const vx = val(x), vy = val(y); // quem não tem dado vai para o fim, nos dois sentidos
      if (vx == null && vy == null) return x.estatal.localeCompare(y.estatal, 'pt-BR');
      if (vx == null) return 1;
      if (vy == null) return -1;
      return dir * (vx - vy);
    });
  }
  function drawEstatais() {
    const E = D.raw.estatais;
    if (!E || !E.anos?.length) return vazio($('#est-chart'), 'Dados das estatais indisponíveis.');
    const anos = E.anos.map((r) => r.ano);
    const u = E.anos.at(-1), p = E.anos.at(-2);
    const lider = E.estatais.filter((e) => e.valores[u.ano] != null).sort((a, b) => b.valores[u.ano] - a.valores[u.ano])[0];
    const pior = E.estatais.filter((e) => e.valores[u.ano] != null).sort((a, b) => a.valores[u.ano] - b.valores[u.ano])[0];
    const d = p ? 100 * (u.lucro_mi - p.lucro_mi) / Math.abs(p.lucro_mi) : null;
    $('#est-nota').textContent = `Em ${u.ano}${u.parcial ? ` (${u.periodo})` : ''}, as ${u.n} estatais federais somaram ${bi(u.lucro_mi)} de lucro líquido`
      + (d != null ? `, ${d >= 0 ? 'alta' : 'queda'} de ${f1(Math.abs(d))}% sobre ${p.ano}` : '') + '.'
      + (lider ? ` O maior resultado foi do ${lider.estatal} (${bi(lider.valores[u.ano])})` : '')
      + (pior && pior.valores[u.ano] < 0 ? ` e o maior prejuízo, de ${pior.estatal} (${bi(pior.valores[u.ano])}).` : '.')
      + ` Reais de cada ano, sem correção pela inflação. Dados coletados em ${fmtData(E.coletado_em)}.`;
    barras($('#est-chart'), E.anos.map((r) => ({ label: String(r.ano), v: r.lucro_mi / 1000, r })), {
      fmt: (v) => f0(v), height: 280, negativos: true,
      cor: (x) => corDoAno(x.r.ano),
      tipLinhas: (x) => [
        { name: 'Lucro líquido somado', value: bi(x.r.lucro_mi) },
        { name: 'Mandato', value: MANDATO[periodoDoAno(x.r.ano)]?.replace(' (até 2025)', '') || '—' },
        { name: 'Estatais na conta', value: f0(x.r.n) },
        ...(x.r.parcial ? [{ name: 'Período', value: x.r.periodo }] : []),
      ],
    });
    const leg = $('#est-leg'); leg.replaceChildren();
    for (const per of PERIODOS.filter((q) => E.anos.some((r) => periodoDoAno(r.ano) === q))) {
      const s = el('span'); s.append(el('i', { style: `background:${corDoAno(+per.slice(0, 4))}` }), MANDATO[per].replace(' (até 2025)', '')); leg.append(s);
    }
    // tabela por mandato
    const tb = $('#est-mand-table tbody'); tb.replaceChildren();
    for (const per of PERIODOS) {
      const i = +per.slice(0, 4), f = i + 3;
      const rs = E.anos.filter((r) => r.ano >= i && r.ano <= f);
      if (!rs.length) continue;
      const soma = d3.sum(rs, (r) => r.lucro_mi);
      const porEst = E.estatais.map((e) => ({ e, s: somaAnos(e, i, f) })).filter((x) => x.s != null).sort((a, b) => b.s - a.s);
      const mx = porEst[0], mn = porEst.at(-1);
      const nome = el('td');
      nome.append(MANDATO[per].replace(' (até 2025)', ''));
      if (rs[0].ano > i || rs.at(-1).ano < f) nome.append(el('span', { class: 'cod' }, ` · ${rs[0].ano} a ${rs.at(-1).ano}`));
      const tr = el('tr');
      tr.append(nome, el('td', { class: 'some-p' }, f0(rs.length)), el('td', { class: 'some-p' }, bi(soma)), el('td', {}, bi(soma / rs.length)),
        el('td', { class: 'some-p' }, mx ? `${mx.e.estatal} (${bi(mx.s)})` : '—'),
        el('td', { class: 'some-p' + (mn && mn.s < 0 ? ' ruim' : '') }, mn && mn.s < 0 ? `${mn.e.estatal} (${bi(mn.s)})` : 'nenhum'));
      tb.append(tr);
    }
    // tabela por estatal
    const ult = anos.at(-1);
    const cols = [['estatal', 'Estatal'], ...anos.map((a) => [String(a), String(a)]), ['b', 'Soma 2019–2022'], ['l', `Soma 2023–${ult}`]];
    const head = $('#est-head');
    const kAtual = st.estSort.key || String(ult);
    head.replaceChildren(...cols.map(([k, n]) => {
      const th = el('th', { scope: 'col', 'data-sort': k, 'aria-sort': k === kAtual ? (st.estSort.dir > 0 ? 'ascending' : 'descending') : 'none' });
      if (/^\d{4}$/.test(k) && +k < ult - 3) th.className = 'some-p';
      th.append(el('button', {}, n)); return th;
    }));
    const tbe = $('#est-table tbody'); tbe.replaceChildren();
    for (const e of estatisOrdenadas(E, anos)) {
      const tr = el('tr');
      const nome = el('td');
      nome.append(e.estatal);
      if (e.tipo === 'grupo') nome.append(el('span', { class: 'cod' }, ' · grupo'));
      else if (e.dependente) nome.append(el('span', { class: 'cod' }, ' · dependente'));
      nome.title = e.nome;
      tr.append(nome);
      for (const [k] of cols.slice(1)) {
        const v = k === 'b' ? somaAnos(e, 2019, 2022) : k === 'l' ? somaAnos(e, 2023, 2026) : e.valores[k];
        const td = el('td', { class: (/^\d{4}$/.test(k) && +k < ult - 3 ? 'some-p ' : '') + (v != null && v < 0 ? 'ruim' : '') }, v == null ? '—' : sgn(v, f0).replace(/^\+/, ''));
        tr.append(td);
      }
      tbe.append(tr);
    }
    $('#est-filtro').value = st.estFiltro;
  }
  $('#est-table thead').addEventListener('click', (ev) => {
    const th = ev.target.closest('th[data-sort]'); if (!th) return;
    const key = th.dataset.sort, atual = st.estSort.key || String(D.raw.estatais.anos.at(-1).ano);
    st.estSort = { key, dir: atual === key ? -st.estSort.dir : key === 'estatal' ? 1 : -1 };
    drawEstatais();
  });
  $('#csv-estatais').addEventListener('click', () => {
    const E = D.raw.estatais, anos = E.anos.map((r) => r.ano);
    baixarCSV('monitora-brasil-estatais-lucro-liquido.csv', estatisOrdenadas(E, anos), [
      { titulo: 'estatal', valor: (e) => e.estatal }, { titulo: 'nome', valor: (e) => e.nome },
      { titulo: 'tipo', valor: (e) => (e.tipo === 'grupo' ? 'grupo' : e.dependente ? 'dependente' : 'empresa') },
      ...anos.map((a) => ({ titulo: `${a} (R$ milhões)`, valor: (e) => e.valores[a] })),
    ]);
  });

  function show(page, push = true) {
    page = APELIDOS[page] || page;
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
  on('#cb-item', (v) => { st.cbItem = v; });
  on('#cb-y0', (v) => { st.cbY0 = +v; });
  on('#cb-ma', (v) => { st.cbMa = v; });
  on('#cb-mb', (v) => { st.cbMb = v; });
  on('#pl-a', (v) => { st.ga = v; });
  on('#pl-b', (v) => { st.gb = v; });
  on('#ct-y0', (v) => { st.cy0 = +v; });
  on('#ct-y1', (v) => { st.cy1 = +v; });
  on('#est-filtro', (v) => { st.estFiltro = v; });

  function render() {
    if (!D) return;
    tip.hide();
    if (st.page === 'visao') {
      fillSelect($('#v-coorte'), cohortOpts, st.coorte);
      fillSelect($('#v-mandato'), [...MANDATOS_ESC].reverse().map((m) => ({ label: `${m.id} · ${m.nome}`, value: m.id })), st.mandato);
      drawPosicao(); drawPlacar(); drawCartoes(); drawEvolucao(); drawDecomp(); drawRanking();
    } else if (st.page === 'series') { drawSeries(); drawPeriodos(); }
    else if (st.page === 'coortes') drawCoortes();
    else if (st.page === 'votar') drawVotar();
    else if (st.page === 'vida') drawVida();
    else if (st.page === 'estatais') drawEstatais();
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
