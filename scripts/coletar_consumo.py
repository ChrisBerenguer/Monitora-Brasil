"""Coleta os dados da aba "Consumo básico" do Monitora Brasil.

Fontes (todas públicas e sem cadastro):
  - Cesta básica: DIEESE, via Ipeadata (série CESBTOTAL, gasto mensal por capital).
  - Combustíveis e gás de cozinha: ANP, Levantamento de Preços, planilhas mensais do Brasil.
  - Salário mínimo: Ministério do Trabalho, via Ipeadata (MTE12_SALMIN12).
  - IPCA (número-índice): IBGE, via Ipeadata (PRECOS12_IPCA12), usado para corrigir os preços.
  - Renda domiciliar per capita: IBGE, PNAD Contínua anual, SIDRA tabela 7395.
  - Inflação por categoria de consumo: IBGE, IPCA, variação mensal e peso de grupos e itens
    (SIDRA tabelas 2938, 1419 e 7060, de jul/2006 em diante, emendadas pelo código da categoria).

O IBGE costuma recusar conexões do GitHub Actions; nesse caso as consultas ao SIDRA passam pela
função /api/ibge do site (scripts/ibge_api.py).

Gera site/data/consumo.json (e a cópia em dados/). Roda no GitHub Actions
(.github/workflows/dados-consumo.yml), porque precisa de internet aberta.
"""
import gzip, io, json, time, urllib.request
from collections import defaultdict
from datetime import date
from pathlib import Path

from ibge_api import ibge

RAIZ = Path(__file__).resolve().parent.parent
UA = {'User-Agent': 'MonitoraBrasil/1.0 (+https://github.com/ChrisBerenguer/Monitora-Brasil)',
      'Accept': '*/*', 'Accept-Encoding': 'identity'}


def baixar(url, tentativas=4, timeout=240):
    for t in range(tentativas):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
                b = r.read()
                return gzip.decompress(b) if b[:2] == b'\x1f\x8b' else b
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


def ipea(cod):
    """Série do Ipeadata: devolve [(mês 'AAAA-MM', valor, território)]."""
    v = json.loads(baixar(f"http://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='{cod}')"))['value']
    return [(x['VALDATA'][:7], float(x['VALVALOR']), (x.get('TERCODIGO') or '').strip())
            for x in v if x['VALVALOR'] is not None]


# Capitais pesquisadas pelo DIEESE, pelo código IBGE do município.
CAPITAIS = {
    '1100205': 'Porto Velho', '1200401': 'Rio Branco', '1302603': 'Manaus', '1400100': 'Boa Vista',
    '1400605': 'Boa Vista', '1501402': 'Belém', '1600303': 'Macapá', '1721000': 'Palmas',
    '2111300': 'São Luís', '2211001': 'Teresina', '2304400': 'Fortaleza', '2408102': 'Natal',
    '2507507': 'João Pessoa', '2611606': 'Recife', '2704302': 'Maceió', '2800308': 'Aracaju',
    '2927408': 'Salvador', '3106200': 'Belo Horizonte', '3205309': 'Vitória', '3304557': 'Rio de Janeiro',
    '3550308': 'São Paulo', '4106902': 'Curitiba', '4205407': 'Florianópolis', '4314902': 'Porto Alegre',
    '5002704': 'Campo Grande', '5103403': 'Cuiabá', '5208707': 'Goiânia', '5300108': 'Brasília',
    '3302809': 'Macaé',
}

# Produtos da ANP que entram na aba, com o nome usado no site.
# As planilhas antigas usam "ÓLEO DIESEL" (com acento) e as novas "OLEO DIESEL".
ANP_PRODUTOS = {
    'GASOLINA COMUM': 'gasolina',
    'ETANOL HIDRATADO': 'etanol',
    'OLEO DIESEL': 'diesel', 'ÓLEO DIESEL': 'diesel',
    'GLP': 'gas',
}
ANP_URLS = [
    'https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/precos-revenda-e-de-distribuicao-combustiveis/shlp/2001-2012/mensal-brasil-2001-a-2012.xlsx',
    'https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/precos-revenda-e-de-distribuicao-combustiveis/shlp/mensal/mensal-brasil-desde-jan2013.xlsx',
]


