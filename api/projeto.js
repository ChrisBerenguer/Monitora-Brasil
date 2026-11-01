// /api/projeto?id=<id da proposição>: dados, autores, temas e tramitação de um projeto, numa chamada só
// (o quadro de detalhes da aba Leis e votação). Consulta a API da Câmara na hora.
const { camara } = require('./_camara');

module.exports = async (req, res) => {
  const id = String(req.query.id || '');
  if (!/^\d+$/.test(id)) { res.status(400).json({ erro: 'id inválido' }); return; }
  try {
    const [dados, autores, temas, tram] = await Promise.all([
      camara(`proposicoes/${id}`),
      camara(`proposicoes/${id}/autores`).catch(() => ({ dados: [] })),
      camara(`proposicoes/${id}/temas`).catch(() => ({ dados: [] })),
      camara(`proposicoes/${id}/tramitacoes`).catch(() => ({ dados: [] })),
    ]);
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600');
    res.setHeader('Vercel-CDN-Cache-Control', 'max-age=900, stale-while-revalidate=3600');
    res.status(200).json({ dados: dados.dados, autores: autores.dados, temas: temas.dados, tram: tram.dados });
  } catch (e) {
    res.status(502).json({ erro: `a API da Câmara não respondeu (${e.message})` });
  }
};
