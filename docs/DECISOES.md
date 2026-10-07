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

- Pedido do Willian: sempre que a ficha vier do acervo com campos vazios, a IA completa. Antes ela só cuidava de ano, concentração, gênero, descrição, "quando usar" e votos; agora cobre também país, camadas vazias da pirâmide, acordes que faltam (ou a força real da barra, já que o lote só traz a ordem) e o link do Fragrantica (que dá a foto).
- Nunca troca o que já estava preenchido. Uma chamada por perfume: modelo leve com até 2 buscas; quando falta fixação/projeção, pirâmide ou acordes, o modelo da ficha com até 3 buscas. Falha fica registrada no log (`[atlas:completar_acervo]`).
- No cadastro roda em segundo plano, como antes, e o que chega entra na ficha (e na já salva, via `/api/ficha/anexar`).
- **Fixação e projeção** são o principal buraco do acervo (o lote quase nunca traz). A IA busca a contagem de votos do Fragrantica; se não vier, pelo menos o nível mais votado de cada um (o mesmo dado do lote), que vai também para o acervo. Perfumistas ficam de fora (saíram da ficha).
- Fichas do acervo já salvas com buracos: ao abrir a ficha, a IA completa depois da página (`after`), uma vez só (marca `votos.completadoEm`), e o resultado também vai para o acervo. Aparece na próxima visita.
- **Perfume novo sem votos** (ex.: lançamento do ano): o Fragrantica ainda não tem as barras. Aí a IA dá o nível pelas resenhas, marcado como **estimativa** na ficha e no cadastro; estimativa não vai para o acervo. Se a IA falhar, o cadastro avisa o motivo e a ficha salva tenta de novo na próxima abertura (só marca `completadoEm` quando a IA respondeu).
- Diagnóstico: `/api/diagnostico?completar=Nome&casa=Casa` mostra o antes e o depois da completação, o tempo e o erro (gasta uma pesquisa).
- Pedido do Willian depois do teste com o Club De Nuit Elite (2026): também "quando usar" (estações, dia e noite) é estimado pelas resenhas e notas quando o perfume ainda não tem votos, com selo "estimativa" na ficha (`votos.quandoEstimado`). A força dos acordes do acervo passa a casar pela posição quando o nome não bate (acervo e Fragrantica listam na mesma ordem); só entra se não for a escala inventada.
- **Acordes com nomes diferentes que querem dizer o mesmo** (pedido do Willian: almíscar = almiscarado, madeira = amadeirado): `chaveAcorde` em `src/lib/normalizar.ts` passa pela tradução, por uma lista de sinônimos e tira acento e terminação. É usada para casar a força dos acordes na completação e para não repetir acorde no Editar.
- Força dos acordes que vem em escada perfeita (100, 90, 80…) é descartada: é número inventado pela IA, não a barra lida. Fica a ordem do acervo.

## 24. Tudo no cadastro, sem passar pelo Editar (out/2026)

- Pedido do Willian ("senão eu tenho dois trabalhos"): acordes com força, "quando usar" (estações, dia e noite) e a sua nota agora estão no próprio cadastro, no computador e no celular. Vêm preenchidos com o que o acervo ou a IA trouxeram; o que faltar, você marca ali. Componentes em `src/cel/EditoresFicha.tsx`.
- Enquanto a IA completa em segundo plano, o que você já mexeu em acordes ou "quando usar" fica como você deixou; o resto chega da IA.
- A sua nota (1 a 5) passou a ser salva no cadastro (`/api/salvar`, `minha_nota`). Ficha feita à mão vai direto para a ficha depois de salvar.


## 25. Acervo mais completo e busca mais rápida (out/2026)

