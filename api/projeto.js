// /api/projeto?id=<id da proposição>: dados, autores, temas e tramitação de um projeto, numa chamada só
// (o quadro de detalhes da aba Leis e votação). Consulta a API da Câmara na hora.
const { camara } = require('./_camara');

module.exports = async (req, res) => {
  const id = String(req.query.id || '');
  if (!/^\d+$/.test(id)) { res.status(400).json({ erro: 'id inválido' }); return; }
  try {
    // a API da Câmara fica lenta com muitas chamadas ao mesmo tempo: primeiro o essencial, depois o resto
    const dados = await camara(`proposicoes/${id}`, { timeout: 20000 });
    const extra = (c) => camara(c, { timeout: 15000, tentativas: 1 }).catch(() => ({ dados: [] }));
    const [autores, temas] = await Promise.all([extra(`proposicoes/${id}/autores`), extra(`proposicoes/${id}/temas`)]);
    const tram = await extra(`proposicoes/${id}/tramitacoes`);
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600');
    res.setHeader('Vercel-CDN-Cache-Control', 'max-age=900, stale-while-revalidate=3600');
    res.status(200).json({ dados: dados.dados, autores: autores.dados, temas: temas.dados, tram: tram.dados });
  } catch (e) {
    res.status(502).json({ erro: `a API da Câmara não respondeu (${e.message})` });
  }
};
