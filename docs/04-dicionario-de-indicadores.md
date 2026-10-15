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

**Em linguagem simples**

- *O que é:* Quanto os preços do dia a dia (comida, aluguel, transporte, remédios) subiram em um ano, em média. Com inflação de 5%, uma compra que custava R$ 100 passa a custar R$ 105 no ano seguinte.
- *Como ler:* Inflação alta é ruim, mas zero ou negativa também não é bom sinal. O painel considera saudável algo perto de 3% ao ano, que é a meta do Banco Central do Brasil. Quanto mais longe disso, pior.
- *Por que importa:* A inflação corrói o salário e a poupança. Quem mais perde são os mais pobres, que gastam tudo o que ganham e não têm como proteger o dinheiro em aplicações.
- *Atenção:* O Brasil viveu hiperinflação até o Plano Real, em 1994. Por isso os primeiros anos da série aparecem muito altos.

### Juros reais

- **Código interno:** `fr_inr_rinr`
- **Código oficial:** `FR.INR.RINR`
- **Definição:** Taxa de juros de empréstimo bancário descontada a inflação medida pelo deflator do PIB. Não é a Selic: reflete o custo do crédito ao setor privado.
- **Unidade:** % a.a.
- **Sentido no escore:** mais perto de 2 é melhor
- **Fonte:** Banco Mundial (FMI)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 29 anos com dado (1997–2025). Primeiro valor: 65,41 em 1997. Último valor: 37,46 em 2025.

**Em linguagem simples**

- *O que é:* Os juros descontada a inflação: quanto o dinheiro rende ou custa de verdade. Se um empréstimo cobra 12% ao ano e a inflação é de 5%, o custo real é de cerca de 7%.
- *Como ler:* Juros reais muito altos encarecem o crédito. Juros reais negativos fazem a poupança perder para a inflação. O painel considera equilibrado algo perto de 2% ao ano.
- *Por que importa:* Define quanto custa para uma família financiar uma casa ou para uma empresa investir numa máquina. Também pesa na dívida do governo.
- *Atenção:* Não é a Selic. Esta série usa a taxa média que os bancos cobram nos empréstimos, que no Brasil é muito mais alta por causa do spread bancário (a diferença entre o que o banco paga e o que cobra).

### Dívida do governo central

- **Código interno:** `gc_dod_totl_gd_zs`
- **Código oficial:** `GC.DOD.TOTL.GD.ZS`
- **Definição:** Estoque bruto de obrigações do governo central (títulos, empréstimos e outros passivos de dívida) em proporção do PIB. Não inclui estados e municípios.
- **Unidade:** % PIB
- **Sentido no escore:** menor é melhor
- **Fonte:** Banco Mundial (FMI)
- **Último ano na base (qualquer país):** 2024
- **Brasil:** 15 anos com dado (2010–2024). Primeiro valor: 61,32 em 2010. Último valor: 81,86 em 2024.

**Em linguagem simples**

- *O que é:* Quanto o governo federal deve, comparado com tudo o que o país produz em um ano (o PIB). Uma dívida de 80% do PIB equivale a quase dez meses de toda a produção do país.
- *Como ler:* Quanto maior, mais vulnerável. Preocupa sobretudo quando sobe rápido ou quando os juros sobre ela são altos.
- *Por que importa:* Um governo muito endividado gasta mais com juros e fica com menos dinheiro para saúde, educação e investimentos. Também paga juros mais altos para conseguir novos empréstimos.
- *Atenção:* Cobre só o governo central. O número mais usado no Brasil é a Dívida Bruta do Governo Geral, do Banco Central, que inclui estados e municípios e tem metodologia diferente.

### Dívida externa

- **Código interno:** `dt_dod_dect_gn_zs`
- **Código oficial:** `DT.DOD.DECT.GN.ZS`
- **Definição:** Dívida devida a não residentes (pública e privada, de curto e longo prazo) em proporção da Renda Nacional Bruta.
- **Unidade:** % RNB
- **Sentido no escore:** menor é melhor
- **Fonte:** Banco Mundial (IDS)
- **Último ano na base (qualquer país):** 2024
- **Brasil:** 30 anos com dado (1995–2024). Primeiro valor: 21,22 em 1995. Último valor: 28,66 em 2024.

**Em linguagem simples**

- *O que é:* Quanto o país (governo e empresas) deve a credores de fora, comparado com a renda do país em um ano.
- *Como ler:* Menor é melhor. Uma dívida externa alta deixa o país exposto a crises lá fora.
- *Por que importa:* Essa dívida costuma ser em dólar. Se o real se desvaloriza, ela fica mais cara em reais de uma hora para outra. Foi o que provocou as crises da dívida dos anos 1980 e 1990 na América Latina.

### Reservas internacionais

- **Código interno:** `fi_res_totl_mo`
- **Código oficial:** `FI.RES.TOTL.MO`
- **Definição:** Quantos meses de importações de bens e serviços as reservas internacionais (ouro, divisas, DES, posição no FMI) conseguiriam pagar.
- **Unidade:** meses de importação
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (FMI)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 31 anos com dado (1995–2025). Primeiro valor: 7,99 em 1995. Último valor: 8,42 em 2025.

