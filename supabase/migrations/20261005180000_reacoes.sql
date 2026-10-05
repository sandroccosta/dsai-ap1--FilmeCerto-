-- Reações aos filmes ("Não é pra mim", "Gostei", "Amei"): sinal de gosto para o motor.
-- Título e gêneros são copiados do TMDB no momento da reação, para o motor não precisar
-- consultar a API por filme.

create type public.reacao_filme as enum ('nao-gostei', 'gostei', 'amei');

create table public.reacoes (
  usuario_id uuid not null references auth.users (id) on delete cascade,
  tmdb_id int not null check (tmdb_id > 0),
  reacao public.reacao_filme not null,
  titulo text not null check (char_length(titulo) between 1 and 300),
  generos int[] not null default '{}',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  primary key (usuario_id, tmdb_id)
);

comment on table public.reacoes is 'Reação de cada usuário a cada filme; uma por par usuário/filme.';

alter table public.reacoes enable row level security;

create policy "reacoes: dono lê as próprias"
  on public.reacoes for select
  to authenticated
  using (usuario_id = (select auth.uid()));

create policy "reacoes: dono cria as próprias"
  on public.reacoes for insert
  to authenticated
  with check (usuario_id = (select auth.uid()));

create policy "reacoes: dono atualiza as próprias"
  on public.reacoes for update
  to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

create policy "reacoes: dono apaga as próprias"
  on public.reacoes for delete
  to authenticated
  using (usuario_id = (select auth.uid()));

create trigger reacoes_atualizado_em
  before update on public.reacoes
  for each row execute function public.tocar_atualizado_em();
