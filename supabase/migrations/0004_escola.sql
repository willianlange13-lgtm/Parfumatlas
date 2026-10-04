-- Escola do nariz: lições semanais geradas pela IA a partir da coleção (docs/DECISOES.md §20).
-- Guarda a lista de lições do usuário, com a semana e se ele marcou como feita.
alter table configuracoes add column if not exists escola jsonb default '[]'::jsonb;
