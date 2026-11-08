"""Coleta o lucro das companhias abertas brasileiras para a aba "Empresas" do Monitora Brasil.

Fonte: Comissão de Valores Mobiliários (CVM), Portal de Dados Abertos (https://dados.cvm.gov.br), sem cadastro:
  - DFP (Demonstrações Financeiras Padronizadas), um zip por ano desde 2010:
    dados/CIA_ABERTA/DOC/DFP/DADOS/dfp_cia_aberta_AAAA.zip. Usa a Demonstração do Resultado consolidada
    (DRE_con) e, para quem não consolida, a individual (DRE_ind).
  - FRE (Formulário de Referência), um zip por ano: a lista de participações de cada companhia em outras
    sociedades (participacao_sociedade), para tirar a dupla contagem entre companhias abertas.
  - Cadastro de companhias abertas (cad_cia_aberta.csv): setor, categoria de registro e controle acionário.
  - IPCA (Banco Central, SGS 433), para mostrar valores em reais do último ano.

Medida: lucro líquido atribuído aos acionistas controladores ("Atribuído a Sócios da Empresa Controladora",
filha da conta de lucro consolidado). Sem demonstração consolidada, o lucro do período da individual.
Entram só companhias de categoria A (as que podem ter ações negociadas); as de categoria B (só dívida,
como securitizadoras e subsidiárias) ficam de fora.

Dupla contagem: quando uma companhia aberta tem participação em outra (Itaúsa no Itaú, Banco do Brasil na
BB Seguridade, Eletrobras na Chesf), o lucro da investida aparece duas vezes na soma: no balanço dela e no
da dona (por consolidação ou por equivalência patrimonial). Para cada par, o script calcula a parte da dona
no lucro da investida (percentual do FRE × lucro da investida) e grava em "cruzada"; o site desconta esse
valor da soma.

Gera site/data/empresas.json (e a cópia em dados/). Roda no GitHub Actions
(.github/workflows/dados-empresas.yml). Para testar sem internet: --cache PASTA com os arquivos reduzidos
(AAAA.json do DFP, fre_AAAA.json, cadastro.json e ipca.json, nos formatos das funções reduzir_*).
"""
import argparse, csv, io, json, re, time, urllib.request, zipfile
from collections import defaultdict
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
BASE = 'https://dados.cvm.gov.br/dados/CIA_ABERTA/'
UA = {'User-Agent': 'MonitoraBrasil/1.0 (+https://github.com/ChrisBerenguer/Monitora-Brasil)'}
ANO_INICIAL = 2010
RE_CON = re.compile(r'^Lucro(/| ou )Preju[ií]zo (L[ií]quido )?Consolidado do Per[ií]odo$', re.I)
RE_IND = re.compile(r'^Lucro(/| ou )Preju[ií]zo (L[ií]quido )?do Per[ií]odo$', re.I)
RE_EQ = re.compile(r'^Resultado d[ae] Equival[eê]ncia Patrimonial$', re.I)