def anp():
    """Preço médio de revenda, por mês e produto. Devolve {produto: {mês: preço}} e as unidades."""
    import openpyxl
    precos, unidades = defaultdict(dict), {}
    for url in ANP_URLS:
        wb = openpyxl.load_workbook(io.BytesIO(baixar(url)), read_only=True, data_only=True)
        ws = wb.worksheets[0]
        linhas = [r for r in ws.iter_rows(values_only=True) if r and any(c is not None for c in r)]
        i = next(k for k, r in enumerate(linhas) if str(r[0]).strip().upper() == 'MÊS')
        cab = [str(c).strip().upper() if c else '' for c in linhas[i]]
        c_prod = next(k for k, c in enumerate(cab) if c.startswith('PRODUTO'))
        c_un = next(k for k, c in enumerate(cab) if 'UNIDADE' in c)
        c_preco = next(k for k, c in enumerate(cab) if 'MÉDIO REVENDA' in c or 'MEDIO REVENDA' in c)
        n = 0
        for r in linhas[i + 1:]:
            prod = ANP_PRODUTOS.get(str(r[c_prod]).strip().upper())
            if not prod or r[0] is None or r[c_preco] is None:
                continue
            mes = r[0].strftime('%Y-%m') if hasattr(r[0], 'strftime') else str(r[0])[:7]
            try:
                precos[prod][mes] = round(float(r[c_preco]), 3)
            except (TypeError, ValueError):
                continue
            unidades[prod] = str(r[c_un]).strip()
            n += 1
        print(f'  ANP {url.rsplit("/", 1)[-1]}: {n} linhas úteis')
    print('  unidades:', unidades)
    return precos, unidades


def renda():
    """Rendimento domiciliar per capita (PNAD Contínua anual, já em valores reais)."""
    d = json.loads(ibge('7395/periodos/all/variaveis/4196?localidades=N1[all]'))
    s = d[0]['resultados'][0]['series'][0]['serie']
    return [{'ano': int(a), 'valor': float(v)} for a, v in sorted(s.items()) if str(v).replace('.', '').isdigit()]


# Categorias de consumo do IPCA que entram na aba: (código, nome no site, código do grupo).
# Os grupos são os nove do IPCA; os itens e subitens foram escolhidos entre os de maior peso ou
# os bens que as famílias mais acompanham. O código é o mesmo nas três tabelas, salvo "Cursos".
IPCA_GERAL = '7169'
IPCA_GRUPOS = [
    ('7170', 'Alimentação e bebidas'), ('7445', 'Habitação'), ('7486', 'Artigos de residência'),
    ('7558', 'Vestuário'), ('7625', 'Transportes'), ('7660', 'Saúde e cuidados pessoais'),
    ('7712', 'Despesas pessoais'), ('7766', 'Educação'), ('7786', 'Comunicação'),
]
IPCA_ITENS = [
    ('7171', 'Alimentação em casa', '7170'), ('7432', 'Alimentação fora de casa', '7170'),
    ('7448', 'Aluguel residencial', '7445'), ('7485', 'Energia elétrica', '7445'), ('7451', 'Água e esgoto', '7445'),
    ('7488', 'Móveis', '7486'), ('7522', 'Eletrodomésticos e equipamentos', '7486'), ('7541', 'TV, som e informática', '7486'),
    ('7559', 'Roupas', '7558'), ('7604', 'Calçados e acessórios', '7558'),
    ('7641', 'Automóvel novo', '7625'), ('107654', 'Automóvel usado', '7625'), ('7654', 'Motocicleta', '7625'),
    ('7656', 'Combustíveis', '7625'), ('7628', 'Ônibus urbano', '7625'), ('7634', 'Passagem aérea', '7625'),
    ('7662', 'Remédios (produtos farmacêuticos)', '7660'), ('7695', 'Plano de saúde', '7660'), ('7698', 'Higiene pessoal', '7660'),
    ('7720', 'Empregado doméstico', '7712'), ('7730', 'Recreação', '7712'),
    ('12427', 'Cursos regulares (escola e faculdade)', '7766'), ('107673', 'Ensino superior', '7766'),
    ('107688', 'Acesso à internet', '7786'), ('7794', 'Aparelho telefônico', '7786'),
]
# Tabelas do IPCA no SIDRA, da mais antiga à mais nova, e os códigos que mudam em cada uma.
IPCA_TABELAS = [('2938', {'12427': '7768'}), ('1419', {}), ('7060', {})]


