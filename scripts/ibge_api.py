"""Acesso à API de agregados do IBGE (SIDRA) com caminho alternativo.

O IBGE costuma recusar conexões vindas do GitHub Actions (tempo esgotado, Errno 110). Quando a
chamada direta falha, a consulta passa pela função /api/ibge do próprio site, que roda na Vercel em
São Paulo e só repassa leituras de agregados (api/ibge.js).
"""
import gzip, time, urllib.parse, urllib.request

API = 'https://servicodados.ibge.gov.br/api/v3/agregados/'
PROXY = 'https://monitorabrasil.vercel.app/api/ibge'
UA = {'User-Agent': 'MonitoraBrasil/1.0 (+https://github.com/ChrisBerenguer/Monitora-Brasil)', 'Accept-Encoding': 'gzip'}


def _get(url, timeout):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
        b = r.read()
        return gzip.decompress(b) if b[:2] == b'\x1f\x8b' else b


def url_proxy(consulta):
    """'7060/periodos/all/variaveis/63?localidades=N1[all]' -> URL da função /api/ibge."""
    caminho, _, query = consulta.partition('?')
    params = [('p', caminho)] + urllib.parse.parse_qsl(query, keep_blank_values=True)
    return PROXY + '?' + urllib.parse.urlencode(params)


def ibge(consulta, tentativas_diretas=2, timeout=90):
    """Baixa API + consulta; se o IBGE não responder, tenta pelo proxy do site."""
    erros = []
    for t in range(tentativas_diretas):
        try:
            return _get(API + consulta, timeout)
        except Exception as e:  # noqa: BLE001
            erros.append(f'direto: {e}')
            print(f'  IBGE direto, tentativa {t + 1} falhou: {e}')
            time.sleep(3 * (t + 1))
    for t in range(3):
        try:
            b = _get(url_proxy(consulta), 70)
            print('  (baixado pelo proxy do site, /api/ibge)')
            return b
        except Exception as e:  # noqa: BLE001
            erros.append(f'proxy: {e}')
            print(f'  proxy /api/ibge, tentativa {t + 1} falhou: {e}')
            time.sleep(5 * (t + 1))
    raise RuntimeError(f'não consegui baixar {consulta} ({"; ".join(erros[-2:])})')
