import json, io, gzip, urllib.request
def raw(u, t=180):
    req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (MonitoraBrasil)', 'Accept': '*/*', 'Accept-Encoding': 'identity'})
    with urllib.request.urlopen(req, timeout=t) as r:
        b = r.read(); return gzip.decompress(b) if b[:2] == b'\x1f\x8b' else b

# ---- IPEA: cesta básica, salário mínimo, IPCA
def ipea(cod, n=4):
    try:
        v = [x for x in json.loads(raw(f"http://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='{cod}')"))['value'] if x['VALVALOR'] is not None]
        print(f'\nIPEA {cod}: {len(v)} valores | {v[0]["VALDATA"][:7]} → {v[-1]["VALDATA"][:7]}')
        print('  últimos:', [(x['VALDATA'][:7], round(x['VALVALOR'], 2), x.get('TERCODIGO')) for x in v[-n:]])
        terr = sorted(set((x.get('NIVNOME'), x.get('TERCODIGO')) for x in v))
        if len(terr) > 1: print('  territórios:', terr[:40])
        return v
    except Exception as e: print(f'\nIPEA {cod} ERRO {e}')
for c in ['CESBTOTAL', 'DIEESE12_CBSP12', 'MTE12_SALMIN12', 'PRECOS12_IPCAG12', 'PRECOS12_IPCA12']: ipea(c)

# ---- SIDRA 7395: rendimento domiciliar per capita (PNAD Contínua anual)
m = json.loads(raw('https://servicodados.ibge.gov.br/api/v3/agregados/7395/metadados'))
print('\nSIDRA 7395', m['nome'], '| periodicidade', m['periodicidade'], '| níveis', m['nivelTerritorial'])
print('  variáveis', [(x['id'], x['nome'], x['unidade']) for x in m['variaveis']])
print('  classificações', [(c['id'], c['nome'], [(k['id'], k['nome']) for k in c['categorias']][:6]) for c in m['classificacoes']])
d = json.loads(raw('https://servicodados.ibge.gov.br/api/v3/agregados/7395/periodos/all/variaveis/10267?localidades=N1[all]'))
print('  dados:', json.dumps(d, ensure_ascii=False)[:900])

# ---- ANP: preços de combustíveis, mensal, Brasil
import openpyxl
for u in ['https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/precos-revenda-e-de-distribuicao-combustiveis/shlp/mensal/mensal-brasil-desde-jan2013.xlsx',
          'https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/precos-revenda-e-de-distribuicao-combustiveis/shlp/2001-2012/mensal-brasil-2001-a-2012.xlsx']:
    try:
        wb = openpyxl.load_workbook(io.BytesIO(raw(u)), read_only=True, data_only=True)
        print(f'\nANP {u.rsplit("/", 1)[-1]} | abas {wb.sheetnames}')
        for ws in wb.worksheets:
            rows = list(ws.iter_rows(values_only=True))
            print(f'  aba "{ws.title}": {len(rows)} linhas')
            for r in rows[:14]: print('   ', [str(c)[:28] for c in r[:10]])
            print('    ÚLTIMA', [str(c)[:28] for c in rows[-1][:10]])
            for col in range(3):
                vals = sorted(set(str(r[col]) for r in rows[12:] if r and len(r) > col and r[col] is not None))
                print(f'    col{col} ({len(vals)}):', vals[:20])
    except Exception as e: print(f'\nANP {u.rsplit("/", 1)[-1]} ERRO {e}')