def ipca_categorias():
    """Variação mensal (%) e peso de cada categoria, de jul/2006 em diante."""
    ids = [IPCA_GERAL] + [g for g, _ in IPCA_GRUPOS] + [i for i, _, _ in IPCA_ITENS]
    var, peso = defaultdict(dict), defaultdict(dict)
    for tab, troca in IPCA_TABELAS:
        volta = {v: k for k, v in troca.items()}
        cod = [troca.get(i, i) for i in ids]
        d = json.loads(ibge(f'{tab}/periodos/all/variaveis/63|66?localidades=N1[all]&classificacao=315[{",".join(cod)}]'))
        for v in d:
            alvo = var if v['id'] == '63' else peso
            for r in v['resultados']:
                c = next(iter(r['classificacoes'][0]['categoria']))
                c = volta.get(c, c)
                for per, x in r['series'][0]['serie'].items():
                    try:
                        alvo[c][f'{per[:4]}-{per[4:]}'] = float(x)
                    except (TypeError, ValueError):
                        pass  # "-" ou "..." (sem dado no mês)
        print(f'  IPCA tabela {tab}: {len(d[0]["resultados"])} categorias')
    meses = sorted(var[IPCA_GERAL])
    cats = [{'id': IPCA_GERAL, 'nome': 'IPCA (índice geral)', 'nivel': 'geral'}]
    cats += [{'id': g, 'nome': n, 'nivel': 'grupo'} for g, n in IPCA_GRUPOS]
    cats += [{'id': i, 'nome': n, 'nivel': 'item', 'grupo': g} for i, n, g in IPCA_ITENS]
    for c in cats:
        s = var.get(c['id'], {})
        c['var'] = [s.get(m) for m in meses]
        pk = sorted(peso.get(c['id'], {}))
        c['peso'] = round(peso[c['id']][pk[-1]], 4) if pk else None
        c['peso_mes'] = pk[-1] if pk else None
        falta = sum(v is None for v in c['var'])
        if falta:
            print(f'  aviso: {c["nome"]} sem dado em {falta} meses')
    print(f'  {len(cats)} categorias, {meses[0]} a {meses[-1]}')
    return {'meses': meses, 'categorias': cats}


