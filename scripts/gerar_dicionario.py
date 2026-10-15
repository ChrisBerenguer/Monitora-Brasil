"""Gera docs/04-dicionario-de-indicadores.md a partir de dados/indicadores.json e dados/series.json.

Uso (na raiz do repositório): python scripts/gerar_dicionario.py
As definições em português abaixo são resumos das definições oficiais do Banco Mundial / PNUD.
"""
import json, os
from collections import defaultdict

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = lambda *p: os.path.join(BASE, *p)

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
    'vc_ihr_psrc_p5': 'VC.IHR.PSRC.P5', 'gc_tax_totl_gd_zs': 'GC.TAX.TOTL.GD.ZS', 'hdi': 'HDI (PNUD, via Gapminder)',
    'sp_dyn_le00_in': 'SP.DYN.LE00.IN', 'sh_h2o_smdw_zs': 'SH.H2O.SMDW.ZS', 'sh_sta_smss_zs': 'SH.STA.SMSS.ZS',
    'eg_elc_accs_zs': 'EG.ELC.ACCS.ZS', 'se_xpd_totl_gd_zs': 'SE.XPD.TOTL.GD.ZS', 'sh_xpd_chex_gd_zs': 'SH.XPD.CHEX.GD.ZS',
    'en_ghg_co2_pc_ce_ar5': 'EN.GHG.CO2.PC.CE.AR5', 'ag_lnd_frst_zs': 'AG.LND.FRST.ZS', 'sp_pop_dpnd_ol': 'SP.POP.DPND.OL',
}

DEF = {
    'fp_cpi_totl_zg': 'Variação anual do índice de preços ao consumidor: quanto custa a mais, de um ano para o outro, uma cesta típica de bens e serviços das famílias.',
    'fr_inr_rinr': 'Taxa de juros de empréstimo bancário descontada a inflação medida pelo deflator do PIB. Não é a Selic: reflete o custo do crédito ao setor privado.',
    'gc_dod_totl_gd_zs': 'Estoque bruto de obrigações do governo central (títulos, empréstimos e outros passivos de dívida) em proporção do PIB. Não inclui estados e municípios.',
    'dt_dod_dect_gn_zs': 'Dívida devida a não residentes (pública e privada, de curto e longo prazo) em proporção da Renda Nacional Bruta.',
    'fi_res_totl_mo': 'Quantos meses de importações de bens e serviços as reservas internacionais (ouro, divisas, DES, posição no FMI) conseguiriam pagar.',
    'bn_cab_xoka_gd_zs': 'Saldo das transações correntes com o exterior (bens, serviços, renda primária e secundária) em % do PIB. Positivo = o país empresta ao resto do mundo.',
    'ny_gdp_mktp_kd_zg': 'Variação anual do PIB a preços constantes, isto é, descontada a inflação.',
    'sl_uem_totl_zs': 'Parcela da força de trabalho sem emprego e procurando trabalho. Estimativa modelada da OIT, comparável entre países.',
    'ny_gdp_pcap_pp_kd': 'PIB dividido pela população, convertido em dólares internacionais de 2021 por paridade de poder de compra (PPC), que corrige diferenças de preços entre países.',
    'nv_ind_manf_zs': 'Valor adicionado da indústria de transformação (manufatura) como parcela do PIB.',
    'tx_val_tech_mf_zs': 'Exportações de produtos de alta intensidade de P&D (aeroespacial, computadores, fármacos, instrumentos científicos, máquinas elétricas) como % das exportações de manufaturados.',
    'gb_xpd_rsdv_gd_zs': 'Gasto bruto doméstico em pesquisa e desenvolvimento (público e privado) como % do PIB.',
    'pat_pm': 'Pedidos de patente feitos por residentes do país, por milhão de habitantes. Calculado neste projeto a partir do total de pedidos e da população.',
    'bx_klt_dinv_wd_gd_zs': 'Entrada líquida de investimento direto estrangeiro (participação duradoura ≥ 10% em empresas) como % do PIB.',
    'ne_trd_gnfs_zs': 'Soma de exportações e importações de bens e serviços como % do PIB. Mede a integração da economia ao comércio internacional.',
    'si_pov_gini': 'Índice de Gini da renda ou do consumo domiciliar per capita, de 0 (todos iguais) a 100 (uma pessoa concentra tudo).',
    'si_dst_10th_10': 'Fatia da renda (ou consumo) total apropriada pelos 10% mais ricos da população.',
    'si_pov_dday': 'Parcela da população vivendo com menos de US$ 3,00 por dia (PPC de 2021). É a linha internacional de pobreza extrema adotada pelo Banco Mundial em 2025.',
    'si_pov_umic': 'Parcela da população vivendo com menos de US$ 8,30 por dia (PPC de 2021). É a linha de pobreza típica de países de renda média-alta, grupo do Brasil.',
    'sg_gen_parl_zs': 'Percentual das cadeiras da câmara baixa (ou única) do parlamento ocupadas por mulheres.',
    'sl_tlf_cact_fe_zs': 'Percentual das mulheres com 15 anos ou mais que estão empregadas ou procurando emprego. Estimativa modelada da OIT.',
    'ne_con_prvt_pc_kd': 'Gasto de consumo final das famílias (e instituições sem fins lucrativos) por habitante, em dólares constantes de 2015.',
    'gov_wgi_va_est': 'Worldwide Governance Indicators: percepção sobre a capacidade dos cidadãos de escolher o governo, liberdade de expressão, de associação e de imprensa.',
    'gov_wgi_pv_est': 'WGI: percepção da probabilidade de instabilidade política e de violência com motivação política, inclusive terrorismo.',
    'gov_wgi_ge_est': 'WGI: percepção da qualidade dos serviços públicos e do serviço civil, e da credibilidade e execução das políticas públicas.',
    'gov_wgi_rq_est': 'WGI: percepção da capacidade do governo de formular e aplicar regulações que favoreçam o setor privado.',
    'gov_wgi_rl_est': 'WGI: percepção de confiança nas regras da sociedade, na execução de contratos, nos direitos de propriedade, na polícia e nos tribunais.',
    'gov_wgi_cc_est': 'WGI: percepção de quanto o poder público é usado para ganho privado, incluindo pequena e grande corrupção e captura do Estado.',
    'vc_ihr_psrc_p5': 'Mortes causadas intencionalmente por outra pessoa, por 100 mil habitantes. Dados do UNODC a partir de registros policiais e de saúde.',
    'gc_tax_totl_gd_zs': 'Receita de tributos do governo central como % do PIB. Não inclui contribuições sociais nem tributos subnacionais, por isso fica abaixo da carga tributária total brasileira (~33% do PIB).',
    'hdi': 'Índice de Desenvolvimento Humano: média geométrica de três dimensões normalizadas (vida longa e saudável, educação e padrão de vida). Vai de 0 a 1.',
    'sp_dyn_le00_in': 'Número de anos que um recém-nascido viveria se as taxas de mortalidade do ano se mantivessem por toda a sua vida.',
    'sh_h2o_smdw_zs': 'População com água de fonte melhorada, disponível em casa, quando necessário, e livre de contaminação.',
    'sh_sta_smss_zs': 'População com instalação sanitária melhorada, não compartilhada, cujos dejetos são tratados com segurança.',
    'eg_elc_accs_zs': 'Parcela da população com acesso a eletricidade.',
    'se_xpd_totl_gd_zs': 'Gasto do governo geral (todas as esferas) com educação, em % do PIB.',
    'sh_xpd_chex_gd_zs': 'Gasto corrente total com saúde (público e privado) em % do PIB.',
    'en_ghg_co2_pc_ce_ar5': 'Emissões de dióxido de carbono por habitante, excluindo uso da terra e florestas (LULUCF). Por isso não capta o desmatamento, a maior fonte de emissão brasileira.',
    'ag_lnd_frst_zs': 'Área coberta por florestas (árvores com mais de 5 m em áreas acima de 0,5 ha) como % do território.',
    'sp_pop_dpnd_ol': 'População de 65 anos ou mais para cada 100 pessoas de 15 a 64 anos. Indica a pressão demográfica sobre a previdência.',
}

