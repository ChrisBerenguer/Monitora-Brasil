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
    'ggxonlb_g01_gdp_pt': 'GGXONLB_G01_GDP_PT (FMI)',
    'carga_trib_total': 'TAX_REV, S13, _T, PT_B1GQ (OCDE, DF_RSGLOBAL)',
    'inv_pub_gg': 'N11A_A_T_MI, S13, POGDP_PT (FMI, GFS_SOO)',
    'inv_pub_gc': 'N11A_A_T_MI, S1311, POGDP_PT (FMI, GFS_SOO)',
}

API_BM = 'https://api.worldbank.org/v2/country/BRA/indicator/{}?format=json&per_page=100'
PAGINA_BM = 'https://data.worldbank.org/indicator/{}'
WGI = 'https://www.worldbank.org/en/publication/worldwide-governance-indicators'
HDR_DADOS = 'https://hdr.undp.org/data-center/documentation-and-downloads'
HDR_API = 'https://prism.hdrdata.org/docs'


def links(ind_id):
    """Devolve (url_fonte, url_api) do indicador. As APIs já vêm filtradas para o Brasil."""
    if ind_id == 'hdi':
        return HDR_DADOS, HDR_API
    if ind_id == 'ggxonlb_g01_gdp_pt':
        return ('https://www.imf.org/external/datamapper/GGXONLB_G01_GDP_PT@FM/BRA',
                'https://www.imf.org/external/datamapper/api/v1/GGXONLB_G01_GDP_PT/BRA')
    if ind_id == 'carga_trib_total':
        return ('https://data-explorer.oecd.org/vis?df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_REV_COMP_GLOBAL%40DF_RSGLOBAL&df[ag]=OECD.CTP.TPS',
                'https://sdmx.oecd.org/public/rest/data/OECD.CTP.TPS,DSD_REV_COMP_GLOBAL@DF_RSGLOBAL,/BRA.TAX_REV.S13._T._T.PT_B1GQ.A?format=csvfilewithlabels')
    if ind_id in ('inv_pub_gg', 'inv_pub_gc'):
        setor = 'S13' if ind_id == 'inv_pub_gg' else 'S1311'
        return ('https://data.imf.org/en/datasets/IMF.STA:GFS_SOO',
                f'https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.STA/GFS_SOO/+/BRA.{setor}.*.N11A_A_T_MI.POGDP_PT.A')
    code = 'IP.PAT.RESD' if ind_id == 'pat_pm' else CODIGO_OFICIAL[ind_id]
    if code.startswith('GOV_WGI'):
        return WGI, API_BM.format(code) + '&source=3'
    return PAGINA_BM.format(code), API_BM.format(code)
