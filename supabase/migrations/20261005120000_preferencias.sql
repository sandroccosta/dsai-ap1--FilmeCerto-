-- Preferências do onboarding. Ter uma linha aqui significa onboarding concluído.

create type public.duracao_preferida as enum ('curta', 'media', 'longa', 'indiferente');
create type public.frequencia_assistir as enum ('raramente', 'mensal', 'semanal', 'diaria');

create table public.preferencias (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  generos int[] not null
    check (cardinality(generos) between 1 and 5)
    -- Os 19 gêneros de filme do TMDB (src/features/preferencias/generos.ts).
    check (generos <@ array[
      28, 16, 12, 10770, 35, 80, 99, 18, 10751, 14, 37, 878, 10752, 36, 9648, 10402, 10749, 27, 53
    ]),
  duracao public.duracao_preferida not null,
  frequencia public.frequencia_assistir not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.preferencias is 'Gostos informados no onboarding; uma linha por usuário.';

alter table public.preferencias enable row level security;

create policy "preferencias: dono lê as próprias"
  on public.preferencias for select
  to authenticated
  using (usuario_id = (select auth.uid()));

create policy "preferencias: dono cria as próprias"
  on public.preferencias for insert
  to authenticated
  with check (usuario_id = (select auth.uid()));

create policy "preferencias: dono atualiza as próprias"
  on public.preferencias for update
  to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

create trigger preferencias_atualizado_em
  before update on public.preferencias
  for each row execute function public.tocar_atualizado_em();
