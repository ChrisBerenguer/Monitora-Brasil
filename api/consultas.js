// /api/consultas: projetos em tramitação abertos à opinião do público, com o placar até agora.
//  - Senado, Portal e-Cidadania (Consulta Pública): as proposições em tramitação com mais votos,
//    "SIM" e "NÃO" (www12.senado.leg.br/ecidadania/pesquisamateria, sem as de tramitação encerrada).
//  - Câmara, Enquetes: as enquetes mais votadas e mais comentadas na última semana, no último mês e
//    nos últimos seis meses (www.camara.leg.br/enquetes), com o resultado de cada uma (concordo / discordo).
// Nenhuma das duas tem API: a função lê as páginas públicas. Roda em São Paulo (gru1) e a resposta
// fica no cache da Vercel por algumas horas.
const { camara, emLotes } = require('./_camara');

const UA = { 'User-Agent': 'MonitoraBrasil/1.0 (+https://github.com/ChrisBerenguer/Monitora-Brasil)', Accept: 'text/html' };
const SENADO = 'https://www12.senado.leg.br/ecidadania/';
const CAMARA = 'https://www.camara.leg.br/enquetes';
const PAGINAS_SENADO = 3; // 100 proposições por página, da mais votada para a menos

async function pagina(url, timeout = 15000) {
  let erro;
  for (let t = 0; t < 2; t++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(timeout) });
      if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
      return await r.text();
    } catch (e) { erro = e; }
  }
  throw erro;
}

const texto = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const numero = (s) => +String(s || '0').replace(/\D/g, '') || 0;

async function senado() {
  const htmls = await Promise.all(Array.from({ length: PAGINAS_SENADO }, (_, i) => pagina(`${SENADO}pesquisamateria?p=${i + 1}`)));
  const vistos = new Set(), lista = [];
  for (const h of htmls) {
    for (const bloco of h.split('<div class="resumo-materia">').slice(1)) {
      const id = (bloco.match(/visualizacaomateria\?id=(\d+)/) || [])[1];
      if (!id || vistos.has(id)) continue;
      vistos.add(id);
      const sigla = texto((bloco.match(/<header>\s*<a[^>]*>([\s\S]*?)<\/a>/) || [])[1]);
      const ementa = texto((bloco.match(/<section>\s*<a[^>]*>([\s\S]*?)<\/a>/) || [])[1]);
      const nums = [...(bloco.match(/<figure[\s\S]*?<header>([\s\S]*?)<\/header>/) || ['', ''])[1].matchAll(/<span>([\d.]+)<\/span>/g)].map((m) => numero(m[1]));
      lista.push({ casa: 'senado', id, sigla, ementa, favor: nums[0] || 0, contra: nums[1] || 0, url: `${SENADO}visualizacaomateria?id=${id}` });
    }
  }
  return lista;
}

async function camaraEnquetes() {
  const h = await pagina(CAMARA);
  // as listas de "mais votadas" e "mais comentadas" (semana, mês, seis meses) ficam depois do título
  // oculto de cada uma
  const ids = new Map();
  for (const m of h.matchAll(/Enquetes (mais (?:votadas|comentadas) [^<]+)<\/h3>([\s\S]*?)<\/ol>/g)) {
    for (const a of m[2].matchAll(/href="https:\/\/www\.camara\.leg\.br\/enquetes\/(\d+)"[\s\S]*?__retranca">([^<]*)</g)) {
      const per = m[1].trim();
      if (!ids.has(a[1])) ids.set(a[1], { sigla: texto(a[2]), periodos: [] });
      ids.get(a[1]).periodos.push(per);
    }
  }
  const lista = await emLotes([...ids], 6, async ([id, info]) => {
    const [res, prop] = await Promise.all([
      pagina(`${CAMARA}/${id}/resultados`),
      camara(`proposicoes/${id}`).catch(() => null),
    ]);
    const opc = {};
    for (const m of res.matchAll(/resumo-resposta__opiniao"[^>]*>([^<]+)<\/th>\s*<td[^>]*resumo-resposta__participacoes"[^>]*>([\d.]+)</g)) opc[texto(m[1])] = numero(m[2]);
    const desde = (res.match(/Resultado parcial desde (\d{2}\/\d{2}\/\d{4})/) || [])[1] || null;
    const p = prop?.dados;
    return {
      casa: 'camara', id, sigla: info.sigla, ementa: p?.ementa || '', situacao: p?.statusProposicao?.descricaoSituacao || null,
      favor: (opc['Concordo totalmente'] || 0) + (opc['Concordo na maior parte'] || 0),
      contra: (opc['Discordo totalmente'] || 0) + (opc['Discordo na maior parte'] || 0),
      indecisos: opc['Estou indeciso'] || 0, opcoes: opc, desde, periodos: info.periodos,
      url: `${CAMARA}/${id}`,
    };
  });
  return lista.filter(Boolean);
}

module.exports = async (req, res) => {
  const [s, c] = await Promise.allSettled([senado(), camaraEnquetes()]);
  const erros = {};
  if (s.status === 'rejected') erros.senado = String(s.reason?.message || s.reason);
  if (c.status === 'rejected') erros.camara = String(c.reason?.message || c.reason);
  if (s.status === 'rejected' && c.status === 'rejected') {
    res.status(502).json({ erro: 'nem o Senado nem a Câmara responderam', erros });
    return;
  }
  res.setHeader('Cache-Control', 'public, s-maxage=10800, stale-while-revalidate=86400');
  res.setHeader('Vercel-CDN-Cache-Control', 'max-age=10800, stale-while-revalidate=86400');
  res.status(200).json({
    consultado_em: new Date().toISOString(),
    senado: s.status === 'fulfilled' ? s.value : [],
    camara: c.status === 'fulfilled' ? c.value : [],
    erros,
  });
};
