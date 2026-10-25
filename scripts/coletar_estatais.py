"""Coleta o lucro líquido das estatais federais para a aba "Estatais" do Monitora Brasil.

Fonte: dados abertos da SEST (Secretaria de Coordenação e Governança das Empresas
Estatais, Ministério da Gestão e da Inovação em Serviços Públicos):
  https://www.gov.br/gestao/pt-br/assuntos/estatais/transparencia/dados-abertos
  - Dados Financeiros (sestdadosfinanceiros.zip): demonstrações de cada estatal (DRE, balanço...).
  - Identificação das Empresas Estatais (sestidentificacao.zip): grupo econômico, vínculo,
    dependência do Tesouro e setor de cada empresa.

Regras (ver docs/03, seção "Estatais"):
  - Lucro líquido = rubrica "LUCRO OU PREJUÍZO LÍQUIDO DO EXERCÍCIO" (código 500000) no plano
    antigo, ou "LUCRO/PREJUÍZO LÍQUIDO C/PART. DE NÃO CONTROLADORES" (289900000) no plano novo.
  - Em cada ano vale a demonstração anual. Sem ela, vale o último trimestre publicado, que é
    acumulado no ano (o 4º trimestre equivale ao ano fechado).
  - Grupos (Petrobras, Banco do Brasil, BNDES, Caixa, Eletrobras, ENBPar, NAV Brasil...) entram
    uma vez só, pelo consolidado do grupo ou, se ele não existir naquele ano, pela controladora.
    As subsidiárias não são somadas de novo. Se o grupo não tem consolidado nem controladora no
    ano, ele não entra: as empresas dele estavam dentro de outro grupo (caso de Eletronuclear e
    INB, que até 2021 eram da Eletrobras).
  - Empresas sem grupo econômico entram uma a uma.

Lucro sem vendas de ativos (o gráfico principal da aba):
  - Do lucro líquido de cada estatal sai o ganho com a venda de empresas, participações e outros
    ativos (privatizações e desinvestimentos), depois do imposto de 34% (IR + CSLL).
  - Na base da SEST: "Ganhos de capital" (365400 no plano antigo, 240107010 no novo) das empresas
    não financeiras e "Resultado não operacional" (350000) dos bancos que usam o plano Cosif.
    Só ganhos entram (perdas na venda não são somadas de volta).
  - Onde a SEST não separa o ganho, valem os balanços das próprias empresas, listados em
    DESINVEST_EMPRESAS (Petrobras de 2022 a 2024 e a BR Distribuidora em 2019, BNDES em todos os
    anos, ações da Petrobras vendidas pela Caixa em 2019).

Uso:
  python scripts/coletar_estatais.py              # baixa os dois arquivos do gov.br
  python scripts/coletar_estatais.py --zips PASTA # usa sestdadosfinanceiros.zip e sestidentificacao.zip já baixados

Gera site/data/estatais.json (e a cópia em dados/).
"""
import argparse, csv, io, json, re, time, urllib.request, zipfile
from collections import defaultdict
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
BASE = 'https://www.gov.br/gestao/pt-br/assuntos/estatais/transparencia/'
URLS = {'fin': BASE + 'sestdadosfinanceiros.zip', 'id': BASE + 'sestidentificacao.zip'}
# o gov.br recusa alguns clientes sem cara de navegador
UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 MonitoraBrasil/1.0',
      'Accept': '*/*'}
ANO_INICIAL = 2016
RUBRICAS = {'500000', '289900000'}
RUB_GANHO = {'365400', '240107010'}   # ganhos de capital (empresas não financeiras)
RUB_NAO_OP = '350000'                 # resultado não operacional (bancos, plano Cosif); nas não financeiras é o lucro bruto
RUB_COSIF = '300000'                  # resultado bruto da intermediação financeira: marca quem usa o plano dos bancos
IR = 0.34                             # IR (25%) + CSLL (9%) sobre o ganho

