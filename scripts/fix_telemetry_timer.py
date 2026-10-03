from pathlib import Path
p=Path('src/lib/gemini.ts')
s=p.read_text()
old='''async function chamarOpenAI(partes: Parte[], opcoes: { schema?: object; pesquisar?: boolean; sistema?: string; temperatura?: number; leve?: boolean; esforco?: "low" | "medium"; tempo?: number; maxBuscas?: number; tarefa?: string }, json: boolean): Promise<string> {\n  const chave = process.env.OPENAI_API_KEY!;\n'''
new='''async function chamarOpenAI(partes: Parte[], opcoes: { schema?: object; pesquisar?: boolean; sistema?: string; temperatura?: number; leve?: boolean; esforco?: "low" | "medium"; tempo?: number; maxBuscas?: number; tarefa?: string }, json: boolean): Promise<string> {\n  const chave = process.env.OPENAI_API_KEY!;\n  const inicioChamada = Date.now();\n'''
if old not in s: raise SystemExit('marcador não encontrado')
p.write_text(s.replace(old,new,1))