**Em linguagem simples**

- *O que é:* As reservas internacionais são a poupança em moeda forte (principalmente dólares) guardada pelo Banco Central. Aqui elas são medidas em meses de importação: por quantos meses o país conseguiria pagar tudo o que compra do exterior só com essa poupança.
- *Como ler:* Mais é melhor. A regra prática do FMI é ter pelo menos 3 meses.
- *Por que importa:* Funcionam como um seguro. Em crises, quando o dinheiro estrangeiro foge, as reservas evitam que o dólar dispare e que o país fique sem conseguir pagar suas contas externas.

### Saldo em conta corrente

- **Código interno:** `bn_cab_xoka_gd_zs`
- **Código oficial:** `BN.CAB.XOKA.GD.ZS`
- **Definição:** Saldo das transações correntes com o exterior (bens, serviços, renda primária e secundária) em % do PIB. Positivo = o país empresta ao resto do mundo.
- **Unidade:** % PIB
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (FMI)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 31 anos com dado (1995–2025). Primeiro valor: -2,36 em 1995. Último valor: -2,93 em 2025.

**Em linguagem simples**

- *O que é:* O extrato do país com o resto do mundo: tudo o que entra (exportações, renda recebida de fora) menos tudo o que sai (importações, juros e lucros enviados ao exterior, viagens), em proporção do PIB.
- *Como ler:* Negativo significa que o país gasta mais lá fora do que recebe e precisa de financiamento externo para cobrir a diferença. Positivo significa que sobra.
- *Por que importa:* Déficits grandes e persistentes deixam o país dependente do humor dos investidores estrangeiros.
- *Atenção:* Um déficit pequeno não é problema se for financiado por investimento produtivo. Um superávit muito alto nem sempre é bom sinal: pode refletir uma economia que consome e investe pouco.

### Crescimento real do PIB

- **Código interno:** `ny_gdp_mktp_kd_zg`
- **Código oficial:** `NY.GDP.MKTP.KD.ZG`
- **Definição:** Variação anual do PIB a preços constantes, isto é, descontada a inflação.
- **Unidade:** % a.a.
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 31 anos com dado (1995–2025). Primeiro valor: 4,22 em 1995. Último valor: 2,29 em 2025.

**Em linguagem simples**

- *O que é:* Quanto a produção total do país (o PIB) aumentou de um ano para o outro, já descontada a inflação.
- *Como ler:* Positivo: a economia cresceu. Negativo: recessão. Para um país de renda média como o Brasil, crescer acima de 3% ao ano por vários anos seguidos é considerado um bom ritmo.
- *Por que importa:* Crescimento cria empregos, aumenta a renda e a arrecadação de impostos.
- *Atenção:* Um ano isolado diz pouco. As quedas de 2015–2016 (recessão) e de 2020 (pandemia) aparecem claramente na série. Olhe a média de vários anos.

### Desemprego

- **Código interno:** `sl_uem_totl_zs`
- **Código oficial:** `SL.UEM.TOTL.ZS`
- **Definição:** Parcela da força de trabalho sem emprego e procurando trabalho. Estimativa modelada da OIT, comparável entre países.
- **Unidade:** % força de trabalho
- **Sentido no escore:** menor é melhor
- **Fonte:** Banco Mundial (OIT)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 31 anos com dado (1995–2025). Primeiro valor: 7,09 em 1995. Último valor: 5,97 em 2025.

**Em linguagem simples**

- *O que é:* Das pessoas que querem trabalhar e estão procurando emprego, quantas não conseguem. Quem não está procurando (estudantes, aposentados) não entra na conta.
- *Como ler:* Menor é melhor.
- *Por que importa:* Desemprego é perda de renda para as famílias e desperdício de capacidade produtiva para o país.
- *Atenção:* É uma estimativa da Organização Internacional do Trabalho, feita para comparar países, e pode diferir um pouco da PNAD do IBGE. Também não mostra a qualidade do emprego: trabalho informal conta como ocupado.

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

**Em linguagem simples**

- *O que é:* A riqueza média produzida por pessoa em um ano. É como dividir o bolo da economia em partes iguais entre todos os habitantes. Os valores são ajustados pela paridade de poder de compra (PPC), que leva em conta o custo de vida de cada país: um dólar compra mais coisas no Brasil do que nos Estados Unidos.
- *Como ler:* Maior é melhor: indica um país mais rico, em média.
- *Por que importa:* É a medida mais usada para comparar o nível de desenvolvimento econômico entre países e ao longo do tempo.
- *Atenção:* É uma média: não diz como a renda é dividida. Um país pode ter PIB per capita alto e muita gente pobre. Para isso, veja o Índice de Gini.

### Indústria de transformação

- **Código interno:** `nv_ind_manf_zs`
- **Código oficial:** `NV.IND.MANF.ZS`
- **Definição:** Valor adicionado da indústria de transformação (manufatura) como parcela do PIB.
- **Unidade:** % PIB
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 31 anos com dado (1995–2025). Primeiro valor: 14,54 em 1995. Último valor: 11,77 em 2025.

**Em linguagem simples**

