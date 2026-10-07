-- Acervo: busca rápida e tolerante a erro de digitação, origem dos dados e fila de completar (docs/DECISOES.md §25).
-- Rode uma vez no Supabase: SQL Editor > New query > colar > Run. Pode rodar de novo sem problema.
create extension if not exists pg_trgm;

-- de onde vieram as notas e os níveis ("fragrantica", "acervo", "pesquisa", "estimativa (modelo)")
alter table acervo add column if not exists fonte_notas text;
alter table acervo add column if not exists fonte_niveis text;
-- última vez que a IA tentou completar este perfume (fila do "Completar com IA")
alter table acervo add column if not exists tentado_em timestamptz;

-- texto de busca sem acento e em minúsculas (nome + casa)
create or replace function atlas_sem_acento(t text) returns text language sql immutable parallel safe as $$
  select translate(lower(coalesce(t, '')),
    'áàâãäåéèêëíìîïóòôõöúùûüçñý''’`´-.,&/()',
    'aaaaaaeeeeiiiiooooouuuucny           ')
$$;
alter table acervo add column if not exists busca text generated always as (atlas_sem_acento(nome || ' ' || casa)) stored;
create index if not exists acervo_busca_trgm on acervo using gin (busca gin_trgm_ops);
create index if not exists acervo_notas on acervo using gin ((notas_saida || notas_coracao || notas_fundo));

-- busca por nome/casa: todas as palavras em qualquer ordem primeiro; depois parecidos (erro de digitação)
create or replace function buscar_acervo(q text, lim int default 8)
returns setof acervo language sql stable as $$
  with t as (select regexp_replace(trim(atlas_sem_acento(q)), '\s+', ' ', 'g') as q),
  p as (select array_remove(string_to_array(t.q, ' '), '') as pal, t.q from t)
  select a.* from acervo a, p
  where length(p.q) >= 2 and (a.busca like '%' || p.q || '%' or word_similarity(p.q, a.busca) >= 0.45
         or not exists (select 1 from unnest(p.pal) w where a.busca not like '%' || w || '%'))
  order by
    (a.busca like p.q || '%') desc,
    (not exists (select 1 from unnest(p.pal) w where a.busca not like '%' || w || '%')) desc,
    word_similarity(p.q, a.busca) desc,
    length(a.nome)
  limit greatest(1, least(lim, 30));
$$;

-- busca por notas: perfumes do acervo que têm todas as notas pedidas
create or replace function buscar_acervo_notas(notas text[], lim int default 12)
returns setof acervo language sql stable as $$
  select a.* from acervo a
  where (a.notas_saida || a.notas_coracao || a.notas_fundo) @> notas
  order by cardinality(a.notas_saida || a.notas_coracao || a.notas_fundo) asc
  limit greatest(1, least(lim, 40));
$$;

grant execute on function buscar_acervo(text, int) to authenticated;
grant execute on function buscar_acervo_notas(text[], int) to authenticated;
