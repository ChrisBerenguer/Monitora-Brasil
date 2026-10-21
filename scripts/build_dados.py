import csv, json, math, os, sys, statistics as st
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from explicacoes import EXPLICACOES  # textos para leigos (botão "i" do site)
from fontes import CODIGO_OFICIAL, links  # códigos e links oficiais de cada indicador
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # raiz do repositório
from collections import defaultdict

RAW = os.path.join(BASE, 'brutos') + os.sep
Y0, Y1 = 1995, 2025
SCORE_Y0 = 2000
FILL = 5  # anos de LOCF para séries esparsas no cálculo de escore

# code, nome PT, unidade, tema, direção (+1 maior melhor, -1 menor melhor, 'tgt:x' distância do alvo, 0 contexto), arquivo, fonte
IND = [
 # I Estabilidade macro
 ('fp_cpi_totl_zg','Inflação (IPC)','% a.a.','macro','tgt:3','Banco Mundial (FMI)'),
 ('fr_inr_rinr','Juros reais','% a.a.','macro','tgt:2','Banco Mundial (FMI)'),
 ('gc_dod_totl_gd_zs','Dívida do governo central','% PIB','macro',-1,'Banco Mundial (FMI)'),
 ('dt_dod_dect_gn_zs','Dívida externa','% RNB','macro',-1,'Banco Mundial (IDS)'),
 ('fi_res_totl_mo','Reservas internacionais','meses de importação','macro',1,'Banco Mundial (FMI)'),
 ('bn_cab_xoka_gd_zs','Saldo em conta corrente','% PIB','macro',1,'Banco Mundial (FMI)'),
 ('ny_gdp_mktp_kd_zg','Crescimento real do PIB','% a.a.','macro',1,'Banco Mundial'),
 ('sl_uem_totl_zs','Desemprego','% força de trabalho','macro',-1,'Banco Mundial (OIT)'),
 # II Estrutura produtiva
 ('ny_gdp_pcap_pp_kd','PIB per capita (PPC)','US$ const. 2021','prod',1,'Banco Mundial (ICP)'),
 ('nv_ind_manf_zs','Indústria de transformação','% PIB','prod',1,'Banco Mundial'),
 ('tx_val_tech_mf_zs','Exportações de alta tecnologia','% export. manufat.','prod',1,'Banco Mundial (Comtrade)'),
 ('gb_xpd_rsdv_gd_zs','Gasto em P&D','% PIB','prod',1,'Banco Mundial (UNESCO)'),
 ('pat_pm','Patentes de residentes','por milhão hab.','prod',1,'Banco Mundial (OMPI)'),
 ('bx_klt_dinv_wd_gd_zs','Investimento direto estrangeiro','% PIB','prod',1,'Banco Mundial (FMI)'),
 ('ne_trd_gnfs_zs','Abertura comercial','% PIB','prod',1,'Banco Mundial'),
 # III Coesão social
 ('si_pov_gini','Índice de Gini','0–100','social',-1,'Banco Mundial (PIP)'),
 ('si_dst_10th_10','Renda apropriada pelos 10% mais ricos','% da renda','social',-1,'Banco Mundial (PIP)'),
 ('si_pov_dday','Pobreza extrema (US$ 3,00/dia)','% população','social',-1,'Banco Mundial (PIP)'),
 ('si_pov_umic','Pobreza (US$ 8,30/dia)','% população','social',-1,'Banco Mundial (PIP)'),
 ('sg_gen_parl_zs','Mulheres no parlamento','% cadeiras','social',1,'Banco Mundial (UIP)'),
 ('sl_tlf_cact_fe_zs','Participação feminina no trabalho','% mulheres 15+','social',1,'Banco Mundial (OIT)'),
 ('ne_con_prvt_pc_kd','Consumo das famílias per capita','US$ const. 2015','social',1,'Banco Mundial'),
 # IV Estado e instituições
 ('gov_wgi_va_est','Voz e accountability','−2,5 a +2,5','inst',1,'Banco Mundial (WGI)'),
 ('gov_wgi_pv_est','Estabilidade política','−2,5 a +2,5','inst',1,'Banco Mundial (WGI)'),
 ('gov_wgi_ge_est','Efetividade do governo','−2,5 a +2,5','inst',1,'Banco Mundial (WGI)'),
 ('gov_wgi_rq_est','Qualidade regulatória','−2,5 a +2,5','inst',1,'Banco Mundial (WGI)'),
 ('gov_wgi_rl_est','Estado de direito','−2,5 a +2,5','inst',1,'Banco Mundial (WGI)'),
 ('gov_wgi_cc_est','Controle da corrupção','−2,5 a +2,5','inst',1,'Banco Mundial (WGI)'),
 ('vc_ihr_psrc_p5','Homicídios','por 100 mil hab.','inst',-1,'Banco Mundial (UNODC)'),
 ('gc_tax_totl_gd_zs','Receita tributária (gov. central)','% PIB','inst',0,'Banco Mundial (FMI)'),
 # V Bem-estar e sustentabilidade
 ('hdi','IDH','0–1','bem',1,'PNUD via Gapminder'),
 ('sp_dyn_le00_in','Expectativa de vida','anos','bem',1,'Banco Mundial (ONU)'),
 ('sh_h2o_smdw_zs','Água potável gerida com segurança','% população','bem',1,'Banco Mundial (OMS/UNICEF)'),
 ('sh_sta_smss_zs','Saneamento gerido com segurança','% população','bem',1,'Banco Mundial (OMS/UNICEF)'),
 ('eg_elc_accs_zs','Acesso à eletricidade','% população','bem',1,'Banco Mundial'),
 ('se_xpd_totl_gd_zs','Gasto público em educação','% PIB','bem',1,'Banco Mundial (UNESCO)'),
 ('sh_xpd_chex_gd_zs','Gasto em saúde','% PIB','bem',1,'Banco Mundial (OMS)'),
 ('en_ghg_co2_pc_ce_ar5','Emissões de CO₂','t per capita','bem',-1,'Banco Mundial (EDGAR)'),
 ('ag_lnd_frst_zs','Cobertura florestal','% território','bem',1,'Banco Mundial (FAO)'),
 ('sp_pop_dpnd_ol','Razão de dependência de idosos','% pop. 15–64','bem',0,'Banco Mundial (ONU)'),
]
THEMES = [
 ('macro','Estabilidade Macroeconômica'),
 ('prod','Estrutura Produtiva e Inovação'),
 ('social','Coesão Social e Distribuição'),
 ('inst','Estado, Instituições e Segurança'),
 ('bem','Bem-Estar e Sustentabilidade'),
]
COHORTS = {
 'latam': ('América Latina', ['arg','chl','col','mex','per','ury']),
 'brics': ('BRICS', ['chn','ind','rus','zaf']),
 'ocde':  ('OCDE (referência)', ['usa','deu','fra','gbr','jpn','kor','can','esp','ita','aus','prt','pol']),
}
NAMES = {'bra':'Brasil','arg':'Argentina','chl':'Chile','col':'Colômbia','mex':'México','per':'Peru','ury':'Uruguai',
 'chn':'China','ind':'Índia','rus':'Rússia','zaf':'África do Sul','usa':'Estados Unidos','deu':'Alemanha','fra':'França',
 'gbr':'Reino Unido','jpn':'Japão','kor':'Coreia do Sul','can':'Canadá','esp':'Espanha','ita':'Itália','aus':'Austrália',
 'prt':'Portugal','pol':'Polônia'}
