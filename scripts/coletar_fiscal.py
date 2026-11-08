"""Coleta o resultado fiscal oficial do Brasil para a aba "Contas públicas" do Monitora Brasil.

Fonte: Banco Central do Brasil, Sistema Gerenciador de Séries Temporais (SGS), séries de
Necessidades de Financiamento do Setor Público (NFSP) sem desvalorização cambial, em % do PIB,
fluxo acumulado em 12 meses. API pública: https://api.bcb.gov.br/dados/serie/bcdata.sgs.{código}/dados?formato=json

As NFSP medem quanto o setor público precisa se financiar: valor positivo é déficit. Aqui o sinal é
invertido para o primário e o nominal (positivo = superávit), que é como o resultado é noticiado.
Os juros ficam como despesa (positivo = juros pagos).

O valor de dezembro de cada série é o resultado do ano. No ano corrente, vale o acumulado dos últimos
12 meses até o último mês publicado.

Gera site/data/contas_publicas.json (e a cópia em dados/). Roda no GitHub Actions
(.github/workflows/dados-fiscal.yml). Para testar sem internet: --cache PASTA com as respostas da API
gravadas como PASTA/<código>.json.
"""
import argparse, json, time, urllib.request
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
API = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.{}/dados?formato=json'
UA = {'User-Agent': 'MonitoraBrasil/1.0 (+https://github.com/ChrisBerenguer/Monitora-Brasil)', 'Accept': 'application/json'}

# (id, código SGS, nome, sinal aplicado ao valor das NFSP)
SERIES = [
    ('primario', 5793, 'Resultado primário do setor público consolidado', -1),
    ('central', 5783, 'Resultado primário do governo central (Governo Federal e Banco Central)', -1),
    ('regionais', 5786, 'Resultado primário dos estados e municípios', -1),
    ('estatais', 5789, 'Resultado primário das empresas estatais (federais, estaduais e municipais)', -1),
    ('juros', 5760, 'Juros nominais pagos pelo setor público consolidado', 1),
    ('nominal', 5727, 'Resultado nominal do setor público consolidado (primário menos juros)', -1),
]
MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']


def baixar(url, tentativas=4, timeout=60):
    for t in range(tentativas):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
                return json.loads(r.read())
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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cache', help='pasta com as respostas da API já baixadas (<código>.json)')
    args = ap.parse_args()
    series = []
    for sid, cod, nome, sinal in SERIES:
        if args.cache:
            bruto = json.loads((Path(args.cache) / f'{cod}.json').read_text(encoding='utf-8'))
        else:
            print('baixando', sid, cod)
            try:
                bruto = baixar(API.format(cod))
            except RuntimeError as e:
                # o Banco Central às vezes recusa conexões de fora do Brasil: mantém o arquivo atual
                print(f'::warning::{e}. contas_publicas.json mantido sem mudança; nova tentativa na próxima rodada.')
                return
        mensal = {}
        for x in bruto:
            d, m, a = x['data'].split('/')
            try:
                mensal[f'{a}-{m}'] = round(sinal * float(x['valor']), 2)
            except (TypeError, ValueError):
                continue
        anual = {int(k[:4]): v for k, v in mensal.items() if k.endswith('-12')}
        ult = max(mensal)
        series.append({
            'id': sid, 'sgs': cod, 'nome': nome, 'anual': anual,
            'mensal': {k: v for k, v in mensal.items() if k >= '2015-01'},  # 12 meses, para o gráfico do ano corrente
            'ultimo': {'mes': ult, 'rotulo': f'12 meses até {MESES[int(ult[5:]) - 1]}/{ult[:4]}', 'valor': mensal[ult]},
        })
        print(f'  {sid:10s} {min(anual)}–{max(anual)}  último {ult}: {mensal[ult]}')
    novo = {
        'coletado_em': date.today().isoformat(),
        'fonte': {'nome': 'Banco Central do Brasil, Estatísticas fiscais (NFSP), via SGS', 'url': 'https://www.bcb.gov.br/estatisticas/estatisticasfiscais'},
        'series': series,
    }
    # sem dado novo, mantém a data da coleta anterior (evita um commit só para mudar a data)
    atual = RAIZ / 'site' / 'data' / 'contas_publicas.json'
    if atual.exists():
        velho = json.loads(atual.read_text(encoding='utf-8'))
        if {**velho, 'coletado_em': None} == {**json.loads(json.dumps(novo)), 'coletado_em': None}:
            novo['coletado_em'] = velho['coletado_em']
    gravar('contas_publicas.json', novo)


if __name__ == '__main__':
    main()
