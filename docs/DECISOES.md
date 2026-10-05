# Decisões técnicas do PARFUM ATLAS

Este arquivo registra decisões que não devem ser inferidas apenas pelo estado atual do código. Antes de alterar provedores de IA, ficha, identificação, pesquisa web, famílias olfativas ou semelhantes, leia este documento.

## 1. Princípio de arquitetura de IA

A direção aprovada é:

1. reaproveitar/cachear o que já é conhecido;
2. usar lógica local quando possível;
3. usar IA econômica em tarefas em que ela tenha qualidade comprovada;
4. recorrer a IA premium quando precisão, pesquisa ou complexidade exigirem.

Gemini não deve ser tratado como motor universal do Atlas. Ele deve ser aprovado tarefa por tarefa. OpenAI também não deve ser chamada por padrão quando cache ou lógica local resolvem o problema.

## 2. Histórico do Gemini

O Atlas começou usando Gemini. Em testes reais de produção foram observados:

- modelo `gemini-2.5-flash` indisponível/fora de linha em determinado momento, exigindo migração para aliases atuais;
- respostas 429 e 503 por limite/cota;
- dificuldade para encontrar perfumes recentes quando a identificação não tinha pesquisa web;
- invenção de notas e votos quando a pesquisa falhava.

Por isso o cadastro principal migrou para OpenAI e recebeu várias correções específicas ao longo do desenvolvimento.

Consequência: não trocar o provedor global do cadastro sem teste funcional lado a lado.

## 3. Ficha principal aprovada

O caminho que ficou aprovado no uso real incorporou estas regras:

- pirâmide e acordes precisam seguir a fonte correta e não misturar dados de resenhas;
- notas devem ser normalizadas para português;
- votos devem usar contagens quando disponíveis e ser convertidos corretamente;
- quando votos exatos não aparecem, usar estimativa explicitamente marcada como estimativa;
- concentração não pode ser inferida como Colônia sem evidência do frasco, marca ou loja;
- respostas precisam sair em JSON completo, sem perguntas ao usuário;
- a ficha principal deve responder dentro do limite operacional da Vercel;
- votos faltantes podem ser completados em segunda etapa;
- família do Atlas deve ser uma das 8 categorias aprovadas: Floral, Cítrica, Amadeirada, Oriental, Aromática, Frutal, Gourmand ou Chipre;
- descrição: UMA frase de até 15 palavras sobre o cheiro.

### Campos que o Willian retirou da ficha (não religar sem ele pedir)

Perfumistas, fontes, ocasiões, fixação × temperatura, descrição longa, "Da mesma casa", semelhantes e anotações. "Quando usar" ficou.

### Nunca usar números de perfume real como exemplo de prompt

Os exemplos com os votos reais do Pacific Aura e um vetor fixo de estimativa foram copiados pela IA para outros perfumes (votos repetidos). Exemplos de prompt devem descrever o formato, nunca trazer números reais. O detector `votosSuspeitos()` em `src/lib/ficha.ts` barra os vetores antigos conhecidos.

Não regredir essas regras ao trocar de fornecedor.

### Votos: média da comunidade + ajuste pessoal (decisão de 03/10/2026)

A contagem exata de votos do Fragrantica não é lida de forma confiável pela pesquisa (nem pelo modelo mais forte). Decisão do Willian: a ficha traz a média da comunidade (estimativa marcada como estimativa) e ele ajusta pelo que o perfume rende nele.

- o ajuste pessoal fica em `colecao.minha_fixacao` (1–5) e `colecao.minha_projecao` (1–4), por nível com faixa de horas/metros (`NIVEIS_FIXACAO` / `NIVEIS_PROJECAO` em `src/lib/normalizar.ts`, mesma régua de `horasDosVotos`);
- pode ser marcado no cadastro (passo Salvar, celular) e em Editar;
- na ficha, o medidor mostra o valor pessoal e a média da comunidade junto;
- contagem real conferida à mão pode ser gravada sem custo em `/api/diagnostico?votos=gravar` (ex.: Pacific Aura);
- limpeza histórica: `/api/diagnostico?votos=1` lista votos suspeitos (só leitura).

## 4. Fragrantica e pesquisa web

O Fragrantica bloqueia leitura direta do servidor da Vercel em vários cenários. Portanto, não assumir que `fetch` direto da página será suficiente.

