# 01 · Visão geral

## Propósito

O Monitora Brasil responde a uma pergunta simples de fazer e difícil de responder: **o Brasil está indo bem?** A resposta depende do que se mede, de com quem se compara e de qual período se olha. O projeto deixa essas três escolhas explícitas e ajustáveis:

- **O que se mede:** 40 indicadores organizados em 5 macrotemas. Cada indicador tem um sentido declarado: se é melhor quando sobe, quando cai ou quando fica perto de um alvo.
- **Com quem se compara:** cinco coortes de países, mais um ranking contra o mundo todo.
- **Em que período:** séries anuais de 1995 a 2025 e comparação entre mandatos presidenciais de quatro anos.

## Para quem é

O Monitora Brasil é um **trabalho voluntário, aberto e sem fins comerciais**, feito para o público geral. A ideia é que qualquer pessoa consiga entender como o Brasil está se saindo sem depender de interpretações prontas: os dados são oficiais, o método é público e cada número pode ser conferido.

Pensamos especialmente em:

- **Cidadãos curiosos** que querem ir além das manchetes e ver os números por conta própria.
- **Estudantes e professores** de economia, ciências sociais, geografia e estatística, que podem usar o painel e a documentação como material didático.
- **Jornalistas e comunicadores** que precisam de dados comparáveis e de explicações claras sobre o que cada indicador mede.
- **Pesquisadores e analistas** que queiram reproduzir, criticar ou estender a metodologia.

Todo o conteúdo (código, dados derivados e documentação) fica em um repositório público, e contribuições são bem-vindas (ver "Como contribuir" no README).

### Compromissos

- **Neutralidade.** O painel descreve, não opina. Ele mostra períodos e mandatos, mas não atribui resultados a governos nem faz recomendações políticas.
- **Transparência.** Toda escolha de método está documentada, junto com as alternativas e o efeito que teriam.
- **Fontes oficiais e abertas.** Só bases de organismos multilaterais, com metodologia pública e licença aberta.
- **Honestidade sobre os limites.** O que falta e o que pode enganar está listado no doc 08.

## Escopo da versão 1 (15/10/2026)

| Item | Coberto |
|---|---|
| Países com série detalhada | Brasil + 22 países de comparação |
| Países no cálculo dos percentis e escores | Todos os Estados-membros da ONU com dado (cerca de 190) |
| Período das séries | 1995–2025 (anual) |
| Período dos escores | 2000–2025 (anual) |
| Indicadores | 40 (37 entram no escore e 3 são de contexto) |
| Macrotemas | 5, mais um escore geral |
| Coortes | América Latina, BRICS, OCDE (referência), renda média-alta (Banco Mundial) e mundo |
| Períodos de comparação | 8 mandatos presidenciais brasileiros, de 1995–1998 a 2023–2026 |

## Os cinco macrotemas

Os macrotemas vêm do Dossiê de Indicadores, que reuniu 21 categorias da literatura (PIB, inflação, juros, dívidas, desigualdade, pobreza, gênero, democracia, segurança, P&D, meio ambiente, indústria, complexidade, comércio, previdência, qualidade de vida, tributos, IDH etc.) e as agrupou pela função que cumprem no desenvolvimento:

| # | Macrotema | Pergunta que responde | Categorias do Dossiê que agrega |
|---|---|---|---|
| I | **Estabilidade macroeconômica** | A economia é previsível e solvente? | Inflação, juros, dívida interna, dívida externa, balança/conta corrente |
| II | **Estrutura produtiva e inovação** | O país produz muito, de forma sofisticada e com capacidade de inovar? | PIB, industrialização, complexidade, P&D, balança comercial |
| III | **Coesão social e distribuição** | Os frutos são repartidos? Quem fica para trás? | Desigualdade, concentração de renda, pobreza, gênero, poder de consumo |
| IV | **Estado, instituições e segurança** | As regras funcionam e as pessoas estão seguras? | Democracia, segurança pública, carga tributária |
| V | **Bem-estar e sustentabilidade** | As pessoas vivem bem, e o modelo se sustenta no tempo? | Qualidade de vida, IDH, meio ambiente, previdência |

### Relações causais entre os temas

O Dossiê propõe uma leitura em cadeia, que orienta a interpretação do painel:

```
  I. Estabilidade macro ──► II. Estrutura produtiva ──► III. Coesão social
           ▲                         │                          │
           │                         ▼                          ▼
  IV. Instituições ───────────────────────────────────► V. Bem-estar
           ▲                                                    │
           └──────────────── (retroalimentação) ◄───────────────┘
```

- **A estabilidade macro** reduz incerteza e custo de capital, o que permite investimento produtivo.
- **A estrutura produtiva** gera renda e empregos de maior qualidade, que podem ou não se traduzir em coesão social, dependendo das políticas distributivas.
- **As instituições** atravessam tudo: elas condicionam a política econômica, a execução de contratos, a segurança e a qualidade do gasto público (Acemoglu & Robinson, 2012).
- **O bem-estar** é o resultado final, e ele retroalimenta as instituições: sociedades mais saudáveis e educadas tendem a exigir governos melhores.

Essas relações são hipóteses de leitura, não um modelo estimado. O painel mostra as correlações no tempo, mas não prova causalidade.

## Princípios de desenho

1. **Transparência acima de sofisticação.** Média simples de percentis, com pesos iguais. Qualquer pessoa consegue refazer a conta.
2. **Medida relativa e comparável.** Percentis colocam indicadores de unidades diferentes (%, US$, anos, índices) na mesma escala sem supor nada sobre a distribuição.
3. **Dados oficiais e abertos.** Só fontes multilaterais com metodologia pública e licença aberta.
4. **Sentido explícito.** Cada indicador declara se subir é bom. Onde não há consenso (carga tributária, dependência de idosos), o indicador fica como contexto e não entra no escore.
5. **O valor observado nunca é escondido.** O escore resume, mas as séries originais estão sempre a um clique.
