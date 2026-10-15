# 04 · Dicionário de indicadores

Gerado por `scripts/gerar_dicionario.py`. Para cada indicador: código interno (nome do campo `ind` nos dados), código oficial da fonte, definição, unidade, sentido usado no escore e a cobertura do Brasil na base (1995–2025).

**Sentido** diz como o indicador entra no escore: *maior é melhor*, *menor é melhor*, *mais perto de X é melhor* (distância de um alvo) ou *contexto* (aparece no painel, mas não entra no escore).

## Estabilidade macroeconômica

### Inflação (IPC)

- **Código interno:** `fp_cpi_totl_zg`
- **Código oficial:** `FP.CPI.TOTL.ZG`
- **Definição:** Variação anual do índice de preços ao consumidor: quanto custa a mais, de um ano para o outro, uma cesta típica de bens e serviços das famílias.
- **Unidade:** % a.a.
- **Sentido no escore:** mais perto de 3 é melhor
- **Fonte:** Banco Mundial (FMI)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 31 anos com dado (1995–2025). Primeiro valor: 66,01 em 1995. Último valor: 5,02 em 2025.

### Juros reais

- **Código interno:** `fr_inr_rinr`
- **Código oficial:** `FR.INR.RINR`
- **Definição:** Taxa de juros de empréstimo bancário descontada a inflação medida pelo deflator do PIB. Não é a Selic: reflete o custo do crédito ao setor privado.
- **Unidade:** % a.a.
- **Sentido no escore:** mais perto de 2 é melhor
- **Fonte:** Banco Mundial (FMI)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 29 anos com dado (1997–2025). Primeiro valor: 65,41 em 1997. Último valor: 37,46 em 2025.

### Dívida do governo central

- **Código interno:** `gc_dod_totl_gd_zs`
- **Código oficial:** `GC.DOD.TOTL.GD.ZS`
- **Definição:** Estoque bruto de obrigações do governo central (títulos, empréstimos e outros passivos de dívida) em proporção do PIB. Não inclui estados e municípios.
- **Unidade:** % PIB
- **Sentido no escore:** menor é melhor
- **Fonte:** Banco Mundial (FMI)
- **Último ano na base (qualquer país):** 2024
- **Brasil:** 15 anos com dado (2010–2024). Primeiro valor: 61,32 em 2010. Último valor: 81,86 em 2024.

### Dívida externa

- **Código interno:** `dt_dod_dect_gn_zs`
- **Código oficial:** `DT.DOD.DECT.GN.ZS`
- **Definição:** Dívida devida a não residentes (pública e privada, de curto e longo prazo) em proporção da Renda Nacional Bruta.
- **Unidade:** % RNB
- **Sentido no escore:** menor é melhor
- **Fonte:** Banco Mundial (IDS)
- **Último ano na base (qualquer país):** 2024
- **Brasil:** 30 anos com dado (1995–2024). Primeiro valor: 21,22 em 1995. Último valor: 28,66 em 2024.

### Reservas internacionais

- **Código interno:** `fi_res_totl_mo`
- **Código oficial:** `FI.RES.TOTL.MO`
- **Definição:** Quantos meses de importações de bens e serviços as reservas internacionais (ouro, divisas, DES, posição no FMI) conseguiriam pagar.
- **Unidade:** meses de importação
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (FMI)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 31 anos com dado (1995–2025). Primeiro valor: 7,99 em 1995. Último valor: 8,42 em 2025.

### Saldo em conta corrente

- **Código interno:** `bn_cab_xoka_gd_zs`
- **Código oficial:** `BN.CAB.XOKA.GD.ZS`
- **Definição:** Saldo das transações correntes com o exterior (bens, serviços, renda primária e secundária) em % do PIB. Positivo = o país empresta ao resto do mundo.
- **Unidade:** % PIB
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (FMI)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 31 anos com dado (1995–2025). Primeiro valor: -2,36 em 1995. Último valor: -2,93 em 2025.

### Crescimento real do PIB

- **Código interno:** `ny_gdp_mktp_kd_zg`
- **Código oficial:** `NY.GDP.MKTP.KD.ZG`
- **Definição:** Variação anual do PIB a preços constantes, isto é, descontada a inflação.
- **Unidade:** % a.a.
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 31 anos com dado (1995–2025). Primeiro valor: 4,22 em 1995. Último valor: 2,29 em 2025.

