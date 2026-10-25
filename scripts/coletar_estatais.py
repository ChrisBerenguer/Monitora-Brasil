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


def lucros(zfin):
    """{(ano, codigo): (valor, periodo)}, todos no mesmo período de referência do ano.

    O período de referência é a demonstração anual (5) ou, no ano em curso, o trimestre mais
    recente publicado por pelo menos metade das estatais (os trimestres são acumulados no ano;
    o 4º equivale ao ano fechado). Quem ainda não publicou esse período fica de fora do ano,
    para não misturar meses diferentes na mesma soma.
    """
    todos = defaultdict(dict)   # (ano, cod) -> {ordem: valor}
    for r in ler_csv(zfin, 'demonstracoes.csv'):
        if r['demonstrativo'] != 'DRE' or r['rubrica_codigo'] not in RUBRICAS:
            continue
        ano = int(r['exercicio'])
        if ano < ANO_INICIAL:
            continue
        per = r['periodicidade'].strip()
        m = re.match(r'([1-4])\D', per)  # "1º Trimestre" ... "4º Trimestre"
        ordem = 5 if per == 'Anual' else int(m.group(1)) if m and 'rimestre' in per else None
        v = numero(r['valor'])
        if ordem is None or v is None:
            continue
        todos[(ano, r['codigo_siest'])][ordem] = v
    ref = {}
    for ano in {a for a, _ in todos}:
        ks = [k for k in todos if k[0] == ano]
        for ordem in (5, 4, 3, 2, 1):
            if sum(ordem in todos[k] or (ordem == 4 and 5 in todos[k]) for k in ks) >= len(ks) / 2:
                ref[ano] = ordem
                break
    out = {}
    for k, vs in todos.items():
        o = ref.get(k[0])
        if o in vs:
            out[k] = (vs[o], o)
        elif o == 4 and 5 in vs:      # ano fechado: anual e 4º trimestre dizem o mesmo
            out[k] = (vs[5], 5)
        elif o == 5 and 4 in vs:
            out[k] = (vs[4], 4)
    return out


def montar(zfin, zid):
    reg, grupos = cadastro(zid)
    val = lucros(zfin)
    grupo_por_codigo = {c: g['grupo_economico'] for c, g in grupos.items()}
    anos = sorted({a for a, _ in val})
    estatais = {}   # id -> {meta, valores}
    periodo_ano = {}
    sem_cadastro = set()

    def guardar(chave, meta, ano, v, ordem):
        e = estatais.setdefault(chave, {**meta, 'valores': {}})
        e['valores'][str(ano)] = round(v / 1e6, 1)  # R$ milhões
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
                    guardar(c, meta, ano, *val[(ano, c)])
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
            guardar('G-' + g, meta, ano, *val[(ano, cod)])

    if sem_cadastro:
        print(f'aviso: {len(sem_cadastro)} códigos sem cadastro, ignorados: {sorted(sem_cadastro)}')
    lista = sorted(estatais.values(), key=lambda e: (-(e['valores'].get(str(anos[-1])) or -1e18), e['estatal']))
    totais = []
    for ano in anos:
        vs = [e['valores'][str(ano)] for e in lista if str(ano) in e['valores']]
        o = periodo_ano.get(ano, 5)
        totais.append({'ano': ano, 'lucro_mi': round(sum(vs), 1), 'n': len(vs),
                       'periodo': 'anual' if o == 5 else 'ano fechado (4º trimestre)' if o == 4 else f'até o {o}º trimestre',
                       'parcial': o < 4})
    return {'coletado_em': date.today().isoformat(), 'unidade': 'R$ milhões correntes',
            'fonte': 'SEST/MGI, dados abertos: Dados Financeiros (DRE) e Identificação das Empresas Estatais',
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
        print(f"  {t['ano']}: R$ {t['lucro_mi'] / 1000:7.1f} bi  ({t['n']} estatais, {t['periodo']})")
    gravar('estatais.json', obj)


if __name__ == '__main__':
    main()
