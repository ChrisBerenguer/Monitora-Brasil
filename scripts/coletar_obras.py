"""Coleta os dados da aba "Obras entregues".

1. Investimento do Governo Central em % do PIB (Tesouro Nacional, Resultado do Tesouro Nacional,
   tabela 2.3-A da série histórica), de 2008 em diante.
2. Obras federais do Obrasgov.br (API de dados abertos): obras concluídas por ano de conclusão
   efetiva e retrato atual por situação.

Gera site/data/investimento.json e site/data/obras.json (e as cópias em dados/).
Roda no GitHub Actions (.github/workflows/dados-obras.yml), porque precisa de internet aberta.
"""
import io, json, time, urllib.parse, urllib.request
from collections import Counter, defaultdict
from datetime import date, datetime
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
UA = {'User-Agent': 'MonitoraBrasil/1.0 (+https://github.com/ChrisBerenguer/Monitora-Brasil)', 'Accept': 'application/json,*/*'}


def baixar(url, tentativas=5):
    for t in range(tentativas):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
                return r.read()
        except Exception as e:  # noqa: BLE001
            print(f'  tentativa {t + 1} falhou: {e}')
            time.sleep(3 * (t + 1))
    raise RuntimeError(f'não consegui baixar {url}')


def gravar(nome, obj):
    txt = json.dumps(obj, ensure_ascii=False, separators=(',', ':'))
    for pasta in (RAIZ / 'dados', RAIZ / 'site' / 'data'):
        pasta.mkdir(exist_ok=True)
        (pasta / nome).write_text(txt, encoding='utf-8')
    print(f'gravado {nome} ({len(txt) / 1024:.0f} KB)')


# ------------------------------------------------------------------ 1. Tesouro
def investimento():
    import openpyxl
    pacote = json.loads(baixar('https://www.tesourotransparente.gov.br/ckan/api/3/action/package_show?id=resultado-do-tesouro-nacional'))
    rec = next(r for r in pacote['result']['resources'] if 'rie Hist' in (r.get('name') or '') and (r.get('format') or '').upper() == 'XLSX')
    print('RTN:', rec['name'], rec['url'])
    wb = openpyxl.load_workbook(io.BytesIO(baixar(rec['url'])), read_only=True, data_only=True)
    ws = wb['2.3-A']
    linhas = list(ws.iter_rows(values_only=True))
    cab = next(r for r in linhas if r and isinstance(r[0], str) and r[0].startswith('Investimento por Grupo'))
    anos = [int(c) for c in cab[1:] if isinstance(c, (int, float))]
    def linha(prefixo):
        r = next(r for r in linhas if r and isinstance(r[0], str) and r[0].strip().startswith(prefixo))
        return [None if v is None else round(100 * float(v), 3) for v in r[1:1 + len(anos)]]
    total, gnd4 = linha('1. INVESTIMENTO TOTAL'), linha('1.1 Investimentos (GND 4)')
    serie = [{'ano': a, 'total_pct_pib': t, 'gnd4_pct_pib': g} for a, t, g in zip(anos, total, gnd4)]
    gravar('investimento.json', {
        'fonte': 'Tesouro Nacional, Resultado do Tesouro Nacional, série histórica, tabela 2.3-A',
        'url': rec['url'], 'arquivo': rec['url'].rsplit('/', 1)[-1], 'coletado_em': date.today().isoformat(),
        'serie': serie,
    })
    for s in serie: print(' ', s)


# ------------------------------------------------------------------ 2. Obrasgov
API = 'https://api-publica.obrasgov.gestao.gov.br/obras'
SITUACOES = ['Concluída', 'Em execução', 'Paralisada', 'Inacabada', 'Cadastrada', 'Cancelada']


def pagina(rota, **params):
    q = urllib.parse.urlencode({k: v for k, v in params.items() if v is not None})
    return json.loads(baixar(f'{API}/{rota}?{q}'))


def ano(d):
    try:
        return int(str(d)[:4]) if d else None
    except ValueError:
        return None


def obras():
    atual = pagina('data-atualizacao')
    print('Obrasgov atualizado em:', atual)
    retrato = {}
    for s in SITUACOES:
        retrato[s] = pagina('projeto-investimento', situacao=s, pagina=1, tamanho_da_pagina=1).get('total_items')
        print(f'  {s}: {retrato[s]}')
    # todas as obras concluídas
    tam, pg, itens = 500, 1, []
    while True:
        r = pagina('projeto-investimento', situacao='Concluída', pagina=pg, tamanho_da_pagina=tam)
        itens += r.get('data') or []
        print(f'  página {pg}/{r.get("total_pages")} ({len(itens)} de {r.get("total_items")})')
        if pg >= (r.get('total_pages') or 0) or not r.get('data'):
            break
        pg += 1
        time.sleep(0.3)
    por_ano = defaultdict(lambda: {'n': 0, 'valor': 0.0, 'n_valor': 0})
    por_eixo = defaultdict(Counter)
    sem_data, cad = 0, Counter()
    for o in itens:
        a = ano(o.get('dt_final_efetiva'))
        cad[ano(o.get('dt_cadastro')) or o.get('ano_cadastro')] += 1
        if a is None:
            sem_data += 1
            continue
        v = sum((x.get('vl_investimento_previsto') or 0) for x in (o.get('investimentos_previstos') or []))
        por_ano[a]['n'] += 1
        if v > 0:
            por_ano[a]['valor'] += v
            por_ano[a]['n_valor'] += 1
        eixo = ((o.get('eixos_tipos') or [{}])[0] or {}).get('eixo') or 'Não informado'
        por_eixo[a][eixo] += 1
    anos = sorted(a for a in por_ano if 1990 <= a <= date.today().year)
    gravar('obras.json', {
        'fonte': 'Obrasgov.br, API de dados abertos (Ministério da Gestão e da Inovação em Serviços Públicos)',
        'url': API, 'atualizado_fonte': atual, 'coletado_em': date.today().isoformat(),
        'retrato_situacao': retrato,
        'concluidas_total': len(itens), 'concluidas_sem_data': sem_data,
        'concluidas_por_ano': [{'ano': a, 'n': por_ano[a]['n'], 'valor_previsto': round(por_ano[a]['valor'], 2), 'n_com_valor': por_ano[a]['n_valor'],
                                 'por_eixo': dict(por_eixo[a].most_common())} for a in anos],
        'concluidas_por_ano_cadastro': {str(k): v for k, v in sorted(cad.items(), key=lambda x: (x[0] is None, x[0]))},
    })
    print('anos de conclusão:', {a: por_ano[a]['n'] for a in anos})
    print('sem data de conclusão:', sem_data, '| por ano de cadastro:', dict(sorted(cad.items(), key=lambda x: (x[0] is None, x[0]))))


if __name__ == '__main__':
    investimento()
    obras()
