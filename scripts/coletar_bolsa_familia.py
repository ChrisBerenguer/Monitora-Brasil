"""Entradas e saídas de famílias do Bolsa Família (e do Auxílio Brasil, que o substituiu entre
novembro de 2021 e fevereiro de 2023), mês a mês, por ano e por mandato.

Fonte: Portal da Transparência (CGU), arquivos mensais de pagamentos, um por programa:
  - Bolsa Família, pagamentos       jan/2013 a out/2021  /download-de-dados/bolsa-familia-pagamentos/AAAAMM
  - Auxílio Brasil                  nov/2021 a fev/2023  /download-de-dados/auxilio-brasil/AAAAMM
  - Novo Bolsa Família              mar/2023 em diante   /download-de-dados/novo-bolsa-familia/AAAAMM
Cada arquivo traz uma linha por pagamento, com o NIS do responsável pela família (o "favorecido").
Uma família está no programa no mês se recebeu algum pagamento no arquivo daquele mês. Comparando os
NIS de dois meses: entraram = estão no segundo e não estavam no primeiro; saíram = o contrário.
Os arquivos são grandes (cerca de 330 MB compactados, 2 GB abertos, 19 milhões de linhas), então o
script guarda só o conjunto de NIS de cada mês, em memória, e descarta o arquivo.

Modos (o workflow .github/workflows/dados-bolsa-familia.yml usa todos):
  --ano AAAA            fluxos mensais do ano e a comparação dez do ano anterior x dez (ou último mês)
  --mandatos            comparação entre o início e o fim de cada mandato
  --juntar PASTA        junta os resultados parciais (PASTA/*.json) em bolsa_familia.json
  --atualizar           (coleta mensal) processa só os meses novos e refaz o ano corrente e o mandato atual
Os parciais vão para --saida (padrão: parciais/).
"""
import argparse, json, re, subprocess, sys, tempfile, time, urllib.request
from datetime import date
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
PORTAL = 'https://portaldatransparencia.gov.br/download-de-dados/'
UA = 'Mozilla/5.0 (MonitoraBrasil; +https://github.com/ChrisBerenguer/Monitora-Brasil)'
INICIO = '2013-01'
MANDATOS = [  # (período, nome, mês inicial, mês final): dezembro antes da posse até dezembro do último ano
    ('2011–2014', 'Dilma 1 (desde jan/2013)', '2013-01', '2014-12'),
    ('2015–2018', 'Dilma 2 / Temer', '2014-12', '2018-12'),
    ('2019–2022', 'Bolsonaro', '2018-12', '2022-12'),
    ('2023–2026', 'Lula 3', '2022-12', '2026-12'),
]


def programa(mes):
    if mes >= '2023-03':
        return 'novo-bolsa-familia', 'Novo Bolsa Família'
    if mes >= '2021-11':
        return 'auxilio-brasil', 'Auxílio Brasil'
    return 'bolsa-familia-pagamentos', 'Bolsa Família'


def mais(mes, n=1):
    a, m = map(int, mes.split('-'))
    t = a * 12 + m - 1 + n
    return f'{t // 12}-{t % 12 + 1:02d}'


def meses_disponiveis():
    """Meses publicados no portal, lidos da página de download de cada programa."""
    todos = set()
    for p in ('bolsa-familia-pagamentos', 'auxilio-brasil', 'novo-bolsa-familia'):
        req = urllib.request.Request(PORTAL + p, headers={'User-Agent': UA})
        h = urllib.request.urlopen(req, timeout=60).read().decode('utf-8', 'replace')
        for a, m in re.findall(r'"ano"\s*:\s*"(\d{4})",\s*"mes"\s*:\s*"(\d{2})"', h):
            mes = f'{a}-{m}'
            if programa(mes)[0] == p:
                todos.add(mes)
    return sorted(m for m in todos if m >= INICIO)


def nis_do_mes(mes, tmp):
    """Conjunto (ordenado, sem repetição) dos NIS que receberam pagamento no mês."""
    prog = programa(mes)[0]
    url = PORTAL + f'{prog}/{mes.replace("-", "")}'
    z = Path(tmp) / f'{mes}.zip'
    for t in range(4):
        r = subprocess.run(['curl', '-sSfL', '--retry', '3', '-m', '1800', '-A', UA, '-o', str(z), url])
        if r.returncode == 0 and z.exists() and z.stat().st_size > 1_000_000:
            break
        print(f'  {mes}: download falhou (tentativa {t + 1})', flush=True)
        time.sleep(30 * (t + 1))
    else:
        raise RuntimeError(f'não consegui baixar {url}')
    cab = subprocess.run(f'unzip -p "{z}" | head -1', shell=True, capture_output=True).stdout.decode('latin-1')
    cols = [c.strip().strip('"').upper() for c in cab.split(';')]
    col = next(i for i, c in enumerate(cols) if c.startswith('NIS'))
    out = subprocess.run(f'unzip -p "{z}" | tail -n +2 | cut -d";" -f{col + 1} | tr -d \'"\\r\'', shell=True, capture_output=True, check=True).stdout
    z.unlink()
    v = np.array(out.split()).astype(np.int64)
    u = np.unique(v)
    print(f'  {mes} ({programa(mes)[1]}): {len(v):,} pagamentos, {len(u):,} famílias', flush=True)
    return u


def comparar(a, b):
    return {'entraram': int(len(np.setdiff1d(b, a, assume_unique=True))),
            'sairam': int(len(np.setdiff1d(a, b, assume_unique=True))),
            'permaneceram': int(len(np.intersect1d(a, b, assume_unique=True)))}