- *O que é:* A parte da economia que vem de fábricas que transformam matéria-prima em produtos: carros, roupas, remédios, alimentos industrializados, máquinas.
- *Como ler:* Maior indica uma indústria mais forte dentro da economia.
- *Por que importa:* A indústria costuma gerar empregos mais produtivos e difundir tecnologia para o resto da economia.
- *Atenção:* Países ricos também perdem peso industrial, porque os serviços crescem. O problema do Brasil, chamado de desindustrialização precoce, é ter perdido indústria antes de ficar rico.

### Exportações de alta tecnologia

- **Código interno:** `tx_val_tech_mf_zs`
- **Código oficial:** `TX.VAL.TECH.MF.ZS`
- **Definição:** Exportações de produtos de alta intensidade de P&D (aeroespacial, computadores, fármacos, instrumentos científicos, máquinas elétricas) como % das exportações de manufaturados.
- **Unidade:** % export. manufat.
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (Comtrade)
- **Último ano na base (qualquer país):** 2024
- **Brasil:** 18 anos com dado (2007–2024). Primeiro valor: 12,63 em 2007. Último valor: 11,11 em 2024.

**Em linguagem simples**

- *O que é:* Dos produtos industrializados que o país vende ao exterior, quanto é de alta tecnologia: aviões, computadores, remédios, instrumentos científicos.
- *Como ler:* Maior é melhor: mostra capacidade de fabricar produtos sofisticados.
- *Por que importa:* Produtos complexos são mais difíceis de copiar e costumam pagar salários melhores. Países que só exportam produtos simples ficam mais expostos às oscilações de preço.
- *Atenção:* Conta só os produtos industrializados. Soja, minério e petróleo, grande parte das exportações brasileiras, não entram na conta. No Brasil, a Embraer pesa bastante neste número.

### Gasto em P&D

- **Código interno:** `gb_xpd_rsdv_gd_zs`
- **Código oficial:** `GB.XPD.RSDV.GD.ZS`
- **Definição:** Gasto bruto doméstico em pesquisa e desenvolvimento (público e privado) como % do PIB.
- **Unidade:** % PIB
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (UNESCO)
- **Último ano na base (qualquer país):** 2024
- **Brasil:** 24 anos com dado (2000–2023). Primeiro valor: 1,05 em 2000. Último valor: 1,19 em 2023.

**Em linguagem simples**

- *O que é:* Quanto o país (governo, empresas e universidades) investe em pesquisa e desenvolvimento para criar conhecimento e novas tecnologias, comparado com o tamanho da economia.
- *Como ler:* Maior é melhor. Os países mais inovadores, como Coreia do Sul e Israel, passam de 4% do PIB.
- *Por que importa:* Pesquisa é o que permite a um país produzir coisas novas e mais valiosas em vez de só copiar.
- *Atenção:* Só sai a cada um ou dois anos em muitos países, por isso a série tem lacunas.

### Patentes de residentes

- **Código interno:** `pat_pm`
- **Código oficial:** `IP.PAT.RESD ÷ SP.POP.TOTL × 10⁶`
- **Definição:** Pedidos de patente feitos por residentes do país, por milhão de habitantes. Calculado neste projeto a partir do total de pedidos e da população.
- **Unidade:** por milhão hab.
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (OMPI)
- **Último ano na base (qualquer país):** 2024
- **Brasil:** 30 anos com dado (1995–2024). Primeiro valor: 16,74 em 1995. Último valor: 27,13 em 2024.

**Em linguagem simples**

- *O que é:* Quantos pedidos de patente (o registro de uma invenção) moradores do país fizeram, para cada milhão de habitantes.
- *Como ler:* Maior indica mais invenções registradas por pessoas e empresas do país.
- *Por que importa:* É uma forma de medir o resultado do esforço de inovação, não só o dinheiro gasto.
- *Atenção:* Pedido não é patente concedida. Além disso, alguns setores (eletrônicos, farmacêutico) patenteiam muito mais que outros, o que favorece países especializados neles.

### Investimento direto estrangeiro

- **Código interno:** `bx_klt_dinv_wd_gd_zs`
- **Código oficial:** `BX.KLT.DINV.WD.GD.ZS`
- **Definição:** Entrada líquida de investimento direto estrangeiro (participação duradoura ≥ 10% em empresas) como % do PIB.
- **Unidade:** % PIB
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (FMI)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 31 anos com dado (1995–2025). Primeiro valor: 0,63 em 1995. Último valor: 3,41 em 2025.

**Em linguagem simples**

- *O que é:* Dinheiro que empresas estrangeiras trazem para o país para abrir fábricas, comprar empresas ou ficar com uma participação relevante nelas (10% ou mais). É diferente de aplicar na bolsa por pouco tempo.
- *Como ler:* Maior indica mais interesse de investidores de longo prazo.
- *Por que importa:* Traz capital, tecnologia e empregos, e é uma forma estável de financiar o país.
- *Atenção:* Países pequenos e centros financeiros (como Luxemburgo e Irlanda) têm números muito altos e instáveis, porque o dinheiro só passa por eles.

### Abertura comercial

