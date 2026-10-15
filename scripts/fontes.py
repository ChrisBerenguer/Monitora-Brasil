"""Códigos oficiais e links (página e API) de cada indicador.

Usado por build_dados.py (campos codigo_oficial, url_fonte e url_api de indicadores.json,
exibidos na aba Metodologia do site) e por gerar_dicionario.py (docs/04).
"""

# Código oficial na fonte. Para o indicador derivado, a fórmula.
CODIGO_OFICIAL = {
    'fp_cpi_totl_zg': 'FP.CPI.TOTL.ZG', 'fr_inr_rinr': 'FR.INR.RINR', 'gc_dod_totl_gd_zs': 'GC.DOD.TOTL.GD.ZS',
    'dt_dod_dect_gn_zs': 'DT.DOD.DECT.GN.ZS', 'fi_res_totl_mo': 'FI.RES.TOTL.MO', 'bn_cab_xoka_gd_zs': 'BN.CAB.XOKA.GD.ZS',
    'ny_gdp_mktp_kd_zg': 'NY.GDP.MKTP.KD.ZG', 'sl_uem_totl_zs': 'SL.UEM.TOTL.ZS', 'ny_gdp_pcap_pp_kd': 'NY.GDP.PCAP.PP.KD',
    'nv_ind_manf_zs': 'NV.IND.MANF.ZS', 'tx_val_tech_mf_zs': 'TX.VAL.TECH.MF.ZS', 'gb_xpd_rsdv_gd_zs': 'GB.XPD.RSDV.GD.ZS',
    'pat_pm': 'IP.PAT.RESD ÷ SP.POP.TOTL × 10⁶', 'bx_klt_dinv_wd_gd_zs': 'BX.KLT.DINV.WD.GD.ZS', 'ne_trd_gnfs_zs': 'NE.TRD.GNFS.ZS',
    'si_pov_gini': 'SI.POV.GINI', 'si_dst_10th_10': 'SI.DST.10TH.10', 'si_pov_dday': 'SI.POV.DDAY', 'si_pov_umic': 'SI.POV.UMIC',
    'sg_gen_parl_zs': 'SG.GEN.PARL.ZS', 'sl_tlf_cact_fe_zs': 'SL.TLF.CACT.FE.ZS', 'ne_con_prvt_pc_kd': 'NE.CON.PRVT.PC.KD',
    'gov_wgi_va_est': 'GOV_WGI_VA.EST', 'gov_wgi_pv_est': 'GOV_WGI_PV.EST', 'gov_wgi_ge_est': 'GOV_WGI_GE.EST',
    'gov_wgi_rq_est': 'GOV_WGI_RQ.EST', 'gov_wgi_rl_est': 'GOV_WGI_RL.EST', 'gov_wgi_cc_est': 'GOV_WGI_CC.EST',
    'vc_ihr_psrc_p5': 'VC.IHR.PSRC.P5', 'gc_tax_totl_gd_zs': 'GC.TAX.TOTL.GD.ZS', 'hdi': 'HDI (PNUD)',
    'sp_dyn_le00_in': 'SP.DYN.LE00.IN', 'sh_h2o_smdw_zs': 'SH.H2O.SMDW.ZS', 'sh_sta_smss_zs': 'SH.STA.SMSS.ZS',
    'eg_elc_accs_zs': 'EG.ELC.ACCS.ZS', 'se_xpd_totl_gd_zs': 'SE.XPD.TOTL.GD.ZS', 'sh_xpd_chex_gd_zs': 'SH.XPD.CHEX.GD.ZS',
    'en_ghg_co2_pc_ce_ar5': 'EN.GHG.CO2.PC.CE.AR5', 'ag_lnd_frst_zs': 'AG.LND.FRST.ZS', 'sp_pop_dpnd_ol': 'SP.POP.DPND.OL',
}

API_BM = 'https://api.worldbank.org/v2/country/BRA/indicator/{}?format=json&per_page=100'
PAGINA_BM = 'https://data.worldbank.org/indicator/{}'
WGI = 'https://www.worldbank.org/en/publication/worldwide-governance-indicators'
HDR_DADOS = 'https://hdr.undp.org/data-center/documentation-and-downloads'
HDR_API = 'https://prism.hdrdata.org/docs'


def links(ind_id):
    """Devolve (url_fonte, url_api) do indicador. A API do Banco Mundial já vem filtrada para o Brasil."""
    if ind_id == 'hdi':
        return HDR_DADOS, HDR_API
    code = 'IP.PAT.RESD' if ind_id == 'pat_pm' else CODIGO_OFICIAL[ind_id]
    if code.startswith('GOV_WGI'):
        return WGI, API_BM.format(code) + '&source=3'
    return PAGINA_BM.format(code), API_BM.format(code)