# Privatizações e estatizações que o cadastro da CVM não reflete (ele traz o controle atual, e às vezes nem isso).
# código CVM: (primeiro ano estatal, último ano estatal). Fontes: fatos relevantes das companhias.
CONTROLE_ESTATAL = {
    '2437': (0, 2021),    # Eletrobras (hoje Axia Energia): privatizada em junho de 2022
    '3328': (0, 2021),    # Chesf (Axia Energia Nordeste), subsidiária da Eletrobras
    '24295': (0, 2018),   # BR Distribuidora (hoje Vibra): Petrobras vendeu o controle em julho de 2019
    '14443': (0, 2023),   # Sabesp: privatizada em julho de 2024
    '14311': (0, 2022),   # Copel: virou corporação sem controlador em agosto de 2023
    '20648': (0, 2020),   # CEEE-D: vendida à Equatorial em julho de 2021
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


def ler_csv(z, nome):
    with z.open(nome) as f:
        return list(csv.reader(io.TextIOWrapper(f, encoding='latin-1'), delimiter=';'))


def ultima_versao(linhas, ix, chave):
    """Agrupa as linhas por companhia e fica só com a versão mais nova do documento."""
    por = {}
    for c in linhas:
        k, v = c[ix[chave]], int(c[ix['VERSAO' if 'VERSAO' in ix else 'Versao']] or 0)
        p = por.get(k)
        if p and p[0] > v:
            continue
        if not p or p[0] < v:
            por[k] = [v, []]
        por[k][1].append(c)
    return {k: ls for k, (_, ls) in por.items()}


def reduzir_dfp(ano):
    """{código CVM: {nome, cnpj, fim, con, con_ctrl, eq_con, ind, eq_ind}}, em R$ milhões."""
    z = zipfile.ZipFile(io.BytesIO(baixar(f'{BASE}DOC/DFP/DADOS/dfp_cia_aberta_{ano}.zip')))
    out = {}
    for tipo in ('con', 'ind'):
        nome = f'dfp_cia_aberta_DRE_{tipo}_{ano}.csv'
        if nome not in z.namelist():
            continue
        rows = ler_csv(z, nome)
        ix = {k: i for i, k in enumerate(rows[0])}
        ult = [c for c in rows[1:] if len(c) >= 10 and c[ix['ORDEM_EXERC']] == 'ÚLTIMO']
        for c in ult:
            c[ix['CD_CVM']] = str(int(c[ix['CD_CVM']]))
        for cd, linhas in ultima_versao(ult, ix, 'CD_CVM').items():
            def valor(x):
                return round((1000 if x[ix['ESCALA_MOEDA']] == 'MIL' else 1) * float(x[ix['VL_CONTA']]) / 1e6, 3)
            regex = RE_CON if tipo == 'con' else RE_IND
            t = next((x for x in linhas if x[ix['ST_CONTA_FIXA']] == 'S' and regex.match(x[ix['DS_CONTA']].strip())), None)
            if not t:
                continue
            o = out.setdefault(cd, {'nome': t[ix['DENOM_CIA']], 'cnpj': t[ix['CNPJ_CIA']], 'fim': t[ix['DT_FIM_EXERC']]})
            eq = next((x for x in linhas if x[ix['ST_CONTA_FIXA']] == 'S' and RE_EQ.match(x[ix['DS_CONTA']].strip())
                       and len(x[ix['CD_CONTA']].split('.')) <= 3), None)
            if tipo == 'con':
                o['con'] = valor(t)
                filha = next((x for x in linhas if x[ix['CD_CONTA']] == t[ix['CD_CONTA']] + '.01'
                              and re.search('controladora', x[ix['DS_CONTA']], re.I)), None)
                if filha:
                    o['con_ctrl'] = valor(filha)
                if eq:
                    o['eq_con'] = valor(eq)
            else:
                o['ind'] = valor(t)
                if eq:
                    o['eq_ind'] = valor(eq)
    return out


def reduzir_fre(ano, cnpjs):
    """[[CNPJ da dona, CNPJ da investida, % de participação, data de referência]], só investidas da CVM."""
    try:
        z = zipfile.ZipFile(io.BytesIO(baixar(f'{BASE}DOC/FRE/DADOS/fre_cia_aberta_{ano}.zip')))
    except RuntimeError:
        return []
    nome = next((n for n in z.namelist() if 'participacao_sociedade' in n), None)
    if not nome:
        return []
    rows = ler_csv(z, nome)
    ix = {k: i for i, k in enumerate(rows[0])}
    out = []
    for cnpj, linhas in ultima_versao([c for c in rows[1:] if len(c) >= 10], ix, 'CNPJ_Companhia').items():
        for c in linhas:
            inv = re.sub(r'\D', '', c[ix['CNPJ']] or '').zfill(14)
            if inv not in cnpjs:
                continue
            try:
                pct = float(c[ix['Participacao_Emissor']])
            except ValueError:
                continue
            out.append([re.sub(r'\D', '', cnpj), inv, pct, c[ix['Data_Referencia']]])
    return out


def reduzir_cadastro():
    rows = list(csv.reader(io.StringIO(baixar(BASE + 'CAD/DADOS/cad_cia_aberta.csv').decode('latin-1')), delimiter=';'))
    ix = {k: i for i, k in enumerate(rows[0])}
    campos = ['CD_CVM', 'CNPJ_CIA', 'DENOM_SOCIAL', 'DENOM_COMERC', 'SETOR_ATIV', 'CATEG_REG', 'CONTROLE_ACIONARIO', 'SIT', 'TP_MERC', 'DT_CANCEL']
    return [[r[ix[k]] for k in campos] for r in rows[1:] if len(r) > 10]


def fator_ipca(ipca, ano_base):
    """Fator para levar reais de cada ano a reais do ano-base, pela média anual do índice do IPCA."""
    idx, nivel = defaultdict(list), 100.0
    for x in ipca:
        d, m, a = x['data'].split('/')
        nivel *= 1 + float(x['valor']) / 100
        idx[int(a)].append(nivel)
    media = {a: sum(v) / len(v) for a, v in idx.items() if len(v) == 12}
    return {a: round(media[ano_base] / v, 4) for a, v in media.items() if a <= ano_base} if ano_base in media else {}


SETOR_IGUAL = {  # nomes abreviados das holdings ("Emp. Adm. Part. - ...") e grafias diferentes do mesmo setor
    'Sem Setor Principal': 'Holdings diversificadas', '': 'Sem setor informado',
    'Máqs., Equip., Veíc. e Peças': 'Máquinas, Equipamentos, Veículos e Peças',
    'Const. Civil, Mat. Const. e Decoração': 'Construção Civil, Mat. Constr. e Decoração',
    'Serviços médicos': 'Serviços Médicos',
}


def setor_curto(s):
    s = re.sub(r'^Emp\. Adm\. Part\.\s*-\s*', '', (s or '').strip())
    return SETOR_IGUAL.get(s, s)


NOME_ATUAL = {'BANCO UBS PACTUAL S/A': 'BTG PACTUAL'}  # nome comercial desatualizado no cadastro


def nome_curto(n):
    n = NOME_ATUAL.get(n.strip(), n.strip())
    return re.sub(r'\s*[-,]?\s*\b(S\.?\s?/?A\.?|SA)$', '', n, flags=re.I).strip()


def controle(r, cd, ano):
    """'estatal', 'privada' (controle nacional) ou 'estrangeira', no ano."""
    if cd in CONTROLE_ESTATAL:
        i, f = CONTROLE_ESTATAL[cd]
        if i <= ano <= f:
            return 'estatal'
        return 'estrangeira' if (r[6] or '').startswith('ESTRANGEIRO') else 'privada'
    c = r[6] or ''
    return 'estatal' if c.startswith('ESTATAL') else 'estrangeira' if c.startswith('ESTRANGEIRO') else 'privada'


def gravar(nome, obj):
    txt = json.dumps(obj, ensure_ascii=False, separators=(',', ':'))
    for pasta in (RAIZ / 'dados', RAIZ / 'site' / 'data'):
        pasta.mkdir(exist_ok=True)
        (pasta / nome).write_text(txt, encoding='utf-8')
    print(f'gravado {nome} ({len(txt) / 1024:.0f} KB)')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cache', help='pasta com os arquivos já reduzidos')
    args = ap.parse_args()
    C = Path(args.cache) if args.cache else None
    try:
        cadastro = json.loads((C / 'cadastro.json').read_text()) if C else reduzir_cadastro()
        cnpjs = {re.sub(r'\D', '', r[1]).zfill(14) for r in cadastro if r[1]}
        dfp, fre = {}, {}
        for ano in range(ANO_INICIAL, date.today().year + 1):
            if C:
                if (C / f'{ano}.json').exists():
                    dfp[ano] = json.loads((C / f'{ano}.json').read_text())
                if (C / f'fre_{ano}.json').exists():
                    fre[ano] = json.loads((C / f'fre_{ano}.json').read_text())
                continue
            print('baixando', ano)
            d = reduzir_dfp(ano)
            if d:
                dfp[ano] = d
            fre[ano] = reduzir_fre(ano, cnpjs)
        ipca = json.loads((C / 'ipca.json').read_text()) if C else json.loads(
            baixar('https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial=01/01/2009'))
    except RuntimeError as e:
        # a CVM às vezes recusa conexões de fora do Brasil: mantém o arquivo atual e tenta de novo depois
        print(f'::warning::{e}. empresas.json mantido sem mudança; nova tentativa na próxima rodada.')
        return

    # o cadastro repete o código quando a companhia muda de registro: fica a linha ativa, se houver
    cad = {}
    for r in cadastro:
        if r[0].strip().isdigit():
            cd = str(int(r[0]))
            if cd not in cad or (r[7] == 'ATIVO' and cad[cd][7] != 'ATIVO'):
                cad[cd] = r
    # anos completos: o DFP de um ano só fica cheio no começo do ano seguinte; um ano com menos de 300
    # companhias ainda está chegando e fica de fora
    anos = sorted(a for a, d in dfp.items() if sum(1 for cd in d if cad.get(cd, [''] * 7)[5] == 'Categoria A') >= 300)
    empresas = {}
    for ano in anos:
        lucros, cn2cd = {}, {}
        for cd, v in dfp[ano].items():
            r = cad.get(cd)
            if not r or r[5] != 'Categoria A':
                continue
            lucro = v.get('con_ctrl', v.get('con', v.get('ind')))
            if lucro is None:
                continue
            lucros[cd] = lucro
            cn2cd[re.sub(r'\D', '', v['cnpj'])] = cd
            e = empresas.setdefault(cd, {'id': cd, 'nome': nome_curto(r[3] or r[2] or v['nome']), 'razao': v['nome'],
                                         'setor': setor_curto(r[4]), 'lucro': {}, 'cruzada': {}, 'controle': {}})
            e['lucro'][ano] = round(lucro, 1)
            e['controle'][ano] = controle(r, cd, ano)
        # participações cruzadas: FRE do mesmo ano (ou o do ano seguinte, se faltar)
        pares = fre.get(ano) or fre.get(ano + 1) or []
        vistos = set()
        for dona, inv, pct, _ in pares:
            if dona in cn2cd and inv in cn2cd and dona != inv and (dona, inv) not in vistos and pct and pct > 0:
                vistos.add((dona, inv))
                parte = min(pct, 100) / 100 * lucros[cn2cd[inv]]
                e = empresas[cn2cd[dona]]
                e['cruzada'][ano] = round(e['cruzada'].get(ano, 0) + parte, 1)
        print(f'  {ano}: {len(lucros)} companhias, lucro R$ {sum(lucros.values()) / 1000:.1f} bi, '
              f'dupla contagem R$ {sum(e["cruzada"].get(ano, 0) for e in empresas.values()) / 1000:.1f} bi')
    lista = sorted(empresas.values(), key=lambda e: -max(abs(x) for x in e['lucro'].values()))
    for e in lista:
        # controle: guarda só a mudança, para o arquivo ficar pequeno
        vals = set(e['controle'].values())
        e['controle'] = vals.pop() if len(vals) == 1 else e['controle']
        if not e['cruzada']:
            del e['cruzada']
    novo = json.loads(json.dumps({
        'coletado_em': date.today().isoformat(),
        'anos': anos,
        'ipca': fator_ipca(ipca, anos[-1]),
        'empresas': lista,
        'privatizacoes': {cd: list(v) for cd, v in CONTROLE_ESTATAL.items()},
    }))
    # sem dado novo, mantém a data da coleta anterior (evita um commit só para mudar a data)
    atual = RAIZ / 'site' / 'data' / 'empresas.json'
    if atual.exists():
        velho = json.loads(atual.read_text(encoding='utf-8'))
        if {**velho, 'coletado_em': None} == {**novo, 'coletado_em': None}:
            novo['coletado_em'] = velho['coletado_em']
    gravar('empresas.json', novo)


if __name__ == '__main__':
    main()