Quando o dado necessário não estiver disponível localmente, a ficha pode depender de pesquisa web via provedor de IA ou de outra fonte pública compatível.

`url_context` não deve ser tratado como garantia de leitura do Fragrantica.

## 5. Custo real observado

O maior componente de custo observado não foi token puro, mas chamadas de ferramenta de pesquisa web.

Isso significa que a principal estratégia de economia deve ser reduzir pesquisas repetidas, não apenas trocar o modelo por outro mais barato.

### Vazamento já corrigido

Links de resultado estavam sendo pré-carregados pelo Next.js. A página de resultado montava ficha com IA, então apenas rolar a interface podia disparar várias fichas pagas.

Correção aplicada:

- `prefetch={false}` nos links relevantes;
- página de resultado (`src/app/buscar/resultado/page.tsx`) ignora pedidos de pré-carregamento pelos cabeçalhos `next-router-prefetch`, `next-router-segment-prefetch`, `purpose` e `sec-purpose`.

Não remover essa proteção sem entender o impacto de custo.

## 6. Limites de pesquisa

Limites atuais (`max_tool_calls` na OpenAI):

- busca por nome: 2 buscas;
- ficha principal: 4 buscas;
- complemento de votos: 3 buscas.

### Busca por nome

- enquanto a pessoa digita, a busca é só no catálogo local, sem IA;
- a IA só entra quando a pessoa confirma a busca, e devolve opções;
- o usuário sempre escolhe o perfume; a ficha só é montada depois da escolha.

A pesquisa web deve ter teto quando o provedor permitir.

## 7. Semelhantes

A seção de semelhantes foi retirada da ficha pelo Willian e atualmente não deve ser tratada como fluxo principal do produto.

Histórico importante dos testes:

- modelos nano e mini produziram relações erradas em testes;
- o modelo completo teve melhor desempenho para a lista especializada;
- o parentesco olfativo manda na ordenação; casa e reconhecimento na comunidade entram apenas como desempate;
- pesquisa pela ótica da comunidade brasileira (Fragrantica Brasil, YouTube/Instagram e lojas brasileiras);
- só entram casas brasileiras, americanas ou árabes (`casaPermitida` em `src/data/casas.ts`); o original pode ser de qualquer país;
- reconhecimento na comunidade de 1 a 5;
- lista deve ter 7 referências principais, com no máximo 2 itens `fora do radar`;
- o perfume original nunca deve desaparecer da estrutura quando a relação de inspiração já é conhecida;
- fotos derivadas de URLs inventadas podem mostrar o frasco errado; quando essa seção voltar, a conferência da foto deve ser preservada ou substituída por mecanismo equivalente.

Se a pesquisa premium de semelhantes voltar a ser ativada, não assumir que `gpt-5-mini` substitui o modelo que passou nos testes. Revalidar qualidade.

## 7b. Fotos das notas

Fotos das notas vêm da Wikipédia, servidas pelo próprio Atlas em `/api/nota-foto` (proxy dos bytes, miniatura padrão de 330 px). Só resposta com sucesso entra em cache: um redirecionamento ou erro guardado no aparelho deixava a foto quebrada para sempre. O `&v=3` na URL força a troca do cache antigo.

## 8. Sommelier

O Sommelier já possui lógica local útil, considerando dados como clima, ocasião, adequação, DNA e histórico de uso.

Direção aprovada:

- lógica local primeiro;
- IA apenas quando agregar redação, nuance ou análise que a lógica local não cobre;
- não transformar toda interação do Sommelier em chamada obrigatória de LLM.

## 9. Regra para provedores

A decisão de provedor deve evoluir para ser por chamada/tarefa, não uma chave global que muda o comportamento do app inteiro.

Exemplo de intenção futura:

- `FAST`: transformação, tradução, classificação;
- `RESEARCH`: tarefa que exige web e maior precisão;
- `PREMIUM`: investigação em que os modelos baratos falharam;
- `LOCAL_FIRST`: tenta resolver sem IA antes de qualquer chamada.

Quando Gemini retornar 429/503 e houver OpenAI configurada, a direção aprovada é permitir fallback daquela chamada para OpenAI, em vez de derrubar todo o fluxo.

## 10. Modelos Gemini

Separar o conceito de modelo rápido/econômico do modelo de pesquisa:

