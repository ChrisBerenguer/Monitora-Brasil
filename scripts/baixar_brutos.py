"""Baixa as séries brutas usadas pelo painel para a pasta brutos/.
Fonte: espelho do World Development Indicators (Banco Mundial) e do Gapminder mantido em github.com/open-numbers.
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
