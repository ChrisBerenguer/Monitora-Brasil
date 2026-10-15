# 05 · Nomenclatura e glossário

## Convenções de nomes

| Elemento | Convenção | Exemplo |
|---|---|---|
| Código de indicador | Código oficial da fonte em minúsculas, com `.` trocado por `_` (padrão DDF da Gapminder) | `NY.GDP.PCAP.PP.KD` → `ny_gdp_pcap_pp_kd` |
| Indicador derivado | Nome curto próprio | `pat_pm` (patentes por milhão) |
| País | ISO 3166-1 alfa-3 em minúsculas | `bra`, `arg`, `usa` |
| Tema | Id curto | `macro`, `prod`, `social`, `inst`, `bem`, `geral` |
| Coorte | Id curto | `latam`, `brics`, `ocde`, `umic`, `mundo` |
| Mandato | Ano inicial–ano final, com travessão (–, U+2013) | `2019–2022` |
| Chave composta | Partes separadas por barra vertical | `fp_cpi_totl_zg\|latam\|2024` |
| Arquivos de dados | snake_case em português | `escores_coortes.json` |
| Campos de dados | snake_case em português (exceto as estatísticas de `coortes.json`, em inglês: `mean`, `median`, `sd`) | `tendencia_ano`, `z_brasil` |

### Decomposição dos códigos do Banco Mundial

Os códigos WDI seguem o padrão `TÓPICO.ASSUNTO.MEDIDA.UNIDADE`:

| Prefixo | Tópico | Exemplo |
|---|---|---|
| `NY` | Contas nacionais (renda) | `NY.GDP.PCAP.PP.KD` |
| `NE` | Contas nacionais (despesa) | `NE.TRD.GNFS.ZS` |
| `NV` | Contas nacionais (valor adicionado) | `NV.IND.MANF.ZS` |
| `FP` / `FR` / `FI` | Preços, juros, reservas | `FP.CPI.TOTL.ZG` |
| `GC` | Finanças do governo central | `GC.DOD.TOTL.GD.ZS` |
| `DT` | Dívida externa | `DT.DOD.DECT.GN.ZS` |
| `BN` / `BX` | Balanço de pagamentos | `BN.CAB.XOKA.GD.ZS` |
| `SI` | Pobreza e desigualdade | `SI.POV.GINI` |
| `SL` | Trabalho | `SL.UEM.TOTL.ZS` |
| `SP` | População | `SP.DYN.LE00.IN` |
| `SH` | Saúde | `SH.STA.SMSS.ZS` |
| `SE` | Educação | `SE.XPD.TOTL.GD.ZS` |
| `SG` | Gênero | `SG.GEN.PARL.ZS` |
| `EN` / `EG` / `AG` | Ambiente, energia, agricultura e terra | `EN.GHG.CO2.PC.CE.AR5` |
| `GB` / `IP` / `TX` | Ciência, propriedade intelectual, exportações | `GB.XPD.RSDV.GD.ZS` |
| `VC` | Violência e conflito | `VC.IHR.PSRC.P5` |
| `GOV_WGI` | Worldwide Governance Indicators | `GOV_WGI_RL.EST` |

| Sufixo | Significado |
|---|---|
| `ZS` | Percentual (proporção × 100) |
| `ZG` | Taxa de crescimento anual (%) |
| `KD` | Dólares constantes (sem inflação) |
| `PP` | Paridade de poder de compra |
| `PC` | Per capita |
| `GD` | Em proporção do PIB |
| `GN` | Em proporção da RNB |
| `MO` | Em meses (de importação) |
| `P5` | Por 100 mil habitantes |
| `EST` | Estimativa (WGI, escala de −2,5 a +2,5) |

## Siglas