- `GEMINI_MODEL_FAST`: tarefas simples e sem necessidade forte de pesquisa;
- `GEMINI_MODEL_RESEARCH`: tarefas com pesquisa, ficha e precisão maior.

Não usar automaticamente o modelo Lite na ficha principal apenas por ser mais barato.

## 11. Cache global de fichas

Próxima direção arquitetural aprovada:

- chave lógica por `nome normalizado + casa normalizada`;
- uma ficha confiável já pesquisada deve ser reaproveitada;
- só refazer pesquisa quando a ficha estiver incompleta, inválida ou explicitamente marcada para atualização.

Isso tende a economizar mais do que apenas trocar de fornecedor.

## 12. Telemetria de custo e uso

Antes de novas otimizações grandes, registrar por chamada pelo menos:

- função/tarefa;
- provedor;
- modelo;
- duração;
- uso de pesquisa web;
- sucesso/falha;
- buscas reais (OpenAI: itens `web_search_call` em `output`; Gemini: `groundingMetadata.webSearchQueries`);
- tokens de entrada e saída.

Estado: ligada em `src/lib/telemetria-ia.ts` / `src/lib/gemini.ts`. Cada chamada gera uma linha `[atlas:ia]` nos logs da Vercel, inclusive falhas e pesquisas em segundo plano. Nunca registrar prompt, resposta, chave de API ou e-mail. Os logs da Vercel têm retenção curta no plano gratuito: para medir por semanas, copiar os números antes que expirem ou gravar um resumo no banco.

Objetivo: medir o ganho real de cada mudança sem depender apenas do painel externo do provedor.

## 13. Teste de aceitação para Gemini

Gemini só deve virar padrão de uma tarefa depois de comparação lado a lado com o caminho aprovado.

Perfumes mínimos de teste:

- Pacific Aura — Rayhaan;
- Nava Sol;
- pelo menos mais dois perfumes recentes conhecidos pelo Willian.

Critérios:

- busca por nome encontra o perfume correto;
- pirâmide correta;
- acordes corretos;
- nenhuma nota em inglês após normalização;
- concentração correta;
- país correto;
- votos não zerados ou claramente marcados como estimativa;
- tempo dentro do limite da Vercel;
- cinco cadastros seguidos sem falha por 429;
- comparação OpenAI × Gemini campo por campo.

"Funcionou" não é critério suficiente: a qualidade deve ser equivalente para a tarefa proposta e o custo precisa justificar a troca.

## 14. Mudanças na main

Regra operacional:

- apenas uma pessoa/IA implementa por vez; a outra revisa;
- desde 03/10/2026 (noite) o Claude conduz a implementação, com envio direto na `main` por escolha do Willian, sempre com build verde antes;
- não fazer nova troca de provedor diretamente na `main` sem teste funcional.

## 15. Estado de contingência

Enquanto a nova arquitetura por tarefa não estiver validada, a configuração segura para manter o cadastro no caminho já aprovado é:

`AI_PROVIDER=openai`

Isso é uma medida de estabilidade, não a arquitetura final desejada.

## 16. Acervo global de perfumes

Tabela `acervo` (SQL em `supabase/migrations/0002_acervo.sql`), global e não por usuário. O Willian monta os lotes no ChatGPT (assinatura dele, sem custo de API) lendo o Fragrantica e importa em **Configurações › Acervo de perfumes** (`/configuracoes/acervo`). A importação não usa IA.