- **Código interno:** `ne_trd_gnfs_zs`
- **Código oficial:** `NE.TRD.GNFS.ZS`
- **Definição:** Soma de exportações e importações de bens e serviços como % do PIB. Mede a integração da economia ao comércio internacional.
- **Unidade:** % PIB
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 31 anos com dado (1995–2025). Primeiro valor: 16,98 em 1995. Último valor: 35,29 em 2025.

**Em linguagem simples**

- *O que é:* A soma de tudo o que o país exporta e importa, comparada com o tamanho da economia.
- *Como ler:* Maior indica uma economia mais integrada ao comércio mundial. O Brasil é uma das economias mais fechadas do mundo.
- *Por que importa:* Mais comércio dá acesso a tecnologia e insumos mais baratos e obriga as empresas a competir.
- *Atenção:* Países grandes tendem naturalmente a ser mais fechados, porque têm um mercado interno grande. Este número sozinho não diz se a economia é boa ou ruim.

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

**Em linguagem simples**

- *O que é:* Mede o quão desigual é a distribuição da renda, de 0 (todo mundo ganha igual) a 100 (uma única pessoa fica com tudo).
- *Como ler:* Menor é melhor. Países nórdicos ficam perto de 25 a 28. O Brasil fica perto de 50, entre os mais desiguais do mundo.
- *Por que importa:* Desigualdade alta limita as oportunidades de quem nasce pobre e está associada a mais violência e a menos confiança nas instituições.
- *Atenção:* Vem de pesquisas domiciliares, que captam mal a renda dos muito ricos. Dados do imposto de renda mostram uma desigualdade ainda maior.

### Renda apropriada pelos 10% mais ricos

- **Código interno:** `si_dst_10th_10`
- **Código oficial:** `SI.DST.10TH.10`
- **Definição:** Fatia da renda (ou consumo) total apropriada pelos 10% mais ricos da população.
- **Unidade:** % da renda
- **Sentido no escore:** menor é melhor
- **Fonte:** Banco Mundial (PIP)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 28 anos com dado (1995–2024). Primeiro valor: 47,50 em 1995. Último valor: 39,30 em 2024.

**Em linguagem simples**

- *O que é:* De cada R$ 100 de renda no país, quantos reais ficam com os 10% mais ricos.
- *Como ler:* Menor é melhor. Em países menos desiguais, os 10% do topo ficam com cerca de R$ 20 a R$ 25. No Brasil, perto de R$ 40.
- *Por que importa:* Complementa o Gini, mostrando diretamente o tamanho da fatia do topo.
- *Atenção:* Assim como o Gini, subestima os mais ricos, que respondem pouco às pesquisas.

### Pobreza extrema (US$ 3,00/dia)

- **Código interno:** `si_pov_dday`
- **Código oficial:** `SI.POV.DDAY`
- **Definição:** Parcela da população vivendo com menos de US$ 3,00 por dia (PPC de 2021). É a linha internacional de pobreza extrema adotada pelo Banco Mundial em 2025.
- **Unidade:** % população
- **Sentido no escore:** menor é melhor
- **Fonte:** Banco Mundial (PIP)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 28 anos com dado (1995–2024). Primeiro valor: 19,50 em 1995. Último valor: 3,00 em 2024.

**Em linguagem simples**

- *O que é:* Porcentagem da população que vive com menos de US$ 3 por dia por pessoa. É a linha internacional de pobreza extrema do Banco Mundial. O valor é em dólares de poder de compra: considera o que US$ 3 comprariam nos Estados Unidos, convertido para os preços locais.
- *Como ler:* Menor é melhor. Zero significaria ninguém em pobreza extrema.
- *Por que importa:* Mostra quantas pessoas não conseguem cobrir necessidades básicas como comida.
- *Atenção:* É uma linha pensada para os países mais pobres do mundo. Para o Brasil, a de US$ 8,30 por dia costuma ser mais informativa.

### Pobreza (US$ 8,30/dia)

- **Código interno:** `si_pov_umic`
- **Código oficial:** `SI.POV.UMIC`
- **Definição:** Parcela da população vivendo com menos de US$ 8,30 por dia (PPC de 2021). É a linha de pobreza típica de países de renda média-alta, grupo do Brasil.
- **Unidade:** % população
- **Sentido no escore:** menor é melhor
- **Fonte:** Banco Mundial (PIP)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 28 anos com dado (1995–2024). Primeiro valor: 54,80 em 1995. Último valor: 20,60 em 2024.

**Em linguagem simples**

- *O que é:* Porcentagem da população que vive com menos de US$ 8,30 por dia por pessoa, em dólares de poder de compra. É a linha de pobreza usada pelo Banco Mundial para países de renda média-alta, como o Brasil.
- *Como ler:* Menor é melhor.
- *Por que importa:* Mostra a pobreza de acordo com o padrão de vida de países como o Brasil.
- *Atenção:* Programas de transferência de renda, como o Bolsa Família, fazem este número cair rapidamente, enquanto crises o fazem subir.

### Mulheres no parlamento

- **Código interno:** `sg_gen_parl_zs`
- **Código oficial:** `SG.GEN.PARL.ZS`
- **Definição:** Percentual das cadeiras da câmara baixa (ou única) do parlamento ocupadas por mulheres.
- **Unidade:** % cadeiras
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (UIP)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 29 anos com dado (1997–2025). Primeiro valor: 6,63 em 1997. Último valor: 18,13 em 2025.