- **Planilha cruzada (Claude, 06/10/2026):** o acervo exportado (3.860 perfumes) foi cruzado com a base pública aStyxxx/dataset_Fragrantica_perfumes (GitHub; média de votos do Fragrantica, só perfumes com 50 votos ou mais). Fixação e projeção: 1.262 pelos votos reais; o resto estimado por um modelo treinado nesses votos (acordes/notas, casa e concentração; erro médio 0,25 na escala de fixação 1–5 e 0,21 na de projeção 1–4). Pirâmide que era lista solta foi distribuída pela volatilidade das notas. Entrou por SQL direto no Supabase (fora do repositório).
- **Origem dos dados** (`0005_acervo_busca.sql`): `fonte_notas` e `fonte_niveis` ("fragrantica (N votos)", "fragrantica (nível mais votado)", "pesquisa", "acervo", "estimativa (modelo)"). Nível estimado aparece na ficha como **estimativa** (`votos.estimado`) e cede lugar ao nível real quando a IA lê os votos (`mesclar` e `completarDoAcervo`). Estimativa continua sem virar "média da comunidade".
- **Completar com IA** (Configurações › Acervo): mostra a situação do acervo (com pirâmide, com fixação/projeção pelos votos, sem notas, estimados) e completa em lotes de 3 por chamada (`/api/acervo/completar`, `src/lib/acervo-completar.ts`), com botão de parar. Fila: sem nota nenhuma primeiro, depois nível vazio ou estimado; `tentado_em` manda para o fim quem já foi tentado. Usa a mesma completação da ficha (`completarDoAcervo`, até 3 buscas por perfume, pago) e grava com `guardarNoAcervo` (só preenche o vazio). Sem rotina automática: só roda quando o Willian aperta.
- **Busca:** função `buscar_acervo` no banco (coluna `busca` sem acento + índice de trigramas): palavras em qualquer ordem e tolerância a erro de digitação ("kamrah" acha o Khamrah), ~20 ms. `pontuar()` dá a mesma nota no catálogo e no acervo ("lattafa khamrah" = 92%, antes 82% e caía na IA paga). Sem a migração, volta para a busca antiga.
- **Buscar (celular e computador):** o acervo aparece ao vivo enquanto digita ("No acervo de perfumes · sem pesquisa paga", 220 ms após parar de digitar) e na aba Notas (`buscar_acervo_notas`: perfumes com todas as notas escolhidas). O catálogo também casa palavras em qualquer ordem. "Procurar na internet" (IA) fica por último. No cadastro do celular, a busca enquanto digita espera 350 ms (era 650).

## 26. Voz que funciona (out/2026)

- Problema relatado pelo Willian: o botão de voz mostrava "gravando" e nada acontecia. Causas: (1) no cadastro por voz, depois de achar o perfume, ninguém mandava montar a ficha (o botão ficava "Montando…" travado quando havia um só candidato); (2) o reconhecimento só aceitava a frase "final", que às vezes não chega (iPhone), e os erros (microfone bloqueado, nada ouvido) eram engolidos.
- `src/cel/voz.ts` (`ouvir`): texto parcial ao vivo na tela, usa o parcial se a frase final não vier, para sozinho em 12 s, tocar no microfone de novo = "terminei de falar", erros com mensagem em português. Sem reconhecimento no navegador (Firefox, app instalado no iPhone): grava até 8 s e transcreve em `/api/transcrever` (OpenAI `gpt-4o-mini-transcribe`, ou Gemini; centavos por frase).
- Cadastro por voz: achou com 85% ou mais (ou um só), monta a ficha sozinho; senão mostra as opções e o botão "É este" funciona. Buscar, Sommelier e Coleção usam o mesmo módulo.

## 27. O frasco é um rótulo; recorte só no Início (out/2026)

