-- Parfum Atlas · esquema inicial
-- Rode no Supabase: SQL Editor > New query > colar tudo > Run.

create extension if not exists pg_trgm;

-- Ficha geral de cada perfume (vem da IA e das fontes). Compartilhada entre consultas,
-- funciona como cache: o mesmo perfume não é pesquisado duas vezes.
create table if not exists perfumes (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  casa          text not null,
  ano           int,
  concentracao  text,
  perfumistas   text[] default '{}',
  familia       text,                 -- ex.: Chipre frutado
  acorde        text,                 -- acorde dominante: Frutado, Amadeirado...
  genero        text,                 -- Masculino, Feminino, Unissex
  pais          text,
  descricao     text,
  notas_saida   text[] default '{}',
  notas_coracao text[] default '{}',
  notas_fundo   text[] default '{}',
  acordes       jsonb default '[]',   -- [{nome, valor 0-100}]
  fixacao_h     numeric,              -- média ponderada em horas
  projecao_m    numeric,              -- alcance médio em metros
  votos         jsonb default '{}',   -- fixação, projeção, estações, dia/noite, ocasiões
  clima         jsonb default '{}',   -- fixação por temperatura (reviews)
  inspirado_em  uuid references perfumes(id),
  imagem_url    text,                 -- foto oficial do frasco
  fontes        jsonb default '[]',   -- [{nome, url, o_que}]
  campos_revisar text[] default '{}', -- campos com baixa confiança
  criado_em     timestamptz default now(),
  atualizado_em timestamptz default now(),
  unique (casa, nome, concentracao)
);
create index if not exists perfumes_busca on perfumes using gin ((nome || ' ' || casa) gin_trgm_ops);

-- Os seus frascos.
create table if not exists colecao (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  perfume_id   uuid not null references perfumes(id),
  numero       int,                   -- entrada nº 001, 002...
  situacao     text not null default 'tenho' check (situacao in ('tenho','tive','quero','assinatura')),
  foto_url     text,                  -- foto do seu frasco (Storage)
  anotacao     text,
  minha_fixacao int check (minha_fixacao between 1 and 5),
  minha_projecao int check (minha_projecao between 1 and 5),
  minha_nota   int check (minha_nota between 1 and 5),
  adicionado_em timestamptz default now(),
  unique (user_id, perfume_id)
);

-- Só o "Usar hoje". Alimenta esquecidos e o perfume do dia.
create table if not exists usos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  colecao_id uuid not null references colecao(id) on delete cascade,
  dia        date not null default current_date,
  unique (colecao_id, dia)
);

-- Lançamentos acompanhados.
create table if not exists lancamentos (
  id          uuid primary key default gen_random_uuid(),
  perfume_id  uuid not null references perfumes(id),
  tipo        text,                   -- flanker, versão nova, inspirado, parecido
  lancado_em  date,
  encontrado_em timestamptz default now(),
  unique (perfume_id)
);

-- Sommelier.
create table if not exists conversas (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  titulo    text,
  criada_em timestamptz default now()
);
create table if not exists mensagens (
  id          uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references conversas(id) on delete cascade,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  papel       text not null check (papel in ('eu','sommelier')),
  conteudo    jsonb not null,         -- texto e, quando houver, sugestões estruturadas
  criada_em   timestamptz default now()
);

-- Configurações (uma linha por usuário).
create table if not exists configuracoes (
  user_id        uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  nome           text default 'Willian Lange Gomes',
  cidade         text default 'Campo Grande',
  latitude       numeric default -20.4697,
  longitude      numeric default -54.6201,
  usar_localizacao boolean default true,
  alerta_afinidade int default 80,
  alerta_tipos   text[] default '{casas,nicho,arabe}',
  notif_lancamentos boolean default true,
  notif_dia      boolean default true,
  notif_dia_hora time default '07:30',
  notif_esquecidos boolean default false,
  voz_respostas  boolean default true,
  alexa_ligada   boolean default false,
  avisos_enviados jsonb default '{}'::jsonb
);

-- Inscrições de notificação no celular (um registro por aparelho).
create table if not exists inscricoes_push (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint   text not null unique,
  chaves     jsonb not null,
  criada_em  timestamptz default now()
);

-- Segurança: cada um vê só o que é seu. A ficha geral (perfumes) é leitura livre para quem está logado.
alter table perfumes      enable row level security;
alter table colecao       enable row level security;
alter table usos          enable row level security;
alter table lancamentos   enable row level security;
alter table conversas     enable row level security;
alter table mensagens     enable row level security;
alter table configuracoes enable row level security;
alter table inscricoes_push enable row level security;

create policy "perfumes leitura" on perfumes for select to authenticated using (true);
create policy "perfumes escrita" on perfumes for insert to authenticated with check (true);
create policy "perfumes edicao"  on perfumes for update to authenticated using (true);
create policy "lancamentos leitura" on lancamentos for select to authenticated using (true);

create policy "colecao dono"   on colecao       for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "usos dono"      on usos          for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "conversas dono" on conversas     for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "mensagens dono" on mensagens     for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "config dono"    on configuracoes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "push dono"      on inscricoes_push for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Numeração automática das entradas (Nº 001, 002...).
create or replace function proximo_numero() returns trigger language plpgsql as $$
begin
  if new.numero is null then
    select coalesce(max(numero), 0) + 1 into new.numero from colecao where user_id = new.user_id;
  end if;
  return new;
end $$;
drop trigger if exists colecao_numero on colecao;
create trigger colecao_numero before insert on colecao for each row execute function proximo_numero();

-- Fotos dos seus frascos.
insert into storage.buckets (id, name, public) values ('frascos', 'frascos', false) on conflict do nothing;
create policy "frascos dono leitura" on storage.objects for select to authenticated using (bucket_id = 'frascos' and owner = auth.uid());
create policy "frascos dono envio"   on storage.objects for insert to authenticated with check (bucket_id = 'frascos' and owner = auth.uid());
create policy "frascos dono troca"   on storage.objects for update to authenticated using (bucket_id = 'frascos' and owner = auth.uid());
create policy "frascos dono remocao" on storage.objects for delete to authenticated using (bucket_id = 'frascos' and owner = auth.uid());