# Ganhos com venda de ativos que a base da SEST não separa, tirados dos balanços das empresas.
# Valores brutos (antes do imposto), em R$ milhões, ou líquidos quando 'liquido' é True.
PETRO_RI = 'https://www.investidorpetrobras.com.br/resultados-e-comunicados/central-de-resultados/'
BNDES_DRE = 'https://dadosabertos.bndes.gov.br/dataset/demonstracao-de-resultados'
DESINVEST_EMPRESAS = [
    {'id': 'G-PETROBRAS', 'ano': 2019, 'bruto': 13948, 'o_que': 'Venda do controle da BR Distribuidora (follow-on)', 'fonte': PETRO_RI},
    {'id': 'G-PETROBRAS', 'ano': 2022, 'bruto': 5884, 'o_que': 'Resultado com alienação e baixa de ativos', 'fonte': PETRO_RI},
    {'id': 'G-PETROBRAS', 'ano': 2023, 'bruto': 6511, 'o_que': 'Resultado com alienação e baixa de ativos', 'fonte': PETRO_RI},
    {'id': 'G-PETROBRAS', 'ano': 2024, 'bruto': 1171, 'o_que': 'Resultado com alienação e baixa de ativos', 'fonte': PETRO_RI},
    {'id': 'G-BNDES', 'ano': 2016, 'bruto': 877, 'o_que': 'Resultado com alienação de ações (2017 foi 310,2% maior)', 'fonte': 'https://www.bndes.gov.br/SiteBNDES/bndes/bndes_pt/Hotsites/Relatorio_Anual_2017/pdf/BNDES_RA2017_NossoDesempenho.pdf'},
    {'id': 'G-BNDES', 'ano': 2017, 'bruto': 3600, 'o_que': 'Ganhos com venda de ações', 'fonte': 'https://agenciabrasil.ebc.com.br/economia/noticia/2019-03/bndes-registrou-lucro-liquido-de-r-67-bilhoes-em-2018'},
    {'id': 'G-BNDES', 'ano': 2018, 'bruto': 6100, 'o_que': 'Ganhos com venda de ações', 'fonte': 'https://agenciabrasil.ebc.com.br/economia/noticia/2019-03/bndes-registrou-lucro-liquido-de-r-67-bilhoes-em-2018'},
    {'id': 'G-BNDES', 'ano': 2019, 'bruto': 11354, 'o_que': 'Resultado com alienações de títulos de renda variável', 'fonte': BNDES_DRE},
    {'id': 'G-BNDES', 'ano': 2020, 'bruto': 22683, 'o_que': 'Resultado com alienações de títulos de renda variável', 'fonte': BNDES_DRE},
    {'id': 'G-BNDES', 'ano': 2021, 'bruto': 12758, 'o_que': 'Resultado com alienações de títulos de renda variável', 'fonte': BNDES_DRE},
    {'id': 'G-BNDES', 'ano': 2022, 'bruto': 3589, 'o_que': 'Resultado com alienações de títulos de renda variável', 'fonte': BNDES_DRE},
    {'id': 'G-BNDES', 'ano': 2022, 'liquido': True, 'bruto': 5824, 'o_que': 'Ganho com a perda de influência na JBS após a venda de ações (líquido de impostos)', 'fonte': 'https://api.mziq.com/mzfilemanager/v2/d/0a296115-dd7d-454b-ba26-369893ae3f0c/5afa1774-66bd-d703-406f-f834fa37dc8c?origin=1'},
    {'id': 'G-BNDES', 'ano': 2023, 'bruto': 161, 'o_que': 'Resultado com alienações de títulos de renda variável', 'fonte': BNDES_DRE},
    {'id': 'G-BNDES', 'ano': 2024, 'bruto': 252, 'o_que': 'Resultado com alienações de títulos de renda variável', 'fonte': BNDES_DRE},
    {'id': 'G-BNDES', 'ano': 2025, 'bruto': 178, 'o_que': 'Resultado com alienações de títulos de renda variável', 'fonte': BNDES_DRE},
    {'id': 'G-CAIXA', 'ano': 2019, 'bruto': 2200, 'o_que': 'Venda das ações da Petrobras', 'fonte': 'https://www.bandab.com.br/economia/credito-encolhe-na-caixa-e-lucro-no-2o-tri-e-sustentado-por-venda-de-acoes-da-petrobras/'},
]

