import json, re, urllib.request, urllib.parse
def raw(u, t=90):
    req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (MonitoraBrasil)', 'Accept': '*/*'})
    with urllib.request.urlopen(req, timeout=t) as r: return r.read()
def get(u, n=1500):
    try:
        b = raw(u); print(f'\n=== {u}\nbytes {len(b)}'); print(b[:n].decode('utf-8','replace')); return b
    except Exception as e: print(f'\n=== {u}\nERRO {e}')
# IPEADATA
for q in ['Cesta', 'cesta', 'salário mínimo', 'gasolina', 'diesel', 'etanol', 'GLP', 'botij']:
    u = "http://www.ipeadata.gov.br/api/odata4/Metadados?$filter=" + urllib.parse.quote(f"contains(SERNOME,'{q}')") + "&$select=SERCODIGO,SERNOME,PERNOME,SERMINDATA,SERMAXDATA,FNTSIGLA,UNINOME"
    b = get(u, 0)
    if b:
        for s in json.loads(b)['value'][:40]: print('  ', s)
# ANP: página de séries históricas
b = get('https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/precos-revenda-e-de-distribuicao-combustiveis/serie-historica-do-levantamento-de-precos', 0)
if b:
    links = sorted(set(re.findall(r'href="([^"]+\.(?:xlsx|xls|csv|zip))"', b.decode('utf-8','replace'))))
    print('LINKS ANP', len(links)); [print('  ', l) for l in links if 'mensal' in l.lower() or 'brasil' in l.lower()][:40]
# IBGE agregados com "per capita"
b = get('https://servicodados.ibge.gov.br/api/v3/agregados?pesquisa=IA', 0)
if b:
    for p in json.loads(b):
        for a in p['agregados']:
            if 'per capita' in a['nome'].lower() or 'rendimento' in a['nome'].lower(): print('  SIDRA', a['id'], a['nome'])
