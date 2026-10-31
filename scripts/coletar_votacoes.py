"""Coleta os dados da aba "Leis e votação" do Monitora Brasil: as votações nominais do Plenário da
Câmara dos Deputados e o voto de cada deputado.

Fonte: Dados Abertos da Câmara dos Deputados, arquivos anuais completos
(https://dadosabertos.camara.leg.br/swagger/api.html, seção "Arquivos"):
  - votacoes-AAAA.json            todas as votações do ano, com o órgão (Plenário = PLEN)
  - votacoesVotos-AAAA.json       o voto de cada deputado nas votações nominais
  - votacoesProposicoes-AAAA.json as proposições afetadas por cada votação
  - votacoesOrientacoes-AAAA.json a orientação de cada partido, bloco, Governo e Oposição

Só entram as votações do Plenário com registro nominal (painel eletrônico). As votações simbólicas
não dizem quem votou o quê e ficam de fora.

Gera site/data/votacoes.json (lista de votações, placar, proposição e orientação do Governo) e
site/data/votos/AAAA.json (o voto de cada deputado, um arquivo por ano, carregado pelo site só quando
preciso). Roda no GitHub Actions (.github/workflows/dados-votacoes.yml). Para testar sem internet:
--cache PASTA com os arquivos já reduzidos (PASTA/AAAA.json, no formato de reduzir()).
"""
import argparse, gzip, json, re, time, urllib.request
from collections import Counter
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
UA = {'User-Agent': 'MonitoraBrasil/1.0 (+https://github.com/ChrisBerenguer/Monitora-Brasil)', 'Accept-Encoding': 'gzip'}
ARQ = 'https://dadosabertos.camara.leg.br/arquivos/{f}/json/{f}-{ano}.json'
ANO_INICIAL = 2019  # início da 56ª legislatura
VOTO = {'Sim': 0, 'Não': 1, 'Abstenção': 2, 'Obstrução': 3, 'Artigo 17': 4}  # outro ou vazio = 5
TIPOS_PRINCIPAIS = ('PEC', 'PLP', 'PL', 'MPV', 'PLV', 'PDL', 'PRC', 'PLN')


def baixar(url, tentativas=3, timeout=300):
    for t in range(tentativas):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
                b = r.read()
                return gzip.decompress(b) if b[:2] == b'\x1f\x8b' else b
        except Exception as e:  # noqa: BLE001
            print(f'  tentativa {t + 1} falhou: {e}')
            time.sleep(5 * (t + 1))
    raise RuntimeError(f'não consegui baixar {url}')


def reduzir(ano):
    """Baixa os quatro arquivos do ano e guarda só o Plenário com votos nominais."""
    J = lambda f: json.loads(baixar(ARQ.format(f=f, ano=ano)))['dados']  # noqa: E731
    plen = [v for v in J('votacoes') if v.get('siglaOrgao') == 'PLEN']
    ids = {v['id'] for v in plen}
    votos, deps = {}, {}
    for x in J('votacoesVotos'):
        if x['idVotacao'] not in ids:
            continue
        d = x['deputado_']
        deps[str(d['id'])] = [d['nome'], d['siglaUf']]
        votos.setdefault(x['idVotacao'], []).append([int(d['id']), d.get('siglaPartido') or '', x['voto']])
    props = {}
    for x in J('votacoesProposicoes'):
        if x['idVotacao'] in ids:
            p = x['proposicao_']
            props.setdefault(x['idVotacao'], []).append({k: p.get(k) for k in ('id', 'titulo', 'siglaTipo', 'numero', 'ano', 'ementa')})
    orient = {}
    for x in J('votacoesOrientacoes'):
        if x['idVotacao'] in ids:
            orient.setdefault(x['idVotacao'], {})[x['siglaBancada']] = x['orientacao']
    vot = [{k: v.get(k) for k in ('id', 'dataHoraRegistro', 'descricao', 'aprovacao', 'votosSim', 'votosNao', 'votosOutros')}
           for v in plen if v['id'] in votos]
    return {'votacoes': vot, 'votos': votos, 'deputados': deps,
            'proposicoes': {v['id']: props.get(v['id'], []) for v in vot},
            'orientacoes': {v['id']: orient.get(v['id'], {}) for v in vot}}


def tipo_votacao(desc):
    """Classifica o que foi votado pela descrição: o texto do projeto, urgência, outros requerimentos,
    destaques e emendas, ou outros (redação final e afins)."""
    d = desc.strip()
    # tira o verbo e o aposto ("Aprovada, em segundo turno, a ..."; "Aprovado, por unanimidade, o ...")
    corpo = re.sub(r'^(Aprovad[oa]s?|Rejeitad[oa]s?|Mantid[oa]s?|Prejudicad[oa]s?|Suprimid[oa]s?)(?:\s*,[^,]*,)?\s+(?:a |o |as |os )?', '', d, flags=re.I)
    if re.match(r'requerimento', corpo, re.I):
        return 'urgencia' if re.search(r'urg[êe]ncia', corpo[:80], re.I) else 'requerimento'
    if re.match(r'(Mantid|Suprimid)', d, re.I) or re.match(r'(texto|emenda(?!s do senado)|subemenda(?! substitutiva)|parte|preferência|destaque|admissibilidade d[oe]s? destaques?|dispositivo|expressão|art)', corpo, re.I):
        return 'destaque'
    if re.match(r'reda[çc][ãa]o final', corpo, re.I):
        return 'outros'
    if re.match(r'(projeto|proposta|substitutivo|sube?menda substitutiva|medida provis|parecer|PEC|emendas? do senado|mensagem)', corpo, re.I):
        return 'principal'
    return 'outros'


