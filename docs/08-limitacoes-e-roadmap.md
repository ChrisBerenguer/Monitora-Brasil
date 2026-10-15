# 08 · Limitações e roadmap

## Limitações conhecidas (v1)

### Dados
1. **Anos recentes incompletos.** Em 2024–2025 muitos países ainda não publicaram dados, especialmente de pesquisas domiciliares. Os escores desses anos se apoiam mais em valores imputados (LOCF).
2. **Defasagem das pesquisas de renda.** Gini, pobreza e a fatia dos 10% mais ricos vêm de pesquisas domiciliares (no Brasil, a PNAD Contínua) e subestimam a renda do topo. Bases fiscais (World Inequality Database) mostram uma concentração maior.
3. **Juros reais ≠ Selic.** A série do Banco Mundial usa a taxa de empréstimo bancário menos o deflator do PIB, o que inclui o spread bancário. O nível brasileiro fica muito acima da Selic real.
4. **Dívida do governo central ≠ dívida bruta do governo geral.** O indicador do Banco Mundial cobre só o governo central e tem pouca cobertura entre países (≈1.600 observações). A métrica de referência no Brasil é a DBGG do Banco Central.
5. **Receita tributária parcial.** O indicador exclui contribuições sociais e tributos subnacionais (≈15% do PIB vs. ≈33% da carga total brasileira). Por isso é só contexto.
6. **Emissões sem desmatamento.** O CO₂ per capita exclui uso da terra (LULUCF), subestimando muito as emissões brasileiras.
7. **Governança é percepção.** Os WGI agregam opiniões e têm margem de erro. Variações pequenas de um ano para o outro raramente são significativas.
8. **Espelho, não API oficial.** Os dados vêm do espelho da Gapminder. Pode haver defasagem em relação à última revisão do Banco Mundial.

### Indicadores fora da v1
| Indicador | Motivo | Substituto atual |
|---|---|---|
| Índice de democracia (EIU / V-Dem) | Série disponível parada em 2018 | WGI Voz e accountability |
| Pesquisadores por milhão de habitantes | Brasil sem dado desde 2014 | Gasto em P&D, patentes |
| Índice de Complexidade Econômica (Harvard) | Sem fonte acessível no ambiente de construção | Exportações de alta tecnologia, indústria de transformação |
| Razão de Palma | Não publicada diretamente no WDI | Fatia dos 10% mais ricos |
| Taxa de reposição previdenciária | Cobertura só da OCDE | Dependência de idosos (contexto) |
| Global Peace Index, Rule of Law Index (WJP) | Licença/série não aberta | WGI Estado de direito, homicídios |

### Método
1. **Pesos iguais** não refletem importância relativa e dão peso extra a blocos correlacionados (os 6 WGI).
2. **Média compensatória:** desempenho ótimo num indicador compensa um péssimo em outro.
3. **Escore relativo:** não mostra progresso absoluto (use as séries).
4. **Microestados no universo:** países muito pequenos entram nos percentis com o mesmo peso de países grandes.
5. **Sem intervalos de confiança:** os escores não exibem incerteza.
6. **Mandatos ≠ causalidade:** a comparação por mandato descreve períodos, não atribui resultados a governos.

## Roadmap

### Curto prazo
- [ ] Trocar o espelho pela API oficial do Banco Mundial (`wbgapi`) quando houver acesso.
- [ ] Incluir o Índice de Complexidade Econômica (Atlas of Economic Complexity, Harvard Growth Lab).
- [ ] Incluir o V-Dem (índice de democracia liberal) atualizado.
- [ ] Atualização automática mensal (tarefa agendada ou GitHub Action que roda os scripts e faz commit de `dados/` e `site/data/`).
- [ ] Controle no site para escolher o ano de referência do escore (hoje é o último).

### Médio prazo
- [ ] Fontes brasileiras de alta frequência: IBGE/SIDRA (PNAD Contínua, IPCA, PIB trimestral), Banco Central/SGS (Selic, DBGG, câmbio, reservas) e Tesouro. Séries mensais e trimestrais em uma aba "Conjuntura".
- [ ] Recorte por unidade da federação (IBGE, Atlas Brasil/PNUD) para coortes regionais.
- [ ] Análise de sensibilidade: ranking do Brasil sob pesos por PCA, média geométrica, LOCF de 3 e 7 anos e universo só com países de mais de 1 milhão de habitantes.
- [ ] Intervalos de incerteza nos escores (bootstrap sobre indicadores).
- [ ] Linha do tempo de eventos (crises, mudanças de regime fiscal e monetário) sobre as séries.

### Longo prazo
- [ ] Versão multipaís: o mesmo painel para qualquer país-foco.
- [ ] Relatório automático em PDF/slides por mandato ou por tema, com texto gerado e revisado.
- [ ] Assistente de perguntas sobre os dados (RAG sobre os conjuntos e a documentação).
