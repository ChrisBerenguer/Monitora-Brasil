// /api/votacoes-recentes?desde=AAAA-MM-DD: as votações do Plenário da Câmara feitas desde a data,
// no mesmo formato de site/data/votacoes.json, com o voto de cada deputado nas nominais.
// Completa em tempo real o arquivo que o GitHub Actions gera uma vez por dia.
const { camara, emLotes, tipoVotacao, limparDesc, proposicaoPrincipal } = require('./_camara');

const VOTO = { Sim: 0, 'Não': 1, 'Abstenção': 2, 'Obstrução': 3, 'Artigo 17': 4 };
const iso = (d) => d.toISOString().slice(0, 10);

module.exports = async (req, res) => {
  const hoje = new Date();
  let desde = String(req.query.desde || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(desde)) desde = iso(new Date(hoje - 7 * 864e5));
  // no máximo 60 dias, para a função terminar a tempo
  if (new Date(desde) < new Date(hoje - 60 * 864e5)) desde = iso(new Date(hoje - 60 * 864e5));
  try {
    const lista = [];
    for (let pag = 1; pag <= 5; pag++) {
      const j = await camara(`votacoes?idOrgao=180&dataInicio=${desde}&dataFim=${iso(hoje)}&itens=200&pagina=${pag}&ordem=ASC&ordenarPor=dataHoraRegistro`);
      lista.push(...j.dados);
      if (j.dados.length < 200) break;
    }
    // nominais trazem o placar na descrição; das simbólicas, só as que decidem o texto
    const nominalPelaDesc = (v) => /Sim:?\s*\d+/i.test(v.descricao || '');
    const alvo = lista.filter((v) => nominalPelaDesc(v) || ['principal', 'outros'].includes(tipoVotacao(v.descricao)));
    const deputados = {}, proposicoes = {}, votos = {};
    const votacoes = (await emLotes(alvo, 8, async (v) => {
      const nominal = nominalPelaDesc(v);
      const [det, vs, ori] = await Promise.all([
        camara(`votacoes/${v.id}`),
        nominal ? camara(`votacoes/${v.id}/votos`) : Promise.resolve({ dados: [] }),
        nominal ? camara(`votacoes/${v.id}/orientacoes`).catch(() => ({ dados: [] })) : Promise.resolve({ dados: [] }),
      ]);
      const cont = [0, 0, 0, 0, 0, 0];
      const vv = vs.dados.map((x) => {
        const d = x.deputado_, c = VOTO[x.tipoVoto] ?? 5;
        cont[c]++;
        deputados[d.id] = [d.nome, d.siglaUf];
        return [d.id, d.siglaPartido || '', c];
      });
      if (vv.length) votos[v.id] = vv;
      const p = proposicaoPrincipal(v.descricao, det.dados.proposicoesAfetadas || []);
      if (p) proposicoes[p.id] = [`${p.siglaTipo} ${p.numero}/${p.ano}`, String(p.ementa || '').slice(0, 500)];
      const org = Object.fromEntries((ori.dados || []).map((o) => [o.siglaPartidoBloco, o.orientacaoVoto]));
      return {
        id: v.id, quando: String(v.dataHoraRegistro).slice(0, 16), desc: limparDesc(v.descricao), nominal: vv.length > 0,
        aprovada: v.aprovacao ?? null, tipo: tipoVotacao(v.descricao),
        sim: cont[0], nao: cont[1], abst: cont[2], obstr: cont[3], outros: cont[4] + cont[5],
        prop: p ? p.id : null, governo: org.Governo || null, oposicao: org['Oposição'] || null,
      };
    })).filter(Boolean);
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800');
    res.status(200).json({ consultado_em: new Date().toISOString(), desde, votacoes, deputados, proposicoes, votos });
  } catch (e) {
    res.status(502).json({ erro: `a API da Câmara não respondeu (${e.message})` });
  }
};
