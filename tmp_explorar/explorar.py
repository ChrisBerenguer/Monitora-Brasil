import json, io, gzip, urllib.request
def raw(u, t=240):
    req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (MonitoraBrasil)', 'Accept': '*/*', 'Accept-Encoding': 'identity'})
    with urllib.request.urlopen(req, timeout=t) as r:
        b = r.read(); return gzip.decompress(b) if b[:2] == b'\x1f\x8b' else b
d = json.loads(raw('https://servicodados.ibge.gov.br/api/v3/agregados/7395/periodos/all/variaveis/4196?localidades=N1[all]'))
print('SIDRA 7395 var 4196:', json.dumps(d, ensure_ascii=False)[:1200])
import openpyxl
for u in ['https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/precos-revenda-e-de-distribuicao-combustiveis/shlp/mensal/mensal-brasil-desde-jan2013.xlsx',
          'https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/precos-revenda-e-de-distribuicao-combustiveis/shlp/2001-2012/mensal-brasil-2001-a-2012.xlsx',
          'https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/arquivos-levantamento-de-precos/mensal-brasil-desde-jan2013.xlsx']:
    try:
        wb = openpyxl.load_workbook(io.BytesIO(raw(u)), read_only=True, data_only=True)
        print(f'\nANP OK {u.rsplit("/", 1)[-1]} | abas {wb.sheetnames}')
        for ws in wb.worksheets:
            rows = list(ws.iter_rows(values_only=True))
            print(f'  aba "{ws.title}": {len(rows)} linhas x {max((len(r) for r in rows), default=0)} col')
            for r in rows[:13]: print('   ', [str(c)[:26] for c in r[:11]])
            print('    ÚLTIMA', [str(c)[:26] for c in rows[-1][:11]])
            for col in range(3):
                vals = sorted(set(str(r[col]) for r in rows[12:] if r and len(r) > col and r[col] is not None))
                print(f'    col{col} ({len(vals)} distintos):', vals[:16])
    except Exception as e: print(f'\nANP ERRO {u.rsplit("/", 1)[-1]}: {e}')
