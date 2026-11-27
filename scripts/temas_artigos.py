"""Temas da lupa de artigos científicos: o que buscar na OpenAlex para cada cartão do site.

Cada tema tem: o que o cartão mostra (vai para a IA como contexto), a busca em inglês e a busca em
português. As buscas são por palavras no título e no resumo; termos curtos e específicos funcionam
melhor que frases. Para acrescentar um cartão: crie a chave aqui e ligue-a em temaDoCartao() no
site/assets/js/app.js.
"""

# chave: (o que o cartão mostra, busca em inglês, busca em português)
CARTOES = {
    # Visão geral e grupos de países: o escore do Brasil
    'posicao': ('A posição do Brasil entre as economias do mundo num escore que junta estabilidade macroeconômica, estrutura produtiva, social, instituições e bem-estar.',
                'Brazil economic development comparative performance emerging economies', 'desenvolvimento econômico Brasil comparação internacional'),
    'placar': ('A comparação entre mandatos presidenciais brasileiros nos indicadores econômicos, sociais e institucionais.',
               'Brazil presidential administrations economic performance comparison', 'governos presidenciais Brasil desempenho econômico comparação'),
    'evolucao': ('A evolução do escore de desenvolvimento do Brasil ao longo das décadas.',
                 'Brazil long-run economic growth stagnation middle income trap', 'Brasil crescimento econômico longo prazo armadilha da renda média'),
    'decomp': ('Quais temas (macroeconomia, produção, social, instituições, bem-estar) puxam o escore do Brasil para cima ou para baixo.',
               'Brazil development determinants institutions productivity inequality', 'Brasil determinantes do desenvolvimento instituições produtividade desigualdade'),
    'ranking': ('O Brasil comparado com outros países no último ano, indicador por indicador.',
                'Brazil cross-country comparison development indicators Latin America', 'Brasil comparação entre países indicadores América Latina'),
    'escore': ('O escore médio de cada grupo de países (renda média-alta, América Latina, BRICS) comparado com o Brasil.',
               'upper middle income countries convergence growth Latin America BRICS', 'países de renda média convergência crescimento América Latina BRICS'),
    'estatisticas': ('Estatísticas de cada grupo de países comparado com o Brasil.',
                     'emerging markets development indicators comparison', 'economias emergentes indicadores de desenvolvimento'),
    # Vida do Cidadão
    'cb-hoje': ('O preço atual da cesta básica, da gasolina, do etanol, do diesel e do gás de cozinha no Brasil, e a variação em 12 meses descontada a inflação.',
                'Brazil food prices fuel prices cost of living households', 'custo de vida cesta básica preço combustíveis Brasil'),
    'cb-poder': ('Quanto um salário mínimo compra de cesta básica, gasolina e gás de cozinha em cada mandato.',
                 'Brazil minimum wage purchasing power food basket', 'salário mínimo poder de compra cesta básica Brasil'),
    'ic-tabela': ('A inflação de cada categoria de consumo do IPCA (alimentação, habitação, vestuário, transportes, saúde, educação etc.) e o poder de compra do salário mínimo em cada uma.',
                  'Brazil inflation components relative prices consumer price index IPCA', 'inflação por grupos IPCA preços relativos Brasil'),
    'cb-renda': ('A renda domiciliar per capita (PNAD Contínua) e o salário mínimo real ao longo do tempo.',
                 'Brazil household income per capita minimum wage inequality PNAD', 'renda domiciliar per capita salário mínimo PNAD Brasil'),
    'cb-ganho': ('O ganho real do salário mínimo acima da inflação em cada mandato e a política de valorização do salário mínimo.',
                 'Brazil minimum wage valorization policy real increase effects', 'política de valorização do salário mínimo efeitos Brasil'),
    'bf-tabela': ('Quantas famílias entraram e saíram do Bolsa Família (e do Auxílio Brasil) em cada mandato e ano, contadas pelos pagamentos.',
                  'Bolsa Familia program exit entry beneficiaries Brazil cash transfer', 'Bolsa Família saída do programa beneficiários regra de proteção'),
    'bf-serie': ('Entradas e saídas mensais de famílias do Bolsa Família e o total de famílias atendidas.',
                 'Bolsa Familia coverage expansion Auxilio Brasil cash transfer targeting', 'Bolsa Família cobertura Auxílio Brasil focalização Cadastro Único'),
    # Estatais e companhias abertas
    'est-total': ('O lucro líquido das estatais federais brasileiras (Petrobras, bancos públicos, Eletrobras etc.), sem vendas de ativos.',
                  'Brazilian state-owned enterprises profitability performance Petrobras', 'empresas estatais federais lucro desempenho Brasil'),
    'est-tabela': ('O resultado de cada empresa estatal federal brasileira.',
                   'state-owned enterprises Brazil governance performance law 13303', 'estatais Lei das Estatais governança resultado'),
    'emp-total': ('O lucro das companhias abertas brasileiras, corrigido pela inflação.',
                  'Brazil listed firms profitability corporate earnings', 'lucratividade companhias abertas Brasil B3'),
    'emp-setor': ('O lucro das companhias abertas brasileiras por setor da economia.',
                  'Brazil firm profitability by sector industry returns', 'rentabilidade setorial empresas brasileiras'),
    'emp-cias': ('O lucro de cada companhia aberta brasileira.',
                 'Brazilian companies financial performance earnings determinants', 'desempenho financeiro empresas brasileiras determinantes do lucro'),
    # Indústria
    'ind-cat': ('O crescimento de cada categoria da economia brasileira (agropecuária, indústria, serviços) nas Contas Nacionais.',
                'Brazil sectoral growth agriculture industry services GDP', 'crescimento setorial agropecuária indústria serviços PIB Brasil'),
    'ind-tabela': ('O crescimento de cada segmento da indústria e dos serviços no Brasil.',
                   'Brazil deindustrialization manufacturing growth sectors', 'desindustrialização Brasil indústria de transformação crescimento'),
    # Leis e votação
    'consultas': ('Consultas públicas do Senado (e-Cidadania) e enquetes da Câmara em que cidadãos opinam sobre projetos de lei.',
                  'e-participation Brazil Congress online public consultation e-Cidadania', 'participação digital consulta pública e-Cidadania Congresso'),
    'leis-lista': ('As votações nominais no Plenário da Câmara dos Deputados e o resultado de cada uma.',
                   'Brazil Chamber of Deputies roll call votes legislative behavior', 'votações nominais Câmara dos Deputados comportamento legislativo'),
    'leis-votos': ('Como votou cada deputado e cada partido numa votação da Câmara dos Deputados.',
                   'Brazil party discipline roll call voting coalition presidentialism', 'disciplina partidária votações presidencialismo de coalizão'),
    'leis-deputado': ('O histórico de votos de um deputado federal e o alinhamento com o governo.',
                      'Brazil deputies voting alignment government coalition', 'alinhamento deputados governo votações Câmara'),
}

