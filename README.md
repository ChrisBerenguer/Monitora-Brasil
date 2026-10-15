# Monitora Brasil

Painel que acompanha o desenvolvimento do Brasil em comparação com outros países. Ele cruza 40 indicadores econômicos, sociais, institucionais e ambientais, de 1995 a 2025, e os resume em **escores de 0 a 100** para cinco macrotemas.

- **Site:** pasta `site/`, um site estático pronto para hospedar em domínio próprio (ver [docs/10](docs/10-publicacao.md))
- **Base conceitual:** Dossiê de Indicadores de Desenvolvimento (21 categorias, 5 macrotemas): https://claude.ai/artifact/1nwmHfoeYXmQ5RZhytXXVM
- **Repositório:** https://github.com/ChrisBerenguer/Monitora-Brasil
- **Projeto da:** WizzyBots, Agência de Automação e IA para PMEs (produto interno)
- **Histórico de versões:** [CHANGELOG.md](CHANGELOG.md)

## O que o painel responde

1. **Como o Brasil está em cada dimensão do desenvolvimento** e no conjunto, em relação ao resto do mundo?
2. **Como isso mudou no tempo**, ano a ano e entre mandatos presidenciais?
3. **Como o Brasil se compara aos seus pares**: América Latina, BRICS, OCDE e países de renda média-alta?

## Resultado de referência (dados de outubro de 2026)

| Macrotema | Escore do Brasil em 2000 | Escore do Brasil em 2025 |
|---|---|---|
| Estabilidade macroeconômica | 43,5 | 43,3 |
| Estrutura produtiva e inovação | 52,2 | 55,7 |
| Coesão social e distribuição | 35,4 | 32,9 |
| Estado, instituições e segurança | 50,8 | 39,6 |
| Bem-estar e sustentabilidade | 60,0 | 63,4 |
| **Geral** | **48,4** | **47,0** |

Em 2025 o Brasil fica na 100ª posição entre 176 países no escore geral. Em 2010 estava na 68ª posição entre 175. O escore é **relativo**: 50 significa estar no meio da distribuição mundial (ver [docs/03-metodologia.md](docs/03-metodologia.md)).

## Estrutura do repositório

```
Monitora-Brasil/
├── README.md                  este arquivo
├── docs/                      documentação detalhada (leia em ordem)
│   ├── 01-visao-geral.md
│   ├── 02-conceitos-e-teorias.md
│   ├── 03-metodologia.md
│   ├── 04-dicionario-de-indicadores.md
│   ├── 05-nomenclatura-e-glossario.md
│   ├── 06-dados-fontes-e-esquemas.md
│   ├── 07-site.md
│   ├── 08-limitacoes-e-roadmap.md
│   ├── 09-como-atualizar.md
│   └── 10-publicacao.md
├── scripts/
│   ├── baixar_brutos.py       baixa as séries brutas para brutos/ (fora do git)
│   ├── build_dados.py         calcula percentis, escores e estatísticas → dados/
│   └── gerar_dicionario.py    gera docs/04 a partir dos dados
├── dados/                     8 conjuntos de dados em JSON (cópia em site/data/)
├── site/                      o painel web: HTML, CSS, JavaScript, d3 local e dados
├── .github/workflows/pages.yml publicação automática no GitHub Pages
└── netlify.toml               configuração para Netlify
```

## Começo rápido

Precisa de Python 3.9 ou mais recente, sem bibliotecas externas.

```bash
git clone https://github.com/ChrisBerenguer/Monitora-Brasil.git
cd Monitora-Brasil
python scripts/baixar_brutos.py     # 42 arquivos CSV, cerca de 13 MB
python scripts/build_dados.py       # gera dados/*.json
python scripts/gerar_dicionario.py  # atualiza docs/04
```

Para ver o painel localmente:

```bash
cd site && python -m http.server 8000   # abra http://localhost:8000
```

Para publicar num domínio próprio, veja [docs/10-publicacao.md](docs/10-publicacao.md).

## Guia de leitura

| Se você quer... | Leia |
|---|---|
| Entender o propósito e o escopo | [01 · Visão geral](docs/01-visao-geral.md) |
| Entender a teoria por trás de cada indicador e da estatística usada | [02 · Conceitos e teorias](docs/02-conceitos-e-teorias.md) |
| Saber exatamente como cada número é calculado | [03 · Metodologia](docs/03-metodologia.md) |
| Consultar a definição de um indicador | [04 · Dicionário de indicadores](docs/04-dicionario-de-indicadores.md) |
| Entender códigos, siglas e nomes de campos | [05 · Nomenclatura e glossário](docs/05-nomenclatura-e-glossario.md) |
| Ver as fontes, licenças e o formato dos arquivos | [06 · Dados, fontes e esquemas](docs/06-dados-fontes-e-esquemas.md) |
| Usar ou modificar o site | [07 · Site](docs/07-site.md) |
| Saber o que falta e o que vem depois | [08 · Limitações e roadmap](docs/08-limitacoes-e-roadmap.md) |
| Atualizar os dados | [09 · Como atualizar](docs/09-como-atualizar.md) |
| Publicar em domínio próprio | [10 · Publicação](docs/10-publicacao.md) |

## Fontes e licença dos dados

Os dados vêm do World Development Indicators e dos Worldwide Governance Indicators do Banco Mundial, e do Índice de Desenvolvimento Humano do PNUD. Todos são distribuídos sob a licença CC BY 4.0 pelo espelho mantido pela Gapminder/open-numbers. Quem reutilizar os dados precisa citar as fontes originais. Detalhes em [docs/06](docs/06-dados-fontes-e-esquemas.md).