FOCUS = ['bra'] + [c for k in COHORTS for c in COHORTS[k][1]]

# países reais
countries = {}
for r in csv.DictReader(open(RAW+'countries.csv')):
    if r['is--country']=='TRUE' and r['un_state']=='TRUE':
        countries[r['country']] = r
UMIC = [c for c,r in countries.items() if r['income_groups']=='upper_middle_income']

def load(fname, col=None):
    d = defaultdict(dict)
    with open(RAW+fname) as f:
        rd = csv.reader(f); h = next(rd)
        for g,t,v in rd:
            if g in countries and v not in ('',None):
                t=int(t)
                if Y0-10 <= t <= Y1: d[g][t]=float(v)
    return d

data = {}
for code,*_ in IND:
    if code=='pat_pm':
        pat = load('ip_pat_resd.csv'); pop = load('sp_pop_totl.csv')
        d = defaultdict(dict)
        for g in pat:
            for t,v in pat[g].items():
                if t in pop.get(g,{}) and pop[g][t]>0: d[g][t] = v/pop[g][t]*1e6
        data[code]=d
    elif code=='hdi': data[code]=load('hdi.csv')
    else: data[code]=load(code+'.csv')

YEARS = list(range(Y0, Y1+1))
SYEARS = list(range(SCORE_Y0, Y1+1))

def filled(d, g, t):
    s = d.get(g, {})
    for k in range(0, FILL+1):
        if t-k in s: return s[t-k]
    return None

def transform(meta, v):
    dirn = meta[4]
    if isinstance(dirn,str) and dirn.startswith('tgt:'):
        return -abs(v-float(dirn[4:]))
    return v*dirn