- formato: JSON Lines com chaves curtas `n, c, u, s, m, f, a, fx, pj` (também aceita lista JSON e chaves por extenso);
- chave = nome + casa normalizados; repetido é mesclado sem apagar dado bom;
- link só é guardado se for do Fragrantica e tiver o nome do perfume no endereço (senão a foto pode ser de outro);
- ordem de procura na busca por nome: catálogo/coleção → acervo → IA paga. Se o acervo ou o catálogo achar com 90% ou mais, a IA não é chamada;
- na foto, o rótulo lido pela IA é conferido no acervo para ganhar link e foto sem pesquisa;
- ficha a partir do acervo sem IA (`fichaDoAcervo`): pirâmide, acordes, família, foto; fixação/projeção vêm só do nível mais votado (`votos.origem = "acervo"`), sem distribuição inventada. Ano, concentração e país ficam para revisar;
- a tabela `perfumes` continua sendo o cache das fichas completas (`fichaSalva`).
- o lote também traz concentração (`k`), ano (`y`) e gênero (`g`) (colunas de `0003_acervo_campos.sql`); o país sai da casa (`paisDaCasa` em `src/data/casas.ts`, só casas com país conhecido);
- ficha do acervo: a IA completa em segundo plano SÓ o que ficou vazio (ano, concentração, gênero, descrição, "quando usar" e a contagem de votos se o lote não trouxe), modelo leve, no máximo 2 buscas (`completarDoAcervo`, tarefa `completar_acervo`). Nunca troca pirâmide, acordes nem o que o Willian escolheu; ano/concentração/gênero voltam para o acervo. Concentração e gênero têm caixa de seleção no cadastro e em Editar (`CONCENTRACOES`, `GENEROS`);
- selo de origem: o cadastro mostra "Do acervo · sem custo", "Reaproveitada · sem custo" ou "Pesquisada com IA · paga", e a busca "com IA" ou "sem IA"; a ficha salva guarda `fonteFicha` ("acervo" | "ia").
- perfume fora do acervo: a pesquisa paga monta a ficha e o resultado entra no acervo (`guardarNoAcervo`, origem "pesquisa"), com o link do candidato escolhido; os votos da segunda etapa dão o nível mais votado. Quando o perfume já existe no acervo, a pesquisa só completa o que estava vazio: quem manda é o lote importado. Na importação de lote, lista corrigida (mesmo tamanho ou maior) substitui.

## 17. Foto oficial do frasco sem fundo

A foto oficial do Fragrantica (frasco em fundo branco) é tratada pelo próprio Atlas em `/api/frasco?id=<número da página>`: baixa do fimgs.net, apaga o branco ligado à borda (flood fill, `src/lib/recortar.ts`), recorta no frasco e devolve PNG transparente. Branco dentro do frasco (rótulo) fica. Sem IA; a CDN da Vercel guarda por 1 ano. Se o download falhar, redireciona para a foto original (sem cache da falha).

- `semFundo()` (`src/lib/sem-fundo.ts`) troca o endereço do fimgs.net pelo tratado; aplicado ao ler do banco (`perfumeDaLinha`) e nas prévias do cadastro. No banco continua o endereço original;
- foto oficial aparece sem fundo, com sombra; foto do próprio Willian preenche o quadro (cover);
- frasco claro (mais de 40% do frasco quase branco) não é recortado: separar vidro branco de fundo branco dá serrilhado. Vira cartão (sobra branca cortada, cantos arredondados);
- no destaque grande do Início vale só a foto oficial (decisão do Willian); sem ela, o frasco desenhado.

- **Recorte v4 (out/2026, decisão do Willian: "só o frasco, com sombra e luz")**: o apagamento do fundo agora para nas bordas do frasco (variação de tom), tira sobras soltas e suaviza o contorno; a beirada pega a cor de dentro do frasco (sem contorno branco em frasco escuro). Com isso frasco branco e vidro claro também saem recortados; o cartão com fundo branco ficou só como último recurso (resultado sem sentido). No Início, a foto oficial recortada tem prioridade sobre a foto que você tirou. Cache sobe para v=4.
- **Recorte v5**: a cor do fundo é lida na moldura da foto (algumas vêm em cinza bem claro, não branco); o halo do JPEG em volta de frasco escuro sai (só onde há frasco bem mais escuro perto); vidro transparente que sai em pedaços vira a silhueta do frasco (envoltória convexa dos pedaços). As fotos do catálogo de referência também passam pelo recorte. Cache v=5.

## 18. Direção visual: personalidade sem perder a identidade (out/2026)

Briefing do Willian: o desktop estava linear demais (preto + prata + cinza + dourado em tudo). Lapidar, não reconstruir.