| Sigla | Significado |
|---|---|
| BM | Banco Mundial |
| BRICS | Brasil, Rússia, Índia, China e África do Sul |
| DDF | *Data Description Format*, formato de dados da Gapminder/open-numbers |
| DSA | *Debt Sustainability Analysis*, análise de sustentabilidade da dívida (FMI/BM) |
| FMI | Fundo Monetário Internacional |
| ICE / ECI | Índice de Complexidade Econômica |
| ICP | *International Comparison Program*, base dos fatores de PPC |
| IDH / HDI | Índice de Desenvolvimento Humano |
| IED / FDI | Investimento direto estrangeiro |
| IIQ / IQR | Intervalo interquartil |
| IPC / CPI | Índice de preços ao consumidor |
| JMP | *Joint Monitoring Programme* OMS/UNICEF (água e saneamento) |
| LOCF | *Last observation carried forward*, último valor conhecido |
| LULUCF | Uso da terra, mudança no uso da terra e florestas |
| OCDE | Organização para a Cooperação e Desenvolvimento Econômico |
| OIT / ILO | Organização Internacional do Trabalho |
| OMPI / WIPO | Organização Mundial da Propriedade Intelectual |
| P&D / R&D | Pesquisa e desenvolvimento |
| PIP | *Poverty and Inequality Platform* do Banco Mundial |
| PNUD / UNDP | Programa das Nações Unidas para o Desenvolvimento |
| PPC / PPP | Paridade de poder de compra |
| RNB / GNI | Renda Nacional Bruta |
| UIP / IPU | União Interparlamentar |
| UNODC | Escritório das Nações Unidas sobre Drogas e Crime |
| WDI | *World Development Indicators* |
| WGI | *Worldwide Governance Indicators* |

## Glossário


**Box plot (diagrama de caixa).** Gráfico que resume uma distribuição: caixa do 1º ao 3º quartil, traço na mediana, hastes até o mínimo e o máximo. No painel, o losango marca a média e o ponto colorido, o Brasil.

**Cobertura.** Número de indicadores de um tema com dado (observado ou imputado) para um país num ano. Determina se o escore é calculado.

**Coorte.** Grupo de países usado como referência de comparação (ver doc 03, seção 4).

**Contexto (indicador de).** Indicador exibido no painel que não entra no escore por não ter um sentido de "melhor" consensual.

**Escore.** Número de 0 a 100 que resume a posição de um país num tema, num ano, frente a todos os países do mundo. É a média dos postos percentis dos indicadores do tema.

**Escore geral.** Média dos cinco escores de tema.

**Faixa da coorte.** Área sombreada nos gráficos de série que vai do 1º ao 3º quartil da coorte em cada ano. Contém a metade "central" dos países do grupo.

**Macrotema (ou tema).** Um dos cinco agrupamentos de indicadores (ver doc 01).

**Mandato.** Período de quatro anos de um governo presidencial brasileiro, usado como unidade de comparação temporal: na tabela de comparação entre mandatos (Séries temporais) e na variação dos escores (Visão geral).

**Percentil (posto percentil).** Posição relativa de um país entre todos os países num indicador e ano, de 0 (pior) a 100 (melhor).

**Sentido.** Regra que diz se um valor maior é melhor, pior ou se o ideal é ficar perto de um alvo.

**Série observada.** Valores publicados pela fonte, sem imputação.

**Tendência (anual).** Inclinação da reta de regressão linear dos valores de um período, em unidades do indicador por ano.

**Variação (delta).** Diferença entre duas médias (mandato B − mandato A) ou entre dois escores (fim do mandato − ano anterior à posse, na Visão geral).

**Z do Brasil.** Quantos desvios-padrão o Brasil está acima (+) ou abaixo (−) da média da coorte.

## Países de comparação

| Código | País | Coorte |
|---|---|---|
| `bra` | Brasil | (foco) |
| `arg` | Argentina | América Latina |
| `chl` | Chile | América Latina |
| `col` | Colômbia | América Latina |
| `mex` | México | América Latina |
| `per` | Peru | América Latina |
| `ury` | Uruguai | América Latina |
| `chn` | China | BRICS |
| `ind` | Índia | BRICS |
| `rus` | Rússia | BRICS |
| `zaf` | África do Sul | BRICS |
| `usa` | Estados Unidos | OCDE |
| `deu` | Alemanha | OCDE |
| `fra` | França | OCDE |
| `gbr` | Reino Unido | OCDE |
| `jpn` | Japão | OCDE |
| `kor` | Coreia do Sul | OCDE |
| `can` | Canadá | OCDE |
| `esp` | Espanha | OCDE |
| `ita` | Itália | OCDE |
| `aus` | Austrália | OCDE |
| `prt` | Portugal | OCDE |
| `pol` | Polônia | OCDE |

México, Chile e Colômbia também são membros da OCDE, mas aqui ficam na coorte latino-americana.