- Decisão do Willian depois da auditoria de design (etapa 1 do plano "a ficha é um rótulo"): o recorte automático nunca fica bom em todo frasco. Fora da aba Início, a foto oficial aparece inteira sobre papel cor de rótulo (#E8DFCF), num cartão 3:4 com cantos arredondados e fio fino na borda. O branco da foto vira o papel por multiplicação, no servidor (`rotulo()` em `src/lib/recortar.ts`, `/api/frasco?modo=rotulo`). Nada é apagado, então vidro transparente e frasco branco saem certos. Fundo cinza-claro é levado ao branco antes.
- A aba Início (computador e celular) continua com o frasco recortado, com luz e sombra (`recorte()` em `src/lib/sem-fundo.ts`, aplicado em `montarInicio`).
- `semFundo()` agora devolve o rótulo; a sua própria foto do frasco continua como está.

## 28. Atlas Vivo: nova direção visual (out/2026)

Pedido do Willian: direção nova e ousada, com personalidade e animação, sem visual quadrado. Substitui as escolhas de cor e letra da §18 (os territórios olfativos, a ordem das fases e o rótulo de papel da §27 continuam).

- **Atmosfera:** estufa à noite. Fundo verde quase preto (`#0B110F`), texto cor de osso (`#F2EEE3`), um único acento: menta (`#7FE3C4`). O musgo (`#8FB5A2`) aparece só como luz secundária e em dados. Só tema escuro: é a identidade da marca.
- **Letras:** Bricolage Grotesque nos títulos (`--marca`), Geist no texto (`--sans`), Geist Mono nas etiquetas (`--mono`), Pinyon só na assinatura. Todas via `next/font` (sem link do Google Fonts).
- **Forma:** nada quadrado. `--r-ed` 28px (24px no celular) nos contêineres, `--r-ctl` 16px em caixas pequenas, cápsula (`--r-pill`) em botões, abas, chips e campos.
- **Botão principal:** cápsula em degradê menta com brilho que atravessa no hover; secundário com contorno.
- **Topo do computador:** cápsula de vidro flutuante; o item ativo do menu é uma cápsula menta que desliza entre as páginas (view transition).
- **Celular:** doca de vidro flutuante; aba ativa com cápsula clara e ícone menta; botão + com mola.
- **Cores de dados:** cada acorde tem matiz próprio (`ACORDES` em `src/lib/cores.ts`, `EIXOS` em `src/desenho/h2.ts`); a escala prata virou escala musgo.
- **Movimento:** aurora do território derivando atrás de tudo, grão de papel fixo, blocos entrando em sequência (`surge`), título do Início palavra por palavra (`.palavras`), frasco da vitrine flutuando (`.flutua`), troca de página com `ViewTransition` em `src/app/template.tsx`. Tudo desligado com `prefers-reduced-motion`.

### §28.1 Menta e Início recomposto (out/2026)

- Willian não gostou do laranja: o acento passou a ser o menta (`#7FE3C4`, botão em degradê menta). Frutado nos dados virou coral rosado (`#F2949A`).
- Pedido: "mudou só a cor". O Início foi reescrito à mão (computador em `src/desenho/DesInicio.tsx` + `inicio.css`, celular em `src/cel/CelInicio.tsx` + `cel-inicio.css`), não é mais gerado da prancha:
  - palco em tela cheia com o perfume da vitrine: nome gigante entrando palavra por palavra, letreiro vazado do nome correndo atrás, radar do DNA girando devagar, frasco flutuando sobre a luz do território;
  - frase do dia grande ("Hoje faz 31 °C em…");
  - bento: perfume do dia com palco grande + curiosidade com a foto da nota ocupando o cartão;
  - semana com curva de temperatura que se desenha e um frasco por dia;
  - índice da coleção com algarismos enormes, sem cartões, e a assinatura;
  - prateleira de últimas entradas e contadores grandes dos esquecidos;
  - celular: saudação grande, perfume do dia com frasco grande, curiosidade com foto, números 2×2, prateleiras com rolagem lateral.
- Próximas telas seguem a mesma linguagem: Coleção, Ficha, DNA, Descobrir, Sommelier, Lançamentos.

### §28.2 Coleção recomposta (out/2026)

- Computador (`src/desenho/DesColecao.tsx` + `colecao.css`), escrita à mão e ligada ao mesmo estado do celular (`ColecaoCliente` passa `s` para os dois):
  - título "Coleção" enorme com a contagem ao lado; classe do colecionador num anel em degradê que se desenha;
  - marcos como fileira de selos (feitos em menta, faltando tracejados);
  - barra de ferramentas de vidro presa ao topo: situação, busca, agrupar e ordenar;
  - grupos com nome grande e ponto luminoso na cor do grupo; o primeiro frasco de cada grupo (com 3 ou mais) ocupa duas colunas;
  - cartões com luz do território, número da entrada, selo Inspirado/Original, estrela da assinatura e o DNA em miniatura; sobem e inclinam no hover.
- Celular (`src/cel/CelColecao.tsx` + `cel-colecao.css`): título grande com contagem, marcos em selos, grupos com nome grande, primeiro frasco do grupo em largura total.

### §28.3 Ficha recomposta (out/2026)

- `src/desenho/DesFicha.tsx` deixou de ser gerado: virou código legível, mantido à mão (`ficha.css` ao lado). Ordem e conteúdo da ficha continuam os da §18 e da §27.
- Topo: casa e cidade em menta, nome em tamanho de cartaz (150 px) entrando palavra por palavra, linha cartográfica; abaixo, rótulo do frasco flutuando com a luz do território, descrição grande, acordes, situação e ações em cápsula, e o DNA à direita.
- Celular (`cel-ficha.css`): palco do frasco maior com a luz do território, nome grande palavra por palavra.

### §28.4 Demais telas do computador (out/2026)

- DNA, Descobrir, Lançamentos e Adicionar: títulos de página em tamanho de cartaz (Bricolage, 1,6× o tamanho anterior, classe `.titulo-poster` com entrada suave) e botões em cápsula sem quebra de linha. Estrutura das telas mantida.

### §28.5 DNA recomposto (out/2026)

- `src/desenho/DesDNA.tsx` + `dna.css`, escrito à mão: título do gosto em duas linhas (a segunda em menta) entrando palavra por palavra e o radar grande respirando à direita, com os eixos na cor de cada família; três cifras como algarismos grandes sem cartões; notas que voltam como bolhas do tamanho da frequência; caráter em escalas com marcador deslizante e estações com contagem grande; gráfico do gosto em largura total; lacunas como cartões tracejados na cor do que falta.
- As cores de eixos, notas e lacunas em `src/montar/dna.ts` passaram a usar a paleta das famílias (`FAMCOR` / `corDoAcorde`).
- No celular o DNA continua sendo um aviso para abrir no computador (os gráficos precisam de espaço).

### §28.6 Descobrir recomposto (out/2026)

- `src/desenho/DesDescobrir.tsx` virou código legível, mantido à mão (`descobrir.css`). Topo com título de cartaz em duas linhas ("Aprender com / a própria coleção.", a segunda em menta) e dois números grandes (progresso da escola, notas da coleção); títulos de seção grandes; linha do tempo e mapa das casas saem da caixa e ocupam a largura como pranchas abertas. No celular continua o aviso para abrir no computador.

### §28.7 Sommelier recomposto (out/2026)

- Computador (`src/desenho/DesSommelier.tsx` legível + `sommelier.css`): a bússola virou uma esfera menta que respira e emite uma onda; título "Sommelier" grande; coluna da conversa com luz menta no topo e cantos de 40 px; campo de mensagem em cápsula de vidro presa ao rodapé da conversa.
- Celular (`cel-sommelier.css`): abertura com a esfera e "O que vamos usar hoje?" em tamanho de cartaz; campo em cápsula de vidro.

### §28.8 Lançamentos recompostos (out/2026)

- Computador (`src/desenho/DesLancamentos.tsx` legível + `lancamentos.css`): número de novidades em contorno menta gigante ao lado da frase em tamanho de cartaz; destaque em palco com luz menta, frasco flutuando, nome grande e anel de afinidade que se desenha; cartões com nome e porcentagem grandes, sobem no hover.
- Celular (`CelNovidades`): mesmo número em contorno ao lado da frase, nome do destaque e porcentagens maiores.

## 29. Segurança das rotas públicas (out/2026)

- `/api/avisos` e o GET de `/api/lancamentos/buscar` exigem sempre o `CRON_SECRET` (antes, sem a variável na Vercel, a rota ficava aberta e usava a chave de serviço). A Vercel manda o segredo sozinha no agendador quando `CRON_SECRET` está configurado.
- `/api/alexa` confere a assinatura de cada pedido (`src/lib/alexa-assinatura.ts`): URL da cadeia em s3.amazonaws.com/echo.api, certificado válido para echo-api.amazon.com, cadeia até uma raiz confiável e assinatura `Signature-256` (ou `Signature`) sobre o corpo exato. O ID da skill sozinho não é segredo.
