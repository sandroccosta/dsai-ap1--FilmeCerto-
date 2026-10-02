-- Perfis dos usuários do Filme Certo.
-- Cada linha nasce junto com o usuário em auth.users, pelo trigger abaixo,
-- na mesma transação: se o perfil falhar, o cadastro inteiro falha.

create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null check (char_length(nome) between 2 and 50),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.perfis is 'Dados públicos do usuário; um por linha de auth.users.';

alter table public.perfis enable row level security;

create policy "perfis: dono lê o próprio"
  on public.perfis for select
  to authenticated
  using (id = (select auth.uid()));

create policy "perfis: dono atualiza o próprio"
  on public.perfis for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Sem políticas de insert e delete: só o trigger cria perfis e a exclusão
-- acontece em cascata quando o usuário é apagado.

create function public.criar_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (id, nome)
  values (new.id, btrim(coalesce(new.raw_user_meta_data ->> 'nome', '')));
  return new;
end;
$$;

revoke execute on function public.criar_perfil() from public, anon, authenticated;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil();

create function public.tocar_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger perfis_atualizado_em
  before update on public.perfis
  for each row execute function public.tocar_atualizado_em();
