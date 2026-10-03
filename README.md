# Parfum Atlas

Arquivo pessoal de fragrâncias. Site no computador e app no celular (PWA), com voz e Alexa.
Next.js 16 + Supabase + Gemini por padrão, com OpenAI opcional.

## O que tem

**No celular (app)**: Início (perfume do dia pelo clima, curiosidade, semana, esquecidos, últimas entradas), Coleção (classe, marcos, busca por voz, Tenho/Tive/Quero/Assinatura, organizar), Ficha completa, Cadastro por foto, link, nome e voz (toque no + abre a câmera, segure para falar), Buscar e modo compra ("Vale a pena?"), Novidades, Sommelier (texto, foto do look e voz), Configurações, Alexa, editar e remover perfume, comparar e blind test.

**No computador (site)**: tudo isso nas telas grandes, mais DNA olfativo e Descobrir (escola, árvore, linha do tempo e mapa).

Sem banco ligado, tudo abre com a coleção de exemplo (marcada como "ilustrativo").

## Colocar no ar (uma vez)

1. **Supabase**: crie um projeto. Em *SQL Editor > New query*, cole `supabase/migrations/0001_inicial.sql` e rode.
2. Em *Authentication > URL Configuration*, coloque a URL da Vercel em *Site URL* e adicione `https://SEU-DOMINIO/auth/callback` em *Redirect URLs*.
3. Depois do seu primeiro login, desligue novos cadastros em *Authentication > Sign In / Providers > Allow new users to sign up*. O sistema é só seu.
4. **IA econômica**: crie uma chave no Google AI Studio e cadastre como `GEMINI_API_KEY`. Quando essa chave existe, o Atlas usa Gemini por padrão, mesmo que uma `OPENAI_API_KEY` também esteja cadastrada.
5. **OpenAI opcional**: mantenha `OPENAI_API_KEY` apenas como compatibilidade/fallback. Para forçar OpenAI como provedor principal, use `AI_PROVIDER=openai`. A pesquisa pesada de semelhantes só pode usar OpenAI quando `AI_PREMIUM_ENABLED=true`.
6. **Avisos**: rode `npx web-push generate-vapid-keys` e guarde as duas chaves.
7. **Vercel**: importe o repositório e cadastre as variáveis de `.env.example`. O `vercel.json` já agenda o aviso diário (7h30 em Campo Grande).
8. No celular, abra o site e use *Adicionar à tela inicial*. No iPhone, os avisos só chegam com o app instalado assim.

### Estratégia de custo da IA

O Atlas evita chamadas pagas sempre que possível:

- recomendações do Sommelier já têm fallback local por clima, ocasião, projeção e tempo sem uso;
- a busca de semelhantes primeiro tenta reaproveitar um resultado existente do mesmo DNA/original no Supabase;
- quando precisa pesquisar semelhantes, o caminho padrão usa Gemini;
- OpenAI fica reservada ao fallback de compatibilidade ou a pesquisas premium explicitamente habilitadas;
- resultados de parentesco olfativo ficam salvos no banco para reaproveitamento posterior.

## Alexa (opcional)

1. Em https://developer.amazon.com/alexa/console/ask, crie uma skill *Custom*, idioma Português (BR), hospedagem *Provision your own*.
2. Em *JSON Editor*, cole `alexa/modelo-pt-BR.json` e clique em *Build*.
3. Em *Endpoint*, escolha HTTPS e coloque `https://SEU-DOMINIO/api/alexa` (certificado: *My development endpoint is a sub-domain of a domain that has a wildcard certificate*).
4. Copie o *Skill ID* para `ALEXA_SKILL_ID` na Vercel. Em `ATLAS_USER_ID`, coloque o seu id do Supabase (*Authentication > Users*).
5. Na aba *Test*, ligue *Development*. A skill fica disponível nas Alexas da sua conta Amazon.
6. No app, em *Configurações > Alexa*, ligue a chave.

## Rodar no computador

```bash
npm install
cp .env.example .env.local   # preencha as chaves
npm run dev
```

## Estrutura

- `src/app` — rotas (site e app usam as mesmas; o CSS mostra uma ou outra versão pela largura da tela).
- `src/desenho` — telas do computador, convertidas das pranchas do desenho.
- `src/cel` — telas do app.
- `src/montar` — monta os dados de cada tela a partir do banco.
- `src/lib` — banco, clima, IA (ficha, sommelier, veredito), análises e configurações.
- `src/data` — catálogo de exemplo, notas, casas e curiosidades.
- `supabase/migrations` — banco completo.
- `alexa` — modelo de voz da skill.
