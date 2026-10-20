import json, urllib.request, urllib.parse, ssl
def get(u, n=2500):
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 MonitoraBrasil', 'Accept': 'application/json,*/*'})
        with urllib.request.urlopen(req, timeout=40) as r:
            b = r.read()
            print(f'\n=== {u}\nstatus {r.status} type {r.headers.get("Content-Type")} bytes {len(b)}')
            print(b[:n].decode('utf-8', 'replace'))
            return b
    except Exception as e:
        print(f'\n=== {u}\nERRO {e}')
B='https://api-publica.obrasgov.gestao.gov.br'
for p in ['/', '/obrasgov/api/v3/api-docs', '/v3/api-docs', '/obrasgov/api/swagger-ui/index.html', '/obrasgov/api/v3/api-docs/swagger-config',
          '/obrasgov/api/projeto-investimento?pagina=0&tamanhoDaPagina=2', '/obrasgov/api/projeto-investimento?pagina=0&tamanhoDaPagina=2&situacao=Conclu%C3%ADda',
          '/obrasgov/api/historico-situacao?pagina=0&tamanhoDaPagina=2']:
    get(B+p)
CK='https://www.tesourotransparente.gov.br/ckan/api/3/action/'
b=get(CK+'package_search?q=resultado+tesouro+nacional&rows=5', 400)
if b:
    for pk in json.loads(b)['result']['results']:
        print('PACOTE', pk['name'], pk['title'])
        for r in pk['resources']: print('   ', r.get('name'), r.get('format'), r.get('url'))
get("http://www.ipeadata.gov.br/api/odata4/Metadados?$filter=contains(SERNOME,'nvestimento')%20and%20contains(SERNOME,'federal')&$select=SERCODIGO,SERNOME,PERNOME,SERMAXDATA", 6000)