### Desemprego

- **Código interno:** `sl_uem_totl_zs`
- **Código oficial:** `SL.UEM.TOTL.ZS`
- **Definição:** Parcela da força de trabalho sem emprego e procurando trabalho. Estimativa modelada da OIT, comparável entre países.
- **Unidade:** % força de trabalho
- **Sentido no escore:** menor é melhor
- **Fonte:** Banco Mundial (OIT)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 31 anos com dado (1995–2025). Primeiro valor: 7,09 em 1995. Último valor: 5,97 em 2025.

## Estrutura produtiva e inovação

### PIB per capita (PPC)

- **Código interno:** `ny_gdp_pcap_pp_kd`
- **Código oficial:** `NY.GDP.PCAP.PP.KD`
- **Definição:** PIB dividido pela população, convertido em dólares internacionais de 2021 por paridade de poder de compra (PPC), que corrige diferenças de preços entre países.
- **Unidade:** US$ const. 2021
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (ICP)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 31 anos com dado (1995–2025). Primeiro valor: 13.550 em 1995. Último valor: 20.025 em 2025.

### Indústria de transformação

- **Código interno:** `nv_ind_manf_zs`
- **Código oficial:** `NV.IND.MANF.ZS`
- **Definição:** Valor adicionado da indústria de transformação (manufatura) como parcela do PIB.
- **Unidade:** % PIB
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 31 anos com dado (1995–2025). Primeiro valor: 14,54 em 1995. Último valor: 11,77 em 2025.

### Exportações de alta tecnologia

- **Código interno:** `tx_val_tech_mf_zs`
- **Código oficial:** `TX.VAL.TECH.MF.ZS`
- **Definição:** Exportações de produtos de alta intensidade de P&D (aeroespacial, computadores, fármacos, instrumentos científicos, máquinas elétricas) como % das exportações de manufaturados.
- **Unidade:** % export. manufat.
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (Comtrade)
- **Último ano na base (qualquer país):** 2024
- **Brasil:** 18 anos com dado (2007–2024). Primeiro valor: 12,63 em 2007. Último valor: 11,11 em 2024.

### Gasto em P&D

- **Código interno:** `gb_xpd_rsdv_gd_zs`
- **Código oficial:** `GB.XPD.RSDV.GD.ZS`
- **Definição:** Gasto bruto doméstico em pesquisa e desenvolvimento (público e privado) como % do PIB.
- **Unidade:** % PIB
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (UNESCO)
- **Último ano na base (qualquer país):** 2024
- **Brasil:** 24 anos com dado (2000–2023). Primeiro valor: 1,05 em 2000. Último valor: 1,19 em 2023.

### Patentes de residentes

- **Código interno:** `pat_pm`
- **Código oficial:** `IP.PAT.RESD ÷ SP.POP.TOTL × 10⁶`
- **Definição:** Pedidos de patente feitos por residentes do país, por milhão de habitantes. Calculado neste projeto a partir do total de pedidos e da população.
- **Unidade:** por milhão hab.
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (OMPI)
- **Último ano na base (qualquer país):** 2024
- **Brasil:** 30 anos com dado (1995–2024). Primeiro valor: 16,74 em 1995. Último valor: 27,13 em 2024.

### Investimento direto estrangeiro

- **Código interno:** `bx_klt_dinv_wd_gd_zs`
- **Código oficial:** `BX.KLT.DINV.WD.GD.ZS`
- **Definição:** Entrada líquida de investimento direto estrangeiro (participação duradoura ≥ 10% em empresas) como % do PIB.
- **Unidade:** % PIB
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (FMI)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 31 anos com dado (1995–2025). Primeiro valor: 0,63 em 1995. Último valor: 3,41 em 2025.

### Abertura comercial

- **Código interno:** `ne_trd_gnfs_zs`
- **Código oficial:** `NE.TRD.GNFS.ZS`
- **Definição:** Soma de exportações e importações de bens e serviços como % do PIB. Mede a integração da economia ao comércio internacional.
- **Unidade:** % PIB
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 31 anos com dado (1995–2025). Primeiro valor: 16,98 em 1995. Último valor: 35,29 em 2025.

## Coesão social e distribuição

### Índice de Gini

