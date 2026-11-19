"""Lupa de artigos científicos: para cada cartão do site, busca pesquisas na OpenAlex e pede à IA
(Groq) um resumo curto do que elas dizem, citando cada artigo.

  - OpenAlex (api.openalex.org): base aberta de trabalhos acadêmicos, que inclui a SciELO, textos
    para discussão (IPEA, NBER, Banco Mundial) e teses. Sem chave. Para cada tema, uma busca em
    inglês e outra em português, de 2005 em diante, só trabalhos com resumo; descarta revistas de
    baixa qualidade (lista abaixo) e escolhe 7 pela relevância e pelas citações.
  - Groq (api.groq.com, modelo Llama 3.3 70B): resume em português só o que está nos resumos dos
    artigos, com [n] apontando o artigo. Precisa do segredo GROQ_API_KEY; sem ele, o arquivo sai só
    com a lista de artigos. O resumo só é refeito quando a lista de artigos do tema muda.

Gera site/data/artigos.json. Roda toda semana (.github/workflows/dados-artigos.yml).
Uso: python scripts/coletar_artigos.py [--so TEMA ...] [--sem-ia]
"""
import argparse, hashlib, json, math, os, re, sys, time, urllib.parse, urllib.request
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from temas_artigos import todos  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
UA = {'User-Agent': 'MonitoraBrasil/1.0 (+https://github.com/ChrisBerenguer/Monitora-Brasil)'}
OPENALEX = 'https://api.openalex.org/works'
GROQ = 'https://api.groq.com/openai/v1/chat/completions'
MODELO = 'llama-3.3-70b-versatile'
N_ARTIGOS = 7
# revistas com revisão por pares frágil ou publicação em massa, que poluem as buscas em português
FRACAS = [
    'research, society and development', 'research society and development', 'brazilian journal of development',
    'brazilian journal of health review', 'brazilian journal of business', 'revista ibero-americana de humanidades',
    'observatorio de la economía latinoamericana', 'observatório de la economía latinoamericana', 'contribuciones a las ciencias sociales',
    'recima21', 'revista foco', 'caderno pedagógico', 'cuadernos de educación y desarrollo', 'revista de gestão e secretariado',
    'revista contemporânea', 'lumen et virtus', 'concilium', 'revista aracê', 'seven editora', 'editora científica digital',
    'international journal of development research', 'global journal of human-social science', 'zenodo',
    'brazilian journal of animal and environmental research', 'peer review', 'revista caribeña de ciencias sociales',
]


def get(url, tentativas=4, dados=None, headers=None):
    for t in range(tentativas):
        try:
            req = urllib.request.Request(url, data=dados, headers={**UA, **(headers or {})})
            with urllib.request.urlopen(req, timeout=90) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            if e.code == 429:
                espera = float(e.headers.get('retry-after') or 20)
                print(f'  limite de uso, esperando {espera:.0f}s', flush=True)
                time.sleep(min(espera, 90))
                continue
            if t == tentativas - 1:
                raise
            time.sleep(5 * (t + 1))
        except Exception:  # noqa: BLE001
            if t == tentativas - 1:
                raise
            time.sleep(5 * (t + 1))


def resumo_texto(inv):
    if not inv:
        return ''
    pos = {}
    for palavra, ps in inv.items():
        for p in ps:
            pos[p] = palavra
    return ' '.join(pos[i] for i in sorted(pos))


def buscar(q):
    params = {
        'search': q, 'per-page': 25,
        'filter': 'publication_year:>2004,has_abstract:true,type:article|preprint|report|book-chapter|review|dissertation',
        'select': 'id,doi,display_name,publication_year,cited_by_count,primary_location,best_oa_location,open_access,language,authorships,abstract_inverted_index,type',
    }
    return get(OPENALEX + '?' + urllib.parse.urlencode(params)).get('results', [])


def fraca(nome):
    n = (nome or '').lower()
    return any(f in n for f in FRACAS)


def normal(t):
    return re.sub(r'[^a-z0-9]', '', (t or '').lower())[:80]


def escolher(en, pt):
    """Pontua pela posição na busca (relevância) e pelas citações; até 4 em inglês e 3 em português,
    completando com os melhores restantes."""
    def pontos(lista):
        out = []
        for i, w in enumerate(lista):
            fonte = ((w.get('primary_location') or {}).get('source') or {}).get('display_name')
            if not w.get('display_name') or fraca(fonte):
                continue
            cit = w.get('cited_by_count') or 0
            p = 1 / (1 + 0.12 * i) + 0.25 * math.log10(1 + cit) - (0.25 if not fonte and cit == 0 else 0)
            out.append((p, w))
        return sorted(out, key=lambda x: -x[0])
    pe, pp = pontos(en), pontos(pt)
    vistos, esc = set(), []

    def pegar(lista, n):
        tomados = 0
        for _, w in lista:
            if tomados >= n or len(esc) >= N_ARTIGOS:
                break
            k = normal(w['display_name'])
            if k not in vistos:
                vistos.add(k); esc.append(w); tomados += 1

    pegar(pe, 4)
    pegar(pp, 3)
    pegar(sorted(pe + pp, key=lambda x: -x[0]), N_ARTIGOS)
    return esc[:N_ARTIGOS]