# percentil global por indicador/ano (com LOCF), entre todos os países com dado
pct = {}  # code -> year -> {geo: pct}
for meta in IND:
    code=meta[0]
    if meta[4]==0: continue
    pct[code]={}
    for t in SYEARS:
        vals = []
        for g in countries:
            v = filled(data[code], g, t)
            if v is not None: vals.append((transform(meta,v), g))
        n=len(vals)
        if n<20: continue
        vals.sort()
        # percent rank com empates médios
        res={}; i=0
        while i<n:
            j=i
            while j+1<n and vals[j+1][0]==vals[i][0]: j+=1
            r=(i+j)/2
            for k in range(i,j+1): res[vals[k][1]] = 100*r/(n-1)
            i=j+1
        pct[code][t]=res

# escore por tema
theme_inds = {k:[m[0] for m in IND if m[3]==k and m[4]!=0] for k,_ in THEMES}
score = defaultdict(lambda: defaultdict(dict))  # geo->theme->year
for g in countries:
    for k,_ in THEMES:
        inds = theme_inds[k]
        for t in SYEARS:
            xs=[pct[c][t][g] for c in inds if t in pct[c] and g in pct[c][t]]
            if len(xs) >= math.ceil(len(inds)/2):
                score[g][k][t]=sum(xs)/len(xs)
    for t in SYEARS:
        xs=[score[g][k][t] for k,_ in THEMES if t in score[g][k]]
        if len(xs)>=4: score[g]['geral'][t]=sum(xs)/len(xs)

def r2(x, nd=2):
    if x is None: return None
    if abs(x)>=1000: return round(x,0)
    return round(x, nd)

def stats(xs):
    xs=[x for x in xs if x is not None]
    if not xs: return None
    xs.sort(); n=len(xs)
    q=lambda p: xs[0] if n==1 else (lambda i: xs[int(i)]+(xs[min(int(i)+1,n-1)]-xs[int(i)])*(i-int(i)))(p*(n-1))
    return {'n':n,'mean':r2(sum(xs)/n),'median':r2(q(.5)),'p25':r2(q(.25)),'p75':r2(q(.75)),
            'sd':r2(st.pstdev(xs)) if n>1 else 0,'min':r2(xs[0]),'max':r2(xs[-1])}

GROUPS = {k:v[1] for k,v in COHORTS.items()}
GROUPS['umic'] = UMIC
GROUPS['mundo'] = list(countries)
GNAMES = {k:v[0] for k,v in COHORTS.items()}
GNAMES['umic']='Renda média-alta (BM)'; GNAMES['mundo']='Mundo (todos os países)'

out = {'years':YEARS,'scoreYears':SYEARS,
 'themes':[{'id':k,'name':n,'inds':theme_inds[k]} for k,n in THEMES],
 'cohorts':[{'id':k,'name':GNAMES[k],'members':GROUPS[k] if k not in ('mundo','umic') else None,'n':len(GROUPS[k])} for k in ['latam','brics','ocde','umic','mundo']],
 'countries':[{'id':g,'name':NAMES[g],'cohort':next((k for k in COHORTS if g in COHORTS[k][1]),None)} for g in FOCUS],
 'indicators':[], 'series':{}, 'groupStats':{}, 'scores':{}, 'scoreGroups':{}}

for code,name,unit,theme,dirn,src in IND:
    last = max((max(s) for s in data[code].values() if s), default=None)
    out['indicators'].append({'id':code,'name':name,'unit':unit,'theme':theme,
        'dir': dirn if not isinstance(dirn,str) else 'tgt', 'target': float(dirn[4:]) if isinstance(dirn,str) else None,
        'source':src,'lastYear':last,'scored': dirn!=0})
    out['series'][code] = {g:[r2(data[code].get(g,{}).get(t)) for t in YEARS] for g in FOCUS}
    gs={}
    for gk,mem in GROUPS.items():
        gs[gk]=[stats([data[code].get(g,{}).get(t) for g in mem]) for t in YEARS]
    out['groupStats'][code]=gs

for g in FOCUS:
    out['scores'][g]={k:[r2(score[g][k].get(t),1) for t in SYEARS] for k in [t[0] for t in THEMES]+['geral']}
for gk,mem in GROUPS.items():
    out['scoreGroups'][gk]={k:[stats([score[g][k].get(t) for g in mem]) for t in SYEARS] for k in [t[0] for t in THEMES]+['geral']}
