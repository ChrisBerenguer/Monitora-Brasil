import json, re, io, gzip, urllib.request
def raw(u, t=180):
    req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (MonitoraBrasil)', 'Accept': '*/*', 'Accept-Encoding': 'identity'})
    with urllib.request.urlopen(req, timeout=t) as r:
        b = r.read(); return gzip.decompress(b) if b[:2] == b'\x1f\x8b' else b
def ipea(cod):
    v = json.loads(raw(f"http://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='{cod}')"))['value']
    v = [x for x in v if x['VALVALOR'] is not None]
    print(f'IPEA {cod}: {len(v)} valores, {v[0]["VALDATA"][:7]}={v[0]["VALVALOR"]} ... {[ (x["VALDATA"][:7], x["VALVALOR"], x.get("NIVNOME"), x.get("TERCODIGO")) for x in v[-4:]]}')
    m = json.loads(raw(f"http://www.ipeadata.gov.br/api/odata4/Metadados('{cod}')"))['value'][0]
    print('   ', m.get('SERNOME'), '|', (m.get('SERCOMENTARIO') or '')[:400].replace('\n',' '))
for c in ['CESBTOTAL', 'DIEESE12_CBSP12', 'MTE12_SALMIN12', 'GAC12_SALMINRE12', 'PRECOS12_IPCA12']:
    try: ipea(c)
    except Exception as e: print('ERRO', c, e)
v = json.loads(raw("http://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='CESBTOTAL')"))['value']
print('CESBTOTAL níveis/territórios:', sorted(set((x.get('NIVNOME'), x.get('TERCODIGO')) for x in v))[:40])
for t in ['7533', '7531']:
    m = json.loads(raw(f'https://servicodados.ibge.gov.br/api/v3/agregados/{t}/metadados'))
    print('\nSIDRA', t, m['nome'][:120], '| períodos', m['periodicidade'], '| variáveis', [(x['id'], x['nome'][:60]) for x in m['variaveis']][:5])
    for c in m['classificacoes']: print('   classif', c['id'], c['nome'], [(k['id'], k['nome']) for k in c['categorias']][:4])
    print('   níveis', m['nivelTerritorial'])
print(raw('https://apisidra.ibge.gov.br/values/t/7533/n1/all/v/all/p/all').decode()[:1500])
import openpyxl
for u in ['https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/precos-revenda-e-de-distribuicao-combustiveis/shlp/mensal/mensal-brasil-desde-jan2013.xlsx',
          'https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/precos-revenda-e-de-distribuicao-combustiveis/shlp/2001-2012/mensal-brasil-2001-a-2012.xlsx']:
    wb = openpyxl.load_workbook(io.BytesIO(raw(u)), read_only=True, data_only=True)
    print('\nANP', u.rsplit('/',1)[-1], wb.sheetnames)
    for ws in wb.worksheets:
        rows = list(ws.iter_rows(values_only=True)); print(' aba', ws.title, len(rows))
        for r in rows[:16]: print('   ', r[:12])
        for col in range(0, 4):
            print('   col', col, sorted(set(str(r[col]) for r in rows[16:] if r and len(r) > col))[:25])