**Em linguagem simples**

- *O que é:* Porcentagem das cadeiras da Câmara dos Deputados ocupadas por mulheres.
- *Como ler:* Maior indica mais representação feminina. A média mundial fica perto de 27%, e o Brasil está abaixo disso.
- *Por que importa:* As mulheres são mais da metade da população. A presença delas no parlamento influencia que problemas entram na pauta.
- *Atenção:* Só muda a cada eleição, por isso a linha anda em degraus.

### Participação feminina no trabalho

- **Código interno:** `sl_tlf_cact_fe_zs`
- **Código oficial:** `SL.TLF.CACT.FE.ZS`
- **Definição:** Percentual das mulheres com 15 anos ou mais que estão empregadas ou procurando emprego. Estimativa modelada da OIT.
- **Unidade:** % mulheres 15+
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (OIT)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 31 anos com dado (1995–2025). Primeiro valor: 48,92 em 1995. Último valor: 53,41 em 2025.

**Em linguagem simples**

- *O que é:* Das mulheres com 15 anos ou mais, quantas trabalham ou estão procurando trabalho.
- *Como ler:* Maior indica mais mulheres no mercado de trabalho.
- *Por que importa:* Quando mulheres não conseguem trabalhar (por falta de creche, por exemplo), o país desperdiça talento e as famílias ficam com menos renda.
- *Atenção:* Não mede salário nem qualidade do emprego, nem o trabalho doméstico não pago.

### Consumo das famílias per capita

- **Código interno:** `ne_con_prvt_pc_kd`
- **Código oficial:** `NE.CON.PRVT.PC.KD`
- **Definição:** Gasto de consumo final das famílias (e instituições sem fins lucrativos) por habitante, em dólares constantes de 2015.
- **Unidade:** US$ const. 2015
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 31 anos com dado (1995–2025). Primeiro valor: 3.991 em 1995. Último valor: 6.276 em 2025.

**Em linguagem simples**

- *O que é:* Quanto, em média, cada pessoa gasta por ano com bens e serviços (comida, roupa, aluguel, lazer), em dólares corrigidos pela inflação.
- *Como ler:* Maior indica mais poder de consumo.
- *Por que importa:* Mostra como o crescimento da economia chega ao bolso das famílias.
- *Atenção:* É uma média: não mostra quem consome mais e quem consome menos.

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

**Em linguagem simples**

- *O que é:* O quanto as pessoas podem escolher seus governantes, falar, se organizar e se informar livremente, com imprensa independente. É uma nota de −2,5 a +2,5 calculada pelo Banco Mundial a partir de dezenas de pesquisas de opinião com cidadãos, empresas e especialistas. Zero é a média mundial.
- *Como ler:* Maior é melhor.
- *Por que importa:* Liberdade de expressão e eleições livres permitem que a sociedade cobre e troque seus governantes.
- *Atenção:* É uma medida de percepção, com margem de erro. Variações pequenas de um ano para o outro quase nunca são significativas: olhe a tendência de vários anos.

### Estabilidade política

- **Código interno:** `gov_wgi_pv_est`
- **Código oficial:** `GOV_WGI_PV.EST`
- **Definição:** WGI: percepção da probabilidade de instabilidade política e de violência com motivação política, inclusive terrorismo.
- **Unidade:** −2,5 a +2,5
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (WGI)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 27 anos com dado (1996–2025). Primeiro valor: -0,05 em 1996. Último valor: -0,38 em 2025.

**Em linguagem simples**

- *O que é:* A chance de o governo ser derrubado ou de o país enfrentar violência por motivo político, terrorismo ou conflitos internos. É uma nota de −2,5 a +2,5 calculada pelo Banco Mundial a partir de dezenas de pesquisas de opinião com cidadãos, empresas e especialistas. Zero é a média mundial.
- *Como ler:* Maior é melhor (mais estabilidade).
- *Por que importa:* Instabilidade política afasta investimentos e torna o futuro imprevisível.
- *Atenção:* É uma medida de percepção, com margem de erro. Variações pequenas de um ano para o outro quase nunca são significativas: olhe a tendência de vários anos.

### Efetividade do governo

- **Código interno:** `gov_wgi_ge_est`
- **Código oficial:** `GOV_WGI_GE.EST`
- **Definição:** WGI: percepção da qualidade dos serviços públicos e do serviço civil, e da credibilidade e execução das políticas públicas.
- **Unidade:** −2,5 a +2,5
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (WGI)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 27 anos com dado (1996–2025). Primeiro valor: -0,05 em 1996. Último valor: -0,04 em 2025.

**Em linguagem simples**

- *O que é:* A qualidade dos serviços públicos e da burocracia, e se o governo consegue executar o que planeja. É uma nota de −2,5 a +2,5 calculada pelo Banco Mundial a partir de dezenas de pesquisas de opinião com cidadãos, empresas e especialistas. Zero é a média mundial.
- *Como ler:* Maior é melhor.
- *Por que importa:* Um Estado eficiente entrega mais escola, saúde e infraestrutura com o mesmo dinheiro.
- *Atenção:* É uma medida de percepção, com margem de erro. Variações pequenas de um ano para o outro quase nunca são significativas: olhe a tendência de vários anos.