# percentis do Brasil por indicador (último ano com escore)
out['pctBR']={c:[r2(pct[c].get(t,{}).get('bra'),1) for t in SYEARS] for c in pct}
# ranking geral do último ano completo
rk={}
for t in SYEARS:
    lst=sorted([(score[g]['geral'][t],g) for g in countries if t in score[g]['geral']], reverse=True)
    pos=[i for i,(s,g) in enumerate(lst) if g=='bra']
    rk[t]={'pos':pos[0]+1 if pos else None,'n':len(lst)}
out['rankBR']=rk
# posição do Brasil entre as maiores economias do mundo (PIB em US$ correntes)
pib_abs = load('ny_gdp_mktp_cd.csv')
ec={}
for t in SYEARS:
    lst=sorted([(v[t],g) for g,v in pib_abs.items() if t in v], reverse=True)
    pos=[i for i,(v,g) in enumerate(lst) if g=='bra']
    ec[t]={'pos':pos[0]+1 if pos else None,'n':len(lst),'pib':pib_abs['bra'].get(t)}
out['econBR']=ec

print('BR geral', out['scores']['bra']['geral'])
for k,_ in THEMES: print(k, out['scores']['bra'][k][::5], out['scores']['bra'][k][-3:])
print(rk[2024], rk[2025], rk[2010])
for g in ['chl','mex','chn','usa','arg']: print(g, out['scores'][g]['geral'][-3:])

# ---------- export para o dashboard ----------
OUT = os.path.join(BASE, 'dados')
os.makedirs(OUT, exist_ok=True)
SITE_DATA = os.path.join(BASE, 'site', 'data')  # cópia usada pelo site estático
os.makedirs(SITE_DATA, exist_ok=True)
def dump(name, rows):
    p=os.path.join(OUT, name)
    json.dump(rows, open(p,'w'), ensure_ascii=False, separators=(',',':'))
    json.dump(rows, open(os.path.join(SITE_DATA, name),'w'), ensure_ascii=False, separators=(',',':'))
    print(name, len(rows), os.path.getsize(p))

dump('indicadores.json', [{'id':i['id'],'nome':i['name'],'unidade':i['unit'],'tema':i['theme'],
   'direcao': {1:'maior é melhor',-1:'menor é melhor',0:'contexto (sem escore)','tgt':'mais perto de %g é melhor'%(i['target'] or 0)}[i['dir']],
   'fonte':i['source'],'ultimo_ano':i['lastYear'],'entra_no_escore':i['scored'],
   'codigo_oficial':CODIGO_OFICIAL.get(i['id']), 'url_fonte':links(i['id'])[0], 'url_api':links(i['id'])[1],
   'explicacao':EXPLICACOES.get(i['id'])} for i in out['indicators']])

ser=[]
for code in out['series']:
    for g,vals in out['series'][code].items():
        for t,v in zip(YEARS,vals):
            if v is not None: ser.append({'ind':code,'pais':g,'ano':t,'valor':v})
dump('series.json', ser)

META = {m[0]: m for m in IND}
def supera(code, gk, t, bv):
    """Parcela dos países da coorte (sem o Brasil) que o Brasil supera, respeitando o sentido do indicador.
    Para indicadores de contexto, parcela com valor menor que o do Brasil. Empates contam meio."""
    if bv is None: return {'n_comp': None, 'n_supera': None, 'pct_supera': None}
    meta = META[code]
    outros = [data[code][g][t] for g in GROUPS[gk] if g != 'bra' and t in data[code].get(g,{})]
    if not outros: return {'n_comp': 0, 'n_supera': None, 'pct_supera': None}
    tb = transform(meta, bv) if meta[4] != 0 else bv
    sc = 0.0
    for v in outros:
        tv = transform(meta, v) if meta[4] != 0 else v
        sc += 1 if tb > tv else 0.5 if tb == tv else 0
    return {'n_comp': len(outros), 'n_supera': r2(sc,1), 'pct_supera': r2(100*sc/len(outros),1)}

cs=[]
for code,gs in out['groupStats'].items():
    for gk,lst in gs.items():
        for t,s in zip(YEARS,lst):
            if s:
                bv=data[code].get('bra',{}).get(t)
                z = r2((bv-s['mean'])/s['sd']) if (bv is not None and s['sd']) else None
                sup = supera(code, gk, t, bv)
                cs.append({'chave':f'{code}|{gk}|{t}','ind':code,'coorte':gk,'ano':t,**s,'brasil':r2(bv),'z_brasil':z, **sup})
dump('coortes.json', cs)