NOMES_GRUPO = {
    'PETROBRAS': 'Grupo Petrobras', 'BB': 'Grupo Banco do Brasil', 'BNDES': 'Grupo BNDES', 'CAIXA': 'Grupo Caixa',
    'ELETROBRAS': 'Grupo Eletrobras', 'ENBPar': 'Grupo ENBPar (Eletronuclear, INB)', 'NAV Brasil': 'Grupo NAV Brasil',
    'CORREIOS': 'Grupo Correios', 'TELEBRAS': 'Grupo Telebras',
}
RENOMEAR = {
    'ECT': 'Correios (ECT)', 'INFRA S.A.': 'Infra S.A. (ex-Valec)', 'APS': 'Autoridade Portuária de Santos',
    'CONCEIÇÃO': 'Hospital Nossa Senhora da Conceição', 'HCPA': 'Hospital de Clínicas de Porto Alegre',
}


def baixar(url, tentativas=4, timeout=300):
    for t in range(tentativas):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
                return r.read()
        except Exception as e:  # noqa: BLE001
            print(f'  tentativa {t + 1} falhou: {e}')
            time.sleep(5 * (t + 1))
    raise RuntimeError(f'não consegui baixar {url}')


def ler_csv(z, sufixo):
    nome = next(n for n in z.namelist() if n.endswith(sufixo))
    b = z.read(nome)
    try:
        txt = b.decode('utf-8')
    except UnicodeDecodeError:
        txt = b.decode('cp1252', errors='replace')  # os arquivos da SEST vêm em Latin-1/Windows-1252
    return list(csv.DictReader(io.StringIO(txt.lstrip('﻿')), delimiter=';'))


def numero(s):
    s = (s or '').strip()
    if not s:
        return None
    return float(s.replace('.', '').replace(',', '.'))


def cadastro(zid):
    reg = {}
    for suf in ('empresas-ativas.csv', 'empresas-inativas.csv'):
        for r in ler_csv(zid, suf):
            if r.get('codigo_siest'):
                reg[r['codigo_siest']] = r
    grupos = {r['codigo_siest']: r for r in ler_csv(zid, 'grupos.csv') if r.get('codigo_siest')}
    return reg, grupos


def _ordem(per):
    per = per.strip()
    m = re.match(r'([1-4])\D', per)  # "1º Trimestre" ... "4º Trimestre"
    return 5 if per == 'Anual' else int(m.group(1)) if m and 'rimestre' in per else None