- **Código interno:** `si_pov_gini`
- **Código oficial:** `SI.POV.GINI`
- **Definição:** Índice de Gini da renda ou do consumo domiciliar per capita, de 0 (todos iguais) a 100 (uma pessoa concentra tudo).
- **Unidade:** 0–100
- **Sentido no escore:** menor é melhor
- **Fonte:** Banco Mundial (PIP)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 28 anos com dado (1995–2024). Primeiro valor: 59,50 em 1995. Último valor: 50,30 em 2024.

### Renda apropriada pelos 10% mais ricos

- **Código interno:** `si_dst_10th_10`
- **Código oficial:** `SI.DST.10TH.10`
- **Definição:** Fatia da renda (ou consumo) total apropriada pelos 10% mais ricos da população.
- **Unidade:** % da renda
- **Sentido no escore:** menor é melhor
- **Fonte:** Banco Mundial (PIP)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 28 anos com dado (1995–2024). Primeiro valor: 47,50 em 1995. Último valor: 39,30 em 2024.

### Pobreza extrema (US$ 3,00/dia)

- **Código interno:** `si_pov_dday`
- **Código oficial:** `SI.POV.DDAY`
- **Definição:** Parcela da população vivendo com menos de US$ 3,00 por dia (PPC de 2021). É a linha internacional de pobreza extrema adotada pelo Banco Mundial em 2025.
- **Unidade:** % população
- **Sentido no escore:** menor é melhor
- **Fonte:** Banco Mundial (PIP)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 28 anos com dado (1995–2024). Primeiro valor: 19,50 em 1995. Último valor: 3,00 em 2024.

### Pobreza (US$ 8,30/dia)

- **Código interno:** `si_pov_umic`
- **Código oficial:** `SI.POV.UMIC`
- **Definição:** Parcela da população vivendo com menos de US$ 8,30 por dia (PPC de 2021). É a linha de pobreza típica de países de renda média-alta, grupo do Brasil.
- **Unidade:** % população
- **Sentido no escore:** menor é melhor
- **Fonte:** Banco Mundial (PIP)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 28 anos com dado (1995–2024). Primeiro valor: 54,80 em 1995. Último valor: 20,60 em 2024.

### Mulheres no parlamento

- **Código interno:** `sg_gen_parl_zs`
- **Código oficial:** `SG.GEN.PARL.ZS`
- **Definição:** Percentual das cadeiras da câmara baixa (ou única) do parlamento ocupadas por mulheres.
- **Unidade:** % cadeiras
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (UIP)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 29 anos com dado (1997–2025). Primeiro valor: 6,63 em 1997. Último valor: 18,13 em 2025.

### Participação feminina no trabalho

- **Código interno:** `sl_tlf_cact_fe_zs`
- **Código oficial:** `SL.TLF.CACT.FE.ZS`
- **Definição:** Percentual das mulheres com 15 anos ou mais que estão empregadas ou procurando emprego. Estimativa modelada da OIT.
- **Unidade:** % mulheres 15+
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (OIT)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 31 anos com dado (1995–2025). Primeiro valor: 48,92 em 1995. Último valor: 53,41 em 2025.

### Consumo das famílias per capita

- **Código interno:** `ne_con_prvt_pc_kd`
- **Código oficial:** `NE.CON.PRVT.PC.KD`
- **Definição:** Gasto de consumo final das famílias (e instituições sem fins lucrativos) por habitante, em dólares constantes de 2015.
- **Unidade:** US$ const. 2015
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 31 anos com dado (1995–2025). Primeiro valor: 3.991 em 1995. Último valor: 6.276 em 2025.

## Estado, instituições e segurança

### Voz e accountability

- **Código interno:** `gov_wgi_va_est`
- **Código oficial:** `GOV_WGI_VA.EST`
- **Definição:** Worldwide Governance Indicators: percepção sobre a capacidade dos cidadãos de escolher o governo, liberdade de expressão, de associação e de imprensa.
- **Unidade:** −2,5 a +2,5
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (WGI)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 27 anos com dado (1996–2025). Primeiro valor: 0,15 em 1996. Último valor: 0,42 em 2025.

### Estabilidade política

- **Código interno:** `gov_wgi_pv_est`
- **Código oficial:** `GOV_WGI_PV.EST`
- **Definição:** WGI: percepção da probabilidade de instabilidade política e de violência com motivação política, inclusive terrorismo.
- **Unidade:** −2,5 a +2,5
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (WGI)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 27 anos com dado (1996–2025). Primeiro valor: -0,05 em 1996. Último valor: -0,38 em 2025.