# ---------- histogramas (Mundo e Renda média-alta), para o site ----------
def histograma(vals, brv, nb=14, fixo=None):
    vals = sorted(vals)
    if fixo:
        lo, hi = fixo
    else:
        q = lambda p: vals[int(round(p*(len(vals)-1)))]
        lo, hi = q(.02), q(.98)
        if hi <= lo: lo, hi = vals[0], vals[-1]
        if hi <= lo: hi = lo + 1
    w = (hi-lo)/nb
    bins = [{'de': r2(lo+i*w), 'ate': r2(lo+(i+1)*w), 'n': 0} for i in range(nb)]
    idx = lambda v: max(0, min(nb-1, int((v-lo)//w)))
    for v in vals: bins[idx(v)]['n'] += 1
    out = {'bins': bins, 'abre_esq': (not fixo) and vals[0] < lo, 'abre_dir': (not fixo) and vals[-1] > hi}
    if brv is not None: out['bin_brasil'] = idx(brv)
    return out

hist = []
for code,*_ in IND:
    for gk in ('umic','mundo'):
        for t in YEARS:
            vals = [data[code][g][t] for g in GROUPS[gk] if t in data[code].get(g,{})]
            if len(vals) < 10: continue
            h = histograma(vals, data[code].get('bra',{}).get(t))
            hist.append({'chave':f'{code}|{gk}|{t}','ind':code,'coorte':gk,'ano':t,**h})
for kk in [t[0] for t in THEMES]+['geral']:
    for gk in ('umic','mundo'):
        for t in SYEARS:
            vals = [score[g][kk][t] for g in GROUPS[gk] if t in score[g][kk]]
            if len(vals) < 10: continue
            h = histograma(vals, score['bra'][kk].get(t), nb=10, fixo=(0,100))
            hist.append({'chave':f'escore:{kk}|{gk}|{t}','ind':'escore:'+kk,'coorte':gk,'ano':t,**h})
dump('histogramas.json', hist)

PERIODS=[(f'{a}–{a+3}',a,a+3) for a in range(1995,2024,4)]
pr=[]
for code,*_ in IND:
    for g in FOCUS:
        s=data[code].get(g,{})
        for lab,a,b in PERIODS:
            pts=[(t,s[t]) for t in range(a,b+1) if t in s]
            if not pts: continue
            xs=[v for _,v in pts]; S=stats(list(xs))
            slope=None
            if len(pts)>=3:
                mx=sum(t for t,_ in pts)/len(pts); my=sum(xs)/len(xs)
                den=sum((t-mx)**2 for t,_ in pts)
                slope=r2(sum((t-mx)*(v-my) for t,v in pts)/den,3) if den else None
            pr.append({'ind':code,'pais':g,'periodo':lab,'n':S['n'],'media':S['mean'],'mediana':S['median'],'desvio':S['sd'],'min':S['min'],'max':S['max'],'tendencia_ano':slope})
dump('periodos.json', pr)

sc=[]
for g in FOCUS:
    for k,vals in out['scores'][g].items():
        for t,v in zip(SYEARS,vals):
            if v is not None: sc.append({'pais':g,'tema':k,'ano':t,'escore':v})
dump('escores.json', sc)
scg=[]
for gk,d in out['scoreGroups'].items():
    for k,lst in d.items():
        for t,s in zip(SYEARS,lst):
            if s:
                bv = score['bra'][k].get(t)
                outros = [score[g][k][t] for g in GROUPS[gk] if g != 'bra' and t in score[g][k]]
                sc = sum(1 if bv > v else 0.5 if bv == v else 0 for v in outros) if (bv is not None and outros) else None
                scg.append({'chave':f'{k}|{gk}|{t}','coorte':gk,'tema':k,'ano':t,'n':s['n'],'media':r2(s['mean'],1),'mediana':r2(s['median'],1),'p25':r2(s['p25'],1),'p75':r2(s['p75'],1),'desvio':r2(s['sd'],1),'min':r2(s['min'],1),'max':r2(s['max'],1),
                    'n_comp': len(outros), 'n_supera': r2(sc,1) if sc is not None else None, 'pct_supera': r2(100*sc/len(outros),1) if (sc is not None and outros) else None})
dump('escores_coortes.json', scg)
bp=[]
for c,vals in out['pctBR'].items():
    for t,v in zip(SYEARS,vals):
        if v is not None: bp.append({'ind':c,'ano':t,'percentil':v})
dump('percentis_brasil.json', bp)
dump('ranking_brasil.json', [{'ano':t,'posicao':v['pos'],'paises':v['n'],
    'pos_econ':ec[t]['pos'],'paises_econ':ec[t]['n'],
    'pib_usd':round(ec[t]['pib']) if ec[t].get('pib') else None} for t,v in rk.items()])