def ler_dre(zfin):
    """Lê a DRE uma vez e devolve lucro, ganhos com venda e os períodos de referência.

    lucro[(ano, cod)] = (valor, periodo), todos no mesmo período de referência do ano: a
    demonstração anual (5) ou, no ano em curso, o trimestre mais recente publicado por pelo
    menos metade das estatais (os trimestres são acumulados; o 4º equivale ao ano fechado).
    Quem ainda não publicou esse período fica de fora do ano.
    ganho[(ano, cod)] = ganho bruto com venda de ativos no mesmo período (só valores positivos).
    """
    todos = defaultdict(dict)    # (ano, cod) -> {ordem: lucro}
    ganhos = defaultdict(dict)   # (ano, cod) -> {ordem: ganho de capital}
    naoop = {}                   # (ano, cod) -> resultado não operacional (anual)
    cosif = set()                # (ano, cod) que usam o plano dos bancos
    for r in ler_csv(zfin, 'demonstracoes.csv'):
        if r['demonstrativo'] != 'DRE':
            continue
        rub = r['rubrica_codigo']
        if rub not in RUBRICAS and rub not in RUB_GANHO and rub not in (RUB_NAO_OP, RUB_COSIF):
            continue
        ano = int(r['exercicio'])
        ordem = _ordem(r['periodicidade'])
        v = numero(r['valor'])
        if ano < ANO_INICIAL or ordem is None or v is None:
            continue
        k = (ano, r['codigo_siest'])
        if rub in RUBRICAS:
            todos[k][ordem] = v
        elif rub in RUB_GANHO:
            ganhos[k][ordem] = v
        elif ordem == 5 and rub == RUB_COSIF:
            cosif.add(k)
        elif ordem == 5 and rub == RUB_NAO_OP:
            naoop[k] = v
    ref = {}
    for ano in {a for a, _ in todos}:
        ks = [k for k in todos if k[0] == ano]
        for ordem in (5, 4, 3, 2, 1):
            if sum(ordem in todos[k] or (ordem == 4 and 5 in todos[k]) for k in ks) >= len(ks) / 2:
                ref[ano] = ordem
                break
    lucro, ganho = {}, {}
    for k, vs in todos.items():
        o = ref.get(k[0])
        if o in vs:
            lucro[k] = (vs[o], o)
        elif o == 4 and 5 in vs:      # ano fechado: anual e 4º trimestre dizem o mesmo
            lucro[k] = (vs[5], 5)
        else:
            continue
        o = lucro[k][1]
        g = max(0.0, ganhos.get(k, {}).get(o) or (ganhos.get(k, {}).get(5) if o == 4 else 0) or 0)
        if k in cosif and o == 5:
            g += max(0.0, naoop.get(k) or 0)
        ganho[k] = g
    return lucro, ganho