# Indicadores do escore (aba Séries, Grupos de países): a busca leva o nome do indicador
INDICADORES = {
    'fp_cpi_totl_zg': ('inflation Brazil monetary policy', 'inflação Brasil política monetária'),
    'fr_inr_rinr': ('real interest rate Brazil high interest rates', 'juros reais elevados Brasil Selic'),
    'gc_dod_totl_gd_zs': ('Brazil public debt fiscal sustainability', 'dívida pública Brasil sustentabilidade fiscal'),
    'dt_dod_dect_gn_zs': ('Brazil external debt vulnerability', 'dívida externa Brasil vulnerabilidade'),
    'fi_res_totl_mo': ('Brazil international reserves accumulation', 'reservas internacionais Brasil'),
    'bn_cab_xoka_gd_zs': ('Brazil current account balance external sector', 'conta corrente balanço de pagamentos Brasil'),
    'ggxonlb_g01_gdp_pt': ('Brazil primary fiscal balance fiscal rule spending cap', 'resultado primário Brasil regra fiscal teto de gastos arcabouço'),
    'ny_gdp_mktp_kd_zg': ('Brazil GDP growth recession recovery', 'crescimento do PIB Brasil recessão'),
    'sl_uem_totl_zs': ('Brazil unemployment labor market', 'desemprego Brasil mercado de trabalho'),
    'ny_gdp_pcap_pp_kd': ('Brazil income per capita productivity growth', 'renda per capita produtividade Brasil'),
    'nv_ind_manf_zs': ('Brazil deindustrialization manufacturing share', 'desindustrialização Brasil participação da indústria'),
    'tx_val_tech_mf_zs': ('Brazil high-technology exports competitiveness', 'exportações de alta tecnologia Brasil competitividade'),
    'gb_xpd_rsdv_gd_zs': ('Brazil research and development expenditure innovation', 'gasto em pesquisa e desenvolvimento inovação Brasil'),
    'pat_pm': ('Brazil patents innovation system', 'patentes inovação Brasil'),
    'bx_klt_dinv_wd_gd_zs': ('foreign direct investment Brazil determinants', 'investimento estrangeiro direto Brasil determinantes'),
    'ne_trd_gnfs_zs': ('Brazil trade openness protectionism', 'abertura comercial Brasil protecionismo'),
    'si_pov_gini': ('Brazil income inequality Gini decline', 'desigualdade de renda Brasil Gini'),
    'si_dst_10th_10': ('Brazil top income shares concentration', 'concentração de renda topo Brasil'),
    'si_pov_dday': ('Brazil extreme poverty reduction', 'extrema pobreza Brasil redução'),
    'si_pov_umic': ('Brazil poverty dynamics social policy', 'pobreza Brasil políticas sociais'),
    'sg_gen_parl_zs': ('women political representation Brazil Congress gender quotas', 'representação feminina política Brasil cotas de gênero'),
    'sl_tlf_cact_fe_zs': ('female labor force participation Brazil', 'participação feminina mercado de trabalho Brasil'),
    'ne_con_prvt_pc_kd': ('Brazil household consumption credit', 'consumo das famílias Brasil crédito'),
    'gov_wgi_va_est': ('Brazil democracy accountability civil liberties', 'democracia accountability Brasil'),
    'gov_wgi_pv_est': ('Brazil political instability polarization', 'instabilidade política polarização Brasil'),
    'gov_wgi_ge_est': ('Brazil government effectiveness state capacity bureaucracy', 'capacidade estatal efetividade do governo Brasil'),
    'gov_wgi_rq_est': ('Brazil regulatory quality business environment', 'qualidade regulatória ambiente de negócios Brasil'),
    'gov_wgi_rl_est': ('Brazil rule of law judiciary', 'Estado de direito Judiciário Brasil'),
    'gov_wgi_cc_est': ('Brazil corruption control Lava Jato', 'corrupção controle Brasil Lava Jato'),
    'vc_ihr_psrc_p5': ('Brazil homicide rates violence', 'homicídios Brasil violência'),
    'gc_tax_totl_gd_zs': ('Brazil tax burden tax reform', 'carga tributária Brasil reforma tributária'),
    'carga_trib_total': ('Brazil tax burden total tax revenue GDP comparison', 'carga tributária bruta Brasil evolução'),
    'inv_pub_gg': ('Brazil public investment decline infrastructure fiscal', 'investimento público Brasil queda infraestrutura'),
    'inv_pub_gc': ('Brazil federal public investment spending cap fiscal rule', 'investimento federal teto de gastos despesas discricionárias'),
    'hdi': ('Brazil human development index', 'índice de desenvolvimento humano Brasil'),
    'sp_dyn_le00_in': ('Brazil life expectancy mortality', 'expectativa de vida Brasil mortalidade'),
    'sh_h2o_smdw_zs': ('Brazil drinking water access', 'acesso à água potável Brasil'),
    'sh_sta_smss_zs': ('Brazil sanitation sewage coverage legal framework', 'saneamento básico Brasil marco legal'),
    'eg_elc_accs_zs': ('Brazil electricity access Luz para Todos', 'acesso à energia elétrica Luz para Todos'),
    'se_xpd_totl_gd_zs': ('Brazil public education spending outcomes', 'gasto público em educação Brasil resultados'),
    'sh_xpd_chex_gd_zs': ('Brazil health expenditure SUS financing', 'gasto em saúde SUS financiamento'),
    'en_ghg_co2_pc_ce_ar5': ('Brazil greenhouse gas emissions', 'emissões de gases de efeito estufa Brasil'),
    'ag_lnd_frst_zs': ('Brazil deforestation Amazon forest cover', 'desmatamento Amazônia cobertura florestal'),
    'sp_pop_dpnd_ol': ('Brazil population aging pension', 'envelhecimento populacional Brasil previdência'),
}