### Efetividade do governo

- **Código interno:** `gov_wgi_ge_est`
- **Código oficial:** `GOV_WGI_GE.EST`
- **Definição:** WGI: percepção da qualidade dos serviços públicos e do serviço civil, e da credibilidade e execução das políticas públicas.
- **Unidade:** −2,5 a +2,5
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (WGI)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 27 anos com dado (1996–2025). Primeiro valor: -0,05 em 1996. Último valor: -0,04 em 2025.

### Qualidade regulatória

- **Código interno:** `gov_wgi_rq_est`
- **Código oficial:** `GOV_WGI_RQ.EST`
- **Definição:** WGI: percepção da capacidade do governo de formular e aplicar regulações que favoreçam o setor privado.
- **Unidade:** −2,5 a +2,5
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (WGI)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 27 anos com dado (1996–2025). Primeiro valor: 0,04 em 1996. Último valor: -0,44 em 2025.

### Estado de direito

- **Código interno:** `gov_wgi_rl_est`
- **Código oficial:** `GOV_WGI_RL.EST`
- **Definição:** WGI: percepção de confiança nas regras da sociedade, na execução de contratos, nos direitos de propriedade, na polícia e nos tribunais.
- **Unidade:** −2,5 a +2,5
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (WGI)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 27 anos com dado (1996–2025). Primeiro valor: -0,42 em 1996. Último valor: -0,49 em 2025.

### Controle da corrupção

- **Código interno:** `gov_wgi_cc_est`
- **Código oficial:** `GOV_WGI_CC.EST`
- **Definição:** WGI: percepção de quanto o poder público é usado para ganho privado, incluindo pequena e grande corrupção e captura do Estado.
- **Unidade:** −2,5 a +2,5
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (WGI)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 27 anos com dado (1996–2025). Primeiro valor: 0,12 em 1996. Último valor: -0,38 em 2025.

### Homicídios

- **Código interno:** `vc_ihr_psrc_p5`
- **Código oficial:** `VC.IHR.PSRC.P5`
- **Definição:** Mortes causadas intencionalmente por outra pessoa, por 100 mil habitantes. Dados do UNODC a partir de registros policiais e de saúde.
- **Unidade:** por 100 mil hab.
- **Sentido no escore:** menor é melhor
- **Fonte:** Banco Mundial (UNODC)
- **Último ano na base (qualquer país):** 2023
- **Brasil:** 29 anos com dado (1995–2023). Primeiro valor: 21,02 em 1995. Último valor: 19,28 em 2023.

### Receita tributária (gov. central)

- **Código interno:** `gc_tax_totl_gd_zs`
- **Código oficial:** `GC.TAX.TOTL.GD.ZS`
- **Definição:** Receita de tributos do governo central como % do PIB. Não inclui contribuições sociais nem tributos subnacionais, por isso fica abaixo da carga tributária total brasileira (~33% do PIB).
- **Unidade:** % PIB
- **Sentido no escore:** contexto (sem escore)
- **Fonte:** Banco Mundial (FMI)
- **Último ano na base (qualquer país):** 2024
- **Brasil:** 15 anos com dado (2010–2024). Primeiro valor: 14,25 em 2010. Último valor: 15,41 em 2024.

## Bem-estar e sustentabilidade

### IDH

- **Código interno:** `hdi`
- **Código oficial:** `HDI (PNUD, via Gapminder)`
- **Definição:** Índice de Desenvolvimento Humano: média geométrica de três dimensões normalizadas (vida longa e saudável, educação e padrão de vida). Vai de 0 a 1.
- **Unidade:** 0–1
- **Sentido no escore:** maior é melhor
- **Fonte:** PNUD via Gapminder
- **Último ano na base (qualquer país):** 2023
- **Brasil:** 29 anos com dado (1995–2023). Primeiro valor: 0,67 em 1995. Último valor: 0,79 em 2023.

### Expectativa de vida

- **Código interno:** `sp_dyn_le00_in`
- **Código oficial:** `SP.DYN.LE00.IN`
- **Definição:** Número de anos que um recém-nascido viveria se as taxas de mortalidade do ano se mantivessem por toda a sua vida.
- **Unidade:** anos
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (ONU)
- **Último ano na base (qualquer país):** 2024
- **Brasil:** 30 anos com dado (1995–2024). Primeiro valor: 67,70 em 1995. Último valor: 76,02 em 2024.

