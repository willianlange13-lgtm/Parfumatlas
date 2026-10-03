from pathlib import Path

p = Path('src/lib/gemini.ts')
s = p.read_text()

s = s.replace('import "server-only";\n', 'import "server-only";\nimport { registrarIA } from "@/lib/telemetria-ia";\n', 1)
s = s.replace('maxBuscas?: number } = {}', 'maxBuscas?: number; tarefa?: string } = {}')
s = s.replace('maxBuscas?: number }, json: boolean', 'maxBuscas?: number; tarefa?: string }, json: boolean')
s = s.replace('maxBuscas?: number }, json: boolean): Promise<string> {', 'maxBuscas?: number; tarefa?: string }, json: boolean): Promise<string> {')

old = '  const chave = process.env.GEMINI_API_KEY;\n  if (!chave) throw new Error("Nenhum provedor de IA configurado");\n'
new = '  const chave = process.env.GEMINI_API_KEY;\n  if (!chave) throw new Error("Nenhum provedor de IA configurado");\n  const inicioChamada = Date.now();\n  let modeloUsado = "";\n'
s = s.replace(old, new, 1)
s = s.replace('  externo: for (const modelo of MODELOS(opcoes.leve)) {\n', '  externo: for (const modelo of MODELOS(opcoes.leve)) {\n    modeloUsado = modelo;\n', 1)

old = '  const j = await r.json();\n  const texto: string = (j.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");\n'
new = '''  const j = await r.json();
  const uso = j.usageMetadata ?? {};
  const consultas = j.candidates?.[0]?.groundingMetadata?.webSearchQueries;
  registrarIA({
    tarefa: opcoes.tarefa ?? (opcoes.pesquisar ? "pesquisa" : "geracao"),
    provedor: "gemini",
    modelo: modeloUsado,
    pesquisaWeb: Boolean(opcoes.pesquisar),
    duracaoMs: Date.now() - inicioChamada,
    sucesso: true,
    status: r.status,
    buscasReais: Array.isArray(consultas) ? consultas.length : 0,
    inputTokens: Number(uso.promptTokenCount ?? 0) || null,
    outputTokens: Number(uso.candidatesTokenCount ?? 0) || null,
  });
  const texto: string = (j.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
'''
s = s.replace(old, new, 1)

old = 'async function chamarOpenAI(partes: Parte[], opcoes: { schema?: object; pesquisar?: boolean; sistema?: string; temperatura?: number; leve?: boolean; esforco?: "low" | "medium"; tempo?: number; maxBuscas?: number }, json: boolean): Promise<string> {\n  const chave = process.env.OPENAI_API_KEY!;\n'
new = 'async function chamarOpenAI(partes: Parte[], opcoes: { schema?: object; pesquisar?: boolean; sistema?: string; temperatura?: number; leve?: boolean; esforco?: "low" | "medium"; tempo?: number; maxBuscas?: number; tarefa?: string }, json: boolean): Promise<string> {\n  const chave = process.env.OPENAI_API_KEY!;\n  const inicioChamada = Date.now();\n'
s = s.replace(old, new, 1)

old = '    const j = await r.json();\n    const texto: string = (j.output ?? [])\n'
new = '''    const j = await r.json();
    const buscasReais = (j.output ?? []).filter((o: { type?: string }) => o.type === "web_search_call").length;
    registrarIA({
      tarefa: opcoes.tarefa ?? (opcoes.pesquisar ? "pesquisa" : "geracao"),
      provedor: "openai",
      modelo,
      pesquisaWeb: Boolean(opcoes.pesquisar),
      duracaoMs: Date.now() - inicioChamada,
      sucesso: true,
      status: r.status,
      buscasReais,
      inputTokens: Number(j.usage?.input_tokens ?? 0) || null,
      outputTokens: Number(j.usage?.output_tokens ?? 0) || null,
    });
    const texto: string = (j.output ?? [])
'''
s = s.replace(old, new, 1)

p.write_text(s)

f = Path('src/lib/ficha.ts')
t = f.read_text()
t = t.replace('{ schema: SCHEMA_ID, pesquisar: true, leve: true, maxBuscas: 2 }', '{ schema: SCHEMA_ID, pesquisar: true, leve: true, maxBuscas: 2, tarefa: "identificar_nome" }')
t = t.replace('{ schema: SCHEMA_PRINCIPAL, pesquisar: !paginaCompleta, maxBuscas: 4 }', '{ schema: SCHEMA_PRINCIPAL, pesquisar: !paginaCompleta, maxBuscas: 4, tarefa: "ficha" }')
t = t.replace('{ schema: SCHEMA_EXTRA, pesquisar: true, leve: true, tempo: 80000, maxBuscas: 3 }', '{ schema: SCHEMA_EXTRA, pesquisar: true, leve: true, tempo: 80000, maxBuscas: 3, tarefa: "votos" }')
t = t.replace('{ schema: SCHEMA_T, leve: true, tempo: 30000 }', '{ schema: SCHEMA_T, leve: true, tempo: 30000, tarefa: "traducao" }')
f.write_text(t)
