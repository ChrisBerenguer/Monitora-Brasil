// /api/ibge?p=<caminho>&<parâmetros>: repassa consultas de leitura à API de agregados do IBGE
// (servicodados.ibge.gov.br/api/v3/agregados). O IBGE costuma recusar conexões do GitHub Actions;
// esta função roda em São Paulo (gru1) e serve de caminho alternativo para os coletores.
// Só caminhos de agregados (tabelas do SIDRA), para não virar um proxy aberto.
const BASE = 'https://servicodados.ibge.gov.br/api/v3/agregados/';
const PERMITIDOS = [
  /^\d+\/metadados$/,
  /^\d+\/periodos$/,
  /^\d+\/periodos\/[\w|,-]+\/variaveis\/[\d|]+$/,
];
const PARAMS = ['localidades', 'classificacao', 'view'];

module.exports = async (req, res) => {
  const caminho = String(req.query.p || '').replace(/^agregados\//, '');
  if (!PERMITIDOS.some((re) => re.test(caminho))) {
    res.status(400).json({ erro: 'caminho não permitido' });
    return;
  }
  const q = new URLSearchParams();
  for (const k of PARAMS) if (req.query[k] != null) q.set(k, String(req.query[k]));
  const url = BASE + caminho + (q.toString() ? `?${q}` : '');
  let ultimo;
  for (let t = 0; t < 2; t++) {
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': 'MonitoraBrasil/1.0 (+https://github.com/ChrisBerenguer/Monitora-Brasil)' },
        signal: AbortSignal.timeout(25000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const txt = await r.text();
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      res.setHeader('Vercel-CDN-Cache-Control', 'max-age=3600, stale-while-revalidate=86400');
      res.status(200).send(txt);
      return;
    } catch (e) {
      ultimo = e;
    }
  }
  res.status(502).json({ erro: `o IBGE não respondeu (${ultimo && ultimo.message})` });
};
