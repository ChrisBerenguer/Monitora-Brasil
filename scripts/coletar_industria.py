"""Coleta os dados da aba "Indústria" do Monitora Brasil: quanto cresce cada segmento da economia.

Fontes (todas do IBGE, pela API do SIDRA, públicas e sem cadastro):
  - Contas Nacionais Trimestrais (CNT), tabela 1620: índice de volume do valor adicionado por setor.
    Dá a série de cada categoria (agropecuária, extração, manufatura, energia e saneamento,
    construção, serviços) e dos ramos de serviços, desde 1996.
  - Pesquisa Industrial Mensal (PIM-PF), tabela 8888: índice de produção física das 24 atividades
    da indústria de transformação e da extrativa, desde 2002.
  - Pesquisa Mensal de Serviços (PMS), tabela 8688: índice de volume dos serviços por atividade, desde 2011.
  - Levantamento Sistemático da Produção Agrícola (LSPA), tabela 6588: produção de grãos, cana, café e laranja.
  - Pesquisa Trimestral do Abate (tabelas 1092, 1093, 1094) e do Leite (1086).
  - Produção da Pecuária Municipal (3940, aquicultura) e Produção da Extração Vegetal e da Silvicultura (291).

Para cada segmento grava o crescimento em volume de cada ano completo e o acumulado do ano corrente
(meses ou trimestres já publicados contra os mesmos do ano anterior). Valores em volume, não em reais:
o crescimento já desconta a variação de preços.

Gera site/data/industria.json (e a cópia em dados/). Roda no GitHub Actions
(.github/workflows/dados-industria.yml). Para testar sem internet: --cache PASTA com as respostas
da API gravadas como PASTA/<chave>.json (as chaves estão em CONSULTAS).
"""
import argparse, gzip, json, time, urllib.request
from collections import defaultdict
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
UA = {'User-Agent': 'MonitoraBrasil/1.0 (+https://github.com/ChrisBerenguer/Monitora-Brasil)',
      'Accept': 'application/json', 'Accept-Encoding': 'identity'}
API = 'https://servicodados.ibge.gov.br/api/v3/agregados/'
L = 'localidades=N1[all]'
CONSULTAS = {
    'cnt': f'1620/periodos/all/variaveis/583?{L}&classificacao=11255[90687,90691,90692,90693,90695,90694,90696,90697,90698,90699,90700,90702,90701,90703,90707]',
    'pim': f'8888/periodos/all/variaveis/12606?{L}&classificacao=544[all]',
    'pms': f'8688/periodos/all/variaveis/7167?{L}&classificacao=11046[56726]|12355[all]',
    'lspa': f'6588/periodos/all/variaveis/35?{L}&classificacao=48[39428,39456,40527,39454,39455,39463]',
    'bov': f'1092/periodos/all/variaveis/285?{L}&classificacao=12716[115236]|18[992]|12529[118225]',
    'sui': f'1093/periodos/all/variaveis/285?{L}&classificacao=12716[115236]|12529[118225]',
    'fra': f'1094/periodos/all/variaveis/285?{L}&classificacao=12716[115236]|12529[118225]',
    'leite': f'1086/periodos/all/variaveis/282?{L}&classificacao=12716[115236]|12529[118225]',
    'aqui': f'3940/periodos/all/variaveis/4146?{L}&classificacao=654[all]',
    'silv': f'291/periodos/all/variaveis/142?{L}&classificacao=194[3457]',
}
FONTE = {
    'cnt': ('IBGE, Contas Nacionais Trimestrais', 'https://sidra.ibge.gov.br/tabela/1620'),
    'pim': ('IBGE, Pesquisa Industrial Mensal (PIM-PF)', 'https://sidra.ibge.gov.br/tabela/8888'),
    'pms': ('IBGE, Pesquisa Mensal de Serviços (PMS)', 'https://sidra.ibge.gov.br/tabela/8688'),
    'lspa': ('IBGE, Levantamento Sistemático da Produção Agrícola (LSPA)', 'https://sidra.ibge.gov.br/tabela/6588'),
    'bov': ('IBGE, Pesquisa Trimestral do Abate de Animais', 'https://sidra.ibge.gov.br/tabela/1092'),
    'sui': ('IBGE, Pesquisa Trimestral do Abate de Animais', 'https://sidra.ibge.gov.br/tabela/1093'),
    'fra': ('IBGE, Pesquisa Trimestral do Abate de Animais', 'https://sidra.ibge.gov.br/tabela/1094'),
    'leite': ('IBGE, Pesquisa Trimestral do Leite', 'https://sidra.ibge.gov.br/tabela/1086'),
    'aqui': ('IBGE, Produção da Pecuária Municipal (PPM)', 'https://sidra.ibge.gov.br/tabela/3940'),
    'silv': ('IBGE, Produção da Extração Vegetal e da Silvicultura (PEVS)', 'https://sidra.ibge.gov.br/tabela/291'),
}

