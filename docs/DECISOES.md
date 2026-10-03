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
- família do Atlas deve ser uma das 8 categorias aprovadas: Floral, Cítrica, Amadeirada, Oriental, Aromática, Frutal, Gourmand ou Chipre.

Não regredir essas regras ao trocar de fornecedor.

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
- página de resultado ignora pedidos de pré-carregamento.

Não remover essa proteção sem entender o impacto de custo.

## 6. Limites de pesquisa

Foram adotados limites para reduzir custo e latência, por exemplo:

- busca por nome: poucas buscas;
- ficha: limite controlado de buscas;
- complemento de votos: limite controlado de buscas.

A pesquisa web deve ter teto quando o provedor permitir.

## 7. Semelhantes

A seção de semelhantes foi retirada da ficha pelo Willian e atualmente não deve ser tratada como fluxo principal do produto.

Histórico importante dos testes:

- modelos nano e mini produziram relações erradas em testes;
- o modelo completo teve melhor desempenho para a lista especializada;
- o parentesco olfativo manda na ordenação; casa e reconhecimento na comunidade entram apenas como desempate;
- lista deve ter 7 referências principais, com no máximo 2 itens `fora do radar`;
- o perfume original nunca deve desaparecer da estrutura quando a relação de inspiração já é conhecida;
- fotos derivadas de URLs inventadas podem mostrar o frasco errado; quando essa seção voltar, a conferência da foto deve ser preservada ou substituída por mecanismo equivalente.

Se a pesquisa premium de semelhantes voltar a ser ativada, não assumir que `gpt-5-mini` substitui o modelo que passou nos testes. Revalidar qualidade.

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
- quando possível, quantidade de chamadas de ferramenta.

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

Regra operacional acordada em 03/10/2026:

- apenas uma pessoa/IA implementa por vez;
- a outra revisa;
- mudanças estruturais entram por branch e PR;
- não fazer nova troca de provedor diretamente na `main` sem teste funcional.

## 15. Estado de contingência

Enquanto a nova arquitetura por tarefa não estiver validada, a configuração segura para manter o cadastro no caminho já aprovado é:

`AI_PROVIDER=openai`

Isso é uma medida de estabilidade, não a arquitetura final desejada.