- **Letras:** ficam como estavam (Montserrat nos títulos, Instrument Sans no texto, JetBrains Mono nas etiquetas). Cormorant, Playfair e a troca da mono foram testadas e recusadas pelo Willian.
- **Três raios:** `--r-ed` 18px (contêiner editorial), `--r-ctl` 12px (controles), cápsula só com função (etiquetas pequenas, botões redondos). Os `Des*.tsx` usam os tokens (troca automática feita com regra: contêiner 20–32px → `--r-ed`; botão-cápsula de 30–60px de altura → `--r-ctl`).
- **Botão metálico** só na ação principal da tela (Explorar coleção, Perguntar ao Sommelier, Adicionar perfume, Salvar, enviar no Sommelier). Secundários: contorno.
- **Territórios olfativos** (`src/lib/territorio.ts`): a família/acordes do perfume definem `--terr-a`, `--terr-b`, `--terr-glow`. Aparecem só como atmosfera: luz ambiente, brilho, barras, bordas especiais, DNA. Nunca card pintado.
- **Semelhantes** continuam fora da ficha (decisão anterior mantida).
- **Ficha (desktop):** território na luz do topo, no DNA (contorno e preenchimento), nos medidores e no acorde principal; linha cartográfica sob o nome (entrada · ano · cidade · coordenadas, `coordenadas()` em `src/data/casas.ts`); DNA rotulado como assinatura ("DNA OLFATIVO · território"); ordem: identidade → impressão (acordes + desempenho) → pirâmide em prancha (largura total, sem caixa) → comunidade (quando funciona + votos) → Sommelier. As colunas de semelhantes saíram também do desktop; o quadro "Inspirados" virou "Origem".
- **Início:** vitrine com a luz do território do destaque e as coordenadas da casa na linha da entrada; perfume do dia com brilho do território; números da coleção como índice de arquivo (algarismos grandes, sem cartões); rosa-dos-ventos discreta (7% de opacidade) atrás do título, fora da vitrine.
- **Clima por tela:** Coleção (arquivo) com palcos e grupos na cor do território e filtros selecionados escuros; DNA (laboratório) com papel milimetrado; Descobrir (cartografia) com latitude/longitude tracejadas; Sommelier (conversa) com luz baixa e quente; Comparar (técnico) com quadriculado.
- **Voltar:** botão redondo à esquerda do logo no cabeçalho do computador, em todas as páginas menos o Início (no celular cada tela já tem o seu).
- **Dourado igual ao do celular no computador:** o acento (`t.amber`) e o texto de título (`t.amberTxt`) das pranchas deixaram o prata e usam o dourado do app (#D8B970 / #E0C78C), em `src/desenho/h2.ts` e nos clientes de cadastro e Sommelier; item ativo do menu em dourado (sem o metálico); cartões de destaque com `--ouro-linha`.
- **Histórico pessoal na ficha:** vezes usado, último uso, régua dos últimos 90 dias, entrada, tempo na coleção, situação, nota e ajuste "em você"; rótulo vertical. Os dias de uso vêm da tabela `usos`, já carregada (`Entrada.usos`).
- **DNA como assinatura:** `dnaMini()` (`src/lib/dna-mini.ts`) nos cards da coleção, nas sugestões do Sommelier e sobreposto na Comparação; na ficha o radar "respira" (7s, desligado com prefers-reduced-motion) e aparece grande, cortado e apagado atrás da pirâmide.
- **Quebra de ritmo:** frasco do perfume do dia sai por cima do quadro; rótulo vertical no histórico.
- **Comparar no computador:** laudo técnico próprio (dois lados com foto, DNAs sobrepostos, % de semelhança, tabela, acordes em barras espelhadas, notas só em um / em comum / só no outro). O celular segue igual.
- **Cantos no celular:** cartões em `--r-ed`, botões e campos em `--r-ctl` (inclusive o `Btn` do kit); botões redondos, etiquetas, barra de abas e folha de baixo ficam como estavam.
- Ordem combinada: base do sistema → ficha → Início → demais telas, cada fase publicada e aprovada antes da próxima.

## 19. Avisos e lançamentos

- **Aviso diário** (`/api/avisos`, todo dia 07h30 de Campo Grande pela Vercel): perfume do dia, esquecidos e lançamentos acima do limite de afinidade. O texto do perfume do dia usa dado real (ajuste "em você" ou média da comunidade); a frase "nas reviews de dias parecidos" era inventada e saiu. "Árabe" nos tipos de alerta usa a lista de `src/data/casas.ts`.
- **Lançamentos** (decisão do Willian): busca semanal com IA (`/api/lancamentos/buscar`, segunda 08h00), uma chamada por casa (até 3 buscas cada, abrindo primeiro a página da casa no Fragrantica e depois notícias do mês), 12 casas em paralelo (coleção primeiro, depois árabes grandes), últimos 3 meses, ~US$ 0,15–0,30/semana. Antes era uma chamada só com 4 buscas para todas as casas e os lançamentos do mês escapavam (ex.: Rayhaan). Cada achado vira perfume + linha em `lancamentos`; o aviso diário decide o que notifica pela afinidade. Em Ajustes dá para buscar na hora (pago).
- Sem lançamento real no banco, a tela mostra o aviso de vazio. Antes ela caía nos lançamentos do catálogo de exemplo, que não eram reais.
- **Teste:** "Enviar aviso de teste" em Ajustes (`/api/avisos/teste`) manda na hora para os aparelhos inscritos de quem está logado.

## 20. Descobrir vivo (out/2026)

- **Escola do nariz** (decisão do Willian): uma lição nova por semana, escrita pela IA a partir dos frascos que ele tem (e dos que teve), sem pesquisa na web (centavos por semana). Cada lição traz o conceito, um exercício prático com 2 ou 3 frascos dele e o botão "Marcar como feita"; o progresso é real. As lições ficam em `configuracoes.escola` (rodar `supabase/migrations/0004_escola.sql`). A lição é gerada depois que a página abre (`after`) e aparece na visita seguinte. Sem a coluna, a página mostra as lições fixas de exemplo e avisa.
- **Linha do tempo**: entram os perfumes que ele teve, esmaecidos (ponto vazado), com legenda tenho/tive. O texto "coleção recente/clássica" conta só os atuais.
- **Enciclopédia**: a nota em destaque gira por dia entre as notas da coleção e dos que ele teve; "para conhecer" gira por dia e nunca mostra o que ele tem ou teve. O mapa das casas também conta os que ele teve.

## 21. Vitrine do Início: um destaque que muda a cada visita (out/2026)

- O destaque do topo deixou de ser sempre a assinatura (decisão do Willian). A cada vez que o Início abre, sorteia um só: primeiro o tipo (frasco dele, lançamento ou recomendação), depois o perfume dentro dele. Frascos dele: todos com foto; lançamentos: os 4 de maior afinidade; recomendações: os 8 de maior afinidade com o DNA que ele não tem nem teve. Selo NA COLEÇÃO, NOVIDADE ou PARA VOCÊ. Carrossel passando sozinho foi testado e recusado.

## 22. Adicionar sem pesquisa e ficha editável (out/2026)

- **Adicionar sem pesquisa** (pedido do Willian): botão "+ Não achou? Adicionar sem pesquisa" sempre visível no cadastro (computador e celular). Abre a ficha em branco com o nome digitado, sem IA e sem custo; nome e casa são obrigatórios. Depois de salvar, abre o Editar para completar pirâmide, acordes e quando usar.
- **Acordes no Editar**: incluir, tirar e dar força (5 níveis, 20 a 100). O mais forte vira o acorde principal. Ficha sem acordes mostra no glifo "Sem acordes nesta ficha · Marcar em Editar" em vez de um desenho zerado.
- **Quando usar no Editar**: primavera, verão, outono, inverno, dia e noite em 5 níveis. Alimenta a seção "Quando funciona" e a sugestão do dia pelo clima. Ficha feita à mão começa com tudo vazio (nada inventado).

## 23. O que o acervo não trouxe, a IA completa (out/2026)

- Pedido do Willian: sempre que a ficha vier do acervo com campos vazios, a IA completa. Antes ela só cuidava de ano, concentração, gênero, descrição, "quando usar" e votos; agora cobre também país, perfumistas, camadas vazias da pirâmide, acordes que faltam (ou a força real da barra, já que o lote só traz a ordem) e o link do Fragrantica (que dá a foto).
- Nunca troca o que já estava preenchido. Uma chamada por perfume: modelo leve com até 2 buscas; quando falta pirâmide ou acordes, o modelo da ficha com até 3 buscas. Falha fica registrada no log (`[atlas:completar_acervo]`).
- No cadastro roda em segundo plano, como antes, e o que chega entra na ficha (e na já salva, via `/api/ficha/anexar`).
- Fichas do acervo já salvas com buracos: ao abrir a ficha, a IA completa depois da página (`after`), uma vez só (marca `votos.completadoEm`), e o resultado também vai para o acervo. Aparece na próxima visita.