def compacto(w):
    loc = w.get('primary_location') or {}
    oa = w.get('best_oa_location') or {}
    autores = [a['author']['display_name'] for a in (w.get('authorships') or []) if a.get('author')]
    resumo = resumo_texto(w.get('abstract_inverted_index'))
    url = w.get('doi') or loc.get('landing_page_url') or w['id']
    return {
        'id': w['id'].rsplit('/', 1)[-1], 'titulo': w['display_name'], 'ano': w.get('publication_year'),
        'autores': autores[:3] + (['et al.'] if len(autores) > 3 else []),
        'fonte': (loc.get('source') or {}).get('display_name'), 'citacoes': w.get('cited_by_count') or 0,
        'idioma': w.get('language'), 'tipo': w.get('type'), 'url': url,
        'pdf': oa.get('pdf_url') or (oa.get('landing_page_url') if (w.get('open_access') or {}).get('is_oa') else None),
        'trecho': (resumo[:420] + '…') if len(resumo) > 420 else resumo,
        '_resumo': resumo,
    }


def resumir(chave, contexto, artigos):
    blocos = '\n\n'.join(f'[{i + 1}] {a["titulo"]} ({a["ano"]}). Resumo: {a["_resumo"][:900]}' for i, a in enumerate(artigos))
    sistema = ('Você escreve para um site brasileiro de dados públicos, para leitores sem formação técnica. '
               'Responda em português do Brasil, em 3 ou 4 frases curtas, sem listas e sem títulos. '
               'Use SOMENTE o que está nos resumos dos artigos fornecidos; não acrescente fatos, números ou opiniões. '
               'Depois de cada afirmação, indique o artigo de onde ela vem no formato [n]. '
               'Se os artigos não tratam do assunto do cartão, diga isso em uma frase. Não recomende políticas.')
    usuario = (f'O cartão do site mostra: {contexto}\n\n'
               f'Explique, com base nestes artigos, o que a pesquisa acadêmica diz sobre os fatores por trás desse dado e da variação dele.\n\n{blocos}')
    corpo = json.dumps({'model': MODELO, 'temperature': 0.2, 'max_tokens': 450,
                        'messages': [{'role': 'system', 'content': sistema}, {'role': 'user', 'content': usuario}]}).encode()
    r = get(GROQ, dados=corpo, headers={'Authorization': f'Bearer {os.environ["GROQ_API_KEY"]}', 'Content-Type': 'application/json'})
    txt = r['choices'][0]['message']['content'].strip()
    # remove citações que não existem
    txt = re.sub(r'\[(\d+)\]', lambda m: m.group(0) if 1 <= int(m.group(1)) <= len(artigos) else '', txt)
    return txt


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--so', nargs='*', help='só estes temas')
    ap.add_argument('--sem-ia', action='store_true')
    args = ap.parse_args()
    nomes = {r['id']: r['nome'] for r in json.loads((RAIZ / 'site' / 'data' / 'indicadores.json').read_text(encoding='utf-8'))}
    temas = todos(nomes)
    destino = RAIZ / 'site' / 'data' / 'artigos.json'
    velho = json.loads(destino.read_text(encoding='utf-8')) if destino.exists() else {'temas': {}}
    usar_ia = bool(os.environ.get('GROQ_API_KEY')) and not args.sem_ia
    if not usar_ia:
        print('::notice::Sem GROQ_API_KEY: os temas saem só com a lista de artigos (os resumos já feitos são mantidos).')
    saida = dict(velho.get('temas', {}))
    erros = 0
    for chave, (contexto, en, pt) in temas.items():
        if args.so and chave not in args.so:
            continue
        try:
            arts = [compacto(w) for w in escolher(buscar(en), buscar(pt))]
        except Exception as e:  # noqa: BLE001
            erros += 1
            print(f'::warning::{chave}: OpenAlex falhou ({e}); tema mantido como estava.')
            continue
        assinatura = hashlib.sha1('|'.join(a['id'] for a in arts).encode()).hexdigest()[:12]
        antigo = velho.get('temas', {}).get(chave, {})
        item = {'contexto': contexto, 'busca': [en, pt], 'assinatura': assinatura,
                'artigos': [{k: v for k, v in a.items() if not k.startswith('_')} for a in arts]}
        if antigo.get('assinatura') == assinatura and antigo.get('resumo'):
            item['resumo'], item['resumo_em'] = antigo['resumo'], antigo.get('resumo_em')
        elif usar_ia and arts:
            try:
                item['resumo'], item['resumo_em'] = resumir(chave, contexto, arts), date.today().isoformat()
                time.sleep(12)  # limite de tokens por minuto do plano grátis
            except Exception as e:  # noqa: BLE001
                print(f'::warning::{chave}: Groq falhou ({e}); tema sai sem resumo.')
        saida[chave] = item
        print(f'{chave}: {len(arts)} artigos' + (' + resumo' if item.get('resumo') else ''), flush=True)
        time.sleep(0.3)
    obj = {'gerado_em': date.today().isoformat(), 'modelo': MODELO if usar_ia else None,
           'fontes': {'artigos': 'OpenAlex (api.openalex.org)', 'resumos': f'Groq, {MODELO}'}, 'temas': saida}
    novo = json.dumps(obj, ensure_ascii=False, separators=(',', ':'))
    if velho.get('temas') == saida:
        print('Nada mudou.')
        return
    destino.write_text(novo, encoding='utf-8')
    print(f'gravado artigos.json ({len(novo) / 1024:.0f} KB, {len(saida)} temas, {erros} erros)')


if __name__ == '__main__':
    main()