### Qualidade regulatória

- **Código interno:** `gov_wgi_rq_est`
- **Código oficial:** `GOV_WGI_RQ.EST`
- **Definição:** WGI: percepção da capacidade do governo de formular e aplicar regulações que favoreçam o setor privado.
- **Unidade:** −2,5 a +2,5
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (WGI)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 27 anos com dado (1996–2025). Primeiro valor: 0,04 em 1996. Último valor: -0,44 em 2025.

**Em linguagem simples**

- *O que é:* Se as regras para abrir e tocar uma empresa são claras, razoáveis e favorecem a concorrência. É uma nota de −2,5 a +2,5 calculada pelo Banco Mundial a partir de dezenas de pesquisas de opinião com cidadãos, empresas e especialistas. Zero é a média mundial.
- *Como ler:* Maior é melhor.
- *Por que importa:* Regras confusas ou que mudam o tempo todo aumentam o custo de produzir e afastam investimentos.
- *Atenção:* É uma medida de percepção, com margem de erro. Variações pequenas de um ano para o outro quase nunca são significativas: olhe a tendência de vários anos.

### Estado de direito

- **Código interno:** `gov_wgi_rl_est`
- **Código oficial:** `GOV_WGI_RL.EST`
- **Definição:** WGI: percepção de confiança nas regras da sociedade, na execução de contratos, nos direitos de propriedade, na polícia e nos tribunais.
- **Unidade:** −2,5 a +2,5
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (WGI)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 27 anos com dado (1996–2025). Primeiro valor: -0,42 em 1996. Último valor: -0,49 em 2025.

**Em linguagem simples**

- *O que é:* Se as leis são respeitadas e valem para todos: contratos cumpridos, propriedade protegida, polícia e justiça confiáveis. É uma nota de −2,5 a +2,5 calculada pelo Banco Mundial a partir de dezenas de pesquisas de opinião com cidadãos, empresas e especialistas. Zero é a média mundial.
- *Como ler:* Maior é melhor.
- *Por que importa:* Sem regras confiáveis, as pessoas e as empresas evitam fazer planos de longo prazo.
- *Atenção:* É uma medida de percepção, com margem de erro. Variações pequenas de um ano para o outro quase nunca são significativas: olhe a tendência de vários anos.

### Controle da corrupção

- **Código interno:** `gov_wgi_cc_est`
- **Código oficial:** `GOV_WGI_CC.EST`
- **Definição:** WGI: percepção de quanto o poder público é usado para ganho privado, incluindo pequena e grande corrupção e captura do Estado.
- **Unidade:** −2,5 a +2,5
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (WGI)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 27 anos com dado (1996–2025). Primeiro valor: 0,12 em 1996. Último valor: -0,38 em 2025.

**Em linguagem simples**

- *O que é:* O quanto o poder público é usado para ganho privado, da pequena propina até a captura do Estado por grupos de interesse. É uma nota de −2,5 a +2,5 calculada pelo Banco Mundial a partir de dezenas de pesquisas de opinião com cidadãos, empresas e especialistas. Zero é a média mundial.
- *Como ler:* Maior é melhor (menos corrupção percebida).
- *Por que importa:* Corrupção desvia recursos que iriam para serviços públicos e mina a confiança nas instituições.
- *Atenção:* É uma medida de percepção, com margem de erro. Variações pequenas de um ano para o outro quase nunca são significativas: olhe a tendência de vários anos. Escândalos muito noticiados podem piorar a percepção mesmo quando indicam que a corrupção está sendo investigada.

### Homicídios

- **Código interno:** `vc_ihr_psrc_p5`
- **Código oficial:** `VC.IHR.PSRC.P5`
- **Definição:** Mortes causadas intencionalmente por outra pessoa, por 100 mil habitantes. Dados do UNODC a partir de registros policiais e de saúde.
- **Unidade:** por 100 mil hab.
- **Sentido no escore:** menor é melhor
- **Fonte:** Banco Mundial (UNODC)
- **Último ano na base (qualquer país):** 2023
- **Brasil:** 29 anos com dado (1995–2023). Primeiro valor: 21,02 em 1995. Último valor: 19,28 em 2023.

**Em linguagem simples**

- *O que é:* Número de pessoas assassinadas por ano para cada 100 mil habitantes.
- *Como ler:* Menor é melhor. A média mundial fica perto de 6. O Brasil está entre os países com taxas mais altas.
- *Por que importa:* É a forma mais extrema de violência e a medida de segurança mais comparável entre países, porque quase todo homicídio é registrado.
- *Atenção:* Não mede outros crimes, como roubos e furtos, nem a sensação de segurança.

### Receita tributária (gov. central)

- **Código interno:** `gc_tax_totl_gd_zs`
- **Código oficial:** `GC.TAX.TOTL.GD.ZS`
- **Definição:** Receita de tributos do governo central como % do PIB. Não inclui contribuições sociais nem tributos subnacionais, por isso fica abaixo da carga tributária total brasileira (~33% do PIB).
- **Unidade:** % PIB
- **Sentido no escore:** contexto (sem escore)
- **Fonte:** Banco Mundial (FMI)
- **Último ano na base (qualquer país):** 2024
- **Brasil:** 15 anos com dado (2010–2024). Primeiro valor: 14,25 em 2010. Último valor: 15,41 em 2024.

