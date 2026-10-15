# 09 · Como atualizar

## 1. Regenerar os dados

Na raiz do repositório:

```bash
python scripts/baixar_brutos.py      # baixa os CSV do espelho para brutos/
python scripts/build_dados.py        # recalcula tudo e grava dados/*.json
python scripts/gerar_dicionario.py   # atualiza docs/04 com a cobertura nova
```

`build_dados.py` imprime no fim um resumo para conferência: o escore geral do Brasil por ano, os escores por tema e a posição no ranking. Compare com a versão anterior antes de publicar. Saltos grandes costumam vir de uma série revisada ou de um país novo no universo.

### Checklist de conferência
- [ ] Os 8 arquivos de `dados/` foram regravados (confira a data de modificação).
- [ ] `indicadores.json` mostra `ultimo_ano` coerente (a maioria 2024 ou 2025).
- [ ] O PIB per capita PPC do Brasil no último ano bate com o site do Banco Mundial (`NY.GDP.PCAP.PP.KD`).
- [ ] O número de países no ranking (`ranking_brasil.json`) está perto de 175.
- [ ] Nenhum tema do Brasil ficou sem escore no último ano.

## 2. Levar os dados ao dashboard

Os arquivos do dashboard são ativos (*assets*) do artifact, e cada conjunto de dados aponta para um deles. O jeito mais simples é pedir ao Claude:

> "Atualize o dashboard Brasil em perspectiva com os arquivos de `dados/` do repositório Monitora-Brasil."

O que o Claude faz por trás, para referência:
1. Envia cada JSON como ativo do artifact (`Artifact` com `asset: true`), recebendo uma URL `/_blob/<id>`.
2. Atualiza cada `datasets/<id>` no banco do artifact com `source.url` nova e `updated.at` com a data.
3. Apaga os ativos antigos que deixaram de ser usados.

## 3. Mudar regras de cálculo

| Quero mudar... | Onde |
|---|---|
| Lista de indicadores, sentido ou alvo | `IND` em `scripts/build_dados.py` (+ `CODES` em `baixar_brutos.py`) |
| Coortes | `COHORTS` em `build_dados.py` e `COORTES` em `dashboard/index.html` |
| Limite de imputação | `FILL` em `build_dados.py` |
| Período dos escores | `SCORE_Y0` em `build_dados.py` |
| Mandatos | `PERIODS` em `build_dados.py` e `PERIODOS` / `MANDATO` em `dashboard/index.html` |
| Mínimo de países para calcular percentil | `if n<20` na seção de percentis de `build_dados.py` |

Toda mudança de regra deve ser registrada em `docs/03-metodologia.md` no mesmo commit.

## 4. Versionamento

- Mensagens de commit em português, no imperativo, descrevendo o que mudou nos dados ou no método (ex.: "Atualiza dados até 2026; inclui ICE no tema produtivo").
- Os dados derivados (`dados/`) são versionados para que o dashboard possa ser reconstruído sem rodar o pipeline. Os brutos (`brutos/`) não são.
