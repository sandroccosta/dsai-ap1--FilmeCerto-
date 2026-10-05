-- Listas "Quero assistir" e "Já assisti". Um filme fica em uma lista por vez.
-- Título, pôster, ano e gêneros são copiados do TMDB, para a página /listas
-- não precisar consultar a API por filme.

create type public.status_lista as enum ('quero_assistir', 'assistido');

create table public.lista_itens (
  usuario_id uuid not null references auth.users (id) on delete cascade,
  tmdb_id int not null check (tmdb_id > 0),
  status public.status_lista not null,
  titulo text not null check (char_length(titulo) between 1 and 300),
  poster_path text,
  ano smallint,
  generos int[] not null default '{}',
  adicionado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  primary key (usuario_id, tmdb_id)
);

comment on table public.lista_itens is 'Filmes nas listas de cada usuário; um status por filme.';

alter table public.lista_itens enable row level security;

create policy "lista_itens: dono lê os próprios"
  on public.lista_itens for select
  to authenticated
  using (usuario_id = (select auth.uid()));

create policy "lista_itens: dono cria os próprios"
  on public.lista_itens for insert
  to authenticated
  with check (usuario_id = (select auth.uid()));

create policy "lista_itens: dono atualiza os próprios"
  on public.lista_itens for update
  to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

create policy "lista_itens: dono apaga os próprios"
  on public.lista_itens for delete
  to authenticated
  using (usuario_id = (select auth.uid()));

create trigger lista_itens_atualizado_em
  before update on public.lista_itens
  for each row execute function public.tocar_atualizado_em();