**Em linguagem simples**

- *O que é:* Quanto o governo federal arrecada em impostos, comparado com o tamanho da economia.
- *Como ler:* Este indicador é só de contexto e não entra no escore. Não existe um nível ideal: países nórdicos arrecadam muito e são muito desenvolvidos.
- *Por que importa:* Mostra o tamanho dos recursos que o Estado tem para financiar serviços públicos.
- *Atenção:* Não inclui contribuições para a previdência nem impostos estaduais e municipais (ICMS, ISS). A carga tributária total do Brasil fica perto de um terço do PIB, bem acima deste número.

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

**Em linguagem simples**

- *O que é:* O Índice de Desenvolvimento Humano é uma nota de 0 a 1 que junta três coisas: vida longa e saudável, educação e renda. Foi criado pela ONU para medir o desenvolvimento além do dinheiro.
- *Como ler:* Maior é melhor. Acima de 0,8 é considerado muito alto. O Brasil está na faixa alto, entre 0,7 e 0,8.
- *Por que importa:* Mostra se o crescimento econômico está se transformando em vidas mais longas e mais estudo.
- *Atenção:* Sai com cerca de dois anos de atraso, por isso a série termina antes das outras.

### Expectativa de vida

- **Código interno:** `sp_dyn_le00_in`
- **Código oficial:** `SP.DYN.LE00.IN`
- **Definição:** Número de anos que um recém-nascido viveria se as taxas de mortalidade do ano se mantivessem por toda a sua vida.
- **Unidade:** anos
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (ONU)
- **Último ano na base (qualquer país):** 2024
- **Brasil:** 30 anos com dado (1995–2024). Primeiro valor: 67,70 em 1995. Último valor: 76,02 em 2024.

**Em linguagem simples**

- *O que é:* Quantos anos, em média, um bebê nascido hoje viveria se as condições de saúde do ano continuassem as mesmas pela vida toda.
- *Como ler:* Maior é melhor.
- *Por que importa:* Resume em um número a saúde da população, o saneamento, a segurança e o acesso a médicos.
- *Atenção:* A queda em 2020 e 2021 foi causada pela covid-19.

### Água potável gerida com segurança

- **Código interno:** `sh_h2o_smdw_zs`
- **Código oficial:** `SH.H2O.SMDW.ZS`
- **Definição:** População com água de fonte melhorada, disponível em casa, quando necessário, e livre de contaminação.
- **Unidade:** % população
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (OMS/UNICEF)
- **Último ano na base (qualquer país):** 2024
- **Brasil:** 25 anos com dado (2000–2024). Primeiro valor: 75,78 em 2000. Último valor: 88,62 em 2024.

**Em linguagem simples**

- *O que é:* Porcentagem das pessoas que têm água limpa dentro de casa, disponível sempre que precisam.
- *Como ler:* Maior é melhor.
- *Por que importa:* Água segura evita doenças, principalmente em crianças.
- *Atenção:* É mais exigente do que simplesmente ter acesso a água: exige que ela esteja em casa e livre de contaminação.

### Saneamento gerido com segurança

- **Código interno:** `sh_sta_smss_zs`
- **Código oficial:** `SH.STA.SMSS.ZS`
- **Definição:** População com instalação sanitária melhorada, não compartilhada, cujos dejetos são tratados com segurança.
- **Unidade:** % população
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (OMS/UNICEF)
- **Último ano na base (qualquer país):** 2024
- **Brasil:** 25 anos com dado (2000–2024). Primeiro valor: 33,68 em 2000. Último valor: 54,96 em 2024.

**Em linguagem simples**

- *O que é:* Porcentagem das pessoas que têm banheiro próprio e cujo esgoto é coletado e tratado, ou descartado com segurança.
- *Como ler:* Maior é melhor. No Brasil, só cerca de metade da população tem esse serviço.
- *Por que importa:* Esgoto sem tratamento contamina rios e causa doenças. É uma das maiores lacunas de infraestrutura do país.

### Acesso à eletricidade

- **Código interno:** `eg_elc_accs_zs`
- **Código oficial:** `EG.ELC.ACCS.ZS`
- **Definição:** Parcela da população com acesso a eletricidade.
- **Unidade:** % população
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial
- **Último ano na base (qualquer país):** 2024
- **Brasil:** 30 anos com dado (1995–2024). Primeiro valor: 91,73 em 1995. Último valor: 99,80 em 2024.

**Em linguagem simples**

- *O que é:* Porcentagem da população que tem energia elétrica.
- *Como ler:* Maior é melhor. O Brasil está perto de 100%.
- *Por que importa:* Sem eletricidade não há geladeira, iluminação para estudar à noite nem acesso à internet.
- *Atenção:* Como o Brasil já está quase no máximo, este indicador muda pouco.

### Gasto público em educação

