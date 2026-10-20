import json, re, io, gzip, urllib.request, urllib.parse
def raw(u, t=120):
    req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (MonitoraBrasil)', 'Accept': '*/*', 'Accept-Encoding': 'identity'})
    with urllib.request.urlopen(req, timeout=t) as r:
        b = r.read()
        return gzip.decompress(b) if b[:2] == b'\x1f\x8b' else b
def get(u, n=1500):
    try:
        b = raw(u); print(f'\n=== {u}\nbytes {len(b)}'); print(b[:n].decode('utf-8','replace')); return b
    except Exception as e: print(f'\n=== {u}\nERRO {e}')
# IPEA: todos os metadados, filtrados aqui
b = get('http://www.ipeadata.gov.br/api/odata4/Metadados', 0)
if b:
    for s in json.loads(b)['value']:
        n = (s.get('SERNOME') or '')
        if re.search(r'[Cc]esta|[Ss]alário mínimo|[Gg]asolina|[Dd]iesel|[Ee]tanol|[Áá]lcool combust|GLP|[Bb]otij|[Gg]ás liquefeito', n) and s.get('SERSTATUS') != 'I':
            print('  IPEA', s.get('SERCODIGO'), '|', n[:110], '|', s.get('PERNOME'), str(s.get('SERMINDATA'))[:7], str(s.get('SERMAXDATA'))[:7], s.get('FNTSIGLA'), s.get('UNINOME'), s.get('SERSTATUS'))
# DIEESE: scripts da página
h = raw('https://www.dieese.org.br/cesta/').decode('utf-8','replace')
print('DIEESE scripts', re.findall(r'src="([^"]+)"', h)); print('DIEESE ajax/urls', sorted(set(re.findall(r'["\'](/?[a-zA-Z0-9_\-/]*(?:cesta|Cesta)[a-zA-Z0-9_\-/.?=&]*)["\']', h)))[:60])
i = h.find('<form'); print(h[i:i+3000] if i>=0 else h[:3000])
# IBGE: tabelas PNADC anual com rendimento domiciliar per capita
b = raw('https://servicodados.ibge.gov.br/api/v3/agregados')
for p in json.loads(b):
    if 'Contínua' in p['nome']:
        for a in p['agregados']:
            nn = a['nome'].lower()
            if 'per capita' in nn and ('médio' in nn or 'real' in nn): print('  PNADC', p['id'], a['id'], a['nome'][:220])
