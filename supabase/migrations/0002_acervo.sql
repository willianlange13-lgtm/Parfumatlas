-- Acervo global de perfumes (docs/DECISOES.md §16). Não é de um usuário: é do app.
-- Montado pelo Willian no ChatGPT (lendo o Fragrantica) e importado em /configuracoes/acervo.
-- Rode uma vez no Supabase: SQL Editor > New query > colar > Run.
create table if not exists acervo (
  id uuid primary key default gen_random_uuid(),
  chave text not null unique,          -- nome+casa sem acento, minúsculo, só letras e números
  nome text not null,
  casa text not null,
  fragrantica text,
  notas_saida text[] not null default '{}',
  notas_coracao text[] not null default '{}',
  notas_fundo text[] not null default '{}',
  acordes text[] not null default '{}',
  fixacao_nivel text,                  -- Muito fraca | Fraca | Moderada | Longa | Eterna
  projecao_nivel text,                 -- Íntima | Moderada | Forte | Enorme
  origem text not null default 'chatgpt-import',
  atualizado_em timestamptz not null default now()
);
create index if not exists acervo_nome on acervo using gin ((nome || ' ' || casa) gin_trgm_ops);
alter table acervo enable row level security;
drop policy if exists "acervo leitura" on acervo;
create policy "acervo leitura" on acervo for select to authenticated using (true);
-- escrita só pelo servidor, com a chave de serviço (rota /api/acervo/importar)
