// Funções comuns às rotas /api da Câmara (arquivos com "_" não viram rota na Vercel).
const BASE = 'https://dadosabertos.camara.leg.br/api/v2/';

// cache na memória da função: enquanto a instância segue viva, repete a resposta por 10 minutos
const MEMO = new Map();
const MEMO_MS = 10 * 60 * 1000;

async function camara(caminho, opts) {
  const m = MEMO.get(caminho);
  if (m && Date.now() - m.t < MEMO_MS) return m.j;
  const j = await camaraDireto(caminho, opts);
  if (MEMO.size > 500) MEMO.clear();
  MEMO.set(caminho, { t: Date.now(), j });
  return j;
}

async function camaraDireto(caminho, { tentativas = 2, timeout = 9000 } = {}) {
  let erro;
  for (let t = 0; t < tentativas; t++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeout);
    try {
      const r = await fetch(BASE + caminho, { headers: { Accept: 'application/json', 'User-Agent': 'MonitoraBrasil/1.0' }, signal: ctl.signal });
      if (r.status === 429) { await new Promise((ok) => setTimeout(ok, 800 * (t + 1))); erro = new Error('HTTP 429'); continue; }
      if (!r.ok) throw new Error(`HTTP ${r.status} em ${caminho}`);
      return await r.json();
    } catch (e) { erro = e; } finally { clearTimeout(timer); }
  }
  throw erro;
}

/** Roda fn sobre a lista com no máximo n chamadas ao mesmo tempo. */
async function emLotes(lista, n, fn) {
  const out = new Array(lista.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, lista.length) }, async () => {
    while (i < lista.length) { const k = i++; try { out[k] = await fn(lista[k]); } catch (e) { out[k] = null; } }
  }));
  return out;
}

// Mesma classificação de scripts/coletar_votacoes.py (tipo_votacao).
function tipoVotacao(desc) {
  const d = String(desc || '').trim();
  const corpo = d.replace(/^(Aprovad[oa]s?|Rejeitad[oa]s?|Mantid[oa]s?|Prejudicad[oa]s?|Suprimid[oa]s?)(?:\s*,[^,]*,)?\s+(?:a |o |as |os )?/i, '');
  if (/^requerimento/i.test(corpo)) return /urg[êe]ncia/i.test(corpo.slice(0, 80)) ? 'urgencia' : 'requerimento';
  if (/^(Mantid|Suprimid)/i.test(d) || /^(texto|emenda(?!s do senado)|subemenda(?! substitutiva)|parte|preferência|destaque|admissibilidade d[oe]s? destaques?|dispositivo|expressão|art)/i.test(corpo)) return 'destaque';
  if (/^reda[çc][ãa]o final/i.test(corpo)) return 'outros';
  if (/^(projeto|proposta|substitutivo|sube?menda substitutiva|medida provis|parecer|PEC|emendas? do senado|mensagem)/i.test(corpo)) return 'principal';
  return 'outros';
}
const limparDesc = (d) => String(d || '').replace(/\s*Sim:?\s*\d+\s*;.*$/i, '').trim();
const TIPOS_PRINCIPAIS = ['PEC', 'PLP', 'PL', 'MPV', 'PLV', 'PDL', 'PRC', 'PLN'];
function proposicaoPrincipal(desc, props) {
  if (!props || !props.length) return null;
  const d = String(desc || '').replace(/(\d)\.(?=\d{3})/g, '$1');
  const citada = props.find((p) => p.numero && TIPOS_PRINCIPAIS.includes(p.siglaTipo) && new RegExp(`n[ºo°]\\s*${p.numero}\\b`).test(d));
  return citada || props.find((p) => TIPOS_PRINCIPAIS.includes(p.siglaTipo)) || props[0];
}

module.exports = { camara, emLotes, tipoVotacao, limparDesc, proposicaoPrincipal };