def proposicao_principal(desc, props):
    """A proposição que a votação decide: a citada na descrição, ou a primeira de tipo principal."""
    if not props:
        return None
    d = re.sub(r'(?<=\d)\.(?=\d{3})', '', desc)  # "nº 1.312" vira "nº 1312"
    for p in props:
        if p.get('numero') and p.get('siglaTipo') in TIPOS_PRINCIPAIS and re.search(rf'n[ºo°]\s*{p["numero"]}\b', d):
            return p
    return next((p for p in props if p.get('siglaTipo') in TIPOS_PRINCIPAIS), props[0])


def limpar_desc(d):
    return re.sub(r'\s*Sim:?\s*\d+\s*;.*$', '', d or '', flags=re.I).strip()


def gravar(nome, obj):
    txt = json.dumps(obj, ensure_ascii=False, separators=(',', ':'))
    for pasta in (RAIZ / 'dados', RAIZ / 'site' / 'data'):
        (pasta / nome).parent.mkdir(parents=True, exist_ok=True)
        (pasta / nome).write_text(txt, encoding='utf-8')
    print(f'gravado {nome} ({len(txt) / 1024:.0f} KB)')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cache', help='pasta com os arquivos já reduzidos (AAAA.json)')
    args = ap.parse_args()
    anos = range(ANO_INICIAL, date.today().year + 1)
    reduzidos = {}
    for ano in anos:
        if args.cache:
            f = Path(args.cache) / f'{ano}.json'
            if f.exists():
                reduzidos[ano] = json.loads(f.read_text(encoding='utf-8'))
            continue
        print('baixando', ano)
        try:
            reduzidos[ano] = reduzir(ano)
        except RuntimeError as e:
            # a Câmara às vezes recusa conexões de fora do Brasil (como o GitHub Actions): mantém os
            # arquivos atuais e tenta de novo na próxima rodada
            print(f'::warning::{e}. Dados de votações mantidos sem mudança; nova tentativa na próxima rodada.')
            return

    deputados, lista, proposicoes = {}, [], {}
    for ano, R in sorted(reduzidos.items()):
        deputados.update(R['deputados'])
        partidos, deps_idx, votos_ano = [], [], {}
        pi, di = {}, {}
        for v in sorted(R['votacoes'], key=lambda v: v['dataHoraRegistro']):
            vs = R['votos'][v['id']]
            cont = Counter(VOTO.get(x[2], 5) for x in vs)
            cod = []
            for dep, part, voto in vs:
                if part not in pi:
                    pi[part] = len(partidos); partidos.append(part)
                if dep not in di:
                    di[dep] = len(deps_idx); deps_idx.append(dep)
                cod.append((di[dep] * 64 + pi[part]) * 8 + VOTO.get(voto, 5))  # deputado, partido e voto num número só
            votos_ano[v['id']] = cod
            p = proposicao_principal(v.get('descricao') or '', R['proposicoes'].get(v['id'], []))
            if p:
                proposicoes[str(p['id'])] = [p['titulo'], (p.get('ementa') or '')[:500]]
            org = R['orientacoes'].get(v['id'], {})
            lista.append({
                'id': v['id'], 'quando': v['dataHoraRegistro'][:16], 'desc': limpar_desc(v['descricao']),
                'aprovada': v.get('aprovacao'), 'tipo': tipo_votacao(v.get('descricao') or ''),
                'sim': cont[0], 'nao': cont[1], 'abst': cont[2], 'obstr': cont[3], 'outros': cont[4] + cont[5],
                'prop': p['id'] if p else None,
                'governo': org.get('Governo') or org.get('GOV.') or None, 'oposicao': org.get('Oposição') or None,  # antes de 2023 o Governo aparece também como "GOV."
            })
        assert len(partidos) <= 64, 'mais de 64 partidos num ano: aumentar o espaço do código'
        gravar(f'votos/{ano}.json', {'ano': ano, 'deputados': deps_idx, 'partidos': partidos, 'votos': votos_ano})
        print(f'  {ano}: {len(votos_ano)} votações nominais, {len(deps_idx)} deputados, {len(partidos)} partidos')
    novo = {
        'coletado_em': date.today().isoformat(),
        'anos': sorted(reduzidos),
        'deputados': deputados,  # id: [nome, UF]
        'proposicoes': proposicoes,  # id: [título, ementa]
        'votacoes': lista,
        'codigo_voto': ['Sim', 'Não', 'Abstenção', 'Obstrução', 'Artigo 17', 'Outro'],
    }
    # sem votação nova, mantém a data da coleta anterior (evita um commit só para mudar a data)
    atual = RAIZ / 'site' / 'data' / 'votacoes.json'
    if atual.exists():
        velho = json.loads(atual.read_text(encoding='utf-8'))
        if {**velho, 'coletado_em': None} == {**novo, 'coletado_em': None}:
            novo['coletado_em'] = velho['coletado_em']
    gravar('votacoes.json', novo)
    print(Counter(v['tipo'] for v in lista))


if __name__ == '__main__':
    main()
