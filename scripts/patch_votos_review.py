from pathlib import Path
p=Path('src/lib/ficha.ts'); s=p.read_text()
def once(a,b,n):
 global s
 if a not in s: raise SystemExit('faltou '+n)
 s=s.replace(a,b,1)
once('origem: base?.origem ?? "estimativa",','origem: "estimativa",','origem')
once('votos: votosVazios(f.votos), fixacaoH: 0, projecaoM: 0','votos: votosVazios(f.votos), fixacaoH: undefined, projecaoM: undefined','invalidar')
once('''async function votosDuplicadosNoAcervo(nome: string, casa: string, fixacao?: number[] | null, projecao?: number[] | null) {\n  if (!temVotos(fixacao) || !temVotos(projecao)) return false;\n  const fx = assinaturaVotos(fixacao), pj = assinaturaVotos(projecao);\n  const { perfumes } = await carregarAcervo();\n  return [...perfumes.values()].some((p) => {\n    if (normal(p.nome) === normal(nome) && normal(p.casa) === normal(casa)) return false;\n    return assinaturaVotos(p.votos?.fixacao) === fx && assinaturaVotos(p.votos?.projecao) === pj;\n  });\n}''','''async function votosDuplicadosNoAcervo(nome: string, casa: string, votos?: VetoresVotos & { total?: number | null; origem?: "fragrantica" | "estimativa" | null }) {\n  const ePacificAura = normal(nome) === "pacific aura" && normal(casa).includes("rayhaan");\n  if (ePacificAura || votos?.origem !== "fragrantica" || !Number(votos?.total) || !temVotos(votos?.fixacao) || !temVotos(votos?.projecao)) return false;\n  const fx = assinaturaVotos(votos.fixacao), pj = assinaturaVotos(votos.projecao), total = Number(votos.total);\n  const acervo = await carregarAcervo();\n  return acervo.colecao.some(({ perfume: p }) => {\n    if (normal(p.nome) === normal(nome) && normal(p.casa) === normal(casa)) return false;\n    if (p.votos?.origem !== "fragrantica" || !Number(p.votos.total) || Number(p.votos.total) !== total) return false;\n    return assinaturaVotos(p.votos.fixacao) === fx && assinaturaVotos(p.votos.projecao) === pj;\n  });\n}''','duplicados')
once('fixacaoH: votos && temVotos(votos.fixacao) ? horasDosVotos(votos.fixacao) : 0,','fixacaoH: votos && temVotos(votos.fixacao) ? horasDosVotos(votos.fixacao) : undefined,','fh')
once('projecaoM: votos && temVotos(votos.projecao) ? metrosDosVotos(votos.projecao) : 0,','projecaoM: votos && temVotos(votos.projecao) ? metrosDosVotos(votos.projecao) : undefined,','pm')
once('await votosDuplicadosNoAcervo(nome, casa, fx, pj)','await votosDuplicadosNoAcervo(nome, casa, (data.votos as Votos | null) ?? undefined)','salva')
once('await votosDuplicadosNoAcervo(f.nome, f.casa, f.votos?.fixacao, f.votos?.projecao)','await votosDuplicadosNoAcervo(f.nome, f.casa, f.votos)','comp1')
once('await votosDuplicadosNoAcervo(f.nome, f.casa, novos.fixacao, novos.projecao)','await votosDuplicadosNoAcervo(f.nome, f.casa, novos)','comp2')
once('await votosDuplicadosNoAcervo(pronta.nome || c.nome, pronta.casa || c.casa, pronta.votos?.fixacao, pronta.votos?.projecao)','await votosDuplicadosNoAcervo(pronta.nome || c.nome, pronta.casa || c.casa, pronta.votos)','principal')
p.write_text(s)