- **Código interno:** `se_xpd_totl_gd_zs`
- **Código oficial:** `SE.XPD.TOTL.GD.ZS`
- **Definição:** Gasto do governo geral (todas as esferas) com educação, em % do PIB.
- **Unidade:** % PIB
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (UNESCO)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 25 anos com dado (1995–2022). Primeiro valor: 4,57 em 1995. Último valor: 5,62 em 2022.

**Em linguagem simples**

- *O que é:* Quanto os governos (federal, estaduais e municipais) gastam com educação, comparado com o tamanho da economia.
- *Como ler:* Maior indica mais esforço do governo com educação.
- *Por que importa:* Educação é a base da produtividade e das oportunidades das pessoas.
- *Atenção:* Mede o esforço, não o resultado. Gastar mais não garante que os alunos aprendam mais: depende de como o dinheiro é usado.

### Gasto em saúde

- **Código interno:** `sh_xpd_chex_gd_zs`
- **Código oficial:** `SH.XPD.CHEX.GD.ZS`
- **Definição:** Gasto corrente total com saúde (público e privado) em % do PIB.
- **Unidade:** % PIB
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (OMS)
- **Último ano na base (qualquer país):** 2024
- **Brasil:** 24 anos com dado (2000–2023). Primeiro valor: 8,33 em 2000. Último valor: 9,73 em 2023.

**Em linguagem simples**

- *O que é:* Quanto o país gasta com saúde, somando o público (SUS) e o privado (planos de saúde, consultas e remédios pagos do bolso), comparado com o tamanho da economia.
- *Como ler:* Maior indica mais recursos para a saúde.
- *Por que importa:* Mostra quanto a sociedade investe em cuidar da população.
- *Atenção:* No Brasil, mais da metade do gasto com saúde é privado, apesar de a maioria da população depender do SUS. Gastar mais também não garante melhor resultado.

### Emissões de CO₂

- **Código interno:** `en_ghg_co2_pc_ce_ar5`
- **Código oficial:** `EN.GHG.CO2.PC.CE.AR5`
- **Definição:** Emissões de dióxido de carbono por habitante, excluindo uso da terra e florestas (LULUCF). Por isso não capta o desmatamento, a maior fonte de emissão brasileira.
- **Unidade:** t per capita
- **Sentido no escore:** menor é melhor
- **Fonte:** Banco Mundial (EDGAR)
- **Último ano na base (qualquer país):** 2024
- **Brasil:** 30 anos com dado (1995–2024). Primeiro valor: 1,73 em 1995. Último valor: 2,32 em 2024.

**Em linguagem simples**

- *O que é:* Toneladas de gás carbônico (CO₂) emitidas por pessoa em um ano, pela queima de combustíveis e pela indústria.
- *Como ler:* Menor é melhor para o clima.
- *Por que importa:* O CO₂ é o principal gás causador do aquecimento global.
- *Atenção:* Não inclui o desmatamento, que é a maior fonte de emissões do Brasil. Por isso o país parece mais limpo neste indicador do que realmente é.

### Cobertura florestal

- **Código interno:** `ag_lnd_frst_zs`
- **Código oficial:** `AG.LND.FRST.ZS`
- **Definição:** Área coberta por florestas (árvores com mais de 5 m em áreas acima de 0,5 ha) como % do território.
- **Unidade:** % território
- **Sentido no escore:** maior é melhor
- **Fonte:** Banco Mundial (FAO)
- **Último ano na base (qualquer país):** 2024
- **Brasil:** 30 anos com dado (1995–2024). Primeiro valor: 70,54 em 1995. Último valor: 58,55 em 2024.

**Em linguagem simples**

- *O que é:* Porcentagem do território coberta por florestas.
- *Como ler:* Maior é melhor para a biodiversidade e o clima.
- *Por que importa:* Florestas guardam carbono, regulam as chuvas e abrigam a biodiversidade. O Brasil tem a maior floresta tropical do mundo.
- *Atenção:* Uma queda que parece pequena em porcentagem pode representar milhões de hectares desmatados, por causa do tamanho do território.

### Razão de dependência de idosos

- **Código interno:** `sp_pop_dpnd_ol`
- **Código oficial:** `SP.POP.DPND.OL`
- **Definição:** População de 65 anos ou mais para cada 100 pessoas de 15 a 64 anos. Indica a pressão demográfica sobre a previdência.
- **Unidade:** % pop. 15–64
- **Sentido no escore:** contexto (sem escore)
- **Fonte:** Banco Mundial (ONU)
- **Último ano na base (qualquer país):** 2025
- **Brasil:** 31 anos com dado (1995–2025). Primeiro valor: 7,40 em 1995. Último valor: 16,61 em 2025.

**Em linguagem simples**

- *O que é:* Para cada 100 pessoas em idade de trabalhar (15 a 64 anos), quantas têm 65 anos ou mais.
- *Como ler:* Este indicador é só de contexto e não entra no escore. Ele sobe à medida que a população envelhece.
- *Por que importa:* Mais idosos para cada trabalhador aumenta a pressão sobre a previdência e o sistema de saúde.
- *Atenção:* Envelhecer é, em si, resultado de sucesso: as pessoas vivem mais. O desafio é se preparar para isso.