def montar(zfin, zid):
    reg, grupos = cadastro(zid)
    val, ganho = ler_dre(zfin)
    grupo_por_codigo = {c: g['grupo_economico'] for c, g in grupos.items()}
    anos = sorted({a for a, _ in val})
    estatais = {}   # id -> {meta, valores}
    periodo_ano = {}
    sem_cadastro = set()

    def guardar(chave, meta, ano, cod):
        v, ordem = val[(ano, cod)]
        e = estatais.setdefault(chave, {**meta, 'valores': {}, 'vendas': {}})
        e['valores'][str(ano)] = round(v / 1e6, 1)  # R$ milhões
        g = ganho.get((ano, cod), 0) * (1 - IR) / 1e6
        if g >= 0.05:
            e['vendas'][str(ano)] = round(g, 1)
        periodo_ano[ano] = min(periodo_ano.get(ano, 5), ordem)

    for ano in anos:
        cods = [c for (a, c) in val if a == ano]
        por_grupo = defaultdict(dict)
        for c in cods:
            if c in grupo_por_codigo:
                por_grupo[grupo_por_codigo[c]]['grupo'] = c
            elif c in reg:
                g = reg[c].get('grupo_economico', '')
                if g and g != 'Sem Grupo Econômico':
                    por_grupo[g].setdefault('membros', []).append(c)
                else:
                    r = reg[c]
                    sig = r['sigla'].replace(' - Em Liquidação', '').replace(' (Em Liquidação)', '').strip()
                    meta = {'id': c, 'estatal': RENOMEAR.get(sig, sig), 'nome': r['nome'].strip(), 'tipo': 'empresa',
                            'setor': r.get('setor', ''), 'dependente': r.get('dependencia', '').startswith('Dependente')}
                    guardar(c, meta, ano, c)
            else:
                sem_cadastro.add(c)
        for g, o in por_grupo.items():
            cod = o.get('grupo')
            if not cod:
                cod = next((m for m in o.get('membros', []) if reg[m].get('vinculo') == 'Controladora'), None)
            if not cod:
                continue  # sem consolidado nem controladora: as empresas estavam dentro de outro grupo
            ctl = next((r for r in reg.values() if r.get('grupo_economico') == g and r.get('vinculo') == 'Controladora'), {})
            meta = {'id': 'G-' + g, 'estatal': NOMES_GRUPO.get(g, 'Grupo ' + g), 'nome': (grupos.get(cod) or ctl).get('nome', '').strip(),
                    'tipo': 'grupo', 'setor': ctl.get('setor', ''), 'dependente': False}
            guardar('G-' + g, meta, ano, cod)

    for d in DESINVEST_EMPRESAS:   # ganhos que só os balanços das empresas separam
        e = estatais.get(d['id'])
        if not e or str(d['ano']) not in e['valores']:
            continue
        liq = d['bruto'] if d.get('liquido') else d['bruto'] * (1 - IR)
        e['vendas'][str(d['ano'])] = round(e['vendas'].get(str(d['ano']), 0) + liq, 1)
    if sem_cadastro:
        print(f'aviso: {len(sem_cadastro)} códigos sem cadastro, ignorados: {sorted(sem_cadastro)}')
    lista = sorted(estatais.values(), key=lambda e: (-(e['valores'].get(str(anos[-1])) or -1e18), e['estatal']))
    totais = []
    for ano in anos:
        vs = [e['valores'][str(ano)] for e in lista if str(ano) in e['valores']]
        vd = sum(e['vendas'].get(str(ano), 0) for e in lista)
        o = periodo_ano.get(ano, 5)
        totais.append({'ano': ano, 'lucro_mi': round(sum(vs), 1), 'vendas_mi': round(vd, 1),
                       'sem_vendas_mi': round(sum(vs) - vd, 1), 'n': len(vs),
                       'periodo': 'anual' if o == 5 else 'ano fechado (4º trimestre)' if o == 4 else f'até o {o}º trimestre',
                       'parcial': o < 4})
    return {'coletado_em': date.today().isoformat(), 'unidade': 'R$ milhões correntes',
            'fonte': 'SEST/MGI, dados abertos: Dados Financeiros (DRE) e Identificação das Empresas Estatais',
            'imposto_sobre_ganho': IR, 'ganhos_das_empresas': DESINVEST_EMPRESAS,
            'anos': totais, 'estatais': lista}


def gravar(nome, obj):
    txt = json.dumps(obj, ensure_ascii=False, separators=(',', ':'))
    for pasta in (RAIZ / 'dados', RAIZ / 'site' / 'data'):
        pasta.mkdir(exist_ok=True)
        (pasta / nome).write_text(txt, encoding='utf-8')
    print(f'gravado {nome} ({len(txt) / 1024:.0f} KB)')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--zips', help='pasta com sestdadosfinanceiros.zip e sestidentificacao.zip já baixados')
    a = ap.parse_args()
    if a.zips:
        p = Path(a.zips)
        zfin, zid = zipfile.ZipFile(p / 'sestdadosfinanceiros.zip'), zipfile.ZipFile(p / 'sestidentificacao.zip')
    else:
        print('baixando Dados Financeiros…'); zfin = zipfile.ZipFile(io.BytesIO(baixar(URLS['fin'])))
        print('baixando Identificação…'); zid = zipfile.ZipFile(io.BytesIO(baixar(URLS['id'])))
    obj = montar(zfin, zid)
    for t in obj['anos']:
        print(f"  {t['ano']}: lucro R$ {t['lucro_mi'] / 1000:6.1f} bi, vendas R$ {t['vendas_mi'] / 1000:5.1f} bi, "
              f"sem vendas R$ {t['sem_vendas_mi'] / 1000:6.1f} bi  ({t['n']} estatais, {t['periodo']})")
    gravar('estatais.json', obj)


if __name__ == '__main__':
    main()
