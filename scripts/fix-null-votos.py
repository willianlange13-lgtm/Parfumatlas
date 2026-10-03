from pathlib import Path
p=Path('src/lib/ficha.ts')
s=p.read_text()
s=s.replace('!temVotos(votos?.fixacao) || !temVotos(votos?.projecao)', '!temVotos(votos?.fixacao ?? undefined) || !temVotos(votos?.projecao ?? undefined)', 1)
p.write_text(s)