TEMAS = {'macro': 'Estabilidade macroeconômica', 'prod': 'Estrutura produtiva e inovação', 'social': 'Coesão social e distribuição',
         'inst': 'Estado, instituições e segurança', 'bem': 'Bem-estar e sustentabilidade'}

def fmt(v):
    if v is None: return '—'
    if abs(v) >= 1000: return f'{v:,.0f}'.replace(',', '.')
    return f'{v:.2f}'.replace('.', ',')

ind = json.load(open(D('dados', 'indicadores.json')))
ser = json.load(open(D('dados', 'series.json')))
br = defaultdict(dict)
for r in ser:
    if r['pais'] == 'bra': br[r['ind']][r['ano']] = r['valor']

L = ['# 04 · Dicionário de indicadores', '',
     'Gerado por `scripts/gerar_dicionario.py`. Para cada indicador: código interno (nome do campo `ind` nos dados), código oficial da fonte, definição, unidade, sentido usado no escore e a cobertura do Brasil na base (1995–2025).', '',
     '**Sentido** diz como o indicador entra no escore: *maior é melhor*, *menor é melhor*, *mais perto de X é melhor* (distância de um alvo) ou *contexto* (aparece no painel, mas não entra no escore).', '']
for tid, tnome in TEMAS.items():
    L += [f'## {tnome}', '']
    for i in [x for x in ind if x['tema'] == tid]:
        s = br.get(i['id'], {})
        anos = sorted(s)
        cob = f"{len(anos)} anos com dado ({anos[0]}–{anos[-1]})" if anos else 'sem dado para o Brasil'
        prim = f"{fmt(s[anos[0]])} em {anos[0]}" if anos else '—'
        ult = f"{fmt(s[anos[-1]])} em {anos[-1]}" if anos else '—'
        L += [f"### {i['nome']}", '',
              f"- **Código interno:** `{i['id']}`",
              f"- **Código oficial:** `{CODIGO_OFICIAL.get(i['id'], '—')}`",
              f"- **Definição:** {DEF.get(i['id'], '—')}",
              f"- **Unidade:** {i['unidade']}",
              f"- **Sentido no escore:** {i['direcao']}",
              f"- **Fonte:** {i['fonte']}",
              f"- **Último ano na base (qualquer país):** {i['ultimo_ano']}",
              f"- **Brasil:** {cob}. Primeiro valor: {prim}. Último valor: {ult}.", '']
        ex = i.get('explicacao')
        if ex:
            L += ['**Em linguagem simples**', '',
                  f"- *O que é:* {ex['o_que_e']}",
                  f"- *Como ler:* {ex['como_ler']}",
                  f"- *Por que importa:* {ex['por_que_importa']}"]
            if ex.get('atencao'): L.append(f"- *Atenção:* {ex['atencao']}")
            L.append('')
open(D('docs', '04-dicionario-de-indicadores.md'), 'w', encoding='utf-8').write('\n'.join(L))
print('ok', len(ind))