### Água potável gerida com segurança

- **Código interno:** `sh_h2o_smdw_zs`
- **Código oficial:** `SH.H2O.SMDW.ZS`
- **Definição:** População com água de fonte melhorada, disponível em casa, quando necessário, e livre de contaminação.
- **Unidade:** % população
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (OMS/UNICEF)
- **Último ano na base (qualquer país):** 2024
- **Brasil:** 25 anos com dado (2000–2024). Primeiro valor: 75,78 em 2000. Último valor: 88,62 em 2024.

### Saneamento gerido com segurança

- **Código interno:** `sh_sta_smss_zs`
- **Código oficial:** `SH.STA.SMSS.ZS`
- **Definição:** População com instalação sanitária melhorada, não compartilhada, cujos dejetos são tratados com segurança.
- **Unidade:** % população
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (OMS/UNICEF)
- **Último ano na base (qualquer país):** 2024
- **Brasil:** 25 anos com dado (2000–2024). Primeiro valor: 33,68 em 2000. Último valor: 54,96 em 2024.

### Acesso à eletricidade

- **Código interno:** `eg_elc_accs_zs`
- **Código oficial:** `EG.ELC.ACCS.ZS`
- **Definição:** Parcela da população com acesso a eletricidade.
- **Unidade:** % população
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial
- **Último ano na base (qualquer país):** 2024
- **Brasil:** 30 anos com dado (1995–2024). Primeiro valor: 91,73 em 1995. Último valor: 99,80 em 2024.

### Gasto público em educação

- **Código interno:** `se_xpd_totl_gd_zs`
- **Código oficial:** `SE.XPD.TOTL.GD.ZS`
- **Definição:** Gasto do governo geral (todas as esferas) com educação, em % do PIB.
- **Unidade:** % PIB
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (UNESCO)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 25 anos com dado (1995–2022). Primeiro valor: 4,57 em 1995. Último valor: 5,62 em 2022.

### Gasto em saúde

- **Código interno:** `sh_xpd_chex_gd_zs`
- **Código oficial:** `SH.XPD.CHEX.GD.ZS`
- **Definição:** Gasto corrente total com saúde (público e privado) em % do PIB.
- **Unidade:** % PIB
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (OMS)
- **Último ano na base (qualquer país):** 2024
- **Brasil:** 24 anos com dado (2000–2023). Primeiro valor: 8,33 em 2000. Último valor: 9,73 em 2023.

### Emissões de CO₂

- **Código interno:** `en_ghg_co2_pc_ce_ar5`
- **Código oficial:** `EN.GHG.CO2.PC.CE.AR5`
- **Definição:** Emissões de dióxido de carbono por habitante, excluindo uso da terra e florestas (LULUCF). Por isso não capta o desmatamento, a maior fonte de emissão brasileira.
- **Unidade:** t per capita
- **Sentido no escore:** menor é melhor
- **Fonte:** Banco Mundial (EDGAR)
- **Último ano na base (qualquer país):** 2024
- **Brasil:** 30 anos com dado (1995–2024). Primeiro valor: 1,73 em 1995. Último valor: 2,32 em 2024.

### Cobertura florestal

- **Código interno:** `ag_lnd_frst_zs`
- **Código oficial:** `AG.LND.FRST.ZS`
- **Definição:** Área coberta por florestas (árvores com mais de 5 m em áreas acima de 0,5 ha) como % do território.
- **Unidade:** % território
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (FAO)
- **Último ano na base (qualquer país):** 2024
- **Brasil:** 30 anos com dado (1995–2024). Primeiro valor: 70,54 em 1995. Último valor: 58,55 em 2024.

### Razão de dependência de idosos

- **Código interno:** `sp_pop_dpnd_ol`
- **Código oficial:** `SP.POP.DPND.OL`
- **Definição:** População de 65 anos ou mais para cada 100 pessoas de 15 a 64 anos. Indica a pressão demográfica sobre a previdência.
- **Unidade:** % pop. 15–64
- **Sentido no escore:** contexto (sem escore)
- **Fonte:** Banco Mundial (ONU)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 31 anos com dado (1995–2025). Primeiro valor: 7,40 em 1995. Último valor: 16,61 em 2025.