CATEGORIAS = [  # (id, nome, categoria da CNT)
    ('agro', 'Agropecuária', '90687'),
    ('extracao', 'Extração mineral', '90692'),
    ('manufatura', 'Manufatura', '90693'),
    ('energia', 'Energia e saneamento', '90695'),
    ('construcao', 'Construção civil', '90694'),
    ('servicos', 'Serviços', '90696'),
]
PIB = '90707'

# (id, nome, categoria, consulta, código da categoria na tabela, o que mede)
SEGMENTOS = [
    # Agropecuária
    ('graos', 'Grãos (soja, milho, arroz, feijão, trigo...)', 'agro', 'lspa', '39428', 'toneladas colhidas'),
    ('cana', 'Cana-de-açúcar', 'agro', 'lspa', '39456', 'toneladas colhidas'),
    ('cafe', 'Café', 'agro', 'lspa', 'cafe', 'toneladas colhidas'),
    ('laranja', 'Laranja', 'agro', 'lspa', '39463', 'toneladas colhidas'),
    ('bovinos', 'Pecuária de corte: bovinos', 'agro', 'bov', None, 'peso das carcaças abatidas'),
    ('suinos', 'Pecuária de corte: suínos', 'agro', 'sui', None, 'peso das carcaças abatidas'),
    ('frangos', 'Avicultura: frangos', 'agro', 'fra', None, 'peso das carcaças abatidas'),
    ('leite', 'Leite', 'agro', 'leite', None, 'litros comprados pelos laticínios'),
    ('peixes', 'Piscicultura (peixes de cultivo)', 'agro', 'aqui', 'peixes', 'quilos produzidos'),
    ('camarao', 'Carcinicultura (camarão)', 'agro', 'aqui', '32887', 'quilos produzidos'),
    ('silvicultura', 'Silvicultura (madeira em tora)', 'agro', 'silv', '3457', 'metros cúbicos'),
    # Extração mineral
    ('extrativa', 'Petróleo, gás e minérios (indústria extrativa)', 'extracao', 'pim', '129315', 'índice de produção física'),
    # Manufatura
    ('alimentos', 'Alimentos', 'manufatura', 'pim', '129317', 'índice de produção física'),
    ('bebidas', 'Bebidas', 'manufatura', 'pim', '129318', 'índice de produção física'),
    ('fumo', 'Fumo', 'manufatura', 'pim', '129319', 'índice de produção física'),
    ('texteis', 'Têxtil', 'manufatura', 'pim', '129320', 'índice de produção física'),
    ('vestuario', 'Vestuário e acessórios', 'manufatura', 'pim', '129321', 'índice de produção física'),
    ('couro', 'Couro e calçados', 'manufatura', 'pim', '129322', 'índice de produção física'),
    ('madeira', 'Produtos de madeira', 'manufatura', 'pim', '129323', 'índice de produção física'),
    ('papel', 'Celulose e papel', 'manufatura', 'pim', '129324', 'índice de produção física'),
    ('grafica', 'Impressão e gráfica', 'manufatura', 'pim', '129325', 'índice de produção física'),
    ('refino', 'Refino de petróleo e biocombustíveis', 'manufatura', 'pim', '129326', 'índice de produção física'),
    ('quimica', 'Química', 'manufatura', 'pim', '56689', 'índice de produção física'),
    ('farmaceutica', 'Farmacêutica', 'manufatura', 'pim', '129330', 'índice de produção física'),
    ('plastico', 'Borracha e plástico', 'manufatura', 'pim', '129331', 'índice de produção física'),
    ('nao_metalicos', 'Cimento, vidro e cerâmica (minerais não metálicos)', 'manufatura', 'pim', '129332', 'índice de produção física'),
    ('metalurgia', 'Metalurgia (aço, alumínio...)', 'manufatura', 'pim', '129333', 'índice de produção física'),
    ('produtos_metal', 'Produtos de metal', 'manufatura', 'pim', '129334', 'índice de produção física'),
    ('eletronica', 'Eletrônica e informática', 'manufatura', 'pim', '129335', 'índice de produção física'),
    ('eletricos', 'Máquinas e materiais elétricos', 'manufatura', 'pim', '129336', 'índice de produção física'),
    ('maquinas', 'Máquinas e equipamentos', 'manufatura', 'pim', '129337', 'índice de produção física'),
    ('automoveis', 'Automobilística (veículos, reboques e carrocerias)', 'manufatura', 'pim', '129338', 'índice de produção física'),
    ('outros_transp', 'Naval, aeroespacial e ferroviária', 'manufatura', 'pim', '129339', 'índice de produção física'),
    ('moveis', 'Móveis', 'manufatura', 'pim', '129340', 'índice de produção física'),
    ('diversos', 'Produtos diversos (joias, brinquedos, material médico...)', 'manufatura', 'pim', '129341', 'índice de produção física'),
    ('manutencao', 'Manutenção e instalação de máquinas', 'manufatura', 'pim', '129342', 'índice de produção física'),
    # Energia e saneamento
    ('eletricidade', 'Eletricidade, gás, água e esgoto', 'energia', 'cnt', '90695', 'índice de volume do valor adicionado'),
    ('residuos', 'Esgoto, coleta de lixo e reciclagem (empresas)', 'energia', 'pms', '56699', 'índice de volume dos serviços'),
    # Construção civil
    ('construcao', 'Construção civil', 'construcao', 'cnt', '90694', 'índice de volume do valor adicionado'),
    # Serviços
    ('comercio', 'Comércio', 'servicos', 'cnt', '90697', 'índice de volume do valor adicionado'),
    ('transporte', 'Transporte, armazenagem e correio', 'servicos', 'cnt', '90698', 'índice de volume do valor adicionado'),
    ('terrestre', 'Transporte terrestre (rodoviário e ferroviário)', 'servicos', 'pms', '31422', 'índice de volume dos serviços'),
    ('aquaviario', 'Transporte aquaviário', 'servicos', 'pms', '31423', 'índice de volume dos serviços'),
    ('aereo', 'Transporte aéreo', 'servicos', 'pms', '31424', 'índice de volume dos serviços'),
    ('armazenagem', 'Armazenagem, logística e correio', 'servicos', 'pms', '31425', 'índice de volume dos serviços'),
    ('informacao', 'Informação e comunicação', 'servicos', 'cnt', '90699', 'índice de volume do valor adicionado'),
    ('telecom', 'Telecomunicações', 'servicos', 'pms', '39321', 'índice de volume dos serviços'),
    ('ti', 'Tecnologia da informação', 'servicos', 'pms', '39322', 'índice de volume dos serviços'),
    ('audiovisual', 'Audiovisual, edição e agências de notícias', 'servicos', 'pms', '31398', 'índice de volume dos serviços'),
    ('financeiros', 'Serviços financeiros e seguros', 'servicos', 'cnt', '90700', 'índice de volume do valor adicionado'),
    ('imobiliarias', 'Atividades imobiliárias', 'servicos', 'cnt', '90702', 'índice de volume do valor adicionado'),
    ('alojamento', 'Hotéis, bares e restaurantes', 'servicos', 'pms', '106870', 'índice de volume dos serviços'),
    ('profissionais', 'Serviços técnico-profissionais (engenharia, advocacia, publicidade...)', 'servicos', 'pms', '31400', 'índice de volume dos serviços'),
    ('administrativos', 'Serviços administrativos (limpeza, vigilância, locação...)', 'servicos', 'pms', '31421', 'índice de volume dos serviços'),
    ('outros_serv', 'Outros serviços (saúde e educação privadas, cultura, serviços pessoais...)', 'servicos', 'cnt', '90701', 'índice de volume do valor adicionado'),
    ('publico', 'Administração, saúde e educação públicas', 'servicos', 'cnt', '90703', 'índice de volume do valor adicionado'),
]
# Peixes de cultivo: soma das espécies (a categoria "Peixes" só existe a partir de 2025).
PEIXES = ['32861', '32865', '32866', '32867', '32868', '32869', '32870', '32871', '32872', '32873',
          '32874', '32875', '32876', '32877', '32878', '32879', '32880', '32881']
MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']


def baixar(url, tentativas=4, timeout=240):
    for t in range(tentativas):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
                b = r.read()
                return gzip.decompress(b) if b[:2] == b'\x1f\x8b' else b
        except Exception as e:  # noqa: BLE001
            print(f'  tentativa {t + 1} falhou: {e}')
            time.sleep(5 * (t + 1))
    raise RuntimeError(f'não consegui baixar {url}')


def gravar(nome, obj):
    txt = json.dumps(obj, ensure_ascii=False, separators=(',', ':'))
    for pasta in (RAIZ / 'dados', RAIZ / 'site' / 'data'):
        pasta.mkdir(exist_ok=True)
        (pasta / nome).write_text(txt, encoding='utf-8')
    print(f'gravado {nome} ({len(txt) / 1024:.0f} KB)')


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None  # '-', '...', 'X' etc.


def series_da_tabela(resposta):
    """{código da categoria: {período: valor}}. Sem classificação de interesse, a chave é None."""
    out = {}
    for r in resposta[0]['resultados']:
        # a série é identificada pela categoria da classificação de interesse; nas consultas
        # com uma série só (abate, leite), fica None
        chave = None
        for cl in r['classificacoes']:
            if cl['id'] in ('11255', '544', '12355', '48', '654', '194'):
                chave = next(iter(cl['categoria']))
        s = {p: num(v) for p, v in r['series'][0]['serie'].items()}
        out[chave] = {p: v for p, v in s.items() if v is not None}
    return out