# Grupos do IPCA (cartão "Preços da categoria ao longo do tempo"; itens usam o grupo deles)
IPCA = {
    '7169': ('Brazil inflation IPCA consumer prices', 'inflação IPCA Brasil'),
    '7170': ('Brazil food inflation prices', 'inflação de alimentos Brasil'),
    '7445': ('Brazil housing costs electricity tariffs rent', 'custo de moradia tarifa de energia aluguel Brasil'),
    '7486': ('Brazil household appliances durable goods prices', 'preços eletrodomésticos bens duráveis Brasil'),
    '7558': ('Brazil apparel clothing prices imports', 'preços vestuário Brasil importações'),
    '7625': ('Brazil fuel prices Petrobras pricing policy transport', 'preço combustíveis política de preços Petrobras transporte'),
    '7660': ('Brazil health care costs private health insurance drug prices', 'planos de saúde preços medicamentos Brasil'),
    '7712': ('Brazil services inflation personal services', 'inflação de serviços Brasil'),
    '7766': ('Brazil education costs private school tuition', 'mensalidades escolares custo educação Brasil'),
    '7786': ('Brazil telecommunications prices internet', 'preços telecomunicações internet Brasil'),
}

# Itens de consumo do cartão "Preço ao longo do tempo"
CONSUMO = {
    'cesta': ('Brazil food basket prices DIEESE', 'cesta básica preços DIEESE'),
    'gasolina': ('Brazil gasoline prices Petrobras pricing policy', 'preço da gasolina política de preços Petrobras'),
    'etanol': ('Brazil ethanol prices sugarcane', 'preço do etanol Brasil'),
    'diesel': ('Brazil diesel prices truckers', 'preço do diesel Brasil caminhoneiros'),
    'gas': ('Brazil LPG cooking gas prices', 'gás de cozinha GLP preço Brasil'),
}


def todos(indicadores_nomes):
    """Todos os temas: chave -> (contexto, busca em inglês, busca em português)."""
    t = dict(CARTOES)
    for k, (en, pt) in INDICADORES.items():
        nome = indicadores_nomes.get(k, k)
        t[f'ind:{k}'] = (f'O indicador "{nome}" do Brasil ao longo do tempo e comparado com outros países.', en, pt)
    for k, (en, pt) in IPCA.items():
        t[f'ipca:{k}'] = ('A variação de preços desta categoria do IPCA no Brasil, comparada com a inflação geral e o salário mínimo.', en, pt)
    for k, (en, pt) in CONSUMO.items():
        t[f'cb:{k}'] = ('O preço deste item de consumo no Brasil ao longo do tempo, descontada a inflação.', en, pt)
    return t