def fluxos(meses, tmp, guardar=()):
    """Fluxos mês a mês para os meses dados (consecutivos). Devolve a lista e os conjuntos pedidos."""
    res, guard = [], {}
    ant = nis_do_mes(mais(meses[0], -1), tmp) if mais(meses[0], -1) >= INICIO else None
    if mais(meses[0], -1) in guardar:
        guard[mais(meses[0], -1)] = ant
    for m in meses:
        cur = nis_do_mes(m, tmp)
        item = {'mes': m, 'programa': programa(m)[1], 'familias': int(len(cur))}
        if ant is not None:
            c = comparar(ant, cur)
            item.update(entraram=c['entraram'], sairam=c['sairam'])
        res.append(item)
        if m in guardar:
            guard[m] = cur
        ant = cur
    return res, guard


def modo_ano(ano, disp, tmp):
    meses = [m for m in disp if m.startswith(f'{ano}-')]
    ini, fim = f'{ano - 1}-12', meses[-1]
    lista, g = fluxos(meses, tmp, guardar=(ini, fim))
    anos = []
    if ini in g and g[ini] is not None:
        anos.append({'ano': ano, 'ini': ini, 'fim': fim, 'familias_ini': int(len(g[ini])), 'familias_fim': int(len(g[fim])), **comparar(g[ini], g[fim])})
    return {'meses': lista, 'anos': anos}


def modo_mandatos(disp, tmp, so_atual=False):
    ult = disp[-1]
    out, cache = [], {}
    for per, nome, ini, fim in MANDATOS:
        if so_atual and per != MANDATOS[-1][0]:
            continue
        fim_r = min(fim, ult)
        for m in (ini, fim_r):
            if m not in cache:
                cache[m] = nis_do_mes(m, tmp)
        a, b = cache[ini], cache[fim_r]
        out.append({'periodo': per, 'nome': nome, 'ini': ini, 'fim': fim_r, 'em_curso': fim_r < fim,
                    'familias_ini': int(len(a)), 'familias_fim': int(len(b)), **comparar(a, b)})
    return {'mandatos': out}


def juntar(partes, velho=None):
    meses, anos, mand = {}, {}, {}
    for p in ([velho] if velho else []) + partes:
        for x in p.get('meses', []):
            meses[x['mes']] = x
        for x in p.get('anos', []):
            anos[x['ano']] = x
        for x in p.get('mandatos', []):
            mand[x['periodo']] = x
    return {
        'coletado_em': date.today().isoformat(),
        'fonte': 'Portal da Transparência (CGU): pagamentos do Bolsa Família (2013-2021), do Auxílio Brasil (nov/2021 a fev/2023) e do Novo Bolsa Família (mar/2023 em diante), por NIS do responsável familiar',
        'unidade': 'famílias (NIS do responsável que recebeu pagamento no mês)',
        'meses': [meses[k] for k in sorted(meses)],
        'anos': [anos[k] for k in sorted(anos)],
        'mandatos': [mand[k] for k in sorted(mand)],
    }


def gravar(obj):
    txt = json.dumps(obj, ensure_ascii=False, separators=(',', ':'))
    for pasta in (RAIZ / 'dados', RAIZ / 'site' / 'data'):
        (pasta / 'bolsa_familia.json').write_text(txt, encoding='utf-8')
    print(f'gravado bolsa_familia.json ({len(txt) / 1024:.0f} KB)')


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument('--ano', type=int)
    g.add_argument('--mandatos', action='store_true')
    g.add_argument('--juntar')
    g.add_argument('--atualizar', action='store_true')
    ap.add_argument('--saida', default='parciais')
    args = ap.parse_args()
    atual = RAIZ / 'site' / 'data' / 'bolsa_familia.json'
    velho = json.loads(atual.read_text(encoding='utf-8')) if atual.exists() else None

    if args.juntar:
        partes = [json.loads(f.read_text(encoding='utf-8')) for f in sorted(Path(args.juntar).glob('*.json'))]
        gravar(juntar(partes, velho))
        return

    try:
        disp = meses_disponiveis()
    except Exception as e:  # noqa: BLE001
        print(f'::warning::Portal da Transparência não respondeu ({e}). Dados do Bolsa Família mantidos.')
        return
    print(f'meses no portal: {disp[0]} a {disp[-1]} ({len(disp)})')
    with tempfile.TemporaryDirectory() as tmp:
        if args.ano:
            parte = modo_ano(args.ano, disp, tmp)
            Path(args.saida).mkdir(parents=True, exist_ok=True)
            (Path(args.saida) / f'ano-{args.ano}.json').write_text(json.dumps(parte, ensure_ascii=False))
        elif args.mandatos:
            parte = modo_mandatos(disp, tmp)
            Path(args.saida).mkdir(parents=True, exist_ok=True)
            (Path(args.saida) / 'mandatos.json').write_text(json.dumps(parte, ensure_ascii=False))
        else:  # atualizar
            feitos = {x['mes'] for x in (velho or {}).get('meses', [])}
            novos = [m for m in disp if m not in feitos]
            if not novos:
                print('Nenhum mês novo no portal.')
                return
            print('meses novos:', novos)
            anos = sorted({int(m[:4]) for m in novos})
            partes = [modo_ano(a, disp, tmp) for a in anos]
            partes.append(modo_mandatos(disp, tmp, so_atual=True))
            gravar(juntar(partes, velho))


if __name__ == '__main__':
    sys.exit(main())
