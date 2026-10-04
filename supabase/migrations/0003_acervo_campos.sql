-- Acervo: concentração, ano e gênero vindos do lote do ChatGPT (docs/DECISOES.md §16).
-- Rode uma vez no Supabase: SQL Editor > New query > colar > Run.
alter table acervo add column if not exists concentracao text;
alter table acervo add column if not exists ano int;
alter table acervo add column if not exists genero text;
