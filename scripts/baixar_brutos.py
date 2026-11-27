"""Baixa as séries brutas usadas pelo painel para a pasta brutos/.
Fonte: espelho do World Development Indicators (Banco Mundial) e do Gapminder mantido em github.com/open-numbers,
a API do DataMapper do FMI (saldo primário do governo geral), a Global Revenue Statistics da OCDE (carga
tributária total) e as estatísticas de finanças públicas (GFS) do FMI (investimento público).
Uso: python baixar_brutos.py && python build_dados.py
"""
import os, urllib.request
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # raiz do repositório
DST = os.path.join(BASE, 'brutos'); os.makedirs(DST, exist_ok=True)
WDI = 'https://raw.githubusercontent.com/open-numbers/ddf--open_numbers--world_development_indicators/master'
SG = 'https://raw.githubusercontent.com/open-numbers/ddf--gapminder--systema_globalis/master/countries-etc-datapoints'
CODES = """fp_cpi_totl_zg fr_inr_rinr gc_dod_totl_gd_zs dt_dod_dect_gn_zs fi_res_totl_mo bn_cab_xoka_gd_zs ny_gdp_mktp_kd_zg
sl_uem_totl_zs ny_gdp_pcap_pp_kd nv_ind_manf_zs tx_val_tech_mf_zs gb_xpd_rsdv_gd_zs ip_pat_resd bx_klt_dinv_wd_gd_zs
ne_trd_gnfs_zs si_pov_gini si_dst_10th_10 si_pov_dday si_pov_umic sg_gen_parl_zs sl_tlf_cact_fe_zs ne_con_prvt_pc_kd
gov_wgi_va_est gov_wgi_pv_est gov_wgi_ge_est gov_wgi_rq_est gov_wgi_rl_est gov_wgi_cc_est vc_ihr_psrc_p5 gc_tax_totl_gd_zs
sp_dyn_le00_in sh_h2o_smdw_zs sh_sta_smss_zs eg_elc_accs_zs se_xpd_totl_gd_zs sh_xpd_chex_gd_zs en_ghg_co2_pc_ce_ar5
ag_lnd_frst_zs sp_pop_totl sp_pop_dpnd_ol""".split()
jobs = [(f'{WDI}/datapoints/ddf--datapoints--{c}--by--geo--time.csv', f'{c}.csv') for c in CODES]
jobs += [(f'{WDI}/ddf--entities--geo--country.csv', 'countries.csv'),
         (f'{SG}/ddf--datapoints--hdi_human_development_index--by--geo--time.csv', 'hdi.csv')]
for url, name in jobs:
    print('baixando', name); urllib.request.urlretrieve(url, os.path.join(DST, name))

# Saldo primário do governo geral (% do PIB), do Fiscal Monitor do FMI, pela API do DataMapper.
# Gravado no mesmo formato das outras séries (geo,time,valor), com o código do país em minúsculas.
# Os anos à frente do último dado observado são projeções do FMI; build_dados.py só usa até Y1.
import json
FMI = 'GGXONLB_G01_GDP_PT'
print('baixando', FMI.lower() + '.csv (FMI)')
valores = {}
try:  # DataMapper (recusa algumas redes, como a do GitHub Actions)
    req = urllib.request.Request(f'https://www.imf.org/external/datamapper/api/v1/{FMI}', headers={'User-Agent': 'Mozilla/5.0 (MonitoraBrasil)'})
    valores = {p: {a: v for a, v in anos.items()} for p, anos in json.load(urllib.request.urlopen(req, timeout=120))['values'][FMI].items()}
except Exception as e:  # noqa: BLE001
    print('  DataMapper falhou:', e, '- usando a API SDMX do FMI (Fiscal Monitor)')
    import csv as _csv, io as _io
    req = urllib.request.Request(f'https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.FAD/FM/+/*.{FMI}.A?attributes=none',
                                 headers={'User-Agent': 'MonitoraBrasil/1.0', 'Accept': 'application/vnd.sdmx.data+csv;version=2.0.0;labels=id'})
    for r in _csv.DictReader(_io.StringIO(urllib.request.urlopen(req, timeout=300).read().decode('utf-8-sig'))):
        if r.get('OBS_VALUE') and r.get('TIME_PERIOD'):
            valores.setdefault(r['COUNTRY'], {})[r['TIME_PERIOD']] = r['OBS_VALUE']
with open(os.path.join(DST, FMI.lower() + '.csv'), 'w') as f:
    f.write(f'geo,time,{FMI.lower()}\n')
    for pais in sorted(p for p in valores if len(p) == 3 and p.isalpha()):  # fora os agregados (ADVEC, EURO...)
        for ano, v in sorted(valores[pais].items()):
            if v is not None:
                f.write(f'{pais.lower()},{ano},{round(float(v), 4)}\n')

# Carga tributária total (impostos e contribuições sociais de todas as esferas de governo), % do PIB,
# da Global Revenue Statistics da OCDE (cerca de 130 países), pela API SDMX da OCDE.
import csv, io
print('baixando carga_trib_total.csv (OCDE)')
url = ('https://sdmx.oecd.org/public/rest/data/OECD.CTP.TPS,DSD_REV_COMP_GLOBAL@DF_RSGLOBAL,'
       '/.TAX_REV.S13._T._T.PT_B1GQ.A?startPeriod=1980&format=csvfilewithlabels')
txt = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'MonitoraBrasil/1.0'}), timeout=600).read().decode('utf-8-sig')
with open(os.path.join(DST, 'carga_trib_total.csv'), 'w') as f:
    f.write('geo,time,carga_trib_total\n')
    for r in sorted(csv.DictReader(io.StringIO(txt)), key=lambda r: (r['REF_AREA'], r['TIME_PERIOD'])):
        if r['OBS_VALUE'] and len(r['REF_AREA']) == 3:
            f.write(f"{r['REF_AREA'].lower()},{r['TIME_PERIOD']},{round(float(r['OBS_VALUE']), 4)}\n")

# Investimento público (aquisição de ativos fixos: obras, equipamentos, imóveis), % do PIB, das estatísticas
# de finanças públicas do FMI (GFS, Statement of Operations), para o governo geral (S13: União, estados e
# municípios) e o governo central (S1311). Pela API SDMX 3.0 do FMI.
for setor, nome in (('S13', 'inv_pub_gg'), ('S1311', 'inv_pub_gc')):
    print(f'baixando {nome}.csv (FMI GFS)')
    url = (f'https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.STA/GFS_SOO/+/*.{setor}.*.N11A_A_T_MI.POGDP_PT.A'
           '?attributes=none')
    req = urllib.request.Request(url, headers={'User-Agent': 'MonitoraBrasil/1.0', 'Accept': 'application/vnd.sdmx.data+csv;version=2.0.0;labels=id'})
    txt = urllib.request.urlopen(req, timeout=600).read().decode('utf-8-sig')
    with open(os.path.join(DST, nome + '.csv'), 'w') as f:
        f.write(f'geo,time,{nome}\n')
        for r in sorted(csv.DictReader(io.StringIO(txt)), key=lambda r: (r['COUNTRY'], r['TIME_PERIOD'])):
            if r['OBS_VALUE'] and r['TIME_PERIOD'] and len(r['COUNTRY']) == 3:
                f.write(f"{r['COUNTRY'].lower()},{r['TIME_PERIOD']},{round(float(r['OBS_VALUE']), 4)}\n")