def main():
    print('IPCA...')
    ipca = {m: v for m, v, _ in ipea('PRECOS12_IPCA12')}
    base = max(ipca)
    print(f'  índice de {len(ipca)} meses; base de correção: {base}')

    print('Cesta básica (DIEESE)...')
    cesta_cap = defaultdict(dict)
    for mes, valor, ter in ipea('CESBTOTAL'):
        if ter in CAPITAIS:
            cesta_cap[CAPITAIS[ter]][mes] = round(valor, 2)
    meses_cesta = sorted({m for c in cesta_cap.values() for m in c})
    media = {}
    for m in meses_cesta:
        vs = [c[m] for c in cesta_cap.values() if m in c]
        if len(vs) >= 3:
            media[m] = {'v': round(sum(vs) / len(vs), 2), 'n': len(vs)}
    print(f'  {len(cesta_cap)} capitais, {len(media)} meses com 3+ capitais ({min(media)} a {max(media)})')

    print('Combustíveis (ANP)...')
    precos, unidades = anp()

    print('Salário mínimo...')
    salario = {m: v for m, v, _ in ipea('MTE12_SALMIN12')}

    print('Renda domiciliar per capita (IBGE)...')
    rend = renda()

    print('IPCA por categoria de consumo (IBGE)...')
    cats = ipca_categorias()
    print('  ', rend)

    def real(valor, mes):
        """Corrige um valor de `mes` para os preços do último mês do IPCA."""
        if mes not in ipca or not ipca[mes]:
            return None
        return round(valor * ipca[base] / ipca[mes], 2)

    itens = {}
    sm_meses = sorted(salario)
    def sm(mes):  # salário mínimo vigente no mês (repete o último conhecido)
        if mes in salario: return salario[mes]
        ant = [m for m in sm_meses if m <= mes]
        return salario[ant[-1]] if ant else None

    def serie(nome, titulo, unidade, dados, desde='2001-01'):
        pontos = []
        for mes in sorted(dados):
            if mes < desde: continue
            v = dados[mes]['v'] if isinstance(dados[mes], dict) else dados[mes]
            r, s = real(v, mes), sm(mes)
            pontos.append({'mes': mes, 'v': v, 'real': r, 'sm': round(s / v, 2) if (s and v) else None})
        itens[nome] = {'titulo': titulo, 'unidade': unidade, 'pontos': pontos}
        if pontos:
            p = pontos[-1]
            print(f'  {nome}: {len(pontos)} meses, último {p["mes"]} = R$ {p["v"]} (real R$ {p["real"]}, {p["sm"]} por salário mínimo)')

    serie('cesta', 'Cesta básica', 'R$ por mês', media)
    serie('gasolina', 'Gasolina comum', unidades.get('gasolina', 'R$/l'), precos['gasolina'])
    serie('etanol', 'Etanol hidratado', unidades.get('etanol', 'R$/l'), precos['etanol'])
    serie('diesel', 'Óleo diesel', unidades.get('diesel', 'R$/l'), precos['diesel'])
    serie('gas', 'Gás de cozinha (botijão)', unidades.get('gas', 'R$/13 kg'), precos['gas'])

    gravar('consumo.json', {
        'coletado_em': date.today().isoformat(),
        'base_ipca': base,
        'fontes': {
            'cesta': 'DIEESE, Pesquisa Nacional da Cesta Básica de Alimentos, via Ipeadata (CESBTOTAL)',
            'combustiveis': 'ANP, Levantamento de Preços de Combustíveis, preço médio de revenda no Brasil',
            'salario': 'Salário mínimo nominal vigente, via Ipeadata (MTE12_SALMIN12)',
            'ipca': 'IPCA, número-índice, IBGE via Ipeadata (PRECOS12_IPCA12)',
            'renda': 'IBGE, PNAD Contínua anual, SIDRA tabela 7395 (rendimento médio mensal real domiciliar per capita)',
            'ipca_categorias': 'IBGE, IPCA, variação mensal e peso por grupo, item e subitem, SIDRA tabelas 2938 (2006-2011), 1419 (2012-2019) e 7060 (2020 em diante)',
        },
        'itens': itens,
        'cesta_capitais': {c: v for c, v in sorted(cesta_cap.items())},
        'salario_minimo': [{'mes': m, 'v': salario[m], 'real': real(salario[m], m)} for m in sm_meses if m >= '1994-12' and m <= base],
        'renda_per_capita': rend,
        'ipca': [{'mes': m, 'indice': round(ipca[m], 4)} for m in sorted(ipca) if m >= '1994-12'],
        'ipca_categorias': cats,
    })


if __name__ == '__main__':
    main()
