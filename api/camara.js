// /api/camara?p=<caminho>&<parâmetros>: repassa consultas de leitura à API da Câmara dos Deputados.
// O navegador não pode chamar a API direto (ela não libera CORS e o site só conecta ao próprio domínio).
// Só caminhos de proposições e votações, para não virar um proxy aberto.
const { camara } = require('./_camara');

const PERMITIDOS = [
  /^proposicoes\/\d+$/,
  /^proposicoes\/\d+\/(autores|tramitacoes|temas|votacoes|relacionadas)$/,
  /^votacoes\/[\w-]+$/,
  /^votacoes\/[\w-]+\/(votos|orientacoes)$/,
];
const PARAMS = ['dataInicio', 'dataFim', 'itens', 'pagina', 'ordem', 'ordenarPor', 'idOrgao'];

module.exports = async (req, res) => {
  const caminho = String(req.query.p || '');
  if (!PERMITIDOS.some((re) => re.test(caminho))) {
    res.status(400).json({ erro: 'caminho não permitido' });
    return;
  }
  const q = new URLSearchParams();
  for (const k of PARAMS) if (req.query[k] != null) q.set(k, String(req.query[k]));
  try {
    const j = await camara(caminho + (q.toString() ? `?${q}` : ''));
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600');
    res.status(200).json(j);
  } catch (e) {
    res.status(502).json({ erro: `a API da Câmara não respondeu (${e.message})` });
  }
};
