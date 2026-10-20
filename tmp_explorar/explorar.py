import json, urllib.request, urllib.parse, time
from collections import Counter
API='https://api-publica.obrasgov.gestao.gov.br/obras'
def pg(rota, **p):
    for t in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(f'{API}/{rota}?{urllib.parse.urlencode(p)}', headers={'User-Agent':'MonitoraBrasil'}), timeout=120) as r: return json.loads(r.read())
        except Exception as e: print('erro', e); time.sleep(3*(t+1))
r = pg('execucao-fisica', pagina=1, tamanho_da_pagina=5)
print('execucao-fisica total', r.get('total_items')); print(json.dumps(r['data'][:3], ensure_ascii=False)[:2500])
# amostra de obras concluídas: quais campos de data vêm preenchidos
c = Counter(); anos_prev = Counter(); sist = Counter(); nat = Counter(); org = Counter()
for p in range(1, 11):
    d = pg('projeto-investimento', situacao='Concluída', pagina=p, tamanho_da_pagina=200)['data']
    for o in d:
        for k in ['dt_final_efetiva','dt_inicial_efetiva','dt_final_prevista','dt_inicial_prevista','dt_cadastro']: c[k] += bool(o.get(k))
        anos_prev[str(o.get('dt_final_prevista'))[:4]] += 1; sist[o.get('sistema_resp')] += 1; nat[o.get('natureza_intervencao')] += 1; org[o.get('organizacao_resp')] += 1
print('preenchidos em 2000 concluídas:', dict(c)); print('ano final previsto:', sorted(anos_prev.items())); print('sistema:', sist.most_common(8)); print('natureza:', nat.most_common(6)); print('org:', org.most_common(8))
print(json.dumps({k: v for k, v in d[0].items() if k not in ('fotos','pins','geometrias')}, ensure_ascii=False)[:2500])
# execução física de algumas concluídas
for o in d[:5]:
    e = pg('execucao-fisica', id_projeto_investimento=o['id_projeto_investimento'], pagina=1, tamanho_da_pagina=50)
    print('EXEC', o['id_projeto_investimento'], [(x.get('percentual_execucao_fisica'), x.get('dt_final_execucao'), x.get('dt_atualizacao_execucao')) for x in e.get('data', [])][:5])