def anualizar(s, freq):
    """Agrega uma série mensal ('AAAAMM') ou trimestral ('AAAA0T') em anos completos.
    Devolve (anual {ano: soma}, parcial {ano, n, cresc, ate}) — o parcial compara os primeiros n
    períodos do último ano com os mesmos do ano anterior."""
    por = defaultdict(dict)
    for p, v in s.items():
        por[int(p[:4])][int(p[4:])] = v
    cheio = 12 if freq == 'm' else 4
    anual = {a: sum(d.values()) for a, d in por.items() if len(d) == cheio}
    parcial = None
    ult = max(por)
    if len(por[ult]) < cheio and ult - 1 in por:
        n = max(por[ult])
        ks = range(1, n + 1)
        if all(k in por[ult] for k in ks) and all(k in por[ult - 1] for k in ks):
            a, b = sum(por[ult][k] for k in ks), sum(por[ult - 1][k] for k in ks)
            ate = f'{MESES[n - 1]}' if freq == 'm' else f'{n}º tri'
            rot = (f'jan–{ate}' if n > 1 else 'jan') if freq == 'm' else (f'1º tri' if n == 1 else f'1º ao {n}º tri')
            parcial = {'ano': ult, 'rotulo': f'{rot} {ult}', 'cresc': round(100 * (a / b - 1), 2)}
    return anual, parcial


def crescimentos(anual):
    return {a: round(100 * (v / anual[a - 1] - 1), 2) for a, v in sorted(anual.items()) if a - 1 in anual and anual[a - 1]}


