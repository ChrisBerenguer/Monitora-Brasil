import json, re, io, urllib.request, urllib.parse
def raw(u, t=90):
    req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (MonitoraBrasil)', 'Accept': '*/*'})
    with urllib.request.urlopen(req, timeout=t) as r: return r.read()
def get(u, n=1500):
    try:
        b = raw(u); print(f'\n=== {u}\nbytes {len(b)}'); print(b[:n].decode('utf-8','replace')); return b
    except Exception as e: print(f'\n=== {u}\nERRO {e}')
# IPEA
get("http://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='MTE12_SALMIN12')", 600)
for q in ['Cesta', 'cesta básica', 'Salário mínimo']:
    b = get("http://www.ipeadata.gov.br/api/odata4/Metadados?$filter=" + urllib.parse.quote(f"contains(SERNOME,'{q}')"), 0)
    if b:
        for s in json.loads(b)['value'][:30]: print('  ', s.get('SERCODIGO'), '|', s.get('SERNOME'), '|', s.get('PERNOME'), s.get('SERMINDATA'), s.get('SERMAXDATA'), s.get('FNTSIGLA'))
# DIEESE
b = get('https://www.dieese.org.br/cesta/', 0)
if b:
    h = b.decode('utf-8','replace'); print('DIEESE links', sorted(set(re.findall(r'href="([^"]*(?:cesta|xls|csv)[^"]*)"', h)))[:60])
get('https://www.dieese.org.br/cesta/produto', 800)
# IBGE: tabelas da PNAD Contínua anual com rendimento domiciliar per capita
b = get('https://servicodados.ibge.gov.br/api/v3/agregados', 0)
if b:
    for p in json.loads(b):
        if 'Contínua' in p['nome']:
            for a in p['agregados']:
                if 'per capita' in a['nome'].lower() and ('médio' in a['nome'].lower() or 'medio' in a['nome'].lower()): print('  PNADC', p['id'], a['id'], a['nome'][:200])
# ANP: estrutura da planilha mensal
import subprocess
for u in ['https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/precos-revenda-e-de-distribuicao-combustiveis/shlp/mensal/mensal-brasil-desde-jan2013.xlsx',
          'https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/precos-revenda-e-de-distribuicao-combustiveis/shlp/2001-2012/mensal-brasil-2001-a-2012.xlsx']:
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(raw(u, 180)), read_only=True, data_only=True)
    print('\nANP', u.rsplit('/',1)[-1], wb.sheetnames)
    for ws in wb.worksheets:
        rows = list(ws.iter_rows(values_only=True)); print(' aba', ws.title, len(rows))
        for r in rows[:18]: print('   ', r[:12])
        prods = sorted(set(str(r[1]) for r in rows[10:] if r and len(r) > 1)); print('   produtos?', prods[:30])
