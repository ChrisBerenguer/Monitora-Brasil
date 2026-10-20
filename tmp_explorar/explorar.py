import json, urllib.request
def raw(u):
    req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 MonitoraBrasil', 'Accept': 'application/json'})
    with urllib.request.urlopen(req, timeout=90) as r: return r.read()
o = json.loads(raw('https://api-publica.obrasgov.gestao.gov.br/obras/openapi.json'))
open('tmp_explorar/openapi.json','w').write(json.dumps(o, ensure_ascii=False, indent=1))
for path, ops in o['paths'].items():
    for m, op in ops.items():
        print(m.upper(), path, '|', op.get('summary'), '|', [(p['name'], p.get('required'), p.get('schema',{}).get('type')) for p in op.get('parameters', [])])
