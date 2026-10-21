"""Coleta o ranking das maiores economias do mundo por PIB nominal (FMI).

Fonte: FMI, World Economic Outlook, via a API aberta do DataMapper
(https://www.imf.org/external/datamapper/api/v1/NGDPD), série NGDPD —
"Gross domestic product, current prices, U.S. dollars" (bilhões de US$).
É a mesma série usada nas manchetes sobre "maiores economias do mundo":
PIB nominal, convertido pelo câmbio de mercado, sem correção por PPC.

Os anos futuros da série são projeção do FMI, não dado observado; o JSON
marca cada ano com `projecao: true/false` a partir do campo que a própria
API informa, quando disponível, ou do ano corrente.

Gera site/data/economias.json (e a cópia em dados/). Roda no GitHub Actions
(.github/workflows/dados-economias.yml), porque precisa de internet aberta.
"""
import json, urllib.request
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
API = 'https://www.imf.org/external/datamapper/api/v1/'
UA = {'User-Agent': 'MonitoraBrasil/1.0 (+https://github.com/ChrisBerenguer/Monitora-Brasil)',
      'Accept': 'application/json'}
ANO0, ANO1 = 1995, date.today().year + 1
TOPO = 15  # quantas economias guardar na lista de cada ano


def baixar(rota, tentativas=4, timeout=120):
    url = API + rota
    for t in range(tentativas):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
                return json.loads(r.read())
        except Exception as e:  # noqa: BLE001
            print(f'  tentativa {t + 1} em {rota} falhou: {e}')
            if t == tentativas - 1:
                raise
    return None


def main():
    print('baixando NGDPD (PIB nominal, US$ bilhões) do FMI...')
    bruto = baixar('NGDPD')
    serie = bruto['values']['NGDPD']
    print(f'  {len(serie)} entidades na série')

    print('baixando a lista de países...')
    paises = baixar('countries')['countries']  # só países; agregados ficam em /groups
    nome = {k: (v.get('label') or k) for k, v in paises.items()}

    # PIB por ano, só entidades que a API lista como país
    por_ano = {}
    for sigla, anos in serie.items():
        if sigla not in nome:
            continue
        for ano, v in anos.items():
            if v in (None, ''):
                continue
            a = int(ano)
            if ANO0 <= a <= ANO1:
                por_ano.setdefault(a, {})[sigla] = float(v) * 1e9  # bilhões -> US$

    linhas = []
    for a in sorted(por_ano):
        d = por_ano[a]
        if 'BRA' not in d:
            continue
        ordem = sorted(d.items(), key=lambda x: -x[1])
        siglas = [s for s, _ in ordem]
        linhas.append({
            'ano': a,
            'posicao': 1 + siglas.index('BRA'),
            'paises': len(d),
            'pib_usd': round(d['BRA']),
            'projecao': a > date.today().year - 1,
            'topo': [{'pais': s, 'nome': nome[s], 'pib_usd': round(v)} for s, v in ordem[:TOPO]],
        })

    saida = {
        'coletado_em': date.today().isoformat(),
        'fonte': {
            'nome': 'FMI — World Economic Outlook (série NGDPD, PIB nominal em US$ correntes)',
            'url': 'https://www.imf.org/external/datamapper/NGDPD@WEO',
            'api': API + 'NGDPD',
        },
        'anos': linhas,
    }
    for pasta in ('site/data', 'dados'):
        destino = RAIZ / pasta
        destino.mkdir(parents=True, exist_ok=True)
        (destino / 'economias.json').write_text(
            json.dumps(saida, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    ult = linhas[-1]
    print(f'economias.json: {len(linhas)} anos, {linhas[0]["ano"]} a {ult["ano"]}')
    print(f'Brasil em {ult["ano"]}: {ult["posicao"]}º de {ult["paises"]} · '
          f'US$ {ult["pib_usd"] / 1e12:.2f} tri · projeção={ult["projecao"]}')
    for p in ult['topo'][:12]:
        print(f'  {p["nome"]}: US$ {p["pib_usd"] / 1e12:.2f} tri')


if __name__ == '__main__':
    main()