def lspa_anual(s):
    """LSPA: a estimativa de dezembro é a safra do ano; no ano corrente, vale a última estimativa."""
    anual, ultimo = {}, max(s)
    for p, v in s.items():
        if p.endswith('12'):
            anual[int(p[:4])] = v
    parcial = None
    a = int(ultimo[:4])
    if a not in anual and a - 1 in anual:
        parcial = {'ano': a, 'rotulo': f'{a}, estimativa de {MESES[int(ultimo[4:]) - 1]}', 'cresc': round(100 * (s[ultimo] / anual[a - 1] - 1), 2)}
    return anual, parcial


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cache', help='pasta com as respostas da API já baixadas (<chave>.json)')
    args = ap.parse_args()
    bruto = {}
    for k, q in CONSULTAS.items():
        if args.cache:
            bruto[k] = json.loads((Path(args.cache) / f'{k}.json').read_text(encoding='utf-8'))
        else:
            print('baixando', k)
            try:
                bruto[k] = json.loads(baixar(API + q, tentativas=3, timeout=90))
            except RuntimeError as e:
                # a API do IBGE às vezes recusa conexões vindas de fora do Brasil (como o GitHub Actions):
                # mantém o industria.json atual e tenta de novo na próxima rodada, em vez de falhar
                print(f'::warning::{e}. industria.json mantido sem mudança; nova tentativa na próxima rodada.')
                return
    S = {k: series_da_tabela(v) for k, v in bruto.items()}
    # peixes = soma das espécies, só nos anos em que todas têm dado
    aq = S['aqui']
    anos = set.intersection(*(set(aq[c]) for c in PEIXES if c in aq))
    S['aqui']['peixes'] = {a: sum(aq[c][a] for c in PEIXES if c in aq) for a in anos}
    # café: "café total" vai até 2017; desde 2012 o LSPA publica arábica e canéfora (conilon) separados
    ls = S['lspa']
    S['lspa']['cafe'] = {p: ls['39454'][p] + ls['39455'][p] if p in ls.get('39454', {}) and p in ls.get('39455', {}) else v
                         for p, v in {**ls.get('40527', {}), **ls.get('39454', {})}.items()}

    def montar(cons, cod):
        s = S[cons][cod]
        if cons == 'lspa':
            anual, parcial = lspa_anual(s)
        elif cons in ('aqui', 'silv'):
            anual, parcial = {int(a): v for a, v in s.items()}, None
        else:
            anual, parcial = anualizar(s, 'm' if cons in ('pim', 'pms') else 't')
        ult = max(s)
        return anual, parcial, ult

    def periodo_txt(cons, p):
        if cons in ('aqui', 'silv'):
            return p
        if cons in ('pim', 'pms', 'lspa'):
            return f'{MESES[int(p[4:]) - 1]}/{p[:4]}'
        return f'{int(p[4:])}º tri/{p[:4]}'

    cats = []
    for cid, nome, cod in CATEGORIAS + [('pib', 'PIB', PIB)]:
        anual, parcial, ult = montar('cnt', cod)
        idx = {a: round(v / 4, 2) for a, v in anual.items()}  # média dos trimestres (base 1995 = 100)
        cats.append({'id': cid, 'nome': nome, 'indice': idx, 'cresc': crescimentos(anual), 'parcial': parcial,
                     'ultimo': periodo_txt('cnt', ult)})
    segs = []
    for sid, nome, cat, cons, cod, mede in SEGMENTOS:
        cod = cod if cons not in ('bov', 'sui', 'fra', 'leite') else None
        anual, parcial, ult = montar(cons, cod)
        segs.append({'id': sid, 'nome': nome, 'categoria': cat, 'fonte': FONTE[cons][0], 'url': FONTE[cons][1],
                     'mede': mede, 'desde': min(anual), 'cresc': crescimentos(anual), 'parcial': parcial,
                     'ultimo': periodo_txt(cons, ult)})
        print(f'  {sid:16s} {min(anual)}–{max(anual)}  último ano {list(segs[-1]["cresc"].items())[-1]}  parcial {parcial}')
    gravar('industria.json', {
        'coletado_em': date.today().isoformat(),
        'categorias': cats,
        'segmentos': segs,
        'fontes': {k: {'nome': n, 'url': u} for k, (n, u) in FONTE.items()},
    })


if __name__ == '__main__':
    main()
